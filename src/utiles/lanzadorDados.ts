/**
 * Fachada pública retrocompatible del Lanzador de Dados para TaleSpire (`window.TS.dice`).
 * Orquesta los submódulos puros en `@/utiles/dados/` con el adaptador de estado DM
 * en `@/servicios/tiradas/efectosEstadoTiradas`.
 */

import { efectosEstadoTiradasDM } from "@/servicios/tiradas/efectosEstadoTiradas";
import {
  ejecutarLanzamientoTaleSpire,
  lanzarDadosPorChatTaleSpire as enviarTiradaPorChat,
  solicitarResultadoTiradaConDependencias
} from "./dados/emisorTiradasTaleSpire";
import { procesarResultadosConDependencias } from "./dados/procesadorResultadosDados";
import type {
  MetadataDadoGolpe,
  MetadataEspecialRasgo,
  MetadataIniciativa,
  MetadataSalvacionMuerte,
  ModoTiradaD20,
  OpcionesSolicitudTirada,
  ResultadoSolicitudTirada
} from "./dados/tiposDados";

export type {
  EntradaTiradaActiva,
  GrupoTiradaSolicitud,
  MetadataCuracionRasgo,
  MetadataDadoGolpe,
  MetadataEfectoTirada,
  MetadataEspecialRasgo,
  MetadataHpTemporalRasgo,
  MetadataIniciativa,
  MetadataSalvacionMuerte,
  MetadataTiradaEspecial,
  ModoTiradaD20,
  OpcionesSolicitudTirada,
  PayloadDadosNormalizado,
  PuertoEfectosTiradaEstado,
  ResultadoPreparacionFormula,
  ResultadoSolicitudTirada
} from "./dados/tiposDados";

export {
  contieneExpresionDados,
  crearDescriptoresManualmente,
  detectarTipoDaño,
  limpiarYNormalizarDadosSimples,
  normalizarFormulaDados,
  sanitizarEtiqueta
} from "./dados/normalizadorFormulasDados";

export {
  limpiarRegistrosTiradas,
  limpiarTiradasExpiradas
} from "./dados/registroTiradasActivas";

export { extraerPayloadResultadosDados } from "./dados/procesadorResultadosDados";

export {
  aplicarResultadoHpTemporalEnEstado,
  aplicarResultadoIniciativaEnEstado,
  aplicarResultadoSalvacionMuerteEnEstado
} from "@/servicios/tiradas/efectosEstadoTiradas";

/**
 * Envía una tirada de dados física a la bandeja en 3D a través de un comando de chat de TaleSpire.
 */
export async function lanzarDadosPorChatTaleSpire(formula: string): Promise<void> {
  return enviarTiradaPorChat(formula);
}

/**
 * Envía una tirada de dados 3D física a la bandeja de TaleSpire o simula localmente en desarrollo.
 */
export async function lanzarDadosTaleSpire(
  formula: string,
  etiqueta: string,
  metaIniciativa?: MetadataIniciativa,
  metaSalvacionMuerte?: MetadataSalvacionMuerte,
  tipoTiradaForzado?: ModoTiradaD20,
  metaEspecialRasgo?: MetadataEspecialRasgo,
  metaDadoGolpe?: MetadataDadoGolpe
): Promise<boolean> {
  return ejecutarLanzamientoTaleSpire(
    efectosEstadoTiradasDM,
    formula,
    etiqueta,
    metaIniciativa,
    metaSalvacionMuerte,
    tipoTiradaForzado,
    metaEspecialRasgo,
    metaDadoGolpe
  );
}

/**
 * Solicita una tirada de dados estructurada con grupos nombrados independientes (ej. 2x d100).
 */
export async function solicitarResultadoTirada(
  opciones: OpcionesSolicitudTirada
): Promise<ResultadoSolicitudTirada> {
  return solicitarResultadoTiradaConDependencias(opciones);
}

/**
 * Intercepta y procesa los resultados de dados recibidos desde TaleSpire.
 */
export async function procesarResultadosDadosTaleSpire(evento: unknown): Promise<boolean> {
  return procesarResultadosConDependencias(evento, efectosEstadoTiradasDM);
}
