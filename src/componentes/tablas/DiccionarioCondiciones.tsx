import React, { useState } from "react";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "../../utiles/datosIniciales";
import estilos from "./DiccionarioCondiciones.module.css";

export const DiccionarioCondiciones: React.FC = () => {
  const [tipoDiccionario, setTipoDiccionario] = useState<"condiciones" | "efectos">("condiciones");
  const [condicionSeleccionada, setCondicionSeleccionada] = useState(CONDICIONES_2024[0]);
  const [efectoSeleccionado, setEfectoSeleccionado] = useState(EFECTOS_PREDEFINIDOS[0]);

  return (
    <div className={estilos.contenedorPrincipal}>
      {/* Pestañas internas de navegación */}
      <div className={estilos.pestañasInternas}>
        <button
          onClick={() => setTipoDiccionario("condiciones")}
          className={`${estilos.miniBotonTab} ${tipoDiccionario === "condiciones" ? estilos.miniBotonTabActivo : ""}`}
        >
          📜 CONDICIONES
        </button>
        <button
          onClick={() => setTipoDiccionario("efectos")}
          className={`${estilos.miniBotonTab} ${tipoDiccionario === "efectos" ? estilos.miniBotonTabEfectosActivo : ""}`}
        >
          EFECTOS ACTIVOS
        </button>
      </div>

      {tipoDiccionario === "condiciones" ? (
        <div className={estilos.seccionCondiciones}>
          <div className={estilos.listaCondicionesLateral}>
            {CONDICIONES_2024.map((c) => (
              <div
                key={c.nombre}
                onClick={() => setCondicionSeleccionada(c)}
                className={`${estilos.itemCondicionLista} ${condicionSeleccionada.nombre === c.nombre ? estilos.itemCondicionActivo : ""}`}
              >
                {c.nombre.split(" (")[0]}
              </div>
            ))}
          </div>

          <div className={estilos.detalleCondicionPanel}>
            <h3 className={estilos.tituloCondicion}>{condicionSeleccionada.nombre}</h3>
            <span className={estilos.origenCondicion}>{condicionSeleccionada.descripcion}</span>
            
            <div className={estilos.bloqueEfectosCondicion}>
              <div className={estilos.cabeceraBloqueEfectos}>EFECTOS DE ESTA CONDICIÓN:</div>
              <ul className={estilos.listaEfectos}>
                {condicionSeleccionada.efectos.map((efecto, i) => (
                  <li key={i} className={estilos.itemEfectoLista}>
                    <span style={{ color: "var(--color-borde-cian)", marginRight: "5px", fontWeight: "bold" }}>›</span>
                    {efecto}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className={estilos.seccionCondiciones}>
          <div className={estilos.listaCondicionesLateral}>
            {EFECTOS_PREDEFINIDOS.map((ef) => (
              <div
                key={ef.nombre}
                onClick={() => setEfectoSeleccionado(ef)}
                className={`${estilos.itemCondicionLista} ${efectoSeleccionado.nombre === ef.nombre ? estilos.itemCondicionEfectosActivo : ""}`}
              >
                {ef.nombre.split(" (")[0]}
              </div>
            ))}
          </div>

          <div className={estilos.detalleCondicionPanel}>
            <h3 className={`${estilos.tituloCondicion} ${estilos.tituloCondicionEfecto}`}>{efectoSeleccionado.nombre}</h3>
            <span className={estilos.origenCondicion}>
              DURACIÓN ESTÁNDAR: <strong style={{ color: "#d8b4fe" }}>{efectoSeleccionado.duracionEstandar} RONDAS</strong>
            </span>
            
            <div className={`${estilos.bloqueEfectosCondicion} ${estilos.bloqueEfectosEfecto}`}>
              <div className={`${estilos.cabeceraBloqueEfectos} ${estilos.cabeceraBloqueEfectosEfecto}`}>DESCRIPCIÓN Y REGLAS DEL EFECTO:</div>
              <div style={{ padding: "4px 2px", fontSize: "11px", color: "var(--color-texto-principal)", lineHeight: "1.45" }}>
                {efectoSeleccionado.descripcion}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
