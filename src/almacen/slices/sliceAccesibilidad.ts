import { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import {
  ConfiguracionAccesibilidad,
  CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO,
  EscalaFuente
} from "@/tipos/accesibilidad";
import { logger } from "@/utiles/logger";

const CLAVE_LOCALSTORAGE_ACCESIBILIDAD = "simbionte_accesibilidad";

const FACTORES_ESCALA: Record<EscalaFuente, number> = {
  compacta: 0.9,
  normal: 1.0,
  grande: 1.15,
  "muy-grande": 1.3
};

export const cargarAccesibilidadInicial = (): ConfiguracionAccesibilidad => {
  if (typeof localStorage === "undefined") {
    return CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO;
  }

  try {
    const raw = localStorage.getItem(CLAVE_LOCALSTORAGE_ACCESIBILIDAD);
    if (!raw) return CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO;
    const parseado = JSON.parse(raw) as Partial<ConfiguracionAccesibilidad>;
    const escala = parseado.escalaFuente || CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO.escalaFuente;
    return {
      ...CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO,
      ...parseado,
      escalaFuente: escala,
      factorEscala: FACTORES_ESCALA[escala] ?? 1.0
    };
  } catch (error) {
    logger.error("[Accesibilidad] Error al leer configuración de localStorage:", error);
    return CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO;
  }
};

const guardarAccesibilidadEnStorage = (config: ConfiguracionAccesibilidad): void => {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(CLAVE_LOCALSTORAGE_ACCESIBILIDAD, JSON.stringify(config));
  } catch (error) {
    logger.error("[Accesibilidad] Error al guardar configuración en localStorage:", error);
  }
};

export interface SliceAccesibilidad {
  accesibilidad: ConfiguracionAccesibilidad;
  actualizarAccesibilidad: (cambios: Partial<ConfiguracionAccesibilidad>) => void;
  restablecerAccesibilidad: () => void;
}

export const crearSliceAccesibilidad: StateCreator<
  EstadoDM,
  [],
  [],
  SliceAccesibilidad
> = (set) => ({
  accesibilidad: cargarAccesibilidadInicial(),

  actualizarAccesibilidad: (cambios) => {
    set((state) => {
      const nuevaEscala = cambios.escalaFuente ?? state.accesibilidad.escalaFuente;
      const nuevoFactor = FACTORES_ESCALA[nuevaEscala] ?? 1.0;

      const nuevaConfig: ConfiguracionAccesibilidad = {
        ...state.accesibilidad,
        ...cambios,
        escalaFuente: nuevaEscala,
        factorEscala: nuevoFactor
      };

      guardarAccesibilidadEnStorage(nuevaConfig);
      return { accesibilidad: nuevaConfig };
    });
  },

  restablecerAccesibilidad: () => {
    guardarAccesibilidadEnStorage(CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO);
    set({ accesibilidad: CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO });
  }
});

