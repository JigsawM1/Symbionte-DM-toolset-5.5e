import { useRef, useState, useEffect } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { CampoNumerico, FormularioNumerico } from "@/componentes/comunes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import { Dices, Minus, Plus, X } from "lucide-react";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import modal from "./DialogoRasgo.module.css";

export function ReservaDadosRasgo({ personaje: pj, rasgo: r }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [modo, abrir] = useState<"comprarDados" | "gastarDados">();
  const [cantidad, cambiar] = useState(1);
  const [ocupado, bloquear] = useState(false);
  const [error, informar] = useState("");
  const candado = useRef(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (modo) { candado.current = false; dialogo.current?.showModal(); } }, [modo]);
  const cfg = r.reservaDados;
  if (!cfg) return null;
  const padre = resolverRasgoRecurso(r, pj.rasgos);
  const disponiblesPadre = padre?.usosRestantes ?? padre?.usosMaximos ?? 0;
  const max = modo === "comprarDados" ? Math.min(cfg.maximo, Math.floor(disponiblesPadre / cfg.costePorDado)) : r.dadosReserva ?? 0;
  const confirmar = async () => {
    if (candado.current || !modo || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > max) return;
    candado.current = true; bloquear(true); informar("");
    let completado = false;
    try {
      const estado = usarAlmacenDM.getState();
      const actual = estado.personajes.find(p => p.id === pj.id)?.rasgos.find(x => x.id === r.id);
      if (modo === "gastarDados" && (!actual || (actual.dadosReserva ?? 0) < cantidad)) return;
      if (modo === "gastarDados" && !await lanzarDadosTaleSpire(`!${r.nombre}:${cantidad}d${cfg.caras}`, `${pj.nombre} - ${r.nombre} · Reducción manual`)) {
        informar("No se pudo emitir la tirada. La reserva se conserva."); return;
      }
      if (usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, { tipo: modo, idRasgo: r.id, cantidad })) { completado = true; abrir(undefined); }
      else informar("La reserva cambió. Revisa los puntos y dados disponibles.");
    } finally { if (!completado) candado.current = false; bloquear(false); }
  };
  return <section className={estilos.rituales} aria-label={`Reserva de ${r.nombre}`}>
    <p>Reserva: {r.dadosReserva ?? 0}d{cfg.caras}. Aplica la reducción al beneficiario manualmente.</p>
    <div className={estilos.botonesRituales}>{(["comprarDados", "gastarDados"] as const).map(tipo => <button key={tipo} type="button" className={estilos.botonCompacto}
      disabled={tipo === "comprarDados" ? disponiblesPadre < cfg.costePorDado : !r.dadosReserva}
      onClick={() => { cambiar(1); informar(""); abrir(tipo); }}>{tipo === "comprarDados" ? "Crear salvaguarda" : "Gastar dados de salvaguarda"}</button>)}</div>
    {modo && <dialog ref={dialogo} className={modal.dialogo} aria-label={modo === "comprarDados" ? "Crear salvaguarda" : "Gastar dados de salvaguarda"}
      onClick={e => e.stopPropagation()} onCancel={e => { if (ocupado) e.preventDefault(); else abrir(undefined); }}>
      <header className={modal.cabecera}><Dices size={18} aria-hidden="true" /><h3>{r.nombre}</h3>
        <button type="button" className={modal.cerrar} aria-label="Cerrar salvaguarda" disabled={ocupado} onClick={() => abrir(undefined)}><X size={18} /></button></header>
      <FormularioNumerico className={estilos.formulario} onSubmit={() => void confirmar()}>
        <div className={`u-scroll-cef ${modal.cuerpo}`}>
          <p className={modal.introduccion}>{modo === "comprarDados" ? "Elige los dados que formarán la nueva salvaguarda." : "Elige los dados que gastarás para reducir el daño."}</p>
          <div className={estilos.cantidadCabecera}><label htmlFor={`salvaguarda-${r.id}`}>Dados {modo === "comprarDados" ? "a crear" : "a gastar"}</label>
            <span>{modo === "comprarDados" ? `${disponiblesPadre} puntos disponibles` : `${r.dadosReserva ?? 0}d${cfg.caras} en la reserva`}</span></div>
          <div className={estilos.cantidad}>
            <button type="button" aria-label="Un dado menos" disabled={ocupado || cantidad <= 1} onClick={() => cambiar(n => Math.max(1, n - 1))}><Minus size={16} /></button>
            <CampoNumerico id={`salvaguarda-${r.id}`} aria-label="Dados de salvaguarda" min={1} max={Math.max(1, max)} value={cantidad} alConfirmar={cambiar} disabled={ocupado} />
            <span className={estilos.caras}>d{cfg.caras}</span>
            <button type="button" aria-label="Un dado más" disabled={ocupado || cantidad >= max} onClick={() => cambiar(n => Math.min(max, n + 1))}><Plus size={16} /></button>
          </div>
          <div className={estilos.resumenReserva} aria-live="polite">
            <div><span>{modo === "comprarDados" ? "Nueva salvaguarda" : "Reducción de daño"}</span><strong>{cantidad}d{cfg.caras}</strong></div>
            <div><span>{modo === "comprarDados" ? "Coste" : "Quedarán"}</span><strong>{modo === "comprarDados"
              ? `${cantidad * cfg.costePorDado} ${cantidad * cfg.costePorDado === 1 ? "punto" : "puntos"}` : `${Math.max(0, (r.dadosReserva ?? 0) - cantidad)}d${cfg.caras}`}</strong></div>
          </div>
          <p className={estilos.limite}>{modo === "comprarDados" ? "Reemplaza la salvaguarda anterior. Dura hasta tu próximo descanso largo." : "Aplica la reducción manualmente al beneficiario."}</p>
          {error && <p className={modal.error} role="status">{error}</p>}
        </div>
        <footer className={modal.acciones}><button type="button" disabled={ocupado} onClick={() => abrir(undefined)}>Cancelar</button>
          <button type="submit" className={modal.principal} disabled={ocupado || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > max}><Dices size={15} aria-hidden="true" />Confirmar {modo === "comprarDados" ? "salvaguarda" : "tirada"}</button></footer>
      </FormularioNumerico>
    </dialog>}
  </section>;
}
