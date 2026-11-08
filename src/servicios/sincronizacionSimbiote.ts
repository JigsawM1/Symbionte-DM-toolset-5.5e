/** Fachada de sincronización v4. Los codecs históricos sólo leen almacenamiento local. */
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import type { FragmentoCliente } from '@/tipos/talespire';
import { puedeEmitirPJ } from './sincronizacion/autoridadSync';
import { inicializarConexionSyncV4, reiniciarConexionSyncV4, emitirLocalSyncV4, solicitarSyncV4, recibirSyncV4 } from './sincronizacion/conexionSyncV4';
export { proyectarEstadoCombatePJ } from './sincronizacion/proyeccionEstadoCombate';
export const reiniciarSincronizacion = reiniciarConexionSyncV4;
export const inicializarObservadoresStoreSync = inicializarConexionSyncV4;
export const solicitarEstadoInicial = solicitarSyncV4;
export function procesarMensajeSyncEntrante(evento: { datos: unknown; strCrudo: string; fromClient?: FragmentoCliente }): Promise<void> {
  return recibirSyncV4(evento.datos, evento.fromClient);
}
export async function reaplicarCambioPendienteSync(id: string): Promise<boolean> {
  const estado = usarAlmacenDM.getState();
  const borrador = estado.borradoresSync[id];
  if (!borrador) return false;
  if (!estado.esGM && !await puedeEmitirPJ(borrador.idMiniaturaTS)) {
    estado.agregarNotificacion('Vincula la ficha a una miniatura propia para reenviar. El borrador sigue disponible.', 'advertencia');
    return false;
  }
  if (!estado.reaplicarBorradorSync(id)) return false;
  usarAlmacenDM.getState().guardarBorradorSync(id, borrador);
  emitirLocalSyncV4();
  return true;
}
