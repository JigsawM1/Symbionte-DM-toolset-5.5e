import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
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
          <CampoNumerico
            className={estilos.inputFormulario}
            value={form.hpMaximoBase || 10}
            alConfirmar={alActualizarHPMaximoBase}
            min="1"
            required
            identidad={form.id}
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
          <CampoNumerico
            className={estilos.inputFormulario}
            value={form.ca}
            alConfirmar={(valor) => alActualizarCampo("ca", valor)}
            min="1"
            identidad={form.id}
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
          <CampoNumerico
            className={estilos.inputFormulario}
            value={form.iniciativaBono}
            alConfirmar={(valor) => alActualizarCampo("iniciativaBono", valor)}
            identidad={form.id}
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
