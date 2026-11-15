import React, { useId } from "react";
import { Save } from "lucide-react";
import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import { usarFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import estilos from "./FormularioCriatura.module.css";
import { SeccionGeneralInvocacion } from "./subcomponentesInvocacion/SeccionGeneralInvocacion";
import { SeccionEscaladoInvocacion } from "./subcomponentesInvocacion/SeccionEscaladoInvocacion";
import { SeccionHabilidadesInvocacion } from "./subcomponentesInvocacion/SeccionHabilidadesInvocacion";

interface FormularioInvocacionProps {
  idEnEdicion: string | null;
  alGuardarExitoso: () => void;
  cancelarEdicion: () => void;
}

const PESTANAS_INVOCACION = [
  { id: "general", etiqueta: "General" },
  { id: "escalado", etiqueta: "Escalado" },
  { id: "habilidades", etiqueta: "Ataques y rasgos" }
] as const;

/**
 * Formulario de creación y edición de plantillas de invocación escalables para PJ.
 */
export const FormularioInvocacion: React.FC<FormularioInvocacionProps> = ({
  idEnEdicion,
  alGuardarExitoso,
  cancelarEdicion
}) => {
  const idAviso = useId();
  const {
    invocacionForm,
    subPestana,
    setSubPestana,
    actualizarCampo,
    actualizarCaracteristica,
    hayBorradores,
    listaVelocidades,
    listaAtaques,
    listaRasgos,
    listaAccionesAdicionales,
    listaReacciones,
    manejarGuardarInvocacion
  } = usarFormularioInvocacion(idEnEdicion, alGuardarExitoso);

  const detenerPropagacion = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <FormularioNumerico
      onSubmit={manejarGuardarInvocacion}
      onMouseDown={detenerPropagacion}
      onMouseUp={detenerPropagacion}
      onKeyDown={evento => {
        if (
          evento.key === "Enter" &&
          !evento.nativeEvent.isComposing &&
          evento.target instanceof HTMLInputElement &&
          evento.target.closest("[data-editor-fila]")
        ) evento.preventDefault();
      }}
      className={estilos.formularioBrutal}
    >
      <nav className={estilos.subPestanasCriatura} aria-label="Secciones de invocación">
        {PESTANAS_INVOCACION.map((p) => (
          <BotonNumerico
            key={p.id}
            ambito="form"
            type="button"
            onClick={() => setSubPestana(p.id)}
            aria-pressed={subPestana === p.id}
            className={estilos.subPestanaCriaturaBoton}
          >
            {p.etiqueta}
          </BotonNumerico>
        ))}
      </nav>

      <div key={subPestana} className={`${estilos.cuerpoFormulario} u-scroll-cef`}>
        {subPestana === "general" && (
          <SeccionGeneralInvocacion
            invocacionForm={invocacionForm}
            actualizarCampo={actualizarCampo}
            actualizarCaracteristica={actualizarCaracteristica}
            listaVelocidades={listaVelocidades}
          />
        )}

        {subPestana === "escalado" && (
          <SeccionEscaladoInvocacion
            invocacionForm={invocacionForm}
            actualizarCampo={actualizarCampo}
          />
        )}

        {subPestana === "habilidades" && (
          <SeccionHabilidadesInvocacion
            invocacionForm={invocacionForm}
            listaAtaques={listaAtaques}
            listaRasgos={listaRasgos}
            listaAccionesAdicionales={listaAccionesAdicionales}
            listaReacciones={listaReacciones}
          />
        )}

      </div>

      <div className={estilos.pieFormulario}>
        <div id={idAviso} role="status" className={hayBorradores ? estilos.avisoBorrador : "u-sr-only"}>
          {hayBorradores && "Confirma o cancela las filas pendientes antes de guardar la invocación."}
        </div>
        {idEnEdicion && (
          <button
            type="button"
            onClick={cancelarEdicion}
            className={estilos.botonStickyCancelar}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className={estilos.botonStickyGuardar}
          disabled={hayBorradores || !invocacionForm.nombre.trim() || !invocacionForm.conjuroAsociado.trim()}
          aria-describedby={hayBorradores ? idAviso : undefined}
        >
          <Save size={15} aria-hidden="true" />
          {idEnEdicion ? "Guardar cambios" : "Guardar en compendio"}
        </button>
      </div>
    </FormularioNumerico>
  );
};
