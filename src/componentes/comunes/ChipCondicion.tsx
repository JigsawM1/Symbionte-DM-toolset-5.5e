import React from "react";
import { X, Droplets, AlertTriangle, Footprints, Sparkles } from "lucide-react";
import { obtenerDetalleCondicion } from "@/servicios/resolutorCondiciones";

export interface ChipCondicionProps {
  nombre: string;
  esDesangrado?: boolean;
  esAlerta?: boolean;
  esSigilo?: boolean;
  concentracion?: boolean;
  expiraRonda?: number;
  rondasRestantes?: number;
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
  esAlerta,
  esSigilo,
  concentracion,
  expiraRonda,
  rondasRestantes,
  textoCustom,
  tooltipCustom,
  alineacionTooltip,
  onQuitar,
  className = "",
  style
}) => {
  const detalle = obtenerDetalleCondicion(nombre);
  const nombreMin = nombre.toLowerCase();

  const esBloodied =
    esDesangrado ||
    nombreMin.includes("desangr") ||
    nombreMin.includes("bloodied");

  const esPenalizacionArmadura =
    esAlerta ||
    nombreMin.includes("sin competencia") ||
    nombreMin.includes("incompetencia");

  const esDesventajaSigilo =
    esSigilo ||
    nombreMin.includes("desventaja en sigilo") ||
    nombreMin.includes("sigilo ruidoso");

  const esFuriaDeLosDioses =
    nombreMin.includes("furia de los dioses") ||
    nombreMin.includes("rage of the gods");

  const esEfectoConcentracion = Boolean(
    concentracion ||
    nombreMin.startsWith("concentra") ||
    nombreMin.includes("concentración") ||
    nombreMin.includes("concentracion")
  );

  // Determinar variante visual
  let claseVariante = "chip-condicion-estandar";
  if (esBloodied) {
    claseVariante = "chip-condicion-desangrado";
  } else if (esPenalizacionArmadura) {
    claseVariante = "chip-condicion-penalizacion";
  } else if (esDesventajaSigilo) {
    claseVariante = "chip-condicion-sigilo";
  } else if (esEfectoConcentracion) {
    claseVariante = "chip-condicion-concentracion";
  } else if (esFuriaDeLosDioses || expiraRonda !== undefined) {
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
  const nombreLimpio = nombre.replace(/\u{1FA78}\s*/gu, "");
  let nombreEfectivo = nombreLimpio;
  if (esEfectoConcentracion) {
    const nombreConjuroExtraido = nombreLimpio
      .replace(/^concentraci[oó]n:\s*/i, "")
      .replace(/^concentraci[oó]n\s*\((.*?)\)$/i, "$1")
      .trim();
    if (nombreConjuroExtraido && !nombreConjuroExtraido.toLowerCase().startsWith("concentra")) {
      nombreEfectivo = nombreConjuroExtraido;
    }
  } else {
    nombreEfectivo = nombreLimpio.split(" (")[0];
  }
  const prefijoConcentracion = esEfectoConcentracion ? "[CON] " : "";
  const textoAMostrar =
    textoCustom ||
    `${prefijoConcentracion}${nombreEfectivo.toUpperCase()}`;

  // Texto del tooltip enriquecido
  let tooltipTexto = tooltipCustom;
  if (!tooltipTexto) {
    let contenidoBase = "";
    if (esBloodied) {
      contenidoBase = `${detalle.titulo} (<50% de Vida)\n\n• ${detalle.descripcion}`;
    } else if (esEfectoConcentracion) {
      const esSoloConcentracion =
        nombreEfectivo.toLowerCase() === "concentración" ||
        nombreEfectivo.toLowerCase() === "concentracion";
      const spellLabel = !esSoloConcentracion ? ` (${nombreEfectivo})` : "";
      contenidoBase = `Concentración${spellLabel}\n\n• Requiere mantener la concentración activa.\n• Al recibir daño: Salvación de Constitución CD 10 o la mitad del daño recibido (la que sea mayor).\n• Quedar incapacitado o lanzar otro conjuro de concentración rompe este efecto inmediatamente (D&D 5.5e).`;
    } else if (detalle.efectos && detalle.efectos.length > 0) {
      contenidoBase = `${detalle.titulo}\n\n${detalle.efectos.map((e) => `• ${e}`).join("\n")}`;
    } else {
      contenidoBase = `${detalle.titulo}\n\n• ${detalle.descripcion}`;
    }

    if (expiraRonda !== undefined) {
      const infoRondas =
        rondasRestantes !== undefined
          ? ` (le quedan ${rondasRestantes} rondas activas)`
          : "";
      tooltipTexto = `${contenidoBase}\n\n• Expira en la ronda ${expiraRonda}${infoRondas}.`;
    } else {
      tooltipTexto = contenidoBase;
    }
  }

  // Expiración por rondas
  const tieneExpiracion = expiraRonda !== undefined;
  const textoExpiracion = tieneExpiracion
    ? rondasRestantes !== undefined
      ? `R.${expiraRonda} (${rondasRestantes}r)`
      : `R.${expiraRonda}`
    : "";

  return (
    <div
      className={`chip-condicion-universal ${claseVariante} ${claseAncla} ${className}`}
      style={style}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {esBloodied && (
          <Droplets
            size={11}
            style={{ color: "#ef4444", display: "inline-block", flexShrink: 0 }}
          />
        )}
        {esPenalizacionArmadura && !esBloodied && (
          <AlertTriangle
            size={11}
            style={{ color: "#f59e0b", display: "inline-block", flexShrink: 0 }}
          />
        )}
        {esDesventajaSigilo && !esBloodied && !esPenalizacionArmadura && (
          <Footprints
            size={11}
            style={{ color: "#c084fc", display: "inline-block", flexShrink: 0 }}
          />
        )}
        {esFuriaDeLosDioses && !esBloodied && !esPenalizacionArmadura && !esDesventajaSigilo && (
          <Sparkles
            size={11}
            style={{ color: "#fbbf24", display: "inline-block", flexShrink: 0 }}
          />
        )}
        <span>{textoAMostrar}</span>
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
