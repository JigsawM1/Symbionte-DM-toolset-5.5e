import { z } from "zod";
import { EsquemaCaracteristica, EsquemaTipoLanzador, EsquemaModeloConjuros } from "./capacidadesBase";

/** Capacidades opcionales compartidas por plantillas, fichas y constructor. */
export const EsquemaMecanicasRasgo = z.object({
  // Recursos de pacto: ejecución atómica al usar o recargar un rasgo.
  recuperarPactoAlUsar: z.enum(["mitad_maximo", "maximo"]).optional(),
  recargarUsoConPacto: z.boolean().optional(),
  curacionDirigida: z.object({ maxDados: z.string(), alcance: z.number().positive() }).optional(),
  idSelectorOrigen: z.string().optional(),
  hpTemporalAlDescansar: z.boolean().optional(),
  hpTemporalAlUsarRasgo: z.string().optional(),
  claseConjurosOtorgados: z.string().optional(),
  vinculoArma: z.object({
    idInstancia: z.string().optional(),
    caracteristica: EsquemaCaracteristica,
    selectorTipoDano: z.string().optional(),
    soloCuerpoACuerpoOMagica: z.boolean().optional()
  }).optional(),
  autoDesactivarAlTirarSalvacion: z.boolean().optional(),
  desactivarConCondiciones: z.array(z.string()).optional(),
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
