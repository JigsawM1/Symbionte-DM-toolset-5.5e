import type { PersonajeJugador } from "@/tipos";
import type { InfoCriatura } from "@/tipos/talespire";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";

/**
 * Función pura que empareja una lista de personajes con una lista de criaturas asignadas al jugador en TaleSpire.
 *
 * Reglas de emparejamiento:
 * 1. Coincidencia por nombre (insensible a mayúsculas y espacios en blanco): personaje.nombre === criatura.name
 * 2. Si el jugador tiene exactamente 1 criatura asignada y 1 solo personaje, se emparejan por defecto (1-a-1).
 */
export function emparejarPersonajesConCriaturas(
  personajes: PersonajeJugador[],
  criaturas: InfoCriatura[]
): Map<string, InfoCriatura | null> {
  const mapa = new Map<string, InfoCriatura | null>();
  if (!personajes || personajes.length === 0) return mapa;
  if (!criaturas || criaturas.length === 0) {
    personajes.forEach((pj) => mapa.set(pj.id, null));
    return mapa;
  }

  const normalizar = (texto?: string) => (texto || "").trim().toLowerCase();
  const criaturasDisponibles = [...criaturas];

  // Paso 1: Coincidencia por nombre normalizado
  for (const pj of personajes) {
    const nombrePj = normalizar(pj.nombre);
    if (!nombrePj) continue;

    const indice = criaturasDisponibles.findIndex(
      (c) => normalizar(c.name) === nombrePj
    );

    if (indice !== -1) {
      mapa.set(pj.id, criaturasDisponibles[indice]);
      criaturasDisponibles.splice(indice, 1);
    }
  }

  // Paso 2: Si el jugador tiene 1 sola criatura y 1 solo personaje sin emparejar, enlace 1-a-1 por defecto
  for (const pj of personajes) {
    if (!mapa.has(pj.id)) {
      if (personajes.length === 1 && criaturas.length === 1) {
        mapa.set(pj.id, criaturas[0]);
      } else {
        mapa.set(pj.id, null);
      }
    }
  }

  return mapa;
}

/**
 * Consulta la API de TaleSpire para resolver automáticamente las miniaturas del jugador conectado
 * y actualizar de forma transparente el almacén de personajes.
 */
export async function autoResolverMiniaturasJugador(
  personajes: PersonajeJugador[],
  alVincular: (personajeId: string, idMiniatura: string | null) => void
): Promise<void> {
  try {
    if (!ts.estaDisponible || !personajes || personajes.length === 0) return;

    // 1. Obtener ID del jugador conectado
    let playerId = await ts.clients.obtenerPlayerId();
    if (!playerId) {
      const yoJugador = await ts.players.whoAmI();
      playerId = yoJugador?.id || null;
    }

    if (!playerId) {
      logger.debug("[AutoResolutorMinis] No se pudo determinar el playerId del cliente actual.");
      return;
    }

    // 2. Obtener las criaturas que pertenecen a este jugador
    const fragmentos = await ts.creatures.getCreaturesOwnedByPlayer(playerId);
    if (!fragmentos || fragmentos.length === 0) {
      logger.debug("[AutoResolutorMinis] El jugador no tiene criaturas asignadas en el tablero actual.");
      return;
    }

    const ids = fragmentos
      .map((f: { id?: string } | string) => (typeof f === "string" ? f : f.id || ""))
      .filter(Boolean);
    if (ids.length === 0) return;

    const infos = await ts.creatures.getMoreInfo(ids);
    if (!infos || infos.length === 0) return;

    // 4. Emparejar con los personajes del jugador
    const mapa = emparejarPersonajesConCriaturas(personajes, infos);

    mapa.forEach((criatura, pjId) => {
      const pjActual = personajes.find((p) => p.id === pjId);
      const nuevoIdMini = criatura?.id || null;
      if (pjActual && pjActual.idMiniaturaTS !== nuevoIdMini) {
        logger.info(
          `[AutoResolutorMinis] Miniatura auto-vinculada: '${pjActual.nombre}' ↔ '${criatura?.name || "Sin nombre"}' (ID: ${nuevoIdMini})`
        );
        alVincular(pjId, nuevoIdMini);
      }
    });
  } catch (err) {
    logger.error("[AutoResolutorMinis] Excepción al auto-resolver miniaturas de jugador:", err);
  }
}
