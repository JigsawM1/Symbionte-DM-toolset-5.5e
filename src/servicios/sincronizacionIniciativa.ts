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
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  resolverPlantillaPorCriatura,
  calcularVidaInicial,
  resolverPersonajeAsociado,
  coincidenNombresTaleSpire
} from "./resolutorCriaturas";
import {
  esIdInvocacionEscalable,
  obtenerPlantillaInvocacionPorId,
  proyectarInvocacionAMonstruo,
  extraerContextoLanzador
} from "./factoriaInvocaciones";
import type { MonstruoBase } from "@/almacen/usarAlmacenDM";
import type { IndiceMonstruos } from "./indiceMonstruos";
import { logger } from "@/utiles/logger";

export interface ResultadoSincronizacion {
  colaIniciativa: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  rondaActual: number;
}

export interface OpcionesSincronizacion {
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
 * calculando turnos activos, incrementos de ronda y actualizando fichas asociadas.
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
    const cTSConPropiedades = cTS as typeof cTS & { initiative?: number; maxHp?: number; hp?: number };
    
    // Simplificado usando Nullish Coalescing (??)
    const iniciativaFisica = cTSConPropiedades.initiative ?? (existente ? existente.iniciativa : 0);

    // Comprobar si esta miniatura corresponde a un Personaje Jugador conocido
    const pjAsociado = resolverPersonajeAsociado(
      cTS.id,
      cTS.name,
      personajes,
      existente?.idPersonajeDuenio
    );

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
          (acomp.idMiniaturaTS && acomp.idMiniaturaTS === cTS.id) ||
          (cTS.name && coincidenNombresTaleSpire(acomp.nombre, cTS.name))
        ) {
          acompAsociado = acomp;
          pjDuenioAcomp = pj;
          break;
        }
      }
      if (acompAsociado) break;
    }

    if (acompAsociado && pjDuenioAcomp) {
      let bonificadorIniciativa = 0;
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
          bonificadorIniciativa = plantillaProyectada.iniciativaBonificador ?? 0;
        }
      } else if (acompAsociado.idPlantilla) {
        plantillaProyectada = indiceMonstruos.porId.get(acompAsociado.idPlantilla);
        if (plantillaProyectada) {
          bonificadorIniciativa = plantillaProyectada.iniciativaBonificador ?? 0;
        }
      }

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
        vidaMaxima: cTSConPropiedades.maxHp || 10,
        vidaActual: cTSConPropiedades.hp !== undefined ? cTSConPropiedades.hp : (cTSConPropiedades.maxHp || 10),
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
      metodoVidaMonstruo,
      cTSConPropiedades.maxHp,
      cTSConPropiedades.hp
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
  });

  // Combinar preservando a TaleSpire como Fuente Única de la Verdad (SSOT) para el orden de turnos.
  // NO se auto-ordena por valor numérico: las miniaturas nativas conservan su orden posicional exacto de TaleSpire.
  let colaCombinada = [...nuevasCriaturasNativas, ...criaturasLocales];

  let nuevoIndice = indiceTurnoActivo;
  let nuevaRonda = rondaActual;

  const nativeActiveIndex = colaTS.activeItemIndex;
  logger.debug("[TaleSpire Sincronismo] Leyendo turno activo nativo:", nativeActiveIndex, "de la cola:", colaTSItems);

  if (typeof nativeActiveIndex === "number" && nativeActiveIndex >= 0 && nativeActiveIndex < colaTSItems.length) {
    const criaturaActivaTS = colaTSItems[nativeActiveIndex];
    if (criaturaActivaTS) {
      const activeTurnId = criaturaActivaTS.id;
      
      // Buscamos el índice en la cola combinada preservada
      let indiceEncontrado = colaCombinada.findIndex((c) => c.id === activeTurnId);
      if (indiceEncontrado === -1) {
        const nombreBuscado = criaturaActivaTS.name.toLowerCase().trim();
        indiceEncontrado = colaCombinada.findIndex(
          (c) => c.nombre.toLowerCase().trim() === nombreBuscado
        );
      }

      if (indiceEncontrado !== -1) {
        logger.debug("[TaleSpire Sincronismo] Encontrado índice de turno activo en la cola combinada local:", indiceEncontrado);
        nuevoIndice = indiceEncontrado;
      }
    }
  }

  // Asegurar que el índice del turno no exceda los límites de la cola
  if (colaCombinada.length === 0) {
    nuevoIndice = 0;
  } else if (nuevoIndice >= colaCombinada.length) {
    nuevoIndice = Math.max(0, colaCombinada.length - 1);
  }

  // DETECCIÓN DE AVANCE / RETROCESO DE RONDA POR WRAP-AROUND:
  const totalItemsTaleSpire = colaTSItems.length;
  const longitudRelevante = totalItemsTaleSpire > 1 ? totalItemsTaleSpire : colaCombinada.length;
  if (longitudRelevante > 1) {
    const ultimoIndice = longitudRelevante - 1;
    if (indiceTurnoActivo === ultimoIndice && nuevoIndice === 0) {
      nuevaRonda = rondaActual + 1;
    } else if (indiceTurnoActivo === 0 && nuevoIndice === ultimoIndice) {
      nuevaRonda = Math.max(1, rondaActual - 1);
    }
  }

  // Sincronizar ronda si TaleSpire la envía de forma explícita
  const colaTSConRonda = colaTS as typeof colaTS & { round?: number };
  if (colaTSConRonda && typeof colaTSConRonda.round === "number" && colaTSConRonda.round > 0) {
    nuevaRonda = colaTSConRonda.round;
  }

  // Filtrar efectos temporales si la ronda avanzó
  if (nuevaRonda > rondaActual) {
    colaCombinada = filtrarEfectosExpirados(colaCombinada, nuevaRonda);
  }

  return {
    colaIniciativa: colaCombinada,
    indiceTurnoActivo: nuevoIndice,
    rondaActual: nuevaRonda
  };
}
