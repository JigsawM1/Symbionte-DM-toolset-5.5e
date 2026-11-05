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



export const EFECTOS_PREDEFINIDOS: EfectoPredefinido[] = validarColeccionJSON(
  EFECTOS_JSON,
  EsquemaEfectoJSON,
  "efectos-predefinidos"
);

