import { z } from "zod";

// ==========================================
// TIPOS Y ESQUEMAS DE RASGOS (D&D 5.5e & Homebrew)
// ==========================================

export const EsquemaOrigenRasgo = z.enum([
  "especie",
  "clase",
  "subclase",
  "dote",
  "trasfondo",
  "personalizado"
]);
export type OrigenRasgo = z.infer<typeof EsquemaOrigenRasgo>;

export const EsquemaTipoAccionRasgo = z.enum([
  "pasivo",
  "accion",
  "accion_adicional",
  "reaccion",
  "especial"
]);
export type TipoAccionRasgo = z.infer<typeof EsquemaTipoAccionRasgo>;

export const EsquemaRecuperacionRasgo = z.enum([
  "descanso_corto",
  "descanso_largo",
  "manual",
  "otro",
  "ninguno"
]);
export type RecuperacionRasgo = z.infer<typeof EsquemaRecuperacionRasgo>;

export const EsquemaRasgoPersonaje = z.object({
  id: z.string(),
  nombre: z.string().min(1, "El nombre del rasgo es obligatorio"),
  descripcion: z.string().default(""),
  origen: EsquemaOrigenRasgo.default("personalizado"),
  fuente: z.string().default("Homebrew"),
  tipoAccion: EsquemaTipoAccionRasgo.default("pasivo"),
  nivelRequerido: z.number().int().min(1).max(20).optional(),
  
  // Usos y recursos limitados
  tieneUsosLimitados: z.boolean().default(false),
  usosMaximos: z.number().int().min(1).optional(),
  usosRestantes: z.number().int().min(0).optional(),
  recuperacion: EsquemaRecuperacionRasgo.default("ninguno"),
  
  // Fórmulas o dados asociados (ej. "1d10 + nivel", "1d8", etc.)
  formulaDados: z.string().optional(),
  
  // Estado y personalización
  personalizado: z.boolean().default(false),
  activo: z.boolean().default(true),
  notas: z.string().default("")
});

export type RasgoPersonaje = z.infer<typeof EsquemaRasgoPersonaje>;

export const EsquemaDotePersonaje = z.object({
  id: z.string(),
  nombre: z.string(),
  categoria: z.enum(["origen", "general", "estilo_combate", "don_epico", "personalizado"]).default("general"),
  requisito: z.string().optional(),
  descripcion: z.string(),
  beneficios: z.array(z.string()).default([]),
  fuente: z.string().default("PHB 2024")
});

export type DotePersonaje = z.infer<typeof EsquemaDotePersonaje>;
