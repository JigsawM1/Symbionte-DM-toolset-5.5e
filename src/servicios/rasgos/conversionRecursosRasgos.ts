import { operarCapacidadRasgo, type OperacionAvanzadaRasgo } from "./operacionesAvanzadasRasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { resolverRasgoRecurso, esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "./evaluadorExpresionesRasgos";
import { consumirRecursoConjuro, gastarEspacioElegido } from "../consumidorRecursosConjuros";
import { disponibleEnTurnoPropio } from "./limitesTurnoRasgos";
import { operarResolucionRasgo, type OperacionResolucionRasgo } from "./resolucionesRasgos";
import { resolverIniciativaOpcional } from "./iniciativaOpcionalRasgos";
import { aplicarResolucionAsistida, prepararDanoIntegrado, prepararResolucionAsistida, type SolicitudResolucionAsistida } from "./resolucionAsistidaRasgos";
import { establecerRecuperacionDiferida } from "./recuperacionDiferidaRasgos";
import { resolverCuracionPendiente } from "./curacionDeclarativa";
import { finalizarConjuroTemporal } from "./conjurosTemporalesRasgos";
import { calcularPresupuestoRecuperacion } from "./evaluadorRecursosRasgos";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes/personajeConstantes";

export type OperacionRecursoRasgo = OperacionAvanzadaRasgo | OperacionResolucionRasgo
  | { tipo: "finalizarConjuroTemporal"; idRasgo: string; conjuroId: string }
  | { tipo: "curacionPendiente"; idRasgo: string; id: string; propio: boolean; resultado?: number; enTurno?: boolean; dano?: number }
  | { tipo: "resolverAsistida"; solicitud: SolicitudResolucionAsistida; resultado?: number; curacion?: number }
  | { tipo: "confirmarAtaqueAsistido"; solicitud: SolicitudResolucionAsistida; turnoPrevio?: string }
  | { tipo: "confirmarDanoIntegrado"; solicitud: SolicitudResolucionAsistida; turnoPrevio?: string }
  | { tipo: "establecerRecuperacionDiferida"; idRasgo: string; resultado: number }
  | { tipo: "iniciativaOpcional"; idRasgo: string; recuperarAntes: boolean }
  | { tipo: "recuperarUsosConEspacio"; idRasgo: string; modo?: "espacio"; nivel: number; pacto?: boolean }
  | { tipo: "recuperarUsosConEspacio"; idRasgo: string; modo: "puntos"; puntos: number; cantidadUsos: number }
  | { tipo: "recargarUsoConPacto"; idRasgo: string }
  | { tipo: "crearEspacio"; idRasgo: string; nivel: number; cantidad: number; modo?: "espacios" | "puntos" }
  | { tipo: "convertirEspacio"; idRasgo: string; nivel: number; origen: "ordinario" | "adicional" | "pacto" | "puntos"; puntos?: number; turnoConfirmado?: boolean }
  | { tipo: "recuperarDescanso"; idRasgo: string; cantidad: number }
  | { tipo: "recuperarEspaciosDescanso"; idRasgo: string; espacios: Record<number, number>; puntos?: number };

/** Los adicionales son espacios disponibles, separados de la progresión ordinaria. */
export function obtenerMaximosEspaciosEfectivos(pj: PersonajeJugador): Record<string, number> {
  const maximos = { ...pj.espaciosConjuroMaximos };
  for (const [nivel, cantidad] of Object.entries(pj.espaciosConjuroAdicionales ?? {}))
    maximos[nivel] = (maximos[nivel] ?? 0) + cantidad;
  return maximos;
}

export function obtenerMaximoRecuperacionDescanso(pj: PersonajeJugador, r: RasgoPersonaje): number {
  const cfg = r.recuperacionOpcionalDescanso;
  const objetivo = pj.rasgos.find(x => x.id === cfg?.idRasgoObjetivo);
  if (!cfg || !objetivo || !r.recuperacionDescansoDisponible || (r.usosRestantes ?? r.usosMaximos ?? 0) < 1) return 0;
  const formula = resolverFormulaDinamica(cfg.formulaCantidad, pj, r.fuente, r);
  return Math.max(0, Math.min((objetivo.usosMaximos ?? 0) - (objetivo.usosRestantes ?? objetivo.usosMaximos ?? 0),
    Math.floor(evaluarExpresionNumericaSegura(formula))));
}

