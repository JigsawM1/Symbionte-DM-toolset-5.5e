import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { coincideHechizoId } from "../comparadorHechizos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion, resolverRasgoRecurso, normalizar } from "./utilidadesRasgos";

export function obtenerConcesionConRecurso(pj: PersonajeJugador, idRasgo: string | undefined, hechizo: HechizoBase, nivel = hechizo.nivel) {
  const r = pj.rasgos.find(x => x.id === idRasgo);
  const cfg = r?.lanzamientoConRecurso;
  const concesion = pj.rasgos.find(x => x.id === cfg?.idRasgoConcesion);
  const recurso = r && resolverRasgoRecurso(r, pj.rasgos);
  if (!r || !cfg || r.activo === false || !concesion || concesion.activo === false || !recurso?.tieneUsosLimitados || recurso.activo === false
    || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1) || !esRasgoHabilitadoPorOpcion(r, pj.rasgos)
    || nivel !== hechizo.nivel || nivel < 1 || nivel > cfg.nivelMaximo
    || !concesion.conjurosOtorgados?.some(id => coincideHechizoId(id, hechizo.id))) return;
  return { rasgo: r, recurso, coste: nivel, clase: concesion.claseConjurosOtorgados };
}

/** Ofrece las concesiones adquiridas aunque su reserva esté agotada, para poder explicar el bloqueo. */
export function obtenerOpcionesRecursoConjuro(pj: PersonajeJugador, hechizo: HechizoBase, clase?: string) {
  return pj.rasgos.flatMap(r => {
    if (!r.lanzamientoConRecurso) return [];
    const cfg = obtenerConcesionConRecurso(pj, r.id, hechizo);
    return cfg && (!clase || !cfg.clase || normalizar(clase) === normalizar(cfg.clase)) ? [cfg] : [];
  });
}

export function obtenerVarianteConjuro(pj: PersonajeJugador, hechizo: HechizoBase) {
  return pj.rasgos.find(r => r.varianteSinConcentracion && r.activo !== false
    && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1) && esRasgoHabilitadoPorOpcion(r, pj.rasgos)
    && r.conjuroGratuito && coincideHechizoId(r.conjuroGratuito, hechizo.id));
}
