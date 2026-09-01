/**
 * resolutorPropiedades.ts
 * -----------------------
 * Servicio centralizado para la resolución, normalización y descripción
 * técnica oficial (D&D 5.5e / 2024 y D&D 5e) de:
 * 1. Maestrías de Armas (Weapon Masteries).
 * 2. Propiedades de Armas (Weapon Properties).
 * 3. Propiedades de Armaduras y Escudos (Armor Properties).
 */

export interface InfoPropiedad {
  titulo: string;
  descripcion: string;
  textoCompleto: string;
}

/** Diccionario maestro de Maestrías oficiales D&D 5.5e (2024) */
export const DICCIONARIO_MAESTRIAS: Record<string, { titulo: string; descripcion: string }> = {
  "cleave": {
    titulo: "Hender",
    descripcion: "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes realizar otro ataque contra una segunda criatura a 5 pies de la primera que esté a tu alcance. Si impactas, la segunda criatura recibe el daño del arma (sin sumar tu modificador de característica a menos que sea negativo). Máximo una vez por turno."
  },
  "hender": {
    titulo: "Hender",
    descripcion: "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes realizar otro ataque contra una segunda criatura a 5 pies de la primera que esté a tu alcance. Si impactas, la segunda criatura recibe el daño del arma (sin sumar tu modificador de característica a menos que sea negativo). Máximo una vez por turno."
  },
  "tajo": {
    titulo: "Hender",
    descripcion: "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes realizar otro ataque contra una segunda criatura a 5 pies de la primera que esté a tu alcance. Si impactas, la segunda criatura recibe el daño del arma (sin sumar tu modificador de característica a menos que sea negativo). Máximo una vez por turno."
  },
  "graze": {
    titulo: "Rozar",
    descripcion: "Si fallas una tirada de ataque contra una criatura, aun así le infliges daño igual al modificador de la característica que usaste para el ataque. Este daño es del mismo tipo que el arma y no se puede incrementar salvo aumentando dicho modificador."
  },
  "rozar": {
    titulo: "Rozar",
    descripcion: "Si fallas una tirada de ataque contra una criatura, aun así le infliges daño igual al modificador de la característica que usaste para el ataque. Este daño es del mismo tipo que el arma y no se puede incrementar salvo aumentando dicho modificador."
  },
  "roce": {
    titulo: "Rozar",
    descripcion: "Si fallas una tirada de ataque contra una criatura, aun así le infliges daño igual al modificador de la característica que usaste para el ataque. Este daño es del mismo tipo que el arma y no se puede incrementar salvo aumentando dicho modificador."
  },
  "nick": {
    titulo: "Mellar",
    descripcion: "Puedes realizar el ataque adicional otorgado por la propiedad Ligera como parte de la misma Acción de Atacar en lugar de consumir tu Acción Adicional. Solo puedes realizar este ataque extra una vez por turno."
  },
  "corte": {
    titulo: "Mellar",
    descripcion: "Puedes realizar el ataque adicional otorgado por la propiedad Ligera como parte de la misma Acción de Atacar en lugar de consumir tu Acción Adicional. Solo puedes realizar este ataque extra una vez por turno."
  },
  "golpe rapido": {
    titulo: "Mellar",
    descripcion: "Puedes realizar el ataque adicional otorgado por la propiedad Ligera como parte de la misma Acción de Atacar en lugar de consumir tu Acción Adicional. Solo puedes realizar este ataque extra una vez por turno."
  },
  "push": {
    titulo: "Empujar",
    descripcion: "Si impactas a una criatura con este ataque, puedes empujarla hasta 10 pies en línea recta lejos de ti (siempre que la criatura sea de tamaño Grande o menor)."
  },
  "empuje": {
    titulo: "Empujar",
    descripcion: "Si impactas a una criatura con este ataque, puedes empujarla hasta 10 pies en línea recta lejos de ti (siempre que la criatura sea de tamaño Grande o menor)."
  },
  "empujar": {
    titulo: "Empujar",
    descripcion: "Si impactas a una criatura con este ataque, puedes empujarla hasta 10 pies en línea recta lejos de ti (siempre que la criatura sea de tamaño Grande o menor)."
  },
  "sap": {
    titulo: "Debilitar",
    descripcion: "Si impactas a una criatura, esta sufrirá Desventaja en su siguiente tirada de ataque realizada antes del inicio de tu siguiente turno."
  },
  "aturdir": {
    titulo: "Debilitar",
    descripcion: "Si impactas a una criatura, esta sufrirá Desventaja en su siguiente tirada de ataque realizada antes del inicio de tu siguiente turno."
  },
  "debilitar": {
    titulo: "Debilitar",
    descripcion: "Si impactas a una criatura, esta sufrirá Desventaja en su siguiente tirada de ataque realizada antes del inicio de tu siguiente turno."
  },
  "menoscabo": {
    titulo: "Debilitar",
    descripcion: "Si impactas a una criatura, esta sufrirá Desventaja en su siguiente tirada de ataque realizada antes del inicio de tu siguiente turno."
  },
  "slow": {
    titulo: "Ralentizar",
    descripcion: "Si impactas a una criatura y le infliges daño, su velocidad se reduce en 10 pies hasta el inicio de tu siguiente turno. Impactos sucesivos no acumulan la reducción de velocidad más allá de 10 pies."
  },
  "ralentizar": {
    titulo: "Ralentizar",
    descripcion: "Si impactas a una criatura y le infliges daño, su velocidad se reduce en 10 pies hasta el inicio de tu siguiente turno. Impactos sucesivos no acumulan la reducción de velocidad más allá de 10 pies."
  },
  "frenar": {
    titulo: "Ralentizar",
    descripcion: "Si impactas a una criatura y le infliges daño, su velocidad se reduce en 10 pies hasta el inicio de tu siguiente turno. Impactos sucesivos no acumulan la reducción de velocidad más allá de 10 pies."
  },
  "lentitud": {
    titulo: "Ralentizar",
    descripcion: "Si impactas a una criatura y le infliges daño, su velocidad se reduce en 10 pies hasta el inicio de tu siguiente turno. Impactos sucesivos no acumulan la reducción de velocidad más allá de 10 pies."
  },
  "topple": {
    titulo: "Derribar",
    descripcion: "Si impactas a una criatura, puedes forzarla a superar una tirada de salvación de Constitución (CD 8 + tu bono de competencia + mod de característica) o caer en condición de Derribada (Prone)."
  },
  "derribar": {
    titulo: "Derribar",
    descripcion: "Si impactas a una criatura, puedes forzarla a superar una tirada de salvación de Constitución (CD 8 + tu bono de competencia + mod de característica) o caer en condición de Derribada (Prone)."
  },
  "derribo": {
    titulo: "Derribar",
    descripcion: "Si impactas a una criatura, puedes forzarla a superar una tirada de salvación de Constitución (CD 8 + tu bono de competencia + mod de característica) o caer en condición de Derribada (Prone)."
  },
  "vex": {
    titulo: "Molestar",
    descripcion: "Si impactas a una criatura y le infliges daño, obtienes Ventaja en tu siguiente tirada de ataque contra esa misma criatura antes del final de tu siguiente turno."
  },
  "hostigar": {
    titulo: "Molestar",
    descripcion: "Si impactas a una criatura y le infliges daño, obtienes Ventaja en tu siguiente tirada de ataque contra esa misma criatura antes del final de tu siguiente turno."
  },
  "irritar": {
    titulo: "Molestar",
    descripcion: "Si impactas a una criatura y le infliges daño, obtienes Ventaja en tu siguiente tirada de ataque contra esa misma criatura antes del final de tu siguiente turno."
  },
  "acoso": {
    titulo: "Molestar",
    descripcion: "Si impactas a una criatura y le infliges daño, obtienes Ventaja en tu siguiente tirada de ataque contra esa misma criatura antes del final de tu siguiente turno."
  }
};

