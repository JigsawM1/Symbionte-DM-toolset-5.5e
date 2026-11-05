/**
 * sincronizadorMovimientoIniciativa.ts
 * ------------------------------------
 * Funciones puras de coincidencia de personajes y reinicio de movimiento entre rondas.
 */

import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, RegistroMovimiento } from "@/tipos";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";

export function coincidePersonajeEnIniciativa(
  pj: PersonajeJugador,
  criatura: CriaturaIniciativa | undefined,
  id: string,
  nombre: string
): boolean {
  return Boolean(
    !criatura?.esAcompanante &&
    !criatura?.idAcompanante &&
    (pj.id === id ||
      pj.idMiniaturaTS === id ||
      (criatura?.idPersonajeDuenio && pj.id === criatura.idPersonajeDuenio) ||
      coincidenNombresTaleSpire(pj.nombre, nombre))
  );
}

export function coincideAcompananteEnIniciativa(
  acomp: PersonajeJugador["acompanantes"][number],
  criatura: CriaturaIniciativa | undefined,
  id: string,
  nombre: string
): boolean {
  return Boolean(
    acomp.id === id ||
    (criatura?.idAcompanante && acomp.id === criatura.idAcompanante) ||
    (acomp.idMiniaturaTS && acomp.idMiniaturaTS === id) ||
    coincidenNombresTaleSpire(acomp.nombre, nombre)
  );
}

export function esCondicionDerribado(texto: string): boolean {
  const tNorm = (texto || "").toLowerCase().trim();
  return tNorm.includes("derribad") || tNorm.includes("prone") || tNorm === "caido" || tNorm === "caído";
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
