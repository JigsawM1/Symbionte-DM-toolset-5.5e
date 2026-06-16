/**
 * indiceMonstruos.ts
 * ------------------
 * Servicio centralizado para la indexación y búsqueda rápida O(1) de plantillas
 * de monstruos en base a su ID o su nombre normalizado.
 *
 * Programado 100% en español.
 */

import { useMemo } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import type { MonstruoBase } from "../almacen/usarAlmacenDM";

export interface IndiceMonstruos {
  porId: Map<string, MonstruoBase>;
  porNombre: Map<string, MonstruoBase>;
  listaCompleta: MonstruoBase[];
}

/**
 * Crea las estructuras de indexación (Maps) a partir de una lista plana de monstruos.
 */
export function crearIndiceMonstruos(monstruos: MonstruoBase[]): IndiceMonstruos {
  const porId = new Map<string, MonstruoBase>();
  const porNombre = new Map<string, MonstruoBase>();

  for (const m of monstruos) {
    porId.set(m.id, m);

    const nombreNormalizado = m.nombre.toLowerCase().trim();
    // Guardamos la primera coincidencia en caso de nombres duplicados
    if (!porNombre.has(nombreNormalizado)) {
      porNombre.set(nombreNormalizado, m);
    }
  }

  return {
    porId,
    porNombre,
    listaCompleta: monstruos
  };
}

/**
 * Hook de React para consumir el índice de plantillas de monstruos en caliente,
 * con invalidación automática cuando cambia la base de datos de monstruos.
 */
export function usarIndiceMonstruos(): IndiceMonstruos {
  const baseDatosMonstruos = usarAlmacenDM((state) => state.baseDatosMonstruos);

  return useMemo(() => {
    return crearIndiceMonstruos(baseDatosMonstruos);
  }, [baseDatosMonstruos]);
}
