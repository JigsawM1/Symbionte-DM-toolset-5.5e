import React from "react";
import {
  Search,
  Filter,
  X,
  ChevronsUpDown,
  Flame,
  Zap,
  Shield,
  Sparkles
} from "lucide-react";
import type { FiltroComponentesConjuro } from "@/utiles/filtrosConjuros";
import estilos from "./PanelConjurosPersonaje.module.css";

interface BarraFiltrosConjurosProps {
  busqueda: string;
  alCambiarBusqueda: (nueva: string) => void;
  mostrarFiltros: boolean;
  alAlternarMostrarFiltros: () => void;
  conteoFiltrosActivos: number;
  hayFiltrosActivos: boolean;
  alAlternarTodasLasSecciones: (abrir: boolean) => void;
  filtroConcentracion: "todos" | "sin" | "con";
  alCambiarFiltroConcentracion: (valor: "todos" | "sin" | "con") => void;
  filtroResolucion: "todos" | "ataque" | "salvacion" | "utilidad";
  alCambiarFiltroResolucion: (valor: "todos" | "ataque" | "salvacion" | "utilidad") => void;
  filtroComponentes: FiltroComponentesConjuro;
  alCambiarFiltroComponentes: React.Dispatch<React.SetStateAction<FiltroComponentesConjuro>>;
  alLimpiarTodosLosFiltros: () => void;
}

