/**
 * @module gestorReintentosSync
 * Gestor de reintentos con backoff y control de confirmaciones (ACK) para sincronización vía TS.sync.
 * Garantiza resiliencia en el handshake inicial y confirmación de recepción en el combate.
 */

import { logger } from "@/utiles/logger";

interface EstadoReintentoREQ {
  intentoActual: number;
  timer: ReturnType<typeof setTimeout> | null;
  activo: boolean;
}

interface EstadoPendienteACK {
  pjId: string;
  ts: number;
  intentos: number;
  timer: ReturnType<typeof setTimeout> | null;
}

const INTERVALOS_BACKOFF_REQ_MS = [1500, 3000, 5000];
const MAX_REINTENTOS_ACK = 2;
const TIMEOUT_ESPERA_ACK_MS = 2000;

export class GestorReintentosSync {
  private estadoReq: EstadoReintentoREQ = {
    intentoActual: 0,
    timer: null,
    activo: false,
  };

  private pendientesACK = new Map<string, EstadoPendienteACK>();

  // ==========================================
  // --- REINTENTOS PARA REQ (Handshake inicial) ---
  // ==========================================

  /**
   * Inicia el ciclo de solicitud de estado inicial con backoff.
   * Si ya hay un ciclo en marcha, no duplica temporizadores.
   */
  public iniciarReintentosREQ(enviarPeticion: () => void): void {
    if (this.estadoReq.activo) return;

    this.estadoReq.activo = true;
    this.estadoReq.intentoActual = 0;
    enviarPeticion();

    this.programarSiguienteIntentoREQ(enviarPeticion);
  }

  private programarSiguienteIntentoREQ(enviarPeticion: () => void): void {
    if (!this.estadoReq.activo) return;

    if (this.estadoReq.intentoActual >= INTERVALOS_BACKOFF_REQ_MS.length) {
      logger.info("[GestorReintentosSync] Límite de reintentos REQ alcanzado sin respuesta del DM.");
      this.cancelarReintentosREQ();
      return;
    }

    const esperaMs = INTERVALOS_BACKOFF_REQ_MS[this.estadoReq.intentoActual];
    this.estadoReq.intentoActual += 1;

    this.estadoReq.timer = setTimeout(() => {
      if (!this.estadoReq.activo) return;
      logger.info(
        `[GestorReintentosSync] Reintentando solicitud inicial REQ (intento ${this.estadoReq.intentoActual}/${INTERVALOS_BACKOFF_REQ_MS.length})...`
      );
      enviarPeticion();
      this.programarSiguienteIntentoREQ(enviarPeticion);
    }, esperaMs);
  }

  /**
   * Cancela inmediatamente cualquier ciclo de reintento REQ activo.
   * Se invoca al recibir un snapshot DM (DM o DM_CHUNK) o al pasar a rol GM.
   */
  public cancelarReintentosREQ(): void {
    this.estadoReq.activo = false;
    this.estadoReq.intentoActual = 0;
    if (this.estadoReq.timer) {
      clearTimeout(this.estadoReq.timer);
      this.estadoReq.timer = null;
    }
  }

  // ==========================================
  // --- CONFIRMACIÓN ACK (Jugador -> DM -> Jugador) ---
  // ==========================================

  /**
   * Registra una emisión PJ en espera de confirmación ACK por parte del DM.
   */
  public registrarEmisionPJ(pjId: string, ts: number, reemitirFn: () => void): void {
    // Si ya había un registro previo de este PJ, cancelamos su timer anterior
    const previo = this.pendientesACK.get(pjId);
    if (previo?.timer) {
      clearTimeout(previo.timer);
    }

    const entrada: EstadoPendienteACK = {
      pjId,
      ts,
      intentos: 0,
      timer: null,
    };

    this.programarEsperaACK(entrada, reemitirFn);
    this.pendientesACK.set(pjId, entrada);
  }

  private programarEsperaACK(entrada: EstadoPendienteACK, reemitirFn: () => void): void {
    entrada.timer = setTimeout(() => {
      const actual = this.pendientesACK.get(entrada.pjId);
      if (!actual || actual.ts !== entrada.ts) return;

      if (actual.intentos < MAX_REINTENTOS_ACK) {
        actual.intentos += 1;
        logger.warn(
          `[GestorReintentosSync] No se recibió ACK para PJ ${entrada.pjId} (ts=${entrada.ts}). Reemitiendo (${actual.intentos}/${MAX_REINTENTOS_ACK})...`
        );
        reemitirFn();
        this.programarEsperaACK(actual, reemitirFn);
      } else {
        logger.warn(`[GestorReintentosSync] Agotados reintentos ACK para PJ ${entrada.pjId}.`);
        this.pendientesACK.delete(entrada.pjId);
      }
    }, TIMEOUT_ESPERA_ACK_MS);
  }

  /**
   * Procesa un mensaje ACK recibido del DM confirmando la recepción del PJ.
   */
  public confirmarACK(pjId: string, ts: number): boolean {
    const pendiente = this.pendientesACK.get(pjId);
    if (pendiente) {
      if (ts >= pendiente.ts) {
        if (pendiente.timer) clearTimeout(pendiente.timer);
        this.pendientesACK.delete(pjId);
        logger.debug(`[GestorReintentosSync] ACK confirmado para PJ ${pjId} (ts=${ts})`);
        return true;
      }
    }
    return false;
  }

  /**
   * Limpia todos los temporizadores activos.
   */
  public destruir(): void {
    this.cancelarReintentosREQ();
    for (const [, p] of this.pendientesACK) {
      if (p.timer) clearTimeout(p.timer);
    }
    this.pendientesACK.clear();
  }
}
