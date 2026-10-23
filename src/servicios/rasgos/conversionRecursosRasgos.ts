import { operarCapacidadRasgo, type OperacionAvanzadaRasgo } from "./operacionesAvanzadasRasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { resolverRasgoRecurso, esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "./evaluadorExpresionesRasgos";
import { consumirRecursoConjuro } from "../consumidorRecursosConjuros";

export type OperacionRecursoRasgo = OperacionAvanzadaRasgo
  | { tipo: "recuperarUsosConEspacio"; idRasgo: string; nivel: number; pacto?: boolean }
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

/** Toda validación y todo intercambio ocurren sobre el mismo estado vigente. */
export function operarRecursoRasgo(pj: PersonajeJugador, op: OperacionRecursoRasgo): PersonajeJugador | undefined {
  if (op.tipo !== "crearEspacio" && op.tipo !== "convertirEspacio" && op.tipo !== "recuperarDescanso" && op.tipo !== "recuperarUsosConEspacio") return operarCapacidadRasgo(pj, op);
  const r = pj.rasgos.find(x => x.id === op.idRasgo);
  if (!r || r.activo === false || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1)
    || !esRasgoHabilitadoPorOpcion(r, pj.rasgos)) return;
  if (op.tipo === "recuperarUsosConEspacio") {
    const disponibles = r.usosRestantes ?? r.usosMaximos ?? 0;
    if (!r.recuperarUsosConEspacio || !r.tieneUsosLimitados || disponibles >= (r.usosMaximos ?? 0)
      || !Number.isInteger(op.nivel) || op.nivel < 1 || op.nivel > 9 || (op.pacto && op.nivel !== pj.nivelEspacioPacto)) return;
    const consumo = consumirRecursoConjuro(pj, { tipo: op.pacto ? "pacto" : "espacio", nivel: op.nivel });
    if (!consumo.permitido) return;
    return { ...consumo.personaje, rasgos: consumo.personaje.rasgos.map(x => x.id === r.id
      ? { ...x, usosRestantes: Math.min(r.usosMaximos ?? 0, disponibles + r.recuperarUsosConEspacio!) } : x) };
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
