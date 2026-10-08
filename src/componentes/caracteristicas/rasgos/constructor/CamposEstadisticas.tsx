import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import estilos from "../ConstructorRasgoDote.module.css";
import { OPCIONES_MODO_CA, OPCIONES_CONDICION_CA, OPCIONES_ATRIBUTO_CA, OPCIONES_CARACTERISTICAS } from "./constantesConstructor";
import type { usarEditorEfectos } from "./usarEditorEfectos";
type Props = Pick<ReturnType<typeof usarEditorEfectos>, 
  | "nuevoTipoEfecto"
  | "nuevoObjetivo"
  | "setNuevoObjetivo"
  | "nuevoValor"
  | "setNuevoValor"
  | "nuevoLimiteMaximo"
  | "setNuevoLimiteMaximo"
  | "nuevoPermiteEscudo"
  | "setNuevoPermiteEscudo"
  | "nuevaDescripcionEfecto"
  | "setNuevaDescripcionEfecto"
  | "nuevoCondicion"
  | "setNuevoCondicion">;
export function CamposEstadisticas({
  nuevoTipoEfecto,
  nuevoObjetivo,
  setNuevoObjetivo,
  nuevoValor,
  setNuevoValor,
  nuevoLimiteMaximo,
  setNuevoLimiteMaximo,
  nuevoPermiteEscudo,
  setNuevoPermiteEscudo,
  nuevaDescripcionEfecto,
  setNuevaDescripcionEfecto,
  nuevoCondicion,
  setNuevoCondicion
}: Props) {
    return <>
        {nuevoTipoEfecto === "modificador_ca" && (<div>
                <div className={estilos.gridDosColumnas}>
                  <div className={estilos.campoGrupo}>
                    <label className={estilos.labelCampo}>
                      <span>Modalidad de Modificador de CA</span>
                    </label>
                    <SelectorDesplegable
                      valor={nuevoObjetivo === "ca" ? "ca" : "defensa_sin_armadura"}
                      opciones={OPCIONES_MODO_CA}
                      alCambiar={(val) => {
                setNuevoObjetivo(val);
                if (val === "ca") {
                    setNuevoValor("1");
                    setNuevoCondicion("con_armadura");
                }
                else {
                    setNuevoValor("constitucion");
                    setNuevoCondicion("");
                }
            }}
                      tamano="normal"
                    />
                  </div>
                  {nuevoObjetivo === "defensa_sin_armadura" ? (<div className={estilos.campoGrupo}>
                      <label className={estilos.labelCampo}>
                        <span>Atributo para Defensa sin Armadura</span>
                      </label>
                      <SelectorDesplegable
                        valor={nuevoValor}
                        opciones={OPCIONES_ATRIBUTO_CA}
                        alCambiar={(val) => setNuevoValor(val)}
                        tamano="normal"
                      />
                    </div>) : (<div className={estilos.campoGrupo}>
                      <label className={estilos.labelCampo}>
                        <span>Bono Plano a la CA</span>
                      </label>
                      <input
                        type="text"
                        className={estilos.inputControl}
                        placeholder="ej. 1, 2"
                        value={nuevoValor}
                        onChange={(e) => setNuevoValor(e.target.value)}
                      />
                    </div>)}
                </div>

                {nuevoObjetivo === "defensa_sin_armadura" ? (<div className={`${estilos.campoGrupo} ${estilos.campoGrupoCentrado}`}>
                    <label className={estilos.labelCampo}>
                      <input
                        type="checkbox"
                        checked={nuevoPermiteEscudo}
                        onChange={(e) => setNuevoPermiteEscudo(e.target.checked)}
                        className={estilos.checkboxConMargen}
                      />
                      <span>Permite usar Escudo (ej. Bárbaro sí, Monje no)</span>
                    </label>
                  </div>) : (<div className={estilos.campoGrupo}>
                    <label className={estilos.labelCampo}>
                      <span>Condición de Aplicación</span>
                    </label>
                    <SelectorDesplegable
                      valor={nuevoCondicion || "con_armadura"}
                      opciones={OPCIONES_CONDICION_CA}
                      alCambiar={(val) => setNuevoCondicion(val === "siempre" ? "" : val)}
                      tamano="normal"
                    />
                  </div>)}
              </div>)}
        {nuevoTipoEfecto === "modificador_stat" && (<div className={estilos.gridTresColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Característica</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={OPCIONES_CARACTERISTICAS}
                    alCambiar={(val) => setNuevoObjetivo(val)}
                    tamano="normal"
                  />
                </div>

                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Incremento</span>
                  </label>
                  <input
                    type="number"
                    className={estilos.inputControl}
                    placeholder="ej. 2 o 4"
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>

                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Nuevo Límite Máximo</span>
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={30}
                    className={estilos.inputControl}
                    value={nuevoLimiteMaximo}
                    onChange={(e) => setNuevoLimiteMaximo(parseInt(e.target.value, 10) || 20)}
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "modificador_velocidad" && (<div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Incremento de Velocidad (Pies)</span>
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  className={estilos.inputControl}
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                  placeholder="10"
                />
              </div>)}
        {nuevoTipoEfecto === "movimiento_especial" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Tipo de Movimiento Especial</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={[
                { valor: "velocidad.escalar", etiqueta: "Escalada / Trepar" },
                { valor: "velocidad.volar", etiqueta: "Vuelo" },
                { valor: "velocidad.nadar", etiqueta: "Nado" }
            ]}
                    alCambiar={(val) => setNuevoObjetivo(val)}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Velocidad Otorgada</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                    placeholder="caminar (o pies, ej. 30)"
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "modificador_capacidad_carga" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Multiplicador de Capacidad de Carga</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className={estilos.inputControl}
                    placeholder="ej. 2 (doble), 0.5 (mitad)..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>
                    Factor multiplicador sobre la carga máxima (ej. 2 para Constitución poderosa / categoría de tamaño superior).
                  </p>
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Descripción del Efecto</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. Cuentas como una categoría de tamaño superior para carga (×2)"
                    value={nuevaDescripcionEfecto}
                    onChange={(e) => setNuevaDescripcionEfecto(e.target.value)}
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "modificador_tamano" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Categoría de Tamaño Resultante</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoValor}
                    opciones={[
                { valor: "Diminuto", etiqueta: "Diminuto" },
                { valor: "Pequeño", etiqueta: "Pequeño" },
                { valor: "Mediano", etiqueta: "Mediano" },
                { valor: "Grande", etiqueta: "Grande" }
            ]}
                    alCambiar={(val) => setNuevoValor(val)}
                    tamano="normal"
                  />
                  <p className={estilos.pistaCampo}>
                    Tamaño adoptado por la criatura mientras el rasgo o efecto esté activo.
                  </p>
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Descripción del Efecto</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. Tu tamaño pasa a ser Grande"
                    value={nuevaDescripcionEfecto}
                    onChange={(e) => setNuevaDescripcionEfecto(e.target.value)}
                  />
                </div>
              </div>)}
        {nuevoTipoEfecto === "limite_des_armadura_media" && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Límite Máximo de Destreza</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoValor}
                    opciones={[
                { valor: "3", etiqueta: "+3 a la CA (Maestro en Armaduras Medias)" },
                { valor: "4", etiqueta: "+4 a la CA (Especial / Homebrew)" },
                { valor: "99", etiqueta: "Sin límite de Destreza (Todo el mod DES)" }
            ]}
                    alCambiar={(val) => setNuevoValor(val)}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Descripción del Beneficio</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    value={nuevaDescripcionEfecto}
                    onChange={(e) => setNuevaDescripcionEfecto(e.target.value)}
                    placeholder="Límite de Destreza en armadura media aumentado a 3"
                  />
                </div>
              </div>)}
  </>;
}
