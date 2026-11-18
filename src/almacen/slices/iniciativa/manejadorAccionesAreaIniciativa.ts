/**
 * manejadorAccionesAreaIniciativa.ts
 * ----------------------------------
 * Despachadores de mutación para aplicaciones de daño, condiciones y efectos en área.
 */

import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { esCriaturaHorda, sincronizarAgregadosHorda } from "@/servicios/combateHordas";
import {
  obtenerIdsObjetivoMasivo,
  aplicarTransformacionEnArea
} from "./resolutorAreaIniciativa";
import { aplicarEfectoAPersonaje } from "./sincronizadorEfectosIniciativa";
import { coincidePersonajeConCriaturaArea } from "./sincronizadorMovimientoIniciativa";
import {
  aplicarDanoACriaturaIndividual,
  construirEfectoCombate,
  filtrarCondicionesSolapadasPorEfecto
} from "./utilidadesCombateIniciativa";

export function despacharAplicarDanoEnArea(
  state: EstadoDM,
  cantidad: number,
  idsObjetivo?: string[],
  limiteMiembrosHorda?: number
): Partial<EstadoDM> {
  if (state.colaIniciativa.length === 0 || cantidad === 0) return {};
  return aplicarTransformacionEnArea(state, idsObjetivo, (c) => {
    if (esCriaturaHorda(c) && c.barrasVida && c.barrasVida.length > 1) {
      const barras = c.barrasVida.map((b) => ({ ...b }));
      const indicesVivos: number[] = [];
      for (let i = 0; i < barras.length; i++) {
        if (barras[i].vidaActual > 0) indicesVivos.push(i);
      }
      const maxAfectar = limiteMiembrosHorda && limiteMiembrosHorda > 0
        ? Math.min(indicesVivos.length, Math.trunc(limiteMiembrosHorda))
        : indicesVivos.length;

      for (let i = 0; i < maxAfectar; i++) {
        const barra = barras[indicesVivos[i]];
        if (cantidad > 0) {
          const res = aplicarDanoACriaturaIndividual(barra, cantidad);
          barra.vidaActual = res.vidaActual;
          barra.vidaTemporal = res.vidaTemporal;
        } else {
          barra.vidaActual = Math.min(barra.vidaMaxima, barra.vidaActual + Math.abs(cantidad));
        }
      }
      return { ...c, ...sincronizarAgregadosHorda(barras, c.indiceBarraActiva ?? 0, true) };
    }

    if (cantidad > 0) {
      return { ...c, ...aplicarDanoACriaturaIndividual(c, cantidad) };
    }
    return { ...c, vidaActual: Math.min(c.vidaMaxima, c.vidaActual + Math.abs(cantidad)) };
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
    const coincide = criaturasAfectadas.some((c) => coincidePersonajeConCriaturaArea(pj, c, state.personajes));
    return coincide
      ? { ...pj, condicionesActivas: aplicarCondicion(pj.condicionesActivas || [], condTrimmed) }
      : pj;
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
  const targets = obtenerIdsObjetivoMasivo(
    state.colaIniciativa,
    state.indiceTurnoActivo,
    state.criaturasSeleccionadas,
    idsObjetivo
  );
  if (targets.size === 0) return {};

  const { efecto: nuevoEfecto, esConcentracion } = construirEfectoCombate(
    nombreEfecto,
    duracion,
    state.rondaActual,
    opciones
  );

  const nuevaCola = state.colaIniciativa.map((c) => {
    if (!targets.has(c.id)) return c;
    const condicionesActualizadas = filtrarCondicionesSolapadasPorEfecto(
      c.condiciones,
      nombreEfecto,
      esConcentracion
    );
    return { ...c, condiciones: condicionesActualizadas, efectos: [...(c.efectos ?? []), nuevoEfecto] };
  });

  const criaturasAfectadas = state.colaIniciativa.filter((c) => targets.has(c.id));
  const nuevosPersonajes = state.personajes.map((pj) => {
    const coincide = criaturasAfectadas.some((c) => coincidePersonajeConCriaturaArea(pj, c, state.personajes));
    return coincide ? aplicarEfectoAPersonaje(pj, nombreEfecto, nuevoEfecto, esConcentracion) : pj;
  });

  return { colaIniciativa: nuevaCola, personajes: nuevosPersonajes };
}
