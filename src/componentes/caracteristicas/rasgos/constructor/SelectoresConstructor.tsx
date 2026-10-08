import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { Plus, Trash2, ListFilter } from "lucide-react";
import estilos from "../ConstructorRasgoDote.module.css";
import { usarEditorSelectores } from "./usarEditorSelectores";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
interface Props {
    borrador: Pick<BorradorRasgo, "selectores">;
    actualizarBorrador: ActualizarBorradorRasgo;
}
export function SelectoresConstructor({ borrador, actualizarBorrador }: Props) {
    const { selectores } = borrador;
    const {
      modoCreandoSelector,
      setModoCreandoSelector,
      nuevoSelectorEtiqueta,
      setNuevoSelectorEtiqueta,
      nuevoSelectorTipo,
      setNuevoSelectorTipo,
      nuevoSelectorMax,
      setNuevoSelectorMax,
      nuevoSelectorVisualizacion,
      setNuevoSelectorVisualizacion,
      nuevoOpcionesTexto,
      setNuevoOpcionesTexto,
      manejarAgregarSelector,
      manejarEliminarSelector
    } = usarEditorSelectores(actualizarBorrador);
    return (<div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <ListFilter size={14} color="#38bdf8"/>
            <span>5. Opciones y Selectores Configurables (Homebrew)</span>
          </div>
          <p className={estilos.descripcionSeccion}>
            Permite al jugador elegir opciones tácticas para este rasgo (ej. Armas con Maestría, Maniobras de Batalla, Invocaciones)
          </p>
        </div>

        {/* Lista de Selectores Agregados */}
        {selectores.length > 0 ? (<div className={estilos.listaEfectos}>
            {selectores.map((sel) => (<div key={sel.id} className={estilos.tarjetaEfectoItem}>
                <div className={estilos.cuerpoEfectoItem}>
                  <div className={estilos.filaBadgeEfecto}>
                    <span className={estilos.badgeEfectoTipo}>
                      Selector {sel.visualizacion === "lista" ? "Lista" : "Normal"} ({sel.tipo === "multiple" ? `Múltiple: hasta ${sel.maxSelecciones}` : "Único"})
                    </span>
                    <span className={estilos.badgeEfectoValor}>{sel.opciones.length} opciones</span>
                  </div>
                  <span className={estilos.descripcionEfectoItem}>
                    <strong>{sel.etiqueta}:</strong> {sel.opciones.map((o) => o.nombre).join(", ")}
                  </span>
                </div>
                <button
                  type="button"
                  className={estilos.botonEliminarEfecto}
                  onClick={() => manejarEliminarSelector(sel.id)}
                  title="Eliminar este selector"
                >
                  <Trash2 size={13}/>
                </button>
              </div>))}
          </div>) : (<p className={`${estilos.pistaCampo} ${estilos.pistaCampoCursiva}`}>
            No hay selectores de opciones configurados para este rasgo.
          </p>)}

        {/* Formulario para Crear Nuevo Selector */}
        {modoCreandoSelector ? (<div className={estilos.cajaNuevoEfecto}>
            <div className={estilos.cabeceraNuevoEfecto}>
              <span className={estilos.tituloNuevoEfecto}>Nuevo Selector de Opciones</span>
            </div>

            <div className={estilos.gridTresColumnas}>
              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Etiqueta del Selector</span>
                </label>
                <input
                  type="text"
                  className={estilos.inputControl}
                  placeholder="ej. Armas con Maestría, Maniobras de Batalla..."
                  value={nuevoSelectorEtiqueta}
                  onChange={(e) => setNuevoSelectorEtiqueta(e.target.value)}
                />
              </div>

              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Tipo de Selección</span>
                </label>
                <div className={estilos.filaCamposCompacta}>
                  <SelectorDesplegable<"unico" | "multiple">
                    valor={nuevoSelectorTipo}
                    opciones={[
                { valor: "unico", etiqueta: "Opción Única (1)" },
                { valor: "multiple", etiqueta: "Selección Múltiple" }
            ]}
                    alCambiar={(val) => setNuevoSelectorTipo(val)}
                  />
                  {nuevoSelectorTipo === "multiple" && (<input
                    type="number"
                    min={1}
                    className={`${estilos.inputControl} ${estilos.inputNumeroAncho80}`}
                    title="Máximo de selecciones"
                    placeholder="Máx."
                    value={nuevoSelectorMax}
                    onChange={(e) => setNuevoSelectorMax(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  />)}
                </div>
              </div>

              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Formato de Visualización</span>
                </label>
                <SelectorDesplegable<"normal" | "lista">
                  valor={nuevoSelectorVisualizacion}
                  opciones={[
                { valor: "normal", etiqueta: "Selector Normal (Chips)" },
                { valor: "lista", etiqueta: "Selector Lista (Vertical)" }
            ]}
                  alCambiar={(val) => setNuevoSelectorVisualizacion(val)}
                />
              </div>
            </div>

            <div className={`${estilos.campoGrupo} ${estilos.margenTop8}`}>
              <label className={estilos.labelCampo}>
                <span>Opciones disponibles (separadas por comas o saltos de línea)</span>
              </label>
              <textarea
                className={estilos.inputControl}
                rows={3}
                placeholder="ej. Espada larga, Hacha de batalla, Daga, Alabarda..."
                value={nuevoOpcionesTexto}
                onChange={(e) => setNuevoOpcionesTexto(e.target.value)}
                spellCheck={false}
              />
              <p className={estilos.pistaCampo}>
                Ingresa los nombres de las opciones entre las que el jugador podrá escoger en su hoja.
              </p>
            </div>

            <div className={estilos.botonesNuevoEfecto}>
              <button type="button" className={estilos.botonCancelarEfecto} onClick={() => setModoCreandoSelector(false)}>
                Cancelar
              </button>
              <button type="button" className={estilos.botonConfirmarEfecto} onClick={manejarAgregarSelector}>
                Confirmar Selector
              </button>
            </div>
          </div>) : (<button type="button" className={estilos.botonAnadirEfecto} onClick={() => setModoCreandoSelector(true)}>
            <Plus size={14}/>
            <span>Añadir Selector de Opciones</span>
          </button>)}
      </div>);
}
