import type { PersonajeJugador } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion, resolverRasgoRecurso } from "./utilidadesRasgos";

export type OperacionAvanzadaRasgo =
  | { tipo: "comprarDados" | "gastarDados"; idRasgo: string; cantidad: number }
  | { tipo: "usarOpcion"; idRasgo: string; gratis?: boolean }
  | { tipo: "finalizarPreparacion"; idRasgo: string }
  | { tipo: "guardarTabla"; idRasgo: string; texto: string }
  | { tipo: "enviarTabla"; idRasgo: string };

/** Intercambios indivisibles sobre la ficha vigente, también para rasgos personalizados. */
export function operarCapacidadRasgo(pj: PersonajeJugador, op: OperacionAvanzadaRasgo): PersonajeJugador | undefined {
  const r = pj.rasgos.find(x => x.id === op.idRasgo);
  if (!r || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1) || !esRasgoHabilitadoPorOpcion(r, pj.rasgos)) return;
  if (op.tipo === "finalizarPreparacion") {
    const restantesPropios = r.usosRestantes ?? r.usosMaximos ?? 0;
    if (!r.activo || !r.gastarUsoTrasTirada || restantesPropios < 1) return;
    return { ...pj, rasgos: pj.rasgos.map(x => x === r ? { ...x, activo: false, usosRestantes: restantesPropios - 1 } : x) };
  }
  if (r.activo === false && !r.esActivable) return;
  const recurso = resolverRasgoRecurso(r, pj.rasgos);
  const disponibles = recurso?.usosRestantes ?? recurso?.usosMaximos ?? 0;
  if (op.tipo === "comprarDados" || op.tipo === "gastarDados") {
    const cfg = r.reservaDados;
    if (!cfg || !Number.isInteger(op.cantidad) || op.cantidad < 1 || op.cantidad > cfg.maximo) return;
    if (op.tipo === "gastarDados") {
      if (op.cantidad > (r.dadosReserva ?? 0)) return;
      return { ...pj, rasgos: pj.rasgos.map(x => x === r ? { ...x, dadosReserva: (x.dadosReserva ?? 0) - op.cantidad } : x) };
    }
    const coste = cfg.costePorDado * op.cantidad;
    if (!recurso?.tieneUsosLimitados || recurso.activo === false || disponibles < coste) return;
    return { ...pj, rasgos: pj.rasgos.map(x => x === r && x === recurso
      ? { ...x, dadosReserva: op.cantidad, usosRestantes: disponibles - coste }
      : x === r ? { ...x, dadosReserva: op.cantidad }
      : x === recurso ? { ...x, usosRestantes: disponibles - coste } : x) };
  }
  if (op.tipo === "usarOpcion") {
    if (!r.gastarDePadre || r.esActivable) return;
    if (op.gratis) {
      const cfg = r.usoGratuitoCondicionado;
      if (!cfg || obtenerNivelEfectivoParaRasgo(pj, r) < cfg.nivelMinimo || !pj.rasgos.some(x => x.id === cfg.idRasgoActivo && x.activo)) return;
      return { ...pj };
    }
    const coste = r.costeFijo ?? 1;
    if (!recurso?.tieneUsosLimitados || recurso.activo === false || disponibles < coste) return;
    return { ...pj, rasgos: pj.rasgos.map(x => x === recurso ? { ...x, usosRestantes: disponibles - coste } : x) };
  }
  if (!r.tablaAleatoria) return;
  if (op.tipo === "enviarTabla") {
    if (!r.resultadoTabla) return;
    return { ...pj, rasgos: pj.rasgos.map(x => x === r ? { ...x, resultadoTabla: { ...x.resultadoTabla!, enviado: true } } : x) };
  }
  if (op.tipo === "guardarTabla") {
    if (r.resultadoTabla && !r.resultadoTabla.enviado) return;
    const recarga = r.tablaAleatoria.modo === "recargar";
    const restantesPropios = r.usosRestantes ?? r.usosMaximos ?? 0;
    if (r.tieneUsosLimitados && !recarga && restantesPropios < 1) return;
    if (recarga && (!r.tieneUsosLimitados || r.activo || restantesPropios >= (r.usosMaximos ?? 1))) return;
    return { ...pj, rasgos: pj.rasgos.map(x => x === r ? { ...x,
      usosRestantes: r.tieneUsosLimitados ? recarga ? r.usosMaximos : restantesPropios - 1 : r.usosRestantes,
      resultadoTabla: { texto: op.texto, enviado: false } } : x) };
  }
  return undefined;
}
