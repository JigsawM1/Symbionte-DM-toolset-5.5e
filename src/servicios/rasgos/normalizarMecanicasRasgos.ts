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
import { registrarCuracionAlFinalizar } from "./curacionDeclarativa";
import { calcularEstadisticasPersonaje } from "../personajes/calculadorEstadisticasPersonaje";

/** Resuelve las mismas tablas para catálogo y homebrew, conservando el gasto de recursos. */
export function normalizarMecanicasRasgos(anterior: PersonajeJugador | undefined, pj: PersonajeJugador, catalogo?: CatalogoEleccionesConjuros): PersonajeJugador {
  if (catalogo) pj = { ...pj, rasgos: hidratarSelectoresConjuros(pj.rasgos, catalogo) };
  pj = { ...pj, rasgos: pj.rasgos.map(r => r.conjurosDesdeSelectores ? { ...r, conjurosOtorgados: r.selectores?.flatMap(s => seleccionesValidas(s, obtenerNivelEfectivoParaRasgo(pj, r), pj)) ?? [] } : r) };
  let cambio = false;
  let modificadores: ReturnType<typeof calcularEstadisticasPersonaje>["modificadores"] | undefined;
  const rasgos = (pj.rasgos ?? []).map(r => {
    // El catálogo ya utiliza el mismo resolutor durante su construcción por nivel.
    if (!r.personalizado && r.origen !== "personalizado") {
      // El builder de catálogo no recibe características: estos máximos necesitan la ficha real.
      if (!r.tieneUsosLimitados || r.escaladoUsos?.tipo !== "por_modificador" || !r.escaladoUsos.modificador) return r;
      const stat = r.escaladoUsos.modificador as keyof PersonajeJugador["caracteristicas"];
      modificadores ??= calcularEstadisticasPersonaje(pj).modificadores;
      const maximo = Math.max(r.escaladoUsos.minimo, modificadores[stat] ?? 0);
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
      modificadores ??= calcularEstadisticasPersonaje(pj).modificadores;
      maximo = Math.max(r.escaladoUsos.minimo, modificadores[stat] ?? 0);
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
  const antes = anterior ?? pj;
  const tieneProyecciones = (ficha: PersonajeJugador) => ficha.rasgos.some(r => r.idSelectorOrigen || r.selectores?.some(materializaSelector));
  const proyecta = tieneProyecciones(actual);
  if (proyecta) {
    const rasgosProyectados = construirRasgosDesdeSelectores(actual);
    if (JSON.stringify(rasgosProyectados) !== JSON.stringify(actual.rasgos)) actual = { ...actual, rasgos: rasgosProyectados };
  }
  const hayConcesiones = actual.rasgos.some(r => r.progresionConcesion) || antes.rasgos.some(r => r.progresionConcesion);
  if (hayConcesiones || ((proyecta || tieneProyecciones(antes)) && JSON.stringify(antes.rasgos) !== JSON.stringify(actual.rasgos))) {
    actual = { ...actual, ...reconciliarConjurosRasgos(antes, actual.rasgos, actual) };
  }
  const arcanos = actual.rasgos.flatMap(r => (r.selectores ?? []).filter(s => s.destinoConjuros === "arcano_mistico"));
  if (arcanos.length) {
    const ids = arcanos.flatMap(s => s.valorActual.map(id => `${s.nivelConjuro}:${id}`));
    if (JSON.stringify(ids) !== JSON.stringify(actual.arcanoMisticoIds)) actual = { ...actual, arcanoMisticoIds: ids };
  }
  const legado = actual.rasgos.find(r => r.recursoLegado === "puntos_hechiceria");
  if (legado) actual = { ...actual, puntosHechiceriaMaximos: legado.usosMaximos ?? 0,
    puntosHechiceriaActuales: legado.usosRestantes ?? legado.usosMaximos ?? 0 };
  return registrarCuracionAlFinalizar(anterior, reconciliarIntentoRasgo(reconciliarEleccionesConjuros(retirarConcentracionRestringida(normalizarMagiaRasgos(anterior, aplicarEventosActivacion(anterior, actual))), catalogo)));
}
