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

// ==========================================
// TIPOS Y ESQUEMAS DE EFECTOS MECÁNICOS Y SELECTORES
// ==========================================

export const EsquemaTipoEfectoMecanico = z.enum([
  "modificador_stat",
  "modificador_ca",
  "modificador_velocidad",
  "movimiento_especial",
  "ventaja",
  "desventaja",
  "dado_extra_dano",
  "dano_secundario",
  "bono_dano_fuerza",
  "bono_salvacion",
  "resistencia_dano",
  "inmunidad_condicion",
  "competencia",
  "habilidad_con_fuerza",
  "restaurar_recurso",
  "personalizado"
]);
export type TipoEfectoMecanico = z.infer<typeof EsquemaTipoEfectoMecanico>;

export const EsquemaEfectoMecanicoRasgo = z.object({
  id: z.string().optional(),
  tipo: EsquemaTipoEfectoMecanico,
  objetivo: z.string(), // ej. "fuerza", "ca", "velocidad.caminar", "salvacion.destreza", "iniciativa", "ataque_fuerza"
  valor: z.union([z.number(), z.string()]), // ej. 4, "2d6", "+2", "1d6+mitad_nivel", "dano_furia"
  condicion: z.string().nullable().optional(), // ej. "furia_activa", "sin_armadura_pesada", "sin_armadura", "siempre"
  tipoDano: z.string().optional(), // ej. "Radiante o Necrótico", "Fuego", "Fuerza", etc.
  aplicaA: z.enum(["arma_fuerza", "arma_cac", "arma_distancia", "desarmado", "todos_ataques"]).optional(),
  limiteMaximo: z.number().int().optional(), // ej. 25 para modificador_stat
  permiteEscudo: z.boolean().optional(), // ej. true para Defensa sin armadura de Bárbaro
  descripcion: z.string().optional(),
  activo: z.boolean().default(true).optional()
});
export type EfectoMecanicoRasgo = z.infer<typeof EsquemaEfectoMecanicoRasgo>;

export const EsquemaOpcionSelector = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().default(""),
  efectos: z.array(EsquemaEfectoMecanicoRasgo).optional()
});
export type OpcionSelector = z.infer<typeof EsquemaOpcionSelector>;

export const EsquemaSelectorRasgo = z.object({
  id: z.string(),
  tipo: z.enum(["unico", "multiple"]).default("unico"),
  etiqueta: z.string(),
  opciones: z.array(EsquemaOpcionSelector).default([]),
  maxSelecciones: z.number().int().min(1).default(1),
  valorActual: z.array(z.string()).default([])
});
export type SelectorRasgo = z.infer<typeof EsquemaSelectorRasgo>;

// Tablas de escalado/progresión por nivel en el rasgo
export const EsquemaFilaTablaEscalado = z.object({
  nivel: z.number().int().min(1).max(20),
  valores: z.array(z.string())
});
export type FilaTablaEscalado = z.infer<typeof EsquemaFilaTablaEscalado>;

export const EsquemaTablaEscaladoRasgo = z.object({
  columnas: z.array(z.string()).default(["Nivel", "Descripción"]),
  filas: z.array(EsquemaFilaTablaEscalado).default([]),
  notaPie: z.string().default("Cada nivel reemplaza al anterior")
});
export type TablaEscaladoRasgo = z.infer<typeof EsquemaTablaEscaladoRasgo>;

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
  
  // Estado, activables y ligaduras
  personalizado: z.boolean().default(false),
  activo: z.boolean().default(true),
  esActivable: z.boolean().default(false).optional(), // Toggle on/off
  ligadoA: z.string().optional(), // ID o nombre de rasgo padre requerido activo
  condicionAlActivar: z.string().optional(), // Condición táctica a sincronizar en condicionesActivas (ej. "Furia (Rage)")
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
  
  // Mecánicas estructuradas
  efectos: z.array(EsquemaEfectoMecanicoRasgo).default([]).optional(),
  selectores: z.array(EsquemaSelectorRasgo).default([]).optional(),
  tablaProgresion: EsquemaTablaEscaladoRasgo.optional(),

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
