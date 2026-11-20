import React from "react";
import estilos from "./VistaAtaquesJugador.module.css";

export type TonoDivisorAccion = "cian" | "magia" | "oro" | "exito" | "neutro";

export interface DivisorSeccionAccionProps {
  icono: React.ReactNode;
  titulo: string;
  conteo: number;
  tono?: TonoDivisorAccion;
  accionDerecha?: React.ReactNode;
}

/**
 * Separador horizontal ligero de una línea para el flujo táctico plano (Propuesta A).
 */
export const DivisorSeccionAccion: React.FC<DivisorSeccionAccionProps> = ({
  icono,
  titulo,
  conteo,
  tono = "neutro",
  accionDerecha
}) => {
  return (
    <div className={estilos.divisorSeccionPlano} data-tono={tono}>
      <div className={estilos.etiquetaDivisorPlano}>
        {icono}
        <h3 className={estilos.tituloDivisorPlano}>{titulo}</h3>
        <span className={estilos.badgeDivisorPlano}>{conteo}</span>
      </div>
      <span className={estilos.lineaDivisorPlano} aria-hidden="true" />
      {accionDerecha && <div className={estilos.accionDivisorPlano}>{accionDerecha}</div>}
    </div>
  );
};
