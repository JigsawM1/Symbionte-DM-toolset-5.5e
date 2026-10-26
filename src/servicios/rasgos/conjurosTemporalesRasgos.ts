import type { HechizoBase, PersonajeJugador } from "@/tipos";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { claveEstado } from "./estadoCondicionesRasgos";

export function obtenerAtaquePosterior(pj: PersonajeJugador, idRasgo: string | undefined, h: HechizoBase) {
  if (!h.permiteAtaquePosterior) return;
  return pj.rasgos.find(r => r.id === idRasgo && rasgoMagicoHabilitado(pj, r)
    && r.conjurosTemporales?.some(e => e.conjuroId === h.id));
}

export function normalizarConjurosTemporales(pj: PersonajeJugador, ronda?: number): PersonajeJugador {
  let cambio = false;
  const rasgos = (pj.rasgos ?? []).map(r => {
    if (!r.conjurosTemporales?.length) return r;
    const impedido = !rasgoMagicoHabilitado(pj, r) || !r.lanzamientoConRecurso?.duracionRondas
      || (r.lanzamientoConRecurso.finalizarAlMorir && pj.salvacionesMuerte?.fallos >= 3)
      || r.lanzamientoConRecurso.finalizarConCondiciones?.some(c => pj.condicionesActivas.some(a => claveEstado(c) === claveEstado(a)));
    const conservados = r.conjurosTemporales.filter(e => !impedido && (ronda === undefined || e.expiraRonda > ronda));
    if (conservados.length === r.conjurosTemporales.length) return r;
    cambio = true;
    return { ...r, conjurosTemporales: conservados };
  });
  return cambio ? { ...pj, rasgos } : pj;
}

/** Permite finalizar el efecto al transcurrir su duración fuera de iniciativa. */
export function finalizarConjuroTemporal(pj: PersonajeJugador, idRasgo: string, conjuroId: string): PersonajeJugador | undefined {
  const r = pj.rasgos.find(r => r.id === idRasgo);
  if (!r?.conjurosTemporales?.some(e => e.conjuroId === conjuroId)) return;
  return { ...pj, rasgos: pj.rasgos.map(a => a.id === idRasgo ? { ...a,
    conjurosTemporales: a.conjurosTemporales?.filter(e => e.conjuroId !== conjuroId) } : a) };
}
