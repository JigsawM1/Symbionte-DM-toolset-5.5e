import type { PersonajeJugador } from "@/tipos";
import { evaluarEfectosRasgosActivos } from "./evaluadorExpresionesRasgos";
import { esCondicionConcentracion } from "../procesadorCondiciones";

/** Restricciones efectivas, sujetas a nivel, activación, opciones y dependencias. */
export function tieneRestriccionRasgos(pj: PersonajeJugador, objetivo: "conjuros" | "concentracion"): boolean {
  return evaluarEfectosRasgosActivos(pj).some(e => e.tipo === "restriccion" && e.objetivo === objetivo && Number(e.valor) > 0);
}

export function retirarConcentracionRestringida(pj: PersonajeJugador): PersonajeJugador {
  if (!tieneRestriccionRasgos(pj, "concentracion")) return pj;
  const condicionesActivas = pj.condicionesActivas.filter(c => !esCondicionConcentracion(c));
  const efectosActivos = pj.efectosActivos.filter(e => !esCondicionConcentracion(e.nombre, e.id, e.concentracion));
  return condicionesActivas.length === pj.condicionesActivas.length && efectosActivos.length === pj.efectosActivos.length
    ? pj : { ...pj, condicionesActivas, efectosActivos };
}
