import React, { useState } from "react";
import { Sparkles, RotateCcw, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";

interface TrackerPuntosConjuroProps {
  puntosMaximos: number;
  puntosGastados: number;
  nivelMaximo: number;
  alGastarPuntos: (cantidad: number) => void;
  alRecuperarPuntos: (cantidad: number) => void;
  alRecuperarTodosPuntos: () => void;
}

export const TrackerPuntosConjuro: React.FC<TrackerPuntosConjuroProps> = ({
  puntosMaximos,
  puntosGastados,
  nivelMaximo,
  alGastarPuntos,
  alRecuperarPuntos,
  alRecuperarTodosPuntos
}) => {
  const [mostrarTablaCostes, setMostrarTablaCostes] = useState(false);
  const [puntosPersonalizados, setPuntosPersonalizados] = useState<string>("");

  const puntosDisponibles = Math.max(0, puntosMaximos - puntosGastados);
  const porcentaje = puntosMaximos > 0 ? (puntosDisponibles / puntosMaximos) * 100 : 0;

  const nivelesBotones = Object.entries(COSTE_PUNTOS_POR_NIVEL)
    .map(([nv, coste]) => ({ nivel: Number(nv), coste }))
    .filter((item) => item.nivel <= Math.max(1, nivelMaximo));

  const manejarGastoPersonalizado = () => {
    const cant = parseInt(puntosPersonalizados, 10);
    if (!isNaN(cant) && cant > 0) {
      alGastarPuntos(cant);
      setPuntosPersonalizados("");
    }
  };

  const manejarRecuperacionPersonalizada = () => {
    const cant = parseInt(puntosPersonalizados, 10);
    if (!isNaN(cant) && cant > 0) {
      alRecuperarPuntos(cant);
      setPuntosPersonalizados("");
    }
  };

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
      {/* Cabecera y Resumen */}
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
          <Sparkles size={15} color="#38bdf8" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#f1f5f9"
            }}
          >
            Puntos de Conjuro (Variante)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              color: "#94a3b8"
            }}
          >
            Nivel Máx: <strong style={{ color: "#38bdf8" }}>{nivelMaximo}</strong>
          </span>

          <button
            type="button"
            onClick={alRecuperarTodosPuntos}
            title="Restablecer todos los puntos de conjuro"
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
      </div>

      {/* Barra de Progreso y Marcador Numérico */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6
          }}
        >
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Reserva de Maná</span>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 700 }}>
            <span style={{ color: puntosDisponibles > 0 ? "#38bdf8" : "#ef4444" }}>
              {puntosDisponibles}
            </span>
            <span style={{ color: "#64748b", fontSize: 13 }}> / {puntosMaximos} pts</span>
          </div>
        </div>

        {/* Barra visual */}
        <div
          style={{
            height: 10,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            borderRadius: 5,
            overflow: "hidden",
            border: "1px solid rgba(148, 163, 184, 0.15)"
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.max(0, porcentaje))}%`,
              backgroundColor: porcentaje > 25 ? "#0284c7" : "#ef4444"
            }}
          />
        </div>
      </div>

      {/* Botones de Lanzamiento Rápido por Nivel */}
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 6
          }}
        >
          Gastar por Nivel de Conjuro
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {nivelesBotones.map((item) => {
            const puedePagar = puntosDisponibles >= item.coste;
            return (
              <button
                key={`gasto-nv-${item.nivel}`}
                type="button"
                disabled={!puedePagar}
                onClick={() => alGastarPuntos(item.coste)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: puedePagar
                    ? "1px solid rgba(56, 189, 248, 0.3)"
                    : "1px solid rgba(148, 163, 184, 0.1)",
                  backgroundColor: puedePagar ? "#162235" : "#0f172a",
                  color: puedePagar ? "#bae6fd" : "#475569",
                  cursor: puedePagar ? "pointer" : "not-allowed",
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                <Zap size={10} color={puedePagar ? "#38bdf8" : "#475569"} />
                <span>Nv.{item.nivel} ({item.coste}p)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Personalizado y Tabla de Referencia */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 8,
          borderTop: "1px solid rgba(148, 163, 184, 0.1)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="number"
            min={1}
            max={puntosMaximos}
            placeholder="Cant."
            value={puntosPersonalizados}
            onChange={(e) => setPuntosPersonalizados(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") manejarGastoPersonalizado();
            }}
            style={{
              width: 55,
              padding: "3px 6px",
              backgroundColor: "#0b0f16",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 4,
              color: "#f1f5f9",
              fontSize: 11,
              textAlign: "center"
            }}
          />
          <button
            type="button"
            onClick={manejarGastoPersonalizado}
            style={{
              padding: "3px 8px",
              backgroundColor: "#1e293b",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 4,
              color: "#94a3b8",
              fontSize: 11,
              cursor: "pointer"
            }}
          >
            Gastar
          </button>
          <button
            type="button"
            onClick={manejarRecuperacionPersonalizada}
            style={{
              padding: "3px 8px",
              backgroundColor: "#1e293b",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: 4,
              color: "#38bdf8",
              fontSize: 11,
              cursor: "pointer"
            }}
          >
            +Recuperar
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMostrarTablaCostes(!mostrarTablaCostes)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: 11,
            cursor: "pointer"
          }}
        >
          <span>Tabla de Costes</span>
          {mostrarTablaCostes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Tabla Colapsable de Costes */}
      {mostrarTablaCostes && (
        <div
          style={{
            backgroundColor: "#0b0f16",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: 6,
            padding: 10,
            fontSize: 11
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
              color: "#94a3b8"
            }}
          >
            {Object.entries(COSTE_PUNTOS_POR_NIVEL).map(([nv, coste]) => (
              <div key={`coste-${nv}`} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Nivel {nv}:</span>
                <strong style={{ color: "#38bdf8" }}>{coste} pts</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
