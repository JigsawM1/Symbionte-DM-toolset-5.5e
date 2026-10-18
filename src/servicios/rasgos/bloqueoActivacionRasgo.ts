import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { resolverRasgoPadre, resolverRasgoRecurso, esRasgoHabilitadoPorOpcion, tieneArmaduraEquipada } from "./utilidadesRasgos";
import { claveEstado } from "./estadoCondicionesRasgos";

export function obtenerBloqueoActivacionRasgo(pj: PersonajeJugador | null, r: RasgoPersonaje): { bloqueado: boolean; motivo?: string } {
  if (!pj || r.activo || !r.esActivable) return { bloqueado: false };
  const fallo = (motivo: string) => ({ bloqueado: true, motivo });
  if (r.activarConRasgo) return fallo("Esta capacidad se elige al activar el rasgo indicado.");
  if (r.desactivarSinHp && pj.hpActual <= 0) return fallo("Se necesitan puntos de golpe para activar este rasgo.");
  if (r.requiereRasgosActivos?.some(id => !pj.rasgos.some(a => a.id === id && a.activo))) return fallo("Falta un rasgo requerido activo.");
  if (r.desactivarConArmaduraPesada && tieneArmaduraEquipada(pj).esPesada) return fallo("La armadura pesada impide activar este rasgo.");
  if (r.tieneUsosLimitados && (r.usosRestantes ?? r.usosMaximos ?? 0) < (r.costeFijo ?? 1)) return fallo("No quedan usos disponibles.");
  if (r.desactivarConCondiciones?.some(c => pj.condicionesActivas.some(a => claveEstado(c) === claveEstado(a)))) return fallo("Una condición actual impide activar este rasgo.");
  if (!esRasgoHabilitadoPorOpcion(r, pj.rasgos)) return fallo("La opción requerida no está seleccionada.");
  if (r.gastarDePadre && r.idRasgoRecurso) {
    const recurso = resolverRasgoRecurso(r, pj.rasgos);
    if (!recurso || (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) < (r.costeFijo ?? 1)) return fallo("No quedan usos del recurso indicado.");
  }
  if (r.ligadoA) {
    const padre = resolverRasgoPadre(r, pj.rasgos);
    if (!padre || padre.activo === false) return fallo("El rasgo padre no está activo.");
    const recurso = resolverRasgoRecurso(r, pj.rasgos);
    if (r.gastarDePadre && (!recurso || (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) < (r.costeFijo ?? 1))) return fallo("No quedan usos del recurso padre.");
  }
  if (r.restaurarUsosAlActivar) {
    const objetivo = pj.rasgos.find(a => a.id === r.restaurarUsosAlActivar!.idRasgoObjetivo);
    if (objetivo && (objetivo.usosRestantes ?? objetivo.usosMaximos ?? 0) >= (objetivo.usosMaximos ?? 1)) return fallo("El recurso ya está completo.");
  }
  return { bloqueado: false };
}
