import type { PersonajeJugador, SelectorRasgo, OpcionSelector, RasgoPersonaje } from "@/tipos";
import HECHIZOS from "@/utiles/compendios/all.json";
import { coincideHechizoId } from "../comparadorHechizos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { resolverEscaladosRasgo } from "../clases/escaladosRasgos";
import { fusionarEstadoRasgo } from "./fusionarEstadoRasgo";

type HechizoCatalogo = (typeof HECHIZOS)[number];
const hechizosPorId = new Map<string, HechizoCatalogo>();
for (const hechizo of HECHIZOS) {
  if (!hechizosPorId.has(hechizo.id)) hechizosPorId.set(hechizo.id, hechizo);
}
const coincidenciasCompatibles = new Map<string, HechizoCatalogo | undefined>();

/** El catálogo es estático; nombres y alias antiguos solo requieren una búsqueda inicial. */
function obtenerHechizoCatalogo(id: string): HechizoCatalogo | undefined {
  const canonico = hechizosPorId.get(id);
  if (canonico) return canonico;
  if (!coincidenciasCompatibles.has(id)) {
    coincidenciasCompatibles.set(id, HECHIZOS.find(h => coincideHechizoId(h.id, id)));
  }
  return coincidenciasCompatibles.get(id);
}

/** El ID de instancia y su elección son independientes de la identidad del catálogo. */
export function descomponerSeleccion(valor: string): { base: string; instancia: string; argumento?: string } {
  const [instancia, argumento] = valor.split(":");
  return { base: instancia.split("__")[0], instancia, argumento };
}

export function opcionesElegiblesConjuros(selector: SelectorRasgo, pj?: PersonajeJugador): OpcionSelector[] {
  const filtro = selector.filtroConjuros;
  if (!filtro) return selector.opciones;
  return selector.opciones.filter(op => {
    const h = obtenerHechizoCatalogo(op.id);
    if (!h) return false;
    if (filtro.excluirPreparados && !selector.valorActual.some(id=>coincideHechizoId(id,h.id))
      && [...(pj?.conjurosPreparadosIds ?? []),...(pj?.conjurosSiemprePreparadosIds ?? []),...(pj?.trucosConocidosIds ?? [])].some(id=>coincideHechizoId(id,h.id))) return false;
    if (filtro.clase && !h.clases.some(c => c.toLowerCase() === filtro.clase?.toLowerCase()) && !pj?.rasgos.some(r =>
      r.activo !== false && r.claseConjurosOtorgados === filtro.clase && r.selectores?.some(s => s.tipoSelector === "conjuro"
        && s.destinoConjuros !== "referencia" && s.valorActual.some(id => coincideHechizoId(id,h.id))))) return false;
    if (filtro.soloConocidos && (!pj || !(pj.trucosConocidosIds ?? []).some(id => coincideHechizoId(id, h.id)))) return false;
    if (filtro.requiereDano && !h.dadosDaño) return false;
    if (filtro.requiereAtaque && !h.requiereAtaque) return false;
    if (filtro.alcanceMinimo && (parseInt(h.alcance, 10) || 0) < filtro.alcanceMinimo) return false;
    return true;
  });
}

/** Requisitos ejecutables compartidos por almacén, proyección y UI. */
export function seleccionOpcionValida(selector: SelectorRasgo, valor: string, seleccion: string[], nivel: number, pj?: PersonajeJugador): boolean {
  const { base, argumento } = descomponerSeleccion(valor);
  const op = opcionesElegiblesConjuros(selector, pj).find(o => o.id === base);
  if (!op || (op.nivelMinimo ?? 1) > nivel) return false;
  if (op.selectores?.some(s => s.filtroConjuros && !opcionesElegiblesConjuros(s, pj).length)) return false;
  if (op.requisitoInvocacion && !seleccion.some(v => descomponerSeleccion(v).base === op.requisitoInvocacion)) return false;
  const iguales = seleccion.filter(v => descomponerSeleccion(v).base === base);
  if (!op.repetible && iguales.length > 1) return false;
  if (op.repetible && argumento && iguales.filter(v => descomponerSeleccion(v).argumento === argumento).length > 1) return false;
  if (argumento && op.selectores?.[0] && !opcionesElegiblesConjuros(op.selectores[0], pj).some(o => coincideHechizoId(o.id, argumento) || o.id === argumento)) return false;
  return true;
}

