import type { HechizoBase, ComponentesSeleccionados } from "@/tipos";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";

export interface FiltroComponentesConjuro {
  sinV: boolean;
  sinS: boolean;
  sinM: boolean;
  soloM: boolean;
}

export function tieneComponente(
  origen: ComponentesSeleccionados | Pick<HechizoBase, "componentesSeleccionados"> | undefined,
  letra: "V" | "S" | "M"
): boolean {
  if (!origen) return false;
  const comp = "componentesSeleccionados" in origen ? origen.componentesSeleccionados : origen;
  if (!comp) return false;
  if (letra === "V") return comp.verbal === true;
  if (letra === "S") return comp.somatico === true;
  if (letra === "M") return comp.material === true;
  return false;
}

export function esConjuroAtaque(hechizo: HechizoBase): boolean {
  return hechizo.requiereAtaque === true || hechizo.ataqueCd === "ATAQUE";
}

export function esConjuroSalvacion(hechizo: HechizoBase): boolean {
  return hechizo.ataqueCd === "CD";
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
  if (filtroComponentes.sinV && tieneComponente(hechizo.componentesSeleccionados, "V")) return false;
  if (filtroComponentes.sinS && tieneComponente(hechizo.componentesSeleccionados, "S")) return false;
  if (filtroComponentes.sinM && tieneComponente(hechizo.componentesSeleccionados, "M")) return false;
  if (filtroComponentes.soloM && !tieneComponente(hechizo.componentesSeleccionados, "M")) return false;

  return true;
}
