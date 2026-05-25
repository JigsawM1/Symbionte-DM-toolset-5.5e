/**
 * Utilidades para el manejo de fórmulas de dados y escalado de conjuros (D&D 5.5e).
 * 
 * Programado con diseño modular, tolerante a fallos y limpio para mantenimiento futuro.
 */

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