export function seleccionesValidas(selector: SelectorRasgo, nivel: number, pj?: PersonajeJugador): string[] {
  let valores = selector.valorActual;
  // Una cadena de requisitos puede tener más de una generación.
  for (let i = 0; i <= valores.length; i++) {
    const siguientes = valores.filter(v => seleccionOpcionValida(selector, v, valores, nivel, pj));
    if (siguientes.length === valores.length) return siguientes;
    valores = siguientes;
  }
  return valores;
}

/** Materializa las opciones con estado propio; todos sus metadatos llegan a los consumidores de rasgos. */
export function construirRasgosDesdeSelectores(pj: PersonajeJugador, anteriores: RasgoPersonaje[] = pj.rasgos): RasgoPersonaje[] {
  const bases = pj.rasgos.filter(r => !r.idSelectorOrigen);
  const resultado = [...bases];
  const estados = new Map(anteriores.map(r => [r.id, r]));
  const concesionesPrevias = anteriores.filter(r => r.idSelectorOrigen && bases.some(p => p.id === r.ligadoA
    && p.selectores?.some(s => s.id === r.idSelectorOrigen && s.valorActual.includes(r.requiereOpcion ?? "")))).map(r => {
      const padre = bases.find(p => p.id === r.ligadoA);
      const op = padre?.selectores?.find(s => s.id === r.idSelectorOrigen)?.opciones.find(o => o.id === descomponerSeleccion(r.requiereOpcion ?? "").base);
      return { ...op, ...r };
    });
  const contextoElegibilidad = { ...pj, rasgos: [...bases, ...concesionesPrevias] };
  const proyectar = (padre: RasgoPersonaje, selector: SelectorRasgo, valor: string) => {
    const { base, argumento } = descomponerSeleccion(valor);
    const op = selector.opciones.find(o => o.id === base);
    if (!op) return;
    const nivel = obtenerNivelEfectivoParaRasgo(pj, padre);
    const selectores = structuredClone(op.selectores ?? []);
    if (argumento && selectores[0]) selectores[0].valorActual = [argumento];
    const escalados = resolverEscaladosRasgo(op, nivel, op.efectos ?? [], selectores);
    let hijo: RasgoPersonaje = {
      ...op, id: `${padre.id}_${valor}`, idSelectorOrigen: selector.id,
      nombre: op.nombre, descripcion: op.descripcion, origen: selector.tipoSelector === "dote" ? "dote" : padre.origen,
      fuente: padre.fuente, tipoAccion: op.tipoAccion ?? "pasivo", nivelRequerido: op.nivelMinimo ?? padre.nivelRequerido,
      tieneUsosLimitados: !!op.tieneUsosLimitados, usosMaximos: op.usosMaximos, usosRestantes: op.usosMaximos,
      recuperacion: op.recuperacion ?? "ninguno", personalizado: false, activo: !op.esActivable,
      ligadoA: padre.id, requiereOpcion: valor, formulaDados: escalados.formulaDados, efectos: escalados.efectos,
      selectores: escalados.selectores, notas: ""
    };
    hijo = fusionarEstadoRasgo(hijo, estados.get(hijo.id));
    resultado.push(hijo);
    for (const sel of hijo.selectores ?? []) if (sel.tipoSelector === "dote") {
      for (const elegida of sel.valorActual) proyectar(hijo, sel, elegida);
    }
  };
  for (const padre of bases) for (const sel of padre.selectores ?? []) if (sel.tipoSelector === "invocacion") {
    for (const valor of seleccionesValidas(sel, obtenerNivelEfectivoParaRasgo(pj, padre), contextoElegibilidad)) proyectar(padre, sel, valor);
  }
  return resultado;
}
