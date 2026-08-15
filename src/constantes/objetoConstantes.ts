/**
 * objetoConstantes.ts
 * -------------------
 * Constantes, diccionarios de reglas D&D 5.5e (PHB 2024) y configuraciones
 * visuales para el creador y visor de objetos homebrew.
 *
 * Programado 100% en español.
 */

import { Rareza } from "../almacen/usarAlmacenDM";

// Colores HSL para D&D Rareza
export const COLORES_RAREZA_HSL: Record<Rareza, string> = {
  "Común": "hsl(0, 0%, 75%)",
  "Poco Común": "hsl(120, 60%, 45%)",
  "Raro": "hsl(210, 85%, 50%)",
  "Muy Raro": "hsl(280, 75%, 60%)",
  "Legendario": "hsl(32, 95%, 50%)",
  "Artefacto": "hsl(0, 75%, 40%)"
};

export const OPCIONES_ATRIBUTOS: Record<string, string[]> = {
  "CA": ["CA"],
  "CARACTERÍSTICA": ["Fuerza", "Destreza", "Constitución", "Inteligencia", "Sabiduría", "Carisma"],
  "SALVACIÓN": ["Fuerza", "Destreza", "Constitución", "Inteligencia", "Sabiduría", "Carisma"],
  "HABILIDAD": [
    "Acrobacias",
    "Atletismo",
    "Arcana",
    "Engaño",
    "Historia",
    "Perspicacia",
    "Intimidación",
    "Investigación",
    "Medicina",
    "Naturaleza",
    "Percepción",
    "Interpretación",
    "Persuasión",
    "Religión",
    "Juego de Manos",
    "Sigilo",
    "Supervivencia",
    "Trato con Animales"
  ]
};

// Maestrías oficiales de D&D 5.5e (PHB 2024)
export const MAESTRIAS_DND_55 = [
  "Ninguna",
  "Cleave (Tajo)",
  "Graze (Rozar)",
  "Nick (Corte)",
  "Push (Empujar)",
  "Sap (Debilitar)",
  "Slow (Ralentizar)",
  "Topple (Derribar)",
  "Vex (Irritar)"
];

// Propiedades de Arma D&D 5.5e (PHB 2024)
export const PROPIEDADES_ARMAS_DND = [
  "Sutil (Finesse)",
  "Versátil (Versatile)",
  "Pesada (Heavy)",
  "Ligera (Light)",
  "Carga (Loading)",
  "Alcance (Reach)",
  "Arrojadiza (Thrown)",
  "A dos manos (Two-Handed)",
  "Munición (Ammunition)",
  "Especial (Special)"
];

export const EXPLICACIONES_PROPIEDADES: Record<string, string> = {
  "Sutil (Finesse)": "Al atacar con un arma con Sutil, usa tu modificador de Fuerza o Destreza para las tiradas de ataque y daño. Debes usar el mismo modificador para ambas tiradas.",
  "Versátil (Versatile)": "Se puede usar con una o dos manos. Un valor de daño entre paréntesis aparece con la propiedad: el arma inflige ese daño cuando se usa a dos manos para un ataque cuerpo a cuerpo.",
  "Pesada (Heavy)": "Tienes Desventaja en las tiradas de ataque con un arma Pesada si es cuerpo a cuerpo y tu Fuerza no es al menos 13, o si es a distancia y tu Destreza no es al menos 13.",
  "Ligera (Light)": "Al tomar la acción de Atacar y atacar con un arma Ligera, puedes hacer un ataque extra como Acción Adicional con otra arma Ligera diferente. No sumas tu modificador de característica al daño del ataque extra (salvo que sea negativo).",
  "Carga (Loading)": "Solo puedes disparar una pieza de munición de un arma con Carga cuando usas una acción, Acción Adicional o Reacción, sin importar cuántos ataques puedas hacer normalmente.",
  "Alcance (Reach)": "Un arma con Alcance añade 5 pies a tu alcance cuando atacas con ella, así como al determinar tu alcance para Ataques de Oportunidad.",
  "Arrojadiza (Thrown)": "Puedes lanzar el arma para hacer un ataque a distancia, y puedes desenfundarla como parte del ataque. Si es un arma cuerpo a cuerpo, usa el mismo modificador de característica para ataque y daño que usarías en cuerpo a cuerpo.",
  "A dos manos (Two-Handed)": "Un arma A Dos Manos requiere ambas manos cuando realizas un ataque con ella.",
  "Munición (Ammunition)": "Solo puedes hacer un ataque a distancia con un arma de Munición si tienes proyectiles. El tipo se especifica con el alcance del arma. Cada ataque gasta un proyectil. Tras un combate, puedes recuperar la mitad de la munición usada (1 minuto).",
  "Especial (Special)": "Este arma tiene reglas especiales de uso, detalladas en su descripción."
};

// Explicaciones de Maestrías D&D 5.5e (PHB 2024)
export const EXPLICACIONES_MAESTRIAS: Record<string, string> = {
  "Ninguna": "",
  "Cleave (Tajo)": "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes hacer una tirada de ataque contra una segunda criatura a 5 pies de la primera y dentro de tu alcance. Si impactas, la segunda criatura recibe el daño del arma sin tu modificador de característica. Solo una vez por turno.",
  "Graze (Rozar)": "Si tu tirada de ataque falla, puedes infligir daño igual al modificador de característica usado. El daño es del mismo tipo que el arma, y solo puede incrementarse aumentando el modificador.",
  "Nick (Corte)": "Cuando haces el ataque extra de la propiedad Ligera, puedes hacerlo como parte de la acción de Atacar en vez de como Acción Adicional. Solo una vez por turno.",
  "Push (Empujar)": "Si impactas a una criatura, puedes empujarla hasta 10 pies en línea recta lejos de ti si es Grande o menor.",
  "Sap (Debilitar)": "Si impactas a una criatura, esa criatura tiene Desventaja en su siguiente tirada de ataque antes del inicio de tu próximo turno.",
  "Slow (Ralentizar)": "Si impactas a una criatura e infliges daño, puedes reducir su Velocidad en 10 pies hasta el inicio de tu próximo turno. Múltiples impactos con armas Slow no acumulan la reducción.",
  "Topple (Derribar)": "Si impactas a una criatura, puedes forzar una tirada de salvación de Constitución (CD 8 + tu modificador de característica + tu bonificador de competencia). Si falla, la criatura queda Derribada.",
  "Vex (Irritar)": "Si impactas a una criatura e infliges daño, tienes Ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu próximo turno."
};
