import { z } from "zod";
import { EsquemaRasgoPersonaje } from "./rasgos";

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

export const EsquemaPersonalizacionCaracteristica = z.object({
  nombrePersonalizado: z.string().optional(),
  descripcionPersonalizada: z.string().optional(),
  modificadorExtra: z.number().default(0),
  valorFijo: z.number().nullable().default(null),
  bonoSalvacionExtra: z.number().default(0),
  notas: z.string().default("")
});
export type PersonalizacionCaracteristica = z.infer<typeof EsquemaPersonalizacionCaracteristica>;

export const EsquemaClasePersonaje = z.object({
  nombre: z.string().default("Guerrero"),
  subclase: z.string().default(""),
  nivel: z.number().int().min(1).max(20).default(1)
});
export type ClasePersonaje = z.infer<typeof EsquemaClasePersonaje>;

// ==========================================
// 3. TIPOS Y ESQUEMAS DE MAGIA (D&D 5.5e)
// ==========================================

export const EsquemaTipoLanzador = z.enum([
  "completo",
  "medio",
  "tercio",
  "pacto",
  "ninguno"
]);
export type TipoLanzador = z.infer<typeof EsquemaTipoLanzador>;

export const EsquemaModeloConjuros = z.enum([
  "conocidos",
  "preparados",
  "grimorio",
  "ninguno"
]);
export type ModeloConjuros = z.infer<typeof EsquemaModeloConjuros>;

export const EsquemaClaseLanzadora = z.object({
  clase: z.string(),
  nivel: z.number().int().min(1).max(20),
  tipoLanzador: EsquemaTipoLanzador,
  habilidadConjuro: EsquemaCaracteristica.nullable().default(null),
  modeloConjuros: EsquemaModeloConjuros.default("ninguno")
});
export type ClaseLanzadora = z.infer<typeof EsquemaClaseLanzadora>;

export const EsquemaConcentracionActiva = z.object({
  hechizoId: z.string(),
  nombreHechizo: z.string()
});
export type ConcentracionActiva = z.infer<typeof EsquemaConcentracionActiva>;

// ==========================================
// 3.5 TIPOS Y ESQUEMAS DE INVENTARIO Y MONEDAS (D&D 5.5e)
// ==========================================

export const EsquemaTamanoPersonaje = z.enum(["Diminuto", "Pequeño", "Mediano", "Grande"]);
export type TamanoPersonaje = z.infer<typeof EsquemaTamanoPersonaje>;

export const EsquemaBolsaMonedas = z.object({
  pc: z.number().int().min(0).default(0),
  pp: z.number().int().min(0).default(0),
  pe: z.number().int().min(0).default(0),
  po: z.number().int().min(0).default(0),
  ppt: z.number().int().min(0).default(0)
});
export type BolsaMonedas = z.infer<typeof EsquemaBolsaMonedas>;
export type TipoMonedaClave = keyof BolsaMonedas;

export const EsquemaTipoContenedor = z.enum(["mochila", "bolsa_contencion", "montura", "almacen"]);
export type TipoContenedor = z.infer<typeof EsquemaTipoContenedor>;

export const EsquemaObjetoInventario = z.object({
  idInstancia: z.string(),
  idObjeto: z.string(),
  nombre: z.string(),
  cantidad: z.number().int().min(1).default(1),
  equipado: z.boolean().default(false),
  sintonizado: z.boolean().default(false),
  notas: z.string().default(""),
  contenedor: EsquemaTipoContenedor.optional(),

  pesoLb: z.number().default(0),
  tipoPrincipal: z.enum(["Arma", "Armadura", "Equipo de Aventuras"]),
  esMagico: z.boolean().default(false),
  rareza: z.enum(["Común", "Poco Común", "Raro", "Muy Raro", "Legendario", "Artefacto"]).default("Común"),
  equipable: z.boolean().default(false),
  sintonizacionRequerida: z.boolean().default(false),
  cargasMaximas: z.number().int().min(0).optional(),
  cargasActuales: z.number().int().min(0).optional()
});
export type ObjetoInventario = z.infer<typeof EsquemaObjetoInventario>;

// ==========================================
// 4. ESQUEMA PRINCIPAL DEL PERSONAJE JUGADOR
// ==========================================

export const EsquemaPersonajeJugador = z.object({
  // Identidad (Apartado A)
  id: z.string(),
  nombre: z.string().default("Nuevo Personaje"),
  jugador: z.string().default(""),
  clase: z.string().default("Guerrero"),
  subclase: z.string().default(""),
  clases: z.array(EsquemaClasePersonaje).default([]),
  nivel: z.number().int().min(1).max(20).default(1),
  especie: z.string().default("Humano"),
  subespecie: z.string().default(""),
  tamano: EsquemaTamanoPersonaje.default("Mediano"),
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
  personalizacionesCaracteristicas: z.record(z.string(), EsquemaPersonalizacionCaracteristica).default({}),

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
  herramientasLista: z.array(z.string()).default([]),

  // Lanzamiento de Conjuros y Magia (Apartado D)
  esLanzador: z.boolean().default(false),
  clasesLanzadoras: z.array(EsquemaClaseLanzadora).default([]),
  concentracionActiva: EsquemaConcentracionActiva.nullable().default(null),

  // Trucos y Listas de Conjuros
  trucosConocidosIds: z.array(z.string()).default([]),
  conjurosConocidosIds: z.array(z.string()).default([]),
  conjurosPreparadosIds: z.array(z.string()).default([]),
  conjurosSiemprePreparadosIds: z.array(z.string()).default([]),

  // Recursos: Espacios de Conjuro
  espaciosConjuroMaximos: z.record(z.string(), z.number()).default({}),
  espaciosConjuroGastados: z.record(z.string(), z.number()).default({}),

  // Recursos: Puntos de Conjuro (Variante DMG)
  puntosConjuroMaximos: z.number().int().min(0).default(0),
  puntosConjuroGastados: z.number().int().min(0).default(0),
  nivelConjuroMaximo: z.number().int().min(0).max(9).default(0),

  // Magia de Pacto (Brujo)
  espaciosPactoMaximos: z.number().int().min(0).default(0),
  espaciosPactoGastados: z.number().int().min(0).default(0),
  nivelEspacioPacto: z.number().int().min(0).max(5).default(0),

  // Campos reservados para mecánicas avanzadas de clase
  arcanoMisticoIds: z.array(z.string()).default([]),
  arcanoMisticoGastados: z.array(z.string()).default([]),
  puntosHechiceriaMaximos: z.number().int().min(0).default(0),
  puntosHechiceriaActuales: z.number().int().min(0).default(0),

  // Overrides Manuales
  overrideEspaciosConjuro: z.record(z.string(), z.number()).nullable().default(null),
  overridePuntosConjuro: z.number().nullable().default(null),

  // Inventario y Equipo (Apartado E)
  inventario: z.array(EsquemaObjetoInventario).default([]),
  bolsaMonedas: EsquemaBolsaMonedas.default({ pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 }),

  // Rasgos, Dotes y Personalizaciones (Apartado F)
  rasgos: z.array(EsquemaRasgoPersonaje).default([]),
  dotes: z.array(z.string()).default([])
});

export type PersonajeJugador = z.infer<typeof EsquemaPersonajeJugador>;

