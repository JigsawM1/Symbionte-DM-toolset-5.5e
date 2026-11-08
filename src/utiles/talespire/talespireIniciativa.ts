/**
 * talespireIniciativa.ts
 * ----------------------
 * Adaptador para interactuar con la cola de iniciativa nativa de TaleSpire.
 */

import type { ColaIniciativaTS } from "@/tipos/talespire";
import { obtenerTSGlobal } from "./comun";

export class TaleSpireInitiativeAdapter {
  private getQueuePromise: Promise<ColaIniciativaTS> | null = null;
  invalidarLectura(): void { this.getQueuePromise = null; }

  /**
   * Obtiene la cola de iniciativa nativa. Deduplica llamadas concurrentes.
   */
  async getQueue(): Promise<ColaIniciativaTS | null> {
    if (this.getQueuePromise) {
      return this.getQueuePromise;
    }

    const ts = obtenerTSGlobal();
    if (ts?.initiative && typeof ts.initiative.getQueue === "function") {
      const solicitud = ts.initiative.getQueue();
      this.getQueuePromise = solicitud;

      try {
        return await solicitud;
      } finally {
        // Garantizar la limpieza de la promesa de caché únicamente al finalizar la misma
        if (this.getQueuePromise === solicitud) this.getQueuePromise = null;
      }
    }
    return null;
  }
}
