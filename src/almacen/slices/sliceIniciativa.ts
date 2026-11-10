/**
 * sliceIniciativa.ts
 * ------------------
 * Slice de Zustand para la gestión de la cola de iniciativa, turnos y combate.
 * Orquesta los subsistemas especializados ubicados en './iniciativa/':
 * - tipos: interfaces y modelos de datos.
 * - sincronizadorPersonajesIniciativa: proyección bidireccional a fichas de personaje y acompañantes.
 * - resolutorAreaIniciativa: cálculos de área y salvaciones.
 * - fabricaCriaturasIniciativa: factorías y conversiones de entidades.
 * - manejadorVidaIniciativa: mutaciones de vida, daño y vida temporal.
 * - manejadorEfectosIniciativa: mutaciones de condiciones, efectos y asociaciones.
 * - manejadorAccionesAreaIniciativa: mutaciones de área.
 */

import type { CriaturaIniciativa, EstadoDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos";
import type { ColaIniciativaTS } from "@/tipos/talespire";
import { ts } from "@/utiles/TaleSpireAdapter";
import { finalizarRasgosDelTurno, normalizarCondicionesRasgos } from "@/servicios/rasgos/estadoCondicionesRasgos";
import {
  normalizarNombreTaleSpire,
  coincidenNombresTaleSpire,
  esNombreVacioODot
} from "@/servicios/resolutorCriaturas";
import { crearIndiceMonstruos } from "@/servicios/indiceMonstruos";
import {
  sincronizarConEstadoLocal,
  filtrarEfectosExpirados
} from "@/servicios/sincronizacionIniciativa";
import { generarId } from "@/utiles/generarId";
import { logger } from "@/utiles/logger";
import { estadoDelContexto, conservarFichasAjenas } from '@/almacen/campaniasPersonajes';

import { type CreadorSliceIniciativa } from "./iniciativa/tipos";
import { restablecerMovimientoPersonajes } from "./iniciativa/sincronizadorPersonajesIniciativa";
import { ejecutarCalculoSalvacionArea } from "./iniciativa/resolutorAreaIniciativa";
import {
  construirEntradaJugador,
  alternarRolCriaturaHelper,
  autoLanzarIniciativaMonstruosHelper,
  construirCriaturasDesdeSeleccionTS
} from "./iniciativa/fabricaCriaturasIniciativa";
import {
  despacharModificarVida,
  despacharDano,
  despacharModificarVidaMaxima,
  despacharActualizarVidaTemporal
} from "./iniciativa/manejadorVidaIniciativa";
import {
  despacharAgregarCondicion,
  despacharQuitarCondicion,
  despacharAgregarEfecto,
  despacharQuitarEfecto,
  despacharAsociarPlantilla,
  despacharDesvincularPlantilla
} from "./iniciativa/manejadorEfectosIniciativa";
import {
  despacharAplicarDanoEnArea,
  despacharAplicarCondicionEnArea,
  despacharAplicarEfectoEnArea
} from "./iniciativa/manejadorAccionesAreaIniciativa";

export * from "./iniciativa/tipos";

export const crearSliceIniciativa: CreadorSliceIniciativa = (setOriginal, getOriginal) => {
  const get = () => estadoDelContexto(getOriginal());
  const aplicar: (partial: Parameters<typeof setOriginal>[0], replace?: boolean, fisica?: boolean) => void = (partial, replace, fisica = false) => {
    const s = get();
    if (s.esGM && ts.estaDisponible && !s.conexionSyncV4.soyDirector) {
      s.agregarNotificacion('Sólo el director puede editar el combate compartido.', 'info');
      return;
    }
    setOriginal(original => {
      const cambios = typeof partial === 'function' ? partial(estadoDelContexto(original)) : partial;
      const manual = !fisica && (cambios.rondaActual !== undefined || cambios.indiceTurnoActivo !== undefined);
      return conservarFichasAjenas(original, { ...cambios, ...(manual && original.referenciaIniciativaFisica
        ? { referenciaIniciativaFisica: { ...original.referenciaIniciativaFisica, inferirRonda: false } } : {}) });
    }, replace);
  };
  const set: typeof setOriginal = (partial, replace) => aplicar(partial, replace);
  return ({
  referenciaIniciativaFisica: null,
  colaIniciativa: [],
  indiceTurnoActivo: 0,
  rondaActual: 1,
  tipoTirada: "plano" as const,
  criaturasSeleccionadas: [],
  asociacionesFichas: {},

  establecerTipoTirada: (tipo) => setOriginal({ tipoTirada: tipo }),

  avanzarRonda: () => set((state) => {
    const nuevaRonda = state.rondaActual + 1;
    const nuevaCola = filtrarEfectosExpirados(state.colaIniciativa, nuevaRonda);
    const nuevosPjs = restablecerMovimientoPersonajes(state.personajes, `Reinicio de ronda (Ronda ${nuevaRonda})`);
    return {
      rondaActual: nuevaRonda,
      colaIniciativa: nuevaCola,
      personajes: nuevosPjs.map((p) => normalizarCondicionesRasgos(p, nuevaRonda, { conservarConcentracionDesconocida: state.esGM }))
    };
  }),

  retrocederRonda: () => set((state) => ({
    rondaActual: Math.max(1, state.rondaActual - 1)
  })),

  avanzarTurno: () => set((state) => {
    if (state.colaIniciativa.length === 0) return {};
    let nuevoIndice = state.indiceTurnoActivo + 1;
    let nuevaRonda = state.rondaActual;
    if (nuevoIndice >= state.colaIniciativa.length) {
      nuevoIndice = 0;
      nuevaRonda = state.rondaActual + 1;
    }

    let nuevaCola = state.colaIniciativa;
    let nuevosPjs = state.personajes;

    if (nuevaRonda > state.rondaActual) {
      nuevaCola = filtrarEfectosExpirados(state.colaIniciativa, nuevaRonda);
      nuevosPjs = restablecerMovimientoPersonajes(state.personajes, `Reinicio de ronda (Ronda ${nuevaRonda})`);
    }

    return {
      colaIniciativa: nuevaCola,
      indiceTurnoActivo: nuevoIndice,
      rondaActual: nuevaRonda,
      personajes: nuevosPjs.map(p => normalizarCondicionesRasgos(finalizarRasgosDelTurno(p, state, {
        colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda
      }), nuevaRonda, { conservarConcentracionDesconocida: state.esGM }))
    };
  }),

  retrocederTurno: () => set((state) => {
    if (state.colaIniciativa.length === 0) return {};
    let nuevoIndice = state.indiceTurnoActivo - 1;
    let nuevaRonda = state.rondaActual;
    if (nuevoIndice < 0) {
      nuevoIndice = state.colaIniciativa.length - 1;
      nuevaRonda = Math.max(1, state.rondaActual - 1);
    }

    return { indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
  }),

  actualizarColaIniciativaDesdeTaleSpire: (colaTS: ColaIniciativaTS | null, idsMiniaturasJugadores?: Set<string> | string[]) => aplicar((state) => {
    if (!colaTS || !(state.conexionSyncV4.soyDirector || (!ts.estaDisponible && state.esGM))) return {};

    const indiceMonstruos = crearIndiceMonstruos(state.baseDatosMonstruos);
    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal: state.colaIniciativa,
      asociacionesFichas: state.asociacionesFichas,
      indiceMonstruos,
      metodoVidaMonstruo: state.metodoVidaMonstruo,
      indiceTurnoActivo: state.indiceTurnoActivo,
      rondaActual: state.rondaActual,
      referenciaIniciativaFisica: state.referenciaIniciativaFisica,
      personajes: state.personajes,
      idsMiniaturasJugadores
    });

    if (resultado.rondaActual > state.rondaActual) {
      const pjsBase = state.personajes;
      const nuevosPjs = restablecerMovimientoPersonajes(pjsBase, `Reinicio de ronda TaleSpire (Ronda ${resultado.rondaActual})`);
      return { ...resultado, personajes: nuevosPjs.map(p => normalizarCondicionesRasgos(finalizarRasgosDelTurno(p, state, resultado),
        resultado.rondaActual, { conservarConcentracionDesconocida: state.esGM })) };
    }

    const personajes = state.personajes.map(p => finalizarRasgosDelTurno(p, state, resultado));
    return personajes.some((p, i) => p !== state.personajes[i]) ? { ...resultado, personajes } : resultado;
  }, undefined, true),

  importarIniciativaTaleSpire: async () => {
    if (ts.estaDisponible) {
      try {
        logger.info("[Combat Tracker] Importando cola de iniciativa nativa desde TaleSpire...");
        const queue = await ts.initiative.getQueue();
        const ids = (queue?.items || []).map((item) => item.id);
        let minisJugadores: Set<string> | undefined = undefined;
        if (ids.length > 0) {
          minisJugadores = await ts.creatures.detectarMiniaturasJugadores(ids);
        }
        get().actualizarColaIniciativaDesdeTaleSpire(queue, minisJugadores);
      } catch (error) {
        logger.error("[Combat Tracker] Error al importar iniciativa nativa:", error);
      }
    } else {
      logger.warn("[Combat Tracker] API de iniciativa nativa de TaleSpire no disponible.");
    }
  },

  agregarPersonajeAIniciativa: (personaje: PersonajeJugador) => set((state) => {
    const idObjetivo = personaje.idMiniaturaTS || personaje.id;
    const indiceExistente = state.colaIniciativa.findIndex(
      (c) =>
        c.id === idObjetivo ||
        c.id === personaje.id ||
        (personaje.idMiniaturaTS && c.id === personaje.idMiniaturaTS) ||
        (c.idPersonajeDuenio && c.idPersonajeDuenio === personaje.id) ||
        coincidenNombresTaleSpire(c.nombre, personaje.nombre)
    );

    const entradaJugador = construirEntradaJugador(personaje, indiceExistente, state.colaIniciativa);

    if (indiceExistente >= 0) {
      const nuevaCola = [...state.colaIniciativa];
      nuevaCola[indiceExistente] = {
        ...nuevaCola[indiceExistente],
        ...entradaJugador,
        iniciativa: nuevaCola[indiceExistente].iniciativa
      };
      return { colaIniciativa: nuevaCola };
    }

    return { colaIniciativa: [...state.colaIniciativa, entradaJugador] };
  }),

  alternarRolCriatura: (idCriatura: string) => set((state) => ({
    colaIniciativa: alternarRolCriaturaHelper(
      state.colaIniciativa,
      idCriatura,
      state.personajes,
      state.baseDatosMonstruos,
      state.asociacionesFichas
    )
  })),

  agregarCriaturaAIniciativa: (nombre, iniciativa, vidaMax, ca, esMonstruo, velocidad, bonifInic, idPlantillaAsociada) => set((state) => {
    const idCriatura = generarId('c_local');
    const nuevaCriatura: CriaturaIniciativa = {
      id: idCriatura,
      nombre,
      iniciativa,
      vidaMaxima: vidaMax,
      vidaActual: vidaMax,
      ca,
      condiciones: [],
      efectos: [],
      bonificadorIniciativa: bonifInic,
      esMonstruo,
      velocidad,
      vidaTemporal: 0,
      idPlantillaAsociada
    };

    let nuevasAsociaciones = state.asociacionesFichas;
    if (idPlantillaAsociada) {
      nuevasAsociaciones = {
        ...state.asociacionesFichas,
        [idCriatura]: idPlantillaAsociada
      };
      if (!esNombreVacioODot(nombre)) {
        const { completo: nombreRef, base: nombreRefBase } = normalizarNombreTaleSpire(nombre);
        nuevasAsociaciones[`nombre_base:${nombreRef}`] = idPlantillaAsociada;
        nuevasAsociaciones[`nombre_base:${nombreRefBase}`] = idPlantillaAsociada;
      }
    }

    return {
      colaIniciativa: [...state.colaIniciativa, nuevaCriatura],
      asociacionesFichas: nuevasAsociaciones
    };
  }),

  establecerIniciativaCriatura: (idCriatura, nuevaIniciativa) => set((state) => ({
    colaIniciativa: state.colaIniciativa.map((c) =>
      c.id === idCriatura ? { ...c, iniciativa: nuevaIniciativa } : c
    )
  })),

  quitarCriaturaDeIniciativa: (id) => set((state) => {
    const nuevaCola = state.colaIniciativa.filter((c) => c.id !== id);
    let nuevoIndice = state.indiceTurnoActivo;
    if (nuevaCola.length === 0) {
      nuevoIndice = 0;
    } else if (nuevoIndice >= nuevaCola.length) {
      nuevoIndice = nuevaCola.length - 1;
    }
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice };
  }),

  modificarVidaCriaturaIniciativa: (id, nuevaVida) => set((state) =>
    despacharModificarVida(state, get, id, nuevaVida)
  ),

  dañarCriaturaIniciativa: (id, cantidad) => set((state) =>
    despacharDano(state, get, id, cantidad)
  ),

  modificarVidaMaximaCriaturaIniciativa: (id, nuevaVidaMax) => set((state) =>
    despacharModificarVidaMaxima(state, get, id, nuevaVidaMax)
  ),

  agregarCondicionACriatura: (id, condicion) => set((state) =>
    despacharAgregarCondicion(state, id, condicion)
  ),

  quitarCondicionDeCriatura: (id, condicion) => set((state) =>
    despacharQuitarCondicion(state, id, condicion)
  ),

  agregarEfectoACriatura: (idCriatura, nombreEfecto, duracion, opciones) => set((state) =>
    despacharAgregarEfecto(state, idCriatura, nombreEfecto, duracion, opciones)
  ),

  quitarEfectoDeCriatura: (idCriatura, idEfecto) => set((state) =>
    despacharQuitarEfecto(state, idCriatura, idEfecto)
  ),

  asociarPlantillaACriatura: (idCriatura, idPlantilla) => set((state) =>
    despacharAsociarPlantilla(state, idCriatura, idPlantilla)
  ),

  desvincularPlantillaDeCriatura: (idCriatura) => set((state) =>
    despacharDesvincularPlantilla(state, idCriatura)
  ),

  actualizarVidaTemporal: (idCriatura, vidaTemp) => set((state) =>
    despacharActualizarVidaTemporal(state, get, idCriatura, vidaTemp)
  ),

  limpiarIniciativa: () => set((state) => {
    const nuevosPjs = restablecerMovimientoPersonajes(state.personajes, "Combate finalizado");
    return {
      colaIniciativa: [],
      indiceTurnoActivo: 0,
      rondaActual: 1,
      personajes: nuevosPjs.map((p) => {
        const vigente = normalizarCondicionesRasgos(p, state.rondaActual, { conservarConcentracionDesconocida: state.esGM });
        const forma = vigente.formaSalvaje;
        return {
          ...vigente,
          rasgos: vigente.rasgos.map(r => r.ultimoUsoTurno ? { ...r, ultimoUsoTurno: undefined } : r),
          ...(forma?.expiraRonda ? { formaSalvaje: { ...forma,
            minutosRestantes: Math.ceil((forma.expiraRonda - state.rondaActual) / 10), expiraRonda: undefined } } : {})
        };
      })
    };
  }),

  ordenarIniciativa: () => set((state) => {
    const nuevaCola = [...state.colaIniciativa];
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: 0 };
  }),

  autoLanzarIniciativaMonstruos: () => set((state) => ({
    colaIniciativa: autoLanzarIniciativaMonstruosHelper(
      state.colaIniciativa,
      state.personajes,
      state.baseDatosMonstruos,
      state.asociacionesFichas
    )
  })),

  actualizarSeleccionCriaturas: (seleccionadas) => setOriginal((state) => {
    const patch: Partial<EstadoDM> = { criaturasSeleccionadas: seleccionadas };
    if (seleccionadas && seleccionadas.length > 0) {
      const primera = seleccionadas[0];
      const nombreNorm = (primera.name || "").trim().toLowerCase();
      const pjEncontrado = state.personajes.find(
        (pj) =>
          (pj.idMiniaturaTS && pj.idMiniaturaTS === primera.id) ||
          (pj.nombre && nombreNorm && pj.nombre.trim().toLowerCase() === nombreNorm)
      );
      if (pjEncontrado && pjEncontrado.id !== state.idPersonajeActivo) {
        patch.idPersonajeActivo = pjEncontrado.id;
      }
    }
    return patch;
  }),

  agregarCriaturasSeleccionadasAIniciativa: () => set((state) => {
    const nuevasCriaturas = construirCriaturasDesdeSeleccionTS(
      state.criaturasSeleccionadas,
      state.colaIniciativa,
      state.personajes,
      state.baseDatosMonstruos,
      state.asociacionesFichas,
      state.metodoVidaMonstruo
    );
    if (nuevasCriaturas.length === 0) return {};
    return { colaIniciativa: [...state.colaIniciativa, ...nuevasCriaturas] };
  }),

  aplicarDañoEnArea: (cantidad, idsObjetivo) => set((state) =>
    despacharAplicarDanoEnArea(state, get, cantidad, idsObjetivo)
  ),

  aplicarCondicionEnArea: (condicion, idsObjetivo) => set((state) =>
    despacharAplicarCondicionEnArea(state, condicion, idsObjetivo)
  ),

  aplicarEfectoEnArea: (nombreEfecto, duracion, opciones, idsObjetivo) => set((state) =>
    despacharAplicarEfectoEnArea(state, nombreEfecto, duracion, opciones, idsObjetivo)
  ),

  ejecutarSalvacionEnArea: (caracteristica, cd, dañoBruto, condicionOEfecto, mitigacion = "mitad", idsObjetivo) => {
    const state = get();
    const resultadoCalculo = ejecutarCalculoSalvacionArea({
      caracteristica,
      cd,
      dañoBruto,
      condicionOEfecto,
      mitigacion,
      idsObjetivo,
      colaIniciativa: state.colaIniciativa,
      indiceTurnoActivo: state.indiceTurnoActivo,
      criaturasSeleccionadas: state.criaturasSeleccionadas,
      asociacionesFichas: state.asociacionesFichas,
      baseDatosMonstruos: state.baseDatosMonstruos,
      rondaActual: state.rondaActual,
      personajes: state.personajes
    });

    if (!resultadoCalculo) return null;

    set({
      colaIniciativa: resultadoCalculo.nuevaCola,
      personajes: resultadoCalculo.nuevosPersonajes
    });

    return resultadoCalculo.resultado;
  }
});
};
