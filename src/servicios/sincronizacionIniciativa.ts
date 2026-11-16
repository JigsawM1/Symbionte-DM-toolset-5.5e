/**
 * sincronizacionIniciativa.ts
 * ----------------------------
 * Servicio centralizado para la sincronización de la iniciativa local con TaleSpire
 * y el filtrado por expiración de ronda de efectos temporales de criaturas.
 */

import type { ColaIniciativaTS } from "@/tipos/talespire";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, AcompanantePersonaje, PlantillaInvocacion } from "@/tipos";
import { formatearVelocidad } from "@/almacen/sanitizacion";
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
import {
  resolverPlantillaPorCriatura,
  calcularVidaInicial,
} from "./resolutorCriaturas";
import {
  obtenerPlantillaInvocacionPorId,
  proyectarInvocacionAMonstruo,
  extraerContextoLanzador
} from "./factoriaInvocaciones";
import type { IndiceMonstruos } from "./indiceMonstruos";
import { seguirIniciativaFisica, type ReferenciaIniciativaFisica } from "./seguimientoIniciativaFisica";

export interface ResultadoSincronizacion {
  referenciaIniciativaFisica: ReferenciaIniciativaFisica | null;
  colaIniciativa: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  rondaActual: number;
}

export interface OpcionesSincronizacion {
  referenciaIniciativaFisica?: ReferenciaIniciativaFisica | null;
  colaTS: ColaIniciativaTS;
  colaLocal: CriaturaIniciativa[];
  asociacionesFichas: Record<string, string>;
  indiceMonstruos: IndiceMonstruos;
  metodoVidaMonstruo: string;
  indiceTurnoActivo: number;
  rondaActual: number;
  personajes?: PersonajeJugador[];
  baseDatosInvocaciones?: PlantillaInvocacion[];
  idsMiniaturasJugadores?: Set<string> | string[];
}

function construirCriaturaDesdePJ(idMini: string, pjAsociado: PersonajeJugador): CriaturaIniciativa {
  const statsPj = calcularEstadisticasPersonaje(pjAsociado);
  let condicionesPj = pjAsociado.condicionesActivas?.length
    ? [...pjAsociado.condicionesActivas]
    : [];
  let efectosPj = pjAsociado.efectosActivos?.length
    ? [...pjAsociado.efectosActivos]
    : [];

  if (pjAsociado.concentracionActiva) {
    const nombreHechizo = pjAsociado.concentracionActiva.nombreHechizo;
    condicionesPj = condicionesPj.filter((c) => !c.toLowerCase().includes("concentra"));
    const yaTieneEfecto = efectosPj.some(
      (e) => e.concentracion || e.id === "ef_concentracion" || e.id.includes("concentra")
    );
    if (!yaTieneEfecto) {
      efectosPj.push({
        id: "ef_concentracion",
        nombre: `Concentración: ${nombreHechizo}`,
        concentracion: true
      });
    }
  } else {
    condicionesPj = condicionesPj.filter((c) => !c.toLowerCase().includes("concentra"));
    efectosPj = efectosPj.filter(
      (e) => !e.concentracion && e.id !== "ef_concentracion" && !e.id.includes("concentra")
    );
  }

  return {
    id: idMini,
    nombre: pjAsociado.nombre,
    avatarUrl: pjAsociado.avatarUrl,
    iniciativa: 0,
    vidaMaxima: pjAsociado.hpMaximo || 10,
    vidaActual: pjAsociado.hpActual !== undefined ? pjAsociado.hpActual : (pjAsociado.hpMaximo || 10),
    vidaTemporal: pjAsociado.hpTemporal || 0,
    ca: statsPj.claseArmadura.total,
    condiciones: condicionesPj,
    efectos: efectosPj,
    bonificadorIniciativa: statsPj.modificadores.destreza,
    esMonstruo: false,
    velocidad: `${pjAsociado.velocidad || "30 pies"}`,
    movimientoGastado: pjAsociado.movimientoGastado || 0,
    movimientoMaximoTemporal: pjAsociado.movimientoMaximoTemporal,
    idPersonajeDuenio: pjAsociado.id,
    pasivas: {
      percepcion: statsPj.pasivas?.percepcion ?? 10,
      investigacion: statsPj.pasivas?.investigacion ?? 10,
      perspicacia: statsPj.pasivas?.perspicacia ?? 10,
    },
  };
}

