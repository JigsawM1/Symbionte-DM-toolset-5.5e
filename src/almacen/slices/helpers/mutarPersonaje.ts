import type { PersonajeJugador } from "@/tipos";

export interface EstadoConPersonajes {
  personajes: PersonajeJugador[];
}

/**
 * Helper centralizado para mutar un personaje específico por su ID dentro del array de personajes de Zustand.
 * Elimina el boilerplate repetitivo de `set((state) => ({ personajes: state.personajes.map(...) }))`.
 */
export function mutarPersonaje<T extends EstadoConPersonajes>(
  set: (fn: (state: T) => Partial<T>) => void,
  id: string,
  mutador: (pj: PersonajeJugador) => PersonajeJugador
): void {
  set((state) => ({
    personajes: state.personajes.map((pj) => (pj.id === id ? mutador(pj) : pj))
  } as unknown as Partial<T>));
}
