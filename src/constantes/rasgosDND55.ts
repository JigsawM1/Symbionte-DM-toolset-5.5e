import type { DotePersonaje } from "@/tipos/rasgos";

// =======================================================
// DICCIONARIO CANÓNICO DE RASGOS D&D 5.5e (PHB 2024)
// =======================================================

export interface PlantillaRasgoClase {
  nivel: number;
  nombre: string;
  descripcion: string;
  tipoAccion: "pasivo" | "accion" | "accion_adicional" | "reaccion" | "especial";
  subclase?: string;
  tieneUsosLimitados?: boolean;
  obtenerUsosMaximos?: (nivel: number) => number;
  recuperacion?: "descanso_corto" | "descanso_largo" | "manual" | "ninguno";
  formulaDados?: string;
}

export interface PlantillaRasgoEspecie {
  nombre: string;
  descripcion: string;
  subespecie?: string;
  tipoAccion: "pasivo" | "accion" | "accion_adicional" | "reaccion" | "especial";
  tieneUsosLimitados?: boolean;
  usosMaximos?: number;
  recuperacion?: "descanso_corto" | "descanso_largo" | "manual" | "ninguno";
  formulaDados?: string;
}

// -------------------------------------------------------
// 1. RASGOS DE CLASES OFICIALES (D&D 5.5e / 2024)
// -------------------------------------------------------

