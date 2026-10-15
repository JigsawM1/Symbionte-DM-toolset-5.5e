import type { PersonajeJugador } from "@/tipos";
import { normalizar } from "./utilidadesRasgos";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";

export function claveEstado(texto: string): string {
  const base = normalizar(texto).split(" (")[0];
  const condicion = CONDICIONES_2024.find(c => normalizar(c.nombre).split(" (")[0] === base
    || normalizar(c.nombre).split("(")[1]?.replace(")", "").trim() === base);
  if (condicion) return normalizar(condicion.nombre).split(" (")[0];
  const efecto = EFECTOS_PREDEFINIDOS.find(e => [e.nombre, ...(e.aliases ?? [])].some(n => normalizar(n).split(" (")[0] === base));
  return efecto ? normalizar(efecto.nombre).split(" (")[0] : base;
}

/** Finaliza estados por duración o condiciones declaradas, sin reglas por nombre del rasgo. */
export function normalizarCondicionesRasgos(pj: PersonajeJugador, ronda?: number): PersonajeJugador {
  const retirar = new Set<string>();
  let cambio = false;
  const rasgos = (pj.rasgos ?? []).map(r => {
    if (!r.esActivable || !r.activo) return r;
    const impedido = r.desactivarConCondiciones?.some(c => (pj.condicionesActivas ?? []).some(a => claveEstado(c) === claveEstado(a)));
    const expirado = ronda !== undefined && r.condicionAlActivar && (pj.efectosActivos ?? []).some(e =>
      claveEstado(e.nombre) === claveEstado(r.condicionAlActivar!) && e.expiraRonda !== undefined && e.expiraRonda <= ronda);
    if (!impedido && !expirado) return r;
    cambio = true;
    if (r.condicionAlActivar) retirar.add(claveEstado(r.condicionAlActivar));
    return { ...r, activo: false };
  });
  return cambio ? { ...pj, rasgos,
    condicionesActivas: (pj.condicionesActivas ?? []).filter(c => !retirar.has(claveEstado(c))),
    efectosActivos: (pj.efectosActivos ?? []).filter(e => !retirar.has(claveEstado(e.nombre))) } : pj;
}
