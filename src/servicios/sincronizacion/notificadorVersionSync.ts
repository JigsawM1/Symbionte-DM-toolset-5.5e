/**
 * @module notificadorVersionSync
 * Gestión inteligente y desduplicada de avisos de incompatibilidad de versión de sincronización.
 * Evita la saturación (bombardeo) de la interfaz de usuario mediante una ventana de enfriamiento
 * y dirige los avisos únicamente a los roles pertinentes (DM o usuario local desactualizado).
 */

import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { VERSION_PROTOCOLO_SYNC } from "@/tipos/sync";
import type { FragmentoCliente } from "@/tipos/talespire";
import { logger } from "@/utiles/logger";

const notificacionesVersionEmitidas = new Map<string, number>();
export const COOLDOWN_NOTIFICACION_VERSION_MS = 60_000;

/**
 * Evalúa si un mensaje de red recibido contiene una versión de protocolo incompatible
 * y emite una notificación controlada si corresponde.
 *
 * Reglas de entrega:
 * 1. Si la versión remota es mayor a la local (v > 2): el cliente local está desactualizado.
 *    Se le notifica al usuario local para que actualice su Simbionte.
 * 2. Si la versión remota es menor a la local (v < 2): el remitente remoto está desactualizado.
 *    - Si el usuario local es un jugador (no DM), se silencia el aviso (no le compete ni puede resolverlo).
 *    - Si el usuario local es el DM, se le notifica con el nombre del jugador para que pueda instruirle a actualizar.
 * 3. En todos los casos se aplica una ventana de enfriamiento (cooldown) por clave de alerta para evitar ráfagas.
 */
export function gestionarNotificacionVersionIncompatible(
  datos: unknown,
  fromClient?: FragmentoCliente
): void {
  if (typeof datos !== "object" || datos === null || !("v" in datos)) return;

  const versionRemota = (datos as { v?: unknown }).v;
  if (typeof versionRemota !== "number" || versionRemota === VERSION_PROTOCOLO_SYNC) return;

  const ahora = Date.now();
  if (notificacionesVersionEmitidas.size > 100) {
    for (const [clave, tsEmitido] of notificacionesVersionEmitidas) {
      if (ahora - tsEmitido > COOLDOWN_NOTIFICACION_VERSION_MS) {
        notificacionesVersionEmitidas.delete(clave);
      }
    }
  }
  const esGM = usarAlmacenDM.getState().esGM;

  // Caso 1: El cliente local está desactualizado (un cliente remoto usa una versión superior)
  if (versionRemota > VERSION_PROTOCOLO_SYNC) {
    const claveLocal = `local_desactualizado_v${versionRemota}`;
    const ultimoAviso = notificacionesVersionEmitidas.get(claveLocal);
    if (!ultimoAviso || ahora - ultimoAviso > COOLDOWN_NOTIFICACION_VERSION_MS) {
      notificacionesVersionEmitidas.set(claveLocal, ahora);
      logger.warn(`[Sync] Versión remota superior detectada (v: ${versionRemota}). El cliente local requiere actualización.`);
      usarAlmacenDM.getState().agregarNotificacion(
        "Tu versión del Simbionte está desactualizada. Por favor actualiza a la última versión para poder sincronizar.",
        "advertencia"
      );
    }
    return;
  }

  // Caso 2: El cliente remoto está desactualizado (v < VERSION_PROTOCOLO_SYNC)
  // Únicamente el DM debe ser informado para coordinar la partida; a los demás jugadores no se les distrae.
  if (esGM) {
    const idRemitente = fromClient?.id ?? fromClient?.player?.id ?? "remitente_desconocido";
    const claveRemoto = `remoto_desactualizado_${idRemitente}`;
    const ultimoAviso = notificacionesVersionEmitidas.get(claveRemoto);
    if (!ultimoAviso || ahora - ultimoAviso > COOLDOWN_NOTIFICACION_VERSION_MS) {
      notificacionesVersionEmitidas.set(claveRemoto, ahora);
      const nombreJugador = fromClient?.player?.name;
      const mensajeAviso = nombreJugador
        ? `El jugador "${nombreJugador}" tiene una versión desactualizada del Simbionte y no puede sincronizar.`
        : "Un participante tiene una versión desactualizada del Simbionte y no puede sincronizar.";

      logger.warn(`[Sync] Remitente desactualizado detectado (${idRemitente}, v: ${versionRemota}). Notificando al DM.`);
      usarAlmacenDM.getState().agregarNotificacion(mensajeAviso, "advertencia");
    }
  }
}

/**
 * Limpia el registro de enfriamientos de notificaciones (usado en desconexiones y pruebas unitarias).
 */
export function reiniciarNotificadorVersion(): void {
  notificacionesVersionEmitidas.clear();
}
