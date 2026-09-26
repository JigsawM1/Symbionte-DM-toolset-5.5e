/**
 * equipoConstantes.ts
 * -------------------
 * Glosario y constantes centrales de Equipo, Armas, Armaduras, Escudos,
 * Maestrías y Propiedades oficiales de D&D 5.5e (PHB 2024) y D&D 5e.
 */

import MAESTRIAS_JSON from "@/datos/maestrias-armas.json";
import PROPIEDADES_JSON from "@/datos/propiedades-armas.json";
import {
  EsquemaMaestriaArmaJSON,
  EsquemaPropiedadArmaJSON
} from "@/tipos/esquemasCatalogos";
import { validarColeccionJSON } from "@/servicios/cargadorCatalogos";

export interface InfoPropiedad {
  titulo: string;
  descripcion: string;
  textoCompleto: string;
}

export interface InformacionVeneno {
  nombre: string;
  costo: number;
  tipo: "Contacto" | "Ingerido" | "Inhalado" | "Lesión";
  cd: number;
  descripcion: string;
}

// ============================================================================
// 1. LISTAS PARA SELECTORES Y FORMULARIOS DE CREACIÓN (HOMEBREW / COMPENDIO)
// ============================================================================

/** Opciones de Maestrías de Armas oficiales de D&D 5.5e (PHB 2024) */
export const MAESTRIAS_DND_55: readonly string[] = [
  "Ninguna",
  "Cleave (Hender)",
  "Graze (Rozar)",
  "Nick (Mellar)",
  "Push (Empujar)",
  "Sap (Debilitar)",
  "Slow (Ralentizar)",
  "Topple (Derribar)",
  "Vex (Molestar)"
];

/** Opciones de Propiedades de Armas oficiales de D&D 5.5e (PHB 2024) */
export const PROPIEDADES_ARMAS_DND: readonly string[] = [
  "Sutil",
  "Versátil",
  "Pesada",
  "Ligera",
  "Carga",
  "Alcance",
  "Arrojadiza",
  "A dos manos",
  "Munición",
  "Especial"
];

// ============================================================================
// 2. EXPLICACIONES DIRECTAS PARA FORMULARIOS
// ============================================================================

const CATALOGO_MAESTRIAS = validarColeccionJSON(
  MAESTRIAS_JSON,
  EsquemaMaestriaArmaJSON,
  "maestrias-armas"
);

const CATALOGO_PROPIEDADES = validarColeccionJSON(
  PROPIEDADES_JSON,
  EsquemaPropiedadArmaJSON,
  "propiedades-armas"
);

/** Explicaciones de Propiedades de Armas indexadas por su etiqueta de selector */
export const EXPLICACIONES_PROPIEDADES: Record<string, string> = Object.fromEntries(
  CATALOGO_PROPIEDADES
    .filter((p) => p.etiquetaSelector)
    .map((p) => [p.etiquetaSelector!, p.explicacionSelector ?? p.descripcion])
);

/** Explicaciones de Maestrías de Armas indexadas por su etiqueta de selector */
export const EXPLICACIONES_MAESTRIAS: Record<string, string> = {
  "Ninguna": "",
  ...Object.fromEntries(
    CATALOGO_MAESTRIAS.map((m) => [m.etiquetaSelector ?? m.titulo, m.explicacionSelector ?? m.descripcion])
  )
};

// ============================================================================
// 3. DICCIONARIOS MAESTROS DE NORMALIZACIÓN BILINGÜE Y MULTI-ALIAS
// ============================================================================

/** Diccionario maestro de Maestrías oficiales D&D 5.5e (2024) normalizadas */
export const DICCIONARIO_MAESTRIAS: Record<string, { titulo: string; descripcion: string }> =
  Object.fromEntries(
    CATALOGO_MAESTRIAS.flatMap((m) =>
      m.aliases.map((alias) => [alias, { titulo: m.titulo, descripcion: m.descripcion }])
    )
  );

/** Diccionario maestro de Propiedades de Armas normalizadas */
export const DICCIONARIO_PROPIEDADES_ARMAS: Record<string, { titulo: string; descripcion: string }> =
  Object.fromEntries(
    CATALOGO_PROPIEDADES.flatMap((p) =>
      p.aliases.map((alias) => [alias, { titulo: p.titulo, descripcion: p.descripcion }])
    )
  );

// ============================================================================
// 4. CONSTANTES Y DESCRIPCIONES DE ARMADURAS Y ESCUDOS
// ============================================================================

