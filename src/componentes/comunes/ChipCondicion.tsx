import React from "react";
import { X } from "lucide-react";
import { obtenerDetalleCondicion } from "@/servicios/resolutorCondiciones";

export interface ChipCondicionProps {
  nombre: string;
  esDesangrado?: boolean;
  concentracion?: boolean;
  expiraRonda?: number;
  textoCustom?: string;
  tooltipCustom?: string;
  alineacionTooltip?: "izquierda" | "derecha";
  onQuitar?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente universal para visualizar condiciones y efectos de combate (D&D 5.5e).
 * Incluye variantes cromáticas semánticas y tooltip flotante enriquecido en tiempo real.
 */
export const ChipCondicion: React.FC<ChipCondicionProps> = ({
  nombre,
  esDesangrado,
  concentracion,
  expiraRonda,
  textoCustom,
  tooltipCustom,
  alineacionTooltip,
  onQuitar,
  className = "",
  style
}) => {
  const detalle = obtenerDetalleCondicion(nombre);
  const esBloodied =
    esDesangrado ||
    nombre.toLowerCase().includes("desangr") ||
    nombre.toLowerCase().includes("bloodied");

  // Determinar variante visual
  let claseVariante = "chip-condicion-estandar";
  if (esBloodied) {
    claseVariante = "chip-condicion-desangrado";
  } else if (concentracion) {
    claseVariante = "chip-condicion-concentracion";
  } else if (expiraRonda !== undefined) {
    claseVariante = "chip-condicion-magico";
  }

  // Clase de anclaje de posición de tooltip
  const claseAncla =
    alineacionTooltip === "derecha"
      ? "tooltip-ancla-derecha"
      : alineacionTooltip === "izquierda"
      ? "tooltip-ancla-izquierda"
      : "";

  // Texto principal
  const prefijoBloodied = esBloodied && !nombre.includes("🩸") ? "🩸 " : "";
  const prefijoConcentracion = concentracion ? "[CON] " : "";
  const textoAMostrar =
    textoCustom ||
    `${prefijoBloodied}${prefijoConcentracion}${nombre.split(" (")[0].toUpperCase()}`;

  // Texto del tooltip enriquecido
  let tooltipTexto = tooltipCustom;
  if (!tooltipTexto) {
    if (esBloodied) {
      tooltipTexto = `${detalle.titulo} (<50% de Vida)\n\n• ${detalle.descripcion}`;
    } else if (detalle.efectos && detalle.efectos.length > 0) {
      tooltipTexto = `${detalle.titulo}\n\n${detalle.efectos.map((e) => `• ${e}`).join("\n")}`;
    } else {
      tooltipTexto = `${detalle.titulo}\n\n• ${detalle.descripcion}`;
    }
  }

  // Expiración por rondas
  const tieneExpiracion = expiraRonda !== undefined;
  const textoExpiracion = tieneExpiracion ? `R.${expiraRonda}` : "";

  return (
    <div
      className={`chip-condicion-universal ${claseVariante} ${claseAncla} ${className}`}
      style={style}
    >
      <span>
        {textoAMostrar}
        {textoExpiracion && (
          <span className="chip-condicion-badge-expiracion">{textoExpiracion}</span>
        )}
      </span>

      <span className="tooltip-contenido">{tooltipTexto}</span>

      {onQuitar && (
        <button
          type="button"
          className="chip-condicion-boton-quitar"
          onClick={(e) => {
            e.stopPropagation();
            onQuitar();
          }}
          title={`Quitar ${nombre}`}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};
