import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { logger } from "@/utiles/logger";
import type {
  MetadataIniciativa,
  ModoTiradaD20,
  PuertoEfectosTiradaEstado
} from "@/utiles/dados/tiposDados";
import { aplicarResultadoIniciativaEnEstado } from "./iniciativaEstadoTiradas";

export { aplicarResultadoIniciativaEnEstado };

/**
 * Aplica Puntos de Golpe Temporales calculados al personaje activo.
 * Sigue la regla D&D 5.5e: los HP temporales no se acumulan entre sí,
 * tomándose el valor superior o renovando el recurso.
 */
export function aplicarResultadoHpTemporalEnEstado(
  personajeId: string,
  hpTemporalNuevo: number
): void {
  const state = usarAlmacenDM.getState();
  const pj = state.personajes.find((p) => p.id === personajeId);
  const actual = pj?.hpTemporal || 0;
  const valorFinal = Math.max(actual, hpTemporalNuevo);
  state.modificarHPTemporalPersonaje(personajeId, valorFinal);
}

/**
 * Aplica el resultado de una tirada de salvación contra la muerte en el estado global.
 * Reglas D&D 5.5e / 2024: 1 natural = +2 fallos; 20 natural = 3 éxitos y +1 HP; >= 10 = +1 éxito; 2..9 = +1 fallo.
 */
export function aplicarResultadoSalvacionMuerteEnEstado(
  personajeId: string,
  totalDado: number
): void {
  const state = usarAlmacenDM.getState();
  if (totalDado === 1) {
    logger.info("[Lanzador Dados] Salvación de Muerte: 1 Natural (Pifia). Añadiendo 2 fallos.");
    state.modificarSalvacionesMuertePersonaje(personajeId, "fallos", 2);
  } else if (totalDado === 20) {
    logger.info("[Lanzador Dados] Salvación de Muerte: 20 Natural (Crítico). 3 éxitos y +1 HP.");
    state.establecerSalvacionesMuertePersonaje(personajeId, "exitos", 3);
    state.modificarHPPersonaje(personajeId, 1);
  } else if (totalDado >= 10) {
    logger.info(`[Lanzador Dados] Salvación de Muerte: Éxito (${totalDado}). Añadiendo 1 éxito.`);
    state.modificarSalvacionesMuertePersonaje(personajeId, "exitos", 1);
  } else {
    logger.info(`[Lanzador Dados] Salvación de Muerte: Fallo (${totalDado}). Añadiendo 1 fallo.`);
    state.modificarSalvacionesMuertePersonaje(personajeId, "fallos", 1);
  }
}

/** Implementación de producción del puerto de efectos conectado a `usarAlmacenDM`. */
export const efectosEstadoTiradasDM: PuertoEfectosTiradaEstado = {
  obtenerModoTiradaGlobal(): ModoTiradaD20 {
    return usarAlmacenDM.getState().tipoTirada;
  },
  restablecerModoTiradaGlobal(): void {
    usarAlmacenDM.getState().establecerTipoTirada("plano");
  },
  puedeGastarDadoGolpe(personajeId: string, enVuelo: number): boolean {
    const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
    return Boolean(pj && pj.dadosGolpeRestantes - enVuelo > 0);
  },
  aplicarCuracionDirectaRasgo(
    personajeId: string,
    cantidad: number,
    nombreRasgoNotificar?: string
  ): void {
    const state = usarAlmacenDM.getState();
    state.aplicarCuracionPersonaje(personajeId, cantidad);
    if (nombreRasgoNotificar) {
      state.agregarNotificacion(`¡${nombreRasgoNotificar} aplicado! Curación: +${cantidad} PV.`, "exito");
    }
  },
  aplicarResultadoHpTemporal(
    personajeId: string,
    hpTemporalNuevo: number,
    nombreRasgoNotificar?: string
  ): void {
    aplicarResultadoHpTemporalEnEstado(personajeId, hpTemporalNuevo);
    if (nombreRasgoNotificar) {
      usarAlmacenDM
        .getState()
        .agregarNotificacion(`¡${nombreRasgoNotificar} aplicado! +${hpTemporalNuevo} PV temporales.`, "exito");
    }
  },
  aplicarResultadoSalvacionMuerte(personajeId: string, totalDado: number): void {
    aplicarResultadoSalvacionMuerteEnEstado(personajeId, totalDado);
  },
  aplicarResultadoIniciativa(infoIniciativa: MetadataIniciativa, totalIniciativa: number): void {
    aplicarResultadoIniciativaEnEstado(infoIniciativa, totalIniciativa);
  },
  gastarDadoGolpeYNotificar(personajeId: string, totalDado: number): void {
    usarAlmacenDM.getState().gastarDadoGolpePersonaje(personajeId);
    const estadoActual = usarAlmacenDM.getState();
    const pj = estadoActual.personajes.find((p) => p.id === personajeId);
    const restantes = pj ? pj.dadosGolpeRestantes : 0;
    estadoActual.agregarNotificacion(
      `¡Dado de Golpe gastado! Resultado: ${totalDado} (${restantes} dados restantes).`,
      "info"
    );
  }
};
