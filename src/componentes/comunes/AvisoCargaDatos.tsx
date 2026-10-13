import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { descargarArchivoJSON } from '@/servicios/sistemaTaleSpire';

export function AvisoCargaDatos() {
  const error = usarAlmacenDM(s => s.errorCargaDatos);
  const original = usarAlmacenDM(s => s.blobRecuperacion);
  const cargar = usarAlmacenDM(s => s.cargarDatosPersistidos);
  if (!error) return null;
  return <div role="alert">
    <p>No se pudieron cargar los datos guardados. El guardado está suspendido para protegerlos.</p>
    <button onClick={cargar}>Reintentar carga</button>
    {original !== null && <button onClick={() => descargarArchivoJSON(original, 'datos-para-recuperar.json')}>Descargar original</button>}
    <details><summary>Detalle del error</summary>{error}</details>
  </div>;
}
