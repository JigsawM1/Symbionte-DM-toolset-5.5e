/**
 * talespireCriaturas.ts
 * ---------------------
 * Adaptador para interactuar con las miniaturas/criaturas de la mesa en TaleSpire.
 */

import type {
  EventoCriaturaTS,
  FragmentoCriatura,
  FragmentoOId,
  InfoCriatura
} from "@/tipos/talespire";
import { logger } from "@/utiles/logger";
import { limpiarSuscripcionNativa, obtenerTSGlobal } from "./comun";

export class TaleSpireCreaturesAdapter {
  /**
   * Obtiene el listado de miniaturas seleccionadas en la mesa por el DM.
   */
  async getSelectedCreatures(): Promise<FragmentoCriatura[]> {
    const ts = obtenerTSGlobal();
    if (ts?.creatures && typeof ts.creatures.getSelectedCreatures === "function") {
      return await ts.creatures.getSelectedCreatures();
    }
    return [];
  }

  /**
   * Suscribe un callback para cambios de estado de criaturas (ubicación, HP, etc.) usando la API nativa.
   */
  suscribirACambioEstadoCriatura(callback: (datos: EventoCriaturaTS) => void): { desuscribir: () => void } {
    const ts = obtenerTSGlobal();
    if (ts?.creatures?.onCreatureStateChange && typeof ts.creatures.onCreatureStateChange.subscribe === "function") {
      const sub = ts.creatures.onCreatureStateChange.subscribe((datos) => {
        callback(datos);
      });
      return { desuscribir: () => limpiarSuscripcionNativa(sub) };
    }
    return { desuscribir: () => {} };
  }

  /**
   * Obtiene el listado de miniaturas que pertenecen a un jugador específico.
   */
  async getCreaturesOwnedByPlayer(playerFragmentOrId: FragmentoOId): Promise<FragmentoCriatura[]> {
    const ts = obtenerTSGlobal();
    if (ts?.creatures && typeof ts.creatures.getCreaturesOwnedByPlayer === "function") {
      try {
        const idStr = typeof playerFragmentOrId === "string" ? playerFragmentOrId : playerFragmentOrId.id;
        return await ts.creatures.getCreaturesOwnedByPlayer(idStr);
      } catch (e) {
        logger.warn("[TS Adapter] Error en getCreaturesOwnedByPlayer:", e);
      }
    }
    return [];
  }

  /**
   * Obtiene información extendida sobre un listado de criaturas.
   */
  async getMoreInfo(creatureFragmentOrIds: FragmentoOId[]): Promise<InfoCriatura[]> {
    const ts = obtenerTSGlobal();
    if (ts?.creatures && typeof ts.creatures.getMoreInfo === "function") {
      return await ts.creatures.getMoreInfo(creatureFragmentOrIds);
    }
    return [];
  }

  /**
   * Lee los propietarios de las miniaturas solicitadas. Consultar las miniaturas
   * de un GM desde un cliente sin permisos puede romper la respuesta nativa de TaleSpire.
   */
  async detectarMiniaturasJugadores(idsMiniaturas: string[]): Promise<Set<string>> {
    const resultado = new Set<string>();
    if (!idsMiniaturas || idsMiniaturas.length === 0) return resultado;

    try {
      const infos = await this.getMoreInfo(idsMiniaturas);
      for (const info of infos) {
        if (info?.id && Array.isArray(info.ownerIds) && info.ownerIds.length > 0) {
          resultado.add(info.id);
        }
      }
    } catch (e) {
      logger.warn("[TS Adapter] Error al detectar miniaturas de jugadores:", e);
    }

    return resultado;
  }
}
