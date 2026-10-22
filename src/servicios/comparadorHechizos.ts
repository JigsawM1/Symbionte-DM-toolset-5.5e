import { generarIdSlug } from "@/utiles/generarId";
import { MAPA_ALIAS_HECHIZOS } from "@/constantes/subclasesConjurosConstantes";

interface AliasNormalizado {
  limpio: string;
  slug: string;
}

/**
 * Normalizaciones pre-calculadas al cargar el módulo para evitar asignaciones temporales,
 * expresiones regulares repetidas y recorridos $O(N)$ en tiempo de ejecución.
 */
const MAPA_ALIAS_NORMALIZADO: Record<string, AliasNormalizado[]> = {};
const MAPA_REVERSO_ALIAS: Record<string, AliasNormalizado[]> = {};

function limpiarPrefijo(s: string): string {
  if (s.startsWith("h_") || s.startsWith("h-")) return s.substring(2);
  return s;
}

function registrarAliasEnMapa(
  mapa: Record<string, AliasNormalizado[]>,
  clave: string,
  alias: AliasNormalizado
) {
  if (!mapa[clave]) {
    mapa[clave] = [];
  }
  if (!mapa[clave].some((existente) => existente.limpio === alias.limpio && existente.slug === alias.slug)) {
    mapa[clave].push(alias);
  }
}

for (const [clave, listaAlias] of Object.entries(MAPA_ALIAS_HECHIZOS)) {
  const normClave = clave.toLowerCase().trim();
  const sinTildesClave = normClave.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const limpioClave = limpiarPrefijo(sinTildesClave);
  const slugClave = generarIdSlug("h", limpioClave);

  const objetoClave: AliasNormalizado = { limpio: limpioClave, slug: slugClave };

  for (const al of listaAlias) {
    const normAl = al.toLowerCase().trim();
    const sinTildesAl = normAl.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const limpioAl = limpiarPrefijo(sinTildesAl);
    const slugAl = generarIdSlug("h", limpioAl);

    const objetoAlias: AliasNormalizado = { limpio: limpioAl, slug: slugAl };

    // Registrar alias directo
    registrarAliasEnMapa(MAPA_ALIAS_NORMALIZADO, clave, objetoAlias);
    registrarAliasEnMapa(MAPA_ALIAS_NORMALIZADO, normClave, objetoAlias);
    registrarAliasEnMapa(MAPA_ALIAS_NORMALIZADO, sinTildesClave, objetoAlias);
    registrarAliasEnMapa(MAPA_ALIAS_NORMALIZADO, limpioClave, objetoAlias);

    // Registrar alias reverso
    registrarAliasEnMapa(MAPA_REVERSO_ALIAS, al, objetoClave);
    registrarAliasEnMapa(MAPA_REVERSO_ALIAS, normAl, objetoClave);
    registrarAliasEnMapa(MAPA_REVERSO_ALIAS, sinTildesAl, objetoClave);
    registrarAliasEnMapa(MAPA_REVERSO_ALIAS, limpioAl, objetoClave);
  }
}

/**
 * Compara dos identificadores o nombres de conjuro tolerando diferencias de slug,
 * mayúsculas, tildes/diacríticos y sinónimos de traducción oficiales
 * (ej. "h_bendicion" === "Bendición" === "bendicion", "Susurros disonantes" === "Susurros discordantes").
 *
 * Optimizado con mapeo pre-computado de alias sin asignaciones temporales por iteración.
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

  const limpioA = limpiarPrefijo(sinTildesA);
  const limpioB = limpiarPrefijo(sinTildesB);

  if (limpioA === limpioB) return true;

  const slugA = generarIdSlug("h", limpioA);
  const slugB = generarIdSlug("h", limpioB);
  if (slugA === slugB) return true;

  // Verificación de sinónimos/alias oficiales (directos y reversos)
  const aliasA = MAPA_ALIAS_NORMALIZADO[limpioA] || MAPA_ALIAS_NORMALIZADO[sinTildesA];
  if (aliasA) {
    for (let i = 0; i < aliasA.length; i++) {
      const al = aliasA[i];
      if (al.limpio === limpioB || al.slug === slugB) return true;
    }
  }

  const aliasB = MAPA_ALIAS_NORMALIZADO[limpioB] || MAPA_ALIAS_NORMALIZADO[sinTildesB];
  if (aliasB) {
    for (let i = 0; i < aliasB.length; i++) {
      const al = aliasB[i];
      if (al.limpio === limpioA || al.slug === slugA) return true;
    }
  }

  return false;
}

/**
 * Añade todas las representaciones equivalentes de un ítem a un Set de claves:
 * su nombre exacto, normalizado, sin tildes, limpio de prefijos, slug,
 * así como los nombres y slugs de sus alias directos y reversos.
 */
