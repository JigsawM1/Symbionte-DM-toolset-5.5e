/**
 * @module sliceSync
 * Slice de Zustand para la gestión del estado efímero de sincronización (TS.sync).
 * Aísla banderas de sincronización en tránsito y mutaciones del estado
 * sin persistirlas en disco para evitar desincronizaciones locales.
 */

import { aplicarCapacidadesRasgos } from "@/servicios/rasgos/sincronizarCapacidadesRasgos";
import type { StateCreator } from "zustand";
import type { EstadoDM, CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { EstadoCombatePJ, EstadoIniciativaDM } from "@/tipos/sync";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";
import { logger } from "@/utiles/logger";

export interface SliceSync {
  aplicandoSync: boolean;
  ultimoSyncRecibido: number | null;
  idClienteDM: string | null;
  timestampsModificacionLocal: Record<string, number>;
  borradoresSync: Record<string, EstadoCombatePJ>;
  guardarBorradorSync: (id: string, borrador: EstadoCombatePJ) => void;
  descartarBorradorSync: (id: string) => void;
  reaplicarBorradorSync: (id: string) => boolean;

  establecerAplicandoSync: (aplicando: boolean) => void;
  establecerIdClienteDM: (id: string | null) => void;
  registrarModificacionLocalPJ: (id: string, ts?: number) => void;
  confirmarACKPJ: (id: string, ts: number) => void;
  aplicarIniciativaDesdeSync: (datos: EstadoIniciativaDM) => void;
  actualizarPersonajeDesdeSync: (dto: EstadoCombatePJ, origen?: 'remoto' | 'borrador') => void;
}

const VENTANA_PROTECCION_MUTACION_MS = 2500;

export const crearSliceSync: StateCreator<
  EstadoDM,
  [],
  [],
  SliceSync
> = (set, get) => ({
  aplicandoSync: false,
  ultimoSyncRecibido: null,
  idClienteDM: null,
  timestampsModificacionLocal: {},
  borradoresSync: {},
  guardarBorradorSync: (id, borrador) => set(s => ({ borradoresSync: { ...s.borradoresSync, [id]: borrador } })),
  descartarBorradorSync: id => set(s => ({ borradoresSync: Object.fromEntries(Object.entries(s.borradoresSync).filter(([clave]) => clave !== id)) })),
  reaplicarBorradorSync: id => {
    const s = get();
    const borrador = s.borradoresSync[id];
    if (!borrador) return false;
    const tieneDestino = s.personajes.some(p => p.id === borrador.id ||
      (borrador.idMiniaturaTS && p.idMiniaturaTS === borrador.idMiniaturaTS)) ||
      (s.esGM && s.colaIniciativa.some(c => !c.esMonstruo && !c.esAcompanante &&
        (c.id === borrador.id || c.idPersonajeDuenio === borrador.id ||
          (borrador.idMiniaturaTS && c.id === borrador.idMiniaturaTS))));
    if (!tieneDestino) {
      s.agregarNotificacion('No se encontró la ficha de este cambio. El borrador sigue disponible para descargar.', 'advertencia');
      return false;
    }
    s.actualizarPersonajeDesdeSync(borrador, 'borrador');
    get().descartarBorradorSync(id);
    return true;
  },

  establecerAplicandoSync: (aplicando: boolean) => {
    set({ aplicandoSync: aplicando });
  },

  establecerIdClienteDM: (id: string | null) => {
    set({ idClienteDM: id });
  },

  registrarModificacionLocalPJ: (id: string, ts = Date.now()) => {
    set((state) => ({
      timestampsModificacionLocal: {
        ...state.timestampsModificacionLocal,
        [id]: ts,
      },
    }));
  },

  confirmarACKPJ: (id: string, ts: number) => {
    set((state) => {
      const tsRegistrado = state.timestampsModificacionLocal[id];
      if (tsRegistrado && ts >= tsRegistrado) {
        const nuevoMapa = { ...state.timestampsModificacionLocal };
        delete nuevoMapa[id];
        return { timestampsModificacionLocal: nuevoMapa };
      }
      return state;
    });
  },

  aplicarIniciativaDesdeSync: (datos: EstadoIniciativaDM) => {
    logger.debug("[SliceSync] Aplicando estado de combate desde sync:", datos);

    const { personajes, timestampsModificacionLocal } = get();

    // Actualizar condiciones, efectos y vitalidad de los personajes locales y sus acompañantes que estén en la iniciativa del DM
    const personajesActualizados = personajes.map((pj) => {
      const criaturaEnCola = datos.cola.find(
        (c) =>
          !c.esAcompanante &&
          (c.id === pj.id ||
            c.idPersonajeDuenio === pj.id ||
            (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
            coincidenNombresTaleSpire(c.nombre, pj.nombre))
      );

      const tsModPJ = timestampsModificacionLocal[pj.id];
      const mutacionEnTransitoPJ = tsModPJ !== undefined;
      const capacidades = mutacionEnTransitoPJ ? undefined : datos.capacidadesRasgos?.[pj.id];
      const pjConRasgos = aplicarCapacidadesRasgos({ ...pj,
        condicionesActivas: !mutacionEnTransitoPJ && criaturaEnCola ? criaturaEnCola.condiciones || [] : pj.condicionesActivas,
        efectosActivos: !mutacionEnTransitoPJ && criaturaEnCola ? criaturaEnCola.efectos || [] : pj.efectosActivos,
      }, capacidades);

      const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
        const criaturaAcompEnCola = datos.cola.find(
          (c) =>
            c.id === acomp.id ||
            c.idAcompanante === acomp.id ||
            (acomp.idMiniaturaTS && c.id === acomp.idMiniaturaTS) ||
            coincidenNombresTaleSpire(c.nombre, acomp.nombre)
        );

        if (!criaturaAcompEnCola) return acomp;

        const tsModAcomp = timestampsModificacionLocal[acomp.id];
        const mutacionEnTransitoAcomp = tsModAcomp !== undefined || mutacionEnTransitoPJ;

        return {
          ...acomp,
          condiciones: mutacionEnTransitoAcomp ? acomp.condiciones : criaturaAcompEnCola.condiciones || [],
          efectos: mutacionEnTransitoAcomp ? acomp.efectos : criaturaAcompEnCola.efectos || [],
          vidaActual: mutacionEnTransitoAcomp
            ? acomp.vidaActual
            : typeof criaturaAcompEnCola.vidaActual === "number"
            ? criaturaAcompEnCola.vidaActual
            : acomp.vidaActual,
          vidaMaxima: mutacionEnTransitoAcomp
            ? acomp.vidaMaxima
            : typeof criaturaAcompEnCola.vidaMaxima === "number" && criaturaAcompEnCola.vidaMaxima > 0
            ? criaturaAcompEnCola.vidaMaxima
            : acomp.vidaMaxima,
          vidaTemporal: mutacionEnTransitoAcomp
            ? acomp.vidaTemporal
            : typeof criaturaAcompEnCola.vidaTemporal === "number"
            ? criaturaAcompEnCola.vidaTemporal
            : acomp.vidaTemporal,
        };
      });

      if (!criaturaEnCola) {
        return {
          ...pjConRasgos,
          acompanantes: nuevosAcomps,
        };
      }

      return {
        ...pjConRasgos,
        condicionesActivas: mutacionEnTransitoPJ ? pj.condicionesActivas : criaturaEnCola.condiciones || [],
        efectosActivos: mutacionEnTransitoPJ ? pj.efectosActivos : criaturaEnCola.efectos || [],
        hpActual: mutacionEnTransitoPJ
          ? pj.hpActual
          : typeof criaturaEnCola.vidaActual === "number"
          ? criaturaEnCola.vidaActual
          : pj.hpActual,
        hpMaximo: mutacionEnTransitoPJ
          ? pj.hpMaximo
          : typeof criaturaEnCola.vidaMaxima === "number" && criaturaEnCola.vidaMaxima > 0
          ? criaturaEnCola.vidaMaxima
          : pj.hpMaximo,
        hpTemporal: mutacionEnTransitoPJ
          ? pj.hpTemporal
          : typeof criaturaEnCola.vidaTemporal === "number"
          ? criaturaEnCola.vidaTemporal
          : pj.hpTemporal,
        acompanantes: nuevosAcomps,
      };
    });

    // Activamos flag para evitar reemisiones cíclicas
    set({
      aplicandoSync: true,
      personajes: personajesActualizados,
      colaIniciativa: datos.cola,
      indiceTurnoActivo: datos.indiceTurnoActivo,
      rondaActual: datos.rondaActual,
      mostrarPorcentajeVidaAJugadores: datos.mostrarPorcentajeVidaAJugadores,
      metodoVidaMonstruo: datos.metodoVidaMonstruo as "estandar" | "maximo" | "azar",
      ultimoSyncRecibido: Date.now(),
    });

    // Liberar flag en el siguiente microtask tras disparar listeners de Zustand
    queueMicrotask(() => {
      set({ aplicandoSync: false });
    });
  },

  actualizarPersonajeDesdeSync: (dto: EstadoCombatePJ, origen = 'remoto') => {
    logger.debug("[SliceSync] Actualizando personaje desde sync:", dto.nombre, dto.id);

    const { personajes, colaIniciativa, timestampsModificacionLocal } = get();
    const ahora = Date.now();

    // 1. Localizar personaje en la colección del DM
    const indexPj = personajes.findIndex((p) => {
      if (p.id === dto.id) return true;
      if (p.idMiniaturaTS && dto.idMiniaturaTS && p.idMiniaturaTS === dto.idMiniaturaTS) return true;
      return false;
    });

    let personajesActualizados = personajes;

    if (indexPj !== -1) {
      const pjExistente = personajes[indexPj];

      // Sincronizar lista de acompañantes
      let acompSincronizados = pjExistente.acompanantes || [];
      if (dto.acompanantes && dto.acompanantes.length > 0) {
        const idsProcesados = new Set<string>();
        const actualizados = acompSincronizados.map((acompExistente) => {
          const acompDTO = dto.acompanantes?.find(
            (a) =>
              a.id === acompExistente.id ||
              (a.idMiniaturaTS && acompExistente.idMiniaturaTS && a.idMiniaturaTS === acompExistente.idMiniaturaTS)
          );

          if (!acompDTO) return acompExistente;
          idsProcesados.add(acompDTO.id);

          const tsModAcompDM = timestampsModificacionLocal[acompExistente.id];
          const edicionRecienteAcompDM = Boolean(
            origen === 'remoto' && tsModAcompDM &&
              ahora - tsModAcompDM < VENTANA_PROTECCION_MUTACION_MS &&
              (!dto.ts || dto.ts < tsModAcompDM)
          );

          return {
            ...acompExistente,
            nombre: acompDTO.nombre || acompExistente.nombre,
            vidaActual: edicionRecienteAcompDM ? acompExistente.vidaActual : acompDTO.vidaActual,
            vidaMaxima: edicionRecienteAcompDM ? acompExistente.vidaMaxima : acompDTO.vidaMaxima,
            vidaTemporal: edicionRecienteAcompDM
              ? acompExistente.vidaTemporal
              : (acompDTO.vidaTemporal ?? acompExistente.vidaTemporal),
            ca: acompDTO.ca ?? acompExistente.ca,
            condiciones: acompDTO.condiciones || [],
            efectos: acompDTO.efectos || [],
            iniciativa: acompDTO.iniciativa ?? acompExistente.iniciativa,
            idMiniaturaTS:
              acompDTO.idMiniaturaTS !== undefined ? acompDTO.idMiniaturaTS : acompExistente.idMiniaturaTS,
            velocidad: acompDTO.velocidad ?? acompExistente.velocidad,
            movimientoGastado: acompDTO.movimientoGastado ?? acompExistente.movimientoGastado,
            movimientoMaximoTemporal:
              acompDTO.movimientoMaximoTemporal !== undefined
                ? acompDTO.movimientoMaximoTemporal
                : acompExistente.movimientoMaximoTemporal,
            esInvocacion: acompDTO.esInvocacion ?? acompExistente.esInvocacion,
            nivelConjuroInvocacion:
              acompDTO.nivelConjuroInvocacion ?? acompExistente.nivelConjuroInvocacion,
            subtipoInvocacion: acompDTO.subtipoInvocacion ?? acompExistente.subtipoInvocacion,
            idPlantilla: acompDTO.idPlantilla ?? acompExistente.idPlantilla,
          };
        });

        // Añadir acompañantes nuevos del DTO si no estaban en el DM
        const nuevosAcomps = (dto.acompanantes || [])
          .filter((a) => !idsProcesados.has(a.id))
          .map((a) => ({
            id: a.id,
            nombre: a.nombre,
            idPlantilla: a.idPlantilla || "",
            vidaActual: a.vidaActual,
            vidaMaxima: a.vidaMaxima,
            vidaTemporal: a.vidaTemporal ?? 0,
            ca: a.ca ?? 10,
            condiciones: a.condiciones || [],
            efectos: a.efectos || [],
            iniciativa: a.iniciativa ?? 0,
            idMiniaturaTS: a.idMiniaturaTS ?? null,
            velocidad: a.velocidad || "30 pies",
            movimientoGastado: a.movimientoGastado ?? 0,
            movimientoMaximoTemporal: a.movimientoMaximoTemporal ?? null,
            tipoTerreno: "normal" as const,
            multiplicadorTerreno: 1,
            ultimaPosicionTS: null,
            ultimoBoardIdTS: null,
            historialMovimiento: [],
            esInvocacion: a.esInvocacion,
            nivelConjuroInvocacion: a.nivelConjuroInvocacion,
            subtipoInvocacion: a.subtipoInvocacion,
          }));

        acompSincronizados = [...actualizados, ...nuevosAcomps];
      }

      const tsModPjDM = timestampsModificacionLocal[pjExistente.id];
      const edicionRecientePjDM = Boolean(
        origen === 'remoto' && tsModPjDM &&
          ahora - tsModPjDM < VENTANA_PROTECCION_MUTACION_MS &&
          (!dto.ts || dto.ts < tsModPjDM)
      );

      const pjActualizado = {
        ...aplicarCapacidadesRasgos({ ...pjExistente, condicionesActivas: dto.condiciones, efectosActivos: dto.efectos }, edicionRecientePjDM ? undefined : dto.capacidadesRasgos),
        hpActual: edicionRecientePjDM ? pjExistente.hpActual : dto.hpActual,
        hpMaximo: edicionRecientePjDM ? pjExistente.hpMaximo : dto.hpMaximo,
        hpTemporal: edicionRecientePjDM ? pjExistente.hpTemporal : dto.hpTemporal,
        ca: dto.ca,
        condicionesActivas: dto.condiciones,
        efectosActivos: dto.efectos.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          expiraRonda: e.expiraRonda,
          concentracion: e.concentracion,
          duracion: e.duracion,
        })),
        concentracionActiva: dto.concentracion
          ? {
              hechizoId: dto.concentracion.hechizoId,
              nombreHechizo: dto.concentracion.nombreHechizo,
            }
          : null,
        espaciosConjuroGastados: dto.conjuros?.espaciosGastados
          ? origen === 'borrador' ? { ...dto.conjuros.espaciosGastados } : { ...pjExistente.espaciosConjuroGastados, ...dto.conjuros.espaciosGastados }
          : pjExistente.espaciosConjuroGastados,
        puntosConjuroGastados:
          dto.conjuros?.puntosGastados !== undefined
            ? dto.conjuros.puntosGastados
            : pjExistente.puntosConjuroGastados,
        espaciosPactoGastados:
          dto.conjuros?.pacto?.gastados !== undefined
            ? dto.conjuros.pacto.gastados
            : pjExistente.espaciosPactoGastados,
        movimientoGastado: dto.movimientoGastado ?? pjExistente.movimientoGastado,
        movimientoMaximoTemporal:
          dto.movimientoMaximoTemporal !== undefined
            ? dto.movimientoMaximoTemporal
            : pjExistente.movimientoMaximoTemporal,
        acompanantes: acompSincronizados,
      };

      personajesActualizados = [
        ...personajes.slice(0, indexPj),
        pjActualizado,
        ...personajes.slice(indexPj + 1),
      ];
    }

    // 2. Reflejar también en la cola de iniciativa tanto para el PJ como para sus acompañantes
    const colaActualizada = colaIniciativa.map((criatura): CriaturaIniciativa => {
      // Caso A: La criatura en cola es el personaje principal
      const coincidePorIdPJ =
        !criatura.esAcompanante &&
        (criatura.id === dto.id ||
          criatura.idPersonajeDuenio === dto.id ||
          (dto.idMiniaturaTS && criatura.id === dto.idMiniaturaTS));
      if (coincidePorIdPJ) {
        const tsModColaDM = timestampsModificacionLocal[criatura.id];
        const edicionRecienteColaDM = Boolean(
          origen === 'remoto' && tsModColaDM &&
            ahora - tsModColaDM < VENTANA_PROTECCION_MUTACION_MS &&
            (!dto.ts || dto.ts < tsModColaDM)
        );

        return {
          ...criatura,
          iniciativa: dto.iniciativa !== undefined ? dto.iniciativa : criatura.iniciativa,
          vidaActual: edicionRecienteColaDM ? criatura.vidaActual : dto.hpActual,
          vidaMaxima: edicionRecienteColaDM ? criatura.vidaMaxima : dto.hpMaximo,
          vidaTemporal: edicionRecienteColaDM ? criatura.vidaTemporal : dto.hpTemporal,
          ca: dto.ca,
          pasivas: dto.pasivas || criatura.pasivas,
          condiciones: dto.condiciones,
          efectos: dto.efectos,
          movimientoGastado: dto.movimientoGastado ?? criatura.movimientoGastado,
          movimientoMaximoTemporal:
            dto.movimientoMaximoTemporal !== undefined
              ? dto.movimientoMaximoTemporal
              : criatura.movimientoMaximoTemporal,
        };
      }

      // Caso B: La criatura en cola es un acompañante de este personaje
      if (dto.acompanantes && dto.acompanantes.length > 0) {
        const acompCoincidente = dto.acompanantes.find(
          (a) =>
            criatura.id === a.id ||
            criatura.idAcompanante === a.id ||
            (a.idMiniaturaTS && criatura.id === a.idMiniaturaTS)
        );

        if (acompCoincidente) {
          const tsModAcompColaDM = timestampsModificacionLocal[criatura.id];
          const edicionRecienteAcompColaDM = Boolean(
            origen === 'remoto' && tsModAcompColaDM &&
              ahora - tsModAcompColaDM < VENTANA_PROTECCION_MUTACION_MS &&
              (!dto.ts || dto.ts < tsModAcompColaDM)
          );

          return {
            ...criatura,
            iniciativa: acompCoincidente.iniciativa !== undefined ? acompCoincidente.iniciativa : criatura.iniciativa,
            vidaActual: edicionRecienteAcompColaDM ? criatura.vidaActual : acompCoincidente.vidaActual,
            vidaMaxima: edicionRecienteAcompColaDM ? criatura.vidaMaxima : acompCoincidente.vidaMaxima,
            vidaTemporal: edicionRecienteAcompColaDM
              ? criatura.vidaTemporal
              : (acompCoincidente.vidaTemporal ?? criatura.vidaTemporal),
            ca: acompCoincidente.ca ?? criatura.ca,
            condiciones: acompCoincidente.condiciones || [],
            efectos: acompCoincidente.efectos || [],
            movimientoGastado: acompCoincidente.movimientoGastado ?? criatura.movimientoGastado,
            movimientoMaximoTemporal:
              acompCoincidente.movimientoMaximoTemporal !== undefined
                ? acompCoincidente.movimientoMaximoTemporal
                : criatura.movimientoMaximoTemporal,
          };
        }
      }

      return criatura;
    });

    // Incorporar a la cola a los acompañantes que tengan iniciativa asignada (> 0) y no estén presentes aún
    if (dto.acompanantes && dto.acompanantes.length > 0) {
      dto.acompanantes.forEach((a) => {
        if (typeof a.iniciativa !== "number" || a.iniciativa <= 0) return;
        const yaExiste = colaActualizada.some(
          (c) =>
            c.id === a.id ||
            c.idAcompanante === a.id ||
            (a.idMiniaturaTS && c.id === a.idMiniaturaTS)
        );
        if (!yaExiste) {
          colaActualizada.push({
            id: a.idMiniaturaTS || a.id,
            nombre: a.nombre,
            iniciativa: a.iniciativa,
            vidaMaxima: a.vidaMaxima,
            vidaActual: a.vidaActual,
            vidaTemporal: a.vidaTemporal ?? 0,
            ca: a.ca ?? 10,
            condiciones: a.condiciones || [],
            efectos: a.efectos || [],
            bonificadorIniciativa: 0,
            esMonstruo: false,
            esAcompanante: true,
            idPersonajeDuenio: dto.id,
            idAcompanante: a.id,
            velocidad: a.velocidad || "30 pies",
          });
        }
      });
    }

    set({
      aplicandoSync: origen === 'remoto',
      personajes: personajesActualizados,
      colaIniciativa: colaActualizada,
      ultimoSyncRecibido: Date.now(),
    });

    if (origen === 'remoto') queueMicrotask(() => {
      set({ aplicandoSync: false });
    });
  },
});
