import React from "react";
import { Shield, Sparkles, Heart, Dices } from "lucide-react";
import estilos from "./PanelAccesibilidad.module.css";

interface PrevisualizadorAccesibilidadProps {
  titulo?: string;
}

export const PrevisualizadorAccesibilidad: React.FC<PrevisualizadorAccesibilidadProps> = ({
  titulo = "Vista Previa de Lectura Táctica"
}) => {
  return (
    <div className={estilos.tarjetaPreview}>
      <div className={estilos.previewCabecera}>
        <div className={estilos.previewIconoTitulo}>
          <Shield size={16} className={estilos.iconoAcentoPreview} />
          <span className={estilos.previewTitulo}>{titulo}</span>
        </div>
        <span className={estilos.previewBadgeNivel}>NIV 5</span>
      </div>

      <p className={estilos.previewTexto}>
        Este párrafo de prueba demuestra la legibilidad tipográfica, el tamaño de letra, el contraste cromático y el espaciado entre palabras en combate.
      </p>

      <div className={estilos.previewFilaEstadisticas}>
        <div className={estilos.previewStatBadge}>
          <Heart size={14} className={estilos.iconoVidaPreview} />
          <span className={estilos.previewStatLabel}>HP:</span>
          <strong className={estilos.previewStatValor}>48 / 48</strong>
        </div>

        <div className={estilos.previewStatBadge}>
          <Dices size={14} className={estilos.iconoDadoPreview} />
          <span className={estilos.previewStatLabel}>Ataque:</span>
          <span className={estilos.previewStatFormula}>1d20 + 7</span>
        </div>

        <div className={estilos.previewStatBadge}>
          <Sparkles size={14} className={estilos.iconoAcentoPreview} />
          <span className={estilos.previewStatLabel}>CD Salvación:</span>
          <strong className={estilos.previewStatValor}>15 Arcano</strong>
        </div>
      </div>

      <div className={estilos.previewBotonera}>
        <button type="button" className={estilos.previewBotonPrimario}>
          Acción de Combate
        </button>
        <button type="button" className={estilos.previewBotonSecundario}>
          Detalles de Conjuro
        </button>
      </div>
    </div>
  );
};

