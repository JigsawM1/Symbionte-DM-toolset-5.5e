import { z } from "zod";
import { EsquemaCaracteristica, EsquemaTipoLanzador, EsquemaModeloConjuros } from "./capacidadesBase";

/** Capacidades opcionales compartidas por plantillas, fichas y constructor. */
export const EsquemaMecanicasRasgo = z.object({
  // Recursos de pacto: ejecución atómica al usar o recargar un rasgo.
  recuperarPactoAlUsar: z.enum(["mitad_maximo", "maximo"]).optional(),
  recargarUsoConPacto: z.boolean().optional(),
  recargarUsoConPadre: z.boolean().optional(),
  ligadoA: z.string().optional(),
  idRasgoRecurso: z.string().optional(),
  requiereRasgosActivos: z.array(z.string()).optional(),
  activarConRasgo: z.string().optional(),
  recuperarUsosAlActivarRasgo: z.string().optional(),
  gastarUsoAlEmitirSalvacion: z.boolean().optional(),
  desactivarSinHp: z.boolean().optional(),
  gastarDePadre: z.boolean().optional(),
  heredarDadosPadre: z.boolean().optional(),
  autoDesactivar: z.boolean().optional(),
  autoDesactivarAlTirarDano: z.boolean().optional(),
  autoDesactivarEnTirada: z.array(z.string()).optional(),
  condicionAlActivar: z.string().optional(),
  duracionEfectoAlActivar: z.number().int().min(1).optional(),
  noGastarAlTirarDados: z.boolean().optional(),
  tiradaCuracionManual: z.object({ maxDados: z.string() }).optional(),
  tiradaCuracion: z.object({ maxDados: z.string(), destino: z.enum(["propio", "manual"]) }).optional(),
  idSelectorTipoDano: z.string().optional(),
  salvacionObjetivo: z.object({ caracteristica: EsquemaCaracteristica, aptitud: EsquemaCaracteristica }).optional(),
  conjurosRituales: z.array(z.string()).optional(),
  aptitudConjurosRituales: EsquemaCaracteristica.optional(),
  idSelectorOrigen: z.string().optional(),
  idRasgoSelectorOrigen: z.string().optional(),
  hpTemporalAlDescansar: z.boolean().optional(),
  hpTemporalAlUsarRasgo: z.string().optional(),
  hpTemporalAlActivarRasgo: z.string().optional(),
  claseConjurosOtorgados: z.string().optional(),
  vinculoArma: z.object({
    idInstancia: z.string().optional(),
    caracteristica: EsquemaCaracteristica,
    selectorTipoDano: z.string().optional(),
    soloCuerpoACuerpoOMagica: z.boolean().optional()
  }).optional(),
  autoDesactivarAlTirarSalvacion: z.boolean().optional(),
  desactivarConCondiciones: z.array(z.string()).optional(),
  desactivarConArmaduraPesada: z.boolean().optional(),
  eliminarCondicionesAlActivar: z.array(z.string()).optional(),
  aptitudConjuroGratuito: EsquemaCaracteristica.optional(),
  ignorarComponentesConjuro: z.boolean().optional(),
  configuracionMagica: z.object({
    tipoLanzador: EsquemaTipoLanzador,
    habilidadConjuro: EsquemaCaracteristica,
    modeloConjuros: EsquemaModeloConjuros,
    nivelInicio: z.number().int().min(1).max(20),
    listaConjuros: z.string().optional()
  }).optional()
});
export type MecanicasRasgo = z.infer<typeof EsquemaMecanicasRasgo>;

export function copiarMecanicasRasgo(origen: MecanicasRasgo): MecanicasRasgo {
  return EsquemaMecanicasRasgo.parse(origen);
}
