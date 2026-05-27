import { usarBandejaDados, DadosBandeja } from "../hooks/usarBandejaDados";
import estilosClases from "./PanelDados.module.css";

export function PanelDados() {
  const {
    minimizado,
    setMinimizado,
    dados,
    modificador,
    setModificador,
    nombreTirada,
    setNombreTirada,
    tiposDados,
    agregarDado,
    removerDado,
    limpiarBandeja,
    construirFormula,
    manejarLanzamiento
  } = usarBandejaDados();

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

  const formulaActual = construirFormula();

  // Renderizar el botón flotante si está minimizado
  if (minimizado) {
    return (
      <button
        onClick={() => setMinimizado(false)}
        className={estilosClases.botonFlotante}
        title="Abrir Panel de Dados"
        type="button"
      >
        🎲
      </button>
    );
  }

  return (
    <div className={estilosClases.contenedorPanel}>
      {/* Cabecera del Panel */}
      <div className={estilosClases.cabecera}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>🎲</span>
          <span className={estilosClases.titulo}>Bandeja de Dados</span>
        </div>
        <button onClick={() => setMinimizado(true)} className={estilosClases.botonMinimizar} type="button">
          ✕
        </button>
      </div>

      {/* Cuerpo del Panel */}
      <div className={estilosClases.cuerpo}>
        {/* Entrada del Nombre de Tirada */}
        <div className={estilosClases.campoEntrada}>
          <input
            type="text"
            placeholder="Etiqueta de la tirada (ej. Daño de Fuego)"
            value={nombreTirada}
            onChange={(e) => setNombreTirada(e.target.value)}
            className={estilosClases.inputEtiqueta}
          />
        </div>

        {/* Grilla de Dados */}
        <div className={estilosClases.grillaDados}>
          {tiposDados.map((tipo) => {
            const cantidad = dados[tipo];
            const color = coloresDados[tipo];
            return (
              <button
                key={tipo}
                onClick={() => agregarDado(tipo)}
                onContextMenu={(e) => removerDado(tipo, e)}
                className={estilosClases.tarjetaDado}
                style={{
                  border: cantidad > 0 ? `2px solid ${color}` : "2px solid hsl(240, 5%, 26%)",
                  boxShadow: cantidad > 0 ? `0 0 10px ${color}33` : "none",
                }}
                title={`Click izquierdo: Añadir ${tipo.toUpperCase()} | Click derecho: Quitar`}
                type="button"
              >
                {cantidad > 0 && (
                  <span className={estilosClases.contadorDado} style={{ backgroundColor: color }}>
                    {cantidad}
                  </span>
                )}
                <span
                  className={estilosClases.nombreDado}
                  style={{ color: cantidad > 0 ? color : "hsl(240, 5%, 75%)" }}
                >
                  {tipo.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modificador Rápido */}
        <div className={estilosClases.contenedorModificador}>
          <span className={estilosClases.labelMod}>Modificador:</span>
          <div className={estilosClases.controlesMod}>
            <button onClick={() => setModificador((m) => m - 1)} className={estilosClases.btnModControl} type="button">
              -
            </button>
            <input
              type="number"
              value={modificador}
              onChange={(e) => setModificador(parseInt(e.target.value, 10) || 0)}
              className={estilosClases.inputMod}
            />
            <button onClick={() => setModificador((m) => m + 1)} className={estilosClases.btnModControl} type="button">
              +
            </button>
          </div>
        </div>

        {/* Visualizador de Fórmula */}
        <div className={estilosClases.contenedorFormula}>
          <span className={estilosClases.labelFormula}>Fórmula a lanzar:</span>
          <div className={estilosClases.formulaValor}>
            {formulaActual ? (
              <span className={estilosClases.formulaTextoActivo}>{formulaActual}</span>
            ) : (
              <span className={estilosClases.formulaTextoVacio}>Selecciona dados para comenzar...</span>
            )}
          </div>
        </div>

        {/* Acciones de Lanzamiento */}
        <div className={estilosClases.contenedorAcciones}>
          <button onClick={limpiarBandeja} className={estilosClases.botonLimpiar} type="button">
            Limpiar
          </button>
          <button
            onClick={manejarLanzamiento}
            disabled={!formulaActual}
            className={estilosClases.botonLanzar}
            style={{
              opacity: formulaActual ? 1 : 0.5,
              cursor: formulaActual ? "pointer" : "not-allowed",
              boxShadow: formulaActual ? "0 4px 15px hsl(43, 96%, 56%)33" : "none",
            }}
            type="button"
          >
            Lanzar en TaleSpire
          </button>
        </div>
      </div>
    </div>
  );
}
