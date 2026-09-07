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
          {esArma && <Swords size={18} color="#f87171" />}
          {esArmadura && <Shield size={18} color="#60a5fa" />}
          {!esArma && !esArmadura && (
            esMagico ? (
              <Sparkles size={18} color="#a855f7" />
            ) : (
              <Package size={18} color="#34d399" />
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
