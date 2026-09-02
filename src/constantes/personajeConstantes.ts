import type {
  PersonajeJugador,
  Caracteristica,
  Habilidad
} from "@/tipos";

// ==========================================
// 1. TABLAS DE PROGRESIÓN Y DADOS D&D 5.5e
// ==========================================

export const TABLA_BONIFICADOR_COMPETENCIA: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6
};

export const TABLA_EXPERIENCIA: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000
};

export const DADO_GOLPE_POR_CLASE: Record<string, "d6" | "d8" | "d10" | "d12"> = {
  "Bárbaro": "d12",
  "Explorador": "d10",
  "Guerrero": "d10",
  "Paladín": "d10",
  "Bardo": "d8",
  "Brujo": "d8",
  "Clérigo": "d8",
  "Druida": "d8",
  "Monje": "d8",
  "Pícaro": "d8",
  "Hechicero": "d6",
  "Mago": "d6"
};

export const MAPA_HABILIDAD_A_CARACTERISTICA: Record<Habilidad, Caracteristica> = {
  acrobacias: "destreza",
  manejoAnimales: "sabiduria",
  arcanos: "inteligencia",
  atletismo: "fuerza",
  engaño: "carisma",
  historia: "inteligencia",
  perspicacia: "sabiduria",
  intimidacion: "carisma",
  investigacion: "inteligencia",
  medicina: "sabiduria",
  naturaleza: "inteligencia",
  percepcion: "sabiduria",
  interpretacion: "carisma",
  persuasion: "carisma",
  religion: "inteligencia",
  juegoManos: "destreza",
  sigilo: "destreza",
  supervivencia: "sabiduria"
};

// ==========================================
// 2. HELPERS PUROS DE CONSULTA
// ==========================================

export function obtenerBonoCompetenciaPorNivel(nivel: number): number {
  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  return TABLA_BONIFICADOR_COMPETENCIA[nivelSeguro] ?? 2;
}

export function obtenerExperienciaMinimaPorNivel(nivel: number): number {
  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  return TABLA_EXPERIENCIA[nivelSeguro] ?? 0;
}

export function obtenerExperienciaMaximaPorNivel(nivel: number): number {
  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  if (nivelSeguro >= 20) return Infinity;
  return (TABLA_EXPERIENCIA[nivelSeguro + 1] ?? 355000) - 1;
}

export function obtenerRangoExperienciaPorNivel(nivel: number): { min: number; max: number; texto: string } {
  const min = obtenerExperienciaMinimaPorNivel(nivel);
  const max = obtenerExperienciaMaximaPorNivel(nivel);
  const texto = max === Infinity 
    ? `${min.toLocaleString()} PX o más`
    : `${min.toLocaleString()} - ${max.toLocaleString()} PX`;
  return { min, max, texto };
}

export function obtenerNivelPorExperiencia(xp: number): number {
  const xpSegura = Math.max(0, Math.floor(xp) || 0);
  for (let niv = 20; niv >= 1; niv--) {
    if (xpSegura >= (TABLA_EXPERIENCIA[niv] ?? 0)) {
      return niv;
    }
  }
  return 1;
}

export function obtenerDadoGolpePorClase(clase: string): "d6" | "d8" | "d10" | "d12" {
  return DADO_GOLPE_POR_CLASE[clase] ?? "d8";
}

// ==========================================
// 3. TABLAS DE PROGRESIÓN DE MAGIA D&D 2024
// ==========================================

/** Espacios de conjuro por nivel de lanzador combinado (niveles 1-20) */
export const TABLA_ESPACIOS_CONJURO: Record<number, Record<number, number>> = {
  1: { 1: 2 },
  2: { 1: 3 },
  3: { 1: 4, 2: 2 },
  4: { 1: 4, 2: 3 },
  5: { 1: 4, 2: 3, 3: 2 },
  6: { 1: 4, 2: 3, 3: 3 },
  7: { 1: 4, 2: 3, 3: 3, 4: 1 },
  8: { 1: 4, 2: 3, 3: 3, 4: 2 },
  9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
  18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
  20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
};

