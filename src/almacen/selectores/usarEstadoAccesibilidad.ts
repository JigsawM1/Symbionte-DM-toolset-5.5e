/**
 * usarEstadoAccesibilidad.ts
 * --------------------------
 * Selectores y acciones para el sistema de accesibilidad y personalización visual.
 */

import { useShallow } from "zustand/react/shallow";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO } from "@/tipos/accesibilidad";

export function usarEstadoAccesibilidad() {
  return usarAlmacenDM((s) => s.accesibilidad || CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO);
}

export function usarAccionesAccesibilidad() {
  return usarAlmacenDM(
    useShallow((s) => ({
      actualizarAccesibilidad: s.actualizarAccesibilidad,
      restablecerAccesibilidad: s.restablecerAccesibilidad
    }))
  );
}

