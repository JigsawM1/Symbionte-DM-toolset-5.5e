import { z } from "zod";

// ==========================================
// 1. CARACTERÍSTICAS Y CAPACIDADES DE D&D 2024
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

export const EsquemaSalvaciones = z.object({
  fuerza: z.number().optional(),
  destreza: z.number().optional(),
  constitucion: z.number().optional(),
  inteligencia: z.number().optional(),
  sabiduria: z.number().optional(),
  carisma: z.number().optional()
});
export type Salvaciones = z.infer<typeof EsquemaSalvaciones>;

export const EsquemaHabilidades = z.object({
  acrobacias: z.number().optional(),
  manejoAnimales: z.number().optional(),
  arcanos: z.number().optional(),
  atletismo: z.number().optional(),
  engaño: z.number().optional(),
  historia: z.number().optional(),
  perspicacia: z.number().optional(),
  intimidacion: z.number().optional(),
  investigacion: z.number().optional(),
  medicina: z.number().optional(),
  naturaleza: z.number().optional(),
  percepcion: z.number().optional(),
  interpretacion: z.number().optional(),
  persuasion: z.number().optional(),
  religion: z.number().optional(),
  juegoManos: z.number().optional(),
  sigilo: z.number().optional(),
  supervivencia: z.number().optional()
});
export type Habilidades = z.infer<typeof EsquemaHabilidades>;

export type Habilidad = keyof Habilidades;

// ==========================================
// 2. ENUMERACIONES CORE EN ESPAÑOL (D&D 5.5e)
// ==========================================

export const EsquemaTipoDaño = z.enum([
  "Ácido", "Contundente", "Frío", "Fuego", "Fuerza", "Relámpago",
  "Necrótico", "Perforante", "Veneno", "Psíquico", "Radiante", "Cortante", "Trueno"
]);
export type TipoDaño = z.infer<typeof EsquemaTipoDaño>;

export const EsquemaCondicion = z.enum([
  "Apresado", "Asustado", "Cegado", "Derribado", "Envenenado", "Ensordecido",
  "Hechizado", "Incapacitado", "Inconsciente", "Invisible", "Paralizado",
  "Petrificado", "Restringido", "Aturdido", "Agotamiento"
]);
export type Condicion = z.infer<typeof EsquemaCondicion>;

export const EsquemaTipoMonstruo = z.enum([
  "Aberración", "Bestia", "Celestial", "Constructo", "Dragón", "Elemental",
  "Feérico", "Infernal", "Gigante", "Humanoide", "Abominación", "Monstruosidad",
  "Cieno", "Planta", "No Muerto"
]);
export type TipoMonstruo = z.infer<typeof EsquemaTipoMonstruo>;

export const EsquemaEscuelaHechizo = z.enum([
  "Abjuración", "Conjuración", "Adivinación", "Encantamiento",
  "Evocación", "Ilusión", "Nigromancia", "Transmutación"
]);
export type EscuelaHechizo = z.infer<typeof EsquemaEscuelaHechizo>;

export const EsquemaRareza = z.enum([
  "Común", "Poco Común", "Raro", "Muy Raro", "Legendario", "Artefacto"
]);
export type Rareza = z.infer<typeof EsquemaRareza>;

export const EsquemaTipoBonoDestreza = z.enum(["Completo", "Máximo 2", "Sin Bono"]);
export type TipoBonoDestreza = z.infer<typeof EsquemaTipoBonoDestreza>;

export const EsquemaSubcategoriaEquipo = z.enum(["Consumible", "Munición", "Herramienta", "Instrumento", "Paquete", "Maravilloso"]);
export type SubcategoriaEquipo = z.infer<typeof EsquemaSubcategoriaEquipo>;

// ==========================================
// 3. SUBESTRUCTURAS RICAS DE COMBATE Y MONSTRUOS
// ==========================================

export const EsquemaVelocidad = z.object({
  caminar: z.number().default(0), // pies
  nadar: z.number().optional(),
  volar: z.number().optional(),
  escalar: z.number().optional(),
  excavar: z.number().optional(),
  planea: z.boolean().default(false)
});
export type VelocidadEstructurada = z.infer<typeof EsquemaVelocidad>;

export const EsquemaSentidos = z.object({
  visionOscuridad: z.number().optional(), // pies
  visionCiega: z.number().optional(),
  sentidoSismico: z.number().optional(),
  percepcionPasiva: z.number().default(10)
});
export type SentidosEstructurados = z.infer<typeof EsquemaSentidos>;

export const EsquemaAccionRapida = z.object({
  nombre: z.string(),
  bonificadorAtaque: z.string(), // ej. "+9"
  dadosDaño: z.string(), // ej. "2d6+5"
  tipoDaño: z.string() // ej. "contundente"
});
export type AccionRapida = z.infer<typeof EsquemaAccionRapida>;

export const EsquemaRasgoBase = z.object({
  nombre: z.string(),
  descripcion: z.string(),
  uso: z.string().optional()
});
export type RasgoBase = z.infer<typeof EsquemaRasgoBase>;

export const EsquemaAccionMonstruo = z.object({
  nombre: z.string(),
  descripcion: z.string(),
  bonificadorAtaque: z.number().optional(),
  daño: z.string().optional(),
  uso: z.string().optional()
});
export type AccionMonstruo = z.infer<typeof EsquemaAccionMonstruo>;

// ==========================================
// 4. MODELOS PRINCIPALES (Monstruo y Hechizo)
// ==========================================

