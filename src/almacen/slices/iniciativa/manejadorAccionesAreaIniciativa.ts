/**
 * manejadorAccionesAreaIniciativa.ts
 * ----------------------------------
 * Despachadores de mutación para aplicaciones de daño, condiciones y efectos en área.
 */

import type { EfectoActivo, EstadoDM } from "@/almacen/usarAlmacenDM";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { generarId } from "@/utiles/generarId";
import {
  obtenerIdsObjetivoMasivo,
  aplicarTransformacionEnArea
} from "./resolutorAreaIniciativa";
import { aplicarEfectoAPersonaje } from "./sincronizadorEfectosIniciativa";

export function despacharAplicarDanoEnArea(
  state: EstadoDM,
  _get: () => EstadoDM,
  cantidad: number,
  idsObjetivo?: string[]
): Partial<EstadoDM> {
  if (state.colaIniciativa.length === 0 || cantidad === 0) return {};
  return aplicarTransformacionEnArea(state, idsObjetivo, (c) => {
    if (cantidad > 0) {
      let dañoRestante = cantidad;
      let vidaTemp = c.vidaTemporal || 0;
      let vidaAct = c.vidaActual;
      if (vidaTemp > 0) {
        if (vidaTemp >= dañoRestante) {
          vidaTemp -= dañoRestante;
          dañoRestante = 0;
        } else {
          dañoRestante -= vidaTemp;
          vidaTemp = 0;
        }
      }
      if (dañoRestante > 0) {
        vidaAct = Math.max(0, vidaAct - dañoRestante);
      }
      return { ...c, vidaTemporal: vidaTemp, vidaActual: vidaAct };
    } else {
      const curacion = Math.abs(cantidad);
      return { ...c, vidaActual: Math.min(c.vidaMaxima, c.vidaActual + curacion) };
    }
  });
}

export function despacharAplicarCondicionEnArea(
  state: EstadoDM,
  condicion: string,
  idsObjetivo?: string[]
): Partial<EstadoDM> {
  if (state.colaIniciativa.length === 0 || !condicion.trim()) return {};
  const condTrimmed = condicion.trim();
  const targets = obtenerIdsObjetivoMasivo(
    state.colaIniciativa,
    state.indiceTurnoActivo,
    state.criaturasSeleccionadas,
    idsObjetivo
  );
  if (targets.size === 0) return {};

  const nuevaCola = state.colaIniciativa.map((c) =>
    targets.has(c.id) ? { ...c, condiciones: aplicarCondicion(c.condiciones, condTrimmed) } : c
  );

  const criaturasAfectadas = state.colaIniciativa.filter((c) => targets.has(c.id));
  const nuevosPersonajes = state.personajes.map((pj) => {
    const coincide = criaturasAfectadas.some((c) => {
      const cNom = (c.nombre || "").trim().toLowerCase();
      return (
        pj.id === c.id ||
        (Boolean(pj.idMiniaturaTS) && pj.idMiniaturaTS === c.id) ||
        (Boolean(cNom) && (pj.nombre || "").trim().toLowerCase() === cNom)
      );
    });
    if (coincide) {
      return {
        ...pj,
        condicionesActivas: aplicarCondicion(pj.condicionesActivas || [], condTrimmed)
      };
    }
    return pj;
  });

  return { colaIniciativa: nuevaCola, personajes: nuevosPersonajes };
}

export function despacharAplicarEfectoEnArea(
  state: EstadoDM,
  nombreEfecto: string,
  duracion: number,
  opciones?: { concentracion?: boolean },
  idsObjetivo?: string[]
): Partial<EstadoDM> {
  if (state.colaIniciativa.length === 0 || !nombreEfecto.trim()) return {};
  const esConcentracion =
    opciones?.concentracion ||
    nombreEfecto.toLowerCase().trim() === "concentración" ||
    nombreEfecto.toLowerCase().trim() === "concentracion";

  const targets = obtenerIdsObjetivoMasivo(
    state.colaIniciativa,
    state.indiceTurnoActivo,
    state.criaturasSeleccionadas,
    idsObjetivo
  );
  if (targets.size === 0) return {};

  const nuevoEfectoId = generarId(nombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20));
  const nuevoEfecto: EfectoActivo = {
    id: nuevoEfectoId,
    nombre: nombreEfecto,
    expiraRonda: esConcentracion ? undefined : state.rondaActual + duracion,
    concentracion: esConcentracion || undefined
  };

  const nuevaCola = state.colaIniciativa.map((c) => {
    if (!targets.has(c.id)) return c;
    const nombreLimpio = nombreEfecto.split(" (")[0].toLowerCase().trim();
    const condicionesActualizadas = (c.condiciones || []).filter((cond) => {
      if (esConcentracion && cond.toLowerCase().includes("concentra")) return false;
      const condLimpia = cond.split(" (")[0].toLowerCase().trim();
      if (condLimpia === nombreLimpio || cond.toLowerCase().trim() === nombreEfecto.toLowerCase().trim()) return false;
      return true;
    });
    return { ...c, condiciones: condicionesActualizadas, efectos: [...(c.efectos ?? []), nuevoEfecto] };
  });

  const criaturasAfectadas = state.colaIniciativa.filter((c) => targets.has(c.id));
  const nuevosPersonajes = state.personajes.map((pj) => {
    const coincide = criaturasAfectadas.some((c) => {
      const cNom = (c.nombre || "").trim().toLowerCase();
      return (
        pj.id === c.id ||
        (Boolean(pj.idMiniaturaTS) && pj.idMiniaturaTS === c.id) ||
        (Boolean(cNom) && (pj.nombre || "").trim().toLowerCase() === cNom)
      );
    });
    if (coincide) {
      return aplicarEfectoAPersonaje(pj, nombreEfecto, nuevoEfecto, esConcentracion);
    }
    return pj;
  });

  return { colaIniciativa: nuevaCola, personajes: nuevosPersonajes };
}
