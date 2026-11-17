import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import type {
  MetadataEfectoTirada,
  MetadataTiradaEspecial,
  PuertoEfectosTiradaEstado
} from "./tiposDados";

function obtenerNombreGrupo(grupo: unknown): string {
  if (!grupo || typeof grupo !== "object") return "";
  const candidato = (grupo as { name?: unknown }).name;
  return typeof candidato === "string" ? candidato.trim().toLowerCase() : "";
}

async function publicarResultadoEspecialEnChat(
  rollId: string,
  gruposParaChat: Array<{ name: string; result: unknown }>,
  infoTirada: MetadataTiradaEspecial,
  totalFinal: number,
  totalA: number,
  totalB: number
): Promise<void> {
  const esVentaja = infoTirada.tipo === "ventaja";
  const sufijoChat = esVentaja ? " (Ventaja)" : " (Desventaja)";

  try {
    try {
      await ts.dice.sendDiceResult(gruposParaChat, rollId);
      return;
    } catch (errRollId) {
      logger.warn("[Lanzador Dados] sendDiceResult con rollId falló, reintentando sin rollId:", errRollId);
      await ts.dice.sendDiceResult(gruposParaChat);
      return;
    }
  } catch (errSend) {
    logger.warn("[Lanzador Dados] sendDiceResult no disponible o falló:", errSend);
  }

  try {
    const etiquetaChat = infoTirada.etiquetaOriginal || infoTirada.nombreGrupoOriginal;
    const mensajeChat = `[Tirada] ${etiquetaChat}${etiquetaChat.includes("(") ? "" : sufijoChat}: ${totalFinal} (${esVentaja ? "Mayor" : "Menor"} de [${totalA}, ${totalB}])`;
    await ts.chat.send(mensajeChat);
  } catch (errChat) {
    logger.error("[Lanzador Dados] Error enviando mensaje a ts.chat:", errChat);
  }
}

/**
 * Resuelve una tirada 3D especial (ventaja o desventaja): localiza grupos en una pasada,
 * evalúa en paralelo los d20 y dados adicionales, publica la tarjeta filtrada en TaleSpire
 * y aplica efectos asociados de iniciativa o salvación contra la muerte.
 */
export async function resolverTiradaEspecialVentajaDesventaja(
  rollId: string,
  infoTirada: MetadataTiradaEspecial,
  efecto: MetadataEfectoTirada | undefined,
  resultsGroups: unknown[],
  puertoEfectos: PuertoEfectosTiradaEstado
): Promise<boolean> {
  logger.debug(`[Lanzador Dados] Interceptada tirada especial ${rollId} de tipo ${infoTirada.tipo}`);
  if (resultsGroups.length === 0) return false;

  try {
    const normA = infoTirada.grupoAName.trim().toLowerCase();
    const normB = infoTirada.grupoBName.trim().toLowerCase();
    const nombreBono = infoTirada.grupoBonificacionName;

    let grupoA: unknown;
    let grupoB: unknown;
    let grupoBonificacion: unknown;

    for (const g of resultsGroups) {
      const n = obtenerNombreGrupo(g);
      if (!grupoA && (n === normA || n.endsWith(" (1)") || n.includes("(a)") || n.includes(" 1)"))) {
        grupoA = g;
      } else if (
        !grupoB &&
        (n === normB || n.endsWith(" (2)") || n.includes("(b)") || n.includes(" 2)"))
      ) {
        grupoB = g;
      }
      if (!grupoBonificacion && nombreBono && (g as { name?: string }).name === nombreBono) {
        grupoBonificacion = g;
      }
    }

    if (!grupoA || !grupoB) {
      logger.warn("[Lanzador Dados] No se encontraron los grupos A o B. Enviando grupos al chat para no silenciar.");
      try {
        await ts.dice.sendDiceResult(resultsGroups, rollId);
      } catch (eEnvio) {
        logger.error("[Lanzador Dados] Error enviando fallback directo a sendDiceResult:", eEnvio);
        await ts.chat.send(`[${infoTirada.etiquetaOriginal}] Tirada completada.`);
      }
      return false;
    }

    const [totalA, totalB, totalBonificacion] = await Promise.all([
      ts.dice.evaluateDiceResultsGroup(grupoA),
      ts.dice.evaluateDiceResultsGroup(grupoB),
      grupoBonificacion ? ts.dice.evaluateDiceResultsGroup(grupoBonificacion) : Promise.resolve(0)
    ]);

    const esVentaja = infoTirada.tipo === "ventaja";
    const elegirA = esVentaja ? totalA >= totalB : totalA <= totalB;
    const grupoElegido = (elegirA ? grupoA : grupoB) as Record<string, unknown>;
    const totalElegido = elegirA ? totalA : totalB;
    const totalFinal = totalElegido + totalBonificacion;

    const sufijoChat = esVentaja ? " (Ventaja)" : " (Desventaja)";
    const gruposParaChat: Array<{ name: string; result: unknown }> = [
      { name: `${infoTirada.nombreGrupoOriginal}${sufijoChat}`, result: grupoElegido.result }
    ];

    for (const g of resultsGroups) {
      const gName = obtenerNombreGrupo(g);
      if (g !== grupoA && g !== grupoB && gName !== normA && gName !== normB) {
        const gObj = g as Record<string, unknown>;
        gruposParaChat.push({
          name: typeof gObj.name === "string" ? gObj.name : "Tirada",
          result: gObj.result
        });
      }
    }

    await publicarResultadoEspecialEnChat(rollId, gruposParaChat, infoTirada, totalFinal, totalA, totalB);

    if (efecto?.tipo === "iniciativa") {
      puertoEfectos.aplicarResultadoIniciativa(efecto, totalFinal);
    } else if (efecto?.tipo === "salvacionMuerte") {
      puertoEfectos.aplicarResultadoSalvacionMuerte(efecto.personajeId, totalElegido);
    }

    return true;
  } catch (error) {
    logger.error("[Lanzador Dados] Error al procesar tirada especial:", error);
    try {
      await ts.chat.send(`[${infoTirada.etiquetaOriginal}] Error al procesar ventaja/desventaja.`);
    } catch (chatError) {
      logger.debug("[Lanzador Dados] No se pudo enviar el mensaje de error por chat a TaleSpire:", chatError);
    }
    return false;
  }
}
