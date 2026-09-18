import React from "react";
import { Sparkles } from "lucide-react";
import estilos from "../HojaPersonaje.module.css";
import estilosModal from "../ModalDetalleCaracteristica.module.css";

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
        <div className={estilosModal.cabeceraCampoFlex}>
          <label className={`${estilos.labelFormulario} ${estilosModal.labelColorBlanco}`}>
            Puntuación Base Natural (1 - 30)
          </label>
          <span className={estilosModal.subtextoModBase}>
            Mod Base: {modBasePreview >= 0 ? `+${modBasePreview}` : modBasePreview}
          </span>
        </div>

        <div className={estilosModal.filaDeltaPuntuacion}>
          <button
            type="button"
            onClick={() => cambiarBaseDelta(-1)}
            className={estilosModal.botonDelta}
            title="Restar 1"
          >
            -
          </button>

          <input
            type="text"
            inputMode="numeric"
            className={`${estilos.inputFormulario} ${estilosModal.inputBasePuntuacion}`}
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
            placeholder="10"
          />

          <button
            type="button"
            onClick={() => cambiarBaseDelta(1)}
            className={estilosModal.botonDelta}
            title="Sumar 1"
          >
            +
          </button>
        </div>
      </div>

      {/* Override Fijo */}
      <div className={estilos.campoFormulario}>
        <div className={estilosModal.cabeceraCampoFlex}>
          <label className={`${estilos.labelFormulario} ${estilosModal.labelColorBlanco}`}>
            Override Fijo (Puntuación por Objeto Mágico)
          </label>
          {overrideValidoPreview !== null && (
            <span className={estilosModal.badgeOverrideActivo}>
              <Sparkles size={11} /> Activo: {overrideValidoPreview}
            </span>
          )}
        </div>

        <div className={estilosModal.filaDeltaPuntuacion}>
          <input
            type="text"
            inputMode="numeric"
            className={`${estilos.inputFormulario} ${estilosModal.inputOverrideFijo}`}
            data-activo={overrideValidoPreview !== null ? "true" : undefined}
            value={overrideForm}
            onChange={(e) => setOverrideForm(e.target.value)}
            placeholder="Ninguno (usar puntuación base)"
          />

          {overrideForm !== "" && (
            <button
              type="button"
              onClick={() => setOverrideForm("")}
              className={estilosModal.botonQuitarOverride}
            >
              Quitar
            </button>
          )}
        </div>

        <div className={estilosModal.filaPresetsOverride}>
          <span className={estilosModal.etiquetaPresets}>Presets:</span>
          {["19", "21", "23"].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setOverrideForm(val)}
              className={estilosModal.botonPreset}
            >
              {val} {val === "19" ? "(Ogro/Diadema)" : val === "21" ? "(Colina)" : "(Piedra)"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
