export interface Caracteristicas {
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
}

export interface AccionMonstruo {
  nombre: string;
  descripcion: string;
  bonificadorAtaque?: number;
  daño?: string;
  uso?: string;
}

export interface MonstruoBase {
  id: string;
  nombre: string;
  tipo: string;
  ca: number;
  caNotas?: string;
  vidaMaxima: number;
  vidaActual: number;
  vidaNotas?: string;
  iniciativaBonificador: number;
  velocidad: string;
  sentidos?: string;
  idiomas?: string;
  desafio?: string;
  fuente?: string;
  caracteristicas: Caracteristicas;
  salvaciones?: {
    fuerza?: number;
    destreza?: number;
    constitucion?: number;
    inteligencia?: number;
    sabiduria?: number;
    carisma?: number;
  };
  habilidades?: {
    acrobacias?: number;
    manejoAnimales?: number;
    arcanos?: number;
    atletismo?: number;
    engaño?: number;
    historia?: number;
    perspicacia?: number;
    intimidacion?: number;
    investigacion?: number;
    medicina?: number;
    naturaleza?: number;
    percepcion?: number;
    interpretacion?: number;
    persuasion?: number;
    religion?: number;
    juegoManos?: number;
    sigilo?: number;
    supervivencia?: number;
  };
  vulnerabilidades?: string[];
  resistencias?: string[];
  inmunidadesDaño?: string[];
  inmunidadesCondicion?: string[];
  accionesRapidas?: {
    nombre: string;
    bonificadorAtaque: string;
    dadosDaño: string;
    tipoDaño: string;
  }[];
  rasgos: { nombre: string; descripcion: string; uso?: string }[];
  acciones: AccionMonstruo[];
  reacciones?: { nombre: string; descripcion: string; uso?: string }[];
  accionesLegendarias?: { nombre: string; descripcion: string; uso?: string }[];
}

export interface HechizoBase {
  id: string;
  nombre: string;
  nivel: number;
  escuela: string;
  tiempoLanzamiento: string;
  alcance: string;
  componentes: string;
  descripcion: string;
  concentracion?: string | boolean;
  ritual?: string | boolean;
  
  // Campos avanzados estructurados
  descNivelSuperior?: string;
  materiales?: string;
  componentesSeleccionados?: { verbal: boolean; somatico: boolean; material: boolean };
  duracion?: string;
  clases?: string[];
  ataqueCd?: string;
  dadosDaño?: string;
  dadosDañoNivelSuperior?: string;
  cdSalvacion?: string;
  agregarModificadorHabilidad?: boolean;
  tipoDaño?: string;
}

export interface CondicionDnd {
  nombre: string;
  descripcion: string;
  efectos: string[];
}

