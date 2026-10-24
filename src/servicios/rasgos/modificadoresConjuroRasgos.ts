import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { coincideHechizoId } from "../comparadorHechizos";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { evaluarEfectosRasgosActivos } from "./evaluadorExpresionesRasgos";
import { normalizar } from "./utilidadesRasgos";
import { clasesPropietariasConjuro } from "./listasConjurosRasgos";
import { conjuroEnAmpliacion } from "./ampliacionesListaConjuros";
import { obtenerNivelMaximoConjuroPorTipoClase } from "../clases/nivelConjuros";
import { seleccionesValidas } from "./seleccionesRasgos";
import { obtenerSubclasePorNombre } from "../clases/catalogoClases";

/** La procedencia es explícita o inequívoca; pertenecer a varias listas no elige una clase. */
export function resolverClaseLanzamiento(pj: PersonajeJugador, hechizo: HechizoBase, clase?: string): string | undefined {
  const propietarias = clasesPropietariasConjuro(pj, hechizo.id);
  const independiente = [...(pj.aprendizajesConjurosIndependientes?.conjuros ?? []), ...(pj.aprendizajesConjurosIndependientes?.trucos ?? [])].some(id => coincideHechizoId(id, hechizo.id));
  const candidatas = pj.clasesLanzadoras.filter(c => ((!propietarias.length || independiente || propietarias.some(p => normalizar(p) === normalizar(c.clase)))
    && hechizo.nivel <= obtenerNivelMaximoConjuroPorTipoClase(c.tipoLanzador, c.nivel) && (!hechizo.clases?.length
    || conjuroEnAmpliacion(pj, hechizo, c.clase)
    || hechizo.clases.some(n => normalizar(n) === normalizar(c.clase) || normalizar(n) === normalizar(c.listaConjuros ?? ""))))
    || (pj.clases ?? []).some(clase => normalizar(clase.nombre) === normalizar(c.clase)
      && obtenerSubclasePorNombre(clase.nombre, clase.subclase)?.progresionConjuros?.some(p => p.nivelClase <= clase.nivel && [...(p.conjuros ?? []), ...(p.trucos ?? [])].some(id => coincideHechizoId(id, hechizo.id))))
    || pj.rasgos.some(r => normalizar(r.claseConjurosOtorgados ?? "") === normalizar(c.clase) && r.activo !== false
      && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1) && esRasgoHabilitadoPorOpcion(r, pj.rasgos)
      && (r.conjurosDesdeSelectores ? r.selectores?.some(s => seleccionesValidas(s, obtenerNivelEfectivoParaRasgo(pj, r), pj).some(id => coincideHechizoId(id, hechizo.id))) : r.conjurosOtorgados?.some(id => coincideHechizoId(id, hechizo.id)))));
  if (clase) return candidatas.find(c => normalizar(c.clase) === normalizar(clase))?.clase;
  const adquiridas = candidatas.filter(c => propietarias.some(p => normalizar(p) === normalizar(c.clase)));
  if (adquiridas.length === 1) return adquiridas[0].clase;
  return candidatas.length === 1 ? candidatas[0].clase : undefined;
}

export function obtenerModificadoresConjuroRasgos(pj: PersonajeJugador, clase?: string) {
  let bonoCD = 0;
  let ventaja = false;
  for (const e of evaluarEfectosRasgosActivos(pj)) {
    if (e.claseConjuro && (!clase || normalizar(e.claseConjuro) !== normalizar(clase))) continue;
    if (e.tipo === "modificador_cd_conjuro") bonoCD += Number(e.valor) || 0;
    if (e.tipo === "ventaja" && e.objetivo === "ataque_conjuro") ventaja = true;
  }
  return { bonoCD, ventaja };
}
