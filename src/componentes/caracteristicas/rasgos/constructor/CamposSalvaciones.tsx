import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import estilos from "../ConstructorRasgoDote.module.css";
import { OPCIONES_VENTAJA, OPCIONES_SALVACION_OBJETIVO } from "./constantesConstructor";
import type { usarEditorEfectos } from "./usarEditorEfectos";
type Props = Pick<ReturnType<typeof usarEditorEfectos>, "nuevoTipoEfecto" | "nuevoObjetivo" | "setNuevoObjetivo" | "nuevoValor" | "setNuevoValor">;
export function CamposSalvaciones({ nuevoTipoEfecto, nuevoObjetivo, setNuevoObjetivo, nuevoValor, setNuevoValor }: Props) {
    return <>
        {nuevoTipoEfecto === "ventaja" && (<div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Tirada d20 con Ventaja</span>
                </label>
                <SelectorDesplegable
                  valor={nuevoObjetivo}
                  opciones={OPCIONES_VENTAJA}
                  alCambiar={(val) => setNuevoObjetivo(val)}
                  tamano="normal"
                />
              </div>)}
        {nuevoTipoEfecto === "bono_salvacion" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Salvación Objetivo</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={OPCIONES_SALVACION_OBJETIVO}
                    alCambiar={(val) => setNuevoObjetivo(val)}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Valor del Bono</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. dano_furia, mitad_nivel, +2..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "habilidad_con_fuerza" && (<div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Habilidades permitidas con Fuerza (separadas por coma)</span>
                </label>
                <input
                  type="text"
                  className={estilos.inputControl}
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                />
                <p className={estilos.pistaCampo}>
                  ej. acrobacias, intimidacion, sigilo, percepcion, supervivencia (Conocimiento Primigenio)
                </p>
              </div>)}
        {nuevoTipoEfecto === "medio_bono_habilidades" && (<div className={estilos.campoGrupo}>
                <p className={`${estilos.pistaCampo} ${estilos.pistaCampoCian}`}>
                  Aplica la regla canónica de Aprendiz de mucho: suma la mitad de la competencia (redondeada hacia abajo) a cualquier habilidad en la que el personaje no sea competente.
                </p>
              </div>)}
        {nuevoTipoEfecto === "competencia" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Categoría o Grupo</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={[
                { valor: "armas_marciales", etiqueta: "Armas Marciales" },
                { valor: "armas_sencillas", etiqueta: "Armas Sencillas" },
                { valor: "armas_improvisadas", etiqueta: "Armas Improvisadas" },
                { valor: "armaduras_medias", etiqueta: "Armaduras Medias" },
                { valor: "armaduras_pesadas", etiqueta: "Armaduras Pesadas" },
                { valor: "armaduras_ligeras", etiqueta: "Armaduras Ligeras" },
                { valor: "escudos", etiqueta: "Escudos" },
                { valor: "herramientas", etiqueta: "Herramientas / Útiles" }
            ]}
                    alCambiar={(val) => {
                setNuevoObjetivo(val);
                if (val === "herramientas") {
                    setNuevoValor("Útiles de cocinero");
                }
                else if (val === "armas_improvisadas") {
                    setNuevoValor("improvisadas");
                }
                else {
                    setNuevoValor(val.replace("armas_", "").replace("armaduras_", ""));
                }
            }}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>{nuevoObjetivo === "herramientas" ? "Tipo de Útiles / Herramientas" : "Descripción de la Competencia"}</span>
                  </label>
                  {nuevoObjetivo === "herramientas" ? (<SelectorDesplegable
                    valor={nuevoValor}
                    opciones={[
                    { valor: "Útiles de envenenador", etiqueta: "Útiles de envenenador (Envenenador)" },
                    { valor: "Útiles de cocinero", etiqueta: "Útiles de cocinero (Chef)" },
                    { valor: "Herramientas de ladrón", etiqueta: "Herramientas de ladrón" },
                    { valor: "Herramientas de artesano", etiqueta: "Herramientas de artesano" },
                    { valor: "Útiles de herborista", etiqueta: "Útiles de herborista" },
                    { valor: "Instrumento musical", etiqueta: "Instrumento musical" }
                ]}
                    alCambiar={(val) => setNuevoValor(val)}
                    tamano="normal"
                  />) : (<input
                  type="text"
                  className={estilos.inputControl}
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                />)}
                </div>
              </div>)}
  </>;
}
