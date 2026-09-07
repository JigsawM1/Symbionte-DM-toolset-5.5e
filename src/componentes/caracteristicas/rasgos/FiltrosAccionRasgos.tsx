import React from "react";
import { Shield, Zap, Clock, Sparkles, Layers } from "lucide-react";
import type { FiltroTipoAccion } from "./CabeceraRasgosJugador";
import estilos from "./VistaRasgosJugador.module.css";

interface FiltrosAccionRasgosProps {
  filtroAccion: FiltroTipoAccion;
  alCambiarFiltroAccion: (filtro: FiltroTipoAccion) => void;
  hayFiltrosActivos: boolean;
  alLimpiarFiltros: () => void;
}

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
      <button
        type="button"
        className={`${estilos.chipFiltroMini} ${
          filtroAccion === "pasivo" ? estilos.chipFiltroMiniActivo : ""
        }`}
        onClick={() => alCambiarFiltroAccion("pasivo")}
      >
        <Shield size={10} />
        <span>Pasivo</span>
      </button>
      <button
        type="button"
        className={`${estilos.chipFiltroMini} ${
          filtroAccion === "accion" ? estilos.chipFiltroMiniActivo : ""
        }`}
        onClick={() => alCambiarFiltroAccion("accion")}
      >
        <Zap size={10} />
        <span>Acción</span>
      </button>
      <button
        type="button"
        className={`${estilos.chipFiltroMini} ${
          filtroAccion === "accion_adicional" ? estilos.chipFiltroMiniActivo : ""
        }`}
        onClick={() => alCambiarFiltroAccion("accion_adicional")}
      >
        <Clock size={10} />
        <span>Adicional</span>
      </button>
      <button
        type="button"
        className={`${estilos.chipFiltroMini} ${
          filtroAccion === "reaccion" ? estilos.chipFiltroMiniActivo : ""
        }`}
        onClick={() => alCambiarFiltroAccion("reaccion")}
      >
        <Sparkles size={10} />
        <span>Reacción</span>
      </button>
      <button
        type="button"
        className={`${estilos.chipFiltroMini} ${
          filtroAccion === "especial" ? estilos.chipFiltroMiniActivo : ""
        }`}
        onClick={() => alCambiarFiltroAccion("especial")}
      >
        <Layers size={10} />
        <span>Especial</span>
      </button>

      {hayFiltrosActivos && (
        <button
          type="button"
          className={estilos.chipFiltroMini}
          style={{ marginLeft: "auto", color: "#f87171" }}
          onClick={alLimpiarFiltros}
        >
          Limpiar
        </button>
      )}
    </div>
  );
};
