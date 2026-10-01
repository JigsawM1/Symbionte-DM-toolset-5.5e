import type {
  ClaseLanzadora,
  Caracteristica,
  TipoLanzador,
  ModeloConjuros,
  PersonajeJugador,
  HechizoBase
} from "@/tipos";
import {
  TABLA_ESPACIOS_CONJURO,
  TABLA_PUNTOS_CONJURO,
  COSTE_PUNTOS_POR_NIVEL,
  TIPO_LANZADOR_POR_CLASE,
  TABLA_PACTO_BRUJO,
  resolverAtributoConjuroClase,
  esClasePacto
} from "@/constantes";
import {
  CATALOGO_CONJUROS_SUBCLASES
} from "@/constantes/subclasesConjurosConstantes";
import { TODAS_SUBCLASES_DND55 } from "@/constantes/clasesDND55";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { logger } from "@/utiles/logger";

/**
 * Calcula el nivel de lanzador combinado para reglas de multiclase (D&D 5.5e).
 * - Completo (Bardo, Clérigo, Druida, Hechicero, Mago): nivel * 1
 * - Medio (Explorador, Paladín): floor(nivel / 2) (o 1 si nivel == 1 en 2024 mono, pero en multiclase estándar floor(nv/2))
 * - Tercio (Caballero Arcano, Embaucador Arcano): floor(nivel / 3)
 * - Magia de Pacto (Brujo): NO se combina (se gestiona por separado)
 */
export function calcularNivelLanzadorMulticlase(
  clasesLanzadoras: ClaseLanzadora[]
): number {
  if (!clasesLanzadoras || clasesLanzadoras.length === 0) return 0;

  // Si solo hay una clase y es medio-lanzador (Paladín o Explorador), en D&D 2024 lanzan desde nivel 1
  if (clasesLanzadoras.length === 1) {
    const claseUnica = clasesLanzadoras[0];
    if (claseUnica.tipoLanzador === "completo") return claseUnica.nivel;
    if (claseUnica.tipoLanzador === "medio") {
      return Math.max(1, Math.ceil(claseUnica.nivel / 2));
    }
    if (claseUnica.tipoLanzador === "tercio") {
      return Math.floor(claseUnica.nivel / 3);
    }
    if (claseUnica.tipoLanzador === "pacto" || claseUnica.tipoLanzador === "ninguno") {
      return 0;
    }
  }

  let totalNivel = 0;
  for (const item of clasesLanzadoras) {
    switch (item.tipoLanzador) {
      case "completo":
        totalNivel += item.nivel;
        break;
      case "medio":
        totalNivel += Math.floor(item.nivel / 2);
        break;
      case "tercio":
        totalNivel += Math.floor(item.nivel / 3);
        break;
      case "pacto":
      case "ninguno":
      default:
        // No aportan a la progresión estándar multiclase
        break;
    }
  }

  return Math.min(20, Math.max(0, totalNivel));
}

/**
 * Calcula los espacios de conjuro disponibles por nivel de ranura (1-9).
 * Permite aplicar overrides manuales definidos por el usuario.
 */
export function calcularEspaciosConjuro(
  clasesLanzadoras: ClaseLanzadora[],
  overrides?: Record<string, number> | null
): Record<string, number> {
  const nivelLanzador = calcularNivelLanzadorMulticlase(clasesLanzadoras);
  const espaciosBase: Record<string, number> = {};

  if (nivelLanzador > 0) {
    const tablaNivel = TABLA_ESPACIOS_CONJURO[nivelLanzador] || {};
    for (let niv = 1; niv <= 9; niv++) {
      const cant = tablaNivel[niv] || 0;
      if (cant > 0) {
        espaciosBase[String(niv)] = cant;
      }
    }
  }

  if (!overrides) {
    return espaciosBase;
  }

  // Aplicar overrides conservando los niveles que tengan valor
  const resultado: Record<string, number> = { ...espaciosBase };
  for (const [clave, valor] of Object.entries(overrides)) {
    if (typeof valor === "number" && valor >= 0) {
      if (valor > 0) {
        resultado[clave] = valor;
      } else {
        delete resultado[clave];
      }
    }
  }

  return resultado;
}

/**
 * Calcula los puntos de conjuro totales y el nivel máximo de conjuro permitido (variante DMG).
 */
export function calcularPuntosConjuro(
  clasesLanzadoras: ClaseLanzadora[],
  overridePuntos?: number | null
): { puntosMaximos: number; nivelMaximo: number } {
  const nivelLanzador = calcularNivelLanzadorMulticlase(clasesLanzadoras);
  const infoBase = TABLA_PUNTOS_CONJURO[nivelLanzador] || { puntos: 0, nivelMax: 0 };

  const puntosFinales =
    typeof overridePuntos === "number" && overridePuntos >= 0
      ? overridePuntos
      : infoBase.puntos;

  return {
    puntosMaximos: puntosFinales,
    nivelMaximo: infoBase.nivelMax
  };
}

/**
 * Calcula la Clase de Dificultad (CD) para tiradas de salvación de conjuros.
 * Fórmula oficial: 8 + Bono de Competencia + Modificador de Característica
 */
export function calcularCDConjuros(
  bonoCompetencia: number,
  modificadorHabilidad: number
): number {
  return 8 + bonoCompetencia + modificadorHabilidad;
}

/**
 * Calcula el Bonificador de Ataque con Conjuros.
 * Fórmula oficial: Bono de Competencia + Modificador de Característica
 */