/** Calcula el coste acumulado en puntos para U usos habiendo consumido m previamente (2, 4, 6... n+2) */
export function calcularCostePuntosRecuperacion(vecesPrevias: number, cantidadUsos: number, nivelMinimo = 1): number {
  if (!Number.isInteger(cantidadUsos) || cantidadUsos <= 0) return 0;
  const m = Math.max(0, Number.isInteger(vecesPrevias) ? vecesPrevias : 0);
  const base = COSTE_PUNTOS_POR_NIVEL[nivelMinimo] ?? 2;
  return cantidadUsos * (2 * m + cantidadUsos + base - 1);
}

/** Calcula cuántos usos puede costear un personaje según sus puntos disponibles y el escalado */
export function calcularMaxUsosPagablesConPuntos(vecesPrevias: number, puntosDisponibles: number, maxFaltantes: number, nivelMinimo = 1): number {
  let usos = 0;
  while (usos < maxFaltantes) {
    const coste = calcularCostePuntosRecuperacion(vecesPrevias, usos + 1, nivelMinimo);
    if (coste > puntosDisponibles) break;
    usos++;
  }
  return usos;
}

function aplicarRecuperacion(
  r: RasgoPersonaje,
  consumo: { permitido: true; personaje: PersonajeJugador },
  cantidad: number,
  actualizacionesRasgo?: Partial<RasgoPersonaje>
): PersonajeJugador {
  const disponibles = r.usosRestantes ?? r.usosMaximos ?? 0;
  const maximos = r.usosMaximos ?? 1;
  return {
    ...consumo.personaje,
    rasgos: consumo.personaje.rasgos.map(x => x.id === r.id
      ? { ...x, usosRestantes: Math.min(maximos, disponibles + cantidad), ...actualizacionesRasgo } : x)
  };
}

/** Estrategia de recuperación mediante espacios de conjuro u origen de pacto */
function ejecutarRecuperacionPorEspacio(pj: PersonajeJugador, r: RasgoPersonaje, op: { nivel: number; pacto?: boolean }): PersonajeJugador | undefined {
  if (!Number.isInteger(op.nivel) || op.nivel < (r.nivelMinimoRecuperarUsosConEspacio ?? 1) || op.nivel > 9 || (op.pacto && op.nivel !== pj.nivelEspacioPacto)) return;
  const consumo = consumirRecursoConjuro(pj, { tipo: op.pacto ? "pacto" : "espacio", nivel: op.nivel });
  return consumo.permitido ? aplicarRecuperacion(r, consumo, r.recuperarUsosConEspacio ?? 1) : undefined;
}

/** Estrategia de recuperación mediante puntos de conjuro (coste escalonado según nivel mínimo del rasgo) */
function ejecutarRecuperacionPorPuntos(pj: PersonajeJugador, r: RasgoPersonaje, op: { puntos: number; cantidadUsos: number }): PersonajeJugador | undefined {
  const nivelMinimo = r.nivelMinimoRecuperarUsosConEspacio ?? 1;
  const cantidad = op.cantidadUsos;
  const previos = r.usosRecuperadosConPuntos ?? 0;
  const costeEsperado = calcularCostePuntosRecuperacion(previos, cantidad, nivelMinimo);
  if (!Number.isInteger(cantidad) || cantidad < 1 || !Number.isInteger(op.puntos) || op.puntos !== costeEsperado
    || (pj.puntosConjuroMaximos ?? 0) - (pj.puntosConjuroGastados ?? 0) < op.puntos) return;
  const consumo = consumirRecursoConjuro(pj, { tipo: "puntos", cantidad: op.puntos, nivel: nivelMinimo });
  return consumo.permitido ? aplicarRecuperacion(r, consumo, cantidad, { usosRecuperadosConPuntos: previos + cantidad }) : undefined;
}

