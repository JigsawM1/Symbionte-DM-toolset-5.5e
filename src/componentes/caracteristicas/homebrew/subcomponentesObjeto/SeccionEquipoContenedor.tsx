import React from "react";
import { SubcategoriaEquipo } from "@/almacen/usarAlmacenDM";
import { ObjetoHomebrew } from "@/tipos";
import { Backpack, X } from "lucide-react";

interface Props {
  oCantidad: number | "";
  setOCantidad: (cant: number | "") => void;
  oSubcategoriaEquipo: SubcategoriaEquipo;
  oEsVeneno: boolean;
  setOEsVeneno: (es: boolean) => void;
  oTipoVeneno: "Contacto" | "Ingerido" | "Inhalado" | "Lesión";
  setOTipoVeneno: (tipo: "Contacto" | "Ingerido" | "Inhalado" | "Lesión") => void;
  oCdSalvacionVeneno: number | "";
  setOCdSalvacionVeneno: (cd: number | "") => void;
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
  oSubcategoriaEquipo,
  oEsVeneno,
  setOEsVeneno,
  oTipoVeneno,
  setOTipoVeneno,
  oCdSalvacionVeneno,
  setOCdSalvacionVeneno,
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
    <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(255, 99, 71, 0.25)" }}>
      <div className={estilos.tituloBloqueDinamico}>
        <span>PROPIEDADES DE UTILERÍA Y EQUIPO</span>
        <span className={estilos.subtituloInformacion}>
          <Backpack size={12} style={{ display: "inline", marginRight: "2px" }} /> Inventario
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
      {oSubcategoriaEquipo === "Consumible" && (
        <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 99, 71, 0.2)", paddingTop: "12px" }}>
          <label className={estilos.labelCheckbox} style={{ marginBottom: "8px" }}>
            <input
              type="checkbox"
              checked={oEsVeneno}
              onChange={(e) => setOEsVeneno(e.target.checked)}
              className={estilos.checkMini}
            />
            <span style={{ color: "hsl(120, 100%, 40%)", fontWeight: "bold", textShadow: "0 0 5px rgba(0,255,0,0.15)" }}>
              🧪 ¿Es un Veneno (Poison)?
            </span>
          </label>

          {oEsVeneno && (
            <div 
              style={{ 
                border: "1px solid hsl(120, 80%, 40%)", 
                boxShadow: "inset 0 0 10px rgba(0, 255, 0, 0.05), 0 0 10px rgba(0, 255, 0, 0.1)",
                borderRadius: "6px",
                padding: "12px",
                marginTop: "8px",
                backgroundColor: "rgba(0, 40, 0, 0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <div className={estilos.filaDobleForm}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Tipo de Veneno:</label>
                  <select
                    value={oTipoVeneno}
                    onChange={(e) => setOTipoVeneno(e.target.value as "Contacto" | "Ingerido" | "Inhalado" | "Lesión")}
                    className={estilos.selectForm}
                  >
                    <option value="Contacto">Contacto (Contact)</option>
                    <option value="Ingerido">Ingerido (Ingested)</option>
                    <option value="Inhalado">Inhalado (Inhaled)</option>
                    <option value="Lesión">Lesión (Injury)</option>
                  </select>
                </div>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>CD Salvación (Cons.):</label>
                  <input
                    type="number"
                    min="0"
                    value={oCdSalvacionVeneno}
                    onChange={(e) => setOCdSalvacionVeneno(e.target.value === "" ? "" : parseInt(e.target.value) || "")}
                    placeholder="Ej. 13"
                    className={estilos.inputForm}
                  />
                </div>
              </div>
              <div className={estilos.campoForm}>
                <label className={estilos.labelForm}>Efecto Táctico del Veneno:</label>
                <textarea
                  value={oEfectoVeneno}
                  onChange={(e) => setOEfectoVeneno(e.target.value)}
                  placeholder="Describe el daño de veneno y condiciones mecánicas..."
                  className={estilos.textareaBrutal}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Módulo de Almacenamiento para Municiones */}
      {oSubcategoriaEquipo === "Munición" && (
        <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 99, 71, 0.2)", paddingTop: "12px" }}>
          <div className={estilos.tituloBloqueDinamico} style={{ fontSize: "12px", marginBottom: "8px" }}>
            <span>ALMACENAMIENTO RECOMENDADO</span>
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm} style={{ marginBottom: "6px" }}>¿Dónde se almacena esta munición?:</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                    className={estilos.botonAlternadorProp}
                    style={{
                      flex: 1,
                      minWidth: "100px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      textAlign: "center",
                      border: estaSeleccionado ? "1.5px solid var(--color-borde-naranja)" : "1px solid var(--color-borde-brutal)",
                      background: estaSeleccionado ? "rgba(255, 165, 0, 0.15)" : "transparent",
                      color: estaSeleccionado ? "var(--color-texto-principal)" : "var(--color-texto-secundario)",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
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
      {oSubcategoriaEquipo === "Paquete" && (
        <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 99, 71, 0.2)", paddingTop: "12px" }}>
          <div className={estilos.tituloBloqueDinamico} style={{ fontSize: "12px", marginBottom: "8px" }}>
            <span>CONTENIDO DEL PAQUETE / CONTENEDOR</span>
          </div>
          
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px", alignItems: "center", position: "relative" }}>
            <div style={{ flex: 3, position: "relative" }}>
              <input
                type="text"
                placeholder="🔍 Buscar objeto en el compendio..."
                value={busquedaContenidoQuery}
                onChange={(e) => setBusquedaContenidoQuery(e.target.value)}
                className={estilos.inputForm}
                style={{ fontSize: "11px", width: "100%" }}
              />
              {resultadosContenido.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "var(--color-fondo-panel)",
                  border: "1.5px solid var(--color-borde-brutal)",
                  borderRadius: "4px",
                  zIndex: 50,
                  maxHeight: "180px",
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  marginTop: "2px"
                }}>
                  {resultadosContenido.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setNuevoContenidoIndex(o.id);
                        setNuevoContenidoName(o.nombre);
                        setBusquedaContenidoQuery(o.nombre);
                      }}
                      style={{
                        padding: "6px 10px",
                        fontSize: "11px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        color: nuevoContenidoIndex === o.id ? "var(--color-activo)" : "var(--color-texto-principal)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      {o.nombre} <span style={{ color: "var(--color-texto-secundario)", fontSize: "9px" }}>({o.id})</span>
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
              className={estilos.inputForm}
              style={{ width: "65px", fontSize: "11px" }}
            />
            <button
              type="button"
              className={estilos.botonAgregarDinamico}
              style={{ fontSize: "11px", padding: "4px 10px" }}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "5px" }}>
              {oContents.map((c, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "2px" }}>
                  <span>{c.quantity}x {c.item.name} <span style={{ color: "var(--color-texto-secundario)", fontSize: "9px" }}>({c.item.index})</span></span>
                  <X
                    size={12}
                    style={{ cursor: "pointer", color: "var(--color-peligro)" }}
                    onClick={() => setOContents((prev) => prev.filter((_, i) => i !== idx))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Módulo de Elaboración (Craft) para Herramientas */}
      {oSubcategoriaEquipo === "Herramienta" && (
        <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 99, 71, 0.2)", paddingTop: "12px" }}>
          <div className={estilos.tituloBloqueDinamico} style={{ fontSize: "12px", marginBottom: "8px" }}>
            <span>OBJETOS QUE PUEDE ELABORAR (RECETAS)</span>
          </div>
          
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px", alignItems: "center", position: "relative" }}>
            <div style={{ flex: 3, position: "relative" }}>
              <input
                type="text"
                placeholder="🔍 Buscar receta elaborable..."
                value={busquedaCraftQuery}
                onChange={(e) => setBusquedaCraftQuery(e.target.value)}
                className={estilos.inputForm}
                style={{ fontSize: "11px", width: "100%" }}
              />
              {resultadosCraft.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "var(--color-fondo-panel)",
                  border: "1.5px solid var(--color-borde-brutal)",
                  borderRadius: "4px",
                  zIndex: 50,
                  maxHeight: "180px",
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  marginTop: "2px"
                }}>
                  {resultadosCraft.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setNuevoCraftIndex(o.id);
                        setNuevoCraftName(o.nombre);
                        setBusquedaCraftQuery(o.nombre);
                      }}
                      style={{
                        padding: "6px 10px",
                        fontSize: "11px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        color: nuevoCraftIndex === o.id ? "var(--color-activo)" : "var(--color-texto-principal)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      {o.nombre} <span style={{ color: "var(--color-texto-secundario)", fontSize: "9px" }}>({o.id})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className={estilos.botonAgregarDinamico}
              style={{ fontSize: "11px", padding: "4px 10px" }}
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {oCraft.map((c, idx) => (
                <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(168, 85, 247, 0.15)", border: "1px solid hsl(270, 70%, 60%)", color: "hsl(270, 100%, 85%)", padding: "3px 8px", borderRadius: "4px", fontSize: "11px" }}>
                  🔨 {c.name}
                  <X
                    size={12}
                    style={{ cursor: "pointer", color: "var(--color-borde-cian)" }}
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
