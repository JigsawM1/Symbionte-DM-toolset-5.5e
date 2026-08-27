/**
 * Servicio para detección, ejecución y aplicación de consumibles y pociones en D&D 5.5e (2024).
 * En 5.5e, consumir una poción es una Acción Adicional (Bonus Action).
 */

export interface InfoConsumible {
  esCurativo: boolean;
  formulaCuracion?: string;
  esPocion: boolean;
  esAccionAdicional: boolean;
  descripcionUso: string;
}

/**
 * Determina si un objeto por su nombre o notas califica como poción o consumible.
 */
export function esObjetoConsumible(nombre: string, notas?: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const n = norm(nombre);
  const d = norm(notas || "");

  return (
    n.includes("pocion") ||
    n.includes("potion") ||
    n.includes("elixir") ||
    n.includes("vial") ||
    n.includes("pergamino") ||
    n.includes("scroll") ||
    n.includes("antidoto") ||
    n.includes("antidote") ||
    n.includes("unguento") ||
    n.includes("aceite") ||
    n.includes("fuego de alquimista") ||
    n.includes("alchemist") ||
    n.includes("racion") ||
    n.includes("ration") ||
    d.includes("pocion") ||
    d.includes("consumible")
  );
}

/**
 * Detecta la información táctica y las reglas de uso de un consumible/poción.
 */
export function detectarInfoConsumible(nombre: string, descripcion?: string): InfoConsumible {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const n = norm(nombre);
  const d = norm(descripcion || "");

  const esPocion =
    n.includes("pocion") ||
    n.includes("potion") ||
    n.includes("elixir") ||
    n.includes("vial") ||
    d.includes("pocion") ||
    d.includes("potion");

  // Fórmulas oficiales de pociones de curación D&D 5.5e / 5e
  let formulaCuracion: string | undefined;

  if (n.includes("curacion suprema") || n.includes("supreme healing") || n.includes("pocion suprema")) {
    formulaCuracion = "10d4+20";
  } else if (n.includes("curacion superior") || n.includes("superior healing") || n.includes("pocion superior")) {
    formulaCuracion = "8d4+8";
  } else if (n.includes("curacion mayor") || n.includes("greater healing") || n.includes("pocion mayor")) {
    formulaCuracion = "4d4+4";
  } else if (n.includes("curacion") || n.includes("healing") || n.includes("curar") || n.includes("sanacion")) {
    formulaCuracion = "2d4+2";
  } else {
    // Buscar en la descripción patrones como "recupera 2d4 + 2 puntos de golpe"
    const match =
      d.match(/recupera[s]?\s+(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*(?:puntos\s+de\s+golpe|pg|hp|vida)/i) ||
      d.match(/cura[s]?\s+(\d+d\d+(?:\s*[+-]\s*\d+)?)/i) ||
      d.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*(?:puntos\s+de\s+golpe|pg|hp)/i);

    if (match) {
      formulaCuracion = match[1].replace(/\s+/g, "");
    }
  }

  const esCurativo = !!formulaCuracion;
  // En D&D 5.5e las pociones son Acción Adicional
  const esAccionAdicional = esPocion || d.includes("accion adicional") || d.includes("bonus action");

  let descripcionUso = esPocion
    ? "Beber como Acción Adicional"
    : esAccionAdicional
    ? "Usar como Acción Adicional"
    : "Usar como Acción";

  if (esCurativo) {
    descripcionUso = `Recupera ${formulaCuracion} Puntos de Golpe (${esAccionAdicional ? "Acción Adicional" : "Acción"})`;
  }

  return {
    esCurativo,
    formulaCuracion,
    esPocion,
    esAccionAdicional,
    descripcionUso
  };
}

/**
 * Simula y calcula la tirada de dados de una fórmula (ej: "2d4+2", "4d4+4", "10d4+20")
 */
export function evaluarFormulaDados(formula: string): number {
  const f = formula.trim();
  const match = f.match(/^(\d+)d(\d+)(?:\+(\d+)|-(\d+))?$/i);
  if (!match) {
    const num = parseInt(f, 10);
    return isNaN(num) ? 0 : num;
  }

  const cantidad = parseInt(match[1], 10);
  const caras = parseInt(match[2], 10);
  const bono = match[3] ? parseInt(match[3], 10) : match[4] ? -parseInt(match[4], 10) : 0;

  let total = bono;
  for (let i = 0; i < cantidad; i++) {
    total += Math.floor(Math.random() * caras) + 1;
  }

  return Math.max(1, total);
}
