import type {
  DefinicionClase,
  DefinicionSubclase,
  BuildClaseCalculada,
  OpcionesAplicarBuild,
  PersonajeJugador,
  RasgoPersonaje,
  ClasePersonaje,
  ClaseLanzadora,
  CompetenciasSalvacion,
  EfectoMecanicoRasgo,
  SelectorRasgo,
  RecuperacionRasgo
} from "@/tipos";
import {
  CATALOGO_CLASES_DND55,
  DICCIONARIO_CLASES_POR_NOMBRE,
  DICCIONARIO_CLASES_POR_ID,
  TODAS_SUBCLASES_DND55
} from "@/constantes/clasesDND55";
import { TODAS_LAS_DOTES_CANONICAS_DND55 } from "@/constantes/dotesConstantes";
import { calcularTodosRecursosMagicos } from "@/servicios/calculadorMagia";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { sincronizarConjurosSubclaseHelper } from "@/servicios/sincronizadorConjurosSubclase";
import { resolverGruposYSustitutosCompetencias } from "@/constantes/competenciasConstantes";
import { logger } from "@/utiles/logger";
import {
  tieneMedioBonoHabilidades,
  aplicarAprendizDeMuchoAGradosHabilidades,
  obtenerCompetenciasExtraRasgos,
  sonHerramientasEquivalentes,
  evaluarExpresionNumericaSegura
} from "@/servicios/evaluadorEfectosRasgos";

/**
 * Normaliza cadenas de texto para comparaciones tolerantes (insensible a tildes, mayúsculas y espacios).
 */
