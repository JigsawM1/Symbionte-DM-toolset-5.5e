/**
 * manejadorEfectosIniciativa.ts
 * -----------------------------
 * Despachadores de mutación para condiciones, efectos y asociaciones de plantillas.
 */

import type { EfectoActivo, EstadoDM } from "@/almacen/usarAlmacenDM";
import { normalizarCondicionesRasgos } from "@/servicios/rasgos/estadoCondicionesRasgos";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { generarId } from "@/utiles/generarId";
import { formatearVelocidad } from "@/almacen/sanitizacion";
import {
  normalizarNombreTaleSpire,
  esNombreVacioODot,
  calcularVidaInicial
} from "@/servicios/resolutorCriaturas";
import { crearIndiceMonstruos } from "@/servicios/indiceMonstruos";
import { esCondicionDerribado } from "./sincronizadorMovimientoIniciativa";
import {
  sincronizarCondicionAgregadaPersonajes,
  sincronizarCondicionQuitadaPersonajes,
  sincronizarEfectoAgregadoPersonajes,
  sincronizarEfectoQuitadoPersonajes
} from "./sincronizadorEfectosIniciativa";

export function despacharAgregarCondicion(
  state: EstadoDM,
  id: string,
  condicion: string
): Partial<EstadoDM> {
  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === id);
  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === id) {
      criaturaAfectadaNombre = c.nombre;
      return { ...c, condiciones: aplicarCondicion(c.condiciones, condicion) };
    }
    return c;
  });

  if (criaturaObjetivo?.esMonstruo) {
    return { colaIniciativa: nuevaCola };
  }

  const esDerribado = esCondicionDerribado(condicion);
  const nuevosPjs = sincronizarCondicionAgregadaPersonajes(
    state.personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    condicion,
    esDerribado
  );

  return {
    colaIniciativa: nuevaCola,
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual))
  };
}

export function despacharQuitarCondicion(
  state: EstadoDM,
  id: string,
  condicion: string
): Partial<EstadoDM> {
  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === id);
  const esConcentracion = condicion.toLowerCase().includes("concentra");
  const esDerribado = esCondicionDerribado(condicion);

  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === id) {
      criaturaAfectadaNombre = c.nombre;
      const condsActualizadas = esConcentracion
        ? (c.condiciones || []).filter((cond) => !/concentra/i.test(cond))
        : (c.condiciones || []).filter((cond) => cond !== condicion);
      const efectosActualizados = esConcentracion
        ? (c.efectos || []).filter((e) => !e.concentracion && !/concentra/i.test(e.nombre || ""))
        : c.efectos;
      return { ...c, condiciones: condsActualizadas, efectos: efectosActualizados };
    }
    return c;
  });

  if (criaturaObjetivo?.esMonstruo) {
    return { colaIniciativa: nuevaCola };
  }

  const nuevosPjs = sincronizarCondicionQuitadaPersonajes(
    state.personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    condicion,
    esConcentracion,
    esDerribado
  );

  return {
    colaIniciativa: nuevaCola,
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual))
  };
}

export function despacharAgregarEfecto(
  state: EstadoDM,
  idCriatura: string,
  nombreEfecto: string,
  duracion: number,
  opciones?: { concentracion?: boolean }
): Partial<EstadoDM> {
  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === idCriatura);
  const esConcentracion =
    opciones?.concentracion ||
    nombreEfecto.toLowerCase().trim() === "concentración" ||
    nombreEfecto.toLowerCase().trim() === "concentracion";

  const nuevoEfectoId = generarId(nombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20));
  const nuevoEfecto: EfectoActivo = {
    id: nuevoEfectoId,
    nombre: nombreEfecto,
    expiraRonda: esConcentracion ? undefined : state.rondaActual + duracion,
    concentracion: esConcentracion || undefined
  };

  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === idCriatura) {
      criaturaAfectadaNombre = c.nombre;
      const nombreLimpio = nombreEfecto.split(" (")[0].toLowerCase().trim();
      const condicionesActualizadas = (c.condiciones || []).filter((cond) => {
        if (esConcentracion && cond.toLowerCase().includes("concentra")) return false;
        const condLimpia = cond.split(" (")[0].toLowerCase().trim();
        if (condLimpia === nombreLimpio || cond.toLowerCase().trim() === nombreEfecto.toLowerCase().trim()) return false;
        return true;
      });
      const efectosActualizados = (c.efectos || []).filter((e) => {
        if (esConcentracion && (e.concentracion || e.id === "ef_concentracion" || /^concentra/i.test(e.nombre || ""))) {
          return false;
        }
        return e.id !== nuevoEfectoId;
      });
      return {
        ...c,
        condiciones: condicionesActualizadas,
        efectos: [...efectosActualizados, nuevoEfecto]
      };
    }
    return c;
  });

  if (criaturaObjetivo?.esMonstruo) {
    return { colaIniciativa: nuevaCola };
  }

  const nuevosPjs = sincronizarEfectoAgregadoPersonajes(
    state.personajes,
    criaturaObjetivo,
    idCriatura,
    criaturaAfectadaNombre,
    nombreEfecto,
    nuevoEfecto,
    esConcentracion
  );

  return {
    colaIniciativa: nuevaCola,
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual))
  };
}

