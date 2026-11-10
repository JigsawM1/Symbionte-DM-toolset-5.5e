import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { seleccionesValidas } from "./seleccionesRasgos";

export function obtenerConcesionRasgo(pj: PersonajeJugador, rasgo: RasgoPersonaje, tipo: "conjuros" | "trucos"): string[] {
  if (!rasgo.progresionConcesion || !rasgoMagicoHabilitado(pj, rasgo)) return [];
  const nivel = obtenerNivelEfectivoParaRasgo(pj, rasgo);
  return rasgo.progresionConcesion.flatMap(fila => {
    if (fila.nivel > nivel) return [];
    const opcion = fila.opcion;
    const selector = opcion && rasgo.selectores?.find(s => s.id === opcion.selector);
    if (opcion && (!selector || !seleccionesValidas(selector, nivel, pj).includes(opcion.valor))) return [];
    return fila[tipo] ?? [];
  });
}
