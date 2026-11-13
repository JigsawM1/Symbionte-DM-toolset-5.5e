import React from "react";
import { Save } from "lucide-react";
import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
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
  const {
    invocacionForm,
    subPestana,
    setSubPestana,
    actualizarCampo,
    actualizarCaracteristica,
    agregarVelocidadEspecial,
    eliminarVelocidadEspecial,
    agregarAtaque,
    eliminarAtaque,
    agregarRasgoLista,
    eliminarRasgoLista,
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
      className={estilos.formularioBrutal}
    >
      <nav className={estilos.subPestanasCriatura} aria-label="Secciones de invocación">
        {PESTANAS_INVOCACION.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSubPestana(p.id)}
            aria-pressed={subPestana === p.id}
            className={estilos.subPestanaCriaturaBoton}
          >
            {p.etiqueta}
          </button>
        ))}
      </nav>

      <div key={subPestana} className={`${estilos.cuerpoFormulario} u-scroll-cef`}>
        {subPestana === "general" && (
          <SeccionGeneralInvocacion
            invocacionForm={invocacionForm}
            actualizarCampo={actualizarCampo}
            actualizarCaracteristica={actualizarCaracteristica}
            agregarVelocidadEspecial={agregarVelocidadEspecial}
            eliminarVelocidadEspecial={eliminarVelocidadEspecial}
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
            agregarAtaque={agregarAtaque}
            eliminarAtaque={eliminarAtaque}
            agregarRasgoLista={agregarRasgoLista}
            eliminarRasgoLista={eliminarRasgoLista}
          />
        )}

      </div>

      <div className={estilos.pieFormulario}>
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
          disabled={!invocacionForm.nombre.trim() || !invocacionForm.conjuroAsociado.trim()}
        >
          <Save size={15} aria-hidden="true" />
          {idEnEdicion ? "Guardar cambios" : "Guardar en compendio"}
        </button>
      </div>
    </FormularioNumerico>
  );
};
