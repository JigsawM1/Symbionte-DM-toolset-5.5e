import React from "react";
import { Sparkles, RotateCcw } from "lucide-react";

interface TrackerEspaciosConjuroProps {
  espaciosMaximos: Record<string, number>;
  espaciosGastados: Record<string, number>;
  alGastarEspacio: (nivel: number) => void;
  alRecuperarEspacio: (nivel: number) => void;
  alRecuperarTodosEspacios: () => void;
}

export const TrackerEspaciosConjuro: React.FC<TrackerEspaciosConjuroProps> = ({
  espaciosMaximos,
  espaciosGastados,
  alGastarEspacio,
  alRecuperarEspacio,
  alRecuperarTodosEspacios
}) => {
  const nivelesDisponibles = Object.keys(espaciosMaximos)
    .map(Number)
    .filter((n) => n >= 1 && n <= 9 && (espaciosMaximos[String(n)] || 0) > 0)
    .sort((a, b) => a - b);

  if (nivelesDisponibles.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        backgroundColor: "#111622",
        border: "1px solid rgba(148, 163, 184, 0.14)",
        borderRadius: 8,
        padding: "14px 16px"
      }}
    >
      {/* Cabecera del Tracker */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
          paddingBottom: 8
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={15} color="#818cf8" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#f1f5f9"
            }}
          >
            Espacios de Conjuro
          </span>
        </div>

        <button
          type="button"
          onClick={alRecuperarTodosEspacios}
          title="Restaurar todos los espacios de conjuro"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "#18202f",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: 4,
            color: "#94a3b8",
            fontSize: 11,
            padding: "3px 8px",
            cursor: "pointer"
          }}
        >
          <RotateCcw size={11} />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Grid de Espacios Estándar por Nivel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10
        }}
      >
        {nivelesDisponibles.map((nivel) => {
          const max = espaciosMaximos[String(nivel)] || 0;
          const gastados = espaciosGastados[String(nivel)] || 0;
          const disponibles = Math.max(0, max - gastados);

          return (
            <div
              key={`espacio-nv-${nivel}`}
              style={{
                backgroundColor: "#161e2c",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                borderRadius: 6,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}
            >
              {/* Título y Conteo */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11
                }}
              >
                <span style={{ fontWeight: 700, color: "#c7d2fe" }}>
                  Nivel {nivel}
                </span>
                <span
                  style={{
                    color: disponibles > 0 ? "#38bdf8" : "#ef4444",
                    fontWeight: 700,
                    fontFamily: "JetBrains Mono, monospace"
                  }}
                >
                  {disponibles}/{max}
                </span>
              </div>

              {/* Burbujas interactivas */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {Array.from({ length: max }).map((_, idx) => {
                  const estaDisponible = idx < disponibles;
                  return (
                    <button
                      key={`slot-${nivel}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (estaDisponible) {
                          alGastarEspacio(nivel);
                        } else {
                          alRecuperarEspacio(nivel);
                        }
                      }}
                      title={
                        estaDisponible
                          ? `Clic para gastar espacio de Nivel ${nivel}`
                          : `Clic para recuperar espacio de Nivel ${nivel}`
                      }
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: estaDisponible
                          ? "2px solid #818cf8"
                          : "1px dashed rgba(148, 163, 184, 0.3)",
                        backgroundColor: estaDisponible ? "#4338ca" : "transparent",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
