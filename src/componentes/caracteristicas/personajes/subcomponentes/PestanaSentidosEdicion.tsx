import React from "react";
import type { PersonajeJugador } from "@/tipos";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorSugerencias } from "@/componentes/comunes/SelectorSugerencias";
import estilos from "../HojaPersonaje.module.css";

interface PestanaSentidosEdicionProps {
  form: PersonajeJugador;
  setForm: React.Dispatch<React.SetStateAction<PersonajeJugador>>;
  actualizarCampo: <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => void;
}

export const PestanaSentidosEdicion: React.FC<PestanaSentidosEdicionProps> = ({
  form,
  setForm,
  actualizarCampo
}) => {
  return (
    <>
      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>HP Máximo Base (Verdadero)</label>
          <CampoNumerico
            className={estilos.inputFormulario}
            value={form.hpMaximoBase || 10}
            alConfirmar={(valor) =>
              setForm((prev) => ({
                ...prev,
                hpMaximoBase: valor,
                hpMaximo: valor,
                hpActual: Math.min(prev.hpActual, valor)
              }))
            }
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
              actualizarCampo("tipoDadoGolpe", val as "d6" | "d8" | "d10" | "d12")
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
            alConfirmar={(valor) => actualizarCampo("ca", valor)}
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
            onChange={(e) => actualizarCampo("caNotas", e.target.value)}
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
            alConfirmar={(valor) => actualizarCampo("iniciativaBono", valor)}
            identidad={form.id}
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Velocidad Base</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={typeof form.velocidad === "string" ? form.velocidad : `${form.velocidad.caminar} pies`}
            onChange={(e) => actualizarCampo("velocidad", e.target.value)}
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
            onChange={(e) => actualizarCampo("sentidos", e.target.value)}
            placeholder="Ej. Visión en la oscuridad 60 pies"
        />
      </div>
    </>
  );
};
