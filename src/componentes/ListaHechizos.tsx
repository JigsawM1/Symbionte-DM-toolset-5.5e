import React, { useState, useMemo } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Search, Clock, MapPin, Layers, Info, X } from "lucide-react";

export const ListaHechizos: React.FC = () => {
  const { baseDatosHechizos } = usarAlmacenDM();

  const [busqueda, setBusqueda] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState<number | "todos">("todos");
  const [escuelaFiltro, setEscuelaFiltro] = useState<string | "todas">("todas");
  const [idHechizoDetalle, setIdHechizoDetalle] = useState<string | null>(null);

  // Obtener escuelas de magia únicas para el filtro
  const escuelasDisponibles = useMemo(() => {
    const escuelas = new Set<string>();
    baseDatosHechizos.forEach((h) => {
      if (h.escuela) escuelas.add(h.escuela);
    });
    return Array.from(escuelas).sort();
  }, [baseDatosHechizos]);

  // Filtrar hechizos
  const hechizosFiltrados = useMemo(() => {
    return baseDatosHechizos.filter((hechizo) => {
      const coincideTexto =
        hechizo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        hechizo.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        hechizo.escuela.toLowerCase().includes(busqueda.toLowerCase());

      const coincideNivel =
        nivelFiltro === "todos" ? true : hechizo.nivel === nivelFiltro;

      const coincideEscuela =
        escuelaFiltro === "todas" ? true : hechizo.escuela === escuelaFiltro;

      return coincideTexto && coincideNivel && coincideEscuela;
    });
  }, [baseDatosHechizos, busqueda, nivelFiltro, escuelaFiltro]);

  const hechizoSeleccionado = useMemo(() => {
    return baseDatosHechizos.find((h) => h.id === idHechizoDetalle) || null;
  }, [baseDatosHechizos, idHechizoDetalle]);

  return (
    <div style={estilos.contenedor}>
      <h3 style={estilos.titulo}>
        <span>Compendio de Conjuros (D&D 5.5e)</span>
        <span style={estilos.contador}>
          Encontrados: {hechizosFiltrados.length}
        </span>
      </h3>

      {/* Barra de Filtros */}
      <div style={estilos.barraFiltros}>
        <div style={estilos.buscadorContenedor}>
          <Search size={12} style={estilos.iconoBuscador} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar conjuro por nombre, efecto..."
            style={estilos.buscadorInput}
          />
        </div>

        <select
          value={nivelFiltro}
          onChange={(e) => {
            const val = e.target.value;
            setNivelFiltro(val === "todos" ? "todos" : Number(val));
          }}
          style={estilos.selectorFiltro}
        >
          <option value="todos">Todos los Niveles</option>
          <option value="0">Nivel 0 (Truco)</option>
          <option value="1">Nivel 1</option>
          <option value="2">Nivel 2</option>
          <option value="3">Nivel 3</option>
          <option value="4">Nivel 4</option>
          <option value="5">Nivel 5</option>
          <option value="6">Nivel 6</option>
          <option value="7">Nivel 7</option>
          <option value="8">Nivel 8</option>
          <option value="9">Nivel 9</option>
        </select>

        <select
          value={escuelaFiltro}
          onChange={(e) => setEscuelaFiltro(e.target.value)}
          style={estilos.selectorFiltro}
        >
          <option value="todas">Todas las Escuelas</option>
          {escuelasDisponibles.map((escuela) => (
            <option key={escuela} value={escuela}>
              {escuela}
            </option>
          ))}
        </select>
      </div>
      {/* Contenido Principal con lista densa */}
      <div style={estilos.listaContenedor}>
        {hechizosFiltrados.length === 0 ? (
          <div style={estilos.vacioTexto}>
            No se encontraron conjuros con los filtros aplicados.
          </div>
        ) : (
          hechizosFiltrados.map((hechizo) => {
            const esSeleccionado = idHechizoDetalle === hechizo.id;
            return (
              <div
                key={hechizo.id}
                style={{
                  ...estilos.tarjetaConjuro,
                  ...(esSeleccionado ? estilos.tarjetaExpandida : {})
                }}
              >
                {/* Cabecera del conjuro clickeable */}
                <div
                  onClick={() => setIdHechizoDetalle(hechizo.id)}
                  style={estilos.cabeceraConjuro}
                >
                  <span style={estilos.hechizoNivel}>
                    Niv {hechizo.nivel === 0 ? "0" : hechizo.nivel}
                  </span>
                  <span style={estilos.hechizoNombre}>{hechizo.nombre}</span>
                  <span style={estilos.hechizoEscuela}>{hechizo.escuela}</span>
                  <span style={estilos.indicadorExpansion}>
                    <Info size={11} style={{ marginRight: "3px", display: "inline", verticalAlign: "middle" }} />
                    Detalles
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Detalle Absoluto (Overlay) de Gran Formato */}
      {hechizoSeleccionado && (
        <div style={estilos.panelDetalleOverlay}>
          <div style={estilos.cabeceraDetalle}>
            <div style={estilos.cabeceraDetalleIzquierda}>
              <span style={estilos.hechizoNivelOverlay}>
                NIVEL {hechizoSeleccionado.nivel === 0 ? "TRUCO" : hechizoSeleccionado.nivel}
              </span>
              <span style={estilos.nombreHechizoOverlay}>{hechizoSeleccionado.nombre}</span>
            </div>
            <button
              onClick={() => setIdHechizoDetalle(null)}
              style={estilos.botonCerrarDetalle}
            >
              <X size={15} />
            </button>
          </div>
          <div style={estilos.cuerpoDetalle}>
            {/* Grid Metadatos */}
            <div style={estilos.gridMetadatos}>
              <div style={estilos.metaItem}>
                <Clock size={12} style={estilos.iconoDetalle} />
                <div>
                  <div style={estilos.metaLabel}>TIEMPO DE LANZAMIENTO</div>
                  <div style={estilos.metaValor}>{hechizoSeleccionado.tiempoLanzamiento}</div>
                </div>
              </div>
              <div style={estilos.metaItem}>
                <MapPin size={12} style={estilos.iconoDetalle} />
                <div>
                  <div style={estilos.metaLabel}>ALCANCE / RANGO</div>
                  <div style={estilos.metaValor}>{hechizoSeleccionado.alcance}</div>
                </div>
              </div>
              <div style={estilos.metaItem}>
                <Layers size={12} style={estilos.iconoDetalle} />
                <div>
                  <div style={estilos.metaLabel}>COMPONENTES</div>
                  <div style={estilos.metaValor}>{hechizoSeleccionado.componentes}</div>
                </div>
              </div>
              <div style={estilos.metaItem}>
                <Clock size={12} style={estilos.iconoDetalle} />
                <div>
                  <div style={estilos.metaLabel}>DURACIÓN</div>
                  <div style={estilos.metaValor}>{hechizoSeleccionado.duracion || "Instantáneo"}</div>
                </div>
              </div>
            </div>

            {/* Fila de propiedades visuales adicionales */}
            <div style={estilos.filaPropiedadesEspeciales}>
              {(hechizoSeleccionado.concentracion === true || hechizoSeleccionado.concentracion === "Sí" || hechizoSeleccionado.concentracion === "Si") && (
                <span style={estilos.chipConcentracion}>CONCENTRACIÓN</span>
              )}
              {(hechizoSeleccionado.ritual === true || hechizoSeleccionado.ritual === "Sí" || hechizoSeleccionado.ritual === "Si") && (
                <span style={estilos.chipRitual}>RITUAL</span>
              )}
              <span style={estilos.chipEscuela}>{hechizoSeleccionado.escuela}</span>
            </div>

            {/* Mostrar materiales detallados si existen */}
            {hechizoSeleccionado.materiales && (
              <div style={{ ...estilos.seccionDescripcionFicha, marginTop: "4px" }}>
                <div style={estilos.descripcionTituloFicha}>MATERIALES DE LANZAMIENTO</div>
                <div style={{ ...estilos.descripcionCuerpoFicha, fontSize: "11px", color: "var(--color-texto-secundario)", fontStyle: "italic" }}>
                  {hechizoSeleccionado.materiales}
                </div>
              </div>
            )}

            {/* MECÁNICAS DE COMBATE (Si tiene ataque, CD o daño) */}
            {((hechizoSeleccionado.ataqueCd && hechizoSeleccionado.ataqueCd !== "N/A") || 
              (hechizoSeleccionado.dadosDaño) || 
              (hechizoSeleccionado.cdSalvacion && hechizoSeleccionado.cdSalvacion !== "N/A")) && (
              <div style={{
                backgroundColor: "rgba(0, 245, 212, 0.05)",
                border: "1.5px solid var(--color-borde-cian)",
                padding: "8px",
                borderRadius: "4px",
                marginTop: "6px"
              }}>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "var(--color-borde-cian)", marginBottom: "6px", textTransform: "uppercase" }}>
                  Mecánicas de Combate Integradas (D&D 5.5e)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {hechizoSeleccionado.ataqueCd && hechizoSeleccionado.ataqueCd !== "N/A" && (
                    <div style={{ fontSize: "11px" }}>
                      <span style={{ color: "var(--color-texto-secundario)" }}>Ataque/Efecto: </span>
                      <strong style={{ color: "var(--color-activo)" }}>{hechizoSeleccionado.ataqueCd}</strong>
                    </div>
                  )}
                  {hechizoSeleccionado.cdSalvacion && hechizoSeleccionado.cdSalvacion !== "N/A" && (
                    <div style={{ fontSize: "11px" }}>
                      <span style={{ color: "var(--color-texto-secundario)" }}>CD Salvación: </span>
                      <strong style={{ color: "#ffcc00" }}>CD {hechizoSeleccionado.cdSalvacion}</strong>
                    </div>
                  )}
                  {hechizoSeleccionado.dadosDaño && (
                    <div style={{ fontSize: "11px" }}>
                      <span style={{ color: "var(--color-texto-secundario)" }}>Daño: </span>
                      <strong style={{ color: "#ff7675" }}>{hechizoSeleccionado.dadosDaño} {hechizoSeleccionado.tipoDaño && hechizoSeleccionado.tipoDaño !== "N/A" ? `(${hechizoSeleccionado.tipoDaño})` : ""}</strong>
                    </div>
                  )}
                  {hechizoSeleccionado.dadosDañoNivelSuperior && (
                    <div style={{ fontSize: "11px" }}>
                      <span style={{ color: "var(--color-texto-secundario)" }}>Daño Niv. Superior: </span>
                      <strong style={{ color: "#74b9ff" }}>+{hechizoSeleccionado.dadosDañoNivelSuperior}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descripción Completa */}
            <div style={estilos.seccionDescripcionFicha}>
              <div style={estilos.descripcionTituloFicha}>DESCRIPCIÓN DEL CONJURO</div>
              <div style={estilos.descripcionCuerpoFicha}>
                {hechizoSeleccionado.descripcion}
              </div>
            </div>

            {/* A niveles superiores si existe */}
            {hechizoSeleccionado.descNivelSuperior && (
              <div style={estilos.seccionDescripcionFicha}>
                <div style={{ ...estilos.descripcionTituloFicha, color: "var(--color-activo)" }}>A NIVELES SUPERIORES</div>
                <div style={{ ...estilos.descripcionCuerpoFicha, color: "var(--color-texto-secundario)" }}>
                  {hechizoSeleccionado.descNivelSuperior}
                </div>
              </div>
            )}

            {/* Clases disponibles si existen */}
            {hechizoSeleccionado.clases && hechizoSeleccionado.clases.length > 0 && (
              <div style={{ ...estilos.seccionDescripcionFicha, marginTop: "8px" }}>
                <div style={estilos.descripcionTituloFicha}>CLASES QUE PUEDEN UTILIZAR ESTE CONJURO</div>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  {hechizoSeleccionado.clases.map((clase) => (
                    <span key={clase} style={{
                      fontSize: "9px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--color-borde-brutal)",
                      color: "var(--color-texto-principal)",
                      padding: "1px 5px",
                      borderRadius: "2px"
                    }}>
                      {clase}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  contenedor: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "6px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    position: "relative"
  },
  titulo: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "3px",
    margin: 0
  },
  contador: {
    fontFamily: "var(--fuente-codigo)",
    color: "var(--color-borde-cian)",
    fontSize: "12px"
  },
  barraFiltros: {
    display: "flex",
    gap: "4px",
    width: "100%",
    alignItems: "center",
    flexWrap: "wrap"
  },
  buscadorContenedor: {
    position: "relative",
    flex: 2,
    minWidth: "150px"
  },
  iconoBuscador: {
    position: "absolute",
    left: "6px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--color-texto-secundario)"
  },
  buscadorInput: {
    width: "100%",
    height: "22px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-principal)",
    padding: "2px 6px 2px 22px",
    fontSize: "12px",
    boxSizing: "border-box"
  },
  selectorFiltro: {
    flex: 1,
    minWidth: "100px",
    height: "22px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-principal)",
    fontSize: "12px",
    cursor: "pointer"
  },
  listaContenedor: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    paddingRight: "2px"
  },
  vacioTexto: {
    fontSize: "12px",
    color: "var(--color-texto-apagado)",
    textAlign: "center",
    padding: "20px 10px",
    border: "1px dashed var(--color-borde-brutal)"
  },
  tarjetaConjuro: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    display: "flex",
    flexDirection: "column"
  },
  tarjetaExpandida: {
    borderColor: "var(--color-borde-cian)"
  },
  cabeceraConjuro: {
    display: "flex",
    alignItems: "center",
    padding: "4px 6px",
    cursor: "pointer",
    userSelect: "none",
    gap: "6px",
    fontSize: "12.5px"
  },
  hechizoNivel: {
    fontFamily: "var(--fuente-codigo)",
    fontWeight: "bold",
    color: "var(--color-primario-brillante)",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "0 4px",
    borderRadius: "0",
    fontSize: "11px"
  },
  hechizoNombre: {
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  hechizoEscuela: {
    fontSize: "10.5px",
    color: "var(--color-texto-secundario)",
    textTransform: "uppercase",
    backgroundColor: "rgba(95, 93, 187, 0.1)",
    padding: "0px 4px",
    border: "1px solid rgba(95, 93, 187, 0.2)"
  },
  indicadorExpansion: {
    fontSize: "10px",
    fontFamily: "var(--fuente-codigo)",
    color: "var(--color-texto-secundario)",
    width: "70px",
    textAlign: "right"
  },
  detallesConjuro: {
    borderTop: "1px solid var(--color-borde-brutal)",
    padding: "6px",
    backgroundColor: "var(--color-fondo-profundo)",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  detallesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "4px",
    fontSize: "10.5px",
    borderBottom: "1px dashed var(--color-borde-brutal)",
    paddingBottom: "4px"
  },
  detalleItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "var(--color-texto-secundario)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  iconoDetalle: {
    color: "var(--color-borde-cian)",
    flexShrink: 0
  },
  descripcionContenedor: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  descripcionTitulo: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "9.5px",
    fontWeight: "bold",
    color: "var(--color-primario)",
    textTransform: "uppercase"
  },
  descripcionTexto: {
    fontSize: "10px",
    color: "var(--color-texto-principal)",
    margin: 0,
    lineHeight: "1.35",
    whiteSpace: "pre-line",
    textAlign: "justify"
  },
  panelDetalleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "85%",
    zIndex: 100,
    borderTop: "3px solid var(--color-borde-brutal)",
    borderLeft: "3px solid var(--color-borde-brutal)",
    borderRight: "3px solid var(--color-borde-brutal)",
    backgroundColor: "var(--color-fondo-profundo)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -10px 25px rgba(0, 0, 0, 0.6)",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px"
  },
  cabeceraDetalle: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--color-fondo-tarjeta)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    padding: "6px 12px",
    height: "28px"
  },
  cabeceraDetalleIzquierda: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px"
  },
  hechizoNivelOverlay: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#ffcc00",
    border: "1px solid #ffcc00",
    padding: "0 4px",
    fontFamily: "var(--fuente-codigo)"
  },
  nombreHechizoOverlay: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)"
  },
  botonCerrarDetalle: {
    background: "none",
    border: "none",
    color: "var(--color-texto-secundario)",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center"
  },
  cuerpoDetalle: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  gridMetadatos: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1.5px solid var(--color-borde-brutal)",
    padding: "8px"
  },
  metaItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px"
  },
  metaLabel: {
    fontSize: "11px",
    color: "var(--color-texto-apagado)",
    fontWeight: "bold"
  },
  metaValor: {
    fontSize: "14px",
    color: "var(--color-texto-principal)",
    fontWeight: "bold"
  },
  filaPropiedadesEspeciales: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "6px"
  },
  chipConcentracion: {
    fontSize: "12px",
    backgroundColor: "rgba(255, 204, 0, 0.15)",
    border: "1px solid #ffcc00",
    color: "#ffcc00",
    padding: "1px 6px",
    fontWeight: "bold"
  },
  chipRitual: {
    fontSize: "12px",
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    border: "1px solid var(--color-borde-cian)",
    color: "var(--color-borde-cian)",
    padding: "1px 6px",
    fontWeight: "bold"
  },
  chipEscuela: {
    fontSize: "12px",
    backgroundColor: "rgba(95, 93, 187, 0.15)",
    border: "1px solid rgba(95, 93, 187, 0.4)",
    color: "#a29bfe",
    padding: "1px 6px",
    textTransform: "uppercase",
    fontWeight: "bold"
  },
  seccionDescripcionFicha: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  descripcionTituloFicha: {
    fontSize: "12.5px",
    fontWeight: "bold",
    color: "var(--color-borde-cian)",
    letterSpacing: "0.05em",
    borderBottom: "1.5px solid var(--color-borde-brutal)",
    paddingBottom: "2px"
  },
  descripcionCuerpoFicha: {
    fontSize: "13.5px",
    color: "var(--color-texto-principal)",
    lineHeight: "1.45",
    whiteSpace: "pre-line",
    textAlign: "justify"
  }
};
