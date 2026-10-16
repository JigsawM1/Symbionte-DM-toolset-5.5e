import type { Caracteristica, Habilidad, PersonajeJugador } from "@/tipos";
import { MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes/personajeConstantes";
import { obtenerHabilidadesConFuerzaRasgos } from "./evaluadorSalvacionesRasgos";

/** El bono derivado ya incluye equipo, competencia y personalizaciones: solo cambia el atributo. */
export function resolverTiradaHabilidadRasgos(pj: PersonajeJugador, habilidad: Habilidad,
  modificadores: Record<Caracteristica, number>, bonoCalculado: number, elegida?: Caracteristica, habilidadesConFuerza?: ReadonlySet<string>
): { caracteristica: Caracteristica; bono: number; opciones: Array<{ caracteristica: Caracteristica; bono: number }> } {
  const habitual = MAPA_HABILIDAD_A_CARACTERISTICA[habilidad];
  const fija = pj.personalizacionesHabilidades?.[habilidad]?.valorFijo;
  const alternativa = habitual !== "fuerza" && fija == null && (habilidadesConFuerza ?? obtenerHabilidadesConFuerzaRasgos(pj)).has(habilidad);
  if (!alternativa) return { caracteristica: habitual, bono: bonoCalculado, opciones: [] };
  const resto = bonoCalculado - Math.max(modificadores[habitual], modificadores.fuerza);
  const opciones = [habitual, "fuerza" as const].map(caracteristica => ({ caracteristica, bono: resto + modificadores[caracteristica] }));
  const predeterminada = modificadores.fuerza >= modificadores[habitual] ? "fuerza" : habitual;
  const opcion = opciones.find(o => o.caracteristica === (elegida ?? predeterminada)) ?? opciones[0];
  return { ...opcion, opciones };
}
