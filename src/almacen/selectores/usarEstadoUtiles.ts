/**
 * usarEstadoUtiles.ts
 * -------------------
 * Hook Facade para estado transversal: notas DM, pendientes y encuentros guardados.
 *
 * Programado 100% en español.
 */

import { useShallow } from 'zustand/react/shallow';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';

/** Estado de lectura de notas, pendientes y encuentros. */
export function usarEstadoUtiles() {
  return usarAlmacenDM(
    useShallow((s) => ({
      notasDM:             s.notasDM,
      listaPendientes:     s.listaPendientes,
      encuentrosGuardados: s.encuentrosGuardados,
    }))
  );
}

/** Acciones para notas, pendientes y encuentros. */
export function usarAccionesUtiles() {
  return usarAlmacenDM(
    useShallow((s) => ({
      guardarNotasDM:             s.guardarNotasDM,
      agregarPendiente:           s.agregarPendiente,
      alternarPendiente:          s.alternarPendiente,
      eliminarPendiente:          s.eliminarPendiente,
      guardarEncuentroActual:     s.guardarEncuentroActual,
      cargarEncuentro:            s.cargarEncuentro,
      eliminarEncuentroGuardado:  s.eliminarEncuentroGuardado,
    }))
  );
}
