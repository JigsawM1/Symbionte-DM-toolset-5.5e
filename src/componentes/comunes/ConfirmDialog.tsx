import React from "react";
import estilos from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  abierto,
  titulo,
  mensaje,
  onConfirmar,
  onCancelar
}) => {
  if (!abierto) return null;

  return (
    <div
      className={estilos.overlay}
      onClick={onCancelar}
    >
      <div
        className={estilos.contenedor}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={estilos.titulo}>
          {titulo.toUpperCase()}
        </div>
        <div className={estilos.mensaje}>
          {mensaje}
        </div>
        <div className={estilos.grupoBotones}>
          <button
            type="button"
            onClick={onCancelar}
            className={estilos.botonCancelar}
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className={estilos.botonConfirmar}
          >
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  );
};
