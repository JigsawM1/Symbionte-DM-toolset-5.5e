import React from "react";
import { TIPOS_DAÑO_DND, CONDICIONES_DND } from "@/constantes/homebrewConstantes";
import estilos from "../FormularioCriatura.module.css";
import { InputDefensaPersonalizada } from "./InputDefensaPersonalizada";

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
  opciones: string[];
}[] = [
  { pestana: "inmunidades", campo: "inmunidadesDaño", etiqueta: "Inmunidades", opciones: TIPOS_DAÑO_DND },
  { pestana: "resistencias", campo: "resistencias", etiqueta: "Resistencias", opciones: TIPOS_DAÑO_DND },
  { pestana: "vulnerabilidades", campo: "vulnerabilidades", etiqueta: "Vulnerabilidades", opciones: TIPOS_DAÑO_DND },
  { pestana: "condiciones", campo: "inmunidadesCondicion", etiqueta: "Condiciones", opciones: CONDICIONES_DND }
];

export const SeccionDefensas: React.FC<SeccionDefensasProps> = ({
  monstruoForm,
  subDefensas,
  setSubDefensas,
  alternarCheckArray
}) => {
  const defensaActiva = defensas.find((d) => d.pestana === subDefensas) ?? defensas[0];
  const valoresActuales = monstruoForm[defensaActiva.campo] ?? [];

  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.selectorDefensasNavegacion}>
        {defensas.map(({ pestana, campo, etiqueta }) => (
          <button
            key={pestana}
            type="button"
            aria-pressed={subDefensas === pestana}
            onClick={() => setSubDefensas(pestana)}
            className={`${estilos.subDefBoton} ${subDefensas === pestana ? estilos.subDefBotonActivo : ""}`}
          >
            {etiqueta} ({monstruoForm[campo]?.length || 0})
          </button>
        ))}
      </div>

      <div className={estilos.contenedorChecksDefensas}>
        <div className={estilos.gridCheckboxMini}>
          {defensaActiva.opciones.map((valor) => (
            <label key={valor} className={estilos.labelCheckMini}>
              <input
                type="checkbox"
                checked={valoresActuales.includes(valor)}
                onChange={() => alternarCheckArray(defensaActiva.campo, valor)}
                className={estilos.checkMini}
              />
              {valor}
            </label>
          ))}
        </div>
      </div>

      <InputDefensaPersonalizada
        valoresActuales={valoresActuales}
        opcionesEstandar={defensaActiva.opciones}
        alAlternar={(valor) => alternarCheckArray(defensaActiva.campo, valor)}
      />
    </div>
  );
};
