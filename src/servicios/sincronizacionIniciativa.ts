/**
 * sincronizacionIniciativa.ts
 * ----------------------------
 * Servicio centralizado para la sincronización de la iniciativa local con TaleSpire
 * y el filtrado por expiración de ronda de efectos temporales de criaturas.
 *
 */

import type { ColaIniciativaTS } from "@/tipos/talespire";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, AcompanantePersonaje } from "@/tipos";
import { formatearVelocidad } from "@/almacen/sanitizacion";
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
import {
  resolverPlantillaPorCriatura,
  calcularVidaInicial,
} from "./resolutorCriaturas";
import {
  esIdInvocacionEscalable,
  obtenerPlantillaInvocacionPorId,
  proyectarInvocacionAMonstruo,
  extraerContextoLanzador
} from "./factoriaInvocaciones";
import type { MonstruoBase } from "@/almacen/usarAlmacenDM";
import type { IndiceMonstruos } from "./indiceMonstruos";
import { seguirIniciativaFisica, type ReferenciaIniciativaFisica } from './seguimientoIniciativaFisica';

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
  idsMiniaturasJugadores?: Set<string> | string[];
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
      // Expirar si tiene duración antigua sin expiraRonda
      if (ef.duracion !== undefined && ef.expiraRonda === undefined) return false;
      // Expirar si alcanzamos o superamos la ronda límite de expiración
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
    idsMiniaturasJugadores
  } = opciones;

  const setMinisJugadores = idsMiniaturasJugadores instanceof Set
    ? idsMiniaturasJugadores
    : new Set(idsMiniaturasJugadores || []);

  const colaTSItems = colaTS.items || [];
  
  // 1. Filtrar criaturas puramente locales (O(M))
  const criaturasLocales = colaLocal.filter((c) => c.id.startsWith("c_local_"));

  // 2. OPTIMIZACIÓN: Indexar toda la colaLocal en un Map para búsquedas instantáneas
  const mapaLocal = new Map(colaLocal.map(c => [c.id, c]));

  // 3. Procesar ítems de TaleSpire (O(N) gracias al Map)
  const nuevasCriaturasNativas = colaTSItems.map((cTS) => {
    // Reemplaza el .find() lento por una lectura directa
    const existente = mapaLocal.get(cTS.id);
    
    // Simplificado usando Nullish Coalescing (??)
    const iniciativaFisica = existente?.iniciativa ?? 0;


    // Comprobar si esta miniatura corresponde a un Personaje Jugador conocido
    const pjAsociado = personajes.find(p => p.id.toLowerCase() === cTS.id.toLowerCase()
      || p.idMiniaturaTS?.toLowerCase() === cTS.id.toLowerCase()
      || (!!existente?.idPersonajeDuenio && !existente.esAcompanante && p.id === existente.idPersonajeDuenio));

    if (pjAsociado) {
      const statsPj = calcularEstadisticasPersonaje(pjAsociado);

      let condicionesPj = pjAsociado.condicionesActivas?.length
        ? [...pjAsociado.condicionesActivas]
        : existente
        ? [...existente.condiciones]
        : [];

      let efectosPj = pjAsociado.efectosActivos?.length
        ? [...pjAsociado.efectosActivos]
        : existente?.efectos
        ? [...existente.efectos]
        : [];

      if (pjAsociado.concentracionActiva) {
        const nombreHechizo = pjAsociado.concentracionActiva.nombreHechizo;
        // Limpiar de condiciones para no duplicar con el efecto
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
        id: cTS.id,
        nombre: pjAsociado.nombre,
        avatarUrl: pjAsociado.avatarUrl,
        iniciativa: iniciativaFisica,
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
      } as CriaturaIniciativa;
    }

    // 2. Comprobar si esta miniatura corresponde a un Acompañante de algún Personaje Jugador
    let acompAsociado: AcompanantePersonaje | undefined = undefined;
    let pjDuenioAcomp: PersonajeJugador | undefined = undefined;

    for (const pj of personajes) {
      if (!pj.acompanantes || pj.acompanantes.length === 0) continue;
      for (const acomp of pj.acompanantes) {
        if (
          acomp.id.toLowerCase() === cTS.id.toLowerCase() ||
          acomp.idMiniaturaTS?.toLowerCase() === cTS.id.toLowerCase()
        ) {
          acompAsociado = acomp;
          pjDuenioAcomp = pj;
          break;
        }
      }
      if (acompAsociado) break;
    }

    if (acompAsociado && pjDuenioAcomp) {
      let plantillaProyectada: MonstruoBase | undefined = undefined;

      if (acompAsociado.idPlantilla && esIdInvocacionEscalable(acompAsociado.idPlantilla)) {
        const plantillaInvocacion = obtenerPlantillaInvocacionPorId(acompAsociado.idPlantilla);
        if (plantillaInvocacion) {
          const contextoLanzador = extraerContextoLanzador(pjDuenioAcomp);
          plantillaProyectada = proyectarInvocacionAMonstruo(
            plantillaInvocacion,
            acompAsociado.nivelConjuroInvocacion || 2,
            contextoLanzador,
            acompAsociado.subtipoInvocacion
          );
        }
      } else if (acompAsociado.idPlantilla) {
        plantillaProyectada = indiceMonstruos.porId.get(acompAsociado.idPlantilla);
      }

      const bonificadorIniciativa = plantillaProyectada?.iniciativaBonificador ?? 0;
      const caFinal = acompAsociado.ca || plantillaProyectada?.ca || 10;
      const vidaMaxFinal = acompAsociado.vidaMaxima || plantillaProyectada?.vidaMaxima || 10;
      const vidaActFinal = acompAsociado.vidaActual !== undefined ? acompAsociado.vidaActual : vidaMaxFinal;

      const condicionesAcomp = acompAsociado.condiciones?.length
        ? [...acompAsociado.condiciones]
        : existente
        ? [...existente.condiciones]
        : [];

      const efectosAcomp = acompAsociado.efectos?.length
        ? [...acompAsociado.efectos]
        : existente?.efectos
        ? [...existente.efectos]
        : [];

      return {
        id: cTS.id,
        nombre: acompAsociado.nombre,
        iniciativa: iniciativaFisica,
        vidaMaxima: vidaMaxFinal,
        vidaActual: vidaActFinal,
        vidaTemporal: acompAsociado.vidaTemporal || 0,
        ca: caFinal,
        condiciones: condicionesAcomp,
        efectos: efectosAcomp,
        bonificadorIniciativa,
        esMonstruo: false,
        velocidad: formatearVelocidad(acompAsociado.velocidad || plantillaProyectada?.velocidad || "30 pies"),
        movimientoGastado: acompAsociado.movimientoGastado || 0,
        movimientoMaximoTemporal: acompAsociado.movimientoMaximoTemporal,
        idPlantillaAsociada: acompAsociado.idPlantilla,
        idPersonajeDuenio: pjDuenioAcomp.id,
        idAcompanante: acompAsociado.id,
        esAcompanante: true
      } as CriaturaIniciativa;
    }

    // 3. Comprobar si es una miniatura de jugador según TaleSpire o el estado local
    const miniaturaDeJugadorNativa = setMinisJugadores.has(cTS.id) || (Boolean(cTS.id) && setMinisJugadores.has(cTS.id.toLowerCase()));
    const esIdJugadorSintetico = cTS.id.startsWith("c_jugador") || cTS.id.startsWith("pj-") || cTS.id.startsWith("pj_");
    const esJugadorLocalPrevio = Boolean(existente && (!existente.esMonstruo || existente.idPersonajeDuenio));

    if (miniaturaDeJugadorNativa || esIdJugadorSintetico || esJugadorLocalPrevio) {
      if (existente) {
        return {
          ...existente,
          iniciativa: iniciativaFisica,
          esMonstruo: false,
          idPlantillaAsociada: undefined
        };
      }

      return {
        id: cTS.id,
        nombre: cTS.name,
        iniciativa: iniciativaFisica,
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
        pasivas: {
          percepcion: 10,
          investigacion: 10,
          perspicacia: 10
        }
      } as CriaturaIniciativa;
    }

    // 4. Si definitivamente no es jugador ni acompañante, es un Monstruo
    const plantillaMonstruo = resolverPlantillaPorCriatura(
      cTS.id,
      cTS.name,
      asociacionesFichas,
      indiceMonstruos
    );

    if (existente) {
      return {
        ...existente,
        iniciativa: iniciativaFisica,
        idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined,
        ca: plantillaMonstruo ? plantillaMonstruo.ca : existente.ca,
        velocidad: plantillaMonstruo ? formatearVelocidad(plantillaMonstruo.velocidad) : existente.velocidad,
        bonificadorIniciativa: plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : existente.bonificadorIniciativa
      };
    }

    // Criatura nueva que viene de TaleSpire
    const { vidaMaxima: vidaMaxCalculada, vidaActual: vidaActCalculada } = calcularVidaInicial(
      plantillaMonstruo,
      metodoVidaMonstruo
    );

    return {
      id: cTS.id,
      nombre: cTS.name,
      iniciativa: iniciativaFisica,
      vidaMaxima: vidaMaxCalculada,
      vidaActual: vidaActCalculada,
      ca: plantillaMonstruo ? plantillaMonstruo.ca : 10,
      condiciones: [],
      efectos: [],
      bonificadorIniciativa: plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0,
      esMonstruo: true,
      velocidad: plantillaMonstruo ? formatearVelocidad(plantillaMonstruo.velocidad) : "30 pies",
      vidaTemporal: 0,
      idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
    } as CriaturaIniciativa;
  }).map(c => mapaLocal.get(c.id) ?? c);

  // Combinar preservando a TaleSpire como Fuente Única de la Verdad (SSOT) para el orden de turnos.
  // NO se auto-ordena por valor numérico: las miniaturas nativas conservan su orden posicional exacto de TaleSpire.
  const colaCombinada = [...nuevasCriaturasNativas, ...criaturasLocales];

  const ids = new Set(colaCombinada.map(c => c.id));
  const activa = colaLocal[indiceTurnoActivo]?.id;
  const siguiente = [...colaLocal.slice(indiceTurnoActivo + 1), ...colaLocal.slice(0, indiceTurnoActivo)]
    .find(c => ids.has(c.id))?.id;
  const seguimiento = seguirIniciativaFisica(colaTS, opciones.referenciaIniciativaFisica ?? null, activa ?? null, rondaActual, ids);
  const idActivo = seguimiento.activo && ids.has(seguimiento.activo) ? seguimiento.activo : siguiente;
  const nuevoIndice = Math.max(0, colaCombinada.findIndex(c => c.id === idActivo));
  const nuevaRonda = seguimiento.ronda;

  return {
    colaIniciativa: nuevaRonda > rondaActual ? filtrarEfectosExpirados(colaCombinada, nuevaRonda) : colaCombinada,
    referenciaIniciativaFisica: seguimiento.referencia,
    indiceTurnoActivo: nuevoIndice,
    rondaActual: nuevaRonda
  };
}
