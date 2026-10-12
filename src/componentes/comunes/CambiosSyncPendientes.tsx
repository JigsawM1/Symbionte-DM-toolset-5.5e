import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { descargarArchivoJSON } from '@/servicios/sistemaTaleSpire';

export function CambiosSyncPendientes() {
  const borradores = usarAlmacenDM(s => s.borradoresSync);
  const reaplicar = usarAlmacenDM(s => s.reaplicarBorradorSync);
  const descartar = usarAlmacenDM(s => s.descartarBorradorSync);
  return <>{Object.entries(borradores).map(([id, borrador]) => <div role="status" key={id}>
    <p>Tienes un cambio pendiente de confirmación en {borrador.nombre}. Tu edición está disponible.</p>
    <button onClick={() => descargarArchivoJSON(JSON.stringify(borrador, null, 2), 'cambio-pendiente.json')}>Descargar cambio</button>
    <button onClick={() => reaplicar(id)}>Reaplicar mi cambio</button>
    <button onClick={() => descartar(id)}>Descartar cambio</button>
  </div>)}</>;
}
