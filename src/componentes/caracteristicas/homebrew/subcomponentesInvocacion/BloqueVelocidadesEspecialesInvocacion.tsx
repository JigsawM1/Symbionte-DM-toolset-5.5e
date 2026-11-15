import React from "react";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import type { usarFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import { enfocarEditorFila } from "./focoEditorFila";
import type { VelocidadEspecialInvocacion } from "@/tipos";
import estilos from "../FormularioCriatura.module.css";

export interface BloqueVelocidadesEspecialesInvocacionProps {
  velocidadesEspeciales: VelocidadEspecialInvocacion[];
  editor: ReturnType<typeof usarFormularioInvocacion>["listaVelocidades"];
}

/**
 * Editor en sitio para velocidades especiales desbloqueadas por nivel de conjuro.
 */
export const BloqueVelocidadesEspecialesInvocacion: React.FC<BloqueVelocidadesEspecialesInvocacionProps> = ({
  velocidadesEspeciales,
  editor
}) => {
  const { itemForm, edicionIdx, actualizarCampoItem, agregarItem, iniciarEdicion, cancelarEdicion, eliminarItem } = editor;

  return (
    <div className={estilos.bloqueDinamicoForm} data-editor-fila>
      <div className={estilos.tituloBloqueDinamico}>
        {edicionIdx !== null
          ? "EDITANDO VELOCIDAD ESPECIAL"
          : `VELOCIDADES ESPECIALES POR NIVEL (${velocidadesEspeciales.length})`}
      </div>
      <div className={estilos.filaCamposAlineados}>
        <CampoNumerico
          data-campo-inicial
          identidad={`${edicionIdx ?? "nueva"}-${editor.hayBorrador}`}
          value={itemForm.nivelMinimo}
          alConfirmar={valor => actualizarCampoItem("nivelMinimo", valor)}
          min={1}
          max={9}
          tipo="entero"
          placeholder="Nv. mín."
          aria-label="Nivel mínimo de conjuro para velocidad especial"
          className={estilos.inputDinamicoMini}
        />
        <input
          type="text"
          value={itemForm.velocidadTexto}
          onChange={evento => actualizarCampoItem("velocidadTexto", evento.target.value)}
          placeholder="Ej. Volar 40 pies (planea)"
          aria-label="Texto de velocidad especial"
          className={estilos.inputDinamicoLargo}
        />
        <BotonNumerico
          ambito="[data-editor-fila]"
          type="button"
          onClick={evento => {
            if (agregarItem() && edicionIdx !== null) enfocarEditorFila(evento.currentTarget, edicionIdx);
          }}
          disabled={!itemForm.velocidadTexto.trim()}
          className={`${estilos.botonAgregarDinamico} ${edicionIdx !== null ? estilos.botonGuardarEdicion : ""}`}
          title={edicionIdx !== null ? "Guardar cambios de velocidad" : "Agregar velocidad especial"}
          aria-label={edicionIdx !== null ? "Guardar cambios de velocidad" : "Agregar velocidad especial"}
        >
          {edicionIdx !== null ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
        </BotonNumerico>
        {editor.hayBorrador && (
          <button
            type="button"
            onClick={evento => {
              cancelarEdicion();
              enfocarEditorFila(evento.currentTarget, edicionIdx);
            }}
            className={`${estilos.botonAgregarDinamico} ${estilos.botonCancelarEdicionMini}`}
            title="Cancelar edición"
            aria-label="Cancelar edición de velocidad"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {velocidadesEspeciales.length > 0 && (
        <div className={estilos.listaDinamicaVisual}>
          {velocidadesEspeciales.map((v, idx) => (
            <div key={`vel_esp_${idx}`} className={estilos.itemDinamicoVisual}>
              <span>
                <strong>Nv. {v.nivelMinimo}+</strong>: {v.velocidadTexto}
              </span>
              <div className="u-flex u-gap-xs">
                <button
                  type="button"
                  data-editar-fila={idx}
                  disabled={editor.hayBorrador && edicionIdx !== idx}
                  onClick={evento => {
                    if (edicionIdx !== idx) iniciarEdicion(idx);
                    enfocarEditorFila(evento.currentTarget);
                  }}
                  className={`${estilos.botonEliminarDinamico} ${estilos.botonEditarItemVisual}`}
                  title={`Editar velocidad de nivel ${v.nivelMinimo}+`}
                  aria-label={`Editar velocidad de nivel ${v.nivelMinimo}+`}
                >
                  <Edit2 size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => eliminarItem(idx)}
                  className={estilos.botonEliminarDinamico}
                  title={`Eliminar velocidad de nivel ${v.nivelMinimo}+`}
                  aria-label={`Eliminar velocidad de nivel ${v.nivelMinimo}+`}
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