export const BarraFiltrosConjuros: React.FC<BarraFiltrosConjurosProps> = ({
  busqueda,
  alCambiarBusqueda,
  mostrarFiltros,
  alAlternarMostrarFiltros,
  conteoFiltrosActivos,
  hayFiltrosActivos,
  alAlternarTodasLasSecciones,
  filtroConcentracion,
  alCambiarFiltroConcentracion,
  filtroResolucion,
  alCambiarFiltroResolucion,
  filtroComponentes,
  alCambiarFiltroComponentes,
  alLimpiarTodosLosFiltros
}) => {
  return (
    <div className={estilos.barraFiltrosConjuros}>
      <div className={estilos.filaPrincipalFiltros}>
        <div className={estilos.cajaBuscador}>
          <Search size={13} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por nombre, escuela o descripción..."
            value={busqueda}
            onChange={(e) => alCambiarBusqueda(e.target.value)}
            className={estilos.inputBuscador}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => alCambiarBusqueda("")}
              className={estilos.botonLimpiarBusqueda}
              title="Borrar búsqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={alAlternarMostrarFiltros}
          className={`${estilos.botonToggleFiltros} ${
            mostrarFiltros || hayFiltrosActivos ? estilos.botonToggleFiltrosActivo : ""
          }`}
        >
          <Filter size={13} />
          <span>Filtros</span>
          {hayFiltrosActivos && (
            <span className={estilos.badgeFiltrosActivos}>{conteoFiltrosActivos}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => alAlternarTodasLasSecciones(true)}
          className={estilos.botonAccionRapidaSecciones}
          title="Expandir todos los niveles"
        >
          <ChevronsUpDown size={12} />
          <span>Expandir</span>
        </button>

        <button
          type="button"
          onClick={() => alAlternarTodasLasSecciones(false)}
          className={estilos.botonAccionRapidaSecciones}
          title="Colapsar todos los niveles"
        >
          <span>Colapsar</span>
        </button>
      </div>

      {mostrarFiltros && (
        <div className={estilos.panelFiltrosAvanzados}>
          {/* Filtro 1: Concentración */}
          <div className={estilos.filaGrupoFiltro}>
            <span className={estilos.etiquetaGrupoFiltro}>Concentración:</span>
            <div className={estilos.grupoChipsFiltro}>
              <button
                type="button"
                onClick={() => alCambiarFiltroConcentracion("todos")}
                className={`${estilos.chipFiltro} ${
                  filtroConcentracion === "todos" ? estilos.chipFiltroActivo : ""
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => alCambiarFiltroConcentracion("sin")}
                className={`${estilos.chipFiltro} ${
                  filtroConcentracion === "sin" ? estilos.chipFiltroActivo : ""
                }`}
              >
                Sin Concentración
              </button>
              <button
                type="button"
                onClick={() => alCambiarFiltroConcentracion("con")}
                className={`${estilos.chipFiltro} ${
                  filtroConcentracion === "con" ? estilos.chipFiltroPeligroActivo : ""
                }`}
              >
                <Flame size={11} color={filtroConcentracion === "con" ? "#fca5a5" : "#ef4444"} />
                Con Concentración
              </button>
            </div>
          </div>

          {/* Filtro 2: Tipo de Resolución */}
          <div className={estilos.filaGrupoFiltro}>
            <span className={estilos.etiquetaGrupoFiltro}>Resolución:</span>
            <div className={estilos.grupoChipsFiltro}>
              <button
                type="button"
                onClick={() => alCambiarFiltroResolucion("todos")}
                className={`${estilos.chipFiltro} ${
                  filtroResolucion === "todos" ? estilos.chipFiltroActivo : ""
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => alCambiarFiltroResolucion("ataque")}
                className={`${estilos.chipFiltro} ${
                  filtroResolucion === "ataque" ? estilos.chipFiltroActivo : ""
                }`}
              >
                <Zap size={11} color={filtroResolucion === "ataque" ? "#c4b5fd" : "#a78bfa"} />
                Tirada de Ataque
              </button>
              <button
                type="button"
                onClick={() => alCambiarFiltroResolucion("salvacion")}
                className={`${estilos.chipFiltro} ${
                  filtroResolucion === "salvacion" ? estilos.chipFiltroActivo : ""
                }`}
              >
                <Shield size={11} color={filtroResolucion === "salvacion" ? "#bae6fd" : "#38bdf8"} />
                Salvación (CD)
              </button>
              <button
                type="button"
                onClick={() => alCambiarFiltroResolucion("utilidad")}
                className={`${estilos.chipFiltro} ${
                  filtroResolucion === "utilidad" ? estilos.chipFiltroActivo : ""
                }`}
              >
                <Sparkles size={11} color={filtroResolucion === "utilidad" ? "#a7f3d0" : "#34d399"} />
                Utilidad / Efecto
              </button>
            </div>
          </div>

          {/* Filtro 3: Componentes */}
          <div className={estilos.filaGrupoFiltro}>
            <span className={estilos.etiquetaGrupoFiltro}>Componentes:</span>
            <div className={estilos.grupoChipsFiltro}>
              <button
                type="button"
                onClick={() =>
                  alCambiarFiltroComponentes((prev) => ({ ...prev, sinV: !prev.sinV }))
                }
                className={`${estilos.chipFiltro} ${
                  filtroComponentes.sinV ? estilos.chipFiltroActivo : ""
                }`}
                title="Ocultar hechizos que requieran componente Verbal (útil en Silencio / Sigilo)"
              >
                Sin V (Verbal)
              </button>
              <button
                type="button"
                onClick={() =>
                  alCambiarFiltroComponentes((prev) => ({ ...prev, sinS: !prev.sinS }))
                }
                className={`${estilos.chipFiltro} ${
                  filtroComponentes.sinS ? estilos.chipFiltroActivo : ""
                }`}
                title="Ocultar hechizos que requieran componente Somático (útil si estás atado o sin manos libres)"
              >
                Sin S (Somático)
              </button>
              <button
                type="button"
                onClick={() =>
                  alCambiarFiltroComponentes((prev) => ({ ...prev, sinM: !prev.sinM, soloM: false }))
                }
                className={`${estilos.chipFiltro} ${
                  filtroComponentes.sinM ? estilos.chipFiltroActivo : ""
                }`}
                title="Ocultar hechizos que requieran componente Material (útil si estás sin foco ni bolsa)"
              >
                Sin M (Material)
              </button>
              <button
                type="button"
                onClick={() =>
                  alCambiarFiltroComponentes((prev) => ({ ...prev, soloM: !prev.soloM, sinM: false }))
                }
                className={`${estilos.chipFiltro} ${
                  filtroComponentes.soloM ? estilos.chipFiltroActivo : ""
                }`}
                title="Mostrar únicamente hechizos que requieran componente Material"
              >
                Requiere M
              </button>
            </div>
          </div>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={alLimpiarTodosLosFiltros}
              className={estilos.botonResetFiltros}
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
};
