import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { descargarArchivoJSON } from '@/servicios/sistemaTaleSpire';
import { recuperarArchivadoSyncV4 } from '@/servicios/sincronizacion/conexionSyncV4';
import { capturarSyncV4 } from '@/servicios/sincronizacion/proyeccionSyncV4';
import { recuperarMonstruoArchivado } from '@/servicios/sincronizacion/recuperarMonstruoArchivado';
import type { CriaturaIniciativa } from '@/almacen/usarAlmacenDM';

const resumen = (c: CriaturaIniciativa) => `${c.vidaActual}/${c.vidaMaxima} PV, ${c.vidaTemporal ?? 0} temporales, CA ${c.ca}, iniciativa ${c.iniciativa}. Condiciones: ${c.condiciones.join(', ') || 'ninguna'}. Efectos: ${c.efectos?.map(e => e.nombre).join(', ') || 'ninguno'}.`;

export function RecuperacionesArchivadas() {
  const archivo = usarAlmacenDM(s => s.recuperacionContextosSync);
  const personajes = usarAlmacenDM(s => s.personajes);
  const contexto = usarAlmacenDM(s => s.contextoTaleSpire);
  const cola = usarAlmacenDM(s => s.colaIniciativa);
  const director = usarAlmacenDM(s => s.conexionSyncV4.soyDirector);
  if (!archivo) return null;
  return <details><summary>Datos anteriores archivados para revisión</summary>
    <p>Estos datos no se reenviarán automáticamente. Afíliate a la campaña correcta y revisa cada diferencia.</p>
    <button onClick={() => descargarArchivoJSON(JSON.stringify(archivo, null, 2), 'recuperacion-contextos-sync.json')}>Descargar originales y combate anterior</button>
    {[{ id: 'combate-anterior', cola: archivo.cola, ronda: archivo.ronda }, ...(archivo.combates ?? [])].map(c => <details key={c.id}>
      <summary>{c.id}: {c.cola.length} participantes, ronda {c.ronda}</summary>
      <button onClick={() => descargarArchivoJSON(JSON.stringify({ cola_iniciativa: c.cola, ronda_actual: c.ronda }, null, 2), `${c.id}.json`)}>Descargar combate</button>
      {director && contexto && c.cola.filter(f => f.esMonstruo && !f.esAcompanante).map(f => <details key={f.id}>
        <summary>Revisar {f.nombre}</summary><p>Archivado: {resumen(f)}</p>
        {cola.find(actual => actual.id === f.id && actual.esMonstruo) && <>
          <p>Actual: {resumen(cola.find(actual => actual.id === f.id)! )}</p>
          <button onClick={() => recuperarMonstruoArchivado(f, contexto.campania.id, false)}>Aplicar valores archivados</button>
        </>}
        <button onClick={() => recuperarMonstruoArchivado(f, contexto.campania.id, true)}>Crear copia local del monstruo</button>
      </details>)}
      {contexto && capturarSyncV4({ ...usarAlmacenDM.getState(), personajes, colaIniciativa: c.cola, esGM: true }, '', contexto.campania.id).entidades
        .filter(e => e.ficha && c.cola.some(f => f.id === e.fila)).map(e => <p key={e.id}>{e.grupos.datos.nombre}: {e.grupos.vitalidad.actual} PV{' '}
          <button onClick={() => { void recuperarArchivadoSyncV4(e); }}>Revisar valores de esta ficha</button></p>)}
    </details>)}
    {Object.entries(archivo.memorias).map(([contexto, memoria]) => <details key={contexto}>
      <summary>Contexto anterior: {contexto}</summary>
      {(['base', 'pendientes'] as const).map(version => Object.values(memoria[version]).map(e => <p key={`${version}:${e.id}`}>
        {e.grupos.datos.nombre} · {version === 'base' ? 'Estado anterior' : 'Edición pendiente'} · {e.grupos.vitalidad.actual}/{e.grupos.vitalidad.maxima} PV{' '}
        <button onClick={() => { void recuperarArchivadoSyncV4(e); }}>Revisar recuperación</button>
      </p>))}
    </details>)}
  </details>;
}