export function normalizarTextoClase(texto: unknown): string {
  if (typeof texto !== "string") return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Determina si el nombre de un rasgo corresponde a un marcador o placeholder
 * de adquisición de subclase que no debe renderizarse directamente en la ficha.
 */
export function esRasgoPlaceholderSubclase(nombre: string): boolean {
  if (!nombre) return false;
  const norm = normalizarTextoClase(nombre);
  return (
    norm === "subclase" ||
    norm.startsWith("subclase de") ||
    norm === "rasgo de subclase" ||
    norm.includes("rasgo de subclase")
  );
}

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

/**
 * Retorna la lista completa de las 12 clases oficiales de D&D 5.5e (2024).
 */
export function obtenerCatalogoClases(): DefinicionClase[] {
  return CATALOGO_CLASES_DND55;
}

/**
 * Retorna todas las 48 subclases canónicas del sistema.
 */
export function obtenerTodasSubclases(): DefinicionSubclase[] {
  return TODAS_SUBCLASES_DND55;
}

/**
 * Busca una clase por su ID o clave interna.
 */
export function obtenerClasePorId(id: string): DefinicionClase | undefined {
  if (!id) return undefined;
  const idNorm = normalizarTextoClase(id);
  return DICCIONARIO_CLASES_POR_ID[idNorm] || CATALOGO_CLASES_DND55.find((c) => normalizarTextoClase(c.id) === idNorm);
}

/**
 * Busca una clase de forma tolerante e insensible a acentos/mayúsculas por su nombre.
 */
export function obtenerClasePorNombre(nombre: string): DefinicionClase | undefined {
  if (!nombre) return undefined;
  if (DICCIONARIO_CLASES_POR_NOMBRE[nombre]) {
    return DICCIONARIO_CLASES_POR_NOMBRE[nombre];
  }
  const norm = normalizarTextoClase(nombre);
  return CATALOGO_CLASES_DND55.find((c) => {
    const cNorm = normalizarTextoClase(c.nombre);
    const idNorm = normalizarTextoClase(c.id);
    return cNorm === norm || idNorm === norm || cNorm.includes(norm) || norm.includes(cNorm);
  });
}

/**
 * Retorna las subclases pertenecientes a una clase específica.
 */
export function obtenerSubclasesDeClase(claseNombreOId: string): DefinicionSubclase[] {
  const clase = obtenerClasePorNombre(claseNombreOId) || obtenerClasePorId(claseNombreOId);
  if (!clase) return [];
  return clase.subclases;
}

/**
 * Busca una subclase por nombre tolerante dentro de una clase (o en el catálogo global si no se especifica clase).
 */
export const ALIAS_SUBCLASES_EQUIVALENTES: Record<string, string> = {
  "camino de la sombra": "guerrero de la sombra",
  "camino de la misericordia": "guerrero de la misericordia",
  "camino de los elementos": "guerrero de los elementos",
  "camino de la mano abierta": "guerrero de la mano abierta",
  "guerrero de la sombra": "camino de la sombra",
  "guerrero de la misericordia": "camino de la misericordia",
  "guerrero de los elementos": "camino de los elementos",
  "guerrero de la mano abierta": "camino de la mano abierta"
};

export function obtenerSubclasePorNombre(
  claseNombreOId?: string,
  subclaseNombre?: string
): DefinicionSubclase | undefined {
  if (!subclaseNombre) return undefined;
  const subNorm = normalizarTextoClase(subclaseNombre);
  const alias = ALIAS_SUBCLASES_EQUIVALENTES[subNorm];

  const coincideSubclase = (s: DefinicionSubclase): boolean => {
    const sNorm = normalizarTextoClase(s.nombre);
    const sId = normalizarTextoClase(s.id);
    return (
      sNorm === subNorm ||
      sId === subNorm ||
      (!!alias && (sNorm === alias || sId === alias)) ||
      sNorm.includes(subNorm) ||
      subNorm.includes(sNorm)
    );
  };

  if (claseNombreOId) {
    const subclases = obtenerSubclasesDeClase(claseNombreOId);
    const encontrada = subclases.find(coincideSubclase);
    if (encontrada) return encontrada;
  }

  // Búsqueda global de contingencia
  return TODAS_SUBCLASES_DND55.find(coincideSubclase);
}

/**
 * Evalúa de forma segura fórmulas numéricas o expresiones ternarias de usos máximos
 * procedentes de definiciones TypeScript o catálogos JSON.
 * Ej: "(niv) => (niv >= 17 ? 6 : niv >= 12 ? 5 : niv >= 6 ? 4 : niv >= 3 ? 3 : 2)"
 * Ej: "1", "2", "niv"
 */
export function evaluarFormulaUsos(formula: string | null | undefined, nivel: number): number | undefined {
  if (!formula) return undefined;
  const numDirecto = Number(formula);
  if (!isNaN(numDirecto) && numDirecto > 0) return numDirecto;

  const niv = Math.max(1, Math.min(20, Math.floor(nivel) || 1));

  try {
    const cuerpo = formula.includes("=>") ? formula.split("=>")[1].trim() : formula;
    const cuerpoNormalizado = cuerpo.replace(/\b(nivel|level)\b/g, "niv");
    const regexTernario = /niv\s*(>=|>|<=|<|===|==)\s*(\d+)\s*\?\s*(\d+)/g;
    let match;
    while ((match = regexTernario.exec(cuerpoNormalizado)) !== null) {
      const op = match[1];
      const limite = parseInt(match[2], 10);
      const valor = parseInt(match[3], 10);

      let cumple = false;
      if (op === ">=" && niv >= limite) cumple = true;
      else if (op === ">" && niv > limite) cumple = true;
      else if (op === "<=" && niv <= limite) cumple = true;
      else if (op === "<" && niv < limite) cumple = true;
      else if ((op === "===" || op === "==") && niv === limite) cumple = true;

      if (cumple) return valor;
    }

    const partesDosPuntos = cuerpo.split(":");
    if (partesDosPuntos.length > 1) {
      const ultimo = partesDosPuntos[partesDosPuntos.length - 1].replace(/[()]/g, "").trim();
      const valDefecto = parseInt(ultimo, 10);
      if (!isNaN(valDefecto)) return valDefecto;
    }

    const exprConNivel = cuerpoNormalizado.replace(/\bniv\b/g, "nivel");
    const valorExpr = evaluarExpresionNumericaSegura(exprConNivel, { nivel: niv });
    if (valorExpr > 0) return valorExpr;
  } catch (error) {
    logger.warn(`[gestorClases] Error al evaluar formulaUsos: "${formula}"`, error);
  }

  return undefined;
}

/**
 * Resuelve todos los escalados declarativos de un rasgo según el nivel actual.
 * Esta función es GENÉRICA PURA: no conoce nombres de rasgos ni clases.
 * Reemplaza los bloques condicionales por nombre que existían en el builder.
 */
export function resolverEscaladosRasgo(
  r: {
    formulaDados?: string;
    recuperacion?: string;
    sincronizarEfectosConFormula?: boolean;
    escaladoFormulaDados?: Array<{ nivelMinimo: number; valor: string }>;
    escaladoUsos?: {
      tipo: "por_nivel" | "por_modificador";
      tabla?: Array<{ nivelMinimo: number; valor: number }>;
      modificador?: string;
      minimo?: number;
      formula?: string;
    };
    escaladoRecuperacion?: Array<{ nivelMinimo: number; valor: string }>;
    escaladoEfectos?: Array<{
      tipo: string;
      objetivo?: string;
      escalones: Array<{ nivelMinimo: number; valor: string | number }>;
    }>;
  },
  nivel: number,
  efectosBase: EfectoMecanicoRasgo[],
  selectoresBase: SelectorRasgo[]
): {
  formulaDados: string | undefined;
  usosEscalados: number | undefined;
  recuperacion: string | undefined;
  efectos: EfectoMecanicoRasgo[];
  selectores: SelectorRasgo[];
} {
  let formulaDados = r.formulaDados;
  let usosEscalados: number | undefined;
  let recuperacion = r.recuperacion;
  const efectos: EfectoMecanicoRasgo[] = JSON.parse(JSON.stringify(efectosBase));
  const selectores: SelectorRasgo[] = JSON.parse(JSON.stringify(selectoresBase));

  // 1. Escalado de fórmula de dados
  if (r.escaladoFormulaDados?.length) {
    const entrada = [...r.escaladoFormulaDados]
      .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
      .find((e) => nivel >= e.nivelMinimo);
    if (entrada) formulaDados = entrada.valor;
  }

  // 2. Escalado de usos por tabla de nivel o fórmula semántica
  if (r.escaladoUsos?.tipo === "por_nivel") {
    const minimo = r.escaladoUsos.minimo ?? 1;
    if (r.escaladoUsos.tabla?.length) {
      const entrada = [...r.escaladoUsos.tabla]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => nivel >= e.nivelMinimo);
      if (entrada) usosEscalados = Math.max(minimo, entrada.valor);
    } else if (r.escaladoUsos.formula) {
      const matchX = r.escaladoUsos.formula.match(/^nivel_x(\d+)$/);
      if (matchX) {
        const mult = parseInt(matchX[1], 10);
        usosEscalados = Math.max(minimo, nivel * mult);
      } else if (r.escaladoUsos.formula === "nivel") {
        usosEscalados = Math.max(minimo, nivel);
      } else if (r.escaladoUsos.formula === "nivel_mas_1") {
        usosEscalados = Math.max(minimo, nivel + 1);
      }
    }
  } else if (r.escaladoUsos?.tipo === "por_modificador") {
    usosEscalados = r.escaladoUsos.minimo ?? 1;
  }

  // 3. Escalado de recuperación
  if (r.escaladoRecuperacion?.length) {
    const entrada = [...r.escaladoRecuperacion]
      .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
      .find((e) => nivel >= e.nivelMinimo);
    if (entrada) recuperacion = entrada.valor;
  }

  // 4. Escalado de efectos mecánicos (ej. Movimiento sin armadura: +10 a +30 ft)
  if (r.escaladoEfectos?.length) {
    for (const escEf of r.escaladoEfectos) {
      const entrada = [...escEf.escalones]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => nivel >= e.nivelMinimo);
      if (entrada) {
        const ef = efectos.find(
          (e) => e.tipo === escEf.tipo && (!escEf.objetivo || e.objetivo === escEf.objetivo)
        );
        if (ef) {
          ef.valor = entrada.valor;
        }
      }
    }
  }

  // 5. Sincronizar efectos con la fórmula de dados resuelta
  if (r.sincronizarEfectosConFormula && formulaDados) {
    const tiposASincronizar = new Set(["dado_extra_dano", "ataque_desarmado", "bono_dano_fuerza", "dano_secundario"]);
    for (const ef of efectos) {
      if (typeof ef.tipo === "string" && tiposASincronizar.has(ef.tipo)) {
        ef.valor = formulaDados;
      }
    }
  }

  // 5. Selectores: opciones dinámicas y escalado de maxSelecciones
  for (const sel of selectores) {
    const opcionesDinamicas = sel.opcionesDinamicas as Array<{ nivelMinimo: number; opciones: Array<Record<string, unknown>> }> | undefined;
    if (opcionesDinamicas?.length) {
      const opcionesActuales = sel.opciones as Array<{ id: string }>;
      for (const grupo of opcionesDinamicas) {
        if (nivel >= grupo.nivelMinimo) {
          for (const op of grupo.opciones) {
            if (!opcionesActuales.some((o) => o.id === op.id)) {
              opcionesActuales.push(op as { id: string });
            }
          }
        }
      }
    }
    const escaladoMax = sel.escaladoMaxSelecciones as Array<{ nivelMinimo: number; valor: number }> | undefined;
    if (escaladoMax?.length) {
      const entrada = [...escaladoMax]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => nivel >= e.nivelMinimo);
      if (entrada) {
        sel.maxSelecciones = entrada.valor;
        if (entrada.valor > 1) {
          sel.tipo = "multiple";
        }
      }
    }
    if (sel.etiqueta && /\(Nv\.?\s*1\s*-\s*\d+\)/i.test(sel.etiqueta)) {
      const nivelMaxEspacio = Math.min(9, Math.max(1, Math.ceil(nivel / 2)));
      sel.etiqueta = sel.etiqueta.replace(/\(Nv\.?\s*1\s*-\s*\d+\)/i, `(Nv. 1-${nivelMaxEspacio})`);
    }
  }

  return { formulaDados, usosEscalados, recuperacion, efectos, selectores };
}

