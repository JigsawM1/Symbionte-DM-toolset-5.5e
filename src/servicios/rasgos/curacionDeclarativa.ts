import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "./evaluadorExpresionesRasgos";
import { generarId } from "@/utiles/generarId";
import type { InstruccionGasto } from "../servicioLanzamientoConjuros";

export function nivelEspacioGastado(gasto: InstruccionGasto): number | undefined {
  return gasto.tipo === "espacio" || gasto.tipo === "pacto" ? gasto.nivel : undefined;
}

/** Solo transforma dados; conserva sumandos y nunca interpreta texto como una fórmula. */
export function maximizarDadosCuracion(formula: string): string {
  if (!/^\s*\d+(?:d\d+)?(?:\s*[+-]\s*\d+(?:d\d+)?)*\s*$/i.test(formula)) return formula;
  return formula.replace(/(\d+)d(\d+)/gi, (_, cantidad: string, caras: string) => String(Number(cantidad) * Number(caras)));
}

export function maximizaCuracion(pj: PersonajeJugador, idRecurso?: string): boolean {
  return pj.rasgos.some(r => r.curacionConjuros?.maximizarDados && rasgoMagicoHabilitado(pj, r)
    && (idRecurso === undefined || r.curacionConjuros.recursosMaximizables?.includes(idRecurso)));
}

export function formulaCuracionConjuro(pj: PersonajeJugador | undefined, h: Pick<HechizoBase, "nivel" | "curacion">, nivel: number,
  aptitud: number, nivelEspacio?: number, enTurno = false): string | undefined {
  const cfg = h.curacion;
  if (!cfg?.formula || cfg.tipo === "derivada_dano" || cfg.tipo === "completa") return;
  let formula = cfg.formula;
  for (let i = h.nivel; i < nivel && cfg.porNivel; i++) formula += `+${cfg.porNivel}`;
  if (cfg.sumarAptitud) formula += aptitud < 0 ? `${aptitud}` : `+${aptitud}`;
  if (pj && nivelEspacio !== undefined) {
    for (const r of pj.rasgos) {
      const bono = r.curacionConjuros?.bonoPorEspacio;
      if (bono && rasgoMagicoHabilitado(pj, r) && (!bono.soloTurnoLanzamiento || enTurno))
        formula += `+${bono.fijo + bono.porNivel * nivelEspacio}`;
    }
  }
  return pj && maximizaCuracion(pj) ? maximizarDadosCuracion(formula) : formula;
}

/** Se llama exclusivamente después de gastar el espacio del lanzamiento completado. */
export function registrarAutocuracionConjuro(pj: PersonajeJugador, h: HechizoBase, nivel: number | undefined, aptitud = 0): PersonajeJugador {
  const id = generarId("curacion_conjuro");
  return { ...pj, rasgos: pj.rasgos.map(r => {
    const cfg = r.curacionConjuros?.autocuracionPorEspacio;
    if (!rasgoMagicoHabilitado(pj, r)) return r;
    if (cfg && nivel !== undefined) return { ...r, resolucionesCuracionPendientes: [...(r.resolucionesCuracionPendientes ?? []), {
      id, etiqueta: h.nombre, formula: String(cfg.fijo + cfg.porNivel * nivel),
      confirmacion: "Confirma que este lanzamiento con espacio acaba de hacer recuperar PG a otra criatura. Solo se aplica una vez por lanzamiento, aunque haya varios destinatarios."
    }] };
    const bono = r.curacionConjuros?.bonoPorEspacio;
    if (!bono || !h.curacion || (h.curacion.tipo === "directa" && !h.curacion.posterior) || h.curacion.tipo === "completa") return r;
    const formula = h.curacion.posterior ?? formulaCuracionConjuro(pj, h, nivel ?? h.nivel, aptitud) ?? "0";
    return { ...r, resolucionesCuracionPendientes: [...(r.resolucionesCuracionPendientes ?? []), {
      id, etiqueta: h.nombre, formula, repetible: true, derivadaDano: h.curacion.tipo === "derivada_dano",
      bonoEnTurno: nivel === undefined ? undefined : bono.fijo + bono.porNivel * nivel,
      confirmacion: "Confirma que el conjuro sigue vigente y que este destinatario acaba de recuperar PG. Resuelve solo este evento; descarta la entrada cuando el conjuro termine."
    }] };
  }) };
}

export function formulaCuracionPendiente(p: NonNullable<PersonajeJugador["rasgos"][number]["resolucionesCuracionPendientes"]>[number], enTurno = false, dano = 0): string {
  return `${p.derivadaDano ? Math.floor(Math.max(0, dano) / 2) : p.formula}${enTurno && p.bonoEnTurno ? `+${p.bonoEnTurno}` : ""}`;
}

/** Comparar transiciones evita conceder curación al cargar, reconstruir o retirar una subclase. */
export function registrarCuracionAlFinalizar(anterior: PersonajeJugador | undefined, pj: PersonajeJugador): PersonajeJugador {
  if (!anterior || anterior.nivel !== pj.nivel || anterior.clase !== pj.clase || anterior.subclase !== pj.subclase
    || JSON.stringify(anterior.clases) !== JSON.stringify(pj.clases)) return pj;
  let cambio = false;
  const rasgos = (pj.rasgos ?? []).map(r => {
    const previo = anterior.rasgos.find(a => a.id === r.id);
    if (!r.curacionAlFinalizar || !previo?.curacionAlFinalizar || !previo.activo || r.activo) return r;
    if (r.resolucionesCuracionPendientes?.some(p => !previo.resolucionesCuracionPendientes?.some(a => a.id === p.id))) return r;
    cambio = true;
    return { ...r, resolucionesCuracionPendientes: [...(r.resolucionesCuracionPendientes ?? []), {
      id: generarId("curacion_final"), etiqueta: r.nombre,
      formula: resolverFormulaDinamica(r.curacionAlFinalizar.formula, pj, r.fuente, r),
      confirmacion: "Elige tu personaje o una criatura que cumpla el alcance del rasgo al finalizar."
    }] };
  });
  return cambio ? { ...pj, rasgos } : pj;
}

export function resolverCuracionPendiente(pj: PersonajeJugador, idRasgo: string, id: string,
  propio: boolean, resultado?: number, enTurno = false, dano = 0): PersonajeJugador | undefined {
  const r = pj.rasgos.find(r => r.id === idRasgo);
  const pendiente = r?.resolucionesCuracionPendientes?.find(p => p.id === id);
  if (!r || !pendiente || (!r.curacionAlFinalizar && !r.curacionConjuros)) return;
  if (!r.curacionAlFinalizar && !rasgoMagicoHabilitado(pj, r)) return;
  if (resultado !== undefined && (!Number.isFinite(resultado) || resultado < 0)) return;
  const formula = formulaCuracionPendiente(pendiente, enTurno, dano);
  if (resultado !== undefined && !/\d+d\d+/i.test(formula) && resultado !== evaluarExpresionNumericaSegura(formula)) return;
  if (propio && resultado === undefined) return;
  return { ...pj, hpActual: propio ? Math.min(pj.hpMaximo, pj.hpActual + (resultado ?? 0)) : pj.hpActual,
    rasgos: pj.rasgos.map(a => a.id === idRasgo ? { ...a,
      resolucionesCuracionPendientes: a.resolucionesCuracionPendientes?.filter(p => p.id !== id || (p.repetible && resultado !== undefined)) } : a) };
}
