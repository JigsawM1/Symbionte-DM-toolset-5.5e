import React from "react";
import { Save } from "lucide-react";
import estilos from "../HojaPersonaje.module.css";
import { EditorPuntuacionYOverride } from "./EditorPuntuacionYOverride";

interface PestanaPersonalizarCaracteristicaProps {
  abrev: string;
  nombreCarac: string;
  nombreForm: string;
  setNombreForm: (val: string) => void;
  descForm: string;
  setDescForm: (val: string) => void;
  valorBaseForm: string;
  setValorBaseForm: (val: string) => void;
  valorBaseActual: number;
  overrideForm: string;
  setOverrideForm: (val: string) => void;
  overrideValidoPreview: number | null;
  modBasePreview: number;
  modExtraForm: string;
  setModExtraForm: (val: string) => void;
  bonoSalvacionExtraForm: string;
  setBonoSalvacionExtraForm: (val: string) => void;
  competenteSalvacionForm: boolean;
  setCompetenteSalvacionForm: (val: boolean) => void;
  bonoSalvacionPreview: number;
  pb: number;
  notasForm: string;
  setNotasForm: (val: string) => void;
  cambiarBaseDelta: (delta: number) => void;
  manejarGuardar: (e: React.FormEvent) => void;
  alCerrar: () => void;
}

export const PestanaPersonalizarCaracteristica: React.FC<PestanaPersonalizarCaracteristicaProps> = ({
  abrev,
  nombreCarac,
  nombreForm,
  setNombreForm,
  descForm,
  setDescForm,
  valorBaseForm,
  setValorBaseForm,
  valorBaseActual,
  overrideForm,
  setOverrideForm,
  overrideValidoPreview,
  modBasePreview,
  modExtraForm,
  setModExtraForm,
  bonoSalvacionExtraForm,
  setBonoSalvacionExtraForm,
  competenteSalvacionForm,
  setCompetenteSalvacionForm,
  bonoSalvacionPreview,
  pb,
  notasForm,
  setNotasForm,
  cambiarBaseDelta,
  manejarGuardar,
  alCerrar
}) => {
  return (
    <form onSubmit={manejarGuardar} className={estilos.contenidoPestañaModal} style={{ gap: 12 }}>
      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
        Personaliza el nombre a mostrar, descripción, puntuaciones base, overrides y bonificadores especiales.
      </p>

      {/* Campo Nombre Personalizado */}
      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario}>Nombre Personalizado</label>
        <input
          type="text"
          className={estilos.inputFormulario}
          value={nombreForm}
          onChange={(e) => setNombreForm(e.target.value)}
          placeholder={nombreCarac}
        />
      </div>

      {/* Campo Descripción Personalizada */}
      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario}>Descripción de Usos y Salvaciones</label>
        <textarea
          className={estilos.inputFormulario}
          rows={2}
          value={descForm}
          onChange={(e) => setDescForm(e.target.value)}
          placeholder="Descripción del uso de la característica..."
          style={{ resize: "vertical", fontSize: 11 }}
        />
      </div>

      {/* Puntuación Base y Override Fijo */}
      <EditorPuntuacionYOverride
        valorBaseForm={valorBaseForm}
        setValorBaseForm={setValorBaseForm}
        valorBaseActual={valorBaseActual}
        modBasePreview={modBasePreview}
        overrideForm={overrideForm}
        setOverrideForm={setOverrideForm}
        overrideValidoPreview={overrideValidoPreview}
        cambiarBaseDelta={cambiarBaseDelta}
      />

      {/* Fila Modificadores Adicionales */}
      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Modificador Extra a Pruebas</label>
          <input
            type="number"
            className={estilos.inputFormulario}
            value={modExtraForm}
            onChange={(e) => setModExtraForm(e.target.value)}
            placeholder="+0"
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Bono Extra a Salvaciones</label>
          <input
            type="number"
            className={estilos.inputFormulario}
            value={bonoSalvacionExtraForm}
            onChange={(e) => setBonoSalvacionExtraForm(e.target.value)}
            placeholder="+0"
          />
        </div>
      </div>

      {/* Competencia en Salvación */}
      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario} style={{ color: "#f1f5f9" }}>
          Competencia en Tiradas de Salvación
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
            backgroundColor: competenteSalvacionForm ? "#132135" : "#0d121c",
            border: competenteSalvacionForm ? "1px solid rgba(96, 165, 250, 0.3)" : "1px solid rgba(148, 163, 184, 0.14)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={competenteSalvacionForm}
              onChange={(e) => setCompetenteSalvacionForm(e.target.checked)}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: competenteSalvacionForm ? "#93c5fd" : "#cbd5e1" }}>
              Competente con Salvaciones de {abrev}
            </span>
          </div>
          <span style={{ fontSize: 10, color: competenteSalvacionForm ? "#93c5fd" : "#94a3b8", fontWeight: 700 }}>
            {competenteSalvacionForm ? `+${pb} PB (Total: ${bonoSalvacionPreview >= 0 ? `+${bonoSalvacionPreview}` : bonoSalvacionPreview})` : "Sin bono"}
          </span>
        </label>
      </div>

      {/* Campo Notas */}
      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario}>Notas y Rasgos Especiales</label>
        <textarea
          className={estilos.inputFormulario}
          rows={2}
          value={notasForm}
          onChange={(e) => setNotasForm(e.target.value)}
          placeholder="Añade notas para que no se te escape nada sobre este atributo..."
          style={{ resize: "vertical", fontSize: 11 }}
        />
      </div>

      {/* Botones de Pie */}
      <div className={estilos.pieModal} style={{ marginTop: 4 }}>
        <button type="button" className={estilos.neoButton} onClick={alCerrar}>
          Cancelar
        </button>
        <button
          type="submit"
          className={estilos.neoButton}
          style={{ backgroundColor: "#1e293b", borderColor: "rgba(96, 165, 250, 0.4)", color: "#93c5fd" }}
        >
          <Save size={14} style={{ marginRight: 4 }} />
          Guardar Personalización
        </button>
      </div>
    </form>
  );
};
