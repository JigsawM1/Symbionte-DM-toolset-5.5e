/** Conexión efímera v4, memoria persistida y adaptadores de borradores históricos. */

import type { StateCreator } from "zustand";
import type { EstadoDM, CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { BorradorCombatePJ } from "@/tipos/borradoresSync";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";
import { logger } from "@/utiles/logger";
import { CONEXION_SYNC_V4_INICIAL, type EstadoConexionSyncV4, type MemoriaSyncV4, type RecuperacionContextosSync } from "@/tipos/estadoSyncV4";
import { personajesDelContexto, estadoDelContexto, conservarFichasAjenas } from '@/almacen/campaniasPersonajes';

export interface SliceSync {
  versionContextosSync: number;
  recuperacionContextosSync: RecuperacionContextosSync | null;
  conexionSyncV4: EstadoConexionSyncV4;
  memoriaSyncV4: MemoriaSyncV4;
  aplicandoSync: boolean;
  idClienteDM: string | null;
  borradoresSync: Record<string, BorradorCombatePJ>;
  guardarBorradorSync: (id: string, borrador: BorradorCombatePJ) => void;
  descartarBorradorSync: (id: string) => void;
  reaplicarBorradorSync: (id: string) => boolean;

  establecerIdClienteDM: (id: string | null) => void;
  aplicarBorradorCombatePJ: (dto: BorradorCombatePJ) => void;
  descartarRecuperacionContextosSync: () => void;
}


export const crearSliceSync: StateCreator<
  EstadoDM,
  [],
  [],
  SliceSync
> = (set, get) => ({  versionContextosSync: 0,
  recuperacionContextosSync: null,
  conexionSyncV4: { ...CONEXION_SYNC_V4_INICIAL },
  memoriaSyncV4: {},
  aplicandoSync: false,
  idClienteDM: null,
  borradoresSync: {},
  guardarBorradorSync: (id, borrador) => set(s => ({ borradoresSync: { ...s.borradoresSync, [id]: borrador } })),
  descartarBorradorSync: id => set(s => ({ borradoresSync: Object.fromEntries(Object.entries(s.borradoresSync).filter(([clave]) => clave !== id)) })),
  descartarRecuperacionContextosSync: () => set({ recuperacionContextosSync: null }),
  reaplicarBorradorSync: id => {
    const s = get();
    const borrador = s.borradoresSync[id];
    if (!borrador) return false;
    const destino = personajesDelContexto(s).find(p => p.id === borrador.id || (p.idMiniaturaTS && p.idMiniaturaTS === borrador.idMiniaturaTS));
    if (!destino || (s.contextoTaleSpire && borrador.campaniaId !== s.contextoTaleSpire.campania.id)) {
      s.agregarNotificacion('Revisa la campaña del borrador antes de recuperarlo. Se conserva para descargar.', 'advertencia'); return false;
    }
    const tieneDestino = s.personajes.some(p => p.id === borrador.id ||
      (borrador.idMiniaturaTS && p.idMiniaturaTS === borrador.idMiniaturaTS)) ||
      (s.esGM && s.colaIniciativa.some(c => !c.esMonstruo && !c.esAcompanante &&
        (c.id === borrador.id || c.idPersonajeDuenio === borrador.id ||
          (borrador.idMiniaturaTS && c.id === borrador.idMiniaturaTS))));
    if (!tieneDestino) {
      s.agregarNotificacion('No se encontró la ficha de este cambio. El borrador sigue disponible para descargar.', 'advertencia');
      return false;
    }
    s.aplicarBorradorCombatePJ(borrador);
    get().descartarBorradorSync(id);
    return true;
  },

  establecerIdClienteDM: (id: string | null) => {
    set({ idClienteDM: id });
  },

  aplicarBorradorCombatePJ: (dto) => {
    logger.debug("[SliceSync] Reaplicando borrador guardado:", dto.nombre, dto.id);

    const lectura = get();
    const { personajes, colaIniciativa } = estadoDelContexto(lectura);
    if (lectura.contextoTaleSpire && (dto.campaniaId !== lectura.contextoTaleSpire.campania.id
      || !personajes.some(p => p.id === dto.id || (!!dto.idMiniaturaTS && p.idMiniaturaTS === dto.idMiniaturaTS)))) {
      lectura.agregarNotificacion('El borrador no está vinculado a una ficha de esta campaña.', 'advertencia'); return;
    }
    const locales = dto;

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
          const local = locales?.acompanantes?.find(a => a.id === acompDTO.id);

          return {
            ...acompExistente,
            nombre: acompDTO.nombre || acompExistente.nombre,
            vidaActual: acompDTO.vidaActual,
            vidaMaxima: acompDTO.vidaMaxima,
            vidaTemporal: (acompDTO.vidaTemporal ?? acompExistente.vidaTemporal),
            ca: acompDTO.ca ?? acompExistente.ca,
            condiciones: acompDTO.condiciones || [],
            efectos: acompDTO.efectos || [],
            iniciativa: acompDTO.iniciativa ?? acompExistente.iniciativa,
            idMiniaturaTS:
              acompDTO.idMiniaturaTS !== undefined ? acompDTO.idMiniaturaTS : acompExistente.idMiniaturaTS,
            velocidad: local?.velocidad ?? acompExistente.velocidad,
            movimientoGastado: local?.movimientoGastado ?? acompExistente.movimientoGastado,
            movimientoMaximoTemporal:
              local?.movimientoMaximoTemporal !== undefined
                ? local.movimientoMaximoTemporal
                : acompExistente.movimientoMaximoTemporal,
            esInvocacion: local?.esInvocacion ?? acompExistente.esInvocacion,
            nivelConjuroInvocacion:
              local?.nivelConjuroInvocacion ?? acompExistente.nivelConjuroInvocacion,
            subtipoInvocacion: local?.subtipoInvocacion ?? acompExistente.subtipoInvocacion,
            idPlantilla: local?.idPlantilla ?? acompExistente.idPlantilla,
          };
        });

        // Añadir acompañantes nuevos del DTO si no estaban en el DM
        const nuevosAcomps = (dto.acompanantes || [])
          .filter((a) => !idsProcesados.has(a.id))
          .map((a) => {
            const local = locales?.acompanantes?.find(ac => ac.id === a.id);
            return {
              id: a.id,
              nombre: a.nombre,
              idPlantilla: local?.idPlantilla || "",
              vidaActual: a.vidaActual,
              vidaMaxima: a.vidaMaxima,
              vidaTemporal: a.vidaTemporal ?? 0,
              ca: a.ca ?? 10,
              condiciones: a.condiciones || [],
              efectos: a.efectos || [],
              iniciativa: a.iniciativa ?? 0,
              idMiniaturaTS: a.idMiniaturaTS ?? null,
              velocidad: local?.velocidad || "30 pies",
              movimientoGastado: local?.movimientoGastado ?? 0,
              movimientoMaximoTemporal: local?.movimientoMaximoTemporal ?? null,
              tipoTerreno: "normal" as const,
              multiplicadorTerreno: 1,
              ultimaPosicionTS: null,
              ultimoBoardIdTS: null,
              historialMovimiento: [],
              esInvocacion: local?.esInvocacion,
              nivelConjuroInvocacion: local?.nivelConjuroInvocacion,
              subtipoInvocacion: local?.subtipoInvocacion,
            };
          });

        acompSincronizados = [...actualizados, ...nuevosAcomps];
      }

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
              ...(dto.concentracion.hechizoId === pjExistente.concentracionActiva?.idRasgoOrigen
                ? { hechizoId: undefined, idRasgoOrigen: dto.concentracion.hechizoId } : {}),
            }
          : null,
        espaciosConjuroGastados: locales?.conjuros?.espaciosGastados
          ? { ...locales.conjuros.espaciosGastados }
          : pjExistente.espaciosConjuroGastados,
        puntosConjuroGastados:
          locales?.conjuros?.puntosGastados !== undefined
            ? locales.conjuros.puntosGastados
            : pjExistente.puntosConjuroGastados,
        espaciosPactoGastados:
          locales?.conjuros?.pacto?.gastados !== undefined
            ? locales.conjuros.pacto.gastados
            : pjExistente.espaciosPactoGastados,
        movimientoGastado: locales?.movimientoGastado ?? pjExistente.movimientoGastado,
        movimientoMaximoTemporal:
          locales?.movimientoMaximoTemporal !== undefined
            ? locales.movimientoMaximoTemporal
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
          (dto.idMiniaturaTS && criatura.id === dto.idMiniaturaTS) || coincidenNombresTaleSpire(criatura.nombre, dto.nombre));
      if (coincidePorIdPJ) {

        return {
          ...criatura,
          esMonstruo: false,
          idPlantillaAsociada: undefined,
          idPersonajeDuenio: dto.id,
          avatarUrl: dto.avatarUrl ?? criatura.avatarUrl,
          iniciativa: dto.iniciativa !== undefined ? dto.iniciativa : criatura.iniciativa,
          vidaActual: dto.hpActual,
          vidaMaxima: dto.hpMaximo,
          vidaTemporal: dto.hpTemporal,
          ca: dto.ca,
          pasivas: dto.pasivas || criatura.pasivas,
          condiciones: dto.condiciones,
          efectos: dto.efectos,
          movimientoGastado: locales?.movimientoGastado ?? criatura.movimientoGastado,
          movimientoMaximoTemporal:
            locales?.movimientoMaximoTemporal !== undefined
              ? locales.movimientoMaximoTemporal
              : criatura.movimientoMaximoTemporal,
        };
      }

      // Caso B: La criatura en cola es un acompañante de este personaje
      if (dto.acompanantes && dto.acompanantes.length > 0) {
        const acompCoincidente = dto.acompanantes.find(
          (a) =>
            criatura.id === a.id ||
            criatura.idAcompanante === a.id ||
            (a.idMiniaturaTS && criatura.id === a.idMiniaturaTS) || coincidenNombresTaleSpire(criatura.nombre, a.nombre)
        );

        if (acompCoincidente) {
          const local = locales?.acompanantes?.find(a => a.id === acompCoincidente.id);

          return {
            ...criatura,
            iniciativa: acompCoincidente.iniciativa !== undefined ? acompCoincidente.iniciativa : criatura.iniciativa,
            vidaActual: acompCoincidente.vidaActual,
            vidaMaxima: acompCoincidente.vidaMaxima,
            vidaTemporal: (acompCoincidente.vidaTemporal ?? criatura.vidaTemporal),
            ca: acompCoincidente.ca ?? criatura.ca,
            condiciones: acompCoincidente.condiciones || [],
            efectos: acompCoincidente.efectos || [],
            movimientoGastado: local?.movimientoGastado ?? criatura.movimientoGastado,
            movimientoMaximoTemporal:
              local?.movimientoMaximoTemporal !== undefined
                ? local.movimientoMaximoTemporal
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
            velocidad: locales?.acompanantes?.find(ac => ac.id === a.id)?.velocidad || "30 pies",
          });
        }
      });
    }

    set(conservarFichasAjenas(lectura, {
      personajes: personajesActualizados,
      colaIniciativa: colaActualizada,
    }));
  },
});