export const MONSTRUOS_INICIALES: MonstruoBase[] = [
  {
    id: "m_orco",
    nombre: "Orco",
    tipo: "Humanoide",
    ca: 13,
    vidaMaxima: 15,
    vidaActual: 15,
    vidaNotas: "2d8+6",
    iniciativaBonificador: 1,
    velocidad: "30 pies",
    caracteristicas: { fuerza: 16, destreza: 12, constitucion: 16, inteligencia: 7, sabiduria: 11, carisma: 10 },
    rasgos: [
      { nombre: "Furia Agresiva", descripcion: "Como acción adicional, el orco puede moverse hasta su velocidad hacia una criatura enemiga que pueda ver." }
    ],
    acciones: [
      { nombre: "Gran Hacha", descripcion: "Ataque con arma cuerpo a cuerpo: +5 a impactar, alcance 5 pies. Daño: 9 (1d12 + 3) de daño cortante.", bonificadorAtaque: 5, daño: "1d12+3" },
      { nombre: "Jabalina", descripcion: "Ataque con arma cuerpo a cuerpo o a distancia: +5 a impactar, alcance 5 pies o distancia 30/120 pies. Daño: 6 (1d6 + 3) de daño perforante.", bonificadorAtaque: 5, daño: "1d6+3" }
    ]
  },
  {
    id: "m_trasgo",
    nombre: "Trasgo (Goblin)",
    tipo: "Humanoide",
    ca: 15,
    vidaMaxima: 7,
    vidaActual: 7,
    vidaNotas: "2d6",
    iniciativaBonificador: 2,
    velocidad: "30 pies",
    caracteristicas: { fuerza: 8, destreza: 14, constitucion: 10, inteligencia: 10, sabiduria: 8, carisma: 8 },
    rasgos: [
      { nombre: "Escape Ágil", descripcion: "El trasgo puede realizar las acciones de Destrabarse o Esconderse como acción adicional en cada uno de sus turnos." }
    ],
    acciones: [
      { nombre: "Cimitarra", descripcion: "Ataque con arma cuerpo a cuerpo: +4 a impactar, alcance 5 pies. Daño: 5 (1d6 + 2) de daño cortante.", bonificadorAtaque: 4, daño: "1d6+2" },
      { nombre: "Arco Corto", descripcion: "Ataque con arma a distancia: +4 a impactar, distancia 80/320 pies. Daño: 5 (1d6 + 2) de daño perforante.", bonificadorAtaque: 4, daño: "1d6+2" }
    ]
  },
  {
    id: "m_dragon_rojo_joven",
    nombre: "Dragón Rojo Joven",
    tipo: "Dragón",
    ca: 18,
    vidaMaxima: 178,
    vidaActual: 178,
    vidaNotas: "17d10+85",
    iniciativaBonificador: 0,
    velocidad: "40 pies, volar 80 pies",
    caracteristicas: { fuerza: 22, destreza: 10, constitucion: 21, inteligencia: 14, sabiduria: 11, carisma: 19 },
    rasgos: [
      { nombre: "Inmunidad al Fuego", descripcion: "El dragón es inmune al daño por fuego." }
    ],
    acciones: [
      { nombre: "Multiataque", descripcion: "El dragón realiza tres ataques: uno con su mordisco y dos con sus garras." },
      { nombre: "Mordisco", descripcion: "Ataque con arma cuerpo a cuerpo: +10 a impactar, alcance 10 pies. Daño: 17 (2d10 + 6) de daño perforante más 3 (1d6) de daño por fuego.", bonificadorAtaque: 10, daño: "2d10+6+1d6" },
      { nombre: "Garra", descripcion: "Ataque con arma cuerpo a cuerpo: +10 a impactar, alcance 5 pies. Daño: 13 (2d6 + 6) de daño cortante.", bonificadorAtaque: 10, daño: "2d6+6" },
      { nombre: "Aliento de Fuego (Recarga 5-6)", descripcion: "El dragón exhala fuego en un cono de 30 pies. Cada criatura en ese área debe realizar una tirada de salvación de Destreza CD 17, sufriendo 56 (16d6) de daño por fuego si falla, o la mitad si lo supera.", bonificadorAtaque: 0, daño: "16d6" }
    ]
  },
  {
    id: "m_esqueleto",
    nombre: "Esqueleto",
    tipo: "No Muerto",
    ca: 13,
    vidaMaxima: 13,
    vidaActual: 13,
    vidaNotas: "2d8+4",
    iniciativaBonificador: 2,
    velocidad: "30 pies",
    caracteristicas: { fuerza: 10, destreza: 14, constitucion: 15, inteligencia: 6, sabiduria: 8, carisma: 5 },
    rasgos: [
      { nombre: "Vulnerabilidad Contundente", descripcion: "El esqueleto sufre el doble de daño de ataques contundentes." },
      { nombre: "Inmunidad al Veneno", descripcion: "El esqueleto es inmune al daño por veneno y a la condición de Envenenado." }
    ],
    acciones: [
      { nombre: "Espada Corta", descripcion: "Ataque con arma cuerpo a cuerpo: +4 a impactar, alcance 5 pies. Daño: 5 (1d6 + 2) de daño perforante.", bonificadorAtaque: 4, daño: "1d6+2" },
      { nombre: "Arco Corto", descripcion: "Ataque con arma a distancia: +4 a impactar, distancia 80/320 pies. Daño: 5 (1d6 + 2) de daño perforante.", bonificadorAtaque: 4, daño: "1d6+2" }
    ]
  },
  {
    id: "m_mimico",
    nombre: "Mímico",
    tipo: "Monstruosidad",
    ca: 12,
    vidaMaxima: 58,
    vidaActual: 58,
    vidaNotas: "9d8+18",
    iniciativaBonificador: 1,
    velocidad: "15 pies",
    caracteristicas: { fuerza: 17, destreza: 12, constitucion: 15, inteligencia: 5, sabiduria: 13, carisma: 8 },
    rasgos: [
      { nombre: "Falsa Apariencia", descripcion: "Mientras permanezca inmóvil, el mímico es indistinguible de un objeto ordinario (como un cofre, puerta, etc.)." },
      { nombre: "Adhesivo", descripcion: "El mímico se adhiere a cualquier criatura u objeto que toque. Una criatura adherida queda Agarrada por el mímico (CD 13 para escapar)." }
    ],
    acciones: [
      { nombre: "Seudópodo", descripcion: "Ataque con arma cuerpo a cuerpo: +5 a impactar, alcance 5 pies. Daño: 7 (1d8 + 3) de daño contundente. El objetivo queda adherido al mímico.", bonificadorAtaque: 5, daño: "1d8+3" },
      { nombre: "Mordisco", descripcion: "Ataque con arma cuerpo a cuerpo: +5 a impactar, alcance 5 pies. Daño: 7 (1d8 + 3) de daño perforante más 4 (1d8) de daño por ácido.", bonificadorAtaque: 5, daño: "1d8+3+1d8" }
    ]
  }
];