/** Puntos de conjuro totales y nivel máximo por nivel de lanzador (variante DMG) */
export const TABLA_PUNTOS_CONJURO: Record<number, { puntos: number; nivelMax: number }> = {
  1: { puntos: 4, nivelMax: 1 },
  2: { puntos: 6, nivelMax: 1 },
  3: { puntos: 14, nivelMax: 2 },
  4: { puntos: 17, nivelMax: 2 },
  5: { puntos: 27, nivelMax: 3 },
  6: { puntos: 32, nivelMax: 3 },
  7: { puntos: 38, nivelMax: 4 },
  8: { puntos: 44, nivelMax: 4 },
  9: { puntos: 57, nivelMax: 5 },
  10: { puntos: 64, nivelMax: 5 },
  11: { puntos: 73, nivelMax: 6 },
  12: { puntos: 73, nivelMax: 6 },
  13: { puntos: 83, nivelMax: 7 },
  14: { puntos: 83, nivelMax: 7 },
  15: { puntos: 94, nivelMax: 8 },
  16: { puntos: 94, nivelMax: 8 },
  17: { puntos: 107, nivelMax: 9 },
  18: { puntos: 114, nivelMax: 9 },
  19: { puntos: 123, nivelMax: 9 },
  20: { puntos: 133, nivelMax: 9 }
};

/** Coste en puntos para lanzar un conjuro de nivel N */
export const COSTE_PUNTOS_POR_NIVEL: Record<number, number> = {
  1: 2,
  2: 3,
  3: 5,
  4: 6,
  5: 7,
  6: 9,
  7: 10,
  8: 11,
  9: 13
};

/** Mapeo por defecto de clase a configuración de lanzador */
export const TIPO_LANZADOR_POR_CLASE: Record<
  string,
  {
    tipo: import("@/tipos").TipoLanzador;
    habilidad: Caracteristica;
    modelo: import("@/tipos").ModeloConjuros;
  }
> = {
  Mago: { tipo: "completo", habilidad: "inteligencia", modelo: "grimorio" },
  Hechicero: { tipo: "completo", habilidad: "carisma", modelo: "conocidos" },
  Bardo: { tipo: "completo", habilidad: "carisma", modelo: "conocidos" },
  Clerigo: { tipo: "completo", habilidad: "sabiduria", modelo: "preparados" },
  Clérigo: { tipo: "completo", habilidad: "sabiduria", modelo: "preparados" },
  Druida: { tipo: "completo", habilidad: "sabiduria", modelo: "preparados" },
  Paladin: { tipo: "medio", habilidad: "carisma", modelo: "preparados" },
  Paladín: { tipo: "medio", habilidad: "carisma", modelo: "preparados" },
  Explorador: { tipo: "medio", habilidad: "sabiduria", modelo: "conocidos" },
  Brujo: { tipo: "pacto", habilidad: "carisma", modelo: "conocidos" },
  "Caballero Arcano": { tipo: "tercio", habilidad: "inteligencia", modelo: "conocidos" },
  "Embaucador Arcano": { tipo: "tercio", habilidad: "inteligencia", modelo: "conocidos" }
};

/** Progresión de Magia de Pacto del Brujo (niveles 1-20) */
export const TABLA_PACTO_BRUJO: Record<number, { espacios: number; nivel: number }> = {
  1: { espacios: 1, nivel: 1 },
  2: { espacios: 2, nivel: 1 },
  3: { espacios: 2, nivel: 2 },
  4: { espacios: 2, nivel: 2 },
  5: { espacios: 2, nivel: 3 },
  6: { espacios: 2, nivel: 3 },
  7: { espacios: 2, nivel: 4 },
  8: { espacios: 2, nivel: 4 },
  9: { espacios: 2, nivel: 5 },
  10: { espacios: 2, nivel: 5 },
  11: { espacios: 3, nivel: 5 },
  12: { espacios: 3, nivel: 5 },
  13: { espacios: 3, nivel: 5 },
  14: { espacios: 3, nivel: 5 },
  15: { espacios: 3, nivel: 5 },
  16: { espacios: 3, nivel: 5 },
  17: { espacios: 4, nivel: 5 },
  18: { espacios: 4, nivel: 5 },
  19: { espacios: 4, nivel: 5 },
  20: { espacios: 4, nivel: 5 }
};

