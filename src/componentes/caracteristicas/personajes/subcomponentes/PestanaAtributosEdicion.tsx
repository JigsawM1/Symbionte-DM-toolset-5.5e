import React from "react";
import type { PersonajeJugador, Caracteristica } from "@/tipos";
import { CARACTERISTICAS_CLAVES } from "@/constantes";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import estilos from "../HojaPersonaje.module.css";

interface PestanaAtributosEdicionProps {
  form: PersonajeJugador;
  actualizarCaracteristicaBase: (carac: Caracteristica, valor: number) => void;
  actualizarOverrideFijo: (carac: Caracteristica, valor: number | null) => void;
}

export const PestanaAtributosEdicion: React.FC<PestanaAtributosEdicionProps> = ({
  form,
  actualizarCaracteristicaBase,
  actualizarOverrideFijo
}) => {
  return (
    <>
      <p className={estilos.textoInstruccionAtributos}>
        Establece las puntuaciones base de tu personaje. Si posees un objeto mágico que fija una puntuación (ej. <em>Cinturón de Fuerza de Gigante</em>), ingrésalo en el campo <strong>Override Fijo</strong>.
      </p>

      <div className={estilos.gridAtributosEdicion}>
        {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => {
          const carac = clave as Caracteristica;
          const valorBase = form.caracteristicas?.[carac] || 10;
          const override = form.overridesFijos?.[carac];

          return (
            <div key={carac} className={`${estilos.neoPressed} ${estilos.tarjetaAtributoEdicion}`}>
              <span className={estilos.etiquetaAtributoEdicion}>
                {etiqueta}
              </span>

              <div className={estilos.filaInputsAtributoEdicion}>
                <div className={estilos.columnaInputAtributo}>
                  <label className={estilos.labelMicroAtributo}>Base</label>
                  <CampoNumerico
                    className={`${estilos.inputFormulario} ${estilos.inputAtributoNumerico}`}
                    value={valorBase}
                    alConfirmar={(valor) => actualizarCaracteristicaBase(carac, valor)}
                    min="1"
                    max="30"
                    identidad={form.id}
                  />
                </div>

                <div className={estilos.columnaInputAtributo}>
                  <label className={estilos.labelMicroAtributo}>Override Fijo</label>
                  <CampoNumerico
                    className={`${estilos.inputFormulario} ${estilos.inputAtributoNumerico}`}
                    value={override !== null && override !== undefined ? override : ""}
                    alConfirmar={(valor) => actualizarOverrideFijo(carac, valor)}
                    placeholder="Ninguno"
                    min="1"
                    max="30"
                    alVaciar={() => actualizarOverrideFijo(carac, null)}
                    identidad={form.id}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
