/**
 * usarEstadoPersonajes.ts
 * -----------------------
 * Hook Facade que agrupa en una sola suscripción al store todos los selectores
 * relacionados con los personajes de los jugadores.
 */

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import type { PersonajeJugador } from '@/tipos';
import {
  calcularEstadisticasPersonaje,
  extraerCaDePropiedades,
  type InformacionCA,
  type PenalizacionArmadura,
  type EstadisticasCalculadasPersonaje
} from '@/servicios/personajes/calculadorEstadisticasPersonaje';

// Re-exportaciones para compatibilidad retroactiva total
export {
  calcularEstadisticasPersonaje,
  extraerCaDePropiedades,
  type InformacionCA,
  type PenalizacionArmadura,
  type EstadisticasCalculadasPersonaje
};

/**
 * Selector atómico para suscribirse única y exclusivamente al personaje activo.
 * Previene re-renders cuando mutan otros personajes en la lista.
 */
export function usarPersonajeActivo(): PersonajeJugador | null {
  return usarAlmacenDM((s) => {
    const lista = s.personajes || [];
    return lista.find((p) => p && p.id === s.idPersonajeActivo) || lista[0] || null;
  });
}

/**
 * Selector atómico para suscribirse únicamente al ID del personaje activo.
 */
export function usarIdPersonajeActivo(): string | null {
  return usarAlmacenDM((s) => s.idPersonajeActivo);
}

/**
 * Selector atómico para la lista completa de personajes.
 */
export function usarListaPersonajes(): PersonajeJugador[] {
  return usarAlmacenDM((s) => s.personajes || []);
}

/**
 * Hook memoizado que retorna las estadísticas calculadas del personaje activo actual.
 */
export function usarEstadisticasPersonajeActivo(): EstadisticasCalculadasPersonaje | null {
  const personaje = usarPersonajeActivo();
  const catalogo = usarAlmacenDM(s => s.objetosHomebrew);
  return useMemo(() => (personaje ? calcularEstadisticasPersonaje(personaje, catalogo) : null), [personaje, catalogo]);
}

/** Estado de lectura de personajes (Compatibilidad retroactiva). */
export function usarEstadoPersonajes() {
  return usarAlmacenDM(
    useShallow((s) => {
      const listaPjs = s.personajes || [];
      const activo =
        listaPjs.find((pj) => pj && pj.id === s.idPersonajeActivo) ||
        listaPjs[0] ||
        null;

      return {
        personajes: listaPjs,
        idPersonajeActivo: s.idPersonajeActivo || (activo ? activo.id : null),
        personajeActivo: activo
      };
    })
  );
}

