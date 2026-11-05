/**
 * fabricaCriaturasIniciativa.ts
 * -----------------------------
 * Factorías y transformaciones de criaturas para la cola de iniciativa:
 * - Conversión de ficha de jugador a entrada de iniciativa.
 * - Alternancia de rol entre Monstruo y Jugador.
 * - Auto-lanzamiento de dados de iniciativa para PNJs/Monstruos.
 * - Integración de miniaturas seleccionadas desde TaleSpire.
 */

import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { MonstruoBase, PersonajeJugador } from "@/tipos";
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
import {
  calcularVidaInicial,
  resolverPersonajeAsociado,
  resolverPersonajePorCriatura,
  resolverPlantillaPorCriatura
} from "@/servicios/resolutorCriaturas";
import { crearIndiceMonstruos } from "@/servicios/indiceMonstruos";
import { formatearVelocidad } from "@/almacen/sanitizacion";
import type { CriaturaSeleccionadaTS } from "./tipos";

export function construirEntradaJugador(
  personaje: PersonajeJugador,
  indiceExistente: number,
  colaIniciativa: CriaturaIniciativa[]
): CriaturaIniciativa {
  const statsPj = calcularEstadisticasPersonaje(personaje);
  const idObjetivo = personaje.idMiniaturaTS || personaje.id;

  return {
    id: idObjetivo,
    nombre: personaje.nombre,
    avatarUrl: personaje.avatarUrl,
    iniciativa: indiceExistente >= 0 ? colaIniciativa[indiceExistente].iniciativa : 0,
    vidaMaxima: personaje.hpMaximo || 10,
    vidaActual: personaje.hpActual !== undefined ? personaje.hpActual : (personaje.hpMaximo || 10),
    vidaTemporal: personaje.hpTemporal || 0,
    ca: statsPj.claseArmadura.total,
    condiciones: personaje.condicionesActivas ? [...personaje.condicionesActivas] : [],
    efectos: personaje.efectosActivos ? [...personaje.efectosActivos] : [],
    bonificadorIniciativa: statsPj.modificadores.destreza,
    esMonstruo: false,
    velocidad: `${personaje.velocidad || "30 pies"}`,
    movimientoGastado: personaje.movimientoGastado || 0,
    movimientoMaximoTemporal: personaje.movimientoMaximoTemporal,
    idPersonajeDuenio: personaje.id,
    idPlantillaAsociada: undefined,
    pasivas: {
      percepcion: statsPj.pasivas?.percepcion ?? 10,
      investigacion: statsPj.pasivas?.investigacion ?? 10,
      perspicacia: statsPj.pasivas?.perspicacia ?? 10,
    }
  };
}

export function alternarRolCriaturaHelper(
  colaIniciativa: CriaturaIniciativa[],
  idCriatura: string,
  personajes: PersonajeJugador[],
  baseDatosMonstruos: MonstruoBase[],
  asociacionesFichas: Record<string, string>
): CriaturaIniciativa[] {
  return colaIniciativa.map((c) => {
    if (c.id !== idCriatura) return c;
    const nuevoEsMonstruo = !c.esMonstruo;

    if (!nuevoEsMonstruo) {
      const pj = resolverPersonajePorCriatura(c, personajes);
      if (pj) {
        const stats = calcularEstadisticasPersonaje(pj);
        return {
          ...c,
          esMonstruo: false,
          idPlantillaAsociada: undefined,
          idPersonajeDuenio: pj.id,
          avatarUrl: pj.avatarUrl,
          ca: stats.claseArmadura.total,
          bonificadorIniciativa: stats.modificadores.destreza,
          pasivas: {
            percepcion: stats.pasivas?.percepcion ?? 10,
            investigacion: stats.pasivas?.investigacion ?? 10,
            perspicacia: stats.pasivas?.perspicacia ?? 10,
          }
        };
      }
      return {
        ...c,
        esMonstruo: false,
        idPlantillaAsociada: undefined,
        pasivas: c.pasivas || { percepcion: 10, investigacion: 10, perspicacia: 10 }
      };
    }

    const indice = crearIndiceMonstruos(baseDatosMonstruos);
    const plantilla = resolverPlantillaPorCriatura(c.id, c.nombre, asociacionesFichas, indice);
    return {
      ...c,
      esMonstruo: true,
      idPlantillaAsociada: plantilla ? plantilla.id : undefined,
      ca: plantilla ? plantilla.ca : c.ca,
      bonificadorIniciativa: plantilla ? plantilla.iniciativaBonificador : c.bonificadorIniciativa,
      pasivas: undefined
    };
  });
}

