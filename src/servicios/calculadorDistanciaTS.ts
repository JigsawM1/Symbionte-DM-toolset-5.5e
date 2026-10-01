/**
 * calculadorDistanciaTS.ts
 * ------------------------
 * Servicio puro para calcular distancias de movimiento en TaleSpire,
 * conversión entre coordenadas 3D de Unity y unidades de medida (pies / casillas)
 * según las reglas de D&D 5.5e y la API v0.1 de TaleSpire.
 */

import type { PosicionTS } from "@/tipos/personaje";

export interface OpcionesCalculoDistancia {
  /** Unidades (pies) por casilla/tile. Por defecto 5 (D&D 5e estándar). */
  numberPerTile?: number;
  /** Si es true, incluye el eje vertical Y en el cálculo euclidiano (para vuelo/escalada). */
  incluirAltura?: boolean;
  /** Umbral en pies por debajo del cual se descarta el movimiento como jitter o micro-rotación. Por defecto 1.0 pie. */
  umbralRuidoPies?: number;
  /** Si es true, redondea el desplazamiento al múltiplo de 5 pies más cercano (regla estándar de cuadrícula D&D). */
  redondearA5Pies?: boolean;
}

export interface ResultadoCalculoDistancia {
  /** Distancia final consumible en pies (0 si es ruido o cambio de mapa). */
  distanciaPies: number;
  /** Distancia euclidiana exacta en pies antes de redondeos. */
  distanciaBruta: number;
  /** Distancia euclidiana en casillas (tiles) de TaleSpire. */
  distanciaCasillas: number;
  /** Indica si se detectó un cambio de subtablero (locId) o tablero (boardId). */
  esCambioMapaOSubtablero: boolean;
}

/**
 * Calcula la distancia recorrida entre dos posiciones de TaleSpire.
 * Previene errores de cambio de origen en subtableros (locId) y filtra vibraciones/rotaciones.
 */
export function calcularDistanciaMovimientoTS(
  posAnterior: PosicionTS | null | undefined,
  posNueva: PosicionTS | null | undefined,
  boardIdAnterior?: string | null,
  boardIdNuevo?: string | null,
  opciones: OpcionesCalculoDistancia = {}
): ResultadoCalculoDistancia {
  const {
    numberPerTile = 5,
    incluirAltura = false,
    umbralRuidoPies = 1.0,
    redondearA5Pies = true
  } = opciones;

  if (!posAnterior || !posNueva) {
    return {
      distanciaPies: 0,
      distanciaBruta: 0,
      distanciaCasillas: 0,
      esCambioMapaOSubtablero: false
    };
  }

  // 1. Verificación de tableros y subtableros (locId) según Documentación API v0.1
  // Las posiciones en diferentes subtableros no pueden compararse directamente ya que su origen de coordenadas difiere.
  const mismoBoard = !boardIdAnterior || !boardIdNuevo || boardIdAnterior === boardIdNuevo;
  const mismoSubBoard = posAnterior.locId === posNueva.locId;

  if (!mismoBoard || !mismoSubBoard) {
    return {
      distanciaPies: 0,
      distanciaBruta: 0,
      distanciaCasillas: 0,
      esCambioMapaOSubtablero: true
    };
  }

  // 2. Cálculo euclidiano en casillas (1.0 unidad Unity en TaleSpire = 1 casilla)
  const deltaX = posNueva.x - posAnterior.x;
  const deltaZ = posNueva.z - posAnterior.z;
  const deltaY = incluirAltura ? posNueva.y - posAnterior.y : 0;

  const distanciaCasillas = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ + deltaY * deltaY);
  const distanciaBruta = distanciaCasillas * numberPerTile;

  // 3. Filtro de micro-movimiento o rotación estática
  if (distanciaBruta < umbralRuidoPies) {
    return {
      distanciaPies: 0,
      distanciaBruta,
      distanciaCasillas,
      esCambioMapaOSubtablero: false
    };
  }

  // 4. Redondeo opcional a múltiplo de 5 pies (D&D 5.5e tabletop)
  let distanciaPies = distanciaBruta;
  if (redondearA5Pies) {
    distanciaPies = Math.max(5, Math.round(distanciaBruta / 5) * 5);
  } else {
    // Redondear a 1 decimal para precisión limpia
    distanciaPies = Math.round(distanciaBruta * 10) / 10;
  }

  return {
    distanciaPies,
    distanciaBruta,
    distanciaCasillas,
    esCambioMapaOSubtablero: false
  };
}

export interface EstadoVelocidadDinámica {
  velocidadTotal: number;
  movimientoGastado: number;
  movimientoRestante: number;
  agotado: boolean;
  excedido: boolean;
  esCarreraActiva: boolean;
}

/**
 * Calcula el desglose dinámico de velocidad disponible y restante.
 */
export function calcularEstadoVelocidadDinamica(
  velocidadBase: number,
  bonoVelocidadRasgos: number = 0,
  movimientoGastado: number = 0,
  movimientoMaximoTemporal: number | null = null
): EstadoVelocidadDinámica {
  const velocidadEfectivaNormal = Math.max(0, velocidadBase + bonoVelocidadRasgos);
  const velocidadTotal = movimientoMaximoTemporal !== null ? movimientoMaximoTemporal : velocidadEfectivaNormal;
  const esCarreraActiva = movimientoMaximoTemporal !== null && movimientoMaximoTemporal > velocidadEfectivaNormal;
  const movimientoRestante = velocidadTotal - movimientoGastado;

  return {
    velocidadTotal,
    movimientoGastado,
    movimientoRestante: Math.max(0, movimientoRestante),
    agotado: movimientoRestante <= 0,
    excedido: movimientoRestante < 0,
    esCarreraActiva
  };
}
