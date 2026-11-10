/**
 * Fachada pública retrocompatible para los evaluadores de efectos mecánicos de rasgos.
 * Reexporta todas las utilidades, evaluadores de expresiones, vitalidad, movilidad,
 * salvaciones, combate y conjuros modularizados en `./rasgos`.
 */
export * from "./rasgos";
// Exportaciones explícitas para los consumidores que participan en la inicialización de rasgos.
export { evaluarEfectosRasgosActivos, calcularUsosMaximosRasgo } from "./rasgos/evaluadorExpresionesRasgos";
