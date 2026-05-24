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

];

export const HECHIZOS_INICIALES: HechizoBase[] = [

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