export function calcularBonoAtaqueConjuro(
  bonoCompetencia: number,
  modificadorHabilidad: number
): number {
  return bonoCompetencia + modificadorHabilidad;
}

/**
 * Calcula los espacios de Magia del Pacto del Brujo según su nivel de clase.
 */
export function calcularEspaciosPacto(
  nivelBrujo: number
): { espacios: number; nivel: number } {
  const nivelSeguro = Math.min(20, Math.max(1, Math.floor(nivelBrujo) || 1));
  const info = TABLA_PACTO_BRUJO[nivelSeguro] || { espacios: 1, nivel: 1 };
  return {
    espacios: info.espacios,
    nivel: info.nivel
  };
}

/**
 * Calcula de forma unificada todos los recursos mágicos (Estándar + Pacto Brujo + Puntos).
 */
export function calcularTodosRecursosMagicos(
  clasesLanzadoras: ClaseLanzadora[],
  overrideEspacios?: Record<string, number> | null,
  overridePuntos?: number | null
): {
  espaciosConjuroMaximos: Record<string, number>;
  puntosConjuroMaximos: number;
  nivelConjuroMaximo: number;
  espaciosPactoMaximos: number;
  nivelEspacioPacto: number;
} {
  if (!clasesLanzadoras || clasesLanzadoras.length === 0) {
    return {
      espaciosConjuroMaximos: overrideEspacios || {},
      puntosConjuroMaximos: overridePuntos || 0,
      nivelConjuroMaximo: 0,
      espaciosPactoMaximos: 0,
      nivelEspacioPacto: 0
    };
  }

  const espacios = calcularEspaciosConjuro(clasesLanzadoras, overrideEspacios);
  const puntos = calcularPuntosConjuro(clasesLanzadoras, overridePuntos);

  // Buscar clase Brujo o tipo "pacto"
  const claseBrujo = clasesLanzadoras.find(
    (c) => c.tipoLanzador === "pacto" || esClasePacto(c.clase)
  );

  const pacto = claseBrujo
    ? calcularEspaciosPacto(claseBrujo.nivel)
    : { espacios: 0, nivel: 0 };

  return {
    espaciosConjuroMaximos: espacios,
    puntosConjuroMaximos: puntos.puntosMaximos,
    nivelConjuroMaximo: puntos.nivelMaximo,
    espaciosPactoMaximos: pacto.espacios,
    nivelEspacioPacto: pacto.nivel
  };
}

/**
 * Retorna el coste en puntos de conjuro para un nivel de conjuro específico (1 a 9).
 */
export function obtenerCostePuntos(nivelConjuro: number): number {
  if (nivelConjuro <= 0) return 0;
  return COSTE_PUNTOS_POR_NIVEL[nivelConjuro] ?? 0;
}

/**
 * Detecta automáticamente la configuración de lanzador predeterminada de una clase.
 */
export function detectarTipoLanzador(
  clase: string,
  subclase?: string
): {
  tipo: TipoLanzador;
  habilidad: Caracteristica;
  modelo: ModeloConjuros;
  listaConjuros?: string;
} | null {
  const claseLimpia = clase?.trim() || "";
  const subclaseLimpia = subclase?.trim() || "";

  // Prioridad 1: Subclases tercio-lanzadoras
  if (
    subclaseLimpia.toLowerCase().includes("caballero arcano") ||
    subclaseLimpia.toLowerCase().includes("eldritch knight")
  ) {
    return TIPO_LANZADOR_POR_CLASE["Caballero Arcano"];
  }

  if (
    subclaseLimpia.toLowerCase().includes("embaucador arcano") ||
    subclaseLimpia.toLowerCase().includes("arcane trickster")
  ) {
    return TIPO_LANZADOR_POR_CLASE["Embaucador Arcano"];
  }

  // Prioridad 2: Clases base directas
  for (const [nombreClase, config] of Object.entries(TIPO_LANZADOR_POR_CLASE)) {
    if (claseLimpia.toLowerCase() === nombreClase.toLowerCase()) {
      return config;
    }
  }

  return null;
}

