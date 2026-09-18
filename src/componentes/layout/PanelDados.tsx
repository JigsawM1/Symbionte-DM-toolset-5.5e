import { Dices, X } from "lucide-react";
import { usarBandejaDados } from "@/hooks/usarBandejaDados";
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
        <Dices size={20} />
      </button>
    );
  }

  return (
    <div className={estilosClases.contenedorPanel}>
      {/* Cabecera del Panel */}
      <div className={estilosClases.cabecera}>
        <div className="u-flex u-alinear-centro u-gap-lg">
          <Dices size={18} className={estilosClases.iconoBandeja} />
          <span className={estilosClases.titulo}>Bandeja de Dados</span>
        </div>
        <button onClick={() => setMinimizado(true)} className={estilosClases.botonMinimizar} type="button" title="Minimizar panel">
          <X size={14} />
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
            const claseTipoDado = estilosClases[`tarjetaDado_${tipo}` as keyof typeof estilosClases] || "";
            const claseEstado = cantidad > 0 ? estilosClases.tarjetaDadoActivo : estilosClases.tarjetaDadoInactivo;
            return (
              <button
                key={tipo}
                onClick={() => agregarDado(tipo)}
                onContextMenu={(e) => removerDado(tipo, e)}
                className={`${estilosClases.tarjetaDado} ${claseTipoDado} ${claseEstado}`}
                title={`Click izquierdo: Añadir ${tipo.toUpperCase()} | Click derecho: Quitar`}
                type="button"
              >
                {cantidad > 0 && (
                  <span className={estilosClases.contadorDado}>
                    {cantidad}
                  </span>
                )}
                <span className={estilosClases.nombreDado}>
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
            className={`${estilosClases.botonLanzar} ${
              formulaActual ? estilosClases.botonLanzarHabilitado : estilosClases.botonLanzarDeshabilitado
            }`}
            type="button"
          >
            Lanzar en TaleSpire
          </button>
        </div>
      </div>
    </div>
  );
}
