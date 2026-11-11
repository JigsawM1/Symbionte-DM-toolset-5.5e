import React from "react";
import { Layers, Zap } from "lucide-react";
import conversion from "./ConversionEspacios.module.css";

export interface HudRecursosConversionProps {
  readonly nombreRecurso: string;
  readonly disponibles: number;
  readonly maximos: number;
  readonly esModoPuntos: boolean;
  readonly puntosDisponibles: number;
  readonly puntosMaximos: number;
  readonly totalEspaciosDisponibles: number;
}

/**
 * HUD táctico que presenta el balance en tiempo real de los recursos involucrados
 * en la conversión (Forma salvaje, puntos de brujería, ranuras o puntos de maná DMG).
 */
export const HudRecursosConversion: React.FC<HudRecursosConversionProps> = ({
  nombreRecurso,
  disponibles,
  maximos,
  esModoPuntos,
  puntosDisponibles,
  puntosMaximos,
  totalEspaciosDisponibles
}) => {
  const estadoClase =
    disponibles === 0
      ? conversion.insigniaAgotada
      : disponibles === maximos
        ? conversion.insigniaCompleta
        : conversion.insigniaDisponible;

  const textoEstado =
    disponibles === 0 ? "Agotado" : disponibles === maximos ? "Completo" : "Disponible";

  return (
    <div className={conversion.hudRecursos}>
      <div className={conversion.tarjetaRecurso}>
        <div className={conversion.cabeceraRecurso}>
          <span className={conversion.etiquetaRecurso}>
            <Layers size={12} /> {nombreRecurso}
          </span>
          <span className={`${conversion.insigniaEstado} ${estadoClase}`}>{textoEstado}</span>
        </div>
        <div className={conversion.valorRecurso}>
          {disponibles} <span className={conversion.valorRecursoTotal}>/ {maximos}</span>
        </div>
      </div>

      {esModoPuntos ? (
        <div className={conversion.tarjetaRecurso}>
          <div className={conversion.cabeceraRecurso}>
            <span className={conversion.etiquetaRecurso}>
              <Zap size={12} /> Puntos de conjuro
            </span>
            <span
              className={`${conversion.insigniaEstado} ${
                puntosDisponibles === 0
                  ? conversion.insigniaAgotada
                  : puntosDisponibles === puntosMaximos
                    ? conversion.insigniaCompleta
                    : conversion.insigniaDisponible
              }`}
            >
              {puntosDisponibles === puntosMaximos ? "Máximo" : `${puntosDisponibles} pts`}
            </span>
          </div>
          <div className={conversion.valorRecurso}>
            {puntosDisponibles} <span className={conversion.valorRecursoTotal}>/ {puntosMaximos}</span>
          </div>
        </div>
      ) : (
        <div className={conversion.tarjetaRecurso}>
          <div className={conversion.cabeceraRecurso}>
            <span className={conversion.etiquetaRecurso}>
              <Zap size={12} /> Espacios disponibles
            </span>
            <span
              className={`${conversion.insigniaEstado} ${
                totalEspaciosDisponibles === 0 ? conversion.insigniaAgotada : conversion.insigniaDisponible
              }`}
            >
              {totalEspaciosDisponibles} disponibles
            </span>
          </div>
          <div className={conversion.valorRecurso}>
            {totalEspaciosDisponibles} <span className={conversion.valorRecursoTotal}>ranuras</span>
          </div>
        </div>
      )}
    </div>
  );
};