/**
 * Obtiene los rasgos de clase y subclase correspondientes a un nivel específico.
 * El builder es GENÉRICO PURO: consume metadatos declarativos del catálogo.
 * No contiene bifurcaciones por nombre de rasgo ni de clase.
 */
export function obtenerRasgosClaseYSubclase(
  claseNombre: string,
  nivel: number,
  subclaseNombre?: string
): RasgoPersonaje[] {
  const clase = obtenerClasePorNombre(claseNombre);
  if (!clase) return [];

  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  const rasgosResultado: RasgoPersonaje[] = [];

  // ── Función auxiliar para construir un RasgoPersonaje desde una plantilla ──
  function construirRasgo(
    r: import("@/constantes/rasgosDND55").PlantillaRasgoClase,
    id: string,
    fuente: string,
    origen: "clase" | "subclase"
  ): RasgoPersonaje {
    let usos: number | undefined = r.usosMaximos;
    if (r.tieneUsosLimitados) {
      if (typeof r.obtenerUsosMaximos === "function") {
        usos = r.obtenerUsosMaximos(nivelSeguro);
      } else if (r.formulaUsos) {
        usos = evaluarFormulaUsos(r.formulaUsos, nivelSeguro);
      }
    }

    const efectosBase: EfectoMecanicoRasgo[] = r.efectos ? [...r.efectos] : [];
    const selectoresBase: SelectorRasgo[] = r.selectores ? [...r.selectores] : [];

    const escalados = resolverEscaladosRasgo(r, nivelSeguro, efectosBase, selectoresBase);

    // Los usos escalados por tabla tienen precedencia sobre obtenerUsosMaximos
    const usosFinales = escalados.usosEscalados ?? usos;

    return {
      id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      origen,
      fuente,
      subclase: r.subclase || (origen === "subclase" ? subclaseNombre : undefined),
      tipoAccion: r.tipoAccion,
      nivelRequerido: r.nivel,
      tieneUsosLimitados: !!r.tieneUsosLimitados,
      usosMaximos: usosFinales,
      usosRestantes: usosFinales,
      formulaEscalado: r.formulaEscalado || (r.formulaUsos ?? undefined),
      recuperacion: (escalados.recuperacion ?? r.recuperacion ?? "ninguno") as RecuperacionRasgo,
      formulaDados: escalados.formulaDados,
      escaladoFormulaDados: r.escaladoFormulaDados,
      escaladoUsos: r.escaladoUsos ? { ...r.escaladoUsos, minimo: r.escaladoUsos.minimo ?? 1 } : undefined,
      escaladoRecuperacion: r.escaladoRecuperacion,
      escaladoEfectos: r.escaladoEfectos ? JSON.parse(JSON.stringify(r.escaladoEfectos)) : undefined,
      sincronizarEfectosConFormula: !!r.sincronizarEfectosConFormula,
      personalizado: false,
      activo: r.esActivable ? false : true,
      esActivable: !!r.esActivable,
      condicionAlActivar: r.condicionAlActivar,
      duracionEfectoAlActivar: r.duracionEfectoAlActivar,
      restaurarUsosAlActivar: r.restaurarUsosAlActivar ? { ...r.restaurarUsosAlActivar } : undefined,
      autoDesactivar: !!r.autoDesactivar,
      autoDesactivarAlTirarDano: !!r.autoDesactivarAlTirarDano,
      dispararAlTirarIniciativa: !!r.dispararAlTirarIniciativa,
      requiereSinMovimiento: !!r.requiereSinMovimiento,
      ligadoA: r.ligadoA,
      requiereOpcion: r.requiereOpcion,
      gastarDePadre: !!r.gastarDePadre,
      heredarDadosPadre: !!r.heredarDadosPadre,
      reducirDadosPadre: !!r.reducirDadosPadre,
      conjurosOtorgados: r.conjurosOtorgados ? [...r.conjurosOtorgados] : [],
      conjuroGratuito: r.conjuroGratuito,
      recuperacionConjuro: r.recuperacionConjuro,
      noGastarAlTirarDados: !!r.noGastarAlTirarDados,
      categoriaMecanica: r.categoriaMecanica,
      costeFijo: r.costeFijo,
      efectos: escalados.efectos,
      selectores: escalados.selectores,
      tablaProgresion: r.tablaProgresion ? JSON.parse(JSON.stringify(r.tablaProgresion)) : undefined,
      recuperarEspacios: r.recuperarEspacios ? { ...r.recuperarEspacios } : undefined,
      dadosGuardados: r.dadosGuardados ? [...r.dadosGuardados] : [],
      guardaDadosTirada: !!r.guardaDadosTirada,
      recargaConEspacio: !!r.recargaConEspacio,
      multiplicadorRecargaEspacio: r.multiplicadorRecargaEspacio,
      recargaDescansoCorto: r.recargaDescansoCorto,
      notas: ""
    };
  }

  function fusionarExtension(
    padre: RasgoPersonaje,
    r: import("@/constantes/rasgosDND55").PlantillaRasgoClase,
    subclaseNombreItem?: string
  ) {
    const nivelesPrevios = padre.notas ? padre.notas.split(",") : [String(padre.nivelRequerido)];
    if (!nivelesPrevios.includes(String(r.nivel))) {
      nivelesPrevios.push(String(r.nivel));
    }
    padre.notas = nivelesPrevios.join(",");
    padre.fuente = subclaseNombreItem
      ? `${clase?.nombre || claseNombre} (${subclaseNombreItem} - Niveles ${nivelesPrevios.join(", ")})`
      : `${clase?.nombre || claseNombre} (Niveles ${nivelesPrevios.join(", ")})`;
    padre.descripcion += `\n\n***${r.nombre} (Nv. ${r.nivel}).*** ${r.descripcion}`;
    if (r.formulaDados) padre.formulaDados = r.formulaDados;
    if (r.guardaDadosTirada) padre.guardaDadosTirada = true;
    if (r.recargaConEspacio) padre.recargaConEspacio = true;
    if (r.multiplicadorRecargaEspacio) padre.multiplicadorRecargaEspacio = r.multiplicadorRecargaEspacio;
    if (r.recuperacion) padre.recuperacion = r.recuperacion as RecuperacionRasgo;
    if (r.recargaDescansoCorto !== undefined) padre.recargaDescansoCorto = r.recargaDescansoCorto;
    if (r.tipoAccion && r.tipoAccion !== "pasivo") padre.tipoAccion = r.tipoAccion;
    if (Array.isArray(r.efectos) && r.efectos.length > 0) {
      padre.efectos = [...(padre.efectos || []), ...JSON.parse(JSON.stringify(r.efectos))];
    }
    if (Array.isArray(r.selectores) && r.selectores.length > 0) {
      if (!Array.isArray(padre.selectores) || padre.selectores.length === 0) {
        padre.selectores = JSON.parse(JSON.stringify(r.selectores));
      } else {
        for (const selExt of r.selectores) {
          const selPadre = padre.selectores.find(
            (s) => s.id === selExt.id || normalizarTextoClase(s.etiqueta) === normalizarTextoClase(selExt.etiqueta)
          );
          if (selPadre) {
            if (Array.isArray(selExt.opciones)) {
              const idsExistentes = new Set((selPadre.opciones || []).map((o) => o.id));
              for (const op of selExt.opciones) {
                if (!idsExistentes.has(op.id)) {
                  idsExistentes.add(op.id);
                  selPadre.opciones.push(JSON.parse(JSON.stringify(op)));
                }
              }
            }
            if (selExt.maxSelecciones && selExt.maxSelecciones > (selPadre.maxSelecciones || 1)) {
              selPadre.maxSelecciones = selExt.maxSelecciones;
              if (selExt.maxSelecciones > 1) {
                selPadre.tipo = "multiple";
              }
            }
          } else {
            padre.selectores.push(JSON.parse(JSON.stringify(selExt)));
          }
        }
      }
    }
  }

  // 1. Rasgos de Clase Base
  for (const r of clase.rasgos) {
    if (r.nivel <= nivelSeguro) {
      if (esRasgoPlaceholderSubclase(r.nombre)) {
        continue;
      }

      // Consolidación orgánica de rasgos de extensión ligados a otro rasgo (Decorator pattern genérico)
      if (r.categoriaMecanica === "extension" && r.ligadoA) {
        const ligNorm = normalizarTextoClase(r.ligadoA);
        const padre = rasgosResultado.find(
          (x) => normalizarTextoClase(x.id) === ligNorm || normalizarTextoClase(x.nombre) === ligNorm
        );
        if (padre) {
          fusionarExtension(padre, r);
        }
        continue;
      }

      const esMejora = esRasgoMejoraCaracteristica(r.nombre);
      const esDonEpico = esRasgoDonEpico(r.nombre);
      const esEstilo = esRasgoEstiloCombate(r.nombre);
      const id = r.id || (esMejora
        ? `rasgo_cls_${normalizarTextoClase(clase.id)}_mejora_de_caracteristica_nv${r.nivel}`
        : esDonEpico
        ? `rasgo_cls_${normalizarTextoClase(clase.id)}_don_epico_nv${r.nivel}`
        : esEstilo
        ? `rasgo_cls_${normalizarTextoClase(clase.id)}_estilo_de_combate_nv${r.nivel}`
        : `rasgo_cls_${normalizarTextoClase(clase.id)}_${normalizarTextoClase(r.nombre).replace(/\s+/g, "_")}`);
      const fuente = `${clase.nombre} (Nivel ${r.nivel})`;

      const rasgoConstruido = construirRasgo(r, id, fuente, "clase");

      if (esMejora) {
        rasgoConstruido.categoriaMecanica = "selector_informativo";
        if (!rasgoConstruido.selectores || rasgoConstruido.selectores.length === 0) {
          rasgoConstruido.selectores = [crearSelectorDoteMejoraCaracteristica(clase.id, r.nivel)];
        }
      } else if (esDonEpico) {
        rasgoConstruido.categoriaMecanica = "selector_informativo";
        if (!rasgoConstruido.selectores || rasgoConstruido.selectores.length === 0) {
          rasgoConstruido.selectores = [crearSelectorDoteDonEpico(clase.id, r.nivel, r.descripcion)];
        }
      } else if (esEstilo) {
        rasgoConstruido.categoriaMecanica = "selector_informativo";
        if (!rasgoConstruido.selectores || rasgoConstruido.selectores.length === 0) {
          rasgoConstruido.selectores = [crearSelectorDoteEstiloCombate(clase.id, r.nivel)];
        }
      }

      rasgosResultado.push(rasgoConstruido);
    }
  }

  // 2. Rasgos de Subclase
  if (subclaseNombre) {
    const subclase = obtenerSubclasePorNombre(clase.nombre, subclaseNombre);
    if (subclase) {
      for (const r of subclase.rasgos) {
        if (r.nivel <= nivelSeguro) {
          // Consolidación orgánica de rasgos de extensión en subclases (Decorator pattern genérico)
          if (r.categoriaMecanica === "extension" && r.ligadoA) {
            const ligNorm = normalizarTextoClase(r.ligadoA);
            const padre = rasgosResultado.find(
              (x) => normalizarTextoClase(x.id) === ligNorm || normalizarTextoClase(x.nombre) === ligNorm
            );
            if (padre) {
              fusionarExtension(padre, r, subclase.nombre);
            }
            continue;
          }

          const id = r.id || `rasgo_sub_${normalizarTextoClase(subclase.id)}_${normalizarTextoClase(r.nombre).replace(/\s+/g, "_")}`;
          const fuente = `${clase.nombre} (${subclase.nombre} - Nivel ${r.nivel})`;

          rasgosResultado.push(construirRasgo(r, id, fuente, "subclase"));
        }
      }
    }
  }

  // 3. Post-proceso genérico: heredar dados de padre
  for (const r of rasgosResultado) {
    if (r.heredarDadosPadre && r.ligadoA && !r.formulaDados) {
      const ligNorm = normalizarTextoClase(r.ligadoA);
      const padre = rasgosResultado.find(
        (x) => normalizarTextoClase(x.id) === ligNorm || normalizarTextoClase(x.nombre) === ligNorm
      );
      if (padre?.formulaDados) {
        r.formulaDados = padre.formulaDados;
      }
      if (padre?.escaladoFormulaDados) {
        r.escaladoFormulaDados = padre.escaladoFormulaDados;
      }
    }
  }

  return rasgosResultado;
}


