import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceAcompanantes } from "./slicePersonajesTipos";

/**
 * Sub-slice dedicado a la gestión reactiva de acompañantes y sidekicks vinculados a un personaje.
 */
export const crearSubSliceAcompanantes: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceAcompanantes
> = (set) => ({
  agregarAcompanantePersonaje: (idPersonaje, acompanante) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: [...(pj.acompanantes || []), acompanante]
    }));
  },

  eliminarAcompanantePersonaje: (idPersonaje, idAcompanante) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).filter((a) => a.id !== idAcompanante)
    }));
  },

  modificarVidaAcompanante: (idPersonaje, idAcompanante, vidaActual, vidaTemporal) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((a) => {
        if (a.id !== idAcompanante) return a;
        return {
          ...a,
          vidaActual: Math.max(0, Math.min(a.vidaMaxima, vidaActual)),
          ...(vidaTemporal !== undefined ? { vidaTemporal: Math.max(0, vidaTemporal) } : {})
        };
      })
    }));
  },

  actualizarAcompanante: (idPersonaje, idAcompanante, cambios) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((a) => {
        if (a.id !== idAcompanante) return a;
        return {
          ...a,
          ...cambios
        };
      })
    }));
  },

  vincularMiniaturaTSAcompanante: (idPersonaje, idAcompanante, idMiniatura) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((a) => {
        if (a.id !== idAcompanante) return a;
        return {
          ...a,
          idMiniaturaTS: idMiniatura
        };
      })
    }));
  }
});
