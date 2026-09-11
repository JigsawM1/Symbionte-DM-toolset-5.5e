export * from "@/tipos";
import { MonstruoBase, HechizoBase, CondicionDnd, EfectoPredefinido } from "@/tipos";
import MONSTRUOS_JSON from "./compendios/Mounstros.2024-es.json";
import HECHIZOS_JSON from "./compendios/all.json";
import EQUIPO_JSON from "./compendios/Equipo es.json";
import { sanearHechizoCD } from "@/almacen/sanitizacion";
import { importarDesdeJSON } from "@/almacen/importadorJSON";

// Hechizos canónicos precomputados cargados directamente en memoria
export const HECHIZOS_INICIALES: HechizoBase[] = (HECHIZOS_JSON as unknown as HechizoBase[]).map(sanearHechizoCD);

// Importar y sanitizar automáticamente los compendios base de monstruos y equipo
const importacionMonstruos = importarDesdeJSON(MONSTRUOS_JSON, {
  baseDatosMonstruos: [],
  baseDatosHechizos: HECHIZOS_INICIALES,
  objetosHomebrew: []
});

const importacionEquipo = importarDesdeJSON(EQUIPO_JSON, {
  baseDatosMonstruos: [],
  baseDatosHechizos: HECHIZOS_INICIALES,
  objetosHomebrew: []
});

export const MONSTRUOS_INICIALES: MonstruoBase[] = importacionMonstruos.baseDatosMonstruos;
export const OBJETOS_INICIALES = importacionEquipo.objetosHomebrew;

// Sets pre-computados una sola vez al cargar el módulo (Singleton Pattern).
// Evitan la re-creación O(N) en cada render de componentes y en cada ciclo de persistencia (debounce 250ms).
export const IDS_INICIALES_MONSTRUOS: ReadonlySet<string> = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
export const IDS_INICIALES_HECHIZOS: ReadonlySet<string>  = new Set(HECHIZOS_INICIALES.map((h) => h.id));
export const IDS_INICIALES_OBJETOS: ReadonlySet<string>   = new Set(OBJETOS_INICIALES.map((o) => o.id));

