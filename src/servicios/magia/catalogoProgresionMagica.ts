import type { ClaseLanzadora, TipoLanzador } from "@/tipos";
import { TIPO_LANZADOR_POR_CLASE } from "@/constantes";
import { TODAS_SUBCLASES_DND55 } from "@/constantes/clasesDND55";
import { obtenerNivelMaximoConjuroPorTipoClase } from "../clases/nivelConjuros";
import type {
  ConfiguracionLanzadorDetectada,
  EstrategiaProgresionLanzador,
  ResumenMaximosMagia
} from "./tiposMagia";

/**
 * Limita un nivel de clase al rango oficial D&D 5.5e (1..20).
 */
export function acotarNivelClase(nivel: number): number {
  return Math.min(20, Math.max(1, Math.floor(nivel) || 1));
}

/**
 * Normaliza una cadena para comparaciones insensibles a acentos y mayúsculas.
 */
export function normalizarTextoMagia(texto: string): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Catálogo declarativo de estrategias de progresión por tipo de lanzador (D&D 5.5e / 2024).
 */
export const ESTRATEGIAS_TIPO_LANZADOR: Readonly<Record<TipoLanzador, EstrategiaProgresionLanzador>> = {
  completo: {
    tipo: "completo",
    otorgaTrucosPorDefecto: () => true,
    calcularNivelEnMonoclase: (nivel) => acotarNivelClase(nivel),
    calcularNivelEfectivoRanurasMonoclase: (nivel) => acotarNivelClase(nivel),
    calcularAporteEnMulticlase: (nivel) => acotarNivelClase(nivel),
    obtenerNivelMaximoConjuro: (nivel) => obtenerNivelMaximoConjuroPorTipoClase("completo", nivel)
  },
  medio: {
    tipo: "medio",
    otorgaTrucosPorDefecto: () => false,
    // En D&D 2024, los semilanzadores obtienen ranuras desde nivel 1 en monoclase
    calcularNivelEnMonoclase: (nivel) => Math.max(1, Math.ceil(acotarNivelClase(nivel) / 2)),
    calcularNivelEfectivoRanurasMonoclase: (nivel) => Math.max(1, Math.ceil(acotarNivelClase(nivel) / 2)),
    calcularAporteEnMulticlase: (nivel) => Math.floor(acotarNivelClase(nivel) / 2),
    obtenerNivelMaximoConjuro: (nivel) => obtenerNivelMaximoConjuroPorTipoClase("medio", nivel)
  },
  tercio: {
    tipo: "tercio",
    otorgaTrucosPorDefecto: (nivel) => acotarNivelClase(nivel) >= 3,
    calcularNivelEnMonoclase: (nivel) => Math.floor(acotarNivelClase(nivel) / 3),
    calcularNivelEfectivoRanurasMonoclase: (nivel) => Math.ceil(acotarNivelClase(nivel) / 3),
    calcularAporteEnMulticlase: (nivel) => Math.floor(acotarNivelClase(nivel) / 3),
    obtenerNivelMaximoConjuro: (nivel) => obtenerNivelMaximoConjuroPorTipoClase("tercio", nivel)
  },
  pacto: {
    tipo: "pacto",
    otorgaTrucosPorDefecto: () => true,
    calcularNivelEnMonoclase: () => 0,
    calcularNivelEfectivoRanurasMonoclase: () => 0,
    calcularAporteEnMulticlase: () => 0,
    obtenerNivelMaximoConjuro: (nivel) => obtenerNivelMaximoConjuroPorTipoClase("pacto", nivel)
  },
  ninguno: {
    tipo: "ninguno",
    otorgaTrucosPorDefecto: () => false,
    calcularNivelEnMonoclase: () => 0,
    calcularNivelEfectivoRanurasMonoclase: () => 0,
    calcularAporteEnMulticlase: () => 0,
    obtenerNivelMaximoConjuro: () => 0
  }
};

