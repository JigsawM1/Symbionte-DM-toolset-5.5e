import type { EfectoMecanicoRasgo } from "@/tipos";
import { normalizar } from "./utilidadesRasgos";

const MARCADORES_CONJURO = new Set(["conjuro", "propio", "sin_espacio", "gratuito", "general"]);

/** Acepta tanto el objetivo del catálogo como el valor introducido en el editor. */
export function obtenerConjuroDeEfecto(efecto: EfectoMecanicoRasgo): string | undefined {
  return [efecto.objetivo, efecto.valor].find((valor): valor is string =>
    typeof valor === "string" && Boolean(valor.trim()) && !MARCADORES_CONJURO.has(normalizar(valor)))?.trim();
}
