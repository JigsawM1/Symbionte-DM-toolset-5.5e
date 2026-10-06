/**
 * @module proyeccionEstadoCombate
 * Transforma un PersonajeJugador en un DTO ligero EstadoCombatePJ para el canal de red TS.sync.
 * Excluye inventario, descripciones estáticas y rasgos innecesarios para combate en tiempo real.
 */

import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { EstadoCombatePJ } from "@/tipos/sync";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";

/**
 * Construye una proyección delgada de combate de un PersonajeJugador.
 * Resuelve CA y pasivas mediante calcularEstadisticasPersonaje.
 */
export function proyectarEstadoCombatePJ(pj: PersonajeJugador): EstadoCombatePJ {
  const stats = calcularEstadisticasPersonaje(pj);
  const estado = usarAlmacenDM.getState();

  // Buscar si el combatiente ya tiene un valor de iniciativa registrado en la cola
  const criaturaCola = estado.colaIniciativa.find(
    (c) =>
      !c.esAcompanante &&
      (c.id === pj.id ||
        c.idPersonajeDuenio === pj.id ||
        (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
        coincidenNombresTaleSpire(c.nombre, pj.nombre))
  );

  const iniciativaFinal =
    criaturaCola?.iniciativa !== undefined
      ? criaturaCola.iniciativa
      : (stats.modificadores?.destreza || 0) + (pj.iniciativaBono || 0);

  return {
    id: pj.id,
    idMiniaturaTS: pj.idMiniaturaTS,
    nombre: pj.nombre,
    iniciativa: iniciativaFinal,
    hpActual: pj.hpActual,
    hpMaximo: pj.hpMaximo,
    hpTemporal: pj.hpTemporal,
    ca: stats.claseArmadura?.total ?? pj.ca ?? 10,
    condiciones: pj.condicionesActivas || [],
    efectos: (pj.efectosActivos || []).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      expiraRonda: e.expiraRonda,
      concentracion: e.concentracion,
      duracion: e.duracion,
    })),
    pasivas: {
      percepcion: stats.pasivas?.percepcion ?? 10,
      investigacion: stats.pasivas?.investigacion ?? 10,
      perspicacia: stats.pasivas?.perspicacia ?? 10,
    },
    conjuros: {
      espaciosMaximos: pj.espaciosConjuroMaximos || {},
      espaciosGastados: pj.espaciosConjuroGastados || {},
      puntosMaximos: pj.puntosConjuroMaximos,
      puntosGastados: pj.puntosConjuroGastados,
      pacto: pj.espaciosPactoMaximos
        ? {
            maximos: pj.espaciosPactoMaximos,
            gastados: pj.espaciosPactoGastados,
            nivel: pj.nivelEspacioPacto,
          }
        : undefined,
    },
    concentracion: pj.concentracionActiva
      ? {
          hechizoId: pj.concentracionActiva.hechizoId,
          nombreHechizo: pj.concentracionActiva.nombreHechizo,
        }
      : null,
    acompanantes: (pj.acompanantes || []).map((a) => {
      const criaturaColaAcomp = (estado.colaIniciativa || []).find(
        (c) =>
          c.id === a.id ||
          c.idAcompanante === a.id ||
          (a.idMiniaturaTS && c.id === a.idMiniaturaTS) ||
          coincidenNombresTaleSpire(c.nombre, a.nombre)
      );
      const iniciativaFinalAcomp =
        criaturaColaAcomp?.iniciativa !== undefined
          ? criaturaColaAcomp.iniciativa
          : typeof a.iniciativa === "number"
          ? a.iniciativa
          : 0;

      return {
        id: a.id,
        nombre: a.nombre,
        idPlantilla: a.idPlantilla,
        vidaActual: a.vidaActual,
        vidaMaxima: a.vidaMaxima,
        vidaTemporal: a.vidaTemporal,
        ca: a.ca,
        condiciones: a.condiciones || [],
        efectos: (a.efectos || []).map((ef) => ({
          id: ef.id,
          nombre: ef.nombre,
          expiraRonda: ef.expiraRonda,
          concentracion: ef.concentracion,
          duracion: ef.duracion,
        })),
        iniciativa: iniciativaFinalAcomp,
        idMiniaturaTS: a.idMiniaturaTS,
        velocidad: typeof a.velocidad === "string" ? a.velocidad : `${a.velocidad?.caminar || 0} pies`,
        esInvocacion: a.esInvocacion,
        nivelConjuroInvocacion: a.nivelConjuroInvocacion,
        subtipoInvocacion: a.subtipoInvocacion,
      };
    }),
  };
}
