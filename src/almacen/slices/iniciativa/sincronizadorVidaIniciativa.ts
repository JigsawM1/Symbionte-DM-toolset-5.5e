/**
 * sincronizadorVidaIniciativa.ts
 * ------------------------------
 * Funciones puras para proyectar modificaciones de vida, daño y vida temporal
 * desde la iniciativa hacia los personajes y sus acompañantes.
 */

import type { CriaturaIniciativa, EstadoDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos";
import { verificarReversionHpTemporal } from "@/servicios/reglasFormaSalvaje";
import { proyectarCambioEnPersonajeOAcompanante } from "./sincronizadorMovimientoIniciativa";

export function sincronizarModificacionVidaPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  nuevaVida: number
): PersonajeJugador[] {
  return proyectarCambioEnPersonajeOAcompanante(
    personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    (pj) => ({
      ...pj,
      hpActual: Math.max(0, Math.min(pj.hpMaximo, nuevaVida))
    }),
    (acomp) => ({
      ...acomp,
      vidaActual: Math.max(0, Math.min(acomp.vidaMaxima, nuevaVida))
    })
  );
}

export function sincronizarDanoPersonajes(
  personajes: PersonajeJugador[],
  criaturaPrevia: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  vidaAct: number,
  vidaTemp: number
): PersonajeJugador[] {
  return proyectarCambioEnPersonajeOAcompanante(
    personajes,
    criaturaPrevia,
    id,
    criaturaAfectadaNombre,
    (pj) =>
      verificarReversionHpTemporal(
        {
          ...pj,
          hpActual: vidaAct,
          hpTemporal: vidaTemp
        },
        vidaTemp
      ),
    (acomp) => ({
      ...acomp,
      vidaActual: vidaAct,
      vidaTemporal: vidaTemp
    })
  );
}

export function sincronizarVidaMaximaPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  vidaMaxSegura: number
): PersonajeJugador[] {
  return proyectarCambioEnPersonajeOAcompanante(
    personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    (pj) => ({
      ...pj,
      hpMaximo: vidaMaxSegura,
      hpActual: Math.min(pj.hpActual, vidaMaxSegura)
    }),
    (acomp) => ({
      ...acomp,
      vidaMaxima: vidaMaxSegura,
      vidaActual: Math.min(acomp.vidaActual, vidaMaxSegura)
    })
  );
}

export function sincronizarVidaTemporalPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  vidaTempSegura: number
): PersonajeJugador[] {
  return proyectarCambioEnPersonajeOAcompanante(
    personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    (pj) => verificarReversionHpTemporal({ ...pj, hpTemporal: vidaTempSegura }, vidaTempSegura),
    (acomp) => ({ ...acomp, vidaTemporal: vidaTempSegura })
  );
}

/**
 * Sincroniza la vida temporal de un personaje con su correspondiente fila en la cola de iniciativa.
 */
export function sincronizarVidaTemporalEnIniciativa(
  set: (fn: (state: EstadoDM) => Partial<EstadoDM>) => void,
  idPj: string,
  vidaTemporal: number
): void {
  set((state) => {
    if (!state.colaIniciativa || state.colaIniciativa.length === 0) return {};
    let huboCambio = false;
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (!c.esMonstruo && !c.esAcompanante && (c.id === idPj || c.idPersonajeDuenio === idPj)) {
        huboCambio = true;
        return { ...c, vidaTemporal };
      }
      return c;
    });
    return huboCambio ? { colaIniciativa: nuevaCola } : {};
  });
}
