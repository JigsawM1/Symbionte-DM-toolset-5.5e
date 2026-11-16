import type { EntidadSyncV4, GrupoSyncV4, MetaSyncV4 } from '@/tipos/protocoloSync';
import type { InfoCliente } from '@/tipos/talespire';
import { crearPropuestaPendiente } from './contextosSyncV4';
import type { MensajeNoFragSyncV4, SobreMensajeSyncV4 } from './erroresTransporteSyncV4';
import type { GestorReintentosSync } from './gestorReintentosSync';
import type { ReplicaSyncV4 } from './replicaSyncV4';

type PropuestaSyncV4 = Extract<MensajeNoFragSyncV4, { t: 'PROPUESTA' }>;
type CambioSyncV4 = Extract<MensajeNoFragSyncV4, { t: 'CONFIRMADO' | 'COMBATE' }>;
type ResultadoSyncV4 = Extract<MensajeNoFragSyncV4, { t: 'RESULTADO' }>;

const DEBOUNCE_PROPUESTA_SYNC_V4_MS = 120;
const TIMEOUT_ESPERA_ORDEN_SYNC_V4_MS = 3000;
const MAX_DIFERIDOS_SYNC_V4 = 256;

export interface CallbacksColaOptimistaSyncV4 {
  clienteId: string;
  jugadorId: string;
  replica: ReplicaSyncV4;
  reintentos: GestorReintentosSync;
  estaVivo: () => boolean;
  estaRecuperando: () => boolean;
  soyDirector: () => boolean;
  obtenerDirector: () => string;
  obtenerMiembro: (id: string) => InfoCliente | undefined;
  obtenerRevision: () => number;
  establecerRevision: (revision: number) => void;
  establecerMeta: (meta: MetaSyncV4) => void;
  sobre: () => SobreMensajeSyncV4;
  enviar: (mensaje: MensajeNoFragSyncV4, destino?: string) => Promise<boolean>;
  ejecutar: (operacion: string, accion: () => Promise<unknown>) => void;
  solicitar: () => void;
  aplicar: () => void;
  mostrar: () => void;
  notificar: (texto: string) => void;
  procesarPropuestaLocal: (propuesta: PropuestaSyncV4, yo: InfoCliente) => Promise<void>;
}

/**
 * Coordina las emisiones optimistas del cliente, la aplicación de resultados y confirmados
 * fuera de orden (`diferidos`) y los temporizadores de debounce/espera de secuencia.
 */
