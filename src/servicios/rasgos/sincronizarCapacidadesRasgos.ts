import type { PersonajeJugador } from "@/tipos";
import { EsquemaCapacidadesRasgosSync, type CapacidadesRasgosSync } from "@/tipos/capacidadesRasgosSync";
import { deshidratarRasgo, hidratarPersonaje } from "../serializadorPersonaje";
import { normalizarMecanicasRasgos } from "./normalizarMecanicasRasgos";
import { reconciliarConjurosRasgos } from "./reconciliarConjurosRasgos";

export function proyectarCapacidadesRasgos(pj: PersonajeJugador): CapacidadesRasgosSync {
  return EsquemaCapacidadesRasgosSync.parse({ ...pj, rasgos: (pj.rasgos ?? []).map(deshidratarRasgo) });
}

export function aplicarCapacidadesRasgos(pj: PersonajeJugador, capacidades?: CapacidadesRasgosSync): PersonajeJugador {
  if (!capacidades) return pj;
  const actual = normalizarMecanicasRasgos(pj, hidratarPersonaje({ ...pj, ...capacidades }));
  return { ...actual, ...reconciliarConjurosRasgos(pj, actual.rasgos) };
}
