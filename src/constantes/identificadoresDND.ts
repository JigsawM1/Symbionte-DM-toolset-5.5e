import type { RasgoPersonaje } from "@/tipos";

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
 * Determina si una clase pertenece al sistema de Magia de Pacto (Brujo / Warlock).
 */
export function esClasePacto(nombreOIdClase: string = ""): boolean {
  const norm = normalizarIdentificador(nombreOIdClase);
  return norm.includes(ID_CLASE.BRUJO) || norm.includes("warlock");
}

/**
 * Determina si una clase lanzadora utiliza Carisma como atributo de lanzamiento principal.
 */
export function esLanzadorCarisma(nombreOIdClase: string = ""): boolean {
  const norm = normalizarIdentificador(nombreOIdClase);
  return (
    norm.includes(ID_CLASE.BRUJO) ||
    norm.includes(ID_CLASE.BARDO) ||
    norm.includes(ID_CLASE.HECHICERO) ||
    norm.includes(ID_CLASE.PALADIN) ||
    norm.includes("sorcerer") ||
    norm.includes("warlock") ||
    norm.includes("bard") ||
    norm.includes("paladin")
  );
}
