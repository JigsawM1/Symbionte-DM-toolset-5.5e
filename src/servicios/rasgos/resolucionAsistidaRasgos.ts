import type { PersonajeJugador } from "@/tipos";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { resolverRasgoRecurso, estaRasgoActivo } from "./utilidadesRasgos";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "./evaluadorExpresionesRasgos";
import { maximizaCuracion, maximizarDadosCuracion } from "./curacionDeclarativa";

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
    || (r.ligadoA && !estaRasgoActivo(pj, r.ligadoA))
    || (cfg.confirmacion && !solicitud.confirmado)
    || (solicitud.propio && (!cfg.permitePropio || !["hp_temporal", "curacion"].includes(opcion.tipo)))
    || (opcion.tipo === "modificador_tirada" && !Number.isSafeInteger(solicitud.tiradaOriginal))) return;
  const recurso = r.gastarDePadre ? resolverRasgoRecurso(r, pj.rasgos) : r;
  const coste = r.gastarDePadre || r.tieneUsosLimitados ? r.costeFijo ?? 1 : 0;
  if (coste && (!recurso?.tieneUsosLimitados || recurso.activo === false || recurso.recuperacionDiferida
    || (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) < coste)) return;
  const base = opcion.formula ?? r.formulaDados;
  let formula = base && (!cfg.dadosOpcionales || solicitud.incluirDados)
    ? resolverFormulaDinamica(base, pj, r.fuente, r) : undefined;
  if (formula && opcion.tipo === "curacion" && recurso && maximizaCuracion(pj, recurso.id)) formula = maximizarDadosCuracion(formula);
  if (cfg.reparto && solicitud.propio) {
    const cantidad = solicitud.cantidadPropia;
    const total = formula ? resultadoConstante(formula) : undefined;
    const limite = Math.max(0, Math.floor(pj.hpMaximo * cfg.reparto.limitePropioFraccion) - pj.hpActual);
    if (cantidad === undefined || !Number.isSafeInteger(cantidad) || cantidad < 0 || cantidad > limite || total === undefined || cantidad > total) return;
  }
  return { rasgo: r, opcion, recurso, coste, formula };
}

export function aplicarResolucionAsistida(pj: PersonajeJugador, solicitud: SolicitudResolucionAsistida, resultado?: number): PersonajeJugador | undefined {
  const cfg = prepararResolucionAsistida(pj, solicitud);
  if (!cfg || (cfg.formula && (resultado === undefined || !Number.isFinite(resultado)))) return;
  if (cfg.formula && resultadoConstante(cfg.formula) !== undefined && resultado !== resultadoConstante(cfg.formula)) return;
  const valor = Math.max(0, resultado ?? 0);
  return { ...pj,
    hpActual: solicitud.propio && cfg.opcion.tipo === "curacion"
      ? Math.min(pj.hpMaximo, pj.hpActual + (cfg.rasgo.resolucionAsistida?.reparto ? solicitud.cantidadPropia ?? 0 : valor)) : pj.hpActual,
    hpTemporal: solicitud.propio && cfg.opcion.tipo === "hp_temporal" ? Math.max(pj.hpTemporal, valor) : pj.hpTemporal,
    rasgos: cfg.coste ? pj.rasgos.map(r => r.id === cfg.recurso?.id
      ? { ...r, usosRestantes: (r.usosRestantes ?? r.usosMaximos ?? 0) - cfg.coste } : r) : pj.rasgos };
}

/** Las fórmulas constantes se resuelven sin solicitar un dado físico inexistente. */
export function resultadoConstante(formula: string): number | undefined {
  return /\d+d\d+/i.test(formula) ? undefined : evaluarExpresionNumericaSegura(formula);
}
