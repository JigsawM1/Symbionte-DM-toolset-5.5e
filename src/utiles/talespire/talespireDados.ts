/**
 * talespireDados.ts
 * -----------------
 * Adaptador para interactuar con el motor físico 3D de dados de TaleSpire.
 */

import type { DescriptorTirada, GrupoResultadosTirada } from "@/tipos/talespire";
import { logger } from "@/utiles/logger";
import { obtenerTSGlobal } from "./comun";

interface NodoResultado {
  value?: number;
  results?: Array<number | { value?: unknown }>;
  operator?: string;
  operands?: NodoResultado[];
}

/**
 * Suma manualmente los valores resultantes de dados de un grupo si evaluate nativa falla.
 */
function obtenerTotalGrupoFallback(grupo: GrupoResultadosTirada | unknown): number {
  if (!grupo || typeof grupo !== "object") return 0;
  const g = grupo as { result?: unknown };
  const resultObj = g.result as { total?: unknown } | undefined;
  if (resultObj && typeof resultObj.total === "number") {
    return resultObj.total;
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

export class TaleSpireDiceAdapter {
  /**
   * Valida si un string cumple con el formato estándar de dados de TaleSpire.
   */
  isValidRollString(rollStr: string): boolean {
    const ts = obtenerTSGlobal();
    if (ts?.dice && typeof ts.dice.isValidRollString === "function") {
      return ts.dice.isValidRollString(rollStr);
    }
    return false;
  }

  /**
   * Convierte un string de tirada física en descriptores nativos 3D.
   */
  async makeRollDescriptors(rollStr: string): Promise<DescriptorTirada[]> {
    const ts = obtenerTSGlobal();
    if (ts?.dice && typeof ts.dice.makeRollDescriptors === "function") {
      try {
        return await ts.dice.makeRollDescriptors(rollStr);
      } catch (error) {
        logger.error("[TS Adapter] Error en makeRollDescriptors nativo:", error);
      }
    }
    logger.error("[TS Adapter] dice.makeRollDescriptors no disponible. Retornando vacío.");
    return [];
  }

  /**
   * Lanza los dados físicamente en la mesa 3D.
   */
  async putDiceInTray(descriptors: DescriptorTirada[], silenceDefaultChatCard = false): Promise<string> {
    const ts = obtenerTSGlobal();
    if (ts?.dice && typeof ts.dice.putDiceInTray === "function") {
      return await ts.dice.putDiceInTray(descriptors, silenceDefaultChatCard);
    }
    logger.error("[TS Adapter] dice.putDiceInTray no disponible.");
    return "";
  }

  /**
   * Evalúa el total numérico de un grupo de resultados de dados.
   */
  async evaluateDiceResultsGroup(group: GrupoResultadosTirada | unknown): Promise<number> {
    const ts = obtenerTSGlobal();
    if (ts?.dice && typeof ts.dice.evaluateDiceResultsGroup === "function") {
      try {
        return await ts.dice.evaluateDiceResultsGroup(group);
      } catch (e) {
        logger.error("[TS Adapter] Error evaluando grupo con API nativa:", e);
      }
    }
    return obtenerTotalGrupoFallback(group);
  }

  /**
   * Envía de forma elegante un resultado filtrado al chat del juego.
   */
  async sendDiceResult(groups: GrupoResultadosTirada[] | unknown[], rollId?: string): Promise<void> {
    const ts = obtenerTSGlobal();
    if (ts?.dice && typeof ts.dice.sendDiceResult === "function") {
      await ts.dice.sendDiceResult(groups, rollId);
    } else {
      logger.warn("[TS Adapter] dice.sendDiceResult no disponible.");
      throw new Error("dice.sendDiceResult no disponible en TaleSpire");
    }
  }
}
