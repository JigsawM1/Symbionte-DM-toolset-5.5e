import type { RasgoPersonaje, Caracteristica } from "@/tipos";

/**
 * Identificadores canónicos normalizados de clases de D&D 5.5e.
 */
export const ID_CLASE = {
  BARBARO: "barbaro",
  BARDO: "bardo",
  BRUJO: "brujo",
  CLERIGO: "clerigo",
  DRUIDA: "druida",
  EXPLORADOR: "explorador",
  GUERRERO: "guerrero",
  HECHICERO: "hechicero",
  MAGO: "mago",
  MONJE: "monje",
  PALADIN: "paladin",
  PICARO: "picaro"
} as const;

export type IdClaseCanonico = typeof ID_CLASE[keyof typeof ID_CLASE];

/**
 * Identificadores canónicos normalizados de rasgos tácticos especiales.
 */
export const ID_RASGO = {
  FURIA: "furia",
  FRENESI: "frenesi",
  GOLPE_BRUTAL: "golpe_brutal",
  FURIA_DIVINA: "furia_divina",
  ATAQUE_TEMERARIO: "ataque_temerario"
} as const;

export type IdRasgoCanonico = typeof ID_RASGO[keyof typeof ID_RASGO];

/**
 * Normaliza cadenas de texto para comparaciones de identificadores sin distinción de mayúsculas ni diacríticos.
 */
export function normalizarIdentificador(cadena: string = ""): string {
  return cadena
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .trim();
}

/**
 * Comprueba si un rasgo coincide con un identificador canónico o contiene su clave en su nombre/id normalizado.
 */
export function coincideIdRasgo(rasgo: RasgoPersonaje, idBuscado: string): boolean {
  if (!rasgo) return false;
  const idNormBuscado = normalizarIdentificador(idBuscado);
  const idNormRasgo = normalizarIdentificador(rasgo.id);
  const nomNormRasgo = normalizarIdentificador(rasgo.nombre);

  return (
    idNormRasgo === idNormBuscado ||
    idNormRasgo.includes(idNormBuscado) ||
    nomNormRasgo === idNormBuscado ||
    nomNormRasgo.includes(idNormBuscado)
  );
}

/**
 * Conjunto declarativo de clases e identificadores asociados a Magia de Pacto.
 */
export const CLASES_PACTO: ReadonlySet<string> = new Set([
  ID_CLASE.BRUJO,
  "warlock"
]);

/**
 * Conjunto declarativo de clases e identificadores asociados a Carisma como atributo de conjuros.
 */
export const CLASES_LANZADORAS_CARISMA: ReadonlySet<string> = new Set([
  ID_CLASE.BRUJO,
  ID_CLASE.BARDO,
  ID_CLASE.HECHICERO,
  ID_CLASE.PALADIN,
  "warlock",
  "bard",
  "sorcerer",
  "paladin"
]);

/**
 * Conjunto declarativo de clases e identificadores asociados a Sabiduría como atributo de conjuros.
 */
export const CLASES_LANZADORAS_SABIDURIA: ReadonlySet<string> = new Set([
  ID_CLASE.CLERIGO,
  ID_CLASE.DRUIDA,
  ID_CLASE.EXPLORADOR,
  "cleric",
  "druid",
  "ranger"
]);

/**
 * Conjunto declarativo de clases e identificadores asociados a Inteligencia como atributo de conjuros.
 */
export const CLASES_LANZADORAS_INTELIGENCIA: ReadonlySet<string> = new Set([
  ID_CLASE.MAGO,
  "mago",
  "wizard",
  "artificer",
  "artifice"
]);

/**
 * Conjunto declarativo de clases e identificadores asociados a Bárbaro.
 */
export const CLASES_BARBARO: ReadonlySet<string> = new Set([
  ID_CLASE.BARBARO,
  "barbarian"
]);

/**
 * Determina si una clase pertenece al sistema de Magia de Pacto (Brujo / Warlock).
 */
export function esClasePacto(nombreOIdClase: string = ""): boolean {
  const norm = normalizarIdentificador(nombreOIdClase);
  if (!norm) return false;
  if (CLASES_PACTO.has(norm)) return true;
  for (const clase of CLASES_PACTO) {
    if (norm.includes(clase)) return true;
  }
  return false;
}

/**
 * Determina si una clase lanzadora utiliza Carisma como atributo de lanzamiento principal.
 */
export function esLanzadorCarisma(nombreOIdClase: string = ""): boolean {
  const norm = normalizarIdentificador(nombreOIdClase);
  if (!norm) return false;
  if (CLASES_LANZADORAS_CARISMA.has(norm)) return true;
  for (const clase of CLASES_LANZADORAS_CARISMA) {
    if (norm.includes(clase)) return true;
  }
  return false;
}

/**
 * Determina si una clase lanzadora utiliza Sabiduría como atributo de lanzamiento principal.
 */
export function esLanzadorSabiduria(nombreOIdClase: string = ""): boolean {
  const norm = normalizarIdentificador(nombreOIdClase);
  if (!norm) return false;
  if (CLASES_LANZADORAS_SABIDURIA.has(norm)) return true;
  for (const clase of CLASES_LANZADORAS_SABIDURIA) {
    if (norm.includes(clase)) return true;
  }
  return false;
}

/**
 * Determina si una clase lanzadora utiliza Inteligencia como atributo de lanzamiento principal.
 */
export function esLanzadorInteligencia(nombreOIdClase: string = ""): boolean {
  const norm = normalizarIdentificador(nombreOIdClase);
  if (!norm) return false;
  if (CLASES_LANZADORAS_INTELIGENCIA.has(norm)) return true;
  for (const clase of CLASES_LANZADORAS_INTELIGENCIA) {
    if (norm.includes(clase)) return true;
  }
  return false;
}

/**
 * Resuelve de forma declarativa el atributo de lanzamiento principal para una clase o ID dado.
 */
export function resolverAtributoConjuroClase(nombreOIdClase: string = ""): Caracteristica | null {
  if (esLanzadorCarisma(nombreOIdClase)) return "carisma";
  if (esLanzadorSabiduria(nombreOIdClase)) return "sabiduria";
  if (esLanzadorInteligencia(nombreOIdClase)) return "inteligencia";
  return null;
}

/**
 * Determina si una clase corresponde a Bárbaro.
 */
export function esClaseBarbaro(nombreOIdClase: string = ""): boolean {
  const norm = normalizarIdentificador(nombreOIdClase);
  if (!norm) return false;
  if (CLASES_BARBARO.has(norm)) return true;
  for (const clase of CLASES_BARBARO) {
    if (norm.includes(clase)) return true;
  }
  return false;
}


