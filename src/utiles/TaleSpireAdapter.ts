/**
 * TaleSpireAdapter.ts
 * -------------------
 * Adaptador centralizado y seguro para interactuar con la API nativa de TaleSpire (window.TS).
 *
 * Ofrece:
 * 1. Aislamiento total: El resto del código no toca window.TS directamente.
 * 2. Tolerancia a fallos: Detección defensiva de APIs disponibles y fallbacks locales.
 * 3. Deduplicación de llamadas: Une peticiones concurrentes a getQueue() para reducir I/O.
 * 4. Tipado estricto: Emplea la interfaz TaleSpireAPI de talespire.d.ts.
 *
 */

import type {
  InfoCampania,
  ColaIniciativaTS,
  FragmentoCriatura,
  SeleccionCriaturas,
  DescriptorTirada,
  GrupoResultadosTirada,
  FragmentoOId,
  FragmentoJugador,
  InfoCriatura,
  EventoIniciativaActualizada,
  PaqueteContenidoTS,
  InfoObjetoTableroTS,
  TaleSpireAPI,
  EventoClienteTS,
  FragmentoCliente,
  InfoCliente,
  InfoJugador,
  UnidadDistanciaTS,
  EventoCriaturaTS
} from "@/tipos/talespire";
import { logger } from "@/utiles/logger";

let cacheEsGM: boolean | null = null;

export const establecerCacheEsGM = (esGm: boolean) => {
  cacheEsGM = esGm;
};

/**
 * Desuscribe de manera defensiva cualquier objeto de suscripción nativo devuelto por TaleSpire,
 * admitiendo tanto desuscribir() como unsubscribe().
 */
function limpiarSuscripcionNativa(sub: unknown): void {
  if (!sub || typeof sub !== "object") return;
  const s = sub as { desuscribir?: () => void; unsubscribe?: () => void };
  if (typeof s.desuscribir === "function") {
    s.desuscribir();
  } else if (typeof s.unsubscribe === "function") {
    s.unsubscribe();
  }
}

class TaleSpireAdapter {
  private getQueuePromise: Promise<ColaIniciativaTS> | null = null;
  private canalBroadcastSync?: BroadcastChannel;

  /**
   * Obtiene la referencia global de window.TS de forma segura en cualquier entorno.
   */
  private get tsGlobal(): TaleSpireAPI | undefined {
    return typeof window !== "undefined" ? window.TS : undefined;
  }

  /**
   * Indica si la API global de TaleSpire está activa e inicializada.
   */
  get estaDisponible(): boolean {
    return !!this.tsGlobal;
  }

  // ==========================================
  // --- DADOS (DICE API) ---
  // ==========================================

  dice = {
    /**
     * Valida si un string cumple con el formato estándar de dados de TaleSpire.
     */
    isValidRollString: (rollStr: string): boolean => {
      const ts = this.tsGlobal;
      if (ts?.dice && typeof ts.dice.isValidRollString === "function") {
        return ts.dice.isValidRollString(rollStr);
      }
      return false;
    },

    /**
     * Convierte un string de tirada física en descriptores nativos 3D.
     */
    makeRollDescriptors: async (rollStr: string): Promise<DescriptorTirada[]> => {
      const ts = this.tsGlobal;
      if (ts?.dice && typeof ts.dice.makeRollDescriptors === "function") {
        try {
          return await ts.dice.makeRollDescriptors(rollStr);
        } catch (error) {
          logger.error("[TS Adapter] Error en makeRollDescriptors nativo:", error);
        }
      }
      logger.error("[TS Adapter] dice.makeRollDescriptors no disponible. Retornando vacío.");
      return [];
    },

    /**
     * Lanza los dados físicamente en la mesa 3D.
     */
    putDiceInTray: async (descriptors: DescriptorTirada[], silenceDefaultChatCard = false): Promise<string> => {
      const ts = this.tsGlobal;
      if (ts?.dice && typeof ts.dice.putDiceInTray === "function") {
        return await ts.dice.putDiceInTray(descriptors, silenceDefaultChatCard);
      }
      logger.error("[TS Adapter] dice.putDiceInTray no disponible.");
      return "";
    },

    /**
     * Evalúa el total numérico de un grupo de resultados de dados.
     */
    evaluateDiceResultsGroup: async (group: GrupoResultadosTirada | unknown): Promise<number> => {
      const ts = this.tsGlobal;
      if (ts?.dice && typeof ts.dice.evaluateDiceResultsGroup === "function") {
        try {
          return await ts.dice.evaluateDiceResultsGroup(group);
        } catch (e) {
          logger.error("[TS Adapter] Error evaluando grupo con API nativa:", e);
        }
      }
      return this.obtenerTotalGrupoFallback(group);
    },

    /**
     * Envía de forma elegante un resultado filtrado al chat del juego.
     */
    sendDiceResult: async (groups: GrupoResultadosTirada[] | unknown[], rollId?: string): Promise<void> => {
      const ts = this.tsGlobal;
      if (ts?.dice && typeof ts.dice.sendDiceResult === "function") {
        await ts.dice.sendDiceResult(groups, rollId);
      } else {
        logger.warn("[TS Adapter] dice.sendDiceResult no disponible.");
        throw new Error("dice.sendDiceResult no disponible en TaleSpire");
      }
    }
  };

