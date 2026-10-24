import type { PersonajeJugador } from "@/tipos";
import { resolverEscaladosRasgo } from "../clases/escaladosRasgos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { normalizarMagiaRasgos } from "./magiaRasgos";
import { normalizarCondicionesRasgos, claveEstado } from "./estadoCondicionesRasgos";
import { construirRasgosDesdeSelectores, materializaSelector, seleccionesValidas } from "./seleccionesRasgos";
import { reconciliarConjurosRasgos } from "./reconciliarConjurosRasgos";
import { retirarConcentracionRestringida } from "./restriccionesRasgos";
import { aplicarEventosActivacion } from "./activacionDeclarativa";
import { reconciliarEleccionesConjuros, type CatalogoEleccionesConjuros } from "./listasConjurosRasgos";
import { hidratarSelectoresConjuros } from "./catalogoSelectoresConjuros";
import { reconciliarIntentoRasgo } from "./resolucionesRasgos";

/** Resuelve las mismas tablas para catálogo y homebrew, conservando el gasto de recursos. */
export function normalizarMecanicasRasgos(anterior: PersonajeJugador | undefined, pj: PersonajeJugador, catalogo?: CatalogoEleccionesConjuros): PersonajeJugador {
  if (catalogo) pj = { ...pj, rasgos: hidratarSelectoresConjuros(pj.rasgos, catalogo) };
  pj = { ...pj, rasgos: pj.rasgos.map(r => r.conjurosDesdeSelectores ? { ...r, conjurosOtorgados: r.selectores?.flatMap(s => seleccionesValidas(s, obtenerNivelEfectivoParaRasgo(pj, r), pj)) ?? [] } : r) };
  let cambio = false;
  const rasgos = (pj.rasgos ?? []).map(r => {
    // El catálogo ya utiliza el mismo resolutor durante su construcción por nivel.
    if (!r.personalizado && r.origen !== "personalizado") {
      // El builder de catálogo no recibe características: estos máximos necesitan la ficha real.
      if (!r.tieneUsosLimitados || r.escaladoUsos?.tipo !== "por_modificador" || !r.escaladoUsos.modificador) return r;
      const stat = r.escaladoUsos.modificador as keyof PersonajeJugador["caracteristicas"];
      const maximo = Math.max(r.escaladoUsos.minimo, Math.floor(((pj.overridesFijos?.[stat] ?? pj.caracteristicas?.[stat] ?? 10) - 10) / 2));
      if (maximo === r.usosMaximos) return r;
      const anteriorMaximo = r.usosMaximos ?? maximo;
      const disponibles = r.usosRestantes ?? anteriorMaximo;
      cambio = true;
      return { ...r, usosMaximos: maximo, usosRestantes: maximo >= anteriorMaximo
        ? Math.max(0, maximo - Math.max(0, anteriorMaximo - disponibles)) : Math.min(maximo, disponibles) };
    }
    if (!r.escaladoUsos && !r.escaladoFormulaDados && !r.escaladoRecuperacion && !r.escaladoEfectos && !r.escaladoConjurosOtorgados
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
    const actualizado = { ...r, formulaDados: escalados.formulaDados, conjurosOtorgados: escalados.conjurosOtorgados,
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
  let actual = normalizarCondicionesRasgos(cambio ? { ...pj, rasgos } : pj);
  const retirados = (actual.efectosActivos ?? []).filter(e => e.idRasgoOrigen && !actual.rasgos.some(r => r.id === e.idRasgoOrigen));
  if (retirados.length) actual = { ...actual,
    efectosActivos: actual.efectosActivos.filter(e => !retirados.includes(e)),
    condicionesActivas: actual.condicionesActivas.filter(c => !retirados.some(e => claveEstado(e.nombre) === claveEstado(c))) };
  const mismaBuild = !anterior || (anterior.clase === actual.clase && anterior.subclase === actual.subclase
    && anterior.nivel === actual.nivel && JSON.stringify(anterior.clases) === JSON.stringify(actual.clases));
  if (actual.rasgos.some(r => r.idSelectorOrigen || r.selectores?.some(materializaSelector))) {
    const proyectados = construirRasgosDesdeSelectores(actual);
    if (JSON.stringify(proyectados) !== JSON.stringify(actual.rasgos)) {
      actual = { ...actual, rasgos: proyectados, ...(mismaBuild ? reconciliarConjurosRasgos(anterior ?? pj, proyectados) : {}) };
    }
    if (anterior && mismaBuild && JSON.stringify(anterior.rasgos) !== JSON.stringify(actual.rasgos))
      actual = { ...actual, ...reconciliarConjurosRasgos(anterior, actual.rasgos) };
  }
  const arcanos = actual.rasgos.flatMap(r => (r.selectores ?? []).filter(s => s.destinoConjuros === "arcano_mistico"));
  if (arcanos.length) {
    const ids = arcanos.flatMap(s => s.valorActual.map(id => `${s.nivelConjuro}:${id}`));
    if (JSON.stringify(ids) !== JSON.stringify(actual.arcanoMisticoIds)) actual = { ...actual, arcanoMisticoIds: ids };
  }
  const legado = actual.rasgos.find(r => r.recursoLegado === "puntos_hechiceria");
  if (legado) actual = { ...actual, puntosHechiceriaMaximos: legado.usosMaximos ?? 0,
    puntosHechiceriaActuales: legado.usosRestantes ?? legado.usosMaximos ?? 0 };
  return reconciliarIntentoRasgo(reconciliarEleccionesConjuros(retirarConcentracionRestringida(normalizarMagiaRasgos(anterior, aplicarEventosActivacion(anterior, actual))), catalogo));
}
