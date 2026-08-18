/**
 * usarEstadoHomebrew.ts
 * ---------------------
 * Hook Facade que agrupa en una sola suscripción todos los selectores
 * relacionados con la base de datos Homebrew (monstruos, hechizos, objetos).
 *
 * Programado 100% en español.
 */

import { useShallow } from 'zustand/react/shallow';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';

/** Estado de lectura de la base de datos Homebrew. */
export function usarEstadoHomebrew() {
  return usarAlmacenDM(
    useShallow((s) => ({
      baseDatosMonstruos:          s.baseDatosMonstruos,
      baseDatosHechizos:           s.baseDatosHechizos,
      objetosHomebrew:             s.objetosHomebrew,
      modoHomebrew:                s.modoHomebrew,
      tipoHomebrewActivo:          s.tipoHomebrewActivo,
      objetoPlantillaSeleccionado: s.objetoPlantillaSeleccionado,
    }))
  );
}

/** Acciones de escritura para la base de datos Homebrew. */
export function usarAccionesHomebrew() {
  return usarAlmacenDM(
    useShallow((s) => ({
      establecerModoHomebrew:         s.establecerModoHomebrew,
      establecerTipoHomebrew:         s.establecerTipoHomebrew,
      agregarMonstruoHomebrew:        s.agregarMonstruoHomebrew,
      actualizarMonstruoHomebrew:     s.actualizarMonstruoHomebrew,
      eliminarMonstruoHomebrew:       s.eliminarMonstruoHomebrew,
      agregarHechizoHomebrew:         s.agregarHechizoHomebrew,
      actualizarHechizoHomebrew:      s.actualizarHechizoHomebrew,
      eliminarHechizoHomebrew:        s.eliminarHechizoHomebrew,
      agregarObjetoHomebrew:          s.agregarObjetoHomebrew,
      actualizarObjetoHomebrew:       s.actualizarObjetoHomebrew,
      eliminarObjetoHomebrew:         s.eliminarObjetoHomebrew,
      usarObjetoComoPlantilla:        s.usarObjetoComoPlantilla,
      limpiarObjetoPlantilla:         s.limpiarObjetoPlantilla,
      importarBaseDatosJSONCompleta:  s.importarBaseDatosJSONCompleta,
    }))
  );
}
