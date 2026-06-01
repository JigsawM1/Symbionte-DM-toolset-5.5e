import React, { useEffect } from "react";
import { usarFormularioCriatura } from "../../hooks/usarFormularioCriatura";
import { usarAlmacenDM } from "../../almacen/usarAlmacenDM";
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

export const FormularioCriatura: React.FC<Props> = ({
  idEnEdicion,
  alGuardarExitoso,
  cancelarEdicion
}) => {
  const baseDatosMonstruos = usarAlmacenDM((s) => s.baseDatosMonstruos);

  const {
    monstruoForm,
    subPestanaCriatura,
    setSubPestanaCriatura,
    subDefensas,
    setSubDefensas,
    
    // Quick Actions
    tQNombre, setTQNombre,
    tQBono, setTQBono,
    tQDados, setTQDados,
    tQTipo, setTQTipo,
    quickActionEdicionIdx,
    agregarQuickAction,
    iniciarEditarQuickAction,
    cancelarEditarQuickAction,
    eliminarQuickActionIdx,

    // Rasgos
    tRasgoNombre, setTRasgoNombre,
    tRasgoDesc, setTRasgoDesc,
    tRasgoUso, setTRasgoUso,
    rasgoEdicionIdx,
    agregarRasgo,
    iniciarEditarRasgo,
    cancelarEditarRasgo,
    eliminarRasgoIdx,

    // Acciones
    tAccionNombre, setTAccionNombre,
    tAccionDesc, setTAccionDesc,
    tAccionBono, setTAccionBono,
    tAccionDaño, setTAccionDaño,
    tAccionUso, setTAccionUso,
    accionEdicionIdx,
    agregarAccion,
    iniciarEditarAccion,
    cancelarEditarAccion,
    eliminarAccionIdx,

    // Reacciones
    tReaccionNombre, setTReaccionNombre,
    tReaccionDesc, setTReaccionDesc,
    tReaccionUso, setTReaccionUso,
    reaccionEdicionIdx,
    agregarReaccion,
    iniciarEditarReaccion,
    cancelarEditarReaccion,
    eliminarReaccionIdx,

    // Legendarias
    tLegendariaNombre, setTLegendariaNombre,
    tLegendariaDesc, setTLegendariaDesc,
    tLegendariaUso, setTLegendariaUso,
    legendariaEdicionIdx,
    agregarLegendaria,
    iniciarEditarLegendaria,
    cancelarEditarLegendaria,
    eliminarLegendariaIdx,

    actualizarGeneral,
    actualizarCaracteristica,
    actualizarSalvacion,
    actualizarHabilidad,
    alternarCheckArray,
    cargarCriatura,
    limpiarFormulario,
    manejarGuardarCriatura
  } = usarFormularioCriatura(idEnEdicion, alGuardarExitoso);

  // Sincronizar edición con la base de datos si cambia idEnEdicion
  useEffect(() => {
    if (idEnEdicion) {
      const criatura = baseDatosMonstruos.find((c) => c.id === idEnEdicion);
      if (criatura) {
        cargarCriatura(criatura);
      }
    } else {
      limpiarFormulario();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEnEdicion])  // Detener clics accidentales al lienzo 3D de TaleSpire
  const detenerPropagacion = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <form 
      onSubmit={manejarGuardarCriatura} 
      className={estilos.formularioBrutal}
      onMouseDown={detenerPropagacion}
      onMouseUp={detenerPropagacion}
    >
      {/* Pestañas internas del creador de Criaturas */}
      <div className={estilos.subPestanasCriatura}>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("general")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "general" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("atributos")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "atributos" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          Atribs/Salv
        </button>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("pericias")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "pericias" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          Habilidades
        </button>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("defensas")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "defensas" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          Defensas
        </button>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("listas")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "listas" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          Listas/Ataques
        </button>
      </div>

      {/* Renderizado de Secciones Modulares Scoped */}
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
          
          tQNombre={tQNombre} setTQNombre={setTQNombre}
          tQBono={tQBono} setTQBono={setTQBono}
          tQDados={tQDados} setTQDados={setTQDados}
          tQTipo={tQTipo} setTQTipo={setTQTipo}
          quickActionEdicionIdx={quickActionEdicionIdx}
          agregarQuickAction={agregarQuickAction}
          iniciarEditarQuickAction={iniciarEditarQuickAction}
          cancelarEditarQuickAction={cancelarEditarQuickAction}
          eliminarQuickActionIdx={eliminarQuickActionIdx}

          tRasgoNombre={tRasgoNombre} setTRasgoNombre={setTRasgoNombre}
          tRasgoDesc={tRasgoDesc} setTRasgoDesc={setTRasgoDesc}
          tRasgoUso={tRasgoUso} setTRasgoUso={setTRasgoUso}
          rasgoEdicionIdx={rasgoEdicionIdx}
          agregarRasgo={agregarRasgo}
          iniciarEditarRasgo={iniciarEditarRasgo}
          cancelarEditarRasgo={cancelarEditarRasgo}
          eliminarRasgoIdx={eliminarRasgoIdx}

          tAccionNombre={tAccionNombre} setTAccionNombre={setTAccionNombre}
          tAccionDesc={tAccionDesc} setTAccionDesc={setTAccionDesc}
          tAccionBono={tAccionBono} setTAccionBono={setTAccionBono}
          tAccionDaño={tAccionDaño} setTAccionDaño={setTAccionDaño}
          tAccionUso={tAccionUso} setTAccionUso={setTAccionUso}
          accionEdicionIdx={accionEdicionIdx}
          agregarAccion={agregarAccion}
          iniciarEditarAccion={iniciarEditarAccion}
          cancelarEditarAccion={cancelarEditarAccion}
          eliminarAccionIdx={eliminarAccionIdx}

          tReaccionNombre={tReaccionNombre} setTReaccionNombre={setTReaccionNombre}
          tReaccionDesc={tReaccionDesc} setTReaccionDesc={setTReaccionDesc}
          tReaccionUso={tReaccionUso} setTReaccionUso={setTReaccionUso}
          reaccionEdicionIdx={reaccionEdicionIdx}
          agregarReaccion={agregarReaccion}
          iniciarEditarReaccion={iniciarEditarReaccion}
          cancelarEditarReaccion={cancelarEditarReaccion}
          eliminarReaccionIdx={eliminarReaccionIdx}

          tLegendariaNombre={tLegendariaNombre} setTLegendariaNombre={setTLegendariaNombre}
          tLegendariaDesc={tLegendariaDesc} setTLegendariaDesc={setTLegendariaDesc}
          tLegendariaUso={tLegendariaUso} setTLegendariaUso={setTLegendariaUso}
          legendariaEdicionIdx={legendariaEdicionIdx}
          agregarLegendaria={agregarLegendaria}
          iniciarEditarLegendaria={iniciarEditarLegendaria}
          cancelarEditarLegendaria={cancelarEditarLegendaria}
          eliminarLegendariaIdx={eliminarLegendariaIdx}
        />
      )}

      {/* STICKY BOTTOM BAR (Barra de Acción Flotante Consistente) */}
      <div 
        className={estilos.stickyBottomBar}
        onMouseDown={detenerPropagacion}
        onMouseUp={detenerPropagacion}
      >
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
          {idEnEdicion ? "Guardar Cambios" : "Guardar en Compendio"}
        </button>
      </div>
    </form>
  );
};
