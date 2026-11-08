import { usarAlmacenDM, type CriaturaIniciativa } from '@/almacen/usarAlmacenDM';
import { esDirectorSyncV4 } from './conexionSyncV4';
import { generarId } from '@/utiles/generarId';

/** La decisión explícita del director entra por el observador normal y recibe revisiones v4. */
export function recuperarMonstruoArchivado(fila: CriaturaIniciativa, campaniaId: string, copia: boolean): boolean {
  const s = usarAlmacenDM.getState();
  if (!esDirectorSyncV4() || s.contextoTaleSpire?.campania.id !== campaniaId || !fila.esMonstruo || fila.esAcompanante) return false;
  const actual = s.colaIniciativa.find(c => c.id === fila.id);
  if (!copia && (!actual?.esMonstruo || actual.esAcompanante || actual.idPersonajeDuenio)) {
    s.agregarNotificacion('No hay un monstruo con esa identidad en este combate. Puedes crear una copia local.', 'advertencia'); return false;
  }
  const recuperada = { ...structuredClone(fila), id: copia ? generarId('c_local') : fila.id,
    idPersonajeDuenio: undefined, idAcompanante: undefined, esAcompanante: false };
  usarAlmacenDM.setState({ colaIniciativa: copia ? [...s.colaIniciativa, recuperada]
    : s.colaIniciativa.map(c => c.id === fila.id ? recuperada : c) });
  return true;
}
