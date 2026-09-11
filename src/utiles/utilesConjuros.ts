/**
 * Utilidades para el manejo de fórmulas de dados y escalado de conjuros (D&D 5.5e).
 * 
 */

import type { ComponentesSeleccionados } from "@/tipos";

interface ResultadoEscalado {
  formula: string;
  adicionalText: string;
}

/**
 * Calcula dinámicamente la fórmula de dados para un conjuro lanzado a un nivel de ranura superior (Upcast).
 * 
 * @param formulaBase La fórmula de dados original (ej. "1d8", "3d6", "1d8+3").
 * @param formulaAdicional Los dados que se agregan por nivel superior (ej. "1d8", "1d6").
 * @param nivelBase El nivel original del hechizo (ej. 1, 3).
 * @param nivelLanzamiento El nivel de la ranura a la que se lanza (ej. 3, 5).
 * @returns Un objeto con la fórmula combinada final y una etiqueta descriptiva del daño adicional.
 */
export function calcularFormulaEscalada(
  formulaBase: string,
  formulaAdicional: string,
  nivelBase: number,
  nivelLanzamiento: number
): ResultadoEscalado {
  // Si no se está upcasteando, devolver la fórmula base directamente
  if (nivelLanzamiento <= nivelBase) {
    return { formula: formulaBase, adicionalText: "" };
  }

  const dif = nivelLanzamiento - nivelBase;

  // Si no hay fórmula adicional válida, devolver la base sin adicionales
  if (!formulaAdicional || formulaAdicional.trim() === "" || formulaAdicional === "N/A") {
    return { formula: formulaBase, adicionalText: "" };
  }

  // Regex flexible para parsear dados estándares: [cantidad]d[caras][modificadores_opcionales]
  // Permite 'd' o 'D' y captura cantidad, caras y cualquier residuo (+3, -1, etc.)
  const regexDados = /^(\d+)[dD](\d+)(.*)$/;
  const matchAdicional = formulaAdicional.trim().replace(/\s+/g, "").match(regexDados);

  if (matchAdicional) {
    const cantAdicionalBase = parseInt(matchAdicional[1], 10);
    const carasAdicional = matchAdicional[2];
    const restoAdicional = matchAdicional[3] || "";

    const cantTotalAdicional = cantAdicionalBase * dif;
    const formulaAdicionalCalculada = `${cantTotalAdicional}d${carasAdicional}${restoAdicional}`;

    // Intentamos ver si la fórmula base también es un dado simple compatible para combinar
    const matchBase = formulaBase.trim().replace(/\s+/g, "").match(regexDados);
    if (matchBase) {
      const cantBase = parseInt(matchBase[1], 10);
      const carasBase = matchBase[2];
      const restoBase = matchBase[3] || "";

      // Combinar solo si tienen las mismas caras y no tienen modificadores o residuos estáticos incompatibles
      if (carasBase === carasAdicional && restoBase === "" && restoAdicional === "") {
        const totalDados = cantBase + cantTotalAdicional;
        return {
          formula: `${totalDados}d${carasBase}`,
          adicionalText: `+${cantTotalAdicional}d${carasAdicional} (Combinado)`
        };
      }
    }

    // Si no son combinables directamente en un solo grupo de dados (ej. d10 + d6, o la base tiene un +3),
    // las concatenamos limpiamente usando el signo de adición '+' para que TaleSpire las tire en paralelo
    return {
      formula: `${formulaBase} + ${formulaAdicionalCalculada}`,
      adicionalText: `+${formulaAdicionalCalculada}`
    };
  }

  // Fallback de emergencia si la fórmula adicional no es un patrón estándar (ej. texto plano o mod estático)
  let formulaConcatenada = formulaBase;
  for (let i = 0; i < dif; i++) {
    formulaConcatenada += ` + ${formulaAdicional}`;
  }
  return {
    formula: formulaConcatenada,
    adicionalText: `+(${dif}x ${formulaAdicional})`
  };
}

/**
 * Extrae los dados de daño base de un truco (nivel 0) si no están explícitos en dadosDaño.
 * Valida que el truco sea realmente ofensivo o de daño (evitando extraer dados de utilidad como el 1d4 de Guía).
 */
