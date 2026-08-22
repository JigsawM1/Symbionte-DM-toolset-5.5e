import { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, Caracteristica, Habilidad, GradoCompetencia } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { generarId } from "@/utiles/generarId";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "@/servicios/procesadorDescansos";
import { aplicarCondicion, quitarCondicion } from "@/servicios/procesadorCondiciones";

// ==========================================
// 1. INTERFAZ DEL SLICE DE PERSONAJES
// ==========================================

export interface SlicePersonajes {
  personajes: PersonajeJugador[];
  idPersonajeActivo: string | null;

  crearPersonaje: (datosIniciales?: Partial<PersonajeJugador>) => string;
  actualizarPersonaje: (id: string, cambios: Partial<PersonajeJugador>) => void;
  eliminarPersonaje: (id: string) => void;
  duplicarPersonaje: (id: string) => string;
  seleccionarPersonajeActivo: (id: string | null) => void;

  modificarHPPersonaje: (id: string, delta: number) => void;
  aplicarCuracionPersonaje: (id: string, cantidad: number) => void;
  aplicarDanoPersonaje: (id: string, cantidad: number) => void;
  establecerHPActualPersonaje: (id: string, valor: number) => void;
  modificarHPMaximoEfectivoPersonaje: (id: string, nuevoMax: number) => void;
  modificarHPMaximoBasePersonaje: (id: string, nuevoBase: number) => void;
  modificarHPTemporalPersonaje: (id: string, valor: number) => void;
  gastarDadoGolpePersonaje: (id: string, tiradas?: number[]) => void;
  ejecutarDescansoPersonaje: (
    id: string,
    tipo: "corto" | "largo",
    dadosAGastar?: number,
    tiradas?: number[]
  ) => void;
  alternarInspiracionPersonaje: (id: string) => void;
  modificarSalvacionesMuertePersonaje: (id: string, tipo: "exitos" | "fallos", delta: number) => void;
  establecerSalvacionesMuertePersonaje: (id: string, tipo: "exitos" | "fallos", valor: number) => void;
  reiniciarSalvacionesMuertePersonaje: (id: string) => void;
  modificarCansancioPersonaje: (id: string, delta: number) => void;

  modificarCaracteristicaBasePersonaje: (id: string, carac: Caracteristica, valor: number) => void;
  alternarSalvacionPersonaje: (id: string, carac: Caracteristica) => void;
  ciclarGradoHabilidadPersonaje: (id: string, hab: Habilidad) => void;

  aplicarCondicionPersonaje: (id: string, condicion: string) => void;
  quitarCondicionPersonaje: (id: string, condicion: string) => void;
  vincularMiniaturaTSPersonaje: (id: string, idMiniatura: string | null) => void;
}

const ORDEN_CICLO_HABILIDAD: Record<GradoCompetencia, GradoCompetencia> = {
  ninguna: "medio",
  medio: "competente",
  competente: "pericia",
  pericia: "ninguna"
};

// ==========================================
// 2. CREADOR DEL SLICE
// ==========================================

export const crearSlicePersonajes: StateCreator<
  EstadoDM,
  [],
  [],
  SlicePersonajes