export const EsquemaMonstruoBase = z.object({
  id: z.string(),
  nombre: z.string(),
  tipo: EsquemaTipoMonstruo.or(z.string()), // Aceptar otros tipos en Homebrew
  ca: z.number(),
  caNotas: z.string().optional().default(""),
  vidaMaxima: z.number(),
  vidaActual: z.number(),
  vidaNotas: z.string().optional().default(""),
  iniciativaBonificador: z.number().default(0),
  velocidad: z.union([z.string(), EsquemaVelocidad]).default("30 pies"), // Soporte híbrido para retrocompatibilidad en UI
  sentidos: z.union([z.string(), EsquemaSentidos]).default(""), // Soporte híbrido para retrocompatibilidad en UI
  idiomas: z.string().optional().default(""),
  desafio: z.string().optional().default("0"),
  fuente: z.string().optional().default("SRD 2024"),
  caracteristicas: EsquemaCaracteristicas,
  salvaciones: EsquemaSalvaciones.optional().default({}),
  habilidades: EsquemaHabilidades.optional().default({}),
  vulnerabilidades: z.array(z.string()).default([]),
  resistencias: z.array(z.string()).default([]),
  inmunidadesDaño: z.array(z.string()).default([]),
  inmunidadesCondicion: z.array(z.string()).default([]),
  accionesRapidas: z.array(EsquemaAccionRapida).optional().default([]),
  rasgos: z.array(EsquemaRasgoBase).default([]),
  acciones: z.array(EsquemaAccionMonstruo).default([]),
  reacciones: z.array(EsquemaRasgoBase).optional().default([]),
  accionesLegendarias: z.array(EsquemaRasgoBase).optional().default([])
});
export type MonstruoBase = z.infer<typeof EsquemaMonstruoBase>;

export const EsquemaHechizoBase = z.object({
  id: z.string(),
  nombre: z.string(),
  nivel: z.number().int().min(0).max(9),
  escuela: EsquemaEscuelaHechizo.or(z.string()),
  tiempoLanzamiento: z.string(),
  alcance: z.string(),
  componentes: z.string(), // ej. "V, S, M"
  descripcion: z.string(),
  concentracion: z.boolean().optional(),
  ritual: z.boolean().optional(),
  
  // Campos avanzados enriquecidos
  descNivelSuperior: z.string().optional(),
  materiales: z.string().optional(),
  componentesSeleccionados: z.object({
    verbal: z.boolean(),
    somatico: z.boolean(),
    material: z.boolean()
  }).optional(),
  duracion: z.string().optional(),
  clases: z.array(z.string()).optional(),
  ataqueCd: z.string().optional(), // "TIRADA DE ATAQUE", "CD DE SALVACIÓN", "N/A"
  dadosDaño: z.string().optional(),
  dadosDañoNivelSuperior: z.string().optional(),
  cdSalvacion: z.string().optional(), // ej. "Destreza", "Sabiduría"
  agregarModificadorHabilidad: z.boolean().optional(),
  tipoDaño: z.string().optional()
});
export type HechizoBase = z.infer<typeof EsquemaHechizoBase>;

// ==========================================
// 5. EQUIPO Y OBJETOS MÁGICOS
// ==========================================

export const EsquemaObjetoBase = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  pesoLb: z.number().default(0),
  valorPO: z.number().default(0),
  rareza: EsquemaRareza,
  esMagico: z.boolean().default(false),
  bonosMagicos: z.array(z.object({
    categoria: z.string(),
    bono: z.string(),
    valor: z.number()
  })).optional(),
  propiedades: z.union([z.string(), z.array(z.string())]).optional()
});
export type ObjetoBase = z.infer<typeof EsquemaObjetoBase>;

export const EsquemaArma = EsquemaObjetoBase.extend({
  tipoPrincipal: z.literal("Arma"),
  subcategoria: z.enum(["Sencilla", "Marcial", "De Fuego"]),
  tipoAtaque: z.enum(["Cuerpo a Cuerpo", "A Distancia"]),
  dadoDano: z.string(),
  tipoDano: z.string(),
  propiedades: z.array(z.string()),
  maestria: z.string(),
  alcanceNormal: z.number().optional(),
  alcanceLargo: z.number().optional()
});
export type Arma = z.infer<typeof EsquemaArma>;

export const EsquemaArmadura = EsquemaObjetoBase.extend({
  tipoPrincipal: z.literal("Armadura"),
  subcategoria: z.enum(["Ligera", "Mediana", "Pesada", "Escudo"]),
  caBase: z.number(),
  requisitoFuerza: z.number().optional(),
  desventajaSigilo: z.boolean().default(false),
  bonoDestreza: EsquemaTipoBonoDestreza
});
export type Armadura = z.infer<typeof EsquemaArmadura>;

export const EsquemaEquipoAventuras = EsquemaObjetoBase.extend({
  tipoPrincipal: z.literal("Equipo de Aventuras"),
  subcategoria: EsquemaSubcategoriaEquipo,
  cantidad: z.number().optional(),
  sintonizacionRequerida: z.boolean().optional(),
  cargas: z.number().optional()
});
export type EquipoAventuras = z.infer<typeof EsquemaEquipoAventuras>;

export const EsquemaObjetoJuego = z.union([EsquemaArma, EsquemaArmadura, EsquemaEquipoAventuras]);
export type ObjetoJuego = z.infer<typeof EsquemaObjetoJuego>;
export type ObjetoHomebrew = ObjetoJuego;

// ==========================================
// 6. CONDICIONES Y EFECTOS
// ==========================================

export interface CondicionDnd {
  nombre: string;
  descripcion: string;
  efectos: string[];
}

export interface EfectoPredefinido {
  nombre: string;
  descripcion: string;
  duracionEstandar: number; // en rondas
  esConcentracion?: boolean;
}
