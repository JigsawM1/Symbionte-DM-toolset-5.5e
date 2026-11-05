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
import type { TaleSpirePlayersAdapter } from "./talespireJugadores";

export class TaleSpireCreaturesAdapter {
  private promesaMinisJugadores: Promise<Set<string>> | null = null;
  private cacheMinisJugadores: { datos: Set<string>; expiraEn: number } | null = null;
  private readonly TTL_CACHE_MINIS_JUGADORES_MS = 2500;

  constructor(private readonly obtenerPlayers: () => TaleSpirePlayersAdapter) {}

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
   * Consulta todas las miniaturas que pertenecen a jugadores registrados en la campaña o tablero.
   * Emplea paralelización IPC, deduplicación de promesas en vuelo y caché de corto plazo.
   */
  async obtenerMiniaturasDeJugadores(): Promise<Set<string>> {
    const ahora = Date.now();
    if (this.cacheMinisJugadores && ahora < this.cacheMinisJugadores.expiraEn) {
      return new Set(this.cacheMinisJugadores.datos);
    }

    if (this.promesaMinisJugadores) {
      const compartido = await this.promesaMinisJugadores;
      return new Set(compartido);
    }

    this.promesaMinisJugadores = (async () => {
      const idsMiniaturas = new Set<string>();
      try {
        const players = this.obtenerPlayers();
        const [jugadoresCampania, jugadoresTablero] = await Promise.all([
          players.getPlayersInThisCampaign(),
          players.getPlayersInThisBoard()
        ]);
        const idsJugadoresUnicos = new Set<string>();
        for (const j of [...jugadoresCampania, ...jugadoresTablero]) {
          if (j?.id) idsJugadoresUnicos.add(j.id);
        }

        if (idsJugadoresUnicos.size > 0) {
          const listasMinis = await Promise.all(
            Array.from(idsJugadoresUnicos).map((idJugador) =>
              this.getCreaturesOwnedByPlayer(idJugador)
            )
          );
          for (const minis of listasMinis) {
            for (const m of minis) {
              if (m?.id) idsMiniaturas.add(m.id);
            }
          }
        }
        this.cacheMinisJugadores = {
          datos: idsMiniaturas,
          expiraEn: Date.now() + this.TTL_CACHE_MINIS_JUGADORES_MS
        };
      } catch (e) {
        logger.warn("[TS Adapter] Error al obtener miniaturas asignadas a jugadores:", e);
      }
      return idsMiniaturas;
    })();

    try {
      const res = await this.promesaMinisJugadores;
      return new Set(res);
    } finally {
      this.promesaMinisJugadores = null;
    }
  }

  /**
   * Detecta qué miniaturas pertenecen a jugadores inspeccionando en paralelo tanto sus propietarios (ownerIds)
   * como las asignaciones de jugadores activos en la campaña de TaleSpire.
   */
  async detectarMiniaturasJugadores(idsMiniaturas: string[]): Promise<Set<string>> {
    const resultado = new Set<string>();
    if (!idsMiniaturas || idsMiniaturas.length === 0) return resultado;

    try {
      const [infos, minisJugadores] = await Promise.all([
        this.getMoreInfo(idsMiniaturas),
        this.obtenerMiniaturasDeJugadores()
      ]);

      for (const info of infos) {
        if (info?.id && Array.isArray(info.ownerIds) && info.ownerIds.length > 0) {
          resultado.add(info.id);
        }
      }

      for (const id of minisJugadores) {
        resultado.add(id);
      }
    } catch (e) {
      logger.warn("[TS Adapter] Error al detectar miniaturas de jugadores:", e);
    }

    return resultado;
  }
}
