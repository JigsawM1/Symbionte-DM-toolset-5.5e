import React from "react";
import type { ModeloConjuros } from "@/tipos";

export interface TarjetasMetricasMagiaProps {
  conteoConjurosLibres: number;
  conteoConjurosSubclase: number;
  maxConjuros: number;
  conteoTrucosLibres: number;
  conteoTrucosSubclase: number;
  maxTrucos: number;
  modelo: ModeloConjuros;
}

export const TarjetasMetricasMagia: React.FC<TarjetasMetricasMagiaProps> = ({
  conteoConjurosLibres,
  conteoConjurosSubclase,
  maxConjuros,
  conteoTrucosLibres,
  conteoTrucosSubclase,
  maxTrucos,
  modelo
}) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "4px 0" }}>
      {/* Tarjeta CONJUROS */}
      <div
        style={{
          backgroundColor: "#111622",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: 8,
          padding: "6px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          CONJUROS
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "2px 0" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", fontFamily: "JetBrains Mono, monospace" }}>
            {conteoConjurosLibres}{maxConjuros > 0 ? ` / ${maxConjuros}` : ""}
          </span>
          {conteoConjurosSubclase > 0 && (
            <span
              title={`${conteoConjurosSubclase} conjuros otorgados por subclase que no consumen tu límite de clase`}
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#facc15",
                backgroundColor: "rgba(234, 179, 8, 0.15)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                borderRadius: 4,
                padding: "1px 5px"
              }}
            >
              +{conteoConjurosSubclase} Subclase
            </span>
          )}
        </div>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {modelo === "preparados" ? "PREPARADOS (LIBRES)" : "CONOCIDOS (LIBRES)"}
        </span>
      </div>

      {/* Tarjeta TRUCOS */}
      <div
        style={{
          backgroundColor: "#111622",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: 8,
          padding: "6px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          TRUCOS
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "2px 0" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", fontFamily: "JetBrains Mono, monospace" }}>
            {conteoTrucosLibres}{maxTrucos > 0 ? ` / ${maxTrucos}` : ""}
          </span>
          {conteoTrucosSubclase > 0 && (
            <span
              title={`${conteoTrucosSubclase} trucos otorgados por subclase`}
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#facc15",
                backgroundColor: "rgba(234, 179, 8, 0.15)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                borderRadius: 4,
                padding: "1px 5px"
              }}
            >
              +{conteoTrucosSubclase} Subclase
            </span>
          )}
        </div>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          CONOCIDOS
        </span>
      </div>
    </div>
  );
};
