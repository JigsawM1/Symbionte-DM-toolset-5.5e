import React, { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorSugerencias } from "@/componentes/comunes";
import {
  SUGERENCIAS_TIPO_CRIATURA,
  TAMAÑOS_CRIATURA,
  ALINEAMIENTOS_DND
} from "@/constantes/homebrewConstantes";
import { parsearVelocidad } from "@/almacen/sanitizacion";
import type { DatosFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import type { VelocidadEspecialInvocacion, VelocidadEstructurada } from "@/tipos";
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
  agregarVelocidadEspecial: (vel: VelocidadEspecialInvocacion) => void;
  eliminarVelocidadEspecial: (idx: number) => void;
}

const CARACTERISTICAS_LISTA: { clave: keyof DatosFormularioInvocacion["caracteristicas"]; etiqueta: string }[] = [
  { clave: "fuerza", etiqueta: "FUE" },
  { clave: "destreza", etiqueta: "DES" },
  { clave: "constitucion", etiqueta: "CON" },
  { clave: "inteligencia", etiqueta: "INT" },
  { clave: "sabiduria", etiqueta: "SAB" },
  { clave: "carisma", etiqueta: "CAR" }
];

/**
 * Pestaña General del formulario de invocaciones escalables para PJ.
 */
export const SeccionGeneralInvocacion: React.FC<SeccionGeneralInvocacionProps> = ({
  invocacionForm,
  actualizarCampo,
  actualizarCaracteristica,
  agregarVelocidadEspecial,
  eliminarVelocidadEspecial
}) => {
  const idCampos = useId();
  const [velNivelMin, setVelNivelMin] = useState<number>(invocacionForm.nivelMinimo || 2);
  const [velTexto, setVelTexto] = useState<string>("");

  const velBaseObj: VelocidadEstructurada =
    typeof invocacionForm.velocidadBase === "string"
      ? parsearVelocidad(invocacionForm.velocidadBase)
      : invocacionForm.velocidadBase;

  const manejarAgregarVelEspecial = () => {
    if (!velTexto.trim()) return;
    agregarVelocidadEspecial({
      nivelMinimo: Math.max(1, Math.min(9, velNivelMin)),
      velocidadTexto: velTexto.trim()
    });
    setVelTexto("");
  };

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

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-caminar`}>Velocidad Base al Caminar (pies):</label>
          <CampoNumerico
            id={`${idCampos}-caminar`}
            value={velBaseObj.caminar}
            alConfirmar={(v) => actualizarCampo("velocidadBase", { ...velBaseObj, caminar: v })}
            alVaciar={() => actualizarCampo("velocidadBase", { ...velBaseObj, caminar: 0 })}
            min={0}
            step={5}
            tipo="entero"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-sentidos`}>Sentidos:</label>
          <input
            id={`${idCampos}-sentidos`}
            type="text"
            value={invocacionForm.sentidos}
            onChange={(e) => actualizarCampo("sentidos", e.target.value)}
            placeholder="Ej. Visión en la oscuridad 60 pies, Percepción pasiva 10"
            className={estilos.inputForm}
          />
        </div>
      </div>

      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          VELOCIDADES ESPECIALES POR NIVEL ({invocacionForm.velocidadesEspeciales.length})
        </div>
        <div className={estilos.filaCamposAlineados}>
          <CampoNumerico
            value={velNivelMin}
            alConfirmar={setVelNivelMin}
            min={1}
            max={9}
            tipo="entero"
            placeholder="Nv. mín."
            className={estilos.inputDinamicoMini}
          />
          <input
            type="text"
            value={velTexto}
            onChange={(e) => setVelTexto(e.target.value)}
            placeholder="Ej. volar 40 pies (planea)"
            className={estilos.inputDinamicoLargo}
          />
          <button
            type="button"
            onClick={manejarAgregarVelEspecial}
            className={estilos.botonAgregarDinamico}
            title="Agregar velocidad especial"
          >
            <Plus size={14} />
          </button>
        </div>

        {invocacionForm.velocidadesEspeciales.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {invocacionForm.velocidadesEspeciales.map((v, idx) => (
              <div key={`vel_esp_${idx}`} className={estilos.itemDinamicoVisual}>
                <span>
                  <strong>Nv. {v.nivelMinimo}+</strong>: {v.velocidadTexto}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarVelocidadEspecial(idx)}
                  className={estilos.botonEliminarDinamico}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <div className={estilos.bloqueEstructurado}>
        <label className={estilos.labelForm}>Características Base:</label>
        <div className={estilos.gridCamposCompactos}>
          {CARACTERISTICAS_LISTA.map((c) => (
            <div key={c.clave} className={estilos.campoCompacto}>
              <label className={estilos.labelCompacto} htmlFor={`${idCampos}-${c.clave}`}>{c.etiqueta}</label>
              <CampoNumerico
                id={`${idCampos}-${c.clave}`}
                value={invocacionForm.caracteristicas[c.clave]}
                alConfirmar={(val) => actualizarCaracteristica(c.clave, val)}
                min={1}
                max={30}
                tipo="entero"
                className={estilos.inputForm}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