export const INFO_ARMADURA_DESVENTAJA_SIGILO: InfoPropiedad = {
  titulo: "Desventaja en Sigilo",
  descripcion: "Llevar puesta esta armadura impone automáticamente Desventaja en todas las pruebas de Destreza (Sigilo) debido a su peso, rigidez o sonido metálico.",
  textoCompleto: "Desventaja en Sigilo: Impone Desventaja en pruebas de Destreza (Sigilo)."
};

export const INFO_ARMADURA_ESCUDO: InfoPropiedad = {
  titulo: "Escudo (+2 CA)",
  descripcion: "Empuñar un escudo equipado otorga un bonificador de +2 a tu Clase de Armadura. Solo puedes beneficiarte de un escudo a la vez.",
  textoCompleto: "Escudo: +2 a la CA mientras esté equipado."
};

export const INFO_ARMADURA_BONOS_DESTREZA = {
  sinBono: {
    titulo: "Bono de Destreza: Sin Bono",
    descripcion: "Esta armadura pesada no suma el modificador de Destreza a la Clase de Armadura (tampoco se resta si tu Destreza es negativa).",
    textoCompleto: "Bono de Destreza: Sin Bono (Armadura Pesada)."
  },
  maximo2: {
    titulo: "Bono de Destreza: Máximo +2",
    descripcion: "Esta armadura mediana suma tu modificador de Destreza a la CA hasta un máximo de +2.",
    textoCompleto: "Bono de Destreza: Máximo +2 (Armadura Mediana)."
  },
  completo: {
    titulo: "Bono de Destreza: Completo",
    descripcion: "Esta armadura ligera suma tu modificador de Destreza completo a tu Clase de Armadura.",
    textoCompleto: "Bono de Destreza: Completo (Armadura Ligera)."
  }
} as const;

/** Crea la estructura InfoPropiedad para un requisito de fuerza específico */
export function crearInfoRequisitoFuerza(fuerza: number): InfoPropiedad {
  return {
    titulo: `Fuerza Requerida (${fuerza})`,
    descripcion: `Si la puntuación de Fuerza del personaje es menor que ${fuerza}, su velocidad terrestre se reduce en 10 pies a menos que cuente con rasgos raciales especiales.`,
    textoCompleto: `Fuerza Requerida ${fuerza}: Si la Fuerza es menor, la velocidad se reduce en 10 pies.`
  };
}

/** Crea la estructura InfoPropiedad para una CA base específica */
export function crearInfoCaBase(caBase: number): InfoPropiedad {
  return {
    titulo: `Clase de Armadura Base (${caBase})`,
    descripcion: `Valor base de protección que otorga esta armadura antes de sumar bonificadores de Destreza o magia.`,
    textoCompleto: `CA Base: ${caBase}`
  };
}

/**
 * Tabla de referencia de armaduras oficiales de D&D 5.5e
 */
export interface ReferenciaArmadura {
  caBase: number;
  tipo: "Ligera" | "Mediana" | "Pesada";
  limiteDes: number | null; // null = sin límite, 2 = máx +2, 0 = no suma
  desventajaSigilo?: boolean;
}

export const ARMADURAS_OFICIALES: Record<string, ReferenciaArmadura> = {
  "acolchada": { caBase: 11, tipo: "Ligera", limiteDes: null, desventajaSigilo: true },
  "armadura acolchada": { caBase: 11, tipo: "Ligera", limiteDes: null, desventajaSigilo: true },
  "cuero": { caBase: 11, tipo: "Ligera", limiteDes: null },
  "armadura de cuero": { caBase: 11, tipo: "Ligera", limiteDes: null },
  "cuero tachonado": { caBase: 12, tipo: "Ligera", limiteDes: null },
  "armadura de cuero tachonado": { caBase: 12, tipo: "Ligera", limiteDes: null },

  "pieles": { caBase: 12, tipo: "Mediana", limiteDes: 2 },
  "armadura de pieles": { caBase: 12, tipo: "Mediana", limiteDes: 2 },
  "camison de malla": { caBase: 13, tipo: "Mediana", limiteDes: 2 },
  "camisa de malla": { caBase: 13, tipo: "Mediana", limiteDes: 2 },
  "cota de escamas": { caBase: 14, tipo: "Mediana", limiteDes: 2, desventajaSigilo: true },
  "coraza": { caBase: 14, tipo: "Mediana", limiteDes: 2 },
  "semiplacas": { caBase: 15, tipo: "Mediana", limiteDes: 2, desventajaSigilo: true },
  "semi-placas": { caBase: 15, tipo: "Mediana", limiteDes: 2, desventajaSigilo: true },

  "cota de anillas": { caBase: 14, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "cota de malla": { caBase: 16, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "bandas": { caBase: 17, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "cota de bandas": { caBase: 17, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "placas": { caBase: 18, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "armadura de placas": { caBase: 18, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true }
};
