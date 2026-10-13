import type { PersonajeJugador } from "@/tipos";
import { resolverEscaladosRasgo } from "../clases/escaladosRasgos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { normalizarMagiaRasgos } from "./magiaRasgos";
import { normalizarCondicionesRasgos } from "./estadoCondicionesRasgos";

/** Resuelve las mismas tablas para catálogo y homebrew, conservando el gasto de recursos. */
export function normalizarMecanicasRasgos(anterior: PersonajeJugador | undefined, pj: PersonajeJugador): PersonajeJugador {
  let cambio = false;
  const rasgos = (pj.rasgos ?? []).map(r => {
    // El catálogo ya utiliza el mismo resolutor durante su construcción por nivel.
    if (!r.personalizado && r.origen !== "personalizado") return r;
    if (!r.escaladoUsos && !r.escaladoFormulaDados && !r.escaladoRecuperacion && !r.escaladoEfectos
      && !r.selectores?.some(s => s.escaladoMaxSelecciones || s.opcionesDinamicas)) return r;
    const selectoresBase = (r.selectores ?? []).map(s => {
      const dinamicas = new Set(s.opcionesDinamicas?.flatMap(g => g.opciones.map(o => o.id)) ?? []);
      return { ...s, opciones: s.opciones.filter(o => !dinamicas.has(o.id)) };
    });
    const escalados = resolverEscaladosRasgo(r, obtenerNivelEfectivoParaRasgo(pj, r), r.efectos ?? [], selectoresBase);
    let maximo = escalados.usosEscalados ?? r.usosMaximos;
    if (r.escaladoUsos?.tipo === "por_modificador" && r.escaladoUsos.modificador) {
      const stat = r.escaladoUsos.modificador as keyof PersonajeJugador["caracteristicas"];
      maximo = Math.max(r.escaladoUsos.minimo, Math.floor(((pj.overridesFijos?.[stat] ?? pj.caracteristicas?.[stat] ?? 10) - 10) / 2));
    }
    const actualizado = { ...r, formulaDados: escalados.formulaDados,
      recuperacion: (escalados.recuperacion ?? r.recuperacion) as typeof r.recuperacion, efectos: escalados.efectos,
      usosMaximos: r.tieneUsosLimitados ? maximo : r.usosMaximos,
      usosRestantes: r.tieneUsosLimitados && maximo !== undefined
        ? Math.max(0, maximo - Math.max(0, (r.usosMaximos ?? maximo) - (r.usosRestantes ?? r.usosMaximos ?? maximo))) : r.usosRestantes,
      selectores: escalados.selectores.map(s => ({ ...s, valorActual: s.modo === "consulta" ? [] : s.valorActual
        .filter(id => s.opciones.some(o => o.id === id || o.id === id.split(/:|__/)[0])).slice(0, s.maxSelecciones) })) };
    if (JSON.stringify(r) === JSON.stringify(actualizado)) return r;
    cambio = true;
    return actualizado;
  });
  const actual = normalizarCondicionesRasgos(cambio ? { ...pj, rasgos } : pj);
  return normalizarMagiaRasgos(anterior, actual);
}
