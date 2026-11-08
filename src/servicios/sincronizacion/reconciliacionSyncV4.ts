import {
  EsquemaGruposSyncV4, GRUPOS_SYNC_V4,
  type GrupoSyncV4, type GruposSyncV4, type EntidadSyncV4, type MensajeSyncV4, type MetaSyncV4,
} from '@/tipos/protocoloSync';

/** Compara contenido semántico; el orden de condiciones y efectos no es una edición. */
export function igualesGrupoSyncV4(grupo: GrupoSyncV4, a: GruposSyncV4, b: GruposSyncV4): boolean {
  const normalizar = (valor: GruposSyncV4): unknown => {
    const limpio = EsquemaGruposSyncV4.parse(valor);
    if (grupo === 'estados') return { ...limpio.estados,
      condiciones: [...limpio.estados.condiciones].sort(),
      efectos: [...limpio.estados.efectos].sort((x, y) => x.id.localeCompare(y.id)) };
    if (grupo === 'acompanantes') return [...limpio.acompanantes].sort((x, y) => x.id.localeCompare(y.id));
    return limpio[grupo];
  };
  return JSON.stringify(normalizar(a)) === JSON.stringify(normalizar(b));
}

/** Sólo una variación de la proyección local constituye una edición, no una diferencia ya recibida. */
export function edicionLocalSyncV4(local: EntidadSyncV4, anterior?: EntidadSyncV4, referencia?: EntidadSyncV4): EntidadSyncV4 {
  const cambiados = GRUPOS_SYNC_V4.filter(g => !anterior || !igualesGrupoSyncV4(g, local.grupos, anterior.grupos));
  return { ...local, grupos: EsquemaGruposSyncV4.parse({ ...(referencia ?? local).grupos,
    ...Object.fromEntries(cambiados.map(g => [g, local.grupos[g]])) }) };
}

export function metaDisponibleSyncV4(meta: MetaSyncV4, entidades: EntidadSyncV4[]): MetaSyncV4 {
  const vivos = new Set(entidades.filter(e => !e.eliminada).map(e => e.fila ?? e.id));
  const orden = meta.orden.filter(id => vivos.has(id));
  const indice = meta.activo ? meta.orden.indexOf(meta.activo) : -1;
  const siguiente = [...meta.orden.slice(indice + 1), ...meta.orden.slice(0, indice)].find(id => vivos.has(id));
  return { ...meta, orden, activo: meta.activo && orden.includes(meta.activo) ? meta.activo : siguiente ?? orden[0] ?? null };
}

export interface ReconciliacionSyncV4 {
  proponer: GrupoSyncV4[];
  aceptar: GrupoSyncV4[];
  conflictos: GrupoSyncV4[];
}

/** No muta ni descarta la edición local. Una base desconocida exige revisión. */
export function reconciliarSyncV4(base: GruposSyncV4 | undefined, local: GruposSyncV4,
  remoto: GruposSyncV4): ReconciliacionSyncV4 {
  const resultado: ReconciliacionSyncV4 = { proponer: [], aceptar: [], conflictos: [] };
  for (const grupo of GRUPOS_SYNC_V4) {
    if (igualesGrupoSyncV4(grupo, local, remoto)) continue;
    if (!base) resultado.conflictos.push(grupo);
    else if (igualesGrupoSyncV4(grupo, local, base)) resultado.aceptar.push(grupo);
    else if (igualesGrupoSyncV4(grupo, remoto, base)) resultado.proponer.push(grupo);
    else resultado.conflictos.push(grupo);
  }
  return resultado;
}

type Propuesta = Extract<MensajeSyncV4, { t: 'PROPUESTA' }>;
export interface DecisionPropuestaSyncV4 {
  estado: 'aplicado' | 'conflicto' | 'rechazado';
  conflictos: GrupoSyncV4[];
  entidad: EntidadSyncV4;
}

/** La identidad nativa y la miniatura deben autorizarse antes de invocar esta función. */
export function evaluarPropuestaSyncV4(actual: EntidadSyncV4, propuesta: Propuesta,
  jugadorVerificado: string, revision: number): DecisionPropuestaSyncV4 {
  const rechazada: DecisionPropuestaSyncV4 = { estado: 'rechazado', conflictos: [], entidad: actual };
  const decisionBaja = propuesta.resolver.includes('acompanantes') && propuesta.cambios.acompanantes !== undefined;
  if ((actual.eliminada && !decisionBaja) || (propuesta.restaurar && !decisionBaja)
    || actual.id !== propuesta.entidad || actual.duenio !== jugadorVerificado
    || !Number.isSafeInteger(revision) || revision <= actual.revision) return rechazada;
  const grupos = GRUPOS_SYNC_V4.filter(g => propuesta.cambios[g] !== undefined);
  if (grupos.length === 0) return rechazada;
  const conflictos = grupos.filter(g => propuesta.bases[g] !== actual.revisiones[g]);
  if (conflictos.length) return { estado: 'conflicto', conflictos, entidad: actual };
  const revisiones = { ...actual.revisiones };
  for (const grupo of grupos) revisiones[grupo] = revision;
  return { estado: 'aplicado', conflictos: [], entidad: { ...actual, revision, revisiones,
    eliminada: actual.eliminada && !propuesta.restaurar,
    grupos: EsquemaGruposSyncV4.parse({ ...actual.grupos, ...propuesta.cambios }) } };
}
