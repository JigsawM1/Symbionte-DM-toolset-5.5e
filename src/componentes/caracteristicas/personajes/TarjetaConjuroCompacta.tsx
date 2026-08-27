import React, { useState, useMemo, useEffect } from "react";
import { Zap, Eye, Trash2, Check, Sparkles } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import {
  calcularFormulaEscalada,
  calcularInfoTruco,
  construirFormulaTaleSpireTruco
} from "@/utiles/utilesConjuros";
import {
  obtenerOpcionesLanzamientoConjuro,
  gastarRecursoLanzamientoConjuro
} from "@/servicios/calculadorMagia";
import { SelectorDesplegable } from "@/componentes/comunes";

interface TarjetaConjuroCompactaProps {
  hechizo: HechizoBase;
  nombrePersonaje: string;
  nivelPersonaje?: number;
  bonoAtaqueMagico: number;
  estaPreparado: boolean;
  esDeSubclase?: boolean;
  mostrarTogglePreparado?: boolean;
  esConcentracionActual?: boolean;
  alAlternarPreparado?: () => void;
  alQuitarDeLista: () => void;
  alAbrirDetalleCompleto: (hechizo: HechizoBase) => void;
  alGastarEspacio?: (nivel: number) => void;
  alGastarPuntos?: (cantidad: number) => void;
  alGastarEspacioPacto?: () => void;
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  espaciosPactoGastados?: number;
  espaciosConjuroMaximos?: Record<string, number>;
  nivelConjuroMaximo?: number;
  alEstablecerConcentracion?: (id: string, nombre: string) => void;
  costePuntosPorNivel?: Record<number, number>;
  sistemaMagia?: "espacios" | "puntos";
}

