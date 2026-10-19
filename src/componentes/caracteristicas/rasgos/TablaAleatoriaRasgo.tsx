import { useEffect, useRef, useState } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerTablaRasgo, tirarFilasTabla, resolverFilaTabla, type FilaTablaRasgo } from "@/servicios/rasgos/tablasAleatoriasRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import { TextoEnriquecidoDND } from "@/componentes/comunes";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import modal from "./DialogoRasgo.module.css";

export function TablaAleatoriaRasgo({ personaje: pj, rasgo: r }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [abierto, abrir] = useState(false);
  const [filas, elegir] = useState<{ tirada?: number; fila: FilaTablaRasgo }[]>([]);
  const [ocupado, bloquear] = useState(false);
  const [mensaje, informar] = useState("");
  const candado = useRef(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (abierto) dialogo.current?.showModal(); }, [abierto]);
  const cfg = obtenerTablaRasgo(pj, r);
  if (!cfg) return null;
  const pendiente = r.resultadoTabla && !r.resultadoTabla.enviado;
  const recarga = cfg.modo === "recargar";
  const restantes = r.usosRestantes ?? r.usosMaximos ?? 0;
  const agotado = r.tieneUsosLimitados && (recarga ? r.activo || restantes >= (r.usosMaximos ?? 1) : restantes < 1);
  const enviar = async (texto: string) => {
    try {
      const enviado = ts.estaDisponible ? await ts.chat.send(texto) : true;
      if (enviado) usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, { tipo: "enviarTabla", idRasgo: r.id });
      informar(!ts.estaDisponible ? "Resultado local; TaleSpire no está conectado." : enviado ? "Resultado enviado al chat." : "Falló el envío. Reintenta el mismo resultado.");
    } catch (err) {
      logger.error("[TablaAleatoriaRasgo] Error al enviar resultado al chat:", err);
      informar("Falló el envío. Reintenta el mismo resultado.");
    }
  };
  const resolver = async (fila: FilaTablaRasgo, tirada?: number) => {
    if (candado.current) return;
    candado.current = true; bloquear(true);
    try {
      const texto = `${pj.nombre} · ${r.nombre}${tirada ? ` · 1d${cfg.dado}: ${tirada}` : " · Elección de fila"}\n${resolverFilaTabla(fila)}`;
      if (!usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, { tipo: "guardarTabla", idRasgo: r.id, texto })) {
        informar("Los usos o el resultado pendiente cambiaron."); return;
      }
      elegir([]); await enviar(texto);
    } catch (err) {
      logger.error("[TablaAleatoriaRasgo] Error al resolver fila de tabla:", err);
      informar("No se pudo resolver la fila de la tabla.");
    } finally { candado.current = false; bloquear(false); }
  };
  const preparar = () => {
    if (candado.current) return;
    abrir(true); informar("");
    elegir(cfg.modo === "elegir" ? cfg.filas.map(fila => ({ fila })) : []);
  };
  return <>
    <button type="button" className={estilos.botonCompacto} disabled={!pendiente && agotado} onClick={e => { e.stopPropagation(); preparar(); }}>
      {pendiente ? "Ver resultado pendiente" : recarga ? "Confirmar conjuro y recargar" : cfg.modo === "elegir" ? "Elegir efecto de oleada" : "Tirar en la tabla"}</button>
    {abierto && <dialog ref={dialogo} className={modal.dialogo} aria-label={`Tabla: ${r.nombre}`} onClick={e => e.stopPropagation()}
      onCancel={e => { if (ocupado) e.preventDefault(); else abrir(false); }}>
      <header className={modal.cabecera}><h3>{r.nombre}</h3></header>
      <div className={`u-scroll-cef ${modal.cuerpo}`}>
        {recarga && <p>Confirma que has lanzado un conjuro de hechicero con un espacio. Recuperarás el uso y resolverás una oleada.</p>}
        <p>Elige el resultado antes de resolver las subtiradas. Las consecuencias se aplican manualmente.</p>
        {!pendiente && !filas.length && <button type="button" disabled={ocupado || agotado} onClick={() => {
          try {
            elegir(tirarFilasTabla(cfg));
          } catch (err) {
            logger.error("[TablaAleatoriaRasgo] Error al tirar filas de tabla:", err);
            informar("La configuración de la tabla es inválida.");
          }
        }}>
          {recarga ? "Confirmar conjuro y determinar oleada" : `Determinar ${cfg.tiradas === 2 ? "dos resultados" : "resultado"}`}</button>}
        {!pendiente && filas.map((f, i) => <div key={`${f.fila.id}_${i}`}>
          <TextoEnriquecidoDND texto={`${f.tirada ? `1d${cfg.dado}: ${f.tirada}. ` : ""}${f.fila.desde}–${f.fila.hasta}: ${f.fila.texto}`} />
          <button type="button" disabled={ocupado} onClick={() => void resolver(f.fila, f.tirada)}>Resolver resultado {i + 1}</button>
        </div>)}
        {r.resultadoTabla && <><TextoEnriquecidoDND texto={r.resultadoTabla.texto} />
          {pendiente && <button type="button" disabled={ocupado} onClick={async () => {
            if (candado.current) return; candado.current = true; bloquear(true);
            try { await enviar(r.resultadoTabla!.texto); } finally { candado.current = false; bloquear(false); }
          }}>Reintentar envío</button>}</>}
        {mensaje && <p role="status">{mensaje}</p>}
      </div>
      <footer className={modal.acciones}><button type="button" disabled={ocupado} onClick={() => abrir(false)}>Cerrar tabla</button></footer>
    </dialog>}
  </>;
}