// Tablas oficiales de Trucos Conocidos por nivel de clase (D&D 5.5e / 2024)
const TRUCOS_POR_CLASE_Y_NIVEL: Record<string, number[]> = {
  mago: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  brujo: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  hechicero: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  clerigo: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  druida: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  bardo: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  paladin: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  explorador: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "caballero arcano": [0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  "embaucador arcano": [0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
};

// Tablas oficiales de Conjuros Preparados / Conocidos por nivel de clase (D&D 5.5e / 2024)
const CONJUROS_POR_CLASE_Y_NIVEL: Record<string, number[]> = {
  mago: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  brujo: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  hechicero: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  clerigo: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  druida: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  bardo: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  paladin: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  explorador: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  "caballero arcano": [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
  "embaucador arcano": [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13]
};

function normalizarClaveClase(nombre: string, tipoLanzador?: TipoLanzador): string {
  const norm = (nombre || "").toLowerCase().trim();
  if (norm.includes("mago") || norm.includes("wizard")) return "mago";
  if (norm.includes("brujo") || norm.includes("warlock")) return "brujo";
  if (norm.includes("hechicero") || norm.includes("sorcerer")) return "hechicero";
  if (norm.includes("clerigo") || norm.includes("clérigo") || norm.includes("cleric")) return "clerigo";
  if (norm.includes("druida") || norm.includes("druid")) return "druida";
  if (norm.includes("bardo") || norm.includes("bard")) return "bardo";
  if (norm.includes("paladin") || norm.includes("paladín")) return "paladin";
  if (norm.includes("explorador") || norm.includes("ranger")) return "explorador";
  if (norm.includes("caballero") || norm.includes("eldritch") || (norm.includes("guerrero") && tipoLanzador === "tercio")) return "caballero arcano";
  if (norm.includes("embaucador") || norm.includes("trickster") || (norm.includes("picaro") && tipoLanzador === "tercio") || (norm.includes("pícaro") && tipoLanzador === "tercio")) return "embaucador arcano";
  if (tipoLanzador === "tercio") return "caballero arcano";
  return norm;
}

/**
 * Calcula la cantidad máxima oficial de Trucos y Conjuros (Preparados o Conocidos) que puede tener un personaje.
 */
export function calcularMaximosConjurosYTrucos(
  clasesLanzadoras: ClaseLanzadora[],
  nivelTotalPersonaje: number = 1,
  modificadorHabilidad: number = 0
): {
  maxTrucos: number;
  maxConjuros: number;
  modelo: ModeloConjuros;
} {
  if (!clasesLanzadoras || clasesLanzadoras.length === 0) {
    return {
      maxTrucos: 0,
      maxConjuros: 0,
      modelo: "preparados"
    };
  }

  let totalMaxTrucos = 0;
  let totalMaxConjuros = 0;
  let requierePreparacion = false;
  let huboCoincidencia = false;

  for (const claseItem of clasesLanzadoras) {
    const clave = normalizarClaveClase(claseItem.clase, claseItem.tipoLanzador);
    const niv = Math.min(20, Math.max(1, Math.floor(claseItem.nivel) || 1));

    if (claseItem.modeloConjuros === "preparados") {
      requierePreparacion = true;
    }

    const tablaTrucos = TRUCOS_POR_CLASE_Y_NIVEL[clave];
    const tablaConjuros = CONJUROS_POR_CLASE_Y_NIVEL[clave];

    if (tablaTrucos && tablaConjuros) {
      huboCoincidencia = true;
      totalMaxTrucos += tablaTrucos[niv - 1] ?? 0;
      totalMaxConjuros += tablaConjuros[niv - 1] ?? 0;
    }
  }

  // Fallback si la clase es homebrew o no coincide en tabla estándar
  if (!huboCoincidencia) {
    const niv = Math.min(20, Math.max(1, Math.floor(nivelTotalPersonaje) || 1));
    totalMaxTrucos = Math.max(2, Math.floor(niv / 4) + 2);
    totalMaxConjuros = Math.max(1, niv + Math.max(0, modificadorHabilidad));
    requierePreparacion = clasesLanzadoras.some((c) => c.modeloConjuros === "preparados");
  }

  return {
    maxTrucos: totalMaxTrucos,
    maxConjuros: totalMaxConjuros,
    modelo: requierePreparacion ? "preparados" : "conocidos"
  };
}

export interface OpcionNivelLanzamiento {
  nivel: number;
  etiqueta: string;
  tipo: "estandar" | "pacto";
}

/**
 * Calcula las opciones válidas de nivel para lanzar un conjuro (Upcasting),
 * respetando estrictamente las ranuras disponibles del personaje, las reglas de
 * Brujo (Warlock mono-clase siempre lanza a nivel de pacto fijo) y la delegación
 * en multiclase.
 */
export function obtenerOpcionesLanzamientoConjuro(parametros: {
  nivelHechizo: number;
  espaciosConjuroMaximos?: Record<string, number> | Record<number, number>;
  nivelConjuroMaximo?: number;
  sistemaMagia?: "espacios" | "puntos";
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  permitirUpcastLibre?: boolean;
}): OpcionNivelLanzamiento[] {
  const {
    nivelHechizo,
    espaciosConjuroMaximos = {},
    nivelConjuroMaximo = 0,
    sistemaMagia = "espacios",
    esLanzadorPacto = false,
    nivelEspacioPacto = 0,
    espaciosPactoMaximos = 0,
    permitirUpcastLibre = false
  } = parametros;

  // 1. Trucos (Nivel 0)
  if (nivelHechizo === 0) {
    return [{ nivel: 0, etiqueta: "Truco", tipo: "estandar" }];
  }

  // Modo libre (ej. DM / Monstruos en GestorIniciativa o Compendio): permite upcasting completo del nivel base al 9
  if (permitirUpcastLibre) {
    const opciones: OpcionNivelLanzamiento[] = [];
    for (let lvl = nivelHechizo; lvl <= 9; lvl++) {
      opciones.push({
        nivel: lvl,
        etiqueta: lvl === nivelHechizo ? `Nv. ${lvl}` : `Nv. ${lvl} ↑`,
        tipo: "estandar"
      });
    }
    return opciones;
  }

  // 2. Comprobar si tiene magia estándar y si tiene magia de pacto
  const tieneEspaciosEstandar =
    sistemaMagia === "puntos"
      ? (nivelConjuroMaximo || 0) > 0
      : Object.entries(espaciosConjuroMaximos).some(
          ([lvl, cant]) => Number(lvl) > 0 && (cant || 0) > 0
        );

  const tienePacto = esLanzadorPacto && nivelEspacioPacto > 0 && (espaciosPactoMaximos || 0) > 0;

  // 3. Caso: Brujo Puro (Tiene pacto pero NO tiene magia estándar)
  if (tienePacto && !tieneEspaciosEstandar) {
    const nivelFijo = Math.max(nivelHechizo, nivelEspacioPacto);
    return [
      {
        nivel: nivelFijo,
        etiqueta: `Pacto Nv. ${nivelFijo}`,
        tipo: "pacto"
      }
    ];
  }

  // 4. Recolectar niveles estándar disponibles >= nivelHechizo
  const nivelesEstandarDisponibles = new Set<number>();
  if (tieneEspaciosEstandar) {
    if (sistemaMagia === "puntos") {
      const maxLvl = Math.min(9, Math.max(0, nivelConjuroMaximo || 0));
      for (let lvl = nivelHechizo; lvl <= maxLvl; lvl++) {
        nivelesEstandarDisponibles.add(lvl);
      }
    } else {
      for (const [lvlStr, cant] of Object.entries(espaciosConjuroMaximos)) {
        const lvl = Number(lvlStr);
        if (lvl >= nivelHechizo && (cant || 0) > 0) {
          nivelesEstandarDisponibles.add(lvl);
        }
      }
    }
  }

  // 5. Construir conjunto combinado de niveles (Multiclase o Estándar puro)
  const todosLosNiveles = new Set<number>(nivelesEstandarDisponibles);
  if (tienePacto && nivelEspacioPacto >= nivelHechizo) {
    todosLosNiveles.add(nivelEspacioPacto);
  }

  // Si no se encontró ningún nivel válido (ej. personaje sin ranuras aún), fallback al nivel base
  if (todosLosNiveles.size === 0) {
    return [
      {
        nivel: nivelHechizo,
        etiqueta: `Nv. ${nivelHechizo}`,
        tipo: tienePacto ? "pacto" : "estandar"
      }
    ];
  }

  const nivelesOrdenados = Array.from(todosLosNiveles).sort((a, b) => a - b);
  const esMulticlasePacto = tienePacto && tieneEspaciosEstandar;

  return nivelesOrdenados.map((lvl) => {
    const esNivelPacto = tienePacto && lvl === nivelEspacioPacto;
    const esNivelEstandar = nivelesEstandarDisponibles.has(lvl);

    let etiqueta: string;
    if (esMulticlasePacto) {
      if (esNivelPacto && esNivelEstandar) {
        etiqueta = lvl === nivelHechizo ? `Nv. ${lvl} (Pacto/Estándar)` : `Nv. ${lvl} ↑ (Pacto/Estándar)`;
      } else if (esNivelPacto) {
        etiqueta = lvl === nivelHechizo ? `Nv. ${lvl} (Pacto)` : `Nv. ${lvl} ↑ (Pacto)`;
      } else {
        etiqueta = lvl === nivelHechizo ? `Nv. ${lvl}` : `Nv. ${lvl} ↑`;
      }
    } else {
      etiqueta = lvl === nivelHechizo ? `Nv. ${lvl}` : `Nv. ${lvl} ↑`;
    }

    return {
      nivel: lvl,
      etiqueta,
      tipo: esNivelPacto ? "pacto" : "estandar"
    };
  });
}

export interface ParametrosGastoConjuro {
  nivelLanzamiento: number;
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  espaciosPactoGastados?: number;
  espaciosConjuroMaximos?: Record<string, number> | Record<number, number>;
  sistemaMagia?: "espacios" | "puntos";
  costePuntosPorNivel?: Record<number, number>;
  alGastarEspacio?: (nivel: number) => void;
  alGastarPuntos?: (cantidad: number) => void;
  alGastarEspacioPacto?: () => void;
}

/**
 * Ejecuta el gasto del recurso mágico apropiado delegando entre Magia de Pacto
 * y Magia Estándar según las reglas de multiclase de D&D 5.5e.
 */
export function gastarRecursoLanzamientoConjuro(params: ParametrosGastoConjuro): {
  recursoGastado: "pacto" | "espacio" | "puntos" | "ninguno";
  nivel?: number;
  puntos?: number;
} {
  const {
    nivelLanzamiento,
    esLanzadorPacto = false,
    nivelEspacioPacto = 0,
    espaciosPactoMaximos = 0,
    espaciosPactoGastados = 0,
    espaciosConjuroMaximos = {},
    sistemaMagia = "espacios",
    costePuntosPorNivel,
    alGastarEspacio,
    alGastarPuntos,
    alGastarEspacioPacto
  } = params;

  if (nivelLanzamiento === 0) {
    return { recursoGastado: "ninguno" };
  }

  const pactoDisponible = (espaciosPactoMaximos - espaciosPactoGastados) > 0;
  const tienePacto = esLanzadorPacto && nivelEspacioPacto > 0 && espaciosPactoMaximos > 0;

  const tieneEspaciosEstandar = Object.entries(espaciosConjuroMaximos).some(
    ([lvl, max]) => Number(lvl) > 0 && (max || 0) > 0
  );

  // Si se lanza al nivel de pacto del brujo
  if (tienePacto && nivelLanzamiento === nivelEspacioPacto) {
    // Si tiene pacto disponible o NO tiene otra clase lanzadora estándar, gasta de pacto
    if (pactoDisponible || !tieneEspaciosEstandar) {
      if (alGastarEspacioPacto) {
        alGastarEspacioPacto();
        return { recursoGastado: "pacto", nivel: nivelEspacioPacto };
      }
    }
  }

  // Si se lanza a otro nivel o si el pacto está agotado con estándar disponible:
  // Se DELEGA a la magia estándar de la otra clase lanzadora
  if (sistemaMagia === "puntos" && alGastarPuntos) {
    const coste = costePuntosPorNivel?.[nivelLanzamiento] ?? (costePuntosPorNivel?.[1] || 2);
    alGastarPuntos(coste);
    return { recursoGastado: "puntos", puntos: coste, nivel: nivelLanzamiento };
  } else if (alGastarEspacio) {
    alGastarEspacio(nivelLanzamiento);
    return { recursoGastado: "espacio", nivel: nivelLanzamiento };
  }

  return { recursoGastado: "ninguno" };
}

/**
 * Normaliza una cadena para comparaciones insensibles a acentos y mayúsculas.
 */
function normalizarTexto(texto: string): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Obtiene la lista de conjuros y trucos siempre preparados otorgados por una subclase
 * hasta el nivel de clase especificado en D&D 5.5e (2024).
 */
export function obtenerConjurosSiemprePreparadosSubclase(
  clase: string,
  subclase: string,
  nivelClase: number,
  variante?: string
): { conjuros: string[]; trucos: string[] } {
  if (!clase || !subclase || nivelClase <= 0) {
    return { conjuros: [], trucos: [] };
  }

  const claseNorm = normalizarTexto(clase);
  const subclaseNorm = normalizarTexto(subclase);
  const varianteNorm = variante ? normalizarTexto(variante) : "";

  // Buscar coincidencia en el catálogo
  const definicion = CATALOGO_CONJUROS_SUBCLASES.find((item) => {
    const itemClaseNorm = normalizarTexto(item.clase);
    const itemSubclaseNorm = normalizarTexto(item.subclase);
    return (
      (claseNorm.includes(itemClaseNorm) || itemClaseNorm.includes(claseNorm)) &&
      (subclaseNorm.includes(itemSubclaseNorm) || itemSubclaseNorm.includes(subclaseNorm))
    );
  });

  if (!definicion) {
    return { conjuros: [], trucos: [] };
  }

  const conjurosSet = new Set<string>();
  const trucosSet = new Set<string>();

  // Si tiene variantes y coincide alguna (ej. "polar", "árida", "templada", "tropical" en Círculo de la Tierra)
  let progresionAUsar = definicion.progresion;
  if (definicion.variantes) {
    for (const [nombreVar, progVar] of Object.entries(definicion.variantes)) {
      const varNorm = normalizarTexto(nombreVar);
      if (
        varianteNorm.includes(varNorm) ||
        subclaseNorm.includes(varNorm) ||
        varNorm.includes(varianteNorm)
      ) {
        progresionAUsar = progVar;
        break;
      }
    }
  }

  for (const entrada of progresionAUsar) {
    if (nivelClase >= entrada.nivelClase) {
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
 * Obtiene todos los conjuros y trucos siempre preparados de un personaje,
 * considerando todas sus clases y subclases en multiclase.
 */
export function obtenerConjurosSubclasePersonaje(
  clases?: Array<{ nombre: string; subclase?: string; nivel: number }>,
  clasePrincipal?: string,
  subclasePrincipal?: string,
  nivelPrincipal?: number
): { conjuros: string[]; trucos: string[] } {
  const conjurosTotales = new Set<string>();
  const trucosTotales = new Set<string>();

  const listaClases =
    clases && clases.length > 0
      ? clases
      : [
          {
            nombre: clasePrincipal || "",
            subclase: subclasePrincipal || "",
            nivel: nivelPrincipal || 1
          }
        ];

  for (const item of listaClases) {
    const nombreClase = item.nombre || (item as { clase?: string }).clase || "";
    const subclase = item.subclase || "";
    const nivel = item.nivel || 1;
    if (nombreClase && subclase && nivel > 0) {
      const res = obtenerConjurosSiemprePreparadosSubclase(
        nombreClase,
        subclase,
        nivel
      );
      res.conjuros.forEach((c) => conjurosTotales.add(c));
      res.trucos.forEach((t) => trucosTotales.add(t));
    }
  }

  return {
    conjuros: Array.from(conjurosTotales),
    trucos: Array.from(trucosTotales)
  };
}

/**
 * Obtiene los niveles de Arcano Místico disponibles para un Brujo según su nivel de clase.
 * - Nivel 11+: Nivel 6
 * - Nivel 13+: Nivel 7
 * - Nivel 15+: Nivel 8
 * - Nivel 17+: Nivel 9
 */
export function obtenerNivelesArcanoMisticoDisponibles(nivelBrujo: number): number[] {
  const niveles: number[] = [];
  if (nivelBrujo >= 11) niveles.push(6);
  if (nivelBrujo >= 13) niveles.push(7);
  if (nivelBrujo >= 15) niveles.push(8);
  if (nivelBrujo >= 17) niveles.push(9);
  return niveles;
}

/**
 * Calcula el desglose de conjuros preparados efectivos separando los preparados libres
 * de los otorgados automáticamente por la subclase (los cuales no consumen límite diario).
 */
export function calcularConteoPreparadosEfectivos(
  preparadosIds: string[],
  siemprePreparadosIds: string[]
): { libres: number; subclase: number; total: number } {
  const siempreSet = new Set(siemprePreparadosIds.map((s) => s.toLowerCase().trim()));
  let libres = 0;
  let subclase = 0;

  for (const id of preparadosIds) {
    const idNorm = id.toLowerCase().trim();
    if (siempreSet.has(idNorm)) {
      subclase++;
    } else {
      libres++;
    }
  }

  return {
    libres,
    subclase,
    total: preparadosIds.length
  };
}

/**
 * Obtiene la característica de lanzamiento principal del personaje conforme a sus clases lanzadoras o clase principal.
 */
export function obtenerHabilidadConjuroPersonaje(pj: PersonajeJugador | null | undefined): Caracteristica {
  if (pj?.clasesLanzadoras && pj.clasesLanzadoras.length > 0 && pj.clasesLanzadoras[0].habilidadConjuro) {
    return pj.clasesLanzadoras[0].habilidadConjuro as Caracteristica;
  }
  const clase = pj?.clase || "";
  const atributoResuelto = resolverAtributoConjuroClase(clase);
  return atributoResuelto || "inteligencia";
}

/**
 * Obtiene el modificador numérico de aptitud mágica del personaje (ej. +3, +4).
 * Utiliza las estadísticas calculadas en caché o deriva directamente de la puntuación de característica.
 */
export function obtenerModificadorAptitudMagica(pj: PersonajeJugador | null | undefined): number {
  if (!pj) return 0;
  const habilidad = obtenerHabilidadConjuroPersonaje(pj);
  try {
    const stats = calcularEstadisticasPersonaje(pj);
    if (stats?.modificadores && typeof stats.modificadores[habilidad] === "number") {
      return stats.modificadores[habilidad];
    }
  } catch (error) {
    logger.warn("[calculadorMagia] Fallo al calcular estadísticas completas para aptitud mágica, aplicando fallback:", error);
  }
  const valorCarac = pj.caracteristicas ? (pj.caracteristicas[habilidad] ?? 10) : 10;
  return Math.floor((valorCarac - 10) / 2);
}

/**
 * Determina de forma pura si un personaje tiene conjuros o trucos de subclase pendientes de sincronizar.
 * Evita llamadas espurias a sincronización si todos los conjuros/trucos ya están presentes.
 */
export function requiereSincronizacionSubclase(
  pj: PersonajeJugador,
  resSubclase: { conjuros: string[]; trucos: string[] }
): boolean {
  const siemprePrep = pj.conjurosSiemprePreparadosIds || [];
  const trucos = pj.trucosConocidosIds || [];

  const faltaConjuro = resSubclase.conjuros.some(
    (c) => !siemprePrep.some((id) => coincideHechizoId(id, c))
  );
  if (faltaConjuro) return true;

  const faltaTruco = resSubclase.trucos.some(
    (t) => !trucos.some((id) => coincideHechizoId(id, t))
  );
  return faltaTruco;
}

function resolverListaMagicaPorSubclase(subclaseNombre: string, conjunto: Set<string>): void {
  const subNorm = normalizarTexto(subclaseNombre);
  if (!subNorm) return;

  const subDef = TODAS_SUBCLASES_DND55.find((s) => {
    const sNorm = normalizarTexto(s.nombre);
    const sId = normalizarTexto(s.id);
    return sNorm === subNorm || sId === subNorm || sNorm.includes(subNorm) || subNorm.includes(sNorm);
  });

  if (subDef?.configuracionMagica?.listaConjuros) {
    conjunto.add(subDef.configuracionMagica.listaConjuros.toLowerCase().trim());
  }
}

/**
 * Obtiene todas las clases cuyas listas de conjuros están disponibles para el personaje,
 * considerando clases base, multiclases, clases lanzadoras y asociaciones declarativas de subclase
 * (ej. Embaucador Arcano y Caballero Arcano utilizando la lista de Mago).
 */
export function obtenerClasesListaMagicaPersonaje(
  personaje: PersonajeJugador | null | undefined
): string[] {
  if (!personaje) return [];
  const clasesSet = new Set<string>();

  // 1. Clase principal
  if (personaje.clase) {
    clasesSet.add(personaje.clase.toLowerCase().trim());
  }

  // 2. Multiclases
  if (Array.isArray(personaje.clases)) {
    for (const c of personaje.clases) {
      const nom = c.nombre || (c as { clase?: string }).clase;
      if (nom) clasesSet.add(nom.toLowerCase().trim());
      if (c.subclase) {
        resolverListaMagicaPorSubclase(c.subclase, clasesSet);
      }
    }
  }

  // 3. Subclase principal directa
  if (personaje.subclase) {
    resolverListaMagicaPorSubclase(personaje.subclase, clasesSet);
  }

  // 4. Clases lanzadoras explícitas y detección de configuración de lanzador
  if (Array.isArray(personaje.clasesLanzadoras)) {
    for (const cl of personaje.clasesLanzadoras) {
      if (cl.clase) clasesSet.add(cl.clase.toLowerCase().trim());
      if (cl.listaConjuros) clasesSet.add(cl.listaConjuros.toLowerCase().trim());
      const info = detectarTipoLanzador(cl.clase, personaje.subclase);
      if (info?.listaConjuros) {
        clasesSet.add(info.listaConjuros.toLowerCase().trim());
      }
    }
  }

  return Array.from(clasesSet);
}

/**
 * Determina el nivel máximo de conjuro que una clase puede lanzar según su tipo y nivel,
 * respetando las reglas oficiales de D&D 5.5e (2024).
 */
export function obtenerNivelMaximoConjuroPorTipoClase(
  tipo: TipoLanzador,
  nivelClase: number
): number {
  const niv = Math.min(20, Math.max(1, Math.floor(nivelClase) || 1));
  switch (tipo) {
    case "completo":
      return Math.min(9, Math.ceil(niv / 2));
    case "medio":
      // En D&D 5.5e (2024), los medio-lanzadores obtienen magia desde nivel 1
      return Math.min(5, Math.ceil(niv / 4));
    case "tercio":
      if (niv < 3) return 0;
      if (niv <= 6) return 1;
      if (niv <= 12) return 2;
      if (niv <= 18) return 3;
      return 4;
    case "pacto":
      return TABLA_PACTO_BRUJO[niv]?.nivel ?? 1;
    case "ninguno":
    default:
      return 0;
  }
}

/**
 * Obtiene el conjunto de niveles de conjuro lanzables para una clase específica según su tipo y nivel.
 * Incluye nivel 0 (trucos) si la clase otorga trucos o si se indica explícitamente vía opciones.
 */
export function obtenerNivelesLanzablesPorClase(
  tipo: TipoLanzador,
  nivelClase: number,
  opciones?: { tieneTrucos?: boolean }
): Set<number> {
  const niveles = new Set<number>();
  const niv = Math.min(20, Math.max(1, Math.floor(nivelClase) || 1));

  // 1. Trucos (Nivel 0)
  if (tipo === "completo" || tipo === "pacto") {
    niveles.add(0);
  } else if (tipo === "tercio" && niv >= 3) {
    niveles.add(0);
  } else if (opciones?.tieneTrucos) {
    niveles.add(0);
  }

  // 2. Niveles de ranura estándar / pacto
  const maxNv = obtenerNivelMaximoConjuroPorTipoClase(tipo, niv);
  for (let i = 1; i <= maxNv; i++) {
    niveles.add(i);
  }

  // 3. Arcanos Místicos para Brujo (niveles 6, 7, 8, 9)
  if (tipo === "pacto") {
    const arcanos = obtenerNivelesArcanoMisticoDisponibles(niv);
    for (const a of arcanos) {
      niveles.add(a);
    }
  }

  return niveles;
}

/**
 * Obtiene el conjunto de todos los niveles de conjuro (0 a 9) que un personaje
 * tiene capacidad de lanzar o aprender en su estado actual.
 */
export function obtenerNivelesConjuroDisponiblesPersonaje(
  personaje: PersonajeJugador | null | undefined
): Set<number> {
  const niveles = new Set<number>();
  if (!personaje) return niveles;

  const tieneTrucosConocidos = (personaje.trucosConocidosIds?.length ?? 0) > 0;
  if (tieneTrucosConocidos) {
    niveles.add(0);
  }

  // Clases lanzadoras explícitas
  if (Array.isArray(personaje.clasesLanzadoras) && personaje.clasesLanzadoras.length > 0) {
    for (const cl of personaje.clasesLanzadoras) {
      const nivelesClase = obtenerNivelesLanzablesPorClase(cl.tipoLanzador, cl.nivel, {
        tieneTrucos: tieneTrucosConocidos
      });
      nivelesClase.forEach((n) => niveles.add(n));
    }
  } else if (personaje.clase) {
    // Fallback: detectar si la clase base o subclase es lanzadora
    const info = detectarTipoLanzador(personaje.clase, personaje.subclase);
    if (info) {
      const nivelesClase = obtenerNivelesLanzablesPorClase(info.tipo, personaje.nivel || 1, {
        tieneTrucos: tieneTrucosConocidos
      });
      nivelesClase.forEach((n) => niveles.add(n));
    }
  }

  // Ranuras asignadas en espaciosConjuroMaximos (overrides o combinadas)
  if (personaje.espaciosConjuroMaximos) {
    for (const [lvlStr, cant] of Object.entries(personaje.espaciosConjuroMaximos)) {
      if (typeof cant === "number" && cant > 0) {
        niveles.add(Number(lvlStr));
      }
    }
  }

  // Puntos de conjuro (DMG)
  if (personaje.puntosConjuroMaximos > 0 && (personaje.nivelConjuroMaximo || 0) > 0) {
    for (let lvl = 1; lvl <= (personaje.nivelConjuroMaximo || 0); lvl++) {
      niveles.add(lvl);
    }
  }

  // Magia de Pacto y Arcanos
  if ((personaje.espaciosPactoMaximos || 0) > 0 && (personaje.nivelEspacioPacto || 0) > 0) {
    for (let lvl = 1; lvl <= (personaje.nivelEspacioPacto || 0); lvl++) {
      niveles.add(lvl);
    }
  }

  if (Array.isArray(personaje.arcanoMisticoIds)) {
    for (const item of personaje.arcanoMisticoIds) {
      const lvl = Number(item.split(":")[0]);
      if (!isNaN(lvl) && lvl >= 6) {
        niveles.add(lvl);
      }
    }
  }

  return niveles;
}

/**
 * Evalúa si un conjuro específico está disponible para ser lanzado o aprendido por el personaje,
 * verificando tanto la pertenencia de clase como la capacidad del personaje de lanzar conjuros de ese nivel.
 */
export function puedePersonajeLanzarHechizo(
  personaje: PersonajeJugador | null | undefined,
  hechizo: HechizoBase
): boolean {
  if (!personaje) return true;

  // Si el personaje no es lanzador y no tiene clases lanzadoras registradas
  const esLanzador =
    personaje.esLanzador ||
    (Array.isArray(personaje.clasesLanzadoras) && personaje.clasesLanzadoras.length > 0) ||
    Boolean(detectarTipoLanzador(personaje.clase || "", personaje.subclase));

  if (!esLanzador) {
    // Si tiene trucos raciales o de dote pero no es lanzador de clase, solo puede lanzar sus trucos
    if (hechizo.nivel === 0 && (personaje.trucosConocidosIds?.length ?? 0) > 0) {
      return personaje.trucosConocidosIds.some((id) => coincideHechizoId(id, hechizo.id));
    }
    return false;
  }

  const clasesPersonaje = obtenerClasesListaMagicaPersonaje(personaje);
  if (clasesPersonaje.length === 0) return false;

  const clasesHechizo = hechizo.clases || [];
  const esHechizoUniversal = clasesHechizo.length === 0;

  // 1. Si el hechizo no tiene clases declaradas, comprobar si el personaje puede lanzar su nivel de forma general
  if (esHechizoUniversal) {
    const nivelesGenerales = obtenerNivelesConjuroDisponiblesPersonaje(personaje);
    return nivelesGenerales.has(hechizo.nivel);
  }

  // 2. Comprobar si al menos una clase del conjuro coincide con alguna clase/lista mágica del personaje
  const clasesCoincidentes = clasesHechizo.filter((ch) =>
    clasesPersonaje.some((cp) => {
      const chNorm = normalizarTexto(ch);
      const cpNorm = normalizarTexto(cp);
      return chNorm.includes(cpNorm) || cpNorm.includes(chNorm);
    })
  );

  if (clasesCoincidentes.length === 0) {
    return false;
  }

  // 3. Para cada clase coincidente, comprobar si el personaje puede lanzar hechizos de ese nivel para esa clase
  for (const claseCoincidente of clasesCoincidentes) {
    const chNorm = normalizarTexto(claseCoincidente);

    // Buscar en clasesLanzadoras
    let claseLanzadoraEncontrada: ClaseLanzadora | undefined;
    if (Array.isArray(personaje.clasesLanzadoras)) {
      claseLanzadoraEncontrada = personaje.clasesLanzadoras.find((cl) => {
        const cNom = normalizarTexto(cl.clase);
        const lNom = cl.listaConjuros ? normalizarTexto(cl.listaConjuros) : "";
        return cNom.includes(chNorm) || chNorm.includes(cNom) || (lNom && (lNom.includes(chNorm) || chNorm.includes(lNom)));
      });
    }

    if (claseLanzadoraEncontrada) {
      const nivelesClase = obtenerNivelesLanzablesPorClase(
        claseLanzadoraEncontrada.tipoLanzador,
        claseLanzadoraEncontrada.nivel,
        { tieneTrucos: (personaje.trucosConocidosIds?.length ?? 0) > 0 }
      );
      if (nivelesClase.has(hechizo.nivel)) {
        return true;
      }
    }

    // Buscar en clases base y subclases si no se encontró en clasesLanzadoras
    if (Array.isArray(personaje.clases)) {
      for (const cItem of personaje.clases) {
        const cItemNom = normalizarTexto(cItem.nombre || (cItem as { clase?: string }).clase || "");
        const subNom = cItem.subclase ? normalizarTexto(cItem.subclase) : "";
        const info = detectarTipoLanzador(cItem.nombre, cItem.subclase);
        const listaSub = info?.listaConjuros ? normalizarTexto(info.listaConjuros) : "";

        if (
          cItemNom.includes(chNorm) ||
          chNorm.includes(cItemNom) ||
          (listaSub && (listaSub.includes(chNorm) || chNorm.includes(listaSub))) ||
          (subNom && (subNom.includes(chNorm) || chNorm.includes(subNom)))
        ) {
          if (info) {
            const nivelesClase = obtenerNivelesLanzablesPorClase(
              info.tipo,
              cItem.nivel || 1,
              { tieneTrucos: (personaje.trucosConocidosIds?.length ?? 0) > 0 }
            );
            if (nivelesClase.has(hechizo.nivel)) {
              return true;
            }
          }
        }
      }
    }

    // Fallback: clase principal directa
    const clasePrincNom = normalizarTexto(personaje.clase || "");
    const infoPrinc = detectarTipoLanzador(personaje.clase || "", personaje.subclase);
    const listaPrinc = infoPrinc?.listaConjuros ? normalizarTexto(infoPrinc.listaConjuros) : "";

    if (
      clasePrincNom.includes(chNorm) ||
      chNorm.includes(clasePrincNom) ||
      (listaPrinc && (listaPrinc.includes(chNorm) || chNorm.includes(listaPrinc)))
    ) {
      if (infoPrinc) {
        const nivelesClase = obtenerNivelesLanzablesPorClase(
          infoPrinc.tipo,
          personaje.nivel || 1,
          { tieneTrucos: (personaje.trucosConocidosIds?.length ?? 0) > 0 }
        );
        if (nivelesClase.has(hechizo.nivel)) {
          return true;
        }
      }
    }
  }

  // 4. Overrides manuales o ranuras en personajes mono-clase
  const esMonoClase = !personaje.clases || personaje.clases.length <= 1;
  if (
    personaje.overrideEspaciosConjuro &&
    typeof personaje.overrideEspaciosConjuro[String(hechizo.nivel)] === "number" &&
    personaje.overrideEspaciosConjuro[String(hechizo.nivel)] > 0
  ) {
    return true;
  }

  if (
    esMonoClase &&
    typeof personaje.espaciosConjuroMaximos?.[String(hechizo.nivel)] === "number" &&
    personaje.espaciosConjuroMaximos[String(hechizo.nivel)] > 0
  ) {
    return true;
  }

  if (
    personaje.puntosConjuroMaximos > 0 &&
    hechizo.nivel >= 1 &&
    hechizo.nivel <= (personaje.nivelConjuroMaximo || 0)
  ) {
    return true;
  }

  return false;
}
