import React, { useId } from "react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SentidosEstructurados, VelocidadEstructurada } from "@/tipos";
import estilos from "../FormularioCriatura.module.css";

interface EditorVelocidadSentidosProps {
  velocidad: VelocidadEstructurada;
  sentidos: SentidosEstructurados;
  alCambiarVelocidad: (nueva: VelocidadEstructurada) => void;
  alCambiarSentidos: (nuevos: SentidosEstructurados) => void;
}

interface CampoVelocidadConfig {
  clave: "caminar" | "volar" | "nadar" | "escalar" | "excavar";
  etiqueta: string;
  obligatorio?: boolean;
}

const CAMPOS_VELOCIDAD: readonly CampoVelocidadConfig[] = [
  { clave: "caminar", etiqueta: "Caminar (pies)", obligatorio: true },
  { clave: "volar", etiqueta: "Volar (pies)" },
  { clave: "nadar", etiqueta: "Nadar (pies)" },
  { clave: "escalar", etiqueta: "Escalar (pies)" },
  { clave: "excavar", etiqueta: "Excavar (pies)" }
];

interface CampoSentidoConfig {
  clave: keyof SentidosEstructurados;
  etiqueta: string;
  placeholder: string;
}

const CAMPOS_SENTIDOS: readonly CampoSentidoConfig[] = [
  { clave: "visionOscuridad", etiqueta: "Visión en oscuridad (pies)", placeholder: "Ej. 60" },
  { clave: "visionCiega", etiqueta: "Visión ciega (pies)", placeholder: "Ej. 10" },
  { clave: "visionVerdadera", etiqueta: "Visión verdadera (pies)", placeholder: "Ej. 120" },
  { clave: "sentidoSismico", etiqueta: "Sentido sísmico (pies)", placeholder: "Ej. 30" },
  { clave: "percepcionPasiva", etiqueta: "Percepción pasiva", placeholder: "Ej. 12" }
];

/**
 * Subcomponente para editar los campos numéricos estructurados de velocidad y sentidos.
 */
export const EditorVelocidadSentidos: React.FC<EditorVelocidadSentidosProps> = ({
  velocidad,
  sentidos,
  alCambiarVelocidad,
  alCambiarSentidos
}) => {
  const idCampos = useId();
  const actualizarVelocidadCampo = (
    clave: CampoVelocidadConfig["clave"],
    valor: number | undefined
  ) => {
    const siguiente: VelocidadEstructurada = { ...velocidad };
    if (clave === "caminar") {
      siguiente.caminar = valor ?? 0;
    } else if (valor === undefined) {
      delete siguiente[clave];
    } else {
      siguiente[clave] = valor;
    }
    alCambiarVelocidad(siguiente);
  };

  const actualizarSentidoCampo = (
    clave: keyof SentidosEstructurados,
    valor: number | undefined
  ) => {
    const siguiente: SentidosEstructurados = { ...sentidos };
    if (valor === undefined) {
      delete siguiente[clave];
    } else {
      siguiente[clave] = valor;
    }
    alCambiarSentidos(siguiente);
  };

  return (
    <>
      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Velocidad (pies):</label>
        <div className={estilos.bloqueEstructurado}>
          <div className={estilos.gridCamposCompactos}>
            {CAMPOS_VELOCIDAD.map((campo) => (
              <div key={campo.clave} className={estilos.campoCompacto}>
                <label className={estilos.labelCompacto} htmlFor={`${idCampos}-${campo.clave}`}>{campo.etiqueta}</label>
                <CampoNumerico
                  id={`${idCampos}-${campo.clave}`}
                  value={velocidad[campo.clave] ?? (campo.obligatorio ? 0 : "")}
                  alConfirmar={(val) => actualizarVelocidadCampo(campo.clave, val)}
                  alVaciar={() => actualizarVelocidadCampo(campo.clave, campo.obligatorio ? 0 : undefined)}
                  min={0}
                  step={5}
                  tipo="entero"
                  placeholder={campo.obligatorio ? "30" : "—"}
                  className={estilos.inputForm}
                />
              </div>
            ))}
          </div>
          <label className={estilos.checkboxFila}>
            <input
              type="checkbox"
              checked={Boolean(velocidad.planea)}
              onChange={(e) => alCambiarVelocidad({ ...velocidad, planea: e.target.checked })}
            />
            <span>Planea (hover)</span>
          </label>
        </div>
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Sentidos:</label>
        <div className={estilos.bloqueEstructurado}>
          <div className={estilos.gridCamposCompactos}>
            {CAMPOS_SENTIDOS.map((campo) => (
              <div key={campo.clave} className={estilos.campoCompacto}>
                <label className={estilos.labelCompacto} htmlFor={`${idCampos}-${campo.clave}`}>{campo.etiqueta}</label>
                <CampoNumerico
                  id={`${idCampos}-${campo.clave}`}
                  value={sentidos[campo.clave] ?? ""}
                  alConfirmar={(val) => actualizarSentidoCampo(campo.clave, val)}
                  alVaciar={() => actualizarSentidoCampo(campo.clave, undefined)}
                  min={0}
                  step={campo.clave === "percepcionPasiva" ? 1 : 5}
                  tipo="entero"
                  placeholder={campo.placeholder}
                  className={estilos.inputForm}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
