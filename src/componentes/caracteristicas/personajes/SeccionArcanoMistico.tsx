import React, { useMemo } from "react";
import { Sparkles, Zap, RotateCcw, X, Lock, AlertTriangle } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { logger } from "@/utiles/logger";
import styles from "./PanelConjurosPersonaje.module.css";

interface SeccionArcanoMisticoProps {
  arcanoMisticoIds: string[];
  arcanoMisticoGastados: string[];
  nivelesDisponibles: number[];
  baseDatosHechizos: HechizoBase[];
  opcionesPorNivel?: Record<number, string[]>;
  alAsignarArcano: (nivel: number, hechizoId: string) => void;
  alQuitarArcano: (nivel: number) => void;
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
  opcionesPorNivel,
  alAsignarArcano,
  alQuitarArcano,
  alRecuperarArcano,
  alAbrirFichaHechizo,
  alLanzar,
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura
}) => {
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

  const textoBloqueo = motivoBloqueoArmadura || "Bloqueado por armadura sin competencia";
  let totalAsignados = 0;
  let totalListos = 0;
  for (const n of nivelesDisponibles) {
    if (arcanosPorNivel[n]) {
      totalAsignados++;
      if (!arcanoMisticoGastados.includes(String(n))) totalListos++;
    }
  }

  // ponytail: delega siempre en alLanzar; servicioLanzamientoConjuros gestiona dados y gasto en el store.
  const lanzarArcano = async (nivel: number, hechizo: HechizoBase) => {
    if (arcanoMisticoGastados.includes(String(nivel)) || bloqueadoPorArmadura || !alLanzar) return;
    try {
      await alLanzar({ modo: "arcanoMistico", hechizo, nivelLanzamiento: nivel });
    } catch (err) {
      logger.error("[SeccionArcanoMistico] Error al lanzar Arcano Místico:", err);
    }
  };

  return (
    <div className={styles.contenedorArcanoMistico}>
      <div className={styles.cabeceraArcanoMistico}>
        <div className={styles.tituloArcanoFila}>
          <Sparkles size={15} color="var(--pj-texto-magia)" aria-hidden="true" />
          <span className={styles.tituloArcanoTexto}>Arcano Místico</span>
          <span className={styles.badgeBrujoArcano}>BRUJO</span>
        </div>

        <div className={styles.resumenArcanoDerecha}>
          <div className={styles.filaChipsNivelArcano}>
            {nivelesDisponibles.map((nivel) => {
              const hechizo = arcanosPorNivel[nivel];
              const gastado = Boolean(hechizo) && arcanoMisticoGastados.includes(String(nivel));
              const estado = !hechizo ? "vacio" : gastado ? "gastado" : "listo";
              const etiquetaEstado = !hechizo ? "sin asignar" : gastado ? "gastado hoy" : "listo";
              return (
                <span
                  key={`chip-arcano-${nivel}`}
                  className={styles.chipResumenNivelArcano}
                  data-estado={estado}
                  title={`Arcano Nv.${nivel}: ${hechizo ? `${hechizo.nombre} (${etiquetaEstado})` : etiquetaEstado}`}
                >
                  <span className={styles.puntoResumenArcano} aria-hidden="true" />
                  Nv.{nivel}
                </span>
              );
            })}
          </div>
          <span className={styles.contadorListosArcano}>
            {totalListos} / {totalAsignados} listos
          </span>
        </div>
      </div>

      <div className={styles.listaArcanosNivel}>
        {nivelesDisponibles.map((nivel) => {
          const hechizo = arcanosPorNivel[nivel];
          const estaGastado = Boolean(hechizo) && arcanoMisticoGastados.includes(String(nivel));
          const estadoFila = !hechizo
            ? "vacio"
            : bloqueadoPorArmadura
            ? "bloqueado"
            : estaGastado
            ? "gastado"
            : "listo";

          const opcionesHechizosNivel = baseDatosHechizos
            .filter((h) => h.nivel === nivel && (!opcionesPorNivel || opcionesPorNivel[nivel]?.includes(h.id)))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((h) => ({
              valor: h.id,
              etiqueta: `${h.nombre} (${h.escuela || "Magia"})`
            }));

          return (
            <div
              key={`arcano-nivel-${nivel}`}
              className={styles.tarjetaFilaArcano}
              data-estado={estadoFila}
              data-gastado={estaGastado ? "true" : "false"}
            >
              {hechizo ? (
                <>
                  <div className={styles.infoConjuroArcano}>
                    <div className={styles.filaTituloArcano}>
                      <span
                        className={styles.badgeNivelArcano}
                        data-gastado={estaGastado ? "true" : "false"}
                      >
                        NV. {nivel}
                      </span>

                      <button
                        type="button"
                        onClick={() => alAbrirFichaHechizo?.(hechizo)}
                        title="Ver descripción y ficha completa del conjuro"
                        className={styles.nombreConjuroArcano}
                        data-gastado={estaGastado ? "true" : "false"}
                      >
                        {hechizo.nombre}
                      </button>

                      {hechizo.concentracion && (
                        <span
                          title="Requiere Concentración"
                          aria-label="Requiere concentración"
                          className={styles.tagConcentracionArcano}
                        >
                          C
                        </span>
                      )}

                      {bloqueadoPorArmadura && (
                        <span
                          title={textoBloqueo}
                          aria-label="Bloqueado por armadura sin competencia"
                          className={styles.tagArmaduraArcano}
                        >
                          <AlertTriangle size={11} aria-hidden="true" />
                          <span>Armadura</span>
                        </span>
                      )}
                    </div>

                    <div className={styles.filaMetaArcano}>
                      <span className={styles.metaEscuelaArcano}>
                        {hechizo.escuela || "Magia"}
                        {hechizo.alcance ? ` · ${hechizo.alcance}` : ""}
                      </span>
                      {hechizo.dadosDaño && (
                        <strong className={styles.pildoraDanoArcano}>{hechizo.dadosDaño}</strong>
                      )}
                    </div>
                  </div>

                  <div className={styles.accionesArcanoFila}>
                    <div className={styles.splitControlArcano}>
                      {estaGastado ? (
                        <>
                          <span className={styles.segmentoEstadoArcano} data-gastado="true">
                            0/1 · Hoy
                          </span>
                          <button
                            type="button"
                            onClick={() => alRecuperarArcano(nivel)}
                            title="Restaurar uso manualmente"
                            aria-label={`Restaurar uso de Arcano Nv.${nivel}: ${hechizo.nombre}`}
                            className={styles.botonRestaurarArcano}
                          >
                            <RotateCcw size={12} aria-hidden="true" />
                            <span>Restaurar</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className={styles.segmentoEstadoArcano}
                            data-bloqueado={bloqueadoPorArmadura ? "true" : undefined}
                          >
                            1/1 día
                          </span>
                          <button
                            type="button"
                            onClick={() => lanzarArcano(nivel, hechizo)}
                            disabled={bloqueadoPorArmadura}
                            title={bloqueadoPorArmadura ? textoBloqueo : `Lanzar Arcano Místico de Nivel ${nivel} (1/día)`}
                            aria-label={`Lanzar ${hechizo.nombre}`}
                            className={styles.botonLanzarArcano}
                          >
                            {bloqueadoPorArmadura ? <Lock size={11} aria-hidden="true" /> : <Zap size={11} aria-hidden="true" />}
                            <span>Lanzar</span>
                          </button>
                        </>
                      )}
                    </div>

                    <span className={styles.separadorArcano} aria-hidden="true" />

                    <button
                      type="button"
                      onClick={() => alQuitarArcano(nivel)}
                      title="Cambiar o desasignar conjuro de arcano"
                      aria-label={`Cambiar o desasignar Arcano Nv.${nivel}: ${hechizo.nombre}`}
                      className={styles.botonQuitarArcano}
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.cajaArcanoSinAsignar}>
                  <span className={styles.badgeNivelArcano}>NV. {nivel}</span>
                  <div className={styles.contenedorSelectorArcano}>
                    <SelectorDesplegable<string>
                      opciones={opcionesHechizosNivel}
                      valor=""
                      alCambiar={(nuevoId) => {
                        if (nuevoId) alAsignarArcano(nivel, nuevoId);
                      }}
                      placeholder={`Elegir conjuro de Nivel ${nivel}... (${opcionesHechizosNivel.length} opciones)`}
                      tamano="compacto"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <span className={styles.pieReglaArcano}>
        1 uso gratuito por nivel (Nv. 6–9) • Recuperación en descanso largo
      </span>
    </div>
  );
};
