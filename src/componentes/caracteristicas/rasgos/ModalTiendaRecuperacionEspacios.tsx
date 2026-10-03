import React, { useState, useMemo } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { Sparkles, RotateCcw, X, Plus, Minus, AlertCircle, Layers, Flame } from "lucide-react";
import { calcularPresupuestoRecuperacion } from "@/servicios/rasgos";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import estilos from "./ModalTiendaRecuperacionEspacios.module.css";

export interface ModalTiendaRecuperacionEspaciosProps {
  personaje: PersonajeJugador;
  rasgo: RasgoPersonaje;
  alCerrar: () => void;
  alConfirmar: (espaciosARecuperar: Record<number, number>, puntosConjuro?: number) => void;
}

export const ModalTiendaRecuperacionEspacios: React.FC<ModalTiendaRecuperacionEspaciosProps> = ({
  personaje,
  rasgo,
  alCerrar,
  alConfirmar
}) => {
  const tienePuntosConjuro = (personaje.puntosConjuroMaximos || 0) > 0;
  const puntosMaximos = personaje.puntosConjuroMaximos || 0;
  const puntosGastados = personaje.puntosConjuroGastados || 0;
  const puntosDisponibles = Math.max(0, puntosMaximos - puntosGastados);

  const [modo, setModo] = useState<"espacios" | "puntos">(
    tienePuntosConjuro ? "puntos" : "espacios"
  );

  const [seleccionadosEspacios, setSeleccionadosEspacios] = useState<Record<number, number>>({});
  const [seleccionadosPuntos, setSeleccionadosPuntos] = useState<Record<number, number>>({});

  const presupuestoTotal = useMemo(
    () => calcularPresupuestoRecuperacion(rasgo, personaje),
    [rasgo, personaje]
  );

  const nivelMaximoPermitido = rasgo.recuperarEspacios?.nivelMaximoEspacio ?? 5;

  // Analizar ranuras estándar gastadas
  const ranurasGastadas = useMemo(() => {
    const gastadosMap = personaje.espaciosConjuroGastados || {};
    const maximosMap = personaje.espaciosConjuroMaximos || {};
    const lista: Array<{ nivel: number; gastados: number; maximos: number }> = [];

    for (let lvl = 1; lvl <= nivelMaximoPermitido; lvl++) {
      const max = maximosMap[String(lvl)] || 0;
      const gast = gastadosMap[String(lvl)] || 0;
      if (max > 0) {
        lista.push({
          nivel: lvl,
          gastados: gast,
          maximos: max
        });
      }
    }
    return lista;
  }, [personaje.espaciosConjuroGastados, personaje.espaciosConjuroMaximos, nivelMaximoPermitido]);

  // Cálculo de coste y presupuesto restante para Espacios
  const presupuestoGastadoEspacios = useMemo(() => {
    return Object.entries(seleccionadosEspacios).reduce((total, [lvlStr, cantidad]) => {
      const lvl = Number(lvlStr);
      return total + lvl * (cantidad || 0);
    }, 0);
  }, [seleccionadosEspacios]);

  // Cálculo de coste y presupuesto restante para Puntos
  const presupuestoGastadoPuntos = useMemo(() => {
    return Object.entries(seleccionadosPuntos).reduce((total, [lvlStr, cantidad]) => {
      const lvl = Number(lvlStr);
      return total + lvl * (cantidad || 0);
    }, 0);
  }, [seleccionadosPuntos]);

  const presupuestoGastadoActual = modo === "puntos" ? presupuestoGastadoPuntos : presupuestoGastadoEspacios;
  const presupuestoRestante = presupuestoTotal - presupuestoGastadoActual;

  const totalEspaciosARecuperar = useMemo(() => {
    return Object.values(seleccionadosEspacios).reduce((acc, c) => acc + (c || 0), 0);
  }, [seleccionadosEspacios]);

  const totalPuntosARecuperar = useMemo(() => {
    const totalCalculado = Object.entries(seleccionadosPuntos).reduce((total, [lvlStr, cantidad]) => {
      const lvl = Number(lvlStr);
      const puntosPorPaquete = COSTE_PUNTOS_POR_NIVEL[lvl] ?? lvl;
      return total + puntosPorPaquete * (cantidad || 0);
    }, 0);
    return Math.min(puntosGastados, totalCalculado);
  }, [seleccionadosPuntos, puntosGastados]);

  // Manejo de incremento y decremento de Espacios
  const manejarIncrementarEspacio = (nivel: number, maxDisponibles: number) => {
    const actual = seleccionadosEspacios[nivel] || 0;
    if (actual >= maxDisponibles) return;
    if (presupuestoRestante < nivel) return;

    setSeleccionadosEspacios((prev) => ({
      ...prev,
      [nivel]: actual + 1
    }));
  };

  const manejarDecrementarEspacio = (nivel: number) => {
    const actual = seleccionadosEspacios[nivel] || 0;
    if (actual <= 0) return;

    setSeleccionadosEspacios((prev) => {
      const nueva = { ...prev };
      if (actual === 1) {
        delete nueva[nivel];
      } else {
        nueva[nivel] = actual - 1;
      }
      return nueva;
    });
  };

  // Manejo de incremento y decremento de Puntos de Conjuro
  const manejarIncrementarPuntos = (nivel: number) => {
    if (presupuestoRestante < nivel) return;
    if (totalPuntosARecuperar >= puntosGastados) return;

    const actual = seleccionadosPuntos[nivel] || 0;
    setSeleccionadosPuntos((prev) => ({
      ...prev,
      [nivel]: actual + 1
    }));
  };

  const manejarDecrementarPuntos = (nivel: number) => {
    const actual = seleccionadosPuntos[nivel] || 0;
    if (actual <= 0) return;

    setSeleccionadosPuntos((prev) => {
      const nueva = { ...prev };
      if (actual === 1) {
        delete nueva[nivel];
      } else {
        nueva[nivel] = actual - 1;
      }
      return nueva;
    });
  };

  const manejarConfirmar = () => {
    if (modo === "puntos") {
      if (totalPuntosARecuperar <= 0) return;
      alConfirmar({}, totalPuntosARecuperar);
    } else {
      if (totalEspaciosARecuperar <= 0) return;
      alConfirmar(seleccionadosEspacios, 0);
    }
    alCerrar();
  };

  const hayRanurasGastadasRecuperables = ranurasGastadas.some((r) => r.gastados > 0);
  const puedeConfirmar = modo === "puntos" ? totalPuntosARecuperar > 0 : totalEspaciosARecuperar > 0;

  return (
    <div className={estilos.overlay} role="dialog" aria-modal="true" aria-labelledby="titulo-tienda-recuperacion">
      <div className={estilos.modal}>
        {/* Cabecera */}
        <div className={estilos.cabecera}>
          <h2 id="titulo-tienda-recuperacion" className={estilos.titulo}>
            <Sparkles size={18} color="#c084fc" />
            <span>Recuperación de Magia: {rasgo.nombre}</span>
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

        {/* Cuerpo */}
        <div className={estilos.cuerpo}>
          {/* Conmutador de modo si el personaje tiene puntos de conjuro y/o espacios */}
          {tienePuntosConjuro && (
            <div className={estilos.selectorModo}>
              <button
                type="button"
                className={`${estilos.botonModo} ${modo === "puntos" ? estilos.botonModoActivo : ""}`}
                onClick={() => setModo("puntos")}
              >
                <Flame size={14} color="#38bdf8" />
                <span>Puntos de Conjuro</span>
              </button>
              <button
                type="button"
                className={`${estilos.botonModo} ${modo === "espacios" ? estilos.botonModoActivo : ""}`}
                onClick={() => setModo("espacios")}
              >
                <Layers size={14} color="#c084fc" />
                <span>Espacios de Conjuro</span>
              </button>
            </div>
          )}

          <p className={estilos.descripcion}>
            {modo === "puntos"
              ? `Canjea tu presupuesto de recuperación para restablecer puntos de conjuro según las equivalencias de nivel (máximo nivel ${nivelMaximoPermitido}).`
              : `Selecciona los espacios de conjuro que deseas recuperar. La suma de los niveles no puede superar tu presupuesto (máximo nivel ${nivelMaximoPermitido}).`}
          </p>

          {/* Tarjeta de presupuesto */}
          <div className={estilos.tarjetaPresupuesto}>
            <div className={estilos.itemPresupuesto}>
              <span className={estilos.etiquetaPresupuesto}>Presupuesto Total</span>
              <span className={estilos.valorPresupuesto}>{presupuestoTotal}</span>
            </div>
            <div className={estilos.itemPresupuesto}>
              <span className={estilos.etiquetaPresupuesto}>Asignado</span>
              <span className={estilos.valorPresupuesto}>{presupuestoGastadoActual}</span>
            </div>
            <div className={estilos.itemPresupuesto}>
              <span className={estilos.etiquetaPresupuesto}>Restante</span>
              <span
                className={`${estilos.valorPresupuesto} ${
                  presupuestoRestante > 0 ? estilos.valorRestante : estilos.valorAgotado
                }`}
              >
                {presupuestoRestante}
              </span>
            </div>
          </div>

          {/* Resumen de Maná en modo puntos */}
          {modo === "puntos" && (
            <div className={estilos.resumenMana}>
              <span>
                Reserva actual:{" "}
                <strong className={estilos.valorManaResaltado}>
                  {puntosDisponibles} / {puntosMaximos} pts
                </strong>{" "}
                (Gastados: {puntosGastados})
              </span>
              <span>
                Recuperando: <strong className={estilos.valorManaResaltado}>+{totalPuntosARecuperar} pts</strong>
              </span>
            </div>
          )}

          {/* Sección Modo PUNTOS DE CONJURO */}
          {modo === "puntos" && (
            <div className={estilos.seccionRanuras}>
              <h3 className={estilos.tituloSeccion}>Equivalencias de Puntos de Conjuro</h3>

              {puntosGastados === 0 && (
                <div className={estilos.alerta}>
                  <AlertCircle size={16} />
                  <span>Tu reserva de puntos de conjuro ya está al máximo ({puntosMaximos} pts).</span>
                </div>
              )}

              {[1, 2, 3, 4, 5].slice(0, nivelMaximoPermitido).map((lvl) => {
                const puntosPorPaquete = COSTE_PUNTOS_POR_NIVEL[lvl] ?? lvl;
                const seleccionado = seleccionadosPuntos[lvl] || 0;
                const puedeSumar =
                  puntosGastados > totalPuntosARecuperar && presupuestoRestante >= lvl;
                const puedeRestar = seleccionado > 0;

                return (
                  <div key={`pto-nv-${lvl}`} className={estilos.filaRanura}>
                    <div className={estilos.infoRanura}>
                      <span className={estilos.insigniaPuntos}>+{puntosPorPaquete} pts</span>
                      <div className={estilos.detalleRanura}>
                        <span className={estilos.textoRanura}>Equivalente Nivel {lvl}</span>
                        <span className={estilos.textoEstadoRanura}>
                          Coste de presupuesto: {lvl} {lvl === 1 ? "punto" : "puntos"}
                        </span>
                      </div>
                    </div>

                    <div className={estilos.controlesRanura}>
                      <button
                        type="button"
                        className={estilos.botonControl}
                        onClick={() => manejarDecrementarPuntos(lvl)}
                        disabled={!puedeRestar}
                        title={`Quitar paquete de nivel ${lvl}`}
                        aria-label={`Quitar paquete nivel ${lvl}`}
                      >
                        <Minus size={14} />
                      </button>

                      <span className={estilos.cantidadSeleccionada}>{seleccionado}</span>

                      <button
                        type="button"
                        className={estilos.botonControl}
                        onClick={() => manejarIncrementarPuntos(lvl)}
                        disabled={!puedeSumar}
                        title={
                          totalPuntosARecuperar >= puntosGastados
                            ? "Ya has cubierto la totalidad de puntos de conjuro gastados"
                            : presupuestoRestante < lvl
                            ? `Presupuesto insuficiente (se requieren ${lvl} puntos)`
                            : `Recuperar +${puntosPorPaquete} puntos de conjuro (coste ${lvl})`
                        }
                        aria-label={`Añadir paquete nivel ${lvl}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sección Modo ESPACIOS DE CONJURO */}
          {modo === "espacios" && (
            <div className={estilos.seccionRanuras}>
              <h3 className={estilos.tituloSeccion}>Espacios de Conjuro Gastados</h3>

              {!hayRanurasGastadasRecuperables && (
                <div className={estilos.alerta}>
                  <AlertCircle size={16} />
                  <span>No tienes espacios de conjuro gastados de nivel 1 a {nivelMaximoPermitido} actualmente.</span>
                </div>
              )}

              {ranurasGastadas.map((r) => {
                const seleccionado = seleccionadosEspacios[r.nivel] || 0;
                const puedeSumar = r.gastados > seleccionado && presupuestoRestante >= r.nivel;
                const puedeRestar = seleccionado > 0;

                return (
                  <div key={`ranura-nv-${r.nivel}`} className={estilos.filaRanura}>
                    <div className={estilos.infoRanura}>
                      <span className={estilos.insigniaNivel}>Nv. {r.nivel}</span>
                      <div className={estilos.detalleRanura}>
                        <span className={estilos.textoRanura}>Nivel {r.nivel} (Coste: {r.nivel})</span>
                        <span className={estilos.textoEstadoRanura}>
                          Gastados: {r.gastados} de {r.maximos} disponibles
                        </span>
                      </div>
                    </div>

                    <div className={estilos.controlesRanura}>
                      <button
                        type="button"
                        className={estilos.botonControl}
                        onClick={() => manejarDecrementarEspacio(r.nivel)}
                        disabled={!puedeRestar}
                        title={`Quitar 1 espacio de nivel ${r.nivel}`}
                        aria-label={`Quitar espacio nivel ${r.nivel}`}
                      >
                        <Minus size={14} />
                      </button>

                      <span className={estilos.cantidadSeleccionada}>{seleccionado}</span>

                      <button
                        type="button"
                        className={estilos.botonControl}
                        onClick={() => manejarIncrementarEspacio(r.nivel, r.gastados)}
                        disabled={!puedeSumar}
                        title={
                          r.gastados <= seleccionado
                            ? "Todos los espacios gastados de este nivel ya están seleccionados"
                            : presupuestoRestante < r.nivel
                            ? `Presupuesto insuficiente (se requieren ${r.nivel} puntos)`
                            : `Recuperar 1 espacio de nivel ${r.nivel}`
                        }
                        aria-label={`Añadir espacio nivel ${r.nivel}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className={estilos.pie}>
          <button type="button" className={estilos.botonCancelar} onClick={alCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className={estilos.botonConfirmar}
            onClick={manejarConfirmar}
            disabled={!puedeConfirmar}
          >
            <RotateCcw size={14} />
            <span>
              {modo === "puntos"
                ? `Recuperar (${totalPuntosARecuperar} pts)`
                : `Recuperar (${totalEspaciosARecuperar})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
