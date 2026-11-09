import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Archive, AlertTriangle, RefreshCw, SlidersHorizontal, X, Trash2 } from 'lucide-react';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { recuperarArchivadoSyncV4, solicitarSyncV4 } from '@/servicios/sincronizacion/conexionSyncV4';
import { copiarAlPortapapeles } from '@/servicios/sistemaTaleSpire';
import type { RecuperacionContextosSync } from '@/tipos/estadoSyncV4';
import { logger } from '@/utiles/logger';
import { DetalleCombateArchivado } from './DetalleCombateArchivado';
import estilosSync from './EstadoSincronizacionV4.module.css';
import estilos from './RecuperacionesArchivadas.module.css';

const abreviar = (id: string) => id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;

function formatearContextoTS(clave: string): string {
  const contexto = clave.replace(/^(?:(?:migracion|archivo_[^:]+):)+/, '');
  if (contexto.startsWith('[')) {
    try {
      const datos: unknown = JSON.parse(contexto);
      if (Array.isArray(datos) && typeof datos[0] === 'string') {
        const campania = `Campaña ${abreviar(datos[0])}`;
        return typeof datos[1] === 'string' ? `${campania} · Tablero ${abreviar(datos[1])}` : campania;
      }
    } catch (error) {
      logger.error('[Sync v4] Clave de contexto archivado inválida:', error);
    }
  }
  return `Contexto ${abreviar(contexto)}`;
}

function solicitarIniciativa() {
  const { conexionSyncV4, importarIniciativaTaleSpire } = usarAlmacenDM.getState();
  if (conexionSyncV4.soyDirector) void importarIniciativaTaleSpire();
  else solicitarSyncV4();
}

function RespaldoArchivo({ archivo }: { archivo: RecuperacionContextosSync }) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const json = useMemo(() => abierto ? JSON.stringify(archivo, null, 2) : '', [abierto, archivo]);
  return (
    <details className={estilos.respaldo} onToggle={e => setAbierto(e.currentTarget.open)}>
      <summary>Guardar respaldo JSON</summary>
      {abierto && (
        <>
          <textarea aria-label="JSON de los datos archivados" readOnly value={json}
            spellCheck={false} onFocus={e => e.currentTarget.select()} />
          <button type="button" className={estilosSync.botonAccion} onClick={async () => {
            const copiado = await copiarAlPortapapeles(json);
            setMensaje(copiado ? 'Respaldo copiado al portapapeles.' : 'Selecciona el JSON y cópialo con Ctrl+C.');
          }}>Copiar JSON</button>
          <span role="status">{mensaje}</span>
        </>
      )}
    </details>
  );
}

const idCombateAnterior = 'combate-anterior';
const nombreCombate = (id: string) => id === idCombateAnterior ? 'Combate Anterior' : id;

function DetalleArchivo({ archivo, alSolicitar }: { archivo: RecuperacionContextosSync; alSolicitar: () => void }) {
  const [seleccionId, setSeleccionId] = useState(idCombateAnterior);
  const combates = [{ id: idCombateAnterior, cola: archivo.cola, ronda: archivo.ronda }, ...(archivo.combates ?? [])];
  const contextos = Object.entries(archivo.memorias).map(([id, memoria]) => ({ id, etiqueta: formatearContextoTS(id), memoria }));
  const combate = combates.find(c => c.id === seleccionId);
  const contexto = combate ? undefined : contextos.find(c => c.id === seleccionId);
  const opciones = [...combates.map(c => ({ id: c.id, etiqueta: `${nombreCombate(c.id)} (${c.cola.length})` })), ...contextos];

  return (
    <>
      <div className={estilos.alertaTactico}>
        <AlertTriangle size={14} aria-hidden="true" />
        <span>Datos guardados de una sesión previa. No se mezclarán con el combate actual automáticamente.</span>
      </div>
      <nav className={estilos.tabsSelector} aria-label="Datos archivados">
        {opciones.map(({ id, etiqueta }) => (
          <button key={id} type="button" aria-pressed={seleccionId === id}
            className={`${estilos.tabBoton} ${seleccionId === id ? estilos.tabBotonActivo : ''}`}
            onClick={() => setSeleccionId(id)}>
            {etiqueta}
          </button>
        ))}
      </nav>
      <section className={`${estilos.panelContenido} u-scroll-cef`} aria-label="Detalle del elemento seleccionado">
        {combate && <DetalleCombateArchivado combate={combate} nombre={nombreCombate(combate.id)} alSolicitar={alSolicitar} />}
        {contexto && (
          <>
            <div className={estilos.metaCabecera}>
              <strong>Contexto Anterior</strong>
              <span className={estilos.badge}>{contexto.etiqueta}</span>
            </div>
            {(['base', 'pendientes'] as const).flatMap(version => Object.values(contexto.memoria[version]).map(e => (
              <div key={`${version}:${e.id}`} className={estilos.filaFichaSync}>
                <div>
                  <strong>{e.grupos.datos.nombre}</strong>
                  <div className={estilos.textoDetalle}>
                    {version === 'base' ? 'Estado anterior' : 'Edición pendiente'} · {e.grupos.vitalidad.actual}/{e.grupos.vitalidad.maxima} PV
                  </div>
                </div>
                <button type="button" onClick={() => { void recuperarArchivadoSyncV4(e); }}>Revisar</button>
              </div>
            )))}
          </>
        )}
      </section>
    </>
  );
}

