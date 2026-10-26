import { useEffect, useRef, useState } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { prepararResolucionAsistida, resultadoConstante } from "@/servicios/rasgos/resolucionAsistidaRasgos";
import { resolverFormulaDinamica } from "@/servicios/rasgos/evaluadorExpresionesRasgos";
import { solicitarResultadoTirada } from "@/utiles/lanzadorDados";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { obtenerModificadoresConjuroRasgos } from "@/servicios/rasgos/modificadoresConjuroRasgos";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";
import { logger } from "@/utiles/logger";
import { SelectorDesplegable } from "@/componentes/comunes";
import { Sparkles, X, Zap, Shield, Dices, CheckCircle2, User, AlertCircle } from "lucide-react";
import { TarjetaToggle, TarjetaStat, IconoCabeceraRasgo, IconoOpcionResolucion, TarjetaResultadoResolucion, AvisoDirectivaMesa } from "./TarjetaResolucionAsistida";
import { separarTituloRasgo, formatearHabilidad, resolverColorOpcion } from "./utilidadesRasgosResolucion";
import modal from "./DialogoRasgo.module.css";
import estilos from "./ResolucionAsistidaRasgo.module.css";
import { CamposResolucionAdicionales } from "./CamposResolucionAdicionales";

import { operacionesMagicasEnCurso as enCurso } from "@/servicios/rasgos/bloqueoOperacionesMagicas";

