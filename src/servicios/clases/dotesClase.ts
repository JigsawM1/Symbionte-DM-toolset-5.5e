import type { RasgoPersonaje, SelectorRasgo } from "@/tipos";
import { TODAS_LAS_DOTES_CANONICAS_DND55 } from "@/constantes/dotesConstantes";
import { normalizarTextoClase } from "./catalogoClases";

/**
 * Determina si el nombre de un rasgo corresponde a la mejora de característica de clase.
 */
export function esRasgoMejoraCaracteristica(nombre: string): boolean {
  if (!nombre) return false;
  return normalizarTextoClase(nombre) === "mejora de caracteristica";
}

/**
 * Determina si el nombre de un rasgo corresponde al don épico de clase a nivel 19.
 */
export function esRasgoDonEpico(nombre: string): boolean {
  if (!nombre) return false;
  return normalizarTextoClase(nombre) === "don epico";
}

/**
 * Determina si el nombre de un rasgo corresponde al estilo de combate de clase.
 */
export function esRasgoEstiloCombate(nombre: string): boolean {
  if (!nombre) return false;
  const norm = normalizarTextoClase(nombre);
  return norm === "estilo de combate" || norm.startsWith("estilo de combate");
}

let cacheOpcionesDotesSelector: import("@/tipos").OpcionSelector[] | null = null;

/**
 * Obtiene las opciones de dotes oficiales para los selectores de Mejora de Característica,
 * situando la dote homónima al principio y ordenando el resto alfabéticamente.
 */
export function obtenerOpcionesDotesParaSelector(): import("@/tipos").OpcionSelector[] {
  if (cacheOpcionesDotesSelector) return cacheOpcionesDotesSelector;
  const doteMejora = TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === "dote_mejora_caracteristica");
  const otras = TODAS_LAS_DOTES_CANONICAS_DND55
    .filter((d) => d.id !== "dote_mejora_caracteristica")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const opciones: import("@/tipos").OpcionSelector[] = [];
  if (doteMejora) {
    opciones.push({
      id: doteMejora.id,
      nombre: doteMejora.nombre,
      descripcion: doteMejora.descripcion,
      requisito: doteMejora.requisito,
      categoria: doteMejora.categoria
    });
  }
  for (const d of otras) {
    opciones.push({
      id: d.id,
      nombre: d.nombre,
      descripcion: d.descripcion,
      requisito: d.requisito,
      categoria: d.categoria
    });
  }
  cacheOpcionesDotesSelector = opciones;
  return opciones;
}

/**
 * Genera el selector interactivo para el rasgo de clase Mejora de Característica.
 */
export function crearSelectorDoteMejoraCaracteristica(claseId: string, nivel: number): SelectorRasgo {
  return {
    id: `selector_dote_asi_${normalizarTextoClase(claseId)}_nv${nivel}`,
    tipo: "unico",
    tipoSelector: "dote",
    etiqueta: "Dote elegida",
    maxSelecciones: 1,
    valorActual: ["dote_mejora_caracteristica"],
    opciones: obtenerOpcionesDotesParaSelector()
  };
}

/**
 * Construye la dote asociada al rasgo de clase Mejora de Característica
 * para ser incorporada y renderizada en la sección de dotes de la ficha.
 */
export function construirDoteDeMejoraCaracteristica(
  rasgoMejora: RasgoPersonaje,
  idDoteSeleccionada: string = "dote_mejora_caracteristica"
): RasgoPersonaje {
  const normId = normalizarTextoClase(idDoteSeleccionada);
  const plantillaDote =
    TODAS_LAS_DOTES_CANONICAS_DND55.find(
      (d) => d.id === idDoteSeleccionada || normalizarTextoClase(d.id) === normId || normalizarTextoClase(d.nombre) === normId
    ) || TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === "dote_mejora_caracteristica")!;

  return {
    id: `dote_asi_${normalizarTextoClase(rasgoMejora.id)}`,
    nombre: plantillaDote.nombre,
    descripcion: plantillaDote.descripcion,
    origen: "dote",
    fuente: rasgoMejora.fuente || `Mejora de característica (Nivel ${rasgoMejora.nivelRequerido || 4})`,
    tipoAccion: plantillaDote.tipoAccion || "pasivo",
    nivelRequerido: rasgoMejora.nivelRequerido || 4,
    tieneUsosLimitados: Boolean(plantillaDote.tieneUsosLimitados),
    usosMaximos: plantillaDote.usosMaximos,
    usosRestantes: plantillaDote.usosMaximos,
    recuperacion: plantillaDote.recuperacion || "ninguno",
    formulaDados: plantillaDote.formulaDados,
    categoriaMecanica: plantillaDote.categoriaMecanica || "pasivo_permanente",
    efectos: plantillaDote.efectos ? JSON.parse(JSON.stringify(plantillaDote.efectos)) : [],
    selectores: plantillaDote.selectores ? JSON.parse(JSON.stringify(plantillaDote.selectores)) : [],
    activo: true,
    personalizado: false,
    ligadoA: rasgoMejora.id,
    notas: `Dote obtenida por el rasgo Mejora de característica (${rasgoMejora.fuente}).`
  };
}

