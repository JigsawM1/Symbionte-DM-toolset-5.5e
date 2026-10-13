import { z } from "zod";
import { EsquemaCaracteristica, EsquemaTipoLanzador, EsquemaModeloConjuros } from "./capacidadesBase";

/** Capacidades opcionales compartidas por plantillas, fichas y constructor. */
export const EsquemaMecanicasRasgo = z.object({
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
