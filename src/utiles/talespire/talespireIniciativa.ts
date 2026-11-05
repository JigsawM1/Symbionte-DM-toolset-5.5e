/**
 * talespireIniciativa.ts
 * ----------------------
 * Adaptador para interactuar con la cola de iniciativa nativa de TaleSpire.
 */

import type { ColaIniciativaTS } from "@/tipos/talespire";
import { obtenerTSGlobal } from "./comun";

export class TaleSpireInitiativeAdapter {
  private getQueuePromise: Promise<ColaIniciativaTS> | null = null;

  /**
   * Obtiene la cola de iniciativa nativa. Deduplica llamadas concurrentes.
   */
  async getQueue(): Promise<ColaIniciativaTS | null> {
    if (this.getQueuePromise) {
      return this.getQueuePromise;
    }

    const ts = obtenerTSGlobal();
    if (ts?.initiative && typeof ts.initiative.getQueue === "function") {
      this.getQueuePromise = ts.initiative.getQueue();

      try {
        return await this.getQueuePromise;
      } finally {
        // Garantizar la limpieza de la promesa de caché únicamente al finalizar la misma
        this.getQueuePromise = null;
      }
    }
    return null;
  }
}