/** Acciones de escritura de personajes. */
export function usarAccionesPersonajes() {
  return usarAlmacenDM(
    useShallow((s) => ({
      crearPersonaje:                      s.crearPersonaje,
      actualizarPersonaje:                s.actualizarPersonaje,
      eliminarPersonaje:                  s.eliminarPersonaje,
      duplicarPersonaje:                  s.duplicarPersonaje,
      seleccionarPersonajeActivo:         s.seleccionarPersonajeActivo,
      modificarHPPersonaje:               s.modificarHPPersonaje,
      aplicarCuracionPersonaje:           s.aplicarCuracionPersonaje,
      aplicarDanoPersonaje:               s.aplicarDanoPersonaje,
      establecerHPActualPersonaje:        s.establecerHPActualPersonaje,
      modificarHPMaximoEfectivoPersonaje: s.modificarHPMaximoEfectivoPersonaje,
      modificarHPMaximoBasePersonaje:     s.modificarHPMaximoBasePersonaje,
      modificarHPTemporalPersonaje:       s.modificarHPTemporalPersonaje,
      gastarDadoGolpePersonaje:           s.gastarDadoGolpePersonaje,
      establecerDadosGolpeRestantesPersonaje: s.establecerDadosGolpeRestantesPersonaje,
      ejecutarDescansoPersonaje:          s.ejecutarDescansoPersonaje,
      alternarInspiracionPersonaje:       s.alternarInspiracionPersonaje,
      modificarSalvacionesMuertePersonaje: s.modificarSalvacionesMuertePersonaje,
      establecerSalvacionesMuertePersonaje: s.establecerSalvacionesMuertePersonaje,
      reiniciarSalvacionesMuertePersonaje: s.reiniciarSalvacionesMuertePersonaje,
      modificarCansancioPersonaje:        s.modificarCansancioPersonaje,
      modificarCaracteristicaBasePersonaje: s.modificarCaracteristicaBasePersonaje,
      alternarSalvacionPersonaje:         s.alternarSalvacionPersonaje,
      ciclarGradoHabilidadPersonaje:      s.ciclarGradoHabilidadPersonaje,
      establecerGradoHabilidadPersonaje:  s.establecerGradoHabilidadPersonaje,
      personalizarHabilidadPersonaje:     s.personalizarHabilidadPersonaje,
      personalizarCaracteristicaPersonaje: s.personalizarCaracteristicaPersonaje,
      aplicarCondicionPersonaje:          s.aplicarCondicionPersonaje,
      quitarCondicionPersonaje:           s.quitarCondicionPersonaje,
      quitarEfectoPersonaje:              s.quitarEfectoPersonaje,
      vincularMiniaturaTSPersonaje:       s.vincularMiniaturaTSPersonaje,

      // Movimiento y Velocidad Dinámica
      registrarMovimientoTSPersonaje:     s.registrarMovimientoTSPersonaje,
      establecerPosicionInicialTSPersonaje: s.establecerPosicionInicialTSPersonaje,
      modificarMovimientoRestanteManualPersonaje: s.modificarMovimientoRestanteManualPersonaje,
      modificarMovimientoGastadoPersonaje: s.modificarMovimientoGastadoPersonaje,
      deshacerUltimoMovimientoPersonaje:  s.deshacerUltimoMovimientoPersonaje,
      restablecerMovimientoPersonaje:     s.restablecerMovimientoPersonaje,
      alternarAccionCarreraPersonaje:     s.alternarAccionCarreraPersonaje,
      establecerTipoTerrenoPersonaje:     s.establecerTipoTerrenoPersonaje,

      // Magia y Lanzamiento de Conjuros
      configurarLanzadorConjuros:         s.configurarLanzadorConjuros,
      establecerConcentracion:            s.establecerConcentracion,
      romperConcentracion:                s.romperConcentracion,
      agregarTrucoConocido:               s.agregarTrucoConocido,
      quitarTrucoConocido:                s.quitarTrucoConocido,
      agregarConjuroConocido:             s.agregarConjuroConocido,
      quitarConjuroConocido:              s.quitarConjuroConocido,
      alternarConjuroPreparado:           s.alternarConjuroPreparado,
      desprepararConjuroPersonaje:        s.desprepararConjuroPersonaje,
      gastarEspacioConjuro:               s.gastarEspacioConjuro,
      recuperarEspacioConjuro:            s.recuperarEspacioConjuro,
      recuperarTodosEspaciosConjuro:      s.recuperarTodosEspaciosConjuro,
      gastarPuntosConjuro:                s.gastarPuntosConjuro,
      recuperarPuntosConjuro:             s.recuperarPuntosConjuro,
      recuperarTodosPuntosConjuro:        s.recuperarTodosPuntosConjuro,
      gastarEspacioPacto:                 s.gastarEspacioPacto,
      recuperarEspacioPacto:              s.recuperarEspacioPacto,
      recuperarEspaciosPacto:             s.recuperarEspaciosPacto,
      establecerOverrideEspacios:         s.establecerOverrideEspacios,
      establecerOverridePuntos:           s.establecerOverridePuntos,
      recalcularRecursosMagicos:          s.recalcularRecursosMagicos,

      // Inventario y Monedas
      agregarObjetoInventario:            s.agregarObjetoInventario,
      quitarObjetoInventario:             s.quitarObjetoInventario,
      modificarCantidadObjeto:            s.modificarCantidadObjeto,
      alternarEquipadoObjeto:             s.alternarEquipadoObjeto,
      alternarSintonizadoObjeto:          s.alternarSintonizadoObjeto,
      actualizarNotasObjeto:              s.actualizarNotasObjeto,
      actualizarObjetoInventario:         s.actualizarObjetoInventario,
      modificarCargasObjeto:              s.modificarCargasObjeto,
      cambiarContenedorObjeto:            s.cambiarContenedorObjeto,
      reordenarInventario:                s.reordenarInventario,
      desempaquetarPaquete:               s.desempaquetarPaquete,
      establecerMonedas:                  s.establecerMonedas,
      modificarMoneda:                    s.modificarMoneda,

      // Rasgos y Dotes
      agregarRasgoPersonaje:              s.agregarRasgoPersonaje,
      actualizarRasgoPersonaje:           s.actualizarRasgoPersonaje,
      eliminarRasgoPersonaje:             s.eliminarRasgoPersonaje,
      gastarUsoRasgoPersonaje:            s.gastarUsoRasgoPersonaje,
      recuperarUsoRasgoPersonaje:         s.recuperarUsoRasgoPersonaje,
      establecerUsosRestantesRasgoPersonaje: s.establecerUsosRestantesRasgoPersonaje,
      sincronizarRasgosPersonaje:         s.sincronizarRasgosPersonaje,
      alternarActivoRasgo:                s.alternarActivoRasgo,
      alternarOcultarRasgo:               s.alternarOcultarRasgo,
      desocultarTodosLosRasgos:           s.desocultarTodosLosRasgos,
      alternarOcultarConjuro:             s.alternarOcultarConjuro,
      desocultarTodosLosConjuros:         s.desocultarTodosLosConjuros,
      actualizarSeleccionRasgo:           s.actualizarSeleccionRasgo,
      dispararRasgosIniciativaPersonaje:  s.dispararRasgosIniciativaPersonaje,
      establecerFormasConocidasDruida:    s.establecerFormasConocidasDruida,
      transformarEnFormaSalvaje:          s.transformarEnFormaSalvaje,
      revertirFormaSalvaje:               s.revertirFormaSalvaje,

      // Acompañantes y Sidekicks
      agregarAcompanantePersonaje:         s.agregarAcompanantePersonaje,
      eliminarAcompanantePersonaje:        s.eliminarAcompanantePersonaje,
      modificarVidaAcompanante:            s.modificarVidaAcompanante,
      actualizarAcompanante:               s.actualizarAcompanante,
      vincularMiniaturaTSAcompanante:       s.vincularMiniaturaTSAcompanante,
      registrarMovimientoTSAcompanante:    s.registrarMovimientoTSAcompanante,
      establecerPosicionInicialTSAcompanante: s.establecerPosicionInicialTSAcompanante,
      modificarMovimientoRestanteManualAcompanante: s.modificarMovimientoRestanteManualAcompanante,
      modificarMovimientoGastadoAcompanante: s.modificarMovimientoGastadoAcompanante,
      deshacerUltimoMovimientoAcompanante: s.deshacerUltimoMovimientoAcompanante,
      restablecerMovimientoAcompanante:    s.restablecerMovimientoAcompanante,
      alternarAccionCarreraAcompanante:    s.alternarAccionCarreraAcompanante,
      establecerTipoTerrenoAcompanante:    s.establecerTipoTerrenoAcompanante
    }))
  );
}
