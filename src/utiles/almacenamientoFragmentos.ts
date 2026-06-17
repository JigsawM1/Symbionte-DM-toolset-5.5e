/**
 * Utilidades para almacenamiento persistente fragmentado (Chunking) en LocalStorage.
 * Permite guardar conjuntos de datos grandes (ej. bases de datos Homebrew de monstruos o conjuros)
 * sin riesgo de bloqueos por superar cuotas de almacenamiento.
 *
 * Programado 100% en español.
 */

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

