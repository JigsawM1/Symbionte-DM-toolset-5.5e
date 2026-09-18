import React from "react";
import { CategoriaEquipo } from "@/constantes/categoriasEquipoConstantes";
import { ObjetoHomebrew } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { Backpack, X, FlaskConical, Hammer } from "lucide-react";

const OPCIONES_TIPO_VENENO = [
  { valor: "Contacto", etiqueta: "Contacto (Contact)" },
  { valor: "Ingerido", etiqueta: "Ingerido (Ingested)" },
  { valor: "Inhalado", etiqueta: "Inhalado (Inhaled)" },
  { valor: "Lesión", etiqueta: "Lesión (Injury)" }
];

interface Props {
  oCantidad: number | "";
  setOCantidad: (cant: number | "") => void;
  oCategoria: CategoriaEquipo;
  oEsConsumible: boolean;
  oSubcategoria: string;
  oEsVeneno: boolean;
  setOEsVeneno: (es: boolean) => void;
  oTipoVeneno: "Contacto" | "Ingerido" | "Inhalado" | "Lesión";
  setOTipoVeneno: (tipo: "Contacto" | "Ingerido" | "Inhalado" | "Lesión") => void;
  oEfectoVeneno: string;
  setOEfectoVeneno: (efecto: string) => void;
  oStorageIndex: string;
  setOStorageIndex: (idx: string) => void;
  setOStorageName: (nombre: string) => void;
  // Contenido de paquete
  busquedaContenidoQuery: string;
  setBusquedaContenidoQuery: (q: string) => void;
  resultadosContenido: ObjetoHomebrew[];
  nuevoContenidoIndex: string;
  setNuevoContenidoIndex: (idx: string) => void;
  nuevoContenidoName: string;
  setNuevoContenidoName: (nombre: string) => void;
  nuevoContenidoQty: number;
  setNuevoContenidoQty: (qty: number) => void;
  oContents: Array<{ item: { index: string; name: string }; quantity: number }>;
  setOContents: React.Dispatch<React.SetStateAction<Array<{ item: { index: string; name: string }; quantity: number }>>>;
  // Recetas de crafteo para herramientas
  busquedaCraftQuery: string;
  setBusquedaCraftQuery: (q: string) => void;
  resultadosCraft: ObjetoHomebrew[];
  nuevoCraftIndex: string;
  setNuevoCraftIndex: (idx: string) => void;
  nuevoCraftName: string;
  setNuevoCraftName: (nombre: string) => void;
  oCraft: Array<{ index: string; name: string }>;
  setOCraft: React.Dispatch<React.SetStateAction<Array<{ index: string; name: string }>>>;
  estilos: Record<string, string>;
}

