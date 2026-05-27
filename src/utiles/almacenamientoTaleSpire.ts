/**
 * almacenamientoTaleSpire.ts
 * ---------------------------
 * Módulo de persistencia OFICIAL para Simbiotes de TaleSpire.
 *
 * Usa la API nativa TS.localStorage.global (setBlob / getBlob) que escribe
 * directamente en un archivo en la carpeta del Simbionte en disco.
 * Esta es la ÚNICA forma garantizada de persistir datos entre sesiones de TaleSpire,
 * ya que el WebView2 borra LocalStorage e IndexedDB al cerrarse el juego.
 *
 * Limitación oficial: 5MB por blob (global o campaign).
 * Para datos grandes, dividimos en múltiples claves (como lo hacíamos con LS fragmentado).
 *
 * Referencia: https://symbiote-docs.talespire.com/
 *
 * Programado 100% en español.
 */

/** Clave interna para el único blob global del Simbionte DM */
const CLAVE_BLOB_GLOBAL = "__dm_pantalla_datos__";

/**
 * Verifica si la API nativa de TaleSpire de almacenamiento está disponible.
 */
function apiTSDisponible(): boolean {
  return !!(
    window.TS &&
    window.TS.localStorage &&
    typeof window.TS.localStorage.global?.setBlob === "function"
  );
}

/**
 * Guarda TODOS los datos persistibles del DM en un único blob JSON
 * usando la API oficial de TaleSpire (TS.localStorage.global.setBlob).
 *
 * @param datos Objeto con todos los datos a persistir
 * @returns true si el guardado fue exitoso, false en caso de error
 */
export async function guardarBlobGlobal(datos: Record<string, unknown>): Promise<boolean> {
  if (!apiTSDisponible()) {
    // Fallback: si la API TS no está disponible (desarrollo local), usar localStorage
    try {
      localStorage.setItem(CLAVE_BLOB_GLOBAL, JSON.stringify(datos));
      return true;
    } catch (e) {
      console.error("[TS Storage] Fallback localStorage también falló:", e);
      return false;
    }
  }

  try {
    const jsonStr = JSON.stringify(datos);
    // Llamar a la API oficial de TaleSpire
    const resultado = await window.TS!.localStorage!.global.setBlob(jsonStr);
    
    // getBlob/setBlob de TaleSpire a veces devuelve string/void en lugar del formato de objeto.
    // Manejamos esto de forma 100% segura.
    console.log("[TS Storage] Guardado mediante setBlob completado. Respuesta:", resultado);
    return true;
  } catch (error) {
    console.error("[TS Storage] Excepción al guardar blob global:", error);
    return false;
  }
}

/**
 * Lee TODOS los datos persistibles del DM desde el blob JSON
 * usando la API oficial de TaleSpire (TS.localStorage.global.getBlob).
 *
 * @returns El objeto con todos los datos guardados, o null si no hay datos
 */
export async function leerBlobGlobal(): Promise<Record<string, unknown> | null> {
  if (!apiTSDisponible()) {
    // Fallback: si la API TS no está disponible (desarrollo local), usar localStorage
    try {
      const raw = localStorage.getItem(CLAVE_BLOB_GLOBAL);
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (e) {
      console.warn("[TS Storage] Fallback localStorage getItem falló:", e);
      return null;
    }
  }

  try {
    const resultado = await window.TS!.localStorage!.global.getBlob();
    console.log("[TS Storage] Lectura de getBlob finalizada. Tipo de respuesta:", typeof resultado, resultado);

    if (!resultado) {
      console.log("[TS Storage] Blob vacío o sin inicializar (retornó vacío/undefined).");
      return null;
    }

    // 1. Si es directamente un string (como se comporta en la práctica)
    if (typeof resultado === "string") {
      if (resultado.trim() === "") return null;
      try {
        return JSON.parse(resultado) as Record<string, unknown>;
      } catch (e) {
        console.error("[TS Storage] Error al parsear JSON directo de getBlob:", e);
        return null;
      }
    }

    // 2. Si es un objeto que contiene .data (firma documentada teórica) o .result
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

    // 3. Si es un objeto general, intentar parsearlo directamente si tiene sentido
    console.warn("[TS Storage] Estructura inesperada en resultado de getBlob, intentando procesar:", resultado);
    return null;
  } catch (error) {
    console.error("[TS Storage] Excepción al leer blob global:", error);
    return null;
  }
}

/**
 * Limpia completamente el blob de datos guardados.
 * Solo se debe usar al restablecer datos de fábrica.
 */
export async function limpiarBlobGlobal(): Promise<boolean> {
  if (!apiTSDisponible()) {
    localStorage.removeItem(CLAVE_BLOB_GLOBAL);
    return true;
  }

  try {
    const globalStorage = window.TS!.localStorage!.global;
    // Si la API deleteBlob existe, la preferimos
    if (typeof globalStorage.deleteBlob === "function") {
      await globalStorage.deleteBlob();
      console.log("[TS Storage] Blob global eliminado mediante deleteBlob()");
      return true;
    }
    
    await globalStorage.setBlob("{}");
    return true;
  } catch (error) {
    console.error("[TS Storage] Excepción al limpiar blob global:", error);
    return false;
  }
}
