import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { formatearRecargaTexto } from "@/almacen/sanitizacion";
import type { usarFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import type { RasgoInvocacion } from "@/tipos";
import { calcularFilasTextarea } from "@/utiles/formatoTextoDND";
import { enfocarEditorFila } from "./focoEditorFila";
import estilos from "../FormularioCriatura.module.css";

export interface BloqueRasgosInvocacionProps {
  titulo: string;
  tituloEditando: string;
  items: RasgoInvocacion[];
  editor: ReturnType<typeof usarFormularioInvocacion>["listaRasgos"];
  textoBotonAgregar: string;
  textoBotonGuardar: string;
}

/**
 * Bloque editor reutilizable con creación y edición en sitio para rasgos, acciones adicionales y reacciones de invocaciones.
 */
export const BloqueRasgosInvocacion: React.FC<BloqueRasgosInvocacionProps> = ({
  titulo,
  tituloEditando,
  items,
  editor,
  textoBotonAgregar,
  textoBotonGuardar
}) => {
  const {
    itemForm,
    edicionIdx,
    actualizarCampoItem,
    agregarItem,
    iniciarEdicion,
    cancelarEdicion,
    eliminarItem
  } = editor;

  const claseBotonPrincipal = `${estilos.botonAgregarCompleto} ${
    edicionIdx !== null ? estilos.botonAgregarCompletoGuardar : estilos.botonAgregarCompletoNormal
  }`;

  return (
    <div className={estilos.bloqueDinamicoForm} data-editor-fila>
      <div className={estilos.tituloBloqueDinamico}>
        {edicionIdx !== null ? tituloEditando : `${titulo} (${items.length})`}
      </div>
      <div className={estilos.camposDinamicosGrupo}>
        <div className={estilos.filaCamposAlineados}>
          <input
            type="text"
            data-campo-inicial
            value={itemForm.nombre}
            onChange={(e) => actualizarCampoItem("nombre", e.target.value)}
            placeholder="Nombre"
            aria-label={`Nombre para ${titulo.toLowerCase()}`}
            className={estilos.inputDinamicoMediano}
          />
          <input
            type="text"
            value={itemForm.subtipoRequerido ?? ""}
            onChange={(e) => actualizarCampoItem("subtipoRequerido", e.target.value)}
            placeholder="Subtipo req. (opc.)"
            aria-label={`Subtipo requerido para ${titulo.toLowerCase()}`}
            className={estilos.inputDinamicoMini}
          />
          <input
            type="text"
            value={itemForm.uso ?? ""}
            onChange={(e) => actualizarCampoItem("uso", e.target.value)}
            placeholder="Uso (ej. 1/día)"
            aria-label={`Uso para ${titulo.toLowerCase()}`}
            className={estilos.inputDinamicoMini}
          />
          <input
            type="text"
            value={itemForm.recarga ?? ""}
            onChange={(e) => actualizarCampoItem("recarga", e.target.value)}
            placeholder="Recarga (ej. 5-6)"
            aria-label={`Recarga para ${titulo.toLowerCase()}`}
            className={estilos.inputDinamicoMini}
          />
        </div>
        <textarea
          value={itemForm.descripcion}
          onChange={(e) => actualizarCampoItem("descripcion", e.target.value)}
          placeholder="Descripción (puedes usar {CD} o {NIVEL} como marcadores)..."
          aria-label={`Descripción para ${titulo.toLowerCase()}`}
          rows={calcularFilasTextarea(itemForm.descripcion, 2)}
          className={estilos.textareaDinamico}
          spellCheck={false}
        />
        <div className="u-flex u-gap-sm">
          <button
            type="button"
            onClick={evento => {
              if (agregarItem() && edicionIdx !== null) enfocarEditorFila(evento.currentTarget, edicionIdx);
            }}
            disabled={!itemForm.nombre.trim() || !itemForm.descripcion.trim()}
            className={claseBotonPrincipal}
          >
            {edicionIdx !== null ? textoBotonGuardar : textoBotonAgregar}
          </button>
          {editor.hayBorrador && (
            <button
              type="button"
              onClick={evento => {
                cancelarEdicion();
                enfocarEditorFila(evento.currentTarget, edicionIdx);
              }}
              className={`${estilos.botonAgregarCompleto} ${estilos.botonCancelarEdicionAccion}`}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className={estilos.listaDinamicaVisual}>
          {items.map((item, idx) => {
            const recargaFormateada = item.recarga ? formatearRecargaTexto(item.recarga) : "";
            const limitesTexto = [item.uso, recargaFormateada].filter(Boolean).join(" / ");

            return (
              <div key={`${titulo}_${idx}`} className={estilos.itemDinamicoVisual}>
                <div className={estilos.itemVisualCuerpo}>
                  <strong>
                    {item.nombre}
                    {item.subtipoRequerido ? ` [${item.subtipoRequerido}]` : ""}
                    {limitesTexto ? ` (${limitesTexto})` : ""}
                  </strong>
                  <div className={estilos.itemVisualDescripcion}>{item.descripcion}</div>
                </div>
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
                    title={`Editar ${item.nombre}`}
                    aria-label={`Editar ${item.nombre}`}
                  >
                    <Edit2 size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarItem(idx)}
                    className={estilos.botonEliminarDinamico}
                    title={`Eliminar ${item.nombre}`}
                    aria-label={`Eliminar ${item.nombre}`}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
