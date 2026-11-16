import type { ContextoSyncV4 } from '@/tipos/protocoloSync';
import type { InfoCliente } from '@/tipos/talespire';
import {
  generarIdSyncV4,
  type MensajeNoFragSyncV4,
  type SobreMensajeSyncV4,
} from './erroresTransporteSyncV4';

const INTERVALO_LATIDO_SYNC_V4_MS = 5000;

export interface CallbacksEleccionDirectorSyncV4 {
  clienteId: string;
  campania: string;
  tablero: string;
  miembrosIniciales: InfoCliente[];
  estaVivo: () => boolean;
  obtenerRevision: () => number;
  enviar: (mensaje: MensajeNoFragSyncV4, destino?: string) => Promise<boolean>;
  ejecutar: (operacion: string, accion: () => Promise<unknown>) => void;
  notificar: (texto: string) => void;
  mostrar: () => void;
  alActivarDirector: (sesion: string) => void;
  alPerderDirector: () => void;
  alInvalidarPorRelevo: () => void;
  alAdoptarContextoRemoto: (nuevoContexto: ContextoSyncV4) => void;
  alRecibirHolaComoDirector: (desdeId: string) => Promise<void>;
}

/**
 * Máquina de estados de gobernanza de mesa v4: elección y quórum de GMs,
 * relevo seguro ante desconexiones, control de aperturas retiradas y latido periódico.
 */
