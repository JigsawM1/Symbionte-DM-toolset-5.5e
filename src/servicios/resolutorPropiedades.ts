/**
 * resolutorPropiedades.ts
 * -----------------------
 * Servicio centralizado para la resolución, normalización y descripción
 * técnica oficial (D&D 5.5e / 2024 y D&D 5e) de:
 * 1. Maestrías de Armas (Weapon Masteries).
 * 2. Propiedades de Armas (Weapon Properties).
 * 3. Propiedades de Armaduras y Escudos (Armor Properties).
 *
 * Utiliza el glosario de `@/constantes/equipoConstantes` como fuente de verdad.
 */

import {
  InfoPropiedad,
  DICCIONARIO_MAESTRIAS,
  DICCIONARIO_PROPIEDADES_ARMAS,
  INFO_ARMADURA_DESVENTAJA_SIGILO,
  INFO_ARMADURA_ESCUDO,
  INFO_ARMADURA_BONOS_DESTREZA,
  crearInfoRequisitoFuerza,
  crearInfoCaBase
} from "@/constantes/equipoConstantes";

export type { InfoPropiedad };
export { DICCIONARIO_MAESTRIAS, DICCIONARIO_PROPIEDADES_ARMAS };

/**
 * Normaliza un texto eliminando tildes, caracteres especiales y espacios sobrantes.
 */
export function normalizarClave(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Obtiene la información técnica estructurada de una maestría de arma.
 */
export function obtenerInfoMaestria(maestriaTexto?: string | null): InfoPropiedad {
  if (!maestriaTexto || !maestriaTexto.trim() || maestriaTexto.toLowerCase() === "ninguna") {
    return {
      titulo: "Sin Maestría",
      descripcion: "Esta arma no posee una propiedad de maestría activa.",
      textoCompleto: "Sin Maestría: Esta arma no posee una propiedad de maestría activa."
    };
  }

  const claveLimpia = normalizarClave(maestriaTexto);

  // 1. Coincidencia directa o parcial
  for (const [k, data] of Object.entries(DICCIONARIO_MAESTRIAS)) {
    if (claveLimpia === k || claveLimpia.includes(k)) {
      return {
        titulo: data.titulo,
        descripcion: data.descripcion,
        textoCompleto: `${data.titulo}: ${data.descripcion}`
      };
    }
  }

  // Fallback genérico si no se encuentra en el diccionario oficial
  return {
    titulo: `Maestría: ${maestriaTexto}`,
    descripcion: `Propiedad de maestría de armas (${maestriaTexto}). Se activa si el personaje tiene entrenamiento en maestrías de armas.`,
    textoCompleto: `Maestría: ${maestriaTexto}`
  };
}

/**
 * Obtiene la información técnica estructurada de una propiedad de arma.
 */
export function obtenerInfoPropiedadArma(propiedadTexto: string): InfoPropiedad {
  if (!propiedadTexto || !propiedadTexto.trim()) {
    return {
      titulo: "Propiedad",
      descripcion: "Propiedad de equipo.",
      textoCompleto: "Propiedad de equipo."
    };
  }

  const claveLimpia = normalizarClave(propiedadTexto);

  for (const [k, data] of Object.entries(DICCIONARIO_PROPIEDADES_ARMAS)) {
    if (claveLimpia === k || claveLimpia.startsWith(k) || claveLimpia.includes(k)) {
      return {
        titulo: data.titulo,
        descripcion: data.descripcion,
        textoCompleto: `${data.titulo}: ${data.descripcion}`
      };
    }
  }

  return {
    titulo: propiedadTexto,
    descripcion: `Propiedad especial de arma (${propiedadTexto}).`,
    textoCompleto: propiedadTexto
  };
}

/**
 * Obtiene la información técnica estructurada de una propiedad de armadura o escudo.
 */
export function obtenerInfoPropiedadArmadura(
  tipo: "desventajaSigilo" | "requisitoFuerza" | "bonoDestreza" | "escudo" | "caBase",
  valorExtra?: string | number
): InfoPropiedad {
  switch (tipo) {
    case "desventajaSigilo":
      return INFO_ARMADURA_DESVENTAJA_SIGILO;

    case "requisitoFuerza": {
      const fue = typeof valorExtra === "number" ? valorExtra : Number(valorExtra) || 13;
      return crearInfoRequisitoFuerza(fue);
    }

    case "bonoDestreza": {
      const tipoBono = normalizarClave(String(valorExtra || "Completo"));
      if (
        tipoBono.includes("sin bono") ||
        tipoBono.includes("sin") ||
        tipoBono.includes("ninguno") ||
        tipoBono.includes("none") ||
        tipoBono.includes("pesada") ||
        tipoBono.includes("no") ||
        tipoBono === "0"
      ) {
        return INFO_ARMADURA_BONOS_DESTREZA.sinBono;
      }
      if (
        tipoBono.includes("max 2") ||
        tipoBono.includes("max2") ||
        tipoBono.includes("mediana") ||
        tipoBono.includes("hasta +2") ||
        tipoBono.includes("hasta 2") ||
        tipoBono.includes("maximo 2") ||
        tipoBono === "2"
      ) {
        return INFO_ARMADURA_BONOS_DESTREZA.maximo2;
      }
      return INFO_ARMADURA_BONOS_DESTREZA.completo;
    }

    case "escudo":
      return INFO_ARMADURA_ESCUDO;

    case "caBase": {
      const ca = typeof valorExtra === "number" ? valorExtra : Number(valorExtra) || 10;
      return crearInfoCaBase(ca);
    }
  }
}
