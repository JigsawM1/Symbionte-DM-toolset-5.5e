import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { resolverConflictoSyncV4, votarDirectorSyncV4, reintentarSyncV4, exportarPendientesSyncV4, descartarPendienteSyncV4 } from '@/servicios/sincronizacion/conexionSyncV4';
import type { GrupoSyncV4, EntidadSyncV4 } from '@/tipos/protocoloSync';
import { descargarArchivoJSON } from '@/servicios/sistemaTaleSpire';

const etiquetas: Record<GrupoSyncV4, string> = { vitalidad: 'Vida y puntos temporales',
  estados: 'Condiciones, efectos y concentración', datos: 'Datos de combate', acompanantes: 'Acompañantes' };

function ComparacionGrupo({ entidad, grupo }: { entidad: EntidadSyncV4; grupo: GrupoSyncV4 }) {
  if (grupo === 'vitalidad') {
    const v = entidad.grupos.vitalidad;
    return <p>{v.actual} / {v.maxima} PV, {v.temporal} temporales.</p>;
  }
  if (grupo === 'estados') {
    const e = entidad.grupos.estados;
    return <><p>Condiciones: {e.condiciones.join(', ') || 'Ninguna'}.</p>
      <p>Efectos: {e.efectos.map(ef => ef.nombre).join(', ') || 'Ninguno'}.</p>
      <p>Concentración: {e.concentracion?.nombre || 'Ninguna'}.</p></>;
  }
  if (grupo === 'datos') {
    const d = entidad.grupos.datos;
    return <p>{d.nombre}; iniciativa {d.iniciativa}; CA {d.ca}; percepción, investigación y perspicacia pasivas: {d.pasivas.join(', ')}.</p>;
  }
  return <p>{entidad.eliminada ? 'Acompañante retirado.' : `${entidad.grupos.acompanantes.length} acompañantes vinculados.`}</p>;
}

/** Panel no modal: una discrepancia no bloquea el resto de la ficha. */
export function EstadoSincronizacionV4() {
  const conexion = usarAlmacenDM(s => s.conexionSyncV4);
  const esGM = usarAlmacenDM(s => s.esGM);
  if (conexion.estado === 'desconectado') return null;
  return <section aria-label="Sincronización del combate">
    <p role="status">{conexion.estado === 'eligiendo' ? 'Esperando la elección del director de combate.'
      : conexion.estado === 'recuperando' ? 'Recuperando el combate compartido…'
      : conexion.soyDirector ? 'Estás dirigiendo el combate.' : 'Conectado al combate compartido.'}
      {conexion.pendientes > 0 && ` Cambios pendientes: ${conexion.pendientes}.`}</p>
    {conexion.pendientes > 0 && <details><summary>Ediciones pendientes de confirmar</summary>
      <button onClick={reintentarSyncV4}>Reintentar envío</button>
      <button onClick={() => descargarArchivoJSON(JSON.stringify(exportarPendientesSyncV4(), null, 2), 'ediciones-pendientes.json')}>Descargar ediciones</button>
      {Object.values(exportarPendientesSyncV4()).map(e => <p key={e.id}>{e.grupos.datos.nombre} <button onClick={() => descartarPendienteSyncV4(e.id)}>Descartar edición pendiente</button></p>)}
    </details>}
    {esGM && conexion.estado === 'eligiendo' && conexion.candidatos.map(c =>
      <button key={c.id} onClick={() => { void votarDirectorSyncV4(c.id); }}>Confirmar a {c.nombre} como director</button>)}
    {conexion.conflictos.map(conflicto => <details key={conflicto.id} open>
      <summary>Revisar diferencias de {conflicto.local.grupos.datos.nombre}</summary>
      <button onClick={() => descargarArchivoJSON(JSON.stringify(conflicto, null, 2), 'conflicto-sync.json')}>Descargar ambas versiones</button>
      {conflicto.grupos.map(grupo => <fieldset key={grupo}>
        <legend>{etiquetas[grupo]}</legend>
        <p>Tu edición</p><ComparacionGrupo entidad={conflicto.local} grupo={grupo} />
        <p>Combate compartido</p><ComparacionGrupo entidad={conflicto.remoto} grupo={grupo} />
        <button onClick={() => resolverConflictoSyncV4(conflicto.id, grupo, 'local', conflicto.remoto.revisiones[grupo])}>Conservar mi edición</button>
        <button onClick={() => resolverConflictoSyncV4(conflicto.id, grupo, 'compartido', conflicto.remoto.revisiones[grupo])}>Aceptar versión compartida</button>
      </fieldset>)}
    </details>)}
  </section>;
}
