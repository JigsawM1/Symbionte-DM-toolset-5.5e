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
import { formatearComponentes } from "@/utiles/utilesConjuros";
import {
  OrigenConjuroBadge,
  CONFIG_BADGES_ORIGEN_CONJURO
} from "@/servicios/resolutorOrigenConjuros";
import estilos from "./FilaConjuroCompendio.module.css";

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

export const FilaConjuroCompendio: React.FC<FilaConjuroCompendioProps> = React.memo(({
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
      className={estilos.filaContenedor}
    >
      {/* Línea 1: Controles, Icono, Nombre y Badges de Nivel/Escuela */}
      <div className={estilos.lineaSuperior}>
        {/* Lado izquierdo: Estrella + Checkbox + Icono + Nombre */}
        <div className={estilos.ladoIzquierdo}>
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
              className={`${estilos.botonControl} ${estilos.botonEstrella} ${hechizo.nivel === 0 || esDeSubclase ? estilos.botonControlDeshabilitado : ""}`}
            >
              <Star
                size={16}
                fill={estaMarcadoPreparado ? "#f59e0b" : "transparent"}
                color={estaMarcadoPreparado ? "#f59e0b" : "#64748b"}
                strokeWidth={estaMarcadoPreparado ? 1 : 1.75}
                className={estilos.iconoSinEventos}
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
            className={`${estilos.botonControl} ${estilos.botonCheckbox} ${esOtorgado ? estilos.botonControlDeshabilitado : ""}`}
          >
            <div
              className={`${estilos.cajaCheckbox} ${estaMarcadoEnLista && !esOtorgado ? estilos.cajaCheckboxMarcado : ""}`}
              data-origen={esOtorgado && origenEfectivo ? origenEfectivo : undefined}
            >
              {estaMarcadoEnLista && <Check size={10} color={esOtorgado && configBadge ? configBadge.colorTexto : "#ffffff"} strokeWidth={3} />}
            </div>
          </button>

          {/* Icono de la Escuela */}
          <div className={estilos.cajaIconoEscuela}>
            {obtenerIconoEscuela(hechizo.escuela)}
          </div>

          {/* Nombre del Conjuro + Badge Origen */}
          <div className={estilos.contenedorNombre}>
            <span className={estilos.textoNombre}>
              {hechizo.nombre}
            </span>

            {esOtorgado && configBadge && (
              <span
                title={configBadge.tooltip}
                className={estilos.badgeOrigen}
                data-origen={origenEfectivo}
              >
                <Sparkles size={8} /> {configBadge.etiqueta}
              </span>
            )}
          </div>
        </div>

        {/* Lado derecho: Nivel y Escuela */}
        <div className={estilos.ladoDerecho}>
          <span className={estilos.badgeNivel}>
            {formatearNivel(hechizo.nivel)}
          </span>
          {hechizo.escuela && (
            <span className={estilos.textoEscuela}>
              {hechizo.escuela}
            </span>
          )}
        </div>
      </div>

      {/* Línea 2: Metadatos compactos con separadores circulares */}
      <div
        className={`${estilos.lineaMetadatos} ${!mostrarEstrella ? estilos.lineaMetadatosSinEstrella : ""}`}
      >
        {/* Tiempo + Ritual */}
        <div className={estilos.itemMetadato}>
          <span>{hechizo.tiempoLanzamiento || "-"}</span>
          {hechizo.ritual && (
            <span
              title="Lanzamiento Ritual: puede lanzarse añadiendo 10 minutos sin consumir ranuras de conjuro"
              className={estilos.badgeRitual}
            >
              RITUAL
            </span>
          )}
        </div>

        <span className={estilos.separadorPunto}>•</span>

        {/* Alcance */}
        <span>{hechizo.alcance || "-"}</span>

        <span className={estilos.separadorPunto}>•</span>

        {/* Duración + Concentración */}
        <div className={estilos.itemMetadato}>
          <span>{hechizo.duracion || "Instantáneo"}</span>
          {hechizo.concentracion && (
            <span
              title="Concentración"
              className={estilos.badgeConcentracion}
            >
              C
            </span>
          )}
        </div>

        {hechizo.componentesSeleccionados && (
          <>
            <span className={estilos.separadorPunto}>•</span>
            <span className={estilos.textoComponentes}>{formatearComponentes(hechizo.componentesSeleccionados)}</span>
          </>
        )}

        {(() => {
          const dados = hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" ? hechizo.dadosDaño : undefined;
          if (!dados) return null;
          return (
            <>
              <span className={estilos.separadorPunto}>•</span>
              <strong className={estilos.textoDano}>
                {dados} {hechizo.tipoDaño ? `(${hechizo.tipoDaño})` : ""}
              </strong>
            </>
          );
        })()}
      </div>

      {/* Línea 3: Resumen de la Descripción */}
      <div
        className={`${estilos.resumenDescripcion} ${!mostrarEstrella ? estilos.resumenDescripcionSinEstrella : ""}`}
      >
        {descripcionLimpia}
      </div>
    </div>
  );
});

FilaConjuroCompendio.displayName = "FilaConjuroCompendio";
