import React from "react";
import { Search, X, Maximize2, Minimize2, Plus } from "lucide-react";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import {
  CriterioOrdenMochila,
  OPCIONES_ORDEN_MOCHILA
} from "./usarInventarioOrdenado";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

interface BarraHerramientasInventarioProps {
  busquedaMochila: string;
  alCambiarBusqueda: (nueva: string) => void;
  criterioOrden: CriterioOrdenMochila;
  alCambiarOrden: (nuevo: CriterioOrdenMochila) => void;
  alExpandirTodas: () => void;
  alColapsarTodas: () => void;
  alAbrirModalAgregar: () => void;
}

export const BarraHerramientasInventario: React.FC<BarraHerramientasInventarioProps> = ({
  busquedaMochila,
  alCambiarBusqueda,
  criterioOrden,
  alCambiarOrden,
  alExpandirTodas,
  alColapsarTodas,
  alAbrirModalAgregar
}) => {
  return (
    <>
      <div className={estilos.barraControlesMochila}>
        <div className={estilos.cajaBuscadorMochila}>
          <Search size={12} className={estilos.iconoBuscadorMochila} />
          <input
            type="text"
            className={estilos.inputBuscadorMochila}
            placeholder="Buscar en el inventario..."
            value={busquedaMochila}
            onChange={(e) => alCambiarBusqueda(e.target.value)}
          />
          {busquedaMochila && (
            <button
              type="button"
              className={estilos.botonLimpiarBusquedaMochila}
              onClick={() => alCambiarBusqueda("")}
              title="Limpiar búsqueda"
            >
              <X size={11} />
            </button>
          )}
        </div>

        <div className={estilos.selectorOrdenMochila}>
          <SelectorDesplegable<CriterioOrdenMochila>
            valor={criterioOrden}
            alCambiar={alCambiarOrden}
            opciones={OPCIONES_ORDEN_MOCHILA}
            tamano="mini"
          />
        </div>

        {criterioOrden === "tipo" && (
          <div className={estilos.filaControlesColapso}>
            <button
              type="button"
              className={estilos.botonControlColapso}
              onClick={alExpandirTodas}
              title="Expandir todas las categorías"
            >
              <Maximize2 size={10} />
              <span>Expandir</span>
            </button>
            <button
              type="button"
              className={estilos.botonControlColapso}
              onClick={alColapsarTodas}
              title="Colapsar todas las categorías"
            >
              <Minimize2 size={10} />
              <span>Colapsar</span>
            </button>
          </div>
        )}
      </div>

      {/* Botón Superior de Agregar Objeto */}
      <button
        type="button"
        className={estilos.botonAgregarMochilaSuperior}
        onClick={alAbrirModalAgregar}
      >
        <Plus size={14} color="#f59e0b" />
        <span>Agregar Objeto</span>
      </button>
    </>
  );
};