export const SeccionEquipoContenedor: React.FC<Props> = ({
  oCantidad,
  setOCantidad,
  oCategoria,
  oEsConsumible,
  oSubcategoria,
  oEsVeneno,
  setOEsVeneno,
  oTipoVeneno,
  setOTipoVeneno,
  oEfectoVeneno,
  setOEfectoVeneno,
  oStorageIndex,
  setOStorageIndex,
  setOStorageName,
  busquedaContenidoQuery,
  setBusquedaContenidoQuery,
  resultadosContenido,
  nuevoContenidoIndex,
  setNuevoContenidoIndex,
  nuevoContenidoName,
  setNuevoContenidoName,
  nuevoContenidoQty,
  setNuevoContenidoQty,
  oContents,
  setOContents,
  busquedaCraftQuery,
  setBusquedaCraftQuery,
  resultadosCraft,
  nuevoCraftIndex,
  setNuevoCraftIndex,
  nuevoCraftName,
  setNuevoCraftName,
  oCraft,
  setOCraft,
  estilos,
}) => {
  return (
    <div className={`${estilos.bloqueDinamicoForm} ${estilos.bloqueDinamicoContenedor}`}>
      <div className={estilos.tituloBloqueDinamico}>
        <span>PROPIEDADES DE UTILERÍA Y EQUIPO</span>
        <span className={estilos.subtituloInformacion}>
          <Backpack size={12} className={estilos.iconoEnTexto} /> Inventario
        </span>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Cantidad Inicial:</label>
          <input
            type="number"
            value={oCantidad}
            onChange={(e) => setOCantidad(e.target.value === "" ? "" : parseInt(e.target.value))}
            placeholder="1"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm} />
      </div>

      {/* Módulo de Veneno Condicional */}
      {(oCategoria === "consumibles" || oEsConsumible || oSubcategoria.toLowerCase().includes("veneno") || oSubcategoria.toLowerCase().includes("consumible")) && (
        <div className={estilos.separadorContenedorForm}>
          <label className={`${estilos.labelCheckbox} u-mb-xs`}>
            <input
              type="checkbox"
              checked={oEsVeneno}
              onChange={(e) => setOEsVeneno(e.target.checked)}
              className={estilos.checkMini}
            />
            <span className={estilos.textoVerdeVeneno}>
              <FlaskConical size={14} />
              <span>¿Es un Veneno (Poison)?</span>
            </span>
          </label>

          {oEsVeneno && (
            <div className={estilos.bloqueVenenoHomebrew}>
              <div className={estilos.campoForm}>
                <label className={estilos.labelForm}>Tipo de Veneno:</label>
                <SelectorDesplegable
                  valor={oTipoVeneno}
                  alCambiar={(val) => setOTipoVeneno(val as "Contacto" | "Ingerido" | "Inhalado" | "Lesión")}
                  opciones={OPCIONES_TIPO_VENENO}
                />
              </div>
              <div className={estilos.campoForm}>
                <label className={estilos.labelForm}>Efecto del Veneno:</label>
                <textarea
                  value={oEfectoVeneno}
                  onChange={(e) => setOEfectoVeneno(e.target.value)}
                  placeholder="Describe el daño de veneno y condiciones mecánicas..."
                  className={estilos.textareaBrutal}
                  rows={3}
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Módulo de Almacenamiento para Municiones */}
      {(oCategoria === "municion" || oSubcategoria.toLowerCase().includes("munición") || oSubcategoria.toLowerCase().includes("municion")) && (
        <div className={estilos.separadorContenedorForm}>
          <div className={`${estilos.tituloBloqueDinamico} ${estilos.tituloBloqueDinamicoMini}`}>
            <span>ALMACENAMIENTO RECOMENDADO</span>
          </div>
          <div className={estilos.campoForm}>
            <label className={`${estilos.labelForm} u-mb-xs`}>¿Dónde se almacena esta munición?:</label>
            <div className="u-flex u-gap-xs u-flex-wrap">
              {[
                { id: "quiver", label: "Carcaj" },
                { id: "case-crossbow-bolt", label: "Caja de Virotes" },
                { id: "pouch", label: "Bolsita" }
              ].map((item) => {
                const estaSeleccionado = oStorageIndex === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (estaSeleccionado) {
                        setOStorageIndex("");
                        setOStorageName("");
                      } else {
                        setOStorageIndex(item.id);
                        setOStorageName(item.label);
                      }
                    }}
                    className={`${estilos.botonAlternadorNaranja} ${estaSeleccionado ? estilos.botonAlternadorNaranjaActivo : ""}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Módulo de Contenidos para Paquetes */}
      {(oCategoria === "paquetes-equipo" || oCategoria === "contenedores" || oSubcategoria.toLowerCase().includes("paquete") || oSubcategoria.toLowerCase().includes("contenedor") || oSubcategoria.toLowerCase().includes("mochila")) && (
        <div className={estilos.separadorContenedorForm}>
          <div className={`${estilos.tituloBloqueDinamico} ${estilos.tituloBloqueDinamicoMini}`}>
            <span>CONTENIDO DEL PAQUETE / CONTENEDOR</span>
          </div>
          
          <div className={estilos.filaBuscadorContenido}>
            <div className={estilos.contenedorBuscadorRelativo}>
              <input
                type="text"
                placeholder="Buscar objeto en el compendio..."
                value={busquedaContenidoQuery}
                onChange={(e) => setBusquedaContenidoQuery(e.target.value)}
                className={`${estilos.inputForm} ${estilos.inputBuscadorCompendio}`}
              />
              {resultadosContenido.length > 0 && (
                <div className={estilos.menuDesplegableSugerencias}>
                  {resultadosContenido.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setNuevoContenidoIndex(o.id);
                        setNuevoContenidoName(o.nombre);
                        setBusquedaContenidoQuery(o.nombre);
                      }}
                      className={`${estilos.itemSugerenciaCompendio} ${nuevoContenidoIndex === o.id ? estilos.itemSugerenciaCompendioActivo : ""}`}
                    >
                      {o.nombre} <span className={estilos.subtextoIdGris}>({o.id})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              min="1"
              placeholder="Cant"
              value={nuevoContenidoQty}
              onChange={(e) => setNuevoContenidoQty(parseInt(e.target.value) || 1)}
              className={`${estilos.inputForm} ${estilos.ancho65} ${estilos.textoMini}`}
            />
            <button
              type="button"
              className={`${estilos.botonAgregarDinamico} ${estilos.botonAgregarChipCompacto}`}
              onClick={() => {
                if (nuevoContenidoIndex.trim() && nuevoContenidoName.trim()) {
                  setOContents((prev) => [
                    ...prev,
                    {
                      item: { index: nuevoContenidoIndex.trim(), name: nuevoContenidoName.trim() },
                      quantity: nuevoContenidoQty
                    }
                  ]);
                  setNuevoContenidoIndex("");
                  setNuevoContenidoName("");
                  setNuevoContenidoQty(1);
                  setBusquedaContenidoQuery("");
                }
              }}
            >
              + Añadir
            </button>
          </div>

          {oContents.length > 0 && (
            <div className={estilos.listaItemsContenido}>
              {oContents.map((c, idx) => (
                <div key={idx} className={estilos.filaItemContenido}>
                  <span>{c.quantity}x {c.item.name} <span className={estilos.subtextoIdGris}>({c.item.index})</span></span>
                  <X
                    size={12}
                    className={estilos.iconoEliminarPeligro}
                    onClick={() => setOContents((prev) => prev.filter((_, i) => i !== idx))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Módulo de Elaboración (Craft) para Herramientas */}
      {(oCategoria === "herramientas" || oSubcategoria.toLowerCase().includes("herramienta")) && (
        <div className={estilos.separadorContenedorForm}>
          <div className={`${estilos.tituloBloqueDinamico} ${estilos.tituloBloqueDinamicoMini}`}>
            <span>OBJETOS QUE PUEDE ELABORAR (RECETAS)</span>
          </div>
          
          <div className={estilos.filaBuscadorContenido}>
            <div className={estilos.contenedorBuscadorRelativo}>
              <input
                type="text"
                placeholder="Buscar receta elaborable..."
                value={busquedaCraftQuery}
                onChange={(e) => setBusquedaCraftQuery(e.target.value)}
                className={`${estilos.inputForm} ${estilos.inputBuscadorCompendio}`}
              />
              {resultadosCraft.length > 0 && (
                <div className={estilos.menuDesplegableSugerencias}>
                  {resultadosCraft.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setNuevoCraftIndex(o.id);
                        setNuevoCraftName(o.nombre);
                        setBusquedaCraftQuery(o.nombre);
                      }}
                      className={`${estilos.itemSugerenciaCompendio} ${nuevoCraftIndex === o.id ? estilos.itemSugerenciaCompendioActivo : ""}`}
                    >
                      {o.nombre} <span className={estilos.subtextoIdGris}>({o.id})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className={`${estilos.botonAgregarDinamico} ${estilos.botonAgregarChipCompacto}`}
              onClick={() => {
                if (nuevoCraftIndex.trim() && nuevoCraftName.trim()) {
                  setOCraft((prev) => [
                    ...prev,
                    {
                      index: nuevoCraftIndex.trim(),
                      name: nuevoCraftName.trim()
                    }
                  ]);
                  setNuevoCraftIndex("");
                  setNuevoCraftName("");
                  setBusquedaCraftQuery("");
                }
              }}
            >
              + Añadir
            </button>
          </div>

          {oCraft.length > 0 && (
            <div className={estilos.contenedorChipsCustom}>
              {oCraft.map((c, idx) => (
                <span key={idx} className={estilos.chipPurpuraRemovible}>
                  <Hammer size={12} />
                  <span>{c.name}</span>
                  <X
                    size={12}
                    className={estilos.iconoRemoverChip}
                    onClick={() => setOCraft((prev) => prev.filter((_, i) => i !== idx))}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