export function despacharQuitarEfecto(
  state: EstadoDM,
  idCriatura: string,
  idEfecto: string
): Partial<EstadoDM> {
  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === idCriatura);

  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === idCriatura) {
      criaturaAfectadaNombre = c.nombre;
      return {
        ...c,
        efectos: (c.efectos || []).filter((e) => e.id !== idEfecto)
      };
    }
    return c;
  });

  if (criaturaObjetivo?.esMonstruo) {
    return { colaIniciativa: nuevaCola };
  }

  const nuevosPjs = sincronizarEfectoQuitadoPersonajes(
    state.personajes,
    criaturaObjetivo,
    idCriatura,
    criaturaAfectadaNombre,
    idEfecto
  );

  return {
    colaIniciativa: nuevaCola,
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual))
  };
}

export function despacharAsociarPlantilla(
  state: EstadoDM,
  idCriatura: string,
  idPlantilla: string
): Partial<EstadoDM> {
  const criaturaReferencia = state.colaIniciativa.find((c) => c.id === idCriatura);
  const nombreCriatura = criaturaReferencia?.nombre || "";
  const esNombreInvalido = esNombreVacioODot(nombreCriatura);
  const { completo: nombreRef, base: nombreRefBase } = normalizarNombreTaleSpire(nombreCriatura);

  const indiceMonstruos = crearIndiceMonstruos(state.baseDatosMonstruos);
  const plantillaMonstruo = indiceMonstruos.porId.get(idPlantilla);

  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === idCriatura) {
      let vidaMaxCalculada = c.vidaMaxima;
      let vidaActCalculada = c.vidaActual;
      let caCalculada = c.ca;
      let velocidadCalculada = c.velocidad;
      let bonificadorIniciativaCalculado = c.bonificadorIniciativa;

      if (plantillaMonstruo) {
        caCalculada = plantillaMonstruo.ca;
        velocidadCalculada = formatearVelocidad(plantillaMonstruo.velocidad);
        bonificadorIniciativaCalculado = plantillaMonstruo.iniciativaBonificador;
        const vida = calcularVidaInicial(plantillaMonstruo, state.metodoVidaMonstruo);
        vidaMaxCalculada = vida.vidaMaxima;
        vidaActCalculada = vida.vidaActual;
      }

      return {
        ...c,
        idPlantillaAsociada: idPlantilla,
        vidaMaxima: vidaMaxCalculada,
        vidaActual: vidaActCalculada,
        ca: caCalculada,
        velocidad: velocidadCalculada,
        bonificadorIniciativa: bonificadorIniciativaCalculado
      };
    }
    return c;
  });

  const nuevasAsociaciones = {
    ...state.asociacionesFichas,
    [idCriatura]: idPlantilla
  };

  if (!esNombreInvalido) {
    nuevasAsociaciones[`nombre_base:${nombreRef}`] = idPlantilla;
    nuevasAsociaciones[`nombre_base:${nombreRefBase}`] = idPlantilla;
  }

  return {
    colaIniciativa: nuevaCola,
    asociacionesFichas: nuevasAsociaciones
  };
}

export function despacharDesvincularPlantilla(
  state: EstadoDM,
  idCriatura: string
): Partial<EstadoDM> {
  const criaturaReferencia = state.colaIniciativa.find((c) => c.id === idCriatura);
  if (!criaturaReferencia) return {};

  const { completo: nombreRef, base: nombreRefBase } = normalizarNombreTaleSpire(criaturaReferencia.nombre);
  const nuevasAsociaciones = { ...state.asociacionesFichas };
  delete nuevasAsociaciones[idCriatura];

  if (!esNombreVacioODot(criaturaReferencia.nombre)) {
    delete nuevasAsociaciones[`nombre_base:${nombreRef}`];
    delete nuevasAsociaciones[`nombre_base:${nombreRefBase}`];
  }

  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === idCriatura) {
      return {
        ...c,
        idPlantillaAsociada: undefined,
        ca: 10,
        velocidad: "30 pies",
        bonificadorIniciativa: 0
      };
    }
    return c;
  });

  return {
    colaIniciativa: nuevaCola,
    asociacionesFichas: nuevasAsociaciones
  };
}
