/**
 * tipos.ts
 * --------
 * Definiciones de tipos e interfaces para la cola de iniciativa y acciones de combate.
 */

import type { StateCreator } from "zustand";
import type { CriaturaIniciativa, EstadoDM } from "@/almacen/usarAlmacenDM";
import type { Caracteristica, PersonajeJugador } from "@/tipos";
import type { ColaIniciativaTS } from "@/tipos/talespire";
import type { ReferenciaIniciativaFisica } from '@/servicios/seguimientoIniciativaFisica';

export interface ResultadoSalvacionCriatura {
  id: string;
  nombre: string;
  bono: number;
  d20: number;
  total: number;
  exito: boolean;
  dañoSufrido?: number;
  condicionAplicada?: boolean;
}

export interface ResultadoSalvacionArea {
  caracteristica: Caracteristica;
  cd: number;
  resultados: ResultadoSalvacionCriatura[];
}

export interface CriaturaSeleccionadaTS {
  id: string;
  name: string;
  maxHp?: number;
  hp?: number;
  esDeJugador?: boolean;
}

export interface CriaturaNativaTS {
  id: string;
  name: string;
  initiative?: number;
  maxHp?: number;
  hp?: number;
}

export interface SliceIniciativa {
  referenciaIniciativaFisica: ReferenciaIniciativaFisica | null;
  colaIniciativa: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  rondaActual: number;
  tipoTirada: "desventaja" | "plano" | "ventaja";
  criaturasSeleccionadas: CriaturaSeleccionadaTS[];
  asociacionesFichas: Record<string, string>;

  avanzarRonda: () => void;
  retrocederRonda: () => void;
  avanzarTurno: () => void;
  retrocederTurno: () => void;
  establecerTipoTirada: (tipo: "desventaja" | "plano" | "ventaja") => void;

  actualizarColaIniciativaDesdeTaleSpire: (colaTS: ColaIniciativaTS | null, idsMiniaturasJugadores?: Set<string> | string[]) => void;
  importarIniciativaTaleSpire: () => Promise<void>;
  agregarPersonajeAIniciativa: (personaje: PersonajeJugador) => void;
  alternarRolCriatura: (idCriatura: string) => void;
  agregarCriaturaAIniciativa: (
    nombre: string,
    iniciativa: number,
    vidaMax: number,
    ca: number,
    esMonstruo: boolean,
    velocidad: string,
    bonifInic: number,
    idPlantillaAsociada?: string
  ) => void;
  quitarCriaturaDeIniciativa: (id: string) => void;
  modificarVidaCriaturaIniciativa: (id: string, nuevaVida: number) => void;
  dañarCriaturaIniciativa: (id: string, cantidad: number) => void;
  modificarVidaMaximaCriaturaIniciativa: (id: string, nuevaVidaMax: number) => void;
  agregarCondicionACriatura: (id: string, condicion: string) => void;
  quitarCondicionDeCriatura: (id: string, condicion: string) => void;
  agregarEfectoACriatura: (idCriatura: string, nombreEfecto: string, duracion: number, opciones?: { concentracion?: boolean }) => void;
  quitarEfectoDeCriatura: (idCriatura: string, idEfecto: string) => void;
  asociarPlantillaACriatura: (idCriatura: string, idPlantilla: string) => void;
  desvincularPlantillaDeCriatura: (idCriatura: string) => void;
  actualizarVidaTemporal: (idCriatura: string, vidaTemp: number) => void;
  establecerIniciativaCriatura: (idCriatura: string, nuevaIniciativa: number) => void;
  limpiarIniciativa: () => void;
  ordenarIniciativa: () => void;
  autoLanzarIniciativaMonstruos: () => void;

  actualizarSeleccionCriaturas: (seleccionadas: CriaturaSeleccionadaTS[]) => void;
  agregarCriaturasSeleccionadasAIniciativa: () => void;
  aplicarDañoEnArea: (cantidad: number, idsObjetivo?: string[]) => void;
  aplicarCondicionEnArea: (condicion: string, idsObjetivo?: string[]) => void;
  aplicarEfectoEnArea: (nombreEfecto: string, duracion: number, opciones?: { concentracion?: boolean }, idsObjetivo?: string[]) => void;
  ejecutarSalvacionEnArea: (
    caracteristica: Caracteristica,
    cd: number,
    dañoBruto?: number,
    condicionOEfecto?: { nombre: string; tipo: "condicion" | "efecto"; duracion?: number; esConcentracion?: boolean },
    mitigacion?: "mitad" | "nada",
    idsObjetivo?: string[]
  ) => ResultadoSalvacionArea | null;
}

export type CreadorSliceIniciativa = StateCreator<
  EstadoDM,
  [],
  [],
  SliceIniciativa
>;
