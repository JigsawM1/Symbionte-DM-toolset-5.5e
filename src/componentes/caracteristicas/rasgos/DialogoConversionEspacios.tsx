import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { X, Sparkles, RefreshCw, AlertCircle, Clock, Check, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarSistemaMagia } from "@/almacen/selectores/usarEstadoConfiguracion";
import { obtenerNivelEfectivoParaRasgo } from "@/servicios/clases/catalogoClases";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";
import { obtenerEspaciosElegibles } from "@/servicios/consumidorRecursosConjuros";
import { calcularCostePuntosRecuperacion } from "@/servicios/rasgos/conversionRecursosRasgos";
import { disponibleEnTurnoPropio, identificarTurnoPropio } from "@/servicios/rasgos/limitesTurnoRasgos";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes/personajeConstantes";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
import { HudRecursosConversion } from "./HudRecursosConversion";
import { TarjetaFlujoConversion } from "./TarjetaFlujoConversion";
import { TarjetaConfirmacionTurno } from "./TarjetaConfirmacionTurno";
import estilos from "./DialogoRasgo.module.css";
import conversion from "./ConversionEspacios.module.css";

export function DialogoConversionEspacios({
  personaje,
  rasgo,
  alCerrar
}: {
  readonly personaje: PersonajeJugador;
  readonly rasgo: RasgoPersonaje;
  readonly alCerrar: () => void;
}) {
  const pj = usarAlmacenDM(s => s.personajes.find(p => p.id === personaje.id)) ?? personaje;
  const r = pj.rasgos.find(x => x.id === rasgo.id) ?? rasgo;
  const sistemaMagia = usarSistemaMagia();
  const esModoPuntos = sistemaMagia === "puntos" && (pj.puntosConjuroMaximos ?? 0) > 0;
  const puntosMaximos = pj.puntosConjuroMaximos ?? 0;
  const puntosGastados = pj.puntosConjuroGastados ?? 0;
  const puntosDisponibles = Math.max(0, puntosMaximos - puntosGastados);
  const recurso = resolverRasgoRecurso(r, pj.rasgos);
  const filas = r.conversionEspacios?.tabla.filter(f => f.nivelMinimo <= obtenerNivelEfectivoParaRasgo(pj, r)) ?? [];
  const [modo, cambiarModo] = useState<"crear" | "convertir">("crear");
  const [nivel, cambiarNivel] = useState(filas[0]?.nivelEspacio ?? 1);
  const [nivelConversionPuntos, cambiarNivelConversionPuntos] = useState(1);
  const [cantidad, cambiarCantidad] = useState(1);
  const [espacio, cambiarEspacio] = useState("");
  const [turnoConfirmado, confirmarTurno] = useState(false);
  const turno = usarAlmacenDM(s => identificarTurnoPropio(pj, s));
  const [error, cambiarError] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);
  const confirmado = useRef(false);

  useEffect(() => {
    dialogo.current?.showModal();
  }, []);

  const disponibles = recurso?.usosRestantes ?? recurso?.usosMaximos ?? 0;
  const coste = (filas.find(f => f.nivelEspacio === nivel)?.coste ?? 0) * cantidad;
  const espacios = obtenerEspaciosElegibles(pj).map(e => ({
    ...e,
    valor: `${e.origen}:${e.nivel}`,
    etiqueta: `Nivel ${e.nivel} · ${e.origen} · ${e.disponibles} disponibles`
  }));
  const seleccionado = espacios.find(e => e.valor === espacio);
  const limitado = r.conversionEspacios?.consumirUsoPropio;
  const agotado = r.recuperarRecursoAgotadoConEspacio;
  const unidad = limitado ? "usos" : "puntos";
  const vecesPreviasPuntos = r.usosRecuperadosConPuntos ?? 0;
  const costePuntosConversion = agotado
    ? calcularCostePuntosRecuperacion(vecesPreviasPuntos, 1, 1)
    : (COSTE_PUNTOS_POR_NIVEL[nivelConversionPuntos] ?? nivelConversionPuntos);
  const puntosCreados = (COSTE_PUNTOS_POR_NIVEL[nivel] ?? nivel) * cantidad;
  const recuperacion = esModoPuntos
    ? Math.max(0, Math.min(agotado ? 1 : nivelConversionPuntos, (recurso?.usosMaximos ?? 0) - disponibles))
    : Math.max(0, Math.min(agotado && seleccionado ? 1 : seleccionado?.nivel ?? 0, (recurso?.usosMaximos ?? 0) - disponibles));

  const valido = modo === "crear"
    ? Number.isInteger(cantidad) && cantidad > 0 && coste > 0 && coste <= disponibles
      && (!limitado || (r.usosRestantes ?? r.usosMaximos ?? 0) > 0) && (!esModoPuntos || puntosGastados > 0)
    : recuperacion > 0 && (!agotado || disponibles === 0)
      && (esModoPuntos ? puntosDisponibles >= costePuntosConversion : !!seleccionado)
      && disponibleEnTurnoPropio(r, turno) && (!r.limitePorTurnoPropio || !!turno || turnoConfirmado);

  const confirmar = () => {
    if (!valido || confirmado.current) return;
    confirmado.current = true;
    const aplicado = usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, modo === "crear"
      ? { tipo: "crearEspacio", idRasgo: r.id, nivel, cantidad, ...(esModoPuntos ? { modo: "puntos" as const } : {}) }
      : esModoPuntos
        ? { tipo: "convertirEspacio", idRasgo: r.id, nivel: agotado ? 1 : nivelConversionPuntos, origen: "puntos", puntos: costePuntosConversion, turnoConfirmado }
        : { tipo: "convertirEspacio", idRasgo: r.id, nivel: seleccionado!.nivel, origen: seleccionado!.origen, turnoConfirmado });
    if (aplicado) alCerrar();
    else {
      confirmado.current = false;
      cambiarError("Los recursos han cambiado. Revisa la selección.");
    }
  };

  return (
    <dialog
      ref={dialogo}
      className={`${estilos.dialogo} ${conversion.dialogoAncho}`}
      aria-label="Crear o convertir espacios de conjuro"
      onCancel={alCerrar}
      onClick={e => e.stopPropagation()}
    >
      <header className={estilos.cabecera}>
        <Sparkles size={18} className={conversion.iconoCabecera} />
        <h3>{rasgo.nombre}</h3>
        <span className={conversion.badgeCabecera}>D&D 5.5e</span>
        <button className={estilos.cerrar} type="button" aria-label="Cerrar conversión" onClick={alCerrar}>
          <X size={18} />
        </button>
      </header>

      <FormularioNumerico className={conversion.formulario} onSubmit={confirmar}>
        <div className={`u-scroll-cef ${estilos.cuerpo} ${conversion.cuerpo}`}>
          {/* 1. HUD de Recursos Actuales */}
          <HudRecursosConversion
            nombreRecurso={recurso?.nombre ?? "Recurso"}
            disponibles={disponibles}
            maximos={recurso?.usosMaximos ?? 0}
            esModoPuntos={esModoPuntos}
            puntosDisponibles={puntosDisponibles}
            puntosMaximos={puntosMaximos}
            totalEspaciosDisponibles={espacios.reduce((acc, e) => acc + e.disponibles, 0)}
          />

          {/* 2. Selector Segmentado de Modo */}
          {r.conversionEspacios?.permiteConvertir && (
            <div className={conversion.selectorModo}>
              <button
                type="button"
                className={`${conversion.botonModo} ${modo === "crear" ? conversion.botonModoActivo : ""}`}
                aria-pressed={modo === "crear"}
                onClick={() => cambiarModo("crear")}
              >
                <Sparkles size={14} />
                {esModoPuntos ? "Recuperar puntos" : "Crear espacios"}
              </button>
              <button
                type="button"
                className={`${conversion.botonModo} ${modo === "convertir" ? conversion.botonModoActivo : ""}`}
                aria-pressed={modo === "convertir"}
                onClick={() => cambiarModo("convertir")}
              >
                <RefreshCw size={14} />
                {agotado ? "Recuperar un uso" : "Convertir en puntos"}
              </button>
            </div>
          )}

          {/* 3. Tarjeta de Flujo Visual de Transmutación */}
          <TarjetaFlujoConversion
            modo={modo}
            coste={coste}
            unidad={unidad}
            esModoPuntos={esModoPuntos}
            costePuntosConversion={costePuntosConversion}
            seleccionadoNivel={seleccionado?.nivel}
            nombreRecurso={recurso?.nombre ?? "Recurso"}
            puntosGastados={puntosGastados}
            puntosCreados={puntosCreados}
            cantidad={cantidad}
            nivel={nivel}
            agotado={agotado}
            recuperacion={recuperacion}
          />

          {/* 4. Parámetros y Selectores Específicos */}
          {modo === "crear" ? (
            <div className={conversion.seccionParametros}>
              <div className={conversion.grupoCampo}>
                <span className={conversion.etiquetaCampo}>Nivel del espacio</span>
                <SelectorDesplegable
                  titulo="Nivel del espacio"
                  valor={String(nivel)}
                  enFlujo
                  alCambiar={v => cambiarNivel(Number(v))}
                  opciones={filas.map(f => ({
                    valor: String(f.nivelEspacio),
                    etiqueta: esModoPuntos
                      ? `Nivel ${f.nivelEspacio} (+${COSTE_PUNTOS_POR_NIVEL[f.nivelEspacio] ?? f.nivelEspacio} pts) · Coste: ${f.coste} ${unidad}`
                      : `Nivel ${f.nivelEspacio} · Coste: ${f.coste} ${unidad}`
                  }))}
                />
              </div>

              {!limitado && (
                <div className={conversion.grupoCampo}>
                  <span className={conversion.etiquetaCampo}>Cantidad de espacios</span>
                  <CampoNumerico
                    aria-label="Cantidad de espacios"
                    min={1}
                    max={Math.max(1, Math.floor(disponibles / (filas.find(f => f.nivelEspacio === nivel)?.coste ?? 1)))}
                    value={cantidad}
                    alConfirmar={cambiarCantidad}
                  />
                </div>
              )}

              {esModoPuntos ? (
                puntosGastados === 0 && (
                  <div className={`${conversion.bannerAlerta} ${conversion.bannerInfo}`}>
                    <Info size={16} />
                    <div className={conversion.contenidoBanner}>
                      <span className={conversion.tituloBanner}>Reserva al máximo</span>
                      <span className={conversion.textoBanner}>
                        Tu reserva de puntos de conjuro ya se encuentra al máximo ({puntosDisponibles} / {puntosMaximos}).
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <div className={`${conversion.bannerAlerta} ${conversion.bannerInfo}`}>
                  <Info size={16} />
                  <div className={conversion.contenidoBanner}>
                    <span className={conversion.tituloBanner}>Duración del recurso</span>
                    <span className={conversion.textoBanner}>
                      Los espacios creados se disipan al completar un descanso largo.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={conversion.seccionParametros}>
              {esModoPuntos ? (
                agotado ? null : (
                  <div className={conversion.grupoCampo}>
                    <span className={conversion.etiquetaCampo}>Nivel equivalente a convertir</span>
                    <SelectorDesplegable
                      titulo="Nivel equivalente a convertir"
                      valor={String(nivelConversionPuntos)}
                      enFlujo
                      alCambiar={v => cambiarNivelConversionPuntos(Number(v))}
                      opciones={[1, 2, 3, 4, 5].map(nv => ({
                        valor: String(nv),
                        etiqueta: `Nivel ${nv} · Coste ${COSTE_PUNTOS_POR_NIVEL[nv]} pts (+${nv} ${unidad})`
                      }))}
                    />
                  </div>
                )
              ) : (
                <div className={conversion.grupoCampo}>
                  <span className={conversion.etiquetaCampo}>Espacio a convertir</span>
                  <SelectorDesplegable
                    titulo="Espacio a convertir"
                    valor={espacio}
                    enFlujo
                    alCambiar={cambiarEspacio}
                    opciones={[
                      { valor: "", etiqueta: "Selecciona un espacio de conjuro..." },
                      ...espacios.map(e => ({ valor: e.valor, etiqueta: e.etiqueta }))
                    ]}
                  />
                </div>
              )}

              {/* Banners Tácticos de Validación de Reglas */}
              {agotado && disponibles > 0 && (
                <div className={`${conversion.bannerAlerta} ${conversion.bannerAdvertencia}`}>
                  <AlertCircle size={16} />
                  <div className={conversion.contenidoBanner}>
                    <span className={conversion.tituloBanner}>Reserva no agotada</span>
                    <span className={conversion.textoBanner}>
                      La regla de este rasgo requiere que tus usos de {recurso?.nombre ?? "recurso"} estén completamente
                      en 0 para poder recuperarlos mediante magia.
                    </span>
                  </div>
                </div>
              )}

              {esModoPuntos && puntosDisponibles < costePuntosConversion && (
                <div className={`${conversion.bannerAlerta} ${conversion.bannerError}`}>
                  <AlertCircle size={16} />
                  <div className={conversion.contenidoBanner}>
                    <span className={conversion.tituloBanner}>Puntos insuficientes</span>
                    <span className={conversion.textoBanner}>
                      Requieres {costePuntosConversion} puntos de conjuro disponibles y cuentas con {puntosDisponibles}.
                    </span>
                  </div>
                </div>
              )}

              {!disponibleEnTurnoPropio(r, turno) && (
                <div className={`${conversion.bannerAlerta} ${conversion.bannerError}`}>
                  <Clock size={16} />
                  <div className={conversion.contenidoBanner}>
                    <span className={conversion.tituloBanner}>Límite por turno</span>
                    <span className={conversion.textoBanner}>
                      Esta operación solo puede ejecutarse una vez en tu turno propio.
                    </span>
                  </div>
                </div>
              )}

              {/* Confirmación interactiva de turno */}
              {r.limitePorTurnoPropio && turno === undefined && (
                <TarjetaConfirmacionTurno
                  turnoConfirmado={turnoConfirmado}
                  alConfirmar={confirmarTurno}
                />
              )}
            </div>
          )}

          {error && (
            <div className={`${conversion.bannerAlerta} ${conversion.bannerError}`} role="alert">
              <AlertCircle size={16} />
              <div className={conversion.contenidoBanner}>
                <span className={conversion.textoBanner}>{error}</span>
              </div>
            </div>
          )}
        </div>

        <footer className={estilos.acciones}>
          <button type="button" onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" className={estilos.principal} disabled={!valido}>
            <Check size={16} /> Confirmar {modo === "crear" ? "creación" : "conversión"}
          </button>
        </footer>
      </FormularioNumerico>
    </dialog>
  );
}