export function extraerDadosBaseTruco(hechizo: {
  dadosDaño?: string;
  descripcion?: string;
  nombre?: string;
  ataqueCd?: string;
  tipoDaño?: string;
}): string {
  if (hechizo.dadosDaño && hechizo.dadosDaño.trim() !== "" && hechizo.dadosDaño !== "N/A") {
    return hechizo.dadosDaño.trim();
  }
  if (!hechizo.descripcion) return "";

  const desc = hechizo.descripcion;
  const descLower = desc.toLowerCase();

  // Comprobar si el truco realmente inflige daño u ofensiva antes de extraer dados
  const tienePalabraDano =
    descLower.includes("daño") ||
    descLower.includes("dano") ||
    descLower.includes("damage") ||
    descLower.includes("mejora de truco") ||
    descLower.includes("cantrip upgrade") ||
    descLower.includes("rayos a nivel") ||
    descLower.includes("dos rayos");

  const tieneTipoDano = !!hechizo.tipoDaño && hechizo.tipoDaño.trim() !== "" && hechizo.tipoDaño !== "N/A";
  const tieneAtaque = hechizo.ataqueCd === "ATAQUE";

  // Si no menciona daño ni tiene tipo de daño ni tirada de ataque, NO es un truco de daño
  if (!tienePalabraDano && !tieneTipoDano && !tieneAtaque) {
    return "";
  }

  // Buscar primer patrón de dados estándar (\d+d\d+) en la descripción
  const match = desc.match(/(\d+)[dD](\d+)/);
  if (match) {
    return `${match[1]}d${match[2]}`;
  }
  return "";
}

/**
 * Calcula el multiplicador de dados para un truco según el nivel total del personaje (D&D 5.5e / 5e).
 * - Niveles 1-4: 1x
 * - Niveles 5-10: 2x
 * - Niveles 11-16: 3x
 * - Niveles 17-20: 4x
 */
export function calcularMultiplicadorTruco(nivelPersonaje: number): number {
  const niv = Math.max(1, nivelPersonaje || 1);
  if (niv >= 17) return 4;
  if (niv >= 11) return 3;
  if (niv >= 5) return 2;
  return 1;
}

/**
 * Calcula la fórmula de dados escalada automáticamente para un truco según el nivel del personaje.
 * Ejemplo: Toque helado ("1d10") a nivel 5 devuelve "2d10" con multiplicador 2.
 */
export function calcularFormulaTruco(
  formulaBase: string,
  nivelPersonaje: number
): { formula: string; multiplicador: number; cantDados: number; caras: string; base: string } {
  const baseLimpia = formulaBase ? formulaBase.trim() : "";
  const mult = calcularMultiplicadorTruco(nivelPersonaje);

  if (!baseLimpia || baseLimpia === "N/A") {
    return { formula: "", multiplicador: mult, cantDados: 0, caras: "", base: "" };
  }

  const regexDados = /^(\d+)[dD](\d+)(.*)$/;
  const match = baseLimpia.replace(/\s+/g, "").match(regexDados);

  if (match) {
    const cantBase = parseInt(match[1], 10);
    const caras = match[2];
    const resto = match[3] || "";
    const cantTotal = cantBase * mult;
    return {
      formula: `${cantTotal}d${caras}${resto}`,
      multiplicador: mult,
      cantDados: cantTotal,
      caras,
      base: baseLimpia
    };
  }

  return { formula: baseLimpia, multiplicador: mult, cantDados: 1, caras: "", base: baseLimpia };
}

/**
 * Determina si un truco tiene mejora/upcasting automático por nivel de personaje (D&D 5.5e / 5e).
 * Comprueba si la descripción contiene explícitamente "Mejora de truco", "El daño aumenta",
 * "Cantrip Upgrade" o mecánicas de rayos/ataques adicionales a niveles 5, 11, 17.
 */
