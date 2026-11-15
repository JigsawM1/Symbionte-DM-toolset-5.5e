import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
import React from "react";
import { Save } from "lucide-react";
import { usarFormularioCriatura } from "@/hooks/usarFormularioCriatura";
import { SeccionGeneral } from "./subcomponentes/SeccionGeneral";
import { SeccionAtributos } from "./subcomponentes/SeccionAtributos";
import { SeccionHabilidades } from "./subcomponentes/SeccionHabilidades";
import { SeccionDefensas } from "./subcomponentes/SeccionDefensas";
import { SeccionListasAtaques } from "./subcomponentes/SeccionListasAtaques";
import estilos from "./FormularioCriatura.module.css";

interface Props {
  idEnEdicion: string | null;
  alGuardarExitoso: () => void;
  cancelarEdicion: () => void;
}

const seccionesCriatura = [
  { id: "general", etiqueta: "General" },
  { id: "atributos", etiqueta: "Atributos" },
  { id: "pericias", etiqueta: "Habilidades" },
  { id: "defensas", etiqueta: "Defensas" },
  { id: "listas", etiqueta: "Rasgos y ataques" }
] as const;

export const FormularioCriatura: React.FC<Props> = ({
  idEnEdicion,
  alGuardarExitoso,
  cancelarEdicion
}) => {
  const {
    monstruoForm,
    subPestanaCriatura,
    setSubPestanaCriatura,
    subDefensas,
    setSubDefensas,

    listaRasgos,
    listaAcciones,
    listaAccionesAdicionales,
    listaReacciones,
    listaLegendarias,
    listaQuickActions,
    danyosExtraQA,
    agregarDanoExtraQA,
    actualizarDanoExtraQA,
    eliminarDanoExtraQA,
    agregarQuickAction,
    iniciarEditarQuickAction,
    cancelarEditarQuickAction,
    preRellenarAtaqueRapido,
    actualizarGeneral,
    actualizarCaracteristica,
    actualizarSalvacion,
    actualizarHabilidad,
    alternarCheckArray,
    manejarGuardarCriatura
  } = usarFormularioCriatura(idEnEdicion, alGuardarExitoso);

  // Detener clics accidentales al lienzo 3D de TaleSpire
  const detenerPropagacion = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <FormularioNumerico
      onSubmit={manejarGuardarCriatura}
      className={estilos.formularioBrutal}
      onMouseDown={detenerPropagacion}
      onMouseUp={detenerPropagacion}
    >
      <nav className={estilos.subPestanasCriatura} aria-label="Secciones de criatura">
        {seccionesCriatura.map(({ id, etiqueta }) => (
          <button
            key={id}
            type="button"
            aria-pressed={subPestanaCriatura === id}
            onClick={() => setSubPestanaCriatura(id)}
            className={estilos.subPestanaCriaturaBoton}
          >
            {etiqueta}
          </button>
        ))}
      </nav>

      <div key={subPestanaCriatura} className={`${estilos.cuerpoFormulario} u-scroll-cef`}>
        {subPestanaCriatura === "general" && (
          <SeccionGeneral
            monstruoForm={monstruoForm}
            actualizarGeneral={actualizarGeneral}
          />
        )}

        {subPestanaCriatura === "atributos" && (
          <SeccionAtributos
            monstruoForm={monstruoForm}
            actualizarCaracteristica={actualizarCaracteristica}
            actualizarSalvacion={actualizarSalvacion}
          />
        )}

        {subPestanaCriatura === "pericias" && (
          <SeccionHabilidades
            monstruoForm={monstruoForm}
            actualizarHabilidad={actualizarHabilidad}
          />
        )}

        {subPestanaCriatura === "defensas" && (
          <SeccionDefensas
            monstruoForm={monstruoForm}
            subDefensas={subDefensas}
            setSubDefensas={setSubDefensas}
            alternarCheckArray={alternarCheckArray}
          />
        )}

        {subPestanaCriatura === "listas" && (
          <SeccionListasAtaques
            monstruoForm={monstruoForm}
            actualizarGeneral={actualizarGeneral}

            listaRasgos={listaRasgos}
            listaAcciones={listaAcciones}
            listaAccionesAdicionales={listaAccionesAdicionales}
            listaReacciones={listaReacciones}
            listaLegendarias={listaLegendarias}
            listaQuickActions={listaQuickActions}
            danyosExtraQA={danyosExtraQA}
            agregarDanoExtraQA={agregarDanoExtraQA}
            actualizarDanoExtraQA={actualizarDanoExtraQA}
            eliminarDanoExtraQA={eliminarDanoExtraQA}
            agregarQuickAction={agregarQuickAction}
            iniciarEditarQuickAction={iniciarEditarQuickAction}
            cancelarEditarQuickAction={cancelarEditarQuickAction}
            preRellenarAtaqueRapido={preRellenarAtaqueRapido}
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
          disabled={!monstruoForm.nombre?.trim()}
        >
          <Save size={15} aria-hidden="true" />
          {idEnEdicion ? "Guardar cambios" : "Guardar en compendio"}
        </button>
      </div>
    </FormularioNumerico>
  );
};
