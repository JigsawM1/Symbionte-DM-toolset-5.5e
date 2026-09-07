import React from "react";
import type { PersonajeJugador } from "@/tipos";
import { SelectorSugerencias } from "@/componentes/comunes/SelectorSugerencias";
import estilos from "./ConfiguracionPersonaje.module.css";

export interface PestanaSentidosSaludProps {
  form: PersonajeJugador;
  alActualizarCampo: <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => void;
  alActualizarHPMaximoBase: (nuevoMaxBase: number) => void;
}

/**
 * Pestaña de Sentidos y Salud:
 * Puntos de golpe máximos base, dado de golpe, CA base y notas, bono de iniciativa, velocidad y sentidos.
 */
export const PestanaSentidosSalud: React.FC<PestanaSentidosSaludProps> = ({
  form,
  alActualizarCampo,
  alActualizarHPMaximoBase
}) => {
  return (
    <>
      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>HP Máximo Base (Verdadero)</label>
          <input
            type="number"
            className={estilos.inputFormulario}
            value={form.hpMaximoBase || 10}
            onChange={(e) => {
              const maxBaseVal = Math.max(1, parseInt(e.target.value, 10) || 1);
              alActualizarHPMaximoBase(maxBaseVal);
            }}
            min="1"
            required
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Tipo de Dado de Golpe (Sugerencia)</label>
          <SelectorSugerencias
            valor={form.tipoDadoGolpe}
            alCambiar={(val) =>
              alActualizarCampo("tipoDadoGolpe", val as "d6" | "d8" | "d10" | "d12")
            }
            opciones={["d6", "d8", "d10", "d12", "d4", "d20"]}
            placeholder="d6, d8, d10, d12..."
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Clase de Armadura (CA Base)</label>
          <input
            type="number"
            className={estilos.inputFormulario}
            value={form.ca}
            onChange={(e) => alActualizarCampo("ca", parseInt(e.target.value, 10) || 10)}
            min="1"
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Notas de CA</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.caNotas}
            onChange={(e) => alActualizarCampo("caNotas", e.target.value)}
            placeholder="Ej. Cota de malla + Escudo"
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Bonificador Extra de Iniciativa</label>
          <input
            type="number"
            className={estilos.inputFormulario}
            value={form.iniciativaBono}
            onChange={(e) =>
              alActualizarCampo("iniciativaBono", parseInt(e.target.value, 10) || 0)
            }
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Velocidad Base</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={
              typeof form.velocidad === "string"
                ? form.velocidad
                : `${form.velocidad?.caminar || 30} pies`
            }
            onChange={(e) => alActualizarCampo("velocidad", e.target.value)}
            placeholder="Ej. 30 pies, volar 60 pies"
          />
        </div>
      </div>

      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario}>Sentidos Especiales</label>
        <input
          type="text"
          className={estilos.inputFormulario}
          value={typeof form.sentidos === "string" ? form.sentidos : ""}
          onChange={(e) => alActualizarCampo("sentidos", e.target.value)}
          placeholder="Ej. Visión en la oscuridad 60 pies"
        />
      </div>
    </>
  );
};
