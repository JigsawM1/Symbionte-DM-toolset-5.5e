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
// 3. PLANTILLA LIMPIA Y BÁSICA POR DEFECTO
// ==========================================

export const PERSONAJE_POR_DEFECTO: PersonajeJugador = {
  id: "pj-defecto-1",
  nombre: "Nuevo Personaje",
  jugador: "",
  clase: "",
  subclase: "",
  nivel: 1,
  especie: "Humano",
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
  herramientasLista: []
};

