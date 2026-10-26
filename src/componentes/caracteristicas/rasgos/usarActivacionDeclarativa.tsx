import { obtenerPagoActivacionAlternativa } from "@/servicios/rasgos/conversionRecursosRasgos";
import { useState, useRef, useEffect } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { EleccionesActivacionRasgo } from "@/servicios/rasgos/activacionDeclarativa";
import { Check, X, Zap } from "lucide-react";
import estilos from "./ActivacionDeclarativa.module.css";
import modalEstilos from "./DialogoRasgo.module.css";

/** El borrador permanece local: cancelar nunca modifica elecciones ni reservas. */
export function useActivacionDeclarativa(rasgo: RasgoPersonaje, idPersonaje?: string, alternarOriginal?: () => void) {
  const pj = usarAlmacenDM(s => s.personajes.find(p => p.id === idPersonaje));
  const [abierto, setAbierto] = useState(false);
  const [decisiones, setDecisiones] = useState<EleccionesActivacionRasgo>({ selectores: {}, opcionales: [] });
  const [error, setError] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);
  const confirmando = useRef(false);
  const selectores = (rasgo.selectores ?? []).filter(s => s.momentoEleccion === "activacion");
  const opcionales = pj?.rasgos.filter(r => r.activarConRasgo === rasgo.id) ?? [];
  useEffect(() => { if (abierto) dialogo.current?.showModal(); }, [abierto]);
  const pagoAlternativo = pj ? obtenerPagoActivacionAlternativa(pj, rasgo) : undefined;
  const alternar = () => {
    if ((rasgo.activo && !rasgo.renovarActivacion) || (!selectores.length && !opcionales.length && !pagoAlternativo) || !pj) { alternarOriginal?.(); return; }
    confirmando.current = false;
    setDecisiones({ selectores: {}, opcionales: [] }); setError(""); setAbierto(true);
  };
  const confirmar = () => {
    if (!pj || confirmando.current) return;
    confirmando.current = true;
    usarAlmacenDM.getState().alternarActivoRasgo(pj.id, rasgo.id, decisiones);
    const activo = usarAlmacenDM.getState().personajes.find(p => p.id === pj.id)?.rasgos.find(r => r.id === rasgo.id)?.activo;
    if (activo) setAbierto(false); else { confirmando.current = false; setError("No se pudo activar. Revisa las elecciones, requisitos y usos disponibles."); }
  };
  const modal = abierto && <dialog ref={dialogo} className={modalEstilos.dialogo} aria-label={`Activar ${rasgo.nombre}`}
    onCancel={() => setAbierto(false)} onClick={e => e.stopPropagation()}>
    <header className={modalEstilos.cabecera}><Zap size={18} aria-hidden="true" /><h3>Activar {rasgo.nombre}</h3>
      <button type="button" className={modalEstilos.cerrar} aria-label="Cerrar activación" onClick={() => setAbierto(false)}><X size={18} /></button></header>
    <div className={`u-scroll-cef ${modalEstilos.cuerpo}`}>
      {pagoAlternativo && <p>Sin usos disponibles. Esta activación gastará {pagoAlternativo.coste} puntos de {pagoAlternativo.recurso.nombre}.</p>}
      {rasgo.costeActivacionPorSelector && <p aria-live="polite">Coste: {(decisiones.selectores[rasgo.costeActivacionPorSelector.idSelector]?.length ?? 0) * rasgo.costeActivacionPorSelector.costePorOpcion} puntos de la reserva.</p>}
      {selectores.length > 0 && <p className={modalEstilos.introduccion}>Elige las opciones para esta activación.</p>}
      {selectores.map(s => <fieldset className={estilos.grupo} key={s.id}><legend>{s.etiqueta}</legend>
        <div className={estilos.opciones}>{s.opciones.map(o => <button type="button" key={o.id}
          aria-pressed={decisiones.selectores[s.id]?.includes(o.id) ?? false} title={o.descripcion}
          aria-label={`Seleccionar ${o.nombre}`} onClick={() => setDecisiones(d => {
            const actuales = d.selectores[s.id] ?? [];
            const valores = s.tipo === "unico" ? [o.id] : actuales.includes(o.id) ? actuales.filter(id => id !== o.id)
              : actuales.length < s.maxSelecciones ? [...actuales, o.id] : actuales;
            return { ...d, selectores: { ...d.selectores, [s.id]: valores } };
          })}>
          <span className={estilos.marca} aria-hidden="true">{decisiones.selectores[s.id]?.includes(o.id) && <Check size={12} />}</span>
          {o.nombre}</button>)}</div>
        <div className={estilos.descripcion} aria-live="polite">{decisiones.selectores[s.id]?.length
          ? s.opciones.filter(o => decisiones.selectores[s.id].includes(o.id)).map(o => <p key={o.id}>{o.descripcion}</p>)
          : <p className={estilos.pendiente}>Selecciona {s.tipo === "unico" ? "una opción" : `hasta ${s.maxSelecciones} opciones`} para ver su beneficio.</p>}</div>
      </fieldset>)}
      {opcionales.length > 0 && <div className={estilos.opcionales}><p className={estilos.etiqueta}>Activación opcional</p>
        {opcionales.map(r => {
          const usos = r.usosRestantes ?? r.usosMaximos ?? 0;
          const inhabilitado = !!r.activo || !!(r.tieneUsosLimitados && usos < 1);
          return <label className={estilos.opcional} key={r.id} aria-disabled={inhabilitado}>
            <input type="checkbox" checked={decisiones.opcionales.includes(r.id)} disabled={inhabilitado}
              onChange={e => setDecisiones(d => ({ ...d, opcionales: e.target.checked ? [...d.opcionales, r.id] : d.opcionales.filter(id => id !== r.id) }))} />
            <span><strong>{r.nombre}</strong><small>{r.activo ? "Ya está activo" : r.tieneUsosLimitados
              ? usos > 0 ? "Consume 1 uso al confirmar" : "Sin usos disponibles" : "Se activa al confirmar"}</small></span>
            {r.tieneUsosLimitados && <span className={estilos.reserva}>{usos} {usos === 1 ? "uso" : "usos"}</span>}
          </label>;
        })}</div>}
      {error && <p className={modalEstilos.error} role="status">{error}</p>}
    </div>
    <footer className={modalEstilos.acciones}><button type="button" onClick={() => setAbierto(false)}>Cancelar</button>
      <button type="button" className={modalEstilos.principal} aria-label="Confirmar activación" disabled={selectores.some(s => !decisiones.selectores[s.id]?.length)} onClick={confirmar}>Activar {rasgo.nombre}</button></footer>
  </dialog>;
  return { alternar, modal };
}
