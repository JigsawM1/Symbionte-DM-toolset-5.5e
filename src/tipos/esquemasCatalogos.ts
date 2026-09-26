import { z } from "zod";
import {
  EsquemaCaracteristica,
  EsquemaTipoLanzador,
  EsquemaModeloConjuros
} from "./personaje";
import { EsquemaHabilidad } from "./index";
import {
  EsquemaTipoAccionRasgo,
  EsquemaEfectoMecanicoRasgo,
  EsquemaSelectorRasgo,
  EsquemaTablaEscaladoRasgo,
  EsquemaEscaladoFormulaDados,
  EsquemaEscaladoUsos,
  EsquemaEscaladoRecuperacion,
  EsquemaRecursoGastado,
  EsquemaRecuperacionRasgo
} from "./rasgos";
import { EsquemaConjuroInnatoEspecie } from "./especies";

// =======================================================
// ESQUEMAS ZOD PARA RASGOS EN CATÁLOGOS JSON
// =======================================================

export const EsquemaPlantillaRasgoClaseJSON = z.object({
  nivel: z.number().int().min(1).max(20),
  nombre: z.string().min(1),
  descripcion: z.string(),
  tipoAccion: EsquemaTipoAccionRasgo,
  subclase: z.string().optional(),
  tieneUsosLimitados: z.boolean().optional(),
  formulaUsos: z.string().nullable().optional(),
  recuperacion: z.enum(["descanso_corto", "descanso_largo", "manual", "ninguno"]).optional(),
  formulaDados: z.string().optional(),

  // Escalados genéricos declarativos
  escaladoFormulaDados: EsquemaEscaladoFormulaDados.optional(),
  escaladoUsos: EsquemaEscaladoUsos.optional(),
  escaladoRecuperacion: EsquemaEscaladoRecuperacion.optional(),
  sincronizarEfectosConFormula: z.boolean().optional(),

  // Mecánicas estructuradas
  esActivable: z.boolean().optional(),
  autoDesactivar: z.boolean().optional(),
  ligadoA: z.string().optional(),
  gastarDePadre: z.boolean().optional(),
  heredarDadosPadre: z.boolean().optional(),
  condicionAlActivar: z.string().optional(),
  duracionEfectoAlActivar: z.number().int().optional(),
  conjurosOtorgados: z.array(z.string()).optional(),
  restaurarUsosAlActivar: z.object({
    idRasgoObjetivo: z.string(),
    cantidad: z.union([z.literal("maximo"), z.number().int().min(1)])
  }).optional(),
  categoriaMecanica: z.enum([
    "consumible",
    "activable",
    "selector_informativo",
    "pasivo_permanente",
    "extension",
    "curacion"
  ]).optional(),
  formulaEscalado: z.string().optional(),
  efectos: z.array(EsquemaEfectoMecanicoRasgo).optional(),
  selectores: z.array(EsquemaSelectorRasgo).optional(),
  tablaProgresion: EsquemaTablaEscaladoRasgo.optional()
});

export const EsquemaPlantillaRasgoEspecieJSON = z.object({
  nombre: z.string().min(1),
  descripcion: z.string(),
  subespecie: z.string().optional(),
  tipoAccion: EsquemaTipoAccionRasgo,
  nivelRequerido: z.number().int().min(1).max(20).optional(),
  tieneUsosLimitados: z.boolean().optional(),
  usosMaximos: z.number().int().optional(),
  formulaUsos: z.string().nullable().optional(),
  recuperacion: z.enum(["descanso_corto", "descanso_largo", "manual", "ninguno"]).optional(),
  formulaDados: z.string().optional(),

  // Escalados genéricos declarativos
  escaladoFormulaDados: EsquemaEscaladoFormulaDados.optional(),
  escaladoUsos: EsquemaEscaladoUsos.optional(),
  escaladoRecuperacion: EsquemaEscaladoRecuperacion.optional(),
  sincronizarEfectosConFormula: z.boolean().optional(),

  // Mecánicas estructuradas
  esActivable: z.boolean().optional(),
  autoDesactivar: z.boolean().optional(),
  ligadoA: z.string().optional(),
  gastarDePadre: z.boolean().optional(),
  heredarDadosPadre: z.boolean().optional(),
  condicionAlActivar: z.string().optional(),
  duracionEfectoAlActivar: z.number().int().optional(),
  conjurosOtorgados: z.array(z.string()).optional(),
  categoriaMecanica: z.enum([
    "consumible",
    "activable",
    "selector_informativo",
    "pasivo_permanente",
    "extension",
    "curacion"
  ]).optional(),
  formulaEscalado: z.string().optional(),
  efectos: z.array(EsquemaEfectoMecanicoRasgo).optional(),
  selectores: z.array(EsquemaSelectorRasgo).optional(),
  tablaProgresion: EsquemaTablaEscaladoRasgo.optional()
});

