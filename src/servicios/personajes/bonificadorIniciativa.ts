import type { PersonajeJugador } from "@/tipos/personaje";
import { calcularBonoIniciativaRasgos } from "@/servicios/rasgos/evaluadorMovilidadRasgos";

/** Bono del personaje; los penalizadores de la tirada se aplican por separado y una sola vez. */
export function calcularBonificadorIniciativa(personaje: PersonajeJugador, modificadorDestreza: number): number {
  return modificadorDestreza + (personaje.iniciativaBono || 0) + calcularBonoIniciativaRasgos(personaje);
}
