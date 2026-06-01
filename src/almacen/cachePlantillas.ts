import { useMemo } from "react";
import { usarAlmacenDM } from "./usarAlmacenDM";
import type { MonstruoBase } from "../tipos";

/**
 * Crea un Map indexado por ID de monstruo para búsquedas O(1)
 */
export function crearIndicePlantillas(monstruos: MonstruoBase[]): Map<string, MonstruoBase> {
  const mapa = new Map<string, MonstruoBase>();
  for (const m of monstruos) {
    mapa.set(m.id, m);
  }
  return mapa;
}

/**
 * Crea un Map indexado por nombre de monstruo normalizado para búsquedas O(1)
 */
export function crearIndiceNombres(monstruos: MonstruoBase[]): Map<string, MonstruoBase> {
  const mapa = new Map<string, MonstruoBase>();
  for (const m of monstruos) {
    const nombreNormalizado = m.nombre.toLowerCase().trim();
    // Guardamos la primera coincidencia o la prioritaria
    if (!mapa.has(nombreNormalizado)) {
      mapa.set(nombreNormalizado, m);
    }
  }
  return mapa;
}

/**
 * Hook de React para obtener los índices de plantillas memoizados
 */
export function usarIndicePlantillas() {
  const baseDatosMonstruos = usarAlmacenDM((state) => state.baseDatosMonstruos);

  const indices = useMemo(() => {
    return {
      porId: crearIndicePlantillas(baseDatosMonstruos),
      porNombre: crearIndiceNombres(baseDatosMonstruos)
    };
  }, [baseDatosMonstruos]);

  return indices;
}