const TRUCOS_3_A_5: readonly number[] = [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
const TRUCOS_2_A_4: readonly number[] = [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
const TRUCOS_CERO: readonly number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

/**
 * Tablas oficiales de Trucos Conocidos por nivel de clase (D&D 5.5e / 2024).
 */
export const TRUCOS_POR_CLASE_Y_NIVEL: Readonly<Record<string, readonly number[]>> = {
  mago: TRUCOS_3_A_5,
  clerigo: TRUCOS_3_A_5,
  brujo: TRUCOS_2_A_4,
  druida: TRUCOS_2_A_4,
  bardo: TRUCOS_2_A_4,
  hechicero: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  paladin: TRUCOS_CERO,
  explorador: TRUCOS_CERO,
  "caballero arcano": [0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  "embaucador arcano": [0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
};

const CONJUROS_COMPLETO: readonly number[] = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
const CONJUROS_MEDIO: readonly number[] = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15];
const CONJUROS_TERCIO: readonly number[] = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];

/**
 * Tablas oficiales de Conjuros Preparados / Conocidos por nivel de clase (D&D 5.5e / 2024).
 */
export const CONJUROS_POR_CLASE_Y_NIVEL: Readonly<Record<string, readonly number[]>> = {
  mago: CONJUROS_COMPLETO,
  clerigo: CONJUROS_COMPLETO,
  druida: CONJUROS_COMPLETO,
  bardo: CONJUROS_COMPLETO,
  brujo: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  hechicero: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  paladin: CONJUROS_MEDIO,
  explorador: CONJUROS_MEDIO,
  "caballero arcano": CONJUROS_TERCIO,
  "embaucador arcano": CONJUROS_TERCIO
};

interface ReglaClaveClase {
  readonly clave: string;
  readonly patrones: readonly string[];
  readonly requiereTercio?: boolean;
}

const REGLAS_CLAVE_CLASE: readonly ReglaClaveClase[] = [
  { clave: "mago", patrones: ["mago", "wizard"] },
  { clave: "brujo", patrones: ["brujo", "warlock"] },
  { clave: "hechicero", patrones: ["hechicero", "sorcerer"] },
  { clave: "clerigo", patrones: ["clerigo", "cleric"] },
  { clave: "druida", patrones: ["druida", "druid"] },
  { clave: "bardo", patrones: ["bardo", "bard"] },
  { clave: "paladin", patrones: ["paladin"] },
  { clave: "explorador", patrones: ["explorador", "ranger"] },
  { clave: "caballero arcano", patrones: ["caballero", "eldritch"] },
  { clave: "caballero arcano", patrones: ["guerrero"], requiereTercio: true },
  { clave: "embaucador arcano", patrones: ["embaucador", "trickster"] },
  { clave: "embaucador arcano", patrones: ["picaro"], requiereTercio: true }
];

const ALIAS_TERCIO_SUBCLASE: readonly { patrones: readonly string[]; claveCatalogo: string }[] = [
  { patrones: ["caballero arcano", "eldritch knight"], claveCatalogo: "caballero arcano" },
  { patrones: ["embaucador arcano", "arcane trickster"], claveCatalogo: "embaucador arcano" }
];

const MAPA_TIPO_LANZADOR_CLASE: ReadonlyMap<string, ConfiguracionLanzadorDetectada> = new Map(
  Object.entries(TIPO_LANZADOR_POR_CLASE).map(([nombre, config]) => [nombre.toLowerCase(), config])
);

/**
 * Resuelve la clave canónica de tabla de conjuros/trucos a partir del nombre de clase o subclase.
 */
export function normalizarClaveClaseMagica(nombre: string, tipoLanzador?: TipoLanzador): string {
  const norm = normalizarTextoMagia(nombre);
  if (!norm) return tipoLanzador === "tercio" ? "caballero arcano" : "";

  for (const regla of REGLAS_CLAVE_CLASE) {
    if (regla.requiereTercio && tipoLanzador !== "tercio") continue;
    if (regla.patrones.some((patron) => norm.includes(patron))) {
      return regla.clave;
    }
  }

  return tipoLanzador === "tercio" ? "caballero arcano" : norm;
}

/**
 * Detecta automáticamente la configuración de lanzador predeterminada de una clase y subclase.
 */
export function detectarTipoLanzador(
  clase: string,
  subclase?: string
): ConfiguracionLanzadorDetectada | null {
  const claseLimpia = clase?.trim() || "";
  const subclaseLimpia = subclase?.trim() || "";
  const claseLower = claseLimpia.toLowerCase();
  const subclaseLower = subclaseLimpia.toLowerCase();

  const definicion = TODAS_SUBCLASES_DND55.find(
    (s) =>
      s.clasePadre.toLowerCase() === claseLower &&
      (s.nombre.toLowerCase() === subclaseLower || s.id === subclaseLimpia)
  );
  const configuracion =
    definicion?.rasgos.find((r) => r.configuracionMagica)?.configuracionMagica ??
    definicion?.configuracionMagica;

  if (configuracion) {
    return {
      tipo: configuracion.tipoLanzador,
      habilidad: configuracion.habilidadConjuro,
      modelo: configuracion.modeloConjuros,
      listaConjuros: configuracion.listaConjuros
    };
  }

  for (const alias of ALIAS_TERCIO_SUBCLASE) {
    if (alias.patrones.some((patron) => subclaseLower.includes(patron))) {
      return MAPA_TIPO_LANZADOR_CLASE.get(alias.claveCatalogo) ?? null;
    }
  }

  return MAPA_TIPO_LANZADOR_CLASE.get(claseLower) ?? null;
}

/**
 * Calcula la cantidad máxima oficial de Trucos y Conjuros (Preparados o Conocidos) del personaje.
 */
export function calcularMaximosConjurosYTrucos(
  clasesLanzadoras: readonly ClaseLanzadora[],
  nivelTotalPersonaje: number = 1,
  modificadorHabilidad: number = 0
): ResumenMaximosMagia {
  if (!clasesLanzadoras || clasesLanzadoras.length === 0) {
    return { maxTrucos: 0, maxConjuros: 0, modelo: "preparados" };
  }

  let totalMaxTrucos = 0;
  let totalMaxConjuros = 0;
  let requierePreparacion = false;
  let esGrimorio = false;
  let huboCoincidencia = false;

  for (const claseItem of clasesLanzadoras) {
    const clave = normalizarClaveClaseMagica(claseItem.clase, claseItem.tipoLanzador);
    const niv = acotarNivelClase(claseItem.nivel);

    if (claseItem.modeloConjuros === "grimorio" || clave === "mago") {
      esGrimorio = true;
      requierePreparacion = true;
    } else if (claseItem.modeloConjuros === "preparados") {
      requierePreparacion = true;
    }

    const tablaTrucos = TRUCOS_POR_CLASE_Y_NIVEL[clave];
    const tablaConjuros = CONJUROS_POR_CLASE_Y_NIVEL[clave];

    if (tablaTrucos && tablaConjuros) {
      huboCoincidencia = true;
      totalMaxTrucos += tablaTrucos[niv - 1] ?? 0;
      totalMaxConjuros += tablaConjuros[niv - 1] ?? 0;
    }
  }

  if (!huboCoincidencia) {
    const niv = acotarNivelClase(nivelTotalPersonaje);
    totalMaxTrucos = Math.max(2, Math.floor(niv / 4) + 2);
    totalMaxConjuros = Math.max(1, niv + Math.max(0, modificadorHabilidad));
    requierePreparacion = clasesLanzadoras.some(
      (c) => c.modeloConjuros === "preparados" || c.modeloConjuros === "grimorio"
    );
    esGrimorio = clasesLanzadoras.some((c) => c.modeloConjuros === "grimorio");
  }

  return {
    maxTrucos: totalMaxTrucos,
    maxConjuros: totalMaxConjuros,
    modelo: esGrimorio ? "grimorio" : requierePreparacion ? "preparados" : "conocidos"
  };
}
