import React, { useState } from "react";
import { DiccionarioCondiciones } from "./DiccionarioCondiciones";
import { CalculadoraViaje } from "./CalculadoraViaje";
import { CalculadoraSalto } from "./CalculadoraSalto";
import { ConversorDivisas } from "./ConversorDivisas";
import { ConsolaCriticosPifias } from "./ConsolaCriticosPifias";
import { ReglasBasicas } from "./ReglasBasicas";
import {
  BookOpen,
  Footprints,
  Sparkles,
  HelpCircle
} from "lucide-react";
import estilosClases from "./TablasDM.module.css";

export const TablasDM: React.FC = () => {
  const [subCategoria, setSubCategoria] = useState<"condiciones" | "fisica" | "pifias" | "reglas">("condiciones");

  return (
    <div className={estilosClases.contenedorTablas}>
      {/* Selector de Sub-categoría superior */}
      <div className={estilosClases.subNavegacion}>
        <button
          onClick={() => setSubCategoria("condiciones")}
          className={`${estilosClases.subBotonNav} ${
            subCategoria === "condiciones" ? estilosClases.subBotonNavActivo : ""
          }`}
        >
          <BookOpen size={10} />
          Condiciones
        </button>

        <button
          onClick={() => setSubCategoria("fisica")}
          className={`${estilosClases.subBotonNav} ${
            subCategoria === "fisica" ? estilosClases.subBotonNavActivo : ""
          }`}
        >
          <Footprints size={10} />
          Calculadoras Viaje/Salto
        </button>

        <button
          onClick={() => setSubCategoria("pifias")}
          className={`${estilosClases.subBotonNav} ${
            subCategoria === "pifias" ? estilosClases.subBotonNavActivo : ""
          }`}
        >
          <Sparkles size={10} />
          Pifias y Críticos
        </button>

        <button
          onClick={() => setSubCategoria("reglas")}
          className={`${estilosClases.subBotonNav} ${
            subCategoria === "reglas" ? estilosClases.subBotonNavActivo : ""
          }`}
        >
          <HelpCircle size={10} />
          Reglas Básicas
        </button>
      </div>

      {/* Cuerpo del Visualizador */}
      <div className={estilosClases.cuerpoVisualizador}>
        {/* SECCIÓN 1: CONDICIONES Y EFECTOS ACTIVOS */}
        {subCategoria === "condiciones" && <DiccionarioCondiciones />}

        {/* SECCIÓN 2: CALCULADORAS FÍSICAS (Viaje, Salto, Divisas) */}
        {subCategoria === "fisica" && (
          <div className={estilosClases.seccionCalculadoras}>
            <CalculadoraViaje />
            <CalculadoraSalto />
            <ConversorDivisas />
          </div>
        )}

        {/* SECCIÓN 3: PIFIAS Y CRÍTICOS (CONSOLA E CONSULTA) */}
        {subCategoria === "pifias" && <ConsolaCriticosPifias />}

        {/* SECCIÓN 4: REGLAS BÁSICAS D&D 5.5e */}
        {subCategoria === "reglas" && <ReglasBasicas />}
      </div>
    </div>
  );
};
