import type { DescriptorTirada } from "@/tipos/talespire";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import {
  contieneExpresionDados,
  crearDescriptoresManualmente,
  normalizarFormulaDados,
  sanitizarEtiqueta
} from "./normalizadorFormulasDados";
import {
  extraerValorNumericoDirecto,
  prepararFormulaSegunModoTirada,
  resolverModoTiradaEfectivo
} from "./preparadorModoTirada";
import {
  abortarSolicitudPendiente,
  contarDadosGolpeEnVuelo,
  limpiarTiradasExpiradas,
  registrarSolicitudPendiente,
  registrarTiradaActiva
} from "./registroTiradasActivas";
import {
  ejecutarEfectosFallbackLocal,
  ejecutarTiradaFallbackLocal,
  resolverSolicitudLocal
} from "./simuladorTiradasLocal";
import type {
  MetadataDadoGolpe,
  MetadataEfectoTirada,
  MetadataEspecialRasgo,
  MetadataIniciativa,
  MetadataSalvacionMuerte,
  ModoTiradaD20,
  OpcionesSolicitudTirada,
  PuertoEfectosTiradaEstado,
  ResultadoSolicitudTirada
} from "./tiposDados";

async function generarDescriptoresSeguro(formulaLimpia: string): Promise<DescriptorTirada[]> {
  let descriptores = await ts.dice.makeRollDescriptors(formulaLimpia);
  if (!descriptores || descriptores.length === 0) {
    logger.warn(
      `[Lanzador Dados] makeRollDescriptors devolvió vacío para "${formulaLimpia}". Generando descriptores manualmente.`
    );
    descriptores = crearDescriptoresManualmente(formulaLimpia);
  }
  if (!descriptores || descriptores.length === 0) {
    throw new Error(`No se pudieron generar descriptores de dados para "${formulaLimpia}".`);
  }
  return descriptores;
}

/**
 * Envía una tirada de dados física a la bandeja en 3D a través de un comando de chat
 * de TaleSpire. Es sumamente estable, nativa de fábrica y funciona en cualquier versión.
 */
export async function lanzarDadosPorChatTaleSpire(formula: string): Promise<void> {
  if (!ts.estaDisponible) {
    throw new Error("La API de chat de TaleSpire tampoco está disponible.");
  }
  const formulaLimpia = formula.replace(/!/g, "");
  const comandoChat = `!${formulaLimpia}`;
  logger.debug(`[Lanzador Dados (Chat)] Enviando comando de tirada física al chat: "${comandoChat}"`);
  if (!(await ts.chat.send(comandoChat))) {
    throw new Error("TaleSpire no confirmó el envío de la tirada por chat.");
  }
}

/**
 * Solicita una tirada de dados estructurada con grupos nombrados independientes (ej. 2x d100).
 * Devuelve una promesa con el origen (`"talespire"` o `"local"`) y los totales por grupo.
 */
export async function solicitarResultadoTiradaConDependencias(
  opciones: OpcionesSolicitudTirada
): Promise<ResultadoSolicitudTirada> {
  const { etiqueta, grupos, signal, azarLocal } = opciones;

  if (signal?.aborted) {
    throw new DOMException("Operación de tirada cancelada por el usuario.", "AbortError");
  }

  if (!ts.estaDisponible) {
    return resolverSolicitudLocal(etiqueta, grupos, azarLocal);
  }

  const formulaCompuesta = grupos
    .map((g) => `${g.nombre.replace(/[:/]/g, " ").trim()}:${g.formula.trim()}`)
    .join("/");
  const formulaLimpia = normalizarFormulaDados(formulaCompuesta);

  logger.debug(`[Lanzador Dados] Solicitando tirada física a TaleSpire: "${etiqueta}" -> "${formulaLimpia}"`);
  const descriptores = await generarDescriptoresSeguro(formulaLimpia);
  const rollId = await ts.dice.putDiceInTray(descriptores, !opciones.mostrarResultadoEnChat);

  if (signal?.aborted) {
    throw new DOMException("Operación de tirada cancelada por el usuario.", "AbortError");
  }
  if (!rollId) {
    throw new Error("TaleSpire no confirmó el rollId para la tirada.");
  }

  limpiarTiradasExpiradas();

  return new Promise<ResultadoSolicitudTirada>((resolve, reject) => {
    const onAbort = signal ? () => abortarSolicitudPendiente(rollId) : undefined;
    if (signal && onAbort) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    registrarSolicitudPendiente(rollId, {
      resolve,
      reject,
      gruposNombres: grupos.map((g) => sanitizarEtiqueta(g.nombre.replace(/[:/]/g, " ").trim())),
      creadoEn: Date.now(),
      signal,
      onAbort
    });
  });
}