export function trucoTieneMejora(hechizo: {
  nombre?: string;
  descripcion?: string;
  descNivelSuperior?: string;
}): boolean {
  if (esTrucoDeAtaquesMultiples(hechizo)) {
    return true;
  }
  const desc = ((hechizo.descripcion || "") + " " + (hechizo.descNivelSuperior || "")).toLowerCase();
  return (
    desc.includes("mejora de truco") ||
    desc.includes("mejora del truco") ||
    desc.includes("cantrip upgrade") ||
    desc.includes("el daño aumenta") ||
    desc.includes("el dano aumenta") ||
    desc.includes("daño aumenta en") ||
    desc.includes("dano aumenta en") ||
    desc.includes("crea dos rayos") ||
    desc.includes("rayos cuando alcanzas") ||
    desc.includes("rayos a nivel") ||
    desc.includes("un rayo adicional") ||
    desc.includes("dos rayos a nivel")
  );
}

/**
 * Detecta si un truco escala añadiendo ataques/rayos separados en lugar de aumentar los dados de un solo ataque.
 * Ejemplo canónico: Descarga sobrenatural (Eldritch Blast).
 */
export function esTrucoDeAtaquesMultiples(hechizo: { nombre?: string; descripcion?: string }): boolean {
  const normNombre = (hechizo.nombre || "").toLowerCase().trim();
  const desc = (hechizo.descripcion || "").toLowerCase();

  if (
    normNombre.includes("descarga sobrenatural") ||
    normNombre.includes("eldritch blast")
  ) {
    return true;
  }

  if (
    desc.includes("crea dos rayos") ||
    desc.includes("rayos a nivel") ||
    desc.includes("tirada de ataque por separado para cada rayo")
  ) {
    return true;
  }

  return false;
}

export interface InfoTrucoEscalado {
  formula: string;
  multiplicador: number;
  cantDados: number;
  caras: string;
  base: string;
  esAtaqueMultiple: boolean;
  cantidadAtaques: number;
  etiquetaVisual: string;
}

/**
 * Calcula la información completa de escalado para cualquier truco según el nivel del personaje.
 * - Trucos con mejora (ej. Toque helado 1d10 -> 2d10 a nv 5, con cláusula "Mejora de truco").
 * - Trucos de ataques múltiples (ej. Descarga sobrenatural 1 rayo 1d10 -> 2 rayos de 1d10 a nv 5).
 * - Trucos sin mejora de daño (ej. Garrote / Shillelagh -> mantiene daño base 1d8).
 * - Trucos utilitarios sin daño (ej. Guía, Luz, Mano de mago -> devuelve formula vacía y 0 dados).
 */
export function calcularInfoTruco(
  hechizo: {
    nombre?: string;
    dadosDaño?: string;
    descripcion?: string;
    descNivelSuperior?: string;
    tipoDaño?: string;
    ataqueCd?: string;
  },
  nivelPersonaje: number
): InfoTrucoEscalado {
  const dadosBase = extraerDadosBaseTruco(hechizo);
  const tieneMejora = trucoTieneMejora(hechizo);
  const mult = tieneMejora ? calcularMultiplicadorTruco(nivelPersonaje) : 1;
  const esMultiple = esTrucoDeAtaquesMultiples(hechizo);

  // Si el truco no inflige daño (ej. Guía, Luz, Mano de mago, Prestidigitación)
  if (!dadosBase) {
    return {
      formula: "",
      multiplicador: 1,
      cantDados: 0,
      caras: "",
      base: "",
      esAtaqueMultiple: false,
      cantidadAtaques: 0,
      etiquetaVisual: ""
    };
  }

  const regexDados = /^(\d+)[dD](\d+)(.*)$/;
  const match = dadosBase.replace(/\s+/g, "").match(regexDados);
  const caras = match ? match[2] : "10";

  if (esMultiple) {
    return {
      formula: dadosBase, // Cada rayo hace el daño base (ej. 1d10)
      multiplicador: mult,
      cantDados: 1,
      caras,
      base: dadosBase,
      esAtaqueMultiple: true,
      cantidadAtaques: mult,
      etiquetaVisual: mult > 1 ? `${mult} rayos (${dadosBase} c/u)` : dadosBase
    };
  }

  // Truco estándar de daño concentrado
  const cantBase = match ? parseInt(match[1], 10) : 1;
  const resto = match ? match[3] || "" : "";
  const cantTotal = cantBase * mult;
  const formulaEscalada = `${cantTotal}d${caras}${resto}`;

  return {
    formula: formulaEscalada,
    multiplicador: mult,
    cantDados: cantTotal,
    caras,
    base: dadosBase,
    esAtaqueMultiple: false,
    cantidadAtaques: 1,
    etiquetaVisual: formulaEscalada
  };
}

