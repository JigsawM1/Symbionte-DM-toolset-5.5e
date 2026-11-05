/**
 * comun.ts
 * --------
 * Utilidades base, acceso defensivo al entorno global de TaleSpire y caché de rol.
 */

import type { TaleSpireAPI } from "@/tipos/talespire";

let cacheEsGM: boolean | null = null;

/**
 * Permite establecer o actualizar manualmente el estado de si el cliente actual es Dungeon Master (GM).
 */
export const establecerCacheEsGM = (esGm: boolean): void => {
  cacheEsGM = esGm;
};

/**
 * Retorna el valor actual en memoria del rol de GM, o null si aún no se ha resuelto.
 */
export const obtenerCacheEsGM = (): boolean | null => {
  return cacheEsGM;
};

/**
 * Obtiene la referencia global de window.TS de forma segura en cualquier entorno (CEF, navegador o tests).
 */
export function obtenerTSGlobal(): TaleSpireAPI | undefined {
  if (typeof window !== "undefined" && window.TS) return window.TS;
  return (globalThis as unknown as { TS?: TaleSpireAPI }).TS;
}

/**
 * Desuscribe de manera defensiva cualquier objeto de suscripción nativo devuelto por TaleSpire,
 * admitiendo tanto desuscribir() como unsubscribe().
 */
export function limpiarSuscripcionNativa(sub: unknown): void {
  if (!sub || typeof sub !== "object") return;
  const s = sub as { desuscribir?: () => void; unsubscribe?: () => void };
  if (typeof s.desuscribir === "function") {
    s.desuscribir();
  } else if (typeof s.unsubscribe === "function") {
    s.unsubscribe();
  }
}