function aplicarEfectoDirectoSinDados(
  formula: string,
  metaEspecialRasgo: MetadataEspecialRasgo | undefined,
  puertoEfectos: PuertoEfectosTiradaEstado
): boolean {
  if (metaEspecialRasgo) {
    const valorNum = extraerValorNumericoDirecto(formula);
    if (valorNum > 0) {
      const etiquetaNotif = metaEspecialRasgo.nombreRasgo ?? "Rasgo";
      if (metaEspecialRasgo.tipo === "curacionRasgo") {
        puertoEfectos.aplicarCuracionDirectaRasgo(
          metaEspecialRasgo.personajeId,
          valorNum,
          etiquetaNotif
        );
        logger.info(`[Lanzador Dados] Curación directa de rasgo aplicada: +${valorNum} PV.`);
      } else {
        puertoEfectos.aplicarResultadoHpTemporal(
          metaEspecialRasgo.personajeId,
          valorNum,
          etiquetaNotif
        );
        logger.info(`[Lanzador Dados] HP temporal directo aplicado: +${valorNum} PV temp.`);
      }
    }
  }
  logger.debug(`[Lanzador Dados] Fórmula no contiene dados ("${formula}"). Omitiendo tirada física y chat.`);
  return true;
}

/**
 * Envía una tirada de dados 3D física a la bandeja de TaleSpire con soporte para ventaja/desventaja,
 * registro en memoria para efectos diferidos y degradación controlada a chat y simulación local.
 */
export async function ejecutarLanzamientoTaleSpire(
  puertoEfectos: PuertoEfectosTiradaEstado,
  formula: string,
  etiqueta: string,
  metaIniciativa?: MetadataIniciativa,
  metaSalvacionMuerte?: MetadataSalvacionMuerte,
  tipoTiradaForzado?: ModoTiradaD20,
  metaEspecialRasgo?: MetadataEspecialRasgo,
  metaDadoGolpe?: MetadataDadoGolpe
): Promise<boolean> {
  if (!contieneExpresionDados(formula)) {
    return aplicarEfectoDirectoSinDados(formula, metaEspecialRasgo, puertoEfectos);
  }

  if (metaDadoGolpe) {
    const enVuelo = contarDadosGolpeEnVuelo(metaDadoGolpe.personajeId);
    if (!puertoEfectos.puedeGastarDadoGolpe(metaDadoGolpe.personajeId, enVuelo)) {
      logger.warn(
        `[Lanzador Dados] Tirada de Dado de Golpe bloqueada: sin dados disponibles (${enVuelo} en vuelo).`
      );
      return false;
    }
  }

  const tipoTiradaGlobal = puertoEfectos.obtenerModoTiradaGlobal();
  const tipoTirada = resolverModoTiradaEfectivo(tipoTiradaGlobal, tipoTiradaForzado);
  if (tipoTiradaGlobal !== "plano") {
    puertoEfectos.restablecerModoTiradaGlobal();
  }

  const { formulaProcesada, formulaLimpia, nombreEtiqueta, tiradaEspecial } =
    prepararFormulaSegunModoTirada(formula, etiqueta, tipoTirada);

  logger.debug(
    `[Lanzador Dados] Preparando tirada: "${nombreEtiqueta}" con fórmula: "${formulaLimpia}" (Tipo original: ${tipoTirada})`
  );

  if (!ts.estaDisponible) {
    logger.warn("[Lanzador Dados] API de TaleSpire no disponible. Ejecutando tirada matemática de desarrollo.");
    ejecutarTiradaFallbackLocal(formulaLimpia, nombreEtiqueta);
    ejecutarEfectosFallbackLocal(
      {
        formula,
        formulaLimpia,
        tipoTirada,
        metaIniciativa,
        metaSalvacionMuerte,
        metaEspecialRasgo,
        metaDadoGolpe
      },
      puertoEfectos
    );
    return true;
  }

  try {
    if (!ts.dice.isValidRollString(formulaLimpia)) {
      logger.warn(
        `[Lanzador Dados] La fórmula "${formulaLimpia}" no es válida según TaleSpire. Intentando de todos modos...`
      );
    }

    logger.debug(`[Lanzador Dados] Generando descriptores de tirada para "${formulaLimpia}"`);
    const descriptores = await generarDescriptoresSeguro(formulaLimpia);

    logger.debug("[Lanzador Dados] Enviando dados a la bandeja 3D. Descriptores:", descriptores);
    const rollId = await ts.dice.putDiceInTray(descriptores, tiradaEspecial !== null);
    if (!rollId) throw new Error("TaleSpire no confirmó el envío de la tirada.");

    limpiarTiradasExpiradas();
    const efecto: MetadataEfectoTirada | undefined =
      metaIniciativa ?? metaSalvacionMuerte ?? metaEspecialRasgo ?? metaDadoGolpe;

    if (tiradaEspecial || efecto) {
      registrarTiradaActiva(rollId, {
        especial: tiradaEspecial ?? undefined,
        efecto
      });
    }

    ts.debug.log(`Tirando dados en bandeja física: ${nombreEtiqueta} (${formulaLimpia})`);
    return true;
  } catch (error) {
    logger.error(
      "[Lanzador Dados] Fallo de API directa de dados. Recurriendo al canal de chat de TaleSpire...",
      error
    );
    try {
      await lanzarDadosPorChatTaleSpire(formulaProcesada);
      return true;
    } catch (errChat) {
      logger.error("[Lanzador Dados] Falló también el canal de chat. Ejecutando fallback local matemático...", errChat);
      ejecutarTiradaFallbackLocal(formulaLimpia, nombreEtiqueta);
      return false;
    }
  }
}
