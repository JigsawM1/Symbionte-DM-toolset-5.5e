import { z } from "zod";

// ==========================================
// 1. CARACTERÍSTICAS Y CAPACIDADES BASE
// ==========================================

export const EsquemaCaracteristica = z.enum([
  "fuerza", "destreza", "constitucion", "inteligencia", "sabiduria", "carisma"
]);
export type Caracteristica = z.infer<typeof EsquemaCaracteristica>;

export const EsquemaCaracteristicas = z.object({
  fuerza: z.number().default(10),
  destreza: z.number().default(10),
  constitucion: z.number().default(10),
  inteligencia: z.number().default(10),
  sabiduria: z.number().default(10),
  carisma: z.number().default(10)
});
export type Caracteristicas = z.infer<typeof EsquemaCaracteristicas>;

export const EsquemaVelocidad = z.object({
  caminar: z.number().default(0),
  nadar: z.number().optional(),
  volar: z.number().optional(),
  escalar: z.number().optional(),
  excavar: z.number().optional(),
  planea: z.boolean().default(false)
});
export type VelocidadEstructurada = z.infer<typeof EsquemaVelocidad>;

export const EsquemaSentidos = z.object({
  visionOscuridad: z.number().optional(),
  visionCiega: z.number().optional(),
  visionVerdadera: z.number().optional(),
  sentidoSismico: z.number().optional(),
  percepcionPasiva: z.number().default(10)
});
export type SentidosEstructurados = z.infer<typeof EsquemaSentidos>;

// ==========================================
// 2. GRADOS DE COMPETENCIA Y ATRIBUTOS
// ==========================================

export const EsquemaGradoCompetencia = z.enum(["ninguna", "competente", "pericia", "medio"]);
export type GradoCompetencia = z.infer<typeof EsquemaGradoCompetencia>;

export const EsquemaOverridesFijos = z.object({
  fuerza: z.number().nullable().default(null),
  destreza: z.number().nullable().default(null),
  constitucion: z.number().nullable().default(null),
  inteligencia: z.number().nullable().default(null),
  sabiduria: z.number().nullable().default(null),
  carisma: z.number().nullable().default(null)
});
export type OverridesFijos = z.infer<typeof EsquemaOverridesFijos>;

export const EsquemaCompetenciasSalvacion = z.object({
  fuerza: z.boolean().default(false),
  destreza: z.boolean().default(false),
  constitucion: z.boolean().default(false),
  inteligencia: z.boolean().default(false),
  sabiduria: z.boolean().default(false),
  carisma: z.boolean().default(false)
});
export type CompetenciasSalvacion = z.infer<typeof EsquemaCompetenciasSalvacion>;

export const EsquemaGradosHabilidades = z.object({
  acrobacias: EsquemaGradoCompetencia.default("ninguna"),
  manejoAnimales: EsquemaGradoCompetencia.default("ninguna"),
  arcanos: EsquemaGradoCompetencia.default("ninguna"),
  atletismo: EsquemaGradoCompetencia.default("ninguna"),
  engaño: EsquemaGradoCompetencia.default("ninguna"),
  historia: EsquemaGradoCompetencia.default("ninguna"),
  perspicacia: EsquemaGradoCompetencia.default("ninguna"),
  intimidacion: EsquemaGradoCompetencia.default("ninguna"),
  investigacion: EsquemaGradoCompetencia.default("ninguna"),
  medicina: EsquemaGradoCompetencia.default("ninguna"),
  naturaleza: EsquemaGradoCompetencia.default("ninguna"),
  percepcion: EsquemaGradoCompetencia.default("ninguna"),
  interpretacion: EsquemaGradoCompetencia.default("ninguna"),
  persuasion: EsquemaGradoCompetencia.default("ninguna"),
  religion: EsquemaGradoCompetencia.default("ninguna"),
  juegoManos: EsquemaGradoCompetencia.default("ninguna"),
  sigilo: EsquemaGradoCompetencia.default("ninguna"),
  supervivencia: EsquemaGradoCompetencia.default("ninguna")
});
export type GradosHabilidades = z.infer<typeof EsquemaGradosHabilidades>;

export const EsquemaSalvacionesMuerte = z.object({
  exitos: z.number().int().min(0).max(3).default(0),
  fallos: z.number().int().min(0).max(3).default(0)
});
export type SalvacionesMuerte = z.infer<typeof EsquemaSalvacionesMuerte>;