// =======================================================
// ESQUEMAS ZOD PARA CLASES Y SUBCLASES EN JSON
// =======================================================

export const EsquemaProgresionConjurosNivelJSON = z.object({
  nivelClase: z.number().int().min(1).max(20),
  conjuros: z.array(z.string()).optional(),
  trucos: z.array(z.string()).optional()
});

export const EsquemaConfiguracionMagicaClaseJSON = z.object({
  tipoLanzador: EsquemaTipoLanzador,
  habilidadConjuro: EsquemaCaracteristica,
  modeloConjuros: EsquemaModeloConjuros,
  nivelInicio: z.number().int().min(1).max(20)
});

export const EsquemaDefinicionSubclaseJSON = z.object({
  id: z.string().min(1),
  clasePadre: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string(),
  lema: z.string().optional(),
  nivelDesbloqueo: z.number().int().min(1).max(20),
  rasgos: z.array(EsquemaPlantillaRasgoClaseJSON),
  progresionConjuros: z.array(EsquemaProgresionConjurosNivelJSON).optional(),
  variantesConjuros: z.record(z.string(), z.array(EsquemaProgresionConjurosNivelJSON)).optional(),
  configuracionMagica: EsquemaConfiguracionMagicaClaseJSON.optional()
});

export const EsquemaDefinicionClaseJSON = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string(),
  dadoGolpe: z.enum(["d6", "d8", "d10", "d12"]),
  caracteristicasPrimarias: z.array(EsquemaCaracteristica),
  salvacionesCompetentes: z.array(EsquemaCaracteristica),
  competenciasArmaduras: z.array(z.string()),
  competenciasArmas: z.array(z.string()),
  competenciasHerramientas: z.array(z.string()).optional(),
  opcionesHabilidades: z.object({
    cantidad: z.number().int().min(1),
    opciones: z.array(EsquemaHabilidad)
  }),
  equipoInicial: z.object({
    descripcion: z.string(),
    opcionA: z.string(),
    opcionB: z.string()
  }),
  configuracionMagica: EsquemaConfiguracionMagicaClaseJSON.optional(),
  rasgos: z.array(EsquemaPlantillaRasgoClaseJSON),
  subclases: z.array(EsquemaDefinicionSubclaseJSON)
});

// =======================================================
// ESQUEMAS ZOD PARA ESPECIES Y SUBESPECIES EN JSON
// =======================================================

export const EsquemaModificadoresSubespecieJSON = z.object({
  velocidad: z.number().optional(),
  visionOscuridad: z.number().optional(),
  tamano: z.enum(["Pequeño", "Mediano", "Grande"]).optional()
});

export const EsquemaDefinicionSubespecieJSON = z.object({
  id: z.string().min(1),
  especiePadre: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string(),
  rasgos: z.array(EsquemaPlantillaRasgoEspecieJSON),
  modificadores: EsquemaModificadoresSubespecieJSON.optional(),
  conjurosInnatos: z.array(EsquemaConjuroInnatoEspecie).optional(),
  resistenciasDanio: z.array(z.string()).optional()
});

