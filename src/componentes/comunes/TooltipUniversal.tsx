import React, { useState, useRef, useCallback, ReactNode } from "react";
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
 * Auto-detecta la proximidad a los bordes de la pantalla (izq/der/arriba/abajo) para evitar cualquier desborde.
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
  const [alineacionEfectiva, setAlineacionEfectiva] = useState<"centro" | "inicio" | "fin">(alineacion);
  const [posicionEfectiva, setPosicionEfectiva] = useState<"arriba" | "abajo" | "izquierda" | "derecha">(posicion);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const manejarEntradaRaton = useCallback(() => {
    if (contenedorRef.current) {
      const rect = contenedorRef.current.getBoundingClientRect();
      const espacioIzquierda = rect.left;
      const espacioDerecha = window.innerWidth - rect.right;
      const espacioArriba = rect.top;
      const espacioAbajo = window.innerHeight - rect.bottom;

      // 1. Auto-ajuste de alineación horizontal
      if (alineacion === "centro") {
        if (espacioIzquierda < 150) {
          setAlineacionEfectiva("inicio");
        } else if (espacioDerecha < 150) {
          setAlineacionEfectiva("fin");
        } else {
          setAlineacionEfectiva("centro");
        }
      } else {
        setAlineacionEfectiva(alineacion);
      }

      // 2. Auto-ajuste de posición vertical
      if (posicion === "arriba" && espacioArriba < 120 && espacioAbajo > espacioArriba) {
        setPosicionEfectiva("abajo");
      } else if (posicion === "abajo" && espacioAbajo < 120 && espacioArriba > espacioAbajo) {
        setPosicionEfectiva("arriba");
      } else {
        setPosicionEfectiva(posicion);
      }
    }
    setEstaVisible(true);
  }, [alineacion, posicion]);

  const manejarSalidaRaton = useCallback(() => {
    setEstaVisible(false);
  }, []);

  if (!contenido || deshabilitado) {
    return <>{children}</>;
  }

  // Clase de posición
  let clasePosicion = estilos.posicionArriba;
  if (posicionEfectiva === "abajo") clasePosicion = estilos.posicionAbajo;
  else if (posicionEfectiva === "izquierda") clasePosicion = estilos.posicionIzquierda;
  else if (posicionEfectiva === "derecha") clasePosicion = estilos.posicionDerecha;

  // Clase de alineación
  let claseAlineacion = "";
  if (alineacionEfectiva === "inicio") claseAlineacion = estilos.alineacionInicio;
  else if (alineacionEfectiva === "fin") claseAlineacion = estilos.alineacionFin;

  const estiloFlotante: React.CSSProperties = {};
  if (anchoMax) {
    estiloFlotante.maxWidth = typeof anchoMax === "number" ? `${anchoMax}px` : anchoMax;
  }

  return (
    <div
      ref={contenedorRef}
      className={`${estilos.contenedor} ${className}`}
      style={style}
      onMouseEnter={manejarEntradaRaton}
      onMouseLeave={manejarSalidaRaton}
    >
      {children}

      <div
        className={`${estilos.flotante} ${clasePosicion} ${claseAlineacion} ${
          estaVisible ? estilos.flotanteVisible : ""
        }`}
        style={estiloFlotante}
      >
        {titulo && <div className={estilos.titulo}>{titulo}</div>}
        <div className={estilos.cuerpo}>{contenido}</div>
      </div>
    </div>
  );
};

export default TooltipUniversal;
