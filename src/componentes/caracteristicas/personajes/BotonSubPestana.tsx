import React from "react";
import estilos from "./HojaPersonaje.module.css";

export interface BotonSubPestanaProps {
  /** Indica si la sub-pestaña está actualmente seleccionada */
  activa: boolean;
  /** Texto descriptivo del botón */
  etiqueta: string;
  /** Icono representativo (generalmente de lucide-react) */
  icono: React.ReactNode;
  /** Conteo opcional mostrado en badge (ej. total de conjuros y trucos) */
  badge?: number;
  /** Callback invocado al hacer clic */
  alClick: () => void;
}

/**
 * Botón interactivo reutilizable para la barra de sub-pestañas tácticas de la Hoja de Personaje.
 */
export const BotonSubPestana: React.FC<BotonSubPestanaProps> = ({
  activa,
  etiqueta,
  icono,
  badge,
  alClick
}) => {
  return (
    <button
      type="button"
      onClick={alClick}
      className={`${estilos.botonSubPestana} ${
        activa ? estilos.botonSubPestanaActivo : ""
      }`}
    >
      {icono}
      <span>{etiqueta}</span>
      {badge !== undefined && badge > 0 && (
        <span className={estilos.badgeContadorConjuros}>{badge}</span>
      )}
    </button>
  );
};
