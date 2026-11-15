/**
 * Utilidades puras de procesamiento de cadenas de texto y markdown para D&D 5.5e.
 * Esta capa es completamente agnóstica de React y de la interfaz visual.
 */

/**
 * Limpia marcas de markdown simples (asteriscos de énfasis) y trunca el texto al límite especificado.
 */
export function limpiarYTruncarTextoMarkdown(texto: string = "", limite = 115): string {
  const textoLimpio = texto
    .replace(/\*/g, "")
    .trim();

  if (textoLimpio.length <= limite) {
    return textoLimpio;
  }
  return `${textoLimpio.slice(0, limite)}...`;
}

/**
 * Calcula las filas visibles de un textarea según saltos de línea y longitud de texto.
 */
export function calcularFilasTextarea(valor: string, minFilas = 2, maxFilas = 20): number {
  if (!valor) return minFilas;
  const lineas = valor.split("\n").length;
  const porLongitud = Math.ceil(valor.length / 80);
  return Math.min(maxFilas, Math.max(minFilas, lineas, porLongitud));
}