/**
 * Obtiene los conjuros siempre preparados y trucos otorgados por una subclase hasta un nivel dado.
 */
export function obtenerConjurosSubclaseBuild(
  claseNombre: string,
  subclaseNombre: string,
  nivel: number,
  varianteSubclase?: string
): { conjuros: string[]; trucos: string[] } {
  const subclase = obtenerSubclasePorNombre(claseNombre, subclaseNombre);
  if (!subclase) {
    return { conjuros: [], trucos: [] };
  }

  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  const conjurosSet = new Set<string>();
  const trucosSet = new Set<string>();

  let progresion = subclase.progresionConjuros || [];
  if (subclase.variantesConjuros && varianteSubclase) {
    const varNorm = normalizarTextoClase(varianteSubclase);
    for (const [claveVar, progVar] of Object.entries(subclase.variantesConjuros)) {
      if (normalizarTextoClase(claveVar).includes(varNorm) || varNorm.includes(normalizarTextoClase(claveVar))) {
        progresion = progVar;
        break;
      }
    }
  }

  for (const entrada of progresion) {
    if (nivelSeguro >= entrada.nivelClase) {
      (entrada.conjuros || []).forEach((c) => conjurosSet.add(c));
      (entrada.trucos || []).forEach((t) => trucosSet.add(t));
    }
  }

  return {
    conjuros: Array.from(conjurosSet),
    trucos: Array.from(trucosSet)
  };
}

