import type { TipoAccionConsumida } from "./TarjetaAtaquePersonaje";

export interface ConsumibleAccionCalculado {
  idInstancia: string;
  nombre: string;
  cantidad: number;
  tipoAccion: TipoAccionConsumida;
  esPocion: boolean;
  esCurativo: boolean;
  formulaCuracion?: string;
  descripcionUso: string;
  notas?: string;
}
