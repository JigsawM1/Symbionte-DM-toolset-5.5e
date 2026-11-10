import type { PersonajeJugador } from "@/tipos";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { resolverRasgoRecurso, estaRasgoActivo } from "./utilidadesRasgos";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "./evaluadorExpresionesRasgos";
import { maximizaCuracion, maximizarDadosCuracion } from "./curacionDeclarativa";
import { calcularEstadisticasPersonaje } from "../personajes/calculadorEstadisticasPersonaje";
import { obtenerBestiaFormaActiva } from "../reglasFormaSalvaje";

export interface DanoIntegrado {
  formula: string;
  tipoDano: string;
}

export interface SolicitudResolucionAsistida {
  idRasgo: string;
  idOpcion: string;
  incluirDados: boolean;
  propio: boolean;
  confirmado: boolean;
  cantidadPropia?: number;
  tiradaOriginal?: number;
}

/** La misma elegibilidad se aplica al abrir el diálogo y al confirmar contra la ficha vigente. */
export function prepararResolucionAsistida(pj: PersonajeJugador, solicitud: SolicitudResolucionAsistida) {
  const r = pj.rasgos.find(r => r.id === solicitud.idRasgo);
  const cfg = r?.resolucionAsistida;
  const opcion = cfg?.opciones.find(o => o.id === solicitud.idOpcion);
  if (!r || !cfg || !opcion || !rasgoMagicoHabilitado(pj, r)
    || (cfg.requiereActivo && !r.activo) || (cfg.soloAtaqueBestia && !obtenerBestiaFormaActiva(pj))
    || (opcion.resultadoTabla && r.resultadoTabla?.idFila !== opcion.resultadoTabla)
    || (r.ligadoA && !estaRasgoActivo(pj, r.ligadoA))
    || (cfg.confirmacion && !solicitud.confirmado)
    || (solicitud.propio && (!cfg.permitePropio || (!cfg.curacionSimultanea && !["hp_temporal", "curacion"].includes(opcion.tipo))))
    || (opcion.tipo === "modificador_tirada" && !opcion.resultadoTabla && !Number.isSafeInteger(solicitud.tiradaOriginal))) return;
  const recurso = r.gastarDePadre ? resolverRasgoRecurso(r, pj.rasgos) : r;
  const coste = (r.gastarDePadre && !r.esActivable) || r.tieneUsosLimitados ? r.costeFijo ?? 1 : 0;
  if (coste && (!recurso?.tieneUsosLimitados || (recurso.activo === false && !r.idRasgoRecurso) || recurso.recuperacionDiferida
    || (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) < coste)) return;
  const padre = r.heredarDadosPadre && pj.rasgos.find(p => p.id === r.ligadoA);
  const base = opcion.formula ?? (padre ? padre.formulaDados : r.formulaDados);
  const modificadores = base?.includes("sabiduria") ? calcularEstadisticasPersonaje(pj).modificadores : undefined;
  let formula = base && (!cfg.dadosOpcionales || solicitud.incluirDados)
    ? resolverFormulaDinamica(base, pj, r.fuente, r, modificadores) : undefined;
  if (formula && opcion.tipo === "curacion" && recurso && maximizaCuracion(pj, recurso.id)) formula = maximizarDadosCuracion(formula);
  if (cfg.reparto && solicitud.propio) {
    const cantidad = solicitud.cantidadPropia;
    const total = formula ? resultadoConstante(formula) : undefined;
    const limite = Math.max(0, Math.floor(pj.hpMaximo * cfg.reparto.limitePropioFraccion) - pj.hpActual);
    if (cantidad === undefined || !Number.isSafeInteger(cantidad) || cantidad < 0 || cantidad > limite || total === undefined || cantidad > total) return;
  }
  return { rasgo: r, opcion, recurso, coste, formula };
}

/** El daño integrado añade un grupo a la tirada del arma. Sus opciones se limitan a daño sin gasto propio. */
export function prepararDanoIntegrado(pj: PersonajeJugador, solicitud: SolicitudResolucionAsistida): DanoIntegrado | undefined {
  const cfg = prepararResolucionAsistida(pj, solicitud);
  if (cfg?.rasgo.resolucionAsistida?.integrarEnDanoDeArma && !cfg.coste && cfg.opcion.tipo === "dano" && cfg.formula && cfg.opcion.tipoDano)
    return { formula: cfg.formula, tipoDano: cfg.opcion.tipoDano };
  return undefined;
}

export function aplicarResolucionAsistida(pj: PersonajeJugador, solicitud: SolicitudResolucionAsistida, resultado?: number, curacion?: number): PersonajeJugador | undefined {
  const cfg = prepararResolucionAsistida(pj, solicitud);
  if (!cfg || (cfg.formula && (resultado === undefined || !Number.isFinite(resultado)))) return;
  if (cfg.formula && resultadoConstante(cfg.formula) !== undefined && resultado !== resultadoConstante(cfg.formula)) return;
  const simultanea = cfg.rasgo.resolucionAsistida?.curacionSimultanea;
  if (simultanea && (curacion === undefined || !Number.isFinite(curacion) || curacion < 0)) return;
  const valor = Math.max(0, resultado ?? 0);
  return { ...pj,
    hpActual: solicitud.propio && (cfg.opcion.tipo === "curacion" || simultanea)
      ? Math.min(pj.hpMaximo, pj.hpActual + (simultanea ? curacion ?? 0 : cfg.rasgo.resolucionAsistida?.reparto ? solicitud.cantidadPropia ?? 0 : valor)) : pj.hpActual,
    hpTemporal: solicitud.propio && cfg.opcion.tipo === "hp_temporal" ? Math.max(pj.hpTemporal, valor) : pj.hpTemporal,
    rasgos: cfg.coste ? pj.rasgos.map(r => r.id === cfg.recurso?.id
      ? { ...r, usosRestantes: (r.usosRestantes ?? r.usosMaximos ?? 0) - cfg.coste } : r) : pj.rasgos };
}

/** Las fórmulas constantes se resuelven sin solicitar un dado físico inexistente. */
export function resultadoConstante(formula: string): number | undefined {
  return /\d+d\d+/i.test(formula) ? undefined : evaluarExpresionNumericaSegura(formula);
}
