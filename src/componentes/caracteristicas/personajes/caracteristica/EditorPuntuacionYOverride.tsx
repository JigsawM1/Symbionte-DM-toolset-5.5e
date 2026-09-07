import React from "react";
import { Sparkles } from "lucide-react";
import estilos from "../HojaPersonaje.module.css";

interface EditorPuntuacionYOverrideProps {
  valorBaseForm: string;
  setValorBaseForm: (val: string) => void;
  valorBaseActual: number;
  modBasePreview: number;
  overrideForm: string;
  setOverrideForm: (val: string) => void;
  overrideValidoPreview: number | null;
  cambiarBaseDelta: (delta: number) => void;
}

export const EditorPuntuacionYOverride: React.FC<EditorPuntuacionYOverrideProps> = ({
  valorBaseForm,
  setValorBaseForm,
  valorBaseActual,
  modBasePreview,
  overrideForm,
  setOverrideForm,
  overrideValidoPreview,
  cambiarBaseDelta
}) => {
  return (
    <>
      {/* Puntuación Base */}
      <div className={estilos.campoFormulario}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className={estilos.labelFormulario} style={{ color: "#f1f5f9" }}>
            Puntuación Base Natural (1 - 30)
          </label>
          <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 700 }}>
            Mod Base: {modBasePreview >= 0 ? `+${modBasePreview}` : modBasePreview}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => cambiarBaseDelta(-1)}
            style={{
              width: 36,
              height: 34,
              borderRadius: 4,
              backgroundColor: "#18202f",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              color: "#cbd5e1",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Restar 1"
          >
            -
          </button>

          <input
            type="text"
            inputMode="numeric"
            className={estilos.inputFormulario}
            value={valorBaseForm}
            onChange={(e) => setValorBaseForm(e.target.value)}
            onBlur={() => {
              const num = parseInt(valorBaseForm, 10);
              if (!isNaN(num) && num >= 1 && num <= 30) {
                setValorBaseForm(String(num));
              } else {
                setValorBaseForm(String(valorBaseActual));
              }
            }}
            style={{
              textAlign: "center",
              fontSize: 15,
              fontWeight: 800,
              color: "#f1f5f9",
              backgroundColor: "#0b0f16",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 4,
              padding: "6px 10px",
              flex: 1
            }}
            placeholder="10"
          />

          <button
            type="button"
            onClick={() => cambiarBaseDelta(1)}
            style={{
              width: 36,
              height: 34,
              borderRadius: 4,
              backgroundColor: "#18202f",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              color: "#cbd5e1",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Sumar 1"
          >
            +
          </button>
        </div>
      </div>

      {/* Override Fijo */}
      <div className={estilos.campoFormulario}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className={estilos.labelFormulario} style={{ color: "#f1f5f9" }}>
            Override Fijo (Puntuación por Objeto Mágico)
          </label>
          {overrideValidoPreview !== null && (
            <span style={{ fontSize: 10, color: "#d8b4fe", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Sparkles size={11} /> Activo: {overrideValidoPreview}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="text"
            inputMode="numeric"
            className={estilos.inputFormulario}
            value={overrideForm}
            onChange={(e) => setOverrideForm(e.target.value)}
            placeholder="Ninguno (usar puntuación base)"
            style={{
              flex: 1,
              fontSize: 12,
              backgroundColor: "#0b0f16",
              border: overrideValidoPreview !== null ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(148, 163, 184, 0.2)",
              color: overrideValidoPreview !== null ? "#d8b4fe" : "#f1f5f9",
              borderRadius: 4,
              padding: "6px 10px"
            }}
          />

          {overrideForm !== "" && (
            <button
              type="button"
              onClick={() => setOverrideForm("")}
              style={{
                padding: "6px 10px",
                fontSize: 11,
                backgroundColor: "#18202f",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                color: "#fca5a5",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              Quitar
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
          <span style={{ fontSize: 10, color: "#94a3b8", marginRight: 2 }}>Presets:</span>
          {["19", "21", "23"].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setOverrideForm(val)}
              style={{
                padding: "2px 6px",
                fontSize: 10,
                backgroundColor: "#18202e",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                color: "#cbd5e1",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              {val} {val === "19" ? "(Ogro/Diadema)" : val === "21" ? "(Colina)" : "(Piedra)"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
