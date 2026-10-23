import { normalizarCondicionesRasgos } from "@/servicios/rasgos/estadoCondicionesRasgos";
import { normalizarMecanicasRasgos } from "@/servicios/rasgos/normalizarMecanicasRasgos";
import type { PersonajeJugador } from "@/tipos";
import type { CatalogoEleccionesConjuros } from "@/servicios/rasgos/listasConjurosRasgos";

export interface EstadoConPersonajes {
  personajes: PersonajeJugador[];
  baseDatosHechizos?: CatalogoEleccionesConjuros;
}

/**
 * Helper centralizado para mutar un personaje específico por su ID dentro del array de personajes de Zustand.
 * Elimina el boilerplate repetitivo de `set((state) => ({ personajes: state.personajes.map(...) }))`.
 */
export function mutarPersonaje<T extends EstadoConPersonajes>(
  set: (fn: (state: T) => Partial<T> | T) => void,
  id: string,
  mutador: (pj: PersonajeJugador) => PersonajeJugador
): void {
  set((state) => {
    const pjPrev = state.personajes.find((p) => p.id === id);
    if (!pjPrev) return state;
    const pjNuevo = normalizarMecanicasRasgos(pjPrev, normalizarCondicionesRasgos(mutador(pjPrev)), state.baseDatosHechizos);
    if (pjNuevo === pjPrev) return state;
    return {
      ...state,
      personajes: state.personajes.map((pj) => (pj.id === id ? pjNuevo : pj))
    };
  });
}
