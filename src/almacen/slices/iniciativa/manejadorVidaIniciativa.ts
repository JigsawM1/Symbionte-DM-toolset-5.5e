/**
 * manejadorVidaIniciativa.ts
 * --------------------------
 * Despachadores de mutación para cambios de vida, daño y vida temporal en Zustand.
 */

import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { normalizarCondicionesRasgos } from "@/servicios/rasgos/estadoCondicionesRasgos";
import { emitirDeltaVidaSync } from "@/servicios/sincronizacion/motorEventosSync";
import {
  sincronizarModificacionVidaPersonajes,
  sincronizarDanoPersonajes,
  sincronizarVidaMaximaPersonajes,
  sincronizarVidaTemporalPersonajes
} from "./sincronizadorVidaIniciativa";

export function despacharModificarVida(
  state: EstadoDM,
  get: () => EstadoDM,
  id: string,
  nuevaVida: number
): Partial<EstadoDM> {
  const estadoPrevio = get();
  const criaturaObjetivoPrev = estadoPrevio.colaIniciativa.find((c) => c.id === id);
  if (estadoPrevio.esGM && !estadoPrevio.aplicandoSync && criaturaObjetivoPrev && !criaturaObjetivoPrev.esMonstruo) {
    const idDestino = criaturaObjetivoPrev.idAcompanante || criaturaObjetivoPrev.idPersonajeDuenio || criaturaObjetivoPrev.id;
    const diferencia = nuevaVida - criaturaObjetivoPrev.vidaActual;
    if (diferencia < 0) {
      void emitirDeltaVidaSync(idDestino, Math.abs(diferencia), "dano");
    } else if (diferencia > 0) {
      void emitirDeltaVidaSync(idDestino, diferencia, "curacion");
    }
  }
  get().registrarModificacionLocalPJ(id);

  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === id);
  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === id) {
      criaturaAfectadaNombre = c.nombre;
      return { ...c, vidaActual: Math.max(0, Math.min(c.vidaMaxima, nuevaVida)) };
    }
    return c;
  });

  if (criaturaObjetivo?.esMonstruo) {
    return { colaIniciativa: nuevaCola };
  }

  const nuevosPjs = sincronizarModificacionVidaPersonajes(
    state.personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    nuevaVida
  );

  return {
    colaIniciativa: nuevaCola,
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual))
  };
}

export function despacharDano(
  state: EstadoDM,
  get: () => EstadoDM,
  id: string,
  cantidad: number
): Partial<EstadoDM> {
  const daño = Math.max(0, Math.trunc(cantidad));
  if (daño === 0) return {};

  const estadoPrevio = get();
  const criaturaPrevia = estadoPrevio.colaIniciativa.find((c) => c.id === id);
  if (!criaturaPrevia) return {};

  if (estadoPrevio.esGM && !estadoPrevio.aplicandoSync && !criaturaPrevia.esMonstruo) {
    const idDestino = criaturaPrevia.idAcompanante || criaturaPrevia.idPersonajeDuenio || criaturaPrevia.id;
    void emitirDeltaVidaSync(idDestino, daño, "dano");
  }

  get().registrarModificacionLocalPJ(id);

  let dañoRestante = daño;
  let vidaTemp = criaturaPrevia.vidaTemporal || 0;
  let vidaAct = criaturaPrevia.vidaActual;

  if (vidaTemp > 0) {
    if (vidaTemp >= dañoRestante) {
      vidaTemp -= dañoRestante;
      dañoRestante = 0;
    } else {
      dañoRestante -= vidaTemp;
      vidaTemp = 0;
    }
  }
  if (dañoRestante > 0) {
    vidaAct = Math.max(0, vidaAct - dañoRestante);
  }

  let criaturaAfectadaNombre = "";
  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === id) {
      criaturaAfectadaNombre = c.nombre;
      return { ...c, vidaActual: vidaAct, vidaTemporal: vidaTemp };
    }
    return c;
  });

  if (criaturaPrevia.esMonstruo) {
    return { colaIniciativa: nuevaCola };
  }

  const nuevosPjs = sincronizarDanoPersonajes(
    state.personajes,
    criaturaPrevia,
    id,
    criaturaAfectadaNombre,
    vidaAct,
    vidaTemp
  );

  return {
    colaIniciativa: nuevaCola,
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual))
  };
}

export function despacharModificarVidaMaxima(
  state: EstadoDM,
  get: () => EstadoDM,
  id: string,
  nuevaVidaMax: number
): Partial<EstadoDM> {
  get().registrarModificacionLocalPJ(id);

  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === id);
  const vidaMaxSegura = Math.max(1, nuevaVidaMax);
  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === id) {
      criaturaAfectadaNombre = c.nombre;
      return {
        ...c,
        vidaMaxima: vidaMaxSegura,
        vidaActual: Math.min(c.vidaActual, vidaMaxSegura)
      };
    }
    return c;
  });

  if (criaturaObjetivo?.esMonstruo) {
    return { colaIniciativa: nuevaCola };
  }

  const nuevosPjs = sincronizarVidaMaximaPersonajes(
    state.personajes,
    criaturaObjetivo,
    id,
    criaturaAfectadaNombre,
    vidaMaxSegura
  );

  return {
    colaIniciativa: nuevaCola,
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual))
  };
}

export function despacharActualizarVidaTemporal(
  state: EstadoDM,
  get: () => EstadoDM,
  idCriatura: string,
  vidaTemp: number
): Partial<EstadoDM> {
  const estadoPrevio = get();
  const criaturaObjetivoPrev = estadoPrevio.colaIniciativa.find((c) => c.id === idCriatura);
  if (estadoPrevio.esGM && !estadoPrevio.aplicandoSync && criaturaObjetivoPrev && !criaturaObjetivoPrev.esMonstruo) {
    const idDestino = criaturaObjetivoPrev.idAcompanante || criaturaObjetivoPrev.idPersonajeDuenio || criaturaObjetivoPrev.id;
    void emitirDeltaVidaSync(idDestino, Math.max(0, vidaTemp), "temp");
  }
  get().registrarModificacionLocalPJ(idCriatura);

  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === idCriatura);
  const vidaTempSegura = Math.max(0, vidaTemp);
  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === idCriatura) {
      criaturaAfectadaNombre = c.nombre;
      return { ...c, vidaTemporal: vidaTempSegura };
    }
    return c;
  });

  if (criaturaObjetivo?.esMonstruo) {
    return { colaIniciativa: nuevaCola };
  }

  const nuevosPjs = sincronizarVidaTemporalPersonajes(
    state.personajes,
    criaturaObjetivo,
    idCriatura,
    criaturaAfectadaNombre,
    vidaTempSegura
  );

  return {
    colaIniciativa: nuevaCola,
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual))
  };
}
