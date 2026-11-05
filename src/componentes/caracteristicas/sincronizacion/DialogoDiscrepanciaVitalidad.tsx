/**
 * @module DialogoDiscrepanciaVitalidad
 * Diálogo táctico interactivo para que el jugador elija entre la vida anotada
 * en el combate del DM y la vida guardada en su ficha local al reconectar.
 */

import React from "react";
import { ShieldAlert } from "lucide-react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { DecisionDiscrepanciaVitalidad } from "@/tipos/protocoloSync";
import estilos from "./DialogoDiscrepanciaVitalidad.module.css";

export const DialogoDiscrepanciaVitalidad: React.FC = () => {
  const discrepancia = usarAlmacenDM((s) => s.discrepanciaVitalidadPendiente);
  const resolverDiscrepancia = usarAlmacenDM((s) => s.resolverDiscrepanciaVitalidad);

  if (!discrepancia) {
    return null;
  }

  const manejarDecision = (decision: DecisionDiscrepanciaVitalidad) => {
    resolverDiscrepancia(decision);
  };

  return (
    <div
      className={estilos.superposicionModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-discrepancia-sync"
    >
      <div className={estilos.contenedorDialogo}>
        <div className={estilos.cabecera}>
          <ShieldAlert size={20} className={estilos.iconoAlerta} />
          <h3 id="titulo-discrepancia-sync" className={estilos.titulo}>
            Discrepancia de Vitalidad Detectada
          </h3>
        </div>

        <p className={estilos.descripcion}>
          La vitalidad de <strong>{discrepancia.nombrePJ}</strong> en el combate del DM
          difiere de tu ficha local. ¿Cuál deseas aplicar?
        </p>

        <div className={estilos.comparativaGrid}>
          <div className={estilos.tarjetaValor}>
            <span className={estilos.etiquetaFuente}>Tu Ficha Local</span>
            <span className={estilos.valorPV}>{discrepancia.hpLocal} PV</span>
            {discrepancia.hpTempLocal > 0 && (
              <span className={estilos.valorTemp}>+{discrepancia.hpTempLocal} Temp</span>
            )}
          </div>

          <div className={estilos.tarjetaValor}>
            <span className={estilos.etiquetaFuente}>Combate del DM</span>
            <span className={estilos.valorPV}>{discrepancia.hpRemotoDM} PV</span>
            {discrepancia.hpTempRemotoDM > 0 && (
              <span className={estilos.valorTemp}>+{discrepancia.hpTempRemotoDM} Temp</span>
            )}
          </div>
        </div>

        <div className={estilos.accionesFila}>
          <button
            type="button"
            className={`${estilos.botonAccion} ${estilos.botonConservarLocal}`}
            onClick={() => manejarDecision("conservar_local")}
          >
            Conservar mi ficha ({discrepancia.hpLocal} PV)
          </button>

          <button
            type="button"
            className={`${estilos.botonAccion} ${estilos.botonAceptarDM}`}
            onClick={() => manejarDecision("aceptar_dm")}
          >
            Aceptar vida del DM ({discrepancia.hpRemotoDM} PV)
          </button>
        </div>
      </div>
    </div>
  );
};
