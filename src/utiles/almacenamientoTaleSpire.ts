/**
 * almacenamientoTaleSpire.ts
 * ---------------------------
 * Módulo de persistencia para Simbiotes de TaleSpire.
 *
 * Utiliza el TaleSpireAdapter centralizado para persistir los datos tácticos
 * del Combat Tracker de forma segura y duradera.
 *
 */

import { ts } from "./TaleSpireAdapter";

/** Clave interna para el único blob global del Simbionte DM */
const CLAVE_BLOB_GLOBAL = "__dm_pantalla_datos__";

export class ErrorLecturaBlob extends Error {
  constructor(mensaje: string, readonly original: string | null, causa?: unknown) {
    super(mensaje, { cause: causa });
  }
}

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
export async function leerBlobGlobal(alLeerOriginal?: (texto: string) => void): Promise<Record<string, unknown> | null> {
  const resultado: unknown = await ts.localStorage.leerBlob(CLAVE_BLOB_GLOBAL);
  if (resultado === null || resultado === undefined || resultado === "") return null;
  let texto: string;
  if (typeof resultado === "string") texto = resultado;
  else if (typeof resultado === "object" && !Array.isArray(resultado)) {
    const objeto = resultado as Record<string, unknown>;
    if (objeto.result === "noData") return null;
    if (typeof objeto.data !== "string") throw new ErrorLecturaBlob('Respuesta de almacenamiento inválida', null);
    texto = objeto.data;
  } else throw new ErrorLecturaBlob('Respuesta de almacenamiento inválida', null);
  alLeerOriginal?.(texto);
  try {
    const datos: unknown = JSON.parse(texto);
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) throw new Error('Se esperaba un objeto JSON');
    return datos as Record<string, unknown>;
  } catch (error) {
    throw new ErrorLecturaBlob('Los datos guardados no contienen un objeto JSON válido', texto, error);
  }
}

/**
 * Limpia completamente el blob de datos guardados (restablecimiento de fábrica).
 */
export async function limpiarBlobGlobal(): Promise<boolean> {
  return await ts.localStorage.eliminarBlob(CLAVE_BLOB_GLOBAL);
}