export const EsquemaDefinicionEspecieJSON = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string(),
  tipoCriatura: z.string(),
  tamanoOpciones: z.array(z.enum(["Pequeño", "Mediano", "Grande"])),
  tamanoPorDefecto: z.enum(["Pequeño", "Mediano", "Grande"]),
  velocidadBase: z.number().int().min(0),
  visionOscuridad: z.number().int().min(0),
  rasgos: z.array(EsquemaPlantillaRasgoEspecieJSON),
  subespecies: z.array(EsquemaDefinicionSubespecieJSON).optional(),
  conjurosInnatos: z.array(EsquemaConjuroInnatoEspecie).optional(),
  resistenciasDanio: z.array(z.string()).optional()
});

// =======================================================
// ESQUEMAS ZOD PARA INVOCACIONES SOBRENATURALES EN JSON
// =======================================================

export const EsquemaInvocacionSobrenaturalJSON = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string(),
  nivelMinimo: z.number().int().min(1).max(20),
  requisitoPrevio: z.string().optional(),
  requisitoInvocacion: z.string().optional(),
  tipoAccion: EsquemaTipoAccionRasgo,
  repetible: z.boolean(),
  categoriaMecanica: z.enum([
    "consumible",
    "activable",
    "selector_informativo",
    "pasivo_permanente",
    "extension",
    "curacion"
  ]).optional(),
  recursoGastado: EsquemaRecursoGastado.optional(),
  formulaDados: z.string().optional(),
  escaladoFormulaDados: EsquemaEscaladoFormulaDados.optional(),
  tieneUsosLimitados: z.boolean().optional(),
  usosMaximos: z.number().int().optional(),
  usosRestantes: z.number().int().optional(),
  recuperacion: EsquemaRecuperacionRasgo.optional(),
  efectos: z.array(EsquemaEfectoMecanicoRasgo).optional(),
  selectores: z.array(EsquemaSelectorRasgo).optional(),
  conjuroGratuito: z.string().optional(),
  recuperacionConjuro: z.enum(["ninguno", "descanso_largo", "ilimitado"]).optional()
});

export type InvocacionSobrenaturalJSON = z.infer<typeof EsquemaInvocacionSobrenaturalJSON>;

// =======================================================
// ESQUEMAS ZOD PARA CONDICIONES Y EFECTOS EN JSON
// =======================================================

export const EsquemaCondicionJSON = z.object({
  nombre: z.string().min(1),
  descripcion: z.string(),
  efectos: z.array(z.string()).min(1)
});

export type CondicionJSON = z.infer<typeof EsquemaCondicionJSON>;

export const EsquemaEfectoJSON = z.object({
  nombre: z.string().min(1),
  descripcion: z.string(),
  duracionEstandar: z.number().int().min(0),
  esConcentracion: z.boolean().optional(),
  aliases: z.array(z.string()).optional(),
  efectos: z.array(z.string()).optional(),
  tituloVisual: z.string().optional()
});

export type EfectoJSON = z.infer<typeof EsquemaEfectoJSON>;

// =======================================================
// ESQUEMAS ZOD PARA MAESTRÍAS Y PROPIEDADES DE ARMAS EN JSON
// =======================================================

export const EsquemaMaestriaArmaJSON = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  etiquetaSelector: z.string().optional(),
  aliases: z.array(z.string()).min(1),
  descripcion: z.string().min(1),
  explicacionSelector: z.string().optional()
});

export type MaestriaArmaJSON = z.infer<typeof EsquemaMaestriaArmaJSON>;

export const EsquemaPropiedadArmaJSON = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  etiquetaSelector: z.string().optional(),
  aliases: z.array(z.string()).min(1),
  descripcion: z.string().min(1),
  explicacionSelector: z.string().optional()
});

export type PropiedadArmaJSON = z.infer<typeof EsquemaPropiedadArmaJSON>;
