import React from "react";
import { Flame } from "lucide-react";
import estilos from "./PanelConjurosPersonaje.module.css";

interface BannerConcentracionActivaProps {
  nombreHechizo: string;
  alRomperConcentracion: () => void;
}

export const BannerConcentracionActiva: React.FC<BannerConcentracionActivaProps> = ({
  nombreHechizo,
  alRomperConcentracion
}) => {
  return (
    <div className={estilos.alertaConcentracion}>
      <div className={estilos.concentracionIzquierda}>
        <Flame size={18} color="#ef4444" className={estilos.concentracionIcono} />
        <div className={estilos.concentracionTextos}>
          <span className={estilos.concentracionEtiqueta}>Concentración Activa</span>
          <span className={estilos.concentracionNombre}>{nombreHechizo}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={alRomperConcentracion}
        className={estilos.botonRomperConcentracion}
      >
        Romper
      </button>
    </div>
  );
};
