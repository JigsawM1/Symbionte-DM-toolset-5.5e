/**
 * sistemaTaleSpire.ts
 * -------------------
 * Capa de servicios para interactuar de forma segura y desacoplada
 * con las funcionalidades del sistema (portapapeles, descargas de archivos,
 * e información del jugador) en TaleSpire y navegadores compatibles.
 */

import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";

/**
 * Copia una cadena de texto al portapapeles del usuario.
 * Prioriza la API nativa de TaleSpire (`ts.system.clipboard.setText`)
 * y utiliza la API estándar `navigator.clipboard.writeText` como fallback.
 *
 * @param texto Cadena de texto a copiar.
 * @returns Promesa que resuelve a `true` si la copia fue exitosa, o `false` en caso contrario.
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  if (!texto) return false;

  // 1. Intentar con la API nativa de TaleSpire si está disponible
  if (ts.estaDisponible && ts.system?.clipboard?.setText) {
    try {
      const exitoTS = await ts.system.clipboard.setText(texto);
      if (exitoTS) {
        logger.debug("[Sistema TaleSpire] Texto copiado exitosamente con la API de TaleSpire.");
        return true;
      }
    } catch (errorTS) {
      logger.warn("[Sistema TaleSpire] Falló la copia con API de TaleSpire. Intentando con navigator.clipboard:", errorTS);
    }
  }

  // 2. Fallback con la API estándar del navegador
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(texto);
      logger.debug("[Sistema TaleSpire] Texto copiado exitosamente con navigator.clipboard.");
      return true;
    } catch (errorNav) {
      logger.error("[Sistema TaleSpire] Error al copiar texto mediante navigator.clipboard:", errorNav);
    }
  }

  logger.warn("[Sistema TaleSpire] No se pudo acceder a ningún mecanismo de portapapeles compatible.");
  return false;
}

/**
 * Genera y descarga un archivo en formato JSON en el navegador o cliente CEF.
 * Captura y registra cualquier excepción proactivamente sin silenciar errores.
 *
 * @param contenido Cadena serializada en JSON o texto a descargar.
 * @param nombreArchivo Nombre del archivo resultante con extensión .json.
 * @returns `true` si la descarga se inició correctamente, `false` en caso de error.
 */
export function descargarArchivoJSON(contenido: string, nombreArchivo: string): boolean {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof Blob === "undefined") {
    logger.warn("[Sistema TaleSpire] Entorno no compatible con descarga de archivos DOM/Blob.");
    return false;
  }

  try {
    const blob = new Blob([contenido], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo.endsWith(".json") ? nombreArchivo : `${nombreArchivo}.json`;
    
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    logger.debug(`[Sistema TaleSpire] Archivo "${nombreArchivo}" generado para descarga.`);
    return true;
  } catch (error) {
    logger.error(`[Sistema TaleSpire] Error al intentar descargar el archivo "${nombreArchivo}":`, error);
    return false;
  }
}

/**
 * Obtiene el nombre del jugador local activo desde TaleSpire.
 * Captura excepciones y retorna null si no se encuentra en el entorno de juego.
 *
 * @returns Promesa con el nombre del jugador o `null` si no está disponible.
 */
export async function obtenerNombreJugadorActivo(): Promise<string | null> {
  if (!ts.estaDisponible || !ts.players?.obtenerNombreJugadorLocal) {
    logger.debug("[Sistema TaleSpire] API de jugadores no disponible en este entorno.");
    return null;
  }

  try {
    const nombre = await ts.players.obtenerNombreJugadorLocal();
    return nombre ? nombre.trim() : null;
  } catch (error) {
    logger.error("[Sistema TaleSpire] Error al consultar el nombre del jugador local:", error);
    return null;
  }
}
