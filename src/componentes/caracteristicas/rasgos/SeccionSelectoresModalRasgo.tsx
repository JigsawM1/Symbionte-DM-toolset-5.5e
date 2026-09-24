import React from "react";
import type { SelectorRasgo } from "@/tipos";
import { Check, Lock } from "lucide-react";
import { SelectorDesplegable, TooltipUniversal, ControlPaginacion } from "@/componentes/comunes";
import { SelectorInvocacionesAcordeon } from "./SelectorInvocacionesAcordeon";
import { SelectorTrucoAltoElfo, type OpcionTrucoMago } from "./SelectorTrucoAltoElfo";
import estilos from "./VistaRasgosJugador.module.css";

interface SeccionSelectoresModalRasgoProps {
  selectores: SelectorRasgo[];
  nivelPersonaje?: number;
  opcionesTrucosMago: OpcionTrucoMago[];
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
}

const ELEMENTOS_POR_PAGINA_SELECTOR = 4;

export const SeccionSelectoresModalRasgo: React.FC<SeccionSelectoresModalRasgoProps> = ({
  selectores,
  nivelPersonaje,
  opcionesTrucosMago,
  alActualizarSeleccion
}) => {
  const [busquedas, setBusquedas] = React.useState<Record<string, string>>({});
  const [paginas, setPaginas] = React.useState<Record<string, number>>({});

  return (
    <div className={estilos.seccionSelectoresModal}>
      {selectores.map((sel) => {
        const seleccionados = sel.valorActual || [];
        const max = sel.maxSelecciones || 1;
        const esSelectorInvocaciones =
          sel.id.toLowerCase().includes("invocacion") ||
          sel.etiqueta.toLowerCase().includes("invocaci");

        // Para Invocaciones Sobrenaturales u otros catálogos extensos, usar vista de acordeón con cajas
        if (esSelectorInvocaciones) {
          return (
            <div key={sel.id} className={estilos.tarjetaSelectorModal}>
              <div className={estilos.cabeceraSelectorModal}>
                <span className={estilos.tituloSelectorModal}>{sel.etiqueta}</span>
                <span className={estilos.limiteSelectorModal}>
                  {`Invocaciones conocidas: ${seleccionados.length} / ${max}`}
                </span>
              </div>
              <SelectorInvocacionesAcordeon
                selector={sel}
                nivelPersonaje={nivelPersonaje}
                alActualizarSeleccion={alActualizarSeleccion}
              />
            </div>
          );
        }

        // Para selector específico de truco de mago sustituible (Alto elfo)
        const esSelectorAltoElfo = sel.id === "selector_truco_alto_elfo";
        if (esSelectorAltoElfo) {
          const trucoIdActual = seleccionados[0] || "prestidigitacion";
          return (
            <div key={sel.id} className={estilos.tarjetaSelectorModal}>
              <div className={estilos.cabeceraSelectorModal}>
                <span className={estilos.tituloSelectorModal}>{sel.etiqueta}</span>
                <span className={estilos.limiteSelectorModal}>Sustituible tras descanso largo</span>
              </div>
              <div className="u-mt-1">
                <SelectorTrucoAltoElfo
                  idSelector={sel.id}
                  trucoIdActual={trucoIdActual}
                  opciones={opcionesTrucosMago}
                  alActualizarSeleccion={alActualizarSeleccion}
                  placeholder="Buscar truco de mago..."
                />
              </div>
            </div>
          );
        }

        // Para selectores en forma de lista vertical (declarativo desde el builder o por ID de conjuro nv1)
        const esModoLista =
          sel.visualizacion === "lista" ||
          sel.id.toLowerCase().includes("conjuro_nv1") ||
          sel.id.toLowerCase().includes("hechizo_nv1") ||
          (sel.etiqueta.toLowerCase().includes("nivel 1") && sel.etiqueta.toLowerCase().includes("conjuro"));

        // Para selectores únicos de conjuros, trucos o listas extensas que no sean lista vertical
        const esSelectorDesplegable =
          !esModoLista &&
          sel.tipo === "unico" &&
          (sel.id.toLowerCase().includes("conjuro") ||
            sel.id.toLowerCase().includes("hechizo") ||
            sel.id.toLowerCase().includes("truco") ||
            sel.opciones.length > 8);

        if (esSelectorDesplegable) {
          const valorActual = seleccionados[0] || "";
          const opcionesDesplegable = sel.opciones.map((op) => ({
            valor: op.id,
            etiqueta: op.nombre
          }));

          return (
            <div key={sel.id} className={estilos.tarjetaSelectorModal}>
              <div className={estilos.cabeceraSelectorModal}>
                <span className={estilos.tituloSelectorModal}>{sel.etiqueta}</span>
                <span className={estilos.limiteSelectorModal}>
                  {valorActual ? "1 seleccionada" : "Selecciona 1 opción"}
                </span>
              </div>
              <div className="u-mt-1">
                <SelectorDesplegable
                  valor={valorActual}
                  opciones={opcionesDesplegable}
                  alCambiar={(nuevoVal) => alActualizarSeleccion?.(sel.id, [nuevoVal])}
                  placeholder={`Seleccionar ${sel.etiqueta.toLowerCase()}...`}
                />
              </div>
            </div>
          );
        }

        const busquedaActual = (busquedas[sel.id] || "").toLowerCase().trim();
        const opcionesFiltradas = busquedaActual
          ? sel.opciones.filter(
              (op) =>
                op.nombre.toLowerCase().includes(busquedaActual) ||
                (op.descripcion && op.descripcion.toLowerCase().includes(busquedaActual))
            )
          : sel.opciones;

        const manejarClickOpcion = (opId: string, estaBloqueada: boolean) => {
          if (!alActualizarSeleccion || estaBloqueada) return;
          if (sel.tipo === "unico") {
            alActualizarSeleccion(sel.id, [opId]);
          } else {
            if (seleccionados.includes(opId)) {
              alActualizarSeleccion(
                sel.id,
                seleccionados.filter((id) => id !== opId)
              );
            } else {
              if (seleccionados.length < max) {
                alActualizarSeleccion(sel.id, [...seleccionados, opId]);
              } else {
                const nuevos = [...seleccionados.slice(1), opId];
                alActualizarSeleccion(sel.id, nuevos);
              }
            }
          }
        };

        // Renderizado del selector: modo Lista o modo Normal (cuadrícula/chips)
        return (
          <div key={sel.id} className={estilos.tarjetaSelectorModal}>
            <div className={estilos.cabeceraSelectorModal}>
              <span className={estilos.tituloSelectorModal}>{sel.etiqueta}</span>
              <span className={estilos.limiteSelectorModal}>
                {sel.tipo === "multiple"
                  ? `Selecciona hasta ${max} (${seleccionados.length}/${max})`
                  : seleccionados.length > 0
                  ? `1 seleccionada`
                  : "Selecciona 1 opción"}
              </span>
            </div>

            {(sel.opciones.length > 5 || esModoLista) && (
              <div className={estilos.contenedorBuscadorSelectorModal}>
                <input
                  type="text"
                  className={estilos.inputBuscadorSelectorModal}
                  placeholder={`Buscar en ${sel.etiqueta.toLowerCase()}...`}
                  value={busquedas[sel.id] || ""}
                  onChange={(e) => {
                    const nuevoTexto = e.target.value;
                    setBusquedas((prev) => ({ ...prev, [sel.id]: nuevoTexto }));
                    setPaginas((prev) => ({ ...prev, [sel.id]: 1 }));
                  }}
                />
              </div>
            )}

            {esModoLista ? (
              (() => {
                const esSelectorMultipleLista = sel.tipo === "multiple";
                const paginaActual = paginas[sel.id] || 1;
                const opcionesListaRender = esSelectorMultipleLista
                  ? opcionesFiltradas.slice(
                      (paginaActual - 1) * ELEMENTOS_POR_PAGINA_SELECTOR,
                      paginaActual * ELEMENTOS_POR_PAGINA_SELECTOR
                    )
                  : opcionesFiltradas;

                return (
                  <>
                    <div className={estilos.listaOpcionesSelectorModal}>
                      {opcionesListaRender.map((op) => {
                        const estaActiva = seleccionados.includes(op.id);
                        const cumpleNivel =
                          op.nivelMinimo === undefined ||
                          nivelPersonaje === undefined ||
                          nivelPersonaje >= op.nivelMinimo;
                        const cumpleInvocacionPrevia =
                          !op.requisitoInvocacion || seleccionados.includes(op.requisitoInvocacion);
                        const bloqueada = !estaActiva && (!cumpleNivel || !cumpleInvocacionPrevia);

                        let avisoBloqueo = "";
                        if (!cumpleNivel) {
                          avisoBloqueo = `[Bloqueado: Requiere nivel ${op.nivelMinimo}] `;
                        } else if (!cumpleInvocacionPrevia) {
                          avisoBloqueo = `[Bloqueado: Requiere requisito previo] `;
                        }

                        return (
                          <button
                            key={op.id}
                            type="button"
                            disabled={bloqueada}
                            className={`${estilos.itemListaSelectorModal} ${
                              estaActiva ? estilos.itemListaSelectorModalActivo : ""
                            } ${bloqueada ? estilos.itemListaSelectorModalBloqueado : ""}`}
                            onClick={() => manejarClickOpcion(op.id, bloqueada)}
                            title={bloqueada ? `${avisoBloqueo}${op.nombre}` : op.nombre}
                          >
                            <div className={estilos.infoItemListaSelector}>
                              <span className={estilos.nombreItemListaSelector}>{op.nombre}</span>
                              {op.descripcion && (
                                <span className={estilos.descripcionItemListaSelector}>
                                  {op.descripcion}
                                </span>
                              )}
                              {bloqueada && (
                                <span className={estilos.avisoBloqueoItemLista}>
                                  {avisoBloqueo}
                                </span>
                              )}
                            </div>
                            <div className={estilos.iconoCheckListaSelector}>
                              {estaActiva && <Check size={16} />}
                              {bloqueada && <Lock size={14} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {esSelectorMultipleLista && (
                      <ControlPaginacion
                        paginaActual={paginaActual}
                        totalElementos={opcionesFiltradas.length}
                        elementosPorPagina={ELEMENTOS_POR_PAGINA_SELECTOR}
                        alCambiarPagina={(nueva) =>
                          setPaginas((prev) => ({ ...prev, [sel.id]: nueva }))
                        }
                        tamano="compacto"
                        etiquetaElementos="opciones"
                      />
                    )}
                  </>
                );
              })()
            ) : (
              <div className={estilos.gridOpcionesSelectorModal}>
                {opcionesFiltradas.map((op) => {
                  const estaActiva = seleccionados.includes(op.id);
                  const cumpleNivel =
                    op.nivelMinimo === undefined ||
                    nivelPersonaje === undefined ||
                    nivelPersonaje >= op.nivelMinimo;
                  const cumpleInvocacionPrevia =
                    !op.requisitoInvocacion || seleccionados.includes(op.requisitoInvocacion);
                  const bloqueada = !estaActiva && (!cumpleNivel || !cumpleInvocacionPrevia);

                  let avisoBloqueo = "";
                  if (!cumpleNivel) {
                    avisoBloqueo = `[Bloqueado: Requiere nivel ${op.nivelMinimo}] `;
                  } else if (!cumpleInvocacionPrevia) {
                    avisoBloqueo = `[Bloqueado: Requiere requisito previo] `;
                  }

                  const tituloTooltip = bloqueada ? `${avisoBloqueo}${op.nombre}` : op.nombre;
                  const contenidoTooltip = bloqueada
                    ? `${avisoBloqueo}\n\n${op.descripcion || op.nombre}`
                    : op.descripcion || op.nombre;

                  return (
                    <TooltipUniversal
                      key={op.id}
                      titulo={tituloTooltip}
                      contenido={contenidoTooltip}
                      posicion="arriba"
                    >
                      <button
                        type="button"
                        disabled={bloqueada}
                        className={`${estilos.opcionSelectorCard} ${
                          estaActiva ? estilos.opcionSelectorCardActiva : ""
                        } ${bloqueada ? estilos.opcionSelectorCardBloqueada : ""}`}
                        onClick={() => manejarClickOpcion(op.id, bloqueada)}
                      >
                        <span className={estilos.nombreOpcionSelector}>
                          {op.nombre}
                          {estaActiva && <Check size={12} color="#38bdf8" />}
                          {bloqueada && <Lock size={12} color="#f87171" />}
                        </span>
                      </button>
                    </TooltipUniversal>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
