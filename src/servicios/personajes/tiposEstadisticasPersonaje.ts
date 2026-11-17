/**
 * tiposEstadisticasPersonaje.ts
 * -----------------------------
 * Contratos públicos e intermedios inmutables para las etapas de cálculo
 * de estadísticas de personajes de D&D 5.5e (2024), junto con normalización
 * y tablas estáticas de búsqueda O(1).
 */

import type {
  Caracteristica,
  EfectoPasivo,
  GradoCompetencia,
  Habilidad,
  ObjetoBase,
  ObjetoHomebrew,
  ObjetoInventario
} from "@/tipos";
import { MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes/personajeConstantes";
import type { obtenerCompetenciasExtraRasgos } from "@/servicios/rasgos/evaluadorSalvacionesRasgos";

const REGEX_DIACRITICOS = /[\u0300-\u036f]/g;

/** Desglose completo de la Clase de Armadura efectiva de un personaje. */
export interface InformacionCA {
  total: number;
  base: number;
  modDestrezaAplicado: number;
  bonoEscudo: number;
  bonosMagicos: number;
  armaduraEquipadaNombre: string | null;
  escudoEquipadoNombre: string | null;
  tipoArmadura: "Sin Armadura" | "Ligera" | "Mediana" | "Pesada";
  desglose: string;
  desventajaSigilo?: boolean;
}

/** Estado de competencia sobre la armadura y escudo equipados. */
export interface PenalizacionArmadura {
  sinCompetencia: boolean;
  armaduraNoCompetente: string | null;
  escudoNoCompetente: string | null;
}

/** Textos resumidos de competencias efectivas derivadas del personaje. */
export interface CompetenciasEfectivasTexto {
  armasTexto: string;
  armadurasTexto: string;
  herramientasTexto: string;
  herramientasLista: string[];
  idiomasTexto?: string;
}

/** Estadísticas y bonificadores dinámicos calculados a partir de un personaje. */
export interface EstadisticasCalculadasPersonaje {
  bonoCompetencia: number;
  puntuacionesEfectivas: Record<Caracteristica, number>;
  modificadores: Record<Caracteristica, number>;
  salvaciones: Record<Caracteristica, number>;
  habilidades: Record<Habilidad, number>;
  gradosHabilidadesEfectivos: Record<Habilidad, GradoCompetencia>;
  pasivas: {
    percepcion: number;
    investigacion: number;
    perspicacia: number;
  };
  claseArmadura: InformacionCA;
  penalizacionArmadura: PenalizacionArmadura;
  desventajaSigiloArmadura: boolean;
  bonoVelocidadRasgos: number;
  bonoHPMaximoRasgos: number;
  hpMaximoEfectivo: number;
  bonoDanoFuria: number;
  competenciasEfectivas: CompetenciasEfectivasTexto;
}

/** Resultado intermedio de la resolución de inventario y efectos pasivos activos. */
export interface ContextoInventarioResuelto {
  readonly efectosPasivosActivos: readonly EfectoPasivo[];
  readonly bonosModificadorDirectoArmadura: number;
  readonly armaduraEquipada: ObjetoInventario | undefined;
  readonly escudoEquipado: ObjetoInventario | undefined;
  readonly armaduraCatalogo: ObjetoHomebrew | ObjetoBase | undefined;
  readonly escudoCatalogo: ObjetoHomebrew | ObjetoBase | undefined;
}

/** Resultado intermedio de puntuaciones efectivas y modificadores. */
export interface ResultadoCaracteristicasPersonaje {
  readonly puntuacionesEfectivas: Record<Caracteristica, number>;
  readonly modificadores: Record<Caracteristica, number>;
}

/** Resultado intermedio de habilidades, grados efectivos y puntuaciones pasivas. */
export interface ResultadoHabilidadesYPasivas {
  readonly habilidades: Record<Habilidad, number>;
  readonly gradosHabilidadesEfectivos: Record<Habilidad, GradoCompetencia>;
  readonly pasivas: {
    readonly percepcion: number;
    readonly investigacion: number;
    readonly perspicacia: number;
  };
}

/** Resultado intermedio de Clase de Armadura, sigilo y penalización de equipo. */
export interface ResultadoArmaduraYPenalizacion {
  readonly claseArmadura: InformacionCA;
  readonly penalizacionArmadura: PenalizacionArmadura;
  readonly desventajaSigiloArmadura: boolean;
}

/** Competencias adicionales otorgadas por rasgos activos del personaje. */
export type CompetenciasExtraRasgos = ReturnType<typeof obtenerCompetenciasExtraRasgos>;

export const COMPETENCIAS_EXTRA_VACIAS: CompetenciasExtraRasgos = {
  armasGrupos: [],
  armadurasGrupos: [],
  herramientas: [],
  salvaciones: [],
  idiomas: [],
  habilidades: [],
  pericias: []
};

export const LISTA_CARACTERISTICAS: readonly Caracteristica[] = [
  "fuerza",
  "destreza",
  "constitucion",
  "inteligencia",
  "sabiduria",
  "carisma"
];

/** Normaliza texto eliminando diacríticos y espacios extremos para búsquedas deterministas. */
export function normalizarTextoEstadistica(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(REGEX_DIACRITICOS, "")
    .trim();
}

export const MAPA_ALIAS_CARAC: Readonly<Record<string, Caracteristica>> = {
  fue: "fuerza",
  fuerza: "fuerza",
  str: "fuerza",
  des: "destreza",
  destreza: "destreza",
  dex: "destreza",
  con: "constitucion",
  constitucion: "constitucion",
  int: "inteligencia",
  inteligencia: "inteligencia",
  sab: "sabiduria",
  sabiduria: "sabiduria",
  wis: "sabiduria",
  car: "carisma",
  carisma: "carisma",
  cha: "carisma"
};

export const LISTA_HABILIDADES: readonly Habilidad[] = Object.keys(
  MAPA_HABILIDAD_A_CARACTERISTICA
) as Habilidad[];

export const MAPA_HABILIDAD_NORMALIZADA: ReadonlyMap<string, Habilidad> = new Map(
  LISTA_HABILIDADES.map((habilidad) => [normalizarTextoEstadistica(habilidad), habilidad])
);
