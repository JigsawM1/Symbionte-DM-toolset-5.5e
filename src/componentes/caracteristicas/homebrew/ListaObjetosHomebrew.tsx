import React, { useState, useEffect, useMemo } from "react";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import {
  usarEstadoHomebrew,
  usarAccionesHomebrew,
} from "@/almacen/selectores";
import type { ObjetoHomebrew, HechizoBase } from "@/tipos";
import { IDS_INICIALES_OBJETOS } from "@/utiles/datosIniciales";
import { Edit2, Trash2, Copy, Skull } from "lucide-react";
import estilos from "./ListaHomebrew.module.css";
import { ConfirmDialog, SelectorDesplegable } from "@/componentes/comunes";
import { PanelDetalleObjetoHomebrew } from "./subcomponentesLista/PanelDetalleObjetoHomebrew";

export interface ListaObjetosHomebrewProps {
  iniciarEdicionObjeto?: (o: ObjetoHomebrew) => void;
  iniciarPlantillaObjeto?: (o: ObjetoHomebrew) => void;
  iniciarEdicionHechizo?: (h: HechizoBase) => void;
  cancelarEdicion?: () => void;
  idEnEdicion?: string | null;
  soloLectura?: boolean;
}

const LIMITE_PASO = 60;

export const ListaObjetosHomebrew: React.FC<ListaObjetosHomebrewProps> = ({
  iniciarEdicionObjeto,
  iniciarPlantillaObjeto,
  iniciarEdicionHechizo,
  cancelarEdicion,
  idEnEdicion,
  soloLectura = false
}) => {
  const { objetosHomebrew, baseDatosHechizos } = usarEstadoHomebrew();
  const {
    eliminarObjetoHomebrew,
    usarObjetoComoPlantilla: usarObjetoComoPlantillaGlobal
  } = usarAccionesHomebrew();

  const funcionPlantilla = iniciarPlantillaObjeto || usarObjetoComoPlantillaGlobal;

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [criterioOrden, setCriterioOrden] = useState<"nombre-asc" | "nombre-desc">("nombre-asc");
  const [idObjetoDetalle, setIdObjetoDetalle] = useState<string | null>(null);
  const [limiteVista, setLimiteVista] = useState(LIMITE_PASO);
  const [confirmarAccion, setConfirmarAccion] = useState<{
    titulo: string;
    mensaje: string;
    onConfirmar: () => void;
  } | null>(null);

  useEffect(() => {
    setLimiteVista(LIMITE_PASO);
  }, [filtroBusqueda, criterioOrden]);

  // Optimización de rendimiento (Bolt): Memoizamos el filtrado y ordenamiento de objetos
  // del compendio y creaciones personalizadas (200+ elementos) para prevenir ejecuciones
  // redundantes de búsqueda tolerante en cambios de estado secundarios (como idObjetoDetalle o confirmarAccion).
  const objetosOrdenados = useMemo(() => {
    const objetosBase = soloLectura
      ? objetosHomebrew
      : objetosHomebrew.filter((o) => !IDS_INICIALES_OBJETOS.has(o.id));

    const filtrados = objetosBase.filter((o) =>
      coincideBusquedaTolerante([o.nombre, o.categoria, o.subcategoria, o.descripcion], filtroBusqueda)
    );

    return filtrados.sort(
      compararPorRelevanciaTitulo(
        (o) => o.nombre,
        filtroBusqueda,
        (a, b) => {
          if (criterioOrden === "nombre-desc") {
            return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" });
          }
          return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
        },
        (o) => [o.categoria, o.subcategoria, o.descripcion]
      )
    );
  }, [objetosHomebrew, soloLectura, filtroBusqueda, criterioOrden]);

  const objetosVisibles = useMemo(
    () => objetosOrdenados.slice(0, limiteVista),
    [objetosOrdenados, limiteVista]
  );

  return (
    <div className={estilos.panelLista}>
      <div className={estilos.cabeceraPanel}>
        {soloLectura
          ? `EQUIPO Y OBJETOS DEL COMPENDIO (${objetosOrdenados.length})`
          : `CREACIONES PERSISTIDAS (${objetosOrdenados.length})`}
      </div>

      <div className={`${estilos.cajaBuscadorHomebrew} u-items-center`}>
        <input
          type="text"
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          placeholder="Filtrar objetos..."
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
        {objetosOrdenados.length === 0 ? (
          <div className={estilos.textoListaVacia}>No se encontraron objetos mágicos.</div>
        ) : (
          <>
            {objetosVisibles.map((o) => (
              <div key={o.id} className={estilos.itemListaBrutal}>
                <div
                  className={estilos.itemInfoListaClickable}
                  onClick={() => setIdObjetoDetalle(o.id)}
                  title="Ver detalles del objeto mágico"
                >
                  <div className="u-flex u-items-center u-gap-sm u-flex-wrap">
                    <span className={estilos.itemNombre}>{o.nombre}</span>
                    {(o.esVeneno || o.tipoVeneno) && (
                      <span className={estilos.badgeVenenoObjeto}>
                        <Skull size={10} />
                        <span>VENENO {o.tipoVeneno ? `(${o.tipoVeneno})` : ""}</span>
                      </span>
                    )}
                  </div>
                  <span className={estilos.itemSub}>
                    Rareza: {o.rareza} {o.propiedades ? `| Prop.: ${o.propiedades}` : ""}
                  </span>
                </div>
                <div className={estilos.grupoBotonesItem}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      funcionPlantilla(o);
                    }}
                    className={estilos.botonEditarItem}
                    title="Usar como plantilla para un nuevo objeto"
                    type="button"
                  >
                    <Copy size={14} />
                  </button>
                  {!soloLectura && (
                    <>
                      {iniciarEdicionObjeto && (
                        <button
                          onClick={() => iniciarEdicionObjeto(o)}
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
                            titulo: "Borrar Objeto",
                            mensaje: `¿Estás seguro de que deseas borrar el objeto "${o.nombre}" del homebrew? Esta acción no se puede deshacer.`,
                            onConfirmar: () => {
                              if (idEnEdicion === o.id && cancelarEdicion) cancelarEdicion();
                              eliminarObjetoHomebrew(o.id);
                            }
                          });
                        }}
                        className={estilos.botonEliminarItem}
                        title="Eliminar de la base de datos"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {objetosOrdenados.length > limiteVista && (
              <div className={estilos.contenedorMostrarMas}>
                <button
                  onClick={() => setLimiteVista((prev) => prev + LIMITE_PASO)}
                  className={`${estilos.botonBuscadorLimpiarHomebrew} ${estilos.botonMostrarMas}`}
                  type="button"
                >
                  Mostrar más objetos ({objetosOrdenados.length - limiteVista} restantes)...
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Overlay Detalle Objeto con panel modular */}
      <PanelDetalleObjetoHomebrew
        idObjeto={idObjetoDetalle}
        alCerrar={() => setIdObjetoDetalle(null)}
        alUsarPlantilla={funcionPlantilla}
        alAbrirHechizo={(idH) => {
          if (iniciarEdicionHechizo) {
            const hEncontrado = baseDatosHechizos.find((h) => h.id === idH);
            if (hEncontrado) {
              iniciarEdicionHechizo(hEncontrado);
            }
          }
        }}
      />

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
