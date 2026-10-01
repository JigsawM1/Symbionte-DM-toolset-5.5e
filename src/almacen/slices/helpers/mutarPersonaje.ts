import type { PersonajeJugador } from "@/tipos";

export interface EstadoConPersonajes {
  personajes: PersonajeJugador[];
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
    const pjNuevo = mutador(pjPrev);
    if (pjNuevo === pjPrev) return state;
    return {
      ...state,
      personajes: state.personajes.map((pj) => (pj.id === id ? pjNuevo : pj))
    };
  });
}
