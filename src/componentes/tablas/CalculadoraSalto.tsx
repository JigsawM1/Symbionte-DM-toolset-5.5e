import React, { useState } from "react";
import { ArrowUp } from "lucide-react";
import estilos from "./CalculadoraSalto.module.css";

export const CalculadoraSalto: React.FC = () => {
  const [puntuacionFuerza, setPuntuacionFuerza] = useState(10);
  const [conCarrera, setConCarrera] = useState(true);

  const calcularSaltoLongitud = () => {
    return conCarrera ? puntuacionFuerza : Math.floor(puntuacionFuerza / 2);
  };

  const calcularSaltoAltura = () => {
    const modificadorFuerza = Math.floor((puntuacionFuerza - 10) / 2);
    const alturaBase = 3 + modificadorFuerza;
    const resultado = conCarrera ? alturaBase : Math.floor(alturaBase / 2);
    return Math.max(1, resultado); // Mínimo 1 pie de salto de altura
  };

  return (
    <div className={estilos.tarjetaCalculadora}>
      <div className={estilos.tituloCalculadora}>
        <ArrowUp size={12} style={{ color: "var(--color-advertencia)", marginRight: "4px" }} />
        <span>Calculadora de Salto</span>
      </div>

      <div className={estilos.cuerpoCalculadora}>
        <div className={estilos.filaFormulario}>
          <label className={estilos.labelForm}>Fuerza de Criatura:</label>
          <input
            type="number"
            value={puntuacionFuerza}
            onChange={(e) => setPuntuacionFuerza(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className={estilos.inputForm}
            min={1}
            max={30}
          />
        </div>

        <div className={estilos.filaFormulario}>
          <label className={estilos.labelForm}>¿Carrera previa (10+ pies)?:</label>
          <select
            value={conCarrera ? "si" : "no"}
            onChange={(e) => setConCarrera(e.target.value === "si")}
            className={estilos.selectForm}
          >
            <option value="si">Sí (Carrera de 10 pies)</option>
            <option value="no">No (Salto estático)</option>
          </select>
        </div>

        <div className={estilos.resultadoCalculoBox}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <div>
              <div className={estilos.resultadoCalculoTexto}>Salto de Longitud:</div>
              <div className={`${estilos.resultadoCalculoValor} dato-numerico`} style={{ fontSize: "14px" }}>
                {calcularSaltoLongitud()} pies
              </div>
            </div>
            <div>
              <div className={estilos.resultadoCalculoTexto}>Salto de Altura:</div>
              <div className={`${estilos.resultadoCalculoValor} ${estilos.resultadoCalculoValorAdvertencia} dato-numerico`} style={{ fontSize: "14px" }}>
                {calcularSaltoAltura()} pies
              </div>
            </div>
          </div>
          <div className={estilos.resultadoCalculoEfecto}>
            Nota: El salto consume movimiento de tu turno corriente en pies de forma equivalente a la distancia.
          </div>
        </div>
      </div>
    </div>
  );
};