export const HECHIZOS_INICIALES: HechizoBase[] = [
  {
    id: "h_proyectil_magico",
    nombre: "Proyectil Mágico",
    nivel: 1,
    escuela: "Evocación",
    tiempoLanzamiento: "1 acción",
    alcance: "120 pies",
    componentes: "V, S",
    duracion: "Instantáneo",
    dadosDaño: "1d4+1",
    tipoDaño: "Fuerza",
    dadosDañoNivelSuperior: "1d4+1",
    ataqueCd: "Auto impacto",
    descNivelSuperior: "Creas un dardo adicional (1d4+1) por cada nivel de ranura superior a 1.",
    clases: ["Mago", "Hechicero"],
    descripcion: "Creas tres dardos brillantes de fuerza mágica. Cada dardo impacta automáticamente en una criatura de tu elección que puedas ver dentro del alcance. Cada dardo inflige 1d4 + 1 de daño de fuerza. Si se lanza a niveles superiores, creas un dardo adicional por cada nivel por encima de 1."
  },
  {
    id: "h_curar_heridas",
    nombre: "Curar Heridas (2024)",
    nivel: 1,
    escuela: "Abjuración",
    tiempoLanzamiento: "1 acción",
    alcance: "Toque",
    componentes: "V, S",
    duracion: "Instantáneo",
    dadosDaño: "2d8",
    tipoDaño: "Curación",
    dadosDañoNivelSuperior: "2d8",
    ataqueCd: "Toque",
    descNivelSuperior: "La curación aumenta en 2d8 adicionales por cada nivel de ranura por encima de 1.",
    clases: ["Clérigo", "Bardo", "Paladín", "Explorador", "Druida"],
    descripcion: "Una criatura que toques recupera una cantidad de puntos de golpe igual a 2d8 + tu modificador por característica para lanzar conjuros. (En las reglas de 2024, Curar Heridas ahora cura 2d8 en nivel 1 en lugar de 1d8). Si se lanza a niveles superiores, cura 2d8 adicionales por nivel por encima de 1."
  },
  {
    id: "h_bola_fuego",
    nombre: "Bola de Fuego",
    nivel: 3,
    escuela: "Evocación",
    tiempoLanzamiento: "1 acción",
    alcance: "150 pies",
    componentes: "V, S, M (una bolita de guano de murciélago y azufre)",
    duracion: "Instantáneo",
    dadosDaño: "8d6",
    tipoDaño: "Fuego",
    dadosDañoNivelSuperior: "1d6",
    cdSalvacion: "Destreza",
    descNivelSuperior: "El daño aumenta en 1d6 por cada nivel de ranura por encima de 3.",
    clases: ["Mago", "Hechicero", "Bardo"],
    descripcion: "Un haz brillante surge de tu dedo índice y estalla con un estruendo sordo en una esfera de 20 pies de radio en el punto elegido. Cada criatura en la esfera debe realizar una salvación de Destreza. Si falla, sufre 8d6 de daño por fuego, o la mitad si tiene éxito. El fuego se extiende a las esquinas e inflama objetos inflamables que no estén bajo posesión."
  },
  {
    id: "h_escudo",
    nombre: "Escudo",
    nivel: 1,
    escuela: "Abjuración",
    tiempoLanzamiento: "1 reacción (al ser golpeado por un ataque o por proyectil mágico)",
    alcance: "Personal",
    componentes: "V, S",
    duracion: "1 ronda",
    ataqueCd: "+5 CA",
    clases: ["Mago", "Hechicero"],
    descripcion: "Un barrera invisible de fuerza mágica aparece para protegerte. Hasta el inicio de tu siguiente turno, obtienes un bonificador de +5 a tu CA (incluyendo contra el ataque desencadenante) y no sufres daño de Proyectil Mágico."
  },
  {
    id: "h_contraconjuro",
    nombre: "Contraconjuro (2024)",
    nivel: 3,
    escuela: "Abjuración",
    tiempoLanzamiento: "1 reacción (cuando ves a una criatura dentro de 60 pies lanzando un conjuro)",
    alcance: "60 pies",
    componentes: "S",
    duracion: "Instantáneo",
    cdSalvacion: "Carisma",
    clases: ["Mago", "Hechicero", "Bardo"],
    descripcion: "Intentas interrumpir el proceso de lanzamiento de conjuros de una criatura. (En las reglas de 2024, el objetivo ahora debe realizar una tirada de salvación de Carisma. Si la falla, el conjuro falla y se consume la acción, pero no el espacio de conjuro si era de nivel alto, o se desvanece por completo)."
  }
];

