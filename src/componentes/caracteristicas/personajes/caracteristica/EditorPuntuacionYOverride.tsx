import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
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

          <CampoNumerico className={`${estilos.inputFormulario} ${estilosModal.inputBasePuntuacion}`}
            value={valorBaseForm}
            alConfirmar={(valor) => setValorBaseForm(String(valor))}
            placeholder="10" min={1} max={30} />

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
          <CampoNumerico className={`${estilos.inputFormulario} ${estilosModal.inputOverrideFijo}`}
            data-activo={overrideValidoPreview !== null ? "true" : undefined}
            value={overrideForm}
            alConfirmar={(valor) => setOverrideForm(String(valor))}
            placeholder="Ninguno (usar puntuación base)" min={1} max={30} alVaciar={() => setOverrideForm("")} />

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
