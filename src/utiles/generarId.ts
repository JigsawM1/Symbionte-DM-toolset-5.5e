/**
 * generarId.ts
 * ------------
 * Genera IDs únicos y seguros usando la API nativa del navegador (crypto.randomUUID).
 * Reemplaza el patrón frágil `Date.now() + Math.random()` que puede colisionar
 * si dos entidades se crean en el mismo milisegundo.
 *
 * Programado 100% en español.
 */

/**
 * Genera un ID único con un prefijo legible.
 * Ejemplo: generarId("m_homebrew") → "m_homebrew_a1b2c3d4-e5f6-..."
 */
export function generarId(prefijo: string): string {
  return `${prefijo}_${crypto.randomUUID()}`;
}
