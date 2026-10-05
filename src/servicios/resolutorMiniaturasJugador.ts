import type { PersonajeJugador, PosicionTS } from "@/tipos";
import type { InfoCriatura } from "@/tipos/talespire";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import { esNombreVacioODot, coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";

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

  // Paso 0: Prioridad máxima - Si el personaje ya tiene idMiniaturaTS asignado y persiste en el tablero,
  // se empareja directamente sin pasar por heurísticas de nombres.
  for (const pj of personajes) {
    if (!pj.idMiniaturaTS) continue;
    const miniIdNormalizado = normalizar(pj.idMiniaturaTS);
    const indice = criaturasDisponibles.findIndex(
      (c) => normalizar(c.id) === miniIdNormalizado
    );
    if (indice !== -1) {
      mapa.set(pj.id, criaturasDisponibles[indice]);
      criaturasDisponibles.splice(indice, 1);
    }
  }

  // Paso 1: Coincidencia por nombre normalizado para personajes restantes
  for (const pj of personajes) {
    if (mapa.has(pj.id)) continue;
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

  // Paso 2: Si el jugador tiene en total 1 sola criatura y 1 solo personaje, enlace 1-a-1 por defecto
  const pjsSinEmparejar = personajes.filter((pj) => !mapa.has(pj.id));
  for (const pj of pjsSinEmparejar) {
    if (personajes.length === 1 && criaturas.length === 1 && criaturasDisponibles.length === 1) {
      mapa.set(pj.id, criaturasDisponibles[0]);
    } else {
      mapa.set(pj.id, null);
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
  alVincular: (
    personajeId: string,
    idMiniatura: string | null,
    posicionInicial?: PosicionTS,
    boardIdInicial?: string | null
  ) => void,
  alVincularAcompanante?: (
    personajeId: string,
    idAcompanante: string,
    idMiniatura: string | null,
    posicionInicial?: PosicionTS,
    boardIdInicial?: string | null
  ) => void
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

    // 3. Emparejar con los personajes del jugador
    const mapa = emparejarPersonajesConCriaturas(personajes, infos);

    mapa.forEach((criatura, pjId) => {
      const pjActual = personajes.find((p) => p.id === pjId);
      const nuevoIdMini = criatura?.id || null;
      if (pjActual) {
        // Solo actualizar si encontramos una criatura física en TaleSpire.
        // Si no encontramos criatura pero el personaje ya tenía idMiniaturaTS guardado,
        // no destruimos su vinculación persistente para permitir que se recuerde entre tableros.
        if (nuevoIdMini && pjActual.idMiniaturaTS !== nuevoIdMini) {
          logger.info(
            `[AutoResolutorMinis] Miniatura auto-vinculada: '${pjActual.nombre}' ↔ '${criatura?.name || "Sin nombre"}' (ID: ${nuevoIdMini})`
          );
          alVincular(pjId, nuevoIdMini, criatura?.position, criatura?.boardId);
        } else if (criatura?.position && !pjActual.ultimaPosicionTS) {
          logger.info(
            `[AutoResolutorMinis] Posición inicial registrada para '${pjActual.nombre}':`,
            criatura.position
          );
          alVincular(pjId, nuevoIdMini, criatura.position, criatura.boardId);
        }
      }
    });

    // 4. Emparejar acompañantes de los personajes por nombre o nombre base con las criaturas del jugador
    if (alVincularAcompanante) {
      const idsMiniaturasAsignadasPJs = new Set<string>();
      mapa.forEach((criatura) => {
        if (criatura?.id) idsMiniaturasAsignadasPJs.add(criatura.id);
      });

      for (const pj of personajes) {
        if (!pj.acompanantes || pj.acompanantes.length === 0) continue;
        for (const acomp of pj.acompanantes) {
          let criaturaEncontrada: InfoCriatura | undefined;

          // Prioridad 0: Si el acompañante ya tiene idMiniaturaTS guardado, buscarlo directamente
          if (acomp.idMiniaturaTS) {
            const miniAcompIdNorm = acomp.idMiniaturaTS.toLowerCase();
            criaturaEncontrada = infos.find((c) => {
              if (!c.id || idsMiniaturasAsignadasPJs.has(c.id)) return false;
              return c.id.toLowerCase() === miniAcompIdNorm;
            });
          }

          // Prioridad 1: Coincidencia por nombre o nombre base
          if (!criaturaEncontrada) {
            const nombreAcomp = (acomp.nombre || "").trim();
            if (esNombreVacioODot(nombreAcomp) || nombreAcomp.length < 2) continue;

            criaturaEncontrada = infos.find((c) => {
              if (!c.id || idsMiniaturasAsignadasPJs.has(c.id)) return false;
              const nomC = (c.name || "").trim();
              if (esNombreVacioODot(nomC) || nomC.length < 2) return false;
              return coincidenNombresTaleSpire(nomC, nombreAcomp);
            });
          }

          if (criaturaEncontrada) {
            idsMiniaturasAsignadasPJs.add(criaturaEncontrada.id);
            const nuevoId = criaturaEncontrada.id || null;
            if (acomp.idMiniaturaTS !== nuevoId) {
              logger.info(
                `[AutoResolutorMinis] Acompañante auto-vinculado: '${acomp.nombre}' ↔ '${criaturaEncontrada.name || "Sin nombre"}' (ID: ${nuevoId})`
              );
              alVincularAcompanante(pj.id, acomp.id, nuevoId, criaturaEncontrada.position, criaturaEncontrada.boardId);
            } else if (criaturaEncontrada.position && !acomp.ultimaPosicionTS) {
              logger.info(
                `[AutoResolutorMinis] Posición inicial de acompañante registrada para '${acomp.nombre}':`,
                criaturaEncontrada.position
              );
              alVincularAcompanante(pj.id, acomp.id, nuevoId, criaturaEncontrada.position, criaturaEncontrada.boardId);
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error("[AutoResolutorMinis] Excepción al auto-resolver miniaturas de jugador:", err);
  }
}
