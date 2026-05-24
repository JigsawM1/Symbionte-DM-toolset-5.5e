import React, { useState } from "react";
import { lanzarDadosTaleSpire } from "../utiles/lanzadorDados";

/**
 * Componente PanelDados
 *
 * Un panel flotante interactivo y ultra-estético diseñado con colores HSL oscuros,
 * bordes curvos, glassmorphism y micro-animaciones para armar y lanzar dados
 * directamente en la bandeja física de TaleSpire.
 *
 * Programado 100% en español.
 */

interface DadosBandeja {
  d4: number;
  d6: number;
  d8: number;
  d10: number;
  d12: number;
  d20: number;
  d100: number;
}

export function PanelDados() {
  const [minimizado, setMinimizado] = useState(true);
  const [dados, setDados] = useState<DadosBandeja>({
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    d100: 0,
  });
  const [modificador, setModificador] = useState<number>(0);
  const [nombreTirada, setNombreTirada] = useState<string>("");

  // Tipos de dados soportados
  const tiposDados: (keyof DadosBandeja)[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

  // Colores HSL estilizados para cada dado
  const coloresDados: Record<keyof DadosBandeja, string> = {
    d4: "hsl(343, 81%, 65%)",    // Rosa vibrante
    d6: "hsl(32, 95%, 60%)",     // Naranja cálido
    d8: "hsl(142, 70%, 55%)",    // Verde esmeralda
    d10: "hsl(190, 90%, 50%)",   // Cyan brillante
    d12: "hsl(271, 81%, 66%)",   // Púrpura místico
    d20: "hsl(43, 96%, 56%)",    // Amarillo oro
    d100: "hsl(160, 84%, 42%)",  // Turquesa profundo
  };

  // Añadir un dado a la bandeja virtual
  const agregarDado = (tipo: keyof DadosBandeja) => {
    setDados((prev) => ({
      ...prev,
      [tipo]: Math.min(prev[tipo] + 1, 99), // límite razonable de 99 dados
    }));
  };

  // Quitar un dado de la bandeja virtual
  const removerDado = (tipo: keyof DadosBandeja, e: React.MouseEvent) => {
    e.preventDefault(); // Previene menús contextuales en click derecho
    setDados((prev) => ({
      ...prev,
      [tipo]: Math.max(prev[tipo] - 1, 0),
    }));
  };

  // Resetear la bandeja de dados a cero
  const limpiarBandeja = () => {
    setDados({
      d4: 0,
      d6: 0,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
      d100: 0,
    });
    setModificador(0);
    setNombreTirada("");
  };

  // Construir la fórmula de dados dinámica a partir de la selección del usuario
  const construirFormula = (): string => {
    const partes: string[] = [];
    tiposDados.forEach((tipo) => {
      const cantidad = dados[tipo];
      if (cantidad > 0) {
        partes.push(`${amountFormat(cantidad, tipo)}`);
      }
    });

    if (partes.length === 0) return "";

    // Los múltiples grupos se separan formalmente con '/' para que lanzarDadosTaleSpire
    // pueda procesar cada grupo de forma aislada, sanitizándolo o traduciéndolo.
    const baseFormula = partes.join("/");
    if (modificador > 0) {
      return `${baseFormula}+${modificador}`;
    } else if (modificador < 0) {
      return `${baseFormula}${modificador}`;
    }
    return baseFormula;
  };

  // Formateador auxiliar
  const amountFormat = (cantidad: number, tipo: string) => {
    return `${cantidad}${tipo}`;
  };

  // Lanzar la tirada construida en TaleSpire
  const manejarLanzamiento = async () => {
    const formula = construirFormula();
    if (!formula) return;

    const etiquetaFinal = nombreTirada.trim() || "Tirada Rápida";
    await lanzarDadosTaleSpire(formula, etiquetaFinal);
  };

  const formulaActual = construirFormula();

  // Renderizar el botón flotante si está minimizado
  if (minimizado) {
    return (
      <button
        onClick={() => setMinimizado(false)}
        style={estilos.botonFlotante}
        title="Abrir Panel de Dados"
      >
        🎲
      </button>
    );
  }

  return (
    <div style={estilos.contenedorPanel}>
      {/* Cabecera del Panel */}
      <div style={estilos.cabecera}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>🎲</span>
          <span style={estilos.titulo}>Bandeja de Dados</span>
        </div>
        <button onClick={() => setMinimizado(true)} style={estilos.botonMinimizar}>
          ✕
        </button>
      </div>

      {/* Cuerpo del Panel */}
      <div style={estilos.cuerpo}>
        {/* Entrada del Nombre de Tirada */}
        <div style={estilos.campoEntrada}>
          <input
            type="text"
            placeholder="Etiqueta de la tirada (ej. Daño de Fuego)"
            value={nombreTirada}
            onChange={(e) => setNombreTirada(e.target.value)}
            style={estilos.inputEtiqueta}
          />
        </div>

        {/* Grilla de Dados */}
        <div style={estilos.grillaDados}>
          {tiposDados.map((tipo) => {
            const cantidad = dados[tipo];
            const color = coloresDados[tipo];
            return (
              <button
                key={tipo}
                onClick={() => agregarDado(tipo)}
                onContextMenu={(e) => removerDado(tipo, e)}
                style={{
                  ...estilos.tarjetaDado,
                  border: cantidad > 0 ? `2px solid ${color}` : "2px solid hsl(240, 5%, 26%)",
                  boxShadow: cantidad > 0 ? `0 0 10px ${color}33` : "none",
                }}
                title={`Click izquierdo: Añadir ${tipo.toUpperCase()} | Click derecho: Quitar`}
              >
                {cantidad > 0 && <span style={{ ...estilos.contadorDado, backgroundColor: color }}>{cantidad}</span>}
                <span style={{ ...estilos.nombreDado, color: cantidad > 0 ? color : "hsl(240, 5%, 75%)" }}>
                  {tipo.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modificador Rápido */}
        <div style={estilos.contenedorModificador}>
          <span style={estilos.labelMod}>Modificador:</span>
          <div style={estilos.controlesMod}>
            <button onClick={() => setModificador((m) => m - 1)} style={estilos.btnModControl}>
              -
            </button>
            <input
              type="number"
              value={modificador}
              onChange={(e) => setModificador(parseInt(e.target.value, 10) || 0)}
              style={estilos.inputMod}
            />
            <button onClick={() => setModificador((m) => m + 1)} style={estilos.btnModControl}>
              +
            </button>
          </div>
        </div>

        {/* Visualizador de Fórmula */}
        <div style={estilos.contenedorFormula}>
          <span style={estilos.labelFormula}>Fórmula a lanzar:</span>
          <div style={estilos.formulaValor}>
            {formulaActual ? (
              <span style={estilos.formulaTextoActivo}>{formulaActual}</span>
            ) : (
              <span style={estilos.formulaTextoVacio}>Selecciona dados para comenzar...</span>
            )}
          </div>
        </div>

        {/* Acciones de Lanzamiento */}
        <div style={estilos.contenedorAcciones}>
          <button onClick={limpiarBandeja} style={estilos.botonLimpiar}>
            Limpiar
          </button>
          <button
            onClick={manejarLanzamiento}
            disabled={!formulaActual}
            style={{
              ...estilos.botonLanzar,
              opacity: formulaActual ? 1 : 0.5,
              cursor: formulaActual ? "pointer" : "not-allowed",
              boxShadow: formulaActual ? "0 4px 15px hsl(43, 96%, 56%)33" : "none",
            }}
          >
            Lanzar en TaleSpire
          </button>
        </div>
      </div>
    </div>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  botonFlotante: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "hsl(240, 10%, 15%)",
    border: "2px solid hsl(43, 96%, 56%)",
    color: "#fff",
    fontSize: "1.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.05)",
    transition: "none",
    zIndex: 9999,
  },
  contenedorPanel: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "320px",
    borderRadius: "16px",
    backgroundColor: "rgba(18, 18, 22, 0.95)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
    color: "#cdd6f4",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9999,
    transition: "none",
  },
  cabecera: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    backgroundColor: "rgba(30, 30, 38, 0.5)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  titulo: {
    fontWeight: 600,
    fontSize: "1rem",
    letterSpacing: "0.5px",
    color: "#fff",
  },
  botonMinimizar: {
    background: "none",
    border: "none",
    color: "hsl(240, 5%, 65%)",
    fontSize: "0.9rem",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    transition: "none",
  },
  cuerpo: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  campoEntrada: {
    width: "100%",
  },
  inputEtiqueta: {
    width: "100%",
    backgroundColor: "hsl(240, 6%, 10%)",
    border: "1px solid hsl(240, 5%, 22%)",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#fff",
    fontSize: "0.85rem",
    outline: "none",
    transition: "none",
    boxSizing: "border-box",
  },
  grillaDados: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  tarjetaDado: {
    position: "relative",
    aspectRatio: "1/1",
    borderRadius: "10px",
    backgroundColor: "hsl(240, 6%, 13%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    outline: "none",
    transition: "none",
  },
  contadorDado: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: "bold",
    borderRadius: "10px",
    minWidth: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    boxSizing: "border-box",
  },
  nombreDado: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  },
  contenedorModificador: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "hsl(240, 6%, 12%)",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },
  labelMod: {
    fontSize: "0.85rem",
    color: "hsl(240, 5%, 70%)",
  },
  controlesMod: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  btnModControl: {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    backgroundColor: "hsl(240, 5%, 20%)",
    border: "none",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "none",
  },
  inputMod: {
    width: "36px",
    textAlign: "center",
    backgroundColor: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: "bold",
    outline: "none",
  },
  contenedorFormula: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  labelFormula: {
    fontSize: "0.8rem",
    color: "hsl(240, 5%, 60%)",
  },
  formulaValor: {
    minHeight: "36px",
    backgroundColor: "hsl(240, 6%, 8%)",
    border: "1px solid hsl(240, 5%, 16%)",
    borderRadius: "8px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
  },
  formulaTextoActivo: {
    color: "hsl(43, 96%, 56%)",
    fontWeight: "bold",
    fontSize: "0.95rem",
    fontFamily: "monospace",
  },
  formulaTextoVacio: {
    color: "hsl(240, 5%, 45%)",
    fontSize: "0.8rem",
    fontStyle: "italic",
  },
  contenedorAcciones: {
    display: "flex",
    gap: "10px",
    marginTop: "4px",
  },
  botonLimpiar: {
    flex: 1,
    padding: "10px",
    backgroundColor: "hsl(240, 5%, 18%)",
    border: "none",
    color: "hsl(240, 5%, 80%)",
    fontSize: "0.85rem",
    fontWeight: 600,
    borderRadius: "8px",
    cursor: "pointer",
    transition: "none",
  },
  botonLanzar: {
    flex: 2,
    padding: "10px",
    backgroundColor: "hsl(43, 96%, 45%)",
    backgroundImage: "linear-gradient(135deg, hsl(43, 96%, 52%), hsl(32, 95%, 48%))",
    border: "none",
    color: "#000",
    fontSize: "0.85rem",
    fontWeight: "bold",
    borderRadius: "8px",
    transition: "none",
  },
};