/**
 * Construye la fórmula de dados para TaleSpire, soportando múltiples grupos de ataque/daño si el truco tiene varios rayos,
 * o lanzamiento utilitario limpio si el truco no realiza ataques ni daño.
 */
export function construirFormulaTaleSpireTruco(
  hechizo: {
    nombre?: string;
    tipoDaño?: string;
    dadosDaño?: string;
    descripcion?: string;
    requiereAtaque?: boolean;
    ataqueCd?: string;
  },
  nivelPersonaje: number,
  bonoAtaqueMagico?: number,
  nombrePersonaje: string = "Personaje"
): { formulaTaleSpire: string; etiquetaLog: string } {
  const info = calcularInfoTruco(hechizo, nivelPersonaje);
  const nombreLimpio = hechizo.nombre || "Truco";
  const tipoDaño = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : "";
  
  const tieneAtaque =
    (hechizo.requiereAtaque === true || hechizo.ataqueCd === "ATAQUE") &&
    bonoAtaqueMagico !== undefined;

  const modTexto = (bonoAtaqueMagico ?? 0) >= 0 ? `+${bonoAtaqueMagico ?? 0}` : `${bonoAtaqueMagico ?? 0}`;

  if (info.esAtaqueMultiple && info.cantidadAtaques > 1 && info.formula) {
    const grupos: string[] = [];
    for (let i = 1; i <= info.cantidadAtaques; i++) {
      if (tieneAtaque) {
        grupos.push(`Ataque Rayo ${i}:1d20${modTexto}`);
        grupos.push(`Daño Rayo ${i}${tipoDaño}:${info.formula}`);
      } else {
        grupos.push(`Daño Rayo ${i}${tipoDaño}:${info.formula}`);
      }
    }
    return {
      formulaTaleSpire: `!${grupos.join("/")}`,
      etiquetaLog: `${nombrePersonaje} - ${nombreLimpio} (Truco Nv.${nivelPersonaje} -> ${info.cantidadAtaques} rayos)`
    };
  }

  if (tieneAtaque) {
    if (info.formula) {
      return {
        formulaTaleSpire: `!Ataque ${nombreLimpio}:1d20${modTexto}/Daño${tipoDaño}:${info.formula}`,
        etiquetaLog: `${nombrePersonaje} - ${nombreLimpio} (Truco Nv.${nivelPersonaje}${
          info.multiplicador > 1 ? ` -> ${info.formula}` : ""
        })`
      };
    } else {
      return {
        formulaTaleSpire: `!Ataque ${nombreLimpio}:1d20${modTexto}`,
        etiquetaLog: `${nombrePersonaje} - ${nombreLimpio} (Truco)`
      };
    }
  }

  if (info.formula) {
    return {
      formulaTaleSpire: `!Daño ${nombreLimpio}${tipoDaño}:${info.formula}`,
      etiquetaLog: `${nombrePersonaje} - ${nombreLimpio} (Truco Nv.${nivelPersonaje}${
        info.multiplicador > 1 ? ` -> ${info.formula}` : ""
      })`
    };
  }

  // Truco puramente utilitario sin dados de daño ni ataque (ej. Guía, Luz, Mano de mago, Prestidigitación)
  return {
    formulaTaleSpire: `!Lanzar Truco:${nombreLimpio}`,
    etiquetaLog: `${nombrePersonaje} - ${nombreLimpio} (Truco)`
  };
}

/**
 * Formatea los componentes mágicos estructurados en su representación en texto para la interfaz.
 * Formato canónico: "V", "S", "M" combinados por comas (ej. "V, S, M").
 */
export function formatearComponentes(componentes?: ComponentesSeleccionados | null): string {
  if (!componentes) return "Ninguno";
  const partes: string[] = [];
  if (componentes.verbal) partes.push("V");
  if (componentes.somatico) partes.push("S");
  if (componentes.material) partes.push("M");
  return partes.join(", ") || "Ninguno";
}



