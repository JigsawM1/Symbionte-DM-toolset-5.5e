export * from "@/tipos";
import { MonstruoBase, HechizoBase, CondicionDnd, EfectoPredefinido } from "@/tipos";
import MONSTRUOS_JSON from "./compendios/Mounstros.2024-es.json";
import HECHIZOS_JSON from "./compendios/all.json";
import EQUIPO_JSON from "./compendios/Equipo es.json";
import CONDICIONES_JSON from "@/datos/condiciones-dnd55.json";
import EFECTOS_JSON from "@/datos/efectos-predefinidos.json";
import { EsquemaCondicionJSON, EsquemaEfectoJSON } from "@/tipos/esquemasCatalogos";
import { validarColeccionJSON } from "@/servicios/cargadorCatalogos";
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

export const CONDICIONES_2024: CondicionDnd[] = validarColeccionJSON(
  CONDICIONES_JSON,
  EsquemaCondicionJSON,
  "condiciones-dnd55"
);


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

export const EFECTOS_PREDEFINIDOS: EfectoPredefinido[] = validarColeccionJSON(
  EFECTOS_JSON,
  EsquemaEfectoJSON,
  "efectos-predefinidos"
);

