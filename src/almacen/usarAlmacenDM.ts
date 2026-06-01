import { create, StateCreator } from "zustand";
import { crearSliceIniciativa, SliceIniciativa } from "./slices/sliceIniciativa";
import { crearSliceHomebrew, SliceHomebrew } from "./slices/sliceHomebrew";
import { crearSliceConfiguracion, SliceConfiguracion } from "./slices/sliceConfiguracion";

// Re-exportar tipos para mantener compatibilidad hacia atrás
export * from "../tipos";
export * from "./sanitizacion";
export * from "./persistencia";

// Tipos fuertemente tipados en español
export interface EfectoActivo {
  id: string;
  nombre: string;
  expiraRonda?: number;   // Ronda en que el efecto expira automáticamente
  concentracion?: boolean; // Si es un efecto de concentración
  duracion?: number;      // Para compatibilidad con efectos antiguos
}

export interface CriaturaIniciativa {
  id: string; // ID único (de TaleSpire o local)
  nombre: string;
  iniciativa: number;
  vidaMaxima: number;
  vidaActual: number;
  ca: number;
  condiciones: string[];
  efectos?: EfectoActivo[];
  bonificadorIniciativa: number;
  esMonstruo: boolean;
  velocidad: string;
  vidaTemporal?: number;
  idPlantillaAsociada?: string;
}


export interface ElementoPendiente {
  id: string;
  texto: string;
  completado: boolean;
}

export interface EncuentroGuardado {
  nombre: string;
  ronda: number;
  cola: CriaturaIniciativa[];
  fecha: string;
}

export interface NotificacionUI {
  id: string;
  mensaje: string;
  tipo: "exito" | "error" | "info" | "advertencia";
}

import { persistirEstadoCompleto } from "./persistencia";

// Interfaz del Estado combinando todos los Slices para TypeScript estricto
export interface EstadoDM extends SliceIniciativa, SliceHomebrew, SliceConfiguracion {}

const CLAVES_PERSISTIBLES: (keyof EstadoDM)[] = [
  "colaIniciativa",
  "indiceTurnoActivo",
  "rondaActual",
  "asociacionesFichas",
  "baseDatosMonstruos",
  "baseDatosHechizos",
  "objetosHomebrew",
  "metodoVidaMonstruo",
  "listaPendientes",
  "notasDM",
  "encuentrosGuardados"
];

type PersistenciaMiddleware = (
  configuradorStore: StateCreator<EstadoDM, [], []>
) => StateCreator<EstadoDM, [], []>;

const persistenciaMiddleware: PersistenciaMiddleware = (configuradorStore) => (set, get, api) => {
  const nuevoSet: typeof set = (...args) => {
    const estadoPrevio = { ...get() };
    set(...args);
    const estadoNuevo = get();

    // Si está cargando datos persistidos o restableciendo de fábrica, ignoramos la persistencia instantánea para evitar I/O redundante
    if (estadoNuevo.cargandoDatos) {
      return;
    }

    const haCambiado = CLAVES_PERSISTIBLES.some(
      (clave) => estadoPrevio[clave] !== estadoNuevo[clave]
    );

    if (haCambiado) {
      persistirEstadoCompleto(estadoNuevo);
    }
  };

  return configuradorStore(nuevoSet, get, api);
};

export const usarAlmacenDM = create<EstadoDM>()(
  persistenciaMiddleware((set, get, api) => ({
    ...crearSliceIniciativa(set, get, api),
    ...crearSliceHomebrew(set, get, api),
    ...crearSliceConfiguracion(set, get, api)
  }))
);

