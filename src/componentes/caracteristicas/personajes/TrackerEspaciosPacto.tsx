import React from "react";
import { Sparkles, RotateCcw } from "lucide-react";

interface TrackerEspaciosPactoProps {
  espaciosPactoMaximos: number;
  espaciosPactoGastados: number;
  nivelEspacioPacto: number;
  alGastarEspacioPacto?: () => void;
  alRecuperarEspaciosPacto?: () => void;
  mostrarBotonRecuperar?: boolean;
  soloLectura?: boolean;
}

export const TrackerEspaciosPacto: React.FC<TrackerEspaciosPactoProps> = ({
  espaciosPactoMaximos,
  espaciosPactoGastados,
  nivelEspacioPacto,
  alGastarEspacioPacto,
  alRecuperarEspaciosPacto,
  mostrarBotonRecuperar = false,
  soloLectura = false
}) => {
  const disponibles = Math.max(0, espaciosPactoMaximos - espaciosPactoGastados);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        backgroundColor: "#111622",
        border: "1px solid rgba(192, 132, 252, 0.25)",
        borderRadius: 8,
        padding: "12px 14px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* Cabecera del Tracker de Pacto */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(192, 132, 252, 0.12)",
          paddingBottom: 8
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={15} color="#c084fc" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#f3e8ff"
            }}
          >
            Magia de Pacto
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#e9d5ff",
              backgroundColor: "rgba(168, 85, 247, 0.2)",
              border: "1px solid rgba(192, 132, 252, 0.4)",
              borderRadius: 4,
              padding: "1px 6px"
            }}
          >
            NIVEL {nivelEspacioPacto}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: disponibles > 0 ? "#c084fc" : "#ef4444" }}>
              {disponibles}
            </span>
            <span style={{ color: "#64748b", fontSize: 11 }}> / {espaciosPactoMaximos} ranuras</span>
          </div>

          {mostrarBotonRecuperar && alRecuperarEspaciosPacto && (
            <button
              type="button"
              onClick={alRecuperarEspaciosPacto}
              title="Restaurar todos los espacios de pacto (Descanso Corto / Largo)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "#1e1b2e",
                border: "1px solid rgba(192, 132, 252, 0.3)",
                borderRadius: 4,
                color: "#d8b4fe",
                fontSize: 11,
                padding: "3px 8px",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1e1b2e";
              }}
            >
              <RotateCcw size={11} />
              <span>Descanso Corto</span>
            </button>
          )}
        </div>
      </div>

      {/* Círculos Interactivos de Ranuras de Pacto */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {Array.from({ length: espaciosPactoMaximos }).map((_, idx) => {
            const estaDisponible = idx < disponibles;
            return (
              <div
                key={`pacto-slot-${idx}`}
                onClick={() => {
                  if (soloLectura) return;
                  if (estaDisponible && alGastarEspacioPacto) {
                    alGastarEspacioPacto();
                  } else if (!estaDisponible && alRecuperarEspaciosPacto) {
                    alRecuperarEspaciosPacto();
                  }
                }}
                title={
                  soloLectura
                    ? estaDisponible
                      ? `Espacio de Pacto Nivel ${nivelEspacioPacto} disponible`
                      : `Espacio de Pacto Nivel ${nivelEspacioPacto} gastado`
                    : estaDisponible
                      ? `Espacio de Pacto Nivel ${nivelEspacioPacto} disponible (clic para gastar)`
                      : `Espacio de Pacto gastado (clic para restaurar)`
                }
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: estaDisponible
                    ? "2px solid #c084fc"
                    : "1px dashed rgba(192, 132, 252, 0.35)",
                  backgroundColor: estaDisponible ? "#7e22ce" : "transparent",
                  boxShadow: estaDisponible ? "0 0 8px rgba(192, 132, 252, 0.4)" : "none",
                  cursor: soloLectura ? "default" : "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box"
                }}
                onMouseEnter={(e) => {
                  if (!soloLectura) {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!soloLectura) {
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              />
            );
          })}
        </div>

        <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>
          Ranuras fijas de nivel {nivelEspacioPacto} • Recuperación en descanso corto
        </span>
      </div>
    </div>
  );
};