  // ==========================================
  // --- CHAT (CHAT API) ---
  // ==========================================

  chat = {
    /**
     * Envia un mensaje plano (o de dados) al chat de TaleSpire.
     */
    send: async (message: string): Promise<boolean> => {
      const ts = this.tsGlobal;
      if (ts?.chat && typeof ts.chat.send === "function") {
        // La API v0.1 requiere un segundo parámetro "board" para representar visualmente el chat.
        return await ts.chat.send(message, "board");
      }
      logger.warn("[TS Adapter] chat.send no disponible.");
      return false;
    },

    /**
     * Envía un mensaje en el chat visible solo para destinatarios específicos.
     */
    multiSend: async (message: string, targets: string[]): Promise<boolean> => {
      const ts = this.tsGlobal;
      if (ts?.chat) {
        if (typeof ts.chat.multiSend === "function") {
          return await ts.chat.multiSend(message, targets);
        } else if (typeof ts.chat.send === "function") {
          // Fallback a send plano si multiSend no existe
          return await ts.chat.send(message, "board");
        }
      }
      logger.warn("[TS Adapter] chat.multiSend no disponible.");
      return false;
    },

    /**
     * Envía un mensaje como una criatura específica.
     */
    sendAsCreature: async (creatureId: FragmentoOId, message: string): Promise<boolean> => {
      const ts = this.tsGlobal;
      if (ts?.chat && typeof ts.chat.sendAsCreature === "function") {
        return await ts.chat.sendAsCreature(creatureId, message);
      }
      return false;
    },

    /**
     * Envía un mensaje como una criatura a destinatarios específicos.
     */
    multiSendAsCreature: async (creatureId: FragmentoOId, message: string, targets: string[]): Promise<boolean> => {
      const ts = this.tsGlobal;
      if (ts?.chat && typeof ts.chat.multiSendAsCreature === "function") {
        return await ts.chat.multiSendAsCreature(creatureId, message, targets);
      }
      return false;
    }
  };

  // ==========================================
  // --- INICIATIVA (INITIATIVE API) ---
  // ==========================================

  initiative = {
    /**
     * Obtiene la cola de iniciativa nativa. Deduplica llamadas concurrentes (debounce 100ms).
     */
    getQueue: async (): Promise<ColaIniciativaTS | null> => {
      if (this.getQueuePromise) {
        return this.getQueuePromise;
      }

      if (window.TS?.initiative && typeof window.TS.initiative.getQueue === "function") {
        this.getQueuePromise = window.TS.initiative.getQueue();

        try {
          return await this.getQueuePromise;
        } finally {
          // Garantizar la limpieza de la promesa de caché únicamente al finalizar la misma
          this.getQueuePromise = null;
        }
      }
      return null;
    },

    /**
     * Suscribe un callback para eventos de cambio en la iniciativa.
     */
    suscribirAEvento: (callback: (evento?: EventoIniciativaActualizada) => void): { desuscribir: () => void } => {
      if (window.TS?.initiative?.onInitiativeEvent && typeof window.TS.initiative.onInitiativeEvent.subscribe === "function") {
        const sub = window.TS.initiative.onInitiativeEvent.subscribe((datos) => {
          callback(datos);
        });
        return { desuscribir: () => limpiarSuscripcionNativa(sub) };
      }
      return { desuscribir: () => {} };
    }
  };

