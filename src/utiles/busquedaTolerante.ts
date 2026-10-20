/**
 * Utilidad universal de búsqueda tolerante e insensible a mayúsculas, tildes, diacríticos y orden de palabras.
 * Diseñada para garantizar que cualquier búsqueda en ToolSet Es 5.5 encuentre resultados
 * sin importar cómo lo escriba el usuario (ej: "baston" -> "Bastón", "pocion curacion" -> "Poción de Curación").
 */

const cacheNormalizacion = new Map<string, string>();
const LIMITE_CACHE_NORMALIZACION = 5000;

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
    let eliminados = 0;
    for (const k of cacheNormalizacion.keys()) {
      cacheNormalizacion.delete(k);
      eliminados++;
      if (eliminados >= 1000) break;
    }
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
 * Estructura precalculada para evitar re-tokenizar y re-normalizar la consulta en cada elemento del bucle.
 */
interface InfoConsulta {
  consultaNorm: string;
  tokens: string[];
  tokensSinEnye: string[];
  numTokens: number;
}

const cacheConsultas = new Map<string, InfoConsulta | null>();
const LIMITE_CACHE_CONSULTAS = 1000;

function obtenerInfoConsulta(consulta: string): InfoConsulta | null {
  if (!consulta || !consulta.trim()) return null;
  let info = cacheConsultas.get(consulta);
  if (info !== undefined) return info;

  const tokens = tokenizarBusqueda(consulta);
  if (tokens.length === 0) {
    if (cacheConsultas.size >= LIMITE_CACHE_CONSULTAS) cacheConsultas.clear();
    cacheConsultas.set(consulta, null);
    return null;
  }

  const consultaNorm = normalizarParaBusqueda(consulta);
  const tokensSinEnye = tokens.map((t) => (t.includes("ñ") ? t.replace(/ñ/g, "n") : t));

  info = {
    consultaNorm,
    tokens,
    tokensSinEnye,
    numTokens: tokens.length
  };

  if (cacheConsultas.size >= LIMITE_CACHE_CONSULTAS) cacheConsultas.clear();
  cacheConsultas.set(consulta, info);
  return info;
}

