import type { TipoLanzador } from "@/tipos";
import { TABLA_PACTO_BRUJO } from "@/constantes/personajeConstantes";

export function obtenerNivelMaximoConjuroPorTipoClase(
  tipo: TipoLanzador,
  nivelClase: number
): number {
  const niv = Math.min(20, Math.max(1, Math.floor(nivelClase) || 1));
  switch (tipo) {
    case "completo":
      return Math.min(9, Math.ceil(niv / 2));
    case "medio":
      // En D&D 5.5e (2024), los medio-lanzadores obtienen magia desde nivel 1
      return Math.min(5, Math.ceil(niv / 4));
    case "tercio":
      if (niv < 3) return 0;
      if (niv <= 6) return 1;
      if (niv <= 12) return 2;
      if (niv <= 18) return 3;
      return 4;
    case "pacto":
      return TABLA_PACTO_BRUJO[niv]?.nivel ?? 1;
    case "ninguno":
    default:
      return 0;
  }
}

