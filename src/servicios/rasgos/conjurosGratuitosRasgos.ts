import type { PersonajeJugador, RasgoPersonaje, HechizoBase } from "@/tipos";
import { coincideHechizoId } from "../comparadorHechizos";
import { obtenerNivelEfectivoParaRasgo, obtenerClasePorNombre } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import type { SolicitudLanzamiento } from "../servicioLanzamientoConjuros";
import { obtenerModificadorAptitudMagica } from "../calculadorMagia";
import { resolverIdRasgoObjetivoGasto } from "./evaluadorConjurosRasgos";
import { calcularUsosMaximosRasgo, cumpleCondicionEfecto } from "./evaluadorExpresionesRasgos";
import { obtenerConcesionRitual } from "./conjurosRitualesRasgos";

export function buscarRasgoConjuroGratuito(pj: PersonajeJugador, hechizo: string): RasgoPersonaje | undefined {
  return (pj.rasgos ?? []).find(r => {
    if (r.esActivable || r.activo === false) return false;
    if (obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1)) return false;
    if (!esRasgoHabilitadoPorOpcion(r, pj.rasgos)) return false;
    const coincide =
      (r.tieneUsosLimitados && (r.conjurosOtorgados ?? []).some(id => coincideHechizoId(id, hechizo))) ||
      (r.conjuroGratuito && coincideHechizoId(r.conjuroGratuito, hechizo)) ||
      r.efectos?.some(e => e.tipo === "conjuro_gratuito" && e.activo !== false && coincideHechizoId(e.objetivo, hechizo) && cumpleCondicionEfecto(e.condicion, pj)) ||
      (r.selectores ?? []).some(s => s.esConjuroGratuito && (s.valorActual ?? []).some(id => coincideHechizoId(id, hechizo)));
    if (!coincide) return false;

    const idRecurso = resolverIdRasgoObjetivoGasto(r, pj.rasgos);
    const rasgoRecurso = pj.rasgos.find(x => x.id === idRecurso) ?? r;
    if (rasgoRecurso.tieneUsosLimitados) {
      const disponibles = rasgoRecurso.usosRestantes ?? rasgoRecurso.usosMaximos ?? calcularUsosMaximosRasgo(rasgoRecurso, pj);
      if (disponibles <= 0) return false;
    }
    return true;
  });
}

/** Una concesión explícita conserva su aptitud aunque otra clase sea el lanzador principal. */
export function aplicarConfiguracionConjurosRasgos(pj: PersonajeJugador | undefined, solicitud: SolicitudLanzamiento): SolicitudLanzamiento {
  if (!pj || solicitud.modo === "objetoMagico") return solicitud;
  if (solicitud.modo === "ritual" && solicitud.idRasgoOrigen) {
    const origen = obtenerConcesionRitual(pj, solicitud.idRasgoOrigen, solicitud.hechizo.id);
    if (!origen?.aptitudConjurosRituales) return solicitud;
    const mod = obtenerModificadorAptitudMagica(pj, origen.aptitudConjurosRituales);
    const bc = Math.floor((Math.max(1, pj.nivel) - 1) / 4) + 2;
    return { ...solicitud, modificadorHabilidad: mod, bonoAtaqueMagico: bc + mod, cdSalvacionPersonaje: 8 + bc + mod };
  }
  const r = solicitud.modo === "gratuitoInnato"
    ? buscarRasgoConjuroGratuito(pj, solicitud.hechizo.id) ?? buscarRasgoConjuroGratuito(pj, solicitud.hechizo.nombre) : undefined;
  const coincide = (id: string) => coincideHechizoId(id, solicitud.hechizo.id) || coincideHechizoId(id, solicitud.hechizo.nombre);
  const clases = new Set(pj.rasgos.filter(r => r.claseConjurosOtorgados && r.activo !== false
    && obtenerNivelEfectivoParaRasgo(pj,r) >= (r.nivelRequerido ?? 1) && esRasgoHabilitadoPorOpcion(r,pj.rasgos)
    && ((r.conjurosOtorgados ?? []).some(coincide) || (r.selectores ?? []).some(s => s.tipoSelector === "conjuro"
      && s.destinoConjuros !== "referencia" && s.destinoConjuros !== "libro"
      && (s.destinoConjuros !== "arcano_mistico" || solicitud.modo === "arcanoMistico") && s.valorActual.some(coincide))))
    .map(r => r.claseConjurosOtorgados!.toLocaleLowerCase("es")));
  const claseElegida = solicitud.modo !== "arcanoMistico" && solicitud.modo !== "gratuitoInnato"
    ? solicitud.claseLanzamiento?.toLocaleLowerCase("es") : undefined;
  const clase = claseElegida ?? (clases.size === 1 ? [...clases][0] : undefined);
  const aptitud = r?.aptitudConjuroGratuito ?? (clase
    ? pj.clasesLanzadoras.find(c => c.clase.toLocaleLowerCase("es") === clase)?.habilidadConjuro
      ?? obtenerClasePorNombre(clase)?.configuracionMagica?.habilidadConjuro : undefined);
  const variante = pj.rasgos.find(r => r.ignorarMaterialesConjuro && r.activo !== false
    && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1) && r.conjuroGratuito && coincide(r.conjuroGratuito));
  if (!r && !aptitud && !variante) return solicitud;
  const modificador = aptitud ? obtenerModificadorAptitudMagica(pj, aptitud) : solicitud.modificadorHabilidad ?? 0;
  const competencia = Math.floor((Math.max(1, pj.nivel) - 1) / 4) + 2;
  const hechizo: HechizoBase = r?.ignorarComponentesConjuro ? { ...solicitud.hechizo, componentesSeleccionados: { verbal: false, somatico: false, material: false }, materiales: "" } : variante ? { ...solicitud.hechizo, componentesSeleccionados: { ...solicitud.hechizo.componentesSeleccionados, material: false }, materiales: "" } : solicitud.hechizo;
  return { ...solicitud, hechizo, ...(aptitud ? {
    modificadorHabilidad: modificador, bonoAtaqueMagico: competencia + modificador, cdSalvacionPersonaje: 8 + competencia + modificador
  } : {}) };
}

export { aplicarConfiguracionConjurosRasgos as aplicarConfiguracionConjuroGratuito };
