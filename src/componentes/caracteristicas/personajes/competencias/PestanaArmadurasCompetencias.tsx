import React from "react";
import { CheckSquare, Square } from "lucide-react";
import {
  GRUPOS_ARMADURAS,
  ARMADURAS_LIGERAS,
  ARMADURAS_MEDIAS,
  ARMADURAS_PESADAS,
  ESCUDOS
} from "@/constantes";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import estilos from "../HojaPersonaje.module.css";

interface PestanaArmadurasCompetenciasProps {
  armadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
  armadurasLista: string[];
  filtroTexto: string;
  alternarGrupoArmaduras: (grupoId: "ligeras" | "medias" | "pesadas" | "escudos") => void;
  alternarArmaduraIndividual: (armadura: string) => void;
}

export const PestanaArmadurasCompetencias: React.FC<PestanaArmadurasCompetenciasProps> = ({
  armadurasGrupos,
  armadurasLista,
  filtroTexto,
  alternarGrupoArmaduras,
  alternarArmaduraIndividual
}) => {
  const filtro = filtroTexto.trim().toLowerCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Checkboxes maestros */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
          Categorías Maestras de Armadura
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GRUPOS_ARMADURAS.map((g) => {
            const check = armadurasGrupos.includes(g.id as ("ligeras" | "medias" | "pesadas" | "escudos"));
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => alternarGrupoArmaduras(g.id as ("ligeras" | "medias" | "pesadas" | "escudos"))}
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

      {/* Lista de Armaduras Individuales */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
          Armaduras y Escudos ({armadurasLista.length} seleccionadas)
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 6,
            padding: 8,
            backgroundColor: "#0d121c",
            borderRadius: 6,
            border: "1px solid rgba(148, 163, 184, 0.12)"
          }}
        >
          {[...ARMADURAS_LIGERAS, ...ARMADURAS_MEDIAS, ...ARMADURAS_PESADAS, ...ESCUDOS]
            .filter((a) => coincideBusquedaTolerante(a, filtro))
            .map((armadura) => {
              const check = armadurasLista.includes(armadura);
              return (
                <label
                  key={armadura}
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
                    onChange={() => alternarArmaduraIndividual(armadura)}
                  />
                  <span>{armadura}</span>
                </label>
              );
            })}
        </div>
      </div>
    </div>
  );
};
