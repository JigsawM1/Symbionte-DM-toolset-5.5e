import React from "react";
import { CheckSquare, Square } from "lucide-react";
import {
  GRUPOS_ARMAS,
  TODAS_ARMAS_SENCILLAS,
  TODAS_ARMAS_MARCIALES,
  ARMAS_DE_FUEGO,
  COMPETENCIAS_COMBATE_ESPECIALES
} from "@/constantes";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import estilos from "../HojaPersonaje.module.css";

interface PestanaArmasCompetenciasProps {
  armasGrupos: ("sencillas" | "marciales" | "fuego")[];
  armasLista: string[];
  filtroTexto: string;
  alternarGrupoArmas: (grupoId: "sencillas" | "marciales" | "fuego") => void;
  alternarArmaIndividual: (arma: string) => void;
}

export const PestanaArmasCompetencias: React.FC<PestanaArmasCompetenciasProps> = ({
  armasGrupos,
  armasLista,
  filtroTexto,
  alternarGrupoArmas,
  alternarArmaIndividual
}) => {
  const filtro = filtroTexto.trim().toLowerCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Checkboxes maestros */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
          Grupos Maestros de Armas
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GRUPOS_ARMAS.map((g) => {
            const check = armasGrupos.includes(g.id as ("sencillas" | "marciales" | "fuego"));
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => alternarGrupoArmas(g.id as ("sencillas" | "marciales" | "fuego"))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  color: check ? "#f1f5f9" : "#94a3b8",
                  border: check ? "1px solid rgba(148, 163, 184, 0.3)" : "1px solid rgba(148, 163, 184, 0.12)",
                  backgroundColor: check ? "#18202e" : "#111622"
                }}
              >
                {check ? <CheckSquare size={14} color="#93c5fd" /> : <Square size={14} color="#64748b" />}
                <span>{g.etiqueta}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Armas Individuales */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
          Armas Individuales ({armasLista.length} seleccionadas)
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 6,
            padding: 8,
            backgroundColor: "#0d121c",
            borderRadius: 6,
            border: "1px solid rgba(148, 163, 184, 0.12)"
          }}
        >
          {[...COMPETENCIAS_COMBATE_ESPECIALES, ...TODAS_ARMAS_SENCILLAS, ...TODAS_ARMAS_MARCIALES, ...ARMAS_DE_FUEGO]
            .filter((a) => coincideBusquedaTolerante(a, filtro))
            .map((arma) => {
              const check = armasLista.includes(arma);
              return (
                <label
                  key={arma}
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
                    onChange={() => alternarArmaIndividual(arma)}
                  />
                  <span>{arma}</span>
                </label>
              );
            })}
        </div>
      </div>
    </div>
  );
};
