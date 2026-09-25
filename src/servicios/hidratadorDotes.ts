import type { DotePersonaje, OpcionSelector } from "@/tipos/rasgos";
import { EsquemaDotePersonaje } from "@/tipos/rasgos";
import { validarColeccionJSON } from "./cargadorCatalogos";
import { logger } from "@/utiles/logger";
import HECHIZOS_JSON from "@/utiles/compendios/all.json";

import origenJson from "@/datos/dotes/origen.json";
import generalesJson from "@/datos/dotes/generales.json";
import epicasJson from "@/datos/dotes/epicas.json";

// =======================================================
// UTILIDADES PURAS DE BÚSQUEDA Y FILTRADO DE CONJUROS
// =======================================================

function normalizar(texto: string = ""): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface HechizoCompendioMinimo {
  id: string;
  nombre: string;
  nivel: number;
  clases?: string[];
  escuela?: string;
  tiempoLanzamiento?: string;
  alcance?: string;
  ritual?: boolean;
}

export function generarOpcionesRituales(nivel: number): OpcionSelector[] {
  return (HECHIZOS_JSON as unknown as HechizoCompendioMinimo[])
    .filter((h) => h.nivel === nivel && Boolean(h.ritual))
    .map((h) => ({
      id: h.id,
      nombre: h.nombre,
      descripcion: [h.escuela, h.tiempoLanzamiento, h.alcance, "Ritual"].filter(Boolean).join(" • ")
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function generarOpcionesConjuros(claseObjetivo: string, nivel: number): OpcionSelector[] {
  const claseNorm = normalizar(claseObjetivo);
  return (HECHIZOS_JSON as unknown as HechizoCompendioMinimo[])
    .filter((h) => {
      if (h.nivel !== nivel) return false;
      return (h.clases || []).some((c) => normalizar(c).includes(claseNorm));
    })
    .map((h) => ({
      id: h.id,
      nombre: h.nombre,
      descripcion: [h.escuela, h.tiempoLanzamiento, h.alcance].filter(Boolean).join(" • ")
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

// Opciones estáticas canónicas reutilizadas
export const OPCIONES_PROPIEDADES_MAESTRIA: OpcionSelector[] = [
  { id: "cleave", nombre: "Cleave (Hender)", descripcion: "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes hacer una tirada de ataque contra una segunda criatura a 5 pies de la primera y dentro de tu alcance. Si impactas, la segunda criatura recibe el daño del arma sin tu modificador de característica. Solo una vez por turno." },
  { id: "graze", nombre: "Graze (Rozar)", descripcion: "Si tu tirada de ataque falla, puedes infligir daño igual al modificador de característica usado. El daño es del mismo tipo que el arma, y solo puede incrementarse aumentando el modificador." },
  { id: "nick", nombre: "Nick (Mellar)", descripcion: "Cuando haces el ataque extra de la propiedad Ligera, puedes hacerlo como parte de la acción de Atacar en vez de como Acción Adicional. Solo una vez por turno." },
  { id: "push", nombre: "Push (Empujar)", descripcion: "Si impactas a una criatura, puedes empujarla hasta 10 pies en línea recta lejos de ti si es Grande o menor." },
  { id: "sap", nombre: "Sap (Debilitar)", descripcion: "Si impactas a una criatura, esa criatura tiene Desventaja en su siguiente tirada de ataque antes del inicio de tu próximo turno." },
  { id: "slow", nombre: "Slow (Ralentizar)", descripcion: "Si impactas a una criatura e infliges daño, puedes reducir su Velocidad en 10 pies hasta el inicio de tu próximo turno. Múltiples impactos con armas Slow no acumulan la reducción." },
  { id: "topple", nombre: "Topple (Derribar)", descripcion: "Si impactas a una criatura, puedes forzar una tirada de salvación de Constitución (CD 8 + modificador de característica + bonificador de competencia). Si falla, la criatura queda Derribada." },
  { id: "vex", nombre: "Vex (Molestar)", descripcion: "Si impactas a una criatura e infliges daño, tienes Ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu próximo turno." }
];

export const OPCIONES_DANOS_RESISTENCIA_ENERGIAS: OpcionSelector[] = [
  { id: "acido", nombre: "Ácido", descripcion: "Resistencia al daño de ácido" },
  { id: "frio", nombre: "Frío", descripcion: "Resistencia al daño de frío" },
  { id: "fuego", nombre: "Fuego", descripcion: "Resistencia al daño de fuego" },
  { id: "relampago", nombre: "Relámpago", descripcion: "Resistencia al daño de relámpago" },
  { id: "necrotico", nombre: "Necrótico", descripcion: "Resistencia al daño necrótico" },
  { id: "veneno", nombre: "Veneno", descripcion: "Resistencia al daño de veneno" },
  { id: "psiquico", nombre: "Psíquico", descripcion: "Resistencia al daño psíquico" },
  { id: "radiante", nombre: "Radiante", descripcion: "Resistencia al daño radiante" },
  { id: "trueno", nombre: "Trueno", descripcion: "Resistencia al daño de trueno" }
];

// Opciones calculadas de conjuros en memoria
const OPCIONES_DINAMICAS_MAP: Record<string, () => OpcionSelector[]> = {
  trucos_clerigo: () => generarOpcionesConjuros("clérigo", 0),
  conjuros1_clerigo: () => generarOpcionesConjuros("clérigo", 1),
  trucos_druida: () => generarOpcionesConjuros("druida", 0),
  conjuros1_druida: () => generarOpcionesConjuros("druida", 1),
  trucos_mago: () => generarOpcionesConjuros("mago", 0),
  conjuros1_mago: () => generarOpcionesConjuros("mago", 1),
  rituales_nivel_1: () => generarOpcionesRituales(1)
};

// Cache en memoria para no recalcular en cada acceso
const CACHE_OPCIONES_DINAMICAS: Record<string, OpcionSelector[]> = {};

function obtenerOpcionesDinamicas(clave: string): OpcionSelector[] {
  if (!CACHE_OPCIONES_DINAMICAS[clave]) {
    const fn = OPCIONES_DINAMICAS_MAP[clave];
    if (fn) {
      CACHE_OPCIONES_DINAMICAS[clave] = fn();
    } else {
      logger.warn(`[HidratadorDotes] Clave dinámica no reconocida: "${clave}"`);
      return [];
    }
  }
  return CACHE_OPCIONES_DINAMICAS[clave];
}

/**
 * Hidrata una dote individual inyectando las opciones calculadas en los selectores dinámicos.
 */
function hidratarDote(dote: DotePersonaje): DotePersonaje {
  const doteCopia: DotePersonaje = { ...dote };

  if (doteCopia.selectores && doteCopia.selectores.length > 0) {
    doteCopia.selectores = doteCopia.selectores.map((sel) => {
      if (sel.claveOpcionesDinamicas) {
        return {
          ...sel,
          opciones: obtenerOpcionesDinamicas(sel.claveOpcionesDinamicas)
        };
      }
      return sel;
    });
  }

  if (doteCopia.rasgosAdicionales && doteCopia.rasgosAdicionales.length > 0) {
    doteCopia.rasgosAdicionales = doteCopia.rasgosAdicionales.map(hidratarDote);
  }

  return doteCopia;
}

/**
 * Valida e hidrata una colección de dotes.
 */
function cargarEhidratarDotes(datosRaw: unknown[], nombreColeccion: string): DotePersonaje[] {
  const validadas = validarColeccionJSON<DotePersonaje>(datosRaw, EsquemaDotePersonaje, nombreColeccion);
  return validadas.map(hidratarDote);
}

// =======================================================
// COLECCIONES CANÓNICAS HIDRATADAS
// =======================================================

export const DOTES_ORIGEN_DND55: DotePersonaje[] = cargarEhidratarDotes(
  origenJson as unknown[],
  "DotesOrigenDND55"
);

export const DOTES_GENERALES_DND55: DotePersonaje[] = cargarEhidratarDotes(
  generalesJson as unknown[],
  "DotesGeneralesDND55"
);

export const DOTES_EPICAS_DND55: DotePersonaje[] = cargarEhidratarDotes(
  epicasJson as unknown[],
  "DotesEpicasDND55"
);

export const DOTES_GENERALES_Y_EPICAS_DND55: DotePersonaje[] = [
  ...DOTES_GENERALES_DND55,
  ...DOTES_EPICAS_DND55
];

export const TODAS_LAS_DOTES_CANONICAS_DND55: DotePersonaje[] = [
  ...DOTES_ORIGEN_DND55,
  ...DOTES_GENERALES_Y_EPICAS_DND55
];

export const DOTES_CANONICAS_DND55: DotePersonaje[] = TODAS_LAS_DOTES_CANONICAS_DND55;
