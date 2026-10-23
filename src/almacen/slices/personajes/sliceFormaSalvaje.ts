import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { SubSliceRasgos } from "./slicePersonajesTipos";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import {
  calcularHpTemporalFormaSalvaje,
  obtenerNivelDruida,
  esDruidaCirculoLuna,
  calcularReglasFormaSalvaje
} from "@/servicios/reglasFormaSalvaje";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";

export const crearSliceFormaSalvaje: StateCreator<
  EstadoDM,
  [],
  [],
  Pick<
    SubSliceRasgos,
    "establecerFormasConocidasDruida" | "transformarEnFormaSalvaje" | "revertirFormaSalvaje"
  >
> = (set, get) => ({
  establecerFormasConocidasDruida: (idPj, formasIds) => {
    mutarPersonaje(set, idPj, (pj) => {
      const nivelDruida = obtenerNivelDruida(pj);
      const esLuna = esDruidaCirculoLuna(pj);
      const reglas = calcularReglasFormaSalvaje(nivelDruida, esLuna);

      // Limitar a la cantidad máxima permitida por nivel
      const formasRecortadas = formasIds.slice(0, reglas.maxFormasConocidas);

      return {
        ...pj,
        formaSalvaje: {
          ...(pj.formaSalvaje || { formaActivaId: null, hpTemporalAlTransformar: 0 }),
          formasConocidasIds: formasRecortadas
        }
      };
    });
  },

  transformarEnFormaSalvaje: (idPj, idBestia) => {
    mutarPersonaje(set, idPj, (pj) => {
      const nivelDruida = obtenerNivelDruida(pj);
      const esLuna = esDruidaCirculoLuna(pj);
      const hpTemp = calcularHpTemporalFormaSalvaje(nivelDruida, esLuna);

      // 1. Descontar uso del rasgo "Forma salvaje" si lo tiene
      let rasgosActualizados = pj.rasgos || [];
      const rasgoForma = rasgosActualizados.find(
        (r) => r.nombre.toLowerCase().trim() === "forma salvaje"
      );

      if (rasgoForma && rasgoForma.tieneUsosLimitados) {
        const restantes = rasgoForma.usosRestantes ?? rasgoForma.usosMaximos ?? 2;
        if (restantes > 0) {
          rasgosActualizados = rasgosActualizados.map((r) =>
            r.id === rasgoForma.id
              ? { ...r, usosRestantes: Math.max(0, restantes - 1), activo: true }
              : r
          );
        }
      }

      // 2. Aplicar condición de Forma salvaje
      let condicionesActualizadas = pj.condicionesActivas || [];
      if (!condicionesActualizadas.includes("Forma salvaje")) {
        condicionesActualizadas = aplicarCondicion(condicionesActualizadas, "Forma salvaje");
      }

      // 3. Asignar PG temporales si son mayores que los actuales (según reglas 5e)
      const hpTempActual = pj.hpTemporal || 0;
      const nuevoHpTemporal = Math.max(hpTempActual, hpTemp);

      return {
        ...pj,
        rasgos: rasgosActualizados,
        condicionesActivas: condicionesActualizadas,
        hpTemporal: nuevoHpTemporal,
        formaSalvaje: {
          ...(pj.formaSalvaje || { formasConocidasIds: [] }),
          formaActivaId: idBestia,
          hpTemporalAlTransformar: hpTemp
        }
      };
    });
  },

  revertirFormaSalvaje: (idPj) => {
    mutarPersonaje(set, idPj, (pj) => {
      // 1. Desactivar rasgo "Forma salvaje" si estaba en toggle
      const rasgosActualizados = (pj.rasgos || []).map((r) =>
        r.nombre.toLowerCase().trim() === "forma salvaje" ? { ...r, activo: false } : r
      );

      // 2. Retirar condición "Forma salvaje"
      const condicionesActualizadas = (pj.condicionesActivas || []).filter(
        (c) => c.toLowerCase().trim() !== "forma salvaje"
      );

      return {
        ...pj,
        rasgos: rasgosActualizados,
        condicionesActivas: condicionesActualizadas,
        formaSalvaje: {
          ...(pj.formaSalvaje || { formasConocidasIds: [] }),
          formaActivaId: null,
          hpTemporalAlTransformar: 0
        }
      };
    });
  }
});
