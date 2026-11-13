import React, { useId } from "react";
import { Shield, Heart, Swords } from "lucide-react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorDesplegable, type OpcionDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import type { DatosFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import { calcularCAInvocacion, calcularVidaInvocacion, calcularAtaquesPorAccionInvocacion } from "@/servicios/factoriaInvocaciones";
import estilos from "../FormularioCriatura.module.css";

interface SeccionEscaladoInvocacionProps {
  invocacionForm: DatosFormularioInvocacion;
  actualizarCampo: <K extends keyof DatosFormularioInvocacion>(
    campo: K,
    valor: DatosFormularioInvocacion[K]
  ) => void;
}

const OPCIONES_ATAQUES_POR_ACCION: OpcionDesplegable<DatosFormularioInvocacion["formulaAtaquesPorAccion"]>[] = [
  { valor: "fijo_1", etiqueta: "Fijo: 1 ataque por acción" },
  { valor: "mitad_nivel_abajo", etiqueta: "Mitad del nivel de conjuro (redondeado hacia abajo)" },
  { valor: "mitad_nivel_arriba", etiqueta: "Mitad del nivel de conjuro (redondeado hacia arriba)" }
];

/**
 * Pestaña de fórmulas de escalado (CA, Vida y Multiataque por nivel de conjuro).
 */
export const SeccionEscaladoInvocacion: React.FC<SeccionEscaladoInvocacionProps> = ({
  invocacionForm,
  actualizarCampo
}) => {
  const idCampos = useId();
  const { formulaCA, formulaVida, formulaAtaquesPorAccion, nivelMinimo } = invocacionForm;

  const calcularPreview = (nivel: number) => ({
    ca: calcularCAInvocacion(invocacionForm, nivel),
    vida: calcularVidaInvocacion(invocacionForm, nivel),
    atq: calcularAtaquesPorAccionInvocacion(invocacionForm, nivel)
  });

  const nivelAlto = Math.min(invocacionForm.nivelMaximo, nivelMinimo + 2);
  const nivelesVista = nivelAlto > nivelMinimo ? [nivelMinimo, nivelAlto] : [nivelMinimo];

  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.vistaEscalado}>
        <table>
          <caption>Vista previa de escalado</caption>
          <thead>
            <tr><th scope="col">Nivel de conjuro</th><th scope="col">CA</th><th scope="col">PG</th><th scope="col">Ataques por acción</th></tr>
          </thead>
          <tbody>
            {nivelesVista.map(nivel => {
              const { ca, vida, atq } = calcularPreview(nivel);
              return <tr key={nivel}><th scope="row">{nivel}</th><td>{ca}</td><td>{vida}</td><td>{atq}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          <Shield size={13} /> FÓRMULA DE CLASE DE ARMADURA (CA)
        </div>
        <div className={estilos.filaTripleForm}>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm} htmlFor={`${idCampos}-ca-base`}>CA Base:</label>
            <CampoNumerico
              id={`${idCampos}-ca-base`}
              value={formulaCA.base}
              alConfirmar={(v) => actualizarCampo("formulaCA", { ...formulaCA, base: v })}
              min={0}
              tipo="entero"
              className={estilos.inputForm}
            />
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm} htmlFor={`${idCampos}-bonificador`}>Bonificador Adicional:</label>
            <CampoNumerico
              id={`${idCampos}-bonificador`}
              value={formulaCA.bonificadorAdicional}
              alConfirmar={(v) =>
                actualizarCampo("formulaCA", { ...formulaCA, bonificadorAdicional: v })
              }
              tipo="entero"
              className={estilos.inputForm}
            />
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Escalado:</label>
            <label className={estilos.checkboxFila}>
              <input
                type="checkbox"
                checked={formulaCA.sumaNivelConjuro}
                onChange={(e) =>
                  actualizarCampo("formulaCA", { ...formulaCA, sumaNivelConjuro: e.target.checked })
                }
              />
              <span>+ Nivel del conjuro</span>
            </label>
          </div>
        </div>
      </div>

      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          <Heart size={13} /> FÓRMULA DE PUNTOS DE GOLPE
        </div>
        <div className={estilos.filaTripleForm}>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm} htmlFor={`${idCampos}-pg-base`}>Vida Base:</label>
            <CampoNumerico
              id={`${idCampos}-pg-base`}
              value={formulaVida.base}
              alConfirmar={(v) => actualizarCampo("formulaVida", { ...formulaVida, base: v })}
              min={1}
              tipo="entero"
              className={estilos.inputForm}
            />
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm} htmlFor={`${idCampos}-pg-nivel`}>+ Vida por nivel:</label>
            <CampoNumerico
              id={`${idCampos}-pg-nivel`}
              value={formulaVida.porNivel}
              alConfirmar={(v) => actualizarCampo("formulaVida", { ...formulaVida, porNivel: v })}
              min={0}
              tipo="entero"
              className={estilos.inputForm}
            />
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Modo de incremento:</label>
            <label className={estilos.checkboxFila}>
              <input
                type="checkbox"
                checked={formulaVida.porNivelPorEncimaDelMinimo}
                onChange={(e) =>
                  actualizarCampo("formulaVida", {
                    ...formulaVida,
                    porNivelPorEncimaDelMinimo: e.target.checked
                  })
                }
              />
              <span>Solo niveles sobre el mínimo</span>
            </label>
          </div>
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm} htmlFor={`${idCampos}-dados-golpe`}>Texto visual / Dado de golpe (opcional):</label>
          <input
            id={`${idCampos}-dados-golpe`}
            type="text"
            value={formulaVida.dadoGolpeVisual || ""}
            onChange={(e) =>
              actualizarCampo("formulaVida", { ...formulaVida, dadoGolpeVisual: e.target.value })
            }
            placeholder="Ej. 30 + 10 por cada nivel superior a 2"
            className={estilos.inputForm}
          />
        </div>
      </div>

      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          <Swords size={13} /> ATAQUES POR ACCIÓN (MULTIATAQUE)
        </div>
        <SelectorDesplegable
          valor={formulaAtaquesPorAccion}
          alCambiar={(v) => actualizarCampo("formulaAtaquesPorAccion", v)}
          opciones={OPCIONES_ATAQUES_POR_ACCION}
          enFlujo
        />
      </div>
    </div>
  );
};
