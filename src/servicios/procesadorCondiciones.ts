/**
 * procesadorCondiciones.ts
 * -----------------------
 * Servicio puro para el procesamiento y manipulación de condiciones D&D 5.5e
 * aplicando el Strategy Pattern para diferenciar condiciones apilables (Cansado/Exhaustion)
 * de condiciones simples e idempotentes.
 *
 * Programado 100% en español.
 */

export const NIVEL_MAXIMO_CANSANCIO = 6;

/**
 * Contrato que debe implementar cualquier estrategia de condición.
 */
export interface EstrategiaCondicion {
  /** Determina si esta estrategia es aplicable para el nombre de condición dado */
  aplicaPara(condicion: string): boolean;
  /** Aplica la condición sobre la lista actual de condiciones de forma inmutable */
  aplicar(condicionesActuales: readonly string[], nuevaCondicion: string): string[];
}

/**
 * Estrategia para la condición apilable "Cansado" (Exhaustion en D&D 5.5e).
 * Incrementa progresivamente el nivel desde 1 hasta el máximo de 6.
 */
export class EstrategiaCansancio implements EstrategiaCondicion {
  aplicaPara(condicion: string): boolean {
    const normalizada = condicion.trim().toLowerCase();
    return normalizada.includes("cansado") || normalizada.includes("exhausted");
  }

  aplicar(condicionesActuales: readonly string[], _nuevaCondicion: string): string[] {
    const condicionCansadoExistente = condicionesActuales.find((c) =>
      c.toLowerCase().startsWith("cansado")
    );

    if (condicionCansadoExistente) {
      const matches = condicionCansadoExistente.match(/\d+/);
      const nivelActual = matches ? parseInt(matches[0], 10) : 1;
      const nuevoNivel = Math.min(NIVEL_MAXIMO_CANSANCIO, nivelActual + 1);

      const condicionesFiltradas = condicionesActuales.filter(
        (c) => !c.toLowerCase().startsWith("cansado")
      );
      return [...condicionesFiltradas, `Cansado (Niv. ${nuevoNivel})`];
    }

    return [...condicionesActuales, "Cansado (Niv. 1)"];
  }
}

/**
 * Estrategia por defecto para condiciones estándar (Cegado, Paralizado, Envenenado, etc.).
 * Garantiza que la condición no se duplique si ya existe en la lista.
 */
export class EstrategiaCondicionSimple implements EstrategiaCondicion {
  aplicaPara(_condicion: string): boolean {
    return true; // Fallback para cualquier condición estándar
  }

  aplicar(condicionesActuales: readonly string[], nuevaCondicion: string): string[] {
    const limpia = nuevaCondicion.trim();
    if (!limpia) {
      return [...condicionesActuales];
    }

    if (condicionesActuales.includes(limpia)) {
      return [...condicionesActuales];
    }

    return [...condicionesActuales, limpia];
  }
}

// Lista ordenada de estrategias registradas (de más específica a más genérica)
const ESTRATEGIAS: readonly EstrategiaCondicion[] = [
  new EstrategiaCansancio(),
  new EstrategiaCondicionSimple(),
];

/**
 * Obtiene la estrategia adecuada para una condición específica.
 */
function seleccionarEstrategia(condicion: string): EstrategiaCondicion {
  const estrategiaEncontrada = ESTRATEGIAS.find((e) => e.aplicaPara(condicion));
  return estrategiaEncontrada ?? new EstrategiaCondicionSimple();
}

/**
 * Aplica una condición a la lista de condiciones de una criatura,
 * delegando en la estrategia correspondiente (p.ej. apilando "Cansado").
 * Retorna un nuevo arreglo inmutable.
 */
export function aplicarCondicion(
  condicionesActuales: readonly string[],
  nuevaCondicion: string
): string[] {
  const normalizada = nuevaCondicion.trim();
  if (!normalizada) {
    return [...condicionesActuales];
  }

  const estrategia = seleccionarEstrategia(normalizada);
  return estrategia.aplicar(condicionesActuales, normalizada);
}

/**
 * Elimina una condición específica de la lista de condiciones de forma inmutable.
 */
export function quitarCondicion(
  condicionesActuales: readonly string[],
  condicionAQuitar: string
): string[] {
  const normalizada = condicionAQuitar.trim();
  return condicionesActuales.filter((c) => c !== normalizada);
}

/**
 * Reduce en 1 el nivel de "Cansado" o lo elimina por completo si está en nivel 1.
 */
export function reducirNivelCansancio(condicionesActuales: readonly string[]): string[] {
  const condicionCansadoExistente = condicionesActuales.find((c) =>
    c.toLowerCase().startsWith("cansado")
  );

  if (!condicionCansadoExistente) {
    return [...condicionesActuales];
  }

  const matches = condicionCansadoExistente.match(/\d+/);
  const nivelActual = matches ? parseInt(matches[0], 10) : 1;

  const condicionesFiltradas = condicionesActuales.filter(
    (c) => !c.toLowerCase().startsWith("cansado")
  );

  if (nivelActual <= 1) {
    return condicionesFiltradas;
  }

  return [...condicionesFiltradas, `Cansado (Niv. ${nivelActual - 1})`];
}
