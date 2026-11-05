import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import React from "react";
import { Save } from "lucide-react";
import estilos from "../HojaPersonaje.module.css";
import estilosModal from "../ModalDetalleCaracteristica.module.css";
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
    <FormularioNumerico onSubmit={manejarGuardar} className={`${estilos.contenidoPestañaModal} ${estilosModal.formularioPersonalizarContenedor}`}>
      <p className={estilosModal.textoAyudaPersonalizar}>
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
          className={`${estilos.inputFormulario} ${estilosModal.textareaPersonalizada}`}
          rows={2}
          value={descForm}
          onChange={(e) => setDescForm(e.target.value)}
          placeholder="Descripción del uso de la característica..."
          spellCheck={false}
        />
      </div>

      {/* Puntuación Base y Override Fijo */}
      <EditorPuntuacionYOverride
        valorBaseForm={valorBaseForm}
        setValorBaseForm={setValorBaseForm}
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
          <CampoNumerico
            className={estilos.inputFormulario}
            value={modExtraForm}
            alConfirmar={(valor) => setModExtraForm(String(valor))}
            placeholder="+0"
            alVaciar={() => setModExtraForm("")}
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Bono Extra a Salvaciones</label>
          <CampoNumerico
            className={estilos.inputFormulario}
            value={bonoSalvacionExtraForm}
            alConfirmar={(valor) => setBonoSalvacionExtraForm(String(valor))}
            placeholder="+0"
            alVaciar={() => setBonoSalvacionExtraForm("")}
          />
        </div>
      </div>

      {/* Competencia en Salvación */}
      <div className={estilos.campoFormulario}>
        <label className={`${estilos.labelFormulario} ${estilosModal.labelColorBlanco}`}>
          Competencia en Tiradas de Salvación
        </label>
        <label
          className={estilosModal.cajaCompetenciaSalvacion}
          data-competente={competenteSalvacionForm ? "true" : undefined}
        >
          <div className={estilosModal.infoCheckboxCompetencia}>
            <input
              type="checkbox"
              checked={competenteSalvacionForm}
              onChange={(e) => setCompetenteSalvacionForm(e.target.checked)}
            />
            <span
              className={estilosModal.textoCompetenciaSalvacion}
              data-competente={competenteSalvacionForm ? "true" : undefined}
            >
              Competente con Salvaciones de {abrev}
            </span>
          </div>
          <span
            className={estilosModal.badgeCompetenciaSalvacion}
            data-competente={competenteSalvacionForm ? "true" : undefined}
          >
            {competenteSalvacionForm ? `+${pb} PB (Total: ${bonoSalvacionPreview >= 0 ? `+${bonoSalvacionPreview}` : bonoSalvacionPreview})` : "Sin bono"}
          </span>
        </label>
      </div>

      {/* Campo Notas */}
      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario}>Notas y Rasgos Especiales</label>
        <textarea
          className={`${estilos.inputFormulario} ${estilosModal.textareaPersonalizada}`}
          rows={2}
          value={notasForm}
          onChange={(e) => setNotasForm(e.target.value)}
          placeholder="Añade notas para que no se te escape nada sobre este atributo..."
          spellCheck={false}
        />
      </div>

      {/* Botones de Pie */}
      <div className={`${estilos.pieModal} ${estilosModal.pieModalMargenTop}`}>
        <button type="button" className={estilos.neoButton} onClick={alCerrar}>
          Cancelar
        </button>
        <button
          type="submit"
          className={`${estilos.neoButton} ${estilosModal.botonGuardarPersonalizacion}`}
        >
          <Save size={14} className={estilosModal.iconoGuardarInline} />
          Guardar Personalización
        </button>
      </div>
    </FormularioNumerico>
  );
};
