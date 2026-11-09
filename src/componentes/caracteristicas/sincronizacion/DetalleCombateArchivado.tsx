import { Check, Copy, Heart, RefreshCw, Shield, Sparkles } from 'lucide-react';
import { usarAlmacenDM, type CriaturaIniciativa } from '@/almacen/usarAlmacenDM';
import { recuperarArchivadoSyncV4 } from '@/servicios/sincronizacion/conexionSyncV4';
import { capturarEntidadesSyncV4 } from '@/servicios/sincronizacion/proyeccionSyncV4';
import { recuperarMonstruoArchivado } from '@/servicios/sincronizacion/recuperarMonstruoArchivado';
import type { RecuperacionContextosSync } from '@/tipos/estadoSyncV4';
import estilosSync from './EstadoSincronizacionV4.module.css';
import estilos from './RecuperacionesArchivadas.module.css';

interface DetalleCombateArchivadoProps {
  combate: Pick<RecuperacionContextosSync, 'cola' | 'ronda'>;
  nombre: string;
  alSolicitar: () => void;
}

function StatblockCriatura({ criatura, etiqueta }: { criatura: CriaturaIniciativa; etiqueta: string }) {
  return (
    <div className={estilos.columnaStat}>
      <span className={estilos.etiquetaColumna}>{etiqueta}</span>
      <div className={estilos.metricasFila}>
        <span className={estilos.chipPv}>
          <Heart size={10} aria-hidden="true" /> {criatura.vidaActual}/{criatura.vidaMaxima} PV
          {criatura.vidaTemporal ? ` (+${criatura.vidaTemporal})` : ''}
        </span>
        <span className={estilos.chipCa}>
          <Shield size={10} aria-hidden="true" /> CA {criatura.ca}
        </span>
        <span className={estilos.chipInic}>Inic. {criatura.iniciativa}</span>
      </div>
      <p className={estilos.textoDetalle}>
        <strong>Condiciones:</strong> {criatura.condiciones.length > 0 ? criatura.condiciones.join(', ') : 'Ninguna'}.
      </p>
      {criatura.efectos && criatura.efectos.length > 0 && (
        <p className={estilos.textoDetalle}>
          <strong>Efectos:</strong> {criatura.efectos.map(e => e.nombre).join(', ')}.
        </p>
      )}
    </div>
  );
}

export function DetalleCombateArchivado({ combate, nombre, alSolicitar }: DetalleCombateArchivadoProps) {
  const personajes = usarAlmacenDM(s => s.personajes);
  const contexto = usarAlmacenDM(s => s.contextoTaleSpire);
  const cola = usarAlmacenDM(s => s.colaIniciativa);
  const director = usarAlmacenDM(s => s.conexionSyncV4.soyDirector);

  const monstruosArchivados = combate.cola.filter(f => f.esMonstruo && !f.esAcompanante);
  const idsArchivados = new Set(combate.cola.map(fila => fila.id));
  const fichasSincronizadas = contexto && combate.cola.length
    ? capturarEntidadesSyncV4({ personajes, colaIniciativa: combate.cola, esGM: true }, '', contexto.campania.id)
      .filter(e => e.ficha && e.fila && idsArchivados.has(e.fila))
    : [];

  return (
    <>
      <div className={estilos.metaCabecera}>
        <strong>{nombre}</strong>
        <span className={estilos.badge}>Ronda {combate.ronda} · {combate.cola.length} combatientes</span>
      </div>

      {combate.cola.length === 0 && (
        <div className={estilos.estadoVacio}>
          <p>Este combate archivado no tiene participantes registrados (0 combatientes).</p>
          <button
            type="button"
            className={estilosSync.botonAccion}
            onClick={alSolicitar}
          >
            <RefreshCw size={12} aria-hidden="true" /> Solicitar iniciativa
          </button>
        </div>
      )}

      {director && contexto && monstruosArchivados.map(f => {
        const actual = cola.find(c => c.id === f.id && c.esMonstruo);
        return (
          <article key={f.id} className={estilos.tarjetaCriatura}>
            <div className={estilos.metaCabecera}>
              <span>{f.nombre}</span>
              <span className={estilos.badge}>Monstruo</span>
            </div>
            <div className={actual ? estilos.cuadriculaComparativa : ''}>
              <StatblockCriatura criatura={f} etiqueta="Archivado en sesión previa" />
              {actual && <StatblockCriatura criatura={actual} etiqueta="Estado en combate actual" />}
            </div>
            <div className={estilos.barraBotonesCriatura}>
              {actual && (
                <button
                  type="button"
                  className={estilos.botonAplicar}
                  onClick={() => recuperarMonstruoArchivado(f, contexto.campania.id, false)}
                >
                  <Check size={11} aria-hidden="true" /> Aplicar archivado
                </button>
              )}
              <button type="button" onClick={() => recuperarMonstruoArchivado(f, contexto.campania.id, true)}>
                <Copy size={11} aria-hidden="true" /> Crear copia local
              </button>
            </div>
          </article>
        );
      })}

      {fichasSincronizadas.map(e => (
        <div key={e.id} className={estilos.filaFichaSync}>
          <span><strong>{e.grupos.datos.nombre}</strong> · {e.grupos.vitalidad.actual} PV</span>
          <button type="button" onClick={() => { void recuperarArchivadoSyncV4(e); }}>
            <Sparkles size={11} aria-hidden="true" /> Revisar ficha
          </button>
        </div>
      ))}
    </>
  );
}
