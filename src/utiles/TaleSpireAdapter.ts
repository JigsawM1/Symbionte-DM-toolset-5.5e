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
  InfoCriatura,
  EventoIniciativaActualizada
} from "@/tipos/talespire";
import { logger } from "@/utiles/logger";

let cacheEsGM: boolean | null = null;

export const establecerCacheEsGM = (esGm: boolean) => {
  cacheEsGM = esGm;
};

class TaleSpireAdapter {
  private getQueuePromise: Promise<ColaIniciativaTS> | null = null;

  /**
   * Indica si la API global de TaleSpire está activa e inicializada.
   */
  get estaDisponible(): boolean {
    return !!window.TS;
  }

  // ==========================================
  // --- 🎲 DADOS (DICE API) ---
  // ==========================================

  dice = {
    /**
     * Valida si un string cumple con el formato estándar de dados de TaleSpire.
     */
    isValidRollString: (rollStr: string): boolean => {
      if (window.TS?.dice && typeof window.TS.dice.isValidRollString === "function") {
        return window.TS.dice.isValidRollString(rollStr);
      }
      return false;
    },

    /**
     * Convierte un string de tirada física en descriptores nativos 3D.
     */
    makeRollDescriptors: async (rollStr: string): Promise<DescriptorTirada[]> => {
      if (window.TS?.dice && typeof window.TS.dice.makeRollDescriptors === "function") {
        try {
          return await window.TS.dice.makeRollDescriptors(rollStr);
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
      if (window.TS?.dice && typeof window.TS.dice.putDiceInTray === "function") {
        return await window.TS.dice.putDiceInTray(descriptors, silenceDefaultChatCard);
      }
      logger.error("[TS Adapter] dice.putDiceInTray no disponible.");
      return "";
    },

    /**
     * Evalúa el total numérico de un grupo de resultados de dados.
     */
    evaluateDiceResultsGroup: async (group: any): Promise<number> => {
      if (window.TS?.dice && typeof window.TS.dice.evaluateDiceResultsGroup === "function") {
        try {
          return await window.TS.dice.evaluateDiceResultsGroup(group);
        } catch (e) {
          logger.error("[TS Adapter] Error evaluando grupo con API nativa:", e);
        }
      }
      return this.obtenerTotalGrupoFallback(group);
    },

    /**
     * Envía de forma elegante un resultado filtrado al chat del juego.
     */
    sendDiceResult: async (groups: any[], rollId: string): Promise<void> => {
      if (window.TS?.dice && typeof window.TS.dice.sendDiceResult === "function") {
        await window.TS.dice.sendDiceResult(groups, rollId);
      } else {
        logger.warn("[TS Adapter] dice.sendDiceResult no disponible.");
      }
    }
  };

  // ==========================================
  // --- 💬 CHAT (CHAT API) ---
  // ==========================================

  chat = {
    /**
     * Envia un mensaje plano (o de dados) al chat de TaleSpire.
     */
    send: async (message: string): Promise<boolean> => {
      if (window.TS?.chat && typeof window.TS.chat.send === "function") {
        // La API v0.1 requiere un segundo parámetro "board" para representar visualmente el chat.
        return await window.TS.chat.send(message, "board");
      }
      logger.warn("[TS Adapter] chat.send no disponible.");
      return false;
    },

    /**
     * Envía un mensaje en el chat visible solo para destinatarios específicos.
     */
    multiSend: async (message: string, targets: string[]): Promise<boolean> => {
      if (window.TS?.chat) {
        if (typeof window.TS.chat.multiSend === "function") {
          return await window.TS.chat.multiSend(message, targets);
        } else if (typeof window.TS.chat.send === "function") {
          // Fallback a send plano si multiSend no existe
          return await window.TS.chat.send(message, "board");
        }
      }
      logger.warn("[TS Adapter] chat.multiSend no disponible.");
      return false;
    },

    /**
     * Envía un mensaje como una criatura específica.
     */
    sendAsCreature: async (creatureId: FragmentoOId, message: string): Promise<boolean> => {
      if (window.TS?.chat && typeof window.TS.chat.sendAsCreature === "function") {
        return await window.TS.chat.sendAsCreature(creatureId, message);
      }
      return false;
    },

    /**
     * Envía un mensaje como una criatura a destinatarios específicos.
     */
    multiSendAsCreature: async (creatureId: FragmentoOId, message: string, targets: string[]): Promise<boolean> => {
      if (window.TS?.chat && typeof window.TS.chat.multiSendAsCreature === "function") {
        return await window.TS.chat.multiSendAsCreature(creatureId, message, targets);
      }
      return false;
    }
  };

  // ==========================================
  // --- ⚔️ INICIATIVA (INITIATIVE API) ---
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
        } catch (error) {
          throw error;
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
        return { desuscribir: () => sub.desuscribir() };
      }
      return { desuscribir: () => {} };
    }
  };

  // ==========================================
  // --- 👤 CRIATURAS (CREATURES API) ---
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
        return { desuscribir: () => sub.desuscribir() };
      }
      return { desuscribir: () => {} };
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
  // --- 📦 CONTENT PACKS (ASSETS & THUMBNAILS API) ---
  // ==========================================

  contentPacks = {
    /**
     * Obtiene la lista de fragmentos de paquetes de contenido cargados en TaleSpire.
     */
    getContentPacks: async (): Promise<any[]> => {
      const cp = (window.TS as any)?.contentPacks;
      if (cp && typeof cp.getContentPacks === "function") {
        try {
          return await cp.getContentPacks();
        } catch (e) {
          logger.warn("[TS Adapter] Error al obtener getContentPacks:", e);
        }
      }
      return [];
    },

    /**
     * Obtiene metadatos e información extendida sobre los paquetes de contenido.
     */
    getMoreInfo: async (packs: any[]): Promise<any[]> => {
      const cp = (window.TS as any)?.contentPacks;
      if (cp && typeof cp.getMoreInfo === "function") {
        try {
          return await cp.getMoreInfo(packs);
        } catch (e) {
          logger.warn("[TS Adapter] Error al obtener getMoreInfo de contentPacks:", e);
        }
      }
      return [];
    },

    /**
     * Busca un objeto del tablero (miniatura/prop/tile) dentro de los paquetes de contenido.
     */
    findBoardObjectInPacks: async (boardObjectId: string, packsInfos: any[]): Promise<any | null> => {
      const cp = (window.TS as any)?.contentPacks;
      if (cp && typeof cp.findBoardObjectInPacks === "function") {
        try {
          return await cp.findBoardObjectInPacks(boardObjectId, packsInfos);
        } catch (e) {
          logger.warn("[TS Adapter] Error al buscar objeto en contentPacks:", e);
        }
      }
      return null;
    },

    /**
     * Crea un elemento DOM (canvas/img) con la miniatura renderizada del catálogo 3D de TaleSpire.
     */
    createThumbnailElementForBoardObject: async (boardObjectInfo: any, size = 64): Promise<HTMLElement | null> => {
      const cp = (window.TS as any)?.contentPacks;
      if (cp && typeof cp.createThumbnailElementForBoardObject === "function") {
        try {
          return await cp.createThumbnailElementForBoardObject(boardObjectInfo, size);
        } catch (e) {
          logger.warn("[TS Adapter] Error al crear thumbnail element de objeto:", e);
        }
      }
      return null;
    }
  };

  // ==========================================
  // --- 🛡️ CAMPAÑA (CAMPAIGNS API) ---
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
  // --- 🎮 CLIENTES (CLIENTS / PLAYERS API) ---
  // ==========================================

  clients = {
    /**
     * Comprueba si el usuario actual tiene rol de Dungeon Master (GM).
     * Consulta players.getMoreInfo ([playerInfo.rights]), clients.getMoreInfo o prueba permisos.
     * Utiliza un caché en memoria para evitar llamadas redundantes a la API de TaleSpire.
     */
    esGM: async (forzarRefresco = false): Promise<boolean> => {
      // 0. Si no existe window.TS (desarrollo local fuera de TaleSpire), por defecto es DM para pruebas
      if (!window.TS) return true;

      // Si ya tenemos el rol en caché y no pedimos refresco forzado, retornarlo de inmediato
      if (cacheEsGM !== null && !forzarRefresco) {
        return cacheEsGM;
      }

      logger.debug("[TS Adapter esGM] Evaluando modo de vista cliente en TaleSpire...");

      // 1. Consultar a través de window.TS.clients.whoAmI() y window.TS.clients.getMoreInfo()
      if (window.TS?.clients && typeof window.TS.clients.whoAmI === "function") {
        try {
          const yoCliente = await window.TS.clients.whoAmI() as any;
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
              const clientInfo = infoClientes[0] as any;
              if (clientInfo.clientMode) {
                logger.debug("[TS Adapter esGM] clientInfo.clientMode:", clientInfo.clientMode);
                const esGm = clientInfo.clientMode === "gm";
                cacheEsGM = esGm;
                return esGm;
              }
              const derechos = clientInfo.rights || clientInfo.playerRights || clientInfo.permissions;
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
          const yoJugador = await window.TS.players.whoAmI() as any;
          const playerId = typeof yoJugador === "string" ? yoJugador : yoJugador?.id;

          if (playerId && typeof window.TS.players.getMoreInfo === "function") {
            const infoJugadores = await window.TS.players.getMoreInfo([playerId]);
            if (infoJugadores && infoJugadores[0]) {
              const jugadorInfo = infoJugadores[0] as any;
              const derechos = jugadorInfo.rights || jugadorInfo.playerRights || jugadorInfo.permissions;
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

      // 3. Probar llamada con restricción de permisos de TaleSpire (boards.getBoardsInThisCampaign)
      if (window.TS?.boards && typeof window.TS.boards.getBoardsInThisCampaign === "function") {
        try {
          await window.TS.boards.getBoardsInThisCampaign();
          logger.debug("[TS Adapter esGM] Permiso de campaña otorgado -> esGM: true");
          cacheEsGM = true;
          return true;
        } catch (err: any) {
          logger.warn("[TS Adapter esGM] Permiso denegado en getBoardsInThisCampaign -> esGM: false", err);
          cacheEsGM = false;
          return false;
        }
      }

      // Fallback seguro dentro de TaleSpire: si no se confirmó rol GM, asume Jugador (false)
      logger.warn("[TS Adapter esGM] No se pudo confirmar modo GM en TaleSpire. Asumiendo rol Jugador (false).");
      cacheEsGM = false;
      return false;
    },

    /**
     * Escucha el evento 'clientModeChanged' de TaleSpire en tiempo real cuando un usuario cambia de rol (DM <-> Jugador).
     */
    suscribirACambioModoCliente: (callback: (modo: import("../tipos/talespire").ModoCliente) => void): { desuscribir: () => void } => {
      const listener = (evento: any) => {
        const modo = typeof evento === "string" ? evento : (evento?.clientMode || evento?.payload?.clientMode);
        if (modo === "gm" || modo === "player" || modo === "spectator") {
          cacheEsGM = modo === "gm";
          callback(modo);
        }
      };

      const onClientEvent = window.TS?.clients?.onClientEvent as any;
      if (onClientEvent) {
        if (typeof onClientEvent.subscribe === "function") {
          const sub = onClientEvent.subscribe(listener);
          return { desuscribir: () => sub?.desuscribir?.() };
        }
        if (typeof onClientEvent === "function") {
          const unsub = onClientEvent(listener);
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
          return yo.player?.id || (yo as unknown as { playerId?: string }).playerId || null;
        } catch (e) {
          logger.error("[TS Adapter] Error obteniendo ID de jugador:", e);
        }
      }
      return null;
    }
  };

  // ==========================================
  // --- 💾 ALMACENAMIENTO (LOCALSTORAGE API) ---
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
      logger.warn("[TS Adapter] localStorage.eliminarBlob no disponible.");
      return false;
    }
  };

  // ==========================================
  // --- 📋 PORTAPAPELES & SISTEMA (SYSTEM API) ---
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
          } catch (e) {}
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

  // ==========================================
  // --- 📡 DEPURACIÓN (DEBUG API) ---
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
  private obtenerTotalGrupoFallback(grupo: GrupoResultadosTirada): number {
    if (!grupo || typeof grupo !== "object") return 0;
    const resultObj = grupo.result as any;
    if (resultObj && typeof resultObj.total === "number") {
      return resultObj.total;
    }

    const evaluarNodo = (nodo: any): number => {
      if (!nodo || typeof nodo !== "object") return 0;
      if (typeof nodo.value === "number") return nodo.value;
      if (Array.isArray(nodo.results)) {
        return nodo.results.reduce((sum: number, r: any) => {
          if (typeof r === "number") return sum + r;
          if (r && typeof r === "object") {
            return sum + (Number(r.value) || 0);
          }
          return sum;
        }, 0);
      }
      if (nodo.operator === "+" && Array.isArray(nodo.operands)) {
        return nodo.operands.reduce((sum: number, op: any) => sum + evaluarNodo(op), 0);
      }
      if (nodo.operator === "-" && Array.isArray(nodo.operands)) {
        if (nodo.operands.length === 0) return 0;
        const primerOp = evaluarNodo(nodo.operands[0]);
        const restOp = nodo.operands.slice(1).reduce((sum: number, op: any) => sum + evaluarNodo(op), 0);
        return primerOp - restOp;
      }
      return 0;
    };

    return evaluarNodo(grupo.result);
  }
}

export const ts = new TaleSpireAdapter();
export default ts;
