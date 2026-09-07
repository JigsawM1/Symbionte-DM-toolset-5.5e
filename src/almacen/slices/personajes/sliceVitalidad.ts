import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "@/servicios/procesadorDescansos";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceVitalidad } from "./slicePersonajesTipos";

export const crearSubSliceVitalidad: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceVitalidad
> = (set, get) => ({
  aplicarCuracionPersonaje: (id, cantidad) => {
    if (cantidad <= 0) return;
    mutarPersonaje(set, id, (pj) => {
      const maxEfectivo = pj.hpMaximo || pj.hpMaximoBase || 10;
      const hpNuevo = Math.min(maxEfectivo, pj.hpActual + cantidad);
      return { ...pj, hpActual: hpNuevo };
    });
  },

  aplicarDanoPersonaje: (id, cantidad) => {
    if (cantidad <= 0) return;
    mutarPersonaje(set, id, (pj) => {
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
    });
  },

  modificarHPPersonaje: (id, delta) => {
    if (delta > 0) {
      get().aplicarCuracionPersonaje(id, delta);
    } else if (delta < 0) {
      get().aplicarDanoPersonaje(id, Math.abs(delta));
    }
  },

  establecerHPActualPersonaje: (id, valor) => {
    mutarPersonaje(set, id, (pj) => {
      const maxEfectivo = pj.hpMaximo || pj.hpMaximoBase || 10;
      const hpNuevo = Math.max(0, Math.min(maxEfectivo, valor));
      return { ...pj, hpActual: hpNuevo };
    });
  },

  modificarHPMaximoEfectivoPersonaje: (id, nuevoMax) => {
    mutarPersonaje(set, id, (pj) => {
      const maxValido = Math.max(1, nuevoMax || 1);
      return {
        ...pj,
        hpMaximo: maxValido,
        hpActual: Math.min(pj.hpActual, maxValido)
      };
    });
  },

  modificarHPMaximoBasePersonaje: (id, nuevoBase) => {
    mutarPersonaje(set, id, (pj) => {
      const baseValido = Math.max(1, nuevoBase || 1);
      return {
        ...pj,
        hpMaximoBase: baseValido,
        hpMaximo: baseValido,
        hpActual: Math.min(pj.hpActual, baseValido)
      };
    });
  },

  modificarHPTemporalPersonaje: (id, valor) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      hpTemporal: Math.max(0, valor)
    }));
  },

  gastarDadoGolpePersonaje: (id, tiradas = []) => {
    const pj = get().personajes.find((p) => p.id === id);
    if (!pj || pj.dadosGolpeRestantes <= 0) return;

    const { personajeActualizado } = ejecutarDescansoCorto(pj, 1, tiradas);
    get().actualizarPersonaje(id, personajeActualizado);
  },

  establecerDadosGolpeRestantesPersonaje: (id, valor) => {
    mutarPersonaje(set, id, (pj) => {
      const maxDados = pj.dadosGolpeTotal || pj.nivel || 1;
      const valorValido = Math.max(0, Math.min(maxDados, Math.floor(valor)));
      return {
        ...pj,
        dadosGolpeRestantes: valorValido
      };
    });
  },

  ejecutarDescansoPersonaje: (id, tipo, dadosAGastar = 0, tiradas = []) => {
    const pj = get().personajes.find((p) => p.id === id);
    if (!pj) return null;

    const resultado =
      tipo === "largo"
        ? ejecutarDescansoLargo(pj)
        : ejecutarDescansoCorto(pj, dadosAGastar, tiradas);

    get().actualizarPersonaje(id, resultado.personajeActualizado);
    return resultado;
  },

  alternarInspiracionPersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      inspiracion: !pj.inspiracion
    }));
  },

  modificarSalvacionesMuertePersonaje: (id, tipo, delta) => {
    mutarPersonaje(set, id, (pj) => {
      const valorActual = pj.salvacionesMuerte[tipo];
      const valorNuevo = Math.max(0, Math.min(3, valorActual + delta));
      return {
        ...pj,
        salvacionesMuerte: {
          ...pj.salvacionesMuerte,
          [tipo]: valorNuevo
        }
      };
    });
  },

  establecerSalvacionesMuertePersonaje: (id, tipo, valor) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      salvacionesMuerte: {
        ...pj.salvacionesMuerte,
        [tipo]: Math.max(0, Math.min(3, valor))
      }
    }));
  },

  reiniciarSalvacionesMuertePersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      salvacionesMuerte: { exitos: 0, fallos: 0 }
    }));
  },

  modificarCansancioPersonaje: (id, delta) => {
    mutarPersonaje(set, id, (pj) => {
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
    });
  }
});
