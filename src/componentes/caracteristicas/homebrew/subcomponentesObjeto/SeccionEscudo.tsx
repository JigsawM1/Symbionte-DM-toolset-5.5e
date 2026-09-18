import React from "react";
import { Shield } from "lucide-react";

interface Props {
  oCaEscudo: number;
  setOCaEscudo: (ca: number) => void;
  oDesventajaSigilo: boolean;
  setODesventajaSigilo: (desv: boolean) => void;
  estilos: Record<string, string>;
}

export const SeccionEscudo: React.FC<Props> = ({
  oCaEscudo,
  setOCaEscudo,
  oDesventajaSigilo,
  setODesventajaSigilo,
  estilos,
}) => {
  return (
    <div className={`${estilos.bloqueDinamicoForm} ${estilos.bloqueDinamicoEscudo}`}>
      <div className={estilos.tituloBloqueDinamico}>
        <span>ATRIBUTOS DEFENSIVOS DEL ESCUDO</span>
        <span className={estilos.subtituloInformacion}>
          <Shield size={12} className={estilos.iconoInline2px} /> Escudo Protector
        </span>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Bonificador / CA Base otorgada (+2 estándar):</label>
          <input
            type="number"
            value={oCaEscudo}
            onChange={(e) => setOCaEscudo(parseInt(e.target.value) || 2)}
            placeholder="2"
            className={estilos.inputForm}
            min={1}
          />
        </div>

        <div className={`${estilos.campoForm} ${estilos.campoFormCentrado}`}>
          <label className={`${estilos.labelCheckbox} ${estilos.labelCheckboxConMargen}`}>
            <input
              type="checkbox"
              checked={oDesventajaSigilo}
              onChange={(e) => setODesventajaSigilo(e.target.checked)}
              className={estilos.checkMini}
            />
            <span>Desventaja en Sigilo (P. ej. Escudo Pavés / Torre)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