export class ColaOptimistaSyncV4 {
  readonly emisiones = new Map<string, { propuesta: PropuestaSyncV4; local: EntidadSyncV4 }>();
  readonly resultados = new Map<string, ResultadoSyncV4>();
  readonly diferidos = new Map<number, CambioSyncV4>();
  readonly bloqueadas = new Set<string>();
  revisionAnunciada = 0;
  private debounce: ReturnType<typeof setTimeout> | undefined;
  private esperaOrdenTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly cb: CallbacksColaOptimistaSyncV4) {}

  obtenerLocalEmitida(operacion: string): EntidadSyncV4 | undefined {
    return this.emisiones.get(operacion)?.local;
  }

  registrarResultado(mensaje: ResultadoSyncV4): boolean {
    if (!this.emisiones.has(mensaje.operacion)) return false;
    this.cb.reintentos.confirmarACK(mensaje.operacion, 1);
    this.resultados.set(mensaje.operacion, mensaje);
    this.aplicarResultados();
    return true;
  }

  aplicarResultados(): void {
    for (const [op, m] of this.resultados) {
      if (m.entidad && (this.cb.estaRecuperando() || m.entidad.revision > this.cb.obtenerRevision())) {
        this.cb.solicitar();
        continue;
      }
      const emitida = this.emisiones.get(op);
      this.resultados.delete(op);
      if (!emitida) continue;
      this.emisiones.delete(op);
      if (m.entidad) this.cb.replica.recibir(m.entidad, m.estado === 'aplicado' ? emitida.local : undefined);
      const pendiente = m.entidad && this.cb.replica.pendientes[m.entidad.id];
      if (m.estado === 'conflicto' && m.entidad && pendiente) {
        this.cb.replica.conflictos.set(m.entidad.id, {
          id: m.entidad.id,
          remoto: this.cb.replica.base[m.entidad.id],
          local: pendiente,
          grupos: m.conflictos,
        });
      }
      if (m.estado === 'rechazado') {
        this.bloqueadas.add(emitida.local.id);
        for (const e of Object.values(this.cb.replica.pendientes)) {
          if (e.padre === emitida.local.id) this.bloqueadas.add(e.id);
        }
        this.cb.notificar('El cambio no fue autorizado. Revisa la vinculación; tu edición sigue conservada.');
      }
    }
  }

  aplicarCambio(mensaje: CambioSyncV4): void {
    this.cb.establecerRevision(mensaje.revision);
    if (mensaje.t === 'COMBATE') {
      this.cb.establecerMeta(mensaje.meta);
      return;
    }
    this.cb.replica.recibir(mensaje.entidad, this.emisiones.get(mensaje.operacion)?.local);
    // El estado confirmado también acredita la aplicación si se pierde RESULTADO.
    this.cb.reintentos.confirmarACK(mensaje.operacion, 1);
    this.emisiones.delete(mensaje.operacion);
    this.resultados.delete(mensaje.operacion);
  }

  encolarDiferido(mensaje: CambioSyncV4): void {
    if (this.diferidos.size < MAX_DIFERIDOS_SYNC_V4) this.diferidos.set(mensaje.revision, mensaje);
    else this.diferidos.clear();
    this.esperarOrden();
  }

  vaciarDiferidos(): void {
    const actual = this.cb.obtenerRevision();
    for (const r of this.diferidos.keys()) if (r <= actual) this.diferidos.delete(r);
    let siguiente = this.cb.obtenerRevision() + 1;
    while (this.diferidos.has(siguiente)) {
      const m = this.diferidos.get(siguiente)!;
      this.diferidos.delete(m.revision);
      this.aplicarCambio(m);
      siguiente = this.cb.obtenerRevision() + 1;
    }
    this.esperarOrden();
  }

  /** Permite terminar un mensaje grande adelantado por otro pequeño, sin pedir snapshots innecesarios. */
  esperarOrden(): void {
    if (this.cb.obtenerRevision() >= this.revisionAnunciada && !this.diferidos.size) {
      if (this.esperaOrdenTimer) clearTimeout(this.esperaOrdenTimer);
      this.esperaOrdenTimer = undefined;
      return;
    }
    if (this.esperaOrdenTimer) return;
    this.esperaOrdenTimer = setTimeout(() => {
      this.esperaOrdenTimer = undefined;
      if (this.cb.estaVivo() && this.cb.obtenerRevision() < this.revisionAnunciada) this.cb.solicitar();
    }, TIMEOUT_ESPERA_ORDEN_SYNC_V4_MS);
  }

  programarPropuesta(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(
      () => this.cb.ejecutar('proponer', () => this.proponer()),
      DEBOUNCE_PROPUESTA_SYNC_V4_MS,
    );
  }

  private async proponer(): Promise<void> {
    if (!this.cb.estaVivo() || this.cb.estaRecuperando()) return;
    for (const [id, local] of Object.entries(this.cb.replica.pendientes)) {
      if (local.duenio !== this.cb.jugadorId || this.bloqueadas.has(id)) continue;
      const padre = local.padre ? this.cb.replica.base[local.padre] : undefined;
      if (padre && padre.duenio !== this.cb.jugadorId) {
        if (padre.duenio === 'sin-vincular' && !this.bloqueadas.has(padre.id)
          && ![...this.emisiones.values()].some(e => e.local.id === padre.id)) {
          await this.emitirPendiente({ ...padre, duenio: this.cb.jugadorId }, ['datos']);
        }
        continue;
      }
      if ([...this.emisiones.values()].some(e => e.local.id === id)) continue;
      const grupos = this.cb.replica.gruposPropuestos(id);
      if (!grupos.length) continue;
      await this.emitirPendiente(local, grupos);
    }
    this.cb.mostrar();
  }

  private async emitirPendiente(local: EntidadSyncV4, grupos: GrupoSyncV4[]): Promise<void> {
    const propuesta = crearPropuestaPendiente(this.cb.replica, local, grupos, this.cb.sobre());
    this.emisiones.set(propuesta.operacion, { propuesta, local: structuredClone(local) });
    const yo = this.cb.obtenerMiembro(this.cb.clienteId);
    if (this.cb.soyDirector() && yo) await this.cb.procesarPropuestaLocal(propuesta, yo);
    else this.cb.reintentos.registrarEmisionPJ(propuesta.operacion, 1, () => this.cb.enviar(propuesta, this.cb.obtenerDirector()));
  }

  reintentar(): void {
    this.bloqueadas.clear();
    for (const [id, e] of this.emisiones) {
      this.cb.reintentos.registrarEmisionPJ(id, 1, () => this.cb.enviar(e.propuesta, this.cb.obtenerDirector()));
    }
    this.programarPropuesta();
  }

  descartar(id: string): void {
    for (const [op, e] of this.emisiones) {
      if (e.local.id === id) {
        this.cb.reintentos.cancelarEmisionPJ(op);
        this.emisiones.delete(op);
      }
    }
    delete this.cb.replica.pendientes[id];
    this.cb.replica.conflictos.delete(id);
    this.bloqueadas.delete(id);
    delete this.cb.replica.resoluciones[id];
    this.cb.aplicar();
  }

  resolver(id: string, grupo: GrupoSyncV4, eleccion: 'local' | 'compartido', revision: number): boolean {
    if (this.cb.replica.pendientes[id]?.duenio !== this.cb.jugadorId) return false;
    if (!this.cb.replica.resolver(id, grupo, eleccion, revision)) return false;
    this.bloqueadas.delete(id);
    this.cb.aplicar();
    this.programarPropuesta();
    return true;
  }

  cancelarEmisiones(): void {
    if (this.esperaOrdenTimer) clearTimeout(this.esperaOrdenTimer);
    this.esperaOrdenTimer = undefined;
    for (const id of this.emisiones.keys()) this.cb.reintentos.cancelarEmisionPJ(id);
    this.emisiones.clear();
    this.resultados.clear();
    this.bloqueadas.clear();
  }

  destruir(): void {
    if (this.debounce) clearTimeout(this.debounce);
    if (this.esperaOrdenTimer) clearTimeout(this.esperaOrdenTimer);
    this.debounce = undefined;
    this.esperaOrdenTimer = undefined;
  }
}
