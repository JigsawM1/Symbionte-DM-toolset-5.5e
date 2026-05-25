import React, { useState } from "react";
import { Clock, MapPin, Layers, X } from "lucide-react";
import { lanzarDadosTaleSpire } from "../utiles/lanzadorDados";
import { calcularFormulaEscalada } from "../utiles/utilesConjuros";

interface ModalDetalleHechizoProps {
  hechizo: {
    id: string;
    nombre: string;
    nivel: number;
    escuela: string;
    tiempoLanzamiento: string;
    alcance: string;
    componentes: string;
    materiales?: string;
    duracion?: string;
    concentracion?: boolean | string;
    ritual?: boolean | string;
    dadosDaño?: string;
    dadosDañoNivelSuperior?: string;
    tipoDaño?: string;
    cdSalvacion?: string;
    ataqueCd?: string;
    descripcion: string;
    descNivelSuperior?: string;
    clases?: string[];
  };
  onClose: () => void;
}

export const ModalDetalleHechizo: React.FC<ModalDetalleHechizoProps> = ({ hechizo, onClose }) => {
  // Inicializar nivel de Upcast con el nivel base del conjuro
  const nivelBase = hechizo.nivel;
  const [nivelLanzamiento, setNivelLanzamiento] = useState<number>(nivelBase > 0 ? nivelBase : 1);

  // Comprobar si el hechizo es escalable a niveles superiores
  const esEscalable = nivelBase > 0 && hechizo.dadosDañoNivelSuperior && hechizo.dadosDañoNivelSuperior !== "N/A";

  // Calcular dados escalados en tiempo real si aplica
  const dadosBaseValidos = hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" ? hechizo.dadosDaño : "1d6";
  const formulaEscalada = esEscalable
    ? calcularFormulaEscalada(dadosBaseValidos, hechizo.dadosDañoNivelSuperior || "1d6", nivelBase, nivelLanzamiento)
    : { formula: dadosBaseValidos, adicionalText: "" };

  // Manejar el lanzamiento de dados en TaleSpire
  const manejarLanzamientoDados = () => {
    const tipoDanoText = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A"
      ? ` (${hechizo.tipoDaño})`
      : "";

    if (nivelLanzamiento > nivelBase && esEscalable) {
      lanzarDadosTaleSpire(
        formulaEscalada.formula,
        `Conjuro: ${hechizo.nombre} [Niv ${nivelLanzamiento}]${tipoDanoText}`
      );
    } else {
      lanzarDadosTaleSpire(
        dadosBaseValidos,
        `Conjuro: ${hechizo.nombre}${tipoDanoText}`
      );
    }
  };

  return (
    <div style={estilos.overlay} onClick={onClose}>
      <div style={estilos.modalContenedor} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div style={estilos.cabecera}>
          <div style={estilos.cabeceraIzquierda}>
            <span style={estilos.metaNivel}>
              NIVEL {hechizo.nivel === 0 ? "TRUCO" : hechizo.nivel}
            </span>
            <span style={estilos.titulo}>{hechizo.nombre}</span>
          </div>
          <button onClick={onClose} style={estilos.botonCerrar} title="Cerrar detalles">
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div style={estilos.cuerpo}>
          {/* Fila de Propiedades Visuales */}
          <div style={estilos.filaChips}>
            {(hechizo.concentracion === true || hechizo.concentracion === "Sí" || hechizo.concentracion === "Si") && (
              <span style={estilos.chipConcentracion}>CONCENTRACIÓN</span>
            )}
            {(hechizo.ritual === true || hechizo.ritual === "Sí" || hechizo.ritual === "Si") && (
              <span style={estilos.chipRitual}>RITUAL</span>
            )}
            <span style={estilos.chipEscuela}>{hechizo.escuela.toUpperCase()}</span>
          </div>

          {/* Grid de Metadatos D&D */}
          <div style={estilos.gridMetadatos}>
            <div style={estilos.metaItem}>
              <Clock size={13} style={estilos.iconoMeta} />
              <div>
                <div style={estilos.metaLabel}>TIEMPO</div>
                <div style={estilos.metaValor}>{hechizo.tiempoLanzamiento}</div>
              </div>
            </div>
            <div style={estilos.metaItem}>
              <MapPin size={13} style={estilos.iconoMeta} />
              <div>
                <div style={estilos.metaLabel}>ALCANCE</div>
                <div style={estilos.metaValor}>{hechizo.alcance}</div>
              </div>
            </div>
            <div style={estilos.metaItem}>
              <Layers size={13} style={estilos.iconoMeta} />
              <div>
                <div style={estilos.metaLabel}>COMPONENTES</div>
                <div style={estilos.metaValor}>{hechizo.componentes}</div>
              </div>
            </div>
            <div style={estilos.metaItem}>
              <Clock size={13} style={estilos.iconoMeta} />
              <div>
                <div style={estilos.metaLabel}>DURACIÓN</div>
                <div style={estilos.metaValor}>{hechizo.duracion || "Instantáneo"}</div>
              </div>
            </div>
          </div>

          {/* Materiales si existen */}
          {hechizo.materiales && (
            <div style={estilos.seccionFicha}>
              <div style={estilos.seccionTitulo}>MATERIALES</div>
              <div style={estilos.textoMateriales}>{hechizo.materiales}</div>
            </div>
          )}

          {/* MECÁNICAS DE COMBATE (Daño / CD / Upcasting) */}
          {((hechizo.ataqueCd && hechizo.ataqueCd !== "N/A") || 
            (hechizo.dadosDaño && hechizo.dadosDaño !== "N/A") || 
            (hechizo.cdSalvacion && hechizo.cdSalvacion !== "N/A")) && (
            <div style={estilos.cajaCombate}>
              <div style={estilos.tituloCombate}>Mecánicas de Combate Integradas</div>
              
              <div style={estilos.gridCombate}>
                {hechizo.ataqueCd && hechizo.ataqueCd !== "N/A" && (
                  <div style={estilos.combateItem}>
                    <span style={estilos.combateLabel}>Efecto/Ataque: </span>
                    <strong style={{ color: "var(--color-activo)" }}>{hechizo.ataqueCd}</strong>
                  </div>
                )}
                {hechizo.cdSalvacion && hechizo.cdSalvacion !== "N/A" && (
                  <div style={estilos.combateItem}>
                    <span style={estilos.combateLabel}>CD Salvación: </span>
                    <strong style={{ color: "#ffcc00" }}>CD {hechizo.cdSalvacion}</strong>
                  </div>
                )}
                {hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" && (
                  <div style={{ ...estilos.combateItem, gridColumn: esEscalable ? "1 / -1" : "auto" }}>
                    <span style={estilos.combateLabel}>Daño Base: </span>
                    <strong style={{ color: "#ff7675" }}>
                      {hechizo.dadosDaño} 
                      {hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : ""}
                    </strong>
                  </div>
                )}
              </div>

              {/* Panel de Upcasting Interactivo */}
              {esEscalable && (
                <div style={estilos.seccionUpcast}>
                  <div style={estilos.lineaDivisoria}></div>
                  <div style={estilos.upcastControlFila}>
                    <div style={estilos.upcastSelectContenedor}>
                      <span style={estilos.upcastLabel}>Lanzar con Ranura:</span>
                      <select
                        value={nivelLanzamiento}
                        onChange={(e) => setNivelLanzamiento(Number(e.target.value))}
                        style={estilos.upcastSelect}
                      >
                        {Array.from({ length: 10 - nivelBase }, (_, i) => nivelBase + i).map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Nivel {lvl} {lvl === nivelBase ? "(Base)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    {nivelLanzamiento > nivelBase && (
                      <div style={estilos.formulasVista}>
                        <span style={estilos.formulaTotal}>{formulaEscalada.formula}</span>
                        <span style={estilos.formulaDetalle}>{formulaEscalada.adicionalText}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botón de Lanzamiento de Dados */}
              {hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" && (
                <button
                  onClick={manejarLanzamientoDados}
                  style={nivelLanzamiento > nivelBase && esEscalable ? estilos.botonTirarUpcast : estilos.botonTirarCombate}
                >
                  🎲 Tirar Daño en TaleSpire {nivelLanzamiento > nivelBase && esEscalable ? `(Nivel ${nivelLanzamiento})` : ""}
                </button>
              )}
            </div>
          )}

          {/* Descripción */}
          <div style={estilos.seccionFicha}>
            <div style={estilos.seccionTitulo}>DESCRIPCIÓN DEL CONJURO</div>
            <div style={estilos.textoDescripcion}>{hechizo.descripcion}</div>
          </div>

          {/* Niveles superiores estático informativo si existe */}
          {hechizo.descNivelSuperior && (
            <div style={estilos.seccionFicha}>
              <div style={{ ...estilos.seccionTitulo, color: "var(--color-borde-cian)" }}>EFECTO A NIVELES SUPERIORES</div>
              <div style={{ ...estilos.textoDescripcion, color: "var(--color-texto-secundario)", fontStyle: "italic" }}>
                {hechizo.descNivelSuperior}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(2, 4, 8, 0.75)",
    backdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "16px"
  },
  modalContenedor: {
    position: "relative",
    width: "100%",
    maxWidth: "460px",
    maxHeight: "85vh",
    backgroundColor: "rgba(9, 13, 22, 0.94)",
    border: "1px solid var(--color-borde-cian)",
    boxShadow: "0 0 25px rgba(0, 245, 212, 0.25), inset 0 0 15px rgba(0, 245, 212, 0.05)",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backdropFilter: "blur(12px)",
    animation: "none"
  },
  cabecera: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "1px solid rgba(0, 245, 212, 0.2)",
    backgroundColor: "rgba(0, 245, 212, 0.06)"
  },
  cabeceraIzquierda: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  metaNivel: {
    fontSize: "9px",
    fontWeight: "bold",
    letterSpacing: "0.08em",
    color: "var(--color-borde-cian)",
    fontFamily: "var(--fuente-codigo)"
  },
  titulo: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffffff",
    fontFamily: "var(--fuente-principal)",
    letterSpacing: "0.02em"
  },
  botonCerrar: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--color-texto-secundario)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "none"
  },
  cuerpo: {
    padding: "14px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1
  },
  filaChips: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    alignItems: "center"
  },
  chipConcentracion: {
    fontSize: "8px",
    fontWeight: "bold",
    backgroundColor: "rgba(239, 71, 111, 0.15)",
    border: "1px solid #ef476f",
    color: "#ef476f",
    padding: "2px 6px",
    borderRadius: "2px",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.05em"
  },
  chipRitual: {
    fontSize: "8px",
    fontWeight: "bold",
    backgroundColor: "rgba(114, 9, 183, 0.15)",
    border: "1px solid #7209b7",
    color: "#b5179e",
    padding: "2px 6px",
    borderRadius: "2px",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.05em"
  },
  chipEscuela: {
    fontSize: "8px",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 245, 212, 0.05)",
    border: "1px solid rgba(0, 245, 212, 0.2)",
    color: "var(--color-borde-cian)",
    padding: "2px 6px",
    borderRadius: "2px",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.05em"
  },
  gridMetadatos: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    backgroundColor: "rgba(0, 245, 212, 0.02)",
    border: "1px solid rgba(0, 245, 212, 0.1)",
    padding: "10px",
    borderRadius: "4px"
  },
  metaItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "8px"
  },
  iconoMeta: {
    color: "var(--color-borde-cian)",
    marginTop: "2px"
  },
  metaLabel: {
    fontSize: "8px",
    fontWeight: "bold",
    color: "var(--color-texto-apagado)",
    letterSpacing: "0.05em"
  },
  metaValor: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--color-texto-principal)"
  },
  seccionFicha: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  seccionTitulo: {
    fontSize: "9px",
    fontWeight: "800",
    color: "var(--color-borde-cian)",
    letterSpacing: "0.08em",
    borderBottom: "1px solid rgba(0, 245, 212, 0.15)",
    paddingBottom: "4px",
    textTransform: "uppercase",
    fontFamily: "var(--fuente-codigo)"
  },
  textoMateriales: {
    fontSize: "10px",
    fontStyle: "italic",
    color: "var(--color-texto-secundario)",
    paddingLeft: "4px",
    borderLeft: "2px solid rgba(255, 255, 255, 0.15)"
  },
  textoDescripcion: {
    fontSize: "12px",
    lineHeight: "1.45",
    color: "var(--color-texto-secundario)",
    whiteSpace: "pre-wrap"
  },
  cajaCombate: {
    backgroundColor: "rgba(0, 245, 212, 0.04)",
    border: "1px solid rgba(0, 245, 212, 0.3)",
    boxShadow: "0 0 10px rgba(0, 245, 212, 0.1)",
    borderRadius: "4px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  tituloCombate: {
    fontSize: "9px",
    fontWeight: "bold",
    color: "var(--color-borde-cian)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "var(--fuente-codigo)"
  },
  gridCombate: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  combateItem: {
    fontSize: "11px",
    fontWeight: "500"
  },
  combateLabel: {
    color: "var(--color-texto-secundario)"
  },
  seccionUpcast: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  lineaDivisoria: {
    height: "1px",
    backgroundColor: "rgba(0, 245, 212, 0.2)",
    width: "100%"
  },
  upcastControlFila: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
  },
  upcastSelectContenedor: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px",
    flex: 1
  },
  upcastLabel: {
    fontSize: "10px",
    color: "var(--color-texto-secundario)",
    whiteSpace: "nowrap"
  },
  upcastSelect: {
    height: "24px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1px solid rgba(0, 245, 212, 0.3)",
    color: "var(--color-texto-principal)",
    fontSize: "10px",
    borderRadius: "2px",
    padding: "0 6px",
    cursor: "pointer",
    flex: 1,
    fontFamily: "var(--fuente-codigo)"
  },
  formulasVista: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "1px"
  },
  formulaTotal: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#ff7675",
    fontFamily: "var(--fuente-codigo)"
  },
  formulaDetalle: {
    fontSize: "9px",
    color: "#74b9ff",
    fontFamily: "var(--fuente-codigo)"
  },
  botonTirarCombate: {
    height: "28px",
    backgroundColor: "rgba(255, 118, 117, 0.15)",
    border: "1px solid #ff7675",
    color: "#ff7675",
    fontWeight: "bold",
    borderRadius: "2px",
    cursor: "pointer",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.02em",
    transition: "none"
  },
  botonTirarUpcast: {
    height: "28px",
    backgroundColor: "rgba(116, 185, 255, 0.15)",
    border: "1px solid #74b9ff",
    color: "#74b9ff",
    fontWeight: "bold",
    borderRadius: "2px",
    cursor: "pointer",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.02em",
    transition: "none"
  }
};
