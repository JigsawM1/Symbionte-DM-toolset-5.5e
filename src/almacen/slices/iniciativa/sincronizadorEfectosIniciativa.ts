/**
 * sincronizadorEfectosIniciativa.ts
 * ---------------------------------
 * Funciones puras para proyectar condiciones, efectos y concentración
 * hacia los personajes y acompañantes desde la iniciativa.
 */

import type { CriaturaIniciativa, EfectoActivo } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, RegistroMovimiento } from "@/tipos";
import { aplicarCondicion, quitarCondicion } from "@/servicios/procesadorCondiciones";
import {
  activarRasgosPorCondicionOEfecto,
  desactivarRasgosPorCondicionOEfecto
} from "@/almacen/slices/personajes/condicionesRasgosHelpers";
import {
  coincidePersonajeEnIniciativa,
  coincideAcompananteEnIniciativa
} from "./sincronizadorMovimientoIniciativa";

export function aplicarEfectoAPersonaje(
  pj: PersonajeJugador,
  nombreEfecto: string,
  nuevoEfecto: EfectoActivo,
  esConcentracion: boolean
): PersonajeJugador {
  const spellName = nombreEfecto.replace(/^concentraci[oó]n:\s*/i, "").trim();
  const efectosPjPrevios = (pj.efectosActivos || []).filter((e) => {
    if (esConcentracion && (e.concentracion || e.id === "ef_concentracion" || /^concentra/i.test(e.nombre || ""))) {
      return false;
    }
    return e.id !== nuevoEfecto.id;
  });

  let conds = pj.condicionesActivas || [];
  if (esConcentracion) {
    if (!conds.includes("Concentración")) {
      conds = [...conds, "Concentración"];
    }
  } else {
    conds = aplicarCondicion(conds, nombreEfecto);
  }

  const rasgosActualizados = activarRasgosPorCondicionOEfecto(nombreEfecto, pj.rasgos || []);

  return {
    ...pj,
    condicionesActivas: conds,
    efectosActivos: [...efectosPjPrevios, nuevoEfecto],
    concentracionActiva: esConcentracion
      ? { hechizoId: nuevoEfecto.id, nombreHechizo: spellName || nombreEfecto }
      : pj.concentracionActiva,
    rasgos: rasgosActualizados
  };
}

export function sincronizarCondicionAgregadaPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  condicion: string,
  esDerribado: boolean
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const coincide = coincidePersonajeEnIniciativa(pj, criaturaObjetivo, id, criaturaAfectadaNombre);
    if (coincide) {
      let nuevoTipoTerreno = pj.tipoTerreno || "normal";
      let nuevoMultTerreno = pj.multiplicadorTerreno || 1;
      let nuevoHistorial = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      if (esDerribado && (pj.tipoTerreno === "normal" || !pj.tipoTerreno || pj.multiplicadorTerreno === 1)) {
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

      return {
        ...pj,
        tipoTerreno: nuevoTipoTerreno,
        multiplicadorTerreno: nuevoMultTerreno,
        historialMovimiento: nuevoHistorial,
        condicionesActivas: aplicarCondicion(pj.condicionesActivas || [], condicion)
      };
    }

    if (!criaturaObjetivo?.esAcompanante && !criaturaObjetivo?.idAcompanante) {
      return pj;
    }

    let acompModificado = false;
    const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
      const coincideAcomp = coincideAcompananteEnIniciativa(acomp, criaturaObjetivo, id, criaturaAfectadaNombre);
      if (coincideAcomp) {
        acompModificado = true;
        let nuevoTipoTerreno = acomp.tipoTerreno || "normal";
        let nuevoMultTerreno = acomp.multiplicadorTerreno || 1;
        if (esDerribado && (acomp.tipoTerreno === "normal" || !acomp.tipoTerreno || acomp.multiplicadorTerreno === 1)) {
          nuevoTipoTerreno = "dificil";
          nuevoMultTerreno = 2;
        }
        return {
          ...acomp,
          tipoTerreno: nuevoTipoTerreno,
          multiplicadorTerreno: nuevoMultTerreno,
          condiciones: aplicarCondicion(acomp.condiciones || [], condicion)
        };
      }
      return acomp;
    });

    if (acompModificado) {
      return { ...pj, acompanantes: nuevosAcomps };
    }

    return pj;
  });
}

export function sincronizarCondicionQuitadaPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  condicion: string,
  esConcentracion: boolean,
  esDerribado: boolean
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const coincide = coincidePersonajeEnIniciativa(pj, criaturaObjetivo, id, criaturaAfectadaNombre);
    if (coincide) {
      let condsPj = pj.condicionesActivas || [];
      if (esConcentracion) {
        condsPj = condsPj.filter((c) => !c.toLowerCase().includes("concentra"));
      } else {
        condsPj = quitarCondicion(condsPj, condicion);
      }

      const rasgosActualizados = desactivarRasgosPorCondicionOEfecto(condicion, pj.rasgos || []);
      let nuevoTipoTerreno = pj.tipoTerreno || "normal";
      let nuevoMultTerreno = pj.multiplicadorTerreno || 1;
      let nuevoHistorial = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      if (esDerribado && pj.tipoTerreno === "dificil" && pj.multiplicadorTerreno === 2) {
        nuevoTipoTerreno = "normal";
        nuevoMultTerreno = 1;
        const entradaHist: RegistroMovimiento = {
          id: `mov-terr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "terreno",
          delta: 0,
          anteriorGastado: pj.movimientoGastado || 0,
          nuevoGastado: pj.movimientoGastado || 0,
          descripcion: "Terreno restaurado a: Terreno Normal (1x) al remover condición Derribado"
        };
        nuevoHistorial = [...nuevoHistorial.slice(-49), entradaHist];
      }

      return {
        ...pj,
        condicionesActivas: condsPj,
        concentracionActiva: esConcentracion ? null : pj.concentracionActiva,
        rasgos: rasgosActualizados,
        tipoTerreno: nuevoTipoTerreno,
        multiplicadorTerreno: nuevoMultTerreno,
        historialMovimiento: nuevoHistorial
      };
    }

    if (!criaturaObjetivo?.esAcompanante && !criaturaObjetivo?.idAcompanante) {
      return pj;
    }

    let acompModificado = false;
    const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
      const coincideAcomp = coincideAcompananteEnIniciativa(acomp, criaturaObjetivo, id, criaturaAfectadaNombre);
      if (coincideAcomp) {
        acompModificado = true;
        let condsAcomp = acomp.condiciones || [];
        if (esConcentracion) {
          condsAcomp = condsAcomp.filter((c) => !c.toLowerCase().includes("concentra"));
        } else {
          condsAcomp = quitarCondicion(condsAcomp, condicion);
        }
        let nuevoTipoTerreno = acomp.tipoTerreno || "normal";
        let nuevoMultTerreno = acomp.multiplicadorTerreno || 1;
        if (esDerribado && acomp.tipoTerreno === "dificil" && acomp.multiplicadorTerreno === 2) {
          nuevoTipoTerreno = "normal";
          nuevoMultTerreno = 1;
        }
        return {
          ...acomp,
          condiciones: condsAcomp,
          tipoTerreno: nuevoTipoTerreno,
          multiplicadorTerreno: nuevoMultTerreno
        };
      }
      return acomp;
    });

    if (acompModificado) {
      return { ...pj, acompanantes: nuevosAcomps };
    }

    return pj;
  });
}

export function sincronizarEfectoAgregadoPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  nombreEfecto: string,
  nuevoEfecto: EfectoActivo,
  esConcentracion: boolean
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const coincide = coincidePersonajeEnIniciativa(pj, criaturaObjetivo, id, criaturaAfectadaNombre);
    if (coincide) {
      return aplicarEfectoAPersonaje(pj, nombreEfecto, nuevoEfecto, esConcentracion);
    }
    return pj;
  });
}

export function sincronizarEfectoQuitadoPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  idEfecto: string
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const coincide = coincidePersonajeEnIniciativa(pj, criaturaObjetivo, id, criaturaAfectadaNombre);
    if (coincide) {
      const efectoAEliminar = (pj.efectosActivos || []).find((e) => e.id === idEfecto);
      const efectosActualizados = (pj.efectosActivos || []).filter((e) => e.id !== idEfecto);

      let rasgosActualizados = pj.rasgos || [];
      if (efectoAEliminar) {
        rasgosActualizados = desactivarRasgosPorCondicionOEfecto(efectoAEliminar.nombre, rasgosActualizados);
      }

      const eraConcentracion = efectoAEliminar?.concentracion || pj.concentracionActiva?.hechizoId === idEfecto;
      let condsPj = pj.condicionesActivas || [];
      if (eraConcentracion) {
        condsPj = condsPj.filter((c) => !c.toLowerCase().includes("concentra"));
      } else if (efectoAEliminar) {
        condsPj = quitarCondicion(condsPj, efectoAEliminar.nombre);
      }

      return {
        ...pj,
        efectosActivos: efectosActualizados,
        condicionesActivas: condsPj,
        concentracionActiva: eraConcentracion ? null : pj.concentracionActiva,
        rasgos: rasgosActualizados
      };
    }
    return pj;
  });
}
