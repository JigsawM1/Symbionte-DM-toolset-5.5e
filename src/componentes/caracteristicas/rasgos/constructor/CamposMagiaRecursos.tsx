import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import estilos from "../ConstructorRasgoDote.module.css";
import { OPCIONES_OBJETIVO_HP_TEMPORAL, OPCIONES_PRESETS_HP_TEMPORAL, OPCIONES_APLICA_A_CONJURO } from "./constantesConstructor";
import type { usarEditorEfectos } from "./usarEditorEfectos";
type Props = Pick<ReturnType<typeof usarEditorEfectos>, 
  | "nuevoTipoEfecto"
  | "nuevoObjetivo"
  | "setNuevoObjetivo"
  | "nuevoValor"
  | "setNuevoValor"
  | "nuevoAplicaA"
  | "setNuevoAplicaA"
  | "nuevaDescripcionEfecto"
  | "setNuevaDescripcionEfecto"
  | "nuevoCondicion"
  | "setNuevoCondicion">;
export function CamposMagiaRecursos({
  nuevoTipoEfecto,
  nuevoObjetivo,
  setNuevoObjetivo,
  nuevoValor,
  setNuevoValor,
  nuevoAplicaA,
  setNuevoAplicaA,
  nuevaDescripcionEfecto,
  setNuevaDescripcionEfecto,
  nuevoCondicion,
  setNuevoCondicion
}: Props) {
    return <>
        {nuevoTipoEfecto === "bono_dano_conjuro" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Valor del Bono</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. bono_competencia, +PB, +3, carisma, inteligencia..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Aplica a</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoAplicaA}
                    opciones={OPCIONES_APLICA_A_CONJURO}
                    alCambiar={(val) => {
                setNuevoAplicaA(val);
                setNuevoObjetivo(val);
            }}
                    tamano="normal"
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "conjuro_otorgado" && (<div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Nombre del Conjuro Otorgado</span>
                </label>
                <input
                  type="text"
                  className={estilos.inputControl}
                  placeholder="ej. Palabra de poder: sanar"
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                />
              </div>)}
        {nuevoTipoEfecto === "hp_temporal" && (<div className={estilos.gridTresColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Objetivo de HP Temporal</span>
                  </label>
                  <SelectorDesplegable<string>
                    valor={nuevoObjetivo}
                    opciones={OPCIONES_OBJETIVO_HP_TEMPORAL}
                    alCambiar={(val) => setNuevoObjetivo(val)}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Preset o Fórmula Dinámica</span>
                  </label>
                  <SelectorDesplegable<string>
                    valor={OPCIONES_PRESETS_HP_TEMPORAL.some((p) => p.valor === nuevoValor)
                ? nuevoValor
                : "personalizado"}
                    opciones={OPCIONES_PRESETS_HP_TEMPORAL}
                    alCambiar={(val) => {
                if (val !== "personalizado") {
                    setNuevoValor(val);
                }
            }}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Valor / Expresión Exacta</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. bono_competencia, nivel, 5..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "modificador_hp_maximo" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Fórmula o Valor de Modificador de HP Máximo</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. 1*nivel, 2*nivel, +5, -2..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>
                    Expresión aritmética segura soportada: multiplicador por nivel (&quot;1*nivel&quot;, &quot;2*nivel&quot;) o valor plano (+5).
                  </p>
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Descripción del Efecto</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. +1 HP máximo por cada nivel del personaje"
                    value={nuevaDescripcionEfecto}
                    onChange={(e) => setNuevaDescripcionEfecto(e.target.value)}
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "conjuro_gratuito" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Conjuro Otorgado Gratis</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. orden_imperiosa, detectar_magia..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>
                    ID o nombre del conjuro que se podrá lanzar sin gastar espacios de conjuro.
                  </p>
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Descripción del Efecto</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. Lanzamiento gratuito sin gastar espacios"
                    value={nuevaDescripcionEfecto}
                    onChange={(e) => setNuevaDescripcionEfecto(e.target.value)}
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "restaurar_recurso" && (<>
                <div className={estilos.gridDosColumnas}>
                  <div className={estilos.campoGrupo}>
                    <label className={estilos.labelCampo}>
                      <span>Recurso Predefinido o Rápido</span>
                    </label>
                    <SelectorDesplegable
                      valor={nuevoObjetivo === "inspiracion"
                ? "inspiracion"
                : nuevoObjetivo === "furia"
                    ? "furia"
                    : nuevoObjetivo === "espacios_pacto"
                        ? "espacios_pacto"
                        : "personalizado"}
                      opciones={[
                { valor: "inspiracion", etiqueta: "Inspiración Heroica" },
                { valor: "furia", etiqueta: "Furia" },
                { valor: "espacios_pacto", etiqueta: "Espacios de Pacto" },
                { valor: "personalizado", etiqueta: "Otro (Especificar)" }
            ]}
                      alCambiar={(val) => {
                if (val === "inspiracion") {
                    setNuevoObjetivo("inspiracion");
                    setNuevoValor("1");
                    setNuevoCondicion("descanso_largo");
                    setNuevaDescripcionEfecto("Recupera Inspiración Heroica tras finalizar un descanso largo");
                }
                else if (val === "furia") {
                    setNuevoObjetivo("furia");
                    setNuevoValor("maximo");
                    setNuevoCondicion("descanso_largo");
                    setNuevaDescripcionEfecto("Restaura usos de Furia");
                }
                else if (val === "espacios_pacto") {
                    setNuevoObjetivo("espacios_pacto");
                    setNuevoValor("maximo");
                    setNuevoCondicion("descanso_corto");
                    setNuevaDescripcionEfecto("Restaura Espacios de Pacto");
                }
            }}
                      tamano="normal"
                    />
                  </div>
                  <div className={estilos.campoGrupo}>
                    <label className={estilos.labelCampo}>
                      <span>Momento de Restauración</span>
                    </label>
                    <SelectorDesplegable
                      valor={nuevoCondicion || "descanso_largo"}
                      opciones={[
                { valor: "descanso_largo", etiqueta: "Descanso Largo" },
                { valor: "descanso_corto", etiqueta: "Descanso Corto" },
                { valor: "al_activar", etiqueta: "Al Activar el Rasgo" },
                { valor: "siempre", etiqueta: "Siempre / Pasivo" }
            ]}
                      alCambiar={(val) => setNuevoCondicion(val)}
                      tamano="normal"
                    />
                  </div>
                </div>

                <div className={estilos.gridDosColumnas}>
                  <div className={estilos.campoGrupo}>
                    <label className={estilos.labelCampo}>
                      <span>Identificador o Nombre del Recurso</span>
                    </label>
                    <input
                      type="text"
                      className={estilos.inputControl}
                      placeholder="ej. inspiracion, furia, nombre de rasgo..."
                      value={nuevoObjetivo}
                      onChange={(e) => setNuevoObjetivo(e.target.value)}
                    />
                  </div>
                  <div className={estilos.campoGrupo}>
                    <label className={estilos.labelCampo}>
                      <span>Cantidad Restaurada</span>
                    </label>
                    <input
                      type="text"
                      className={estilos.inputControl}
                      placeholder="ej. 1, maximo, 2..."
                      value={nuevoValor}
                      onChange={(e) => setNuevoValor(e.target.value)}
                    />
                  </div>
                </div>
              </>)}
  </>;
}
