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

  const esColumnaNivel =
    tabla.columnas.length >= 1 &&
    tabla.columnas[0].toLowerCase().includes("nivel");

  // Identificar la fila que aplica actualmente al nivel del personaje (solo si la tabla es de nivel)
  let nivelFilaActiva: number | null = null;
  if (esColumnaNivel && typeof nivelPersonaje === "number" && nivelPersonaje >= 1) {
    const filasAlcanzadas = tabla.filas.filter((f) => f.nivel <= nivelPersonaje);
    if (filasAlcanzadas.length > 0) {
      // Tomamos la de mayor nivel que sea menor o igual al nivel actual
      const ultimaAlcanzada = filasAlcanzadas.reduce((max, curr) => (curr.nivel > max.nivel ? curr : max));
      nivelFilaActiva = ultimaAlcanzada.nivel;
    }
  }

  const esTablaDosColumnas = tabla.columnas.length === 2;

  const esColumnaConjuros =
    tabla.columnas.length === 2 &&
    tabla.columnas[1].toLowerCase().includes("conjuro");

  return (
    <div className={estilos.contenedorTablaProgresion}>
      <table className={`${estilos.tablaEstilizada} ${esTablaDosColumnas ? estilos.tablaConjurosSubclase : ""}`}>
        <thead className={estilos.encabezadoTabla}>
          <tr>
            {tabla.columnas.map((col, idx) => {
              if (esTablaDosColumnas) {
                return (
                  <th
                    key={idx}
                    className={idx === 0 ? estilos.thNivelConjuros : estilos.thConjuros}
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
            const esFilaEnmarcada = idx % 2 === 0;

            const clasesFila = [
              esTablaDosColumnas
                ? esFilaEnmarcada
                  ? estilos.filaConjuroEnmarcada
                  : estilos.filaConjuroSimple
                : estilos.filaProgresion,
              esActual ? estilos.filaNivelActual : ""
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr key={idx} className={clasesFila}>
                {esTablaDosColumnas ? (
                  <>
                    <td className={estilos.celdaNivelConjuros}>
                      {fila.nivel}
                    </td>
                    <td className={esColumnaConjuros ? estilos.celdaConjuros : estilos.celdaTextoEnmarcada}>
                      <span>{fila.valores[0] || ""}</span>
                      {esActual && <span className={estilos.badgeActual}>Actual</span>}
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
