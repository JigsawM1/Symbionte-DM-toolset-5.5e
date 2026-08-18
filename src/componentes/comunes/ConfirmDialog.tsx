import React from "react";

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
      style={estiloOverlay}
      onClick={onCancelar}
    >
      <div
        style={estiloContenedor}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={estiloTitulo}>
          {titulo.toUpperCase()}
        </div>
        <div style={estiloMensaje}>
          {mensaje}
        </div>
        <div style={estiloGrupoBotones}>
          <button
            onClick={onCancelar}
            style={estiloBotonCancelar}
          >
            CANCELAR
          </button>
          <button
            onClick={onConfirmar}
            style={estiloBotonConfirmar}
          >
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  );
};

const estiloOverlay: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(2, 4, 8, 0.75)",
  backdropFilter: "blur(5px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "16px",
};

const estiloContenedor: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "320px",
  backgroundColor: "rgba(9, 13, 22, 0.94)",
  border: "1px solid var(--color-borde-cian)",
  boxShadow: "0 0 25px rgba(0, 245, 212, 0.25), inset 0 0 15px rgba(0, 245, 212, 0.05)",
  borderRadius: "4px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  backdropFilter: "blur(12px)",
  padding: "16px",
  gap: "12px",
};

const estiloTitulo: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "bold",
  color: "var(--color-texto-principal)",
  letterSpacing: "0.05em",
  fontFamily: "var(--fuente-codigo)",
};

const estiloMensaje: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--color-texto-secundario)",
  lineHeight: "1.4",
};

const estiloGrupoBotones: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "4px",
};

const estiloBotonCancelar: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  border: "1px solid var(--color-borde-brutal)",
  color: "var(--color-texto-secundario)",
  padding: "4px 10px",
  fontSize: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  borderRadius: "3px",
};

const estiloBotonConfirmar: React.CSSProperties = {
  backgroundColor: "rgba(255, 0, 85, 0.15)",
  border: "1px solid var(--color-peligro)",
  color: "var(--color-peligro)",
  padding: "4px 10px",
  fontSize: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  borderRadius: "3px",
};
