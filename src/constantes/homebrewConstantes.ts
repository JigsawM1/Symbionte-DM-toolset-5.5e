export const TIPOS_DAÑO_DND = [
  "ácido", "adamantina", "contundente", "contundente mágico",
  "cortante", "cortante mágico", "fuego", "frío", "fuerza",
  "necrótico", "perforante", "perforante mágico",
  "plata", "psíquico", "radiante", "relámpago", "trueno", "veneno"
];

export const CONDICIONES_DND = [
  "agarrado", "apresado", "asustado", "aturdido", "cansancio",
  "cegado", "derribado", "ensordecido", "envenenado", "hechizado",
  "incapacitado", "inconsciente", "invisible", "paralizado", "petrificado"
];

// Lista oficial completa de clases de D&D 5.5e (2024) y Artífice
export const CLASES_DND = [
  "Bárbaro",
  "Bardo",
  "Brujo",
  "Clérigo",
  "Druida",
  "Explorador",
  "Guerrero",
  "Hechicero",
  "Mago",
  "Monje",
  "Paladín",
  "Pícaro",
  "Artífice"
];

export const HABILIDADES_LISTA = [
  { clave: "acrobacias", nombre: "Acrobacias" },
  { clave: "arcanos", nombre: "Arcanos" },
  { clave: "atletismo", nombre: "Atletismo" },
  { clave: "engaño", nombre: "Engaño" },
  { clave: "historia", nombre: "Historia" },
  { clave: "interpretacion", nombre: "Interpretación" },
  { clave: "intimidacion", nombre: "Intimidación" },
  { clave: "investigacion", nombre: "Investigación" },
  { clave: "juegoManos", nombre: "Juego de Manos" },
  { clave: "manejoAnimales", nombre: "Manejo Animales" },
  { clave: "medicina", nombre: "Medicina" },
  { clave: "naturaleza", nombre: "Naturaleza" },
  { clave: "percepcion", nombre: "Percepción" },
  { clave: "perspicacia", nombre: "Perspicacia" },
  { clave: "persuasion", nombre: "Persuasión" },
  { clave: "religion", nombre: "Religión" },
  { clave: "sigilo", nombre: "Sigilo" },
  { clave: "supervivencia", nombre: "Supervivencia" }
];

export const CARACTERISTICAS_CLAVES = [
  { clave: "fuerza", etiqueta: "FUE" },
  { clave: "destreza", etiqueta: "DES" },
  { clave: "constitucion", etiqueta: "CON" },
  { clave: "inteligencia", etiqueta: "INT" },
  { clave: "sabiduria", etiqueta: "SAB" },
  { clave: "carisma", etiqueta: "CAR" }
];

export const Escuelas_Magia = [
  { clave: "Abjuracion", etiqueta:"Abjuración"},
  { clave: "Adivinacion", etiqueta:"Adivinación"},
  { clave: "Conjuracion", etiqueta:"Conjuración"},
  { clave: "Encantamiento", etiqueta:"Encantamiento"},
  { clave: "Evocacion", etiqueta:"Evocación"},
  { clave: "Ilusion", etiqueta:"Ilusión"},
  { clave: "Nigromancia", etiqueta:"Nigromancia"},
  { clave: "Transmutacion", etiqueta:"Transmutación"},  
];

export const Criatura_Tipos = [
  { clave: "Aberración", etiqueta: "Aberración" },
  { clave: "Abominación", etiqueta: "Abominación" },
  { clave: "Bestia", etiqueta: "Bestia" },
  { clave: "Celestial", etiqueta: "Celestial" },
  { clave: "Cieno", etiqueta: "Cieno" },  
  { clave: "Constructo", etiqueta: "Constructo" },
  { clave: "Dragón", etiqueta: "Dragón" },
  { clave: "Elemental", etiqueta: "Elemental" },
  { clave: "Feérico", etiqueta: "Feérico" },
  { clave: "Gigante", etiqueta: "Gigante" },
  { clave: "Humanoide", etiqueta: "Humanoide" },
  { clave: "Infernal", etiqueta: "Infernal" },
  { clave: "Monstruosidad", etiqueta: "Monstruosidad" },
  { clave: "No Muerto", etiqueta: "No Muerto" },
  { clave: "Planta", etiqueta: "Planta" },
];

export const SUGERENCIAS_TIPO_CRIATURA = [
  ...Criatura_Tipos.map((t) => t.clave),
  "Enjambre de Bestias Diminutas"
];

export const TAMAÑOS_CRIATURA = [
  "Diminuto",
  "Pequeño",
  "Mediano",
  "Grande",
  "Enorme",
  "Gargantuesco"
];

export const ALINEAMIENTOS_DND = [
  "Legal bueno",
  "Neutral bueno",
  "Caótico bueno",
  "Legal neutral",
  "Neutral",
  "Caótico neutral",
  "Legal malvado",
  "Neutral malvado",
  "Caótico malvado",
  "Sin alineamiento",
  "Cualquier alineamiento",
  "-"
];

export const SUGERENCIAS_CR_CRIATURA = [
  "0", "1/8", "1/4", "1/2",
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "—"
];