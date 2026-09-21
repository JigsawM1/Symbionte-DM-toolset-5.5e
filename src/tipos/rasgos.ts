import { z } from "zod";

// ==========================================
// TIPOS Y ESQUEMAS DE RASGOS (D&D 5.5e & Homebrew)
// ==========================================

export const EsquemaOrigenRasgo = z.enum([
  "especie",
  "subespecie",
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
  "bono_dano_ataque",
  "bono_dano_conjuro",
  "bono_salvacion",
  "inmunidad_condicion",
  "competencia",
  "habilidad_con_fuerza",
  "medio_bono_habilidades",
  "ataque_desarmado",
  "conjuro_otorgado",
  "conjuro_gratuito",
  "hp_temporal",
  "modificador_hp_maximo",
  "modificador_capacidad_carga",
  "modificador_tamano",
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
  aplicaA: z.union([
    z.enum(["arma_fuerza", "arma_cac", "arma_distancia", "desarmado", "todos_ataques", "todos_conjuros", "trucos", "espacios"]),
    z.string()
  ]).optional(),
  limiteMaximo: z.number().int().optional(), // ej. 25 para modificador_stat
  permiteEscudo: z.boolean().optional(), // ej. true para Defensa sin armadura de Bárbaro
  descripcion: z.string().optional(),
  activo: z.boolean().default(true).optional()
});
export type EfectoMecanicoRasgo = z.infer<typeof EsquemaEfectoMecanicoRasgo>;

export const EsquemaRecursoGastado = z.enum(["espacio_pacto", "uso_rasgo", "ninguno"]);
export type RecursoGastado = z.infer<typeof EsquemaRecursoGastado>;

export const EsquemaOpcionSelector = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().default(""),
  requisito: z.string().optional(),
  nivelMinimo: z.number().int().min(1).max(20).optional(),
  requisitoInvocacion: z.string().optional(),
  repetible: z.boolean().optional(),
  tipoAccion: EsquemaTipoAccionRasgo.optional(),
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
  escaladoFormulaDados: z.array(z.object({
    nivelMinimo: z.number().int().min(1).max(20),
    valor: z.string()
  })).optional(),
  efectos: z.array(EsquemaEfectoMecanicoRasgo).optional(),
  selectores: z.array(z.any()).optional(),
  tieneUsosLimitados: z.boolean().optional(),
  usosMaximos: z.number().int().optional(),
  usosRestantes: z.number().int().optional(),
  recuperacion: EsquemaRecuperacionRasgo.optional(),
  conjuroGratuito: z.string().optional(),
  recuperacionConjuro: z.enum(["ninguno", "descanso_largo", "ilimitado"]).optional()
});
export type OpcionSelector = Omit<z.infer<typeof EsquemaOpcionSelector>, "selectores"> & {
  selectores?: SelectorRasgo[];
};

export interface InvocacionSobrenatural {
  id: string;
  nombre: string;
  descripcion: string;
  nivelMinimo: number;
  requisitoPrevio?: string;
  requisitoInvocacion?: string;
  tipoAccion: "pasivo" | "accion" | "accion_adicional" | "reaccion" | "especial";
  repetible: boolean;
  categoriaMecanica?: "consumible" | "activable" | "selector_informativo" | "pasivo_permanente" | "extension" | "curacion";
  recursoGastado?: RecursoGastado;
  formulaDados?: string;
  escaladoFormulaDados?: EscaladoFormulaDados;
  tieneUsosLimitados?: boolean;
  usosMaximos?: number;
  usosRestantes?: number;
  recuperacion?: RecuperacionRasgo;
  efectos?: EfectoMecanicoRasgo[];
  selectores?: SelectorRasgo[];
  conjuroGratuito?: string;
  recuperacionConjuro?: "ninguno" | "descanso_largo" | "ilimitado";
}

// ==========================================
// ESQUEMAS DE ESCALADO GENÉRICO POR NIVEL
// Eliminan la necesidad de bifurcaciones por nombre en el builder
// ==========================================

/** Escalado de fórmula de dados por nivel mínimo (e.g. Inspiración Bárdica, Frenesí) */
export const EsquemaEscaladoFormulaDados = z.array(z.object({
  nivelMinimo: z.number().int().min(1).max(20),
  valor: z.string()
}));
export type EscaladoFormulaDados = z.infer<typeof EsquemaEscaladoFormulaDados>;

/** Escalado de usos máximos por tabla de nivel o por modificador de stat */
export const EsquemaEscaladoUsos = z.object({
  tipo: z.enum(["por_nivel", "por_modificador"]),
  tabla: z.array(z.object({
    nivelMinimo: z.number().int().min(1).max(20),
    valor: z.number().int()
  })).optional(),
  modificador: z.string().optional(), // "carisma", "sabiduria", etc.
  minimo: z.number().int().default(1)
});
export type EscaladoUsos = z.infer<typeof EsquemaEscaladoUsos>;

