import React from "react";
import { TIPOS_DAÑO_DND, CONDICIONES_DND } from "@/constantes/homebrewConstantes";
import estilos from "../FormularioCriatura.module.css";

interface SeccionDefensasProps {
  monstruoForm: {
    vulnerabilidades?: string[];
    resistencias?: string[];
    inmunidadesDaño?: string[];
    inmunidadesCondicion?: string[];
  };
  subDefensas: "inmunidades" | "resistencias" | "vulnerabilidades" | "condiciones";
  setSubDefensas: (defensa: "inmunidades" | "resistencias" | "vulnerabilidades" | "condiciones") => void;
  alternarCheckArray: (campo: "vulnerabilidades" | "resistencias" | "inmunidadesDaño" | "inmunidadesCondicion", valor: string) => void;
}

const defensas: {
  pestana: SeccionDefensasProps["subDefensas"];
  campo: keyof SeccionDefensasProps["monstruoForm"];
  etiqueta: string;
  prefijo: string;
  opciones: string[];
}[] = [
  { pestana: "inmunidades", campo: "inmunidadesDaño", etiqueta: "Inm. Daño", prefijo: "inm", opciones: TIPOS_DAÑO_DND },
  { pestana: "resistencias", campo: "resistencias", etiqueta: "Res. Daño", prefijo: "res", opciones: TIPOS_DAÑO_DND },
  { pestana: "vulnerabilidades", campo: "vulnerabilidades", etiqueta: "Vuln. Daño", prefijo: "vuln", opciones: TIPOS_DAÑO_DND },
  { pestana: "condiciones", campo: "inmunidadesCondicion", etiqueta: "Inm. Condic", prefijo: "inm_cond", opciones: CONDICIONES_DND }
];

export const SeccionDefensas: React.FC<SeccionDefensasProps> = ({
  monstruoForm,
  subDefensas,
  setSubDefensas,
  alternarCheckArray
}) => {
  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.selectorDefensasNavegacion}>
        {defensas.map(({ pestana, campo, etiqueta }) => (
          <button
            key={pestana}
            type="button"
            onClick={() => setSubDefensas(pestana)}
            className={`${estilos.subDefBoton} ${subDefensas === pestana ? estilos.subDefBotonActivo : ""}`}
          >
            {etiqueta} ({monstruoForm[campo]?.length || 0})
          </button>
        ))}
      </div>

      <div className={estilos.contenedorChecksDefensas}>
        {defensas.map(({ pestana, campo, prefijo, opciones }) => subDefensas === pestana && (
          <div key={pestana} className={estilos.gridCheckboxMini}>
            {opciones.map((valor) => (
              <label key={`${prefijo}_${valor}`} className={estilos.labelCheckMini}>
                <input
                  type="checkbox"
                  checked={monstruoForm[campo]?.includes(valor) || false}
                  onChange={() => alternarCheckArray(campo, valor)}
                  className={estilos.checkMini}
                />
                {valor}
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