  // ==========================================
  // --- CRIATURAS (CREATURES API) ---
  // ==========================================

  creatures = {
    /**
     * Obtiene el listado de miniaturas seleccionadas en la mesa por el DM.
     */
    getSelectedCreatures: async (): Promise<FragmentoCriatura[]> => {
      if (window.TS?.creatures && typeof window.TS.creatures.getSelectedCreatures === "function") {
        return await window.TS.creatures.getSelectedCreatures();
      }
      return [];
    },

    /**
     * Suscribe un callback para cambios en la selección física de miniaturas.
     */
    suscribirASeleccion: (callback: (datos: SeleccionCriaturas) => void): { desuscribir: () => void } => {
      if (window.TS?.creatures?.onCreatureSelectionChange && typeof window.TS.creatures.onCreatureSelectionChange.subscribe === "function") {
        const sub = window.TS.creatures.onCreatureSelectionChange.subscribe((datos) => {
          callback(datos);
        });
        return { desuscribir: () => limpiarSuscripcionNativa(sub) };
      }
      return { desuscribir: () => {} };
    },

    /**
     * Suscribe un callback para cambios de estado de criaturas (ubicación, HP, etc.) usando la API nativa.
     */
    suscribirACambioEstadoCriatura: (callback: (datos: EventoCriaturaTS) => void): { desuscribir: () => void } => {
      if (window.TS?.creatures?.onCreatureStateChange && typeof window.TS.creatures.onCreatureStateChange.subscribe === "function") {
        const sub = window.TS.creatures.onCreatureStateChange.subscribe((datos) => {
          callback(datos);
        });
        return { desuscribir: () => limpiarSuscripcionNativa(sub) };
      }
      return { desuscribir: () => {} };
    },

    /**
     * Obtiene el listado de miniaturas que pertenecen a un jugador específico.
     */
    getCreaturesOwnedByPlayer: async (playerFragmentOrId: FragmentoOId): Promise<FragmentoCriatura[]> => {
      if (window.TS?.creatures && typeof window.TS.creatures.getCreaturesOwnedByPlayer === "function") {
        try {
          const idStr = typeof playerFragmentOrId === "string" ? playerFragmentOrId : playerFragmentOrId.id;
          return await window.TS.creatures.getCreaturesOwnedByPlayer(idStr);
        } catch (e) {
          logger.warn("[TS Adapter] Error en getCreaturesOwnedByPlayer:", e);
        }
      }
      return [];
    },

    /**
     * Obtiene información extendida sobre un listado de criaturas.
     */
    getMoreInfo: async (creatureFragmentOrIds: FragmentoOId[]): Promise<InfoCriatura[]> => {
      if (window.TS?.creatures && typeof window.TS.creatures.getMoreInfo === "function") {
        return await window.TS.creatures.getMoreInfo(creatureFragmentOrIds);
      }
      return [];
    }
  };

  // ==========================================
  // --- CONTENT PACKS (ASSETS & THUMBNAILS API) ---
  // ==========================================

