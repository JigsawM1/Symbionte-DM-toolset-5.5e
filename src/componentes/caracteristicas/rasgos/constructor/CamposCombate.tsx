import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import estilos from "../ConstructorRasgoDote.module.css";
import { OPCIONES_APLICA_A_ATAQUE, OPCIONES_CONDICION_DESARMADO } from "./constantesConstructor";
import type { usarEditorEfectos } from "./usarEditorEfectos";
type Props = Pick<ReturnType<typeof usarEditorEfectos>, 
  | "nuevoTipoEfecto"
  | "nuevoObjetivo"
  | "setNuevoObjetivo"
  | "nuevoValor"
  | "setNuevoValor"
  | "nuevoTipoDano"
  | "setNuevoTipoDano"
  | "nuevoAplicaA"
  | "setNuevoAplicaA"
  | "nuevoCondicion"
  | "setNuevoCondicion">;
export function CamposCombate({
  nuevoTipoEfecto,
  nuevoObjetivo,
  setNuevoObjetivo,
  nuevoValor,
  setNuevoValor,
  nuevoTipoDano,
  setNuevoTipoDano,
  nuevoAplicaA,
  setNuevoAplicaA,
  nuevoCondicion,
  setNuevoCondicion
}: Props) {
    return <>
        {nuevoTipoEfecto === "dado_extra_dano" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Fórmula de Dados Extra</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. 1d10, 2d6, 1d8..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Aplica a Tipo de Ataque</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoAplicaA}
                    opciones={OPCIONES_APLICA_A_ATAQUE}
                    alCambiar={(val) => setNuevoAplicaA(val)}
                    tamano="normal"
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "dano_secundario" && (<div className={estilos.gridTresColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Fórmula de Daño Secundario</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. 1d6 + mitad_nivel, 1d8..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>Soporta "mitad_nivel", "nivel", "dano_furia".</p>
                </div>

                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Tipo de Daño</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. Radiante o Necrótico, Fuego..."
                    value={nuevoTipoDano}
                    onChange={(e) => setNuevoTipoDano(e.target.value)}
                  />
                </div>

                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Aplica a</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoAplicaA}
                    opciones={OPCIONES_APLICA_A_ATAQUE}
                    alCambiar={(val) => setNuevoAplicaA(val)}
                    tamano="normal"
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "ataque_desarmado" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Característica de Ataque</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={[
                { valor: "destreza", etiqueta: "Destreza" },
                { valor: "fuerza", etiqueta: "Fuerza" },
                { valor: "carisma", etiqueta: "Carisma" }
            ]}
                    alCambiar={(val) => setNuevoObjetivo(val)}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Dado de Daño Base</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="dado_inspiracion o ej. 1d6, 1d8..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>
                    Usa "dado_inspiracion" para escalar automáticamente con la tabla de Inspiración del bardo.
                  </p>
                </div>
                <div className={`${estilos.campoGrupo} ${estilos.columnaCompleta}`}>
                  <label className={estilos.labelCampo}>
                    <span>Condición de Armadura / Escudo</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoCondicion}
                    opciones={OPCIONES_CONDICION_DESARMADO}
                    alCambiar={(val) => setNuevoCondicion(val)}
                    tamano="normal"
                  />
                  <p className={estilos.pistaCampo}>
                    Permite limitar el dado especial a situaciones como no portar escudo o no vestir armadura.
                  </p>
                </div>
              </div>)}
        {nuevoTipoEfecto === "dado_extra_critico" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Tipo de Daño Aplicable</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoAplicaA}
                    opciones={[
                { valor: "perforante", etiqueta: "Daño Perforante (Perforador)" },
                { valor: "cortante", etiqueta: "Daño Cortante" },
                { valor: "contundente", etiqueta: "Daño Contundente" },
                { valor: "todos", etiqueta: "Cualquier arma (Universal)" }
            ]}
                    alCambiar={(val) => {
                setNuevoAplicaA(val);
                setNuevoObjetivo(`dano_${val}`);
            }}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Cantidad de Dados Extra</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoValor}
                    opciones={[
                { valor: "1", etiqueta: "+1 Dado de daño adicional (Crítico x2 + 1)" },
                { valor: "2", etiqueta: "+2 Dados de daño adicionales" },
                { valor: "3", etiqueta: "+3 Dados de daño adicionales" }
            ]}
                    alCambiar={(val) => setNuevoValor(val)}
                    tamano="normal"
                  />
                </div>
              </div>)}
  </>;
}
