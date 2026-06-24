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
 * Programado 100% en español.
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
} from "../tipos/talespire.d.ts";

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
          console.error("[TS Adapter] Error en makeRollDescriptors nativo:", error);
        }
      }
      console.error("[TS Adapter] dice.makeRollDescriptors no disponible. Retornando vacío.");
      return [];
    },

    /**
     * Lanza los dados físicamente en la mesa 3D.
     */
    putDiceInTray: async (descriptors: DescriptorTirada[], silenceDefaultChatCard = false): Promise<string> => {
      if (window.TS?.dice && typeof window.TS.dice.putDiceInTray === "function") {
        return await window.TS.dice.putDiceInTray(descriptors, silenceDefaultChatCard);
      }
      console.error("[TS Adapter] dice.putDiceInTray no disponible.");
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
          console.error("[TS Adapter] Error evaluando grupo con API nativa:", e);
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
        console.warn("[TS Adapter] dice.sendDiceResult no disponible.");
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
      console.warn("[TS Adapter] chat.send no disponible.");
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
      console.warn("[TS Adapter] chat.multiSend no disponible.");
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
     */
    esGM: async (): Promise<boolean> => {
      if (window.TS?.clients && typeof window.TS.clients.whoAmI === "function") {
        try {
          const yo = await window.TS.clients.whoAmI();
          if (yo.id && typeof window.TS.clients.getMoreInfo === "function") {
            const info = await window.TS.clients.getMoreInfo([yo.id]);
            if (info && info[0]) {
              return info[0].clientMode === "gm";
            }
          }
        } catch (e) {
          console.error("[TS Adapter] Error al comprobar rol GM oficial:", e);
        }
      }
      return false;
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
          console.error("[TS Adapter] Error obteniendo ID de jugador:", e);
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
          console.error("[TS Adapter] Excepción en setBlob nativo:", error);
          return false;
        }
      }
      console.warn("[TS Adapter] localStorage.guardarBlob no disponible.");
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
          console.error("[TS Adapter] Excepción en getBlob nativo:", error);
          return null;
        }
      }
      console.warn("[TS Adapter] localStorage.leerBlob no disponible.");
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
          console.error("[TS Adapter] Excepción en deleteBlob nativo:", error);
          return false;
        }
      }
      console.warn("[TS Adapter] localStorage.eliminarBlob no disponible.");
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
            console.error("[TS Adapter] Error escribiendo portapapeles nativo:", e);
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
          console.warn("[TS Adapter] Fallback navigator.clipboard falló o carece de permisos de foco:", e);
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
        console.log(`[TS Debug] ${mensaje}`);
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
