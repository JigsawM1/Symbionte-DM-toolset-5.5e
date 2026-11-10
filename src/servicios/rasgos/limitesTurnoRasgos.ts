import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { resolverPersonajeAsociado } from "../resolutorCriaturas";

interface SeguimientoTurnos {
  colaIniciativa: readonly { id: string; idPersonajeDuenio?: string }[];
  indiceTurnoActivo: number;
  rondaActual: number;
}

/** Si la ficha no participa en la cola, el turno se confirma en mesa. */
export function identificarTurnoPropio(pj: PersonajeJugador, estado: SeguimientoTurnos): string | false | undefined {
  const propia = estado.colaIniciativa.find(fila => resolverPersonajeAsociado(fila.id, "", [pj], fila.idPersonajeDuenio));
  const actual = estado.colaIniciativa[estado.indiceTurnoActivo];
  if (!propia || !actual) return;
  return propia === actual ? `${propia.id}:${estado.rondaActual}` : false;
}

export function identificarTurnoRasgo(r: RasgoPersonaje, pj: PersonajeJugador, estado: SeguimientoTurnos): string | false | undefined {
  if (!r.limitePorTurno) return identificarTurnoPropio(pj, estado);
  const actual = estado.colaIniciativa[estado.indiceTurnoActivo];
  return actual && `${actual.id}:${estado.rondaActual}`;
}

export function disponibleEnTurnoPropio(rasgo: RasgoPersonaje, turno: string | false | undefined, pj?: PersonajeJugador): boolean {
  const padre = rasgo.idRasgoSelectorOrigen && pj?.rasgos.find(r => r.id === rasgo.idRasgoSelectorOrigen);
  return !(rasgo.limitePorTurnoPropio || rasgo.limitePorTurno)
    || (turno !== false && (!turno || (turno !== rasgo.ultimoUsoTurno && (!padre || turno !== padre.ultimoUsoTurno))));
}
