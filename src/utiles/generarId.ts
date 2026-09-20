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
 * Es idempotente respecto al prefijo: si el nombre ya inicia con `prefijo_` o `prefijo-`
 * (incluso en casos históricos repetidos como `h_h-`), se extrae el cuerpo limpio
 * antes de generar el slug final.
 *
 * Ejemplo: generarIdSlug("h", "Descarga sobrenatural") → "h_descarga-sobrenatural"
 * Ejemplo: generarIdSlug("h", "h_descarga-sobrenatural") → "h_descarga-sobrenatural"
 * Ejemplo: generarIdSlug("h", "h-detectar-magia") → "h_detectar-magia"
 */
export function generarIdSlug(prefijo: string, nombre: string): string {
  let entrada = (nombre || "").trim();
  const prefijoBajo = `${prefijo}_`.toLowerCase();
  const prefijoGuion = `${prefijo}-`.toLowerCase();

  // Limpieza de prefijos preexistentes para garantizar idempotencia
  let removiendo = true;
  while (removiendo) {
    const lower = entrada.toLowerCase();
    if (lower.startsWith(prefijoBajo)) {
      entrada = entrada.substring(prefijoBajo.length).trim();
    } else if (lower.startsWith(prefijoGuion)) {
      entrada = entrada.substring(prefijoGuion.length).trim();
    } else {
      removiendo = false;
    }
  }

  const slug = entrada
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos y tildes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `${prefijo}_${slug}` : generarId(prefijo);
}