> = (set, get) => ({
  personajes: [PERSONAJE_POR_DEFECTO],
  idPersonajeActivo: PERSONAJE_POR_DEFECTO.id,

  crearPersonaje: (datosIniciales) => {
    const nuevoId = generarId("pj");
    const nuevoPersonaje: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      ...datosIniciales,
      id: nuevoId,
      nombre: datosIniciales?.nombre || "Nuevo Personaje"
    };

    set((state) => ({
      personajes: [...state.personajes, nuevoPersonaje],
      idPersonajeActivo: nuevoId
    }));

    return nuevoId;
  },

  actualizarPersonaje: (id, cambios) => {
    set((state) => ({
      personajes: state.personajes.map((pj) =>
        pj.id === id ? { ...pj, ...cambios } : pj
      )
    }));
  },

  eliminarPersonaje: (id) => {
    set((state) => {
      const restantes = state.personajes.filter((pj) => pj.id !== id);
      let nuevoActivo = state.idPersonajeActivo;

      if (state.idPersonajeActivo === id) {
        nuevoActivo = restantes.length > 0 ? restantes[0].id : null;
      }

      return {
        personajes: restantes,
        idPersonajeActivo: nuevoActivo
      };
    });
  },

  duplicarPersonaje: (id) => {
    const state = get();
    const original = state.personajes.find((pj) => pj.id === id);
    if (!original) return "";

    const nuevoId = generarId("pj");
    const duplicado: PersonajeJugador = {
      ...original,
      id: nuevoId,
      nombre: `${original.nombre} (Copia)`
    };

    set((s) => ({
      personajes: [...s.personajes, duplicado],
      idPersonajeActivo: nuevoId
    }));

    return nuevoId;
  },

  seleccionarPersonajeActivo: (id) => {
    set({ idPersonajeActivo: id });
  },

  aplicarCuracionPersonaje: (id, cantidad) => {
    if (cantidad <= 0) return;
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const maxEfectivo = pj.hpMaximo || pj.hpMaximoBase || 10;
        const hpNuevo = Math.min(maxEfectivo, pj.hpActual + cantidad);
        return { ...pj, hpActual: hpNuevo };
      })
    }));
  },

  aplicarDanoPersonaje: (id, cantidad) => {
    if (cantidad <= 0) return;
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const temp = pj.hpTemporal || 0;

        if (temp > 0) {
          if (cantidad <= temp) {
            // El daño es absorbido completamente por el escudo (HP temporal)
            return { ...pj, hpTemporal: temp - cantidad };
          } else {
            // El escudo se rompe y el excedente daña la vida actual
            const excedente = cantidad - temp;
            const hpNuevo = Math.max(0, pj.hpActual - excedente);
            return { ...pj, hpTemporal: 0, hpActual: hpNuevo };
          }
        } else {
          // Sin escudo, todo el daño va directo a la vida actual
          const hpNuevo = Math.max(0, pj.hpActual - cantidad);
          return { ...pj, hpActual: hpNuevo };
        }
      })
    }));
  },

  modificarHPPersonaje: (id, delta) => {
    if (delta > 0) {
      get().aplicarCuracionPersonaje(id, delta);
    } else if (delta < 0) {
      get().aplicarDanoPersonaje(id, Math.abs(delta));
    }
  },

  establecerHPActualPersonaje: (id, valor) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const maxEfectivo = pj.hpMaximo || pj.hpMaximoBase || 10;
        const hpNuevo = Math.max(0, Math.min(maxEfectivo, valor));
        return { ...pj, hpActual: hpNuevo };
      })
    }));
  },

  modificarHPMaximoEfectivoPersonaje: (id, nuevoMax) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const maxValido = Math.max(1, nuevoMax || 1);
        return {
          ...pj,
          hpMaximo: maxValido,
          hpActual: Math.min(pj.hpActual, maxValido)
        };
      })
    }));
  },

  modificarHPMaximoBasePersonaje: (id, nuevoBase) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const baseValido = Math.max(1, nuevoBase || 1);
        return {
          ...pj,
          hpMaximoBase: baseValido,
          hpMaximo: baseValido,
          hpActual: Math.min(pj.hpActual, baseValido)
        };
      })
    }));
  },

  modificarHPTemporalPersonaje: (id, valor) => {
    set((state) => ({
      personajes: state.personajes.map((pj) =>
        pj.id === id ? { ...pj, hpTemporal: Math.max(0, valor) } : pj
      )
    }));
  },

  gastarDadoGolpePersonaje: (id, tiradas = []) => {
    const pj = get().personajes.find((p) => p.id === id);
    if (!pj || pj.dadosGolpeRestantes <= 0) return;

    const { personajeActualizado } = ejecutarDescansoCorto(pj, 1, tiradas);
    get().actualizarPersonaje(id, personajeActualizado);
  },

  ejecutarDescansoPersonaje: (id, tipo, dadosAGastar = 0, tiradas = []) => {
    const pj = get().personajes.find((p) => p.id === id);
    if (!pj) return;

    const { personajeActualizado } =
      tipo === "largo"
        ? ejecutarDescansoLargo(pj)
        : ejecutarDescansoCorto(pj, dadosAGastar, tiradas);

    get().actualizarPersonaje(id, personajeActualizado);
  },

  alternarInspiracionPersonaje: (id) => {
    set((state) => ({
      personajes: state.personajes.map((pj) =>
        pj.id === id ? { ...pj, inspiracion: !pj.inspiracion } : pj
      )
    }));
  },

  modificarSalvacionesMuertePersonaje: (id, tipo, delta) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const valorActual = pj.salvacionesMuerte[tipo];
        const valorNuevo = Math.max(0, Math.min(3, valorActual + delta));
        return {
          ...pj,
          salvacionesMuerte: {
            ...pj.salvacionesMuerte,
            [tipo]: valorNuevo
          }
        };
      })
    }));
  },

  establecerSalvacionesMuertePersonaje: (id, tipo, valor) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const valorClamped = Math.max(0, Math.min(3, valor));
        return {
          ...pj,
          salvacionesMuerte: {
            ...pj.salvacionesMuerte,
            [tipo]: valorClamped
          }
        };
      })
    }));
  },

  reiniciarSalvacionesMuertePersonaje: (id) => {
    set((state) => ({
      personajes: state.personajes.map((pj) =>
        pj.id === id
          ? { ...pj, salvacionesMuerte: { exitos: 0, fallos: 0 } }
          : pj
      )
    }));
  },

  modificarCansancioPersonaje: (id, delta) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const nuevoCansancio = Math.max(0, Math.min(6, (pj.cansancio || 0) + delta));
        const condicionesFiltradas = (pj.condicionesActivas || []).filter(
          (c) => !c.toLowerCase().startsWith("cansado") && !c.toLowerCase().startsWith("agotado")
        );
        const nuevasCondiciones =
          nuevoCansancio > 0
            ? [...condicionesFiltradas, `Cansado (Niv. ${nuevoCansancio})`]
            : condicionesFiltradas;

        return {
          ...pj,
          cansancio: nuevoCansancio,
          condicionesActivas: nuevasCondiciones
        };
      })
    }));
  },

  modificarCaracteristicaBasePersonaje: (id, carac, valor) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const nuevoValor = Math.max(1, Math.min(30, valor || 10));
        return {
          ...pj,
          caracteristicas: {
            ...pj.caracteristicas,
            [carac]: nuevoValor
          }
        };
      })
    }));
  },

  alternarSalvacionPersonaje: (id, carac) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const actual = pj.competenciasSalvacion[carac];
        return {
          ...pj,
          competenciasSalvacion: {
            ...pj.competenciasSalvacion,
            [carac]: !actual
          }
        };
      })
    }));
  },

  ciclarGradoHabilidadPersonaje: (id, hab) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const gradoActual = pj.gradosHabilidades[hab] || "ninguna";
        const nuevoGrado = ORDEN_CICLO_HABILIDAD[gradoActual] || "ninguna";
        return {
          ...pj,
          gradosHabilidades: {
            ...pj.gradosHabilidades,
            [hab]: nuevoGrado
          }
        };
      })
    }));
  },

  aplicarCondicionPersonaje: (id, condicion) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const normalizada = condicion.trim().toLowerCase();
        const esCansancio =
          normalizada.includes("cansado") ||
          normalizada.includes("exhausted") ||
          normalizada.includes("agotado");

        if (esCansancio) {
          const nuevoCansancio = Math.min(6, (pj.cansancio || 0) + 1);
          const condicionesFiltradas = (pj.condicionesActivas || []).filter(
            (c) => !c.toLowerCase().startsWith("cansado") && !c.toLowerCase().startsWith("agotado")
          );
          return {
            ...pj,
            cansancio: nuevoCansancio,
            condicionesActivas: [...condicionesFiltradas, `Cansado (Niv. ${nuevoCansancio})`]
          };
        }

        const nuevasCondiciones = aplicarCondicion(pj.condicionesActivas, condicion);
        return { ...pj, condicionesActivas: nuevasCondiciones };
      })
    }));
  },

  quitarCondicionPersonaje: (id, condicion) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        const normalizada = condicion.trim().toLowerCase();
        const esCansancio =
          normalizada.includes("cansado") ||
          normalizada.includes("exhausted") ||
          normalizada.includes("agotado");

        if (esCansancio) {
          const condicionesFiltradas = (pj.condicionesActivas || []).filter(
            (c) => !c.toLowerCase().startsWith("cansado") && !c.toLowerCase().startsWith("agotado")
          );
          return {
            ...pj,
            cansancio: 0,
            condicionesActivas: condicionesFiltradas
          };
        }

        const nuevasCondiciones = quitarCondicion(pj.condicionesActivas, condicion);
        return { ...pj, condicionesActivas: nuevasCondiciones };
      })
    }));
  },

  vincularMiniaturaTSPersonaje: (id, idMiniatura) => {
    set((state) => ({
      personajes: state.personajes.map((pj) =>
        pj.id === id ? { ...pj, idMiniaturaTS: idMiniatura } : pj
      )
    }));
  }
});
