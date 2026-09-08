import React, { useEffect, useRef } from "react";
import { usarEstadoIniciativa, usarEstadoConfiguracion } from "@/almacen/selectores";
import { ChipCondicion } from "@/componentes/comunes";
import { Users, Swords, Heart } from "lucide-react";
import estilos from "./IniciativaJugador.module.css";

export const IniciativaJugador: React.FC = () => {
  const { colaIniciativa, indiceTurnoActivo, rondaActual } = usarEstadoIniciativa();
  const { mostrarPorcentajeVidaAJugadores } = usarEstadoConfiguracion();

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

              const tieneEfectoConcentracion = (item.efectos || []).some(
                (ef) => ef.concentracion || ef.nombre.toLowerCase().startsWith("concentra")
              );
              const nombresEfectosSet = new Set<string>();
              (item.efectos || []).forEach((ef) => {
                nombresEfectosSet.add(ef.nombre.toLowerCase().trim());
                nombresEfectosSet.add(ef.nombre.split(" (")[0].toLowerCase().trim());
              });
              const condicionesVisibles = (item.condiciones || []).filter((c) => {
                const cMin = c.toLowerCase().trim();
                const cBase = c.split(" (")[0].toLowerCase().trim();
                if (tieneEfectoConcentracion && cMin.includes("concentra")) return false;
                if (nombresEfectosSet.has(cMin) || nombresEfectosSet.has(cBase)) return false;
                return true;
              });
              const efectosVisibles = item.efectos || [];
              const tieneEstados = condicionesVisibles.length > 0 || efectosVisibles.length > 0;

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

                  {/* Fila Inferior: Condiciones y Efectos Activos con Hover Tooltip y Duración */}
                  {tieneEstados && (
                    <div className={estilos.seccionCondiciones}>
                      {/* Condiciones de Estado */}
                      {condicionesVisibles.map((cond, cIdx) => (
                        <ChipCondicion
                          key={`cond-${cIdx}-${cond}`}
                          nombre={cond}
                        />
                      ))}

                      {/* Efectos Temporales y Concentración con Rondas Restantes */}
                      {efectosVisibles.map((ef) => {
                        const rondasRestantes = ef.expiraRonda !== undefined
                          ? Math.max(0, ef.expiraRonda - rondaActual)
                          : undefined;

                        return (
                          <ChipCondicion
                            key={`ef-${ef.id}`}
                            nombre={ef.nombre}
                            concentracion={ef.concentracion}
                            expiraRonda={ef.expiraRonda}
                            rondasRestantes={rondasRestantes}
                          />
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
