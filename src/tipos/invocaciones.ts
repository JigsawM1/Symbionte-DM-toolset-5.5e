/**
 * invocaciones.ts
 * ---------------
 * Esquemas Zod y tipos TypeScript estrictos para la gestión de invocaciones
 * escalables (D&D 5.5e / PHB 2024), donde las estadísticas (CA, PV, ataques,
 * daño, salvaciones) se recalculan dinámicamente según el nivel de conjuro
 * utilizado y los atributos del lanzador.
 */

import { z } from "zod";
import { EsquemaCaracteristicas, EsquemaVelocidad } from "./personaje";

/**
 * Fórmula para el cálculo dinámico de la Clase de Armadura (CA).
 */
export const EsquemaFormulaCAInvocacion = z.object({
  base: z.number().int().min(0),
  sumaNivelConjuro: z.boolean().default(true),
  bonificadorAdicional: z.number().int().default(0)
});
export type FormulaCAInvocacion = z.infer<typeof EsquemaFormulaCAInvocacion>;

/**
 * Fórmula para el cálculo dinámico de los Puntos de Golpe (Vida Máxima).
 */
export const EsquemaFormulaVidaInvocacion = z.object({
  base: z.number().int().min(1),
  porNivel: z.number().int().min(0),
  porNivelPorEncimaDelMinimo: z.boolean().default(true),
  dadoGolpeVisual: z.string().optional()
});
export type FormulaVidaInvocacion = z.infer<typeof EsquemaFormulaVidaInvocacion>;

/**
 * Representación de un ataque dinámico para la criatura invocada.
 */
export const EsquemaAtaqueInvocacion = z.object({
  nombre: z.string(),
  tipo: z.enum(["cuerpo_a_cuerpo", "a_distancia", "ambos"]),
  alcance: z.string().default("5 pies"),
  usaModificadorAtaqueConjuros: z.boolean().default(true),
  dadosDanoBase: z.string(),
  modificadorDanoFijo: z.number().int().default(0),
  sumaNivelAlDano: z.boolean().default(true),
  tipoDano: z.string(),
  tipoDanoPorSubtipo: z.record(z.string(), z.string()).optional(),
  descripcionExtra: z.string().optional()
});
export type AtaqueInvocacion = z.infer<typeof EsquemaAtaqueInvocacion>;

/**
 * Condición de velocidad especial que se activa a partir de un nivel de conjuro.
 */
export const EsquemaVelocidadEspecialInvocacion = z.object({
  nivelMinimo: z.number().int().min(1),
  velocidadTexto: z.string()
});
export type VelocidadEspecialInvocacion = z.infer<typeof EsquemaVelocidadEspecialInvocacion>;

/**
 * Rasgo o habilidad especial con texto dinámico o requisitos.
 */
export const EsquemaRasgoInvocacion = z.object({
  nombre: z.string(),
  subtipoRequerido: z.string().optional(),
  recarga: z.string().optional(),
  uso: z.string().optional(),
  descripcion: z.string()
});
export type RasgoInvocacion = z.infer<typeof EsquemaRasgoInvocacion>;

/**
 * Plantilla completa de una criatura de invocación declarativa y escalable.
 */
export const EsquemaPlantillaInvocacion = z.object({
  id: z.string(),
  nombre: z.string(),
  conjuroAsociado: z.string(),
  nivelMinimo: z.number().int().min(1).max(9),
  nivelMaximo: z.number().int().min(1).max(9).default(9),
  tipoCriatura: z.string(),
  tamano: z.string().default("Mediano"),
  alineacion: z.string().default("Neutral"),
  subtiposDisponibles: z.array(z.string()).default([]),
  velocidadBase: z.union([z.string(), EsquemaVelocidad]).default("30 pies"),
  velocidadesEspeciales: z.array(EsquemaVelocidadEspecialInvocacion).default([]),
  sentidos: z.string().default("Percepción pasiva 10"),
  idiomas: z.string().default("Entiende los idiomas que tú hablas"),
  caracteristicas: EsquemaCaracteristicas,
  formulaCA: EsquemaFormulaCAInvocacion,
  formulaVida: EsquemaFormulaVidaInvocacion,
  formulaAtaquesPorAccion: z.enum(["fijo_1", "mitad_nivel_abajo", "mitad_nivel_arriba"]).default("mitad_nivel_abajo"),
  ataques: z.array(EsquemaAtaqueInvocacion),
  rasgos: z.array(EsquemaRasgoInvocacion).default([]),
  accionesAdicionales: z.array(EsquemaRasgoInvocacion).default([]),
  reacciones: z.array(EsquemaRasgoInvocacion).default([]),
  fuente: z.string().default("Player's Handbook 2024")
});
export type PlantillaInvocacion = z.infer<typeof EsquemaPlantillaInvocacion>;

/**
 * Contexto del lanzador necesario para resolver la proyección de la invocación.
 */
export interface ContextoLanzadorInvocacion {
  modificadorAtaqueConjuros: number;
  cdSalvacionConjuros: number;
  bonificadorCompetencia: number;
  habilidadConjurosMod: number;
  nivelPersonaje?: number;
}
