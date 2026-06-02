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

import type { CampaignInfo } from "../tipos/talespire.d.ts";

class TaleSpireAdapter {
  private getQueuePromise: Promise<unknown> | null = null;

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
      // Validación básica por regex en desarrollo local
      return /^[0-9d+\-*/() :!]+$/i.test(rollStr);
    },

    /**
     * Convierte un string de tirada física en descriptores nativos 3D.
     */
    makeRollDescriptors: async (rollStr: string): Promise<unknown[]> => {
      if (window.TS?.dice && typeof window.TS.dice.makeRollDescriptors === "function") {
        try {
          return await window.TS.dice.makeRollDescriptors(rollStr);
        } catch (error) {
          console.error("[TS Adapter] Error en makeRollDescriptors nativo:", error);
        }
      }
      // Fallback local: parseador manual
      return this.crearDescriptoresManualmente(rollStr);
    },

    /**
     * Lanza los dados físicamente en la mesa 3D.
     */
    putDiceInTray: async (descriptors: unknown[], silenceDefaultChatCard = false): Promise<string> => {
      if (window.TS?.dice && typeof window.TS.dice.putDiceInTray === "function") {
        return await window.TS.dice.putDiceInTray(descriptors, silenceDefaultChatCard);
      }
      console.warn("[TS Adapter] dice.putDiceInTray no disponible. Simulación simulada.");
      return `mock_roll_${Date.now()}`;
    },

    /**
     * Evalúa el total numérico de un grupo de resultados de dados.
     */
    evaluateDiceResultsGroup: async (group: unknown): Promise<number> => {
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
    sendDiceResult: async (groups: unknown[], rollId: string): Promise<void> => {
      if (window.TS?.dice && typeof window.TS.dice.sendDiceResult === "function") {
        await window.TS.dice.sendDiceResult(groups, rollId);
      } else {
        console.log("[TS Adapter MOCK CHAT RESULT] rollId:", rollId, "groups:", groups);
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
        // La API v0.1 documenta send(message), pero versiones reales de TaleSpire
        // requieren un segundo parámetro "board" para que el mensaje aparezca en el chat.
        return await (window.TS.chat.send as (...args: unknown[]) => Promise<boolean>)(message, "board");
      }
      console.log(`%c[TS Adapter Chat] ${message}`, "color: #b4befe; font-style: italic;");
      return true;
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
          return await window.TS.chat.send(message);
        }
      }
      console.log(`%c[TS Adapter Chat MultiTo ${targets.join(",")}] ${message}`, "color: #b4befe;");
      return true;
    }
  };

  // ==========================================
  // --- ⚔️ INICIATIVA (INITIATIVE API) ---
  // ==========================================

  initiative = {
    /**
     * Obtiene la cola de iniciativa nativa. Deduplica llamadas concurrentes (debounce 100ms).
     */
    getQueue: async (): Promise<unknown> => {
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
    suscribirAEvento: (callback: () => void): { desuscribir: () => void } => {
      if (window.TS?.initiative?.onInitiativeEvent && typeof window.TS.initiative.onInitiativeEvent.subscribe === "function") {
        const sub = window.TS.initiative.onInitiativeEvent.subscribe(() => {
          callback();
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
    getSelectedCreatures: async (): Promise<unknown[]> => {
      if (window.TS?.creatures && typeof window.TS.creatures.getSelectedCreatures === "function") {
        return await window.TS.creatures.getSelectedCreatures();
      }
      return [];
    },

    /**
     * Suscribe un callback para cambios en la selección física de miniaturas.
     */
    suscribirASeleccion: (callback: (datos: unknown[]) => void): { desuscribir: () => void } => {
      if (window.TS?.creatures?.onCreatureSelectionChange && typeof window.TS.creatures.onCreatureSelectionChange.subscribe === "function") {
        const sub = window.TS.creatures.onCreatureSelectionChange.subscribe((datos) => {
          callback(datos);
        });
        return { desuscribir: () => sub.desuscribir() };
      }
      return { desuscribir: () => {} };
    }
  };

  // ==========================================
  // --- 🛡️ CAMPAÑA (CAMPAIGNS API) ---
  // ==========================================

  campaigns = {
    /**
     * Obtiene detalles extendidos de la campaña actual (id, nombre, etc).
     */
    getMoreInfoAboutCurrentCampaign: async (): Promise<CampaignInfo | null> => {
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
          const yo = (await window.TS.clients.whoAmI()) as Record<string, unknown> | null;
          return yo?.isGm === true || yo?.playerRole === "gm";
        } catch (e) {
          console.error("[TS Adapter] Error al comprobar rol GM:", e);
        }
      }
      // Valor por defecto en navegador local es true para desarrollo cómodo
      return true;
    },

    /**
     * Obtiene la ID de jugador única del usuario conectado.
     */
    obtenerPlayerId: async (): Promise<string | null> => {
      if (window.TS?.clients && typeof window.TS.clients.whoAmI === "function") {
        try {
          const yo = (await window.TS.clients.whoAmI()) as Record<string, unknown> | null;
          return (yo?.playerId as string) || null;
        } catch (e) {
          console.error("[TS Adapter] Error obteniendo ID de jugador:", e);
        }
      }
      return "local_player";
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
    guardarBlob: async (clave: string, datos: string): Promise<boolean> => {
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
      // Fallback localstorage navegador
      try {
        window.localStorage.setItem(clave, datos);
        return true;
      } catch (e) {
        console.error("[TS Adapter] Fallback setItem falló:", e);
        return false;
      }
    },

    /**
     * Lee un Blob de texto persistente de TaleSpire.
     * NOTA: La API real de TaleSpire getBlob usa firma () sin parámetros.
     */
    leerBlob: async (clave: string): Promise<unknown> => {
      if (window.TS?.localStorage?.global && typeof window.TS.localStorage.global.getBlob === "function") {
        try {
          // API real de TaleSpire: getBlob() — sin clave
          return await window.TS.localStorage.global.getBlob();
        } catch (error) {
          console.error("[TS Adapter] Excepción en getBlob nativo:", error);
          return null;
        }
      }
      // Fallback localstorage
      try {
        return window.localStorage.getItem(clave);
      } catch (e) {
        console.error("[TS Adapter] Fallback getItem falló:", e);
        return null;
      }
    },

    /**
     * Elimina el blob de TaleSpire.
     */
    eliminarBlob: async (clave: string): Promise<boolean> => {
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
      // Fallback localstorage
      try {
        window.localStorage.removeItem(clave);
        return true;
      } catch (e) {
        return false;
      }
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
        console.log(`[TaleSpire Debug MOCK] ${mensaje}`);
      }
    }
  };

  // ==========================================
  // --- HELPERS INTERNOS ---
  // ==========================================

  /**
   * Crea descriptores de dados manualmente a partir de una fórmula de texto.
   */
  private crearDescriptoresManualmente(formula: string): unknown[] {
    if (!formula) return [{ name: "Tirada", roll: "1d20" }];
    const formulaLimpia = formula.replace(/!/g, "");
    const partes = formulaLimpia.split("/");
    
    if (partes.length === 1) {
      if (!formulaLimpia.includes(":")) {
        return [{ name: "Tirada", roll: formulaLimpia }];
      }
      const regexGrupo = /([^:+]+):([0-9d+\-*/()]+)/g;
      const desc: unknown[] = [];
      let match;
      while ((match = regexGrupo.exec(formulaLimpia)) !== null) {
        desc.push({
          name: match[1].trim(),
          roll: match[2].trim()
        });
      }
      if (desc.length > 0) return desc;
      return [{ name: "Tirada", roll: formulaLimpia }];
    }
    
    return partes.map((p) => {
      const match = p.trim().match(/^([^:]+):(.*)$/);
      if (match) {
        return {
          name: match[1].trim(),
          roll: match[2].trim()
        };
      }
      return {
        name: "Tirada",
        roll: p.trim()
      };
    });
  }

  /**
   * Suma manualmente los valores resultantes de dados de un grupo si evaluate nativa falla.
   */
  private obtenerTotalGrupoFallback(grupo: unknown): number {
    if (!grupo || typeof grupo !== "object") return 0;
    const grupoObj = grupo as Record<string, unknown>;
    if (!grupoObj.result || typeof grupoObj.result !== "object") return 0;
    const resultObj = grupoObj.result as Record<string, unknown>;
    if (typeof resultObj.total === "number") {
      return resultObj.total;
    }
    
    const evaluarNodo = (nodo: unknown): number => {
      if (!nodo || typeof nodo !== "object") return 0;
      const nodoObj = nodo as Record<string, unknown>;
      if (typeof nodoObj.value === "number") return nodoObj.value;
      if (Array.isArray(nodoObj.results)) {
        return nodoObj.results.reduce((sum: number, r) => {
          if (typeof r === "number") return sum + r;
          if (r && typeof r === "object") {
            return sum + (Number((r as Record<string, unknown>).value) || 0);
          }
          return sum;
        }, 0);
      }
      if (nodoObj.operator === "+" && Array.isArray(nodoObj.operands)) {
        return nodoObj.operands.reduce((sum: number, op) => sum + evaluarNodo(op), 0);
      }
      if (nodoObj.operator === "-" && Array.isArray(nodoObj.operands)) {
        if (nodoObj.operands.length === 0) return 0;
        const primerOp = evaluarNodo(nodoObj.operands[0]);
        const restOp = nodoObj.operands.slice(1).reduce((sum: number, op) => sum + evaluarNodo(op), 0);
        return primerOp - restOp;
      }
      return 0;
    };
    
    return evaluarNodo(grupoObj.result);
  }
}

export const ts = new TaleSpireAdapter();
export default ts;
