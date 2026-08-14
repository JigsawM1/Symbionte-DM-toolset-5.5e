/**
 * Barrel de exportación de todos los hooks Facade del store Zustand.
 *
 * Importar desde '@/almacen/selectores' en lugar de importar usarAlmacenDM
 * directamente en los componentes. Esto agrupa múltiples selectores en
 * una sola suscripción (useShallow), reduciendo re-renders innecesarios.
 *
 * Uso recomendado:
 *   import { usarEstadoIniciativa, usarAccionesIniciativa } from '@/almacen/selectores';
 */

export * from './usarEstadoIniciativa';
export * from './usarEstadoHomebrew';
export * from './usarEstadoConfiguracion';
export * from './usarEstadoUtiles';
