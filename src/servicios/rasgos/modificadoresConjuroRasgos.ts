import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { coincideHechizoId } from "../comparadorHechizos";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { evaluarEfectosRasgosActivos } from "./evaluadorExpresionesRasgos";
import { normalizar } from "./utilidadesRasgos";

/** La procedencia es explícita o inequívoca; pertenecer a varias listas no elige una clase. */
export function resolverClaseLanzamiento(pj: PersonajeJugador, hechizo: HechizoBase, clase?: string): string | undefined {
  const candidatas = pj.clasesLanzadoras.filter(c => !hechizo.clases?.length
    || hechizo.clases.some(n => normalizar(n) === normalizar(c.clase) || normalizar(n) === normalizar(c.listaConjuros ?? ""))
    || pj.rasgos.some(r => normalizar(r.claseConjurosOtorgados ?? "") === normalizar(c.clase) && r.activo !== false
      && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1) && esRasgoHabilitadoPorOpcion(r, pj.rasgos)
      && r.conjurosOtorgados?.some(id => coincideHechizoId(id, hechizo.id))));
  if (clase) return candidatas.find(c => normalizar(c.clase) === normalizar(clase))?.clase;
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
