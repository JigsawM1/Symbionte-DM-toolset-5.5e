/**
 * Utilidad universal de búsqueda tolerante e insensible a mayúsculas, tildes, diacríticos y orden de palabras.
 * Diseñada para garantizar que cualquier búsqueda en ToolSet Es 5.5 encuentre resultados
 * sin importar cómo lo escriba el usuario (ej: "baston" -> "Bastón", "pocion curacion" -> "Poción de Curación").
 */

const cacheNormalizacion = new Map<string, string>();
const LIMITE_CACHE_NORMALIZACION = 1500;

/**
 * Normaliza una cadena de texto eliminando tildes, diéresis, mayúsculas y caracteres diacríticos.
 * También normaliza opcionalmente 'ñ' a 'n' para usuarios sin teclado en español.
 */
export function normalizarParaBusqueda(texto: string, normalizarEnye: boolean = false): string {
  if (!texto) return "";
  const clave = normalizarEnye ? `${texto}__enye` : texto;
  const enCache = cacheNormalizacion.get(clave);
  if (enCache !== undefined) return enCache;

  let resultado = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalizarEnye) {
    resultado = resultado.replace(/ñ/g, "n");
  }

  if (cacheNormalizacion.size >= LIMITE_CACHE_NORMALIZACION) {
    cacheNormalizacion.clear();
  }
  cacheNormalizacion.set(clave, resultado);
  return resultado;
}

/**
 * Divide una consulta de búsqueda en palabras clave (tokens).
 */
export function tokenizarBusqueda(consulta: string): string[] {
  const normalizada = normalizarParaBusqueda(consulta);
  if (!normalizada) return [];
  return normalizada.split(/\s+/).filter((token) => token.length > 0);
}

/**
 * Comprueba si una consulta coincide con uno o varios textos objetivos.
 * Coincide si TODOS los tokens de la consulta están presentes en la unión de los textos.
 * Optimizado perezosamente: examina campos cortos (nombre, categoría) antes de analizar textos masivos.
 * 
 * @param objetivos Texto o lista de textos (ej: [nombre, categoria, subtitulo, descripcion])
 * @param consulta Texto que el usuario ingresó en el buscador
 * @returns true si coincide tolerantemente, false en caso contrario
 */
export function coincideBusquedaTolerante(
  objetivos: string | (string | undefined | null)[] | undefined | null,
  consulta: string
): boolean {
  if (!consulta || !consulta.trim()) return true;
  if (!objetivos) return false;

  const tokens = tokenizarBusqueda(consulta);
  if (tokens.length === 0) return true;

  const listaObjetivos = (Array.isArray(objetivos) ? objetivos : [objetivos])
    .filter((t): t is string => typeof t === "string" && t.length > 0);

  if (listaObjetivos.length === 0) return false;

  // Ordenar perezosamente: campos más cortos primero para descartar o confirmar sin tocar descripciones largas
  const objetivosOrdenados = listaObjetivos.length > 1
    ? [...listaObjetivos].sort((a, b) => a.length - b.length)
    : listaObjetivos;

  const tokensPendientes = new Set(tokens);

  for (const obj of objetivosOrdenados) {
    const objNorm = normalizarParaBusqueda(obj);
    const objNormSinEnye = objNorm.includes("ñ") ? objNorm.replace(/ñ/g, "n") : objNorm;

    for (const token of Array.from(tokensPendientes)) {
      const tokenSinEnye = token.includes("ñ") ? token.replace(/ñ/g, "n") : token;
      if (objNorm.includes(token) || objNormSinEnye.includes(tokenSinEnye)) {
        tokensPendientes.delete(token);
      }
    }

    if (tokensPendientes.size === 0) {
      return true;
    }
  }

  return false;
}

/**
 * Desduplica una lista de entidades (como objetos de juego o monstruos)
 * garantizando unicidad tanto por `id` como por `nombre` normalizado.
 * Evita la duplicación accidental en compendios y selectores.
 */
