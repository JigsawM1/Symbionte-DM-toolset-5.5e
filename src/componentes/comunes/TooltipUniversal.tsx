import React, { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import estilos from "./TooltipUniversal.module.css";

export interface TooltipUniversalProps {
  contenido: ReactNode;
  titulo?: string;
  posicion?: "arriba" | "abajo" | "izquierda" | "derecha";
  alineacion?: "centro" | "inicio" | "fin";
  anchoMax?: number | string;
  deshabilitado?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente universal de Tooltip flotante optimizado para Chromium Embedded Framework (CEF) de TaleSpire.
 * Utiliza React Portal (document.body) con position fixed para evitar cortes por contenedores con overflow (modales, scrolls, etc.)
 * y auto-detecta la proximidad a los bordes de la pantalla para reajustar posición y alineación.
 */
export const TooltipUniversal: React.FC<TooltipUniversalProps> = ({
  contenido,
  titulo,
  posicion = "arriba",
  alineacion = "centro",
  anchoMax,
  deshabilitado = false,
  children,
  className = "",
  style
}) => {
  const [estaVisible, setEstaVisible] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    posEfectiva: "arriba" | "abajo" | "izquierda" | "derecha";
    alineacionEfectiva: "centro" | "inicio" | "fin";
  }>({
    top: 0,
    left: 0,
    posEfectiva: posicion,
    alineacionEfectiva: alineacion
  });
  const contenedorRef = useRef<HTMLDivElement>(null);

  const actualizarPosicion = useCallback(() => {
    if (!contenedorRef.current) return;
    const rect = contenedorRef.current.getBoundingClientRect();
    const espacioArriba = rect.top;
    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioIzquierda = rect.left;
    const espacioDerecha = window.innerWidth - rect.right;

    // 1. Auto-ajuste de posición vertical si no hay suficiente espacio arriba/abajo
    let posEfectiva: "arriba" | "abajo" | "izquierda" | "derecha" = posicion;
    if (posicion === "arriba" && espacioArriba < 130 && espacioAbajo > espacioArriba) {
      posEfectiva = "abajo";
    } else if (posicion === "abajo" && espacioAbajo < 130 && espacioArriba > espacioAbajo) {
      posEfectiva = "arriba";
    }

    // 2. Auto-ajuste de alineación horizontal
    let alineacionEfectiva: "centro" | "inicio" | "fin" = alineacion;
    if (alineacion === "centro") {
      if (espacioIzquierda < 150) {
        alineacionEfectiva = "inicio";
      } else if (espacioDerecha < 150) {
        alineacionEfectiva = "fin";
      }
    }

    let top = 0;
    let left = 0;

    if (posEfectiva === "arriba") {
      top = rect.top - 6;
      left =
        alineacionEfectiva === "inicio"
          ? rect.left
          : alineacionEfectiva === "fin"
          ? rect.right
          : rect.left + rect.width / 2;
    } else if (posEfectiva === "abajo") {
      top = rect.bottom + 6;
      left =
        alineacionEfectiva === "inicio"
          ? rect.left
          : alineacionEfectiva === "fin"
          ? rect.right
          : rect.left + rect.width / 2;
    } else if (posEfectiva === "izquierda") {
      top = rect.top + rect.height / 2;
      left = rect.left - 6;
    } else if (posEfectiva === "derecha") {
      top = rect.top + rect.height / 2;
      left = rect.right + 6;
    }

    setCoords({ top, left, posEfectiva, alineacionEfectiva });
  }, [posicion, alineacion]);

  const manejarEntradaRaton = useCallback(() => {
    actualizarPosicion();
    setEstaVisible(true);
  }, [actualizarPosicion]);

  const manejarSalidaRaton = useCallback(() => {
    setEstaVisible(false);
  }, []);

  useEffect(() => {
    if (!estaVisible) return;
    const alReposicionar = () => {
      actualizarPosicion();
    };
    window.addEventListener("scroll", alReposicionar, true);
    window.addEventListener("resize", alReposicionar);
    return () => {
      window.removeEventListener("scroll", alReposicionar, true);
      window.removeEventListener("resize", alReposicionar);
    };
  }, [estaVisible, actualizarPosicion]);

  if (!contenido || deshabilitado) {
    return <>{children}</>;
  }

  // Clase de posición
  let clasePosicion = estilos.posicionArriba;
  if (coords.posEfectiva === "abajo") clasePosicion = estilos.posicionAbajo;
  else if (coords.posEfectiva === "izquierda") clasePosicion = estilos.posicionIzquierda;
  else if (coords.posEfectiva === "derecha") clasePosicion = estilos.posicionDerecha;

  // Clase de alineación
  let claseAlineacion = "";
  if (coords.alineacionEfectiva === "inicio") claseAlineacion = estilos.alineacionInicio;
  else if (coords.alineacionEfectiva === "fin") claseAlineacion = estilos.alineacionFin;

  const estiloFlotante: React.CSSProperties = {
    top: `${coords.top}px`,
    left: `${coords.left}px`,
    ...(anchoMax ? { maxWidth: typeof anchoMax === "number" ? `${anchoMax}px` : anchoMax } : {})
  };

  return (
    <div
      ref={contenedorRef}
      className={`${estilos.contenedor} ${className}`}
      style={style}
      onMouseEnter={manejarEntradaRaton}
      onMouseLeave={manejarSalidaRaton}
    >
      {children}

      {estaVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`${estilos.flotantePortal} ${clasePosicion} ${claseAlineacion}`}
            style={estiloFlotante}
          >
            {titulo && <div className={estilos.titulo}>{titulo}</div>}
            <div className={estilos.cuerpo}>{contenido}</div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default TooltipUniversal;
