import React from "react";
import { ICONO_POR_ACCION, ETIQUETA_ACCION } from "./TarjetaRasgo.constantes";
import type { FiltroTipoAccion } from "./CabeceraRasgosJugador";
import estilos from "./VistaRasgosJugador.module.css";

interface FiltrosAccionRasgosProps {
  filtroAccion: FiltroTipoAccion;
  alCambiarFiltroAccion: (filtro: FiltroTipoAccion) => void;
  hayFiltrosActivos: boolean;
  alLimpiarFiltros: () => void;
}

const TIPOS_ACCION: readonly Exclude<FiltroTipoAccion, "todos">[] = [
  "pasivo", "accion", "accion_adicional", "reaccion", "especial"
];

export const FiltrosAccionRasgos: React.FC<FiltrosAccionRasgosProps> = ({
  filtroAccion,
  alCambiarFiltroAccion,
  hayFiltrosActivos,
  alLimpiarFiltros
}) => {
  return (
    <div className={estilos.cajonFiltrosDesplegable}>
      <span className={estilos.labelFiltroMini}>Acción:</span>
      <button
        type="button"
        className={`${estilos.chipFiltroMini} ${
          filtroAccion === "todos" ? estilos.chipFiltroMiniActivo : ""
        }`}
        onClick={() => alCambiarFiltroAccion("todos")}
      >
        Todos
      </button>
      {TIPOS_ACCION.map((tipo) => (
        <button
          key={tipo}
          type="button"
          className={`${estilos.chipFiltroMini} ${
            filtroAccion === tipo ? estilos.chipFiltroMiniActivo : ""
          }`}
          onClick={() => alCambiarFiltroAccion(tipo)}
        >
          {ICONO_POR_ACCION[tipo]}
          <span>{tipo === "accion_adicional" ? "Adicional" : ETIQUETA_ACCION[tipo]}</span>
        </button>
      ))}

      {hayFiltrosActivos && (
        <button
          type="button"
          className={`${estilos.chipFiltroMini} ${estilos.chipFiltroLimpiar}`}
          onClick={alLimpiarFiltros}
        >
          Limpiar
        </button>
      )}
    </div>
  );
};
