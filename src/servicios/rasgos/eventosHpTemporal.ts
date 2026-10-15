import type { PersonajeJugador } from "@/tipos";
import { calcularHpTemporalDeEfecto } from "./evaluadorVitalidadRasgos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";

/** Aplica concesiones propias que declaran un evento; no interpreta sus descripciones. */
export function aplicarHpTemporalPorEvento(pj: PersonajeJugador, evento: "descanso" | "uso", idRasgo?: string): PersonajeJugador {
  let hp = pj.hpTemporal ?? 0;
  for (const r of pj.rasgos) {
    if (r.activo === false || !esRasgoHabilitadoPorOpcion(r, pj.rasgos) || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1)) continue;
    if (!(evento === "descanso" ? r.hpTemporalAlDescansar : r.hpTemporalAlUsarRasgo === idRasgo)) continue;
    for (const e of r.efectos ?? []) if (e.tipo === "hp_temporal" && e.objetivo === "propio") hp = Math.max(hp, calcularHpTemporalDeEfecto(e, pj));
  }
  return hp === pj.hpTemporal ? pj : { ...pj, hpTemporal: hp };
}