  contentPacks = {
    /**
     * Obtiene la lista de fragmentos de paquetes de contenido cargados en TaleSpire.
     */
    getContentPacks: async (): Promise<PaqueteContenidoTS[]> => {
      const cp = window.TS?.contentPacks;
      if (cp && typeof cp.getContentPacks === "function") {
        try {
          const resultado = await cp.getContentPacks();
          logger.debug("[TS Adapter contentPacks] getContentPacks retorno:", resultado);
          return resultado || [];
        } catch (e) {
          logger.error("[TS Adapter contentPacks] Error al obtener getContentPacks:", e);
        }
      } else {
        logger.warn("[TS Adapter contentPacks] window.TS.contentPacks.getContentPacks no está disponible");
      }
      return [];
    },

    /**
     * Obtiene metadatos e información extendida sobre los paquetes de contenido.
     */
    getMoreInfo: async (packs: PaqueteContenidoTS[] | unknown[]): Promise<PaqueteContenidoTS[]> => {
      const cp = window.TS?.contentPacks;
      if (cp && typeof cp.getMoreInfo === "function") {
        try {
          const resultado = await cp.getMoreInfo(packs);
          logger.debug("[TS Adapter contentPacks] getMoreInfo retorno:", resultado?.length, "paquetes con información");
          return resultado || [];
        } catch (e) {
          logger.error("[TS Adapter contentPacks] Error al obtener getMoreInfo de contentPacks:", e);
        }
      } else {
        logger.warn("[TS Adapter contentPacks] window.TS.contentPacks.getMoreInfo no está disponible");
      }
      return [];
    },

    /**
     * Busca un objeto del tablero (miniatura/prop/tile) dentro de los paquetes de contenido.
     */
    findBoardObjectInPacks: async (boardObjectId: string, packsInfos: PaqueteContenidoTS[] | unknown[]): Promise<InfoObjetoTableroTS | null> => {
      const cp = window.TS?.contentPacks;
      if (cp && typeof cp.findBoardObjectInPacks === "function") {
        try {
          const resultado = await cp.findBoardObjectInPacks(boardObjectId, packsInfos);
          logger.debug(`[TS Adapter contentPacks] findBoardObjectInPacks para '${boardObjectId}':`, resultado);
          return resultado;
        } catch (e) {
          logger.warn(`[TS Adapter contentPacks] Error al buscar objeto '${boardObjectId}' en contentPacks:`, e);
        }
      } else {
        logger.warn("[TS Adapter contentPacks] window.TS.contentPacks.findBoardObjectInPacks no está disponible");
      }
      return null;
    },

    /**
     * Crea un elemento DOM (canvas/img) con la miniatura renderizada del catálogo 3D de TaleSpire.
     */
    createThumbnailElementForBoardObject: async (boardObjectInfo: InfoObjetoTableroTS | unknown, size?: number): Promise<HTMLElement | null> => {
      const cp = window.TS?.contentPacks;
      if (cp && typeof cp.createThumbnailElementForBoardObject === "function") {
        // Probamos tanto el objeto interno (.boardObject) como la envoltura completa
        const objInfo = boardObjectInfo as InfoObjetoTableroTS | undefined;
        const candidatos = [
          objInfo?.boardObject,
          boardObjectInfo
        ].filter(Boolean);

        for (const candidato of candidatos) {
          if (size !== undefined) {
            try {
              const el = await cp.createThumbnailElementForBoardObject(candidato, size);
              if (el) {
                logger.debug("[TS Adapter contentPacks] Thumbnail creado con tamaño especificado:", el);
                return el;
              }
            } catch (e1) {
              logger.debug("[TS Adapter contentPacks] Intento con tamaño falló:", e1);
            }
          }

          try {
            const el = await cp.createThumbnailElementForBoardObject(candidato);
            if (el) {
              logger.debug("[TS Adapter contentPacks] Thumbnail creado con tamaño por defecto:", el);
              return el;
            }
          } catch (e2) {
            logger.debug("[TS Adapter contentPacks] Intento sin tamaño falló:", e2);
          }
        }
      } else {
        logger.warn("[TS Adapter contentPacks] window.TS.contentPacks.createThumbnailElementForBoardObject no está disponible");
      }
      return null;
    }
  };

  // ==========================================
  // --- CAMPAÑA (CAMPAIGNS API) ---
  // ==========================================

  campaigns = {
    /**
     * Obtiene detalles extendidos de la campaña actual (id, nombre, etc).
     */
    getMoreInfoAboutCurrentCampaign: async (): Promise<InfoCampania | null> => {
      if (window.TS?.campaigns && typeof window.TS.campaigns.getMoreInfoAboutCurrentCampaign === "function") {
        return await window.TS.campaigns.getMoreInfoAboutCurrentCampaign();
      }
      return null;
    }
  };

