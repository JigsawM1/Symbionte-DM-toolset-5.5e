import type { PersonajeJugador } from "@/tipos";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { resolverRasgoRecurso } from "./utilidadesRasgos";

export type OperacionResolucionRasgo =
  | { tipo: "reservarIntento"; idRasgo: string; id: string; formula: string }
  | { tipo: "anotarIntento"; id: string; resultado: number }
  | { tipo: "resolverIntento"; id: string; exitoso: boolean }
  | { tipo: "cancelarIntento"; id: string };

export function operarResolucionRasgo(pj: PersonajeJugador, op: OperacionResolucionRasgo): PersonajeJugador | undefined {
  const pendiente = pj.intentoRasgoPendiente;
  if (op.tipo === "reservarIntento") {
    const r = pj.rasgos.find(r => r.id === op.idRasgo && r.gastoSegunResultado && rasgoMagicoHabilitado(pj, r));
    const recurso = r && resolverRasgoRecurso(r, pj.rasgos);
    if (pendiente || !recurso || op.formula !== recurso.formulaDados || recurso.activo === false || (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) < 1) return;
    return { ...pj, intentoRasgoPendiente: { id: op.id, idRasgo: op.idRasgo, idRecurso: recurso.id, formula: op.formula },
      rasgos: pj.rasgos.map(x => x.id === recurso.id ? { ...x, usosRestantes: (x.usosRestantes ?? x.usosMaximos ?? 0) - 1 } : x) };
  }
  if (!pendiente || pendiente.id !== op.id) return;
  if (op.tipo === "anotarIntento") {
    if (pendiente.resultado !== undefined || !Number.isFinite(op.resultado)) return;
    return { ...pj, intentoRasgoPendiente: { ...pendiente, resultado: op.resultado } };
  }
  if (op.tipo === "resolverIntento" && pendiente.resultado === undefined) return;
  const devolver = op.tipo === "cancelarIntento" || !op.exitoso;
  return { ...pj, intentoRasgoPendiente: undefined, rasgos: pj.rasgos.map(r => devolver && r.id === pendiente.idRecurso
    ? { ...r, usosRestantes: Math.min(r.usosMaximos ?? 0, (r.usosRestantes ?? r.usosMaximos ?? 0) + 1) } : r) };
}

/** Un intento válido sobrevive a la reconstrucción; retirar su capacidad libera la reserva. */
export function reconciliarIntentoRasgo(pj: PersonajeJugador, cancelar = false): PersonajeJugador {
  const p = pj.intentoRasgoPendiente;
  if (!p || (!cancelar && pj.rasgos.some(r => r.id === p.idRasgo && r.gastoSegunResultado && rasgoMagicoHabilitado(pj, r)))) return pj;
  return operarResolucionRasgo(pj, { tipo: "cancelarIntento", id: p.id }) ?? pj;
}
