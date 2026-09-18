import React from "react";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import estilos from "./SelectorCompetencias.module.css";

interface PestanaListaSimpleCompetenciasProps {
  titulo: string;
  itemsDisponibles: readonly string[];
  itemsSeleccionados: string[];
  filtroTexto: string;
  alternarItem: (item: string) => void;
  anchoMinimoColumna?: number;
}

export const PestanaListaSimpleCompetencias: React.FC<PestanaListaSimpleCompetenciasProps> = ({
  titulo,
  itemsDisponibles,
  itemsSeleccionados,
  filtroTexto,
  alternarItem,
  anchoMinimoColumna = 160
}) => {
  const filtro = filtroTexto.trim().toLowerCase();

  return (
    <div className={estilos.contenedorPestana}>
      <div className={estilos.bloqueSeccion}>
        <span className={estilos.labelSeccion}>
          {titulo} ({itemsSeleccionados.length} seleccionados)
        </span>
        <div
          className={estilos.gridItemsCompetencias}
          data-ancho-columna={anchoMinimoColumna}
        >
          {itemsDisponibles
            .filter((item) => coincideBusquedaTolerante(item, filtro))
            .map((item) => {
              const check = itemsSeleccionados.includes(item);
              return (
                <label
                  key={item}
                  className={estilos.itemCompetenciaLabel}
                  data-check={check}
                >
                  <input
                    type="checkbox"
                    checked={check}
                    onChange={() => alternarItem(item)}
                  />
                  <span>{item}</span>
                </label>
              );
            })}
        </div>
      </div>
    </div>
  );
};
