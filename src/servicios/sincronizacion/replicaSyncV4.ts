import { EsquemaGruposSyncV4, GRUPOS_SYNC_V4, type EntidadSyncV4, type GrupoSyncV4 } from '@/tipos/protocoloSync';
import type { ConflictoSyncV4, MemoriaSyncV4 } from '@/tipos/estadoSyncV4';
import { igualesGrupoSyncV4, reconciliarSyncV4 } from './reconciliacionSyncV4';

/** La base confirmada y la edición optimista nunca comparten objetos mutables. */
export class ReplicaSyncV4 {
  base: Record<string, EntidadSyncV4>;
  pendientes: Record<string, EntidadSyncV4>;
  conflictos = new Map<string, ConflictoSyncV4>();
  resoluciones: Record<string, GrupoSyncV4[]>;
  constructor(memoria?: MemoriaSyncV4[string]) {
    this.base = structuredClone(memoria?.base ?? {});
    this.pendientes = structuredClone(memoria?.pendientes ?? {});
    this.resoluciones = structuredClone(memoria?.resoluciones ?? {});
    for (const [id, grupos] of Object.entries(memoria?.conflictos ?? {})) if (this.base[id] && this.pendientes[id]) {
      this.conflictos.set(id, { id, grupos, local: this.pendientes[id], remoto: this.base[id] });
    }
  }
  editar(entidad: EntidadSyncV4): boolean {
    const base = this.base[entidad.id];
    if (!base || base.eliminada !== entidad.eliminada || GRUPOS_SYNC_V4.some(g => !igualesGrupoSyncV4(g, base.grupos, entidad.grupos))) {
      if (JSON.stringify(this.pendientes[entidad.id]) === JSON.stringify(entidad)) return false;
      this.pendientes[entidad.id] = structuredClone(entidad);
      return true;
    }
    return false;
  }
  recibir(remoto: EntidadSyncV4, confirmada?: EntidadSyncV4): void {
    if (this.base[remoto.id] && this.base[remoto.id].revision > remoto.revision) return;
    const local = this.pendientes[remoto.id];
    const base = this.base[remoto.id];
    if (local) {
      if (confirmada) this.resoluciones[remoto.id] = (this.resoluciones[remoto.id] ?? [])
        .filter(g => !igualesGrupoSyncV4(g, local.grupos, confirmada.grupos));
      const comparacion = reconciliarSyncV4(confirmada?.grupos ?? base?.grupos, local.grupos, remoto.grupos);
      const bloqueados = this.conflictos.get(remoto.id)?.grupos ?? [];
      // Igual contenido no demuestra ausencia de cambios: el director pudo editar y volver al valor anterior.
      const revisados = base && !confirmada ? GRUPOS_SYNC_V4.filter(g => base.revisiones[g] !== remoto.revisiones[g]
        && !igualesGrupoSyncV4(g, local.grupos, base.grupos) && !igualesGrupoSyncV4(g, local.grupos, remoto.grupos)) : [];
      const conflictos = [...new Set([...comparacion.conflictos, ...bloqueados, ...revisados])]
        .filter(g => !igualesGrupoSyncV4(g, local.grupos, remoto.grupos));
      const conservar = [...new Set([...comparacion.proponer, ...conflictos, ...(this.resoluciones[remoto.id] ?? [])])];
      if (remoto.eliminada && !local.eliminada) conflictos.push('acompanantes');
      if (conservar.length || conflictos.length || (remoto.duenio === 'sin-vincular' && local.duenio !== remoto.duenio)) {
        const grupos = EsquemaGruposSyncV4.parse({ ...remoto.grupos,
          ...Object.fromEntries(conservar.map(g => [g, local.grupos[g]])) });
        this.pendientes[remoto.id] = { ...local, grupos };
      } else delete this.pendientes[remoto.id];
      if (conflictos.length) this.conflictos.set(remoto.id, { id: remoto.id, local: this.pendientes[remoto.id],
        remoto, grupos: [...new Set(conflictos)] });
      else this.conflictos.delete(remoto.id);
    }
    this.base[remoto.id] = structuredClone(remoto);
  }
  gruposPropuestos(id: string): GrupoSyncV4[] {
    const local = this.pendientes[id];
    if (!local) return [];
    const bloqueados = this.conflictos.get(id)?.grupos ?? [];
    const base = this.base[id];
    return GRUPOS_SYNC_V4.filter(g => !bloqueados.includes(g) &&
      (!base || this.resoluciones[id]?.includes(g) || !igualesGrupoSyncV4(g, local.grupos, base.grupos)));
  }
  resolver(id: string, grupo: GrupoSyncV4, eleccion: 'local' | 'compartido', revision: number): boolean {
    const conflicto = this.conflictos.get(id);
    const remoto = this.base[id];
    if (!conflicto || !remoto || remoto.revisiones[grupo] !== revision) return false;
    if (eleccion === 'compartido') {
      const pendiente = this.pendientes[id];
      pendiente.grupos = EsquemaGruposSyncV4.parse({ ...pendiente.grupos, [grupo]: remoto.grupos[grupo] });
      if (remoto.eliminada) pendiente.eliminada = true;
    }
    conflicto.grupos = conflicto.grupos.filter(g => g !== grupo);
    this.resoluciones[id] = [...new Set([...(this.resoluciones[id] ?? []), grupo])];
    if (!conflicto.grupos.length) this.conflictos.delete(id);
    return true;
  }
  visibles(): EntidadSyncV4[] {
    return Object.values({ ...this.base, ...this.pendientes });
  }
  memoria(): MemoriaSyncV4[string] {
    return structuredClone({ base: this.base, pendientes: this.pendientes, resoluciones: this.resoluciones,
      conflictos: Object.fromEntries([...this.conflictos].map(([id, c]) => [id, c.grupos])) });
  }
}
