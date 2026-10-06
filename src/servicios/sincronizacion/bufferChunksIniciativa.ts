/**
 * @module bufferChunksIniciativa
 * Buffer de reensamblado seguro de fragmentos de iniciativa particionados (TS.sync).
 * Aísla las ráfagas por `sid` (ID de sesión/transmisión) para evitar corrupción por chunks entrelazados.
 */

import type { WireChunkIniciativa } from "@/tipos/sync";
import { logger } from "@/utiles/logger";

const TIEMPO_EXPIRACION_SESION_MS = 3500;

export class BufferChunksIniciativa {
  private sesionActivaId: number | null = null;
  private chunks = new Map<number, WireChunkIniciativa>();
  private timerExpiracion: ReturnType<typeof setTimeout> | null = null;

  /**
   * Procesa un fragmento entrante.
   * Si el fragmento pertenece a una sesión más nueva, descarta la sesión previa incompleta.
   * Si pertenece a una sesión obsoleta, lo descarta para prevenir corrupción.
   * @returns Array ordenado de chunks si la ráfaga está completa; de lo contrario null.
   */
  public registrarChunk(chunk: WireChunkIniciativa): WireChunkIniciativa[] | null {
    const sid = chunk.sid ?? 0;

    // Si no hay sesión activa o el sid es más reciente, inicializamos nueva sesión
    if (this.sesionActivaId === null || sid > this.sesionActivaId) {
      if (this.chunks.size > 0 && this.sesionActivaId !== null) {
        logger.warn(
          `[Buffer Chunks] Descartando sesión incompleta sid=${this.sesionActivaId} (${this.chunks.size} chunks) por nueva sesión sid=${sid}`
        );
      }
      this.limpiar();
      this.sesionActivaId = sid;
    } else if (sid < this.sesionActivaId) {
      // Chunk de una ráfaga anterior que llegó demorado: descartar para evitar mezcla
      logger.debug(
        `[Buffer Chunks] Descartando chunk rezagado de sesión anterior sid=${sid} (activa=${this.sesionActivaId})`
      );
      return null;
    }

    this.chunks.set(chunk.chunk, chunk);

    // Reiniciar temporizador de expiración defensivo
    if (this.timerExpiracion) {
      clearTimeout(this.timerExpiracion);
    }
    this.timerExpiracion = setTimeout(() => {
      logger.warn(
        `[Buffer Chunks] Sesión sid=${this.sesionActivaId} expiró por timeout sin completar todos los chunks.`
      );
      this.limpiar();
    }, TIEMPO_EXPIRACION_SESION_MS);

    // Comprobar si se han recibido todos los fragmentos declarados
    if (this.chunks.size >= chunk.total) {
      const chunksOrdenados = Array.from(this.chunks.values()).sort(
        (a, b) => a.chunk - b.chunk
      );
      this.limpiar();
      return chunksOrdenados;
    }

    return null;
  }

  /**
   * Limpia el acumulador interno y cancela el temporizador de expiración.
   */
  public limpiar(): void {
    this.chunks.clear();
    this.sesionActivaId = null;
    if (this.timerExpiracion) {
      clearTimeout(this.timerExpiracion);
      this.timerExpiracion = null;
    }
  }

  /**
   * Retorna el identificador de sesión actualmente en procesamiento o null.
   */
  public obtenerSesionActiva(): number | null {
    return this.sesionActivaId;
  }
}
