import React, { useState, useEffect, useMemo } from "react";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import {
  usarEstadoHomebrew,
  usarAccionesHomebrew,
  usarEstadoConfiguracion,
} from "@/almacen/selectores";
import type { MonstruoBase, HechizoBase } from "@/tipos";
import { IDS_INICIALES_MONSTRUOS } from "@/utiles/datosIniciales";
import { Edit2, Trash2, X } from "lucide-react";
import estilos from "./ListaHomebrew.module.css";
import { ConfirmDialog, SelectorDesplegable } from "@/componentes/comunes";
import { PanelFichaDnD } from "@/componentes/caracteristicas/iniciativa";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { construirFormulaAtaqueRapido } from "@/utiles/procesadorAtaques";
import { formatearSubtituloCriatura } from "@/almacen/sanitizacion";

function parsearCR(desafioRaw: string | number | undefined): number {
  if (desafioRaw === undefined || desafioRaw === null || desafioRaw === "") return -1;
  const str = String(desafioRaw).trim();
  if (str === "1/8") return 0.125;
  if (str === "1/4") return 0.25;
  if (str === "1/2") return 0.5;
  const val = parseFloat(str);
  return isNaN(val) ? -1 : val;
}

export interface ListaMonstruosHomebrewProps {
  iniciarEdicionCriatura?: (m: MonstruoBase) => void;
  iniciarEdicionHechizo?: (h: HechizoBase) => void;
  cancelarEdicion?: () => void;
  idEnEdicion?: string | null;
  soloLectura?: boolean;
}

const LIMITE_PASO = 60;

