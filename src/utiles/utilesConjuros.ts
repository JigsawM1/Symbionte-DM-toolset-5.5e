/**
 * Utilidades para el manejo de fórmulas de dados y escalado de conjuros (D&D 5.5e).
 * 
 */

import type { ComponentesSeleccionados } from "@/tipos";
import { sanitizarEtiqueta } from "./lanzadorDados";

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
 * Obtiene los dados de daño base de un truco (nivel 0) directamente de la base de datos.
 * Si el truco no posee dados de daño estructurados o es utilitario, devuelve una cadena vacía.
 */
export function extraerDadosBaseTruco(hechizo: {
  dadosDaño?: string;
  nombre?: string;
  descripcion?: string;
  [key: string]: unknown;
}): string {
  if (hechizo.dadosDaño && hechizo.dadosDaño.trim() !== "" && hechizo.dadosDaño !== "N/A") {
    return hechizo.dadosDaño.trim();
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
 * Determina si un truco escala por nivel de personaje (D&D 5.5e / 5e).
 * En las reglas oficiales, todo truco con dados de daño estructurados en la base de datos
 * escala automáticamente a los niveles 5, 11 y 17 (salvo excepciones de arma como Garrote/Shillelagh).
 */
export function trucoTieneMejora(hechizo: {
  id?: string;
  nombre?: string;
  dadosDaño?: string;
  [key: string]: unknown;
}): boolean {
  const normNombre = (hechizo.nombre || "").toLowerCase().trim();
  if (normNombre === "garrote" || normNombre === "shillelagh") {
    return false;
  }
  return Boolean(hechizo.dadosDaño && hechizo.dadosDaño.trim() !== "" && hechizo.dadosDaño !== "N/A");
}

/**
 * Detecta si un truco escala añadiendo ataques/rayos separados en lugar de aumentar los dados de un solo ataque.
 * Identificado directamente por su clave canónica (Descarga sobrenatural / Eldritch Blast).
 */
export function esTrucoDeAtaquesMultiples(hechizo: {
  id?: string;
  nombre?: string;
  [key: string]: unknown;
}): boolean {
  const normId = (hechizo.id || "").toLowerCase().trim();
  const normNombre = (hechizo.nombre || "").toLowerCase().trim();

  return (
    normId.includes("descarga-sobrenatural") ||
    normId.includes("eldritch-blast") ||
    normNombre.includes("descarga sobrenatural") ||
    normNombre.includes("eldritch blast")
  );
}

export interface InfoProyectilesMultiples {
  esMultiple: boolean;
  etiquetaSingular: string;
  etiquetaPlural: string;
  cantidadProyectiles: number;
  formulaPorProyectil: string;
  requiereAtaque: boolean;
  tipoDaño: string;
  etiquetaVisual: string;
}

/**
 * Obtiene la configuración canónica de proyectiles múltiples para cualquier conjuro (truco o de ranura).
 * Soporta de manera oficial D&D 5.5e / 5e:
 * - Descarga sobrenatural (Truco): 1 rayo (nv 1-4), 2 rayos (nv 5-10), 3 rayos (nv 11-16), 4 rayos (nv 17-20). Ataque individual.
 * - Proyectil mágico (Nivel 1): 3 dardos base, +1 dardo por nivel superior a 1. Impacto automático (sin ataque).
 * - Rayo abrasador (Nivel 2): 3 rayos base, +1 rayo por nivel superior a 2. Ataque individual por cada rayo.
 */
export function obtenerInfoProyectilesMultiples(
  hechizo: {
    id?: string;
    nombre?: string;
    nivel?: number;
    dadosDaño?: string;
    tipoDaño?: string;
    requiereAtaque?: boolean;
    ataqueCd?: string;
    [key: string]: unknown;
  },
  opciones: {
    nivelLanzamiento?: number;
    nivelPersonaje?: number;
  } = {}
): InfoProyectilesMultiples | null {
  const normId = (hechizo.id || "").toLowerCase().trim();
  const normNombre = (hechizo.nombre || "").toLowerCase().trim();
  const nivel = typeof hechizo.nivel === "number" ? hechizo.nivel : 0;

  // 1. Descarga sobrenatural (Truco nv 0)
  if (
    normId.includes("descarga-sobrenatural") ||
    normId.includes("eldritch-blast") ||
    normNombre.includes("descarga sobrenatural") ||
    normNombre.includes("eldritch blast")
  ) {
    const mult = calcularMultiplicadorTruco(opciones.nivelPersonaje ?? 1);
    const dados = hechizo.dadosDaño?.trim() || "1d10";
    return {
      esMultiple: true,
      etiquetaSingular: "Rayo",
      etiquetaPlural: "rayos",
      cantidadProyectiles: mult,
      formulaPorProyectil: dados,
      requiereAtaque: true,
      tipoDaño: hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? hechizo.tipoDaño : "fuerza",
      etiquetaVisual: mult > 1 ? `${mult} rayos (${dados} c/u)` : dados
    };
  }

  // 2. Proyectil mágico (Nivel 1)
  if (
    normId.includes("proyectil-magico") ||
    normId.includes("magic-missile") ||
    normNombre.includes("proyectil magico") ||
    normNombre.includes("proyectil mágico") ||
    normNombre.includes("magic missile")
  ) {
    const nivelLanzamiento = Math.max(1, opciones.nivelLanzamiento ?? nivel ?? 1);
    const dardosExtra = Math.max(0, nivelLanzamiento - 1);
    const cantidad = 3 + dardosExtra;
    const dados = hechizo.dadosDaño?.trim() || "1d4+1";
    return {
      esMultiple: true,
      etiquetaSingular: "Dardo",
      etiquetaPlural: "dardos",
      cantidadProyectiles: cantidad,
      formulaPorProyectil: dados,
      requiereAtaque: false,
      tipoDaño: hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? hechizo.tipoDaño : "fuerza",
      etiquetaVisual: `${cantidad} dardos (${dados} c/u)`
    };
  }

  // 3. Rayo abrasador (Nivel 2)
  if (
    normId.includes("rayo-abrasador") ||
    normId.includes("scorching-ray") ||
    normNombre.includes("rayo abrasador") ||
    normNombre.includes("scorching ray")
  ) {
    const nivelLanzamiento = Math.max(2, opciones.nivelLanzamiento ?? nivel ?? 2);
    const rayosExtra = Math.max(0, nivelLanzamiento - 2);
    const cantidad = 3 + rayosExtra;
    const dados = hechizo.dadosDaño?.trim() || "2d6";
    return {
      esMultiple: true,
      etiquetaSingular: "Rayo",
      etiquetaPlural: "rayos",
      cantidadProyectiles: cantidad,
      formulaPorProyectil: dados,
      requiereAtaque: true,
      tipoDaño: hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? hechizo.tipoDaño : "fuego",
      etiquetaVisual: `${cantidad} rayos (${dados} c/u)`
    };
  }

  return null;
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
 * Aplica un bonificador numérico directo a una fórmula de dados de daño
 * (ej. "1d10" + 2 -> "1d10+2", "8d6" + 3 -> "8d6+3", "1d4+1" + 2 -> "1d4+3").
 * Compatible al 100% con los requisitos de TaleSpire.
 */
export function aplicarBonoNumericoAFormulaDados(formula: string, bono: number): string {
  if (!formula || typeof formula !== "string") return formula || "";
  const fLimpia = formula.trim();
  if (bono === 0 || fLimpia === "" || fLimpia === "N/A") return fLimpia;

  // Si termina con un modificador numérico con signo: ej. "1d4+1", "2d6-2", "2d6+1d4+3"
  const matchModFinal = fLimpia.match(/^(.+?)([+-]\d+)$/);
  if (matchModFinal) {
    const base = matchModFinal[1];
    const modActual = parseInt(matchModFinal[2], 10);
    const modTotal = modActual + bono;
    if (modTotal === 0) return base;
    const signo = modTotal > 0 ? `+${modTotal}` : `${modTotal}`;
    return `${base}${signo}`;
  }

  // Si no tiene modificador numérico previo (ej. "1d10", "8d6", "2d6+1d4")
  const signo = bono > 0 ? `+${bono}` : `${bono}`;
  return `${fLimpia}${signo}`;
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
  nivelPersonaje: number,
  bonoDanoMagico: number = 0
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
    const formulaPotenciada = bonoDanoMagico > 0 ? aplicarBonoNumericoAFormulaDados(dadosBase, bonoDanoMagico) : dadosBase;
    return {
      formula: dadosBase, // Cada rayo hace el daño base (ej. 1d10)
      multiplicador: mult,
      cantDados: 1,
      caras,
      base: dadosBase,
      esAtaqueMultiple: true,
      cantidadAtaques: mult,
      etiquetaVisual: mult > 1 ? `${mult} rayos (${formulaPotenciada} c/u)` : formulaPotenciada
    };
  }

  // Truco estándar de daño concentrado
  const cantBase = match ? parseInt(match[1], 10) : 1;
  const resto = match ? match[3] || "" : "";
  const cantTotal = cantBase * mult;
  const formulaEscalada = `${cantTotal}d${caras}${resto}`;
  const formulaFinal = bonoDanoMagico > 0 ? aplicarBonoNumericoAFormulaDados(formulaEscalada, bonoDanoMagico) : formulaEscalada;

  return {
    formula: formulaFinal,
    multiplicador: mult,
    cantDados: cantTotal,
    caras,
    base: dadosBase,
    esAtaqueMultiple: false,
    cantidadAtaques: 1,
    etiquetaVisual: formulaFinal
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
  nombrePersonaje: string = "Personaje",
  bonoDanoMagico: number = 0
): { formulaTaleSpire: string; etiquetaLog: string } {
  const info = calcularInfoTruco(hechizo, nivelPersonaje, bonoDanoMagico);
  const nombreLimpio = hechizo.nombre || "Truco";
  const tipoDaño = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : "";
  
  const tieneAtaque =
    (hechizo.requiereAtaque === true || hechizo.ataqueCd === "ATAQUE") &&
    bonoAtaqueMagico !== undefined;

  const modTexto = (bonoAtaqueMagico ?? 0) >= 0 ? `+${bonoAtaqueMagico ?? 0}` : `${bonoAtaqueMagico ?? 0}`;

  if (info.esAtaqueMultiple && info.cantidadAtaques > 1 && info.formula) {
    const grupos: string[] = [];
    for (let i = 1; i <= info.cantidadAtaques; i++) {
      // Regla una vez por turno: el daño extra se suma al primer proyectil
      const formulaRayo = i === 1 && bonoDanoMagico > 0
        ? aplicarBonoNumericoAFormulaDados(info.formula, bonoDanoMagico)
        : info.formula;

      if (tieneAtaque) {
        grupos.push(`Ataque Rayo ${i}:1d20${modTexto}`);
        grupos.push(`Daño Rayo ${i}${tipoDaño}:${formulaRayo}`);
      } else {
        grupos.push(`Daño Rayo ${i}${tipoDaño}:${formulaRayo}`);
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
 * Construye la fórmula de dados para TaleSpire para conjuros de nivel 1+ (ranuras / upcast).
 * Soporta de forma nativa e integrada:
 * - Conjuros de proyectiles múltiples (ej. Proyectil mágico, Rayo abrasador) generando grupos individuales.
 * - Conjuros con tirada de ataque + daño (ej. Saeta de fuego, Flecha ácida).
 * - Conjuros con daño y salvación o área (ej. Bola de fuego, Manos ardientes).
 * - Conjuros puramente de control o utilidad (ej. Escudo, Armadura de mago).
 */
export function construirFormulaTaleSpireEspacio(
  hechizo: {
    id?: string;
    nombre?: string;
    nivel?: number;
    dadosDaño?: string;
    dadosDañoNivelSuperior?: string;
    tipoDaño?: string;
    requiereAtaque?: boolean;
    ataqueCd?: string;
    [key: string]: unknown;
  },
  nivelLanzamiento: number,
  bonoAtaqueMagico: number = 0,
  nombrePersonaje: string = "Personaje",
  bonoDanoMagico: number = 0
): { formulaTaleSpire: string; etiquetaLog: string } {
  const nombrePj = nombrePersonaje.trim() || "Personaje";
  const nombreLimpio = hechizo.nombre || "Conjuro";
  const nivelBase = typeof hechizo.nivel === "number" ? hechizo.nivel : 1;
  const tipoDanoText = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : "";
  const bonoSigno = bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : `${bonoAtaqueMagico}`;

  // 1. Detección canónica de proyectiles múltiples (Proyectil mágico, Rayo abrasador, etc.)
  const infoProyectiles = obtenerInfoProyectilesMultiples(hechizo, { nivelLanzamiento });
  if (infoProyectiles && infoProyectiles.cantidadProyectiles > 0) {
    const grupos: string[] = [];
    for (let i = 1; i <= infoProyectiles.cantidadProyectiles; i++) {
      // Regla una vez por turno: el daño extra se suma al primer proyectil
      const formulaProyectil = i === 1 && bonoDanoMagico > 0
        ? aplicarBonoNumericoAFormulaDados(infoProyectiles.formulaPorProyectil, bonoDanoMagico)
        : infoProyectiles.formulaPorProyectil;

      if (infoProyectiles.requiereAtaque) {
        grupos.push(`Ataque ${infoProyectiles.etiquetaSingular} ${i}:1d20${bonoSigno}`);
        grupos.push(`Daño ${infoProyectiles.etiquetaSingular} ${i}${tipoDanoText}:${formulaProyectil}`);
      } else {
        grupos.push(`Daño ${infoProyectiles.etiquetaSingular} ${i}${tipoDanoText}:${formulaProyectil}`);
      }
    }

    const sufijoNivel =
      nivelLanzamiento > nivelBase
        ? ` (Nv.${nivelLanzamiento} -> ${infoProyectiles.cantidadProyectiles} ${infoProyectiles.etiquetaPlural})`
        : ` (${infoProyectiles.cantidadProyectiles} ${infoProyectiles.etiquetaPlural})`;

    return {
      formulaTaleSpire: `!${grupos.join("/")}`,
      etiquetaLog: `${nombrePj} - ${nombreLimpio}${sufijoNivel}`
    };
  }

  // 2. Conjuro estándar con dados de daño y posible escalado
  const dadosBaseValidos = hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" ? hechizo.dadosDaño.trim() : "";
  const formulaAdicional = hechizo.dadosDañoNivelSuperior?.trim() || "";
  const esEscalable = nivelBase > 0 && !!formulaAdicional && formulaAdicional !== "N/A";

  let formulaFinalDano =
    dadosBaseValidos && nivelLanzamiento > nivelBase && esEscalable
      ? calcularFormulaEscalada(dadosBaseValidos, formulaAdicional, nivelBase, nivelLanzamiento).formula
      : dadosBaseValidos;

  if (formulaFinalDano && bonoDanoMagico > 0) {
    formulaFinalDano = aplicarBonoNumericoAFormulaDados(formulaFinalDano, bonoDanoMagico);
  }

  const etiquetaLog = `${nombrePj} - ${nombreLimpio}${
    nivelLanzamiento > nivelBase ? ` (Nv.${nivelLanzamiento})` : ""
  }${tipoDanoText}`;

  const tieneAtaque = hechizo.requiereAtaque === true || hechizo.ataqueCd === "ATAQUE";

  if (tieneAtaque) {
    const formulaAtaque = `!Ataque ${sanitizarEtiqueta(nombreLimpio)}:1d20${bonoSigno}`;
    if (formulaFinalDano) {
      return {
        formulaTaleSpire: `${formulaAtaque}/Daño${sanitizarEtiqueta(tipoDanoText)}:${formulaFinalDano}`,
        etiquetaLog
      };
    }
    return {
      formulaTaleSpire: formulaAtaque,
      etiquetaLog
    };
  }

  if (formulaFinalDano) {
    return {
      formulaTaleSpire: `!Daño ${sanitizarEtiqueta(nombreLimpio)}${sanitizarEtiqueta(tipoDanoText)}:${formulaFinalDano}`,
      etiquetaLog
    };
  }

  return {
    formulaTaleSpire: `!Lanzar Conjuro:${sanitizarEtiqueta(nombreLimpio)}`,
    etiquetaLog
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



