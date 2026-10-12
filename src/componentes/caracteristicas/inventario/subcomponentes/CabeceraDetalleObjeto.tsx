import React from "react";
import { X, Swords, Shield, Sparkles, Package } from "lucide-react";
import estilos from "../ModalDetalleObjetoInventario.module.css";

interface CabeceraDetalleObjetoProps {
  nombre: string;
  tipoPrincipal: string;
  subcategoria?: string;
  rareza: string;
  rarezaClass: string;
  esArma: boolean;
  esArmadura: boolean;
  esMagico: boolean;
  alCerrar: () => void;
}

export const CabeceraDetalleObjeto: React.FC<CabeceraDetalleObjetoProps> = ({
  nombre,
  tipoPrincipal,
  subcategoria,
  rareza,
  rarezaClass,
  esArma,
  esArmadura,
  esMagico,
  alCerrar
}) => {
  return (
    <div className={estilos.cabeceraModal}>
      <div className={estilos.grupoTitulo}>
        <div className={estilos.iconoTipo}>
          {esArma && <Swords size={18} color="var(--pj-texto-alerta)" />}
          {esArmadura && <Shield size={18} color="var(--pj-texto-cian)" />}
          {!esArma && !esArmadura && (
            esMagico ? (
              <Sparkles size={18} color="var(--pj-texto-magia)" />
            ) : (
              <Package size={18} color="var(--pj-texto-exito)" />
            )
          )}
        </div>
        <div>
          <h3 className={estilos.tituloModal}>{nombre}</h3>
          <div className={estilos.filaSubtitulo}>
            <span className={`${estilos.badgeMeta} ${rarezaClass}`}>
              {rareza}
            </span>
            <span className={estilos.textoSubtitulo}>
              {tipoPrincipal} {subcategoria ? `• ${subcategoria}` : ""}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={estilos.botonCerrar}
        onClick={alCerrar}
        title="Cerrar visor"
      >
        <X size={16} />
      </button>
    </div>
  );
};
