import React from "react";
import { FichaHechizo } from "./hechizos/FichaHechizo";
import { HechizoBase } from "../tipos";
import estilos from "./ModalDetalleHechizo.module.css";

interface ModalDetalleHechizoProps {
  hechizo: HechizoBase;
  onClose: () => void;
}

export const ModalDetalleHechizo: React.FC<ModalDetalleHechizoProps> = ({ hechizo, onClose }) => {
  return (
    <div className={estilos.overlay} onClick={onClose}>
      <div className={estilos.modalContenedor} onClick={(e) => e.stopPropagation()}>
        <FichaHechizo hechizo={hechizo} onClose={onClose} />
      </div>
    </div>
  );
};
