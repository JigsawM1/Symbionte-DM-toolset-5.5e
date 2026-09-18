import React, { useState, useEffect } from "react";
import { normalizarTexto } from "@/almacen/usarAlmacenDM";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import {
  usarEstadoHomebrew,
  usarAccionesHomebrew,
} from "@/almacen/selectores";
import { MonstruoBase, HechizoBase, ObjetoHomebrew, ObjetoJuego, Arma, Armadura, Escudo } from "@/tipos";
import { DICCIONARIO_CATEGORIAS_EQUIPO } from "@/constantes/categoriasEquipoConstantes";
import { IDS_INICIALES_MONSTRUOS, IDS_INICIALES_HECHIZOS, IDS_INICIALES_OBJETOS } from "@/utiles/datosIniciales";
import {
  Edit2,
  Trash2,
  X,
  MapPin,
  Sparkles,
  Coins,
  Scale,
  Copy,
  Skull,
  Dices
} from "lucide-react";
import estilos from "./ListaHomebrew.module.css";
import { ConfirmDialog, SelectorDesplegable, TextoEnriquecidoDND } from "@/componentes/comunes";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio";
import { PanelFichaDnD } from "@/componentes/caracteristicas/iniciativa";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
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

interface Props {
  tipoHomebrew: "criatura" | "hechizo" | "objeto";
  iniciarEdicionCriatura?: (m: MonstruoBase) => void;
  iniciarEdicionHechizo?: (h: HechizoBase) => void;
  iniciarEdicionObjeto?: (o: ObjetoHomebrew) => void;
  iniciarPlantillaObjeto?: (o: ObjetoHomebrew) => void;
  cancelarEdicion?: () => void;
  idEnEdicion?: string | null;
  soloLectura?: boolean;
}

