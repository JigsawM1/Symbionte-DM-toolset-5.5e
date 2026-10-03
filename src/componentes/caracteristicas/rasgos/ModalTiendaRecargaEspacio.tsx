import React, { useState, useMemo } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { Shield, RotateCcw, X, AlertCircle, Sparkles } from "lucide-react";
import estilos from "./ModalTiendaRecuperacionEspacios.module.css";

export interface ModalTiendaRecargaEspacioProps {
  personaje: PersonajeJugador;
  rasgo: RasgoPersonaje;
  alCerrar: () => void;
  alConfirmar: (nivelEspacio: number) => void;
}

export const ModalTiendaRecargaEspacio: React.FC<ModalTiendaRecargaEspacioProps> = ({
  personaje,
  rasgo,
  alCerrar,
  alConfirmar
}) => {
  const multiplicador = rasgo.multiplicadorRecargaEspacio ?? 2;

  const ranurasDisponibles = useMemo(() => {
    const gastadosMap = personaje.espaciosConjuroGastados || {};
    const maximosMap = personaje.espaciosConjuroMaximos || {};
    const lista: Array<{ nivel: number; disponibles: number; maximos: number }> = [];

    for (let lvl = 1; lvl <= 9; lvl++) {
      const max = maximosMap[String(lvl)] || 0;
      const gast = gastadosMap[String(lvl)] || 0;
      const disp = Math.max(0, max - gast);
      if (max > 0) {
        lista.push({
          nivel: lvl,
          disponibles: disp,
          maximos: max
        });
      }
    }
    return lista;
  }, [personaje.espaciosConjuroGastados, personaje.espaciosConjuroMaximos]);

  const [nivelSeleccionado, setNivelSeleccionado] = useState<number | null>(() => {
    const primeraDisponible = ranurasDisponibles.find((r) => r.disponibles > 0);
    return primeraDisponible ? primeraDisponible.nivel : null;
  });

  const pgRecuperables = nivelSeleccionado ? nivelSeleccionado * multiplicador : 0;
  const hayRanurasDisponibles = ranurasDisponibles.some((r) => r.disponibles > 0);

  const manejarConfirmar = () => {
    if (!nivelSeleccionado) return;
    alConfirmar(nivelSeleccionado);
    alCerrar();
  };

  return (
    <div className={estilos.overlay} role="dialog" aria-modal="true" aria-labelledby="titulo-tienda-recarga">
      <div className={estilos.modal}>
        <div className={estilos.cabecera}>
          <h2 id="titulo-tienda-recarga" className={estilos.titulo}>
            <Shield size={18} color="#38bdf8" />
            <span>{rasgo.nombre}: Restablecer PG</span>
          </h2>
          <button
            type="button"
            className={estilos.botonCerrar}
            onClick={alCerrar}
            title="Cerrar modal"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className={estilos.cuerpo}>
          <p className={estilos.descripcion}>
            Selecciona un espacio de conjuro disponible para gastar. Recuperarás una cantidad de puntos de golpe
            temporales igual al doble del nivel del espacio gastado ({multiplicador} x nivel).
          </p>

          <div className={estilos.tarjetaPresupuesto}>
            <div className={estilos.itemPresupuesto}>
              <span className={estilos.etiquetaPresupuesto}>Espacio Elegido</span>
              <span className={estilos.valorPresupuesto}>
                {nivelSeleccionado ? `Nivel ${nivelSeleccionado}` : "Ninguno"}
              </span>
            </div>
            <div className={estilos.itemPresupuesto}>
              <span className={estilos.etiquetaPresupuesto}>Multiplicador</span>
              <span className={estilos.valorPresupuesto}>x{multiplicador}</span>
            </div>
            <div className={estilos.itemPresupuesto}>
              <span className={estilos.etiquetaPresupuesto}>PG Temporales</span>
              <span className={`${estilos.valorPresupuesto} ${estilos.valorRestante}`}>
                +{pgRecuperables} PG
              </span>
            </div>
          </div>

          <div className={estilos.seccionRanuras}>
            <h3 className={estilos.tituloSeccion}>Espacios de Conjuro Disponibles</h3>

            {!hayRanurasDisponibles && (
              <div className={estilos.alerta}>
                <AlertCircle size={16} />
                <span>No tienes espacios de conjuro disponibles para gastar en este momento.</span>
              </div>
            )}

            {ranurasDisponibles.map((r) => {
              const esSeleccionado = nivelSeleccionado === r.nivel;
              const tieneDisponibles = r.disponibles > 0;
              const pg = r.nivel * multiplicador;

              return (
                <div
                  key={`ranura-recarga-nv-${r.nivel}`}
                  className={`${estilos.filaRanura} ${esSeleccionado ? estilos.botonModoActivo : ""}`}
                  onClick={() => {
                    if (tieneDisponibles) setNivelSeleccionado(r.nivel);
                  }}
                >
                  <div className={estilos.infoRanura}>
                    <span className={estilos.insigniaNivel}>Nv. {r.nivel}</span>
                    <div className={estilos.detalleRanura}>
                      <span className={estilos.textoRanura}>
                        Espacio de Nivel {r.nivel} (+{pg} PG Temporales)
                      </span>
                      <span className={estilos.textoEstadoRanura}>
                        Disponibles: {r.disponibles} de {r.maximos}
                      </span>
                    </div>
                  </div>

                  <div className={estilos.controlesRanura}>
                    <button
                      type="button"
                      className={estilos.botonControl}
                      disabled={!tieneDisponibles}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (tieneDisponibles) setNivelSeleccionado(r.nivel);
                      }}
                      title={`Seleccionar nivel ${r.nivel}`}
                      aria-label={`Seleccionar nivel ${r.nivel}`}
                    >
                      <Sparkles size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={estilos.pie}>
          <button type="button" className={estilos.botonCancelar} onClick={alCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className={estilos.botonConfirmar}
            onClick={manejarConfirmar}
            disabled={!nivelSeleccionado || !hayRanurasDisponibles}
          >
            <RotateCcw size={14} />
            <span>Restablecer (+{pgRecuperables} PG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
