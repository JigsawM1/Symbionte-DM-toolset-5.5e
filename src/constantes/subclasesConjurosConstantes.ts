import { CATALOGO_CLASES_DND55 } from "./clasesDND55";

/**
 * Catálogo maestro de conjuros siempre preparados y otorgados por subclase
 * en las reglas oficiales de D&D 5.5e (2024).
 */

export interface ProgresionConjurosNivel {
  nivelClase: number;
  conjuros?: string[];
  trucos?: string[];
}

export interface DefinicionSubclaseConjuros {
  clase: string;
  subclase: string;
  progresion: ProgresionConjurosNivel[];
  variantes?: Record<string, ProgresionConjurosNivel[]>;
}

/**
 * Mapa de sinónimos y alias de traducción de conjuros para compatibilidad
 * entre nombres de D&D 2024 / 5.5e y compendios clásicos en español.
 */
export const MAPA_ALIAS_HECHIZOS: Record<string, string[]> = {
  "susurros disonantes": ["susurros discordantes", "dissonant whispers"],
  "susurros discordantes": ["susurros disonantes", "dissonant whispers"],
  "risa espantosa de tasha": ["risa horrible de tasha", "tashas hideous laughter", "risa de tasha"],
  "risa horrible de tasha": ["risa espantosa de tasha", "tashas hideous laughter", "risa de tasha"],
  "vinculo telepatico de rary": ["enlace telepatico de rary", "rarys telepathic bond"],
  "enlace telepatico de rary": ["vinculo telepatico de rary", "rarys telepathic bond"],
  "tentaculos negros de evard": ["evards black tentacles", "tentaculos negros"]
};

/**
 * Catálogo Maestro Oficial de Conjuros y Trucos otorgados por Subclases
 * derivado dinámicamente del Catálogo Maestro de Builds de Clases D&D 5.5e (2024).
 */
export const CATALOGO_CONJUROS_SUBCLASES: DefinicionSubclaseConjuros[] = CATALOGO_CLASES_DND55.flatMap((c) =>
  c.subclases
    .filter((s) => (s.progresionConjuros && s.progresionConjuros.length > 0) || s.variantesConjuros)
    .map((s) => ({
      clase: c.nombre,
      subclase: s.nombre,
      progresion: s.progresionConjuros || [],
      variantes: s.variantesConjuros
    }))
);