function indexarRepresentacionesItem(conjuntoClaves: Set<string>, item: string): void {
  conjuntoClaves.add(item);
  const norm = item.toLowerCase().trim();
  conjuntoClaves.add(norm);
  const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  conjuntoClaves.add(sinTildes);
  const limpio = limpiarPrefijo(sinTildes);
  conjuntoClaves.add(limpio);
  const slug = generarIdSlug("h", limpio);
  conjuntoClaves.add(slug);

  const directos = MAPA_ALIAS_NORMALIZADO[limpio] || MAPA_ALIAS_NORMALIZADO[sinTildes];
  if (directos) {
    for (let i = 0; i < directos.length; i++) {
      conjuntoClaves.add(directos[i].limpio);
      conjuntoClaves.add(directos[i].slug);
    }
  }

  const reversos = MAPA_REVERSO_ALIAS[limpio] || MAPA_REVERSO_ALIAS[sinTildes];
  if (reversos) {
    for (let i = 0; i < reversos.length; i++) {
      conjuntoClaves.add(reversos[i].limpio);
      conjuntoClaves.add(reversos[i].slug);
    }
  }
}

/**
 * Elimina duplicados en listas de identificadores/nombres basándose en equivalencia fonética y de slug.
 * Utiliza un Set de claves indizadas para búsquedas O(1) en lugar de búsquedas O(N) anidadas.
 */
export function deduplicarListaIds(lista: string[]): string[] {
  const resultado: string[] = [];
  if (!lista || lista.length === 0) return resultado;

  const conjuntoClaves = new Set<string>();

  for (const item of lista) {
    if (!item) continue;

    if (conjuntoClaves.has(item)) continue;

    const norm = item.toLowerCase().trim();
    if (conjuntoClaves.has(norm)) continue;

    const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (conjuntoClaves.has(sinTildes)) continue;

    const limpio = limpiarPrefijo(sinTildes);
    if (conjuntoClaves.has(limpio)) continue;

    const slug = generarIdSlug("h", limpio);
    if (conjuntoClaves.has(slug)) continue;

    resultado.push(item);
    indexarRepresentacionesItem(conjuntoClaves, item);
  }

  return resultado;
}

/**
 * Crea un verificador de pertenencia optimizado para listas de IDs de conjuros.
 * Indiza todas las variantes de los conjuros en la lista en un Set con búsquedas O(1),
 * evitando recorridos en bucles `.some()` con comparaciones costosas de texto por cada verificación.
 */
export function crearMatcherHechizos(lista: readonly string[] | string[]): (id: string) => boolean {
  if (!lista || lista.length === 0) return () => false;

  const conjuntoClaves = new Set<string>();

  for (const item of lista) {
    if (!item) continue;
    indexarRepresentacionesItem(conjuntoClaves, item);
  }

  return (id: string): boolean => {
    if (!id) return false;
    if (conjuntoClaves.has(id)) return true;

    const norm = id.toLowerCase().trim();
    if (conjuntoClaves.has(norm)) return true;

    const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (conjuntoClaves.has(sinTildes)) return true;

    const limpio = limpiarPrefijo(sinTildes);
    if (conjuntoClaves.has(limpio)) return true;

    const slug = generarIdSlug("h", limpio);
    if (conjuntoClaves.has(slug)) return true;

    return false;
  };
}
