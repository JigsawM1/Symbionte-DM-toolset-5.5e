import React from "react";
import { Settings } from "lucide-react";
import estilos from "./ConfiguracionPersonaje.module.css";

export interface TarjetaResumenCompetenciaProps {
  icono: React.ReactNode;
  titulo: string;
  conteo: number;
  etiquetaConteo: string;
  descripcion: string;
  textoBoton: string;
  alAbrir: () => void;
}

/**
 * Tarjeta genérica reutilizable para los bloques de competencias de la configuración:
 * Armas, Armaduras, Idiomas y Herramientas.
 */
export const TarjetaResumenCompetencia: React.FC<TarjetaResumenCompetenciaProps> = ({
  icono,
  titulo,
  conteo,
  etiquetaConteo,
  descripcion,
  textoBoton,
  alAbrir
}) => {
  return (
    <div className={estilos.tarjetaCompetencia}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {icono}
            <strong style={{ fontSize: 12, color: "#f1f5f9" }}>{titulo}</strong>
          </div>
          <span className={estilos.badgeConteoCompetencias}>
            {conteo} {etiquetaConteo}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
          {descripcion || "Sin competencias seleccionadas"}
        </p>
      </div>

      <button
        type="button"
        onClick={alAbrir}
        className={estilos.botonConfigurarAtributo}
      >
        <Settings size={12} color="#94a3b8" />
        {textoBoton}
      </button>
    </div>
  );
};
