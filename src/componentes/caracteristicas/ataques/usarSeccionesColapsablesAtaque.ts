import { useCallback, useMemo } from "react";
import { usarEstadoPersistido } from "@/hooks";

export const SECCIONES_COMBATE_POR_DEFECTO: Readonly<Record<string, boolean>> = {
  recursos: true,
  fisicos: true,
  magicos: true,
  magicos_nv_0: true,
  magicos_nv_1: true,
  magicos_nv_2: true,
  magicos_nv_3: true,
  magicos_nv_4: true,
  magicos_nv_5: true,
  magicos_nv_6: true,
  magicos_nv_7: true,
  magicos_nv_8: true,
  magicos_nv_9: true,
  magicos_ocultos: true,
  rasgos: true,
  consumibles: true,
  hechizosObjetos: true
};

const SECCIONES_PRINCIPALES_COMBATE = [
  "recursos",
  "fisicos",
  "magicos",
  "rasgos",
  "consumibles",
  "hechizosObjetos"
] as const;

/**
 * Hook modularizado para la gestión del estado colapsable persistente
 * de las secciones en la pestaña de Acciones y Combate del jugador.
 */
export function usarSeccionesColapsablesAtaque() {
  const [seccionesAbiertas, setSeccionesAbiertas] = usarEstadoPersistido<Record<string, boolean>>(
    "ts_acciones_secciones",
    SECCIONES_COMBATE_POR_DEFECTO as Record<string, boolean>
  );

  const alternarSeccion = useCallback((seccion: string) => {
    setSeccionesAbiertas((prev) => {
      const actual = prev[seccion] !== false;
      return {
        ...prev,
        [seccion]: !actual
      };
    });
  }, [setSeccionesAbiertas]);

  const colapsarTodasSecciones = useCallback(() => {
    setSeccionesAbiertas((prev) => {
      const colapsadas: Record<string, boolean> = {};
      for (const k of Object.keys({ ...SECCIONES_COMBATE_POR_DEFECTO, ...prev })) {
        colapsadas[k] = false;
      }
      return colapsadas;
    });
  }, [setSeccionesAbiertas]);

  const expandirTodasSecciones = useCallback(() => {
    setSeccionesAbiertas((prev) => {
      const expandidas: Record<string, boolean> = {};
      for (const k of Object.keys({ ...SECCIONES_COMBATE_POR_DEFECTO, ...prev })) {
        expandidas[k] = true;
      }
      return expandidas;
    });
  }, [setSeccionesAbiertas]);

  const estanTodasSeccionesColapsadas = useMemo(() => {
    return SECCIONES_PRINCIPALES_COMBATE.every((sec) => seccionesAbiertas[sec] === false);
  }, [seccionesAbiertas]);

  const alternarTodasSecciones = useCallback(() => {
    if (estanTodasSeccionesColapsadas) {
      expandirTodasSecciones();
    } else {
      colapsarTodasSecciones();
    }
  }, [estanTodasSeccionesColapsadas, expandirTodasSecciones, colapsarTodasSecciones]);

  return {
    seccionesAbiertas,
    alternarSeccion,
    colapsarTodasSecciones,
    expandirTodasSecciones,
    estanTodasSeccionesColapsadas,
    alternarTodasSecciones
  };
}
