/**
 * sincronizacionIniciativa.ts
 * ----------------------------
 * Servicio centralizado para la sincronización de la iniciativa local con TaleSpire
 * y el filtrado por expiración de ronda de efectos temporales de criaturas.
 *
 * Programado 100% en español.
 */

import type { ColaIniciativaTS } from "../tipos/talespire";
import type { CriaturaIniciativa } from "../almacen/usarAlmacenDM";
import { formatearVelocidad } from "../almacen/sanitizacion";
import { resolverPlantillaPorCriatura, calcularVidaInicial } from "./resolutorCriaturas";
import type { IndiceMonstruos } from "./indiceMonstruos";

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
    rondaActual
  } = opciones;

  const colaTSItems = colaTS.items || [];
  
  // 1. Filtrar criaturas puramente locales (O(M))
  const criaturasLocales = colaLocal.filter((c) => c.id.startsWith("c_local_"));

  // 2. OPTIMIZACIÓN: Indexar toda la colaLocal en un Map para búsquedas instantáneas
  const mapaLocal = new Map(colaLocal.map(c => [c.id, c]));

  // 3. Procesar ítems de TaleSpire (O(N) gracias al Map)
  const nuevasCriaturasNativas = colaTSItems.map((cTS, index) => {
    // Reemplaza el .find() lento por una lectura directa
    const existente = mapaLocal.get(cTS.id);
    const cTSAny = cTS as any;
    
    // Simplificado usando Nullish Coalescing (??)
    const iniciativaFisica = cTSAny.initiative ?? (existente ? existente.iniciativa : (colaTSItems.length - index));

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
      cTSAny.maxHp,
      cTSAny.hp
    );

    return {
      id: cTS.id,
      nombre: cTS.name,
      iniciativa: iniciativaFisica,
      vidaMaxima: vidaMaxCalculada,
      vidaActual: vidaActCalculada,
      ca: plantillaMonstruo ? plantillaMonstruo.ca : 10,
      condiciones: [],
      bonificadorIniciativa: plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0,
      esMonstruo: !cTS.id.startsWith("c_jugador"),
      velocidad: plantillaMonstruo ? formatearVelocidad(plantillaMonstruo.velocidad) : "30 pies",
      vidaTemporal: 0,
      idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
    } as CriaturaIniciativa;
  });

  // Combinar y ordenar
  let colaCombinada = [...criaturasLocales, ...nuevasCriaturasNativas];
  colaCombinada.sort((a, b) => b.iniciativa - a.iniciativa);

  let nuevoIndice = indiceTurnoActivo;
  let nuevaRonda = rondaActual;

  const nativeActiveIndex = colaTS.activeItemIndex;
  console.log("[TaleSpire Sincronismo] Leyendo turno activo nativo:", nativeActiveIndex, "de la cola:", colaTSItems);

  if (typeof nativeActiveIndex === "number") {
    const criaturaActivaTS = colaTSItems[nativeActiveIndex];
    if (criaturaActivaTS) {
      const activeTurnId = criaturaActivaTS.id;
      
      // OPTIMIZACIÓN: Buscamos el índice en la cola ya ordenada
      let indiceEncontrado = colaCombinada.findIndex((c) => c.id === activeTurnId);
      if (indiceEncontrado === -1) {
        const nombreBuscado = criaturaActivaTS.name.toLowerCase().trim();
        indiceEncontrado = colaCombinada.findIndex(
          (c) => c.nombre.toLowerCase().trim() === nombreBuscado
        );
      }

      if (indiceEncontrado !== -1) {
        console.log("[TaleSpire Sincronismo] Encontrado índice de turno activo en la cola combinada local:", indiceEncontrado);
        nuevoIndice = indiceEncontrado;
      }
    }
  }

  // 4. DETECCIÓN DE BUG DE RONDA: 
  // Antes comparabas colaLocal.length para ver el "ultimoIndice". 
  // Sin embargo, la lista activa ahora es 'colaCombinada'. Debes usar su longitud.
  if (colaCombinada.length > 1) {
    const ultimoIndice = colaCombinada.length - 1;
    if (indiceTurnoActivo === ultimoIndice && nuevoIndice === 0) {
      nuevaRonda = rondaActual + 1;
    } else if (indiceTurnoActivo === 0 && nuevoIndice === ultimoIndice) {
      nuevaRonda = Math.max(1, rondaActual - 1);
    }
  }

  // Sincronizar ronda si TaleSpire la envía de forma explícita
  const colaTSAny = colaTS as any;
  if (colaTSAny && colaTSAny.round !== undefined && typeof colaTSAny.round === "number" && colaTSAny.round > 0) {
    nuevaRonda = colaTSAny.round;
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