export function autoLanzarIniciativaMonstruosHelper(
  colaIniciativa: CriaturaIniciativa[],
  personajes: PersonajeJugador[],
  baseDatosMonstruos: MonstruoBase[],
  asociacionesFichas: Record<string, string>
): CriaturaIniciativa[] {
  const indiceMonstruos = crearIndiceMonstruos(baseDatosMonstruos);
  return colaIniciativa.map((c) => {
    // Discriminación estricta: el auto roll NUNCA se aplica a jugadores
    const pj = resolverPersonajeAsociado(c.id, c.nombre, personajes, c.idPersonajeDuenio);
    const esJugador =
      !c.esMonstruo ||
      Boolean(pj) ||
      c.id.startsWith("c_jugador") ||
      c.id.startsWith("pj-") ||
      c.id.startsWith("pj_");

    if (!esJugador && c.esMonstruo) {
      let bonoInic = c.bonificadorIniciativa || 0;
      if (bonoInic === 0) {
        const plantilla = resolverPlantillaPorCriatura(c.id, c.nombre, asociacionesFichas, indiceMonstruos);
        if (plantilla && plantilla.iniciativaBonificador !== undefined) {
          bonoInic = plantilla.iniciativaBonificador;
        }
      }
      const tirada = Math.floor(Math.random() * 20) + 1;
      const total = tirada + bonoInic;
      return { ...c, iniciativa: total, bonificadorIniciativa: bonoInic, esMonstruo: true };
    }

    // Si es jugador pero estaba marcado erróneamente con esMonstruo, normalizar la bandera sin alterar iniciativa
    if (esJugador && c.esMonstruo) {
      return {
        ...c,
        esMonstruo: false,
        idPlantillaAsociada: undefined,
        idPersonajeDuenio: pj?.id || c.idPersonajeDuenio
      };
    }

    return c;
  });
}

export function construirCriaturasDesdeSeleccionTS(
  criaturasSeleccionadas: CriaturaSeleccionadaTS[],
  colaIniciativa: CriaturaIniciativa[],
  personajes: PersonajeJugador[],
  baseDatosMonstruos: MonstruoBase[],
  asociacionesFichas: Record<string, string>,
  metodoVidaMonstruo: "estandar" | "maximo" | "azar" | string
): CriaturaIniciativa[] {
  if (!criaturasSeleccionadas || criaturasSeleccionadas.length === 0) return [];

  const nuevasCriaturas: CriaturaIniciativa[] = [];
  const indiceMonstruos = crearIndiceMonstruos(baseDatosMonstruos);
  const idsEnCola = new Set(colaIniciativa.map((c) => c.id));

  criaturasSeleccionadas.forEach((cTS) => {
    if (idsEnCola.has(cTS.id)) return;

    // Comprobar si esta miniatura corresponde a un Personaje Jugador local
    const pjAsociado = resolverPersonajeAsociado(cTS.id, cTS.name, personajes);

    if (pjAsociado) {
      const statsPj = calcularEstadisticasPersonaje(pjAsociado);
      // Para jugadores: NUNCA se aplica auto-roll de iniciativa
      nuevasCriaturas.push({
        id: cTS.id,
        nombre: pjAsociado.nombre,
        avatarUrl: pjAsociado.avatarUrl,
        iniciativa: 0,
        vidaMaxima: pjAsociado.hpMaximo || 10,
        vidaActual: pjAsociado.hpActual !== undefined ? pjAsociado.hpActual : (pjAsociado.hpMaximo || 10),
        ca: statsPj.claseArmadura.total,
        condiciones: pjAsociado.condicionesActivas ? [...pjAsociado.condicionesActivas] : [],
        efectos: pjAsociado.efectosActivos ? [...pjAsociado.efectosActivos] : [],
        bonificadorIniciativa: statsPj.modificadores.destreza,
        esMonstruo: false,
        velocidad: `${pjAsociado.velocidad || "30 pies"}`,
        vidaTemporal: pjAsociado.hpTemporal || 0,
        idPersonajeDuenio: pjAsociado.id,
        idPlantillaAsociada: undefined,
        pasivas: {
          percepcion: statsPj.pasivas?.percepcion ?? 10,
          investigacion: statsPj.pasivas?.investigacion ?? 10,
          perspicacia: statsPj.pasivas?.perspicacia ?? 10,
        }
      });
      return;
    }

    // Si TaleSpire reportó ownerIds para esta miniatura, es de un jugador aunque aún no tenga hoja local
    if (cTS.esDeJugador) {
      nuevasCriaturas.push({
        id: cTS.id,
        nombre: cTS.name,
        iniciativa: 0,
        vidaMaxima: cTS.maxHp || 10,
        vidaActual: cTS.hp !== undefined ? cTS.hp : (cTS.maxHp || 10),
        ca: 10,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 0,
        esMonstruo: false,
        velocidad: "30 pies",
        vidaTemporal: 0,
        idPlantillaAsociada: undefined,
        pasivas: {
          percepcion: 10,
          investigacion: 10,
          perspicacia: 10,
        }
      });
      return;
    }

    // Si no es jugador, es un monstruo: calcular estadísticas y aplicar auto roll
    const plantillaMonstruo = resolverPlantillaPorCriatura(
      cTS.id,
      cTS.name,
      asociacionesFichas,
      indiceMonstruos
    );

    const { vidaMaxima: vidaMaxCalculada, vidaActual: vidaActCalculada } = calcularVidaInicial(
      plantillaMonstruo,
      metodoVidaMonstruo
    );

    const tiradaInic = Math.floor(Math.random() * 20) + 1;
    const totalInic = tiradaInic + (plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0);

    nuevasCriaturas.push({
      id: cTS.id,
      nombre: cTS.name,
      iniciativa: totalInic,
      vidaMaxima: vidaMaxCalculada,
      vidaActual: vidaActCalculada,
      ca: plantillaMonstruo ? plantillaMonstruo.ca : 10,
      condiciones: [],
      bonificadorIniciativa: plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0,
      esMonstruo: true,
      velocidad: plantillaMonstruo ? formatearVelocidad(plantillaMonstruo.velocidad) : "30 pies",
      vidaTemporal: 0,
      idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
    });
  });

  return nuevasCriaturas;
}
