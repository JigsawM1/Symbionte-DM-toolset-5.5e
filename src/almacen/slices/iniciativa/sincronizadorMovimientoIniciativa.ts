/**
 * sincronizadorMovimientoIniciativa.ts
 * ------------------------------------
 * Funciones puras de coincidencia de personajes y reinicio de movimiento entre rondas.
 */

import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, RegistroMovimiento } from "@/tipos";

export function coincidePersonajeEnIniciativa(
  pj: PersonajeJugador,
  criatura: CriaturaIniciativa | undefined,
  id: string,
  _nombre: string
): boolean {
  return Boolean(
    !criatura?.esAcompanante &&
    !criatura?.idAcompanante &&
    (pj.id.toLowerCase() === id.toLowerCase() ||
      pj.idMiniaturaTS?.toLowerCase() === id.toLowerCase() ||
      (criatura?.idPersonajeDuenio && pj.id === criatura.idPersonajeDuenio))
  );
}

export function coincideAcompananteEnIniciativa(
  acomp: PersonajeJugador["acompanantes"][number],
  criatura: CriaturaIniciativa | undefined,
  id: string,
  _nombre: string
): boolean {
  return Boolean(
    acomp.id.toLowerCase() === id.toLowerCase() ||
    (criatura?.idAcompanante && acomp.id === criatura.idAcompanante) ||
    (acomp.idMiniaturaTS && acomp.idMiniaturaTS.toLowerCase() === id.toLowerCase())
  );
}

export function esCondicionDerribado(texto: string): boolean {
  const tNorm = (texto || "").toLowerCase().trim();
  return tNorm.includes("derribad") || tNorm.includes("prone") || tNorm === "caido" || tNorm === "caído";
}

/**
 * Determina si un personaje jugador coincide con una criatura afectada en operaciones de área.
 */
export function coincidePersonajeConCriaturaArea(
  pj: PersonajeJugador,
  criatura: CriaturaIniciativa
): boolean {
  if (coincidePersonajeEnIniciativa(pj, criatura, criatura.id, criatura.nombre)) {
    return true;
  }
  if (criatura.esAcompanante || criatura.idAcompanante) {
    return false;
  }
  const cNom = (criatura.nombre || "").trim().toLowerCase();
  return Boolean(cNom) && (pj.nombre || "").trim().toLowerCase() === cNom;
}

/**
 * Helper de orden superior que proyecta una mutación pura desde la cola de iniciativa
 * hacia el personaje jugador o acompañante coincidente sin duplicar iteraciones.
 */
export function proyectarCambioEnPersonajeOAcompanante(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  nombre: string,
  actualizarPj: (pj: PersonajeJugador) => PersonajeJugador,
  actualizarAcomp?: (
    acomp: PersonajeJugador["acompanantes"][number]
  ) => PersonajeJugador["acompanantes"][number]
): PersonajeJugador[] {
  return personajes.map((pj) => {
    if (coincidePersonajeEnIniciativa(pj, criaturaObjetivo, id, nombre)) {
      return actualizarPj(pj);
    }

    if (!actualizarAcomp || (!criaturaObjetivo?.esAcompanante && !criaturaObjetivo?.idAcompanante)) {
      return pj;
    }

    let acompModificado = false;
    const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
      if (coincideAcompananteEnIniciativa(acomp, criaturaObjetivo, id, nombre)) {
        acompModificado = true;
        return actualizarAcomp(acomp);
      }
      return acomp;
    });

    return acompModificado ? { ...pj, acompanantes: nuevosAcomps } : pj;
  });
}

export function restablecerMovimientoPersonajes(personajes: PersonajeJugador[], motivo: string): PersonajeJugador[] {
  let huboCambios = false;
  const nuevos = personajes.map((pj) => {
    const anteriorGastado = pj.movimientoGastado || 0;
    const teniaCarrera = pj.movimientoMaximoTemporal !== null && pj.movimientoMaximoTemporal !== undefined;

    let acompCambiados = false;
    const nuevosAcomp = (pj.acompanantes || []).map((acomp) => {
      const acompGastado = acomp.movimientoGastado || 0;
      const acompCarrera = acomp.movimientoMaximoTemporal !== null && acomp.movimientoMaximoTemporal !== undefined;
      if (acompGastado === 0 && !acompCarrera) return acomp;
      acompCambiados = true;
      const entradaAcomp: RegistroMovimiento = {
        id: `mov-acomp-rst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        tipo: "reinicio",
        delta: -acompGastado,
        anteriorGastado: acompGastado,
        nuevoGastado: 0,
        descripcion: motivo
      };
      const histPrev = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];
      return {
        ...acomp,
        movimientoGastado: 0,
        movimientoMaximoTemporal: null,
        historialMovimiento: [...histPrev.slice(-49), entradaAcomp]
      };
    });

    if (anteriorGastado === 0 && !teniaCarrera && !acompCambiados) {
      return pj;
    }
    huboCambios = true;
    const entradaHistorial: RegistroMovimiento = {
      id: `mov-rst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      tipo: "reinicio",
      delta: -anteriorGastado,
      anteriorGastado,
      nuevoGastado: 0,
      descripcion: motivo
    };
    const historialPrevio = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];
    return {
      ...pj,
      movimientoGastado: 0,
      movimientoMaximoTemporal: null,
      acompanantes: acompCambiados ? nuevosAcomp : pj.acompanantes,
      historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
    };
  });
  return huboCambios ? nuevos : personajes;
}