/**
 * Mapeo canónico O(1) de la dote de don épico recomendada por clase oficial (D&D 5.5e).
 */
export const MAPA_DON_EPICO_RECOMENDADO_POR_CLASE: Readonly<Record<string, string>> = {
  barbaro: "dote_don_ataque_imparable",
  monje: "dote_don_ataque_imparable",
  bardo: "dote_don_recuerdo_conjuros",
  guerrero: "dote_don_pericia_combate",
  druida: "dote_don_viaje_dimensional",
  explorador: "dote_don_viaje_dimensional",
  hechicero: "dote_don_viaje_dimensional",
  mago: "dote_don_recuperacion",
  paladin: "dote_don_vision_verdadera",
  picaro: "dote_don_espiritu_noche",
  brujo: "dote_don_destino",
  clerigo: "dote_don_destino"
};

/**
 * Patrones textuales declarativos para identificar la dote de don épico desde la descripción del rasgo.
 */
const PATRONES_DON_EPICO_DESCRIPCION: readonly { readonly coincidencia: string; readonly doteId: string }[] = [
  { coincidencia: "ofensiva irresistible", doteId: "dote_don_ataque_imparable" },
  { coincidencia: "ataque imparable", doteId: "dote_don_ataque_imparable" },
  { coincidencia: "recuerdo de conjuros", doteId: "dote_don_recuerdo_conjuros" },
  { coincidencia: "pericia en combate", doteId: "dote_don_pericia_combate" },
  { coincidencia: "viaje dimensional", doteId: "dote_don_viaje_dimensional" },
  { coincidencia: "recuperacion", doteId: "dote_don_recuperacion" },
  { coincidencia: "vision verdadera", doteId: "dote_don_vision_verdadera" },
  { coincidencia: "espiritu", doteId: "dote_don_espiritu_noche" },
  { coincidencia: "destino", doteId: "dote_don_destino" }
];

/**
 * Resuelve el ID de la dote de don épico recomendada para la clase a partir
 * del identificador de la clase o de la descripción del rasgo.
 */
export function resolverDoteDonEpicoRecomendada(descripcion?: string, claseId?: string): string {
  const cidNorm = normalizarTextoClase(claseId || "");
  if (cidNorm && MAPA_DON_EPICO_RECOMENDADO_POR_CLASE[cidNorm]) {
    return MAPA_DON_EPICO_RECOMENDADO_POR_CLASE[cidNorm];
  }

  const descNorm = normalizarTextoClase(descripcion || "");
  if (descNorm) {
    const coincidencia = PATRONES_DON_EPICO_DESCRIPCION.find((p) => descNorm.includes(p.coincidencia));
    if (coincidencia) return coincidencia.doteId;
  }

  return "dote_don_destino";
}

/**
 * Obtiene las opciones de dotes oficiales para los selectores de Don Épico,
 * priorizando los Dones Épicos al principio de la lista (situando el recomendado
 * en primera posición) seguido por las dotes generales y otras dotes ordenadas alfabéticamente.
 */
