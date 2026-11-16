import type { ClaseLanzadora } from "@/tipos";
import {
  COSTE_PUNTOS_POR_NIVEL,
  TABLA_ESPACIOS_CONJURO,
  TABLA_PUNTOS_CONJURO
} from "@/constantes";
import { ESTRATEGIAS_TIPO_LANZADOR } from "./catalogoProgresionMagica";

/**
 * Calcula el nivel de lanzador combinado para reglas de multiclase (D&D 5.5e).
 * - Completo (Bardo, Clérigo, Druida, Hechicero, Mago): nivel * 1
 * - Medio (Explorador, Paladín): ceil(nivel / 2) en monoclase (desde Nv 1 en 2024), floor(nivel / 2) en multiclase
 * - Tercio (Caballero Arcano, Embaucador Arcano): floor(nivel / 3) en regla multiclase
 * - Magia de Pacto (Brujo): NO se combina (se gestiona por separado)
 */
export function calcularNivelLanzadorMulticlase(
  clasesLanzadoras: readonly ClaseLanzadora[]
): number {
  if (!clasesLanzadoras || clasesLanzadoras.length === 0) return 0;

  if (clasesLanzadoras.length === 1) {
    const claseUnica = clasesLanzadoras[0];
    const estrategia = ESTRATEGIAS_TIPO_LANZADOR[claseUnica.tipoLanzador];
    return estrategia ? Math.min(20, Math.max(0, estrategia.calcularNivelEnMonoclase(claseUnica.nivel))) : 0;
  }

  let totalNivel = 0;
  for (const item of clasesLanzadoras) {
    const estrategia = ESTRATEGIAS_TIPO_LANZADOR[item.tipoLanzador];
    if (estrategia) {
      totalNivel += estrategia.calcularAporteEnMulticlase(item.nivel);
    }
  }

  return Math.min(20, Math.max(0, totalNivel));
}

/**
 * Resuelve el nivel de lanzador efectivo para tablas de espacios y puntos de conjuro,
 * delegando en la estrategia declarativa cuando es monoclase.
 */
export function calcularNivelLanzadorEfectivo(
  clasesLanzadoras: readonly ClaseLanzadora[]
): number {
  if (clasesLanzadoras?.length === 1) {
    const claseUnica = clasesLanzadoras[0];
    const estrategia = ESTRATEGIAS_TIPO_LANZADOR[claseUnica.tipoLanzador];
    return estrategia
      ? Math.min(20, Math.max(0, estrategia.calcularNivelEfectivoRanurasMonoclase(claseUnica.nivel)))
      : 0;
  }

  return calcularNivelLanzadorMulticlase(clasesLanzadoras);
}

/**
 * Aplica overrides manuales sobre una tabla base de espacios de conjuro sin mutarla.
 */
function aplicarOverridesEspacios(
  espaciosBase: Record<string, number>,
  overrides?: Record<string, number> | null
): Record<string, number> {
  if (!overrides) return espaciosBase;

  const resultado: Record<string, number> = { ...espaciosBase };
  for (const [clave, valor] of Object.entries(overrides)) {
    if (typeof valor === "number" && valor >= 0) {
      if (valor > 0) {
        resultado[clave] = valor;
      } else {
        delete resultado[clave];
      }
    }
  }
  return resultado;
}

/**
 * Calcula los espacios de conjuro disponibles por nivel de ranura (1-9).
 * Permite aplicar overrides manuales definidos por el usuario.
 */
export function calcularEspaciosConjuro(
  clasesLanzadoras: readonly ClaseLanzadora[],
  overrides?: Record<string, number> | null
): Record<string, number> {
  const nivelLanzador = calcularNivelLanzadorEfectivo(clasesLanzadoras);
  const espaciosBase: Record<string, number> = {};

  if (nivelLanzador > 0) {
    const tablaNivel = TABLA_ESPACIOS_CONJURO[nivelLanzador] || {};
    for (let niv = 1; niv <= 9; niv++) {
      const cantidad = tablaNivel[niv] || 0;
      if (cantidad > 0) {
        espaciosBase[String(niv)] = cantidad;
      }
    }
  }

  return aplicarOverridesEspacios(espaciosBase, overrides);
}

/**
 * Calcula los puntos de conjuro totales y el nivel máximo de conjuro permitido (variante DMG).
 */
export function calcularPuntosConjuro(
  clasesLanzadoras: readonly ClaseLanzadora[],
  overridePuntos?: number | null
): { puntosMaximos: number; nivelMaximo: number } {
  const nivelLanzador = calcularNivelLanzadorEfectivo(clasesLanzadoras);
  const infoBase = TABLA_PUNTOS_CONJURO[nivelLanzador] || { puntos: 0, nivelMax: 0 };

  const puntosFinales =
    typeof overridePuntos === "number" && overridePuntos >= 0
      ? overridePuntos
      : infoBase.puntos;

  return {
    puntosMaximos: puntosFinales,
    nivelMaximo: infoBase.nivelMax
  };
}

/**
 * Retorna el coste en puntos de conjuro para un nivel de conjuro específico (1 a 9).
 */
export function obtenerCostePuntos(nivelConjuro: number): number {
  if (nivelConjuro <= 0) return 0;
  return COSTE_PUNTOS_POR_NIVEL[nivelConjuro] ?? 0;
}
