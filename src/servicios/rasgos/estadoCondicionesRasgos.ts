import type { PersonajeJugador } from "@/tipos";
import { normalizar, tieneArmaduraEquipada, resolverRasgoPadre } from "./utilidadesRasgos";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import { normalizarConjurosTemporales } from "./conjurosTemporalesRasgos";
import { registrarCuracionAlFinalizar } from "./curacionDeclarativa";

export function claveEstado(texto: string): string {
  const base = normalizar(texto).split(" (")[0];
  const condicion = CONDICIONES_2024.find(c => normalizar(c.nombre).split(" (")[0] === base
    || normalizar(c.nombre).split("(")[1]?.replace(")", "").trim() === base);
  if (condicion) return normalizar(condicion.nombre).split(" (")[0];
  const efecto = EFECTOS_PREDEFINIDOS.find(e => [e.nombre, ...(e.aliases ?? [])].some(n => normalizar(n).split(" (")[0] === base));
  return efecto ? normalizar(efecto.nombre).split(" (")[0] : base;
}

/** Los efectos breves pueden declarar su finalización al completar cualquier descanso. */
export function finalizarRasgosAlDescansar(pj: PersonajeJugador, tipo: "descanso_corto" | "descanso_largo" = "descanso_corto"): PersonajeJugador {
  const rasgos = pj.rasgos.filter(r => r.finalizarAlDescansar === true || r.finalizarAlDescansar === tipo);
  if (!rasgos.length) return pj;
  const ids = new Set(rasgos.map(r => r.id));
  const condiciones = new Set(rasgos.flatMap(r => r.condicionAlActivar ? [claveEstado(r.condicionAlActivar)] : []));
  return { ...pj, rasgos: pj.rasgos.map(r => ids.has(r.id) ? { ...r, activo: false } : r),
    concentracionActiva: ids.has(pj.concentracionActiva?.idRasgoOrigen ?? "") ? null : pj.concentracionActiva,
    efectosActivos: pj.efectosActivos.filter(e => !ids.has(e.idRasgoOrigen ?? "") && !condiciones.has(claveEstado(e.nombre))),
    condicionesActivas: pj.condicionesActivas.filter(c => !condiciones.has(claveEstado(c))) };
}

/** Finaliza estados por duración o condiciones declaradas, sin reglas por nombre del rasgo. */
export function normalizarCondicionesRasgos(pj: PersonajeJugador, ronda?: number): PersonajeJugador {
  pj = normalizarConjurosTemporales(pj, ronda);
  const retirar = new Set<string>();
  let cambio = false;
  let rasgos = (pj.rasgos ?? []).map(r => {
    if (!r.esActivable || !r.activo) return r;
    const impedido = r.desactivarConCondiciones?.some(c => (pj.condicionesActivas ?? []).some(a => claveEstado(c) === claveEstado(a)));
    const expirado = ronda !== undefined && r.condicionAlActivar && (pj.efectosActivos ?? []).some(e =>
      claveEstado(e.nombre) === claveEstado(r.condicionAlActivar!) && e.expiraRonda !== undefined && e.expiraRonda <= ronda);
    const armaduraImpide = r.desactivarConArmaduraPesada && tieneArmaduraEquipada(pj).esPesada;
    const sinHp = r.desactivarSinHp && pj.hpActual <= 0;
    const sinConcentracion = r.lanzamientoConActivacion && pj.concentracionActiva?.idRasgoOrigen !== r.id;
    const faltaRequisito = r.requiereRasgosActivos?.some(id => !pj.rasgos.some(a => a.id === id && a.activo));
    if (!impedido && !expirado && !armaduraImpide && !sinHp && !faltaRequisito && !sinConcentracion) return r;
    cambio = true;
    if (r.condicionAlActivar) retirar.add(claveEstado(r.condicionAlActivar));
    return { ...r, activo: false };
  });
  // La finalización automática propaga el apagado a activables dependientes, también en cadenas.
  const apagados = new Set(rasgos.filter((r, i) => pj.rasgos[i].activo && !r.activo).map(r => r.id));
  for (let paso = 0; paso < rasgos.length && apagados.size; paso++) {
    let nuevos = false;
    rasgos = rasgos.map(r => {
      if (!r.esActivable || !r.activo) return r;
      const padre = resolverRasgoPadre(r, rasgos);
      const requisitoApagado = r.requiereRasgosActivos?.some(id => apagados.has(id));
      if (!requisitoApagado && (!padre || !apagados.has(padre.id))) return r;
      apagados.add(r.id); nuevos = true;
      if (r.condicionAlActivar) retirar.add(claveEstado(r.condicionAlActivar));
      return { ...r, activo: false };
    });
    if (!nuevos) break;
  }
  const idConcentracion = pj.concentracionActiva?.idRasgoOrigen;
  const retirarConcentracion = idConcentracion && !rasgos.some(r => r.id === idConcentracion && r.activo);
  if (retirarConcentracion) {
    retirar.add(claveEstado(pj.concentracionActiva!.nombreHechizo));
    for (const e of pj.efectosActivos ?? []) if (e.idRasgoOrigen === idConcentracion) retirar.add(claveEstado(e.nombre));
  }
  const resultado = cambio || retirarConcentracion ? { ...pj, rasgos,
    concentracionActiva: retirarConcentracion ? null : pj.concentracionActiva,
    condicionesActivas: (pj.condicionesActivas ?? []).filter(c => !retirar.has(claveEstado(c))),
    efectosActivos: (pj.efectosActivos ?? []).filter(e => !retirar.has(claveEstado(e.nombre))) } : pj;
  return ronda === undefined ? resultado : registrarCuracionAlFinalizar(pj, resultado);
}
