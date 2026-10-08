import type { TipoEfectoMecanico } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { Plus, Trash2, Sparkles } from "lucide-react";
import estilos from "../ConstructorRasgoDote.module.css";
import { OPCIONES_APLICA_A_ATAQUE } from "./constantesConstructor";
import { CamposCombate } from "./CamposCombate";
import { CamposEstadisticas } from "./CamposEstadisticas";
import { CamposSalvaciones } from "./CamposSalvaciones";
import { CamposMagiaRecursos } from "./CamposMagiaRecursos";
import { usarEditorEfectos } from "./usarEditorEfectos";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
interface Props {
    borrador: Pick<BorradorRasgo, "efectos">;
    actualizarBorrador: ActualizarBorradorRasgo;
}
export function EfectosConstructor({ borrador, actualizarBorrador }: Props) {
    const { efectos } = borrador;
    const {
      modoCreandoEfecto,
      setModoCreandoEfecto,
      nuevoTipoEfecto,
      nuevoObjetivo,
      setNuevoObjetivo,
      nuevoValor,
      setNuevoValor,
      nuevoTipoDano,
      setNuevoTipoDano,
      nuevoAplicaA,
      setNuevoAplicaA,
      nuevoLimiteMaximo,
      setNuevoLimiteMaximo,
      nuevoPermiteEscudo,
      setNuevoPermiteEscudo,
      nuevaDescripcionEfecto,
      setNuevaDescripcionEfecto,
      nuevoCondicion,
      setNuevoCondicion,
      opcionesTiposEfecto,
      manejarCambioTipoEfecto,
      manejarAnadirEfecto,
      manejarEliminarEfecto
    } = usarEditorEfectos(borrador.efectos, actualizarBorrador);
    return (<div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <Sparkles size={14} color="#38bdf8"/>
            <span>4. Efectos Mecánicos e Interactividad en Combate</span>
          </div>
          <p className={estilos.descripcionSeccion}>
            El corazón de las mecánicas: conecta este rasgo directamente al cálculo de daño, ataques, CA, stats y tiradas d20
          </p>
        </div>

        {/* Lista de Efectos Agregados */}
        {efectos.length > 0 ? (<div className={estilos.listaEfectos}>
            {efectos.map((ef) => (<div key={ef.id || ef.tipo} className={estilos.tarjetaEfectoItem}>
                <div className={estilos.cuerpoEfectoItem}>
                  <div className={estilos.filaBadgeEfecto}>
                    <span className={estilos.badgeEfectoTipo}>{ef.tipo.replace(/_/g, " ")}</span>
                    <span className={estilos.badgeEfectoValor}>{String(ef.valor)}</span>
                    {ef.tipoDano && <span className={estilos.badgeEfectoValor}>{ef.tipoDano}</span>}
                    {ef.aplicaA && <span className={estilos.badgeEfectoTipo}>{ef.aplicaA.replace(/_/g, " ")}</span>}
                    {ef.limiteMaximo && <span className={estilos.badgeEfectoTipo}>Límite: {ef.limiteMaximo}</span>}
                  </div>
                  <span className={estilos.descripcionEfectoItem}>{ef.descripcion || ef.objetivo}</span>
                </div>
                <button
                  type="button"
                  className={estilos.botonEliminarEfecto}
                  onClick={() => manejarEliminarEfecto(ef.id || "")}
                  title="Eliminar este efecto"
                >
                  <Trash2 size={13}/>
                </button>
              </div>))}
          </div>) : (<p className={`${estilos.pistaCampo} ${estilos.pistaCampoCursiva}`}>
            No hay efectos mecánicos añadidos aún. Este rasgo será solo informativo a menos que agregues efectos interactivos.
          </p>)}

        {/* Formulario de Añadir Efecto */}
        {modoCreandoEfecto ? (<div className={estilos.cajaNuevoEfecto}>
            <div className={estilos.cabeceraNuevoEfecto}>
              <span className={estilos.tituloNuevoEfecto}>Configurar Nuevo Efecto Mecánico</span>
            </div>

            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Tipo de Efecto</span>
              </label>
              <SelectorDesplegable<TipoEfectoMecanico>
                valor={nuevoTipoEfecto}
                opciones={opcionesTiposEfecto}
                alCambiar={manejarCambioTipoEfecto}
                tamano="normal"
              />
            </div>

            {/* Campos condicionales según el tipo de efecto */}
            <CamposCombate
              nuevoTipoEfecto={nuevoTipoEfecto}
              nuevoObjetivo={nuevoObjetivo}
              setNuevoObjetivo={setNuevoObjetivo}
              nuevoValor={nuevoValor}
              setNuevoValor={setNuevoValor}
              nuevoTipoDano={nuevoTipoDano}
              setNuevoTipoDano={setNuevoTipoDano}
              nuevoAplicaA={nuevoAplicaA}
              setNuevoAplicaA={setNuevoAplicaA}
              nuevoCondicion={nuevoCondicion}
              setNuevoCondicion={setNuevoCondicion}
            />

            

            {(nuevoTipoEfecto === "bono_dano_fuerza" || nuevoTipoEfecto === "bono_dano_ataque" || nuevoTipoEfecto === "bono_ataque") && (<div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>{nuevoTipoEfecto === "bono_ataque" ? "Bono a la Tirada de Ataque" : "Valor del Bono de Daño"}</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder={nuevoTipoEfecto === "bono_ataque" ? "ej. 2, +2, bono_competencia..." : "ej. +2, bono_competencia, dano_furia, mitad_nivel..."}
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
                    opciones={OPCIONES_APLICA_A_ATAQUE}
                    alCambiar={(val) => {
                    setNuevoAplicaA(val);
                    if (nuevoTipoEfecto === "bono_ataque")
                        setNuevoObjetivo(val);
                }}
                    tamano="normal"
                  />
                </div>
              </div>)}

            <CamposMagiaRecursos
              nuevoTipoEfecto={nuevoTipoEfecto}
              nuevoObjetivo={nuevoObjetivo}
              setNuevoObjetivo={setNuevoObjetivo}
              nuevoValor={nuevoValor}
              setNuevoValor={setNuevoValor}
              nuevoAplicaA={nuevoAplicaA}
              setNuevoAplicaA={setNuevoAplicaA}
              nuevaDescripcionEfecto={nuevaDescripcionEfecto}
              setNuevaDescripcionEfecto={setNuevaDescripcionEfecto}
              nuevoCondicion={nuevoCondicion}
              setNuevoCondicion={setNuevoCondicion}
            />

            <CamposEstadisticas
              nuevoTipoEfecto={nuevoTipoEfecto}
              nuevoObjetivo={nuevoObjetivo}
              setNuevoObjetivo={setNuevoObjetivo}
              nuevoValor={nuevoValor}
              setNuevoValor={setNuevoValor}
              nuevoLimiteMaximo={nuevoLimiteMaximo}
              setNuevoLimiteMaximo={setNuevoLimiteMaximo}
              nuevoPermiteEscudo={nuevoPermiteEscudo}
              setNuevoPermiteEscudo={setNuevoPermiteEscudo}
              nuevaDescripcionEfecto={nuevaDescripcionEfecto}
              setNuevaDescripcionEfecto={setNuevaDescripcionEfecto}
              nuevoCondicion={nuevoCondicion}
              setNuevoCondicion={setNuevoCondicion}
            />

            

            

            

            <CamposSalvaciones
              nuevoTipoEfecto={nuevoTipoEfecto}
              nuevoObjetivo={nuevoObjetivo}
              setNuevoObjetivo={setNuevoObjetivo}
              nuevoValor={nuevoValor}
              setNuevoValor={setNuevoValor}
            />

            

            

            

            

            

            

            

            

            

            

            

            

            

            

            <div className={estilos.botonesNuevoEfecto}>
              <button type="button" className={estilos.botonCancelarEfecto} onClick={() => setModoCreandoEfecto(false)}>
                Cancelar
              </button>
              <button type="button" className={estilos.botonConfirmarEfecto} onClick={manejarAnadirEfecto}>
                Confirmar Efecto
              </button>
            </div>
          </div>) : (<button type="button" className={estilos.botonAnadirEfecto} onClick={() => setModoCreandoEfecto(true)}>
            <Plus size={14}/>
            <span>Añadir Efecto Mecánico</span>
          </button>)}
      </div>);
}
