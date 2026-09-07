import React from "react";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import estilos from "../HojaPersonaje.module.css";

interface PestanaListaSimpleCompetenciasProps {
  titulo: string;
  itemsDisponibles: readonly string[];
  itemsSeleccionados: string[];
  filtroTexto: string;
  alternarItem: (item: string) => void;
  anchoMinimoColumna?: number;
}

export const PestanaListaSimpleCompetencias: React.FC<PestanaListaSimpleCompetenciasProps> = ({
  titulo,
  itemsDisponibles,
  itemsSeleccionados,
  filtroTexto,
  alternarItem,
  anchoMinimoColumna = 160
}) => {
  const filtro = filtroTexto.trim().toLowerCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
          {titulo} ({itemsSeleccionados.length} seleccionados)
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${anchoMinimoColumna}px, 1fr))`,
            gap: 6,
            padding: 8,
            backgroundColor: "#0d121c",
            borderRadius: 6,
            border: "1px solid rgba(148, 163, 184, 0.12)"
          }}
        >
          {itemsDisponibles
            .filter((item) => coincideBusquedaTolerante(item, filtro))
            .map((item) => {
              const check = itemsSeleccionados.includes(item);
              return (
                <label
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 6px",
                    borderRadius: 4,
                    backgroundColor: check ? "rgba(148, 163, 184, 0.08)" : "transparent",
                    color: check ? "#f1f5f9" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: 11,
                    userSelect: "none"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={check}
                    onChange={() => alternarItem(item)}
                  />
                  <span>{item}</span>
                </label>
              );
            })}
        </div>
      </div>
    </div>
  );
};