/** Escalado de tipo de recuperación por nivel mínimo (e.g. Inspiración Bárdica: largo→corto a nv 5) */
export const EsquemaEscaladoRecuperacion = z.array(z.object({
  nivelMinimo: z.number().int().min(1).max(20),
  valor: EsquemaRecuperacionRasgo
}));
export type EscaladoRecuperacion = z.infer<typeof EsquemaEscaladoRecuperacion>;

export const EsquemaOpcionesDinamicas = z.object({
  nivelMinimo: z.number().int().min(1).max(20),
  opciones: z.array(EsquemaOpcionSelector)
});
export type OpcionesDinamicas = z.infer<typeof EsquemaOpcionesDinamicas>;

export const EsquemaSelectorRasgo = z.object({
  id: z.string(),
  tipo: z.enum(["unico", "multiple"]).default("unico"),
  etiqueta: z.string(),
  opciones: z.array(EsquemaOpcionSelector).default([]),
  maxSelecciones: z.number().int().min(1).default(1),
  valorActual: z.array(z.string()).default([]),
  visualizacion: z.enum(["normal", "lista"]).default("normal").optional(),
  // ── NUEVO: opciones que se desbloquean por nivel ──
  opcionesDinamicas: z.array(EsquemaOpcionesDinamicas).optional(),
  // ── NUEVO: max selecciones escalado por nivel ──
  escaladoMaxSelecciones: z.array(z.object({
    nivelMinimo: z.number().int().min(1).max(20),
    valor: z.number().int().min(1)
  })).optional()
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
  notaPie: z.string().default("Cada nivel reemplaza al anterior").optional()
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

  // ── ESCALADOS GENÉRICOS (reemplazan bifurcaciones por nombre en el builder) ──
  escaladoFormulaDados: EsquemaEscaladoFormulaDados.optional(),
  escaladoUsos: EsquemaEscaladoUsos.optional(),
  escaladoRecuperacion: EsquemaEscaladoRecuperacion.optional(),
  /** Si true, el builder reemplaza el `valor` de efectos dado_extra_dano/ataque_desarmado/bono_dano_fuerza con la formulaDados resuelta */
  sincronizarEfectosConFormula: z.boolean().default(false).optional(),

  // Estado, activables y ligaduras
  personalizado: z.boolean().default(false),
  activo: z.boolean().default(true),
  esActivable: z.boolean().default(false).optional(), // Toggle on/off
  autoDesactivar: z.boolean().default(false).optional(), // Si es true, vuelve a activo: false tras ejecutarse
  ligadoA: z.string().optional(), // ID o nombre de rasgo padre requerido activo
  gastarDePadre: z.boolean().default(false).optional(), // Descuenta uso de la reserva del rasgo padre
  heredarDadosPadre: z.boolean().default(false).optional(), // Hereda formulaDados del rasgo padre
  condicionAlActivar: z.string().optional(), // Condición táctica a sincronizar en condicionesActivas (ej. "Furia (Rage)")
  duracionEfectoAlActivar: z.number().int().min(1).optional(), // Duración en asaltos para el efecto activo generado (ej. 100 asaltos para Afinidad con la piedra)
  conjurosOtorgados: z.array(z.string()).default([]).optional(), // Conjuros siempre preparados otorgados por el rasgo
  conjuroGratuito: z.string().optional(),
  recuperacionConjuro: z.enum(["ninguno", "descanso_largo", "ilimitado"]).optional(),
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
  recursoGastado: EsquemaRecursoGastado.default("uso_rasgo").optional(),

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
  fuente: z.string().default("PHB 2024"),
  tipoAccion: EsquemaTipoAccionRasgo.optional(),
  tieneUsosLimitados: z.boolean().optional(),
  usosMaximos: z.number().int().optional(),
  formulaEscalado: z.string().optional(),
  formulaUsos: z.string().nullable().optional(),
  formulaDados: z.string().optional(),
  recuperacion: EsquemaRecuperacionRasgo.optional(),
  categoriaMecanica: z.enum([
    "consumible",
    "activable",
    "selector_informativo",
    "pasivo_permanente",
    "extension",
    "curacion"
  ]).optional(),
  efectos: z.array(EsquemaEfectoMecanicoRasgo).optional(),
  selectores: z.array(EsquemaSelectorRasgo).optional(),
  repetible: z.boolean().optional(),
  conjurosOtorgados: z.array(z.string()).optional()
});

export type DotePersonaje = z.infer<typeof EsquemaDotePersonaje>;
