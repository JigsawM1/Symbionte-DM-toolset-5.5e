import React from "react";
import { ArrowRight } from "lucide-react";
import conversion from "./ConversionEspacios.module.css";

export interface TarjetaFlujoConversionProps {
  readonly modo: "crear" | "convertir";
  readonly coste: number;
  readonly unidad: string;
  readonly esModoPuntos: boolean;
  readonly costePuntosConversion: number;
  readonly seleccionadoNivel?: number;
  readonly nombreRecurso: string;
  readonly puntosGastados: number;
  readonly puntosCreados: number;
  readonly cantidad: number;
  readonly nivel: number;
  readonly agotado?: boolean;
  readonly recuperacion: number;
}

/**
 * Tarjeta táctica de balance que ilustra el flujo de transmutación:
 * [Recurso a entregar] ➔ [Recurso obtenido].
 */
export const TarjetaFlujoConversion: React.FC<TarjetaFlujoConversionProps> = ({
  modo,
  coste,
  unidad,
  esModoPuntos,
  costePuntosConversion,
  seleccionadoNivel,
  nombreRecurso,
  puntosGastados,
  puntosCreados,
  cantidad,
  nivel,
  agotado,
  recuperacion
}) => {
  const textoGasto =
    modo === "crear"
      ? `${coste} ${unidad}`
      : esModoPuntos
        ? `${costePuntosConversion} pts`
        : seleccionadoNivel !== undefined
          ? `1 ranura Nv.${seleccionadoNivel}`
          : "1 ranura";

  const subtextoGasto =
    modo === "crear"
      ? `${nombreRecurso} a deducir`
      : esModoPuntos
        ? "Puntos de conjuro consumidos"
        : "Espacio a consumir";

  const textoGanancia =
    modo === "crear"
      ? esModoPuntos
        ? `+${Math.min(puntosGastados, puntosCreados)} pts`
        : `+${cantidad} Nv.${nivel}`
      : agotado
        ? "+1 uso"
        : `+${recuperacion > 0 ? recuperacion : 1} pts`;

  const subtextoGanancia =
    modo === "crear"
      ? esModoPuntos
        ? "Restaurados a la reserva"
        : "Espacios de conjuro"
      : nombreRecurso;

  return (
    <div className={conversion.tarjetaFlujo}>
      <div className={conversion.ladoFlujo}>
        <span className={conversion.etiquetaFlujo}>Entregas</span>
        <span className={`${conversion.cifraFlujo} ${conversion.cifraGasto}`}>{textoGasto}</span>
        <span className={conversion.subtextoFlujo}>{subtextoGasto}</span>
      </div>

      <div className={conversion.conectorFlujo}>
        <ArrowRight size={14} />
      </div>

      <div className={`${conversion.ladoFlujo} ${conversion.ladoFlujoDerecho}`}>
        <span className={conversion.etiquetaFlujo}>Recuperas</span>
        <span className={`${conversion.cifraFlujo} ${conversion.cifraGanancia}`}>{textoGanancia}</span>
        <span className={conversion.subtextoFlujo}>{subtextoGanancia}</span>
      </div>
    </div>
  );
};