function construirCriaturaDesdeAcompanante(
  idMini: string,
  acompAsociado: AcompanantePersonaje,
  pjDuenioAcomp: PersonajeJugador,
  indiceMonstruos: IndiceMonstruos,
  baseDatosInvocaciones?: PlantillaInvocacion[]
): CriaturaIniciativa {
  const plantillaInvocacion = obtenerPlantillaInvocacionPorId(acompAsociado.idPlantilla, baseDatosInvocaciones);
  const plantillaProyectada = plantillaInvocacion
    ? proyectarInvocacionAMonstruo(
        plantillaInvocacion,
        acompAsociado.nivelConjuroInvocacion ?? plantillaInvocacion.nivelMinimo,
        extraerContextoLanzador(pjDuenioAcomp),
        acompAsociado.subtipoInvocacion
      )
    : indiceMonstruos.porId.get(acompAsociado.idPlantilla);

  const vidaMaxFinal = acompAsociado.vidaMaxima || plantillaProyectada?.vidaMaxima || 10;
  const vidaActFinal = acompAsociado.vidaActual !== undefined ? acompAsociado.vidaActual : vidaMaxFinal;

  return {
    id: idMini,
    nombre: acompAsociado.nombre,
    iniciativa: 0,
    vidaMaxima: vidaMaxFinal,
    vidaActual: vidaActFinal,
    vidaTemporal: acompAsociado.vidaTemporal || 0,
    ca: acompAsociado.ca || plantillaProyectada?.ca || 10,
    condiciones: acompAsociado.condiciones?.length ? [...acompAsociado.condiciones] : [],
    efectos: acompAsociado.efectos?.length ? [...acompAsociado.efectos] : [],
    bonificadorIniciativa: plantillaProyectada?.iniciativaBonificador ?? 0,
    esMonstruo: false,
    velocidad: formatearVelocidad(acompAsociado.velocidad || plantillaProyectada?.velocidad || "30 pies"),
    movimientoGastado: acompAsociado.movimientoGastado || 0,
    movimientoMaximoTemporal: acompAsociado.movimientoMaximoTemporal,
    idPlantillaAsociada: acompAsociado.idPlantilla,
    idPersonajeDuenio: pjDuenioAcomp.id,
    idAcompanante: acompAsociado.id,
    esAcompanante: true
  };
}

function buscarAcompananteParaMiniatura(
  idMini: string,
  personajes: PersonajeJugador[]
): { acomp: AcompanantePersonaje; duenio: PersonajeJugador } | null {
  const idLower = idMini.toLowerCase();
  for (const pj of personajes) {
    if (!pj.acompanantes || pj.acompanantes.length === 0) continue;
    for (const acomp of pj.acompanantes) {
      if (
        acomp.id.toLowerCase() === idLower ||
        acomp.idMiniaturaTS?.toLowerCase() === idLower
      ) {
        return { acomp, duenio: pj };
      }
    }
  }
  return null;
}

/**
 * Filtra los efectos expirados de una criatura o de toda una cola según la nueva ronda actual.
 */
export function filtrarEfectosExpirados(
  cola: CriaturaIniciativa[],
  nuevaRonda: number
): CriaturaIniciativa[] {
  return cola.map((c) => {
    if (!c.efectos || c.efectos.length === 0) return c;
    const efectosActualizados = c.efectos.filter((ef) => {
      if (ef.duracion !== undefined && ef.expiraRonda === undefined) return false;
      if (ef.expiraRonda !== undefined && nuevaRonda >= ef.expiraRonda) return false;
      return true;
    });
    return { ...c, efectos: efectosActualizados };
  });
}

/**
 * Sincroniza la cola de iniciativa física nativa de TaleSpire con la cola DM local,
 * importando participantes y orden. Los valores, el turno y la ronda pertenecen a ToolSet.
 */
