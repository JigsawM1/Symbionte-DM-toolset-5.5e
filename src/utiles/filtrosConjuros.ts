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
  // ⚡ Optimización de cortocircuito:
  // Evaluar primero los filtros escalares/booleanos O(1) antes de la búsqueda de texto O(n).
  // Si un conjuro no cumple con la concentración, resolución o componentes, descartarlo inmediatamente
  // para evitar la tokenización y búsqueda de subcadenas sobre la descripción completa.

  // 1. Filtro de Concentración (O(1))
  if (filtroConcentracion === "sin" && hechizo.concentracion) return false;
  if (filtroConcentracion === "con" && !hechizo.concentracion) return false;

  // 2. Filtro de Resolución (Ataque vs Salvación CD vs Utilidad - O(1))
  if (filtroResolucion === "ataque" && !esConjuroAtaque(hechizo)) return false;
  if (filtroResolucion === "salvacion" && !esConjuroSalvacion(hechizo)) return false;
  if (filtroResolucion === "utilidad" && !esConjuroUtilidad(hechizo)) return false;

  // 3. Filtro de Componentes (O(1))
  if (filtroComponentes.sinV && tieneComponente(hechizo.componentesSeleccionados, "V")) return false;
  if (filtroComponentes.sinS && tieneComponente(hechizo.componentesSeleccionados, "S")) return false;
  if (filtroComponentes.sinM && tieneComponente(hechizo.componentesSeleccionados, "M")) return false;
  if (filtroComponentes.soloM && !tieneComponente(hechizo.componentesSeleccionados, "M")) return false;

  // 4. Filtro de búsqueda por texto (O(n) sobre cadenas, solo para candidatos que pasaron los filtros escalares)
  if (busqueda.trim()) {
    const coincide = coincideBusquedaTolerante(
      [hechizo.nombre, hechizo.escuela, hechizo.descripcion],
      busqueda
    );
    if (!coincide) return false;
  }

  return true;
}
