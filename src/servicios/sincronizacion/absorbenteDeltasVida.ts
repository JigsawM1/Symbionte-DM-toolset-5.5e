/**
 * @module absorbenteDeltasVida
 * Servicio puro para la absorción matemática de deltas relativos de vitalidad
 * (daño, curación y puntos de golpe temporales) sobre PJs y acompañantes,
 * incluyendo el cálculo automático de CD de salvación de Constitución por concentración.
 */

import type { TipoDeltaVida } from "@/tipos/protocoloSync";

// ==========================================
// 1. CONTRATOS DE ENTRADA Y SALIDA
// ==========================================

export interface EntradaVitalidad {
  hpActual: number;
  hpMaximo: number;
  hpTemporal: number;
  tieneConcentracion: boolean;
  nombreHechizoConcentrado?: string;
}

export interface ResultadoAbsorcionVitalidad {
  hpActual: number;
  hpTemporal: number;
  danoEfectivoRecibido: number;
  cdConcentracionRequerida: number | null;
  mensajeConcentracion: string | null;
}

// ==========================================
// 2. FUNCIONES PURAS DE DOMINIO
// ==========================================

/**
 * Calcula la Clase de Dificultad (CD) para mantener la concentración tras recibir daño
 * según las reglas de D&D 5.5e (PHB 2024): `max(10, floor(daño / 2))`, con tope de 30 en 2024.
 *
 * @param danoRecibido Cantidad total de daño sufrido (incluyendo el absorbido por PV temporales).
 * @returns La CD de la tirada de salvación de Constitución.
 */
export function calcularCDConcentracion(danoRecibido: number): number {
  const danoPositivo = Math.max(0, Math.trunc(danoRecibido));
  if (danoPositivo <= 0) return 0;
  return Math.min(30, Math.max(10, Math.floor(danoPositivo / 2)));
}

/**
 * Aplica un delta relativo de vitalidad (`dano`, `curacion` o `temp`) sobre el estado
 * actual de un personaje o acompañante de forma pura e inmutable.
 *
 * Reglas de absorción:
 * - Si `tipo === "dano"`:
 *   1. Toma `magnitud = Math.abs(delta)`.
 *   2. Descuenta primero de `hpTemporal`.
 *   3. El remanente se resta de `hpActual` con suelo en `0`.
 *   4. Si `magnitud > 0` y `tieneConcentracion` es `true`, calcula `cdConcentracionRequerida`
 *      usando `calcularCDConcentracion(magnitud)` y genera el `mensajeConcentracion`.
 * - Si `tipo === "curacion"`:
 *   1. Suma `Math.abs(delta)` a `hpActual` con techo en `hpMaximo`.
 * - Si `tipo === "temp"`:
 *   1. Asigna los nuevos puntos de golpe temporales (`Math.max(0, delta)`).
 */
export function calcularAbsorcionDeltaVida(
  entrada: EntradaVitalidad,
  delta: number,
  tipo: TipoDeltaVida
): ResultadoAbsorcionVitalidad {
  const hpMaximoSeguro = Math.max(1, entrada.hpMaximo);
  let hpActual = Math.max(0, Math.min(hpMaximoSeguro, entrada.hpActual));
  let hpTemporal = Math.max(0, entrada.hpTemporal);
  let danoEfectivoRecibido = 0;
  let cdConcentracionRequerida: number | null = null;
  let mensajeConcentracion: string | null = null;

  if (tipo === "dano") {
    const magnitudDano = Math.max(0, Math.abs(Math.trunc(delta)));
    danoEfectivoRecibido = magnitudDano;

    if (magnitudDano > 0) {
      const absorbidoPorTemp = Math.min(hpTemporal, magnitudDano);
      hpTemporal -= absorbidoPorTemp;
      const remanente = magnitudDano - absorbidoPorTemp;
      hpActual = Math.max(0, hpActual - remanente);

      if (entrada.tieneConcentracion) {
        const cd = calcularCDConcentracion(magnitudDano);
        cdConcentracionRequerida = cd;
        const detalleHechizo = entrada.nombreHechizoConcentrado
          ? ` (${entrada.nombreHechizoConcentrado})`
          : "";
        mensajeConcentracion = `Chequeo de Concentración${detalleHechizo}: Salvación de CON CD ${cd} por recibir ${magnitudDano} de daño.`;
      }
    }
  } else if (tipo === "curacion") {
    const magnitudCura = Math.max(0, Math.abs(Math.trunc(delta)));
    hpActual = Math.min(hpMaximoSeguro, hpActual + magnitudCura);
  } else if (tipo === "temp") {
    hpTemporal = Math.max(0, Math.trunc(delta));
  }

  return {
    hpActual,
    hpTemporal,
    danoEfectivoRecibido,
    cdConcentracionRequerida,
    mensajeConcentracion,
  };
}