export const CONDICIONES_2024: CondicionDnd[] = [
  {
    nombre: "AGARRADO (Grappled)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La velocidad del objetivo agarrado pasa a ser 0 y no puede beneficiarse de ningún bonificador a la velocidad.",
      "La condición termina si el agarrador queda Incapacitado o si un efecto desplaza al objetivo fuera del alcance del agarrador.",
      "El agarrador puede arrastrar o cargar al objetivo agarrado, pero su velocidad se reduce a la mitad a menos que el objetivo sea dos o más tamaños más pequeño que él.",
      "El objetivo agarrado tiene desventaja en las tiradas de ataque contra cualquier criatura que no sea su agarrador.",
      "Para escapar, el objetivo puede usar su acción para realizar una tirada de salvación de Fuerza o Destreza contra la CD de salvación de agarre (normalmente 8 + modificador de Atletismo del agarrador)."
    ]
  },
  {
    nombre: "CEGADO (Blinded)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura ciega no puede ver y falla automáticamente cualquier prueba de característica que requiera la vista.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "Las tiradas de ataque de la criatura tienen desventaja."
    ]
  },
  {
    nombre: "HECHIZADO (Charmed)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura hechizada no puede atacar al hechizador ni afectarlo con habilidades dañinas o efectos mágicos.",
      "El hechizador tiene ventaja en cualquier prueba de característica para interactuar socialmente con la criatura hechizada."
    ]
  },
  {
    nombre: "ENSORDECIDO (Deafened)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura ensordecida no puede oír y falla automáticamente cualquier prueba de característica que requiera el oído."
    ]
  },
  {
    nombre: "INCAPACITADO (Incapacitated)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura no puede realizar acciones ni reacciones.",
      "Si la criatura está incapacitada, pierde la concentración en cualquier conjuro activo de forma automática.",
      "Su velocidad de iniciativa no se ve alterada directamente, pero no puede actuar en su turno."
    ]
  },
  {
    nombre: "INVISIBLE (Invisible)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura es imposible de ver sin la ayuda de magia o un sentido especial.",
      "La criatura se considera fuertemente oculta a efectos de esconderse.",
      "Las tiradas de ataque contra la criatura tienen desventaja, y las tiradas de ataque de la criatura tienen ventaja (siempre que el atacante no pueda verla)."
    ]
  },
  {
    nombre: "PARALIZADO (Paralyzed)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura paralizada está Incapacitada y no puede moverse ni hablar.",
      "La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "Cualquier ataque que golpee a la criatura es un impacto crítico si el atacante está a 5 pies o menos de ella."
    ]
  },
  {
    nombre: "DERRIBADO (Prone)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La única opción de movimiento de la criatura es arrastrarse, a menos que se levante gastando la mitad de su velocidad.",
      "La criatura tiene desventaja en las tiradas de ataque.",
      "Una tirada de ataque contra la criatura tiene ventaja si el atacante está a 5 pies o menos de ella. De lo contrario, la tirada de ataque tiene desventaja."
    ]
  },
  {
    nombre: "RESTRINGIDO (Restrained)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La velocidad de la criatura pasa a ser 0 y no puede beneficiarse de ningún bonificador a su velocidad.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "Las tiradas de ataque de la criatura tienen desventaja.",
      "La criatura tiene desventaja en las tiradas de salvación de Destreza."
    ]
  },
  {
    nombre: "ENVENENADO (Poisoned)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura envenenada tiene desventaja en las tiradas de ataque y en las pruebas de característica."
    ]
  },
  {
    nombre: "ATURDIDO (Stunned)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura aturdida está Incapacitada, no puede moverse y sólo puede hablar balbuceando.",
      "La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.",
      "Las tiradas de ataque contra la criatura tienen ventaja."
    ]
  },
  {
    nombre: "INCONSCIENTE (Unconscious)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura inconsciente está Incapacitada, no puede moverse ni hablar y no es consciente de su entorno.",
      "La criatura deja caer lo que esté sosteniendo y queda Derribada.",
      "La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "Cualquier ataque que golpee a la criatura es un impacto crítico si el atacante está a 5 pies o menos de ella."
    ]
  }
];