export function desduplicarEntidades<T extends { id: string; nombre: string }>(
  ...listas: (T[] | readonly T[] | undefined | null)[]
): T[] {
  const mapaPorId = new Map<string, T>();
  const mapaPorNombre = new Map<string, T>();

  for (const lista of listas) {
    if (!lista) continue;
    for (const item of lista) {
      if (!item || !item.id || !item.nombre) continue;
      const nombreNorm = normalizarParaBusqueda(item.nombre);

      // Si ya existe por nombre o id, sobreescribir con el más reciente
      const itemExistentePorNombre = mapaPorNombre.get(nombreNorm);
      if (itemExistentePorNombre) {
        mapaPorId.delete(itemExistentePorNombre.id);
      }

      mapaPorId.set(item.id, item);
      mapaPorNombre.set(nombreNorm, item);
    }
  }

  return Array.from(mapaPorId.values());
}

/**
 * Calcula un puntaje de relevancia de búsqueda para un elemento dado su título y campos secundarios.
 * Mayor puntaje indica mayor prioridad en los resultados de búsqueda.
 * 
 * Escala de prioridad:
 * - 1000: Coincidencia exacta con el título
 * - 800: El título comienza con la consulta completa
 * - 600: El título contiene la consulta completa como subcadena
 * - 400: El título contiene todas las palabras clave (tokens) de la consulta
 * - 300: El título contiene al menos una palabra clave de la consulta
 * - 100: Coincidencia exclusiva en campos secundarios (descripción, tipo, notas, etc.)
 * - 0: Sin coincidencia
 */
export function calcularRelevanciaBusqueda(
  titulo: string | undefined | null,
  consulta: string,
  secundarios?: (string | undefined | null)[]
): number {
  if (!consulta || !consulta.trim()) return 0;
  const tokens = tokenizarBusqueda(consulta);
  if (tokens.length === 0) return 0;

  const consultaNorm = normalizarParaBusqueda(consulta);
  const tituloNorm = normalizarParaBusqueda(titulo || "");

  if (tituloNorm) {
    if (tituloNorm === consultaNorm) return 1000;
    if (tituloNorm.startsWith(consultaNorm)) return 800;
    if (tituloNorm.includes(consultaNorm)) return 600;

    const tokensEnTitulo = tokens.filter((t) =>
      tituloNorm.includes(t) || tituloNorm.replace(/ñ/g, "n").includes(t.replace(/ñ/g, "n"))
    );

    if (tokensEnTitulo.length === tokens.length) return 400;
    if (tokensEnTitulo.length > 0) return 300;
  }

  // Comprobar coincidencia en campos secundarios si se proporcionan
  if (secundarios && secundarios.length > 0) {
    const coincideSecundarios = coincideBusquedaTolerante(secundarios, consulta);
    if (coincideSecundarios) return 100;
  }

  return 0;
}

/**
 * Función comparadora de ordenamiento que prioriza elementos coincidentes en el título/nombre,
 * situando después las coincidencias en campos secundarios ("después ya por lo demás")
 * y aplicando un comparador de desempate opcional.
 */
export function compararPorRelevanciaTitulo<T>(
  obtenerTitulo: (item: T) => string,
  consulta: string,
  desempate?: (a: T, b: T) => number,
  obtenerSecundarios?: (item: T) => (string | undefined | null)[]
): (a: T, b: T) => number {
  if (!consulta || !consulta.trim()) {
    return desempate || (() => 0);
  }

  return (a: T, b: T) => {
    const tituloA = obtenerTitulo(a);
    const tituloB = obtenerTitulo(b);
    const secA = obtenerSecundarios ? obtenerSecundarios(a) : undefined;
    const secB = obtenerSecundarios ? obtenerSecundarios(b) : undefined;

    const relA = calcularRelevanciaBusqueda(tituloA, consulta, secA);
    const relB = calcularRelevanciaBusqueda(tituloB, consulta, secB);

    if (relA !== relB) {
      return relB - relA; // Mayor relevancia primero
    }

    if (desempate) {
      return desempate(a, b);
    }

    return (tituloA || "").localeCompare(tituloB || "", "es");
  };
}
