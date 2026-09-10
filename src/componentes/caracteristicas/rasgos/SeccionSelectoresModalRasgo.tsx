import React from "react";
import type { SelectorRasgo } from "@/tipos";
import { Check, Lock } from "lucide-react";
import { TooltipUniversal } from "@/componentes/comunes";
import { SelectorInvocacionesAcordeon } from "./SelectorInvocacionesAcordeon";
import { SelectorTrucoAltoElfo, type OpcionTrucoMago } from "./SelectorTrucoAltoElfo";
import estilos from "./VistaRasgosJugador.module.css";

interface SeccionSelectoresModalRasgoProps {
  selectores: SelectorRasgo[];
  nivelPersonaje?: number;
  opcionesTrucosMago: OpcionTrucoMago[];
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
}

export const SeccionSelectoresModalRasgo: React.FC<SeccionSelectoresModalRasgoProps> = ({
  selectores,
  nivelPersonaje,
  opcionesTrucosMago,
  alActualizarSeleccion
}) => {
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

        // Para selector de truco de mago sustituible (Alto elfo y similares)
        const esSelectorTruco = sel.id.toLowerCase().includes("truco");
        if (esSelectorTruco) {
          const trucoIdActual = seleccionados[0] || "prestidigitacion";
          return (
            <div key={sel.id} className={estilos.tarjetaSelectorModal}>
              <div className={estilos.cabeceraSelectorModal}>
                <span className={estilos.tituloSelectorModal}>{sel.etiqueta}</span>
                <span className={estilos.limiteSelectorModal}>Sustituible tras descanso largo</span>
              </div>
              <div style={{ marginTop: 4 }}>
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

        // Para selectores tácticos estándar (Maestría de armas, Maniobras, etc.)
        return (
          <div key={sel.id} className={estilos.tarjetaSelectorModal}>
            <div className={estilos.cabeceraSelectorModal}>
              <span className={estilos.tituloSelectorModal}>{sel.etiqueta}</span>
              <span className={estilos.limiteSelectorModal}>
                {sel.tipo === "multiple"
                  ? `Selecciona hasta ${max} (${seleccionados.length}/${max})`
                  : "Selecciona 1 opción"}
              </span>
            </div>

            <div className={estilos.gridOpcionesSelectorModal}>
              {sel.opciones.map((op) => {
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
                      className={`${estilos.opcionSelectorCard} ${estaActiva ? estilos.opcionSelectorCardActiva : ""} ${bloqueada ? estilos.opcionSelectorCardBloqueada : ""}`}
                      onClick={() => {
                        if (!alActualizarSeleccion || bloqueada) return;
                        if (sel.tipo === "unico") {
                          alActualizarSeleccion(sel.id, [op.id]);
                        } else {
                          if (estaActiva) {
                            alActualizarSeleccion(
                              sel.id,
                              seleccionados.filter((id) => id !== op.id)
                            );
                          } else {
                            if (seleccionados.length < max) {
                              alActualizarSeleccion(sel.id, [...seleccionados, op.id]);
                            } else {
                              const nuevos = [...seleccionados.slice(1), op.id];
                              alActualizarSeleccion(sel.id, nuevos);
                            }
                          }
                        }
                      }}
                    >
                      <span
                        className={estilos.nombreOpcionSelector}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        {op.nombre}
                        {estaActiva && <Check size={12} color="#38bdf8" />}
                        {bloqueada && <Lock size={12} color="#f87171" />}
                      </span>
                    </button>
                  </TooltipUniversal>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
