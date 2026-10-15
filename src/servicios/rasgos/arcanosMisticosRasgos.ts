import type { PersonajeJugador, SelectorRasgo } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";

/** La vista y el gasto comparten las mismas concesiones declaradas por los rasgos. */
export function obtenerSelectoresArcanos(pj: PersonajeJugador, soloHabilitados = false): SelectorRasgo[] {
  return pj.rasgos.flatMap(r => {
    if (soloHabilitados && (r.activo === false || !esRasgoHabilitadoPorOpcion(r, pj.rasgos)
      || obtenerNivelEfectivoParaRasgo(pj,r) < (r.nivelRequerido ?? 1))) return [];
    return (r.selectores ?? []).filter(s => s.destinoConjuros === "arcano_mistico");
  });
}
