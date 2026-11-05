/**
 * talespireJugadores.ts
 * ---------------------
 * Adaptador para consultar los jugadores conectados, locales y de la campaña.
 */

import type { FragmentoJugador } from "@/tipos/talespire";
import { logger } from "@/utiles/logger";
import { obtenerTSGlobal } from "./comun";

export class TaleSpirePlayersAdapter {
  /**
   * Retorna el fragmento del propio jugador conectado ejecutando el Simbionte.
   */
  async whoAmI(): Promise<FragmentoJugador | null> {
    const ts = obtenerTSGlobal();
    if (ts?.players && typeof ts.players.whoAmI === "function") {
      try {
        return await ts.players.whoAmI();
      } catch (e) {
        logger.warn("[TS Adapter] Error en players.whoAmI:", e);
      }
    }
    return null;
  }

  /**
   * Obtiene el nombre del jugador local conectado a TaleSpire.
   */
  async obtenerNombreJugadorLocal(): Promise<string | null> {
    const ts = obtenerTSGlobal();
    if (!ts) return null;

    // 1. Intentar con players.whoAmI()
    if (ts.players && typeof ts.players.whoAmI === "function") {
      try {
        const yo = await ts.players.whoAmI();
        if (yo?.name && yo.name.trim() !== "") {
          return yo.name.trim();
        }
        if (yo?.id && typeof ts.players.getMoreInfo === "function") {
          const info = await ts.players.getMoreInfo([yo.id]);
          if (info && info[0]?.name) {
            return info[0].name.trim();
          }
        }
      } catch (e) {
        logger.warn("[TS Adapter] Error al resolver nombre en players.whoAmI:", e);
      }
    }

    // 2. Intentar con clients.whoAmI()
    if (ts.clients && typeof ts.clients.whoAmI === "function") {
      try {
        const yoCliente = await ts.clients.whoAmI();
        if (yoCliente?.player?.name && yoCliente.player.name.trim() !== "") {
          return yoCliente.player.name.trim();
        }
        const pId = yoCliente?.player?.id || yoCliente?.playerId;
        if (pId && ts.players && typeof ts.players.getMoreInfo === "function") {
          const info = await ts.players.getMoreInfo([pId]);
          if (info && info[0]?.name) {
            return info[0].name.trim();
          }
        }
      } catch (e) {
        logger.warn("[TS Adapter] Error al resolver nombre en clients.whoAmI:", e);
      }
    }

    return null;
  }

  /**
   * Obtiene el listado de jugadores registrados en la campaña actual de TaleSpire.
   */
  async getPlayersInThisCampaign(): Promise<FragmentoJugador[]> {
    const ts = obtenerTSGlobal();
    if (ts?.players && typeof ts.players.getPlayersInThisCampaign === "function") {
      try {
        return await ts.players.getPlayersInThisCampaign();
      } catch (e) {
        logger.warn("[TS Adapter] Error en players.getPlayersInThisCampaign:", e);
      }
    }
    return [];
  }

  /**
   * Obtiene el listado de jugadores presentes en el tablero activo de TaleSpire.
   */
  async getPlayersInThisBoard(): Promise<FragmentoJugador[]> {
    const ts = obtenerTSGlobal();
    if (ts?.players && typeof ts.players.getPlayersInThisBoard === "function") {
      try {
        return await ts.players.getPlayersInThisBoard();
      } catch (e) {
        logger.warn("[TS Adapter] Error en players.getPlayersInThisBoard:", e);
      }
    }
    return [];
  }
}
