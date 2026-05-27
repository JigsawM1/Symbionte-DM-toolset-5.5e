import React, { useState } from "react";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "../../utiles/datosIniciales";

export const DiccionarioCondiciones: React.FC = () => {
  const [tipoDiccionario, setTipoDiccionario] = useState<"condiciones" | "efectos">("condiciones");
  const [condicionSeleccionada, setCondicionSeleccionada] = useState(CONDICIONES_2024[0]);
  const [efectoSeleccionado, setEfectoSeleccionado] = useState(EFECTOS_PREDEFINIDOS[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: "6px" }}>
      {/* Pestañas internas de navegación */}
      <div style={estilos.pestañasInternas}>
        <button
          onClick={() => setTipoDiccionario("condiciones")}
          style={{
            ...estilos.miniBotonTab,
            ...(tipoDiccionario === "condiciones" ? estilos.miniBotonTabActivo : {})
          }}
        >
          📜 CONDICIONES
        </button>
        <button
          onClick={() => setTipoDiccionario("efectos")}
          style={{
            ...estilos.miniBotonTab,
            ...(tipoDiccionario === "efectos" ? {
              backgroundColor: "hsla(265, 80%, 10%, 0.85)",
              borderColor: "hsla(265, 80%, 60%, 0.85)",
              color: "hsl(265, 95%, 85%)",
              boxShadow: "0 0 0 1px hsla(265, 80%, 60%, 0.85)"
            } : {})
          }}
        >
          EFECTOS ACTIVOS
        </button>
      </div>

      {tipoDiccionario === "condiciones" ? (
        <div style={estilos.seccionCondiciones}>
          <div style={estilos.listaCondicionesLateral}>
            {CONDICIONES_2024.map((c) => (
              <div
                key={c.nombre}
                onClick={() => setCondicionSeleccionada(c)}
                style={{
                  ...estilos.itemCondicionLista,
                  ...(condicionSeleccionada.nombre === c.nombre ? estilos.itemCondicionActivo : {})
                }}
              >
                {c.nombre.split(" (")[0]}
              </div>
            ))}
          </div>

          <div style={estilos.detalleCondicionPanel}>
            <h3 style={estilos.tituloCondicion}>{condicionSeleccionada.nombre}</h3>
            <span style={estilos.origenCondicion}>{condicionSeleccionada.descripcion}</span>
            
            <div style={estilos.bloqueEfectosCondicion}>
              <div style={estilos.cabeceraBloqueEfectos}>EFECTOS DE ESTA CONDICIÓN:</div>
              <ul style={estilos.listaEfectos}>
                {condicionSeleccionada.efectos.map((efecto, i) => (
                  <li key={i} style={estilos.itemEfectoLista}>
                    <span style={{ color: "var(--color-borde-cian)", marginRight: "5px", fontWeight: "bold" }}>›</span>
                    {efecto}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div style={estilos.seccionCondiciones}>
          <div style={estilos.listaCondicionesLateral}>
            {EFECTOS_PREDEFINIDOS.map((ef) => (
              <div
                key={ef.nombre}
                onClick={() => setEfectoSeleccionado(ef)}
                style={{
                  ...estilos.itemCondicionLista,
                  ...(efectoSeleccionado.nombre === ef.nombre ? {
                    backgroundColor: "hsla(265, 80%, 10%, 0.85)",
                    borderColor: "hsla(265, 80%, 60%, 0.85)",
                    color: "hsl(265, 95%, 85%)",
                    borderLeft: "3px solid hsla(265, 80%, 60%, 0.85)"
                  } : {
                    borderColor: "rgba(157, 78, 221, 0.15)",
                    color: "var(--color-texto-secundario)"
                  })
                }}
              >
                {ef.nombre.split(" (")[0]}
              </div>
            ))}
          </div>

          <div style={estilos.detalleCondicionPanel}>
            <h3 style={{ ...estilos.tituloCondicion, color: "#d8b4fe" }}>{efectoSeleccionado.nombre}</h3>
            <span style={estilos.origenCondicion}>
              DURACIÓN ESTÁNDAR: <strong style={{ color: "#d8b4fe" }}>{efectoSeleccionado.duracionEstandar} RONDAS</strong>
            </span>
            
            <div style={{ ...estilos.bloqueEfectosCondicion, borderColor: "rgba(157, 78, 221, 0.3)" }}>
              <div style={{ ...estilos.cabeceraBloqueEfectos, color: "#d8b4fe" }}>DESCRIPCIÓN Y REGLAS DEL EFECTO:</div>
              <div style={{ padding: "4px 2px", fontSize: "11px", color: "var(--color-texto-principal)", lineHeight: "1.45" }}>
                {efectoSeleccionado.descripcion}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  pestañasInternas: {
    display: "flex", 
    justifyContent: "space-around", 
    gap: "4px", 
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)", 
    paddingBottom: "4px"
  },
  miniBotonTab: {
    backgroundColor: "hsl(222, 18%, 9%)",
    border: "1px solid hsla(222, 18%, 14%, 1)",
    color: "var(--color-texto-secundario)",
    fontSize: "9.5px",
    padding: "3px 8px",
    borderRadius: "3px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    fontWeight: "800",
    fontFamily: "var(--fuente-titulo)",
    letterSpacing: "0.01em",
    userSelect: "none"
  },
  miniBotonTabActivo: {
    backgroundColor: "hsla(172, 90%, 8%, 0.85)",
    borderColor: "var(--color-borde-cian)",
    color: "var(--color-borde-cian)",
    boxShadow: "0 0 0 1px var(--color-borde-cian)"
  },
  seccionCondiciones: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    gap: "6px",
    height: "100%"
  },
  listaCondicionesLateral: {
    width: "115px",
    backgroundColor: "hsl(222, 22%, 7%)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "3px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    flexShrink: 0
  },
  itemCondicionLista: {
    padding: "5px 6px",
    fontSize: "9.5px",
    fontWeight: "800",
    fontFamily: "var(--fuente-codigo)",
    borderBottom: "1px solid hsl(222, 20%, 11%)",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.01em",
    borderLeft: "3px solid transparent"
  },
  itemCondicionActivo: {
    backgroundColor: "hsla(172, 90%, 7%, 0.8)",
    color: "var(--color-borde-cian)",
    borderLeft: "3px solid var(--color-borde-cian)",
    borderColor: "hsla(172, 90%, 45%, 0.8)"
  },
  detalleCondicionPanel: {
    flexGrow: 1,
    backgroundColor: "hsl(222, 20%, 8%)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "3px",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto"
  },
  tituloCondicion: {
    fontSize: "13px",
    fontWeight: "800",
    fontFamily: "var(--fuente-titulo)",
    letterSpacing: "0.02em",
    color: "var(--color-borde-cian)",
    textTransform: "uppercase",
    marginBottom: "2px"
  },
  origenCondicion: {
    fontSize: "9.5px",
    color: "var(--color-texto-apagado)",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    marginBottom: "8px",
    display: "block"
  },
  bloqueEfectosCondicion: {
    backgroundColor: "hsl(222, 25%, 5%)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "3px",
    padding: "8px",
    marginTop: "4px"
  },
  cabeceraBloqueEfectos: {
    fontSize: "9px",
    fontWeight: "800",
    fontFamily: "var(--fuente-codigo)",
    color: "var(--color-texto-secundario)",
    marginBottom: "6px",
    borderBottom: "1px dashed hsl(222, 18%, 15%)",
    paddingBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.02em"
  },
  listaEfectos: {
    listStyleType: "none",
    padding: 0
  },
  itemEfectoLista: {
    fontSize: "11px",
    lineHeight: "1.45",
    color: "var(--color-texto-principal)",
    marginBottom: "5px",
    display: "flex",
    alignItems: "flex-start",
    gap: "4px"
  }
};
