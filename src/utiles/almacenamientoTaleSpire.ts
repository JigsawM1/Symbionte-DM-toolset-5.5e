/**
 * almacenamientoTaleSpire.ts
 * ---------------------------
 * Módulo de persistencia para Simbiotes de TaleSpire.
 *
 * Utiliza el TaleSpireAdapter centralizado para persistir los datos tácticos
 * del Combat Tracker de forma segura y duradera.
 *
 * Programado 100% en español.
 */

import { ts } from "./TaleSpireAdapter";

/** Clave interna para el único blob global del Simbionte DM */
const CLAVE_BLOB_GLOBAL = "__dm_pantalla_datos__";

/**
 * Guarda TODOS los datos persistibles del DM en un único blob JSON.
 */
export async function guardarBlobGlobal(datos: Record<string, unknown>): Promise<boolean> {
  const jsonStr = JSON.stringify(datos);
  return await ts.localStorage.guardarBlob(CLAVE_BLOB_GLOBAL, jsonStr);
}

/**
 * Lee TODOS los datos persistibles del DM desde el blob JSON.
 */
export async function leerBlobGlobal(): Promise<Record<string, unknown> | null> {
  try {
    const resultado = await ts.localStorage.leerBlob(CLAVE_BLOB_GLOBAL);
    console.log("[TS Storage] Lectura finalizada. Tipo de respuesta:", typeof resultado, resultado);

    if (!resultado) {
      console.log("[TS Storage] Blob vacío o sin inicializar.");
      return null;
    }

    // 1. Si es directamente una cadena JSON
    if (typeof resultado === "string") {
      if (resultado.trim() === "") return null;
      try {
        return JSON.parse(resultado) as Record<string, unknown>;
      } catch (e) {
        console.error("[TS Storage] Error al parsear JSON directo:", e);
        return null;
      }
    }

    // 2. Si es un objeto estructurado del simulador o API teórica { result, data }
    const obj = resultado as Record<string, unknown>;
    if (obj.result === "ok" && typeof obj.data === "string") {
      try {
        return JSON.parse(obj.data) as Record<string, unknown>;
      } catch (e) {
        console.error("[TS Storage] Error al parsear JSON desde obj.data:", e);
        return null;
      }
    } else if (obj.result === "noData") {
      console.log("[TS Storage] No hay datos guardados todavía (primera sesión).");
      return null;
    } else if (typeof obj.data === "string") {
      try {
        return JSON.parse(obj.data) as Record<string, unknown>;
      } catch (e) {
        console.error("[TS Storage] Error al parsear JSON desde obj.data secundario:", e);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("[TS Storage] Excepción al leer blob global:", error);
    return null;
  }
}

/**
 * Limpia completamente el blob de datos guardados (restablecimiento de fábrica).
 */
export async function limpiarBlobGlobal(): Promise<boolean> {
  return await ts.localStorage.eliminarBlob(CLAVE_BLOB_GLOBAL);
}