  // ==========================================
  // --- UNIDADES DE DISTANCIA (UNITS API) ---
  // ==========================================

  units = {
    /**
     * Obtiene las unidades de distancia configuradas para la campaña actual en TaleSpire.
     * Retorna fallback de 5 pies (ft) por casilla si no está en TaleSpire.
     */
    getDistanceUnitsForThisCampaign: async (): Promise<UnidadDistanciaTS> => {
      if (window.TS?.units && typeof window.TS.units.getDistanceUnitsForThisCampaign === "function") {
        try {
          const unidades = await window.TS.units.getDistanceUnitsForThisCampaign();
          if (unidades && typeof unidades.numberPerTile === "number") {
            return unidades;
          }
        } catch (e) {
          logger.warn("[TS Adapter] Error al obtener unidades de distancia de TaleSpire:", e);
        }
      }
      return { name: "ft", numberPerTile: 5 };
    }
  };

  // ==========================================
  // --- CLIENTES (CLIENTS / PLAYERS API) ---
  // ==========================================

  clients = {
    /**
     * Comprueba si el usuario actual tiene rol de Dungeon Master (GM).
     * Consulta players.getMoreInfo ([playerInfo.rights]), clients.getMoreInfo o prueba permisos.
     * Utiliza un caché en memoria para evitar llamadas redundantes a la API de TaleSpire.
     */
    esGM: async (forzarRefresco = false): Promise<boolean> => {
      // Si ya tenemos el rol en caché y no pedimos refresco forzado, retornarlo de inmediato
      if (cacheEsGM !== null && !forzarRefresco) {
        return cacheEsGM;
      }

      // 0. Si no existe window.TS (desarrollo local fuera de TaleSpire o entorno Node/Vitest), por defecto es Jugador (false)
      if (typeof window === "undefined" || !window.TS) return false;

      logger.debug("[TS Adapter esGM] Evaluando modo de vista cliente en TaleSpire...");

      // 1. Consultar a través de window.TS.clients.whoAmI() y window.TS.clients.getMoreInfo()
      if (window.TS?.clients && typeof window.TS.clients.whoAmI === "function") {
        try {
          const yoCliente = await window.TS.clients.whoAmI() as (FragmentoCliente & { clientMode?: string; id?: string }) | undefined;
          const clientId = typeof yoCliente === "string" ? yoCliente : yoCliente?.id;

          if (yoCliente?.clientMode) {
            logger.debug("[TS Adapter esGM] Modo cliente directo 'clientMode':", yoCliente.clientMode);
            const esGm = yoCliente.clientMode === "gm";
            cacheEsGM = esGm;
            return esGm;
          }

          if (clientId && typeof window.TS.clients.getMoreInfo === "function") {
            const infoClientes = await window.TS.clients.getMoreInfo([clientId]);
            if (infoClientes && infoClientes[0]) {
              const clientInfo = infoClientes[0] as (InfoCliente & { clientMode?: string; rights?: { canGm?: boolean }; playerRights?: { canGm?: boolean }; permissions?: { canGm?: boolean } }) | undefined;
              if (clientInfo?.clientMode) {
                logger.debug("[TS Adapter esGM] clientInfo.clientMode:", clientInfo.clientMode);
                const esGm = clientInfo.clientMode === "gm";
                cacheEsGM = esGm;
                return esGm;
              }
              const derechos = clientInfo?.rights || clientInfo?.playerRights || clientInfo?.permissions;
              if (derechos?.canGm !== undefined) {
                const esGm = Boolean(derechos.canGm);
                cacheEsGM = esGm;
                return esGm;
              }
            }
          }
        } catch (e) {
          logger.warn("[TS Adapter esGM] Error al consultar clients.whoAmI / getMoreInfo:", e);
        }
      }

      // 2. Consultar a través de window.TS.players.whoAmI() y window.TS.players.getMoreInfo()
      if (window.TS?.players && typeof window.TS.players.whoAmI === "function") {
        try {
          const yoJugador = await window.TS.players.whoAmI() as (FragmentoJugador & { id?: string }) | undefined;
          const playerId = typeof yoJugador === "string" ? yoJugador : yoJugador?.id;

          if (playerId && typeof window.TS.players.getMoreInfo === "function") {
            const infoJugadores = await window.TS.players.getMoreInfo([playerId]);
            if (infoJugadores && infoJugadores[0]) {
              const jugadorInfo = infoJugadores[0] as (InfoJugador & { rights?: { canGm?: boolean }; playerRights?: { canGm?: boolean }; permissions?: { canGm?: boolean } }) | undefined;
              const derechos = jugadorInfo?.rights || jugadorInfo?.playerRights || jugadorInfo?.permissions;
              if (derechos?.canGm !== undefined) {
                const esGm = Boolean(derechos.canGm);
                cacheEsGM = esGm;
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
      cacheEsGM = false;
      return false;
    },

    /**
     * Escucha el evento 'clientModeChanged' de TaleSpire en tiempo real cuando un usuario cambia de rol (DM <-> Jugador).
     */
    suscribirACambioModoCliente: (callback: (modo: import("../tipos/talespire").ModoCliente) => void): { desuscribir: () => void } => {
      const listener = (evento: unknown) => {
        const ev = evento as EventoClienteTS | { clientMode?: string; payload?: { clientMode?: string } } | string | null | undefined;
        if (!ev) return;
        const modo = typeof ev === "string" ? ev : ("clientMode" in ev ? ev.clientMode : ev?.payload?.clientMode);
        if (modo === "gm" || modo === "player" || modo === "spectator") {
          cacheEsGM = modo === "gm";
          callback(modo);
        }
      };

      const onClientEvent = window.TS?.clients?.onClientEvent;
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
    },

    /**
     * Obtiene la ID de jugador única del usuario conectado.
     */
    obtenerPlayerId: async (): Promise<string | null> => {
      if (window.TS?.clients && typeof window.TS.clients.whoAmI === "function") {
        try {
          const yo = await window.TS.clients.whoAmI();
          return yo.player?.id || yo.playerId || null;
        } catch (e) {
          logger.error("[TS Adapter] Error obteniendo ID de jugador:", e);
        }
      }
      return null;
    }
  };

  // ==========================================
  // --- JUGADORES (PLAYERS API) ---
  // ==========================================

  players = {
    /**
     * Retorna el fragmento del propio jugador conectado ejecutando el Simbionte.
     */
    whoAmI: async (): Promise<FragmentoJugador | null> => {
      if (window.TS?.players && typeof window.TS.players.whoAmI === "function") {
        try {
          return await window.TS.players.whoAmI();
        } catch (e) {
          logger.warn("[TS Adapter] Error en players.whoAmI:", e);
        }
      }
      return null;
    },

    /**
     * Obtiene el nombre del jugador local conectado a TaleSpire.
     */
    obtenerNombreJugadorLocal: async (): Promise<string | null> => {
      const ts = window.TS;
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
  };


  // ==========================================
  // --- ALMACENAMIENTO (LOCALSTORAGE API) ---
  // ==========================================

  localStorage = {
    /**
     * Guarda de forma persistente un Blob de texto en disco mediante TaleSpire.
     * NOTA: La API real de TaleSpire setBlob usa firma (data) sin clave.
     * La clave se mantiene en la interfaz para el fallback de navegador.
     */
    guardarBlob: async (_clave: string, datos: string): Promise<boolean> => {
      if (window.TS?.localStorage?.global && typeof window.TS.localStorage.global.setBlob === "function") {
        try {
          // API real de TaleSpire: setBlob(data) — sin clave
          await window.TS.localStorage.global.setBlob(datos);
          return true;
        } catch (error) {
          logger.error("[TS Adapter] Excepción en setBlob nativo:", error);
          return false;
        }
      }

      // Fallback a almacenamiento local del navegador (desarrollo local / entorno Web)
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(_clave, datos);
          return true;
        } catch (error) {
          logger.error("[TS Adapter] Error al guardar en localStorage de navegador:", error);
          return false;
        }
      }

      logger.warn("[TS Adapter] localStorage.guardarBlob no disponible.");
      return false;
    },

    /**
     * Lee un Blob de texto persistente de TaleSpire.
     * NOTA: La API real de TaleSpire getBlob usa firma () sin parámetros.
     */
    leerBlob: async (_clave: string): Promise<string | null> => {
      if (window.TS?.localStorage?.global && typeof window.TS.localStorage.global.getBlob === "function") {
        try {
          // API real de TaleSpire: getBlob() — sin clave
          return await window.TS.localStorage.global.getBlob();
        } catch (error) {
          logger.error("[TS Adapter] Excepción en getBlob nativo:", error);
          return null;
        }
      }

      // Fallback a almacenamiento local del navegador (desarrollo local / entorno Web)
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          return window.localStorage.getItem(_clave);
        } catch (error) {
          logger.error("[TS Adapter] Error al leer de localStorage de navegador:", error);
          return null;
        }
      }

      logger.warn("[TS Adapter] localStorage.leerBlob no disponible.");
      return null;
    },

    /**
     * Elimina el blob de TaleSpire.
     */
    eliminarBlob: async (_clave: string): Promise<boolean> => {
      if (window.TS?.localStorage?.global) {
        const globalStorage = window.TS.localStorage.global;
        try {
          if (typeof globalStorage.deleteBlob === "function") {
            // API real de TaleSpire: deleteBlob() — sin clave
            await globalStorage.deleteBlob();
            return true;
          }
          // Si no existe deleteBlob, sobreescribir con cadena vacía
          await globalStorage.setBlob("{}");
          return true;
        } catch (error) {
          logger.error("[TS Adapter] Excepción en deleteBlob nativo:", error);
          return false;
        }
      }

      // Fallback a almacenamiento local del navegador (desarrollo local / entorno Web)
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.removeItem(_clave);
          return true;
        } catch (error) {
          logger.error("[TS Adapter] Error al eliminar de localStorage de navegador:", error);
          return false;
        }
      }

      logger.warn("[TS Adapter] localStorage.eliminarBlob no disponible.");
      return false;
    }
  };

