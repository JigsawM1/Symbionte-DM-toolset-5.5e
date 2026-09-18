import React, { useMemo } from "react";
import { Sparkles, Zap, RotateCcw, X, BookOpen } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import { logger } from "@/utiles/logger";
import styles from "./PanelConjurosPersonaje.module.css";

interface SeccionArcanoMisticoProps {
  arcanoMisticoIds: string[];
  arcanoMisticoGastados: string[];
  nivelesDisponibles: number[];
  baseDatosHechizos: HechizoBase[];
  nombrePersonaje: string;
  bonoAtaqueMagico?: number;
  cdConjuros?: number;
  alAsignarArcano: (nivel: number, hechizoId: string) => void;
  alQuitarArcano: (nivel: number) => void;
  alGastarArcano: (nivel: number) => void;
  alRecuperarArcano: (nivel: number) => void;
  alAbrirFichaHechizo?: (hechizo: HechizoBase) => void;
  alLanzar?: (solicitud: { modo: "arcanoMistico"; hechizo: HechizoBase; nivelLanzamiento: number }) => Promise<boolean | void>;
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
}

export const SeccionArcanoMistico: React.FC<SeccionArcanoMisticoProps> = ({
  arcanoMisticoIds,
  arcanoMisticoGastados,
  nivelesDisponibles,
  baseDatosHechizos,
  nombrePersonaje,
  bonoAtaqueMagico = 0,
  cdConjuros: _cdConjuros,
  alAsignarArcano,
  alQuitarArcano,
  alGastarArcano,
  alRecuperarArcano,
  alAbrirFichaHechizo,
  alLanzar,
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura
}) => {
  // Mapear los arcanos asignados por nivel
  const arcanosPorNivel = useMemo(() => {
    const mapa: Record<number, HechizoBase | null> = {};
    for (const lvl of nivelesDisponibles) {
      mapa[lvl] = null;
    }

    for (const entrada of arcanoMisticoIds) {
      if (entrada.includes(":")) {
        const [lvlStr, hechizoId] = entrada.split(":");
        const lvl = Number(lvlStr);
        const hechizo = baseDatosHechizos.find(
          (h) => h.id === hechizoId || h.nombre.toLowerCase() === hechizoId.toLowerCase()
        );
        if (hechizo) {
          mapa[lvl] = hechizo;
        }
      } else {
        // Fallback por ID directo buscando el nivel del hechizo
        const hechizo = baseDatosHechizos.find((h) => h.id === entrada);
        if (hechizo && nivelesDisponibles.includes(hechizo.nivel)) {
          mapa[hechizo.nivel] = hechizo;
        }
      }
    }

    return mapa;
  }, [arcanoMisticoIds, nivelesDisponibles, baseDatosHechizos]);

  if (!nivelesDisponibles || nivelesDisponibles.length === 0) {
    return null;
  }

  const lanzarArcano = async (nivel: number, hechizo: HechizoBase) => {
    const estaGastado = arcanoMisticoGastados.includes(String(nivel));
    if (estaGastado || bloqueadoPorArmadura) {
      return;
    }

    if (alLanzar) {
      await alLanzar({
        modo: "arcanoMistico",
        hechizo,
        nivelLanzamiento: nivel
      });
      return;
    }

    const nombrePj = nombrePersonaje.trim() || "Brujo";

    let formula = "";
    if (hechizo.dadosDaño) {
      formula = `!Daño (${hechizo.nombre}):${hechizo.dadosDaño}`;
    } else if (hechizo.requiereAtaque || hechizo.ataqueCd?.toLowerCase().includes("ataque")) {
      const signo = bonoAtaqueMagico >= 0 ? "+" : "";
      formula = `!Ataque (${hechizo.nombre}):1d20${signo}${bonoAtaqueMagico}`;
    } else {
      formula = `!Lanzar Arcano: ${hechizo.nombre}`;
    }

    try {
      await lanzarDadosTaleSpire(formula, `${nombrePj} - Arcano Místico Nv.${nivel} (${hechizo.nombre})`);
    } catch (err) {
      logger.error("[SeccionArcanoMistico] Error al enviar tirada a TaleSpire:", err);
    }
    alGastarArcano(nivel);
  };

  return (
    <div className={styles.contenedorArcanoMistico}>
      {/* Cabecera */}
      <div className={styles.cabeceraArcanoMistico}>
        <div className={styles.tituloArcanoFila}>
          <Sparkles size={15} color="#c084fc" />
          <span className={styles.tituloArcanoTexto}>
            Arcano Místico (Brujo)
          </span>
        </div>
        <span className={styles.subtextoReglaArcano}>
          Lanzamiento gratuito 1/día por arcano • Se recupera en descanso largo
        </span>
      </div>

      {/* Lista de Arcanos por Nivel Desbloqueado */}
      <div className={styles.listaArcanosNivel}>
        {nivelesDisponibles.map((nivel) => {
          const hechizo = arcanosPorNivel[nivel];
          const estaGastado = arcanoMisticoGastados.includes(String(nivel));

          // Conjuros disponibles de este nivel para el selector
          const opcionesHechizosNivel = baseDatosHechizos
            .filter((h) => h.nivel === nivel)
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((h) => ({
              valor: h.id,
              etiqueta: `${h.nombre} (${h.escuela || "Magia"})`
            }));

          return (
            <div
              key={`arcano-nivel-${nivel}`}
              className={styles.tarjetaFilaArcano}
              data-gastado={estaGastado ? "true" : "false"}
            >
              {/* Badge de Nivel */}
              <div className={styles.contenedorBadgeNivelArcano}>
                <span
                  className={styles.badgeNivelArcano}
                  data-gastado={estaGastado ? "true" : "false"}
                >
                  ARCANO NV. {nivel}
                </span>
              </div>

              {/* Información del Conjuro Asignado o Selector */}
              {hechizo ? (
                <div className={styles.cajaContenidoArcanoAsignado}>
                  <div
                    className={styles.triggerFichaArcano}
                    onClick={() => alAbrirFichaHechizo && alAbrirFichaHechizo(hechizo)}
                    title="Clic para ver ficha completa"
                  >
                    <BookOpen size={13} color="#93c5fd" />
                    <span
                      className={styles.nombreConjuroArcano}
                      data-gastado={estaGastado ? "true" : "false"}
                    >
                      {hechizo.nombre}
                    </span>
                    <span className={styles.metaEscuelaArcano}>
                      ({hechizo.escuela || "Magia"})
                    </span>
                  </div>

                  {/* Acciones de Lanzamiento y Estado */}
                  <div className={styles.accionesArcanoFila}>
                    {estaGastado ? (
                      <div className={styles.grupoEstadoGastadoArcano}>
                        <span className={styles.badgeGastadoHoy}>
                          Gastado hoy
                        </span>
                        <button
                          type="button"
                          onClick={() => alRecuperarArcano(nivel)}
                          title="Restaurar uso manualmente"
                          className={styles.botonRestaurarArcano}
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => lanzarArcano(nivel, hechizo)}
                        disabled={bloqueadoPorArmadura}
                        title={bloqueadoPorArmadura ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia") : undefined}
                        className={styles.botonLanzarArcano}
                      >
                        <Zap size={11} />
                        <span>Lanzar (1/día)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => alQuitarArcano(nivel)}
                      title="Cambiar o desasignar conjuro de arcano"
                      className={styles.botonQuitarArcano}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.cajaArcanoSinAsignar}>
                  <div className={styles.contenedorSelectorArcano}>
                    <SelectorDesplegable<string>
                      opciones={opcionesHechizosNivel}
                      valor=""
                      alCambiar={(nuevoId) => {
                        if (nuevoId) {
                          alAsignarArcano(nivel, nuevoId);
                        }
                      }}
                      placeholder={`Elegir conjuro Nv.${nivel}...`}
                      tamano="compacto"
                    />
                  </div>
                  <span className={styles.textoSinConjuroAsignado}>
                    Sin conjuro asignado
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
