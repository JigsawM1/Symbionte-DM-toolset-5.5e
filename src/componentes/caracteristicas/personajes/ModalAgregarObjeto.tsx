import React, { useState, useMemo, useEffect } from "react";
import type { ObjetoJuego, ObjetoInventario, Arma } from "@/tipos";
import { FileText, X, Plus, Sparkles, Package } from "lucide-react";
import { SelectorSugerencias, OpcionSugerencia } from "@/componentes/comunes/SelectorSugerencias";
import {
  crearObjetoInventarioDesdeCompendio,
  crearObjetoInventarioCustom
} from "@/servicios/calculadorInventario";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import estilos from "./HojaPersonaje.module.css";

export type TabModalAgregar = "compendio" | "otrasPosesiones";

interface ModalAgregarObjetoProps {
  tabInicial?: TabModalAgregar;
  baseDatosObjetos: ObjetoJuego[];
  alAgregarObjeto: (objeto: ObjetoInventario | ObjetoInventario[]) => void;
  alCerrar: () => void;
}

type FiltroTipo = "todos" | "Arma" | "Armadura" | "Equipo de Aventuras";

export const ModalAgregarObjeto: React.FC<ModalAgregarObjetoProps> = ({
  tabInicial = "compendio",
  baseDatosObjetos,
  alAgregarObjeto,
  alCerrar
}) => {
  const [tabActiva, setTabActiva] = useState<TabModalAgregar>(tabInicial);

  useEffect(() => {
    setTabActiva(tabInicial);
  }, [tabInicial]);

  // --- Estado para Modo Compendio ---
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [objetoSeleccionadoId, setObjetoSeleccionadoId] = useState<string | null>(null);
  const [cantidadCompendio, setCantidadCompendio] = useState(1);

  // Objetos filtrados por categoría y desduplicados
  const objetosFiltrados = useMemo(() => {
    const listaBase = desduplicarEntidades(baseDatosObjetos);
    if (filtroTipo === "todos") return listaBase;
    return listaBase.filter((o) => o.tipoPrincipal === filtroTipo);
  }, [baseDatosObjetos, filtroTipo]);

  // Opciones estructuradas y organizadas por subcategoría con ordenamiento específico
  const opcionesSugerencias = useMemo<OpcionSugerencia[]>(() => {
    // 1. Clonar y ordenar la lista de objetos
    const listaOrdenada = [...objetosFiltrados].sort((a, b) => {
      // Si ambos son armaduras, ordenar por CA ascendente; si empatan, alfabético
      if (a.tipoPrincipal === "Armadura" && b.tipoPrincipal === "Armadura") {
        const caA = a.caBase || 0;
        const caB = b.caBase || 0;
        if (caA !== caB) return caA - caB;
        return a.nombre.localeCompare(b.nombre, "es");
      }

      // Para todos los demás objetos (armas, equipo, etc.), orden estrictamente alfabético
      return a.nombre.localeCompare(b.nombre, "es");
    });

    // 2. Definir orden de presentación de los grupos
    const PRIORIDAD_GRUPOS: Record<string, number> = {
      // Armas
      "Armas Sencillas (Cuerpo a Cuerpo)": 10,
      "Armas Sencillas (A Distancia)": 11,
      "Armas Marciales (Cuerpo a Cuerpo)": 12,
      "Armas Marciales (A Distancia)": 13,
      "Armas de Fuego": 14,
      // Armaduras
      "Armaduras Ligeras": 20,
      "Armaduras Medianas": 21,
      "Armaduras Pesadas": 22,
      "Escudos": 23,
      // Equipo
      "Consumibles y Pociones": 30,
      "Equipo de Aventuras": 31,
      "Herramientas": 32,
      "Instrumentos Musicales": 33,
      "Municiones": 34,
      "Objetos Maravillosos": 35,
      "Paquetes de Equipo": 36
    };

    // 3. Mapear a OpcionSugerencia
    const itemsConPrioridad = listaOrdenada.map((obj) => {
      let grupo = "Equipo de Aventuras";

      if (obj.tipoPrincipal === "Arma") {
        const sub = obj.subcategoria || "Sencilla";
        const tipoAtk = (obj as Arma).tipoAtaque ? ` (${(obj as Arma).tipoAtaque})` : "";
        if (sub === "Sencilla") grupo = `Armas Sencillas${tipoAtk}`;
        else if (sub === "Marcial") grupo = `Armas Marciales${tipoAtk}`;
        else if (sub === "De Fuego") grupo = "Armas de Fuego";
        else grupo = `Armas ${sub}`;
      } else if (obj.tipoPrincipal === "Armadura") {
        if (obj.subcategoria === "Escudo") {
          grupo = "Escudos";
        } else if (obj.subcategoria === "Ligera") {
          grupo = "Armaduras Ligeras";
        } else if (obj.subcategoria === "Mediana") {
          grupo = "Armaduras Medianas";
        } else if (obj.subcategoria === "Pesada") {
          grupo = "Armaduras Pesadas";
        } else {
          grupo = `Armaduras ${obj.subcategoria || ""}`;
        }
      } else {
        const sub = obj.subcategoria || "Equipo";
        if (sub === "Consumible") grupo = "Consumibles y Pociones";
        else if (sub === "Munición") grupo = "Municiones";
        else if (sub === "Herramienta") grupo = "Herramientas";
        else if (sub === "Instrumento") grupo = "Instrumentos Musicales";
        else if (sub === "Paquete") grupo = "Paquetes de Equipo";
        else if (sub === "Maravilloso") grupo = "Objetos Maravillosos";
        else grupo = "Equipo de Aventuras";
      }

      let subtitulo = "";
      if (obj.tipoPrincipal === "Arma") {
        const arma = obj as Arma;
        const dano = arma.dadoDano ? `${arma.dadoDano} ${arma.tipoDano || ""}` : "";
        subtitulo = [dano, `${arma.pesoLb || 0} lb`, `${arma.valorPO || 0} PO`].filter(Boolean).join(" • ");
      } else if (obj.tipoPrincipal === "Armadura") {
        subtitulo = `CA ${obj.caBase || 0} • ${obj.pesoLb || 0} lb • ${obj.valorPO || 0} PO`;
      } else {
        subtitulo = `${obj.pesoLb || 0} lb • ${obj.valorPO || 0} PO`;
      }

      return {
        valor: obj.nombre,
        etiqueta: obj.nombre,
        grupo,
        subtitulo,
        pesoGrupo: PRIORIDAD_GRUPOS[grupo] ?? 99
      };
    });

    // 4. Ordenar items por grupo respetando el orden interno ya calculado
    return itemsConPrioridad.sort((a, b) => {
      if (a.pesoGrupo !== b.pesoGrupo) {
        return a.pesoGrupo - b.pesoGrupo;
      }
      return 0;
    });
  }, [objetosFiltrados]);

  // Objeto seleccionado actualmente para preview
  const objetoSeleccionado = useMemo(() => {
    if (!objetoSeleccionadoId) {
      // Si hay texto en la búsqueda, intentar coincidir por nombre
      if (textoBusqueda) {
        return (
          objetosFiltrados.find(
            (o) => o.nombre.toLowerCase() === textoBusqueda.trim().toLowerCase()
          ) || null
        );
      }
      return null;
    }
    return baseDatosObjetos.find((o) => o.id === objetoSeleccionadoId) || null;
  }, [objetoSeleccionadoId, textoBusqueda, baseDatosObjetos, objetosFiltrados]);

  // Manejar selección en SelectorSugerencias
  const manejarCambioTextoBusqueda = (nuevoTexto: string) => {
    setTextoBusqueda(nuevoTexto);
    const encontrado = objetosFiltrados.find(
      (o) => o.nombre.toLowerCase() === nuevoTexto.trim().toLowerCase()
    );
    if (encontrado) {
      setObjetoSeleccionadoId(encontrado.id);
    }
  };

  const manejarAgregarDesdeCompendio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objetoSeleccionado) return;

    const nuevoObj = crearObjetoInventarioDesdeCompendio(
      objetoSeleccionado,
      cantidadCompendio
    );
    alAgregarObjeto(nuevoObj);
    alCerrar();
  };

  // --- Estado para Modo Otras Posesiones ---
  const [nombrePosesion, setNombrePosesion] = useState("");
  const [pesoPosesion, setPesoPosesion] = useState("0");
  const [cantidadPosesion, setCantidadPosesion] = useState(1);
  const [notasPosesion, setNotasPosesion] = useState("");

  const manejarCrearOtrasPosesiones = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombrePosesion.trim()) return;

    const nuevoObj = crearObjetoInventarioCustom({
      nombre: nombrePosesion.trim(),
      pesoLb: parseFloat(pesoPosesion) || 0,
      cantidad: Math.max(1, cantidadPosesion || 1),
      tipoPrincipal: "Equipo de Aventuras",
      rareza: "Común",
      equipable: false,
      sintonizacionRequerida: false,
      esMagico: false,
      notas: notasPosesion.trim()
    });

    alAgregarObjeto(nuevoObj);
    alCerrar();
  };

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div
        className={estilos.cuerpoModal}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, overflow: "visible" }}
      >
        {/* Cabecera del Modal */}
        <div className={estilos.cabeceraModal} style={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          <span className={estilos.tituloModal}>Añadir Objeto al Inventario</span>
          <button
            type="button"
            className={estilos.botonConfigurarPj}
            onClick={alCerrar}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs Agregar Objeto vs Otras Posesiones */}
        <div className={estilos.tabsModalAgregar}>
          <button
            type="button"
            className={`${estilos.tabBotonModal} ${tabActiva === "compendio" ? estilos.tabBotonModalActivo : ""}`}
            onClick={() => setTabActiva("compendio")}
          >
            <Plus size={14} />
            Agregar Objeto
          </button>
          <button
            type="button"
            className={`${estilos.tabBotonModal} ${tabActiva === "otrasPosesiones" ? estilos.tabBotonModalActivo : ""}`}
            onClick={() => setTabActiva("otrasPosesiones")}
          >
            <FileText size={14} />
            Otras Posesiones
          </button>
        </div>

        {/* Contenido según Tab */}
        {tabActiva === "compendio" ? (
          <form
            onSubmit={manejarAgregarDesdeCompendio}
            style={{
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              overflow: "visible",
              minHeight: 260
            }}
          >
            {/* Filtros de categoría */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["todos", "Arma", "Armadura", "Equipo de Aventuras"] as FiltroTipo[]).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFiltroTipo(tipo)}
                  className={estilos.neoButton}
                  style={{
                    flex: 1,
                    fontSize: 9.5,
                    padding: "4px 6px",
                    backgroundColor: filtroTipo === tipo ? "#1e293b" : "transparent",
                    borderColor: filtroTipo === tipo ? "#818cf8" : "rgba(148, 163, 184, 0.12)",
                    color: filtroTipo === tipo ? "#ffffff" : "#94a3b8"
                  }}
                >
                  {tipo === "todos" && "Todos"}
                  {tipo === "Arma" && "Armas"}
                  {tipo === "Armadura" && "Armaduras"}
                  {tipo === "Equipo de Aventuras" && "Equipo"}
                </button>
              ))}
            </div>

            {/* Buscador de Sugerencias */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Buscar Objeto:</label>
              <SelectorSugerencias
                valor={textoBusqueda}
                alCambiar={manejarCambioTextoBusqueda}
                opciones={opcionesSugerencias}
                placeholder="Escribe el nombre del objeto..."
              />
            </div>

            {/* Selector de Cantidad */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Cantidad a Añadir:</label>
              <input
                type="number"
                min="1"
                className={estilos.inputFormulario}
                value={cantidadCompendio}
                onChange={(e) => setCantidadCompendio(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            {/* Vista Previa del Objeto Seleccionado */}
            {objetoSeleccionado ? (
              <div className={estilos.cajaPreviewObjeto}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>
                    {objetoSeleccionado.nombre}
                  </span>
                  <span className={`${estilos.badgeMeta} ${estilos.rarezaComun}`}>
                    {objetoSeleccionado.tipoPrincipal}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#94a3b8", alignItems: "center", flexWrap: "wrap" }}>
                  <span>
                    Peso: <strong style={{ color: "#f1f5f9" }}>{objetoSeleccionado.pesoLb || 0} lb</strong>
                    {objetoSeleccionado.quantity && objetoSeleccionado.quantity > 1 && (
                      <span style={{ color: "#38bdf8", marginLeft: 4 }}>
                        ({objetoSeleccionado.pesoUnitario || Math.round(((objetoSeleccionado.pesoLb || 0) / objetoSeleccionado.quantity) * 1000) / 1000} lb c/u)
                      </span>
                    )}
                  </span>
                  <span>Valor: <strong style={{ color: "#fbbf24" }}>{objetoSeleccionado.valorPO || 0} PO</strong></span>
                  {objetoSeleccionado.quantity && objetoSeleccionado.quantity > 1 && (
                    <span style={{ color: "#34d399", fontWeight: 700 }}>
                      Viene en lote de {objetoSeleccionado.quantity} uds (Se añadirán: {objetoSeleccionado.quantity * (cantidadCompendio || 1)})
                    </span>
                  )}
                  {objetoSeleccionado.sintonizacionRequerida && (
                    <span style={{ color: "#c084fc", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Sparkles size={11} />
                      Requiere Sintonización
                    </span>
                  )}
                </div>

                {objetoSeleccionado.descripcion && (
                  <div className={estilos.descripcionPreview}>
                    {objetoSeleccionado.descripcion}
                  </div>
                )}

                {/* Desglose de contenido del paquete */}
                {objetoSeleccionado.contents && objetoSeleccionado.contents.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4, backgroundColor: "rgba(16, 185, 129, 0.08)", padding: "8px 10px", borderRadius: 4, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#34d399", display: "flex", alignItems: "center", gap: 4 }}>
                      <Package size={12} /> Paquete con {objetoSeleccionado.contents.length} objetos (Podrás abrirlo o desempaquetarlo desde tu inventario):
                    </span>
                    <div style={{ maxHeight: 80, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                      {objetoSeleccionado.contents.map((item, idx) => (
                        <div key={idx} style={{ fontSize: 10, color: "#cbd5e1", display: "flex", justifyContent: "space-between" }}>
                          <span>• {item.item.name}</span>
                          <strong style={{ color: "#38bdf8" }}>×{item.quantity * (cantidadCompendio || 1)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: 8 }}>
                Selecciona un objeto del buscador para ver sus detalles.
              </div>
            )}

            {/* Pie del Modal */}
            <div className={estilos.pieModal} style={{ margin: "-14px", marginTop: 10, padding: "10px 14px" }}>
              <button type="button" className={estilos.neoButton} onClick={alCerrar}>
                Cancelar
              </button>
              <button
                type="submit"
                className={estilos.neoButton}
                disabled={!objetoSeleccionado}
                style={{
                  backgroundColor: objetoSeleccionado ? "#b45309" : "#1a2230",
                  borderColor: objetoSeleccionado ? "#f59e0b" : "transparent",
                  color: "#ffffff"
                }}
              >
                <Plus size={14} style={{ marginRight: 4 }} />
                Añadir al Inventario
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={manejarCrearOtrasPosesiones} style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4, backgroundColor: "rgba(15, 23, 42, 0.6)", padding: "8px 10px", borderRadius: 4, border: "1px solid rgba(148, 163, 184, 0.12)", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <FileText size={14} color="#38bdf8" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Anota rápidamente pertenencias, llaves, cartas, gemas u objetos varios. Podrás configurar estadísticas detalladas más adelante desde el creador Homebrew.</span>
            </div>

            {/* Nombre de la Posesión */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Nombre de la Posesión / Objeto *</label>
              <input
                type="text"
                required
                className={estilos.inputFormulario}
                value={nombrePosesion}
                onChange={(e) => setNombrePosesion(e.target.value)}
                placeholder="Ej. Carta sellada de Waterdeep, Llave de hierro, Gema roja..."
                autoFocus
              />
            </div>

            {/* Cantidad y Peso */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  className={estilos.inputFormulario}
                  value={cantidadPosesion}
                  onChange={(e) => setCantidadPosesion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Peso Total (lb)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className={estilos.inputFormulario}
                  value={pesoPosesion}
                  onChange={(e) => setPesoPosesion(e.target.value)}
                  placeholder="0 (ligero / insignificante)"
                />
              </div>
            </div>

            {/* Notas / Descripción Rápida */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Notas o Descripción (Opcional)</label>
              <textarea
                className={estilos.inputFormulario}
                style={{ height: 60, resize: "none" }}
                value={notasPosesion}
                onChange={(e) => setNotasPosesion(e.target.value)}
                placeholder="Notas de dónde se encontró, pistas, uso, etc..."
              />
            </div>

            {/* Pie del Modal */}
            <div className={estilos.pieModal} style={{ margin: "-14px", marginTop: 10, padding: "10px 14px" }}>
              <button type="button" className={estilos.neoButton} onClick={alCerrar}>
                Cancelar
              </button>
              <button
                type="submit"
                className={estilos.neoButton}
                disabled={!nombrePosesion.trim()}
                style={{
                  backgroundColor: nombrePosesion.trim() ? "#b45309" : "#1a2230",
                  borderColor: nombrePosesion.trim() ? "#f59e0b" : "transparent",
                  color: "#ffffff"
                }}
              >
                <Plus size={14} style={{ marginRight: 4 }} />
                Añadir a Posesiones
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
