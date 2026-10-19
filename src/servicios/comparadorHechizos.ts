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
  const exactos = new Set<string>();
  for (const item of lista) {
    if (!item) continue;
    if (exactos.has(item)) continue;
    if (!resultado.some((existente) => coincideHechizoId(existente, item))) {
      resultado.push(item);
      exactos.add(item);
    }
  }
  return resultado;
}

/**
 * Crea un verificador de pertenencia optimizado para listas de IDs de conjuros.
 * Pre-expande todas las variantes (IDs, nombres normalizados, sin tildes, slugs y alias)
 * en un Set hash para permitir consultas O(1) ultra-rápidas sin re-escaneos O(N).
 */
export function crearMatcherHechizos(lista: readonly string[] | string[]): (id: string) => boolean {
  if (!lista || lista.length === 0) return () => false;

  const set = new Set<string>();

  const limpiarPrefijo = (s: string): string => {
    if (s.startsWith("h_") || s.startsWith("h-")) return s.substring(2);
    return s;
  };

  const agregarVariantes = (raw: string) => {
    if (!raw) return;
    set.add(raw);
    const norm = raw.toLowerCase().trim();
    set.add(norm);
    const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    set.add(sinTildes);

    const limpio = limpiarPrefijo(sinTildes);
    set.add(limpio);

    const slug = generarIdSlug("h", limpio);
    set.add(slug);
    const slugGuionesBajos = slug.replace(/-/g, "_");
    if (slugGuionesBajos !== slug) set.add(slugGuionesBajos);

    const alias = MAPA_ALIAS_HECHIZOS[limpio] || MAPA_ALIAS_HECHIZOS[sinTildes] || MAPA_ALIAS_HECHIZOS[norm] || [];
    for (const al of alias) {
      if (!al) continue;
      set.add(al);
      const alNorm = al.toLowerCase().trim();
      set.add(alNorm);
      const alSinTildes = alNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      set.add(alSinTildes);
      const alLimpio = limpiarPrefijo(alSinTildes);
      set.add(alLimpio);
      const alSlug = generarIdSlug("h", alLimpio);
      set.add(alSlug);
      const alSlugGuionesBajos = alSlug.replace(/-/g, "_");
      if (alSlugGuionesBajos !== alSlug) set.add(alSlugGuionesBajos);
    }
  };

  for (const item of lista) {
    agregarVariantes(item);
  }

  return (id: string): boolean => {
    if (!id) return false;
    if (set.has(id)) return true;
    const norm = id.toLowerCase().trim();
    if (set.has(norm)) return true;
    const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (set.has(sinTildes)) return true;
    const limpio = limpiarPrefijo(sinTildes);
    if (set.has(limpio)) return true;
    const slug = generarIdSlug("h", limpio);
    if (set.has(slug)) return true;
    const slugBajo = slug.replace(/-/g, "_");
    return set.has(slugBajo);
  };
}
