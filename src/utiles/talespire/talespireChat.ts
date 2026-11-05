/**
 * talespireChat.ts
 * ----------------
 * Adaptador para interactuar con el sistema de mensajería y chat de TaleSpire.
 */

import type { FragmentoOId } from "@/tipos/talespire";
import { logger } from "@/utiles/logger";
import { obtenerTSGlobal } from "./comun";

export class TaleSpireChatAdapter {
  /**
   * Envía un mensaje plano (o de dados) al chat de TaleSpire.
   */
  async send(message: string): Promise<boolean> {
    const ts = obtenerTSGlobal();
    if (ts?.chat && typeof ts.chat.send === "function") {
      // La API v0.1 requiere un segundo parámetro "board" para representar visualmente el chat.
      await ts.chat.send(message, "board");
      return true;
    }
    logger.warn("[TS Adapter] chat.send no disponible.");
    return false;
  }

  /**
   * Envía un mensaje en el chat visible solo para destinatarios específicos.
   */
  async multiSend(message: string, targets: string[]): Promise<boolean> {
    const ts = obtenerTSGlobal();
    if (ts?.chat) {
      if (typeof ts.chat.multiSend === "function") {
        await ts.chat.multiSend(message, targets);
        return true;
      } else if (typeof ts.chat.send === "function") {
        // Fallback a send plano si multiSend no existe
        await ts.chat.send(message, "board");
        return true;
      }
    }
    logger.warn("[TS Adapter] chat.multiSend no disponible.");
    return false;
  }

  /**
   * Envía un mensaje como una criatura específica.
   */
  async sendAsCreature(creatureId: FragmentoOId, message: string): Promise<boolean> {
    const ts = obtenerTSGlobal();
    if (ts?.chat && typeof ts.chat.sendAsCreature === "function") {
      await ts.chat.sendAsCreature(creatureId, message);
      return true;
    }
    return false;
  }

  /**
   * Envía un mensaje como una criatura a destinatarios específicos.
   */
  async multiSendAsCreature(creatureId: FragmentoOId, message: string, targets: string[]): Promise<boolean> {
    const ts = obtenerTSGlobal();
    if (ts?.chat && typeof ts.chat.multiSendAsCreature === "function") {
      await ts.chat.multiSendAsCreature(creatureId, message, targets);
      return true;
    }
    return false;
  }
}
