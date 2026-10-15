import type { EstadoCombatePJ, EstadoCombateAcompanante } from './sync';

export interface ConjurosCombatePJ {
  espaciosMaximos: Record<string, number>;
  espaciosGastados: Record<string, number>;
  puntosMaximos?: number;
  puntosGastados?: number;
  pacto?: {
    maximos: number;
    gastados: number;
    nivel: number;
  };
}

/** Datos locales de recuperación; no forman parte del contrato de red. */
export interface BorradorCombateAcompanante extends EstadoCombateAcompanante {
  idPlantilla?: string;
  velocidad?: string;
  movimientoGastado?: number;
  movimientoMaximoTemporal?: number | null;
  esInvocacion?: boolean;
  nivelConjuroInvocacion?: number;
  subtipoInvocacion?: string;
}

export interface BorradorCombatePJ extends EstadoCombatePJ {
  conjuros?: ConjurosCombatePJ;
  movimientoGastado?: number;
  movimientoMaximoTemporal?: number | null;
  acompanantes?: BorradorCombateAcompanante[];
}
