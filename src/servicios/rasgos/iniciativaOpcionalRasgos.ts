import type { PersonajeJugador } from "@/tipos";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { normalizar, resolverRasgoRecurso } from "./utilidadesRasgos";
import { claveEstado } from "./estadoCondicionesRasgos";

/** Restaura únicamente los disparadores elegidos por el consumidor, sin repetir sus gastos. */
export function restaurarUsosIniciativa(pj: PersonajeJugador, disparadores = pj.rasgos.filter(r =>
  r.dispararAlTirarIniciativa && r.restaurarUsosAlActivar && rasgoMagicoHabilitado(pj, r))): PersonajeJugador {
  let actual = pj;
  for (const r of disparadores) {
    const cfg = r.restaurarUsosAlActivar!;
    if (cfg.siNoDisparado && disparadores.some(o => normalizar(o.id) === normalizar(cfg.siNoDisparado) || normalizar(o.nombre) === normalizar(cfg.siNoDisparado))) continue;
    actual = { ...actual, rasgos: actual.rasgos.map(t => {
      if (normalizar(t.id) !== normalizar(cfg.idRasgoObjetivo) && normalizar(t.nombre) !== normalizar(cfg.idRasgoObjetivo)) return t;
      const usos = t.usosRestantes ?? t.usosMaximos ?? 0;
      if (cfg.soloSiMenorOIgual !== undefined && usos > cfg.soloSiMenorOIgual) return t;
      const maximo = t.usosMaximos ?? t.usosRestantes ?? 1;
      return { ...t, usosRestantes: Math.min(maximo, cfg.hastaCantidad !== undefined ? Math.max(usos, cfg.hastaCantidad)
        : cfg.cantidad === "maximo" ? maximo : usos + (cfg.cantidad ?? 0)) };
    }) };
  }
  return actual;
}

/** Proyecta el orden elegido sin modificar recursos hasta que la tirada se ha emitido. */
export function resolverIniciativaOpcional(pj: PersonajeJugador, idRasgo: string, recuperarAntes: boolean): PersonajeJugador | undefined {
  const r = pj.rasgos.find(r => r.id === idRasgo && r.iniciativaOpcional && rasgoMagicoHabilitado(pj, r));
  if (!r || r.desactivarConCondiciones?.some(c => pj.condicionesActivas.some(a => claveEstado(a) === claveEstado(c)))) return;
  const actual = recuperarAntes ? restaurarUsosIniciativa(pj) : pj;
  const recurso = resolverRasgoRecurso(r, actual.rasgos);
  const coste = r.costeFijo ?? 1;
  if (!recurso || recurso.activo === false || (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) < coste) return;
  const gastado = { ...actual, rasgos: actual.rasgos.map(x => x.id === recurso.id ? { ...x, usosRestantes: (x.usosRestantes ?? x.usosMaximos ?? 0) - coste } : x) };
  return recuperarAntes ? gastado : restaurarUsosIniciativa(gastado);
}
