import type { PersonajeJugador, RasgoPersonaje, ResultadoTabla } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion, resolverRasgoRecurso } from "./utilidadesRasgos";
import { resolverTablaRasgo } from "./tablasAleatoriasRasgos";

export type OperacionAvanzadaRasgo =
  | { tipo: "comprarDados" | "gastarDados"; idRasgo: string; cantidad: number }
  | { tipo: "usarOpcion"; idRasgo: string; gratis?: boolean }
  | { tipo: "finalizarPreparacion"; idRasgo: string }
  | {
      tipo: "guardarTabla";
      idRasgo: string;
      texto: string;
      detalle: Partial<ResultadoTabla> & { idFila: string };
    }
  | { tipo: "enviarTabla"; idRasgo: string; idResultado?: string; textoResultado?: string };

/** Intercambios indivisibles sobre la ficha vigente, también para rasgos personalizados. */
export function operarCapacidadRasgo(pj: PersonajeJugador, op: OperacionAvanzadaRasgo): PersonajeJugador | undefined {
  const tabla = op.tipo === "guardarTabla" ? resolverTablaRasgo(pj, op.idRasgo) : undefined;
  if (op.tipo === "guardarTabla") {
    const fila = tabla?.configuracion.filas.find(f => f.id === op.detalle?.idFila);
    if (!tabla?.disponible || !fila) return;
    const tirada = op.detalle.tiradaD100;
    if (tirada !== undefined && (!Number.isInteger(tirada) || tirada < fila.desde || tirada > fila.hasta)) return;
  }
  const r = pj.rasgos.find(x => x.id === (tabla?.rasgoAccion.id ?? op.idRasgo));
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
    const coincide = (resultado: ResultadoTabla) => op.idResultado
      ? resultado.id === op.idResultado : op.textoResultado !== undefined && resultado.texto === op.textoResultado;
    if (r.resultadosTablaPendientes?.some(coincide)) {
      return { ...pj, rasgos: pj.rasgos.map(x => x === r ? {
        ...x, resultadosTablaPendientes: x.resultadosTablaPendientes?.filter(p => !coincide(p))
      } : x) };
    }
    if (!r.resultadoTabla) return;
    if (op.idResultado && r.resultadoTabla.id !== op.idResultado) return;
    if (op.textoResultado !== undefined && r.resultadoTabla.texto !== op.textoResultado) return;
    return {
      ...pj,
      rasgos: pj.rasgos.map(x => x === r ? {
        ...x,
        resultadoTabla: {
          ...x.resultadoTabla!,
          enviado: true,
          estadoEnvio: "enviado"
        }
      } : x)
    };
  }
  if (op.tipo === "guardarTabla") {
    const recarga = tabla!.configuracion.modo === "recargar";
    const restantesPropios = r.usosRestantes ?? r.usosMaximos ?? 0;
    const estadoEnvio = op.detalle?.estadoEnvio ?? "pendiente";
    const nuevoResultado: NonNullable<RasgoPersonaje["resultadoTabla"]> = {
      texto: op.texto,
      enviado: estadoEnvio === "enviado",
      estadoEnvio,
      id: op.detalle?.id,
      fecha: op.detalle?.fecha,
      idFila: op.detalle?.idFila,
      tiradaD100: op.detalle?.tiradaD100,
      origen: op.detalle?.origen,
      subtiradas: op.detalle?.subtiradas
    };
    return {
      ...pj,
      rasgos: pj.rasgos.map(x => x === r ? {
        ...x,
        usosRestantes: r.tieneUsosLimitados ? recarga ? r.usosMaximos : restantesPropios - 1 : r.usosRestantes,
        resultadosTablaPendientes: r.resultadoTabla && !r.resultadoTabla.enviado && r.resultadoTabla.estadoEnvio !== "local"
          ? [...(r.resultadosTablaPendientes ?? []), r.resultadoTabla]
          : r.resultadosTablaPendientes,
        resultadoTabla: nuevoResultado
      } : x)
    };
  }
  return undefined;
}
