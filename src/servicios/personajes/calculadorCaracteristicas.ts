/**
 * calculadorCaracteristicas.ts
 * ----------------------------
 * Cálculo puro de puntuaciones efectivas de características y sus modificadores
 * conforme a las reglas de D&D 5.5e (2024): Forma Salvaje, personalizaciones,
 * overrides fijos, límites máximos por rasgos (ej. Campeón primigenio) y
 * efectos pasivos de equipo (>= 19 piso vs bonos sumables).
 */

import type { Caracteristica, EfectoPasivo, MonstruoBase, PersonajeJugador } from "@/tipos";
import { calcularModificadorCaracteristica } from "@/servicios/procesadorDescansos";
import { calcularModificadoresStatsRasgos } from "@/servicios/rasgos/evaluadorVitalidadRasgos";
import {
  LISTA_CARACTERISTICAS,
  MAPA_ALIAS_CARAC,
  normalizarTextoEstadistica,
  type ResultadoCaracteristicasPersonaje
} from "./tiposEstadisticasPersonaje";

const CARACTERISTICAS_FISICAS_BESTIA: ReadonlySet<Caracteristica> = new Set([
  "fuerza",
  "destreza",
  "constitucion"
]);

/**
 * Resuelve puntuaciones efectivas de características y sus modificadores derivados.
 */
export function calcularCaracteristicasYModificadores(
  pj: PersonajeJugador | null | undefined,
  bestiaActiva: MonstruoBase | null,
  efectosPasivosActivos: readonly EfectoPasivo[]
): ResultadoCaracteristicasPersonaje {
  const carac = pj?.caracteristicas;
  const overrides = pj?.overridesFijos;
  const personalizacionesCarac = pj?.personalizacionesCaracteristicas || {};

  const { bonos: bonosStatsRasgos, limitesMaximos: limitesStatsRasgos } = pj
    ? calcularModificadoresStatsRasgos(pj)
    : {
        bonos: {
          fuerza: 0,
          destreza: 0,
          constitucion: 0,
          inteligencia: 0,
          sabiduria: 0,
          carisma: 0
        },
        limitesMaximos: {}
      };

  const puntuacionesEfectivas = {} as Record<Caracteristica, number>;

  for (const stat of LISTA_CARACTERISTICAS) {
    const valorBestia = CARACTERISTICAS_FISICAS_BESTIA.has(stat)
      ? bestiaActiva?.caracteristicas?.[stat]
      : undefined;
    const valorFijoPersonalizado = personalizacionesCarac[stat]?.valorFijo;
    const overrideFijo = overrides?.[stat];
    const limiteMaximo = limitesStatsRasgos[stat] || 20;
    const valorNatural = Math.min(limiteMaximo, (carac?.[stat] ?? 10) + bonosStatsRasgos[stat]);

    puntuacionesEfectivas[stat] =
      valorBestia ?? valorFijoPersonalizado ?? overrideFijo ?? valorNatural;
  }

  for (const efecto of efectosPasivosActivos) {
    const tipoNorm = normalizarTextoEstadistica(efecto.tipo || "");
    if (!tipoNorm.includes("caracteristica") && tipoNorm !== "atributo") continue;

    const caracClave = MAPA_ALIAS_CARAC[normalizarTextoEstadistica(efecto.bono || "")];
    if (!caracClave) continue;

    const valNum = Number(efecto.valor);
    if (isNaN(valNum)) continue;

    if (valNum >= 19) {
      puntuacionesEfectivas[caracClave] = Math.max(puntuacionesEfectivas[caracClave], valNum);
    } else {
      puntuacionesEfectivas[caracClave] += valNum;
    }
  }

  const modificadores = {} as Record<Caracteristica, number>;
  for (const stat of LISTA_CARACTERISTICAS) {
    modificadores[stat] =
      calcularModificadorCaracteristica(puntuacionesEfectivas[stat]) +
      (personalizacionesCarac[stat]?.modificadorExtra || 0);
  }

  return { puntuacionesEfectivas, modificadores };
}
