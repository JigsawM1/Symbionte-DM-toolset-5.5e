import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos";
import { aplicarCondicion, quitarCondicion } from "@/servicios/procesadorCondiciones";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceCondiciones } from "./slicePersonajesTipos";
import { coincideCondicionConRasgo } from "./condicionesRasgosHelpers";

function sincronizarCondicionesEnIniciativa(
  set: (fn: (state: EstadoDM) => Partial<EstadoDM>) => void,
  pj: PersonajeJugador,
  condiciones: string[]
): void {
  const nombreNorm = (pj.nombre || "").trim().toLowerCase();
  set((state) => {
    if (!state.colaIniciativa || state.colaIniciativa.length === 0) return {};
    let huboCambio = false;
    const nuevaCola = state.colaIniciativa.map((c) => {
      const coincide =
        c.id === pj.id ||
        (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
        (nombreNorm && c.nombre.trim().toLowerCase() === nombreNorm);
      if (coincide) {
        huboCambio = true;
        return { ...c, condiciones };
      }
      return c;
    });
    return huboCambio ? { colaIniciativa: nuevaCola } : {};
  });
}

export const crearSubSliceCondiciones: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceCondiciones
> = (set) => ({
  aplicarCondicionPersonaje: (id, condicion) => {
    let pjObjetivo: PersonajeJugador | null = null;
    let condicionesFinales: string[] = [];
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
        condicionesFinales = [...condicionesFiltradas, `Cansado (Niv. ${nuevoCansancio})`];
        pjObjetivo = {
          ...pj,
          cansancio: nuevoCansancio,
          condicionesActivas: condicionesFinales
        };
        return pjObjetivo;
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

      condicionesFinales = nuevasCondiciones;
      pjObjetivo = { ...pj, condicionesActivas: nuevasCondiciones, rasgos: rasgosActualizados };
      return pjObjetivo;
    });

    if (pjObjetivo) {
      sincronizarCondicionesEnIniciativa(set, pjObjetivo, condicionesFinales);
    }
  },

  quitarCondicionPersonaje: (id, condicion) => {
    let pjObjetivo: PersonajeJugador | null = null;
    let condicionesFinales: string[] = [];
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
        condicionesFinales = condicionesFiltradas;
        pjObjetivo = {
          ...pj,
          cansancio: 0,
          condicionesActivas: condicionesFiltradas
        };
        return pjObjetivo;
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

      condicionesFinales = nuevasCondiciones;
      pjObjetivo = { ...pj, condicionesActivas: nuevasCondiciones, rasgos: rasgosActualizados };
      return pjObjetivo;
    });

    if (pjObjetivo) {
      sincronizarCondicionesEnIniciativa(set, pjObjetivo, condicionesFinales);
    }
  },

  limpiarCondicionesPersonaje: (id) => {
    let pjObjetivo: PersonajeJugador | null = null;
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
      pjObjetivo = {
        ...pj,
        condicionesActivas: [],
        cansancio: 0,
        rasgos: rasgosDesactivados
      };
      return pjObjetivo;
    });

    if (pjObjetivo) {
      sincronizarCondicionesEnIniciativa(set, pjObjetivo, []);
    }
  }
});
