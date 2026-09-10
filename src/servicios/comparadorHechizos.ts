import { generarIdSlug } from "@/utiles/generarId";
import { MAPA_ALIAS_HECHIZOS } from "@/constantes/subclasesConjurosConstantes";

/**
 * Compara dos identificadores o nombres de conjuro tolerando diferencias de slug,
 * mayúsculas, tildes/diacríticos y sinónimos de traducción oficiales
 * (ej. "h_bendicion" === "Bendición" === "bendicion", "Susurros disonantes" === "Susurros discordantes").
 */
export function coincideHechizoId(idA: string, idB: string): boolean {
  if (!idA || !idB) return false;
  if (idA === idB) return true;

  const normA = idA.toLowerCase().trim();
  const normB = idB.toLowerCase().trim();
  if (normA === normB) return true;

  const sinTildesA = normA.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sinTildesB = normB.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (sinTildesA === sinTildesB) return true;

  // Si un ID ya viene prefijado con "h_" o "h-", extraer el cuerpo para slugging limpio
  const limpiarPrefijo = (s: string): string => {
    if (s.startsWith("h_") || s.startsWith("h-")) return s.substring(2);
    return s;
  };
  const limpioA = limpiarPrefijo(sinTildesA);
  const limpioB = limpiarPrefijo(sinTildesB);

  if (limpioA === limpioB) return true;

  const slugA = generarIdSlug("h", limpioA);
  const slugB = generarIdSlug("h", limpioB);
  if (slugA === slugB) return true;

  // Verificación de sinónimos/alias oficiales
  const aliasA = MAPA_ALIAS_HECHIZOS[limpioA] || MAPA_ALIAS_HECHIZOS[sinTildesA] || [];
  if (
    aliasA.some((al) => {
      const limAl = al.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return limAl === limpioB || generarIdSlug("h", limAl) === slugB;
    })
  ) {
    return true;
  }

  const aliasB = MAPA_ALIAS_HECHIZOS[limpioB] || MAPA_ALIAS_HECHIZOS[sinTildesB] || [];
  if (
    aliasB.some((al) => {
      const limAl = al.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return limAl === limpioA || generarIdSlug("h", limAl) === slugA;
    })
  ) {
    return true;
  }

  return false;
}

/**
 * Elimina duplicados en listas de identificadores/nombres basándose en equivalencia fonética y de slug.
 */
export function deduplicarListaIds(lista: string[]): string[] {
  const resultado: string[] = [];
  for (const item of lista) {
    if (!resultado.some((existente) => coincideHechizoId(existente, item))) {
      resultado.push(item);
    }
  }
  return resultado;
}
