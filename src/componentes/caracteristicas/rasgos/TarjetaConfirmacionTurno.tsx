import React from "react";
import { Clock } from "lucide-react";
import conversion from "./ConversionEspacios.module.css";

export interface TarjetaConfirmacionTurnoProps {
  readonly turnoConfirmado: boolean;
  readonly alConfirmar: (confirmado: boolean) => void;
}

/**
 * Control interactivo de confirmación de turno propio cuando no existe iniciativa activa.
 * Proporciona accesibilidad por teclado y feedback visual inmediato.
 */
export const TarjetaConfirmacionTurno: React.FC<TarjetaConfirmacionTurnoProps> = ({
  turnoConfirmado,
  alConfirmar
}) => {
  return (
    <div
      className={`${conversion.tarjetaTurno} ${turnoConfirmado ? conversion.tarjetaTurnoActiva : ""}`}
      onClick={() => alConfirmar(!turnoConfirmado)}
      role="checkbox"
      aria-checked={turnoConfirmado}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          alConfirmar(!turnoConfirmado);
        }
      }}
    >
      <Clock size={18} className={conversion.iconoTurno} />
      <div className={conversion.cuerpoTurno}>
        <div className={conversion.tituloTurno}>
          <span>Primer uso en este turno</span>
          <span className={conversion.badgeTurno}>1 vez / turno</span>
        </div>
        <span className={conversion.subtextoTurno}>
          Confirmo según las reglas de D&D 2024 que no he utilizado este rasgo previamente en mi turno.
        </span>
      </div>
      <input
        type="checkbox"
        className={conversion.checkTurno}
        checked={turnoConfirmado}
        onChange={e => {
          e.stopPropagation();
          alConfirmar(e.target.checked);
        }}
        aria-label="Confirmo que es el primer uso en mi turno"
      />
    </div>
  );
};
