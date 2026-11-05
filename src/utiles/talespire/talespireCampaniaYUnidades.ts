/**
 * talespireCampaniaYUnidades.ts
 * -----------------------------
 * Adaptador para obtener información sobre la campaña activa y las unidades de medida en TaleSpire.
 */

import type { InfoCampania, UnidadDistanciaTS } from "@/tipos/talespire";
import { logger } from "@/utiles/logger";
import { obtenerTSGlobal } from "./comun";

export class TaleSpireCampaignsAdapter {
  /**
   * Obtiene detalles extendidos de la campaña actual (id, nombre, etc).
   */
  async getMoreInfoAboutCurrentCampaign(): Promise<InfoCampania | null> {
    const ts = obtenerTSGlobal();
    if (ts?.campaigns && typeof ts.campaigns.getMoreInfoAboutCurrentCampaign === "function") {
      return await ts.campaigns.getMoreInfoAboutCurrentCampaign();
    }
    return null;
  }
}

export class TaleSpireUnitsAdapter {
  private promesaUnidadesDistancia: Promise<UnidadDistanciaTS> | null = null;
  private cacheUnidadesDistancia: { datos: UnidadDistanciaTS; expiraEn: number } | null = null;
  private readonly TTL_CACHE_UNIDADES_MS = 10000;

  /**
   * Obtiene las unidades de distancia configuradas para la campaña actual en TaleSpire.
   * Implementa caché en memoria con TTL de 10s y deduplicación de promesas concurrentes.
   * Retorna fallback de 5 pies (ft) por casilla si no está en TaleSpire.
   */
  async getDistanceUnitsForThisCampaign(): Promise<UnidadDistanciaTS> {
    const ahora = Date.now();
    if (this.cacheUnidadesDistancia && ahora < this.cacheUnidadesDistancia.expiraEn) {
      return this.cacheUnidadesDistancia.datos;
    }

    if (this.promesaUnidadesDistancia) {
      return await this.promesaUnidadesDistancia;
    }

    this.promesaUnidadesDistancia = (async () => {
      let unidadesFinal: UnidadDistanciaTS = { name: "ft", numberPerTile: 5 };
      const ts = obtenerTSGlobal();
      if (ts?.units && typeof ts.units.getDistanceUnitsForThisCampaign === "function") {
        try {
          const unidades = await ts.units.getDistanceUnitsForThisCampaign();
          if (unidades && typeof unidades.numberPerTile === "number") {
            unidadesFinal = unidades;
          }
        } catch (e) {
          logger.warn("[TS Adapter] Error al obtener unidades de distancia de TaleSpire:", e);
        }
      }
      this.cacheUnidadesDistancia = {
        datos: unidadesFinal,
        expiraEn: Date.now() + this.TTL_CACHE_UNIDADES_MS,
      };
      return unidadesFinal;
    })();

    try {
      return await this.promesaUnidadesDistancia;
    } finally {
      this.promesaUnidadesDistancia = null;
    }
  }
}
