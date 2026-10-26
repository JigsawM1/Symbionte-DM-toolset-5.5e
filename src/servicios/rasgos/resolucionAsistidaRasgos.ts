import type { PersonajeJugador } from "@/tipos";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { resolverRasgoRecurso, estaRasgoActivo } from "./utilidadesRasgos";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "./evaluadorExpresionesRasgos";

export interface SolicitudResolucionAsistida {
  idRasgo: string;
  idOpcion: string;
  incluirDados: boolean;
  propio: boolean;
  confirmado: boolean;
}

/** La misma elegibilidad se aplica al abrir el diálogo y al confirmar contra la ficha vigente. */
export function prepararResolucionAsistida(pj: PersonajeJugador, solicitud: SolicitudResolucionAsistida) {
  const r = pj.rasgos.find(r => r.id === solicitud.idRasgo);
  const cfg = r?.resolucionAsistida;
  const opcion = cfg?.opciones.find(o => o.id === solicitud.idOpcion);
  if (!r || !cfg || !opcion || !rasgoMagicoHabilitado(pj, r)
    || (r.ligadoA && !estaRasgoActivo(pj, r.ligadoA))
    || (cfg.confirmacion && !solicitud.confirmado)
    || (solicitud.propio && (!cfg.permitePropio || opcion.tipo !== "hp_temporal"))) return;
  const recurso = r.gastarDePadre ? resolverRasgoRecurso(r, pj.rasgos) : r;
  const coste = r.gastarDePadre || r.tieneUsosLimitados ? r.costeFijo ?? 1 : 0;
  if (coste && (!recurso?.tieneUsosLimitados || recurso.activo === false || recurso.recuperacionDiferida
    || (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) < coste)) return;
  const formula = r.formulaDados && (!cfg.dadosOpcionales || solicitud.incluirDados)
    ? resolverFormulaDinamica(r.formulaDados, pj, r.fuente, r) : undefined;
  return { rasgo: r, opcion, recurso, coste, formula };
}

export function aplicarResolucionAsistida(pj: PersonajeJugador, solicitud: SolicitudResolucionAsistida, resultado?: number): PersonajeJugador | undefined {
  const cfg = prepararResolucionAsistida(pj, solicitud);
  if (!cfg || (cfg.formula && (resultado === undefined || !Number.isFinite(resultado)))) return;
  const valor = resultado ?? 0;
  return { ...pj,
    hpTemporal: solicitud.propio ? Math.max(pj.hpTemporal, valor) : pj.hpTemporal,
    rasgos: cfg.coste ? pj.rasgos.map(r => r.id === cfg.recurso?.id
      ? { ...r, usosRestantes: (r.usosRestantes ?? r.usosMaximos ?? 0) - cfg.coste } : r) : pj.rasgos };
}

/** Las fórmulas constantes se resuelven sin solicitar un dado físico inexistente. */
export function resultadoConstante(formula: string): number | undefined {
  return /\d+d\d+/i.test(formula) ? undefined : evaluarExpresionNumericaSegura(formula);
}
