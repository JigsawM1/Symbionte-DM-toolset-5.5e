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
  // ⚡ Optimización Bolt: Los filtros booleanos O(1) se evalúan primero como cortocircuito rápido.
  // Evita instanciar arrays y realizar normalizaciones/tokenizaciones pesadas de texto
  // sobre hechizos descartados por concentración, resolución o componentes.

  // 1. Filtro de Concentración (comprobación booleana inmediata)
  if (filtroConcentracion === "sin" && hechizo.concentracion) return false;
  if (filtroConcentracion === "con" && !hechizo.concentracion) return false;

  // 2. Filtro de Resolución (Ataque vs Salvación CD vs Utilidad)
  if (filtroResolucion === "ataque" && !esConjuroAtaque(hechizo)) return false;
  if (filtroResolucion === "salvacion" && !esConjuroSalvacion(hechizo)) return false;
  if (filtroResolucion === "utilidad" && !esConjuroUtilidad(hechizo)) return false;

  // 3. Filtro de Componentes
  if (filtroComponentes.sinV && tieneComponente(hechizo.componentesSeleccionados, "V")) return false;
  if (filtroComponentes.sinS && tieneComponente(hechizo.componentesSeleccionados, "S")) return false;
  if (filtroComponentes.sinM && tieneComponente(hechizo.componentesSeleccionados, "M")) return false;
  if (filtroComponentes.soloM && !tieneComponente(hechizo.componentesSeleccionados, "M")) return false;

  // 4. Filtro de búsqueda por texto (operación O(N) costosa evaluada en último lugar)
  if (busqueda && busqueda.trim()) {
    const coincide = coincideBusquedaTolerante(
      [hechizo.nombre, hechizo.escuela, hechizo.descripcion],
      busqueda
    );
    if (!coincide) return false;
  }

  return true;
}
