/**
 * Utilidades para almacenamiento persistente fragmentado (Chunking) en LocalStorage.
 * Permite guardar conjuntos de datos grandes (ej. bases de datos Homebrew de monstruos o conjuros)
 * sin riesgo de bloqueos por superar cuotas de almacenamiento.
 *
 * Programado 100% en español.
 */

const TAMAÑO_FRAGMENTO = 50 * 1024; // 50 KB por fragmento de texto

/**
 * Guarda un objeto de forma segura particionándolo en fragmentos si excede el tamaño límite.
 * @param clave Clave principal bajo la cual se guardará el registro.
 * @param datos Objeto o arreglo a serializar y almacenar.
 */
export function guardarDatoFragmentado(clave: string, datos: unknown): boolean {
  try {
    const textoSerializado = JSON.stringify(datos);
    const longitudTotal = textoSerializado.length;

    // Si es pequeño, se guarda de forma ordinaria
    if (longitudTotal <= TAMAÑO_FRAGMENTO) {
      localStorage.setItem(clave, textoSerializado);
      // Limpiamos posibles metadatos de fragmentos anteriores
      localStorage.removeItem(`${clave}_meta`);
      return true;
    }

    // Si es grande, calculamos cuántos fragmentos requerimos
    const numeroFragmentos = Math.ceil(longitudTotal / TAMAÑO_FRAGMENTO);
    
    // Guardamos los fragmentos
    for (let i = 0; i < numeroFragmentos; i++) {
      const inicio = i * TAMAÑO_FRAGMENTO;
      const fin = Math.min(inicio + TAMAÑO_FRAGMENTO, longitudTotal);
      const fragmento = textoSerializado.substring(inicio, fin);
      localStorage.setItem(`${clave}_f_${i}`, fragmento);
    }

    // Guardamos los metadatos indicando la cantidad de fragmentos creados
    const metadatos = {
      esFragmentado: true,
      cantidad: numeroFragmentos,
      longitudTotal
    };
    localStorage.setItem(`${clave}_meta`, JSON.stringify(metadatos));
    
    // Limpiamos la clave principal para evitar duplicidad de datos en memoria
    localStorage.removeItem(clave);

    // Eliminamos posibles fragmentos huérfanos de guardados más grandes anteriores
    let indiceHuerfano = numeroFragmentos;
    while (localStorage.getItem(`${clave}_f_${indiceHuerfano}`) !== null) {
      localStorage.removeItem(`${clave}_f_${indiceHuerfano}`);
      indiceHuerfano++;
    }

    return true;
  } catch (error) {
    console.error(`[Error Almacenamiento] Falló el guardado fragmentado para la clave "${clave}":`, error);
    return false;
  }
}

/**
 * Recupera y reconstruye un objeto previamente almacenado por fragmentos.
 * @param clave Clave principal del registro.
 * @returns El objeto deserializado, o null si no existe o falla.
 */
export function obtenerDatoFragmentado<T>(clave: string): T | null {
  try {
    // 1. Verificamos si existen metadatos de fragmentación
    const metadatosTexto = localStorage.getItem(`${clave}_meta`);
    
    if (!metadatosTexto) {
      // Intento de lectura convencional directa
      const datoConvencional = localStorage.getItem(clave);
      if (!datoConvencional) return null;
      return JSON.parse(datoConvencional) as T;
    }

    const metadatos = JSON.parse(metadatosTexto) as { esFragmentado: boolean; cantidad: number; longitudTotal: number };
    
    if (!metadatos.esFragmentado) return null;

    let textoReconstruido = "";
    
    // 2. Reconstruimos el string uniendo los fragmentos guardados
    for (let i = 0; i < metadatos.cantidad; i++) {
      const fragmento = localStorage.getItem(`${clave}_f_${i}`);
      if (fragmento === null) {
        console.warn(`[Almacenamiento] Falta el fragmento indexado "${clave}_f_${i}". Reconstrucción fallida.`);
        return null;
      }
      textoReconstruido += fragmento;
    }

    return JSON.parse(textoReconstruido) as T;
  } catch (error) {
    console.error(`[Error Almacenamiento] Error al obtener/reconstruir el dato de "${clave}":`, error);
    return null;
  }
}

/**
 * Elimina de forma completa todos los fragmentos y metadatos asociados a una clave.
 * @param clave Clave principal del registro.
 */
export function eliminarDatoFragmentado(clave: string): void {
  try {
    // Intentamos eliminar la clave simple
    localStorage.removeItem(clave);

    // Intentamos leer y procesar metadatos para eliminar fragmentos
    const metadatosTexto = localStorage.getItem(`${clave}_meta`);
    if (metadatosTexto) {
      const metadatos = JSON.parse(metadatosTexto) as { cantidad: number };
      for (let i = 0; i < metadatos.cantidad; i++) {
        localStorage.removeItem(`${clave}_f_${i}`);
      }
      localStorage.removeItem(`${clave}_meta`);
    }

    // Por seguridad adicional, barremos cualquier fragmento residual numerado
    let i = 0;
    while (localStorage.getItem(`${clave}_f_${i}`) !== null) {
      localStorage.removeItem(`${clave}_f_${i}`);
      i++;
    }
  } catch (error) {
    console.error(`[Error Almacenamiento] Falló la eliminación de "${clave}":`, error);
  }
}
