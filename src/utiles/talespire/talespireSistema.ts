/**
 * talespireSistema.ts
 * -------------------
 * Adaptadores para servicios periféricos del sistema en TaleSpire:
 * - Almacenamiento persistente en blob (localStorage).
 * - Acceso al portapapeles del sistema (clipboard).
 * - Consola de depuración nativa (debug).
 */

import { logger } from "@/utiles/logger";
import { obtenerTSGlobal } from "./comun";

export class TaleSpireLocalStorageAdapter {
  /**
   * Guarda de forma persistente un Blob de texto en disco mediante TaleSpire.
   * NOTA: La API real de TaleSpire setBlob usa firma (data) sin clave.
   * La clave se mantiene en la interfaz para el fallback de navegador.
   */
  async guardarBlob(_clave: string, datos: string): Promise<boolean> {
    const ts = obtenerTSGlobal();
    if (ts?.localStorage?.global && typeof ts.localStorage.global.setBlob === "function") {
      try {
        // API real de TaleSpire: setBlob(data) — sin clave
        await ts.localStorage.global.setBlob(datos);
        return true;
      } catch (error) {
        logger.error("[TS Adapter] Excepción en setBlob nativo:", error);
        return false;
      }
    }

    // Fallback a almacenamiento local del navegador (desarrollo local / entorno Web)
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(_clave, datos);
        return true;
      } catch (error) {
        logger.error("[TS Adapter] Error al guardar en localStorage de navegador:", error);
        return false;
      }
    }

    logger.warn("[TS Adapter] localStorage.guardarBlob no disponible.");
    return false;
  }

  /**
   * Lee un Blob de texto persistente de TaleSpire.
   * NOTA: La API real de TaleSpire getBlob usa firma () sin parámetros.
   */
  async leerBlob(_clave: string): Promise<string | null> {
    const ts = obtenerTSGlobal();
    if (ts?.localStorage?.global && typeof ts.localStorage.global.getBlob === "function") {
      try {
        // API real de TaleSpire: getBlob() — sin clave
        return await ts.localStorage.global.getBlob();
      } catch (error) {
        logger.error("[TS Adapter] Excepción en getBlob nativo:", error);
        throw error;
      }
    }

    // Fallback a almacenamiento local del navegador (desarrollo local / entorno Web)
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(_clave);
      } catch (error) {
        logger.error("[TS Adapter] Error al leer de localStorage de navegador:", error);
        throw error;
      }
    }

    logger.warn("[TS Adapter] localStorage.leerBlob no disponible.");
    return null;
  }

  /**
   * Elimina el blob de TaleSpire.
   */
  async eliminarBlob(_clave: string): Promise<boolean> {
    const ts = obtenerTSGlobal();
    if (ts?.localStorage?.global) {
      const globalStorage = ts.localStorage.global;
      try {
        if (typeof globalStorage.deleteBlob === "function") {
          // API real de TaleSpire: deleteBlob() — sin clave
          await globalStorage.deleteBlob();
          return true;
        }
        // Si no existe deleteBlob, sobreescribir con cadena vacía
        await globalStorage.setBlob("{}");
        return true;
      } catch (error) {
        logger.error("[TS Adapter] Excepción en deleteBlob nativo:", error);
        return false;
      }
    }

    // Fallback a almacenamiento local del navegador (desarrollo local / entorno Web)
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(_clave);
        return true;
      } catch (error) {
        logger.error("[TS Adapter] Error al eliminar de localStorage de navegador:", error);
        return false;
      }
    }

    logger.warn("[TS Adapter] localStorage.eliminarBlob no disponible.");
    return false;
  }
}

export class TaleSpireSystemAdapter {
  clipboard = {
    /**
     * Escribe un string en el portapapeles del sistema del usuario.
     */
    setText: async (texto: string): Promise<boolean> => {
      const ts = obtenerTSGlobal();
      if (ts?.system?.clipboard && typeof ts.system.clipboard.setText === "function") {
        try {
          await ts.system.clipboard.setText(texto);
          return true;
        } catch (e) {
          logger.error("[TS Adapter] Error escribiendo portapapeles nativo:", e);
        }
      }
      // Legacy copyText fallback
      if (ts?.clipboard && typeof ts.clipboard.copyText === "function") {
        try {
          await ts.clipboard.copyText(texto);
          return true;
        } catch (e) {
          logger.debug("[TS Adapter] Falló fallback legacy copyText:", e);
        }
      }
      // Nav web clipboard fallback
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          await navigator.clipboard.writeText(texto);
          return true;
        }
        return false;
      } catch (e) {
        logger.warn("[TS Adapter] Fallback navigator.clipboard falló o carece de permisos de foco:", e);
        return false;
      }
    }
  };
}

export class TaleSpireDebugAdapter {
  /**
   * Registra un mensaje en los logs de depuración nativos de TaleSpire.
   */
  log(mensaje: string): void {
    const ts = obtenerTSGlobal();
    if (ts?.debug && typeof ts.debug.log === "function") {
      ts.debug.log(mensaje);
    } else {
      logger.debug(`[TS Debug] ${mensaje}`);
    }
  }
}
