import type { EstadoDM } from '@/almacen/usarAlmacenDM';
import { EsquemaGruposSyncV4, type EntidadSyncV4, type GrupoSyncV4, type MensajeSyncV4 } from '@/tipos/protocoloSync';
import { igualesGrupoSyncV4 } from './reconciliacionSyncV4';
import { GRUPOS_SYNC_V4 } from '@/tipos/protocoloSync';
import type { ReplicaSyncV4 } from './replicaSyncV4';
import type { DependenciasMotorSyncV4, DatosLocalesSyncV4 } from './motorSyncV4';
import type { MetaSyncV4 } from '@/tipos/protocoloSync';
import type { InfoCliente } from '@/tipos/talespire';
import type { EstadoConexionSyncV4 } from '@/tipos/estadoSyncV4';
type Propuesta = Extract<MensajeSyncV4, { t: 'PROPUESTA' }>;
export function crearPropuestaPendiente(replica: ReplicaSyncV4, local: EntidadSyncV4, grupos: GrupoSyncV4[],
  sobre: Pick<Propuesta, 'v' | 'contexto' | 'emisor' | 'sesionEmisor'>): Propuesta {
  const base = replica.base[local.id];
  return { ...sobre, t: 'PROPUESTA', operacion: crypto.randomUUID(), entidad: local.id,
    registro: base?.ficha ? undefined : local,
    restaurar: base?.eliminada && !local.eliminada && replica.resoluciones[local.id]?.includes('acompanantes') ? true : undefined,
    revisionesHijos: Object.fromEntries(Object.values(replica.base).filter(e => e.padre === local.id).map(e => [e.id, e.revision])),
    bases: base?.revisiones ?? { vitalidad: 0, estados: 0, datos: 0, acompanantes: 0 },
    cambios: EsquemaGruposSyncV4.partial().parse(Object.fromEntries(grupos.map(g => [g, local.grupos[g]]))),
    resolver: replica.resoluciones[local.id] ?? [] };
}

export function guardarMemoriaMotor(deps: DependenciasMotorSyncV4, replica: ReplicaSyncV4, meta: MetaSyncV4, revision: number): void {
  deps.guardar({ ...replica.memoria(), formato: 2, metaConfirmada: structuredClone(meta), revisionConfirmada: revision });
}
export function conservarLocalesIniciales(replica: ReplicaSyncV4, locales: EntidadSyncV4[], snapshot: DatosLocalesSyncV4, jugador: string): void {
  for (const local of locales) if (local.duenio === jugador && !replica.base[local.id] && !replica.pendientes[local.id]) {
    const remoto = snapshot.entidades.find(e => e.id === local.id);
    if (!remoto || GRUPOS_SYNC_V4.some(g => !igualesGrupoSyncV4(g, local.grupos, remoto.grupos))) replica.editar(local);
  }
}

/** La migración conserva los originales, sin conferir autoridad a estados de procedencia incierta. */
export function migrarContextosSync(s: EstadoDM): Partial<EstadoDM> {
  if (s.versionContextosSync === 2) return {};
  const tieneDatos = Object.keys(s.memoriaSyncV4).length > 0 || s.colaIniciativa.length > 0;
  const previo = s.recuperacionContextosSync;
  const archivo = tieneDatos ? structuredClone({ memorias: s.memoriaSyncV4, cola: s.colaIniciativa, ronda: s.rondaActual, indice: s.indiceTurnoActivo }) : null;
  const combinado = previo && archivo ? { ...previo, memorias: { ...previo.memorias,
    ...Object.fromEntries(Object.entries(archivo.memorias).map(([clave, memoria]) => [`migracion:${clave}`, memoria])) },
    combates: [...(previo.combates ?? []), { id: 'combate-antes-de-migracion', cola: archivo.cola, ronda: archivo.ronda, indice: archivo.indice }] } : previo ?? archivo;
  return { versionContextosSync: 2, recuperacionContextosSync: combinado,
    memoriaSyncV4: {}, colaIniciativa: [], rondaActual: 1, indiceTurnoActivo: 0 };
}

export async function recuperarEntidadArchivada(replica: ReplicaSyncV4, entidad: EntidadSyncV4,
  locales: EntidadSyncV4[], jugador: string, propiedades: () => Promise<Set<string>>, vigente: () => boolean): Promise<boolean> {
  const base = replica.base[entidad.id];
  const local = locales.find(e => e.id === entidad.id && e.ficha === entidad.ficha && e.padre === entidad.padre)
    ?? (entidad.padre && locales.some(e => e.id === entidad.padre) && base?.ficha === entidad.ficha && base?.padre === entidad.padre ? base : undefined);
  if (!local || !base || (!local.padre && entidad.eliminada !== base.eliminada)) return false;
  const mini = local.padre ? locales.find(e => e.id === local.padre)?.miniatura : local.miniatura;
  const propias = await propiedades();
  if (!vigente() || replica.base[entidad.id] !== base || !mini || !propias.has(mini.toLowerCase()) || (local.miniatura && !propias.has(local.miniatura.toLowerCase()))) return false;
  if (local.padre && ![jugador, 'sin-vincular'].includes(replica.base[local.padre]?.duenio)) return false;
  const grupos = GRUPOS_SYNC_V4.filter(g => !igualesGrupoSyncV4(g, entidad.grupos, base.grupos));
  if (entidad.eliminada !== base.eliminada && !grupos.includes('acompanantes')) grupos.push('acompanantes');
  if (!grupos.length) return true;
  const pendiente = { ...local, duenio: jugador, eliminada: entidad.eliminada, grupos: structuredClone(entidad.grupos) };
  replica.editar(pendiente);
  replica.conflictos.set(local.id, { id: local.id, local: pendiente, remoto: base, grupos });
  return true;
}

export function estadoVistaSyncV4(director: string, recuperando: boolean, soyDirector: boolean,
  gms: InfoCliente[], replica: ReplicaSyncV4, jugador: string, bloqueadas: ReadonlySet<string>): EstadoConexionSyncV4 {
  return {
    estado: director === 'pendiente' ? gms.length ? 'eligiendo' : 'sin-director' : recuperando ? 'recuperando' : 'conectado',
    director: director === 'pendiente' ? null : director, soyDirector,
    candidatos: gms.map(c => ({ id: c.id, nombre: c.player.name })),
    conflictos: [...replica.conflictos.values()], pendientes: Object.keys(replica.pendientes).length,
    bloqueos: Object.values(replica.pendientes).flatMap(e => e.duenio !== jugador
      ? [{ id: e.id, motivo: 'Pendiente de revisión por su dueño.' }] : bloqueadas.has(e.id)
        ? [{ id: e.id, motivo: 'Vinculación o propiedad no autorizada. Revisa la miniatura antes de reintentar.' }] : []),
  };
}
