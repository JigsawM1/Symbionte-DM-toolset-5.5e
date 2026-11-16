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
  coincideAcompananteEnIniciativa,
  proyectarCambioEnPersonajeOAcompanante
} from "./sincronizadorMovimientoIniciativa";

interface EstadoTerrenoEntidad {
  tipoTerreno?: PersonajeJugador["tipoTerreno"];
  multiplicadorTerreno?: number;
  movimientoGastado?: number;
  historialMovimiento?: RegistroMovimiento[];
}

function calcularCambioTerrenoPorDerribado(
  entidad: EstadoTerrenoEntidad,
  esDerribado: boolean,
  activar: boolean,
  registrarHistorial: boolean
): {
  tipoTerreno: PersonajeJugador["tipoTerreno"];
  multiplicadorTerreno: number;
  historialMovimiento?: RegistroMovimiento[];
} {
  let tipoTerreno = entidad.tipoTerreno || "normal";
  let multiplicadorTerreno = entidad.multiplicadorTerreno || 1;
  let historialMovimiento = registrarHistorial
    ? (Array.isArray(entidad.historialMovimiento) ? entidad.historialMovimiento : [])
    : undefined;

  const debeActivarDificil =
    activar &&
    esDerribado &&
    (entidad.tipoTerreno === "normal" || !entidad.tipoTerreno || entidad.multiplicadorTerreno === 1);

  const debeRestaurarNormal =
    !activar &&
    esDerribado &&
    entidad.tipoTerreno === "dificil" &&
    entidad.multiplicadorTerreno === 2;

  if (debeActivarDificil || debeRestaurarNormal) {
    tipoTerreno = debeActivarDificil ? "dificil" : "normal";
    multiplicadorTerreno = debeActivarDificil ? 2 : 1;
    if (registrarHistorial && historialMovimiento) {
      const gastoActual = entidad.movimientoGastado || 0;
      const entradaHist: RegistroMovimiento = {
        id: `mov-terr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        tipo: "terreno",
        delta: 0,
        anteriorGastado: gastoActual,
        nuevoGastado: gastoActual,
        descripcion: debeActivarDificil
          ? "Terreno cambiado a: Terreno Difícil (2x) por condición Derribado"
          : "Terreno restaurado a: Terreno Normal (1x) al remover condición Derribado"
      };
      historialMovimiento = [...historialMovimiento.slice(-49), entradaHist];
    }
  }

  return { tipoTerreno, multiplicadorTerreno, historialMovimiento };
}

/** Proyecta los estados recibidos del DM a las fichas locales vinculadas. */
export function sincronizarEstadosPersonajesDesdeCola(
  personajes: PersonajeJugador[],
  cola: CriaturaIniciativa[]
): PersonajeJugador[] {
  return personajes.map((pj) => {
    const criatura = cola.find((c) => !c.esMonstruo &&
      coincidePersonajeEnIniciativa(pj, c, c.id, c.nombre));
    const acompanantes = (pj.acompanantes || []).map((acomp) => {
      const criaturaAcomp = cola.find((c) => (c.esAcompanante || c.idAcompanante) &&
        coincideAcompananteEnIniciativa(acomp, c, c.id, c.nombre));
      if (!criaturaAcomp) return acomp;
      return {
        ...acomp,
        condiciones: criaturaAcomp.condiciones,
        efectos: (criaturaAcomp.efectos || []).map(efecto => ({
          ...acomp.efectos.find(local => local.id === efecto.id),
          ...efecto
        }))
      };
    });
    if (!criatura) return { ...pj, acompanantes };
    return {
      ...pj,
      condicionesActivas: criatura.condiciones,
      efectosActivos: (criatura.efectos || []).map(efecto => ({
        ...pj.efectosActivos.find(local => local.id === efecto.id),
        ...efecto
      })),
      acompanantes
    };
  });
}

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

  return {
    ...pj,
    condicionesActivas: conds,
    efectosActivos: [...efectosPjPrevios, nuevoEfecto],
    concentracionActiva: esConcentracion
      ? { hechizoId: nuevoEfecto.id, nombreHechizo: spellName || nombreEfecto }
      : pj.concentracionActiva,
    rasgos: activarRasgosPorCondicionOEfecto(nombreEfecto, pj.rasgos || [])
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
  return proyectarCambioEnPersonajeOAcompanante(
    personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    (pj) => {
      const terreno = calcularCambioTerrenoPorDerribado(pj, esDerribado, true, true);
      return {
        ...pj,
        tipoTerreno: terreno.tipoTerreno,
        multiplicadorTerreno: terreno.multiplicadorTerreno,
        historialMovimiento: terreno.historialMovimiento || [],
        condicionesActivas: aplicarCondicion(pj.condicionesActivas || [], condicion)
      };
    },
    (acomp) => {
      const terreno = calcularCambioTerrenoPorDerribado(acomp, esDerribado, true, false);
      return {
        ...acomp,
        tipoTerreno: terreno.tipoTerreno,
        multiplicadorTerreno: terreno.multiplicadorTerreno,
        condiciones: aplicarCondicion(acomp.condiciones || [], condicion)
      };
    }
  );
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
  return proyectarCambioEnPersonajeOAcompanante(
    personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    (pj) => {
      const condsPj = esConcentracion
        ? (pj.condicionesActivas || []).filter((c) => !c.toLowerCase().includes("concentra"))
        : quitarCondicion(pj.condicionesActivas || [], condicion);
      const terreno = calcularCambioTerrenoPorDerribado(pj, esDerribado, false, true);

      return {
        ...pj,
        condicionesActivas: condsPj,
        concentracionActiva: esConcentracion ? null : pj.concentracionActiva,
        rasgos: desactivarRasgosPorCondicionOEfecto(condicion, pj.rasgos || []),
        tipoTerreno: terreno.tipoTerreno,
        multiplicadorTerreno: terreno.multiplicadorTerreno,
        historialMovimiento: terreno.historialMovimiento || []
      };
    },
    (acomp) => {
      const condsAcomp = esConcentracion
        ? (acomp.condiciones || []).filter((c) => !c.toLowerCase().includes("concentra"))
        : quitarCondicion(acomp.condiciones || [], condicion);
      const terreno = calcularCambioTerrenoPorDerribado(acomp, esDerribado, false, false);

      return {
        ...acomp,
        condiciones: condsAcomp,
        tipoTerreno: terreno.tipoTerreno,
        multiplicadorTerreno: terreno.multiplicadorTerreno
      };
    }
  );
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
  return proyectarCambioEnPersonajeOAcompanante(
    personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    (pj) => aplicarEfectoAPersonaje(pj, nombreEfecto, nuevoEfecto, esConcentracion)
  );
}

export function sincronizarEfectoQuitadoPersonajes(
  personajes: PersonajeJugador[],
  criaturaObjetivo: CriaturaIniciativa | undefined,
  id: string,
  criaturaAfectadaNombre: string,
  idEfecto: string
): PersonajeJugador[] {
  return proyectarCambioEnPersonajeOAcompanante(
    personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    (pj) => {
      const efectoAEliminar = (pj.efectosActivos || []).find((e) => e.id === idEfecto);
      const efectosActualizados = (pj.efectosActivos || []).filter((e) => e.id !== idEfecto);
      const rasgosActualizados = efectoAEliminar
        ? desactivarRasgosPorCondicionOEfecto(efectoAEliminar.nombre, pj.rasgos || [])
        : (pj.rasgos || []);

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
  );
}
