import type { PersonajeJugador, ClaseLanzadora, RasgoPersonaje } from "@/tipos";
import { calcularTodosRecursosMagicos } from "../calculadorMagia";
import { obtenerSubclasePorNombre, obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { normalizar, esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";

function claseDeRasgo(pj: PersonajeJugador, r: RasgoPersonaje): string {
  return (pj.clases ?? []).find(c => normalizar(r.fuente).includes(normalizar(c.nombre)))?.nombre
    ?? (r.origen === "personalizado" ? r.nombre : pj.clase);
}

/** Reconcilia solamente las capacidades concedidas por rasgos; conserva lanzadores independientes. */
export function normalizarMagiaRasgos(anterior: PersonajeJugador | undefined, personaje: PersonajeJugador): PersonajeJugador {
  const rasgos = (personaje.rasgos ?? []).filter(r => r.configuracionMagica);
  const previos = anterior?.rasgos?.filter(r => r.configuracionMagica) ?? [];
  const clasesGestionadas = new Set([...rasgos.map(r => claseDeRasgo(personaje, r)),
    ...previos.map(r => claseDeRasgo(anterior!, r))].map(normalizar));
  for (const c of personaje.clases ?? []) {
    const sub = obtenerSubclasePorNombre(c.nombre, c.subclase);
    if (sub?.rasgos.some(r => r.configuracionMagica)) clasesGestionadas.add(normalizar(c.nombre));
  }
  if (!clasesGestionadas.size && !(personaje.clasesLanzadoras ?? []).some(c => c.idRasgoOrigen)) return personaje;
  const clases: ClaseLanzadora[] = (personaje.clasesLanzadoras ?? []).filter(c => !c.idRasgoOrigen && !clasesGestionadas.has(normalizar(c.clase)));
  for (const r of rasgos) {
    const cfg = r.configuracionMagica!;
    const nivel = obtenerNivelEfectivoParaRasgo(personaje, r);
    if (r.activo === false || nivel < Math.max(cfg.nivelInicio, r.nivelRequerido ?? 1) || !esRasgoHabilitadoPorOpcion(r, personaje.rasgos)) continue;
    const clase = claseDeRasgo(personaje, r);
    if (clases.some(c => normalizar(c.clase) === normalizar(clase))) continue;
    clases.push({ clase, nivel, tipoLanzador: cfg.tipoLanzador, habilidadConjuro: cfg.habilidadConjuro,
      modeloConjuros: cfg.modeloConjuros, listaConjuros: cfg.listaConjuros, idRasgoOrigen: r.id });
  }
  const recursos = calcularTodosRecursosMagicos(clases, personaje.overrideEspaciosConjuro, personaje.overridePuntosConjuro);
  if (JSON.stringify(clases) === JSON.stringify(personaje.clasesLanzadoras)
    && JSON.stringify(recursos.espaciosConjuroMaximos) === JSON.stringify(personaje.espaciosConjuroMaximos)
    && personaje.esLanzador === Boolean(clases.length)) return personaje;
  return { ...personaje, clasesLanzadoras: clases, esLanzador: Boolean(clases.length), ...recursos };
}
