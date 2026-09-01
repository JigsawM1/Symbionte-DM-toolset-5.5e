import type {
  ClaseLanzadora,
  Caracteristica,
  TipoLanzador,
  ModeloConjuros
} from "@/tipos";
import {
  TABLA_ESPACIOS_CONJURO,
  TABLA_PUNTOS_CONJURO,
  COSTE_PUNTOS_POR_NIVEL,
  TIPO_LANZADOR_POR_CLASE,
  TABLA_PACTO_BRUJO
} from "@/constantes";
import {
  CATALOGO_CONJUROS_SUBCLASES
} from "@/constantes/subclasesConjurosConstantes";

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
    (c) => c.tipoLanzador === "pacto" || c.clase.toLowerCase().includes("brujo") || c.clase.toLowerCase().includes("warlock")
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
    if (item.nombre && item.subclase && item.nivel > 0) {
      const res = obtenerConjurosSiemprePreparadosSubclase(
        item.nombre,
        item.subclase,
        item.nivel
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



