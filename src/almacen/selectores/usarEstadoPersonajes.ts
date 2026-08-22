/**
 * usarEstadoPersonajes.ts
 * -----------------------
 * Hook Facade que agrupa en una sola suscripción al store todos los selectores
 * relacionados con los personajes de los jugadores.
 */

import { useShallow } from 'zustand/react/shallow';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import type { PersonajeJugador, Caracteristica, Habilidad } from '@/tipos';
import {
  obtenerBonoCompetenciaPorNivel,
  MAPA_HABILIDAD_A_CARACTERISTICA
} from '@/constantes';
import { calcularModificadorCaracteristica } from '@/servicios/procesadorDescansos';

/** Estadísticas y bonificadores dinámicos calculados a partir de un personaje. */
export interface EstadisticasCalculadasPersonaje {
  bonoCompetencia: number;
  puntuacionesEfectivas: Record<Caracteristica, number>;
  modificadores: Record<Caracteristica, number>;
  salvaciones: Record<Caracteristica, number>;
  habilidades: Record<Habilidad, number>;
  pasivas: {
    percepcion: number;
    investigacion: number;
    perspicacia: number;
  };
}

/**
 * Función pura que calcula todas las estadísticas derivadas de un personaje
 * conforme a las reglas oficiales de D&D 5.5e.
 */
export function calcularEstadisticasPersonaje(pj: PersonajeJugador): EstadisticasCalculadasPersonaje {
  const nivel = pj?.nivel || 1;
  const bonoCompetencia = obtenerBonoCompetenciaPorNivel(nivel);

  const carac = pj?.caracteristicas || {
    fuerza: 10,
    destreza: 10,
    constitucion: 10,
    inteligencia: 10,
    sabiduria: 10,
    carisma: 10
  };

  const overrides = pj?.overridesFijos || {
    fuerza: null,
    destreza: null,
    constitucion: null,
    inteligencia: null,
    sabiduria: null,
    carisma: null
  };

  const puntuacionesEfectivas: Record<Caracteristica, number> = {
    fuerza: overrides.fuerza ?? carac.fuerza ?? 10,
    destreza: overrides.destreza ?? carac.destreza ?? 10,
    constitucion: overrides.constitucion ?? carac.constitucion ?? 10,
    inteligencia: overrides.inteligencia ?? carac.inteligencia ?? 10,
    sabiduria: overrides.sabiduria ?? carac.sabiduria ?? 10,
    carisma: overrides.carisma ?? carac.carisma ?? 10
  };

  const modificadores: Record<Caracteristica, number> = {
    fuerza: calcularModificadorCaracteristica(puntuacionesEfectivas.fuerza),
    destreza: calcularModificadorCaracteristica(puntuacionesEfectivas.destreza),
    constitucion: calcularModificadorCaracteristica(puntuacionesEfectivas.constitucion),
    inteligencia: calcularModificadorCaracteristica(puntuacionesEfectivas.inteligencia),
    sabiduria: calcularModificadorCaracteristica(puntuacionesEfectivas.sabiduria),
    carisma: calcularModificadorCaracteristica(puntuacionesEfectivas.carisma)
  };

  const compSalv = pj?.competenciasSalvacion || {
    fuerza: false,
    destreza: false,
    constitucion: false,
    inteligencia: false,
    sabiduria: false,
    carisma: false
  };

  const salvaciones: Record<Caracteristica, number> = {
    fuerza: modificadores.fuerza + (compSalv.fuerza ? bonoCompetencia : 0),
    destreza: modificadores.destreza + (compSalv.destreza ? bonoCompetencia : 0),
    constitucion: modificadores.constitucion + (compSalv.constitucion ? bonoCompetencia : 0),
    inteligencia: modificadores.inteligencia + (compSalv.inteligencia ? bonoCompetencia : 0),
    sabiduria: modificadores.sabiduria + (compSalv.sabiduria ? bonoCompetencia : 0),
    carisma: modificadores.carisma + (compSalv.carisma ? bonoCompetencia : 0)
  };

  const habilidades = {} as Record<Habilidad, number>;
  const listaHabilidades = Object.keys(MAPA_HABILIDAD_A_CARACTERISTICA) as Habilidad[];
  const grados = pj?.gradosHabilidades || {};

  for (const hab of listaHabilidades) {
    const caracAsociada = MAPA_HABILIDAD_A_CARACTERISTICA[hab];
    const modBase = modificadores[caracAsociada] || 0;
    const grado = grados[hab] || "ninguna";

    let bonoHabilidad = 0;
    if (grado === "competente") {
      bonoHabilidad = bonoCompetencia;
    } else if (grado === "pericia") {
      bonoHabilidad = bonoCompetencia * 2;
    } else if (grado === "medio") {
      bonoHabilidad = Math.floor(bonoCompetencia / 2);
    }

    habilidades[hab] = modBase + bonoHabilidad;
  }

  const pasivas = {
    percepcion: 10 + (habilidades.percepcion || 0),
    investigacion: 10 + (habilidades.investigacion || 0),
    perspicacia: 10 + (habilidades.perspicacia || 0)
  };

  return {
    bonoCompetencia,
    puntuacionesEfectivas,
    modificadores,
    salvaciones,
    habilidades,
    pasivas
  };
}

/** Estado de lectura de personajes. */
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
      ejecutarDescansoPersonaje:          s.ejecutarDescansoPersonaje,
      alternarInspiracionPersonaje:       s.alternarInspiracionPersonaje,
      modificarSalvacionesMuertePersonaje: s.modificarSalvacionesMuertePersonaje,
      establecerSalvacionesMuertePersonaje: s.establecerSalvacionesMuertePersonaje,
      reiniciarSalvacionesMuertePersonaje: s.reiniciarSalvacionesMuertePersonaje,
      modificarCansancioPersonaje:        s.modificarCansancioPersonaje,
      modificarCaracteristicaBasePersonaje: s.modificarCaracteristicaBasePersonaje,
      alternarSalvacionPersonaje:         s.alternarSalvacionPersonaje,
      ciclarGradoHabilidadPersonaje:      s.ciclarGradoHabilidadPersonaje,
      aplicarCondicionPersonaje:          s.aplicarCondicionPersonaje,
      quitarCondicionPersonaje:           s.quitarCondicionPersonaje,
      vincularMiniaturaTSPersonaje:       s.vincularMiniaturaTSPersonaje
    }))
  );
}
