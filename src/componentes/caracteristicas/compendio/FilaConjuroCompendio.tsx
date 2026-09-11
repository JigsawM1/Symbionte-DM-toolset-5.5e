import React from "react";
import {
  Shield,
  Zap,
  Eye,
  Heart,
  Ghost,
  Skull,
  RefreshCw,
  Sparkles,
  Check,
  Star
} from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { extraerDadosBaseTruco, formatearComponentes } from "@/utiles/utilesConjuros";
import {
  OrigenConjuroBadge,
  CONFIG_BADGES_ORIGEN_CONJURO
} from "@/servicios/resolutorOrigenConjuros";

interface FilaConjuroCompendioProps {
  hechizo: HechizoBase;
  estaEnLista: boolean;
  estaPreparado: boolean;
  esDeSubclase?: boolean;
  origenBadge?: OrigenConjuroBadge | null;
  requierePreparacion: boolean;
  mostrarEstrella?: boolean;
  alAlternarEnLista: () => void;
  alAlternarPreparado: () => void;
  alAbrirDetalle: (hechizo: HechizoBase) => void;
}

// Obtener icono temático según la escuela de magia
function obtenerIconoEscuela(escuela?: string) {
  const norm = (escuela || "").toLowerCase();
  if (norm.includes("abjuraci")) return <Shield size={16} color="#60a5fa" />;
  if (norm.includes("adivinaci")) return <Eye size={16} color="#c084fc" />;
  if (norm.includes("conjuraci")) return <Sparkles size={16} color="#38bdf8" />;
  if (norm.includes("encantam")) return <Heart size={16} color="#f472b6" />;
  if (norm.includes("evocaci")) return <Zap size={16} color="#fbbf24" />;
  if (norm.includes("ilusi")) return <Ghost size={16} color="#a78bfa" />;
  if (norm.includes("nigromanc")) return <Skull size={16} color="#34d399" />;
  if (norm.includes("transmutaci")) return <RefreshCw size={16} color="#fb923c" />;
  return <Sparkles size={16} color="#94a3b8" />;
}

function formatearNivel(nivel: number): string {
  if (nivel === 0) return "Truco";
  if (nivel === 1) return "Nivel 1";
  return `Nivel ${nivel}`;
}

