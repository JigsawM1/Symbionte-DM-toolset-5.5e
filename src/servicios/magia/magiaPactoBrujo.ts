import type { ClaseLanzadora } from "@/tipos";
import { TABLA_PACTO_BRUJO, esClasePacto } from "@/constantes";
import { acotarNivelClase } from "./catalogoProgresionMagica";
import { calcularEspaciosConjuro, calcularPuntosConjuro } from "./calculadorRanurasMulticlase";
import type { InfoEspaciosPacto, RecursosMagicosUnificados } from "./tiposMagia";

/**
 * Determina si una clase lanzadora pertenece al subsistema de Magia de Pacto (Brujo).
 */
export function esLanzadorDePacto(
  claseItem: Pick<ClaseLanzadora, "clase" | "tipoLanzador">
): boolean {
  return claseItem.tipoLanzador === "pacto" || esClasePacto(claseItem.clase);
}

/**
 * Calcula los espacios de Magia del Pacto del Brujo según su nivel de clase (1-20).
 */
export function calcularEspaciosPacto(nivelBrujo: number): InfoEspaciosPacto {
  const nivelSeguro = acotarNivelClase(nivelBrujo);
  const info = TABLA_PACTO_BRUJO[nivelSeguro] || { espacios: 1, nivel: 1 };
  return {
    espacios: info.espacios,
    nivel: info.nivel
  };
}

/**
 * Obtiene los niveles de Arcano Místico disponibles para un Brujo según su nivel de clase:
 * - Nivel 11+: Nivel 6
 * - Nivel 13+: Nivel 7
 * - Nivel 15+: Nivel 8
 * - Nivel 17+: Nivel 9
 */
export function obtenerNivelesArcanoMisticoDisponibles(nivelBrujo: number): number[] {
  return [6, 7, 8, 9].filter((lvl) => nivelBrujo >= 11 + (lvl - 6) * 2);
}

/**
 * Calcula de forma unificada todos los recursos mágicos (Estándar + Pacto Brujo + Puntos DMG).
 */
export function calcularTodosRecursosMagicos(
  clasesLanzadoras: readonly ClaseLanzadora[],
  overrideEspacios?: Record<string, number> | null,
  overridePuntos?: number | null
): RecursosMagicosUnificados {
  if (!clasesLanzadoras || clasesLanzadoras.length === 0) {
    return {
      espaciosConjuroMaximos: overrideEspacios || {},
      puntosConjuroMaximos: overridePuntos || 0,
      nivelConjuroMaximo: 0,
      espaciosPactoMaximos: 0,
      nivelEspacioPacto: 0
    };
  }

  const espacios = calcularEspaciosConjuro(clasesLanzadoras, overrideEspacios);
  const puntos = calcularPuntosConjuro(clasesLanzadoras, overridePuntos);
  const claseBrujo = clasesLanzadoras.find(esLanzadorDePacto);

  const pacto = claseBrujo
    ? calcularEspaciosPacto(claseBrujo.nivel)
    : { espacios: 0, nivel: 0 };

  return {
    espaciosConjuroMaximos: espacios,
    puntosConjuroMaximos: puntos.puntosMaximos,
    nivelConjuroMaximo: puntos.nivelMaximo,
    espaciosPactoMaximos: pacto.espacios,
    nivelEspacioPacto: pacto.nivel
  };
}
