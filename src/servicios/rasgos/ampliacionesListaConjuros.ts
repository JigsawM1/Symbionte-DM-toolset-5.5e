import type { PersonajeJugador, HechizoBase, RasgoPersonaje } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { obtenerNivelMaximoConjuroPorTipoClase } from "../clases/nivelConjuros";
import { normalizar, esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";

export function rasgoMagicoHabilitado(pj: PersonajeJugador, r: RasgoPersonaje): boolean {
  return r.activo !== false && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1) && esRasgoHabilitadoPorOpcion(r, pj.rasgos);
}

export function obtenerAmpliacionesLista(pj: PersonajeJugador) {
  return (pj.rasgos ?? []).filter(r => r.ampliacionListaConjuros && rasgoMagicoHabilitado(pj, r));
}

/** La clase beneficiaria determina el nivel; las listas donantes solo amplían sus elecciones. */
export function conjuroEnAmpliacion(pj: PersonajeJugador, h: Pick<HechizoBase, "nivel" | "clases">, clase?: string): boolean {
  return obtenerAmpliacionesLista(pj).some(r => {
    const cfg = r.ampliacionListaConjuros!;
    const lanzador = pj.clasesLanzadoras.find(c => normalizar(c.clase) === normalizar(cfg.clase));
    return (!clase || normalizar(clase) === normalizar(cfg.clase)) && h.nivel >= cfg.nivelMinimoConjuro
      && h.nivel <= obtenerNivelMaximoConjuroPorTipoClase(lanzador?.tipoLanzador ?? "completo", obtenerNivelEfectivoParaRasgo(pj, r))
      && h.clases?.some(c => cfg.listas.some(lista => normalizar(lista) === normalizar(c)));
  });
}
