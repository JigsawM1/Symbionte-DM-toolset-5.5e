export * from '../tipos';
import { MonstruoBase, HechizoBase, CondicionDnd, EfectoPredefinido } from '../tipos';
import MONSTRUOS_JSON from "./compendios/Mounstros.2024-es.json";
import HECHIZOS_JSON from "./compendios/all.json";
import EQUIPO_JSON from "./compendios/Equipo es.json";
import { importarDesdeJSON } from "../almacen/importadorJSON";

// Importar y sanitizar automáticamente los compendios base en español
const importacionMonstruos = importarDesdeJSON(MONSTRUOS_JSON, {
  baseDatosMonstruos: [],
  baseDatosHechizos: [],
  objetosHomebrew: []
});

const importacionHechizos = importarDesdeJSON(HECHIZOS_JSON, {
  baseDatosMonstruos: [],
  baseDatosHechizos: [],
  objetosHomebrew: []
});

const importacionEquipo = importarDesdeJSON(EQUIPO_JSON, {
  baseDatosMonstruos: [],
  baseDatosHechizos: [],
  objetosHomebrew: []
});

export const MONSTRUOS_INICIALES: MonstruoBase[] = importacionMonstruos.baseDatosMonstruos;
export const HECHIZOS_INICIALES: HechizoBase[] = importacionHechizos.baseDatosHechizos;
export const OBJETOS_INICIALES = importacionEquipo.objetosHomebrew;

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
    nombre: "APRESADO (Restrained)",
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
  },
  {
    nombre: "ASUSTADO (Frightened)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura asustada tiene desventaja en las pruebas de característica y tiradas de ataque mientras la fuente de su miedo esté dentro de su línea de visión.",
      "La criatura no puede acercarse voluntariamente a la fuente de su miedo."
    ]
  },
  {
    nombre: "PETRIFICADO (Petrified)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "La criatura petrificada es transformada, junto con todos sus objetos no mágicos que viste o lleva, en una sustancia sólida e inerte (generalmente piedra). Su peso se multiplica por diez y cesa de envejecer.",
      "La criatura está Incapacitada, no puede moverse ni hablar, y no es consciente de su entorno.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.",
      "La criatura tiene resistencia a todos los tipos de daño.",
      "La criatura es inmune al veneno y a la condición de Envenenado (si ya estaba envenenada, el efecto se suspende pero no se neutraliza)."
    ]
  },
  {
    nombre: "CANSADO (Exhausted)",
    descripcion: "Reglas D&D 2024 (5.5e)",
    efectos: [
      "Esta condición es acumulativa y tiene 6 niveles. Si alcanzas el nivel 6, mueres de inmediato.",
      "Tiradas d20: Restas 2 veces tu nivel de cansancio a todas tus tiradas de d20 (ataques, salvaciones y pruebas).",
      "Velocidad: Tu velocidad se reduce en 5 pies por cada nivel de cansancio.",
      "Un descanso largo reduce tu nivel de cansancio en 1, siempre que consumas comida y bebida."
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

export const EFECTOS_PREDEFINIDOS: EfectoPredefinido[] = [
  { nombre: "Bendecir (Bless)", descripcion: "Añade 1d4 a las tiradas de ataque y salvaciones.", duracionEstandar: 10 },
  { nombre: "Furia (Rage)", descripcion: "Ventaja en tiradas de Fuerza, daño extra en ataques de Fuerza, resistencia a daño contundente, perforante y cortante.", duracionEstandar: 10 },
  { nombre: "Auxilio (Aid)", descripcion: "Aumenta los puntos de golpe máximos y actuales en 5 por nivel de espacio.", duracionEstandar: 800 },
  { nombre: "Concentración", descripcion: "La criatura se está concentrando en mantener un conjuro activo.", duracionEstandar: 100, esConcentracion: true },
  { nombre: "Escudo (Shield)", descripcion: "+5 a la CA y no sufre daño de Proyectil Mágico.", duracionEstandar: 1 },
  { nombre: "Heroísmo (Heroism)", descripcion: "Inmune al miedo y recibe puntos de golpe temporales al inicio de cada turno.", duracionEstandar: 10 },
  { nombre: "Inspirado (Inspiración Bárdica)", descripcion: "Puede añadir un dado de inspiración (d6/d8/d10/d12) a una tirada de d20.", duracionEstandar: 100 },
  { nombre: "Maldición (Bestow Curse)", descripcion: "El objetivo sufre desventaja en pruebas y salvaciones de una característica, o daño extra.", duracionEstandar: 10 },
  { nombre: "Maleficio (Hex)", descripcion: "Daño extra al golpear al objetivo y desventaja en pruebas de una característica.", duracionEstandar: 100 },
  { nombre: "Perdición (Bane)", descripcion: "Resta 1d4 a las tiradas de ataque y salvaciones del objetivo.", duracionEstandar: 10 },
  { nombre: "Prisa (Haste)", descripcion: "CA +2, ventaja en salvaciones de Destreza, acción adicional en cada turno. Al terminar, no puede moverse ni actuar durante 1 turno.", duracionEstandar: 10 },
  { nombre: "Recargando (Recharging)", descripcion: "La habilidad especial o aliento está recargando para poder usarse nuevamente.", duracionEstandar: 1 },
  { nombre: "Ralentizar (Slow)", descripcion: "Velocidad a la mitad, CA -2, -2 a salvaciones de Destreza, no puede realizar reacciones.", duracionEstandar: 10 },
  { nombre: "Santuario (Sanctuary)", descripcion: "Cualquier criatura que intente atacar al objetivo debe superar una salvación de Sabiduría.", duracionEstandar: 10 },
  { nombre: "Hechicería Innata", descripcion: "Regla 2024: Como acción adicional, obtienes ventaja en tiradas de ataque de conjuro y tu CD de salvación aumenta en 1.", duracionEstandar: 10 }
];