/** Estrategia de recarga mediante Magia del Pacto (Brujo: 1 espacio de pacto = 1 uso) */
function ejecutarRecuperacionPorPacto(pj: PersonajeJugador, r: RasgoPersonaje): PersonajeJugador | undefined {
  if (!r.recargarUsoConPacto || !r.tieneUsosLimitados) return;
  const disponibles = r.usosRestantes ?? r.usosMaximos ?? 0;
  if (disponibles >= (r.usosMaximos ?? 1)) return;
  const consumo = consumirRecursoConjuro(pj, { tipo: "pacto", nivel: pj.nivelEspacioPacto });
  return consumo.permitido ? aplicarRecuperacion(r, consumo, 1) : undefined;
}

/** Toda validación y todo intercambio ocurren sobre el mismo estado vigente. */
export function operarRecursoRasgo(pj: PersonajeJugador, op: OperacionRecursoRasgo, turno?: string | false): PersonajeJugador | undefined {
  if (op.tipo === "recuperarEspaciosDescanso") {
    const r = pj.rasgos.find(x => x.id === op.idRasgo);
    if (!r?.recuperarEspaciosTrasDescansoCorto || !r.recuperarEspacios || !r.recuperacionDescansoDisponible || r.activo === false
      || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1) || (r.usosRestantes ?? 0) < 1) return;
    if (op.puntos !== undefined && op.puntos > 0) {
      const gastados = pj.puntosConjuroGastados ?? 0;
      const maxPuntosPresupuesto = calcularPresupuestoRecuperacion(r, pj) * (COSTE_PUNTOS_POR_NIVEL[1] ?? 2);
      if ((pj.puntosConjuroMaximos ?? 0) <= 0 || gastados <= 0 || !Number.isInteger(op.puntos) || op.puntos > maxPuntosPresupuesto) return;
      return { ...pj, puntosConjuroGastados: Math.max(0, gastados - op.puntos), rasgos: pj.rasgos.map(x => x === r
        ? { ...x, recuperacionDescansoDisponible: false, usosRestantes: (r.usosRestantes ?? 0) - 1 } : x) };
    }
    const gastos = { ...pj.espaciosConjuroGastados };
    let coste = 0;
    for (const [clave, cantidad] of Object.entries(op.espacios)) {
      const nivel = Number(clave);
      if (!Number.isInteger(nivel) || nivel < 1 || nivel > r.recuperarEspacios.nivelMaximoEspacio
        || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > (gastos[clave] ?? 0)) return;
      if (cantidad) gastos[clave] -= cantidad;
      coste += nivel * cantidad;
    }
    if (coste === 0 || coste > calcularPresupuestoRecuperacion(r, pj)) return;
    return { ...pj, espaciosConjuroGastados: gastos, rasgos: pj.rasgos.map(x => x === r
      ? { ...x, recuperacionDescansoDisponible: false, usosRestantes: (r.usosRestantes ?? 0) - 1 } : x) };
  }
  if (op.tipo === "finalizarConjuroTemporal") return finalizarConjuroTemporal(pj, op.idRasgo, op.conjuroId);
  if (op.tipo === "curacionPendiente") return resolverCuracionPendiente(pj, op.idRasgo, op.id, op.propio, op.resultado, op.enTurno, op.dano);
  if (op.tipo === "confirmarAtaqueAsistido") {
    const rasgo = pj.rasgos.find(r => r.id === op.solicitud.idRasgo);
    if (!rasgo?.resolucionAsistida?.ataqueConjuro || turno === false || op.turnoPrevio !== turno
      || !disponibleEnTurnoPropio(rasgo, turno, pj) || !prepararResolucionAsistida(pj, { ...op.solicitud, confirmado: true })) return;
    return { ...pj, rasgos: pj.rasgos.map(r => r === rasgo
      ? { ...r, ataqueAsistidoPendiente: turno ?? "mesa", ultimoUsoTurno: turno } : r) };
  }
  if (op.tipo === "resolverAsistida") {
    const rasgo = pj.rasgos.find(r => r.id === op.solicitud.idRasgo);
    if (!rasgo || rasgo.resolucionAsistida?.integrarEnDanoDeArma || turno === false && rasgo.resolucionAsistida?.ataqueConjuro) return;
    const ataque = rasgo.resolucionAsistida?.ataqueConjuro;
    if (ataque ? rasgo.ataqueAsistidoPendiente !== (turno ?? "mesa") : !disponibleEnTurnoPropio(rasgo, turno, pj)) return;
    const resuelto = aplicarResolucionAsistida(pj, op.solicitud, op.resultado, op.curacion);
    return resuelto && (ataque || rasgo.limitePorTurnoPropio && turno) ? { ...resuelto,
      rasgos: resuelto.rasgos.map(r => r.id === rasgo.id
        ? { ...r, ultimoUsoTurno: turno || undefined, ataqueAsistidoPendiente: undefined } : r) } : resuelto;
  }
  if (op.tipo === "confirmarDanoIntegrado") {
    const rasgo = pj.rasgos.find(r => r.id === op.solicitud.idRasgo);
    if (!rasgo || !disponibleEnTurnoPropio(rasgo, turno, pj)
      || (op.turnoPrevio !== undefined && op.turnoPrevio !== turno) || !prepararDanoIntegrado(pj, op.solicitud)) return;
    return (rasgo.limitePorTurnoPropio || rasgo.limitePorTurno) && turno ? { ...pj,
      rasgos: pj.rasgos.map(r => r.id === rasgo.id || r.id === rasgo.idRasgoSelectorOrigen
        ? { ...r, ultimoUsoTurno: turno } : r) } : pj;
  }
  if (op.tipo === "establecerRecuperacionDiferida") return establecerRecuperacionDiferida(pj, op.idRasgo, op.resultado);
  if (op.tipo === "iniciativaOpcional") return resolverIniciativaOpcional(pj, op.idRasgo, op.recuperarAntes);
  if (op.tipo === "reservarIntento" || op.tipo === "anotarIntento" || op.tipo === "resolverIntento" || op.tipo === "cancelarIntento") return operarResolucionRasgo(pj, op);
  if (op.tipo !== "crearEspacio" && op.tipo !== "convertirEspacio" && op.tipo !== "recuperarDescanso" && op.tipo !== "recuperarUsosConEspacio" && op.tipo !== "recargarUsoConPacto") return operarCapacidadRasgo(pj, op);
  const r = pj.rasgos.find(x => x.id === op.idRasgo);
  if (!r || (r.activo === false && !(op.tipo === "recuperarUsosConEspacio" && r.esActivable)) || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1)
    || !esRasgoHabilitadoPorOpcion(r, pj.rasgos)) return;
  if (op.tipo === "recargarUsoConPacto") return ejecutarRecuperacionPorPacto(pj, r);
  if (op.tipo === "recuperarUsosConEspacio") {
    const disponibles = r.usosRestantes ?? r.usosMaximos ?? 0;
    if (!r.recuperarUsosConEspacio || !r.tieneUsosLimitados || disponibles >= (r.usosMaximos ?? 0)) return;
    return "modo" in op && op.modo === "puntos"
      ? ejecutarRecuperacionPorPuntos(pj, r, op)
      : ejecutarRecuperacionPorEspacio(pj, r, op);
  }
  if (op.tipo === "recuperarDescanso") {
    if (!Number.isInteger(op.cantidad) || op.cantidad < 1 || op.cantidad > obtenerMaximoRecuperacionDescanso(pj, r)) return;
    return { ...pj, rasgos: pj.rasgos.map(x => x.id === r.id
      ? { ...x, usosRestantes: (x.usosRestantes ?? x.usosMaximos ?? 0) - 1, recuperacionDescansoDisponible: false }
      : x.id === r.recuperacionOpcionalDescanso!.idRasgoObjetivo ? { ...x, usosRestantes: (x.usosRestantes ?? x.usosMaximos ?? 0) + op.cantidad } : x) };
  }
  const cfg = r.conversionEspacios;
  const recurso = resolverRasgoRecurso(r, pj.rasgos);
  if (!cfg || !recurso?.tieneUsosLimitados || (recurso.activo === false && !cfg.consumirUsoPropio)
    || !Number.isInteger(op.nivel) || op.nivel < 1 || op.nivel > 9) return;
  const disponibles = recurso.usosRestantes ?? recurso.usosMaximos ?? 0;
  if (op.tipo === "crearEspacio") {
    const fila = cfg.tabla.find(f => f.nivelEspacio === op.nivel && f.nivelMinimo <= obtenerNivelEfectivoParaRasgo(pj, r));
    const usosPropios = r.usosRestantes ?? r.usosMaximos ?? 0;
    if (!fila || !Number.isInteger(op.cantidad) || op.cantidad < 1 || fila.coste * op.cantidad > disponibles
      || (cfg.consumirUsoPropio && (!r.tieneUsosLimitados || usosPropios < 1 || op.cantidad !== 1 || r.id === recurso.id))) return;
    if (op.modo === "puntos") {
      const gastados = pj.puntosConjuroGastados ?? 0;
      if ((pj.puntosConjuroMaximos ?? 0) <= 0 || gastados <= 0) return;
      const puntosGenerados = (COSTE_PUNTOS_POR_NIVEL[op.nivel] ?? op.nivel) * op.cantidad;
      return { ...pj, rasgos: pj.rasgos.map(x => x.id === recurso.id ? { ...x, usosRestantes: disponibles - fila.coste * op.cantidad }
        : x.id === r.id && cfg.consumirUsoPropio ? { ...x, usosRestantes: usosPropios - 1 } : x),
        puntosConjuroGastados: Math.max(0, gastados - puntosGenerados) };
    }
    return { ...pj, rasgos: pj.rasgos.map(x => x.id === recurso.id ? { ...x, usosRestantes: disponibles - fila.coste * op.cantidad }
      : x.id === r.id && cfg.consumirUsoPropio ? { ...x, usosRestantes: usosPropios - 1 } : x),
      espaciosConjuroAdicionales: { ...pj.espaciosConjuroAdicionales,
        [op.nivel]: (pj.espaciosConjuroAdicionales?.[op.nivel] ?? 0) + op.cantidad } };
  }
  if (!cfg.permiteConvertir || disponibles >= (recurso.usosMaximos ?? 0)) return;
  if (r.recuperarRecursoAgotadoConEspacio && disponibles !== 0) return;
  if (!disponibleEnTurnoPropio(r, turno) || (r.limitePorTurnoPropio && !turno && !op.turnoConfirmado)) return;
  if (op.origen === "puntos") {
    const previos = r.usosRecuperadosConPuntos ?? 0;
    const costePuntos = r.recuperarRecursoAgotadoConEspacio
      ? calcularCostePuntosRecuperacion(previos, 1, 1)
      : (COSTE_PUNTOS_POR_NIVEL[op.nivel] ?? op.nivel);
    if (op.puntos !== undefined && op.puntos !== costePuntos) return;
    const consumo = consumirRecursoConjuro(pj, { tipo: "puntos", cantidad: costePuntos, nivel: op.nivel });
    if (!consumo.permitido) return;
    const recuperados = r.recuperarRecursoAgotadoConEspacio ? 1 : op.nivel;
    return { ...consumo.personaje, rasgos: consumo.personaje.rasgos.map(x => ({
      ...x,
      ...(x.id === recurso.id ? { usosRestantes: Math.min(recurso.usosMaximos ?? 0, disponibles + recuperados) } : {}),
      ...(x.id === r.id && r.recuperarRecursoAgotadoConEspacio ? { usosRecuperadosConPuntos: previos + 1 } : {}),
      ...(x.id === r.id && r.limitePorTurnoPropio && turno ? { ultimoUsoTurno: turno } : {})
    })) };
  }
  const convertido = gastarEspacioElegido(pj, { nivel: op.nivel, origen: op.origen });
  if (!convertido) return;
  const recuperados = r.recuperarRecursoAgotadoConEspacio ? 1 : op.nivel;
  return { ...convertido, rasgos: convertido.rasgos.map(x => x.id === recurso.id
    ? { ...x, usosRestantes: Math.min(recurso.usosMaximos ?? 0, disponibles + recuperados) }
    : x.id === r.id && r.limitePorTurnoPropio && turno ? { ...x, ultimoUsoTurno: turno } : x) };
}

export function obtenerPagoActivacionAlternativa(pj: PersonajeJugador, r: RasgoPersonaje) {
  const cfg = r.activacionAlternativa;
  if (!cfg || !r.tieneUsosLimitados || (r.usosRestantes ?? r.usosMaximos ?? 0) > 0) return;
  const recurso = pj.rasgos.find(x => x.id === cfg.idRasgoRecurso && x.tieneUsosLimitados && x.activo !== false);
  if (recurso && (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) >= cfg.coste) return { recurso, coste: cfg.coste };
  return undefined;
}