/**
 * Construye la estructura completa de build para una clase y subclase a un nivel dado.
 */
export function construirBuildClase(
  claseNombre: string,
  nivel: number = 1,
  subclaseNombre?: string,
  varianteSubclase?: string
): BuildClaseCalculada | null {
  const clase = obtenerClasePorNombre(claseNombre);
  if (!clase) return null;

  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  const subclase = subclaseNombre ? obtenerSubclasePorNombre(clase.nombre, subclaseNombre) : undefined;
  const rasgos = obtenerRasgosClaseYSubclase(clase.nombre, nivelSeguro, subclase?.nombre);
  const magiaSubclase = subclase
    ? obtenerConjurosSubclaseBuild(clase.nombre, subclase.nombre, nivelSeguro, varianteSubclase)
    : { conjuros: [], trucos: [] };

  const configMagica = subclase?.configuracionMagica || clase.configuracionMagica;

  return {
    clase,
    subclase,
    nivel: nivelSeguro,
    dadoGolpe: clase.dadoGolpe,
    salvacionesCompetentes: clase.salvacionesCompetentes,
    competenciasArmaduras: clase.competenciasArmaduras,
    competenciasArmas: clase.competenciasArmas,
    competenciasHerramientas: clase.competenciasHerramientas || [],
    rasgos,
    configuracionMagica: configMagica,
    conjurosSiemprePreparados: magiaSubclase.conjuros,
    trucosOtorgados: magiaSubclase.trucos,
    efectosActivosResueltos: rasgos.flatMap((r) => (r.activo !== false ? r.efectos || [] : []))
  };
}

