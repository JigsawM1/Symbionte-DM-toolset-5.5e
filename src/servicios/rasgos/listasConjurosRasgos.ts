import { rasgoMagicoHabilitado as habilitado, conjuroEnAmpliacion } from "./ampliacionesListaConjuros";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import HECHIZOS from "@/utiles/compendios/all.json";
import { coincideHechizoId } from "../comparadorHechizos";

import { calcularMaximosConjurosYTrucos, obtenerNivelMaximoConjuroPorTipoClase } from "../calculadorMagia";
import { normalizar } from "./utilidadesRasgos";

export type CatalogoEleccionesConjuros = readonly Pick<HechizoBase, "id" | "nivel" | "clases">[];
type TipoEleccion = "trucos" | "conjuros" | "preparados";

function claveEleccion(pj: PersonajeJugador, clase: string, tipo: TipoEleccion): TipoEleccion {
  return tipo === "preparados" && pj.clasesLanzadoras.find(c => normalizar(c.clase) === normalizar(clase))?.modeloConjuros !== "grimorio" ? "conjuros" : tipo;
}

export function conjuroElegidoPorClase(pj: PersonajeJugador, id: string, clase: string, tipo: TipoEleccion): boolean {
  return Object.entries(pj.eleccionesConjurosClase ?? {}).some(([c, e]) => normalizar(c) === normalizar(clase)
    && e[claveEleccion(pj, c, tipo)]?.some(v => coincideHechizoId(v, id)));
}

export function clasesGestionadasConjuros(pj: PersonajeJugador): string[] {
  return (pj.rasgos ?? []).filter(r => r.configuracionMagica && r.claseConjurosOtorgados && habilitado(pj, r)).map(r => r.claseConjurosOtorgados!);
}

export function clasesPropietariasConjuro(pj: PersonajeJugador, id: string): string[] {
  return Object.entries(pj.eleccionesConjurosClase ?? {}).filter(([, e]) => [...e.trucos, ...e.conjuros].some(v => coincideHechizoId(v, id))).map(([clase]) => clase);
}

function disponibleParaClase(pj: PersonajeJugador, h: Pick<HechizoBase, "nivel" | "clases">, clase: string): boolean {
  const c = pj.clasesLanzadoras.find(c => normalizar(c.clase) === normalizar(clase));
  return !!c && h.nivel <= obtenerNivelMaximoConjuroPorTipoClase(c.tipoLanzador, c.nivel)
    && (!!h.clases?.some(n => normalizar(n) === normalizar(c.listaConjuros ?? c.clase)) || conjuroEnAmpliacion(pj, h, clase));
}

/** Solo las nuevas elecciones inequívocas reciben procedencia; los guardados antiguos se conservan. */
export function elegirConjuroClase(pj: PersonajeJugador, id: string, tipo: TipoEleccion, clase?: string, catalogo: CatalogoEleccionesConjuros = HECHIZOS): PersonajeJugador | undefined {
  const gestionadas = clasesGestionadasConjuros(pj);
  if (!gestionadas.length && !pj.eleccionesConjurosClase) return pj;
  const h = catalogo.find(h => coincideHechizoId(h.id, id));
  if (!h || (tipo === "trucos") !== (h.nivel === 0)) return;
  const candidatas = pj.clasesLanzadoras.filter(c => disponibleParaClase(pj, h, c.clase)).map(c => c.clase);
  const elegida = clase ? candidatas.find(c => normalizar(c) === normalizar(clase)) : candidatas.length === 1 ? candidatas[0] : undefined;
  if (!elegida) return;
  const lanzador = pj.clasesLanzadoras.find(c => normalizar(c.clase) === normalizar(elegida))!;
  const elecciones = pj.eleccionesConjurosClase?.[elegida] ?? { trucos: [], conjuros: [] };
  const clave = claveEleccion(pj, elegida, tipo);
  const libro = lanzador.modeloConjuros === "grimorio";
  if (clave === "preparados" && !elecciones.conjuros.some(v => coincideHechizoId(v, id)) && !pj.conjurosConocidosIds.some(v => coincideHechizoId(v, id))) return;
  const max = calcularMaximosConjurosYTrucos([lanzador], pj.nivel);
  const otorgados = pj.rasgos.filter(r => habilitado(pj, r)).flatMap(r => r.conjurosOtorgados ?? []);
  if (!(libro && clave === "conjuros") && otorgados.some(v => coincideHechizoId(v, id))) return pj;
  const valores = elecciones[clave] ?? [];
  const yaElegido = valores.some(v => coincideHechizoId(v, id));
  const lista = tipo === "trucos" ? pj.trucosConocidosIds : pj.conjurosPreparadosIds;
  // En monoclase también cuentan los preparados heredados sin origen registrado.
  const usados = pj.clasesLanzadoras.length === 1 ? Math.max(valores.length, lista.filter(v => !otorgados.some(o => coincideHechizoId(o, v))).length) : valores.length;
  if (!(libro && clave === "conjuros") && !yaElegido && usados >= (tipo === "trucos" ? max.maxTrucos : max.maxConjuros)) return;
  return { ...pj, eleccionesConjurosClase: { ...pj.eleccionesConjurosClase, [elegida]: { ...elecciones,
    ...(libro && clave === "preparados" && !elecciones.conjuros.some(v => coincideHechizoId(v, id)) ? { conjuros: [...elecciones.conjuros, id] } : {}),
    [clave]: yaElegido ? valores : [...valores, id] } } };
}