export const TarjetaConjuroCompacta: React.FC<TarjetaConjuroCompactaProps> = ({
  hechizo,
  nombrePersonaje,
  nivelPersonaje = 1,
  bonoAtaqueMagico,
  estaPreparado,
  esDeSubclase = false,
  mostrarTogglePreparado = false,
  esConcentracionActual = false,
  alAlternarPreparado,
  alQuitarDeLista,
  alAbrirDetalleCompleto,
  alGastarEspacio,
  alGastarPuntos,
  alGastarEspacioPacto,
  esLanzadorPacto = false,
  nivelEspacioPacto = 0,
  espaciosPactoMaximos = 0,
  espaciosPactoGastados = 0,
  espaciosConjuroMaximos = {},
  nivelConjuroMaximo = 0,
  alEstablecerConcentracion,
  costePuntosPorNivel,
  sistemaMagia = "espacios"
}) => {
  const esTruco = hechizo.nivel === 0;

  // Obtener las opciones de nivel válidas (respetando ranuras reales, pacto fijo y multiclase)
  const opcionesLanzamiento = useMemo(() => {
    return obtenerOpcionesLanzamientoConjuro({
      nivelHechizo: hechizo.nivel,
      espaciosConjuroMaximos,
      nivelConjuroMaximo,
      sistemaMagia,
      esLanzadorPacto,
      nivelEspacioPacto,
      espaciosPactoMaximos
    });
  }, [
    hechizo.nivel,
    espaciosConjuroMaximos,
    nivelConjuroMaximo,
    sistemaMagia,
    esLanzadorPacto,
    nivelEspacioPacto,
    espaciosPactoMaximos
  ]);

  const [nivelUpcast, setNivelUpcast] = useState<number>(() => {
    return opcionesLanzamiento[0]?.nivel ?? hechizo.nivel;
  });

  useEffect(() => {
    if (opcionesLanzamiento.length > 0) {
      const existe = opcionesLanzamiento.some((opt) => opt.nivel === nivelUpcast);
      if (!existe) {
        setNivelUpcast(opcionesLanzamiento[0].nivel);
      }
    }
  }, [opcionesLanzamiento, nivelUpcast]);

  // Cálculo de dados para trucos según nivel de personaje (D&D 5.5e: escala de dados o múltiples ataques/rayos)
  const infoTruco = esTruco ? calcularInfoTruco(hechizo, nivelPersonaje) : null;

  // Lanzamiento rápido 3D a TaleSpire
  const manejarLanzamientoRapido = async () => {
    try {
      const nombrePj = nombrePersonaje.trim() || "Personaje";
      let formulaTaleSpire = "";
      let etiquetaLog = "";

      if (esTruco) {
        const resultadoTruco = construirFormulaTaleSpireTruco(
          hechizo,
          nivelPersonaje,
          bonoAtaqueMagico,
          nombrePj
        );
        formulaTaleSpire = resultadoTruco.formulaTaleSpire;
        etiquetaLog = resultadoTruco.etiquetaLog;
      } else {
        const formulaBase = hechizo.dadosDaño?.trim() || "";
        const formulaAdicional = hechizo.dadosDañoNivelSuperior?.trim() || "";

        // Escalado para conjuros de nivel 1-9
        const formulaFinal =
          formulaBase && nivelUpcast > hechizo.nivel
            ? calcularFormulaEscalada(formulaBase, formulaAdicional, hechizo.nivel, nivelUpcast).formula
            : formulaBase;

        etiquetaLog = `${nombrePj} - ${hechizo.nombre}${nivelUpcast > hechizo.nivel ? ` (Nv.${nivelUpcast})` : ""}`;

        // Determinar si es ataque, daño o ambos
        const tieneAtaque =
          hechizo.ataqueCd?.toUpperCase().includes("ATAQUE") ||
          hechizo.ataqueCd?.toUpperCase().includes("ATTACK");

        if (tieneAtaque) {
          const formulaAtaque = `!Ataque ${sanitizarEtiqueta(hechizo.nombre)}:1d20${bonoAtaqueMagico >= 0 ? "+" : ""}${bonoAtaqueMagico}`;
          if (formulaFinal) {
            const tipoDano = hechizo.tipoDaño ? ` (${hechizo.tipoDaño})` : "";
            formulaTaleSpire = `${formulaAtaque}/Daño${sanitizarEtiqueta(tipoDano)}:${formulaFinal}`;
          } else {
            formulaTaleSpire = formulaAtaque;
          }
        } else if (formulaFinal) {
          const tipoDano = hechizo.tipoDaño ? ` (${hechizo.tipoDaño})` : "";
          formulaTaleSpire = `!Daño ${sanitizarEtiqueta(hechizo.nombre)}${sanitizarEtiqueta(tipoDano)}:${formulaFinal}`;
        } else {
          // Conjuro utilitario o de salvación sin dados directos de daño
          formulaTaleSpire = `!Lanzar Conjuro:${sanitizarEtiqueta(hechizo.nombre)}`;
        }
      }

      await lanzarDadosTaleSpire(formulaTaleSpire, etiquetaLog);

      // Descontar recurso si no es truco delegando según reglas de D&D 5.5e
      if (!esTruco) {
        gastarRecursoLanzamientoConjuro({
          nivelLanzamiento: nivelUpcast,
          esLanzadorPacto,
          nivelEspacioPacto,
          espaciosPactoMaximos,
          espaciosPactoGastados,
          espaciosConjuroMaximos,
          sistemaMagia,
          costePuntosPorNivel,
          alGastarEspacio,
          alGastarPuntos,
          alGastarEspacioPacto
        });
      }

      // Si es de concentración, marcar concentración activa
      if (hechizo.concentracion && alEstablecerConcentracion) {
        alEstablecerConcentracion(hechizo.id, hechizo.nombre);
      }
    } catch (err) {
      console.error("[TarjetaConjuroCompacta] Error al lanzar conjuro:", err);
    }
  };

  // Lanzamiento como Ritual (D&D 5.5e 2024: +10 min, no gasta ranuras/puntos)
  const manejarLanzamientoRitual = async () => {
    try {
      const nombrePj = nombrePersonaje.trim() || "Personaje";
      const formulaBase = hechizo.dadosDaño?.trim() || "";
      const formulaTaleSpire = formulaBase
        ? `!Daño Ritual ${sanitizarEtiqueta(hechizo.nombre)}:${formulaBase}`
        : `!Lanzar Ritual:${sanitizarEtiqueta(hechizo.nombre)} (+10 min)`;
      const etiquetaLog = `${nombrePj} - ${hechizo.nombre} (RITUAL - 10 min)`;

      await lanzarDadosTaleSpire(formulaTaleSpire, etiquetaLog);

      // Si es de concentración, se activa normalmente
      if (hechizo.concentracion && alEstablecerConcentracion) {
        alEstablecerConcentracion(hechizo.id, hechizo.nombre);
      }
    } catch (err) {
      console.error("[TarjetaConjuroCompacta] Error al lanzar ritual:", err);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: esConcentracionActual
          ? "rgba(245, 158, 11, 0.08)"
          : estaPreparado || !mostrarTogglePreparado
          ? "#141b27"
          : "#0f141d",
        border: esConcentracionActual
          ? "1px solid rgba(245, 158, 11, 0.4)"
          : estaPreparado
          ? "1px solid rgba(96, 165, 250, 0.25)"
          : "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: 6,
        padding: "6px 10px",
        gap: 8
      }}
    >
      {/* Lado Izquierdo: Checkbox (si aplica) + Nombre y Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        {mostrarTogglePreparado && !esTruco && (
          <button
            type="button"
            onClick={esDeSubclase ? undefined : alAlternarPreparado}
            title={
              esDeSubclase
                ? "Siempre preparado por tu subclase (no consume cupo diario)"
                : estaPreparado
                ? "Conjuro preparado (clic para desmarcar)"
                : "Conjuro no preparado (clic para preparar)"
            }
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              border: esDeSubclase
                ? "1px solid #facc15"
                : estaPreparado
                ? "1px solid #60a5fa"
                : "1px solid rgba(148, 163, 184, 0.3)",
              backgroundColor: esDeSubclase
                ? "rgba(202, 138, 4, 0.35)"
                : estaPreparado
                ? "#2563eb"
                : "transparent",
              color: esDeSubclase ? "#fef08a" : "#ffffff",
              cursor: esDeSubclase ? "default" : "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {(estaPreparado || esDeSubclase) && <Check size={12} />}
          </button>
        )}

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => alAbrirDetalleCompleto(hechizo)}
              style={{
                background: "none",
                border: "none",
                color: "#f1f5f9",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
                textDecoration: "none"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#93c5fd")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#f1f5f9")}
            >
              {hechizo.nombre}
            </button>

            {/* Badge de Subclase */}
            {esDeSubclase && (
              <span
                title="Conjuro otorgado automáticamente por tu subclase"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  backgroundColor: "rgba(234, 179, 8, 0.18)",
                  color: "#fde047",
                  border: "1px solid rgba(234, 179, 8, 0.35)",
                  borderRadius: 3,
                  padding: "1px 4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3
                }}
              >
                <Sparkles size={8} /> Subclase
              </span>
            )}

            {/* Badges */}
            {hechizo.concentracion && (
              <span
                title="Requiere Concentración"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  backgroundColor: "rgba(245, 158, 11, 0.2)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: 3,
                  padding: "1px 4px"
                }}
              >
                C
              </span>
            )}

            {hechizo.ritual && (
              <span
                title="Puede lanzarse como Ritual"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  backgroundColor: "rgba(168, 85, 247, 0.2)",
                  color: "#c084fc",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  borderRadius: 3,
                  padding: "1px 4px"
                }}
              >
                R
              </span>
            )}
          </div>

          <span style={{ fontSize: 10, color: "#64748b" }}>
            {hechizo.escuela} {hechizo.alcance ? `• ${hechizo.alcance}` : ""}
            {esTruco && infoTruco?.etiquetaVisual ? (
              <strong style={{ color: infoTruco.multiplicador > 1 ? "#93c5fd" : "#cbd5e1", marginLeft: 4 }}>
                • {infoTruco.etiquetaVisual} {infoTruco.multiplicador > 1 ? `(Nv.${nivelPersonaje})` : ""}
              </strong>
            ) : hechizo.dadosDaño ? (
              ` • ${hechizo.dadosDaño}`
            ) : (
              ""
            )}
          </span>
        </div>
      </div>

      {/* Lado Derecho: Selector de Nivel de Ranura (Upcast) o Badge Fijo de Pacto + Botón Lanzar + Botón Detalles + Quitar */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        {/* Selector Upcast o Badge Informativo Fijo */}
        {!esTruco && (
          opcionesLanzamiento.length > 1 ? (
            <div style={{ width: 84, minWidth: 84 }}>
              <SelectorDesplegable
                valor={String(nivelUpcast)}
                alCambiar={(val) => setNivelUpcast(Number(val))}
                tamano="mini"
                titulo="Nivel de ranura de lanzamiento (Upcast)"
                opciones={opcionesLanzamiento.map((opt) => ({
                  valor: String(opt.nivel),
                  etiqueta: opt.etiqueta
                }))}
              />
            </div>
          ) : (
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: opcionesLanzamiento[0]?.tipo === "pacto"
                  ? "rgba(168, 85, 247, 0.15)"
                  : "rgba(148, 163, 184, 0.1)",
                color: opcionesLanzamiento[0]?.tipo === "pacto" ? "#d8b4fe" : "#cbd5e1",
                border: opcionesLanzamiento[0]?.tipo === "pacto"
                  ? "1px solid rgba(168, 85, 247, 0.35)"
                  : "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 4,
                padding: "3px 6px",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center"
              }}
              title={
                opcionesLanzamiento[0]?.tipo === "pacto"
                  ? "Lanzamiento automático con ranura de Pacto de nivel fijo (Brujo)"
                  : `Lanzamiento con ranura de Nivel ${opcionesLanzamiento[0]?.nivel || hechizo.nivel}`
              }
            >
              {opcionesLanzamiento[0]?.etiqueta || `Nv. ${hechizo.nivel}`}
            </div>
          )
        )}

        {/* Botón Lanzamiento Rápido */}
        <button
          type="button"
          onClick={manejarLanzamientoRapido}
          title={
            esTruco
              ? "Lanzar truco a TaleSpire"
              : esLanzadorPacto
              ? `Lanzar con ranura de Pacto Nivel ${nivelEspacioPacto || nivelUpcast} (descuenta 1 espacio de pacto)`
              : `Lanzar con ranura de Nivel ${nivelUpcast} (descuenta ${
                  sistemaMagia === "puntos"
                    ? `${costePuntosPorNivel?.[nivelUpcast] ?? 2} puntos`
                    : "1 espacio"
                })`
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#1e293b",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: 4,
            color: "#38bdf8",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 7px",
            cursor: "pointer"
          }}
        >
          <Zap size={11} />
          <span>Lanzar</span>
        </button>

        {/* Botón Lanzamiento como Ritual (D&D 2024: +10 min, sin gastar ranura) */}
        {hechizo.ritual && !esTruco && (
          <button
            type="button"
            onClick={manejarLanzamientoRitual}
            title="Lanzar como Ritual (+10 min adicionales, sin consumir ranuras ni puntos de magia)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              backgroundColor: "rgba(168, 85, 247, 0.12)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              borderRadius: 4,
              color: "#c084fc",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 6px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.22)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.12)")}
          >
            <Sparkles size={11} />
            <span>Ritual</span>
          </button>
        )}

        {/* Botón Ver Ficha Completa */}
        <button
          type="button"
          onClick={() => alAbrirDetalleCompleto(hechizo)}
          title="Ver ficha completa y opciones de lanzamiento"
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            padding: 3,
            display: "flex",
            alignItems: "center"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
        >
          <Eye size={13} />
        </button>

        {/* Botón Quitar de Lista */}
        <button
          type="button"
          onClick={alQuitarDeLista}
          title="Quitar conjuro de la lista del personaje"
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            padding: 3,
            display: "flex",
            alignItems: "center"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