export const GRADOS_HABILIDADES_DEFECTO: GradosHabilidades = {
  acrobacias: "ninguna",
  manejoAnimales: "ninguna",
  arcanos: "ninguna",
  atletismo: "ninguna",
  engaño: "ninguna",
  historia: "ninguna",
  perspicacia: "ninguna",
  intimidacion: "ninguna",
  investigacion: "ninguna",
  medicina: "ninguna",
  naturaleza: "ninguna",
  percepcion: "ninguna",
  interpretacion: "ninguna",
  persuasion: "ninguna",
  religion: "ninguna",
  juegoManos: "ninguna",
  sigilo: "ninguna",
  supervivencia: "ninguna"
};

export const EsquemaPersonalizacionHabilidad = z.object({
  nombrePersonalizado: z.string().optional(),
  descripcionPersonalizada: z.string().optional(),
  modificadorExtra: z.number().default(0),
  valorFijo: z.number().nullable().default(null),
  notas: z.string().default("")
});
export type PersonalizacionHabilidad = z.infer<typeof EsquemaPersonalizacionHabilidad>;

// ==========================================
// 3. ESQUEMA PRINCIPAL DEL PERSONAJE JUGADOR
// ==========================================

export const EsquemaPersonajeJugador = z.object({
  // Identidad (Apartado A)
  id: z.string(),
  nombre: z.string().default("Nuevo Personaje"),
  jugador: z.string().default(""),
  clase: z.string().default("Guerrero"),
  subclase: z.string().default(""),
  nivel: z.number().int().min(1).max(20).default(1),
  especie: z.string().default("Humano"),
  trasfondo: z.string().default("Personalizado"),
  alineacion: z.string().default("Neutral"),
  experiencia: z.number().int().min(0).default(0),
  avatarUrl: z.string().default(""),
  idMiniaturaTS: z.string().nullable().default(null),
  inspiracion: z.boolean().default(false),

  // Características y Modificadores (Apartado B)
  caracteristicas: EsquemaCaracteristicas.default({
    fuerza: 10,
    destreza: 10,
    constitucion: 10,
    inteligencia: 10,
    sabiduria: 10,
    carisma: 10
  }),
  overridesFijos: EsquemaOverridesFijos.default({
    fuerza: null,
    destreza: null,
    constitucion: null,
    inteligencia: null,
    sabiduria: null,
    carisma: null
  }),

  // Salvaciones y Habilidades (Apartado B)
  competenciasSalvacion: EsquemaCompetenciasSalvacion.default({
    fuerza: false,
    destreza: false,
    constitucion: false,
    inteligencia: false,
    sabiduria: false,
    carisma: false
  }),
  gradosHabilidades: EsquemaGradosHabilidades.default(GRADOS_HABILIDADES_DEFECTO),
  personalizacionesHabilidades: z.record(z.string(), EsquemaPersonalizacionHabilidad).default({}),

  // Vitalidad, Supervivencia y Combate (Apartado C)
  hpMaximoBase: z.number().int().min(1).default(10),
  hpMaximo: z.number().int().min(1).default(10),
  hpActual: z.number().int().default(10),
  hpTemporal: z.number().int().min(0).default(0),
  tipoDadoGolpe: z.enum(["d6", "d8", "d10", "d12"]).default("d10"),
  dadosGolpeTotal: z.number().int().min(1).default(1),
  dadosGolpeRestantes: z.number().int().min(0).default(1),
  salvacionesMuerte: EsquemaSalvacionesMuerte.default({ exitos: 0, fallos: 0 }),
  cansancio: z.number().int().min(0).max(6).default(0),

  // Condiciones y Efectos Activos
  condicionesActivas: z.array(z.string()).default([]),

  // Métricas de Combate Rápido
  ca: z.number().int().default(10),
  caNotas: z.string().default(""),
  iniciativaBono: z.number().int().default(0),
  velocidad: z.union([z.string(), EsquemaVelocidad]).default("30 pies"),
  sentidos: z.union([z.string(), EsquemaSentidos]).default(""),

  // Competencias de Texto y Listas Estructuradas (Apartado B)
  competenciasArmas: z.string().default(""),
  competenciasArmasGrupos: z.array(z.string()).default([]),
  competenciasArmasLista: z.array(z.string()).default([]),
  competenciasArmaduras: z.string().default(""),
  competenciasArmadurasGrupos: z.array(z.string()).default([]),
  competenciasArmadurasLista: z.array(z.string()).default([]),
  idiomas: z.string().default("Común"),
  idiomasLista: z.array(z.string()).default(["Común"]),
  herramientas: z.string().default(""),
  herramientasLista: z.array(z.string()).default([])
});

export type PersonajeJugador = z.infer<typeof EsquemaPersonajeJugador>;

