import React, { useState } from "react";
import { ArrowUp } from "lucide-react";

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
    <div style={estilos.tarjetaCalculadora}>
      <div style={estilos.tituloCalculadora}>
        <ArrowUp size={12} style={{ color: "var(--color-advertencia)", marginRight: "4px" }} />
        <span>Calculadora de Salto</span>
      </div>

      <div style={estilos.cuerpoCalculadora}>
        <div style={estilos.filaFormulario}>
          <label style={estilos.labelForm}>Fuerza de Criatura:</label>
          <input
            type="number"
            value={puntuacionFuerza}
            onChange={(e) => setPuntuacionFuerza(Math.max(1, parseInt(e.target.value, 10) || 1))}
            style={estilos.inputForm}
            min={1}
            max={30}
          />
        </div>

        <div style={estilos.filaFormulario}>
          <label style={estilos.labelForm}>¿Carrera previa (10+ pies)?:</label>
          <select
            value={conCarrera ? "si" : "no"}
            onChange={(e) => setConCarrera(e.target.value === "si")}
            style={estilos.selectForm}
          >
            <option value="si">Sí (Carrera de 10 pies)</option>
            <option value="no">No (Salto estático)</option>
          </select>
        </div>

        <div style={estilos.resultadoCalculoBox}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <div>
              <div style={estilos.resultadoCalculoTexto}>Salto de Longitud:</div>
              <div style={{ ...estilos.resultadoCalculoValor, fontSize: "14px" }} className="dato-numerico">
                {calcularSaltoLongitud()} pies
              </div>
            </div>
            <div>
              <div style={estilos.resultadoCalculoTexto}>Salto de Altura:</div>
              <div style={{ ...estilos.resultadoCalculoValor, fontSize: "14px", color: "var(--color-advertencia)" }} className="dato-numerico">
                {calcularSaltoAltura()} pies
              </div>
            </div>
          </div>
          <div style={estilos.resultadoCalculoEfecto}>
            Nota: El salto consume movimiento de tu turno corriente en pies de forma equivalente a la distancia.
          </div>
        </div>
      </div>
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  tarjetaCalculadora: {
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    height: "fit-content"
  },
  tituloCalculadora: {
    fontSize: "13px",
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "2px",
    display: "flex",
    alignItems: "center"
  },
  cuerpoCalculadora: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },
  filaFormulario: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px"
  },
  labelForm: {
    fontSize: "13px",
    color: "var(--color-texto-secundario)"
  },
  selectForm: {
    fontSize: "12px",
    height: "24px",
    padding: "1px 2px",
    width: "200px"
  },
  inputForm: {
    fontSize: "12px",
    height: "24px",
    padding: "1px 2px",
    width: "200px",
    textAlign: "center"
  },
  resultadoCalculoBox: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "5px",
    marginTop: "5px",
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    gap: "6px"
  },
  resultadoCalculoTexto: {
    fontSize: "12px",
    color: "var(--color-texto-apagado)",
    textTransform: "uppercase"
  },
  resultadoCalculoValor: {
    fontSize: "18px",
    color: "var(--color-borde-cian)"
  },
  resultadoCalculoEfecto: {
    fontSize: "12px",
    color: "var(--color-texto-secundario)",
    fontStyle: "italic",
    lineHeight: "1.2",
    marginTop: "2px"
  }
};