export const ListaMonstruosHomebrew: React.FC<ListaMonstruosHomebrewProps> = ({
  iniciarEdicionCriatura,
  iniciarEdicionHechizo,
  cancelarEdicion,
  idEnEdicion,
  soloLectura = false
}) => {
  const { baseDatosMonstruos, baseDatosHechizos } = usarEstadoHomebrew();
  const { esGM } = usarEstadoConfiguracion();
  const { eliminarMonstruoHomebrew } = usarAccionesHomebrew();

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [criterioOrden, setCriterioOrden] = useState<"nombre-asc" | "nombre-desc" | "cr-asc" | "cr-desc">("nombre-asc");
  const [idCriaturaDetalle, setIdCriaturaDetalle] = useState<string | null>(null);
  const [limiteVista, setLimiteVista] = useState(LIMITE_PASO);
  const [confirmarAccion, setConfirmarAccion] = useState<{
    titulo: string;
    mensaje: string;
    onConfirmar: () => void;
  } | null>(null);

  useEffect(() => {
    setLimiteVista(LIMITE_PASO);
  }, [filtroBusqueda, criterioOrden]);

  const lanzarAtaqueRapidoCriatura = (
    criaturaNombre: string,
    ataqueNombre: string,
    bonoAtaqueStr: string,
    dadosDaño: string,
    tipoDaño: string
  ) => {
    if (!esGM) return;
    const formulaDados = construirFormulaAtaqueRapido(
      ataqueNombre,
      bonoAtaqueStr,
      dadosDaño,
      tipoDaño,
      criaturaNombre
    );
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${ataqueNombre}`);
  };

  const lanzarTiradaD20Criatura = (
    criaturaNombre: string,
    etiqueta: string,
    bonificador: number
  ) => {
    if (!esGM) return;
    const etiquetaCompleta = `${sanitizarEtiqueta(criaturaNombre)} - ${sanitizarEtiqueta(etiqueta)}`;
    const formulaDados = `!${etiquetaCompleta}:1d20${bonificador >= 0 ? "+" : ""}${bonificador}`;
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${etiqueta}`);
  };

  // Optimización de rendimiento (Bolt): memoiza filtrado y ordenamiento de criaturas (520+ items)
  // evitando recomputaciones O(N log N) en re-renders por modales o selección.
  const monstruosOrdenados = useMemo(() => {
    const base = soloLectura ? baseDatosMonstruos : baseDatosMonstruos.filter((m) => !IDS_INICIALES_MONSTRUOS.has(m.id));
    const filtrados = base.filter((m) => coincideBusquedaTolerante([m.nombre, m.tipo, m.alineacion, m.tamaño], filtroBusqueda));

    return filtrados.sort(
      compararPorRelevanciaTitulo(
        (m) => m.nombre,
        filtroBusqueda,
        (a, b) => {
          if (criterioOrden === "nombre-desc") return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" });
          if (criterioOrden === "cr-asc" || criterioOrden === "cr-desc") {
            const crDiff = parsearCR(a.desafio) - parsearCR(b.desafio);
            if (crDiff !== 0) return criterioOrden === "cr-asc" ? crDiff : -crDiff;
          }
          return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
        },
        (m) => [m.tipo, m.alineacion, m.tamaño]
      )
    );
  }, [baseDatosMonstruos, soloLectura, filtroBusqueda, criterioOrden]);

  const monstruosVisibles = useMemo(
    () => monstruosOrdenados.slice(0, limiteVista),
    [monstruosOrdenados, limiteVista]
  );

  return (
    <div className={estilos.panelLista}>
      <div className={estilos.cabeceraPanel}>
        {soloLectura
          ? `BESTIARIO DEL COMPENDIO (${monstruosOrdenados.length})`
          : `CREACIONES PERSISTIDAS (${monstruosOrdenados.length})`}
      </div>

      <div className={`${estilos.cajaBuscadorHomebrew} u-items-center`}>
        <input
          type="text"
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          placeholder="Filtrar criaturas..."
          className={estilos.inputBuscadorHomebrew}
        />
        {filtroBusqueda && (
          <button
            onClick={() => setFiltroBusqueda("")}
            className={estilos.botonLimpiarBusquedaHomebrew}
            type="button"
          >
            Limpiar
          </button>
        )}
        <div className={estilos.contenedorSelectorOrden}>
          <SelectorDesplegable
            valor={criterioOrden}
            alCambiar={(val) => setCriterioOrden(val as typeof criterioOrden)}
            opciones={[
              { valor: "nombre-asc", etiqueta: "Nombre (A - Z)" },
              { valor: "nombre-desc", etiqueta: "Nombre (Z - A)" },
              { valor: "cr-asc", etiqueta: "CR (Menor a Mayor)" },
              { valor: "cr-desc", etiqueta: "CR (Mayor a Menor)" }
            ]}
            tamano="compacto"
            titulo="Ordenar por"
          />
        </div>
      </div>

      <div className={estilos.contenedorScrollLista}>
        {monstruosOrdenados.length === 0 ? (
          <div className={estilos.textoListaVacia}>No se encontraron criaturas.</div>
        ) : (
          <>
            {monstruosVisibles.map((m) => (
              <div key={m.id} className={estilos.itemListaBrutal}>
                <div
                  className={estilos.itemInfoListaClickable}
                  onClick={() => setIdCriaturaDetalle(m.id)}
                  title="Ver ficha completa de la criatura"
                >
                  <span className={estilos.itemNombre}>{m.nombre}</span>
                  <span className={estilos.itemSub}>
                    {formatearSubtituloCriatura(m.tipo, m.tamaño, m.alineacion)} | CA:{" "}
                    <span className="dato-numerico">{m.ca}</span> | HP:{" "}
                    <span className="dato-numerico">{m.vidaMaxima}</span> | CR: {m.desafio || "—"}
                  </span>
                </div>
                {!soloLectura && (
                  <div className={estilos.grupoBotonesItem}>
                    {iniciarEdicionCriatura && (
                      <button
                        onClick={() => iniciarEdicionCriatura(m)}
                        className={estilos.botonEditarItem}
                        title="Editar creación"
                        type="button"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setConfirmarAccion({
                          titulo: "Borrar Monstruo",
                          mensaje: `¿Estás seguro de que deseas borrar el monstruo "${m.nombre}" del homebrew? Esta acción no se puede deshacer.`,
                          onConfirmar: () => {
                            if (idEnEdicion === m.id && cancelarEdicion) cancelarEdicion();
                            eliminarMonstruoHomebrew(m.id);
                          }
                        });
                      }}
                      className={estilos.botonEliminarItem}
                      title="Eliminar de la base de datos"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {monstruosOrdenados.length > limiteVista && (
              <div className={estilos.contenedorMostrarMas}>
                <button
                  onClick={() => setLimiteVista((prev) => prev + LIMITE_PASO)}
                  className={`${estilos.botonBuscadorLimpiarHomebrew} ${estilos.botonMostrarMas}`}
                  type="button"
                >
                  Mostrar más criaturas ({monstruosOrdenados.length - limiteVista} restantes)...
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Overlay Detalle Criatura */}
      {idCriaturaDetalle && (() => {
        const m = baseDatosMonstruos.find((c) => c.id === idCriaturaDetalle);
        if (!m) return null;
        return (
          <div className={estilos.panelDetalleOverlay}>
            <div className={estilos.cabeceraDetalle}>
              <div className={estilos.cabeceraDetalleIzquierda}>
                <span className={estilos.objetoNivelOverlay}>
                  CA {m.ca} | HP {m.vidaMaxima} | CR {m.desafio || "—"}
                </span>
                <span className={estilos.nombreHechizoOverlay}>{m.nombre}</span>
              </div>
              <button
                onClick={() => setIdCriaturaDetalle(null)}
                className={estilos.botonCerrarDetalle}
                title="Cerrar detalles"
                type="button"
              >
                <X size={15} />
              </button>
            </div>
            <div className={`${estilos.cuerpoDetalle} ${estilos.cuerpoDetalleFicha}`}>
              <PanelFichaDnD
                criaturaNombre={m.nombre}
                plantilla={m}
                baseDatosHechizos={baseDatosHechizos}
                alHacerClicHechizo={(hechizo) => {
                  if (iniciarEdicionHechizo) {
                    iniciarEdicionHechizo(hechizo);
                  }
                }}
                lanzarAtaqueRapido={lanzarAtaqueRapidoCriatura}
                lanzarTiradaD20Interactiva={lanzarTiradaD20Criatura}
                obtenerPercepcionPasiva={() =>
                  typeof m.sentidos === "object" && m.sentidos !== null
                    ? m.sentidos.percepcionPasiva || 10
                    : 10
                }
              />
            </div>
          </div>
        );
      })()}

      <ConfirmDialog
        abierto={confirmarAccion !== null}
        titulo={confirmarAccion?.titulo || ""}
        mensaje={confirmarAccion?.mensaje || ""}
        onConfirmar={() => {
          if (confirmarAccion) {
            confirmarAccion.onConfirmar();
            setConfirmarAccion(null);
          }
        }}
        onCancelar={() => setConfirmarAccion(null)}
      />
    </div>
  );
};
