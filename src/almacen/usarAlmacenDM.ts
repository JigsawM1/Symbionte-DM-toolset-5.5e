import { create } from "zustand";
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
  duracion: number; // en rondas
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

// Interfaz del Estado combinando todos los Slices para TypeScript estricto
export interface EstadoDM extends SliceIniciativa, SliceHomebrew, SliceConfiguracion {}

export const usarAlmacenDM = create<EstadoDM>()((...a) => ({
  ...crearSliceIniciativa(...a),
  ...crearSliceHomebrew(...a),
  ...crearSliceConfiguracion(...a)
}));