export const RASGOS_POR_CLASE: Record<string, PlantillaRasgoClase[]> = {
  "Guerrero": [
    {
      nivel: 1,
      nombre: "Estilo de combate",
      descripcion: "Has perfeccionado tu destreza marcial y ganas una dote de Estilo de combate de tu elección (como Defensa, Duelo, Gran combate con armas o Arquería). Puedes cambiarla al subir de nivel.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Tomar aliento",
      descripcion: "Tienes una reserva limitada de aguante. Como acción adicional, recuperas 1d10 + nivel de guerrero puntos de golpe. Recuperas 1 uso con un descanso corto y todos tras un descanso largo.",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => (niv >= 10 ? 4 : niv >= 4 ? 3 : 2),
      recuperacion: "descanso_corto",
      formulaDados: "1d10"
    },
    {
      nivel: 1,
      nombre: "Maestría con armas",
      descripcion: "Tu entrenamiento con armas te permite utilizar las propiedades de maestría (Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex) de tus armas elegidas. Puedes cambiarlas al terminar un descanso largo.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Acción súbita",
      descripcion: "Puedes superar tus límites normales. En tu turno, puedes realizar una acción adicional (excepto la acción de Magia). Se recupera tras un descanso corto o largo (2 usos a nivel 17).",
      tipoAccion: "especial",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => (niv >= 17 ? 2 : 1),
      recuperacion: "descanso_corto"
    },
    {
      nivel: 2,
      nombre: "Mente táctica",
      descripcion: "Cuando falles una prueba de característica, puedes gastar 1 uso de Tomar aliento para tirar 1d10 y sumarlo al resultado. Si aún así fallas, el uso no se gasta.",
      tipoAccion: "reaccion",
      formulaDados: "1d10"
    },
    {
      nivel: 3,
      nombre: "Subclase marcial",
      descripcion: "Obtienes los rasgos de tu subclase elegida (Campeón, Maestro del Combate, Caballero Arcano, Guerrero Psiónico, etc.).",
      tipoAccion: "pasivo"
    },
    {
      nivel: 5,
      nombre: "Ataque adicional",
      descripcion: "Cuando lleves a cabo la acción de atacar en tu turno, puedes realizar 2 ataques en lugar de 1 (3 ataques a nivel 11, 4 ataques a nivel 20).",
      tipoAccion: "pasivo"
    },
    {
      nivel: 5,
      nombre: "Desplazamiento táctico",
      descripcion: "Siempre que uses Tomar aliento con tu acción adicional, puedes moverte hasta la mitad de tu velocidad sin provocar ataques de oportunidad.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 9,
      nombre: "Indómito",
      descripcion: "Si fallas una tirada de salvación, puedes repetirla con un bonificador igual a tu nivel de guerrero. Recuperas todos los usos tras un descanso largo.",
      tipoAccion: "reaccion",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => (niv >= 17 ? 3 : niv >= 13 ? 2 : 1),
      recuperacion: "descanso_largo"
    },
    {
      nivel: 9,
      nombre: "Maestro táctico",
      descripcion: "Cuando ataques con un arma con maestría, puedes sustituir su maestría por Debilitar (Sap), Empujar (Push) o Ralentizar (Slow).",
      tipoAccion: "pasivo"
    },
    {
      nivel: 11,
      nombre: "Dos ataques adicionales",
      descripcion: "Puedes hacer tres ataques al realizar la acción de atacar.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 13,
      nombre: "Ataques estudiados",
      descripcion: "Si fallas una tirada de ataque contra una criatura, obtienes ventaja en tu siguiente tirada de ataque contra esa misma criatura antes de que termine tu siguiente turno.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 20,
      nombre: "Tres ataques adicionales",
      descripcion: "Puedes hacer cuatro ataques al realizar la acción de atacar.",
      tipoAccion: "pasivo"
    },
    // Subclase: Campeón
    {
      nivel: 3,
      subclase: "Campeón",
      nombre: "Crítico mejorado",
      descripcion: "Tus tiradas de ataque con armas y golpes sin armas logran un impacto crítico con un resultado de 19 o 20 en el d20.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 3,
      subclase: "Campeón",
      nombre: "Atleta sobresaliente",
      descripcion: "Tienes ventaja en las tiradas de iniciativa y en pruebas de Fuerza (Atletismo). Además, tras asestar un crítico, puedes moverte hasta la mitad de tu velocidad sin provocar ataques de oportunidad.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 10,
      subclase: "Campeón",
      nombre: "Guerrero heroico",
      descripcion: "Durante el combate, puedes otorgarte Inspiración heroica siempre que comiences tu turno sin ella.",
      tipoAccion: "especial"
    },
    {
      nivel: 15,
      subclase: "Campeón",
      nombre: "Crítico superior",
      descripcion: "Tus ataques marciales ahora asestan un golpe crítico con un 18, 19 o 20 en el d20.",
      tipoAccion: "pasivo"
    }
  ],

  "Bárbaro": [
    {
      nivel: 1,
      nombre: "Furia",
      descripcion: "Como acción adicional, entras en furia. Obtienes ventaja en pruebas y salvaciones de Fuerza, bonificador de daño por furia a ataques con Fuerza y resistencia al daño contundente, perforante y cortante. Dura 10 minutos o hasta quedar inconsciente.",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => (niv >= 17 ? 6 : niv >= 12 ? 5 : niv >= 6 ? 4 : niv >= 3 ? 3 : 2),
      recuperacion: "descanso_largo"
    },
    {
      nivel: 1,
      nombre: "Defensa sin armadura (Bárbaro)",
      descripcion: "Mientras no lleves armadura, tu Clase de Armadura es igual a 10 + Mod. Destreza + Mod. Constitución. Puedes usar escudo.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Maestría con armas (Bárbaro)",
      descripcion: "Puedes usar las propiedades de maestría de dos armas de tu elección.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Ataque temerario",
      descripcion: "En tu primer ataque del turno, puedes ganar ventaja en todas las tiradas de ataque cuerpo a cuerpo con Fuerza, pero los ataques contra ti tienen ventaja hasta tu siguiente turno.",
      tipoAccion: "especial"
    },
    {
      nivel: 2,
      nombre: "Sentido del peligro",
      descripcion: "Tienes ventaja en las tiradas de salvación de Destreza contra efectos que puedas ver, salvo si estás incapacitado.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 5,
      nombre: "Ataque adicional",
      descripcion: "Puedes atacar dos veces al realizar la acción de atacar.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 5,
      nombre: "Movimiento rápido",
      descripcion: "Tu velocidad terrestre aumenta en 10 pies mientras no lleves armadura pesada.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 7,
      nombre: "Instinto salvaje",
      descripcion: "Tienes ventaja en las tiradas de iniciativa. Además, si estás sorprendido al inicio del combate, puedes actuar normalmente si entras en furia de inmediato.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 9,
      nombre: "Crítico brutal",
      descripcion: "Tiras dados de daño adicionales al asestar un golpe crítico cuerpo a cuerpo.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 11,
      nombre: "Furia implacable",
      descripcion: "Si tus puntos de golpe caen a 0 mientras estás en furia y no mueres en el acto, puedes superar una salvación de Constitución CD 10 para quedar a 1 HP.",
      tipoAccion: "reaccion"
    }
  ],

  "Pícaro": [
    {
      nivel: 1,
      nombre: "Ataque furtivo",
      descripcion: "Una vez por turno, infliges daño extra (escalado por nivel) a una criatura a la que aciertes con un arma sutil o a distancia si tienes ventaja o si un aliado consciente está a 5 pies de ella.",
      tipoAccion: "especial",
      formulaDados: "1d6"
    },
    {
      nivel: 1,
      nombre: "Pericia",
      descripcion: "Tu bonificador de competencia se duplica para dos de tus habilidades con las que seas competente o una habilidad y herramientas de ladrón.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Jerga de ladrones",
      descripcion: "Conoces la jerga secreta de los ladrones y un idioma adicional de tu elección.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Maestría con armas (Pícaro)",
      descripcion: "Puedes usar las propiedades de maestría de dos armas de tu elección.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Acción astuta",
      descripcion: "Puedes realizar una acción adicional en cada uno de tus turnos para Carrera, Destrabarse o Esconderse.",
      tipoAccion: "accion_adicional"
    },
    {
      nivel: 5,
      nombre: "Esquiva asombrosa",
      descripcion: "Cuando un atacante que puedas ver te acierte con un ataque, puedes usar tu reacción para reducir el daño sufrido a la mitad.",
      tipoAccion: "reaccion"
    },
    {
      nivel: 5,
      nombre: "Golpe astuto",
      descripcion: "Puedes cambiar dados de Ataque Furtivo para aplicar efectos especiales (Derribar, Envenenar, Retirar, etc.).",
      tipoAccion: "especial"
    },
    {
      nivel: 7,
      nombre: "Evasión",
      descripcion: "Cuando sufras un efecto que te permita hacer una salvación de Destreza para sufrir la mitad de daño, no recibes daño si tienes éxito y solo la mitad si fallas.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 11,
      nombre: "Talento fiable",
      descripcion: "Cualquier tirada de d20 en una prueba de habilidad en la que seas competente que dé 9 o menos se convierte en un 10.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 14,
      nombre: "Sentido ciego",
      descripcion: "Si puedes oír, eres consciente de la ubicación de cualquier criatura invisible u oculta a 10 pies o menos de ti.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 15,
      nombre: "Mente escurridiza",
      descripcion: "Ganas competencia en las tiradas de salvación de Sabiduría y Carisma.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 20,
      nombre: "Golpe de suerte",
      descripcion: "Si fallas una tirada de ataque, puedes convertirla en un acierto. Si fallas una prueba de característica, puedes tratar el d20 como un 20. (1/Descanso corto o largo).",
      tipoAccion: "especial",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: () => 1,
      recuperacion: "descanso_corto"
    }
  ],

  "Mago": [
    {
      nivel: 1,
      nombre: "Lanzamiento de conjuros (Mago)",
      descripcion: "Lanzas conjuros arcanos usando Inteligencia como aptitud mágica. Utilizas un grimorio para registrar y preparar tus hechizos.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Recuperación arcana",
      descripcion: "Una vez al día tras un descanso corto, puedes recuperar espacios de conjuro gastados con un nivel combinado igual a hasta la mitad de tu nivel de mago (redondeando hacia arriba), ninguno de nivel 6 o superior.",
      tipoAccion: "especial",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: () => 1,
      recuperacion: "descanso_largo"
    },
    {
      nivel: 1,
      nombre: "Lanzador de rituales",
      descripcion: "Puedes lanzar cualquier conjuro de mago de tu grimorio como ritual si tiene la etiqueta de ritual, sin necesidad de tenerlo preparado.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 5,
      nombre: "Memorizar conjuro",
      descripcion: "Al terminar un descanso corto, puedes consultar tu grimorio y reemplazar uno de tus conjuros preparados por otro de tu libro.",
      tipoAccion: "especial"
    },
    {
      nivel: 18,
      nombre: "Maestría en conjuros",
      descripcion: "Eliges un conjuro de nivel 1 y uno de nivel 2 de tu libro de conjuros. Puedes lanzarlos a su nivel más bajo a voluntad sin gastar espacios de conjuro.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 20,
      nombre: "Conjuros insignia",
      descripcion: "Eliges dos conjuros de nivel 3 como conjuros insignia. Siempre los tienes preparados y puedes lanzar cada uno una vez a nivel 3 sin gastar ranura (1/descanso corto o largo).",
      tipoAccion: "especial",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: () => 2,
      recuperacion: "descanso_corto"
    }
  ],

  "Clérigo": [
    {
      nivel: 1,
      nombre: "Lanzamiento de conjuros (Clérigo)",
      descripcion: "Canalizas el poder divino para lanzar conjuros usando Sabiduría como aptitud mágica.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Orden divina",
      descripcion: "Eliges tu vocación sagrada: Protector (competencia con armas marciales y armaduras pesadas) o Taumaturgo (un truco adicional y bonificador a Religión/Arcanos).",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Canalizar divinidad",
      descripcion: "Canalizas energía divina para alimentar efectos mágicos como Expulsar muertos vivientes o Chispa divina. Recuperas usos con descanso corto/largo.",
      tipoAccion: "accion",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => (niv >= 18 ? 4 : niv >= 6 ? 3 : 2),
      recuperacion: "descanso_corto"
    },
    {
      nivel: 2,
      nombre: "Expulsar muertos vivientes",
      descripcion: "Como acción de magia, muestras tu símbolo sagrado. Cada no muerto a 30 pies que pueda verte u oírte debe hacer una salvación de Sabiduría o quedará expulsado y asustado.",
      tipoAccion: "accion"
    },
    {
      nivel: 5,
      nombre: "Destruir muertos vivientes",
      descripcion: "Cuando un muerto viviente falle su salvación contra tu Expulsar muertos vivientes, recibe daño radiante masivo.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 10,
      nombre: "Intervención divina",
      descripcion: "Como acción de magia, imploras la ayuda de tu deidad para que lance cualquier conjuro de clérigo de nivel 5 o inferior sin gastar ranura ni componentes (1/descanso largo).",
      tipoAccion: "accion",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: () => 1,
      recuperacion: "descanso_largo"
    }
  ],

  "Paladín": [
    {
      nivel: 1,
      nombre: "Sentido divino",
      descripcion: "Como acción adicional, detectas la presencia y ubicación de celestiales, infernales y no muertos a 60 pies de ti (usos iguales a bonificador de Carisma, mín 1).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: () => 3,
      recuperacion: "descanso_largo"
    },
    {
      nivel: 1,
      nombre: "Imposición de manos",
      descripcion: "Cuentas con una reserva de poder curativo igual a 5 × tu nivel de paladín. Con una acción adicional puedes curar puntos de golpe o curar venenos/enfermedades gastando 5 puntos de tu reserva.",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => niv * 5,
      recuperacion: "descanso_largo"
    },
    {
      nivel: 1,
      nombre: "Maestría con armas (Paladín)",
      descripcion: "Puedes utilizar las propiedades de maestría de dos tipos de armas sencillas o marciales de tu elección.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Castigo divino (Paladín)",
      descripcion: "Siempre tienes preparado el conjuro Castigo divino y puedes lanzarlo como acción adicional tras acertar un ataque marcial gastando una ranura de conjuro.",
      tipoAccion: "accion_adicional"
    },
    {
      nivel: 3,
      nombre: "Salud divina",
      descripcion: "Eres inmune a todas las enfermedades y al estado Envenenado.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 6,
      nombre: "Aura de protección",
      descripcion: "Tú y los aliados a 10 pies de ti ganáis un bonificador igual a tu modificador de Carisma (mínimo +1) a todas las tiradas de salvación.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 10,
      nombre: "Aura de valor",
      descripcion: "Tú y tus aliados a 10 pies de ti no podéis ser asustados mientras estés consciente.",
      tipoAccion: "pasivo"
    }
  ],

  "Bardo": [
    {
      nivel: 1,
      nombre: "Inspiración bárdica",
      descripcion: "Como acción adicional, otorgas un dado de inspiración (d6, escalando a d8, d10, d12) a un aliado a 60 pies. Puede sumarlo a un d20 o curación. Recuperas usos con descanso corto/largo.",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => (niv >= 1 ? 4 : 3),
      recuperacion: "descanso_corto",
      formulaDados: "1d6"
    },
    {
      nivel: 2,
      nombre: "Aprendiz de mucho",
      descripcion: "Sumas la mitad de tu bonificador de competencia (redondeado hacia abajo) a cualquier prueba de característica que no incluya ya tu competencia.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Canción de descanso",
      descripcion: "Tus aliados y tú recuperáis puntos de golpe adicionales durante un descanso corto.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 3,
      nombre: "Pericia (Bardo)",
      descripcion: "Duplicas tu bonificador de competencia en dos habilidades elegidas.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 5,
      nombre: "Fuente de inspiración",
      descripcion: "Recuperas todos los usos de Inspiración bárdica tras finalizar un descanso corto o largo.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 10,
      nombre: "Secretos mágicos",
      descripcion: "Aprendes conjuros de cualquier otra clase (Mago, Clérigo, Druida) y los preparas como conjuros de bardo.",
      tipoAccion: "pasivo"
    }
  ],

  "Druida": [
    {
      nivel: 1,
      nombre: "Lanzamiento de conjuros (Druida)",
      descripcion: "Lanzas conjuros divinos de la naturaleza usando Sabiduría como aptitud mágica.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Orden primordial",
      descripcion: "Eliges Magia (un truco adicional y bonificador a Naturaleza) o Celador (competencia con armaduras medias y armas marciales).",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Forma salvaje",
      descripcion: "Como acción adicional, te transformas mágicamente en una bestia de la que conozcas su forma. Tienes 2 usos que recuperas tras un descanso corto o largo.",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => (niv >= 17 ? 4 : niv >= 6 ? 3 : 2),
      recuperacion: "descanso_corto"
    },
    {
      nivel: 2,
      nombre: "Compañero salvaje",
      descripcion: "Puedes gastar un uso de Forma salvaje para convocar un espíritu familiar o animal.",
      tipoAccion: "accion"
    }
  ],

  "Monje": [
    {
      nivel: 1,
      nombre: "Artes marciales",
      descripcion: "Tus golpes sin armas y ataques con armas de monje hacen daño incrementado (1d6 a 1d12), usan Destreza y permiten un golpe desarmado como acción adicional.",
      tipoAccion: "pasivo",
      formulaDados: "1d6"
    },
    {
      nivel: 1,
      nombre: "Defensa sin armadura (Monje)",
      descripcion: "Mientras no vistas armadura ni lleves escudo, tu CA es igual a 10 + Mod. Destreza + Mod. Sabiduría.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Puntos de Foco / Disciplina",
      descripcion: "Canalizas tu energía física y espiritual para ejecutar Ráfaga de golpes, Defensa paciente y Paso del viento. Recuperas todos tus puntos con un descanso corto o largo.",
      tipoAccion: "especial",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => niv,
      recuperacion: "descanso_corto"
    },
    {
      nivel: 2,
      nombre: "Movimiento sin armadura",
      descripcion: "Tu velocidad se incrementa mientras no lleves armadura ni escudo (+10 pies a nivel 2, escalando hasta +30 pies).",
      tipoAccion: "pasivo"
    },
    {
      nivel: 3,
      nombre: "Desviar proyectiles",
      descripcion: "Como reacción, reduces el daño de ataques a distancia con armas en 1d10 + Destreza + nivel de monje. Si lo reduces a 0, puedes atraparlo y devolverlo.",
      tipoAccion: "reaccion",
      formulaDados: "1d10"
    },
    {
      nivel: 5,
      nombre: "Golpe aturdidor",
      descripcion: "Al acertar un golpe cuerpo a cuerpo, puedes gastar 1 punto de Foco para intentar aturdir al objetivo (salvación de Constitución o aturdido hasta tu siguiente turno).",
      tipoAccion: "especial"
    },
    {
      nivel: 7,
      nombre: "Evasión (Monje)",
      descripcion: "En salvaciones de Destreza recibes 0 daño si superas y la mitad si fallas.",
      tipoAccion: "pasivo"
    }
  ],

  "Brujo": [
    {
      nivel: 1,
      nombre: "Magia de pacto",
      descripcion: "Lanzas conjuros arcanos mediante ranuras de pacto que siempre se lanzan al máximo nivel posible y se recargan por completo en descansos cortos.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Patrón de otro mundo",
      descripcion: "Pactas con una entidad sobrenatural (Infernal, Gran Antiguo, Archifada, Celestial, etc.) que te otorga conjuros y rasgos adicionales.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Invocación mística primordial",
      descripcion: "Obtienes invocaciones mágicas permanentes que potencian tus trucos y habilidades.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 11,
      nombre: "Arcano místico",
      descripcion: "Tu patrón te concede el lanzamiento de conjuros de niveles 6, 7, 8 y 9 una vez al día sin gastar ranuras.",
      tipoAccion: "especial",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: () => 1,
      recuperacion: "descanso_largo"
    }
  ],

  "Hechicero": [
    {
      nivel: 1,
      nombre: "Lanzamiento de conjuros (Hechicero)",
      descripcion: "Lanzas magia innata usando Carisma como aptitud mágica.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Origen de hechicería",
      descripcion: "Tu magia proviene de un linaje mágico (Linaje Dracónico, Magia Salvaje, Magia de las Sombras, etc.).",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Fuente de magia",
      descripcion: "Posees una reserva de Puntos de Hechicería iguales a tu nivel de hechicero para crear ranuras de conjuro y aplicar metamagia. Recuperas todos los puntos con descanso largo.",
      tipoAccion: "especial",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: (niv) => niv,
      recuperacion: "descanso_largo"
    },
    {
      nivel: 2,
      nombre: "Metamagia",
      descripcion: "Puedes alterar tus conjuros gastando Puntos de Hechicería (Conjuro Rápido, Conjuro Gemelo, Conjuro Sutil, Conjuro Potenciado, etc.).",
      tipoAccion: "especial"
    }
  ],

  "Explorador": [
    {
      nivel: 1,
      nombre: "Lanzamiento de conjuros (Explorador)",
      descripcion: "Lanzas conjuros usando Sabiduría como aptitud mágica.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 1,
      nombre: "Marca del cazador innata",
      descripcion: "Siempre tienes preparado Marca del cazador y puedes lanzarlo dos veces al día sin gastar ranura de conjuro.",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      obtenerUsosMaximos: () => 2,
      recuperacion: "descanso_largo"
    },
    {
      nivel: 1,
      nombre: "Maestría con armas (Explorador)",
      descripcion: "Puedes utilizar las propiedades de maestría de dos tipos de armas de tu elección.",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Estilo de combate (Explorador)",
      descripcion: "Ganas una dote de Estilo de combate (Arquería, Duelo, Combate con dos armas, Defensa).",
      tipoAccion: "pasivo"
    },
    {
      nivel: 2,
      nombre: "Explorador hábil",
      descripcion: "Obtienes pericia en una habilidad y bonificadores a tus velocidades y supervivencia.",
      tipoAccion: "pasivo"
    }
  ]
};