  // ==========================================
  // --- PORTAPAPELES & SISTEMA (SYSTEM API) ---
  // ==========================================

  system = {
    clipboard: {
      /**
       * Escribe un string en el portapapeles del sistema del usuario.
       */
      setText: async (texto: string): Promise<boolean> => {
        if (window.TS?.system?.clipboard && typeof window.TS.system.clipboard.setText === "function") {
          try {
            await window.TS.system.clipboard.setText(texto);
            return true;
          } catch (e) {
            logger.error("[TS Adapter] Error escribiendo portapapeles nativo:", e);
          }
        }
        // Legacy copyText fallback
        if (window.TS?.clipboard && typeof window.TS.clipboard.copyText === "function") {
          try {
            await window.TS.clipboard.copyText(texto);
            return true;
          } catch (e) {
            logger.debug("[TS Adapter] Falló fallback legacy copyText:", e);
          }
        }
        // Nav web clipboard fallback
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            await navigator.clipboard.writeText(texto);
            return true;
          }
          return false;
        } catch (e) {
          logger.warn("[TS Adapter] Fallback navigator.clipboard falló o carece de permisos de foco:", e);
          return false;
        }
      }
    }
  };

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

  // ==========================================
  // --- SINCRONIZACIÓN (SYNC API) ---
  // ==========================================

  sync = {
    /**
     * Envía un mensaje string en tiempo real a través del canal backend de TaleSpire.
     * @param message Cadena serializada (máximo 500-1000 caracteres).
     * @param target Destino: "board" (todos), "gms" (Dungeon Masters), o clientId específico.
     */
    send: async (message: string, target = "board"): Promise<boolean> => {
      let enviado = false;
      const ts = this.tsGlobal;
      if (ts?.sync && typeof ts.sync.send === "function") {
        try {
          if (message.length > 1000) {
            logger.error(`[TS Adapter] Mensaje excede el límite máximo de TaleSpire (1000 caracteres, longitud: ${message.length}).`);
            return false;
          }
          if (message.length > 500) {
            logger.warn(`[TS Adapter] Mensaje sync grande (${message.length} caracteres), enviando con precaución.`);
          }
          await ts.sync.send(message, target);
          enviado = true;
        } catch (error) {
          logger.error("[TS Adapter] Error en sync.send nativo:", error);
        }
      }

      // Replicar en BroadcastChannel persistente para entornos locales o pruebas en navegador
      try {
        const canal = this.getBroadcastChannelSync();
        if (canal) {
          canal.postMessage({ str: message, target });
          enviado = true;
        }
      } catch (e) {
        logger.debug("[TS Adapter] Fallback BroadcastChannel no disponible:", e);
      }

      return enviado;
    },

    /**
     * Envía un mensaje a una lista de clientes específicos (máximo 20).
     */
    multiSend: async (message: string, targets: string[]): Promise<boolean> => {
      const ts = this.tsGlobal;
      if (ts?.sync && typeof ts.sync.multiSend === "function") {
        try {
          await ts.sync.multiSend(message, targets);
          return true;
        } catch (error) {
          logger.error("[TS Adapter] Error en sync.multiSend nativo:", error);
          return false;
        }
      }
      return false;
    },

    /**
     * Retorna el listado de clientes actualmente conectados al canal de sync.
     */
    getClientsConnected: async (): Promise<FragmentoCliente[]> => {
      const ts = this.tsGlobal;
      if (ts?.sync && typeof ts.sync.getClientsConnected === "function") {
        try {
          return await ts.sync.getClientsConnected();
        } catch (error) {
          logger.error("[TS Adapter] Error en sync.getClientsConnected nativo:", error);
        }
      }
      return [];
    },

    /**
     * Permite suscribirse directamente al evento nativo TS.sync.onSyncMessage si existe en el entorno.
     */
    suscribirAMensajesSync: (
      callback: (payload: { str: string; fromClient?: FragmentoCliente }) => void
    ): { desuscribir: () => void } => {
      const ts = this.tsGlobal;
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
  };

  // ==========================================
  // --- DEPURACIÓN (DEBUG API) ---
  // ==========================================

  debug = {
    /**
     * Registra un mensaje en los logs de depuración nativos de TaleSpire.
     */
    log: (mensaje: string): void => {
      if (window.TS?.debug && typeof window.TS.debug.log === "function") {
        window.TS.debug.log(mensaje);
      } else {
        logger.debug(`[TS Debug] ${mensaje}`);
      }
    }
  };

  // ==========================================
  // --- HELPERS INTERNOS ---
  // ==========================================

  /**
   * Suma manualmente los valores resultantes de dados de un grupo si evaluate nativa falla.
   */
  private obtenerTotalGrupoFallback(grupo: GrupoResultadosTirada | unknown): number {
    if (!grupo || typeof grupo !== "object") return 0;
    const g = grupo as { result?: unknown };
    const resultObj = g.result as { total?: unknown } | undefined;
    if (resultObj && typeof resultObj.total === "number") {
      return resultObj.total;
    }

    interface NodoResultado {
      value?: number;
      results?: Array<number | { value?: unknown }>;
      operator?: string;
      operands?: NodoResultado[];
    }

    const evaluarNodo = (nodo: unknown): number => {
      if (!nodo || typeof nodo !== "object") return 0;
      const n = nodo as NodoResultado;
      if (typeof n.value === "number") return n.value;
      if (Array.isArray(n.results)) {
        return n.results.reduce((sum: number, r) => {
          if (typeof r === "number") return sum + r;
          if (r && typeof r === "object") {
            return sum + (Number(r.value) || 0);
          }
          return sum;
        }, 0);
      }
      if (n.operator === "+" && Array.isArray(n.operands)) {
        return n.operands.reduce((sum: number, op) => sum + evaluarNodo(op), 0);
      }
      if (n.operator === "-" && Array.isArray(n.operands)) {
        if (n.operands.length === 0) return 0;
        const primerOp = evaluarNodo(n.operands[0]);
        const restOp = n.operands.slice(1).reduce((sum: number, op) => sum + evaluarNodo(op), 0);
        return primerOp - restOp;
      }
      return 0;
    };

    return evaluarNodo(g.result);
  }
}

export const ts = new TaleSpireAdapter();
export default ts;