/**
 * Aplica una build de clase y subclase completa a un personaje de forma inmutable y pura.
 */
export function aplicarBuildClaseAPersonaje(
  personaje: PersonajeJugador,
  claseNombreOBuild: string | BuildClaseCalculada,
  nivelOOpciones?: number | OpcionesAplicarBuild,
  subclaseNombre?: string,
  opcionesParam?: OpcionesAplicarBuild
): PersonajeJugador {
  let build: BuildClaseCalculada | null = null;
  let opciones: OpcionesAplicarBuild = {
    sobrescribirDadoGolpe: true,
    sobrescribirSalvaciones: true,
    sobrescribirCompetenciasEquipo: true,
    sobrescribirConfiguracionMagia: true,
    sincronizarRasgos: true,
    sincronizarConjurosSubclase: true
  };

  if (typeof claseNombreOBuild === "object" && claseNombreOBuild !== null) {
    build = claseNombreOBuild;
    if (typeof nivelOOpciones === "object" && nivelOOpciones !== null) {
      opciones = { ...opciones, ...nivelOOpciones };
    }
  } else {
    const nivel = typeof nivelOOpciones === "number" ? nivelOOpciones : 1;
    if (opcionesParam) {
      opciones = { ...opciones, ...opcionesParam };
    }
    build = construirBuildClase(claseNombreOBuild, nivel, subclaseNombre);
  }

  if (!build) return personaje;

  const nuevoNivel = build.nivel;
  const nuevoNombreClase = build.clase.nombre;
  const nuevoNombreSubclase = build.subclase?.nombre || "";

  // 1. Actualizar lista estructurada de clases
  const clasesActualizadas: ClasePersonaje[] = [
    {
      nombre: nuevoNombreClase,
      subclase: nuevoNombreSubclase,
      nivel: nuevoNivel
    }
  ];

  // 2. Salvaciones
  const competenciasSalvacion: CompetenciasSalvacion = opciones.sobrescribirSalvaciones
    ? {
        fuerza: build.salvacionesCompetentes.includes("fuerza"),
        destreza: build.salvacionesCompetentes.includes("destreza"),
        constitucion: build.salvacionesCompetentes.includes("constitucion"),
        inteligencia: build.salvacionesCompetentes.includes("inteligencia"),
        sabiduria: build.salvacionesCompetentes.includes("sabiduria"),
        carisma: build.salvacionesCompetentes.includes("carisma")
      }
    : personaje.competenciasSalvacion;

  // 3. Competencias de equipo
  let competenciasArmas = personaje.competenciasArmas;
  let competenciasArmasGrupos = personaje.competenciasArmasGrupos;
  let competenciasArmasLista = personaje.competenciasArmasLista;
  let competenciasArmaduras = personaje.competenciasArmaduras;
  let competenciasArmadurasGrupos = personaje.competenciasArmadurasGrupos;
  let competenciasArmadurasLista = personaje.competenciasArmadurasLista;

  if (opciones.sobrescribirCompetenciasEquipo) {
    const res = resolverGruposYSustitutosCompetencias(build.competenciasArmas, build.competenciasArmaduras);
    competenciasArmas = res.competenciasArmas;
    competenciasArmasGrupos = res.competenciasArmasGrupos;
    competenciasArmasLista = res.competenciasArmasLista;
    competenciasArmaduras = res.competenciasArmaduras;
    competenciasArmadurasGrupos = res.competenciasArmadurasGrupos;
    competenciasArmadurasLista = res.competenciasArmadurasLista;
  }

  // 4. Magia y lanzador
  let esLanzador = personaje.esLanzador;
  let clasesLanzadoras: ClaseLanzadora[] = personaje.clasesLanzadoras || [];
  let espaciosConjuroMaximos = personaje.espaciosConjuroMaximos || {};
  let puntosConjuroMaximos = personaje.puntosConjuroMaximos || 0;
  let nivelConjuroMaximo = personaje.nivelConjuroMaximo || 0;
  let espaciosPactoMaximos = personaje.espaciosPactoMaximos || 0;
  let nivelEspacioPacto = personaje.nivelEspacioPacto || 0;

  if (opciones.sobrescribirConfiguracionMagia) {
    if (build.configuracionMagica) {
      esLanzador = true;
      clasesLanzadoras = [
        {
          clase: nuevoNombreClase,
          nivel: nuevoNivel,
          tipoLanzador: build.configuracionMagica.tipoLanzador,
          habilidadConjuro: build.configuracionMagica.habilidadConjuro,
          modeloConjuros: build.configuracionMagica.modeloConjuros,
          listaConjuros: build.configuracionMagica.listaConjuros
        }
      ];
      const recursos = calcularTodosRecursosMagicos(
        clasesLanzadoras,
        personaje.overrideEspaciosConjuro,
        personaje.overridePuntosConjuro
      );
      espaciosConjuroMaximos = recursos.espaciosConjuroMaximos;
      puntosConjuroMaximos = recursos.puntosConjuroMaximos;
      nivelConjuroMaximo = recursos.nivelConjuroMaximo;
      espaciosPactoMaximos = recursos.espaciosPactoMaximos;
      nivelEspacioPacto = recursos.nivelEspacioPacto;
    } else {
      esLanzador = false;
      clasesLanzadoras = [];
      espaciosConjuroMaximos = {};
      puntosConjuroMaximos = 0;
      nivelConjuroMaximo = 0;
      espaciosPactoMaximos = 0;
      nivelEspacioPacto = 0;
    }
  }

  // 5. Instanciar personaje base intermedio
  const personajeIntermedio: PersonajeJugador = {
    ...personaje,
    clase: nuevoNombreClase,
    subclase: nuevoNombreSubclase,
    nivel: nuevoNivel,
    clases: clasesActualizadas,
    tipoDadoGolpe: opciones.sobrescribirDadoGolpe ? build.dadoGolpe : personaje.tipoDadoGolpe,
    dadosGolpeTotal: opciones.sobrescribirDadoGolpe ? nuevoNivel : personaje.dadosGolpeTotal,
    dadosGolpeRestantes: opciones.sobrescribirDadoGolpe ? nuevoNivel : personaje.dadosGolpeRestantes,
    competenciasSalvacion,
    competenciasArmas,
    competenciasArmasGrupos,
    competenciasArmasLista,
    competenciasArmaduras,
    competenciasArmadurasGrupos,
    competenciasArmadurasLista,
    esLanzador,
    clasesLanzadoras,
    espaciosConjuroMaximos,
    puntosConjuroMaximos,
    nivelConjuroMaximo,
    espaciosPactoMaximos,
    nivelEspacioPacto
  };

  // 6. Sincronizar rasgos automáticos de clase y subclase
  let rasgosFinales = personaje.rasgos;
  if (opciones.sincronizarRasgos) {
    rasgosFinales = sincronizarRasgosAutomaticos(personajeIntermedio);
  }

  // Fusión persistente de competencias otorgadas por subclases (ej. Colegio del Valor: armas marciales, armaduras medias, escudos)
  let armasTextoPersistente = competenciasArmas;
  let armadurasTextoPersistente = competenciasArmaduras;
  const compSubclase = obtenerCompetenciasExtraRasgos({ ...personajeIntermedio, rasgos: rasgosFinales });

  if (compSubclase.armasGrupos.includes("marciales")) {
    if (!armasTextoPersistente || armasTextoPersistente === "Ninguna") {
      armasTextoPersistente = "Armas Marciales";
    } else if (!armasTextoPersistente.toLowerCase().includes("marcial")) {
      armasTextoPersistente = `${armasTextoPersistente}, Armas Marciales`;
    }
  }

  const armadurasExtras: string[] = [];
  if (compSubclase.armadurasGrupos.includes("medias") && !armadurasTextoPersistente?.toLowerCase().includes("media")) {
    armadurasExtras.push("Armaduras Medias");
  }
  if (compSubclase.armadurasGrupos.includes("escudos") && !armadurasTextoPersistente?.toLowerCase().includes("escudo")) {
    armadurasExtras.push("Escudos");
  }
  if (armadurasExtras.length > 0) {
    if (!armadurasTextoPersistente || armadurasTextoPersistente === "Ninguna") {
      armadurasTextoPersistente = armadurasExtras.join(", ");
    } else {
      armadurasTextoPersistente = `${armadurasTextoPersistente}, ${armadurasExtras.join(", ")}`;
    }
  }

  const gruposArmadurasPersistentes = Array.from(
    new Set([...(competenciasArmadurasGrupos || []), ...compSubclase.armadurasGrupos])
  );
  const gruposArmasPersistentes = Array.from(
    new Set([...(competenciasArmasGrupos || []), ...compSubclase.armasGrupos])
  );

  // Fusión de salvaciones procedentes de rasgos de clase o subclase (ej. Mente escurridiza)
  const salvacionesPersistentes: CompetenciasSalvacion = {
    fuerza: competenciasSalvacion.fuerza || compSubclase.salvaciones.includes("fuerza"),
    destreza: competenciasSalvacion.destreza || compSubclase.salvaciones.includes("destreza"),
    constitucion: competenciasSalvacion.constitucion || compSubclase.salvaciones.includes("constitucion"),
    inteligencia: competenciasSalvacion.inteligencia || compSubclase.salvaciones.includes("inteligencia"),
    sabiduria: competenciasSalvacion.sabiduria || compSubclase.salvaciones.includes("sabiduria"),
    carisma: competenciasSalvacion.carisma || compSubclase.salvaciones.includes("carisma")
  };

  // Fusión de herramientas procedentes de rasgos
  const listaHerramientasActual: string[] = [
    ...(personaje.herramientasLista || []),
    ...(personaje.herramientas && personaje.herramientas !== "Ninguna"
      ? personaje.herramientas.split(",").map((h) => h.trim()).filter(Boolean)
      : [])
  ];
  for (const h of compSubclase.herramientas) {
    if (!listaHerramientasActual.some((existente) => sonHerramientasEquivalentes(existente, h))) {
      listaHerramientasActual.push(h);
    }
  }

  // Fusión de idiomas procedentes de rasgos (ej. Jerga de ladrones)
  const listaIdiomasActual: string[] = [
    ...(personaje.idiomasLista || []),
    ...(Array.isArray(personaje.idiomas)
      ? personaje.idiomas
      : typeof personaje.idiomas === "string" && personaje.idiomas !== "Ninguno" && personaje.idiomas !== "Ninguna"
      ? personaje.idiomas.split(",").map((i) => i.trim()).filter(Boolean)
      : [])
  ];
  for (const idm of compSubclase.idiomas) {
    if (!listaIdiomasActual.some((existente) => normalizarTextoClase(existente) === normalizarTextoClase(idm))) {
      listaIdiomasActual.push(idm);
    }
  }

  const personajeConRasgos: PersonajeJugador = {
    ...personajeIntermedio,
    competenciasSalvacion: salvacionesPersistentes,
    competenciasArmas: armasTextoPersistente,
    competenciasArmaduras: armadurasTextoPersistente,
    competenciasArmadurasGrupos: gruposArmadurasPersistentes,
    competenciasArmasGrupos: gruposArmasPersistentes,
    herramientas: listaHerramientasActual.length > 0 ? listaHerramientasActual.join(", ") : (personaje.herramientas || "Ninguna"),
    herramientasLista: listaHerramientasActual,
    idiomas: listaIdiomasActual.length > 0 ? listaIdiomasActual.join(", ") : (personaje.idiomas || "Común"),
    idiomasLista: listaIdiomasActual.length > 0 ? listaIdiomasActual : (personaje.idiomasLista || ["Común"]),
    rasgos: rasgosFinales
  };

  const tieneAprendiz = tieneMedioBonoHabilidades(personajeConRasgos);
  const gradosActualizados = aplicarAprendizDeMuchoAGradosHabilidades(
    personaje.gradosHabilidades,
    tieneAprendiz
  );

  const personajeFinal: PersonajeJugador = {
    ...personajeConRasgos,
    gradosHabilidades: gradosActualizados
  };

  // 7. Sincronizar conjuros de subclase
  if (opciones.sincronizarConjurosSubclase) {
    const syncMagia = sincronizarConjurosSubclaseHelper(personajeFinal);
    return {
      ...syncMagia,
      rasgos: rasgosFinales,
      gradosHabilidades: gradosActualizados
    };
  }

  return personajeFinal;
}

