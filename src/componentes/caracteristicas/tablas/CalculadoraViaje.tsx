import React, { useState } from "react";
import { Compass } from "lucide-react";
import estilosClases from "./CalculadoraViaje.module.css";

export const CalculadoraViaje: React.FC = () => {
  const [pasoViaje, setPasoViaje] = useState<"lento" | "normal" | "rapido">("normal");
  const [horasViaje, setHorasViaje] = useState(8);

  const calcularViajeMillas = () => {
    let velocidadMillasPorHora = 3;
    if (pasoViaje === "lento") velocidadMillasPorHora = 2;
    if (pasoViaje === "rapido") velocidadMillasPorHora = 4;
    return horasViaje * velocidadMillasPorHora;
  };

  const obtenerEfectoPasoViaje = () => {
    if (pasoViaje === "lento") {
      return "Paso Lento: Permite viajar con Sigilo Activo (pueden moverse sigilosamente a ritmo normal bajo el manual 2024).";
    }
    if (pasoViaje === "rapido") {
      return "Paso Rápido: Penalizador de -5 a la Percepción Pasiva para detectar emboscadas y trampas.";
    }
    return "Paso Normal: Viaje estándar sin bonificaciones ni penalizadores tácticos.";
  };

  return (
    <div className={estilosClases.tarjetaCalculadora}>
      <div className={estilosClases.tituloCalculadora}>
        <Compass size={12} style={{ color: "var(--color-borde-cian)", marginRight: "4px" }} />
        <span>Calculadora de Viaje</span>
      </div>
      
      <div className={estilosClases.cuerpoCalculadora}>
        <div className={estilosClases.filaFormulario}>
          <label className={estilosClases.labelForm}>Paso del Viaje:</label>
          <select
            value={pasoViaje}
            onChange={(e) => setPasoViaje(e.target.value as "lento" | "normal" | "rapido")}
            className={estilosClases.selectForm}
          >
            <option value="lento">Lento (2 millas/hora)</option>
            <option value="normal">Normal (3 millas/hora)</option>
            <option value="rapido">Rápido (4 millas/hora)</option>
          </select>
        </div>

        <div className={estilosClases.filaFormulario}>
          <label className={estilosClases.labelForm}>Horas de Viaje:</label>
          <input
            type="number"
            value={horasViaje}
            onChange={(e) => setHorasViaje(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className={estilosClases.inputForm}
            min={1}
            max={24}
          />
        </div>

        <div className={estilosClases.resultadoCalculoBox}>
          <div className={estilosClases.resultadoCalculoTexto}>
            Distancia Recorrida:
          </div>
          <div className={estilosClases.resultadoCalculoValor}>
            {calcularViajeMillas()} millas
          </div>
          <div className={estilosClases.resultadoCalculoEfecto}>
            {obtenerEfectoPasoViaje()}
          </div>
        </div>
      </div>
    </div>
  );
};
