/**
 * manejadorVidaIniciativa.ts
 * --------------------------
 * Despachadores de mutación para cambios de vida, daño y vida temporal en Zustand.
 */

import type { EstadoDM, ModoDanoHorda } from "@/almacen/usarAlmacenDM";
import { normalizarCondicionesRasgos } from "@/servicios/rasgos/estadoCondicionesRasgos";
import {
  esCriaturaHorda,
  aplicarDanoBarrasHorda,
  aplicarCuracionBarrasHorda,
  construirBarrasHorda,
  sincronizarAgregadosHorda
} from "@/servicios/combateHordas";
import {
  sincronizarModificacionVidaPersonajes,
  sincronizarDanoPersonajes,
  sincronizarVidaMaximaPersonajes,
  sincronizarVidaTemporalPersonajes
} from "./sincronizadorVidaIniciativa";

export function despacharModificarVida(
  state: EstadoDM,
  _get: () => EstadoDM,
  id: string,
  nuevaVida: number
): Partial<EstadoDM> {

  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === id);
  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === id) {
      criaturaAfectadaNombre = c.nombre;
      if (esCriaturaHorda(c) && c.barrasVida && c.barrasVida.length > 1) {
        const delta = nuevaVida - c.vidaActual;
        if (delta > 0) return aplicarCuracionBarrasHorda(c, delta);
        if (delta < 0) return aplicarDanoBarrasHorda(c, Math.abs(delta));
        return c;
      }
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
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM }))
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

  if (esCriaturaHorda(criaturaPrevia) && criaturaPrevia.barrasVida && criaturaPrevia.barrasVida.length > 1) {
    const nuevaColaHorda = state.colaIniciativa.map((c) =>
      c.id === id ? aplicarDanoBarrasHorda(c, daño) : c
    );
    return { colaIniciativa: nuevaColaHorda };
  }

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
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM }))
  };
}

export function despacharModificarVidaMaxima(
  state: EstadoDM,
  _get: () => EstadoDM,
  id: string,
  nuevaVidaMax: number
): Partial<EstadoDM> {

  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === id);
  const vidaMaxSegura = Math.max(1, nuevaVidaMax);
  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === id) {
      criaturaAfectadaNombre = c.nombre;
      if (esCriaturaHorda(c) && c.barrasVida && c.barrasVida.length > 1) {
        const idx = Math.max(0, Math.min(c.barrasVida.length - 1, c.indiceBarraActiva ?? 0));
        const barras = c.barrasVida.map((b, i) =>
          i === idx ? { ...b, vidaMaxima: vidaMaxSegura, vidaActual: Math.min(b.vidaActual, vidaMaxSegura) } : b
        );
        return { ...c, ...sincronizarAgregadosHorda(barras, idx) };
      }
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
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM }))
  };
}

export function despacharActualizarVidaTemporal(
  state: EstadoDM,
  _get: () => EstadoDM,
  idCriatura: string,
  vidaTemp: number
): Partial<EstadoDM> {

  let criaturaAfectadaNombre = "";
  const criaturaObjetivo = state.colaIniciativa.find((c) => c.id === idCriatura);
  const vidaTempSegura = Math.max(0, vidaTemp);
  const nuevaCola = state.colaIniciativa.map((c) => {
    if (c.id === idCriatura) {
      criaturaAfectadaNombre = c.nombre;
      if (esCriaturaHorda(c) && c.barrasVida && c.barrasVida.length > 1) {
        const idx = Math.max(0, Math.min(c.barrasVida.length - 1, c.indiceBarraActiva ?? 0));
        const barras = c.barrasVida.map((b, i) => (i === idx ? { ...b, vidaTemporal: vidaTempSegura } : b));
        return { ...c, ...sincronizarAgregadosHorda(barras, idx) };
      }
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
    personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM }))
  };
}

export function despacharConfigurarBarrasHorda(
  state: EstadoDM,
  idCriatura: string,
  cantidadMiembros: number,
  vidaPorMiembro?: number
): Partial<EstadoDM> {
  const n = Math.max(1, Math.min(50, Math.trunc(cantidadMiembros)));
  return {
    colaIniciativa: state.colaIniciativa.map((c) => {
      if (c.id !== idCriatura) return c;
      if (n <= 1) {
        const barraBase = c.barrasVida?.[c.indiceBarraActiva ?? 0] ?? c.barrasVida?.[0];
        return {
          ...c,
          vidaMaxima: barraBase ? barraBase.vidaMaxima : c.vidaMaxima,
          vidaActual: barraBase ? barraBase.vidaActual : c.vidaActual,
          vidaTemporal: barraBase ? (barraBase.vidaTemporal ?? 0) : (c.vidaTemporal ?? 0),
          barrasVida: undefined,
          indiceBarraActiva: undefined,
          modoDanoHorda: undefined,
          resumenHorda: undefined
        };
      }
      const vidaUnitaria =
        vidaPorMiembro ??
        c.barrasVida?.[0]?.vidaMaxima ??
        Math.max(1, Math.round(c.vidaMaxima / Math.max(1, c.barrasVida?.length ?? 1)));
      const barras = construirBarrasHorda(n, vidaUnitaria, c.barrasVida, c.vidaActual, c.vidaTemporal);
      return {
        ...c,
        modoDanoHorda: c.modoDanoHorda ?? "individual",
        ...sincronizarAgregadosHorda(barras, c.indiceBarraActiva ?? 0)
      };
    })
  };
}

export function despacharSeleccionarBarraHorda(
  state: EstadoDM,
  idCriatura: string,
  indiceBarra: number
): Partial<EstadoDM> {
  return {
    colaIniciativa: state.colaIniciativa.map((c) => {
      if (c.id !== idCriatura || !c.barrasVida || c.barrasVida.length === 0) return c;
      const idx = Math.max(0, Math.min(c.barrasVida.length - 1, Math.trunc(indiceBarra)));
      return { ...c, indiceBarraActiva: idx };
    })
  };
}

export function despacharAlternarModoDanoHorda(
  state: EstadoDM,
  idCriatura: string,
  modo?: ModoDanoHorda
): Partial<EstadoDM> {
  return {
    colaIniciativa: state.colaIniciativa.map((c) => {
      if (c.id !== idCriatura) return c;
      const nuevoModo: ModoDanoHorda = modo ?? (c.modoDanoHorda === "cascada" ? "individual" : "cascada");
      return { ...c, modoDanoHorda: nuevoModo };
    })
  };
}
