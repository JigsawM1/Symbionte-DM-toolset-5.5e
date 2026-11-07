/**
 * @module accionesSyncV2
 * Sub-módulo de acciones de Zustand para el motor de micro-eventos Sync v2.
 *
 * Responsabilidades:
 * 1. Aplicar deltas relativos de vitalidad (`DELTA_VIDA`) sobre PJs y acompañantes usando `calcularAbsorcionDeltaVida`.
 * 2. Actualizar quirúrgicamente una única criatura (`CRIATURA_ESTADO`) sin sobrescribir el resto de la cola.
 * 3. Actualizar metadatos de combate (`META_COMBATE`) expirando efectos de ronda localmente.
 * 4. Gestionar la detección y resolución interactiva de discrepancias de vitalidad al reconectar.
 */

import type { EstadoDM, CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import {
  desempaquetarResumenCriaturaDM,
  deserializarEfectoSyncV2,
  type DiscrepanciaVitalidadSync,
  type DecisionDiscrepanciaVitalidad,
  type TipoDeltaVida,
  type ResumenCriaturaDMWire,
  type ResumenCombatePJWire,
  type MensajeLoteInicialSync,
} from "@/tipos/protocoloSync";
import { calcularAbsorcionDeltaVida } from "@/servicios/sincronizacion/absorbenteDeltasVida";
import { emitirEstadoPJSync } from "@/servicios/sincronizacion/motorEventosSync";
import { filtrarEfectosExpirados } from "@/servicios/sincronizacionIniciativa";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";
import { sincronizarEstadosPersonajesDesdeCola } from "./iniciativa/sincronizadorEfectosIniciativa";

export interface AccionesSyncV2 {
  discrepanciaVitalidadPendiente: DiscrepanciaVitalidadSync | null;
  registrarDiscrepanciaVitalidad: (discrepancia: DiscrepanciaVitalidadSync | null) => void;
  resolverDiscrepanciaVitalidad: (decision: DecisionDiscrepanciaVitalidad) => void;
  aplicarEstadoPJDesdeSyncV2: (wire: ResumenCombatePJWire) => void;
  aplicarDeltaVidaDesdeSync: (
    idObjetivo: string,
    delta: number,
    tipo: TipoDeltaVida,
    cmdId: string
  ) => void;
  aplicarCriaturaDesdeSync: (criatura: ResumenCriaturaDMWire, eliminada?: boolean) => void;
  aplicarMetaCombateDesdeSync: (meta: {
    r: number;
    idx: number;
    vPorcentaje: boolean;
    limpiar?: boolean;
  }) => void;
  aplicarLoteInicialDesdeSync: (lote: MensajeLoteInicialSync) => void;
}

type SetEstadoDM = (
  partial:
    | Partial<EstadoDM>
    | ((state: EstadoDM) => Partial<EstadoDM>),
  replace?: false
) => void;

type GetEstadoDM = () => EstadoDM;

interface SesionLoteSync {
  sesionId: string;
  total: number;
  r: number;
  idx: number;
  vPorcentaje: boolean;
  partes: Map<number, ResumenCriaturaDMWire[]>;
  timestamp: number;
}

let sesionLoteActiva: SesionLoteSync | null = null;

export function reiniciarBufferLotesInicialesSyncV2(): void {
  sesionLoteActiva = null;
}

/**
 * Crea el conjunto de acciones de Zustand correspondientes al protocolo Sync v2.
 */
export function crearAccionesSyncV2(
  set: SetEstadoDM,
  get: GetEstadoDM
): AccionesSyncV2 {
  return {
    discrepanciaVitalidadPendiente: null,

    registrarDiscrepanciaVitalidad: (discrepancia) => {
      set({ discrepanciaVitalidadPendiente: discrepancia });
    },

    resolverDiscrepanciaVitalidad: (decision) => {
      const { discrepanciaVitalidadPendiente, personajes, colaIniciativa, esGM } = get();
      if (!discrepanciaVitalidadPendiente) return;

      const { idPJ, hpRemotoDM, hpTempRemotoDM, hpLocal, hpTempLocal } =
        discrepanciaVitalidadPendiente;

      if (decision === "aceptar_dm") {
        const personajesActualizados = personajes.map((pj) =>
          pj.id === idPJ
            ? { ...pj, hpActual: hpRemotoDM, hpTemporal: hpTempRemotoDM }
            : pj
        );
        const colaActualizada = colaIniciativa.map((c) => {
          const esCriaturaPJ =
            !c.esAcompanante &&
            !c.idAcompanante &&
            (c.id === idPJ || c.idPersonajeDuenio === idPJ);
          return esCriaturaPJ
            ? { ...c, vidaActual: hpRemotoDM, vidaTemporal: hpTempRemotoDM }
            : c;
        });
        set({
          personajes: personajesActualizados,
          colaIniciativa: colaActualizada,
          discrepanciaVitalidadPendiente: null,
        });
      } else {
        const colaActualizada = colaIniciativa.map((c) => {
          const esCriaturaPJ =
            !c.esAcompanante &&
            !c.idAcompanante &&
            (c.id === idPJ || c.idPersonajeDuenio === idPJ);
          return esCriaturaPJ
            ? { ...c, vidaActual: hpLocal, vidaTemporal: hpTempLocal }
            : c;
        });
        set({
          colaIniciativa: colaActualizada,
          discrepanciaVitalidadPendiente: null,
        });
        const pjActual = personajes.find((pj) => pj.id === idPJ);
        if (pjActual && !esGM) {
          void emitirEstadoPJSync(pjActual, colaActualizada);
        }
      }
    },

    aplicarEstadoPJDesdeSyncV2: (wire) => {
      const state = get();
      state.actualizarPersonajeDesdeSync({
        id: wire.id,
        idMiniaturaTS: wire.m,
        nombre: wire.n,
        avatarUrl: wire.av,
        iniciativa: wire.i,
        hpActual: wire.va,
        hpMaximo: wire.vm,
        hpTemporal: wire.vt ?? 0,
        ca: wire.ca,
        condiciones: wire.c ?? [],
        efectos: (wire.e ?? []).map(deserializarEfectoSyncV2),
        pasivas: {
          percepcion: wire.p[0],
          investigacion: wire.p[1],
          perspicacia: wire.p[2],
        },
        concentracion: wire.conc
          ? { hechizoId: wire.conc[0], nombreHechizo: wire.conc[1] }
          : null,
        acompanantes: wire.ac?.map((ac) => ({
          id: ac.id,
          nombre: ac.n,
          vidaActual: ac.va,
          vidaMaxima: ac.vm,
          vidaTemporal: ac.vt ?? 0,
          ca: ac.ca ?? 10,
          condiciones: ac.c ?? [],
          efectos: (ac.e ?? []).map(deserializarEfectoSyncV2),
          iniciativa: ac.i ?? 0,
          idMiniaturaTS: ac.m,
        })),
        ts: wire.ts,
      });
    },

    aplicarDeltaVidaDesdeSync: (idObjetivo, delta, tipo, cmdId) => {
      const { personajes, colaIniciativa, agregarNotificacion, esGM } = get();
      let mensajeConcentracionPendiente: string | null = null;
      let idPjAfectado: string | null = null;

      const nuevosPersonajes = personajes.map((pj) => {
        const coincidePJ =
          pj.id === idObjetivo ||
          (Boolean(pj.idMiniaturaTS) && pj.idMiniaturaTS === idObjetivo);

        if (coincidePJ) {
          idPjAfectado = pj.id;
          const absorcion = calcularAbsorcionDeltaVida(
            {
              hpActual: pj.hpActual,
              hpMaximo: pj.hpMaximo,
              hpTemporal: pj.hpTemporal || 0,
              tieneConcentracion: Boolean(pj.concentracionActiva),
              nombreHechizoConcentrado: pj.concentracionActiva?.nombreHechizo,
            },
            delta,
            tipo
          );
          if (absorcion.mensajeConcentracion) {
            mensajeConcentracionPendiente = absorcion.mensajeConcentracion;
          }
          return {
            ...pj,
            hpActual: absorcion.hpActual,
            hpTemporal: absorcion.hpTemporal,
          };
        }

        const nuevosAcomps = (pj.acompanantes || []).map((acomp) => {
          const coincideAcomp =
            acomp.id === idObjetivo ||
            (Boolean(acomp.idMiniaturaTS) && acomp.idMiniaturaTS === idObjetivo);
          if (!coincideAcomp) return acomp;

          idPjAfectado = pj.id;
          const absorcionAcomp = calcularAbsorcionDeltaVida(
            {
              hpActual: acomp.vidaActual,
              hpMaximo: acomp.vidaMaxima,
              hpTemporal: acomp.vidaTemporal || 0,
              tieneConcentracion: false,
            },
            delta,
            tipo
          );
          return {
            ...acomp,
            vidaActual: absorcionAcomp.hpActual,
            vidaTemporal: absorcionAcomp.hpTemporal,
          };
        });

        return { ...pj, acompanantes: nuevosAcomps };
      });

      let esObjetivoAcompanante = false;
      for (const pj of personajes) {
        if (
          (pj.acompanantes || []).some(
            (a) =>
              a.id === idObjetivo ||
              (Boolean(a.idMiniaturaTS) && a.idMiniaturaTS === idObjetivo)
          )
        ) {
          esObjetivoAcompanante = true;
          break;
        }
      }
      if (!esObjetivoAcompanante) {
        const criaturaObj = colaIniciativa.find(
          (c) => c.id === idObjetivo || c.idAcompanante === idObjetivo
        );
        if (criaturaObj?.esAcompanante || Boolean(criaturaObj?.idAcompanante)) {
          esObjetivoAcompanante = true;
        }
      }

      const nuevaCola = colaIniciativa.map((c): CriaturaIniciativa => {
        let coincideCola = false;
        if (esObjetivoAcompanante) {
          coincideCola =
            (Boolean(c.esAcompanante) || Boolean(c.idAcompanante)) &&
            (c.id === idObjetivo || c.idAcompanante === idObjetivo);
        } else {
          coincideCola =
            !c.esAcompanante &&
            !c.idAcompanante &&
            (c.id === idObjetivo || c.idPersonajeDuenio === idObjetivo);
        }
        if (!coincideCola) return c;

        const absorcionCola = calcularAbsorcionDeltaVida(
          {
            hpActual: c.vidaActual,
            hpMaximo: c.vidaMaxima,
            hpTemporal: c.vidaTemporal || 0,
            tieneConcentracion: false,
          },
          delta,
          tipo
        );
        return {
          ...c,
          vidaActual: absorcionCola.hpActual,
          vidaTemporal: absorcionCola.hpTemporal,
        };
      });

      set({
        aplicandoSync: true,
        personajes: nuevosPersonajes,
        colaIniciativa: nuevaCola,
      });

      queueMicrotask(() => {
        set({ aplicandoSync: false });
      });

      if (mensajeConcentracionPendiente) {
        agregarNotificacion(mensajeConcentracionPendiente, "advertencia");
      }

      if (!esGM && idPjAfectado) {
        const pjConfirmado = nuevosPersonajes.find((p) => p.id === idPjAfectado);
        if (pjConfirmado) {
          void emitirEstadoPJSync(pjConfirmado, nuevaCola, cmdId);
        }
      }
    },

    aplicarCriaturaDesdeSync: (wireCriatura, eliminada = false) => {
      const { colaIniciativa, personajes } = get();
      if (eliminada) {
        set({
          aplicandoSync: true,
          colaIniciativa: colaIniciativa.filter((c) => c.id !== wireCriatura.id),
        });
        queueMicrotask(() => set({ aplicandoSync: false }));
        return;
      }

      const criaturaDesempaquetada = desempaquetarResumenCriaturaDM(wireCriatura);
      const existe = colaIniciativa.some((c) => c.id === wireCriatura.id);
      const nuevaCola = existe
        ? colaIniciativa.map((c) => {
            if (c.id !== wireCriatura.id) return c;
            if (criaturaDesempaquetada.esMonstruo) return { ...c, ...criaturaDesempaquetada };
            // La vitalidad de PJ y acompañantes se sincroniza mediante DELTA_VIDA.
            return { ...c, condiciones: criaturaDesempaquetada.condiciones, efectos: criaturaDesempaquetada.efectos };
          })
        : [...colaIniciativa, criaturaDesempaquetada];

      set({
        aplicandoSync: true,
        colaIniciativa: nuevaCola,
        personajes: sincronizarEstadosPersonajesDesdeCola(personajes, [criaturaDesempaquetada]),
      });
      queueMicrotask(() => set({ aplicandoSync: false }));
    },

    aplicarMetaCombateDesdeSync: (meta) => {
      const { colaIniciativa, rondaActual } = get();
      if (meta.limpiar) {
        set({
          aplicandoSync: true,
          colaIniciativa: [],
          rondaActual: 1,
          indiceTurnoActivo: 0,
          mostrarPorcentajeVidaAJugadores: meta.vPorcentaje,
        });
        queueMicrotask(() => set({ aplicandoSync: false }));
        return;
      }

      const colaFiltrada =
        meta.r > rondaActual
          ? filtrarEfectosExpirados(colaIniciativa, meta.r)
          : colaIniciativa;

      set({
        aplicandoSync: true,
        colaIniciativa: colaFiltrada,
        rondaActual: meta.r,
        indiceTurnoActivo: meta.idx,
        mostrarPorcentajeVidaAJugadores: meta.vPorcentaje,
      });
      queueMicrotask(() => set({ aplicandoSync: false }));
    },

    aplicarLoteInicialDesdeSync: (lote) => {
      const sesionId = lote.s || "sesion-default";

      // Si cambia de sesión o total de partes, reiniciamos el acumulador
      if (
        !sesionLoteActiva ||
        sesionLoteActiva.sesionId !== sesionId ||
        sesionLoteActiva.total !== lote.total
      ) {
        sesionLoteActiva = {
          sesionId,
          total: lote.total,
          r: lote.r,
          idx: lote.idx,
          vPorcentaje: lote.vPorcentaje,
          partes: new Map(),
          timestamp: Date.now(),
        };
      }

      // Guardamos la parte recibida (controla duplicados por número de parte)
      sesionLoteActiva.partes.set(lote.parte, lote.criaturas);
      sesionLoteActiva.r = lote.r;
      sesionLoteActiva.idx = lote.idx;
      sesionLoteActiva.vPorcentaje = lote.vPorcentaje;

      // Si aún no hemos recibido todas las partes de 1 a total, esperamos a que llegue el lote completo
      if (sesionLoteActiva.partes.size < sesionLoteActiva.total) {
        return;
      }

      // Reconstrucción del lote completo en orden estricto de páginas 1 a total
      const criaturasWireOrdenadas: ResumenCriaturaDMWire[] = [];
      for (let p = 1; p <= sesionLoteActiva.total; p++) {
        const parte = sesionLoteActiva.partes.get(p);
        if (parte) {
          criaturasWireOrdenadas.push(...parte);
        }
      }

      const infoLoteFinal = {
        r: sesionLoteActiva.r,
        idx: sesionLoteActiva.idx,
        vPorcentaje: sesionLoteActiva.vPorcentaje,
      };

      sesionLoteActiva = null;

      const { personajes } = get();
      let discrepanciaDetectada: DiscrepanciaVitalidadSync | null = null;

      const criaturasNuevas = criaturasWireOrdenadas.map(desempaquetarResumenCriaturaDM);

      // Detección de discrepancias de vitalidad (compara vidaActual Y vidaTemporal)
      for (const pj of personajes) {
        const remotaPJ = criaturasNuevas.find(
          (c) =>
            !c.esAcompanante &&
            !c.idAcompanante &&
            (c.id === pj.id ||
              c.idPersonajeDuenio === pj.id ||
              (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
              coincidenNombresTaleSpire(c.nombre, pj.nombre))
        );
        if (remotaPJ) {
          const vidaActualDifiere = remotaPJ.vidaActual !== pj.hpActual;
          const vidaTempDifiere = (remotaPJ.vidaTemporal || 0) !== (pj.hpTemporal || 0);

          if (vidaActualDifiere || vidaTempDifiere) {
            discrepanciaDetectada = {
              idPJ: pj.id,
              nombrePJ: pj.nombre,
              hpLocal: pj.hpActual,
              hpTempLocal: pj.hpTemporal || 0,
              hpRemotoDM: remotaPJ.vidaActual,
              hpTempRemotoDM: remotaPJ.vidaTemporal || 0,
              timestampDeteccion: Date.now(),
            };
            break;
          }
        }
      }

      // Reemplaza la cola completamente y atómicamente con el lote completo recibido
      set({
        aplicandoSync: true,
        colaIniciativa: criaturasNuevas,
        personajes: sincronizarEstadosPersonajesDesdeCola(personajes, criaturasNuevas),
        rondaActual: infoLoteFinal.r,
        indiceTurnoActivo: infoLoteFinal.idx,
        mostrarPorcentajeVidaAJugadores: infoLoteFinal.vPorcentaje,
        ...(discrepanciaDetectada
          ? { discrepanciaVitalidadPendiente: discrepanciaDetectada }
          : {}),
      });
      queueMicrotask(() => set({ aplicandoSync: false }));
    },
  };
}
