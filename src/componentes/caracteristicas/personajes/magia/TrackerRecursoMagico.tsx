import React from "react";
import { Sparkles, RotateCcw } from "lucide-react";

export interface GrupoRanurasMagicas {
  id: string;
  etiqueta: string;
  badge?: string;
  max: number;
  gastados: number;
  alGastar?: () => void;
  alRecuperar?: () => void;
  colorTema?: string;
  colorTemaFondo?: string;
}

export interface TrackerRecursoMagicoProps {
  titulo: string;
  iconoColor?: string;
  grupos: GrupoRanurasMagicas[];
  alRestablecerTodos?: () => void;
  etiquetaRestablecer?: string;
  mostrarBotonRestablecer?: boolean;
  soloLectura?: boolean;
  pieDePagina?: string;
  modoGrid?: boolean;
  colorBordeContenedor?: string;
}

export const TrackerRecursoMagico: React.FC<TrackerRecursoMagicoProps> = ({
  titulo,
  iconoColor = "#818cf8",
  grupos,
  alRestablecerTodos,
  etiquetaRestablecer = "Restablecer",
  mostrarBotonRestablecer = false,
  soloLectura = false,
  pieDePagina,
  modoGrid = true,
  colorBordeContenedor = "rgba(148, 163, 184, 0.14)"
}) => {
  const gruposValidos = grupos.filter((g) => g.max > 0);

  if (gruposValidos.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        backgroundColor: "#111622",
        border: `1px solid ${colorBordeContenedor}`,
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
          <Sparkles size={15} color={iconoColor} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#f1f5f9"
            }}
          >
            {titulo}
          </span>
          {gruposValidos.length === 1 && gruposValidos[0].badge && (
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
              {gruposValidos[0].badge}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {gruposValidos.length === 1 && (
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: Math.max(0, gruposValidos[0].max - gruposValidos[0].gastados) > 0 ? (gruposValidos[0].colorTema || "#38bdf8") : "#ef4444" }}>
                {Math.max(0, gruposValidos[0].max - gruposValidos[0].gastados)}
              </span>
              <span style={{ color: "#64748b", fontSize: 11 }}> / {gruposValidos[0].max} ranuras</span>
            </div>
          )}

          {mostrarBotonRestablecer && alRestablecerTodos && (
            <button
              type="button"
              onClick={alRestablecerTodos}
              title={`Restablecer todo: ${titulo}`}
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
              <span>{etiquetaRestablecer}</span>
            </button>
          )}
        </div>
      </div>

      {/* Renderizado de Grupos de Ranuras */}
      <div
        style={{
          display: modoGrid ? "grid" : "flex",
          gridTemplateColumns: modoGrid ? "repeat(auto-fill, minmax(130px, 1fr))" : undefined,
          flexDirection: modoGrid ? undefined : "column",
          gap: 10
        }}
      >
        {gruposValidos.map((grupo) => {
          const disponibles = Math.max(0, grupo.max - grupo.gastados);
          const colorBorde = grupo.colorTema || "#818cf8";
          const colorFondo = grupo.colorTemaFondo || "#4338ca";

          return (
            <div
              key={grupo.id}
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
              {modoGrid && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 11
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#c7d2fe" }}>{grupo.etiqueta}</span>
                  <span
                    style={{
                      color: disponibles > 0 ? (grupo.colorTema || "#38bdf8") : "#ef4444",
                      fontWeight: 700,
                      fontFamily: "JetBrains Mono, monospace"
                    }}
                  >
                    {disponibles}/{grupo.max}
                  </span>
                </div>
              )}

              {/* Círculos interactivos de ranura */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {Array.from({ length: grupo.max }).map((_, idx) => {
                  const estaDisponible = idx < disponibles;
                  return (
                    <button
                      key={`${grupo.id}-slot-${idx}`}
                      type="button"
                      title={
                        soloLectura
                          ? estaDisponible
                            ? `${grupo.etiqueta}: disponible`
                            : `${grupo.etiqueta}: gastado`
                          : estaDisponible
                            ? `${grupo.etiqueta}: clic para gastar`
                            : `${grupo.etiqueta}: clic para recuperar`
                      }
                      onClick={() => {
                        if (soloLectura) return;
                        if (estaDisponible) {
                          grupo.alGastar?.();
                        } else {
                          grupo.alRecuperar?.();
                        }
                      }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: estaDisponible
                          ? `2px solid ${colorBorde}`
                          : "1px dashed rgba(148, 163, 184, 0.3)",
                        backgroundColor: estaDisponible ? colorFondo : "transparent",
                        cursor: soloLectura ? "default" : "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box"
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {pieDePagina && (
        <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>
          {pieDePagina}
        </span>
      )}
    </div>
  );
};
