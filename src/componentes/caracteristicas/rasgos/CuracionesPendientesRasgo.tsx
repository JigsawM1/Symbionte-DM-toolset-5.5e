import { useState } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { resultadoConstante } from "@/servicios/rasgos/resolucionAsistidaRasgos";
import { solicitarResultadoTirada } from "@/utiles/lanzadorDados";
import { logger } from "@/utiles/logger";
import { formulaCuracionPendiente } from "@/servicios/rasgos/curacionDeclarativa";
import { CampoNumerico } from "@/componentes/comunes";
import estilos from "./ConjurosConRecursoRasgo.module.css";

import { operacionesMagicasEnCurso as enCurso } from "@/servicios/rasgos/bloqueoOperacionesMagicas";
export function CuracionesPendientesRasgo({ idPersonaje, rasgo }: { idPersonaje: string; rasgo: RasgoPersonaje }) {
  const [confirmada, confirmar] = useState<string>();
  const [ocupado, ocupar] = useState(false);
  const [mensaje, informar] = useState("");
  const [enTurno, cambiarTurno] = useState(false);
  const [dano, cambiarDano] = useState(0);
  const resolver = async (id: string, propio: boolean, descartar = false) => {
    if (enCurso.has(idPersonaje)) return;
    const pendiente = usarAlmacenDM.getState().personajes.find(p => p.id === idPersonaje)?.rasgos
      .find(r => r.id === rasgo.id)?.resolucionesCuracionPendientes?.find(p => p.id === id);
    if (!pendiente || (!descartar && confirmada !== id)) return;
    enCurso.add(idPersonaje); ocupar(true);
    try {
      const formula = formulaCuracionPendiente(pendiente, enTurno, dano);
      const resultado = descartar ? undefined : resultadoConstante(formula)
        ?? (await solicitarResultadoTirada({ etiqueta: pendiente.etiqueta, grupos: [{ nombre: "Curación", formula }] })).totales[0];
      if (!usarAlmacenDM.getState().operarRecursoRasgoPersonaje(idPersonaje, { tipo: "curacionPendiente", idRasgo: rasgo.id, id, propio, resultado, enTurno, dano }))
        throw new Error("La resolución pendiente ya no está disponible.");
      informar(descartar ? "Resolución descartada." : `${resultado} PG. ${propio ? "Curación propia aplicada." : "Aplica la curación manualmente al destinatario."}`);
      confirmar(undefined);
      cambiarTurno(false);
    } catch (error) {
      logger.error("[CuracionesPendientesRasgo] Falló la resolución:", error);
      informar("No se pudo resolver; la curación continúa pendiente.");
    } finally { ocupar(false); enCurso.delete(idPersonaje); }
  };
  return <section className={estilos.seccionLanzador} aria-label={`Curaciones pendientes de ${rasgo.nombre}`}>
    {rasgo.resolucionesCuracionPendientes?.map(p => <div className={estilos.tarjetaResumenConjuro} key={p.id}>
      <p className={estilos.cabeceraCuracionPendiente}>{p.etiqueta} · {p.derivadaDano ? "Mitad del daño causado" : p.formula} PG</p>
      {p.derivadaDano && <label className={estilos.labelCheckCuracion}>Daño efectivamente causado<CampoNumerico min={0} value={dano} alConfirmar={cambiarDano} /></label>}
      {p.bonoEnTurno !== undefined && <label className={estilos.labelCheckCuracion}><input type="checkbox" className={estilos.checkCuracionInput} checked={enTurno} disabled={ocupado} onChange={e => cambiarTurno(e.target.checked)} />Ocurre en el turno original del lanzamiento (+{p.bonoEnTurno} PG)</label>}
      <label className={estilos.labelCheckCuracion}><input type="checkbox" className={estilos.checkCuracionInput} disabled={ocupado} checked={confirmada === p.id}
        onChange={e => confirmar(e.target.checked ? p.id : undefined)} />{p.confirmacion}</label>
      <div className={estilos.filaBotones}>
        <button className={estilos.botonLanzarPrincipal} disabled={ocupado || confirmada !== p.id} onClick={() => void resolver(p.id, true)}>Aplicar curación propia</button>
        {!rasgo.curacionConjuros?.autocuracionPorEspacio && <button className={estilos.botonLanzarEspacio} disabled={ocupado || confirmada !== p.id} onClick={() => void resolver(p.id, false)}>Resolver para otra criatura</button>}
        <button className={estilos.botonLanzarEspacio} disabled={ocupado} onClick={() => void resolver(p.id, false, true)}>Descartar curación</button>
      </div>
    </div>)}
    {mensaje && <p role="status">{mensaje}</p>}
  </section>;
}
