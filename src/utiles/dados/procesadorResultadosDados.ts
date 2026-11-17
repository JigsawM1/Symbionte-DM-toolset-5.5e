import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import { reclamarSolicitudPendiente, reclamarTiradaActiva } from "./registroTiradasActivas";
import { resolverTiradaEspecialVentajaDesventaja } from "./resolutorVentajaDesventaja";
import type {
  MetadataEfectoTirada,
  PayloadDadosNormalizado,
  PuertoEfectosTiradaEstado,
  SolicitudPendiente
} from "./tiposDados";

type ManejadorEfectoDirecto<K extends MetadataEfectoTirada["tipo"]> = (
  efecto: Extract<MetadataEfectoTirada, { tipo: K }>,
  total: number,
  puerto: PuertoEfectosTiradaEstado
) => void;

type MapaManejadoresEfecto = {
  [K in MetadataEfectoTirada["tipo"]]: ManejadorEfectoDirecto<K>;
};

/** Mapa de estrategias declarativo por discriminante de efecto de tirada. */
const MANEJADORES_EFECTO_DIRECTO: MapaManejadoresEfecto = {
  iniciativa: (efecto, total, puerto) => {
    logger.debug(`[Lanzador Dados] Iniciativa plana obtenida: ${total}`);
    puerto.aplicarResultadoIniciativa(efecto, total);
  },
  salvacionMuerte: (efecto, total, puerto) => {
    logger.debug(`[Lanzador Dados] Resultado 3D de Salvación de Muerte obtenido: ${total}`);
    puerto.aplicarResultadoSalvacionMuerte(efecto.personajeId, total);
  },
  curacionRasgo: (efecto, total, puerto) => {
    logger.debug(`[Lanzador Dados] Curación de rasgo 3D obtenida: +${total} PV`);
    puerto.aplicarCuracionDirectaRasgo(efecto.personajeId, total);
  },
  hpTemporalRasgo: (efecto, total, puerto) => {
    const mult = efecto.multiplicador ?? 1;
    const hpTemp = total * mult;
    logger.debug(`[Lanzador Dados] HP temporal de rasgo 3D obtenido: +${hpTemp} PV temp (${total} x ${mult})`);
    puerto.aplicarResultadoHpTemporal(efecto.personajeId, hpTemp);
  },
  dadoGolpe: (efecto, total, puerto) => {
    logger.debug(`[Lanzador Dados] Dado de golpe 3D obtenido: ${total}`);
    puerto.gastarDadoGolpeYNotificar(efecto.personajeId, total);
  }
};

function invocarEstrategiaEfecto<K extends MetadataEfectoTirada["tipo"]>(
  efecto: Extract<MetadataEfectoTirada, { tipo: K }>,
  total: number,
  puerto: PuertoEfectosTiradaEstado
): void {
  const manejador = MANEJADORES_EFECTO_DIRECTO[efecto.tipo] as ManejadorEfectoDirecto<K>;
  manejador(efecto, total, puerto);
}

/**
 * Extrae y normaliza de forma segura el `rollId` y `resultsGroups` de cualquier estructura
 * de evento de dados proporcionada por TaleSpire (objeto directo, wrapper con `payload`,
 * `detail` de `CustomEvent` o cadena JSON).
 */
export function extraerPayloadResultadosDados(evento: unknown): PayloadDadosNormalizado | null {
  if (!evento) return null;

  let datos: unknown = evento;
  if (typeof datos === "string") {
    try {
      datos = JSON.parse(datos);
    } catch (error) {
      logger.debug("[Lanzador Dados] Falló el parsing JSON de evento como string, descartando:", error);
      return null;
    }
  }

  if (typeof datos !== "object" || datos === null) return null;
  const obj = datos as Record<string, unknown>;

  if (obj.detail && typeof obj.detail === "object") {
    return extraerPayloadResultadosDados(obj.detail);
  }
  if (obj.payload && typeof obj.payload === "object") {
    return extraerPayloadResultadosDados(obj.payload);
  }

  const rollId = (obj.rollId || obj.roll_id || obj.id) as string | undefined;
  const resultsGroups = (obj.resultsGroups || obj.resultGroups || obj.results) as unknown[] | undefined;

  if (typeof rollId === "string" && Array.isArray(resultsGroups)) {
    return { rollId, resultsGroups };
  }
  return null;
}