export function retirarEleccionConjuro(pj: PersonajeJugador, id: string, claseObjetivo?: string, tipo?: TipoEleccion): PersonajeJugador {
  if (!pj.eleccionesConjurosClase) return pj;
  return { ...pj, eleccionesConjurosClase: Object.fromEntries(Object.entries(pj.eleccionesConjurosClase).map(([clase, e]) => {
    if (claseObjetivo && normalizar(clase) !== normalizar(claseObjetivo)) return [clase, e];
    const clave = tipo && claveEleccion(pj, clase, tipo);
    const quitar = (valores: string[], campo: TipoEleccion) => !clave || clave === campo || (clave === "conjuros" && campo === "preparados") ? valores.filter(v => !coincideHechizoId(v, id)) : valores;
    return [clase, { trucos: quitar(e.trucos, "trucos"), conjuros: quitar(e.conjuros, "conjuros"),
      ...(e.preparados ? { preparados: quitar(e.preparados, "preparados") } : {}) }];
  })) };
}

/** Retira exclusivamente aprendizajes registrados que pierdan su clase o ampliación. */
export function reconciliarEleccionesConjuros(pj: PersonajeJugador, catalogo: CatalogoEleccionesConjuros = HECHIZOS): PersonajeJugador {
  if (!pj.eleccionesConjurosClase) return pj;
  const retirados: string[] = [];
  const elecciones = Object.fromEntries(Object.entries(pj.eleccionesConjurosClase).map(([clase, e]) => {
    const filtrar = (ids: string[]) => ids.filter(id => {
      const h = catalogo.find(h => coincideHechizoId(h.id, id));
      // Sin definición no se puede inferir la lista o nivel de un conjuro personalizado.
      const valida = h ? disponibleParaClase(pj, h, clase) : pj.clasesLanzadoras.some(c => normalizar(c.clase) === normalizar(clase));
      if (!valida) retirados.push(id);
      return valida;
    });
    return [clase, { trucos: filtrar(e.trucos), conjuros: filtrar(e.conjuros), ...(e.preparados ? { preparados: filtrar(e.preparados) } : {}) }];
  }));
  if (!retirados.length) return pj;
  const otorgados = pj.rasgos.filter(r => habilitado(pj, r)).flatMap(r => r.conjurosOtorgados ?? []);
  const independientes = pj.aprendizajesConjurosIndependientes;
  const protegidosPreparados = Object.entries(elecciones).flatMap(([c, e]) => pj.clasesLanzadoras.find(l => normalizar(l.clase) === normalizar(c))?.modeloConjuros === "grimorio" ? e.preparados ?? [] : e.conjuros);
  const conservar = (ids: string[], protegidos: string[]) => ids.filter(id => !retirados.some(v => coincideHechizoId(v, id))
    || [...protegidos, ...otorgados].some(v => coincideHechizoId(v, id)));
  return { ...pj, eleccionesConjurosClase: elecciones,
    conjurosPreparadosIds: conservar(pj.conjurosPreparadosIds, [...protegidosPreparados, ...(independientes?.conjuros ?? [])]),
    conjurosConocidosIds: conservar(pj.conjurosConocidosIds, [...Object.values(elecciones).flatMap(e => e.conjuros), ...(independientes?.conjuros ?? [])]),
    trucosConocidosIds: conservar(pj.trucosConocidosIds, [...Object.values(elecciones).flatMap(e => e.trucos), ...(independientes?.trucos ?? [])]) };
}
