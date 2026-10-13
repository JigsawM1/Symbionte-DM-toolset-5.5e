import { useEffect, useId, useRef, useState } from 'react';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { copiarAlPortapapeles, descargarArchivoJSON } from '@/servicios/sistemaTaleSpire';
import { reaplicarCambioPendienteSync } from '@/servicios/sincronizacionSimbiote';
import type { EstadoCombatePJ } from '@/tipos/sync';
import estilos from './CambiosSyncPendientes.module.css';

interface ExportacionCambio {
  nombre: string;
  contenido: string;
  mensaje: string;
}

export function CambiosSyncPendientes() {
  const borradores = usarAlmacenDM(s => s.borradoresSync);
  const descartar = usarAlmacenDM(s => s.descartarBorradorSync);
  const [exportacion, setExportacion] = useState<ExportacionCambio | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    if (exportacion && dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, [exportacion]);

  const descargar = (borrador: EstadoCombatePJ) => {
    const contenido = JSON.stringify(borrador, null, 2);
    const solicitada = descargarArchivoJSON(contenido, 'cambio-pendiente.json');
    setExportacion({ nombre: borrador.nombre, contenido, mensaje: solicitada
      ? 'Se solicitó la descarga de cambio-pendiente.json. Si no aparece el archivo, copia este JSON y guárdalo en un archivo .json.'
      : 'No se pudo iniciar la descarga. Copia este JSON y guárdalo en un archivo .json.' });
  };

  const copiar = async () => {
    if (!exportacion) return;
    const contenido = exportacion.contenido;
    const exito = await copiarAlPortapapeles(contenido);
    setExportacion(actual => actual?.contenido === contenido ? { ...actual, mensaje: exito
      ? 'Cambio copiado al portapapeles. Puedes pegarlo y guardarlo en un archivo .json.'
      : 'No se pudo copiar automáticamente. Selecciona el JSON y cópialo con Ctrl+C.' } : actual);
  };

  return <>{Object.entries(borradores).map(([id, borrador]) => <div role="status" key={id}>
    <p>Tienes un cambio pendiente de confirmación en {borrador.nombre}. Tu edición está disponible.</p>
    <button onClick={() => descargar(borrador)}>Descargar cambio</button>
    <button onClick={() => { void reaplicarCambioPendienteSync(id); }}>Reaplicar mi cambio</button>
    <button onClick={() => descartar(id)}>Descartar cambio</button>
  </div>)}
    {exportacion && <dialog ref={dialogo} className={estilos.dialogo} aria-labelledby={idTitulo}
      onCancel={() => setExportacion(null)} onClose={() => setExportacion(null)}>
      <h2 id={idTitulo}>Guardar cambio de {exportacion.nombre}</h2>
      <p role="status">{exportacion.mensaje}</p>
      <textarea aria-label="JSON del cambio pendiente" readOnly value={exportacion.contenido}
        spellCheck={false} autoFocus onFocus={e => e.currentTarget.select()} />
      <div className={estilos.acciones}>
        <button type="button" onClick={() => { void copiar(); }}>Copiar JSON</button>
        <button type="button" onClick={() => setExportacion(null)}>Cerrar</button>
      </div>
    </dialog>}
  </>;
}
