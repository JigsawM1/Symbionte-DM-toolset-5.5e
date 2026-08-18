/**
 * usarEstadoIniciativa.ts
 * -----------------------
 * Hook Facade que agrupa en una sola suscripción al store todos los selectores
 * relacionados con el Combat Tracker (iniciativa, turno, criaturas).
 *
 * Usar useShallow garantiza que el componente sólo se re-renderiza si alguna
 * de las propiedades referenciadas cambia (comparación shallow), no en cada
 * actualización del store completo.
 *
 * Programado 100% en español.
 */

import { useShallow } from 'zustand/react/shallow';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';

/** Estado de lectura del Combat Tracker. */
export function usarEstadoIniciativa() {
  return usarAlmacenDM(
    useShallow((s) => ({
      colaIniciativa:         s.colaIniciativa,
      indiceTurnoActivo:      s.indiceTurnoActivo,
      rondaActual:            s.rondaActual,
      criaturasSeleccionadas: s.criaturasSeleccionadas,
      asociacionesFichas:     s.asociacionesFichas,
    }))
  );
}

/** Acciones de escritura del Combat Tracker (estables por referencia — no necesitan useShallow). */
export function usarAccionesIniciativa() {
  return usarAlmacenDM(
    useShallow((s) => ({
      avanzarTurno:                      s.avanzarTurno,
      retrocederTurno:                   s.retrocederTurno,
      avanzarRonda:                      s.avanzarRonda,
      retrocederRonda:                   s.retrocederRonda,
      agregarCriaturaAIniciativa:        s.agregarCriaturaAIniciativa,
      quitarCriaturaDeIniciativa:        s.quitarCriaturaDeIniciativa,
      modificarVidaCriaturaIniciativa:   s.modificarVidaCriaturaIniciativa,
      actualizarVidaTemporal:            s.actualizarVidaTemporal,
      establecerIniciativaCriatura:      s.establecerIniciativaCriatura,
      asociarPlantillaACriatura:         s.asociarPlantillaACriatura,
      desvincularPlantillaDeCriatura:    s.desvincularPlantillaDeCriatura,
      agregarCondicionACriatura:         s.agregarCondicionACriatura,
      quitarCondicionDeCriatura:         s.quitarCondicionDeCriatura,
      agregarEfectoACriatura:            s.agregarEfectoACriatura,
      quitarEfectoDeCriatura:            s.quitarEfectoDeCriatura,
      aplicarDañoEnArea:                 s.aplicarDañoEnArea,
      aplicarCondicionEnArea:            s.aplicarCondicionEnArea,
      aplicarEfectoEnArea:               s.aplicarEfectoEnArea,
      ejecutarSalvacionEnArea:           s.ejecutarSalvacionEnArea,
      importarIniciativaTaleSpire:       s.importarIniciativaTaleSpire,
      autoLanzarIniciativaMonstruos:     s.autoLanzarIniciativaMonstruos,
      actualizarColaIniciativaDesdeTaleSpire: s.actualizarColaIniciativaDesdeTaleSpire,
      actualizarSeleccionCriaturas:      s.actualizarSeleccionCriaturas,
    }))
  );
}
