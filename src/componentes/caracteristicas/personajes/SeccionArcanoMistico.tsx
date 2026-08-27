import React, { useMemo } from "react";
import { Sparkles, Zap, RotateCcw, X, BookOpen } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";

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
  alAbrirFichaHechizo
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
    if (estaGastado) {
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
      console.error("[SeccionArcanoMistico] Error al enviar tirada a TaleSpire:", err);
    }
    alGastarArcano(nivel);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        backgroundColor: "#111622",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        borderRadius: 8,
        padding: "12px 14px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)"
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(168, 85, 247, 0.15)",
          paddingBottom: 8
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={15} color="#c084fc" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#f3e8ff"
            }}
          >
            Arcano Místico (Brujo)
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#a855f7", fontStyle: "italic" }}>
          Lanzamiento gratuito 1/día por arcano • Se recupera en descanso largo
        </span>
      </div>

      {/* Lista de Arcanos por Nivel Desbloqueado */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#161e2c",
                border: estaGastado
                  ? "1px dashed rgba(148, 163, 184, 0.2)"
                  : "1px solid rgba(192, 132, 252, 0.25)",
                borderRadius: 6,
                padding: "8px 10px",
                gap: 8
              }}
            >
              {/* Badge de Nivel */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 90 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: estaGastado ? "#94a3b8" : "#e9d5ff",
                    backgroundColor: estaGastado ? "#1e293b" : "rgba(168, 85, 247, 0.25)",
                    border: "1px solid rgba(192, 132, 252, 0.35)",
                    borderRadius: 4,
                    padding: "2px 6px"
                  }}
                >
                  ARCANO NV. {nivel}
                </span>
              </div>

              {/* Información del Conjuro Asignado o Selector */}
              {hechizo ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: 1,
                    justifyContent: "space-between",
                    gap: 8
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: alAbrirFichaHechizo ? "pointer" : "default"
                    }}
                    onClick={() => alAbrirFichaHechizo && alAbrirFichaHechizo(hechizo)}
                    title="Clic para ver ficha completa"
                  >
                    <BookOpen size={13} color="#93c5fd" />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: estaGastado ? "#94a3b8" : "#f1f5f9",
                        textDecoration: estaGastado ? "line-through" : "none"
                      }}
                    >
                      {hechizo.nombre}
                    </span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>
                      ({hechizo.escuela || "Magia"})
                    </span>
                  </div>

                  {/* Acciones de Lanzamiento y Estado */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {estaGastado ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            borderRadius: 4,
                            padding: "2px 6px"
                          }}
                        >
                          Gastado hoy
                        </span>
                        <button
                          type="button"
                          onClick={() => alRecuperarArcano(nivel)}
                          title="Restaurar uso manualmente"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: 2
                          }}
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => lanzarArcano(nivel, hechizo)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#7e22ce",
                          border: "1px solid #c084fc",
                          borderRadius: 4,
                          color: "#ffffff",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 8px",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#9333ea";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#7e22ce";
                        }}
                      >
                        <Zap size={11} />
                        <span>Lanzar (1/día)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => alQuitarArcano(nivel)}
                      title="Cambiar o desasignar conjuro de arcano"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        padding: 2
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#64748b";
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: 1,
                    justifyContent: "space-between",
                    gap: 8
                  }}
                >
                  <div style={{ flex: 1, maxWidth: 280 }}>
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
                  <span style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>
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
