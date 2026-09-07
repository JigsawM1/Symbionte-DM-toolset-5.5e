import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { aplicarCondicion, quitarCondicion } from "@/servicios/procesadorCondiciones";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceCondiciones } from "./slicePersonajesTipos";
import { coincideCondicionConRasgo } from "./condicionesRasgosHelpers";

export const crearSubSliceCondiciones: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceCondiciones
> = (set) => ({
  aplicarCondicionPersonaje: (id, condicion) => {
    mutarPersonaje(set, id, (pj) => {
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
      let rasgosActualizados = pj.rasgos;

      // Sincronización automática de condiciones hacia rasgos (canónicas y personalizadas con condicionAlActivar)
      rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (coincideCondicionConRasgo(condicion, r) && r.esActivable && !r.activo) {
          const usosRest = typeof r.usosRestantes === "number" ? Math.max(0, r.usosRestantes - 1) : r.usosRestantes;
          return { ...r, activo: true, usosRestantes: usosRest };
        }
        return r;
      });

      return { ...pj, condicionesActivas: nuevasCondiciones, rasgos: rasgosActualizados };
    });
  },

  quitarCondicionPersonaje: (id, condicion) => {
    mutarPersonaje(set, id, (pj) => {
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
      let rasgosActualizados = pj.rasgos;
      const clavesPadresApagados = new Set<string>();

      rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (coincideCondicionConRasgo(condicion, r) && r.esActivable && r.activo) {
          clavesPadresApagados.add(r.id.toLowerCase());
          clavesPadresApagados.add(r.nombre.toLowerCase().trim());
          return { ...r, activo: false };
        }
        return r;
      });

      // Desactivación en cascada de rasgos hijos
      if (clavesPadresApagados.size > 0) {
        const esFuriaApagada = clavesPadresApagados.has("furia") || clavesPadresApagados.has("rasgo_cls_barbaro_furia");
        rasgosActualizados = rasgosActualizados.map((r) => {
          if (!r.activo) return r;
          if (r.ligadoA) {
            const lig = r.ligadoA.toLowerCase().trim();
            if (clavesPadresApagados.has(lig) || (esFuriaApagada && lig.includes("furia") && !lig.includes("dioses"))) {
              return { ...r, activo: false };
            }
          }
          if (esFuriaApagada) {
            const rNom = r.nombre.toLowerCase().trim();
            const rId = r.id.toLowerCase().trim();
            if (
              rNom.includes("furia divina") ||
              rId.includes("furia_divina") ||
              rNom.includes("golpe brutal") ||
              rId.includes("golpe_brutal") ||
              rNom.includes("furia de los dioses") ||
              rId.includes("furia_de_los_dioses")
            ) {
              return { ...r, activo: false };
            }
          }
          return r;
        });
      }

      return { ...pj, condicionesActivas: nuevasCondiciones, rasgos: rasgosActualizados };
    });
  },

  limpiarCondicionesPersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const rasgosDesactivados = (pj.rasgos || []).map((r) => {
        const rNom = r.nombre.toLowerCase().trim();
        const rId = r.id.toLowerCase().trim();
        const tieneCond = Boolean(r.condicionAlActivar);
        if (
          (tieneCond || rNom === "furia" || rId === "rasgo_cls_barbaro_furia" || rNom.includes("temerario") || rNom.includes("furia de los dioses") || rNom.includes("furia divina") || rId.includes("furia_divina") || rNom.includes("golpe brutal") || rId.includes("golpe_brutal") || r.ligadoA) &&
          r.esActivable &&
          r.activo
        ) {
          return { ...r, activo: false };
        }
        return r;
      });
      return {
        ...pj,
        condicionesActivas: [],
        cansancio: 0,
        rasgos: rasgosDesactivados
      };
    });
  }
});
