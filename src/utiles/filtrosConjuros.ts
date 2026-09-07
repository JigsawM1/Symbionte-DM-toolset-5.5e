import type { HechizoBase } from "@/tipos";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";

export interface FiltroComponentesConjuro {
  sinV: boolean;
  sinS: boolean;
  sinM: boolean;
  soloM: boolean;
}

export function tieneComponente(componentes: string | undefined, letra: "V" | "S" | "M"): boolean {
  if (!componentes) return false;
  const comp = componentes.toUpperCase();
  return comp.includes(letra);
}

export function esConjuroAtaque(hechizo: HechizoBase): boolean {
  if (hechizo.requiereAtaque) return true;
  if (!hechizo.ataqueCd || hechizo.ataqueCd === "N/A" || hechizo.ataqueCd === "none") return false;
  const norm = hechizo.ataqueCd.toUpperCase();
  return norm.includes("ATAQUE") || norm.includes("ATTACK");
}

export function esConjuroSalvacion(hechizo: HechizoBase): boolean {
  if (!hechizo.ataqueCd || hechizo.ataqueCd === "N/A" || hechizo.ataqueCd === "none") return false;
  const norm = hechizo.ataqueCd.toUpperCase();
  return norm.includes("SALVACI") || norm.includes("SAVE") || norm.includes("CD") || norm.includes("DC");
}

export function esConjuroUtilidad(hechizo: HechizoBase): boolean {
  return !esConjuroAtaque(hechizo) && !esConjuroSalvacion(hechizo);
}

export function evaluarFiltrosHechizo(
  hechizo: HechizoBase,
  busqueda: string,
  filtroConcentracion: "todos" | "sin" | "con",
  filtroResolucion: "todos" | "ataque" | "salvacion" | "utilidad",
  filtroComponentes: FiltroComponentesConjuro
): boolean {
  // 1. Filtro de búsqueda por texto
  if (busqueda.trim()) {
    const coincide =
      coincideBusquedaTolerante(hechizo.nombre, busqueda) ||
      coincideBusquedaTolerante(hechizo.descripcion, busqueda) ||
      coincideBusquedaTolerante(hechizo.escuela, busqueda);
    if (!coincide) return false;
  }

  // 2. Filtro de Concentración
  if (filtroConcentracion === "sin" && hechizo.concentracion) return false;
  if (filtroConcentracion === "con" && !hechizo.concentracion) return false;

  // 3. Filtro de Resolución (Ataque vs Salvación CD vs Utilidad)
  if (filtroResolucion === "ataque" && !esConjuroAtaque(hechizo)) return false;
  if (filtroResolucion === "salvacion" && !esConjuroSalvacion(hechizo)) return false;
  if (filtroResolucion === "utilidad" && !esConjuroUtilidad(hechizo)) return false;

  // 4. Filtro de Componentes
  if (filtroComponentes.sinV && tieneComponente(hechizo.componentes, "V")) return false;
  if (filtroComponentes.sinS && tieneComponente(hechizo.componentes, "S")) return false;
  if (filtroComponentes.sinM && tieneComponente(hechizo.componentes, "M")) return false;
  if (filtroComponentes.soloM && !tieneComponente(hechizo.componentes, "M")) return false;

  return true;
}