export const ListaHomebrew: React.FC<Props> = ({
  tipoHomebrew,
  iniciarEdicionCriatura,
  iniciarEdicionHechizo,
  iniciarEdicionObjeto,
  iniciarPlantillaObjeto,
  cancelarEdicion,
  idEnEdicion,
  soloLectura = false
}) => {
  const { baseDatosMonstruos, baseDatosHechizos, objetosHomebrew } = usarEstadoHomebrew();
  const {
    eliminarMonstruoHomebrew,
    eliminarHechizoHomebrew,
    eliminarObjetoHomebrew,
    usarObjetoComoPlantilla: usarObjetoComoPlantillaGlobal,
  } = usarAccionesHomebrew();

  const funcionPlantilla = iniciarPlantillaObjeto || usarObjetoComoPlantillaGlobal;

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [criterioOrden, setCriterioOrden] = useState<"nombre-asc" | "nombre-desc" | "cr-asc" | "cr-desc">("nombre-asc");
  const [idCriaturaDetalle, setIdCriaturaDetalle] = useState<string | null>(null);
  const [idHechizoDetalleCreador, setIdHechizoDetalleCreador] = useState<string | null>(null);
  const [idObjetoDetalle, setIdObjetoDetalle] = useState<string | null>(null);
  const [historialDetalle, setHistorialDetalle] = useState<string[]>([]);
  
  // Paginación / Límite de vista incremental
  const LIMITE_PASO = 60;
  const [limiteVista, setLimiteVista] = useState(LIMITE_PASO);

  useEffect(() => {
    setLimiteVista(LIMITE_PASO);
  }, [filtroBusqueda, tipoHomebrew, criterioOrden]);

  const navegarAObjeto = (idDestino: string) => {
    if (idObjetoDetalle) {
      setHistorialDetalle((prev) => [...prev, idObjetoDetalle]);
    }
    setIdObjetoDetalle(idDestino);
  };

  const navegarAtras = () => {
    if (historialDetalle.length > 0) {
      const nuevoHistorial = [...historialDetalle];
      const anteriorId = nuevoHistorial.pop();
      setHistorialDetalle(nuevoHistorial);
      if (anteriorId) {
        setIdObjetoDetalle(anteriorId);
      }
    }
  };
  const [confirmarAccion, setConfirmarAccion] = useState<{
    titulo: string;
    mensaje: string;
    onConfirmar: () => void;
  } | null>(null);

  // Filtrar creaciones homebrew por exclusión de datos por defecto de fábrica salvo si estamos en soloLectura

  const monstruosHomebrewSinFiltro = soloLectura
    ? baseDatosMonstruos
    : baseDatosMonstruos.filter((m) => !IDS_INICIALES_MONSTRUOS.has(m.id));
  const hechizosHomebrewSinFiltro = soloLectura
    ? baseDatosHechizos
    : baseDatosHechizos.filter((h) => !IDS_INICIALES_HECHIZOS.has(h.id));
  const objetosHomebrewSinFiltro = soloLectura
    ? objetosHomebrew
    : objetosHomebrew.filter((o) => !IDS_INICIALES_OBJETOS.has(o.id));

  const monstruosHomebrew = monstruosHomebrewSinFiltro.filter((m) =>
    coincideBusquedaTolerante([m.nombre, m.tipo, m.alineacion, m.tamaño], filtroBusqueda)
  );
  const hechizosHomebrew = hechizosHomebrewSinFiltro.filter((h) =>
    coincideBusquedaTolerante([h.nombre, h.escuela, h.descripcion], filtroBusqueda)
  );
  const objetosHomebrewFiltrados = objetosHomebrewSinFiltro.filter((o) =>
    coincideBusquedaTolerante([o.nombre, o.categoria, o.subcategoria, o.descripcion], filtroBusqueda)
  );

  // Ordenamiento dinámico priorizando el título
  const monstruosOrdenados = [...monstruosHomebrew].sort(
    compararPorRelevanciaTitulo(
      (m) => m.nombre,
      filtroBusqueda,
      (a, b) => {
        if (criterioOrden === "nombre-desc") {
          return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" });
        } else if (criterioOrden === "cr-asc") {
          const crA = parsearCR(a.desafio);
          const crB = parsearCR(b.desafio);
          if (crA !== crB) return crA - crB;
          return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
        } else if (criterioOrden === "cr-desc") {
          const crA = parsearCR(a.desafio);
          const crB = parsearCR(b.desafio);
          if (crA !== crB) return crB - crA;
          return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
        }
        return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
      },
      (m) => [m.tipo, m.alineacion, m.tamaño]
    )
  );

  const hechizosOrdenados = [...hechizosHomebrew].sort(
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

  const objetosOrdenados = [...objetosHomebrewFiltrados].sort(
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

  const cantExistentes =
    tipoHomebrew === "criatura"
      ? monstruosOrdenados.length
      : tipoHomebrew === "hechizo"
      ? hechizosOrdenados.length
      : objetosOrdenados.length;

  const monstruosVisibles = monstruosOrdenados.slice(0, limiteVista);
  const hechizosVisibles = hechizosOrdenados.slice(0, limiteVista);
  const objetosVisibles = objetosOrdenados.slice(0, limiteVista);

  return (
    <div className={estilos.panelLista}>
      <div className={estilos.cabeceraPanel}>
        {soloLectura
          ? tipoHomebrew === "criatura"
            ? `BESTIARIO DEL COMPENDIO (${cantExistentes})`
            : tipoHomebrew === "hechizo"
            ? `CONJUROS DEL COMPENDIO (${cantExistentes})`
            : `EQUIPO Y OBJETOS DEL COMPENDIO (${cantExistentes})`
          : `CREACIONES PERSISTIDAS (${cantExistentes})`}
      </div>

      {/* BUSCADOR Y ORDENAMIENTO EN EL PANEL */}
      <div className={`${estilos.cajaBuscadorHomebrew} u-items-center`}>
        <input
          type="text"
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          placeholder={`Filtrar ${
            tipoHomebrew === "criatura"
              ? "criaturas"
              : tipoHomebrew === "hechizo"
              ? "hechizos"
              : "objetos"
          }...`}
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
              ...(tipoHomebrew === "criatura"
                ? [
                    { valor: "cr-asc", etiqueta: "CR (Menor a Mayor)" },
                    { valor: "cr-desc", etiqueta: "CR (Mayor a Menor)" }
                  ]
                : [])
            ]}
            tamano="compacto"
            titulo="Ordenar por"
          />
        </div>
      </div>

      <div className={estilos.contenedorScrollLista}>
        {tipoHomebrew === "criatura" &&
          (monstruosHomebrew.length === 0 ? (
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
                      {formatearSubtituloCriatura(m.tipo, m.tamaño, m.alineacion)} | CA: <span className="dato-numerico">{m.ca}</span> | HP:{" "}
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
              {monstruosHomebrew.length > limiteVista && (
                <div className={estilos.contenedorMostrarMas}>
                  <button
                    onClick={() => setLimiteVista((prev) => prev + LIMITE_PASO)}
                    className={`${estilos.botonBuscadorLimpiarHomebrew} ${estilos.botonMostrarMas}`}
                    type="button"
                  >
                    Mostrar más criaturas ({monstruosHomebrew.length - limiteVista} restantes)...
                  </button>
                </div>
              )}
            </>
          ))}

        {tipoHomebrew === "hechizo" &&
          (hechizosHomebrew.length === 0 ? (
            <div className={estilos.textoListaVacia}>No se encontraron hechizos.</div>
          ) : (
            <>
              {hechizosVisibles.map((h) => (
                <div key={h.id} className={estilos.itemListaBrutal}>
                  <div
                    className={estilos.itemInfoListaClickable}
                    onClick={() => setIdHechizoDetalleCreador(h.id)}
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
              {hechizosHomebrew.length > limiteVista && (
                <div className={estilos.contenedorMostrarMas}>
                  <button
                    onClick={() => setLimiteVista((prev) => prev + LIMITE_PASO)}
                    className={`${estilos.botonBuscadorLimpiarHomebrew} ${estilos.botonMostrarMas}`}
                    type="button"
                  >
                    Mostrar más hechizos ({hechizosHomebrew.length - limiteVista} restantes)...
                  </button>
                </div>
              )}
            </>
          ))}

        {tipoHomebrew === "objeto" &&
          (objetosHomebrewFiltrados.length === 0 ? (
            <div className={estilos.textoListaVacia}>No se encontraron objetos mágicos.</div>
          ) : (
            <>
              {objetosVisibles.map((o) => (
                <div key={o.id} className={estilos.itemListaBrutal}>
                  <div
                    className={estilos.itemInfoListaClickable}
                    onClick={() => {
                      setHistorialDetalle([]);
                      setIdObjetoDetalle(o.id);
                    }}
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
              {objetosHomebrewFiltrados.length > limiteVista && (
                <div className={estilos.contenedorMostrarMas}>
                  <button
                    onClick={() => setLimiteVista((prev) => prev + LIMITE_PASO)}
                    className={`${estilos.botonBuscadorLimpiarHomebrew} ${estilos.botonMostrarMas}`}
                    type="button"
                  >
                    Mostrar más objetos ({objetosHomebrewFiltrados.length - limiteVista} restantes)...
                  </button>
                </div>
              )}
            </>
          ))}
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
                  {formatearSubtituloCriatura(m.tipo, m.tamaño, m.alineacion)} | CA {m.ca} | HP {m.vidaMaxima} | CR {m.desafio || "—"}
                </span>
                <span className={estilos.nombreHechizoOverlay}>{m.nombre}</span>
              </div>
              <button
                onClick={() => setIdCriaturaDetalle(null)}
                className={estilos.botonCerrarDetalle}
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
                alHacerClicHechizo={(hechizo) => setIdHechizoDetalleCreador(hechizo.id)}
                lanzarAtaqueRapido={() => {}}
                lanzarTiradaD20Interactiva={() => {}}
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

      {/* Overlay Detalle Hechizo en Creador / Compendio */}
      {idHechizoDetalleCreador && (() => {
        const hechizo = baseDatosHechizos.find((h) => h.id === idHechizoDetalleCreador);
        if (!hechizo) return null;
        return (
          <div className={estilos.panelDetalleOverlay}>
            <FichaHechizo
              hechizo={hechizo}
              ocultarLanzamiento={true}
              onClose={() => setIdHechizoDetalleCreador(null)}
              onEditar={
                !soloLectura && iniciarEdicionHechizo
                  ? () => {
                      iniciarEdicionHechizo(hechizo);
                      setIdHechizoDetalleCreador(null);
                    }
                  : undefined
              }
            />
          </div>
        );
      })()}

      {/* Overlay Detalle Objeto en Creador */}
      {idObjetoDetalle && (() => {
        const oRaw = objetosHomebrew.find((o) => o.id === idObjetoDetalle);
        if (!oRaw) return null;
        const objeto = oRaw as ObjetoJuego;

        return (
          <div className={estilos.panelDetalleOverlay}>
            <div className={estilos.cabeceraDetalle}>
              <div className={`${estilos.cabeceraDetalleIzquierda} u-flex u-items-center u-gap-md`}>
                {historialDetalle.length > 0 && (
                  <button
                    onClick={navegarAtras}
                    className={estilos.botonNavegarAtras}
                    type="button"
                  >
                    ⬅ Atrás
                  </button>
                )}
                <div className="u-flex u-gap-xs">
                  <span className={estilos.objetoNivelOverlay}>
                    {DICCIONARIO_CATEGORIAS_EQUIPO[objeto.categoria]?.etiqueta || objeto.categoria} {objeto.subcategoria ? `| ${objeto.subcategoria}` : ""}
                  </span>
                  <span className={estilos.nombreHechizoOverlay}>{objeto.nombre}</span>
                </div>
              </div>
              <div className="u-flex u-items-center u-gap-sm">
                <button
                  onClick={() => {
                    const targetObj = oRaw;
                    setIdObjetoDetalle(null);
                    setHistorialDetalle([]);
                    funcionPlantilla(targetObj);
                  }}
                  className={estilos.botonPlantillaDetalle}
                  type="button"
                  title="Usar como plantilla para crear un nuevo objeto"
                >
                  <Copy size={13} />
                  Usar como plantilla
                </button>
                <button
                  onClick={() => {
                    setIdObjetoDetalle(null);
                    setHistorialDetalle([]);
                  }}
                  className={estilos.botonCerrarDetalle}
                  type="button"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className={estilos.cuerpoDetalle}>
              {/* Grid Metadatos */}
              <div className={estilos.gridMetadatos}>
                <div className={estilos.metaItem}>
                  <Sparkles size={12} className={estilos.iconoDetalle} />
                  <div>
                    <div className={estilos.metaLabel}>RAREZA</div>
                    <div
                      className={`${estilos.metaValor} ${estilos.metaValorRareza}`}
                      data-rareza={objeto.rareza || "Común"}
                    >
                      {objeto.rareza || "Común"}
                    </div>
                  </div>
                </div>
                {objeto.valorPO !== undefined && objeto.valorPO > 0 && (
                  <div className={estilos.metaItem}>
                    <Coins size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>VALOR / COSTE</div>
                      <div className={estilos.metaValor}>
                        {objeto.valorPO} PO
                      </div>
                    </div>
                  </div>
                )}
                {objeto.pesoLb !== undefined && (
                  <div className={estilos.metaItem}>
                    <Scale size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>PESO</div>
                      <div className={estilos.metaValor}>{objeto.pesoLb} lb</div>
                    </div>
                  </div>
                )}
                {objeto.tipoVeneno && (
                  <div className={estilos.metaItem}>
                    <Skull size={12} className={`${estilos.iconoDetalle} ${estilos.textoPurpuraVeneno}`} />
                    <div>
                      <div className={estilos.metaLabel}>EXPOSICIÓN</div>
                      <div className={`${estilos.metaValor} ${estilos.textoPurpuraVeneno}`}>
                        {objeto.tipoVeneno}
                      </div>
                    </div>
                  </div>
                )}
                {objeto.categoria === "armas" && (objeto as Arma).alcanceNormal && (
                  <div className={estilos.metaItem}>
                    <MapPin size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>ALCANCE</div>
                      <div className={estilos.metaValor}>
                        {(objeto as Arma).alcanceNormal}/{(objeto as Arma).alcanceLargo || (objeto as Arma).alcanceNormal} pies
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fila de propiedades visuales adicionales */}
              <div className={estilos.filaPropiedadesEspeciales}>
                {objeto.esMagico && (
                  <span className={`${estilos.chipConcentracion} ${estilos.chipConcentracionMagico}`}>
                     MÁGICO
                  </span>
                )}
                {(objeto.esVeneno || objeto.tipoVeneno) && (
                  <span className={`${estilos.chipConcentracion} ${estilos.chipConcentracionVeneno}`}>
                     VENENO {objeto.tipoVeneno ? `(${objeto.tipoVeneno.toUpperCase()})` : ""}
                  </span>
                )}
                {objeto.categoria === "armas" && (
                  <span className={estilos.chipRitual}>Arma {(objeto as Arma).tipoAtaque}</span>
                )}
                {(objeto.categoria === "armaduras" || objeto.categoria === "escudos") && (
                  <span className={estilos.chipRitual}>{(objeto as Armadura).bonoDestreza || "Escudo"}</span>
                )}
              </div>

              {/* MECÁNICAS DE COMBATE DE ARMA */}
              {objeto.categoria === "armas" && (() => {
                const arma = objeto as Arma;
                return (
                  <div className={estilos.cajaMecanicasCombateObjeto}>
                    <div className={estilos.tituloMecanicasObjeto}>
                      Propiedades de Combate del Arma
                    </div>
                    <div className={estilos.gridMecanicas}>
                      {arma.dadoDano && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>Daño base: </span>
                          <strong className={estilos.valorMecanicaDano}>
                            {arma.dadoDano} ({arma.tipoDano ? arma.tipoDano.charAt(0).toUpperCase() + arma.tipoDano.slice(1) : ""})
                          </strong>
                        </div>
                      )}
                      {arma.maestria && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>Maestría: </span>
                          <strong className={`${estilos.valorMecanicaCd} ${estilos.textoAdvertencia}`}>
                            {arma.maestria}
                          </strong>
                        </div>
                      )}
                      {arma.danoVersatil && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>A dos manos: </span>
                          <strong className={estilos.valorMecanicaDano}>{arma.danoVersatil}</strong>
                        </div>
                      )}
                      {arma.municionRequerida !== undefined && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>Usa Munición: </span>
                          <strong className={estilos.valorMecanicaCd}>{arma.municionRequerida ? "Sí" : "No"}</strong>
                        </div>
                      )}
                      {arma.ammunition && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>Munición: </span>
                          {(() => {
                            const idDestino = arma.ammunition.index;
                            const existeDestino = objetosHomebrew.some(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(arma.ammunition!.name));
                            if (existeDestino) {
                              return (
                                <strong
                                  onClick={() => {
                                    const found = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(arma.ammunition!.name));
                                    if (found) navegarAObjeto(found.id);
                                  }}
                                  className={estilos.enlaceObjetoCompendio}
                                >
                                  {arma.ammunition.name}
                                </strong>
                              );
                            }
                            return <strong className={estilos.valorMecanicaCd}>{arma.ammunition.name}</strong>;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* MECÁNICAS DE ARMADURA O ESCUDO */}
              {(objeto.categoria === "armaduras" || objeto.categoria === "escudos") && (() => {
                const armadura = objeto as Armadura | Escudo;
                return (
                  <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasArmadura}`}>
                    <div className={`${estilos.tituloMecanicasObjeto} ${estilos.tituloMecanicasArmadura}`}>
                      Protección y Sigilo
                    </div>
                    <div className={estilos.gridMecanicas}>
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>CA Base: </span>
                        <strong className={estilos.valorMecanicaDano}>
                          {objeto.categoria === "escudos" ? `+${armadura.caBase}` : armadura.caBase}
                        </strong>
                      </div>
                      {"requisitoFuerza" in armadura && armadura.requisitoFuerza && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>FUE Requerida: </span>
                          <strong className={estilos.valorMecanicaCd}>FUE {armadura.requisitoFuerza}</strong>
                        </div>
                      )}
                      {"desventajaSigilo" in armadura && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>Desv. Sigilo: </span>
                          <strong
                            className={`${armadura.desventajaSigilo ? estilos.valorMecanicaSuperior : estilos.valorMecanicaCd} ${estilos.valorDesventajaSigilo}`}
                            data-desventaja={armadura.desventajaSigilo ? "true" : "false"}
                          >
                            {armadura.desventajaSigilo ? "Sí" : "No"}
                          </strong>
                        </div>
                      )}
                      {"tiempoEquipar" in armadura && armadura.tiempoEquipar && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>Tiempo Equipar: </span>
                          <strong className={estilos.valorMecanicaCd}>{armadura.tiempoEquipar}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* MECÁNICAS Y EFECTOS DEL VENENO */}
              {(objeto.esVeneno || objeto.tipoVeneno || objeto.efectoVeneno) && (
                <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasVeneno}`}>
                  <div className={`${estilos.tituloMecanicasObjeto} ${estilos.tituloMecanicasVeneno}`}>
                    <span className="u-inline-flex u-items-center u-gap-xs">
                      <Skull size={14} />
                      <span>Propiedades y Mecánicas del Veneno</span>
                    </span>
                    <div className="u-flex u-items-center u-gap-xs">
                      {(() => {
                        const textoCompleto = `${objeto.descripcion || ""} ${objeto.efectoVeneno || ""}`;
                        const matchDado = textoCompleto.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
                        if (matchDado) {
                          const formulaDado = matchDado[1].replace(/\s+/g, "");
                          return (
                            <button
                              onClick={() => {
                                const label = sanitizarEtiqueta(`Dano Veneno (${formulaDado}) - ${objeto.nombre}`);
                                lanzarDadosTaleSpire(formulaDado, label);
                              }}
                              className={estilos.botonTirarDanoVeneno}
                              type="button"
                              title={`Lanzar daño de veneno (${formulaDado}) en TaleSpire`}
                            >
                              <Dices size={13} />
                              <span>Daño Veneno ({formulaDado})</span>
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  <div className={estilos.gridMecanicas}>
                    {objeto.tipoVeneno && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Tipo de Exposición: </span>
                        <strong className={`${estilos.valorMecanicaDano} ${estilos.textoPurpuraVeneno}`}>
                          {objeto.tipoVeneno}
                        </strong>
                      </div>
                    )}
                    {objeto.efectoVeneno && (
                      <div className={`${estilos.itemMecanica} ${estilos.itemMecanicaFullGrid}`}>
                        <span className={estilos.textoEtiquetaMecanica}>Efecto Adicional: </span>
                        <strong className={`${estilos.valorMecanicaCd} ${estilos.textoTextoPrincipal}`}>
                          {objeto.efectoVeneno}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PROPIEDADES MÁGICAS Y NARRATIVAS COMUNES */}
              {(objeto.cargas || objeto.sintonizacionRequerida || (objeto.modificadorAtaqueDano !== undefined && objeto.modificadorAtaqueDano !== null)) && (
                <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasMagicas}`}>
                  <div className={`${estilos.tituloMecanicasObjeto} ${estilos.tituloMecanicasMagicas}`}>
                    Propiedades Mágicas y Narrativas
                  </div>

                  <div className={estilos.gridMecanicas}>
                    {objeto.cargas && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Cargas Máximas: </span>
                        <strong className={estilos.valorMecanicaDano}>
                          {objeto.cargas}
                          {objeto.formulaRecarga && ` (${objeto.formulaRecarga})`}
                        </strong>
                      </div>
                    )}
                    {objeto.sintonizacionRequerida && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Sintonización: </span>
                        <strong className={`${estilos.valorMecanicaCd} ${estilos.textoCian}`}>
                          Requerida
                          {objeto.condicionSintonizacion && ` (${objeto.condicionSintonizacion})`}
                        </strong>
                      </div>
                    )}
                    {objeto.modificadorAtaqueDano !== undefined && objeto.modificadorAtaqueDano !== null && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Bono Mágico Directo: </span>
                        <strong className={estilos.valorMecanicaAtaque}>+{objeto.modificadorAtaqueDano}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MECÁNICAS DE MUNICIÓN O ALMACENAMIENTO */}
              {(() => {
                const cantidadItem = "cantidad" in objeto ? (objeto as { cantidad?: number }).cantidad : undefined;
                if (!objeto.storage && cantidadItem === undefined) return null;
                
                return (
                  <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasMunicion}`}>
                    <div className={`${estilos.tituloMecanicasObjeto} ${estilos.tituloMecanicasMunicion}`}>
                      Propiedades de Munición y Almacenamiento
                    </div>
                    <div className={estilos.gridMecanicas}>
                      {cantidadItem !== undefined && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>Cantidad: </span>
                          <strong className={estilos.valorMecanicaDano}>{cantidadItem}</strong>
                        </div>
                      )}
                    {objeto.storage && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Almacenamiento: </span>
                        {(() => {
                          const idDestino = objeto.storage.index;
                          const existeDestino = objetosHomebrew.some(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(objeto.storage!.name));
                          if (existeDestino) {
                            return (
                              <strong
                                onClick={() => {
                                  const found = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(objeto.storage!.name));
                                  if (found) navegarAObjeto(found.id);
                                }}
                                className={estilos.enlaceObjetoCompendio}
                              >
                                {objeto.storage.name}
                              </strong>
                            );
                          }
                          return <strong className={estilos.valorMecanicaCd}>{objeto.storage.name}</strong>;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

              {/* Propiedades del arma en badges */}
              {objeto.categoria === "armas" && (objeto as Arma).propiedades && (objeto as Arma).propiedades!.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>PROPIEDADES TÁCTICAS DEL ARMA</div>
                  <div className={estilos.listaBadgesClases}>
                    {(objeto as Arma).propiedades!.map((prop: string) => (
                      <span key={prop} className={estilos.badgeClaseObjeto}>
                        {prop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Efectos Pasivos Aplicados */}
              {objeto.efectosPasivos && objeto.efectosPasivos.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>EFECTOS PASIVOS Y BONOS AUTOMÁTICOS</div>
                  <div className={`${estilos.listaBonosMagicos} u-flex u-flex-col u-gap-xs`}>
                    {objeto.efectosPasivos.map((efecto, idx: number) => (
                      <div key={idx} className={`${estilos.cajaBonoMagico} ${estilos.cajaBonoMagicoVertical}`}>
                        <div className="u-flex u-justify-between u-w-full">
                          <span className={`${estilos.textoEtiquetaMecanica} ${estilos.textoCian}`}>
                            [{efecto.tipo || "efecto"}] <strong>{efecto.bono}</strong>
                          </span>
                          {efecto.valor !== undefined && efecto.valor !== "" && (
                            <strong className={estilos.valorMecanicaAtaque}>
                              {isNaN(Number(efecto.valor)) ? efecto.valor : (Number(efecto.valor) >= 0 ? `+${efecto.valor}` : efecto.valor)}
                            </strong>
                          )}
                        </div>
                        {efecto.descripcion && (
                          <span className={estilos.textoDescBono}>
                            {efecto.descripcion}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hechizos Vinculados */}
              {objeto.hechizosVinculados && objeto.hechizosVinculados.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>HECHIZOS VINCULADOS AL OBJETO</div>
                  <div className={`${estilos.listaBonosMagicos} u-flex u-flex-col u-gap-xs`}>
                    {objeto.hechizosVinculados.map((hechizo: { nombre: string; cd?: number; bonoAtaque?: number; costeCargas?: number }, idx: number) => (
                      <div key={idx} className={`${estilos.cajaBonoMagico} ${estilos.cajaHechizoVinculado}`}>
                        <div>
                          <strong className={estilos.nombreHechizoVinculado}>{hechizo.nombre}</strong>
                          <div className={estilos.subDetallesHechizoVinculado}>
                            {hechizo.cd !== undefined && <span>CD {hechizo.cd}</span>}
                            {hechizo.bonoAtaque !== undefined && <span>Ataque: +{hechizo.bonoAtaque}</span>}
                          </div>
                        </div>
                        {hechizo.costeCargas !== undefined && (
                          <span className={estilos.badgeCosteCargas}>
                            Coste: {hechizo.costeCargas} carga{hechizo.costeCargas > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Receta de Artesanía */}
              {objeto.artesania && (objeto.artesania.tallerRequerido || (objeto.artesania.componentes && objeto.artesania.componentes.length > 0)) && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>RECETA DE ARTESANÍA Y CRAFTEO</div>
                  <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasArtesania}`}>
                    {objeto.artesania.tallerRequerido && (
                      <div className="u-mb-xs">
                        <span className={estilos.textoEtiquetaMecanica}>Taller de Trabajo: </span>
                        <strong className={estilos.textoTallerPrincipal}>{objeto.artesania.tallerRequerido}</strong>
                      </div>
                    )}
                    {objeto.artesania.componentes && objeto.artesania.componentes.length > 0 && (
                      <div>
                        <span className={`${estilos.textoEtiquetaMecanica} ${estilos.labelComponentesBlock}`}>Materiales y Componentes:</span>
                        <div className="u-flex u-flex-wrap u-gap-xs">
                          {objeto.artesania.componentes.map((comp: string, idx: number) => (
                            <span key={idx} className={estilos.chipComponenteArtesania}>
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contenido del Paquete */}
              {objeto.contents && objeto.contents.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>CONTENIDO DEL PAQUETE</div>
                  <div className="u-flex u-flex-col u-gap-xs">
                    {objeto.contents.map((c: { item: { index: string; name: string }; quantity: number }, idx: number) => {
                      const idDestino = c.item.index;
                      const existeDestino = objetosHomebrew.some(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.item.name));
                      
                      return (
                        <div key={idx} className={estilos.filaContenidoPaquete}>
                          <span className={estilos.textoItemPaquete}>
                            {c.quantity}x {c.item.name}
                          </span>
                          {existeDestino ? (
                            <button
                              type="button"
                              onClick={() => {
                                const found = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.item.name));
                                if (found) navegarAObjeto(found.id);
                              }}
                              className={estilos.botonVerObjetoContenido}
                            >
                              Ver Objeto 
                            </button>
                          ) : (
                            <span className={estilos.textoNoDisponible}>
                              No disponible
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Objetos Elaborables (Craft) */}
              {objeto.craft && objeto.craft.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>OBJETOS QUE PUEDE ELABORAR</div>
                  <div className="u-flex u-flex-wrap u-gap-xs">
                    {objeto.craft.map((c: { index: string; name: string }, idx: number) => {
                      const idDestino = c.index;
                      const existeDestino = objetosHomebrew.some(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.name));
                      
                      if (existeDestino) {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const found = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.name));
                              if (found) navegarAObjeto(found.id);
                            }}
                            className={estilos.botonCraftDisponible}
                          >
                             {c.name}
                          </button>
                        );
                      }
                      
                      return (
                        <span
                          key={idx}
                          className={estilos.chipCraftNoDisponible}
                        >
                          {c.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Descripción Completa */}
              <div className={estilos.seccionDescripcionFicha}>
                <div className={estilos.descripcionTituloFicha}>
                  DESCRIPCIÓN DEL OBJETO MÁGICO
                </div>
                <div className={estilos.descripcionCuerpoFicha}>
                  <TextoEnriquecidoDND texto={objeto.descripcion} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Modal de confirmación personalizado de alta calidad */}
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
