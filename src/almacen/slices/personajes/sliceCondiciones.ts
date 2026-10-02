import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, RegistroMovimiento } from "@/tipos";
import { aplicarCondicion, quitarCondicion } from "@/servicios/procesadorCondiciones";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceCondiciones } from "./slicePersonajesTipos";
import {
  activarRasgosPorCondicionOEfecto,
  desactivarRasgosPorCondicionOEfecto
} from "./condicionesRasgosHelpers";
import { EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import { generarId } from "@/utiles/generarId";

function esCondicionDerribado(texto: string): boolean {
  const tNorm = (texto || "").toLowerCase().trim();
  return tNorm.includes("derribad") || tNorm.includes("prone") || tNorm === "caido" || tNorm === "caído";
}

function sincronizarCondicionesEnIniciativa(
  set: (fn: (state: EstadoDM) => Partial<EstadoDM>) => void,
  pj: PersonajeJugador,
  condiciones: string[],
  condicionEliminada?: string
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
        let nuevosEfectos = pj.efectosActivos?.length ? [...pj.efectosActivos] : (c.efectos ? [...c.efectos] : []);
        if (condicionEliminada === "__TODAS__") {
          nuevosEfectos = [];
        } else if (condicionEliminada) {
          const elimNorm = condicionEliminada.toLowerCase().trim();
          const esConcentracion = elimNorm.includes("concentra");
          nuevosEfectos = nuevosEfectos.filter((e) => {
            if (esConcentracion && (e.concentracion || e.id === "ef_concentracion" || e.id.includes("concentra"))) {
              return false;
            }
            if (e.nombre.toLowerCase().trim() === elimNorm) {
              return false;
            }
            const spellName = e.nombre.replace(/^concentraci[oó]n:\s*/i, "").trim().toLowerCase();
            if (spellName && spellName === elimNorm) {
              return false;
            }
            return true;
          });
        }

        // Deduplicación: no incluir en c.condiciones nada que ya esté en c.efectos
        const nombresEfectos = new Set((nuevosEfectos || []).map((e) => e.nombre.toLowerCase().trim()));
        const tieneEfectoConcentracion = (nuevosEfectos || []).some(
          (ef) => ef.concentracion || ef.nombre.toLowerCase().startsWith("concentra")
        );
        const condicionesSinDuplicados = condiciones.filter((cond) => {
          const cNorm = cond.toLowerCase().trim();
          const cBase = cond.split(" (")[0].toLowerCase().trim();
          if (tieneEfectoConcentracion && cNorm.includes("concentra")) return false;
          if (nombresEfectos.has(cNorm) || nombresEfectos.has(cBase)) return false;
          return true;
        });

        return { ...c, condiciones: condicionesSinDuplicados, efectos: nuevosEfectos };
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
> = (set, get) => ({
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

      // Detectar si pertenece a EFECTOS_PREDEFINIDOS con duración
      const efectoDef = EFECTOS_PREDEFINIDOS.find((ep) => {
        const epNorm = ep.nombre.toLowerCase().trim();
        const epBase = ep.nombre.split(" (")[0].toLowerCase().trim();
        return (
          normalizada === epNorm ||
          normalizada === epBase ||
          normalizada.startsWith(epBase) ||
          epNorm.startsWith(normalizada)
        );
      });

      let nuevosEfectosPj = pj.efectosActivos || [];
      if (efectoDef && efectoDef.duracionEstandar > 0) {
        const nombreLimpioEfecto = efectoDef.nombre.split(" (")[0];
        const yaExiste = nuevosEfectosPj.some(
          (e) => e.nombre.toLowerCase().trim() === nombreLimpioEfecto.toLowerCase().trim()
        );
        if (!yaExiste) {
          const rondaActual = get().rondaActual || 1;
          const nuevoEfecto = {
            id: generarId(nombreLimpioEfecto.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)),
            nombre: nombreLimpioEfecto,
            expiraRonda: rondaActual + efectoDef.duracionEstandar,
            concentracion: efectoDef.esConcentracion
          };
          nuevosEfectosPj = [...nuevosEfectosPj, nuevoEfecto];
        }
      }

      const nuevasCondiciones = aplicarCondicion(pj.condicionesActivas, condicion);
      const rasgosActualizados = activarRasgosPorCondicionOEfecto(condicion, pj.rasgos || []);

      // Ajuste automático de terreno difícil al estar derribado
      let nuevoTipoTerreno = pj.tipoTerreno || "normal";
      let nuevoMultTerreno = pj.multiplicadorTerreno || 1;
      let nuevoHistorial = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      if (esCondicionDerribado(condicion) && (pj.tipoTerreno === "normal" || !pj.tipoTerreno || pj.multiplicadorTerreno === 1)) {
        nuevoTipoTerreno = "dificil";
        nuevoMultTerreno = 2;
        const entradaHist: RegistroMovimiento = {
          id: `mov-terr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "terreno",
          delta: 0,
          anteriorGastado: pj.movimientoGastado || 0,
          nuevoGastado: pj.movimientoGastado || 0,
          descripcion: "Terreno cambiado a: Terreno Difícil (2x) por condición Derribado"
        };
        nuevoHistorial = [...nuevoHistorial.slice(-49), entradaHist];
      }

      condicionesFinales = nuevasCondiciones;
      pjObjetivo = {
        ...pj,
        tipoTerreno: nuevoTipoTerreno,
        multiplicadorTerreno: nuevoMultTerreno,
        historialMovimiento: nuevoHistorial,
        condicionesActivas: nuevasCondiciones,
        efectosActivos: nuevosEfectosPj,
        rasgos: rasgosActualizados
      };
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
      const rasgosActualizados = desactivarRasgosPorCondicionOEfecto(condicion, pj.rasgos || []);

      const cNorm = normalizada;
      const cLimpia = normalizada.split(" (")[0].trim();
      const nuevosEfectosPj = (pj.efectosActivos || []).filter((e) => {
        const eNorm = e.nombre.toLowerCase().trim();
        const eLimpia = e.nombre.split(" (")[0].toLowerCase().trim();
        return eNorm !== cNorm && eLimpia !== cLimpia && eNorm !== cLimpia && eLimpia !== cNorm;
      });

      const esConcentracion =
        normalizada.includes("concentra") ||
        (Boolean(pj.concentracionActiva) &&
          pj.concentracionActiva?.nombreHechizo?.toLowerCase().trim() === normalizada);

      // Restaurar terreno normal al levantarse de Derribado si no quedan otras condiciones de derribo
      let nuevoTipoTerreno = pj.tipoTerreno || "normal";
      let nuevoMultTerreno = pj.multiplicadorTerreno || 1;
      let nuevoHistorial = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      const todaviaDerribado = nuevasCondiciones.some((c) => esCondicionDerribado(c));
      if (esCondicionDerribado(condicion) && !todaviaDerribado && (pj.tipoTerreno === "dificil" || pj.multiplicadorTerreno === 2)) {
        nuevoTipoTerreno = "normal";
        nuevoMultTerreno = 1;
        const entradaHist: RegistroMovimiento = {
          id: `mov-terr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "terreno",
          delta: 0,
          anteriorGastado: pj.movimientoGastado || 0,
          nuevoGastado: pj.movimientoGastado || 0,
          descripcion: "Terreno restaurado a: Normal (1x) al levantarse de Derribado"
        };
        nuevoHistorial = [...nuevoHistorial.slice(-49), entradaHist];
      }

      condicionesFinales = nuevasCondiciones;
      pjObjetivo = {
        ...pj,
        tipoTerreno: nuevoTipoTerreno,
        multiplicadorTerreno: nuevoMultTerreno,
        historialMovimiento: nuevoHistorial,
        condicionesActivas: nuevasCondiciones,
        efectosActivos: nuevosEfectosPj,
        concentracionActiva: esConcentracion ? null : pj.concentracionActiva,
        rasgos: rasgosActualizados
      };
      return pjObjetivo;
    });

    if (pjObjetivo) {
      sincronizarCondicionesEnIniciativa(set, pjObjetivo, condicionesFinales, condicion);
    }
  },

  quitarEfectoPersonaje: (id, idEfecto) => {
    let pjObjetivo: PersonajeJugador | null = null;
    let nombreEfectoEliminado = "";
    mutarPersonaje(set, id, (pj) => {
      const efecto = (pj.efectosActivos || []).find((e) => e.id === idEfecto);
      nombreEfectoEliminado = efecto?.nombre || "";
      const eraConcentracion = efecto?.concentracion || efecto?.id.includes("concentra");
      const nuevosEfectos = (pj.efectosActivos || []).filter((e) => e.id !== idEfecto);

      let conds = pj.condicionesActivas || [];
      if (eraConcentracion) {
        conds = conds.filter((c) => !c.toLowerCase().includes("concentra"));
      }
      if (nombreEfectoEliminado) {
        conds = quitarCondicion(conds, nombreEfectoEliminado);
        const elimLimpio = nombreEfectoEliminado.split(" (")[0];
        if (elimLimpio !== nombreEfectoEliminado) {
          conds = quitarCondicion(conds, elimLimpio);
        }
      }
      const rasgosActualizados = desactivarRasgosPorCondicionOEfecto(nombreEfectoEliminado, pj.rasgos || []);

      let nuevoTipoTerreno = pj.tipoTerreno || "normal";
      let nuevoMultTerreno = pj.multiplicadorTerreno || 1;
      let nuevoHistorial = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      const todaviaDerribado = conds.some((c) => esCondicionDerribado(c));
      if (esCondicionDerribado(nombreEfectoEliminado) && !todaviaDerribado && (pj.tipoTerreno === "dificil" || pj.multiplicadorTerreno === 2)) {
        nuevoTipoTerreno = "normal";
        nuevoMultTerreno = 1;
        const entradaHist: RegistroMovimiento = {
          id: `mov-terr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "terreno",
          delta: 0,
          anteriorGastado: pj.movimientoGastado || 0,
          nuevoGastado: pj.movimientoGastado || 0,
          descripcion: "Terreno restaurado a: Normal (1x) al levantarse de Derribado"
        };
        nuevoHistorial = [...nuevoHistorial.slice(-49), entradaHist];
      }

      pjObjetivo = {
        ...pj,
        tipoTerreno: nuevoTipoTerreno,
        multiplicadorTerreno: nuevoMultTerreno,
        historialMovimiento: nuevoHistorial,
        condicionesActivas: conds,
        efectosActivos: nuevosEfectos,
        concentracionActiva: eraConcentracion ? null : pj.concentracionActiva,
        rasgos: rasgosActualizados
      };
      return pjObjetivo;
    });

    if (pjObjetivo) {
      sincronizarCondicionesEnIniciativa(set, pjObjetivo, (pjObjetivo as PersonajeJugador).condicionesActivas || [], nombreEfectoEliminado || idEfecto);
    }
  },

  limpiarCondicionesPersonaje: (id) => {
    let pjObjetivo: PersonajeJugador | null = null;
    mutarPersonaje(set, id, (pj) => {
      const rasgosDesactivados = (pj.rasgos || []).map((r) => {
        if (r.esActivable && r.activo) {
          return { ...r, activo: false };
        }
        return r;
      });

      let nuevoTipoTerreno = pj.tipoTerreno || "normal";
      let nuevoMultTerreno = pj.multiplicadorTerreno || 1;
      let nuevoHistorial = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      if (pj.tipoTerreno === "dificil" || pj.multiplicadorTerreno === 2) {
        nuevoTipoTerreno = "normal";
        nuevoMultTerreno = 1;
        const entradaHist: RegistroMovimiento = {
          id: `mov-terr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "terreno",
          delta: 0,
          anteriorGastado: pj.movimientoGastado || 0,
          nuevoGastado: pj.movimientoGastado || 0,
          descripcion: "Terreno restaurado a: Normal (1x) al limpiar condiciones"
        };
        nuevoHistorial = [...nuevoHistorial.slice(-49), entradaHist];
      }

      pjObjetivo = {
        ...pj,
        tipoTerreno: nuevoTipoTerreno,
        multiplicadorTerreno: nuevoMultTerreno,
        historialMovimiento: nuevoHistorial,
        condicionesActivas: [],
        efectosActivos: [],
        concentracionActiva: null,
        cansancio: 0,
        rasgos: rasgosDesactivados
      };
      return pjObjetivo;
    });

    if (pjObjetivo) {
      sincronizarCondicionesEnIniciativa(set, pjObjetivo, [], "__TODAS__");
    }
  }
});
