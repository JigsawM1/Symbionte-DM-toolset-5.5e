import type { MensajeSyncV4, MetaSyncV4, EntidadSyncV4 } from '@/tipos/protocoloSync';
type Lote = Extract<MensajeSyncV4, { t: 'LOTE' }>;
export interface SnapshotSyncV4 { revision: number; entidades: EntidadSyncV4[]; meta: MetaSyncV4 }

/** Un snapshot es una transacción; jamás se mezclan páginas de dos capturas. */
export class SnapshotsSyncV4 {
  private sesion: { id: string; revision: number; total: number; unidades: number; partes: Map<number, Lote> } | undefined;
  private retirados = new Set<string>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private avance = false;
  get huboProgreso(): boolean { return this.avance; }
  constructor(private readonly expirar: () => void) {}
  registrar(lote: Lote): SnapshotSyncV4 | undefined {
    this.avance = false;
    if (lote.parte > lote.total || this.retirados.has(lote.snapshot)) return;
    const actual = this.sesion;
    if (actual && actual.id !== lote.snapshot) {
      if (lote.revision < actual.revision) return;
      this.retirados.add(actual.id);
      this.sesion = undefined;
    }
    this.sesion ??= { id: lote.snapshot, revision: lote.revision, total: lote.total, unidades: 0, partes: new Map() };
    const sesion = this.sesion;
    if (sesion.total !== lote.total || sesion.revision !== lote.revision) return;
    const previa = sesion.partes.get(lote.parte);
    if (previa) {
      if (JSON.stringify(previa) !== JSON.stringify(lote)) { this.limpiar(); this.expirar(); }
      return;
    }
    if (lote.meta && [...sesion.partes.values()].some(p => p.meta && JSON.stringify(p.meta) !== JSON.stringify(lote.meta))) {
      this.limpiar(); this.expirar(); return;
    }
    const unidades = JSON.stringify(lote).length;
    if (sesion.unidades + unidades > 4000000) {
      this.limpiar(); this.expirar(); return;
    }
    this.progresar(lote.snapshot, lote.parte);
    sesion.partes.set(lote.parte, lote);
    sesion.unidades += unidades;
    this.avance = true;
    if (sesion.partes.size !== sesion.total) return;
    const entidades = Array.from({ length: sesion.total }, (_, i) => sesion.partes.get(i + 1)!.entidades).flat();
    const meta = [...sesion.partes.values()].find(p => p.meta)?.meta;
    const filas = new Set(entidades.filter(e => !e.eliminada).map(e => e.fila ?? e.id));
    if (!meta || new Set(entidades.map(e => e.id)).size !== entidades.length
      || new Set(meta.orden).size !== meta.orden.length || meta.orden.some(id => !filas.has(id))) {
      this.limpiar(); this.expirar(); return;
    }
    this.limpiar();
    return { revision: lote.revision, entidades, meta };
  }
  enCurso(): boolean { return !!this.sesion; }
  /** Una página grande puede tardar más de diez segundos; sus fragmentos nuevos también cuentan. */
  progresar(snapshot: string, parte: number): boolean {
    if (!Number.isInteger(parte) || parte < 1 || parte > 4096 || this.retirados.has(snapshot)) return false;
    if (!this.sesion || this.sesion.id !== snapshot) return true;
    if (this.sesion.partes.has(parte)) return false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.limpiar(); this.expirar(); }, 10000);
    return true;
  }
  limpiar(): void {
    this.avance = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.sesion) this.retirados.add(this.sesion.id);
    if (this.retirados.size > 64) this.retirados.delete(this.retirados.values().next().value!);
    this.sesion = undefined;
    this.timer = undefined;
  }
}
