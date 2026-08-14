// Constantes para Propiedades, Maestrías y Venenos en Español (D&D 5.5e / 2024)

export interface InformacionVeneno {
  nombre: string;
  costo: number;
  tipo: "Contacto" | "Ingerido" | "Inhalado" | "Lesión";
  cd: number;
  descripcion: string;
}

export const EXPLICACIONES_MAESTRIAS_DETALLADAS: Record<string, string> = {
  "Ninguna": "Esta arma no posee propiedades de maestría activa.",
  "Cleave (Tajo)": "Si impactas a una criatura con un ataque cuerpo a cuerpo con esta arma, puedes hacer una tirada de ataque contra una segunda criatura que esté a 5 pies de la primera y dentro de tu alcance. Si impactas, la segunda criatura recibe el daño de la arma, pero no sumes tu modificador de característica al daño a menos que sea negativo. Solo puedes hacer este ataque extra una vez por turno.",
  "Graze (Roce)": "Si tu tirada de ataque con esta arma falla, puedes infligir daño a esa criatura igual al modificador de característica que utilizaste para realizar el ataque. Este daño es del mismo tipo que el del arma y no se puede incrementar excepto aumentando dicho modificador.",
  "Nick (Corte)": "Cuando realices el ataque extra otorgado por la propiedad Ligera, puedes hacerlo como parte de la acción de Atacar en lugar de como una Acción Adicional. Solo puedes realizar este ataque extra una vez por turno.",
  "Push (Empujar)": "Si impactas a una criatura con esta arma, puedes empujarla hasta 10 pies en línea recta lejos de ti si su tamaño es Grande o menor.",
  "Sap (Debilitar)": "Si impactas a una criatura con esta arma, esa criatura tendrá Desventaja en su siguiente tirada de ataque antes del inicio de tu próximo turno.",
  "Slow (Ralentizar)": "Si impactas a una criatura con esta arma e infliges daño, puedes reducir su velocidad en 10 pies hasta el inicio de tu próximo turno. Golpear a una criatura múltiples veces con armas que tengan esta propiedad no acumula la reducción más allá de 10 pies.",
  "Topple (Derribar)": "Si impactas a una criatura con esta arma, puedes obligarla a realizar una tirada de salvación de Constitución (CD 8 + tu modificador de característica + tu bonificador de competencia). Si falla, la criatura sufre la condición de Derribado (Prone).",
  "Vex (Irritar)": "Si impactas a una criatura con esta arma e infliges daño, tienes Ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu próximo turno."
};

export const EXPLICACIONES_PROPIEDADES_DETALLADAS: Record<string, string> = {
  "Sutil (Finesse)": "Al realizar un ataque con un arma Sutil, puedes elegir usar tu modificador de Fuerza o Destreza para las tiradas de ataque y daño. Debes usar el mismo modificador para ambas.",
  "Versátil (Versatile)": "Esta arma puede usarse con una o dos manos. Se muestra un valor de daño entre paréntesis: el arma inflige ese daño cuando se sostiene con dos manos para realizar un ataque cuerpo a cuerpo.",
  "Pesada (Heavy)": "Tienes Desventaja en los ataques con esta arma si eres de tamaño Pequeño o menor, o si tu Fuerza (para armas cuerpo a cuerpo) o tu Destreza (para armas a distancia) es inferior a 13.",
  "Ligera (Light)": "Cuando atacas con un arma Ligera usando la acción de Atacar, puedes realizar un ataque adicional como Acción Adicional con una arma Ligera diferente que empuñes en la otra mano. No sumas tu bonificador de característica al daño de este ataque secundario a menos que sea negativo.",
  "Carga (Loading)": "Debido al tiempo necesario para recargar esta arma, solo puedes disparar una pieza de munición de ella cuando usas una acción, Acción Adicional o Reacción, independientemente del número de ataques que puedas realizar normalmente.",
  "Alcance (Reach)": "Esta arma añade 5 pies a tu alcance cuando realizas un ataque con ella, así como para determinar tu alcance al realizar Ataques de Oportunidad.",
  "Arrojadiza (Thrown)": "Si un arma tiene la propiedad Arrojadiza, puedes lanzarla para realizar un ataque a distancia y puedes desenfundarla como parte del ataque. Si es cuerpo a cuerpo, usas el mismo modificador para ataque y daño que usarías en un ataque cuerpo a cuerpo.",
  "A dos manos (Two-Handed)": "Esta arma requiere que utilices ambas manos cuando realizas una tirada de ataque con ella.",
  "Munición (Ammunition)": "Puedes realizar un ataque a distancia con esta arma solo si tienes proyectiles para disparar. Cada ataque gasta un proyectil. Sacar la munición es parte del ataque. Tras un combate, puedes pasar 1 minuto recuperando la mitad de las municiones gastadas.",
  "Especial (Special)": "Esta arma tiene reglas de combate inusuales que se detallan de forma específica en su descripción.",
  "Plateada (Silvered)": "El arma ha sido recubierta de plata para superar la inmunidad o resistencia a ataques no mágicos de ciertos monstruos (como licántropos).",
  "Sintonización (Attunement)": "Para beneficiarse de las propiedades mágicas de este objeto, un personaje debe sintonizarse con él durante un descanso corto."
};