/**
 * Obtiene el nivel efectivo que aplica a un rasgo en el contexto de un personaje.
 * - Para rasgos de clase o subclase (o asociados a una clase específica): retorna el nivel individual de dicha clase.
 * - Para rasgos de especie, subespecie, dote, trasfondo o personalizados (o si no se identifica la clase): retorna el nivel general del personaje.
 */
export function obtenerNivelEfectivoParaRasgo(
  personaje: PersonajeJugador | null | undefined,
  rasgo: RasgoPersonaje | null | undefined
): number {
  if (!personaje) return 1;
  const nivelGeneral = Math.max(1, Math.min(20, personaje.nivel || 1));
  if (!rasgo) return nivelGeneral;

  // Si es claramente un rasgo general no dependiente de clase (especie, dote, trasfondo), aplica el nivel general
  if (
    rasgo.origen === "especie" ||
    rasgo.origen === "subespecie" ||
    rasgo.origen === "dote" ||
    rasgo.origen === "trasfondo"
  ) {
    return nivelGeneral;
  }

  // Clases configuradas en el personaje
  const clasesPersonaje: Array<{ nombre: string; subclase?: string; nivel: number }> =
    personaje.clases && personaje.clases.length > 0
      ? personaje.clases
      : [
          {
            nombre: personaje.clase || "Guerrero",
            subclase: personaje.subclase || "",
            nivel: personaje.nivel || 1
          }
        ];

  // Si el personaje solo cuenta con una clase configurada, su nivel coincide con el general
  if (clasesPersonaje.length === 1) {
    return clasesPersonaje[0].nivel || nivelGeneral;
  }

  const normFuente = normalizarTextoClase(rasgo.fuente || "");
  const normId = normalizarTextoClase(rasgo.id || "");
  const normNombre = normalizarTextoClase(rasgo.nombre || "");

  // 1. Búsqueda por coincidencia directa con las clases del personaje
  for (const c of clasesPersonaje) {
    const normNombreClase = normalizarTextoClase(c.nombre);
    const normSubclaseClase = normalizarTextoClase(c.subclase || "");

    // Coincidencia con el nombre de la clase en la fuente o en el id
    if (normNombreClase && (normFuente.includes(normNombreClase) || normId.includes(`_${normNombreClase}_`))) {
      return c.nivel;
    }

    // Coincidencia con la subclase configurada
    if (normSubclaseClase && (normFuente.includes(normSubclaseClase) || normId.includes(`_${normSubclaseClase}_`))) {
      return c.nivel;
    }
  }

  // 2. Búsqueda por catálogo oficial de clases y subclases canónicas
  for (const c of clasesPersonaje) {
    const defClase = obtenerClasePorNombre(c.nombre);
    if (!defClase) continue;

    const idClaseNorm = normalizarTextoClase(defClase.id);
    if (normId.includes(`_${idClaseNorm}_`) || normFuente.includes(idClaseNorm)) {
      return c.nivel;
    }

    // Comprobar si el rasgo figura en la lista de rasgos de esta clase
    if (defClase.rasgos.some((r) => normalizarTextoClase(r.nombre) === normNombre)) {
      return c.nivel;
    }

    // Comprobar si pertenece a alguna de las subclases de esta clase
    for (const sub of defClase.subclases) {
      const subNombreNorm = normalizarTextoClase(sub.nombre);
      const subIdNorm = normalizarTextoClase(sub.id);
      if (
        (subNombreNorm && (normFuente.includes(subNombreNorm) || normId.includes(`_${subNombreNorm}_`))) ||
        (subIdNorm && normId.includes(`_${subIdNorm}_`)) ||
        sub.rasgos.some((r) => normalizarTextoClase(r.nombre) === normNombre)
      ) {
        return c.nivel;
      }
    }
  }

  // Fallback seguro: nivel general del personaje si no se detectó vinculación a una clase específica
  return nivelGeneral;
}
