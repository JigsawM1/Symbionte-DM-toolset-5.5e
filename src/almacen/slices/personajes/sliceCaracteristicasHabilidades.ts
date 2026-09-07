import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { GradoCompetencia } from "@/tipos";
import { tieneMedioBonoHabilidades } from "@/servicios/evaluadorEfectosRasgos";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceCaracteristicasHabilidades } from "./slicePersonajesTipos";

const ORDEN_CICLO_HABILIDAD: Record<GradoCompetencia, GradoCompetencia> = {
  ninguna: "medio",
  medio: "competente",
  competente: "pericia",
  pericia: "ninguna"
};

export const crearSubSliceCaracteristicasHabilidades: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceCaracteristicasHabilidades
> = (set) => ({
  modificarCaracteristicaBasePersonaje: (id, carac, valor) => {
    mutarPersonaje(set, id, (pj) => {
      const nuevoValor = Math.max(1, Math.min(30, valor || 10));
      const nuevasCarac = {
        ...pj.caracteristicas,
        [carac]: nuevoValor
      };

      let rasgosActualizados = pj.rasgos;
      if (carac === "carisma" && Array.isArray(pj.rasgos)) {
        const scoreCar = pj.overridesFijos?.carisma ?? nuevoValor;
        const modCar = Math.floor((scoreCar - 10) / 2);
        const usosNuevos = Math.max(1, modCar);

        rasgosActualizados = pj.rasgos.map((r) => {
          const norm = (r.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (
            norm.includes("inspiracion bardica") ||
            (r.tieneUsosLimitados && (r.formulaEscalado || "").toLowerCase().includes("carisma")) ||
            (r.tieneUsosLimitados && (r.descripcion || "").toLowerCase().includes("modificador por carisma"))
          ) {
            const diferencia = usosNuevos - (r.usosMaximos ?? 1);
            const restantes = r.usosRestantes ?? (r.usosMaximos ?? 1);
            return {
              ...r,
              usosMaximos: usosNuevos,
              usosRestantes: Math.max(0, Math.min(usosNuevos, restantes + (diferencia > 0 ? diferencia : 0)))
            };
          }
          return r;
        });
      }

      return {
        ...pj,
        caracteristicas: nuevasCarac,
        rasgos: rasgosActualizados
      };
    });
  },

  alternarSalvacionPersonaje: (id, carac) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      competenciasSalvacion: {
        ...pj.competenciasSalvacion,
        [carac]: !pj.competenciasSalvacion[carac]
      }
    }));
  },

  ciclarGradoHabilidadPersonaje: (id, hab) => {
    mutarPersonaje(set, id, (pj) => {
      const tieneAprendiz = tieneMedioBonoHabilidades(pj);
      const gradoActual = pj.gradosHabilidades[hab] || "ninguna";
      const nuevoGrado = ORDEN_CICLO_HABILIDAD[gradoActual] || "ninguna";
      const nuevoGradoFinal = (nuevoGrado === "ninguna" && tieneAprendiz) ? "medio" : nuevoGrado;
      return {
        ...pj,
        gradosHabilidades: {
          ...pj.gradosHabilidades,
          [hab]: nuevoGradoFinal
        }
      };
    });
  },

  establecerGradoHabilidadPersonaje: (id, hab, grado) => {
    mutarPersonaje(set, id, (pj) => {
      const tieneAprendiz = tieneMedioBonoHabilidades(pj);
      const gradoFinal = (grado === "ninguna" && tieneAprendiz) ? "medio" : grado;
      return {
        ...pj,
        gradosHabilidades: {
          ...pj.gradosHabilidades,
          [hab]: gradoFinal
        }
      };
    });
  },

  personalizarHabilidadPersonaje: (id, hab, datos) => {
    mutarPersonaje(set, id, (pj) => {
      const actual = pj.personalizacionesHabilidades?.[hab] || {
        modificadorExtra: 0,
        valorFijo: null,
        notas: ""
      };
      return {
        ...pj,
        personalizacionesHabilidades: {
          ...pj.personalizacionesHabilidades,
          [hab]: { ...actual, ...datos }
        }
      };
    });
  },

  personalizarCaracteristicaPersonaje: (id, carac, datos) => {
    mutarPersonaje(set, id, (pj) => {
      const actual = pj.personalizacionesCaracteristicas?.[carac] || {
        modificadorExtra: 0,
        valorFijo: null,
        bonoSalvacionExtra: 0,
        notas: ""
      };
      const nuevasPersonalizaciones = {
        ...pj.personalizacionesCaracteristicas,
        [carac]: { ...actual, ...datos }
      };

      let rasgosActualizados = pj.rasgos;
      if (carac === "carisma" && Array.isArray(pj.rasgos)) {
        const scoreBase = pj.overridesFijos?.carisma ?? pj.caracteristicas?.carisma ?? 10;
        const modBase = Math.floor((scoreBase - 10) / 2);
        const modEfectivo = datos.valorFijo !== undefined && datos.valorFijo !== null
          ? datos.valorFijo
          : modBase + (datos.modificadorExtra !== undefined ? datos.modificadorExtra : actual.modificadorExtra || 0);
        const usosNuevos = Math.max(1, modEfectivo);

        rasgosActualizados = pj.rasgos.map((r) => {
          const norm = (r.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (
            norm.includes("inspiracion bardica") ||
            (r.tieneUsosLimitados && (r.formulaEscalado || "").toLowerCase().includes("carisma")) ||
            (r.tieneUsosLimitados && (r.descripcion || "").toLowerCase().includes("modificador por carisma"))
          ) {
            const diferencia = usosNuevos - (r.usosMaximos ?? 1);
            const restantes = r.usosRestantes ?? (r.usosMaximos ?? 1);
            return {
              ...r,
              usosMaximos: usosNuevos,
              usosRestantes: Math.max(0, Math.min(usosNuevos, restantes + (diferencia > 0 ? diferencia : 0)))
            };
          }
          return r;
        });
      }

      return {
        ...pj,
        personalizacionesCaracteristicas: nuevasPersonalizaciones,
        rasgos: rasgosActualizados
      };
    });
  }
});
