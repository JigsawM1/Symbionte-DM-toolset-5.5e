/**
 * Catálogo maestro de conjuros siempre preparados y otorgados por subclase
 * en las reglas oficiales de D&D 5.5e (2024).
 */

export interface ProgresionConjurosNivel {
  nivelClase: number;
  conjuros?: string[];
  trucos?: string[];
}

export interface DefinicionSubclaseConjuros {
  clase: string;
  subclase: string;
  progresion: ProgresionConjurosNivel[];
  variantes?: Record<string, ProgresionConjurosNivel[]>;
}

/**
 * Mapa de sinónimos y alias de traducción de conjuros para compatibilidad
 * entre nombres de D&D 2024 / 5.5e y compendios clásicos en español.
 */
export const MAPA_ALIAS_HECHIZOS: Record<string, string[]> = {
  "susurros disonantes": ["susurros discordantes", "dissonant whispers"],
  "susurros discordantes": ["susurros disonantes", "dissonant whispers"],
  "risa espantosa de tasha": ["risa horrible de tasha", "tashas hideous laughter", "risa de tasha"],
  "risa horrible de tasha": ["risa espantosa de tasha", "tashas hideous laughter", "risa de tasha"],
  "vinculo telepatico de rary": ["enlace telepatico de rary", "rarys telepathic bond"],
  "enlace telepatico de rary": ["vinculo telepatico de rary", "rarys telepathic bond"],
  "tentaculos negros de evard": ["evards black tentacles", "tentaculos negros"],
};

/**
 * Catálogo Maestro Oficial de Conjuros y Trucos otorgados por Subclases
 * para las 12 clases de D&D 5.5e (2024).
 */