export const CONDICIONES_2024: CondicionDnd[] = [
  {
    nombre: "Agarrado",
    descripcion: "Reglas D&D",
    efectos: [
      "La velocidad del objetivo agarrado pasa a ser 0 y no puede beneficiarse de ningún bonificador a la velocidad.",
      "La condición termina si el agarrador queda Incapacitado o si un efecto desplaza al objetivo fuera del alcance del agarrador.",
      "El agarrador puede arrastrar o cargar al objetivo agarrado, pero su velocidad se reduce a la mitad a menos que el objetivo sea dos o más tamaños más pequeño que él.",
      "El objetivo agarrado tiene desventaja en las tiradas de ataque contra cualquier criatura que no sea su agarrador.",
      "Para escapar, el objetivo puede usar su acción para realizar una tirada de salvación de Fuerza o Destreza contra la CD de salvación de agarre (normalmente 8 + modificador de Atletismo del agarrador)."
    ]
  },
  {
    nombre: "Apresado",
    descripcion: "Reglas D&D",
    efectos: [
      "La velocidad de la criatura pasa a ser 0 y no puede beneficiarse de ningún bonificador a su velocidad.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "Las tiradas de ataque de la criatura tienen desventaja.",
      "La criatura tiene desventaja en las tiradas de salvación de Destreza."
    ]
  },
  {
    nombre: "Asustado",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura asustada tiene desventaja en las pruebas de característica y tiradas de ataque mientras la fuente de su miedo esté dentro de su línea de visión.",
      "La criatura no puede acercarse voluntariamente a la fuente de su miedo."
    ]
  },
  {
    nombre: "Aturdido",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura aturdida está Incapacitada, no puede moverse y sólo puede hablar balbuceando.",
      "La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.",
      "Las tiradas de ataque contra la criatura tienen ventaja."
    ]
  },
  {
    nombre: "Cansado",
    descripcion: "Reglas D&D",
    efectos: [
      "Esta condición es acumulativa y tiene 6 niveles. Si alcanzas el nivel 6, mueres de inmediato.",
      "Tiradas d20: Restas 2 veces tu nivel de cansancio a todas tus tiradas de d20 (ataques, salvaciones y pruebas).",
      "Velocidad: Tu velocidad se reduce en 5 pies por cada nivel de cansancio.",
      "Un descanso largo reduce tu nivel de cansancio en 1, siempre que consumas comida y bebida."
    ]
  },
  {
    nombre: "Cegado",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura ciega no puede ver y falla automáticamente cualquier prueba de característica que requiera la vista.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "Las tiradas de ataque de la criatura tienen desventaja."
    ]
  },
  {
    nombre: "Derribado",
    descripcion: "Reglas D&D",
    efectos: [
      "La única opción de movimiento de la criatura es arrastrarse, a menos que se levante gastando la mitad de su velocidad.",
      "La criatura tiene desventaja en las tiradas de ataque.",
      "Una tirada de ataque contra la criatura tiene ventaja si el atacante está a 5 pies o menos de ella. De lo contrario, la tirada de ataque tiene desventaja."
    ]
  },
  {
    nombre: "Ensordecido",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura ensordecida no puede oír y falla automáticamente cualquier prueba de característica que requiera el oído."
    ]
  },
  {
    nombre: "Envenenado",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura envenenada tiene desventaja en las tiradas de ataque y en las pruebas de característica."
    ]
  },
  {
    nombre: "Hechizado",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura hechizada no puede atacar al hechizador ni afectarlo con habilidades dañinas o efectos mágicos.",
      "El hechizador tiene ventaja en cualquier prueba de característica para interactuar socialmente con la criatura hechizada."
    ]
  },
  {
    nombre: "Incapacitado",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura no puede realizar acciones ni reacciones.",
      "Si la criatura está incapacitada, pierde la concentración en cualquier conjuro activo de forma automática.",
      "Su velocidad de iniciativa no se ve alterada directamente, pero no puede actuar en su turno."
    ]
  },
  {
    nombre: "Inconsciente",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura inconsciente está Incapacitada, no puede moverse ni hablar y no es consciente de su entorno.",
      "La criatura deja caer lo que esté sosteniendo y queda Derribada.",
      "La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "Cualquier ataque que golpee a la criatura es un impacto crítico si el atacante está a 5 pies o menos de ella."
    ]
  },
  {
    nombre: "Invisible",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura es imposible de ver sin la ayuda de magia o un sentido especial.",
      "La criatura se considera fuertemente oculta a efectos de esconderse.",
      "Las tiradas de ataque contra la criatura tienen desventaja, y las tiradas de ataque de la criatura tienen ventaja (siempre que el atacante no pueda verla)."
    ]
  },
  {
    nombre: "Paralizado",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura paralizada está Incapacitada y no puede moverse ni hablar.",
      "La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "Cualquier ataque que golpee a la criatura es un impacto crítico si el atacante está a 5 pies o menos de ella."
    ]
  },
  {
    nombre: "Petrificado",
    descripcion: "Reglas D&D",
    efectos: [
      "La criatura petrificada es transformada, junto con todos sus objetos no mágicos que viste o lleva, en una sustancia sólida e inerte (generalmente piedra). Su peso se multiplica por diez y cesa de envejecer.",
      "La criatura está Incapacitada, no puede moverse ni hablar, y no es consciente de su entorno.",
      "Las tiradas de ataque contra la criatura tienen ventaja.",
      "La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.",
      "La criatura tiene resistencia a todos los tipos de daño.",
      "La criatura es inmune al veneno y a la condición de Envenenado (si ya estaba envenenada, el efecto se suspende pero no se neutraliza)."
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
  { nombre: "Desangrándose", descripcion: "Esta criatura o personaje está por debajo del 50% de sus puntos de golpe máximos. Se aplica automáticamente cuando la salud cae por debajo de la mitad y desaparece cuando se recupera por encima de dicho umbral.", duracionEstandar: 0 },
  { nombre: "Armadura sin Competencia", descripcion: "Vistes armadura o portas escudo sin entrenamiento. Tienes Desventaja en cualquier tirada de ataque, prueba de característica o salvación que use Fuerza o Destreza, y no puedes lanzar conjuros ni realizar rituales.", duracionEstandar: 0 },
  { nombre: "Desventaja en Sigilo", descripcion: "La armadura corporal equipada es pesada o ruidosa e impone Desventaja automática en todas las pruebas de Sigilo (Destreza).", duracionEstandar: 0 },
  { nombre: "Bendecir", descripcion: "Añade 1d4 a las tiradas de ataque y salvaciones.", duracionEstandar: 10 },
  { nombre: "Furia", descripcion: "Ventaja en tiradas de Fuerza, daño extra en ataques de Fuerza, resistencia a daño contundente, perforante y cortante.", duracionEstandar: 100 },
  { nombre: "Ataque Temerario", descripcion: "Ventaja en tiradas de ataque que usen Fuerza durante tu turno, pero los ataques contra ti tienen ventaja hasta el inicio de tu siguiente turno.", duracionEstandar: 1 },
  { nombre: "Auxilio", descripcion: "Aumenta los puntos de golpe máximos y actuales en 5 por nivel de espacio.", duracionEstandar: 800 },
  { nombre: "Concentración", descripcion: "La criatura se está concentrando en mantener un conjuro activo.", duracionEstandar: 100, esConcentracion: true },
  { nombre: "Escudo", descripcion: "+5 a la CA y no sufre daño de Proyectil Mágico.", duracionEstandar: 1 },
  { nombre: "Heroísmo", descripcion: "Inmune al miedo y recibe puntos de golpe temporales al inicio de cada turno.", duracionEstandar: 10 },
  { nombre: "Inspirado", descripcion: "Puede añadir un dado de inspiración (d6/d8/d10/d12) a una tirada de d20.", duracionEstandar: 100 },
  { nombre: "Maldición", descripcion: "El objetivo sufre desventaja en pruebas y salvaciones de una característica, o daño extra.", duracionEstandar: 10 },
  { nombre: "Maleficio", descripcion: "Daño extra al golpear al objetivo y desventaja en pruebas de una característica.", duracionEstandar: 100 },
  { nombre: "Perdición", descripcion: "Resta 1d4 a las tiradas de ataque y salvaciones del objetivo.", duracionEstandar: 10 },
  { nombre: "Prisa", descripcion: "CA +2, ventaja en salvaciones de Destreza, acción adicional en cada turno. Al terminar, no puede moverse ni actuar durante 1 turno.", duracionEstandar: 10 },
  { nombre: "Recargando", descripcion: "La habilidad especial o aliento está recargando para poder usarse nuevamente.", duracionEstandar: 1 },
  { nombre: "Ralentizar", descripcion: "Velocidad a la mitad, CA -2, -2 a salvaciones de Destreza, no puede realizar reacciones.", duracionEstandar: 10 },
  { nombre: "Santuario", descripcion: "Cualquier criatura que intente atacar al objetivo debe superar una salvación de Sabiduría.", duracionEstandar: 10 },
  { nombre: "Hechicería Innata", descripcion: "Como acción adicional, obtienes ventaja en tiradas de ataque de conjuro y tu CD de salvación aumenta en 1.", duracionEstandar: 10 },
  { nombre: "Furia de los Dioses", descripcion: "Velocidad de vuelo con flotación, resistencia a daño necrótico, psíquico y radiante, y revivificación de aliados a 30 pies.", duracionEstandar: 10 },
  { nombre: "Manto de Majestad", descripcion: "Puedes lanzar Orden imperiosa como acción adicional sin gastar espacios de conjuro. Criaturas hechizadas fallan automáticamente.", duracionEstandar: 10, esConcentracion: true },
  { nombre: "Majestad Inquebrantable", descripcion: "Siempre que un atacante te acierte por primera vez en un turno, debe superar una salvación de Carisma contra tu CD de conjuros o el ataque falla.", duracionEstandar: 10 },
  { nombre: "Alas Celestiales", descripcion: "Velocidad de vuelo igual a tu velocidad de movimiento. Una vez en cada uno de tus turnos, al infligir daño con ataque o conjuro, infliges daño radiante adicional igual a tu bonificador por competencia.", duracionEstandar: 10 },
  { nombre: "Fulgor Interior", descripcion: "Emites luz brillante en 10 pies y tenue 10 pies adicionales. Al final de tus turnos, criaturas a 10 pies reciben daño radiante igual a tu PB. Una vez en cada turno, al infligir daño con ataque o conjuro, infliges daño radiante adicional igual a tu bonificador por competencia.", duracionEstandar: 10 },
  { nombre: "Mortaja Necrótica", descripcion: "Criaturas no aliadas a 10 pies deben superar una salvación de Carisma (CD 8 + Carisma + PB) o estarán asustadas hasta el final de tu siguiente turno. Una vez en cada turno, al infligir daño con ataque o conjuro, infliges daño necrótico adicional igual a tu bonificador por competencia.", duracionEstandar: 10 },
  { nombre: "Vuelo dracónico", descripcion: "Alas espectrales brotan de tu espalda durante 10 minutos (100 rondas) o hasta que las repliegues o tengas el estado de incapacitado. Durante ese tiempo, tienes una velocidad volando igual a tu velocidad de movimiento.", duracionEstandar: 100 }
];
