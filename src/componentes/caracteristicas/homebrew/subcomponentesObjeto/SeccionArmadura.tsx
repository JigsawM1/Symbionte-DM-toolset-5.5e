import React from "react";
import { TipoBonoDestreza } from "@/almacen/usarAlmacenDM";
import { Shield } from "lucide-react";

interface Props {
  oCaBase: number;
  setOCaBase: (ca: number) => void;
  oRequisitoFuerza: number | "";
  setORequisitoFuerza: (fue: number | "") => void;
  oBonoDestreza: TipoBonoDestreza;
  setOBonoDestreza: (bono: TipoBonoDestreza) => void;
  oDesventajaSigilo: boolean;
  setODesventajaSigilo: (desv: boolean) => void;
  oTiempoEquipar: string | number;
  setOTiempoEquipar: (tiempo: string | number) => void;
  estilos: Record<string, string>;
}

export const SeccionArmadura: React.FC<Props> = ({
  oCaBase,
  setOCaBase,
  oRequisitoFuerza,
  setORequisitoFuerza,
  oBonoDestreza,
  setOBonoDestreza,
  oDesventajaSigilo,
  setODesventajaSigilo,
  oTiempoEquipar,
  setOTiempoEquipar,
  estilos,
}) => {
  return (
    <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(255, 165, 0, 0.25)" }}>
      <div className={estilos.tituloBloqueDinamico}>
        <span>ATRIBUTOS DE PROTECCIÓN</span>
        <span className={estilos.subtituloInformacion}>
          <Shield size={12} style={{ display: "inline", marginRight: "2px" }} /> Ficha de Armadura
        </span>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Clase de Armadura (CA Base):</label>
          <input
            type="number"
            value={oCaBase}
            onChange={(e) => setOCaBase(parseInt(e.target.value) || 10)}
            placeholder="10"
            className={estilos.inputForm}
            min={1}
          />
        </div>

        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Requisito de Fuerza (FUE):</label>
          <input
            type="number"
            value={oRequisitoFuerza}
            onChange={(e) => setORequisitoFuerza(e.target.value === "" ? "" : parseInt(e.target.value))}
            placeholder="Ninguno"
            className={estilos.inputForm}
          />
        </div>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Bono de Destreza a la CA:</label>
          <select
            value={oBonoDestreza}
            onChange={(e) => setOBonoDestreza(e.target.value as TipoBonoDestreza)}
            className={estilos.selectForm}
          >
            <option value="Completo">Completamente Reactiva (Sin límite)</option>
            <option value="Máximo 2">Máximo +2 Destreza (Mediana)</option>
            <option value="Sin Bono">Sin bonificador de Destreza (Pesada)</option>
          </select>
        </div>

        <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
          <label className={estilos.labelCheckbox} style={{ marginTop: "16px" }}>
            <input
              type="checkbox"
              checked={oDesventajaSigilo}
              onChange={(e) => setODesventajaSigilo(e.target.checked)}
              className={estilos.checkMini}
            />
            <span>Desventaja en Sigilo</span>
          </label>
        </div>
      </div>

      {/* Tiempo para Equipar */}
      <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 165, 0, 0.1)", paddingTop: "12px" }}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Tiempo para Equipar (Don/Doff):</label>
          <input
            type="text"
            value={oTiempoEquipar}
            onChange={(e) => setOTiempoEquipar(e.target.value)}
            placeholder="Ej. 1 acción, 1 minuto, 10 minutos (Opcional)"
            className={estilos.inputForm}
          />
        </div>
      </div>
    </div>
  );
};
