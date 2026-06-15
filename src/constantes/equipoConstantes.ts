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

export const REGLAS_VENENOS_DETALLADAS: Record<string, InformacionVeneno> = {
  "assassins-blood": {
    nombre: "Sangre de Asesino (Assassin's Blood)",
    costo: 150,
    tipo: "Ingerido",
    cd: 10,
    descripcion: "Una criatura expuesta a este veneno debe realizar una salvación de Constitución CD 10. Si falla, recibe 6 (1d12) de daño de Veneno y sufre la condición de Envenenado durante 24 horas. Si tiene éxito, recibe la mitad del daño únicamente y no sufre la condición."
  },
  "burnt-othur-fumes": {
    nombre: "Vapores de Othur Quemado (Burnt Othur Fumes)",
    costo: 500,
    tipo: "Inhalado",
    cd: 13,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 13 o recibirá 10 (3d6) de daño de Veneno y deberá repetir la salvación al inicio de cada uno de sus turnos. En cada fallo sucesivo recibe 3 (1d6) de daño de Veneno. El efecto termina tras tres salvaciones exitosas."
  },
  "crawler-mucus": {
    nombre: "Mucosidad de Carroñero (Crawler Mucus)",
    costo: 200,
    tipo: "Contacto",
    cd: 13,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 13 o sufrirá la condición de Envenenado durante 1 minuto. La criatura también estará Paralizada mientras esté Envenenada de esta forma. Repite la salvación al final de cada uno de sus turnos para terminar el efecto."
  },
  "essence-of-ether": {
    nombre: "Esencia de Éter (Essence of Ether)",
    costo: 300,
    tipo: "Inhalado",
    cd: 15,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 15 o sufrirá la condición de Envenenado durante 8 horas. Estará Inconsciente mientras esté Envenenada de esta forma. Despierta si recibe daño o si otra criatura usa una acción para sacudirla."
  },
  "malice": {
    nombre: "Malicia (Malice)",
    costo: 250,
    tipo: "Inhalado",
    cd: 15,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 15 o sufrirá la condición de Envenenado durante 1 hora. Estará Cegada mientras esté Envenenada de esta forma."
  },
  "midnight-tears": {
    nombre: "Lágrimas de Medianoche (Midnight Tears)",
    costo: 1500,
    tipo: "Ingerido",
    cd: 17,
    descripcion: "Una criatura que ingiera este veneno no sufre ningún efecto inmediato. Si el veneno no ha sido neutralizado antes de la medianoche, la criatura debe superar una salvación de Constitución CD 17, recibiendo 31 (9d6) de daño de Veneno si falla, o la mitad si tiene éxito."
  },
  "oil-of-taggit": {
    nombre: "Aceite de Taggit (Oil of Taggit)",
    costo: 400,
    tipo: "Contacto",
    cd: 13,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 13 o sufrirá la condición de Envenenado durante 24 horas. También estará Inconsciente mientras esté Envenenada de esta forma. Despierta inmediatamente si recibe daño."
  },
  "pale-tincture": {
    nombre: "Tintura Pálida (Pale Tincture)",
    costo: 250,
    tipo: "Ingerido",
    cd: 16,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 16 o recibirá 3 (1d6) de daño de Veneno y sufrirá la condición de Envenenado. Repite la salvación cada 24 horas, recibiendo 3 (1d6) de daño con cada fallo. Este daño no se puede curar por ningún medio mientras siga Envenenada. Termina tras siete salvaciones exitosas consecutivas."
  },
  "purple-worm-poison": {
    nombre: "Veneno de Gusano Púrpura (Purple Worm Poison)",
    costo: 2000,
    tipo: "Lesión",
    cd: 21,
    descripcion: "Una criatura expuesta debe realizar una salvación de Constitución CD 21, recibiendo 35 (10d6) de daño de Veneno si falla, o la mitad si tiene éxito."
  },
  "serpent-venom": {
    nombre: "Veneno de Serpiente (Serpent Venom)",
    costo: 200,
    tipo: "Lesión",
    cd: 11,
    descripcion: "Una criatura expuesta debe realizar una salvación de Constitución CD 11, recibiendo 10 (3d6) de daño de Veneno si falla, o la mitad si tiene éxito."
  },
  "spiders-sting": {
    nombre: "Picadura de Araña (Spider's Sting)",
    costo: 200,
    tipo: "Lesión",
    cd: 13,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 13 o sufrirá la condición de Envenenado por 1 hora. Si falla la salvación por 5 o más puntos, también estará Inconsciente mientras esté Envenenada. Despierta si recibe daño o si la sacuden."
  },
  "torpor": {
    nombre: "Apatía (Torpor)",
    costo: 600,
    tipo: "Ingerido",
    cd: 15,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 15 o sufrirá la condición de Envenenado durante 4d6 horas. Su velocidad se reduce a la mitad mientras esté Envenenada de esta forma."
  },
  "truth-serum": {
    nombre: "Suero de la Verdad (Truth Serum)",
    costo: 150,
    tipo: "Ingerido",
    cd: 11,
    descripcion: "Una criatura expuesta debe superar una salvación de Constitución CD 11 o sufrirá la condición de Envenenado durante 1 hora. La criatura envenenada de esta manera no puede decir una mentira a sabiendas."
  },
  "wyvern-poison": {
    nombre: "Veneno de Wyvern (Wyvern Poison)",
    costo: 1200,
    tipo: "Lesión",
    cd: 14,
    descripcion: "Una criatura expuesta debe realizar una salvación de Constitución CD 14, recibiendo 24 (7d6) de daño de Veneno si falla, o la mitad si tiene éxito."
  }
};
