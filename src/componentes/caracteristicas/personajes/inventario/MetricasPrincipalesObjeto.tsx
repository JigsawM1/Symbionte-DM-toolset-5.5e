import React from "react";
import { Weight, Coins, Zap } from "lucide-react";
import type { ObjetoInventario, ObjetoJuego, Arma, Armadura } from "@/tipos";
import estilos from "../ModalDetalleObjetoInventario.module.css";

interface MetricasPrincipalesObjetoProps {
  objeto: ObjetoInventario;
  objetoBase: ObjetoJuego | null;
  pesoTotal: number;
  pesoUnitario: number;
  valorPO: number;
  esArma: boolean;
  esArmadura: boolean;
  armaObj: Arma | null;
  armaduraObj: Armadura | null;
}

export const MetricasPrincipalesObjeto: React.FC<MetricasPrincipalesObjetoProps> = ({
  objeto,
  objetoBase,
  pesoTotal,
  pesoUnitario,
  valorPO,
  esArma,
  esArmadura,
  armaObj,
  armaduraObj
}) => {
  return (
    <div className={estilos.gridMetricas}>
      {/* Peso */}
      <div className={estilos.cajaMetrica}>
        <span className={estilos.etiquetaMetrica}>
          <Weight size={11} /> Peso
        </span>
        <strong className={estilos.valorMetrica}>
          {pesoTotal > 0 ? `${pesoTotal} lb` : "0 lb"}
          {objeto.cantidad > 1 && (
            <span className={estilos.subtextoMetrica}>
              ({pesoUnitario} c/u)
            </span>
          )}
        </strong>
      </div>

      {/* Valor */}
      <div className={estilos.cajaMetrica}>
        <span className={estilos.etiquetaMetrica}>
          <Coins size={11} /> Valor
        </span>
        <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaOro}`}>
          {objetoBase?.costoOriginal && objetoBase.costoOriginal.cantidad > 0
            ? `${objetoBase.costoOriginal.cantidad} ${objetoBase.costoOriginal.unidad}`
            : valorPO > 0
            ? `${valorPO} PO`
            : "—"}
        </strong>
      </div>

      {/* Cantidad */}
      <div className={estilos.cajaMetrica}>
        <span className={estilos.etiquetaMetrica}>
          Cantidad
        </span>
        <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaAzul}`}>
          ×{objeto.cantidad}
        </strong>
      </div>

      {/* Daño si es Arma */}
      {esArma && armaObj && (
        <div className={estilos.cajaMetrica}>
          <span className={estilos.etiquetaMetrica}>
            Daño Base
          </span>
          <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaRojo}`}>
            {armaObj.dadoDano} {armaObj.tipoDano}
          </strong>
        </div>
      )}

      {/* CA si es Armadura */}
      {esArmadura && armaduraObj && (
        <div className={estilos.cajaMetrica}>
          <span className={estilos.etiquetaMetrica}>
            Clase Armadura
          </span>
          <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaAzul}`}>
            CA {armaduraObj.caBase}
          </strong>
        </div>
      )}

      {/* Cargas si aplica */}
      {objeto.cargasMaximas !== undefined && (
        <div className={estilos.cajaMetrica}>
          <span className={estilos.etiquetaMetrica}>
            <Zap size={11} color="#fbbf24" /> Cargas
          </span>
          <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaOro}`}>
            {objeto.cargasActuales ?? objeto.cargasMaximas} / {objeto.cargasMaximas}
          </strong>
        </div>
      )}
    </div>
  );
};
