import React from "react";
import { TIPOS_DAÑO_DND, CONDICIONES_DND } from "../../../constantes/homebrewConstantes";
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

export const SeccionDefensas: React.FC<SeccionDefensasProps> = ({
  monstruoForm,
  subDefensas,
  setSubDefensas,
  alternarCheckArray
}) => {
  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.selectorDefensasNavegacion}>
        <button
          type="button"
          onClick={() => setSubDefensas("inmunidades")}
          className={`${estilos.subDefBoton} ${subDefensas === "inmunidades" ? estilos.subDefBotonActivo : ""}`}
        >
          Inm. Daño ({monstruoForm.inmunidadesDaño?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setSubDefensas("resistencias")}
          className={`${estilos.subDefBoton} ${subDefensas === "resistencias" ? estilos.subDefBotonActivo : ""}`}
        >
          Res. Daño ({monstruoForm.resistencias?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setSubDefensas("vulnerabilidades")}
          className={`${estilos.subDefBoton} ${subDefensas === "vulnerabilidades" ? estilos.subDefBotonActivo : ""}`}
        >
          Vuln. Daño ({monstruoForm.vulnerabilidades?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setSubDefensas("condiciones")}
          className={`${estilos.subDefBoton} ${subDefensas === "condiciones" ? estilos.subDefBotonActivo : ""}`}
        >
          Inm. Condic ({monstruoForm.inmunidadesCondicion?.length || 0})
        </button>
      </div>

      <div className={estilos.contenedorChecksDefensas}>
        {/* INMUNIDADES AL DAÑO */}
        {subDefensas === "inmunidades" && (
          <div className={estilos.gridCheckboxMini}>
            {TIPOS_DAÑO_DND.map((daño: string) => (
              <label key={`inm_${daño}`} className={estilos.labelCheckMini}>
                <input
                  type="checkbox"
                  checked={monstruoForm.inmunidadesDaño?.includes(daño) || false}
                  onChange={() => alternarCheckArray("inmunidadesDaño", daño)}
                  className={estilos.checkMini}
                />
                {daño}
              </label>
            ))}
          </div>
        )}

        {/* RESISTENCIAS AL DAÑO */}
        {subDefensas === "resistencias" && (
          <div className={estilos.gridCheckboxMini}>
            {TIPOS_DAÑO_DND.map((daño: string) => (
              <label key={`res_${daño}`} className={estilos.labelCheckMini}>
                <input
                  type="checkbox"
                  checked={monstruoForm.resistencias?.includes(daño) || false}
                  onChange={() => alternarCheckArray("resistencias", daño)}
                  className={estilos.checkMini}
                />
                {daño}
              </label>
            ))}
          </div>
        )}

        {/* VULNERABILIDADES AL DAÑO */}
        {subDefensas === "vulnerabilidades" && (
          <div className={estilos.gridCheckboxMini}>
            {TIPOS_DAÑO_DND.map((daño: string) => (
              <label key={`vuln_${daño}`} className={estilos.labelCheckMini}>
                <input
                  type="checkbox"
                  checked={monstruoForm.vulnerabilidades?.includes(daño) || false}
                  onChange={() => alternarCheckArray("vulnerabilidades", daño)}
                  className={estilos.checkMini}
                />
                {daño}
              </label>
            ))}
          </div>
        )}

        {/* INMUNIDADES A CONDICIONES */}
        {subDefensas === "condiciones" && (
          <div className={estilos.gridCheckboxMini}>
            {CONDICIONES_DND.map((condicion: string) => (
              <label key={`inm_cond_${condicion}`} className={estilos.labelCheckMini}>
                <input
                  type="checkbox"
                  checked={monstruoForm.inmunidadesCondicion?.includes(condicion) || false}
                  onChange={() => alternarCheckArray("inmunidadesCondicion", condicion)}
                  className={estilos.checkMini}
                />
                {condicion}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
