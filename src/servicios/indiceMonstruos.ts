/**
 * indiceMonstruos.ts
 * ------------------
 * Servicio centralizado para la indexación y búsqueda rápida O(1) de plantillas
 * de monstruos en base a su ID o su nombre normalizado.
 *
 */

import { useMemo } from "react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { MonstruoBase } from "@/almacen/usarAlmacenDM";

export interface EntradaPrefijoMonstruo {
  monstruo: MonstruoBase;
  nombreLower: string;
  nombreSinTildes: string;
  longitud: number;
}

export interface IndiceMonstruos {
  porId: Map<string, MonstruoBase>;
  porNombre: Map<string, MonstruoBase>;
  porNombreSinTildes: Map<string, MonstruoBase>;
  entradasPrefijo: EntradaPrefijoMonstruo[];
  listaCompleta: MonstruoBase[];
}

const cacheIndicesPorReferencia = new WeakMap<MonstruoBase[], IndiceMonstruos>();

function quitarDiacriticos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Crea las estructuras de indexación (Maps) a partir de una lista plana de monstruos.
 * Memoiza por referencia de array mediante WeakMap para evitar reconstrucciones redundantes.
 */
export function crearIndiceMonstruos(monstruos: MonstruoBase[]): IndiceMonstruos {
  if (monstruos && typeof monstruos === "object") {
    const enCache = cacheIndicesPorReferencia.get(monstruos);
    if (enCache) return enCache;
  }

  const porId = new Map<string, MonstruoBase>();
  const porNombre = new Map<string, MonstruoBase>();
  const porNombreSinTildes = new Map<string, MonstruoBase>();
  const entradasPrefijo: EntradaPrefijoMonstruo[] = [];

  for (const m of monstruos) {
    porId.set(m.id, m);

    const nombreNormalizado = m.nombre.toLowerCase().trim();
    const nombreSinTildes = quitarDiacriticos(nombreNormalizado);

    // Guardamos la primera coincidencia en caso de nombres duplicados
    if (!porNombre.has(nombreNormalizado)) {
      porNombre.set(nombreNormalizado, m);
    }
    if (!porNombreSinTildes.has(nombreSinTildes)) {
      porNombreSinTildes.set(nombreSinTildes, m);
    }

    if (nombreNormalizado.length > 0) {
      entradasPrefijo.push({
        monstruo: m,
        nombreLower: nombreNormalizado,
        nombreSinTildes,
        longitud: nombreNormalizado.length
      });
    }
  }

  const indice: IndiceMonstruos = {
    porId,
    porNombre,
    porNombreSinTildes,
    entradasPrefijo,
    listaCompleta: monstruos
  };

  if (monstruos && typeof monstruos === "object") {
    cacheIndicesPorReferencia.set(monstruos, indice);
  }

  return indice;
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
