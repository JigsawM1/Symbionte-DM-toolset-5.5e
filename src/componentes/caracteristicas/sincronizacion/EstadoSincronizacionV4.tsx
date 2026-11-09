import { Clock, ChevronDown, RotateCcw, Trash2, AlertTriangle, UserCheck } from 'lucide-react';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { resolverConflictoSyncV4, votarDirectorSyncV4, reintentarSyncV4, exportarPendientesSyncV4, descartarPendienteSyncV4 } from '@/servicios/sincronizacion/conexionSyncV4';
import type { GrupoSyncV4, EntidadSyncV4 } from '@/tipos/protocoloSync';
import { RecuperacionesArchivadas } from './RecuperacionesArchivadas';
import estilos from './EstadoSincronizacionV4.module.css';

const etiquetas: Record<GrupoSyncV4, string> = {
  vitalidad: 'Vida y puntos temporales',
  estados: 'Condiciones, efectos y concentración',
  datos: 'Datos de combate',
  acompanantes: 'Acompañantes',
};

function ComparacionGrupo({ entidad, grupo }: { entidad: EntidadSyncV4; grupo: GrupoSyncV4 }) {
  if (grupo === 'vitalidad') {
    const v = entidad.grupos.vitalidad;
    return <p>{v.actual} / {v.maxima} PV, {v.temporal} temporales.</p>;
  }
  if (grupo === 'estados') {
    const e = entidad.grupos.estados;
    return (
      <>
        <p>Condiciones: {e.condiciones.join(', ') || 'Ninguna'}.</p>
        <p>Efectos: {e.efectos.map(ef => ef.nombre).join(', ') || 'Ninguno'}.</p>
        <p>Concentración: {e.concentracion?.nombre || 'Ninguna'}.</p>
      </>
    );
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

  const claseLed = conexion.estado === 'sin-director' || conexion.estado === 'eligiendo' || conexion.estado === 'recuperando'
    ? estilos.ledAmbar
    : estilos.ledVerde;

  return (
    <footer className={`${estilos.panel} u-scroll-cef`} aria-label="Sincronización del combate">
      <div className={estilos.barraEstado} role="status">
        <span className={`${estilos.ledEstado} ${claseLed}`} aria-hidden="true" />
        <span className={estilos.textoEstado}>
          {conexion.estado === 'sin-director' ? 'No hay GM conectado. Tus ediciones locales se conservan.'
            : conexion.estado === 'eligiendo' ? 'Esperando la elección del director de combate.'
            : conexion.estado === 'recuperando' ? 'Recuperando el combate compartido…'
            : conexion.soyDirector ? 'Estás dirigiendo el combate.' : 'Conectado al combate compartido.'}
        </span>
        {conexion.pendientes > 0 && (
          <span className="u-sr-only">
            Cambios pendientes: {conexion.pendientes}.
          </span>
        )}
      </div>

      {conexion.pendientes > 0 && (
        <details className={estilos.desplegablePendientes} open>
          <summary className={estilos.resumen}>
            <span className={estilos.cabeceraSummary}>
              <Clock size={13} className={estilos.iconoAviso} aria-hidden="true" />
              <span>Ediciones pendientes</span>
              <span className={estilos.contador}>{conexion.pendientes}</span>
            </span>
            <ChevronDown size={13} className={estilos.chevron} aria-hidden="true" />
          </summary>
          <div className={estilos.cuerpoPendientes}>
            <ul className={estilos.listaPendientes}>
              {Object.values(exportarPendientesSyncV4()).map(e => (
                <li key={e.id} className={estilos.filaPendiente}>
                  <span className={estilos.nombreEntidad}>{e.grupos.datos.nombre}</span>
                  <button
                    type="button"
                    className={estilos.botonDestructivo}
                    onClick={() => descartarPendienteSyncV4(e.id)}
                    aria-label={`Descartar la edición pendiente de ${e.grupos.datos.nombre}`}
                  >
                    <Trash2 size={13} aria-hidden="true" /> Descartar
                  </button>
                </li>
              ))}
            </ul>
            {conexion.bloqueos?.map(b => (
              <div key={b.id} className={estilos.alertaBloqueo}>
                <AlertTriangle size={13} aria-hidden="true" />
                <span>{b.motivo}</span>
              </div>
            ))}
            <div className={estilos.accionesCola}>
              <button
                type="button"
                className={estilos.botonAccion}
                onClick={reintentarSyncV4}
              >
                <RotateCcw size={13} aria-hidden="true" /> Reintentar envío
              </button>
            </div>
          </div>
        </details>
      )}

      {esGM && conexion.estado === 'eligiendo' && conexion.candidatos.map(c => (
        <button
          key={c.id}
          type="button"
          className={estilos.botonCandidato}
          onClick={() => { void votarDirectorSyncV4(c.id); }}
        >
          <UserCheck size={12} aria-hidden="true" /> Confirmar a {c.nombre} como director
        </button>
      ))}

      {conexion.conflictos.map(conflicto => (
        <details key={conflicto.id} className={estilos.desplegableConflicto} open>
          <summary className={estilos.resumen}>
            <span className={estilos.cabeceraSummary}>
              <AlertTriangle size={13} className={estilos.iconoAviso} aria-hidden="true" />
              <span>Diferencias en {conflicto.local.grupos.datos.nombre}</span>
            </span>
            <ChevronDown size={13} className={estilos.chevron} aria-hidden="true" />
          </summary>
          <div className={estilos.cuerpoPendientes}>
            {conflicto.grupos.map(grupo => (
              <fieldset key={grupo} className={estilos.fieldsetConflicto}>
                <legend className={estilos.legendConflicto}>{etiquetas[grupo]}</legend>
                <div className={estilos.filaComparacion}>
                  <span className={estilos.etiquetaComparacion}>Tu edición:</span>
                  <ComparacionGrupo entidad={conflicto.local} grupo={grupo} />
                </div>
                <div className={estilos.filaComparacion}>
                  <span className={estilos.etiquetaComparacion}>Combate compartido:</span>
                  <ComparacionGrupo entidad={conflicto.remoto} grupo={grupo} />
                </div>
                <div className={estilos.barraAccionesPendientes}>
                  <button
                    type="button"
                    className={estilos.botonAccion}
                    onClick={() => resolverConflictoSyncV4(conflicto.id, grupo, 'local', conflicto.remoto.revisiones[grupo])}
                  >
                    Conservar mi edición
                  </button>
                  <button
                    type="button"
                    className={estilos.botonDestructivo}
                    onClick={() => resolverConflictoSyncV4(conflicto.id, grupo, 'compartido', conflicto.remoto.revisiones[grupo])}
                  >
                    Aceptar versión compartida
                  </button>
                </div>
              </fieldset>
            ))}
          </div>
        </details>
      ))}

      <RecuperacionesArchivadas />
    </footer>
  );
}
