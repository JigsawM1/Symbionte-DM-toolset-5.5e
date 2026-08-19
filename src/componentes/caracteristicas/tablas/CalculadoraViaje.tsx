import React, { useState } from "react";
import { Compass } from "lucide-react";
import { SelectorDesplegable } from "@/componentes/comunes";
import estilosClases from "./CalculadoraViaje.module.css";

const OPCIONES_PASO_VIAJE = [
  { valor: "lento", etiqueta: "Lento (2 millas/hora)" },
  { valor: "normal", etiqueta: "Normal (3 millas/hora)" },
  { valor: "rapido", etiqueta: "Rápido (4 millas/hora)" }
];

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
      return "Paso Lento: Permite viajar con Sigilo Activo.";
    }
    if (pasoViaje === "rapido") {
      return "Paso Rápido: Penalizador de -5 a la Percepción Pasiva para detectar emboscadas y trampas.";
    }
    return "Paso Normal: Viaje estándar sin bonificaciones ni penalizadores.";
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
          <div style={{ width: "200px" }}>
            <SelectorDesplegable
              valor={pasoViaje}
              alCambiar={(val) => setPasoViaje(val as "lento" | "normal" | "rapido")}
              opciones={OPCIONES_PASO_VIAJE}
              tamano="compacto"
            />
          </div>
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