function AvisoArchivo({ archivo }: { archivo: RecuperacionContextosSync }) {
  const [vista, setVista] = useState<'inspeccion' | 'descarte' | null>(null);
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const idTituloModal = useId();
  const totalCombates = 1 + (archivo.combates?.length ?? 0);
  const totalContextos = Object.keys(archivo.memorias).length;

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (vista && dialogo && !dialogo.open) dialogo.showModal();
  }, [vista]);

  const cerrar = () => dialogoRef.current?.close();
  const ejecutarDescarte = () => {
    cerrar();
    usarAlmacenDM.getState().descartarRecuperacionContextosSync();
  };

  return (
    <>
      <div className={estilos.banner} role="region" aria-label="Aviso de sesión anterior archivada">
        <div className={estilos.bannerInfo}>
          <Archive size={14} aria-hidden="true" />
          <span>Sesión previa archivada</span>
          <span className={estilos.badge}>{totalCombates} {totalCombates === 1 ? 'combate' : 'combates'}</span>
          {totalContextos > 0 && (
            <span className={estilos.badge}>{totalContextos} {totalContextos === 1 ? 'contexto' : 'contextos'}</span>
          )}
        </div>

        <div className={estilos.bannerAcciones}>
          <button
            type="button"
            className={estilosSync.botonAccion}
            onClick={solicitarIniciativa}
          >
            <RefreshCw size={12} aria-hidden="true" /> Solicitar iniciativa
          </button>
          <button type="button" onClick={() => setVista('inspeccion')}>
            <SlidersHorizontal size={12} aria-hidden="true" /> Inspeccionar
          </button>
          <button
            type="button"
            className={estilosSync.botonDestructivo}
            onClick={() => setVista('descarte')}
            title="Descartar permanentemente los datos archivados de esta sesión"
          >
            <Trash2 size={12} aria-hidden="true" /> Descartar
          </button>
        </div>
      </div>

      <dialog
        ref={dialogoRef}
        className={estilos.dialogo}
        aria-labelledby={idTituloModal}
        onClick={e => { if (e.target === e.currentTarget) cerrar(); }}
        onClose={() => setVista(null)}
      >
        {vista && (
          <>
            <div className={estilos.cabeceraModal}>
              <h2 id={idTituloModal} className={estilos.tituloModal}>
                <Archive size={15} aria-hidden="true" />
                {vista === 'inspeccion' ? 'Centro de Recuperación' : 'Descartar datos archivados'}
              </h2>
              <div className={estilos.bannerAcciones}>
                {vista === 'inspeccion' && (
                  <button type="button" className={estilosSync.botonDestructivo} onClick={() => setVista('descarte')}>
                    <Trash2 size={12} aria-hidden="true" /> Descartar todo
                  </button>
                )}
                <button type="button" onClick={cerrar} aria-label="Cerrar modal">
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            {vista === 'inspeccion' ? (
              <DetalleArchivo archivo={archivo} alSolicitar={() => {
                solicitarIniciativa();
                cerrar();
              }} />
            ) : (
              <div className={estilos.panelContenido}>
                <p>¿Deseas descartar permanentemente los datos de la sesión anterior?</p>
                <div className={estilos.bannerAcciones}>
                  <button type="button" autoFocus onClick={cerrar}>Cancelar</button>
                  <button type="button" className={estilosSync.botonDestructivo} onClick={ejecutarDescarte}>Confirmar descarte</button>
                </div>
              </div>
            )}
            <RespaldoArchivo archivo={archivo} />
          </>
        )}
      </dialog>
    </>
  );
}

export function RecuperacionesArchivadas() {
  const archivo = usarAlmacenDM(s => s.recuperacionContextosSync);
  return archivo ? <AvisoArchivo archivo={archivo} /> : null;
}
