import React, { useState } from "react";
import { Coins } from "lucide-react";
import estilosClases from "./ConversorDivisas.module.css";

export const ConversorDivisas: React.FC = () => {
  const [cantidadDivisa, setCantidadDivisa] = useState<number>(100);
  const [monedaOrigen, setMonedaOrigen] = useState<"PC" | "PP" | "PE" | "PO" | "PPT">("PO");

  const calcularCambioDivisas = () => {
    let totalCobre = cantidadDivisa;
    if (monedaOrigen === "PP") totalCobre = cantidadDivisa * 10;
    else if (monedaOrigen === "PE") totalCobre = cantidadDivisa * 50;
    else if (monedaOrigen === "PO") totalCobre = cantidadDivisa * 100;
    else if (monedaOrigen === "PPT") totalCobre = cantidadDivisa * 1000;

    const formatear = (valor: number) => {
      if (Number.isInteger(valor)) return valor.toLocaleString("es-ES");
      return valor.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return {
      PC: formatear(totalCobre),
      PP: formatear(totalCobre / 10),
      PE: formatear(totalCobre / 50),
      PO: formatear(totalCobre / 100),
      PPT: formatear(totalCobre / 1000),
    };
  };

  return (
    <div className={estilosClases.tarjetaCalculadora}>
      <div className={estilosClases.tituloCalculadora}>
        <Coins size={12} style={{ color: "#f9e2af", marginRight: "4px" }} />
        <span>Conversor de Divisas (Cambio de Monedas D&D 5e)</span>
      </div>

      <div className={estilosClases.cuerpoCalculadora}>
        <div className={estilosClases.filaFormulario}>
          <label className={estilosClases.labelForm}>Cantidad a cambiar:</label>
          <input
            type="number"
            value={cantidadDivisa}
            onChange={(e) => setCantidadDivisa(Math.max(0, parseFloat(e.target.value) || 0))}
            className={estilosClases.inputForm}
            min={0}
          />
        </div>

        <div className={estilosClases.filaFormulario}>
          <label className={estilosClases.labelForm}>Moneda Origen:</label>
          <select
            value={monedaOrigen}
            onChange={(e) => setMonedaOrigen(e.target.value as "PC" | "PP" | "PE" | "PO" | "PPT")}
            className={estilosClases.selectForm}
          >
            <option value="PC">Cobre (PC)</option>
            <option value="PP">Plata (PP)</option>
            <option value="PE">Electro (PE)</option>
            <option value="PO">Oro (PO)</option>
            <option value="PPT">Platino (PPT)</option>
          </select>
        </div>

        <div className={estilosClases.contenedorCambios}>
          <div className={estilosClases.tablaEncabezado}>
            <span>MONEDA EQUIVALENTE</span>
            <span>VALOR</span>
          </div>

          {(() => {
            const cambios = calcularCambioDivisas();
            const monedas = [
              { clave: "PPT", nombre: "Platino (PPT)", color: "#cdd6f4", desc: "1 PPT = 10 PO" },
              { clave: "PO", nombre: "Oro (PO)", color: "#f9e2af", desc: "1 PO = 10 PP" },
              { clave: "PE", nombre: "Electro (PE)", color: "#a6e3a1", desc: "1 PE = 5 PP" },
              { clave: "PP", nombre: "Plata (PP)", color: "#bac2de", desc: "1 PP = 10 PC" },
              { clave: "PC", nombre: "Cobre (PC)", color: "#fab387", desc: "Moneda Base" }
            ];

            return monedas.map((m) => {
              const esOrigen = m.clave === monedaOrigen;
              return (
                <div
                  key={m.clave}
                  className={`${estilosClases.filaCambio} ${
                    esOrigen ? estilosClases.filaCambioOrigen : ""
                  }`}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: m.color }}>
                      {m.nombre} {esOrigen && "⭐"}
                    </span>
                    <span style={{ fontSize: "8px", color: "var(--color-texto-secundario)" }}>
                      {m.desc}
                    </span>
                  </div>
                  <span
                    className={`${estilosClases.cambioValor} ${
                      esOrigen ? estilosClases.cambioValorOrigen : ""
                    }`}
                  >
                    {cambios[m.clave as keyof typeof cambios]}
                  </span>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};
