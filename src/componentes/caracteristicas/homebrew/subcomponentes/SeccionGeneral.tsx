import { useId } from "react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import React from "react";
import { Shield, Heart } from "lucide-react";
import estilos from "../FormularioCriatura.module.css";
import { VelocidadEstructurada, SentidosEstructurados } from "@/tipos";
import { parsearVelocidad, parsearSentidos } from "@/almacen/sanitizacion";
import {
  SUGERENCIAS_TIPO_CRIATURA,
  TAMAÑOS_CRIATURA,
  ALINEAMIENTOS_DND,
  SUGERENCIAS_CR_CRIATURA
} from "@/constantes/homebrewConstantes";
import { SelectorSugerencias } from "@/componentes/comunes";
import { EditorVelocidadSentidos } from "./EditorVelocidadSentidos";

interface SeccionGeneralProps {
  monstruoForm: {
    nombre: string;
    tipo: string;
    tamaño?: string;
    alineacion?: string;
    ca: number;
    caNotas?: string;
    vidaMaxima: number;
    vidaNotas?: string;
    iniciativaBonificador?: number;
    velocidad?: string | VelocidadEstructurada;
    desafio?: string;
    fuente?: string;
    sentidos?: string | SentidosEstructurados;
    idiomas?: string;
    equipo?: string;
    tesoros?: string;
  };
  actualizarGeneral: (campo: string, valor: unknown) => void;
}

export const SeccionGeneral: React.FC<SeccionGeneralProps> = ({
  monstruoForm,
  actualizarGeneral
}) => {
  const idCampos = useId();
  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-nombre`}>Nombre del Monstruo:</label>
          <input
            id={`${idCampos}-nombre`}
            type="text"
            value={monstruoForm.nombre}
            onChange={(e) => actualizarGeneral("nombre", e.target.value)}
            placeholder="Ej. Siervo de Vampiro"
            className={estilos.inputForm}
            required
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-tipo`}>Tipo de Criatura:</label>
          <SelectorSugerencias
            id={`${idCampos}-tipo`}
            valor={monstruoForm.tipo}
            alCambiar={(val) => actualizarGeneral("tipo", val)}
            opciones={SUGERENCIAS_TIPO_CRIATURA}
            placeholder="Ej. Humanoide, Aberración..."
          />
        </div>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-tamano`}>Tamaño:</label>
          <SelectorSugerencias
            id={`${idCampos}-tamano`}
            valor={monstruoForm.tamaño || ""}
            alCambiar={(val) => actualizarGeneral("tamaño", val)}
            opciones={TAMAÑOS_CRIATURA}
            placeholder="Ej. Mediano, Mediano o Pequeño"
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-alineamiento`}>Alineamiento / Alineación:</label>
          <SelectorSugerencias
            id={`${idCampos}-alineamiento`}
            valor={monstruoForm.alineacion || ""}
            alCambiar={(val) => actualizarGeneral("alineacion", val)}
            opciones={ALINEAMIENTOS_DND}
            placeholder="Ej. Caótico Malvado, Sin alineamiento..."
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-ca`}>
            <Shield size={12} aria-hidden="true" /> CA
          </label>
          <CampoNumerico
            id={`${idCampos}-ca`}
            value={monstruoForm.ca}
            alConfirmar={(valor) => actualizarGeneral("ca", valor)}
            className={estilos.inputForm}
            min={1}

          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-notas-ca`}>Notas CA:</label>
          <input
            id={`${idCampos}-notas-ca`}
            type="text"
            value={monstruoForm.caNotas || ""}
            onChange={(e) => actualizarGeneral("caNotas", e.target.value)}
            placeholder="ej. natural"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-pg`}>
            <Heart size={12} aria-hidden="true" /> PG máximos
          </label>
          <CampoNumerico
            id={`${idCampos}-pg`}
            value={monstruoForm.vidaMaxima}
            alConfirmar={(valor) => actualizarGeneral("vidaMaxima", valor)}
            className={estilos.inputForm}
            min={1}

          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-notas-vida`}>Notas Vida:</label>
          <input
            id={`${idCampos}-notas-vida`}
            type="text"
            value={monstruoForm.vidaNotas || ""}
            onChange={(e) => actualizarGeneral("vidaNotas", e.target.value)}
            placeholder="ej. 8d8+16"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-iniciativa`}>Bonif. Inic:</label>
          <CampoNumerico
            id={`${idCampos}-iniciativa`}
            value={monstruoForm.iniciativaBonificador || 0}
            alConfirmar={(valor) => actualizarGeneral("iniciativaBonificador", valor)}
            className={estilos.inputForm}

          />
        </div>
      </div>
      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-desafio`}>Desafío (CR):</label>
          <SelectorSugerencias
            id={`${idCampos}-desafio`}
            valor={monstruoForm.desafio || ""}
            alCambiar={(val) => actualizarGeneral("desafio", val)}
            opciones={SUGERENCIAS_CR_CRIATURA}
            placeholder="Ej. 5, 1/2, —"
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-fuente`}>Fuente:</label>
          <input
            id={`${idCampos}-fuente`}
            type="text"
            value={monstruoForm.fuente || ""}
            onChange={(e) => actualizarGeneral("fuente", e.target.value)}
            placeholder="Ej. Manual de Monstruos"
            className={estilos.inputForm}
          />
        </div>
      </div>

      <EditorVelocidadSentidos
        velocidad={
          typeof monstruoForm.velocidad === "string"
            ? parsearVelocidad(monstruoForm.velocidad)
            : (monstruoForm.velocidad || { caminar: 30, planea: false })
        }
        sentidos={
          typeof monstruoForm.sentidos === "string"
            ? parsearSentidos(monstruoForm.sentidos)
            : (monstruoForm.sentidos || { percepcionPasiva: 10 })
        }
        alCambiarVelocidad={(nueva) => actualizarGeneral("velocidad", nueva)}
        alCambiarSentidos={(nuevos) => actualizarGeneral("sentidos", nuevos)}
      />

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm} htmlFor={`${idCampos}-idiomas`}>Idiomas:</label>
        <input
          id={`${idCampos}-idiomas`}
          type="text"
          value={monstruoForm.idiomas || ""}
          onChange={(e) => actualizarGeneral("idiomas", e.target.value)}
          placeholder="Ej. Común, Dracónico"
          className={estilos.inputForm}
        />
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-equipo`}>Equipo:</label>
          <input
            id={`${idCampos}-equipo`}
            type="text"
            value={monstruoForm.equipo || ""}
            onChange={(e) => actualizarGeneral("equipo", e.target.value)}
            placeholder="Ej. Armadura de cuero, arco corto..."
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-tesoros`}>Tesoros:</label>
          <input
            id={`${idCampos}-tesoros`}
            type="text"
            value={monstruoForm.tesoros || ""}
            onChange={(e) => actualizarGeneral("tesoros", e.target.value)}
            placeholder="Ej. Reliquias, armamento, personal..."
            className={estilos.inputForm}
          />
        </div>
      </div>
    </div>
  );
};
