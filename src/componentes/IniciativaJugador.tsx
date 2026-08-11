import React, { useEffect, useRef } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { obtenerDetalleCondicion } from "../servicios/resolutorCondiciones";
import { Users, Swords, ShieldAlert, Heart } from "lucide-react";
import estilos from "./IniciativaJugador.module.css";

export const IniciativaJugador: React.FC = () => {
  const colaIniciativa = usarAlmacenDM((s) => s.colaIniciativa);
  const indiceTurnoActivo = usarAlmacenDM((s) => s.indiceTurnoActivo);
  const rondaActual = usarAlmacenDM((s) => s.rondaActual);
  const mostrarPorcentajeVidaAJugadores = usarAlmacenDM((s) => s.mostrarPorcentajeVidaAJugadores);

  const refContenedorScroll = useRef<HTMLDivElement>(null);

  // Auto-scroll suave al combatiente activo al cambiar de turno
  useEffect(() => {
    if (refContenedorScroll.current) {
      const elementoActivo = refContenedorScroll.current.querySelector('[data-turno-activo="true"]');
      if (elementoActivo) {
        elementoActivo.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [indiceTurnoActivo]);

  return (
    <div className={estilos.contenedorIniciativa} ref={refContenedorScroll}>
      {/* Encabezado del Tracker del Jugador */}
      <div className={estilos.encabezadoTracker}>
        <div className={estilos.tituloArea}>
          <Users size={20} className={estilos.iconoTitulo} />
          <h2 className={estilos.tituloTexto}>Tracker de Iniciativa y Combate</h2>
        </div>

        <div className={estilos.insigniaRonda}>
          <span>Ronda Actual:</span>
          <strong className={estilos.numeroRonda}>{rondaActual}</strong>
        </div>
      </div>

      {/* Lista Principal de Combate */}
      <div className={estilos.cuerpoLista}>
        {colaIniciativa.length > 0 ? (
          <div className={estilos.cuadriculaCombate}>
            {colaIniciativa.map((item, index) => {
              const esTurnoActual = index === indiceTurnoActivo;
              const hpActual = item.vidaActual ?? item.vidaMaxima ?? 100;
              const hpMaximo = item.vidaMaxima ?? 100;
              const porcentaje = Math.max(0, Math.min(100, Math.round((hpActual / hpMaximo) * 100)));
              const colorVida = porcentaje > 50 ? "#34d399" : porcentaje > 25 ? "#fbbf24" : "#ef4444";
              const estadoTexto = porcentaje > 50 ? "Saludable" : porcentaje > 0 ? "Herido" : "Inconsciente";

              const efectosActivos = [
                ...(item.condiciones || []),
                ...(item.efectos || []).map((e) => e.nombre)
              ];

              return (
                <div
                  key={item.id}
                  data-turno-activo={esTurnoActual}
                  className={`${estilos.tarjetaCriatura} ${esTurnoActual ? estilos.turnoActivo : ""}`}
                >
                  {/* Fila Superior: Posición, Nombre e Iniciativa */}
                  <div className={estilos.filaEncabezadoCriatura}>
                    <div className={estilos.nombreContenedor}>
                      {esTurnoActual && <Swords size={16} className={estilos.iconoTurnoActivo} />}
                      <span className={estilos.posicionTexto}>#{index + 1}</span>
                      <h3 className={estilos.nombreCriatura}>{item.nombre}</h3>
                    </div>

                    <div className={estilos.iniciativaBadge}>
                      <span>Init:</span>
                      <strong>{item.iniciativa}</strong>
                    </div>
                  </div>

                  {/* Fila Central: Barra de Salud (Configurable por DM) */}
                  <div className={estilos.seccionSalud}>
                    <div className={estilos.saludTextoFila}>
                      <span className={estilos.saludEtiqueta}>
                        <Heart size={12} /> Estado de Salud
                      </span>
                      <strong style={{ color: colorVida }}>
                        {mostrarPorcentajeVidaAJugadores ? `${porcentaje}%` : estadoTexto}
                      </strong>
                    </div>

                    {mostrarPorcentajeVidaAJugadores && (
                      <div className={estilos.barraVidaContenedor}>
                        <div
                          className={estilos.barraVidaRelleno}
                          style={{ width: `${porcentaje}%`, backgroundColor: colorVida }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Fila Inferior: Condiciones y Efectos Activos con Hover Tooltip */}
                  {efectosActivos.length > 0 && (
                    <div className={estilos.seccionCondiciones}>
                      {efectosActivos.map((cond, cIdx) => {
                        const detalle = obtenerDetalleCondicion(cond);

                        return (
                          <div key={cIdx} className={estilos.contenedorInsignia}>
                            <div className={estilos.insigniaCondicion}>
                              <ShieldAlert size={12} style={{ color: "#f87171" }} />
                              <span>{cond}</span>
                            </div>

                            {/* Tooltip UI Flotante para CEF TaleSpire */}
                            <div className={estilos.tooltipFlotante}>
                              <div className={estilos.tooltipTitulo}>{detalle.titulo}</div>
                              <div className={estilos.tooltipDesc}>{detalle.descripcion}</div>
                              {detalle.efectos && detalle.efectos.length > 0 && (
                                <ul className={estilos.listaEfectosTooltip}>
                                  {detalle.efectos.map((ef, efIdx) => (
                                    <li key={efIdx}>{ef}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={estilos.estadoVacio}>
            <Users size={32} className={estilos.iconoVacio} />
            <p className={estilos.textoVacio}>No hay criaturas ni combate activo en la cola de iniciativa.</p>
          </div>
        )}
      </div>
    </div>
  );
};
