import type { PersonajeJugador } from "@/tipos";
import { evaluarEfectosRasgosActivos } from "./evaluadorExpresionesRasgos";
import { normalizar } from "./utilidadesRasgos";
import { obtenerEspeciePorNombre, obtenerSubespeciePorNombre } from "../gestorEspecies";

/** Solo recoge declaraciones estructuradas; no interpreta descripciones ni modifica daño. */
export function obtenerResumenDefensasRasgos(pj: PersonajeJugador): {
  resistencias: string[]; inmunidadesDano: string[]; inmunidadesCondiciones: string[];
} {
  const resistencias = new Map<string, string>();
  const inmunidadesDano = new Map<string, string>();
  const inmunidadesCondiciones = new Map<string, string>();
  const agregar = (mapa: Map<string, string>, valores: string) => valores.split(/[,;]/).map(v => v.trim()).filter(Boolean)
    .forEach(v => mapa.set(normalizar(v), v));
  for (const ef of evaluarEfectosRasgosActivos(pj)) {
    const destino = ef.tipo === "resistencia_dano" ? resistencias : ef.tipo === "inmunidad_dano" ? inmunidadesDano
      : ef.tipo === "inmunidad_condicion" ? inmunidadesCondiciones : undefined;
    if (destino) agregar(destino, ef.objetivo);
  }
  const especie = obtenerEspeciePorNombre(pj.especie);
  const sub = especie && obtenerSubespeciePorNombre(especie.id, pj.subespecie);
  for (const fuente of [especie, sub]) for (const tipo of fuente?.resistenciasDanio ?? []) agregar(resistencias, tipo);
  const ordenar = (mapa: Map<string, string>) => [...mapa.values()].sort((a, b) => a.localeCompare(b, "es"));
  return { resistencias: ordenar(resistencias), inmunidadesDano: ordenar(inmunidadesDano), inmunidadesCondiciones: ordenar(inmunidadesCondiciones) };
}