export function ResolucionAsistidaRasgo({ personaje, rasgo }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [mostrar, abrir] = useState(false);
  const [opcion, elegir] = useState("");
  const [incluirDados, cambiarDados] = useState(false);
  const [propio, cambiarPropio] = useState(false);
  const [confirmado, confirmar] = useState(false);
  const [cantidadPropia, cambiarCantidad] = useState(0);
  const [tiradaOriginal, cambiarTirada] = useState(0);
  const [ocupado, ocupar] = useState(false);
  const [mensaje, informar] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (mostrar) dialogo.current?.showModal();
  }, [mostrar]);

  const cfg = rasgo.resolucionAsistida;
  if (!cfg) return null;

  const solicitud = {
    idRasgo: rasgo.id,
    idOpcion: opcion || (cfg.opciones.length === 1 ? cfg.opciones[0].id : ""),
    incluirDados,
    propio,
    confirmado, cantidadPropia, tiradaOriginal
  };

  const preparada = prepararResolucionAsistida(personaje, solicitud);
  const stats = calcularEstadisticasPersonaje(personaje);
  const cd = rasgo.salvacionObjetivo
    ? 8 + stats.bonoCompetencia + stats.modificadores[rasgo.salvacionObjetivo.aptitud]
      + obtenerModificadoresConjuroRasgos(personaje, rasgo.claseConjurosOtorgados).bonoCD
    : undefined;

  const recurso = rasgo.gastarDePadre ? resolverRasgoRecurso(rasgo, personaje.rasgos) : rasgo;
  const usosRestantes = recurso?.usosRestantes ?? recurso?.usosMaximos ?? 0;
  const usosMaximos = recurso?.usosMaximos ?? 0;
  const coste = rasgo.gastarDePadre || rasgo.tieneUsosLimitados ? rasgo.costeFijo ?? 1 : 0;
  const { categoria, titulo } = separarTituloRasgo(rasgo.nombre);
  const formulaEvaluada = rasgo.formulaDados
    ? resolverFormulaDinamica(rasgo.formulaDados, personaje, rasgo.fuente, rasgo)
    : undefined;

  const resolver = async () => {
    if (enCurso.has(personaje.id)) return;
    const vigente = usarAlmacenDM.getState().personajes.find(p => p.id === personaje.id);
    const actual = vigente && prepararResolucionAsistida(vigente, solicitud);
    if (!actual) return;

    enCurso.add(personaje.id);
    ocupar(true);
    informar("");

    try {
      let resultado: number | undefined;
      if (actual.formula) {
        resultado = resultadoConstante(actual.formula);
        if (resultado === undefined) {
          const tirada = await solicitarResultadoTirada({
            etiqueta: rasgo.nombre,
            mostrarResultadoEnChat: true,
            grupos: [{ nombre: `${actual.opcion.tipo === "dano" ? `Daño ${actual.opcion.tipoDano ?? ""} · ` : ""}${rasgo.nombre} · ${actual.opcion.etiqueta}`, formula: actual.formula }]
          });
          resultado = tirada.totales[0];
          if (!Number.isFinite(resultado)) throw new Error("No se obtuvo un resultado válido. El uso sigue disponible.");
        }
      }

      if (!usarAlmacenDM.getState().operarRecursoRasgoPersonaje(personaje.id, { tipo: "resolverAsistida", solicitud, resultado }))
        throw new Error("La capacidad o sus recursos cambiaron durante la resolución.");

      const texto = `${actual.opcion.etiqueta}${resultado === undefined ? "" : `: ${resultado}${actual.opcion.tipoDano ? ` de daño ${actual.opcion.tipoDano.toLowerCase()}` : ""}`}${actual.opcion.salvacion ? ` · Salvación de ${actual.opcion.salvacion}, CD ${cd}${actual.opcion.tipo === "dano" && resultado !== undefined ? ` · Mitad: ${Math.floor(resultado / 2)}` : ""}` : ""}. ${propio ? actual.opcion.tipo === "curacion" ? "PG propios actualizados." : "PG temporales propios actualizados." : "Aplicación al destinatario manual; consulta alcance, condiciones y duración en el rasgo."}`;
      informar(`${texto}${actual.opcion.tipo === "modificador_tirada" ? ` Total corregido: ${tiradaOriginal + (resultado ?? 0)}.` : ""}${cfg.reparto ? ` Resto para reparto manual: ${(resultado ?? 0) - (propio ? cantidadPropia : 0)} PG.` : ""}`);
      usarAlmacenDM.getState().agregarNotificacion(`${rasgo.nombre}: resolución completada.`, "info");
      abrir(false);
    } catch (error) {
      logger.error("[ResolucionAsistidaRasgo] No se pudo resolver el rasgo:", error);
      informar(error instanceof Error ? error.message : "No se pudo resolver el rasgo.");
    } finally {
      enCurso.delete(personaje.id);
      ocupar(false);
    }
  };

  return (
    <section className={estilos.seccionRitual} aria-label={`Resolución de ${rasgo.nombre}`}>
      <button
        type="button"
        className={estilos.botonResolver}
        aria-label={`Resolver ${rasgo.nombre}`}
        onClick={() => {
          informar("");
          confirmar(false);
          abrir(true);
        }}
      >
        <span className={estilos.contenidoBotonResolver}>
          <Sparkles size={13} className={estilos.iconoBotonResolver} />
          <span>Resolver capacidad</span>
        </span>
        {coste > 0 && (
          <span className={estilos.badgeCosteBoton}>
            {coste} {coste === 1 ? "uso" : "usos"}
          </span>
        )}
      </button>

      {!mostrar && mensaje && (
        <TarjetaResultadoResolucion mensaje={mensaje} alDescartar={() => informar("")} />
      )}

      {mostrar && (
        <dialog
          ref={dialogo}
          className={modal.dialogo}
          aria-label={`Resolver: ${rasgo.nombre}`}
          onClick={e => e.stopPropagation()}
          onCancel={e => {
            if (ocupado) e.preventDefault();
            else abrir(false);
          }}
        >
          <header className={modal.cabecera}>
            <div className={estilos.iconoCabecera}>
              <IconoCabeceraRasgo nombre={rasgo.nombre} />
            </div>
            <div className={estilos.cabeceraTitulo}>
              <span className={estilos.subtituloRasgo}>{categoria}</span>
              <h3 className={estilos.tituloPrincipal}>{titulo}</h3>
            </div>
            <button
              type="button"
              className={modal.cerrar}
              aria-label="Cerrar resolución"
              title="Cerrar resolución"
              disabled={ocupado}
              onClick={() => abrir(false)}
            >
              <X size={18} />
            </button>
          </header>

          <div className={`u-scroll-cef ${modal.cuerpo} ${estilos.cuerpoResolucion}`}>
            <div className={estilos.franjaRecurso}>
              <span className={estilos.insigniaAccion}>
                <Zap size={11} />
                <span>{rasgo.tipoAccion ?? "Acción"}</span>
              </span>
              <span className={estilos.estadoRecurso}>
                {coste > 0 && recurso ? (
                  <>Coste: <strong>{coste} {coste === 1 ? "uso" : "usos"}</strong> · Restantes: <strong>{usosRestantes} / {usosMaximos}</strong></>
                ) : (
                  <>Sin coste de usos</>
                )}
              </span>
            </div>

            <div className={estilos.bloqueSelector}>
              <div className={estilos.etiquetaCampo}>
                <span>Resultado del rasgo</span>
                <span>{cfg.opciones.length} {cfg.opciones.length === 1 ? "opción" : "opciones"}</span>
              </div>
              <SelectorDesplegable
                titulo="Resultado del rasgo"
                placeholder="Elige el resultado"
                valor={solicitud.idOpcion}
                disabled={ocupado}
                opciones={cfg.opciones.map(o => ({
                  valor: o.id,
                  etiqueta: o.etiqueta,
                  icono: <IconoOpcionResolucion opcion={o} />,
                  color: resolverColorOpcion(o)
                }))}
                alCambiar={id => { elegir(id); cambiarPropio(false); }}
                enFlujo
              />
            </div>

            <div className={estilos.seccionToggles}>
              {cfg.dadosOpcionales && (formulaEvaluada ?? rasgo.formulaDados) && (
                <TarjetaToggle
                  activo={incluirDados}
                  disabled={ocupado}
                  alCambiar={cambiarDados}
                  icono={<Dices size={16} />}
                  titulo={<>Incluir daño opcional ({formulaEvaluada ?? rasgo.formulaDados})</>}
                  descripcion="Añade la tirada de daño al efecto de la resolución."
                />
              )}

              {cfg.confirmacion && (
                <TarjetaToggle
                  activo={confirmado}
                  disabled={ocupado}
                  alCambiar={confirmar}
                  icono={<CheckCircle2 size={16} />}
                  titulo="Condición de activación requerida"
                  descripcion={cfg.confirmacion}
                  esAlerta
                />
              )}

              {cfg.permitePropio && ["curacion", "hp_temporal"].includes(cfg.opciones.find(o => o.id === solicitud.idOpcion)?.tipo ?? "") && (
                <TarjetaToggle
                  activo={propio}
                  disabled={ocupado}
                  alCambiar={cambiarPropio}
                  icono={<User size={16} />}
                  titulo="Aplicar a mi personaje"
                  descripcion="Aplica el resultado propio a tu ficha respetando sus límites."
                />
              )}
            </div>

            <CamposResolucionAdicionales rasgo={rasgo} idOpcion={solicitud.idOpcion} propio={propio} cantidad={cantidadPropia} tirada={tiradaOriginal} cambiarCantidad={cambiarCantidad} cambiarTirada={cambiarTirada} />
            {(preparada?.opcion.salvacion || preparada?.formula) && (
              <div className={estilos.rejillaEstadisticas}>
                {preparada?.opcion.salvacion && (
                  <TarjetaStat
                    icono={<Shield size={13} />}
                    etiqueta="Salvación objetivo"
                    valor={`CD ${cd ?? "—"}`}
                    detalle={`Salvación de ${formatearHabilidad(preparada.opcion.salvacion)}`}
                    tipo="dificultad"
                  />
                )}
                {preparada?.formula && (
                  <TarjetaStat
                    icono={<Dices size={13} />}
                    etiqueta={preparada.opcion.tipo === "hp_temporal" ? "PG temporales" : "Tirada de efecto"}
                    valor={preparada.formula}
                    detalle={preparada.opcion.tipoDano
                      ? `Daño ${preparada.opcion.tipoDano.toLowerCase()}`
                      : (preparada.opcion.tipo === "hp_temporal" ? "Vitalidad concedida" : "Fórmula del rasgo")}
                    tipo="formula"
                  />
                )}
              </div>
            )}

            <AvisoDirectivaMesa texto="Resuelve manualmente el alcance, los destinatarios y las condiciones indicadas en el rasgo." />

            {mensaje && (
              <div
                className={`${estilos.alertaMensaje} ${mensaje.toLowerCase().includes("error") || mensaje.toLowerCase().includes("no se pudo") ? estilos.alertaError : estilos.alertaInfo}`}
                role="alert"
              >
                <AlertCircle size={15} />
                <span>{mensaje}</span>
              </div>
            )}
          </div>

          <footer className={modal.acciones}>
            <button
              type="button"
              className={estilos.botonCancelar}
              disabled={ocupado}
              onClick={() => abrir(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`${modal.principal} ${estilos.botonConfirmar}`}
              disabled={ocupado || !preparada}
              onClick={() => void resolver()}
            >
              {ocupado ? "Resolviendo…" : "Confirmar resolución"}
            </button>
          </footer>
        </dialog>
      )}
    </section>
  );
}