// -------------------------------------------------------
// 2. RASGOS DE ESPECIES OFICIALES (D&D 5.5e / 2024)
// -------------------------------------------------------

export const RASGOS_POR_ESPECIE: Record<string, PlantillaRasgoEspecie[]> = {
  "Humano": [
    {
      nombre: "Ingenio ingenioso",
      descripcion: "Ganas una dote de origen adicional de tu elección al nivel 1.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Versátil",
      descripcion: "Ganas competencia en una habilidad de tu elección.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Inspiración heroica",
      descripcion: "Al finalizar un descanso largo, ganas automáticamente Inspiración heroica si no la tenías.",
      tipoAccion: "pasivo"
    }
  ],

  "Elfo": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en luz tenue a 60 pies como si fuera luz brillante, y en oscuridad como si fuera luz tenue.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Linaje élfico",
      descripcion: "Obtienes magia y beneficios según tu linaje (Alto elfo: trucos de mago y cambio de conjuro; Elfo del bosque: velocidad 35 pies y magia druídica; Drow: visión en la oscuridad a 120 pies y magia drow).",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Sentidos agudos",
      descripcion: "Eres competente en la habilidad Percepción.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Ascendencia feérica",
      descripcion: "Tienes ventaja en las tiradas de salvación para evitar o poner fin al estado Hechizado en ti.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Trance",
      descripcion: "No necesitas dormir. Puedes completar un descanso largo en 4 horas meditando profundamente.",
      tipoAccion: "pasivo"
    }
  ],

  "Enano": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies (o 120 pies con linaje profundo).",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Resistencia enana",
      descripcion: "Tienes resistencia al daño por veneno y ventaja en tiradas de salvación contra el estado Envenenado.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Dureza enana",
      descripcion: "Tus puntos de golpe máximos aumentan en 1 por cada nivel que tengas.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Sentido de la piedra",
      descripcion: "Como acción adicional, ganas visión de temblor (sentido sísmico) a 60 pies sobre piedra durante 10 minutos (3 usos/descanso largo).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 3,
      recuperacion: "descanso_largo"
    }
  ],

  "Mediano": [
    {
      nombre: "Afortunado (Mediano)",
      descripcion: "Cuando sacas un 1 en el d20 en una tirada de ataque, prueba de característica o salvación, puedes repetir el dado y debes usar el nuevo resultado.",
      tipoAccion: "reaccion"
    },
    {
      nombre: "Valiente",
      descripcion: "Tienes ventaja en las tiradas de salvación para evitar o terminar el estado Asustado.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Agilidad de mediano",
      descripcion: "Puedes moverte a través del espacio de cualquier criatura que sea de un tamaño superior al tuyo.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Sigilo natural",
      descripcion: "Puedes intentar esconderte incluso cuando estés oculto únicamente tras una criatura que sea al menos de un tamaño superior al tuyo.",
      tipoAccion: "pasivo"
    }
  ],

  "Gnomo": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Astucia gnómica",
      descripcion: "Tienes ventaja en todas las tiradas de salvación de Inteligencia, Sabiduría y Carisma contra magia.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Linaje gnómico",
      descripcion: "Gnomo del bosque (conoce el truco Ilusión menor y habla con bestias) o Gnomo de las rocas (conoce Prestidigitación e inventa artilugios).",
      tipoAccion: "pasivo"
    }
  ],

  "Tiefling": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Legado infernal",
      descripcion: "Obtienes resistencia a un tipo de daño (Fuego, Veneno o Necrótico) y conjuros sobrenaturales innatos según tu linaje (Abisal, Ctónico o Infernal).",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Taumaturgia innata",
      descripcion: "Conoces el truco Taumaturgia y lo lanzas usando Carisma o Inteligencia.",
      tipoAccion: "pasivo"
    }
  ],

  "Dracónido": [
    {
      nombre: "Arma de aliento",
      descripcion: "Cuando lleves a cabo la acción de atacar, puedes sustituir uno de tus ataques por una exhalación mágica destructiva (cono de 15 pies o línea de 30 pies) de tu tipo de dragón (usos iguales a tu bonificador de competencia).",
      tipoAccion: "accion",
      tieneUsosLimitados: true,
      usosMaximos: 2,
      recuperacion: "descanso_largo",
      formulaDados: "1d10"
    },
    {
      nombre: "Resistencia a daño dracónico",
      descripcion: "Tienes resistencia al tipo de daño asociado con tu linaje dracónico (Fuego, Frío, Ácido, Relámpago o Veneno).",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Vuelo dracónico (Nivel 5)",
      descripcion: "A partir de nivel 5, puedes desplegar alas espectrales como acción adicional durante 10 minutos (1/descanso largo).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo"
    }
  ],

  "Orco": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 120 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Embestida impetuosa",
      descripcion: "Como acción adicional, puedes moverte hasta tu velocidad hacia un enemigo y ganas puntos de golpe temporales iguales a tu bonificador de competencia (usos iguales a PB).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 2,
      recuperacion: "descanso_corto"
    },
    {
      nombre: "Resistencia implacable",
      descripcion: "Cuando tus puntos de golpe se reducen a 0 pero no mueres en el acto, puedes quedar a 1 punto de golpe en su lugar (1/descanso largo).",
      tipoAccion: "reaccion",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo"
    }
  ],

  "Goliat": [
    {
      nombre: "Ascendencia de gigantes",
      descripcion: "Obtienes un poder sobrenatural de gigante (Gigante de fuego, escarcha, colina, piedra, tormenta o nubes) utilizable tantas veces como tu bonificador de competencia.",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 2,
      recuperacion: "descanso_largo"
    },
    {
      nombre: "Forma gigantesca (Nivel 5)",
      descripcion: "A nivel 5, puedes hacerte de tamaño Grande durante 10 minutos como acción adicional (1/descanso largo).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo"
    },
    {
      nombre: "Poderosa complexión",
      descripcion: "Cuentas como un tamaño superior para determinar tu capacidad de carga y peso que puedes empujar, arrastrar o levantar.",
      tipoAccion: "pasivo"
    }
  ],

  "Aasimar": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Manos sanadoras",
      descripcion: "Como acción de magia, tocas a una criatura y tiras tantos d4 como tu bonificador de competencia, curándole esa cantidad de HP (1/descanso largo).",
      tipoAccion: "accion",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo",
      formulaDados: "2d4"
    },
    {
      nombre: "Resistencia celestial",
      descripcion: "Tienes resistencia al daño radiante y necrótico.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Revelación celestial (Nivel 3)",
      descripcion: "Como acción adicional, desatas tu poder divino durante 1 minuto (Alas radiantes, Consunción radiante o Velo necrótico).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo"
    }
  ]
};