// ==========================================
// 4. PLANTILLA LIMPIA Y BÁSICA POR DEFECTO
// ==========================================

export const PERSONAJE_POR_DEFECTO: PersonajeJugador = {
  id: "pj-defecto-1",
  nombre: "Nuevo Personaje",
  jugador: "",
  clase: "",
  subclase: "",
  clases: [{ nombre: "Guerrero", subclase: "", nivel: 1 }],
  nivel: 1,
  especie: "Humano",
  subespecie: "",
  tamano: "Mediano",
  trasfondo: "Personalizado",
  alineacion: "Neutral",
  experiencia: 0,
  avatarUrl: "",
  idMiniaturaTS: null,
  inspiracion: false,
  caracteristicas: {
    fuerza: 10,
    destreza: 10,
    constitucion: 10,
    inteligencia: 10,
    sabiduria: 10,
    carisma: 10
  },
  overridesFijos: {
    fuerza: null,
    destreza: null,
    constitucion: null,
    inteligencia: null,
    sabiduria: null,
    carisma: null
  },
  personalizacionesCaracteristicas: {},
  competenciasSalvacion: {
    fuerza: false,
    destreza: false,
    constitucion: false,
    inteligencia: false,
    sabiduria: false,
    carisma: false
  },
  gradosHabilidades: {
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
  },
  personalizacionesHabilidades: {},
  hpMaximoBase: 10,
  hpMaximo: 10,
  hpActual: 10,
  hpTemporal: 0,
  tipoDadoGolpe: "d10",
  dadosGolpeTotal: 1,
  dadosGolpeRestantes: 1,
  salvacionesMuerte: { exitos: 0, fallos: 0 },
  cansancio: 0,
  condicionesActivas: [],
  ca: 10,
  caNotas: "",
  iniciativaBono: 0,
  velocidad: "30 pies",
  sentidos: "",
  competenciasArmas: "",
  competenciasArmasGrupos: [],
  competenciasArmasLista: [],
  competenciasArmaduras: "",
  competenciasArmadurasGrupos: [],
  competenciasArmadurasLista: [],
  idiomas: "Común",
  idiomasLista: ["Común"],
  herramientas: "",
  herramientasLista: [],

  // Lanzamiento de Conjuros y Magia (Apartado D)
  esLanzador: false,
  clasesLanzadoras: [],
  concentracionActiva: null,
  trucosConocidosIds: [],
  conjurosConocidosIds: [],
  conjurosPreparadosIds: [],
  conjurosSiemprePreparadosIds: [],
  espaciosConjuroMaximos: {},
  espaciosConjuroGastados: {},
  puntosConjuroMaximos: 0,
  puntosConjuroGastados: 0,
  nivelConjuroMaximo: 0,
  espaciosPactoMaximos: 0,
  espaciosPactoGastados: 0,
  nivelEspacioPacto: 0,
  arcanoMisticoIds: [],
  arcanoMisticoGastados: [],
  puntosHechiceriaMaximos: 0,
  puntosHechiceriaActuales: 0,
  overrideEspaciosConjuro: null,
  overridePuntosConjuro: null,

  // Inventario y Equipo (Apartado E)
  inventario: [],
  bolsaMonedas: { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 },

  // Rasgos, Dotes y Personalizaciones (Apartado F)
  rasgos: [],
  dotes: []
};

