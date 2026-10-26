import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { coincideHechizoId } from "../comparadorHechizos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion, resolverRasgoRecurso, normalizar } from "./utilidadesRasgos";
import HECHIZOS from "@/utiles/compendios/all.json";

const MAPA_HECHIZOS = new Map(HECHIZOS.map((h) => [h.id, h]));

export function obtenerConcesionConRecurso(pj: PersonajeJugador, idRasgo: string | undefined, hechizo: HechizoBase, nivel = hechizo.nivel) {
  const r = pj.rasgos.find(x => x.id === idRasgo);
  const cfg = r?.lanzamientoConRecurso;
  const concesion = pj.rasgos.find(x => x.id === cfg?.idRasgoConcesion);
  const recurso = r && (r.idRasgoRecurso || r.gastarDePadre ? resolverRasgoRecurso(r, pj.rasgos) : r);
  // Validar contra el catálogo evita aceptar metadatos de lista o tiempo manipulados en una solicitud.
  const canonico = MAPA_HECHIZOS.get(hechizo.id);
  const adicional = cfg?.adicionales?.find(a => a.conjuroId === hechizo.id);
  const pertenece = cfg?.lista ? canonico && (adicional || (canonico.nivel <= cfg.nivelMaximo
    && canonico.clases.some(c => normalizar(c) === normalizar(cfg.lista))))
    : concesion?.activo !== false && concesion?.conjurosOtorgados?.some(id => coincideHechizoId(id, hechizo.id));
  if (!r || !cfg || r.activo === false || !pertenece || !recurso?.tieneUsosLimitados || recurso.activo === false
    || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1) || !esRasgoHabilitadoPorOpcion(r, pj.rasgos)
    || nivel !== hechizo.nivel || (canonico && canonico.nivel !== nivel) || nivel < (cfg.lista ? 0 : 1) || (!adicional && nivel > cfg.nivelMaximo)
    || (cfg.excluirReacciones && normalizar(canonico?.tiempoLanzamiento ?? hechizo.tiempoLanzamiento ?? "").includes("reaccion"))) return;
  return { rasgo: r, recurso, coste: cfg.costeFijo ?? nivel, clase: cfg.lista ?? concesion?.claseConjurosOtorgados,
    formulaDescansos: adicional?.formulaDescansos };
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