/** Diccionario maestro de Propiedades de Armas */
export const DICCIONARIO_PROPIEDADES_ARMAS: Record<string, { titulo: string; descripcion: string }> = {
  "sutil": {
    titulo: "Sutil",
    descripcion: "Al realizar un ataque con esta arma, puedes elegir libremente usar tu modificador de Fuerza o de Destreza para las tiradas de ataque y daño (debes usar el mismo para ambas)."
  },
  "finesse": {
    titulo: "Sutil",
    descripcion: "Al realizar un ataque con esta arma, puedes elegir libremente usar tu modificador de Fuerza o de Destreza para las tiradas de ataque y daño (debes usar el mismo para ambas)."
  },
  "ligera": {
    titulo: "Ligera",
    descripcion: "Cuando atacas con un arma ligera usando la Acción de Atacar, puedes realizar un ataque adicional con otra arma ligera en tu otra mano como Acción Adicional (o como parte de la acción si tienes la maestría Nick)."
  },
  "ligero": {
    titulo: "Ligera",
    descripcion: "Cuando atacas con un arma ligera usando la Acción de Atacar, puedes realizar un ataque adicional con otra arma ligera en tu otra mano como Acción Adicional (o como parte de la acción si tienes la maestría Nick)."
  },
  "light": {
    titulo: "Ligera",
    descripcion: "Cuando atacas con un arma ligera usando la Acción de Atacar, puedes realizar un ataque adicional con otra arma ligera en tu otra mano como Acción Adicional (o como parte de la acción si tienes la maestría Nick)."
  },
  "versatil": {
    titulo: "Versátil",
    descripcion: "Esta arma puede empuñarse con una o dos manos. Al empuñarla a dos manos para un ataque cuerpo a cuerpo, inflige el daño superior especificado entre paréntesis."
  },
  "versatile": {
    titulo: "Versátil",
    descripcion: "Esta arma puede empuñarse con una o dos manos. Al empuñarla a dos manos para un ataque cuerpo a cuerpo, inflige el daño superior especificado entre paréntesis."
  },
  "pesada": {
    titulo: "Pesada",
    descripcion: "Las criaturas de tamaño Pequeño o menor tienen desventaja en las tiradas de ataque con armas pesadas. En D&D 5.5e, requiere Fuerza 13 (cuerpo a cuerpo) o Destreza 13 (a distancia) para evitar desventaja."
  },
  "pesado": {
    titulo: "Pesada",
    descripcion: "Las criaturas de tamaño Pequeño o menor tienen desventaja en las tiradas de ataque con armas pesadas. En D&D 5.5e, requiere Fuerza 13 (cuerpo a cuerpo) o Destreza 13 (a distancia) para evitar desventaja."
  },
  "heavy": {
    titulo: "Pesada",
    descripcion: "Las criaturas de tamaño Pequeño o menor tienen desventaja en las tiradas de ataque con armas pesadas. En D&D 5.5e, requiere Fuerza 13 (cuerpo a cuerpo) o Destreza 13 (a distancia) para evitar desventaja."
  },
  "alcance": {
    titulo: "Alcance",
    descripcion: "Esta arma añade 5 pies adicionales a tu distancia de alcance cuerpo a cuerpo tanto para atacar en tu turno como para determinar Ataques de Oportunidad."
  },
  "reach": {
    titulo: "Alcance",
    descripcion: "Esta arma añade 5 pies adicionales a tu distancia de alcance cuerpo a cuerpo tanto para atacar en tu turno como para determinar Ataques de Oportunidad."
  },
  "arrojadiza": {
    titulo: "Arrojadiza",
    descripcion: "Puedes lanzar el arma para realizar un ataque a distancia usando el mismo modificador de característica (Fuerza o Destreza) que usarías en cuerpo a cuerpo. Desenvainarla forma parte del ataque."
  },
  "thrown": {
    titulo: "Arrojadiza",
    descripcion: "Puedes lanzar el arma para realizar un ataque a distancia usando el mismo modificador de característica (Fuerza o Destreza) que usarías en cuerpo a cuerpo. Desenvainarla forma parte del ataque."
  },
  "a dos manos": {
    titulo: "A Dos Manos",
    descripcion: "Esta arma requiere obligatoriamente el uso de ambas manos cuando realizas un ataque con ella."
  },
  "two-handed": {
    titulo: "A Dos Manos",
    descripcion: "Esta arma requiere obligatoriamente el uso de ambas manos cuando realizas un ataque con ella."
  },
  "carga": {
    titulo: "Recarga",
    descripcion: "Debido al tiempo de recarga, solo puedes disparar 1 proyectil con esta arma cuando usas una Acción, Acción Adicional o Reacción, independientemente del número de ataques que puedas realizar."
  },
  "recarga": {
    titulo: "Recarga",
    descripcion: "Debido al tiempo de recarga, solo puedes disparar 1 proyectil con esta arma cuando usas una Acción, Acción Adicional o Reacción, independientemente del número de ataques que puedas realizar."
  },
  "loading": {
    titulo: "Recarga",
    descripcion: "Debido al tiempo de recarga, solo puedes disparar 1 proyectil con esta arma cuando usas una Acción, Acción Adicional o Reacción, independientemente del número de ataques que puedas realizar."
  },
  "municion": {
    titulo: "Munición",
    descripcion: "Requiere proyectiles compatibles para realizar ataques a distancia. Cada disparo consume 1 proyectil. Sacar la munición es parte del ataque y tras el combate puedes recuperar la mitad gastada."
  },
  "ammunition": {
    titulo: "Munición",
    descripcion: "Requiere proyectiles compatibles para realizar ataques a distancia. Cada disparo consume 1 proyectil. Sacar la munición es parte del ataque y tras el combate puedes recuperar la mitad gastada."
  },
  "especial": {
    titulo: "Especial",
    descripcion: "Esta arma posee reglas tácticas o mecánicas únicas y especiales detalladas en la descripción del objeto."
  },
  "special": {
    titulo: "Especial",
    descripcion: "Esta arma posee reglas tácticas o mecánicas únicas y especiales detalladas en la descripción del objeto."
  },
  "plateada": {
    titulo: "Plateada",
    descripcion: "El arma cuenta con una aleación o baño de plata que le permite superar la resistencia o inmunidad al daño no mágico de licántropos y otras criaturas sobrenaturales."
  },
  "silvered": {
    titulo: "Plateada",
    descripcion: "El arma cuenta con una aleación o baño de plata que le permite superar la resistencia o inmunidad al daño no mágico de licántropos y otras criaturas sobrenaturales."
  },
  "sintonizacion": {
    titulo: "Sintonización Requerida",
    descripcion: "Para sintonizarse y acceder a las propiedades mágicas de este objeto, el personaje debe pasar un descanso corto meditando en contacto con él."
  },
  "attunement": {
    titulo: "Sintonización Requerida",
    descripcion: "Para sintonizarse y acceder a las propiedades mágicas de este objeto, el personaje debe pasar un descanso corto meditando en contacto con él."
  }
};