export function obtenerOpcionesDotesDonEpicoParaSelector(doteRecomendadaId: string): import("@/tipos").OpcionSelector[] {
  const donesEpicos = TODAS_LAS_DOTES_CANONICAS_DND55.filter((d) => d.categoria === "don_epico");
  const otrasDotes = TODAS_LAS_DOTES_CANONICAS_DND55.filter((d) => d.categoria !== "don_epico");

  const doteRecomendada = donesEpicos.find((d) => d.id === doteRecomendadaId);
  const otrosDones = donesEpicos
    .filter((d) => d.id !== doteRecomendadaId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const otrasOrdenadas = otrasDotes.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const opciones: import("@/tipos").OpcionSelector[] = [];

  if (doteRecomendada) {
    opciones.push({
      id: doteRecomendada.id,
      nombre: doteRecomendada.nombre,
      descripcion: doteRecomendada.descripcion,
      requisito: doteRecomendada.requisito
    });
  }

  for (const d of otrosDones) {
    opciones.push({
      id: d.id,
      nombre: d.nombre,
      descripcion: d.descripcion,
      requisito: d.requisito
    });
  }

  for (const d of otrasOrdenadas) {
    opciones.push({
      id: d.id,
      nombre: d.nombre,
      descripcion: d.descripcion,
      requisito: d.requisito
    });
  }

  return opciones;
}

/**
 * Genera el selector interactivo para el rasgo de clase Don Épico (nivel 19).
 */
export function crearSelectorDoteDonEpico(claseId: string, nivel: number, descripcion?: string): SelectorRasgo {
  const dotePorDefectoId = resolverDoteDonEpicoRecomendada(descripcion, claseId);
  return {
    id: `selector_dote_don_epico_${normalizarTextoClase(claseId)}_nv${nivel}`,
    tipo: "unico",
    tipoSelector: "dote",
    etiqueta: "Don épico elegido",
    maxSelecciones: 1,
    valorActual: [dotePorDefectoId],
    opciones: obtenerOpcionesDotesDonEpicoParaSelector(dotePorDefectoId)
  };
}

/**
 * Construye la dote asociada al rasgo de clase Don Épico para ser incorporada
 * y renderizada en la sección de dotes de la ficha.
 */
export function construirDoteDeDonEpico(
  rasgoDonEpico: RasgoPersonaje,
  idDoteSeleccionada?: string
): RasgoPersonaje {
  const idDefecto = resolverDoteDonEpicoRecomendada(rasgoDonEpico.descripcion, rasgoDonEpico.fuente);
  const idObjetivo = idDoteSeleccionada || idDefecto;
  const normId = normalizarTextoClase(idObjetivo);

  const plantillaDote =
    TODAS_LAS_DOTES_CANONICAS_DND55.find(
      (d) => d.id === idObjetivo || normalizarTextoClase(d.id) === normId || normalizarTextoClase(d.nombre) === normId
    ) || TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === "dote_don_destino") || TODAS_LAS_DOTES_CANONICAS_DND55[0];

  return {
    id: `dote_don_${normalizarTextoClase(rasgoDonEpico.id)}`,
    nombre: plantillaDote.nombre,
    descripcion: plantillaDote.descripcion,
    origen: "dote",
    fuente: rasgoDonEpico.fuente || `Don épico (Nivel ${rasgoDonEpico.nivelRequerido || 19})`,
    tipoAccion: plantillaDote.tipoAccion || "pasivo",
    nivelRequerido: rasgoDonEpico.nivelRequerido || 19,
    tieneUsosLimitados: Boolean(plantillaDote.tieneUsosLimitados),
    usosMaximos: plantillaDote.usosMaximos,
    usosRestantes: plantillaDote.usosMaximos,
    recuperacion: plantillaDote.recuperacion || "ninguno",
    formulaDados: plantillaDote.formulaDados,
    categoriaMecanica: plantillaDote.categoriaMecanica || "pasivo_permanente",
    efectos: plantillaDote.efectos ? JSON.parse(JSON.stringify(plantillaDote.efectos)) : [],
    selectores: plantillaDote.selectores ? JSON.parse(JSON.stringify(plantillaDote.selectores)) : [],
    activo: true,
    personalizado: false,
    ligadoA: rasgoDonEpico.id,
    notas: `Dote obtenida por el rasgo Don épico (${rasgoDonEpico.fuente}).`
  };
}

let cacheOpcionesDotesEstiloSelector: Record<string, import("@/tipos").OpcionSelector[]> = {};

/**
 * Obtiene las opciones de dotes de estilo de combate permitidas según la clase (PHB 2024).
 * Si la clase es Paladín, incluye Guerrero bendecido (exclusivo de Paladín).
 * Si la clase es Explorador, incluye Guerrero druídico (exclusivo de Explorador).
 */
