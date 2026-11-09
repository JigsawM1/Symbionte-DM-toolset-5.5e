/**
 * talespireClientes.ts
 * --------------------
 * Adaptador para interactuar con la API de clientes de TaleSpire y gestionar roles (GM / Jugador).
 */

import type {
  EventoClienteTS,
  FragmentoCliente,
  FragmentoJugador,
  InfoCliente,
  InfoJugador
} from "@/tipos/talespire";
import { logger } from "@/utiles/logger";
import {
  establecerCacheEsGM,
  limpiarSuscripcionNativa,
  obtenerCacheEsGM,
  obtenerTSGlobal
} from "./comun";

export class TaleSpireClientsAdapter {
  async obtenerClientId(): Promise<string | null> {
    const ts = obtenerTSGlobal();
    const yo = await ts?.clients?.whoAmI?.();
    return yo?.id ?? null;
  }

  async getMoreInfo(ids: string[]): Promise<InfoCliente[]> {
    const ts = obtenerTSGlobal();
    if (!ts?.clients?.getMoreInfo) {
      throw new Error("No se puede verificar la identidad del cliente");
    }
    return ts.clients.getMoreInfo(ids);
  }

  /**
   * Comprueba si el usuario actual tiene rol de Dungeon Master (GM).
   * Consulta players.getMoreInfo ([playerInfo.rights]), clients.getMoreInfo o prueba permisos.
   * Utiliza un caché en memoria para evitar llamadas redundantes a la API de TaleSpire.
   */
  async esGM(forzarRefresco = false): Promise<boolean> {
    const cacheActual = obtenerCacheEsGM();
    if (cacheActual !== null && !forzarRefresco) {
      return cacheActual;
    }

    const ts = obtenerTSGlobal();
    // 0. Si no existe window.TS (desarrollo local fuera de TaleSpire o entorno Node/Vitest), por defecto es Jugador (false)
    if (!ts) return false;

    logger.debug("[TS Adapter esGM] Evaluando modo de vista cliente en TaleSpire...");

    // 1. Consultar a través de clients.whoAmI() y clients.getMoreInfo()
    if (ts.clients && typeof ts.clients.whoAmI === "function") {
      try {
        const yoCliente = (await ts.clients.whoAmI()) as
          | (FragmentoCliente & { clientMode?: string; id?: string })
          | undefined;
        const clientId = typeof yoCliente === "string" ? yoCliente : yoCliente?.id;

        if (yoCliente?.clientMode) {
          logger.debug("[TS Adapter esGM] Modo cliente directo 'clientMode':", yoCliente.clientMode);
          const esGm = yoCliente.clientMode === "gm";
          establecerCacheEsGM(esGm);
          return esGm;
        }

        if (clientId && typeof ts.clients.getMoreInfo === "function") {
          const infoClientes = await ts.clients.getMoreInfo([clientId]);
          if (infoClientes && infoClientes[0]) {
            const clientInfo = infoClientes[0] as
              | (InfoCliente & {
                  clientMode?: string;
                  rights?: { canGm?: boolean };
                  playerRights?: { canGm?: boolean };
                  permissions?: { canGm?: boolean };
                })
              | undefined;
            if (clientInfo?.clientMode) {
              logger.debug("[TS Adapter esGM] clientInfo.clientMode:", clientInfo.clientMode);
              const esGm = clientInfo.clientMode === "gm";
              establecerCacheEsGM(esGm);
              return esGm;
            }
            const derechos = clientInfo?.rights || clientInfo?.playerRights || clientInfo?.permissions;
            if (derechos?.canGm !== undefined) {
              const esGm = Boolean(derechos.canGm);
              establecerCacheEsGM(esGm);
              return esGm;
            }
          }
        }
      } catch (e) {
        logger.warn("[TS Adapter esGM] Error al consultar clients.whoAmI / getMoreInfo:", e);
      }
    }

    // 2. Consultar a través de players.whoAmI() y players.getMoreInfo()
    if (ts.players && typeof ts.players.whoAmI === "function") {
      try {
        const yoJugador = (await ts.players.whoAmI()) as (FragmentoJugador & { id?: string }) | undefined;
        const playerId = typeof yoJugador === "string" ? yoJugador : yoJugador?.id;

        if (playerId && typeof ts.players.getMoreInfo === "function") {
          const infoJugadores = await ts.players.getMoreInfo([playerId]);
          if (infoJugadores && infoJugadores[0]) {
            const jugadorInfo = infoJugadores[0] as
              | (InfoJugador & {
                  rights?: { canGm?: boolean };
                  playerRights?: { canGm?: boolean };
                  permissions?: { canGm?: boolean };
                })
              | undefined;
            const derechos = jugadorInfo?.rights || jugadorInfo?.playerRights || jugadorInfo?.permissions;
            if (derechos?.canGm !== undefined) {
              const esGm = Boolean(derechos.canGm);
              establecerCacheEsGM(esGm);
              return esGm;
            }
          }
        }
      } catch (e) {
        logger.warn("[TS Adapter esGM] Error al consultar players.getMoreInfo:", e);
      }
    }

    // Fallback seguro dentro de TaleSpire: si no se confirmó rol GM explícito, asume Jugador (false)
    logger.debug("[TS Adapter esGM] No se confirmó rol GM en TaleSpire. Asumiendo Jugador (false).");
    establecerCacheEsGM(false);
    return false;
  }

  /**
   * Escucha el evento 'clientModeChanged' de TaleSpire en tiempo real cuando un usuario cambia de rol (DM <-> Jugador).
   */
  suscribirACambioModoCliente(callback: (evento: EventoClienteTS) => void): { desuscribir: () => void } {
    const ts = obtenerTSGlobal();
    const listener = (evento: unknown) => {
      if (typeof evento !== 'object' || evento === null || !('kind' in evento) || evento.kind !== 'clientModeChanged') return;
      // La identidad completa permite distinguir el modo propio del de otro cliente.
      callback(evento as EventoClienteTS);
    };

    const onClientEvent = ts?.clients?.onClientEvent;
    if (onClientEvent) {
      if (typeof onClientEvent === "object" && "subscribe" in onClientEvent && typeof onClientEvent.subscribe === "function") {
        const sub = onClientEvent.subscribe(listener as (e: EventoClienteTS) => void);
        return { desuscribir: () => limpiarSuscripcionNativa(sub) };
      }
      if (typeof onClientEvent === "function") {
        const unsub = onClientEvent(listener as (e: unknown) => void);
        return { desuscribir: () => (typeof unsub === "function" ? unsub() : undefined) };
      }
    }
    return { desuscribir: () => {} };
  }

  /**
   * Obtiene la ID de jugador única del usuario conectado.
   */
  async obtenerPlayerId(): Promise<string | null> {
    const ts = obtenerTSGlobal();
    if (ts?.clients && typeof ts.clients.whoAmI === "function") {
      try {
        const yo = await ts.clients.whoAmI();
        return yo.player?.id || yo.playerId || null;
      } catch (e) {
        logger.error("[TS Adapter] Error obteniendo ID de jugador:", e);
      }
    }
    return null;
  }
}
