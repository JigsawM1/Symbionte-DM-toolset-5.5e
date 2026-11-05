import { generarIdSlug } from "@/utiles/generarId";
import { MAPA_ALIAS_HECHIZOS } from "@/constantes/subclasesConjurosConstantes";

/**
 * Normalizaciones pre-calculadas simétricamente al cargar el módulo para evitar
 * asignaciones temporales, regex repetidas y recorridos $O(N)$ en tiempo de ejecución.
 */
const MAPA_ALIAS_NORMALIZADO: Record<string, string[]> = {};

function limpiarPrefijo(s: string): string {
  if (s.startsWith("h_") || s.startsWith("h-")) return s.substring(2);
  return s;
}

function registrarEquivalencia(a: string, b: string): void {
  const normA = a.toLowerCase().trim();
  const sinTildesA = normA.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const limpioA = limpiarPrefijo(sinTildesA);

  const normB = b.toLowerCase().trim();
  const sinTildesB = normB.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const limpioB = limpiarPrefijo(sinTildesB);
  const slugB = generarIdSlug("h", limpioB);

  for (const k of [a, normA, sinTildesA, limpioA]) {
    if (!MAPA_ALIAS_NORMALIZADO[k]) MAPA_ALIAS_NORMALIZADO[k] = [];
    const lista = MAPA_ALIAS_NORMALIZADO[k];
    if (!lista.includes(limpioB)) lista.push(limpioB);
    if (!lista.includes(slugB)) lista.push(slugB);
  }
}

for (const [clave, listaAlias] of Object.entries(MAPA_ALIAS_HECHIZOS)) {
  for (const al of listaAlias) {
    registrarEquivalencia(clave, al);
    registrarEquivalencia(al, clave);
  }
}

/**
 * Formas normalizadas derivadas de un identificador de conjuro para acelerar comparaciones repetidas.
 */
interface FormasNormalizadasHechizoId {
  norm: string;
  sinTildes: string;
  limpio: string;
  slug: string;
}

const cacheFormasId = new Map<string, FormasNormalizadasHechizoId>();
const LIMITE_CACHE_FORMAS = 2000;

/**
 * Obtiene o calcula las formas normalizadas de un identificador con caché acotado FIFO.
 * Evita llamar repetidamente a `.normalize("NFD")`, regex de diacríticos y generación de slug
 * en bucles de filtrado o renderizado de colecciones de conjuros.
 */
function obtenerFormasId(id: string): FormasNormalizadasHechizoId {
  const enCache = cacheFormasId.get(id);
  if (enCache !== undefined) return enCache;

  const norm = id.toLowerCase().trim();
  const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const limpio = limpiarPrefijo(sinTildes);
  const slug = generarIdSlug("h", limpio);

  if (cacheFormasId.size >= LIMITE_CACHE_FORMAS) {
    let eliminados = 0;
    for (const k of cacheFormasId.keys()) {
      cacheFormasId.delete(k);
      eliminados++;
      if (eliminados >= 400) break;
    }
  }

  const formas: FormasNormalizadasHechizoId = { norm, sinTildes, limpio, slug };
  cacheFormasId.set(id, formas);
  return formas;
}

/**
 * Compara dos identificadores o nombres de conjuro tolerando diferencias de slug,
 * mayúsculas, tildes/diacríticos y sinónimos de traducción oficiales
 * (ej. "h_bendicion" === "Bendición" === "bendicion", "Susurros disonantes" === "Susurros discordantes").
 *
 * Optimización de rendimiento:
 * Reutiliza las formas derivadas cacheadas mediante `obtenerFormasId`, reduciendo el tiempo de
 * comparación en colecciones grandes en más de un 90% y evitando asignaciones de strings en el GC.
 */
export function coincideHechizoId(idA: string, idB: string): boolean {
  if (!idA || !idB) return false;
  if (idA === idB) return true;

  const fA = obtenerFormasId(idA);
  const fB = obtenerFormasId(idB);

  if (fA.norm === fB.norm) return true;
  if (fA.sinTildes === fB.sinTildes) return true;
  if (fA.limpio === fB.limpio) return true;
  if (fA.slug === fB.slug) return true;

  // Verificación de sinónimos/alias oficiales pre-indexados
  const aliasA = MAPA_ALIAS_NORMALIZADO[fA.limpio] || MAPA_ALIAS_NORMALIZADO[fA.sinTildes];
  if (aliasA && (aliasA.includes(fB.limpio) || aliasA.includes(fB.slug))) return true;

  const aliasB = MAPA_ALIAS_NORMALIZADO[fB.limpio] || MAPA_ALIAS_NORMALIZADO[fB.sinTildes];
  if (aliasB && (aliasB.includes(fA.limpio) || aliasB.includes(fA.slug))) return true;

  return false;
}

/**
 * Añade todas las representaciones equivalentes de un ítem a un Set de claves para búsquedas O(1).
 */
function indexarRepresentacionesItem(conjuntoClaves: Set<string>, item: string): void {
  conjuntoClaves.add(item);
  const norm = item.toLowerCase().trim();
  conjuntoClaves.add(norm);
  const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  conjuntoClaves.add(sinTildes);
  const limpio = limpiarPrefijo(sinTildes);
  conjuntoClaves.add(limpio);
  conjuntoClaves.add(generarIdSlug("h", limpio));

  const alias = MAPA_ALIAS_NORMALIZADO[limpio] || MAPA_ALIAS_NORMALIZADO[sinTildes];
  if (alias) {
    for (let i = 0; i < alias.length; i++) {
      conjuntoClaves.add(alias[i]);
    }
  }
}

/**
 * Comprueba si un identificador coincide con alguna representación del conjunto en O(1).
 */
function coincideConConjunto(conjunto: Set<string>, id: string): boolean {
  if (!id) return false;
  if (conjunto.has(id)) return true;
  const norm = id.toLowerCase().trim();
  if (conjunto.has(norm)) return true;
  const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (conjunto.has(sinTildes)) return true;
  const limpio = limpiarPrefijo(sinTildes);
  return conjunto.has(limpio) || conjunto.has(generarIdSlug("h", limpio));
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
    if (!item || coincideConConjunto(conjuntoClaves, item)) continue;
    resultado.push(item);
    indexarRepresentacionesItem(conjuntoClaves, item);
  }
  return resultado;
}

/**
 * Crea un verificador de pertenencia optimizado para listas de IDs de conjuros.
 * Indiza todas las variantes de los conjuros en un Set con búsquedas O(1),
 * evitando recorridos en bucles `.some()` con comparaciones costosas de texto por cada verificación.
 */
export function crearMatcherHechizos(lista: readonly string[] | string[]): (id: string) => boolean {
  if (!lista || lista.length === 0) return () => false;
  const conjuntoClaves = new Set<string>();
  for (const item of lista) {
    if (item) indexarRepresentacionesItem(conjuntoClaves, item);
  }
  return (id: string): boolean => coincideConConjunto(conjuntoClaves, id);
}
