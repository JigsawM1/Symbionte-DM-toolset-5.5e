import { useState, useEffect, Dispatch, SetStateAction } from "react";

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
      console.warn(`[usarEstadoPersistido] Error al leer la clave "${clave}":`, err);
    }
    return typeof valorInicial === "function" ? (valorInicial as () => T)() : valorInicial;
  });

  useEffect(() => {
    // Si la clave cambia (ej. al cambiar de personaje activo), sincronizar el estado con el valor guardado
    if (typeof localStorage === "undefined") return;
    try {
      const guardado = localStorage.getItem(clave);
      if (guardado !== null) {
        setEstado(JSON.parse(guardado) as T);
      }
    } catch (err) {
      console.warn(`[usarEstadoPersistido] Error al recargar la clave "${clave}":`, err);
    }
  }, [clave]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(clave, JSON.stringify(estado));
    } catch (err) {
      console.warn(`[usarEstadoPersistido] Error al guardar la clave "${clave}":`, err);
    }
  }, [clave, estado]);

  return [estado, setEstado];
}
