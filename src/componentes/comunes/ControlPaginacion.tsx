import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import estilos from "./ControlPaginacion.module.css";

export interface ControlPaginacionProps {
  paginaActual: number;
  totalElementos: number;
  elementosPorPagina: number;
  alCambiarPagina: (nuevaPagina: number) => void;
  tamano?: "compacto" | "normal";
  etiquetaElementos?: string;
  mostrarRango?: boolean;
}

/**
 * Control universal de paginación para tablas, listados y selectores.
 * Sin dependencias pesadas, totalmente accesible y sin emojis.
 */
export const ControlPaginacion: React.FC<ControlPaginacionProps> = ({
  paginaActual,
  totalElementos,
  elementosPorPagina,
  alCambiarPagina,
  tamano = "normal",
  etiquetaElementos = "elementos",
  mostrarRango = true
}) => {
  const totalPaginas = Math.max(1, Math.ceil(totalElementos / elementosPorPagina));
  const esCompacto = tamano === "compacto";

  if (totalElementos <= elementosPorPagina && totalPaginas <= 1) {
    return null;
  }

  const indiceInicio = Math.min((paginaActual - 1) * elementosPorPagina + 1, totalElementos);
  const indiceFin = Math.min(paginaActual * elementosPorPagina, totalElementos);

  const irAPagina = (nueva: number) => {
    const clamped = Math.max(1, Math.min(nueva, totalPaginas));
    if (clamped !== paginaActual) {
      alCambiarPagina(clamped);
    }
  };

  const estiloContenedor = esCompacto
    ? estilos.contenedorPaginacionCompacto
    : estilos.contenedorPaginacion;

  const estiloBoton = esCompacto
    ? estilos.botonPaginacionCompacto
    : estilos.botonPaginacion;

  const estiloTextoPagina = esCompacto
    ? estilos.textoPaginaActualCompacto
    : estilos.textoPaginaActual;

  const estiloInfoRango = esCompacto
    ? estilos.infoRangoCompacto
    : estilos.infoRango;

  const tamanoIcono = esCompacto ? 12 : 14;

  return (
    <nav
      className={estiloContenedor}
      aria-label={`Paginación de ${etiquetaElementos}`}
    >
      {mostrarRango && (
        <span className={estiloInfoRango}>
          {totalElementos > 0
            ? `${indiceInicio}-${indiceFin} de ${totalElementos} ${etiquetaElementos}`
            : `0 ${etiquetaElementos}`}
        </span>
      )}

      <div className={estilos.grupoControles}>
        {!esCompacto && (
          <button
            type="button"
            className={estiloBoton}
            onClick={() => irAPagina(1)}
            disabled={paginaActual <= 1}
            aria-label="Ir a la primera página"
            title="Primera página"
          >
            <ChevronsLeft size={tamanoIcono} />
          </button>
        )}

        <button
          type="button"
          className={estiloBoton}
          onClick={() => irAPagina(paginaActual - 1)}
          disabled={paginaActual <= 1}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={tamanoIcono} />
        </button>

        <span className={estiloTextoPagina}>
          {paginaActual} / {totalPaginas}
        </span>

        <button
          type="button"
          className={estiloBoton}
          onClick={() => irAPagina(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas}
          aria-label="Página siguiente"
          title="Página siguiente"
        >
          <ChevronRight size={tamanoIcono} />
        </button>

        {!esCompacto && (
          <button
            type="button"
            className={estiloBoton}
            onClick={() => irAPagina(totalPaginas)}
            disabled={paginaActual >= totalPaginas}
            aria-label="Ir a la última página"
            title="Última página"
          >
            <ChevronsRight size={tamanoIcono} />
          </button>
        )}
      </div>
    </nav>
  );
};