/**
 * Comprueba si una consulta coincide con uno o varios textos objetivos.
 * Coincide si TODOS los tokens de la consulta están presentes en la unión de los textos.
 * Optimización de rendimiento Bolt ⚡:
 * - Reutiliza la consulta tokenizada y normalizada precalculada.
 * - Evita asignación de objetos/arrays adicionales durante el filtrado.
 * - Utiliza máscaras de bits para rastreo de tokens pendientes (hasta 30 palabras clave).
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

  const infoConsulta = obtenerInfoConsulta(consulta);
  if (!infoConsulta) return true;

  const { tokens, tokensSinEnye, numTokens } = infoConsulta;

  // Optimización si objetivos es un único string
  if (typeof objetivos === "string") {
    if (objetivos.length === 0) return false;
    const objNorm = normalizarParaBusqueda(objetivos);
    const objNormSinEnye = objNorm.includes("ñ") ? objNorm.replace(/ñ/g, "n") : objNorm;

    for (let i = 0; i < numTokens; i++) {
      if (!objNorm.includes(tokens[i]) && !objNormSinEnye.includes(tokensSinEnye[i])) {
        return false;
      }
    }
    return true;
  }

  // Verificación rápida si la lista tiene al menos un texto válido
  let tieneObjetivosValidos = false;
  for (let i = 0; i < objetivos.length; i++) {
    const item = objetivos[i];
    if (item && typeof item === "string" && item.length > 0) {
      tieneObjetivosValidos = true;
      break;
    }
  }
  if (!tieneObjetivosValidos) return false;

  // Atajo para consultas de un solo token (la gran mayoría de búsquedas)
  if (numTokens === 1) {
    const tok = tokens[0];
    const tokSinEnye = tokensSinEnye[0];
    for (let i = 0; i < objetivos.length; i++) {
      const item = objetivos[i];
      if (!item) continue;
      const objNorm = normalizarParaBusqueda(item);
      const objNormSinEnye = objNorm.includes("ñ") ? objNorm.replace(/ñ/g, "n") : objNorm;
      if (objNorm.includes(tok) || objNormSinEnye.includes(tokSinEnye)) {
        return true;
      }
    }
    return false;
  }

  // Búsqueda multitoken de alto rendimiento con bitmask (evita asignaciones `Set` o `Array.from`)
  if (numTokens <= 30) {
    let tokensPendientesMask = (1 << numTokens) - 1;

    for (let i = 0; i < objetivos.length; i++) {
      const item = objetivos[i];
      if (!item) continue;

      const objNorm = normalizarParaBusqueda(item);
      const objNormSinEnye = objNorm.includes("ñ") ? objNorm.replace(/ñ/g, "n") : objNorm;

      for (let t = 0; t < numTokens; t++) {
        if ((tokensPendientesMask & (1 << t)) !== 0) {
          if (objNorm.includes(tokens[t]) || objNormSinEnye.includes(tokensSinEnye[t])) {
            tokensPendientesMask &= ~(1 << t);
          }
        }
      }

      if (tokensPendientesMask === 0) {
        return true;
      }
    }
    return false;
  }

  // Fallback para consultas atípicas con más de 30 tokens
  const pendientes = new Set<number>();
  for (let t = 0; t < numTokens; t++) pendientes.add(t);

  for (let i = 0; i < objetivos.length; i++) {
    const item = objetivos[i];
    if (!item) continue;

    const objNorm = normalizarParaBusqueda(item);
    const objNormSinEnye = objNorm.includes("ñ") ? objNorm.replace(/ñ/g, "n") : objNorm;

    for (const t of Array.from(pendientes)) {
      if (objNorm.includes(tokens[t]) || objNormSinEnye.includes(tokensSinEnye[t])) {
        pendientes.delete(t);
      }
    }

    if (pendientes.size === 0) return true;
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
  const infoConsulta = obtenerInfoConsulta(consulta);
  if (!infoConsulta) return 0;

  const { consultaNorm, tokens, tokensSinEnye, numTokens } = infoConsulta;
  const tituloNorm = normalizarParaBusqueda(titulo || "");

  if (tituloNorm) {
    if (tituloNorm === consultaNorm) return 1000;
    if (tituloNorm.startsWith(consultaNorm)) return 800;
    if (tituloNorm.includes(consultaNorm)) return 600;

    const tituloNormSinEnye = tituloNorm.includes("ñ") ? tituloNorm.replace(/ñ/g, "n") : tituloNorm;
    let tokensEnTitulo = 0;
    for (let i = 0; i < numTokens; i++) {
      if (tituloNorm.includes(tokens[i]) || tituloNormSinEnye.includes(tokensSinEnye[i])) {
        tokensEnTitulo++;
      }
    }

    if (tokensEnTitulo === numTokens) return 400;
    if (tokensEnTitulo > 0) return 300;
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

  const cacheRelevancia = new Map<T, number>();

  const obtenerRelevancia = (item: T): number => {
    let rel = cacheRelevancia.get(item);
    if (rel === undefined) {
      const titulo = obtenerTitulo(item);
      const sec = obtenerSecundarios ? obtenerSecundarios(item) : undefined;
      rel = calcularRelevanciaBusqueda(titulo, consulta, sec);
      cacheRelevancia.set(item, rel);
    }
    return rel;
  };

  return (a: T, b: T) => {
    const relA = obtenerRelevancia(a);
    const relB = obtenerRelevancia(b);

    if (relA !== relB) {
      return relB - relA; // Mayor relevancia primero
    }

    if (desempate) {
      return desempate(a, b);
    }

    const tituloA = obtenerTitulo(a);
    const tituloB = obtenerTitulo(b);
    return (tituloA || "").localeCompare(tituloB || "", "es");
  };
}