async function resolverSolicitudPendiente(
  rollId: string,
  solicitud: SolicitudPendiente,
  resultsGroups: unknown[]
): Promise<boolean> {
  logger.debug(`[Lanzador Dados] Procesando solicitud estructurada para rollId: ${rollId}`);
  try {
    if (resultsGroups.length !== solicitud.gruposNombres.length) {
      throw new Error("Número de grupos de dados incompleto.");
    }

    const gruposResueltos = solicitud.gruposNombres.map((nombre) => {
      const coincidentes = resultsGroups.filter(
        (g) => g && typeof g === "object" && "name" in g && g.name === nombre
      );
      if (coincidentes.length !== 1) {
        throw new Error("No se identifica el grupo de dados solicitado.");
      }
      return coincidentes[0];
    });

    const totales = await Promise.all(
      gruposResueltos.map((grupo) => ts.dice.evaluateDiceResultsGroup(grupo))
    );
    if (totales.some((total) => !Number.isFinite(total))) {
      throw new Error("Resultado de dados inválido.");
    }
    if (solicitud.signal?.aborted) {
      throw new DOMException("Operación de tirada cancelada por el usuario.", "AbortError");
    }

    solicitud.resolve({ rollId, origen: "talespire", totales });
  } catch (err) {
    logger.error(`[Lanzador Dados] Error al evaluar grupos de dados para rollId ${rollId}:`, err);
    solicitud.reject(err instanceof Error ? err : new Error(String(err)));
  }
  return false;
}

async function procesarEfectoDirecto(
  rollId: string,
  efecto: MetadataEfectoTirada,
  resultsGroups: unknown[],
  puertoEfectos: PuertoEfectosTiradaEstado
): Promise<void> {
  logger.debug(`[Lanzador Dados] Procesando resultado 3D (${efecto.tipo}) para rollId: ${rollId}`);
  if (resultsGroups.length === 0) return;

  try {
    const total = await ts.dice.evaluateDiceResultsGroup(resultsGroups[0]);
    invocarEstrategiaEfecto(efecto, total, puertoEfectos);
  } catch (error) {
    logger.error(`[Lanzador Dados] Error al evaluar resultado 3D (${efecto.tipo}):`, error);
  }
}

/**
 * Intercepta y procesa los resultados de dados recibidos desde TaleSpire, despachando
 * solicitudes asíncronas, efectos directos por Strategy y tiradas especiales con ventaja/desventaja.
 */
export async function procesarResultadosConDependencias(
  evento: unknown,
  puertoEfectos: PuertoEfectosTiradaEstado
): Promise<boolean> {
  const payload = extraerPayloadResultadosDados(evento);
  if (!payload) {
    logger.debug("[Lanzador Dados] Evento de dados descartado (no contiene rollId o resultsGroups válidos):", evento);
    return false;
  }

  const { rollId, resultsGroups } = payload;

  const solicitudPendiente = reclamarSolicitudPendiente(rollId);
  if (solicitudPendiente) {
    return resolverSolicitudPendiente(rollId, solicitudPendiente, resultsGroups);
  }

  const entrada = reclamarTiradaActiva(rollId);
  if (!entrada) {
    return false;
  }

  const { especial, efecto } = entrada;
  if (
    efecto &&
    (efecto.tipo === "curacionRasgo" || efecto.tipo === "hpTemporalRasgo" || efecto.tipo === "dadoGolpe")
  ) {
    await procesarEfectoDirecto(rollId, efecto, resultsGroups, puertoEfectos);
    return false;
  }

  if (!especial && efecto) {
    await procesarEfectoDirecto(rollId, efecto, resultsGroups, puertoEfectos);
    return false;
  }

  if (especial) {
    return resolverTiradaEspecialVentajaDesventaja(rollId, especial, efecto, resultsGroups, puertoEfectos);
  }

  return false;
}
