import { create, StateCreator } from "zustand";
import { crearSliceIniciativa, SliceIniciativa } from "./slices/sliceIniciativa";
import { crearSliceHomebrew, SliceHomebrew } from "./slices/sliceHomebrew";
import { crearSliceConfiguracion, SliceConfiguracion } from "./slices/sliceConfiguracion";
import { crearSlicePersonajes, SlicePersonajes } from "./slices/slicePersonajes";
import { crearSliceSync, SliceSync } from "./slices/sliceSync";
import { crearSliceAccesibilidad, SliceAccesibilidad } from "./slices/sliceAccesibilidad";

// Re-exportar tipos para mantener compatibilidad hacia atrás
export * from "@/tipos";
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

  // Propiedades dinámicas de movimiento y vinculación a jugador / acompañante
  movimientoGastado?: number;
  movimientoMaximoTemporal?: number | null;
  idPersonajeDuenio?: string;
  idAcompanante?: string;
  esAcompanante?: boolean;
  pasivas?: {
    percepcion: number;
    investigacion: number;
    perspicacia: number;
  };
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
export interface EstadoDM extends SliceIniciativa, SliceHomebrew, SliceConfiguracion, SlicePersonajes, SliceSync, SliceAccesibilidad {}

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
  "encuentrosGuardados",
  "personajes",
  "idPersonajeActivo"
];

type PersistenciaMiddleware = (
  configuradorStore: StateCreator<EstadoDM, [], []>
) => StateCreator<EstadoDM, [], []>;

const persistenciaMiddleware: PersistenciaMiddleware = (configuradorStore) => (set, get, api) => {
  const nuevoSet: typeof set = (...args) => {
    const estadoPrevio = get();
    set(...args);
    const estadoNuevo = get();

    // Si está cargando datos persistidos o aún no ha completado la carga inicial en frío, o está aplicando sync en tránsito, ignoramos la persistencia
    if (estadoNuevo.cargandoDatos || !estadoNuevo.datosInicialesCargados || estadoNuevo.aplicandoSync) {
      return;
    }

    const haCambiado = CLAVES_PERSISTIBLES.some(
      (clave) => estadoPrevio[clave] !== estadoNuevo[clave]
    );

    if (haCambiado) {
      persistirEstadoCompleto(estadoNuevo);
    }
  };

  // Soporte para SSR y pruebas unitarias con renderToStaticMarkup en React 18:
  // Permite que useSyncExternalStore consulte el estado reactivo actual en lugar del estado congelado en frío.
  (api as unknown as { getServerState?: () => EstadoDM }).getServerState = () => get();

  return configuradorStore(nuevoSet, get, api);
};

export const usarAlmacenDM = create<EstadoDM>()(
  persistenciaMiddleware((set, get, api) => ({
    ...crearSliceIniciativa(set, get, api),
    ...crearSliceHomebrew(set, get, api),
    ...crearSliceConfiguracion(set, get, api),
    ...crearSlicePersonajes(set, get, api),
    ...crearSliceSync(set, get, api),
    ...crearSliceAccesibilidad(set, get, api)
  }))
);

