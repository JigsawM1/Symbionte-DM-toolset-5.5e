import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { logger } from "@/utiles/logger";

/**
 * Hook para sincronizar estado de componentes con localStorage.
 * Garantiza que cuando el usuario cambia de pestaña, desmonta vistas
 * o reinicia la sesión, sus selecciones y filtros se conserven exactamente.
 */
export function usarEstadoPersistido<T>(
  clave: string,
  valorInicial: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [estado, setEstado] = useState<T>(() => {
    if (typeof localStorage === "undefined") {
      return typeof valorInicial === "function" ? (valorInicial as () => T)() : valorInicial;
    }
    try {
      const guardado = localStorage.getItem(clave);
      if (guardado !== null) {
        return JSON.parse(guardado) as T;
      }
    } catch (err) {
      logger.warn(`[usarEstadoPersistido] Error al leer la clave "${clave}":`, err);
    }
    return typeof valorInicial === "function" ? (valorInicial as () => T)() : valorInicial;
  });

  const clavePrevia = useRef(clave);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;

    // Si la clave cambia (ej. al alternar de personaje activo), sincronizar con la nueva clave
    // y abortar la persistencia en este ciclo para evitar sobreescribir la clave nueva con el estado previo.
    if (clavePrevia.current !== clave) {
      clavePrevia.current = clave;
      try {
        const guardado = localStorage.getItem(clave);
        if (guardado !== null) {
          setEstado(JSON.parse(guardado) as T);
        } else {
          const valorDefecto = typeof valorInicial === "function" ? (valorInicial as () => T)() : valorInicial;
          setEstado(valorDefecto);
        }
      } catch (err) {
        logger.warn(`[usarEstadoPersistido] Error al recargar la clave "${clave}":`, err);
      }
      return;
    }

    try {
      localStorage.setItem(clave, JSON.stringify(estado));
    } catch (err) {
      logger.warn(`[usarEstadoPersistido] Error al guardar la clave "${clave}":`, err);
    }
  }, [clave, estado, valorInicial]);

  return [estado, setEstado];
}
