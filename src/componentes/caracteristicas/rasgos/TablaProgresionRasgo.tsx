import React from "react";
import type { TablaEscaladoRasgo } from "@/tipos/rasgos";
import estilos from "./TablaProgresionRasgo.module.css";

interface TablaProgresionRasgoProps {
  tabla: TablaEscaladoRasgo;
  nivelPersonaje?: number;
}

export const TablaProgresionRasgo: React.FC<TablaProgresionRasgoProps> = ({
  tabla,
  nivelPersonaje
}) => {
  if (!tabla || !tabla.filas || tabla.filas.length === 0) {
    return null;
  }

  // Identificar la fila que aplica actualmente al nivel del personaje
  let nivelFilaActiva: number | null = null;
  if (typeof nivelPersonaje === "number" && nivelPersonaje >= 1) {
    const filasAlcanzadas = tabla.filas.filter((f) => f.nivel <= nivelPersonaje);
    if (filasAlcanzadas.length > 0) {
      // Tomamos la de mayor nivel que sea menor o igual al nivel actual
      const ultimaAlcanzada = filasAlcanzadas.reduce((max, curr) => (curr.nivel > max.nivel ? curr : max));
      nivelFilaActiva = ultimaAlcanzada.nivel;
    }
  }

  const esTablaDosColumnasNivel =
    tabla.columnas.length === 2 &&
    tabla.columnas[0].toLowerCase().includes("nivel");

  const esColumnaConjuros =
    tabla.columnas.length === 2 &&
    tabla.columnas[1].toLowerCase().includes("conjuro");

  return (
    <div className={estilos.contenedorTablaProgresion}>
      <table className={`${estilos.tablaEstilizada} ${esColumnaConjuros ? estilos.tablaConjurosSubclase : ""}`}>
        <thead className={estilos.encabezadoTabla}>
          <tr>
            {tabla.columnas.map((col, idx) => {
              if (esTablaDosColumnasNivel) {
                return idx === 0 ? (
                  <th
                    key={idx}
                    className={esColumnaConjuros ? estilos.thNivelConjuros : estilos.thNivel}
                  >
                    {col}
                  </th>
                ) : (
                  <th
                    key={idx}
                    className={esColumnaConjuros ? estilos.thConjuros : estilos.thDescripcion}
                  >
                    {col}
                  </th>
                );
              }
              return (
                <th key={idx} className={estilos.thGenerico}>
                  {col}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tabla.filas.map((fila, idx) => {
            const esActual = nivelFilaActiva === fila.nivel;
            const esAlcanzado = typeof nivelPersonaje === "number" && fila.nivel <= nivelPersonaje;
            const esFilaEnmarcada = esColumnaConjuros && idx % 2 === 0;

            const clasesFila = [
              estilos.filaProgresion,
              esColumnaConjuros
                ? esFilaEnmarcada
                  ? estilos.filaConjuroEnmarcada
                  : estilos.filaConjuroSimple
                : esActual
                ? estilos.filaNivelActual
                : esAlcanzado
                ? estilos.filaNivelAlcanzado
                : ""
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr key={idx} className={clasesFila}>
                {esTablaDosColumnasNivel ? (
                  <>
                    <td className={esColumnaConjuros ? estilos.celdaNivelConjuros : estilos.celdaNivel}>
                      {fila.nivel}
                    </td>
                    <td className={esColumnaConjuros ? estilos.celdaConjuros : estilos.celdaDescripcion}>
                      <span>{fila.valores[0] || ""}</span>
                      {esActual && !esColumnaConjuros && <span className={estilos.badgeActual}>Actual</span>}
                    </td>
                  </>
                ) : (
                  <>
                    <td className={estilos.celdaNivel}>{fila.nivel}</td>
                    {fila.valores.map((val, vIdx) => (
                      <td key={vIdx} className={estilos.celdaGenerica}>
                        <span>{val}</span>
                        {esActual && vIdx === 0 && <span className={estilos.badgeActual}>Actual</span>}
                      </td>
                    ))}
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {tabla.notaPie && <p className={estilos.notaPie}>{tabla.notaPie}</p>}
    </div>
  );
};