export const PIFIAS_ALEATORIAS: string[] = [
  "Tu arma se resbala de tus manos húmedas debido a la tensión y sale volando 1d6 x 5 pies en una dirección aleatoria.",
  "Calculas mal la distancia y golpeas fuertemente un obstáculo sólido. Debes realizar una salvación de Destreza CD 12 o quedarás Derribado (Prone).",
  "El esfuerzo del ataque te deja expuesto. El próximo ataque contra ti antes del inicio de tu siguiente turno tiene Ventaja.",
  "Te distraes por una décima de segundo y te muerdes la lengua fuertemente. Sufres 1d4 de daño contundente y tienes desventaja en lanzar conjuros con componentes verbales hasta el final de tu siguiente turno.",
  "Tu arma se traba o tu golpe es tan torpe que quedas Desequilibrado: tu velocidad se reduce a 0 hasta el final del turno actual.",
  "Golpeas accidentalmente a un aliado adyacente dentro de tu alcance. Realiza una tirada de daño plano (sin bonificadores) contra él.",
  "El polvo de la batalla te entra en los ojos. Quedas Cegado (Blinded) hasta el final del turno actual.",
  "Tus correas se aflojan. Pierdes la acción adicional de este turno para reacomodar tu armadura o equipo."
];

export const CRITICOS_ALEATORIOS: string[] = [
  "¡Golpe devastador! El impacto inflige el doble de dados de daño y el objetivo queda Derribado (Prone) automáticamente debido a la fuerza del golpe.",
  "¡Corte Preciso / Golpe Contundente! El objetivo sufre una herida grave y queda Incapacitado hasta el final de su siguiente turno.",
  "¡Herida Sangrante! El objetivo sufre 1d6 de daño cortante al inicio de cada uno de sus turnos. Esta herida se detiene si recibe cualquier tipo de curación mágica o si supera una prueba de Medicina CD 12 como acción.",
  "¡Impacto Desorientador! El golpe perturba los sentidos del objetivo. Queda Cegado o Ensordecido (a tu elección) hasta el final de su siguiente turno.",
  "¡Empujón Brutal! La fuerza de tu ataque empuja al objetivo 15 pies en línea recta alejado de ti. Si golpea una pared o superficie sólida, sufre 1d6 de daño contundente adicional.",
  "¡Rotura de Guardia! El ataque destruye momentáneamente la postura defensiva del enemigo. Hasta el inicio de tu siguiente turno, todos los ataques de tus aliados contra esta criatura tienen Ventaja.",
  "¡Ataque Inspirador! Tu golpe crítico es tan espectacular que tú o uno de tus aliados que pueda verte obtiene un Dado de Inspiración (Ventaja para usar en cualquier tirada dentro de los próximos 10 minutos).",
  "¡Golpe Incapacitante! Golpeas un tendón o articulación clave. La velocidad de la criatura se reduce a la mitad y no puede realizar reacciones durante 1 ronda completa."
];
