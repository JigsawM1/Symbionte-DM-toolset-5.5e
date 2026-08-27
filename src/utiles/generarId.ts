/**
 * generarId.ts
 * ------------
 * Genera IDs únicos y seguros usando la API nativa del navegador (crypto.randomUUID).
 * Reemplaza el patrón frágil `Date.now() + Math.random()` que puede colisionar
 * si dos entidades se crean en el mismo milisegundo.
 *

 */

/**
 * Genera un ID único con un prefijo legible.
 * Ejemplo: generarId("m_homebrew") → "m_homebrew_a1b2c3d4-e5f6-..."
 */
export function generarId(prefijo: string): string {
  return `${prefijo}_${crypto.randomUUID()}`;
}

/**
 * Genera un ID determinista y estable a partir de un nombre o slug.
 * Garantiza persistencia e invariabilidad de IDs entre reinicios y sesiones.
 * Ejemplo: generarIdSlug("h", "Descarga sobrenatural") → "h_descarga-sobrenatural"
 */
export function generarIdSlug(prefijo: string, nombre: string): string {
  const slug = (nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos y tildes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `${prefijo}_${slug}` : generarId(prefijo);
}
