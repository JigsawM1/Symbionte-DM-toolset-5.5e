/**
 * equipoConstantes.ts
 * -------------------
 * Glosario y constantes centrales de Equipo, Armas, Armaduras, Escudos,
 * Maestrías y Propiedades oficiales de D&D 5.5e (PHB 2024) y D&D 5e.
 */

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

/** Explicaciones de Propiedades de Armas indexadas por su etiqueta de selector */
export const EXPLICACIONES_PROPIEDADES: Record<string, string> = {
  "Sutil": "Al atacar con un arma con Sutil, usa tu modificador de Fuerza o Destreza para las tiradas de ataque y daño. Debes usar el mismo modificador para ambas tiradas.",
  "Versátil": "Se puede usar con una o dos manos. Un valor de daño entre paréntesis aparece con la propiedad: el arma inflige ese daño cuando se usa a dos manos para un ataque cuerpo a cuerpo.",
  "Pesada": "Tienes Desventaja en las tiradas de ataque con un arma Pesada si es cuerpo a cuerpo y tu Fuerza no es al menos 13, o si es a distancia y tu Destreza no es al menos 13.",
  "Ligera": "Al tomar la acción de Atacar y atacar con un arma Ligera, puedes hacer un ataque extra como Acción Adicional con otra arma Ligera diferente. No sumas tu modificador de característica al daño del ataque extra (salvo que sea negativo).",
  "Carga": "Solo puedes disparar una pieza de munición de un arma con Carga cuando usas una acción, Acción Adicional o Reacción, sin importar cuántos ataques puedas hacer normalmente.",
  "Alcance": "Un arma con Alcance añade 5 pies a tu alcance cuando atacas con ella, así como al determinar tu alcance para Ataques de Oportunidad.",
  "Arrojadiza": "Puedes lanzar el arma para hacer un ataque a distancia, y puedes desenfundarla como parte del ataque. Si es un arma cuerpo a cuerpo, usa el mismo modificador de característica para ataque y daño que usarías en cuerpo a cuerpo.",
  "A dos manos": "Un arma A Dos Manos requiere ambas manos cuando realizas un ataque con ella.",
  "Munición": "Solo puedes hacer un ataque a distancia con un arma de Munición si tienes proyectiles. El tipo se especifica con el alcance del arma. Cada ataque gasta un proyectil. Tras un combate, puedes recuperar la mitad de la munición usada (1 minuto).",
  "Especial": "Este arma tiene reglas especiales de uso, detalladas en su descripción."
};

/** Explicaciones de Maestrías de Armas indexadas por su etiqueta de selector */
export const EXPLICACIONES_MAESTRIAS: Record<string, string> = {
  "Ninguna": "",
  "Cleave (Hender)": "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes hacer una tirada de ataque contra una segunda criatura a 5 pies de la primera y dentro de tu alcance. Si impactas, la segunda criatura recibe el daño del arma sin tu modificador de característica. Solo una vez por turno.",
  "Graze (Rozar)": "Si tu tirada de ataque falla, puedes infligir daño igual al modificador de característica usado. El daño es del mismo tipo que el arma, y solo puede incrementarse aumentando el modificador.",
  "Nick (Mellar)": "Cuando haces el ataque extra de la propiedad Ligera, puedes hacerlo como parte de la acción de Atacar en vez de como Acción Adicional. Solo una vez por turno.",
  "Push (Empujar)": "Si impactas a una criatura, puedes empujarla hasta 10 pies en línea recta lejos de ti si es Grande o menor.",
  "Sap (Debilitar)": "Si impactas a una criatura, esa criatura tiene Desventaja en su siguiente tirada de ataque antes del inicio de tu próximo turno.",
  "Slow (Ralentizar)": "Si impactas a una criatura e infliges daño, puedes reducir su Velocidad en 10 pies hasta el inicio de tu próximo turno. Múltiples impactos con armas Slow no acumulan la reducción.",
  "Topple (Derribar)": "Si impactas a una criatura, puedes forzar una tirada de salvación de Constitución (CD 8 + tu modificador de característica + tu bonificador de competencia). Si falla, la criatura queda Derribada.",
  "Vex (Molestar)": "Si impactas a una criatura e infliges daño, tienes Ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu próximo turno."
};

// ============================================================================
// 3. DICCIONARIOS MAESTROS DE NORMALIZACIÓN BILINGÜE Y MULTI-ALIAS
// ============================================================================

/** Diccionario maestro de Maestrías oficiales D&D 5.5e (2024) normalizadas */
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

/** Diccionario maestro de Propiedades de Armas normalizadas */
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
