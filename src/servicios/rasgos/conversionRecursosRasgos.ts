import { operarCapacidadRasgo, type OperacionAvanzadaRasgo } from "./operacionesAvanzadasRasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { resolverRasgoRecurso, esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "./evaluadorExpresionesRasgos";
import { consumirRecursoConjuro } from "../consumidorRecursosConjuros";
import { operarResolucionRasgo, type OperacionResolucionRasgo } from "./resolucionesRasgos";
import { resolverIniciativaOpcional } from "./iniciativaOpcionalRasgos";
import { aplicarResolucionAsistida, type SolicitudResolucionAsistida } from "./resolucionAsistidaRasgos";
import { establecerRecuperacionDiferida } from "./recuperacionDiferidaRasgos";

export type OperacionRecursoRasgo = OperacionAvanzadaRasgo | OperacionResolucionRasgo
  | { tipo: "resolverAsistida"; solicitud: SolicitudResolucionAsistida; resultado?: number }
  | { tipo: "establecerRecuperacionDiferida"; idRasgo: string; resultado: number }
  | { tipo: "iniciativaOpcional"; idRasgo: string; recuperarAntes: boolean }
  | { tipo: "recuperarUsosConEspacio"; idRasgo: string; modo?: "espacio"; nivel: number; pacto?: boolean }
  | { tipo: "recuperarUsosConEspacio"; idRasgo: string; modo: "puntos"; puntos: number; cantidadUsos: number }
  | { tipo: "recargarUsoConPacto"; idRasgo: string }
  | { tipo: "crearEspacio"; idRasgo: string; nivel: number; cantidad: number }
  | { tipo: "convertirEspacio"; idRasgo: string; nivel: number; origen: "ordinario" | "adicional" | "pacto" }
  | { tipo: "recuperarDescanso"; idRasgo: string; cantidad: number };

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
export function calcularCostePuntosRecuperacion(vecesPrevias: number, cantidadUsos: number): number {
  if (!Number.isInteger(cantidadUsos) || cantidadUsos <= 0) return 0;
  const m = Math.max(0, Number.isInteger(vecesPrevias) ? vecesPrevias : 0);
  return cantidadUsos * (2 * m + cantidadUsos + 1);
}

/** Calcula cuántos usos puede costear un personaje según sus puntos disponibles y el escalado */
export function calcularMaxUsosPagablesConPuntos(vecesPrevias: number, puntosDisponibles: number, maxFaltantes: number): number {
  let usos = 0;
  while (usos < maxFaltantes) {
    const coste = calcularCostePuntosRecuperacion(vecesPrevias, usos + 1);
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

/** Estrategia de recuperación mediante puntos de conjuro (coste escalonado 2, 4, 6, 8... pts) */
function ejecutarRecuperacionPorPuntos(pj: PersonajeJugador, r: RasgoPersonaje, op: { puntos: number; cantidadUsos: number }): PersonajeJugador | undefined {
  if ((r.nivelMinimoRecuperarUsosConEspacio ?? 1) > 1) return;
  const cantidad = op.cantidadUsos;
  const previos = r.usosRecuperadosConPuntos ?? 0;
  const costeEsperado = calcularCostePuntosRecuperacion(previos, cantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1 || !Number.isInteger(op.puntos) || op.puntos !== costeEsperado
    || (pj.puntosConjuroMaximos ?? 0) - (pj.puntosConjuroGastados ?? 0) < op.puntos) return;
  const consumo = consumirRecursoConjuro(pj, { tipo: "puntos", cantidad: op.puntos, nivel: 1 });
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
export function operarRecursoRasgo(pj: PersonajeJugador, op: OperacionRecursoRasgo): PersonajeJugador | undefined {
  if (op.tipo === "resolverAsistida") return aplicarResolucionAsistida(pj, op.solicitud, op.resultado);
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
  if (!cfg || !recurso?.tieneUsosLimitados || recurso.activo === false || !Number.isInteger(op.nivel) || op.nivel < 1 || op.nivel > 9) return;
  const disponibles = recurso.usosRestantes ?? recurso.usosMaximos ?? 0;
  if (op.tipo === "crearEspacio") {
    const fila = cfg.tabla.find(f => f.nivelEspacio === op.nivel && f.nivelMinimo <= obtenerNivelEfectivoParaRasgo(pj, r));
    if (!fila || !Number.isInteger(op.cantidad) || op.cantidad < 1 || fila.coste * op.cantidad > disponibles) return;
    return { ...pj, rasgos: pj.rasgos.map(x => x.id === recurso.id ? { ...x, usosRestantes: disponibles - fila.coste * op.cantidad } : x),
      espaciosConjuroAdicionales: { ...pj.espaciosConjuroAdicionales,
        [op.nivel]: (pj.espaciosConjuroAdicionales?.[op.nivel] ?? 0) + op.cantidad } };
  }
  if (!cfg.permiteConvertir || disponibles >= (recurso.usosMaximos ?? 0)) return;
  let convertido: PersonajeJugador;
  if (op.origen === "pacto") {
    if (op.nivel !== pj.nivelEspacioPacto) return;
    const consumo = consumirRecursoConjuro(pj, { tipo: "pacto", nivel: op.nivel });
    if (!consumo.permitido) return;
    convertido = consumo.personaje;
  } else if (op.origen === "adicional") {
    if ((pj.espaciosConjuroAdicionales?.[op.nivel] ?? 0) < 1) return;
    convertido = { ...pj, espaciosConjuroAdicionales: { ...pj.espaciosConjuroAdicionales,
      [op.nivel]: pj.espaciosConjuroAdicionales[op.nivel] - 1 } };
  } else {
    const usados = pj.espaciosConjuroGastados[op.nivel] ?? 0;
    if ((pj.espaciosConjuroMaximos[op.nivel] ?? 0) <= usados) return;
    convertido = { ...pj, espaciosConjuroGastados: { ...pj.espaciosConjuroGastados, [op.nivel]: usados + 1 } };
  }
  return { ...convertido, rasgos: convertido.rasgos.map(x => x.id === recurso.id
    ? { ...x, usosRestantes: Math.min(recurso.usosMaximos ?? 0, disponibles + op.nivel) } : x) };
}

export function obtenerPagoActivacionAlternativa(pj: PersonajeJugador, r: RasgoPersonaje) {
  const cfg = r.activacionAlternativa;
  if (!cfg || !r.tieneUsosLimitados || (r.usosRestantes ?? r.usosMaximos ?? 0) > 0) return;
  const recurso = pj.rasgos.find(x => x.id === cfg.idRasgoRecurso && x.tieneUsosLimitados && x.activo !== false);
  if (recurso && (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) >= cfg.coste) return { recurso, coste: cfg.coste };
  return undefined;
}
