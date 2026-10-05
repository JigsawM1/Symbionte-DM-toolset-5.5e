/**
 * @module sliceSync
 * Slice de Zustand para la gestión del estado efímero de sincronización (TS.sync).
 * Aísla banderas de sincronización en tránsito y mutaciones del estado
 * sin persistirlas en disco para evitar desincronizaciones locales.
 */

import type { StateCreator } from "zustand";
import type { EstadoDM, CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { EstadoCombatePJ, EstadoIniciativaDM } from "@/tipos/sync";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";
import { logger } from "@/utiles/logger";

export interface SliceSync {
  aplicandoSync: boolean;
  ultimoSyncRecibido: number | null;
  idClienteDM: string | null;

  establecerAplicandoSync: (aplicando: boolean) => void;
  establecerIdClienteDM: (id: string | null) => void;
  aplicarIniciativaDesdeSync: (datos: EstadoIniciativaDM) => void;
  actualizarPersonajeDesdeSync: (dto: EstadoCombatePJ) => void;
}

export const crearSliceSync: StateCreator<
  EstadoDM,
  [],
  [],
  SliceSync
> = (set, get) => ({
  aplicandoSync: false,
  ultimoSyncRecibido: null,
  idClienteDM: null,

  establecerAplicandoSync: (aplicando: boolean) => {
    set({ aplicandoSync: aplicando });
  },

  establecerIdClienteDM: (id: string | null) => {
    set({ idClienteDM: id });
  },

  aplicarIniciativaDesdeSync: (datos: EstadoIniciativaDM) => {
    logger.debug("[SliceSync] Aplicando estado de combate desde sync:", datos);

    const { personajes } = get();

    // Actualizar condiciones, efectos y vitalidad de los personajes locales que estén en la iniciativa del DM
    const personajesActualizados = personajes.map((pj) => {
      const criaturaEnCola = datos.cola.find(
        (c) =>
          c.id === pj.id ||
          (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
          coincidenNombresTaleSpire(c.nombre, pj.nombre)
      );

      if (!criaturaEnCola) {
        return pj;
      }

      return {
        ...pj,
        condicionesActivas: criaturaEnCola.condiciones || [],
        efectosActivos: criaturaEnCola.efectos || [],
        hpActual: typeof criaturaEnCola.vidaActual === "number" ? criaturaEnCola.vidaActual : pj.hpActual,
        hpMaximo:
          typeof criaturaEnCola.vidaMaxima === "number" && criaturaEnCola.vidaMaxima > 0
            ? criaturaEnCola.vidaMaxima
            : pj.hpMaximo,
        hpTemporal:
          typeof criaturaEnCola.vidaTemporal === "number" ? criaturaEnCola.vidaTemporal : pj.hpTemporal,
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

  actualizarPersonajeDesdeSync: (dto: EstadoCombatePJ) => {
    logger.debug("[SliceSync] Actualizando personaje desde sync:", dto.nombre, dto.id);

    const { personajes, colaIniciativa } = get();

    // 1. Localizar personaje en la colección del DM
    const indexPj = personajes.findIndex((p) => {
      if (p.id === dto.id) return true;
      if (p.idMiniaturaTS && dto.idMiniaturaTS && p.idMiniaturaTS === dto.idMiniaturaTS) return true;
      return coincidenNombresTaleSpire(p.nombre, dto.nombre);
    });

    let personajesActualizados = personajes;

    if (indexPj !== -1) {
      const pjExistente = personajes[indexPj];
      const pjActualizado = {
        ...pjExistente,
        hpActual: dto.hpActual,
        hpMaximo: dto.hpMaximo,
        hpTemporal: dto.hpTemporal,
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
          ? { ...pjExistente.espaciosConjuroGastados, ...dto.conjuros.espaciosGastados }
          : pjExistente.espaciosConjuroGastados,
        puntosConjuroGastados: dto.conjuros?.puntosGastados !== undefined
          ? dto.conjuros.puntosGastados
          : pjExistente.puntosConjuroGastados,
        espaciosPactoGastados: dto.conjuros?.pacto?.gastados !== undefined
          ? dto.conjuros.pacto.gastados
          : pjExistente.espaciosPactoGastados,
      };

      personajesActualizados = [
        ...personajes.slice(0, indexPj),
        pjActualizado,
        ...personajes.slice(indexPj + 1),
      ];
    }

    // 2. Reflejar también en la cola de iniciativa si la criatura está presente
    const colaActualizada = colaIniciativa.map((criatura): CriaturaIniciativa => {
      const coincidePorId = criatura.id === dto.id || (dto.idMiniaturaTS && criatura.id === dto.idMiniaturaTS);
      const coincidePorNombre = coincidenNombresTaleSpire(criatura.nombre, dto.nombre);

      if (coincidePorId || coincidePorNombre) {
        return {
          ...criatura,
          iniciativa: dto.iniciativa !== undefined ? dto.iniciativa : criatura.iniciativa,
          vidaActual: dto.hpActual,
          vidaMaxima: dto.hpMaximo,
          vidaTemporal: dto.hpTemporal,
          ca: dto.ca,
          condiciones: dto.condiciones,
          efectos: dto.efectos,
        };
      }
      return criatura;
    });

    set({
      personajes: personajesActualizados,
      colaIniciativa: colaActualizada,
      ultimoSyncRecibido: Date.now(),
    });
  },
});
