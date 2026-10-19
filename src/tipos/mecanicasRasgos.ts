import { z } from "zod";
import { EsquemaCaracteristica, EsquemaTipoLanzador, EsquemaModeloConjuros } from "./capacidadesBase";

/** Capacidades opcionales compartidas por plantillas, fichas y constructor. */
export const EsquemaMecanicasRasgo = z.object({
  escaladoConjurosOtorgados: z.array(z.object({ nivelMinimo: z.number().int().min(1).max(20), conjuros: z.array(z.string().min(1)) })).optional(),
  costeRecargaPadre: z.number().int().positive().optional(),
  costeActivacionPorSelector: z.object({ idSelector: z.string().min(1), costePorOpcion: z.number().int().positive() }).optional(),
  lanzamientoConRecurso: z.object({ idRasgoConcesion: z.string().min(1), nivelMaximo: z.number().int().min(1).max(9) }).optional(),
  ignorarMaterialesConjuro: z.boolean().optional(),
  varianteSinConcentracion: z.boolean().optional(),
  reservaDados: z.object({ caras: z.number().int().min(2).max(100), maximo: z.number().int().positive(), costePorDado: z.number().int().positive() }).optional(),
  dadosReserva: z.number().int().nonnegative().optional(),
  usoGratuitoCondicionado: z.object({ idRasgoActivo: z.string().min(1), nivelMinimo: z.number().int().min(1).max(20) }).optional(),
  gastarUsoTrasTirada: z.boolean().optional(),
  tablaAleatoria: z.object({
    dado: z.number().int().min(2).max(100).default(100),
    filas: z.array(z.object({ id: z.string(), desde: z.number().int().positive(), hasta: z.number().int().positive(), texto: z.string(),
      subtiradas: z.array(z.object({ formula: z.string().regex(/^\d+d\d+$/), siResultado: z.number().int().optional() })).optional() })).optional(),
    idRasgoTabla: z.string().optional(), tiradas: z.number().int().min(1).max(2).default(1),
    modo: z.enum(["aleatoria", "elegir", "recargar"]).default("aleatoria"), excluirUltima: z.boolean().optional()
  }).superRefine((cfg, ctx) => {
    if (!cfg.filas) return; // Una extensión puede modificar únicamente el número de resultados.
    const cobertura = new Set<number>();
    for (const fila of cfg.filas) {
      if (fila.desde > fila.hasta || fila.hasta > cfg.dado) ctx.addIssue({ code: "custom", message: "Rango de fila fuera del dado." });
      for (let n = fila.desde; n <= Math.min(fila.hasta, cfg.dado); n++) {
        if (cobertura.has(n)) ctx.addIssue({ code: "custom", message: "Las filas de la tabla se solapan." });
        cobertura.add(n);
      }
    }
    if (!cfg.filas.length || (cfg.modo !== "elegir" && cobertura.size !== cfg.dado)) ctx.addIssue({ code: "custom", message: "La tabla debe cubrir todos los resultados del dado." });
  }).optional(),
  resultadoTabla: z.object({ texto: z.string(), enviado: z.boolean() }).optional(),
  recursoLegado: z.literal("puntos_hechiceria").optional(),
  finalizarAlDescansar: z.boolean().optional(),
  conversionEspacios: z.object({
    tabla: z.array(z.object({ nivelEspacio: z.number().int().min(1).max(9), coste: z.number().int().positive(), nivelMinimo: z.number().int().min(1).max(20) })).min(1),
    permiteConvertir: z.boolean().default(true)
  }).optional(),
  recuperacionOpcionalDescanso: z.object({ idRasgoObjetivo: z.string().min(1), formulaCantidad: z.string().min(1) }).optional(),
  recuperacionDescansoDisponible: z.boolean().optional(),
  activacionAlternativa: z.object({ idRasgoRecurso: z.string().min(1), coste: z.number().int().positive() }).optional(),
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

const cacheMecanicasValidas = new WeakMap<object, MecanicasRasgo>();

export function copiarMecanicasRasgo(origen: MecanicasRasgo): MecanicasRasgo {
  let base = cacheMecanicasValidas.get(origen);
  if (!base) {
    base = EsquemaMecanicasRasgo.parse(origen);
    cacheMecanicasValidas.set(origen, base);
  }
  return structuredClone(base);
}
