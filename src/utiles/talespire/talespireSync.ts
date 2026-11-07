/**
 * talespireSync.ts
 * ----------------
 * Adaptador para el canal de sincronización en tiempo real (TS.sync).
 * Implementa cola de despacho con rate-limiting, reintentos con backoff progresivo
 * y fallback con BroadcastChannel para desarrollo o pruebas.
 */

import type { FragmentoCliente } from "@/tipos/talespire";
import { logger } from "@/utiles/logger";
import { limpiarSuscripcionNativa, obtenerTSGlobal } from "./comun";

interface ElementoColaSync {
  mensaje: string;
  target: string;
  resolver: (exito: boolean) => void;
}

export class TaleSpireSyncAdapter {
  private canalBroadcastSync?: BroadcastChannel;
  private colaEnvioSync: ElementoColaSync[] = [];
  private procesandoColaSync = false;
  private ultimoEnvioSync: number | undefined;
  private readonly INTERVALO_MINIMO_SYNC_MS = 180;
  private readonly MAX_REINTENTOS_RATE_LIMIT = 3;

  private getBroadcastChannelSync(): BroadcastChannel | undefined {
    if (typeof BroadcastChannel === "undefined") return undefined;
    if (!this.canalBroadcastSync) {
      try {
        this.canalBroadcastSync = new BroadcastChannel("talespire-simbiote-sync");
      } catch (e) {
        logger.debug("[TS Adapter] No se pudo instanciar BroadcastChannel persistente:", e);
      }
    }
    return this.canalBroadcastSync;
  }

  private async procesarSiguienteEnvioSync(): Promise<void> {
    if (this.procesandoColaSync || this.colaEnvioSync.length === 0) return;
    this.procesandoColaSync = true;

    try {
      while (this.colaEnvioSync.length > 0) {
        const item = this.colaEnvioSync.shift();
        if (!item) break;

        const exito = await this.ejecutarEnvioSyncNativoConReintentos(item.mensaje, item.target);
        item.resolver(exito);

      }
    } finally {
      this.procesandoColaSync = false;
    }
  }

  private async ejecutarEnvioSyncNativoConReintentos(message: string, target: string): Promise<boolean> {
    let enviado = false;
    const ts = obtenerTSGlobal();

    if (ts?.sync && typeof ts.sync.send === "function") {
      if (message.length > 500) {
        logger.error(`[TS Adapter] Mensaje excede el límite máximo de TaleSpire (máximo 500 caracteres, longitud: ${message.length}).`);
        return false;
      }

      for (let intento = 0; intento <= this.MAX_REINTENTOS_RATE_LIMIT; intento++) {
        try {
          // También se espacia cuando el productor espera cada Promise y vacía la cola.
          const espera = this.ultimoEnvioSync === undefined ? 0
            : this.INTERVALO_MINIMO_SYNC_MS - (Date.now() - this.ultimoEnvioSync);
          if (espera > 0) await new Promise(resolve => setTimeout(resolve, espera));
          this.ultimoEnvioSync = Date.now();
          await ts.sync.send(message, target);
          enviado = true;
          break;
        } catch (error) {
          // Extracción defensiva agnóstica a realms (en WebViews/CEF 'instanceof Error' falla si proviene de IWebView.ExecuteJavaScript)
          const mensajeError =
            error instanceof Error
              ? error.message
              : typeof error === "object" && error !== null && "message" in error
                ? String((error as { message: unknown }).message)
                : String(error);

          const esRateLimit = mensajeError.toLowerCase().includes("ratelimited");

          if (esRateLimit && intento < this.MAX_REINTENTOS_RATE_LIMIT) {
            const esperaMs = (intento + 1) * 350;
            logger.warn(`[TS Adapter] TaleSpire rate-limited en sync.send. Reintentando en ${esperaMs}ms (intento ${intento + 1}/${this.MAX_REINTENTOS_RATE_LIMIT})...`);
            await new Promise((r) => setTimeout(r, esperaMs));
            continue;
          }

          logger.error("[TS Adapter] Error en sync.send nativo:", error);
          break;
        }
      }
    }

    // Replicar en BroadcastChannel persistente para entornos locales o pruebas en navegador
    try {
      const canal = this.getBroadcastChannelSync();
      if (canal) {
        canal.postMessage({ str: message, target });
        // El canal local no confirma recepción por la red nativa de TaleSpire.
        if (!ts?.sync || typeof ts.sync.send !== "function") enviado = true;
      }
    } catch (e) {
      logger.debug("[TS Adapter] Fallback BroadcastChannel no disponible:", e);
    }

    return enviado;
  }

  /**
   * Envía un mensaje string en tiempo real a través del canal backend de TaleSpire.
   * Encola las peticiones para evitar colapsos por ráfagas y reintenta con backoff si hay rate limit.
   * @param message Cadena serializada (máximo 500 caracteres).
   * @param target Destino: "board" (todos), "gms" (Dungeon Masters), o clientId específico.
   */
  send(message: string, target = "board"): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.colaEnvioSync.push({
        mensaje: message,
        target,
        resolver: resolve,
      });
      void this.procesarSiguienteEnvioSync();
    });
  }

  /**
   * Purga mensajes pendientes en la cola de envío que coincidan con un predicado.
   * Permite descartar fragmentos o estados obsoletos antes de encolar una nueva ráfaga.
   * @param filtro Función predicado opcional; si no se provee, purga toda la cola pendiente.
   * @returns Cantidad de mensajes purgados.
   */
  purgarColaSync(filtro?: (mensaje: string) => boolean): number {
    if (!filtro) {
      const descartados = this.colaEnvioSync.length;
      this.colaEnvioSync.forEach((item) => item.resolver(false));
      this.colaEnvioSync = [];
      return descartados;
    }

    const restantes: ElementoColaSync[] = [];
    let descartados = 0;
    for (const item of this.colaEnvioSync) {
      if (filtro(item.mensaje)) {
        item.resolver(false);
        descartados++;
      } else {
        restantes.push(item);
      }
    }
    this.colaEnvioSync = restantes;
    return descartados;
  }

  /**
   * Permite suscribirse directamente al evento nativo TS.sync.onSyncMessage si existe en el entorno.
   */
  suscribirAMensajesSync(
    callback: (payload: { str: string; fromClient?: FragmentoCliente }) => void
  ): { desuscribir: () => void } {
    const ts = obtenerTSGlobal();
    const onSyncMessage = ts?.sync?.onSyncMessage;
    if (
      onSyncMessage &&
      typeof onSyncMessage === "object" &&
      "subscribe" in onSyncMessage &&
      typeof onSyncMessage.subscribe === "function"
    ) {
      try {
        const sub = onSyncMessage.subscribe((msg: { str: string; fromClient?: FragmentoCliente }) => {
          callback(msg);
        });
        return {
          desuscribir: () => limpiarSuscripcionNativa(sub),
        };
      } catch (e) {
        logger.warn("[TS Adapter] Error al suscribirse a onSyncMessage nativo:", e);
      }
    }
    return { desuscribir: () => {} };
  }
}
