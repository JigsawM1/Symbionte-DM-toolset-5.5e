import { obtenerNivelEfectivoParaRasgo, obtenerSubclasePorNombre } from "../clases/catalogoClases";
import { coincideHechizoId } from "../comparadorHechizos";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { evaluarEfectosRasgosActivos } from "./evaluadorExpresionesRasgos";
import { normalizar } from "./utilidadesRasgos";
import { clasesPropietariasConjuro } from "./listasConjurosRasgos";
import { conjuroEnAmpliacion, rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { obtenerNivelMaximoConjuroPorTipoClase } from "../clases/nivelConjuros";
import { seleccionesValidas } from "./seleccionesRasgos";
import { obtenerConcesionRasgo } from "./concesionesRasgos";

/** Distingue las clases válidas de las que registraron el conjuro como elección propia. */
export function obtenerClasesLanzamiento(pj: PersonajeJugador, hechizo: HechizoBase): { candidatas: string[]; adquiridas: string[] } {
  const propietarias = clasesPropietariasConjuro(pj, hechizo.id);
  const independiente = [...(pj.aprendizajesConjurosIndependientes?.conjuros ?? []), ...(pj.aprendizajesConjurosIndependientes?.trucos ?? [])].some(id => coincideHechizoId(id, hechizo.id));
  const candidatas = pj.clasesLanzadoras.filter(c => ((!propietarias.length || independiente || propietarias.some(p => normalizar(p) === normalizar(c.clase)))
    && hechizo.nivel <= obtenerNivelMaximoConjuroPorTipoClase(c.tipoLanzador, c.nivel) && (!hechizo.clases?.length
    || conjuroEnAmpliacion(pj, hechizo, c.clase)
    || hechizo.clases.some(n => normalizar(n) === normalizar(c.clase) || normalizar(n) === normalizar(c.listaConjuros ?? ""))))
    || (pj.clases ?? []).some(clase => normalizar(clase.nombre) === normalizar(c.clase)
      && obtenerSubclasePorNombre(clase.nombre, clase.subclase)?.progresionConjuros?.some(p => p.nivelClase <= clase.nivel && [...(p.conjuros ?? []), ...(p.trucos ?? [])].some(id => coincideHechizoId(id, hechizo.id))))
    || pj.rasgos.some(r => normalizar(r.claseConjurosOtorgados ?? "") === normalizar(c.clase) && rasgoMagicoHabilitado(pj, r)
      && (obtenerConcesionRasgo(pj, r, hechizo.nivel === 0 ? "trucos" : "conjuros").some(id => coincideHechizoId(id, hechizo.id))
        || (r.conjurosDesdeSelectores ? [] : r.conjurosOtorgados)?.some(id => coincideHechizoId(id, hechizo.id))
        || r.selectores?.some(s => (r.conjurosDesdeSelectores || s.destinoConjuros === "trucos")
          && seleccionesValidas(s, obtenerNivelEfectivoParaRasgo(pj, r), pj).some(id => coincideHechizoId(id, hechizo.id))))));
  const clases = [...new Set(candidatas.map(c => c.clase))];
  return { candidatas: clases, adquiridas: clases.filter(c => propietarias.some(p => normalizar(p) === normalizar(c))) };
}

export function resolverClaseLanzamiento(pj: PersonajeJugador, hechizo: HechizoBase, clase?: string): string | undefined {
  const { candidatas, adquiridas } = obtenerClasesLanzamiento(pj, hechizo);
  if (clase) return candidatas.find(c => normalizar(c) === normalizar(clase));
  if (adquiridas.length === 1) return adquiridas[0];
  return candidatas.length === 1 ? candidatas[0] : undefined;
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