// -------------------------------------------------------
// 3. DOTES CANÓNICAS DE D&D 5.5e (PHB 2024)
// -------------------------------------------------------

export const DOTES_CANONICAS_DND55: DotePersonaje[] = [
  {
    id: "dote_alerta",
    nombre: "Alerta",
    categoria: "origen",
    descripcion: "Siempre estás atento al peligro. Sumas tu bonificador de competencia a la iniciativa y puedes intercambiar tu tirada de iniciativa con la de un aliado voluntario.",
    beneficios: ["+PB a iniciativa", "Intercambio de iniciativa"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_iniciativa_magica",
    nombre: "Iniciado en la Magia",
    categoria: "origen",
    descripcion: "Aprendes dos trucos y un conjuro de nivel 1 de la lista de Clérigo, Druida o Mago. Puedes lanzar el conjuro de nivel 1 una vez al día sin gastar espacio.",
    beneficios: ["2 Trucos elegidos", "1 Conjuro de Nivel 1 (1/descanso largo)"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_suerte",
    nombre: "Afortunado",
    categoria: "origen",
    descripcion: "Tienes puntos de suerte iguales a tu bonificador de competencia. Puedes gastar un punto para ganar ventaja en un d20 o imponer desventaja a un atacante contra ti.",
    beneficios: ["Puntos de suerte iguales a PB", "Ventaja propia o desventaja a atacante"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_musico",
    nombre: "Músico",
    categoria: "origen",
    descripcion: "Al finalizar un descanso corto o largo, tocas música para inspirar a tus aliados. Otorgas Inspiración heroica a tantos compañeros como tu bonificador de competencia.",
    beneficios: ["Inspiración heroica para aliados tras descanso"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_duro",
    nombre: "Duro / Robusto",
    categoria: "origen",
    descripcion: "Tus puntos de golpe máximos aumentan en una cantidad igual al doble de tu nivel.",
    beneficios: ["+2 HP por nivel"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_tirador_primera",
    nombre: "Tirador de Primera (Sharpshooter)",
    categoria: "general",
    requisito: "Destreza 13+",
    descripcion: "Dominas el combate a distancia: disparar a alcance largo no te impone desventaja, tus ataques a distancia ignoran cobertura media y tres cuartos, y no tienes desventaja al disparar cuerpo a cuerpo.",
    beneficios: ["Ignora cobertura media y 3/4", "Sin desventaja a alcance largo", "Sin penalización cuerpo a cuerpo"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_maestro_armas_pesadas",
    nombre: "Maestro en Armas Pesadas (Great Weapon Master)",
    categoria: "general",
    requisito: "Fuerza 13+",
    descripcion: "Cuando asestes un crítico o reduzcas a 0 HP a una criatura con un arma cuerpo a cuerpo pesada, puedes hacer otro ataque como acción adicional. Sumas tu PB al daño de armas pesadas.",
    beneficios: ["Ataque extra tras crítico/muerte", "+PB al daño con armas pesadas"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_combatiente_dos_armas",
    nombre: "Combatiente con Dos Armas (Dual Wielder)",
    categoria: "general",
    requisito: "Fuerza o Destreza 13+",
    descripcion: "Puedes usar combate con dos armas incluso con armas que no sean ligeras. Puedes hacer un ataque adicional extra como acción adicional.",
    beneficios: ["Uso con armas no ligeras", "Ataque adicional secundario"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_resiliente",
    nombre: "Resiliente",
    categoria: "general",
    descripcion: "Aumentas una puntuación de característica en +1 y ganas competencia en las tiradas de salvación con esa característica.",
    beneficios: ["+1 a característica", "Competencia en salvación elegida"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_don_pericia_combate",
    nombre: "Don de la Pericia en Combate",
    categoria: "don_epico",
    requisito: "Nivel 19+",
    descripcion: "Aumentas una característica en +1 (máx 30). Si fallas una tirada de ataque, puedes convertirla en un acierto una vez por turno.",
    beneficios: ["+1 característica (máx 30)", "Convertir fallo en acierto (1/turno)"],
    fuente: "PHB 2024"
  }
];
