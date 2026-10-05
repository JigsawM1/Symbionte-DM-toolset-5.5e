import type { SelectorRasgo } from "@/tipos/rasgos";

/**
 * Subcadenas heredadas que identifican selectores mágicos por su id.
 * Se conservan por retrocompatibilidad con datos homebrew que no declaran `tipoSelector`.
 */
const SUBCADENAS_TRUCO = ["truco", "cantrip"] as const;
const SUBCADENAS_CONJURO = ["conjuro", "hechizo", "spell", "ritual"] as const;

type SelectorMinimo = Pick<SelectorRasgo, "id" | "tipoSelector" | "esConjuroGratuito" | "destinoConjuros">;

/**
 * Indica si el selector elige trucos (nivel 0), en base a su id.
 * Función PURA.
 */
export function esSelectorDeTrucos(selector: SelectorMinimo): boolean {
  const sid = (selector?.id || "").trim().toLowerCase();
  return SUBCADENAS_TRUCO.some((sub) => sid.includes(sub));
}

/**
 * Indica si el selector elige conjuros o trucos.
 * Prioriza la declaración explícita `tipoSelector: "conjuro"` o `esConjuroGratuito`,
 * con respaldo en las subcadenas del id. Función PURA y agnóstica de clase.
 */
export function esSelectorDeConjuros(selector: SelectorMinimo): boolean {
  if (!selector) return false;
  if (selector.tipoSelector === "conjuro" || Boolean(selector.esConjuroGratuito)) return true;
  const sid = (selector.id || "").trim().toLowerCase();
  return esSelectorDeTrucos(selector) || SUBCADENAS_CONJURO.some((sub) => sid.includes(sub));
}

/**
 * Indica si los conjuros del selector deben ir solo al libro (conjuros conocidos),
 * sin marcarse como siempre preparados. Función PURA.
 */
export function esSelectorSoloLibro(selector: SelectorMinimo): boolean {
  return selector?.destinoConjuros === "libro";
}

/** Listas de conjuros del personaje que se sincronizan a partir de selectores. */
export interface ListasConjurosSelector {
  siempre: string[];
  preparados: string[];
  conocidos: string[];
  trucos: string[];
}

/**
 * Añade los valores de un selector mágico a las listas correspondientes según su destino declarado.
 * Devuelve nuevas listas (no muta las de entrada). Función PURA.
 */
export function agregarValoresSelectorAListas(
  selector: SelectorMinimo,
  valores: readonly string[],
  listas: ListasConjurosSelector
): ListasConjurosSelector {
  const resultado: ListasConjurosSelector = {
    siempre: [...listas.siempre],
    preparados: [...listas.preparados],
    conocidos: [...listas.conocidos],
    trucos: [...listas.trucos]
  };
  const agregar = (lista: string[], v: string): void => {
    if (!lista.includes(v)) lista.push(v);
  };
  const esTruco = esSelectorDeTrucos(selector);
  const soloLibro = esSelectorSoloLibro(selector);

  for (const v of valores) {
    if (!v) continue;
    if (esTruco) {
      agregar(resultado.trucos, v);
    } else if (soloLibro) {
      agregar(resultado.conocidos, v);
    } else {
      agregar(resultado.siempre, v);
      agregar(resultado.preparados, v);
      agregar(resultado.conocidos, v);
    }
  }
  return resultado;
}

/**
 * Elimina de las listas los valores indicados (respetando el destino del selector).
 * Devuelve nuevas listas. Función PURA.
 */
export function quitarValoresSelectorDeListas(
  selector: SelectorMinimo,
  valores: readonly string[],
  listas: ListasConjurosSelector
): ListasConjurosSelector {
  const fuera = (lista: string[]): string[] => lista.filter((c) => !valores.includes(c));
  if (esSelectorDeTrucos(selector)) {
    return { ...listas, trucos: fuera(listas.trucos) };
  }
  if (esSelectorSoloLibro(selector)) {
    return { ...listas, conocidos: fuera(listas.conocidos) };
  }
  return {
    ...listas,
    siempre: fuera(listas.siempre),
    preparados: fuera(listas.preparados),
    conocidos: fuera(listas.conocidos)
  };
}
