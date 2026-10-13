import type { PersonajeJugador, RasgoPersonaje, HechizoBase } from "@/tipos";
import { coincideHechizoId } from "../comparadorHechizos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import type { SolicitudLanzamiento } from "../servicioLanzamientoConjuros";
import { obtenerModificadorAptitudMagica } from "../calculadorMagia";
import { cumpleCondicionEfecto } from "./evaluadorExpresionesRasgos";

export function buscarRasgoConjuroGratuito(pj: PersonajeJugador, hechizo: string): RasgoPersonaje | undefined {
  return (pj.rasgos ?? []).find(r => !r.esActivable && r.activo !== false
    && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1) && esRasgoHabilitadoPorOpcion(r, pj.rasgos)
    && (!r.tieneUsosLimitados || (r.usosRestantes ?? r.usosMaximos ?? 0) > 0) && (
      (r.tieneUsosLimitados && (r.conjurosOtorgados ?? []).some(id => coincideHechizoId(id, hechizo)))
      || (r.conjuroGratuito && coincideHechizoId(r.conjuroGratuito, hechizo))
      || r.efectos?.some(e => e.tipo === "conjuro_gratuito" && e.activo !== false && coincideHechizoId(e.objetivo, hechizo) && cumpleCondicionEfecto(e.condicion, pj))
      || (r.selectores ?? []).some(s => s.esConjuroGratuito && (s.valorActual ?? []).some(id => coincideHechizoId(id, hechizo)))));
}

export function aplicarConfiguracionConjuroGratuito(pj: PersonajeJugador | undefined, solicitud: SolicitudLanzamiento): SolicitudLanzamiento {
  if (!pj || solicitud.modo !== "gratuitoInnato") return solicitud;
  const r = buscarRasgoConjuroGratuito(pj, solicitud.hechizo.id) ?? buscarRasgoConjuroGratuito(pj, solicitud.hechizo.nombre);
  if (!r) return solicitud;
  const modificador = r.aptitudConjuroGratuito ? obtenerModificadorAptitudMagica(pj, r.aptitudConjuroGratuito) : solicitud.modificadorHabilidad ?? 0;
  const competencia = Math.floor((Math.max(1, pj.nivel) - 1) / 4) + 2;
  const hechizo: HechizoBase = r.ignorarComponentesConjuro ? { ...solicitud.hechizo, componentesSeleccionados: { verbal: false, somatico: false, material: false }, materiales: "" } : solicitud.hechizo;
  return { ...solicitud, hechizo, ...(r.aptitudConjuroGratuito ? {
    modificadorHabilidad: modificador, bonoAtaqueMagico: competencia + modificador, cdSalvacionPersonaje: 8 + competencia + modificador
  } : {}) };
}
