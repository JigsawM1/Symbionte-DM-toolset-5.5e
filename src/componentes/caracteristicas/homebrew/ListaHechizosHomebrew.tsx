import React, { useState, useEffect, useMemo } from "react";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import {
  usarEstadoHomebrew,
  usarAccionesHomebrew,
  usarEstadoConfiguracion,
} from "@/almacen/selectores";
import type { HechizoBase } from "@/tipos";
import { IDS_INICIALES_HECHIZOS } from "@/utiles/datosIniciales";
import { Edit2, Trash2 } from "lucide-react";
import estilos from "./ListaHomebrew.module.css";
import { ConfirmDialog, SelectorDesplegable } from "@/componentes/comunes";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio";

export interface ListaHechizosHomebrewProps {
  iniciarEdicionHechizo?: (h: HechizoBase) => void;
  cancelarEdicion?: () => void;
  idEnEdicion?: string | null;
  soloLectura?: boolean;
}

const LIMITE_PASO = 60;

export const ListaHechizosHomebrew: React.FC<ListaHechizosHomebrewProps> = ({
  iniciarEdicionHechizo,
  cancelarEdicion,
  idEnEdicion,
  soloLectura = false
}) => {
  const { baseDatosHechizos } = usarEstadoHomebrew();
  const { esGM } = usarEstadoConfiguracion();
  const { eliminarHechizoHomebrew } = usarAccionesHomebrew();

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [criterioOrden, setCriterioOrden] = useState<"nombre-asc" | "nombre-desc">("nombre-asc");
  const [idHechizoDetalle, setIdHechizoDetalle] = useState<string | null>(null);
  const [limiteVista, setLimiteVista] = useState(LIMITE_PASO);
  const [confirmarAccion, setConfirmarAccion] = useState<{
    titulo: string;
    mensaje: string;
    onConfirmar: () => void;
  } | null>(null);

  useEffect(() => {
    setLimiteVista(LIMITE_PASO);
  }, [filtroBusqueda, criterioOrden]);

  // ponytail / vercel-best-practices: memoizar filtrado y ordenamiento de conjuros (390+ elementos)
  // combinando iteraciones en un solo paso (js-combine-iterations) y evitando recomputaciones en re-renders.
  const hechizosOrdenados = useMemo(() => {
    const filtrados = baseDatosHechizos.filter((h) => {
      if (!soloLectura && IDS_INICIALES_HECHIZOS.has(h.id)) return false;
      return coincideBusquedaTolerante([h.nombre, h.escuela, h.descripcion], filtroBusqueda);
    });

    return filtrados.sort(
      compararPorRelevanciaTitulo(
        (h) => h.nombre,
        filtroBusqueda,
        (a, b) => {
          if (criterioOrden === "nombre-desc") {
            return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" });
          }
          return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
        },
        (h) => [h.escuela, h.descripcion]
      )
    );
  }, [baseDatosHechizos, soloLectura, filtroBusqueda, criterioOrden]);

  const hechizosVisibles = hechizosOrdenados.slice(0, limiteVista);

  return (
    <div className={estilos.panelLista}>
      <div className={estilos.cabeceraPanel}>
        {soloLectura
          ? `CONJUROS DEL COMPENDIO (${hechizosOrdenados.length})`
          : `CREACIONES PERSISTIDAS (${hechizosOrdenados.length})`}
      </div>

      <div className={`${estilos.cajaBuscadorHomebrew} u-items-center`}>
        <input
          type="text"
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          placeholder="Filtrar hechizos..."
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
              { valor: "nombre-desc", etiqueta: "Nombre (Z - A)" }
            ]}
            tamano="compacto"
            titulo="Ordenar por"
          />
        </div>
      </div>

      <div className={estilos.contenedorScrollLista}>
        {hechizosOrdenados.length === 0 ? (
          <div className={estilos.textoListaVacia}>No se encontraron hechizos.</div>
        ) : (
          <>
            {hechizosVisibles.map((h) => (
              <div key={h.id} className={estilos.itemListaBrutal}>
                <div
                  className={estilos.itemInfoListaClickable}
                  onClick={() => setIdHechizoDetalle(h.id)}
                  title="Ver detalles del hechizo"
                >
                  <span className={estilos.itemNombre}>{h.nombre}</span>
                  <span className={estilos.itemSub}>
                    Nivel: <span className="dato-numerico">{h.nivel}</span> | {h.escuela} |{" "}
                    {h.alcance}
                  </span>
                </div>
                {!soloLectura && (
                  <div className={estilos.grupoBotonesItem}>
                    {iniciarEdicionHechizo && (
                      <button
                        onClick={() => iniciarEdicionHechizo(h)}
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
                          titulo: "Borrar Hechizo",
                          mensaje: `¿Estás seguro de que deseas borrar el hechizo "${h.nombre}" del homebrew? Esta acción no se puede deshacer.`,
                          onConfirmar: () => {
                            if (idEnEdicion === h.id && cancelarEdicion) cancelarEdicion();
                            eliminarHechizoHomebrew(h.id);
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
            {hechizosOrdenados.length > limiteVista && (
              <div className={estilos.contenedorMostrarMas}>
                <button
                  onClick={() => setLimiteVista((prev) => prev + LIMITE_PASO)}
                  className={`${estilos.botonBuscadorLimpiarHomebrew} ${estilos.botonMostrarMas}`}
                  type="button"
                >
                  Mostrar más hechizos ({hechizosOrdenados.length - limiteVista} restantes)...
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Overlay Detalle Hechizo */}
      {idHechizoDetalle && (() => {
        const hechizo = baseDatosHechizos.find((h) => h.id === idHechizoDetalle);
        if (!hechizo) return null;
        return (
          <div className={estilos.panelDetalleOverlay}>
            <FichaHechizo
              hechizo={hechizo}
              ocultarLanzamiento={!esGM}
              permitirUpcastLibre={true}
              nombrePersonaje="DM"
              onClose={() => setIdHechizoDetalle(null)}
              onEditar={
                !soloLectura && iniciarEdicionHechizo
                  ? () => {
                      iniciarEdicionHechizo(hechizo);
                      setIdHechizoDetalle(null);
                    }
                  : undefined
              }
            />
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
