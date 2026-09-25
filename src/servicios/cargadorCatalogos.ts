import { type ZodType, ZodError } from "zod";
import { logger } from "@/utiles/logger";

/**
 * Valida un elemento individual cargado desde JSON contra un esquema Zod.
 * Emite un log estructurado con los detalles exactos del fallo si la validación falla.
 */
export function validarElementoJSON<T>(
  datos: unknown,
  esquema: ZodType<T>,
  nombreElemento: string
): T {
  try {
    return esquema.parse(datos);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `[CargadorCatalogos] Error de validación en "${nombreElemento}":`,
        JSON.stringify(error.issues, null, 2)
      );
      throw new Error(
        `[CargadorCatalogos] El archivo o entidad "${nombreElemento}" no cumple el esquema requerido: ${error.message}`,
        { cause: error }
      );
    }
    logger.error(`[CargadorCatalogos] Error inesperado al validar "${nombreElemento}":`, error);
    throw error;
  }
}

/**
 * Valida una colección de elementos cargados desde JSON contra un esquema Zod.
 */
export function validarColeccionJSON<T>(
  datos: unknown[],
  esquema: ZodType<T>,
  nombreColeccion: string
): T[] {
  return datos.map((item, indice) =>
    validarElementoJSON(item, esquema, `${nombreColeccion}[${indice}]`)
  );
}
