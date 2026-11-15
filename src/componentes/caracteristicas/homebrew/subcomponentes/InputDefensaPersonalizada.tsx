import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import estilos from "../FormularioCriatura.module.css";

interface InputDefensaPersonalizadaProps {
  valoresActuales: string[];
  opcionesEstandar: string[];
  alAlternar: (valor: string) => void;
}

/**
 * Permite añadir defensas personalizadas y visualizar/quitar aquellas fuera del catálogo estándar.
 */
export const InputDefensaPersonalizada: React.FC<InputDefensaPersonalizadaProps> = ({
  valoresActuales,
  opcionesEstandar,
  alAlternar
}) => {
  const [textoPersonalizado, setTextoPersonalizado] = useState("");
  const personalizados = valoresActuales.filter((v) => !opcionesEstandar.includes(v));

  const agregarPersonalizada = () => {
    const limpio = textoPersonalizado.trim();
    if (!limpio) return;
    const yaExiste = valoresActuales.some((v) => v.toLowerCase() === limpio.toLowerCase());
    if (!yaExiste) {
      alAlternar(limpio);
    }
    setTextoPersonalizado("");
  };

  return (
    <>
      <div className={estilos.filaAgregarDefensa}>
        <input
          type="text"
          value={textoPersonalizado}
          onChange={(e) => setTextoPersonalizado(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarPersonalizada();
            }
          }}
          placeholder="Añadir defensa personalizada (ej. Contundente de armas no mágicas)"
          className={estilos.inputDinamicoLargo}
        />
        <button
          type="button"
          onClick={agregarPersonalizada}
          className={estilos.botonAgregarDinamico}
        >
          <Plus size={14} /> Añadir
        </button>
      </div>

      {personalizados.length > 0 && (
        <div className={estilos.contenedorChipsDefensa}>
          {personalizados.map((valor) => (
            <span key={valor} className={estilos.chipDefensaPersonalizada}>
              {valor}
              <button
                type="button"
                onClick={() => alAlternar(valor)}
                className={estilos.botonQuitarChip}
                aria-label={`Quitar ${valor}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
};
