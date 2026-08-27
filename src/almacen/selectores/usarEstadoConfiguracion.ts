/**
 * usarEstadoConfiguracion.ts
 * --------------------------
 * Hook Facade que agrupa en una sola suscripción todos los selectores
 * relacionados con la configuración de sesión DM (modo GM, pestaña, campaña,
 * método de vida, notificaciones, etc.).
 *
 */

import { useShallow } from 'zustand/react/shallow';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';

/** Estado de lectura de la configuración y sesión. */
export function usarEstadoConfiguracion() {
  return usarAlmacenDM(
    useShallow((s) => ({
      esGM:                          s.esGM,
      pestañaActiva:                 s.pestañaActiva,
      campañaNombre:                 s.campañaNombre,
      cargandoDatos:                 s.cargandoDatos,
      metodoVidaMonstruo:            s.metodoVidaMonstruo,
      sistemaMagia:                  s.sistemaMagia,
      mostrarPorcentajeVidaAJugadores: s.mostrarPorcentajeVidaAJugadores,
      notificaciones:                s.notificaciones,
      tipoTirada:                    s.tipoTirada,
    }))
  );
}

/** Acciones de escritura para la configuración de sesión. */
export function usarAccionesConfiguracion() {
  return usarAlmacenDM(
    useShallow((s) => ({
      establecerPestaña:                          s.establecerPestaña,
      establecerDatosCampaña:                     s.establecerDatosCampaña,
      establecerMetodoVidaMonstruo:               s.establecerMetodoVidaMonstruo,
      establecerSistemaMagia:                     s.establecerSistemaMagia,
      establecerMostrarPorcentajeVidaAJugadores:  s.establecerMostrarPorcentajeVidaAJugadores,
      establecerTipoTirada:                       s.establecerTipoTirada,
      agregarNotificacion:                        s.agregarNotificacion,
      eliminarNotificacion:                       s.eliminarNotificacion,
      cargarDatosPersistidos:                     s.cargarDatosPersistidos,
      restablecerDatosDeFabrica:                  s.restablecerDatosDeFabrica,
    }))
  );
}