export const CATALOGO_CONJUROS_SUBCLASES: DefinicionSubclaseConjuros[] = [
  // =========================================================================
  // 1. CLÉRIGO
  // =========================================================================
  {
    clase: "Clérigo",
    subclase: "Dominio de la Vida",
    progresion: [
      { nivelClase: 3, conjuros: ["Auxilio", "Bendición", "Curar heridas", "Restablecimiento menor"] },
      { nivelClase: 5, conjuros: ["Palabra de curación en masa", "Revivir"] },
      { nivelClase: 7, conjuros: ["Aura de vida", "Guarda contra la muerte"] },
      { nivelClase: 9, conjuros: ["Restablecimiento mayor", "Curar heridas en masa"] },
    ],
  },
  {
    clase: "Clérigo",
    subclase: "Dominio de la Luz",
    progresion: [
      { nivelClase: 3, conjuros: ["Manos ardientes", "Fuego feérico", "Rayo abrasador", "Ver invisibilidad"] },
      { nivelClase: 5, conjuros: ["Luz del día", "Bola de fuego"] },
      { nivelClase: 7, conjuros: ["Ojo arcano", "Muro de fuego"] },
      { nivelClase: 9, conjuros: ["Columna de llamas", "Escrudiñar"] },
    ],
  },
  {
    clase: "Clérigo",
    subclase: "Dominio del Engaño",
    progresion: [
      { nivelClase: 3, conjuros: ["Hechizar persona", "Disfrazarse", "Invisibilidad", "Pasar sin rastro"] },
      { nivelClase: 5, conjuros: ["Patrón hipnótico", "Indetectable"] },
      { nivelClase: 7, conjuros: ["Confusión", "Puerta dimensional"] },
      { nivelClase: 9, conjuros: ["Dominar persona", "Alterar los recuerdos"] },
    ],
  },
  {
    clase: "Clérigo",
    subclase: "Dominio de la Guerra",
    progresion: [
      { nivelClase: 3, conjuros: ["Saeta guía", "Arma mágica", "Escudo de fe", "Arma espiritual"] },
      { nivelClase: 5, conjuros: ["Manto del cruzado", "Espíritus guardianes"] },
      { nivelClase: 7, conjuros: ["Escudo de fuego", "Libertad de movimiento"] },
      { nivelClase: 9, conjuros: ["Inmovilizar monstruo", "Golpe de viento acerado"] },
    ],
  },

  // =========================================================================
  // 2. PALADÍN
  // =========================================================================
  {
    clase: "Paladín",
    subclase: "Juramento de Entrega",
    progresion: [
      { nivelClase: 3, conjuros: ["Protección contra el bien y el mal", "Escudo de fe"] },
      { nivelClase: 5, conjuros: ["Auxilio", "Zona de verdad"] },
      { nivelClase: 9, conjuros: ["Faro de esperanza", "Disipar magia"] },
      { nivelClase: 13, conjuros: ["Libertad de movimiento", "Guardián de la fe"] },
      { nivelClase: 17, conjuros: ["Comunión", "Descarga flamígera"] },
    ],
  },
  {
    clase: "Paladín",
    subclase: "Juramento de Devoción",
    progresion: [
      { nivelClase: 3, conjuros: ["Protección contra el bien y el mal", "Escudo de fe"] },
      { nivelClase: 5, conjuros: ["Auxilio", "Zona de verdad"] },
      { nivelClase: 9, conjuros: ["Faro de esperanza", "Disipar magia"] },
      { nivelClase: 13, conjuros: ["Libertad de movimiento", "Guardián de la fe"] },
      { nivelClase: 17, conjuros: ["Comunión", "Descarga flamígera"] },
    ],
  },
  {
    clase: "Paladín",
    subclase: "Juramento de Gloria",
    progresion: [
      { nivelClase: 3, conjuros: ["Saeta guía", "Heroísmo"] },
      { nivelClase: 5, conjuros: ["Mejorar característica", "Arma mágica"] },
      { nivelClase: 9, conjuros: ["Acelerar", "Protección contra energía"] },
      { nivelClase: 13, conjuros: ["Compulsión", "Libertad de movimiento"] },
      { nivelClase: 17, conjuros: ["Conocimiento de leyendas", "Presencia regia de Yolande"] },
    ],
  },
  {
    clase: "Paladín",
    subclase: "Juramento de los Antiguos",
    progresion: [
      { nivelClase: 3, conjuros: ["Golpe apresador", "Hablar con los animales"] },
      { nivelClase: 5, conjuros: ["Paso brumoso", "Rayo lunar"] },
      { nivelClase: 9, conjuros: ["Crecimiento vegetal", "Protección contra energía"] },
      { nivelClase: 13, conjuros: ["Tormenta de hielo", "Piel pétrea"] },
      { nivelClase: 17, conjuros: ["Comulgar con la naturaleza", "Zancada arbórea"] },
    ],
  },
  {
    clase: "Paladín",
    subclase: "Juramento de Venganza",
    progresion: [
      { nivelClase: 3, conjuros: ["Perdición", "Marca del cazador"] },
      { nivelClase: 5, conjuros: ["Inmovilizar persona", "Paso brumoso"] },
      { nivelClase: 9, conjuros: ["Acelerar", "Protección contra energía"] },
      { nivelClase: 13, conjuros: ["Destierro", "Puerta dimensional"] },
      { nivelClase: 17, conjuros: ["Inmovilizar monstruo", "Escrudiñar"] },
    ],
  },

  // =========================================================================
  // 3. BRUJO
  // =========================================================================
  {
    clase: "Brujo",
    subclase: "Patrón de los Archihadas",
    progresion: [
      { nivelClase: 3, conjuros: ["Calmar emociones", "Fuego feérico", "Paso brumoso", "Fuerza fantasmal", "Dormir"] },
      { nivelClase: 5, conjuros: ["Parpadeo", "Crecimiento vegetal"] },
      { nivelClase: 7, conjuros: ["Dominar bestia", "Invisibilidad mayor"] },
      { nivelClase: 9, conjuros: ["Dominar persona", "Apariencia"] },
    ],
  },
  {
    clase: "Brujo",
    subclase: "Patrón Celestial",
    progresion: [
      { nivelClase: 3, conjuros: ["Auxilio", "Curar heridas", "Saeta guía", "Restablecimiento menor"], trucos: ["Luz", "Llama sagrada"] },
      { nivelClase: 5, conjuros: ["Luz del día", "Revivir"] },
      { nivelClase: 7, conjuros: ["Guardián de la fe", "Muro de fuego"] },
      { nivelClase: 9, conjuros: ["Restablecimiento mayor", "Invocar celestial"] },
    ],
  },
  {
    clase: "Brujo",
    subclase: "Patrón Infernal",
    progresion: [
      { nivelClase: 3, conjuros: ["Manos ardientes", "Orden imperiosa", "Rayo abrasador", "Sugestión"] },
      { nivelClase: 5, conjuros: ["Bola de fuego", "Nube apestosa"] },
      { nivelClase: 7, conjuros: ["Escudo de fuego", "Muro de fuego"] },
      { nivelClase: 9, conjuros: ["Misión", "Plaga de insectos"] },
    ],
  },
  {
    clase: "Brujo",
    subclase: "Patrón del Gran Primigenio",
    progresion: [
      { nivelClase: 3, conjuros: ["Detectar pensamientos", "Susurros discordantes", "Fuerza fantasmal", "Risa horrible de Tasha"] },
      { nivelClase: 5, conjuros: ["Clarividencia", "Hambre de Hadar"] },
      { nivelClase: 7, conjuros: ["Confusión", "Invocar aberración"] },
      { nivelClase: 9, conjuros: ["Alterar los recuerdos", "Telequinesis"] },
      { nivelClase: 10, conjuros: ["Maldición"] },
    ],
  },

  // =========================================================================
  // 4. DRUIDA
  // =========================================================================
  {
    clase: "Druida",
    subclase: "Círculo de la Tierra",
    progresion: [
      { nivelClase: 3, conjuros: ["Paso brumoso", "Manos ardientes"] },
      { nivelClase: 5, conjuros: ["Bola de fuego", "Relámpago"] },
      { nivelClase: 7, conjuros: ["Libertad de movimiento", "Piel pétrea"] },
      { nivelClase: 9, conjuros: ["Muro de piedra", "Zancada arbórea"] },
    ],
    variantes: {
      "árida": [
        { nivelClase: 3, conjuros: ["Contorno borroso", "Manos ardientes"], trucos: ["Saeta de fuego"] },
        { nivelClase: 5, conjuros: ["Bola de fuego"] },
        { nivelClase: 7, conjuros: ["Marchitar"] },
        { nivelClase: 9, conjuros: ["Muro de piedra"] },
      ],
      "polar": [
        { nivelClase: 3, conjuros: ["Nube de oscurecimiento", "Inmovilizar persona"], trucos: ["Rayo de escarcha"] },
        { nivelClase: 5, conjuros: ["Tormenta de aguanieve"] },
        { nivelClase: 7, conjuros: ["Tormenta de hielo"] },
        { nivelClase: 9, conjuros: ["Cono de frío"] },
      ],
      "templada": [
        { nivelClase: 3, conjuros: ["Paso brumoso", "Dormir"], trucos: ["Agarre electrizante"] },
        { nivelClase: 5, conjuros: ["Relámpago"] },
        { nivelClase: 7, conjuros: ["Libertad de movimiento"] },
        { nivelClase: 9, conjuros: ["Zancada arbórea"] },
      ],
      "tropical": [
        { nivelClase: 3, conjuros: ["Rayo de enfermedad", "Telaraña"], trucos: ["Salpicadura ácida"] },
        { nivelClase: 5, conjuros: ["Nube apestosa"] },
        { nivelClase: 7, conjuros: ["Polimorfar"] },
        { nivelClase: 9, conjuros: ["Plaga de insectos"] },
      ],
    },
  },
  {
    clase: "Druida",
    subclase: "Círculo de la Luna",
    progresion: [
      { nivelClase: 3, conjuros: ["Curar heridas", "Rayo lunar", "Voluta estelar"] },
      { nivelClase: 5, conjuros: ["Conjurar animales"] },
      { nivelClase: 7, conjuros: ["Fuente de luz lunar"] },
      { nivelClase: 9, conjuros: ["Curar heridas en masa"] },
    ],
  },
  {
    clase: "Druida",
    subclase: "Círculo del Mar",
    progresion: [
      { nivelClase: 3, conjuros: ["Nube de oscurecimiento", "Ráfaga de viento", "Hacer añicos", "Ola atronadora"], trucos: ["Rayo de escarcha"] },
      { nivelClase: 5, conjuros: ["Relámpago", "Respirar bajo el agua"] },
      { nivelClase: 7, conjuros: ["Controlar agua", "Tormenta de hielo"] },
      { nivelClase: 9, conjuros: ["Conjurar elemental", "Inmovilizar monstruo"] },
    ],
  },
  {
    clase: "Druida",
    subclase: "Círculo de las Estrellas",
    progresion: [
      { nivelClase: 3, conjuros: ["Saeta guía"], trucos: ["Guía"] },
    ],
  },

  // =========================================================================
  // 5. HECHICERO
  // =========================================================================
  {
    clase: "Hechicero",
    subclase: "Hechicería Aberrante",
    progresion: [
      { nivelClase: 3, conjuros: ["Brazos de Hadar", "Calmar emociones", "Detectar pensamientos", "Susurros discordantes"], trucos: ["Astilla mental"] },
      { nivelClase: 5, conjuros: ["Hambre de Hadar", "Enviar mensaje"] },
      { nivelClase: 7, conjuros: ["Tentáculos negros de Evard", "Invocar aberración"] },
      { nivelClase: 9, conjuros: ["Enlace telepático de Rary", "Telequinesis"] },
    ],
  },
  {
    clase: "Hechicero",
    subclase: "Hechicería del Mecanismo de Relojería",
    progresion: [
      { nivelClase: 3, conjuros: ["Auxilio", "Alarma", "Restablecimiento menor", "Protección contra el bien y el mal"] },
      { nivelClase: 5, conjuros: ["Disipar magia", "Protección contra energía"] },
      { nivelClase: 7, conjuros: ["Libertad de movimiento", "Invocar constructo"] },
      { nivelClase: 9, conjuros: ["Restablecimiento mayor", "Muro de fuerza"] },
    ],
  },
  {
    clase: "Hechicero",
    subclase: "Hechicería Dracónica",
    progresion: [
      { nivelClase: 3, conjuros: ["Alterar el propio aspecto", "Orbe cromático", "Orden imperiosa", "Aliento de dragón"] },
      { nivelClase: 5, conjuros: ["Miedo", "Volar"] },
      { nivelClase: 7, conjuros: ["Ojo arcano", "Hechizar monstruo"] },
      { nivelClase: 9, conjuros: ["Sabiduría popular", "Invocar dragón"] },
    ],
  },

  // =========================================================================
  // 6. EXPLORADOR
  // =========================================================================
  {
    clase: "Explorador",
    subclase: "Errante Feérico",
    progresion: [
      { nivelClase: 3, conjuros: ["Hechizar persona"] },
      { nivelClase: 5, conjuros: ["Paso brumoso"] },
      { nivelClase: 9, conjuros: ["Invocar feérico"] },
      { nivelClase: 13, conjuros: ["Puerta dimensional"] },
      { nivelClase: 17, conjuros: ["Desorientar"] },
    ],
  },
  {
    clase: "Explorador",
    subclase: "Acechador en la Penumbra",
    progresion: [
      { nivelClase: 3, conjuros: ["Disfrazarse"] },
      { nivelClase: 5, conjuros: ["Truco de la cuerda"] },
      { nivelClase: 9, conjuros: ["Miedo"] },
      { nivelClase: 13, conjuros: ["Invisibilidad mayor"] },
      { nivelClase: 17, conjuros: ["Apariencia"] },
    ],
  },

  // =========================================================================
  // 7. BARDO
  // =========================================================================
  {
    clase: "Bardo",
    subclase: "Colegio del Glamour",
    progresion: [
      { nivelClase: 3, conjuros: ["Hechizar persona", "Imagen múltiple"] },
      { nivelClase: 6, conjuros: ["Orden imperiosa"] },
    ],
  },

  // =========================================================================
  // 8. MAGO
  // =========================================================================
  {
    clase: "Mago",
    subclase: "Abjurador",
    progresion: [
      { nivelClase: 10, conjuros: ["Contrahechizo", "Disipar magia"] },
    ],
  },
  {
    clase: "Mago",
    subclase: "Ilusionista",
    progresion: [
      { nivelClase: 3, conjuros: [], trucos: ["Ilusión menor"] },
      { nivelClase: 6, conjuros: ["Invocar bestia", "Invocar feérico"] },
    ],
  },

  // =========================================================================
  // 9. GUERRERO
  // =========================================================================
  {
    clase: "Guerrero",
    subclase: "Guerrero Psiónico",
    progresion: [
      { nivelClase: 18, conjuros: ["Telequinesis"] },
    ],
  },

  // =========================================================================
  // 10. PÍCARO
  // =========================================================================
  {
    clase: "Pícaro",
    subclase: "Embaucador Arcano",
    progresion: [
      { nivelClase: 3, conjuros: [], trucos: ["Mano de mago"] },
    ],
  },

  // =========================================================================
  // 11. MONJE
  // =========================================================================
  {
    clase: "Monje",
    subclase: "Guerrero de la Sombra",
    progresion: [
      { nivelClase: 3, conjuros: ["Oscuridad"], trucos: ["Ilusión menor"] },
    ],
  },
  {
    clase: "Monje",
    subclase: "Guerrero de los Elementos",
    progresion: [
      { nivelClase: 3, conjuros: [], trucos: ["Elementalismo"] },
    ],
  },

  // =========================================================================
  // 12. BÁRBARO
  // =========================================================================
  {
    clase: "Bárbaro",
    subclase: "Senda del Corazón Salvaje",
    progresion: [
      { nivelClase: 3, conjuros: ["Sentidos de la bestia", "Hablar con los animales"] },
      { nivelClase: 10, conjuros: ["Comunión con la naturaleza"] },
    ],
  },
];
