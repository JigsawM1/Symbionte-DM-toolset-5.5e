import { useEffect, useRef, useState } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { prepararResolucionAsistida, resultadoConstante } from "@/servicios/rasgos/resolucionAsistidaRasgos";
import { solicitarResultadoTirada } from "@/utiles/lanzadorDados";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { obtenerModificadoresConjuroRasgos } from "@/servicios/rasgos/modificadoresConjuroRasgos";
import { logger } from "@/utiles/logger";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import modal from "./DialogoRasgo.module.css";
import { SelectorDesplegable } from "@/componentes/comunes";

const enCurso = new Set<string>();

export function ResolucionAsistidaRasgo({ personaje, rasgo }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [mostrar, abrir] = useState(false);
  const [opcion, elegir] = useState("");
  const [incluirDados, cambiarDados] = useState(false);
  const [propio, cambiarPropio] = useState(false);
  const [confirmado, confirmar] = useState(false);
  const [ocupado, ocupar] = useState(false);
  const [mensaje, informar] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (mostrar) dialogo.current?.showModal(); }, [mostrar]);
  const cfg = rasgo.resolucionAsistida;
  if (!cfg) return null;
  const solicitud = { idRasgo: rasgo.id, idOpcion: opcion || (cfg.opciones.length === 1 ? cfg.opciones[0].id : ""), incluirDados, propio, confirmado };
  const preparada = prepararResolucionAsistida(personaje, solicitud);
  const stats = calcularEstadisticasPersonaje(personaje);
  const cd = rasgo.salvacionObjetivo ? 8 + stats.bonoCompetencia + stats.modificadores[rasgo.salvacionObjetivo.aptitud]
    + obtenerModificadoresConjuroRasgos(personaje, rasgo.claseConjurosOtorgados).bonoCD : undefined;
  const resolver = async () => {
    if (enCurso.has(personaje.id)) return;

    const vigente = usarAlmacenDM.getState().personajes.find(p => p.id === personaje.id);
    const actual = vigente && prepararResolucionAsistida(vigente, solicitud);
    if (!actual) return;
    enCurso.add(personaje.id); ocupar(true); informar("");
    try {
      let resultado: number | undefined;
      if (actual.formula) {
        resultado = resultadoConstante(actual.formula);
        if (resultado === undefined) {
          const tirada = await solicitarResultadoTirada({ etiqueta: rasgo.nombre,
            grupos: [{ nombre: `${rasgo.nombre} · ${actual.opcion.etiqueta}`, formula: actual.formula }] });
          resultado = tirada.totales[0];
          if (!Number.isFinite(resultado)) throw new Error("No se obtuvo un resultado válido. El uso sigue disponible.");
        }
      }
      if (!usarAlmacenDM.getState().operarRecursoRasgoPersonaje(personaje.id, { tipo: "resolverAsistida", solicitud, resultado }))
        throw new Error("La capacidad o sus recursos cambiaron durante la resolución.");
      const texto = `${actual.opcion.etiqueta}${resultado === undefined ? "" : `: ${resultado}${actual.opcion.tipoDano ? ` de daño ${actual.opcion.tipoDano.toLowerCase()}` : ""}`}${actual.opcion.salvacion ? ` · Salvación de ${actual.opcion.salvacion}, CD ${cd}${actual.opcion.tipo === "dano" && resultado !== undefined ? ` · Mitad: ${Math.floor(resultado / 2)}` : ""}` : ""}. ${propio ? "PG temporales propios actualizados." : "Aplicación al destinatario manual; consulta alcance, condiciones y duración en el rasgo."}`;
      informar(texto); usarAlmacenDM.getState().agregarNotificacion(`${rasgo.nombre}: resolución completada.`, "info"); abrir(false);
    } catch (error) {
      logger.error("[ResolucionAsistidaRasgo] No se pudo resolver el rasgo:", error);
      informar(error instanceof Error ? error.message : "No se pudo resolver el rasgo.");
    } finally { enCurso.delete(personaje.id); ocupar(false); }
  };
  return <section className={estilos.rituales} aria-label={`Resolución de ${rasgo.nombre}`}>
    <button type="button" className={estilos.botonCompacto} aria-label={`Resolver ${rasgo.nombre}`} onClick={() => { informar(""); confirmar(false); abrir(true); }}>Resolver</button>
    {!mostrar && mensaje && <p role="status">{mensaje}</p>}
    {mostrar && <dialog ref={dialogo} className={modal.dialogo} aria-label={`Resolver: ${rasgo.nombre}`}
      onClick={e => e.stopPropagation()} onCancel={e => { if (ocupado) e.preventDefault(); else abrir(false); }}>
      <header className={modal.cabecera}><h3>{rasgo.nombre}</h3><button type="button" aria-label="Cerrar resolución" disabled={ocupado} onClick={() => abrir(false)}>Cerrar</button></header>
      <div className={`u-scroll-cef ${modal.cuerpo} ${estilos.formularioResolucion}`}>
        <SelectorDesplegable titulo="Resultado del rasgo" placeholder="Elige el resultado" valor={solicitud.idOpcion}
          disabled={ocupado} opciones={cfg.opciones.map(o => ({ valor: o.id, etiqueta: o.etiqueta }))} alCambiar={elegir} enFlujo />
        {cfg.dadosOpcionales && rasgo.formulaDados && <label><input type="checkbox" checked={incluirDados} disabled={ocupado} onChange={e => cambiarDados(e.target.checked)} />Incluir daño opcional ({rasgo.formulaDados})</label>}
        {cfg.confirmacion && <label><input type="checkbox" checked={confirmado} disabled={ocupado} onChange={e => confirmar(e.target.checked)} />{cfg.confirmacion}</label>}
        {cfg.permitePropio && <label><input type="checkbox" checked={propio} disabled={ocupado} onChange={e => cambiarPropio(e.target.checked)} />Aplicar a mi personaje</label>}
        {preparada?.opcion.salvacion && <p>Salvación de {preparada.opcion.salvacion} · CD {cd}</p>}
        {preparada?.formula && <p>Fórmula: {preparada.formula}</p>}
        <p>Resuelve manualmente el alcance, los destinatarios y las condiciones indicadas en el rasgo.</p>
        {mensaje && <p role="alert">{mensaje}</p>}
      </div>
      <footer className={modal.acciones}><button type="button" disabled={ocupado} onClick={() => abrir(false)}>Cancelar</button>
        <button type="button" disabled={ocupado || !preparada} onClick={() => void resolver()}>{ocupado ? "Resolviendo…" : "Confirmar resolución"}</button></footer>
    </dialog>}
  </section>;
}
