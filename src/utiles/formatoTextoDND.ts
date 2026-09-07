/**
 * Utilidades puras de procesamiento de cadenas de texto y markdown para D&D 5.5e.
 * Esta capa es completamente agnóstica de React y de la interfaz visual.
 */

/**
 * Limpia marcas de markdown simples (asteriscos de énfasis) y trunca el texto al límite especificado.
 */
export function limpiarYTruncarTextoMarkdown(texto: string = "", limite = 115): string {
  const textoLimpio = texto
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();

  if (textoLimpio.length <= limite) {
    return textoLimpio;
  }
  return `${textoLimpio.slice(0, limite)}...`;
}
