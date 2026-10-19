import { obtenerOpcionesDinamicas } from "@/servicios/hidratadorDotes";
import { obtenerOpcionesDotesEstiloCombate } from "@/servicios/clases/dotesClase";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
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
            <ListFilter size={14} color="var(--pj-texto-cian)"/>
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
                <div>
                  <label>Momento de elección<SelectorDesplegable valor={sel.momentoEleccion ?? ""}
                    opciones={[{valor:"",etiqueta:"Libre"},{valor:"activacion",etiqueta:"Al activar"},{valor:"descanso_largo",etiqueta:"Tras descanso largo"}]}
                    alCambiar={v => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id ? { ...s, momentoEleccion: v === "activacion" || v === "descanso_largo" ? v : undefined } : s))} /></label>
                  <label>Catálogo de opciones<input className={estilos.inputControl} placeholder="Ejemplo: metamagia" value={sel.claveOpcionesDinamicas ?? ""}
                    onChange={e => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id ? { ...s, claveOpcionesDinamicas: e.target.value || undefined } : s))} /></label>
                  <button type="button" disabled={!sel.claveOpcionesDinamicas} onClick={() => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id
                    ? { ...s, opciones: structuredClone(obtenerOpcionesDinamicas(s.claveOpcionesDinamicas!)) } : s))}>Cargar catálogo</button>
                  <label>Otorga una dote de Estilo de combate <input type="checkbox" checked={sel.categoriaDote === "estilo_combate"}
                    onChange={e => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id ? { ...s,
                      tipoSelector: e.target.checked ? "dote" : "general", categoriaDote: e.target.checked ? "estilo_combate" : undefined,
                      tipo: "unico", maxSelecciones: 1, valorActual: [], opciones: e.target.checked ? obtenerOpcionesDotesEstiloCombate("") : s.opciones
                    } : s))} /></label>
                  <label>Caja independiente <input type="checkbox" checked={sel.ubicacion === "seccion"}
                    onChange={e => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id ? { ...s, ubicacion: e.target.checked ? "seccion" : "tarjeta" } : s))} /></label>
                  <label>Solo consulta <input type="checkbox" checked={sel.modo === "consulta"}
                    onChange={e => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id ? { ...s, modo: e.target.checked ? "consulta" : "seleccion" } : s))} /></label>
                  <label>Crear rasgos ejecutables <input type="checkbox" checked={!!sel.materializarRasgos}
                    onChange={e => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id ? { ...s, materializarRasgos: e.target.checked } : s))} /></label>
                  <label>Etiqueta <input className={estilos.inputControl} value={sel.etiqueta}
                    onChange={e => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id ? { ...s, etiqueta: e.target.value } : s))} /></label>
                  {sel.opciones.map(op => <label key={op.id}>{op.nombre}
                    <textarea className={estilos.inputControl} aria-label={`Descripción de ${op.nombre}`} value={op.descripcion}
                      onChange={e => actualizarBorrador("selectores", prev => prev.map(s => s.id === sel.id
                        ? { ...s, opciones: s.opciones.map(o => o.id === op.id ? { ...o, descripcion: e.target.value } : o) } : s))} />
                  </label>)}
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
                  {nuevoSelectorTipo === "multiple" && (<CampoNumerico
                                                          min={1}
                                                          className={`${estilos.inputControl} ${estilos.inputNumeroAncho80}`}
                                                          title="Máximo de selecciones"
                                                          placeholder="Máx."
                                                          value={nuevoSelectorMax}
                                                          alConfirmar={setNuevoSelectorMax}

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
              <BotonNumerico ambito="form" type="button" className={estilos.botonConfirmarEfecto} onClick={manejarAgregarSelector}>
                Confirmar Selector
              </BotonNumerico>
            </div>
          </div>) : (<button type="button" className={estilos.botonAnadirEfecto} onClick={() => setModoCreandoSelector(true)}>
            <Plus size={14}/>
            <span>Añadir Selector de Opciones</span>
          </button>)}
      </div>);
}
