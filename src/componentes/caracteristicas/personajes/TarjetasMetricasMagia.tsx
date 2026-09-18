import React from "react";
import type { ModeloConjuros } from "@/tipos";
import estilos from "./PanelConjurosPersonaje.module.css";

export interface TarjetasMetricasMagiaProps {
  conteoConjurosLibres: number;
  conteoConjurosSubclase: number;
  maxConjuros: number;
  conteoTrucosLibres: number;
  conteoTrucosSubclase: number;
  maxTrucos: number;
  modelo: ModeloConjuros;
}

export const TarjetasMetricasMagia: React.FC<TarjetasMetricasMagiaProps> = ({
  conteoConjurosLibres,
  conteoConjurosSubclase,
  maxConjuros,
  conteoTrucosLibres,
  conteoTrucosSubclase,
  maxTrucos,
  modelo
}) => {
  return (
    <div className={estilos.gridMetricasMagiaLibres}>
      {/* Tarjeta CONJUROS */}
      <div className={estilos.tarjetaMetricaMagiaItem}>
        <span className={estilos.etiquetaMetricaMagia}>
          CONJUROS
        </span>
        <div className={estilos.filaValorMetricaMagia}>
          <span className={estilos.numeroMetricaMagia}>
            {conteoConjurosLibres}{maxConjuros > 0 ? ` / ${maxConjuros}` : ""}
          </span>
          {conteoConjurosSubclase > 0 && (
            <span
              title={`${conteoConjurosSubclase} conjuros otorgados por subclase que no consumen tu límite de clase`}
              className={estilos.badgeSubclaseMetrica}
            >
              +{conteoConjurosSubclase} Subclase
            </span>
          )}
        </div>
        <span className={estilos.subtextoMetricaMagia}>
          {modelo === "preparados" ? "PREPARADOS (LIBRES)" : "CONOCIDOS (LIBRES)"}
        </span>
      </div>

      {/* Tarjeta TRUCOS */}
      <div className={estilos.tarjetaMetricaMagiaItem}>
        <span className={estilos.etiquetaMetricaMagia}>
          TRUCOS
        </span>
        <div className={estilos.filaValorMetricaMagia}>
          <span className={estilos.numeroMetricaMagia}>
            {conteoTrucosLibres}{maxTrucos > 0 ? ` / ${maxTrucos}` : ""}
          </span>
          {conteoTrucosSubclase > 0 && (
            <span
              title={`${conteoTrucosSubclase} trucos otorgados por subclase`}
              className={estilos.badgeSubclaseMetrica}
            >
              +{conteoTrucosSubclase} Subclase
            </span>
          )}
        </div>
        <span className={estilos.subtextoMetricaMagia}>
          CONOCIDOS
        </span>
      </div>
    </div>
  );
};
