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
    const filasAlcanzadas = tabla.filas.filter(
      (f): f is typeof f & { nivel: number } => typeof f.nivel === "number" && f.nivel <= nivelPersonaje
    );
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
      {tabla.titulo && <div className={estilos.tituloTabla}>{tabla.titulo}</div>}
      <table className={`${estilos.tablaEstilizada} ${esTablaDosColumnas ? estilos.tablaConjurosSubclase : ""}`}>
        <thead className={estilos.encabezadoTabla}>
          <tr>
            {tabla.columnas.map((col, idx) => (
              <th key={idx} className={esTablaDosColumnas
                ? idx === 0 ? estilos.thNivelConjuros : estilos.thConjuros
                : estilos.thGenerico}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabla.filas.map((fila, idx) => {
            const esActual = typeof fila.nivel === "number" && nivelFilaActiva === fila.nivel;
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
                      {typeof fila.nivel === "number" ? fila.nivel : (fila.valores[0] ?? "")}
                    </td>
                    <td className={esColumnaConjuros ? estilos.celdaConjuros : estilos.celdaTextoEnmarcada}>
                      <span>{typeof fila.nivel === "number" ? (fila.valores[0] ?? "") : (fila.valores[1] ?? "")}</span>
                      {esActual && <span className={estilos.badgeActual}>Actual</span>}
                    </td>
                  </>
                ) : (
                  <>
                    {typeof fila.nivel === "number" && <td className={estilos.celdaNivel}>{fila.nivel}</td>}
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