/**
 * Normaliza un texto eliminando tildes, caracteres especiales y espacios sobrantes.
 */
function normalizarClave(texto: string): string {
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
    descripcion: `Propiedad de maestría de armas D&D 5.5e (${maestriaTexto}). Se activa si el personaje tiene entrenamiento en maestrías de armas.`,
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
      return {
        titulo: "Desventaja en Sigilo",
        descripcion: "Llevar puesta esta armadura impone automáticamente Desventaja en todas las pruebas de Destreza (Sigilo) debido a su peso, rigidez o sonido metálico.",
        textoCompleto: "Desventaja en Sigilo: Impone Desventaja en pruebas de Destreza (Sigilo)."
      };

    case "requisitoFuerza": {
      const fue = valorExtra ?? 13;
      return {
        titulo: `Fuerza Requerida (${fue})`,
        descripcion: `Si la puntuación de Fuerza del personaje es menor que ${fue}, su velocidad terrestre se reduce en 10 pies a menos que cuente con rasgos raciales especiales.`,
        textoCompleto: `Fuerza Requerida ${fue}: Si la Fuerza es menor, la velocidad se reduce en 10 pies.`
      };
    }

    case "bonoDestreza": {
      const tipoBono = normalizarClave(String(valorExtra || "Completo"));
      if (tipoBono.includes("ninguno") || tipoBono.includes("none")) {
        return {
          titulo: "Bono de Destreza: Ninguno",
          descripcion: "Esta armadura pesada no suma el modificador de Destreza a la Clase de Armadura (tampoco se resta si tu Destreza es negativa).",
          textoCompleto: "Bono de Destreza: Ninguno (Armadura Pesada)."
        };
      }
      if (tipoBono.includes("max 2") || tipoBono.includes("max2") || tipoBono.includes("mediana") || tipoBono.includes("hasta +2") || tipoBono.includes("hasta 2")) {
        return {
          titulo: "Bono de Destreza: Máximo +2",
          descripcion: "Esta armadura mediana suma tu modificador de Destreza a la CA hasta un máximo de +2.",
          textoCompleto: "Bono de Destreza: Máximo +2 (Armadura Mediana)."
        };
      }
      return {
        titulo: "Bono de Destreza: Completo",
        descripcion: "Esta armadura ligera suma tu modificador de Destreza completo a tu Clase de Armadura.",
        textoCompleto: "Bono de Destreza: Completo (Armadura Ligera)."
      };
    }

    case "escudo":
      return {
        titulo: "Escudo (+2 CA)",
        descripcion: "Empuñar un escudo equipado otorga un bonificador de +2 a tu Clase de Armadura. Solo puedes beneficiarte de un escudo a la vez.",
        textoCompleto: "Escudo: +2 a la CA mientras esté equipado."
      };

    case "caBase":
      return {
        titulo: `Clase de Armadura Base (${valorExtra ?? 10})`,
        descripcion: `Valor base de protección que otorga esta armadura antes de sumar bonificadores de Destreza o magia.`,
        textoCompleto: `CA Base: ${valorExtra ?? 10}`
      };
  }
}
