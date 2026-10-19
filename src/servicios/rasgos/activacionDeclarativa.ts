import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { aplicarHpTemporalPorEvento } from "./eventosHpTemporal";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";

export interface EleccionesActivacionRasgo {
  selectores: Record<string, string[]>;
  opcionales: string[];
}

/** Valida todas las decisiones antes de gastar o cambiar el estado del personaje. */
export function prepararEleccionesActivacion(pj: PersonajeJugador, r: RasgoPersonaje, decisiones?: EleccionesActivacionRasgo): PersonajeJugador | undefined {
  if (r.activo) return pj;
  const selectores = (r.selectores ?? []).filter(s => s.momentoEleccion === "activacion");
  if (selectores.some(s => {
    const valores = decisiones?.selectores[s.id];
    return !valores || valores.length < 1 || valores.length > (s.tipo === "unico" ? 1 : s.maxSelecciones) || new Set(valores).size !== valores.length
      || valores.some(valor => !s.opciones.some(o => o.id === valor && (o.nivelMinimo ?? 1) <= obtenerNivelEfectivoParaRasgo(pj, r)));
  })) return undefined;
  if ((decisiones?.opcionales ?? []).some(id => {
    const hijo = pj.rasgos.find(h => h.id === id);
    return !hijo || hijo.activarConRasgo !== r.id || hijo.activo || !esRasgoHabilitadoPorOpcion(hijo, pj.rasgos)
      || obtenerNivelEfectivoParaRasgo(pj, hijo) < (hijo.nivelRequerido ?? 1)
      || (hijo.desactivarSinHp && pj.hpActual <= 0)
      || (hijo.tieneUsosLimitados && (hijo.usosRestantes ?? hijo.usosMaximos ?? 0) < 1);
  })) return undefined;
  if (!selectores.length) return pj;
  return { ...pj, rasgos: pj.rasgos.map(h => h.id !== r.id ? h : { ...h,
    selectores: h.selectores?.map(s => s.momentoEleccion !== "activacion" ? s : { ...s, valorActual: decisiones!.selectores[s.id] }) }) };
}

/** Las capacidades opcionales se activan en la misma transacción que el padre. */
export function activarOpcionales(pj: PersonajeJugador, idPadre: string, decisiones: EleccionesActivacionRasgo | undefined, ronda: number): PersonajeJugador {
  const ids = new Set(decisiones?.opcionales ?? []);
  if (!ids.size) return pj;
  const condiciones = [...pj.condicionesActivas];
  const efectos = [...pj.efectosActivos];
  const rasgos = pj.rasgos.map(r => {
    if (!ids.has(r.id) || r.activarConRasgo !== idPadre) return r;
    if (r.condicionAlActivar) {
      condiciones.push(r.condicionAlActivar);
      if (r.duracionEfectoAlActivar) efectos.push({ id: `activacion_${r.id}`, idRasgoOrigen: r.id, nombre: r.condicionAlActivar,
        expiraRonda: ronda + r.duracionEfectoAlActivar, duracion: r.duracionEfectoAlActivar, concentracion: false });
    }
    return { ...r, activo: true, usosRestantes: r.tieneUsosLimitados ? (r.usosRestantes ?? r.usosMaximos ?? 1) - 1 : r.usosRestantes };
  });
  return { ...pj, rasgos, condicionesActivas: condiciones, efectosActivos: efectos };
}

/** Una reconstrucción no es una activación: solo procesa transiciones del mismo rasgo. */
export function aplicarEventosActivacion(anterior: PersonajeJugador | undefined, pj: PersonajeJugador): PersonajeJugador {
  if (!anterior) return pj;
  const activados = new Set(pj.rasgos.filter(r => r.esActivable && r.activo
    && anterior.rasgos.some(a => a.id === r.id && a.esActivable && a.activo === false)).map(r => r.id));
  if (!activados.size) return pj;
  let actual = { ...pj, rasgos: pj.rasgos.map(r => r.recuperarUsosAlActivarRasgo && activados.has(r.recuperarUsosAlActivarRasgo)
    ? { ...r, usosRestantes: r.usosMaximos ?? 1 } : r) };
  for (const id of activados) actual = aplicarHpTemporalPorEvento(actual, "activacion", id);
  return actual;
}

/** El coste depende solo de decisiones validadas, nunca de nombres de rasgos. */
export function costeActivacionRasgo(r: RasgoPersonaje): number {
  const cfg = r.costeActivacionPorSelector;
  return cfg ? Math.max(1, r.selectores?.find(s => s.id === cfg.idSelector)?.valorActual.length ?? 0) * cfg.costePorOpcion : r.costeFijo ?? 1;
}
