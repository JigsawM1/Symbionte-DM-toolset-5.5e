/**
 * Utilidad universal de búsqueda tolerante e insensible a mayúsculas, tildes, diacríticos y orden de palabras.
 * Diseñada para garantizar que cualquier búsqueda en ToolSet Es 5.5 encuentre resultados
 * sin importar cómo lo escriba el usuario (ej: "baston" -> "Bastón", "pocion curacion" -> "Poción de Curación").
 */

/**
 * Normaliza una cadena de texto eliminando tildes, diéresis, mayúsculas y caracteres diacríticos.
 * También normaliza opcionalmente 'ñ' a 'n' para usuarios sin teclado en español.
 */
export function normalizarParaBusqueda(texto: string, normalizarEnye: boolean = false): string {
  if (!texto) return "";
  let resultado = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalizarEnye) {
    resultado = resultado.replace(/ñ/g, "n");
  }

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

  // Unificar y normalizar todos los textos objetivos
  const listaObjetivos = Array.isArray(objetivos) ? objetivos : [objetivos];
  const textoUnificado = listaObjetivos
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .map((t) => normalizarParaBusqueda(t))
    .join(" ");

  if (!textoUnificado) return false;

  // Versión secundaria con 'ñ' -> 'n' para tolerancia extra
  const textoUnificadoSinEnye = textoUnificado.replace(/ñ/g, "n");

  // Cada token debe estar contenido en el texto unificado
  return tokens.every((token) => {
    const tokenSinEnye = token.replace(/ñ/g, "n");
    return textoUnificado.includes(token) || textoUnificadoSinEnye.includes(tokenSinEnye);
  });
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