export class EleccionDirectorSyncV4 {
  contexto: ContextoSyncV4;
  readonly apertura: string = generarIdSyncV4();
  miembros: InfoCliente[];
  private aperturas = new Map<string, string>();
  private aperturasRetiradas = new Set<string>();
  private votos = new Map<string, string>();
  private retiradas = new Set<string>();
  private relevoPendiente = false;
  private eleccionExplicita = false;
  private timerLatido: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly cb: CallbacksEleccionDirectorSyncV4) {
    this.miembros = cb.miembrosIniciales;
    this.contexto = {
      campania: cb.campania,
      tablero: cb.tablero,
      director: 'pendiente',
      sesion: 'pendiente',
    };
  }

  get soyDirector(): boolean {
    return this.cb.estaVivo() && this.contexto.director === this.cb.clienteId;
  }

  get gms(): InfoCliente[] {
    return this.miembros.filter(c => c.clientMode === 'gm');
  }

  sobre(): SobreMensajeSyncV4 {
    return {
      v: 4 as const,
      contexto: { ...this.contexto },
      emisor: this.cb.clienteId,
      sesionEmisor: this.apertura,
    };
  }

  contieneMiembro(id: string): boolean {
    return this.miembros.some(c => c.id === id);
  }

  obtenerMiembro(id: string): InfoCliente | undefined {
    return this.miembros.find(c => c.id === id);
  }

  establecerDirectorLocal(sesion: string): void {
    this.contexto = { ...this.contexto, director: this.cb.clienteId, sesion };
  }

  iniciarLatido(alIniciar?: () => void): void {
    if (this.gms.length === 1 && this.gms[0].id === this.cb.clienteId) {
      this.cb.alActivarDirector(this.apertura);
    }
    alIniciar?.();
    this.timerLatido = setInterval(() => {
      if (this.soyDirector) {
        this.cb.ejecutar('latido', async () => {
          await this.anunciar();
          return this.cb.enviar({ ...this.sobre(), t: 'LATIDO', revision: this.cb.obtenerRevision() });
        });
      }
    }, INTERVALO_LATIDO_SYNC_V4_MS);
    this.cb.mostrar();
  }

  async anunciar(): Promise<boolean> {
    return this.cb.enviar({ ...this.sobre(), t: 'DIRECCION', fase: 'anuncio', candidato: this.cb.clienteId });
  }

  async votar(candidato: string): Promise<void> {
    if (!this.gms.some(c => c.id === this.cb.clienteId) || !this.gms.some(c => c.id === candidato)) return;
    this.votos.set(this.cb.clienteId, candidato);
    this.eleccionExplicita = true;
    await this.cb.enviar({ ...this.sobre(), t: 'DIRECCION', fase: 'voto', candidato });
    this.comprobarVotos();
  }

  private comprobarVotos(): void {
    const candidato = this.votos.get(this.cb.clienteId);
    if (!candidato || !this.gms.every(gm => this.votos.get(gm.id) === candidato)) {
      this.cb.mostrar();
      return;
    }
    if (candidato === this.cb.clienteId && !this.soyDirector) {
      this.cb.alActivarDirector(generarIdSyncV4());
    }
  }

  actualizarMiembros(miembros: InfoCliente[]): void {
    this.miembros = miembros;
    if (this.contexto.director !== 'pendiente' && !this.gms.some(c => c.id === this.contexto.director)) {
      this.retiradas.add(this.contexto.sesion);
      this.contexto = { ...this.contexto, director: 'pendiente', sesion: 'pendiente' };
      this.votos.clear();
      this.relevoPendiente = true;
      this.cb.alPerderDirector();
      this.cb.notificar('El director ya no está disponible. Elige quién asumirá el combate.');
    }
    this.cb.mostrar();
  }

  validarSesionEmisor(desdeId: string, mensaje: MensajeNoFragSyncV4): boolean {
    if (!mensaje.sesionEmisor || this.aperturasRetiradas.has(`${desdeId}:${mensaje.sesionEmisor}`)) return false;
    const anteriorSesion = this.aperturas.get(desdeId);
    if (mensaje.t === 'HOLA' || mensaje.t === 'DIRECCION') {
      if (anteriorSesion && anteriorSesion !== mensaje.sesionEmisor) {
        this.aperturasRetiradas.add(`${desdeId}:${anteriorSesion}`);
      }
      this.aperturas.set(desdeId, mensaje.sesionEmisor);
      return true;
    }
    return anteriorSesion === mensaje.sesionEmisor;
  }

  procesarDireccion(mensaje: Extract<MensajeNoFragSyncV4, { t: 'DIRECCION' }>, cliente: InfoCliente): void {
    if (mensaje.fase === 'requiere-voto') {
      if (mensaje.candidato === this.cb.clienteId && this.soyDirector && !this.eleccionExplicita) {
        this.contexto = { ...this.contexto, director: 'pendiente', sesion: 'pendiente' };
        this.cb.alInvalidarPorRelevo();
        this.cb.notificar('La mesa perdió a su director anterior. Confirma el relevo antes de publicar.');
        this.cb.mostrar();
      }
      return;
    }
    if (cliente.clientMode !== 'gm') return;
    if (mensaje.fase === 'voto') {
      this.votos.set(cliente.id, mensaje.candidato);
      this.comprobarVotos();
      return;
    }
    const desdeId = cliente.id;
    if (mensaje.candidato !== desdeId || mensaje.contexto.director !== desdeId || this.retiradas.has(mensaje.contexto.sesion)) return;
    if (this.relevoPendiente && !this.gms.every(c => this.votos.get(c.id) === desdeId)) {
      this.cb.ejecutar('requiere-voto', () =>
        this.cb.enviar({ ...this.sobre(), t: 'DIRECCION', fase: 'requiere-voto', candidato: desdeId }, desdeId),
      );
      return;
    }
    if (this.contexto.director === 'pendiente' && this.gms.length > 1
      && !this.gms.every(c => this.votos.get(c.id) === desdeId)) return;
    if (this.contexto.director !== 'pendiente' && this.contexto.director !== desdeId) return;
    if (this.contexto.sesion !== mensaje.contexto.sesion) {
      if (this.contexto.sesion !== 'pendiente') this.retiradas.add(this.contexto.sesion);
      this.contexto = { ...mensaje.contexto };
      this.relevoPendiente = false;
      this.cb.alAdoptarContextoRemoto(mensaje.contexto);
    }
    this.cb.mostrar();
  }

  procesarHola(desdeId: string): void {
    if (this.contexto.director !== 'pendiente' && this.gms.length > 1 && this.gms.some(c => c.id === this.cb.clienteId)) {
      this.cb.ejecutar('voto-saludo', () =>
        this.cb.enviar({ ...this.sobre(), t: 'DIRECCION', fase: 'voto', candidato: this.contexto.director }, desdeId),
      );
    }
    if (this.soyDirector) {
      this.cb.ejecutar('respuesta-hola', async () => {
        await this.anunciar();
        await this.cb.alRecibirHolaComoDirector(desdeId);
      });
    }
  }

  destruir(): void {
    if (this.timerLatido) {
      clearInterval(this.timerLatido);
      this.timerLatido = undefined;
    }
  }
}