export function sincronizarConEstadoLocal(opciones: OpcionesSincronizacion): ResultadoSincronizacion {
  const {
    colaTS,
    colaLocal,
    asociacionesFichas,
    indiceMonstruos,
    metodoVidaMonstruo,
    indiceTurnoActivo,
    rondaActual,
    personajes = [],
    baseDatosInvocaciones,
    idsMiniaturasJugadores
  } = opciones;

  const setMinisJugadores = idsMiniaturasJugadores instanceof Set
    ? idsMiniaturasJugadores
    : new Set(idsMiniaturasJugadores || []);

  const colaTSItems = colaTS.items || [];
  const criaturasLocales = colaLocal.filter((c) => c.id.startsWith("c_local_"));
  const mapaLocal = new Map(colaLocal.map((c) => [c.id, c]));

  const nuevasCriaturasNativas = colaTSItems.map((cTS): CriaturaIniciativa => {
    const existente = mapaLocal.get(cTS.id);
    if (existente) {
      return existente;
    }

    const idLower = cTS.id.toLowerCase();
    const pjAsociado = personajes.find(
      (p) => p.id.toLowerCase() === idLower || p.idMiniaturaTS?.toLowerCase() === idLower
    );
    if (pjAsociado) {
      return construirCriaturaDesdePJ(cTS.id, pjAsociado);
    }

    const acompEncontrado = buscarAcompananteParaMiniatura(cTS.id, personajes);
    if (acompEncontrado) {
      return construirCriaturaDesdeAcompanante(
        cTS.id,
        acompEncontrado.acomp,
        acompEncontrado.duenio,
        indiceMonstruos,
        baseDatosInvocaciones
      );
    }

    const miniaturaDeJugadorNativa = setMinisJugadores.has(cTS.id) || (Boolean(cTS.id) && setMinisJugadores.has(idLower));
    const esIdJugadorSintetico = cTS.id.startsWith("c_jugador") || cTS.id.startsWith("pj-") || cTS.id.startsWith("pj_");

    if (miniaturaDeJugadorNativa || esIdJugadorSintetico) {
      return {
        id: cTS.id,
        nombre: cTS.name,
        iniciativa: 0,
        vidaMaxima: 10,
        vidaActual: 10,
        ca: 10,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 0,
        esMonstruo: false,
        velocidad: "30 pies",
        vidaTemporal: 0,
        idPlantillaAsociada: undefined,
        pasivas: { percepcion: 10, investigacion: 10, perspicacia: 10 }
      };
    }

    const plantillaMonstruo = resolverPlantillaPorCriatura(
      cTS.id,
      cTS.name,
      asociacionesFichas,
      indiceMonstruos
    );
    const { vidaMaxima, vidaActual } = calcularVidaInicial(plantillaMonstruo, metodoVidaMonstruo);

    return {
      id: cTS.id,
      nombre: cTS.name,
      iniciativa: 0,
      vidaMaxima,
      vidaActual,
      ca: plantillaMonstruo ? plantillaMonstruo.ca : 10,
      condiciones: [],
      efectos: [],
      bonificadorIniciativa: plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0,
      esMonstruo: true,
      velocidad: plantillaMonstruo ? formatearVelocidad(plantillaMonstruo.velocidad) : "30 pies",
      vidaTemporal: 0,
      idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
    };
  });

  const colaCombinada = [...nuevasCriaturasNativas, ...criaturasLocales];
  const ids = new Set(colaCombinada.map((c) => c.id));
  const activa = colaLocal[indiceTurnoActivo]?.id;
  const siguiente = [...colaLocal.slice(indiceTurnoActivo + 1), ...colaLocal.slice(0, indiceTurnoActivo)]
    .find((c) => ids.has(c.id))?.id;
  const seguimiento = seguirIniciativaFisica(colaTS, opciones.referenciaIniciativaFisica ?? null, activa ?? null, rondaActual, ids);
  const idActivo = seguimiento.activo && ids.has(seguimiento.activo) ? seguimiento.activo : siguiente;
  const nuevoIndice = Math.max(0, colaCombinada.findIndex((c) => c.id === idActivo));
  const nuevaRonda = seguimiento.ronda;

  return {
    colaIniciativa: nuevaRonda > rondaActual ? filtrarEfectosExpirados(colaCombinada, nuevaRonda) : colaCombinada,
    referenciaIniciativaFisica: seguimiento.referencia,
    indiceTurnoActivo: nuevoIndice,
    rondaActual: nuevaRonda
  };
}
