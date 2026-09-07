import React from "react";
import {
  BookMarked,
  Plus,
  RefreshCw,
  ChevronsUpDown,
  Swords,
  Search,
  X,
  SlidersHorizontal
} from "lucide-react";
import type { TipoAccionRasgo } from "@/tipos";
import estilos from "./VistaRasgosJugador.module.css";

export type FiltroTipoAccion = "todos" | TipoAccionRasgo;

interface CabeceraRasgosJugadorProps {
  totalRasgosFiltrados: number;
  totalRasgosPj: number;
  alAbrirCreacion: () => void;
  alSincronizar: () => void;
  alAlternarTodas: () => void;
  estanTodasExpandidas: boolean;
  modoVista: "mis_rasgos" | "progresion_clase" | "creador_homebrew";
  alCambiarModoVista: (modo: "mis_rasgos" | "progresion_clase") => void;
  consultaBusqueda: string;
  alCambiarBusqueda: (busqueda: string) => void;
  mostrarFiltros: boolean;
  alAlternarMostrarFiltros: () => void;
  filtroAccion: FiltroTipoAccion;
}

export const CabeceraRasgosJugador: React.FC<CabeceraRasgosJugadorProps> = ({
  totalRasgosFiltrados,
  totalRasgosPj,
  alAbrirCreacion,
  alSincronizar,
  alAlternarTodas,
  estanTodasExpandidas,
  modoVista,
  alCambiarModoVista,
  consultaBusqueda,
  alCambiarBusqueda,
  mostrarFiltros,
  alAlternarMostrarFiltros,
  filtroAccion
}) => {
  return (
    <div className={estilos.cabeceraCompacta}>
      <div className={estilos.filaCabecera}>
        <div className={estilos.grupoTitulo}>
          <BookMarked size={15} color="#38bdf8" />
          <h1 className={estilos.tituloTexto}>Rasgos y Dotes</h1>
          <span className={estilos.contadorBadge}>
            {totalRasgosFiltrados} / {totalRasgosPj}
          </span>
        </div>

        {/* Botones de Acción Rápida */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            className={`${estilos.botonHerramienta} ${estilos.botonHerramientaPrimario}`}
            onClick={alAbrirCreacion}
            title="Añadir rasgo o dote personalizado"
          >
            <Plus size={12} />
            <span>Añadir</span>
          </button>

          <button
            type="button"
            className={estilos.botonHerramienta}
            onClick={alSincronizar}
            title="Sincronizar rasgos estándar de Clase y Raza"
          >
            <RefreshCw size={11} />
          </button>

          <button
            type="button"
            className={estilos.botonHerramienta}
            onClick={alAlternarTodas}
            title={estanTodasExpandidas ? "Colapsar todas las secciones" : "Expandir todas las secciones"}
          >
            <ChevronsUpDown size={11} />
          </button>
        </div>
      </div>

      {/* Selector de Modo de Vista */}
      <div className={estilos.pestanasVistaModo}>
        <button
          type="button"
          className={`${estilos.botonPestanaModo} ${
            modoVista === "mis_rasgos" ? estilos.botonPestanaModoActivo : ""
          }`}
          onClick={() => alCambiarModoVista("mis_rasgos")}
        >
          <BookMarked size={12} />
          <span>Mis Rasgos Activos ({totalRasgosFiltrados})</span>
        </button>
        <button
          type="button"
          className={`${estilos.botonPestanaModo} ${
            modoVista === "progresion_clase" ? estilos.botonPestanaModoActivo : ""
          }`}
          onClick={() => alCambiarModoVista("progresion_clase")}
        >
          <Swords size={12} />
          <span>Progresión</span>
        </button>
      </div>

      {/* Fila de Buscador Compacto y Botón de Filtros */}
      {modoVista === "mis_rasgos" && (
        <div className={estilos.filaHerramientas}>
          <div className={estilos.cajaBuscadorCompacta}>
            <Search size={13} color="#64748b" />
            <input
              type="text"
              className={estilos.inputBuscador}
              placeholder="Buscar rasgo o regla..."
              value={consultaBusqueda}
              onChange={(e) => alCambiarBusqueda(e.target.value)}
            />
            {consultaBusqueda && (
              <button
                type="button"
                className={estilos.botonLimpiarBusqueda}
                onClick={() => alCambiarBusqueda("")}
                title="Limpiar búsqueda"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`${estilos.botonHerramienta} ${
              mostrarFiltros || filtroAccion !== "todos" ? estilos.botonHerramientaActivo : ""
            }`}
            onClick={alAlternarMostrarFiltros}
            title="Filtrar por tipo de acción"
          >
            <SlidersHorizontal size={11} />
            <span>Filtros{filtroAccion !== "todos" ? " (1)" : ""}</span>
          </button>
        </div>
      )}
    </div>
  );
};
