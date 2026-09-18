import React, { useState } from "react";
import { Sparkles, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import styles from "./PanelConjurosPersonaje.module.css";

interface TrackerPuntosConjuroProps {
  puntosMaximos: number;
  puntosGastados: number;
  nivelMaximo: number;
  alGastarPuntos?: (cantidad: number) => void;
  alRecuperarPuntos?: (cantidad: number) => void;
  alRecuperarTodosPuntos?: () => void;
  mostrarBotonRestablecer?: boolean;
  mostrarGastoManual?: boolean;
}

export const TrackerPuntosConjuro: React.FC<TrackerPuntosConjuroProps> = ({
  puntosMaximos,
  puntosGastados,
  nivelMaximo,
  alGastarPuntos,
  alRecuperarPuntos,
  alRecuperarTodosPuntos,
  mostrarBotonRestablecer = false,
  mostrarGastoManual = true
}) => {
  const [mostrarTablaCostes, setMostrarTablaCostes] = useState(false);
  const [puntosPersonalizados, setPuntosPersonalizados] = useState<string>("");

  const puntosDisponibles = Math.max(0, puntosMaximos - puntosGastados);
  const porcentaje = puntosMaximos > 0 ? (puntosDisponibles / puntosMaximos) * 100 : 0;

  const manejarGastoPersonalizado = () => {
    const cant = parseInt(puntosPersonalizados, 10);
    if (!isNaN(cant) && cant > 0 && alGastarPuntos) {
      alGastarPuntos(cant);
      setPuntosPersonalizados("");
    }
  };

  const manejarRecuperacionPersonalizada = () => {
    const cant = parseInt(puntosPersonalizados, 10);
    if (!isNaN(cant) && cant > 0 && alRecuperarPuntos) {
      alRecuperarPuntos(cant);
      setPuntosPersonalizados("");
    }
  };

  return (
    <div className={styles.contenedorTrackerPuntos}>
      {/* Cabecera y Resumen */}
      <div className={styles.cabeceraTrackerPuntos}>
        <div className={styles.tituloPuntosFila}>
          <Sparkles size={15} color="#38bdf8" />
          <span className={styles.tituloPuntosTexto}>
            Puntos de Conjuro (Variante)
          </span>
        </div>

        <div className={styles.ladoDerechoCabeceraPuntos}>
          <span className={styles.textoNivelMaxPuntos}>
            Nivel Máx: <strong className={styles.resaltadoNivelMax}>{nivelMaximo}</strong>
          </span>

          {mostrarBotonRestablecer && alRecuperarTodosPuntos && (
            <button
              type="button"
              onClick={alRecuperarTodosPuntos}
              title="Restablecer todos los puntos de conjuro"
              className={styles.botonRestablecerPuntos}
            >
              <RotateCcw size={11} />
              <span>Restablecer</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Progreso y Marcador Numérico */}
      <div>
        <div className={styles.cabeceraBarraPuntos}>
          <span className={styles.etiquetaReservaMana}>Reserva de Maná</span>
          <div className={styles.marcadorNumericoPuntos}>
            <span className={puntosDisponibles > 0 ? styles.puntosDisponiblesPositivos : styles.puntosDisponiblesAgotados}>
              {puntosDisponibles}
            </span>
            <span className={styles.textoPuntosMaximos}> / {puntosMaximos} pts</span>
          </div>
        </div>

        {/* Barra visual */}
        <div className={styles.pistaBarraPuntos}>
          <div
            // eslint-disable-next-line react/forbid-dom-props -- Ancho porcentual dinámico continuo en tiempo de ejecución (0-100%)
            style={{
              width: `${Math.min(100, Math.max(0, porcentaje))}%`
            }}
            className={styles.rellenoBarraPuntos}
            data-alerta={porcentaje <= 25 ? "true" : "false"}
          />
        </div>
      </div>

      {/* Control Personalizado (Opcional) y Tabla de Referencia */}
      <div className={styles.filaAccionesPuntos}>
        {mostrarGastoManual && (
          <div className={styles.grupoGastoManualPuntos}>
            <input
              type="number"
              min={1}
              max={puntosMaximos}
              placeholder="Cant."
              value={puntosPersonalizados}
              onChange={(e) => setPuntosPersonalizados(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") manejarGastoPersonalizado();
              }}
              className={styles.inputGastoManualPuntos}
            />
            <button
              type="button"
              onClick={manejarGastoPersonalizado}
              className={styles.botonGastarPuntos}
            >
              Gastar
            </button>
            <button
              type="button"
              onClick={manejarRecuperacionPersonalizada}
              className={styles.botonRecuperarPuntos}
            >
              +Recuperar
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMostrarTablaCostes(!mostrarTablaCostes)}
          className={styles.botonAlternarTablaCostes}
        >
          <span>Tabla de Costes</span>
          {mostrarTablaCostes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Tabla Colapsable de Costes */}
      {mostrarTablaCostes && (
        <div className={styles.cajaTablaCostesPuntos}>
          <div className={styles.gridCostesPuntos}>
            {Object.entries(COSTE_PUNTOS_POR_NIVEL).map(([nv, coste]) => (
              <div key={`coste-${nv}`} className={styles.itemCosteNivel}>
                <span>Nivel {nv}:</span>
                <strong className={styles.valorCosteResaltado}>{coste} pts</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