export const FilaConjuroCompendio: React.FC<FilaConjuroCompendioProps> = ({
  hechizo,
  estaEnLista,
  estaPreparado,
  esDeSubclase = false,
  origenBadge,
  requierePreparacion: _requierePreparacion,
  mostrarEstrella = true,
  alAlternarEnLista,
  alAlternarPreparado,
  alAbrirDetalle
}) => {
  const origenEfectivo: OrigenConjuroBadge | null = origenBadge ?? (esDeSubclase ? "subclase" : null);
  const esOtorgado = Boolean(origenEfectivo);
  const configBadge = origenEfectivo ? CONFIG_BADGES_ORIGEN_CONJURO[origenEfectivo] : null;

  // Limpiar HTML básico de descripción para el preview
  const descripcionLimpia = React.useMemo(() => {
    return (hechizo.descripcion || "")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, [hechizo.descripcion]);

  // Manejar acción de la estrella (Preparación)
  const manejarClickEstrella = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!esOtorgado && hechizo.nivel > 0) {
      alAlternarPreparado();
    }
  };

  // Manejar acción del checkbox (Lista / Conocidos)
  const manejarClickCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!esOtorgado) {
      alAlternarEnLista();
    }
  };

  const estaMarcadoPreparado = hechizo.nivel === 0 || esOtorgado ? true : estaPreparado;
  const estaMarcadoEnLista = esOtorgado ? true : estaEnLista;

  return (
    <div
      onClick={() => alAbrirDetalle(hechizo)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding: "8px 12px",
        backgroundColor: "#111622",
        borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
        userSelect: "none"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#161e2e";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#111622";
      }}
    >
      {/* Línea 1: Controles, Icono, Nombre y Badges de Nivel/Escuela */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "space-between"
        }}
      >
        {/* Lado izquierdo: Estrella + Checkbox + Icono + Nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
          {/* 1. Estrella: Preparar (solo si mostrarEstrella es true) */}
          {mostrarEstrella && (
            <button
              type="button"
              onClick={manejarClickEstrella}
              title={
                esDeSubclase
                  ? "Siempre preparado por tu subclase (no cuenta para el límite)"
                  : hechizo.nivel === 0
                  ? "Los trucos siempre están preparados"
                  : estaMarcadoPreparado
                  ? "Conjuro preparado (clic para desmarcar)"
                  : "Conjuro no preparado (clic para preparar)"
              }
              style={{
                width: 22,
                height: 22,
                padding: 0,
                margin: 0,
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: hechizo.nivel === 0 || esDeSubclase ? "default" : "pointer",
                borderRadius: 4,
                transition: "all 0.15s ease",
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (hechizo.nivel > 0 && !esDeSubclase) e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Star
                size={16}
                fill={estaMarcadoPreparado ? "#f59e0b" : "transparent"}
                color={estaMarcadoPreparado ? "#f59e0b" : "#64748b"}
                strokeWidth={estaMarcadoPreparado ? 1 : 1.75}
                style={{ pointerEvents: "none" }}
              />
            </button>
          )}

          {/* 2. Checkbox: Mi Lista / Grimorio */}
          <button
            type="button"
            onClick={manejarClickCheckbox}
            title={
              esOtorgado && configBadge
                ? `${configBadge.tooltip} (permanente)`
                : estaMarcadoEnLista
                ? "En tu lista/grimorio (clic para quitar)"
                : "Añadir a tu lista/grimorio"
            }
            style={{
              width: 22,
              height: 22,
              padding: 0,
              margin: 0,
              background: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: esOtorgado ? "default" : "pointer",
              borderRadius: 4,
              transition: "all 0.15s ease",
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (!esOtorgado) e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                border: estaMarcadoEnLista
                  ? esOtorgado && configBadge ? `1px solid ${configBadge.colorBorde}` : "1px solid #3b82f6"
                  : "1px solid rgba(148, 163, 184, 0.35)",
                backgroundColor: estaMarcadoEnLista
                  ? esOtorgado && configBadge ? configBadge.colorFondo : "#2563eb"
                  : "rgba(15, 23, 42, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none"
              }}
            >
              {estaMarcadoEnLista && <Check size={10} color={esOtorgado && configBadge ? configBadge.colorTexto : "#ffffff"} strokeWidth={3} />}
            </div>
          </button>

          {/* Icono de la Escuela */}
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {obtenerIconoEscuela(hechizo.escuela)}
          </div>

          {/* Nombre del Conjuro + Badge Origen */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontWeight: 700,
                color: "#f8fafc",
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {hechizo.nombre}
            </span>

            {esOtorgado && configBadge && (
              <span
                title={configBadge.tooltip}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  backgroundColor: configBadge.colorFondo,
                  color: configBadge.colorTexto,
                  border: `1px solid ${configBadge.colorBorde}`,
                  borderRadius: 3,
                  padding: "1px 4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  flexShrink: 0
                }}
              >
                <Sparkles size={8} /> {configBadge.etiqueta}
              </span>
            )}
          </div>
        </div>

        {/* Lado derecho: Nivel y Escuela */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#93c5fd",
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              padding: "1px 6px",
              borderRadius: 4,
              whiteSpace: "nowrap"
            }}
          >
            {formatearNivel(hechizo.nivel)}
          </span>
          {hechizo.escuela && (
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                textTransform: "capitalize",
                whiteSpace: "nowrap"
              }}
            >
              {hechizo.escuela}
            </span>
          )}
        </div>
      </div>

      {/* Línea 2: Metadatos compactos con separadores circulares */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "#cbd5e1",
          flexWrap: "wrap",
          paddingLeft: mostrarEstrella ? 56 : 28
        }}
      >
        {/* Tiempo + Ritual */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          <span>{hechizo.tiempoLanzamiento || "-"}</span>
          {hechizo.ritual && (
            <span
              title="Lanzamiento Ritual: puede lanzarse añadiendo 10 minutos sin consumir ranuras de conjuro"
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: "#c084fc",
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                padding: "0 4px",
                borderRadius: 3,
                lineHeight: "12px"
              }}
            >
              RITUAL
            </span>
          )}
        </div>

        <span style={{ color: "rgba(148, 163, 184, 0.3)" }}>•</span>

        {/* Alcance */}
        <span>{hechizo.alcance || "-"}</span>

        <span style={{ color: "rgba(148, 163, 184, 0.3)" }}>•</span>

        {/* Duración + Concentración */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          <span>{hechizo.duracion || "Instantáneo"}</span>
          {hechizo.concentracion && (
            <span
              title="Concentración"
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: "#f59e0b",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                padding: "0 3px",
                borderRadius: 3,
                lineHeight: "12px"
              }}
            >
              C
            </span>
          )}
        </div>

        {hechizo.componentesSeleccionados && (
          <>
            <span style={{ color: "rgba(148, 163, 184, 0.3)" }}>•</span>
            <span style={{ color: "#94a3b8" }}>{formatearComponentes(hechizo.componentesSeleccionados)}</span>
          </>
        )}

        {(() => {
          const dados = hechizo.dadosDaño && hechizo.dadosDaño !== "N/A"
            ? hechizo.dadosDaño
            : extraerDadosBaseTruco(hechizo);
          if (!dados) return null;
          return (
            <>
              <span style={{ color: "rgba(148, 163, 184, 0.3)" }}>•</span>
              <strong style={{ color: "#93c5fd", fontWeight: 700 }}>
                {dados} {hechizo.tipoDaño ? `(${hechizo.tipoDaño})` : ""}
              </strong>
            </>
          );
        })()}
      </div>

      {/* Línea 3: Resumen de la Descripción */}
      <div
        style={{
          paddingLeft: mostrarEstrella ? 56 : 28,
          fontSize: 11,
          color: "#94a3b8",
          lineHeight: "1.35",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}
      >
        {descripcionLimpia}
      </div>
    </div>
  );
};
