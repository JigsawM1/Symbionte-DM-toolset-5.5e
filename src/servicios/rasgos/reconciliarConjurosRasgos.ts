import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { agregarValoresSelectorAListas, esSelectorDeConjuros, type ListasConjurosSelector } from "@/utiles/selectoresConjuros";
import { coincideHechizoId } from "../comparadorHechizos";
import { obtenerConjurosSubclasePersonaje } from "../calculadorMagia";
import { obtenerConjurosOtorgadosPorRasgos } from "./evaluadorConjurosRasgos";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";

function obtenerAportes(personaje: PersonajeJugador, rasgos: RasgoPersonaje[]): ListasConjurosSelector {
  let listas: ListasConjurosSelector = { siempre: [], preparados: [], conocidos: [], trucos: [] };
  const otorgados = obtenerConjurosOtorgadosPorRasgos({ ...personaje, rasgos });
  listas = agregarValoresSelectorAListas({ id: "otorgados", tipoSelector: "conjuro" }, otorgados, listas);
  for (const rasgo of rasgos) {
    if (rasgo.activo === false || !esRasgoHabilitadoPorOpcion(rasgo, rasgos)
      || obtenerNivelEfectivoParaRasgo(personaje, rasgo) < (rasgo.nivelRequerido ?? 1)) continue;
    for (const selector of rasgo.selectores || []) {
      if (esSelectorDeConjuros(selector)) {
        listas = agregarValoresSelectorAListas(selector, selector.valorActual || [], listas);
      }
    }
  }
  return listas;
}

/** Reconcilia solo los aportes de rasgos, conservando otras fuentes y sus alias. */
export function reconciliarConjurosRasgos(
  anterior: PersonajeJugador,
  rasgos: RasgoPersonaje[]
): Pick<PersonajeJugador, "conjurosSiemprePreparadosIds" | "conjurosPreparadosIds" | "conjurosConocidosIds" | "trucosConocidosIds"> {
  const antes = obtenerAportes(anterior, anterior.rasgos || []);
  const despues = obtenerAportes(anterior, rasgos);
  const subclase = obtenerConjurosSubclasePersonaje(anterior.clases, anterior.clase, anterior.subclase, anterior.nivel);
  const coincide = (lista: string[], id: string) => lista.some((c) => coincideHechizoId(c, id));
  const reconciliar = (actuales: string[], previos: string[], nuevos: string[], otrasFuentes: string[]) => {
    const resultado = actuales.filter((id) => !coincide(previos, id) || coincide(nuevos, id) || coincide(otrasFuentes, id));
    for (const id of nuevos) if (!coincide(resultado, id)) resultado.push(id);
    return resultado;
  };
  return {
    conjurosSiemprePreparadosIds: reconciliar(anterior.conjurosSiemprePreparadosIds || [], antes.siempre, despues.siempre, subclase.conjuros),
    conjurosPreparadosIds: reconciliar(anterior.conjurosPreparadosIds || [], antes.preparados, despues.preparados, subclase.conjuros),
    conjurosConocidosIds: reconciliar(anterior.conjurosConocidosIds || [], antes.conocidos, despues.conocidos,
      [...subclase.conjuros, ...(anterior.aprendizajesConjurosIndependientes?.conjuros ?? [])]),
    trucosConocidosIds: reconciliar(anterior.trucosConocidosIds || [], antes.trucos, despues.trucos,
      [...subclase.trucos, ...(anterior.aprendizajesConjurosIndependientes?.trucos ?? [])])
  };
}
