import type { PersonajeJugador } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import { coincideHechizoId } from "../comparadorHechizos";

/** Las concesiones rituales conservan su origen, sin modificar aprendizajes de otras vías. */
export function obtenerRasgosRituales(pj: PersonajeJugador) {
  return pj.rasgos.filter(r => r.conjurosRituales?.length && r.activo !== false
    && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1) && esRasgoHabilitadoPorOpcion(r, pj.rasgos));
}

export function obtenerConcesionRitual(pj: PersonajeJugador, idRasgo: string, idConjuro: string) {
  return obtenerRasgosRituales(pj).find(r => r.id === idRasgo && r.conjurosRituales?.some(id => coincideHechizoId(id, idConjuro)));
}