export function obtenerOpcionesDotesEstiloCombate(claseId: string): import("@/tipos").OpcionSelector[] {
  const normClase = normalizarTextoClase(claseId);
  if (cacheOpcionesDotesEstiloSelector[normClase]) {
    return cacheOpcionesDotesEstiloSelector[normClase];
  }

  const dotesEstilo = TODAS_LAS_DOTES_CANONICAS_DND55.filter((d) => d.categoria === "estilo_combate");

  // Filtrar dotes de estilo exclusivas según la clase
  const dotesPermitidas = dotesEstilo.filter((d) => {
    if (d.id === "dote_estilo_guerrero_bendito") {
      return normClase.includes("paladin");
    }
    if (d.id === "dote_estilo_guerrero_druidico") {
      return normClase.includes("explorador") || normClase.includes("ranger");
    }
    return true;
  });

  // Si es paladín, colocar Guerrero bendecido al principio; si es explorador, Guerrero druídico; en caso contrario Defensa
  const dotePorDefectoId = normClase.includes("paladin")
    ? "dote_estilo_guerrero_bendito"
    : normClase.includes("explorador") || normClase.includes("ranger")
    ? "dote_estilo_guerrero_druidico"
    : "dote_estilo_defensa";

  const primera = dotesPermitidas.find((d) => d.id === dotePorDefectoId);
  const resto = dotesPermitidas
    .filter((d) => d.id !== dotePorDefectoId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const opciones: import("@/tipos").OpcionSelector[] = [];
  if (primera) {
    opciones.push({
      id: primera.id,
      nombre: primera.nombre,
      descripcion: primera.descripcion,
      requisito: primera.requisito,
      categoria: primera.categoria
    });
  }
  for (const d of resto) {
    opciones.push({
      id: d.id,
      nombre: d.nombre,
      descripcion: d.descripcion,
      requisito: d.requisito,
      categoria: d.categoria
    });
  }

  cacheOpcionesDotesEstiloSelector[normClase] = opciones;
  return opciones;
}

/**
 * Genera el selector interactivo para el rasgo de clase Estilo de Combate.
 */
export function crearSelectorDoteEstiloCombate(claseId: string, nivel: number): SelectorRasgo {
  const opciones = obtenerOpcionesDotesEstiloCombate(claseId);
  const normClase = normalizarTextoClase(claseId);
  const dotePorDefectoId = normClase.includes("paladin")
    ? "dote_estilo_guerrero_bendito"
    : normClase.includes("explorador") || normClase.includes("ranger")
    ? "dote_estilo_guerrero_druidico"
    : "dote_estilo_defensa";

  return {
    id: `selector_dote_estilo_combate_${normalizarTextoClase(claseId)}_nv${nivel}`,
    tipo: "unico",
    tipoSelector: "dote",
    etiqueta: "Dote de Estilo de combate elegida",
    maxSelecciones: 1,
    valorActual: [dotePorDefectoId],
    opciones
  };
}

/**
 * Construye la dote asociada al rasgo de clase Estilo de Combate
 * para ser incorporada y renderizada en la sección de dotes de la ficha.
 */
export function construirDoteDeEstiloCombate(
  rasgoEstilo: RasgoPersonaje,
  idDoteSeleccionada: string = "dote_estilo_defensa"
): RasgoPersonaje {
  const normId = normalizarTextoClase(idDoteSeleccionada);
  const plantillaDote =
    TODAS_LAS_DOTES_CANONICAS_DND55.find(
      (d) => d.id === idDoteSeleccionada || normalizarTextoClase(d.id) === normId || normalizarTextoClase(d.nombre) === normId
    ) || TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === "dote_estilo_defensa")!;

  return {
    id: `dote_estilo_${normalizarTextoClase(rasgoEstilo.id)}`,
    nombre: plantillaDote.nombre,
    descripcion: plantillaDote.descripcion,
    origen: "dote",
    fuente: rasgoEstilo.fuente || `Estilo de combate (Nivel ${rasgoEstilo.nivelRequerido || 1})`,
    tipoAccion: plantillaDote.tipoAccion || "pasivo",
    nivelRequerido: rasgoEstilo.nivelRequerido || 1,
    tieneUsosLimitados: Boolean(plantillaDote.tieneUsosLimitados),
    usosMaximos: plantillaDote.usosMaximos,
    usosRestantes: plantillaDote.usosMaximos,
    recuperacion: plantillaDote.recuperacion || "ninguno",
    formulaDados: plantillaDote.formulaDados,
    categoriaMecanica: plantillaDote.categoriaMecanica || "pasivo_permanente",
    efectos: plantillaDote.efectos ? JSON.parse(JSON.stringify(plantillaDote.efectos)) : [],
    selectores: plantillaDote.selectores ? JSON.parse(JSON.stringify(plantillaDote.selectores)) : [],
    activo: true,
    esActivable: Boolean(plantillaDote.esActivable),
    personalizado: false,
    ligadoA: rasgoEstilo.id,
    notas: `Dote obtenida por el rasgo Estilo de combate (${rasgoEstilo.fuente}).`
  };
}
