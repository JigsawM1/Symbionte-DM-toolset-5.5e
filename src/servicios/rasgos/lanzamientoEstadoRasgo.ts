import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { coincideHechizoId } from "../comparadorHechizos";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { claveEstado } from "./estadoCondicionesRasgos";

export function obtenerLanzamientoEstado(pj: PersonajeJugador, id: string, h: HechizoBase, nivel = h.nivel) {
  const r = pj.rasgos.find(r => r.id === id);
  const cfg = r?.lanzamientoConActivacion;
  if (!r || !cfg || !rasgoMagicoHabilitado(pj, { ...r, activo: true }) || !coincideHechizoId(cfg.conjuroId, h.id) || nivel !== cfg.nivel
    || r.desactivarConCondiciones?.some(c => pj.condicionesActivas.some(a => claveEstado(a) === claveEstado(c)))) return;
  if (r.activo ? pj.concentracionActiva?.idRasgoOrigen !== r.id : (r.usosRestantes ?? r.usosMaximos ?? 0) < 1) return;
  return r;
}

/** La primera emisión consume un uso y establece concentración; las siguientes conservan ambos estados. */
export function consumirLanzamientoEstado(pj: PersonajeJugador, id: string, h: HechizoBase, nivel: number, ronda = 1): PersonajeJugador | undefined {
  const r = obtenerLanzamientoEstado(pj, id, h, nivel);
  if (!r) return;
  if (r.activo) return pj;
  const anterior = pj.concentracionActiva?.nombreHechizo;
  return { ...pj, concentracionActiva: { idRasgoOrigen: r.id, nombreHechizo: r.nombre },
    condicionesActivas: [...pj.condicionesActivas.filter(c => !anterior || claveEstado(c) !== claveEstado(anterior)), r.condicionAlActivar ?? r.nombre],
    rasgos: pj.rasgos.map(x => x.id === id ? { ...x, activo: true, usosRestantes: (x.usosRestantes ?? x.usosMaximos ?? 0) - 1 } : x),
    efectosActivos: [...pj.efectosActivos.filter(e => !e.concentracion), { id: `activacion_${r.id}`, idRasgoOrigen: r.id,
      nombre: r.condicionAlActivar ?? r.nombre, concentracion: true, duracion: r.duracionEfectoAlActivar, expiraRonda: ronda + (r.duracionEfectoAlActivar ?? 10) }] };
}

export function opcionesLanzamientoEstado(pj: PersonajeJugador, h: HechizoBase, clase?: string) {
  return pj.rasgos.filter(r => r.lanzamientoConActivacion && (!clase || r.claseConjurosOtorgados?.toLowerCase() === clase.toLowerCase())
    && rasgoMagicoHabilitado(pj, { ...r, activo: true }) && coincideHechizoId(r.lanzamientoConActivacion.conjuroId, h.id));
}
