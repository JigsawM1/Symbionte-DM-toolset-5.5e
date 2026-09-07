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

/** Selector atómico para el modo de tirada activo (plano, ventaja, desventaja). */
export function usarTipoTirada() {
  return usarAlmacenDM((s) => s.tipoTirada);
}

/** Selector atómico para el sistema de magia (espacios o puntos). */
export function usarSistemaMagia() {
  return usarAlmacenDM((s) => s.sistemaMagia);
}

/** Selector atómico para la pestaña activa. */
export function usarPestanaActiva() {
  return usarAlmacenDM((s) => s.pestañaActiva);
}

/** Selector atómico para las notificaciones del sistema. */
export function usarNotificaciones() {
  return usarAlmacenDM((s) => s.notificaciones);
}

/** Selector atómico para el rol de GM. */
export function usarEsGM() {
  return usarAlmacenDM((s) => s.esGM);
}

/** Estado de lectura de la configuración y sesión (Compatibilidad retroactiva). */
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
