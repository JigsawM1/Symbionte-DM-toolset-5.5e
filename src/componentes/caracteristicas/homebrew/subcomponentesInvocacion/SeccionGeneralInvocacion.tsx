import React, { useId } from "react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorSugerencias } from "@/componentes/comunes";
import {
  SUGERENCIAS_TIPO_CRIATURA,
  TAMAÑOS_CRIATURA,
  ALINEAMIENTOS_DND,
  CARACTERISTICAS_CLAVES
} from "@/constantes/homebrewConstantes";
import type { DatosFormularioInvocacion, usarFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import { EditorVelocidadSentidos } from "../subcomponentes/EditorVelocidadSentidos";
import { BloqueVelocidadesEspecialesInvocacion } from "./BloqueVelocidadesEspecialesInvocacion";
import estilos from "../FormularioCriatura.module.css";

interface SeccionGeneralInvocacionProps {
  invocacionForm: DatosFormularioInvocacion;
  actualizarCampo: <K extends keyof DatosFormularioInvocacion>(
    campo: K,
    valor: DatosFormularioInvocacion[K]
  ) => void;
  actualizarCaracteristica: (
    caract: keyof DatosFormularioInvocacion["caracteristicas"],
    valor: number
  ) => void;
  listaVelocidades: ReturnType<typeof usarFormularioInvocacion>["listaVelocidades"];
}

/**
 * Pestaña General del formulario de invocaciones escalables para PJ.
 */
export const SeccionGeneralInvocacion: React.FC<SeccionGeneralInvocacionProps> = ({
  invocacionForm,
  actualizarCampo,
  actualizarCaracteristica,
  listaVelocidades
}) => {
  const idCampos = useId();

  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-nombre`}>Nombre de la Invocación:</label>
          <input
            id={`${idCampos}-nombre`}
            type="text"
            value={invocacionForm.nombre}
            onChange={(e) => actualizarCampo("nombre", e.target.value)}
            placeholder="Ej. Espíritu Feérico"
            className={estilos.inputForm}
            required
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-conjuro`}>Conjuro Asociado:</label>
          <input
            id={`${idCampos}-conjuro`}
            type="text"
            value={invocacionForm.conjuroAsociado}
            onChange={(e) => actualizarCampo("conjuroAsociado", e.target.value)}
            placeholder="Ej. Convocar Feérico"
            className={estilos.inputForm}
            required
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-nivel-minimo`}>Nivel Mín. Conjuro:</label>
          <CampoNumerico
            id={`${idCampos}-nivel-minimo`}
            value={invocacionForm.nivelMinimo}
            alConfirmar={(v) => actualizarCampo("nivelMinimo", Math.max(1, Math.min(9, v)))}
            min={1}
            max={9}
            tipo="entero"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-nivel-maximo`}>Nivel Máx. Conjuro:</label>
          <CampoNumerico
            id={`${idCampos}-nivel-maximo`}
            value={invocacionForm.nivelMaximo}
            alConfirmar={(v) => actualizarCampo("nivelMaximo", Math.max(1, Math.min(9, v)))}
            min={1}
            max={9}
            tipo="entero"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-fuente`}>Fuente:</label>
          <input
            id={`${idCampos}-fuente`}
            type="text"
            value={invocacionForm.fuente}
            onChange={(e) => actualizarCampo("fuente", e.target.value)}
            placeholder="Ej. Homebrew"
            className={estilos.inputForm}
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-tipo`}>Tipo de Criatura:</label>
          <SelectorSugerencias
            id={`${idCampos}-tipo`}
            valor={invocacionForm.tipoCriatura}
            alCambiar={(v) => actualizarCampo("tipoCriatura", v)}
            opciones={SUGERENCIAS_TIPO_CRIATURA}
            placeholder="Ej. Feérico"
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-tamano`}>Tamaño:</label>
          <SelectorSugerencias
            id={`${idCampos}-tamano`}
            valor={invocacionForm.tamano}
            alCambiar={(v) => actualizarCampo("tamano", v)}
            opciones={TAMAÑOS_CRIATURA}
            placeholder="Ej. Mediano"
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-alineamiento`}>Alineamiento:</label>
          <SelectorSugerencias
            id={`${idCampos}-alineamiento`}
            valor={invocacionForm.alineacion}
            alCambiar={(v) => actualizarCampo("alineacion", v)}
            opciones={ALINEAMIENTOS_DND}
            placeholder="Ej. Neutral"
          />
        </div>
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm} htmlFor={`${idCampos}-subtipos`}>Subtipos Disponibles (separados por comas, opcional):</label>
        <input
          id={`${idCampos}-subtipos`}
          type="text"
          value={invocacionForm.subtiposDisponibles}
          onChange={(e) => actualizarCampo("subtiposDisponibles", e.target.value)}
          placeholder="Ej. Astuto, Furioso, Alegre"
          className={estilos.inputForm}
        />
      </div>

      <EditorVelocidadSentidos
        velocidad={invocacionForm.velocidadBase}
        sentidos={invocacionForm.sentidos}
        alCambiarVelocidad={(nueva) => actualizarCampo("velocidadBase", nueva)}
        alCambiarSentidos={(nuevos) => actualizarCampo("sentidos", nuevos)}
      />

      <BloqueVelocidadesEspecialesInvocacion
        velocidadesEspeciales={invocacionForm.velocidadesEspeciales}
        editor={listaVelocidades}
      />

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm} htmlFor={`${idCampos}-idiomas`}>Idiomas:</label>
        <input
          id={`${idCampos}-idiomas`}
          type="text"
          value={invocacionForm.idiomas}
          onChange={(e) => actualizarCampo("idiomas", e.target.value)}
          placeholder="Ej. Entiende los idiomas que tú hablas"
          className={estilos.inputForm}
        />
      </div>

      <div className={estilos.cabeceraMiniSeccion}>CARACTERÍSTICAS BASE</div>
      <div className={estilos.filaSeisForm}>
        {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => {
          const claveCaract = clave as keyof DatosFormularioInvocacion["caracteristicas"];
          const valorCaract = invocacionForm.caracteristicas[claveCaract] ?? 10;
          const modificador = Math.floor((valorCaract - 10) / 2);

          return (
            <div key={clave} className={estilos.campoMiniForm}>
              <label className={estilos.labelMiniForm} htmlFor={`${idCampos}-${clave}`}>
                {etiqueta}
              </label>
              <CampoNumerico
                id={`${idCampos}-${clave}`}
                value={valorCaract}
                alConfirmar={(val) => actualizarCaracteristica(claveCaract, val)}
                min={1}
                max={30}
                tipo="entero"
                className={estilos.inputMiniForm}
              />
              <span className={estilos.modificadorPrevisualizado}>
                {modificador >= 0 ? "+" : ""}
                {modificador}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
