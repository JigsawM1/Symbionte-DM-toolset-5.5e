import { logger } from '@/utiles/logger';

interface EstadoPendienteACK {
  pjId: string;
  ts: number;
  intentos: number;
  timer: ReturnType<typeof setTimeout> | null;
}
const INTERVALOS_BACKOFF_REQ_MS = [1500, 3000, 5000];
const MAX_REINTENTOS_ACK = 2;
const TIMEOUT_ESPERA_ACK_MS = 2000;
type EnviarEmision = () => void | Promise<boolean>;

export class GestorReintentosSync {
  private req = { intentos: 0, activo: false, agotado: false,
    timer: null as ReturnType<typeof setTimeout> | null, enviar: null as (() => void) | null };
  private pendientesACK = new Map<string, EstadoPendienteACK>();

  iniciarReintentosREQ(enviar: () => void): void {
    if (this.req.activo) return;
    this.cancelarReintentosREQ();
    this.req.activo = true;
    this.req.enviar = enviar;
    enviar();
    this.programarREQ();
  }

  /** Solo el progreso nuevo pausa la solicitud, sin consumir ni reiniciar su presupuesto. */
  pausarReintentosREQ(enviar: () => void): void {
    if (this.req.agotado) return;
    this.req.activo = true;
    this.req.enviar = enviar;
    if (this.req.timer) clearTimeout(this.req.timer);
    this.req.timer = null;
  }

  continuarReintentosREQ(): void {
    if (!this.req.timer) this.programarREQ();
  }

  private programarREQ(): void {
    if (!this.req.activo || !this.req.enviar) return;
    if (this.req.intentos >= INTERVALOS_BACKOFF_REQ_MS.length) {
      this.req.activo = false;
      this.req.agotado = true;
      logger.warn('[Sync] Agotadas las solicitudes de recuperación de iniciativa.');
      return;
    }
    this.req.timer = setTimeout(() => {
      this.req.timer = null;
      if (!this.req.activo) return;
      this.req.intentos++;
      this.req.enviar?.();
      this.programarREQ();
    }, INTERVALOS_BACKOFF_REQ_MS[this.req.intentos]);
  }

  cancelarReintentosREQ(): void {
    if (this.req.timer) clearTimeout(this.req.timer);
    this.req = { intentos: 0, activo: false, agotado: false, timer: null, enviar: null };
  }

  /** Registra antes del primer envío; todos los intentos reutilizan la misma emisión. */
  registrarEmisionPJ(pjId: string, ts: number, enviar: EnviarEmision): void {
    this.cancelarEmisionPJ(pjId);
    const entrada: EstadoPendienteACK = { pjId, ts, intentos: 0, timer: null };
    this.pendientesACK.set(pjId, entrada);
    void this.enviarPendiente(entrada, enviar);
  }

  private async enviarPendiente(entrada: EstadoPendienteACK, enviar: EnviarEmision): Promise<void> {
    try {
      const exito = await enviar();
      if (exito === false) logger.warn(`[Sync] Falló el envío de PJ ${entrada.pjId}; se mantiene el presupuesto de reintentos.`);
    } catch (error) {
      logger.warn('[Sync] Error enviando la emisión pendiente:', error);
    }
    // Un ACK o una edición nueva pueden llegar mientras se vacía la cola nativa.
    if (this.pendientesACK.get(entrada.pjId) !== entrada) return;
    entrada.timer = setTimeout(() => {
      if (this.pendientesACK.get(entrada.pjId) !== entrada) return;
      if (entrada.intentos >= MAX_REINTENTOS_ACK) {
        this.pendientesACK.delete(entrada.pjId);
        logger.warn(`[Sync] Agotados reintentos ACK para PJ ${entrada.pjId}.`);
        return;
      }
      entrada.intentos++;
      void this.enviarPendiente(entrada, enviar);
    }, TIMEOUT_ESPERA_ACK_MS);
  }

  cancelarEmisionPJ(pjId: string): void {
    const entrada = this.pendientesACK.get(pjId);
    if (entrada?.timer) clearTimeout(entrada.timer);
    this.pendientesACK.delete(pjId);
  }

  confirmarACK(pjId: string, ts: number): boolean {
    const entrada = this.pendientesACK.get(pjId);
    if (!entrada || entrada.ts !== ts) return false;
    this.cancelarEmisionPJ(pjId);
    return true;
  }

  destruir(): void {
    this.cancelarReintentosREQ();
    for (const id of this.pendientesACK.keys()) this.cancelarEmisionPJ(id);
  }
}
