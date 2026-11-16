/**
 * manejadorEfectosIniciativa.ts
 * -----------------------------
 * Despachadores de mutación para condiciones, efectos y asociaciones de plantillas.
 */

import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { normalizarCondicionesRasgos } from "@/servicios/rasgos/estadoCondicionesRasgos";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
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
import {
  construirEfectoCombate,
  filtrarCondicionesSolapadasPorEfecto
} from "./utilidadesCombateIniciativa";

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
    personajes: nuevosPjs.map((p) =>
      normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM })
    )
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
    personajes: nuevosPjs.map((p) =>
      normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM })
    )
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
  const { efecto: nuevoEfecto, esConcentracion } = construirEfectoCombate(
    nombreEfecto,
    duracion,
    state.rondaActual,
    opciones
  );

  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id !== idCriatura) return c;
    criaturaAfectadaNombre = c.nombre;
    const condicionesActualizadas = filtrarCondicionesSolapadasPorEfecto(
      c.condiciones,
      nombreEfecto,
      esConcentracion
    );
    const efectosActualizados = (c.efectos || []).filter((e) => {
      if (esConcentracion && (e.concentracion || e.id === "ef_concentracion" || /^concentra/i.test(e.nombre || ""))) {
        return false;
      }
      return e.id !== nuevoEfecto.id;
    });
    return {
      ...c,
      condiciones: condicionesActualizadas,
      efectos: [...efectosActualizados, nuevoEfecto]
    };
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
    personajes: nuevosPjs.map((p) =>
      normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM })
    )
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
    personajes: nuevosPjs.map((p) =>
      normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM })
    )
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
    if (c.id !== idCriatura) return c;
    if (!plantillaMonstruo) {
      return { ...c, idPlantillaAsociada: idPlantilla };
    }
    const vida = calcularVidaInicial(plantillaMonstruo, state.metodoVidaMonstruo);
    return {
      ...c,
      idPlantillaAsociada: idPlantilla,
      vidaMaxima: vida.vidaMaxima,
      vidaActual: vida.vidaActual,
      ca: plantillaMonstruo.ca,
      velocidad: formatearVelocidad(plantillaMonstruo.velocidad),
      bonificadorIniciativa: plantillaMonstruo.iniciativaBonificador
    };
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

  const nuevaCola = state.colaIniciativa.map((c) =>
    c.id === idCriatura
      ? { ...c, idPlantillaAsociada: undefined, ca: 10, velocidad: "30 pies", bonificadorIniciativa: 0 }
      : c
  );

  return {
    colaIniciativa: nuevaCola,
    asociacionesFichas: nuevasAsociaciones
  };
}
