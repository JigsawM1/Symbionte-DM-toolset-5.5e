/**
 * sincronizadorVidaIniciativa.ts
 * ------------------------------
 * Funciones puras para proyectar modificaciones de vida, daño y vida temporal
 * desde la iniciativa hacia los personajes y sus acompañantes.
 */

import type { CriaturaIniciativa, EstadoDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos";
import { verificarReversionHpTemporal } from "@/servicios/reglasFormaSalvaje";
import {
  coincidePersonajeEnIniciativa,
  coincideAcompananteEnIniciativa
} from "./sincronizadorMovimientoIniciativa";

export function sincronizarModificacionVidaPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  nuevaVida: number
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const coincidePj = coincidePersonajeEnIniciativa(pj, criaturaObjetivo, id, criaturaAfectadaNombre);
    if (coincidePj) {
      return {
        ...pj,
        hpActual: Math.max(0, Math.min(pj.hpMaximo, nuevaVida))
      };
    }

    if (!criaturaObjetivo?.esAcompanante && !criaturaObjetivo?.idAcompanante) {
      return pj;
    }

    let acompModificado = false;
    const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
      const coincideAcomp = coincideAcompananteEnIniciativa(acomp, criaturaObjetivo, id, criaturaAfectadaNombre);
      if (coincideAcomp) {
        acompModificado = true;
        return {
          ...acomp,
          vidaActual: Math.max(0, Math.min(acomp.vidaMaxima, nuevaVida))
        };
      }
      return acomp;
    });

    if (acompModificado) {
      return { ...pj, acompanantes: nuevosAcomps };
    }

    return pj;
  });
}

export function sincronizarDanoPersonajes(
  personajes: PersonajeJugador[],
  criaturaPrevia: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  vidaAct: number,
  vidaTemp: number
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const coincidePj = coincidePersonajeEnIniciativa(pj, criaturaPrevia, id, criaturaAfectadaNombre);
    if (coincidePj) {
      const modificado: PersonajeJugador = {
        ...pj,
        hpActual: vidaAct,
        hpTemporal: vidaTemp
      };
      return verificarReversionHpTemporal(modificado, vidaTemp);
    }

    if (!criaturaPrevia?.esAcompanante && !criaturaPrevia?.idAcompanante) {
      return pj;
    }

    let acompModificado = false;
    const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
      const coincideAcomp = coincideAcompananteEnIniciativa(acomp, criaturaPrevia, id, criaturaAfectadaNombre);
      if (coincideAcomp) {
        acompModificado = true;
        return {
          ...acomp,
          vidaActual: vidaAct,
          vidaTemporal: vidaTemp
        };
      }
      return acomp;
    });

    if (acompModificado) {
      return { ...pj, acompanantes: nuevosAcomps };
    }

    return pj;
  });
}

export function sincronizarVidaMaximaPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  vidaMaxSegura: number
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const coincidePj = coincidePersonajeEnIniciativa(pj, criaturaObjetivo, id, criaturaAfectadaNombre);
    if (coincidePj) {
      return {
        ...pj,
        hpMaximo: vidaMaxSegura,
        hpActual: Math.min(pj.hpActual, vidaMaxSegura)
      };
    }

    if (!criaturaObjetivo?.esAcompanante && !criaturaObjetivo?.idAcompanante) {
      return pj;
    }

    let acompModificado = false;
    const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
      const coincideAcomp = coincideAcompananteEnIniciativa(acomp, criaturaObjetivo, id, criaturaAfectadaNombre);
      if (coincideAcomp) {
        acompModificado = true;
        return {
          ...acomp,
          vidaMaxima: vidaMaxSegura,
          vidaActual: Math.min(acomp.vidaActual, vidaMaxSegura)
        };
      }
      return acomp;
    });

    if (acompModificado) {
      return { ...pj, acompanantes: nuevosAcomps };
    }

    return pj;
  });
}

export function sincronizarVidaTemporalPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  vidaTempSegura: number
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const coincidePj = coincidePersonajeEnIniciativa(pj, criaturaObjetivo, id, criaturaAfectadaNombre);
    if (coincidePj) {
      const modificado: PersonajeJugador = { ...pj, hpTemporal: vidaTempSegura };
      return verificarReversionHpTemporal(modificado, vidaTempSegura);
    }

    if (!criaturaObjetivo?.esAcompanante && !criaturaObjetivo?.idAcompanante) {
      return pj;
    }

    let acompModificado = false;
    const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
      const coincideAcomp = coincideAcompananteEnIniciativa(acomp, criaturaObjetivo, id, criaturaAfectadaNombre);
      if (coincideAcomp) {
        acompModificado = true;
        return { ...acomp, vidaTemporal: vidaTempSegura };
      }
      return acomp;
    });

    if (acompModificado) {
      return { ...pj, acompanantes: nuevosAcomps };
    }

    return pj;
  });
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
