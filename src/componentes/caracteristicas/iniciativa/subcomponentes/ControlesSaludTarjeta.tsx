import React, { useState, useRef, useEffect } from "react";
import { Heart } from "lucide-react";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import estilosClases from "../TarjetaCriaturaIniciativa.module.css";

interface ControlesSaludTarjetaProps {
  criaturaId: string;
  vidaActualMostrar: number;
  vidaMaximaMostrar: number;
  vidaTemporalMostrar: number;
  vidaTotalHordaActual: number;
  vidaTotalHordaMaxima: number;
  indiceBarraActiva?: number;
  estaMuerto: boolean;
  onCurar: (cantidad: number) => void;
  onDañar: (cantidad: number) => void;
  onCambiarTempHP: (cantidad: number) => void;
  onEstablecerVidaMaxima?: (nuevaVidaMaxima: number) => void;
}

export const ControlesSaludTarjeta: React.FC<ControlesSaludTarjetaProps> = React.memo(({
  criaturaId,
  vidaActualMostrar,
  vidaMaximaMostrar,
  vidaTemporalMostrar,
  vidaTotalHordaActual,
  vidaTotalHordaMaxima,
  indiceBarraActiva,
  estaMuerto,
  onCurar,
  onDañar,
  onCambiarTempHP,
  onEstablecerVidaMaxima
}) => {
  const [hpInput, setHpInput] = useState("");
  const [editandoVidaMaxima, setEditandoVidaMaxima] = useState(false);
  const refInputVidaMaxima = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editandoVidaMaxima && refInputVidaMaxima.current) {
      refInputVidaMaxima.current.focus();
      refInputVidaMaxima.current.select();
    }
  }, [editandoVidaMaxima]);

  const ejecutarCambioVida = (aplicar: (cantidad: number) => void) => {
    const valor = Number(hpInput);
    if (!isNaN(valor) && valor > 0) {
      aplicar(valor);
      setHpInput("");
    }
  };

  return (
    <div className={estilosClases.cajaControlesSaludTarjetas}>
      <div
        className={estilosClases.filaHPArea}
        title={
          indiceBarraActiva !== undefined
            ? `Editando unidad #${indiceBarraActiva + 1} (Total horda: ${vidaTotalHordaActual}/${vidaTotalHordaMaxima} PG)`
            : undefined
        }
      >
        <Heart
          size={12}
          fill={estaMuerto ? "none" : "var(--color-peligro)"}
          className={estilosClases.iconoCorazonPeligro}
        />
        <span className={estilosClases.hpGiganteTexto}>
          {indiceBarraActiva !== undefined ? `#${indiceBarraActiva + 1} ${vidaActualMostrar}` : vidaActualMostrar}{" "}
          {editandoVidaMaxima ? (
            <span className={estilosClases.textoVidaMaxima}>
              /{" "}
              <CampoNumerico
                ref={refInputVidaMaxima}
                min="1"
                value={vidaMaximaMostrar}
                alConfirmar={(valor) => onEstablecerVidaMaxima?.(valor)}
                onBlur={() => setEditandoVidaMaxima(false)}
                className={estilosClases.inputVidaMaximaEditable}
                identidad={criaturaId}
              />
            </span>
          ) : (
            <span
              onClick={onEstablecerVidaMaxima ? () => setEditandoVidaMaxima(true) : undefined}
              className={`${estilosClases.textoVidaMaxima} ${onEstablecerVidaMaxima ? estilosClases.textoVidaMaximaEditable : ""}`}
              title={onEstablecerVidaMaxima ? "Clic para editar vida máxima" : undefined}
            >
              / {vidaMaximaMostrar}
            </span>
          )}
        </span>
        {vidaTemporalMostrar > 0 ? (
          <span className={estilosClases.tagHPTemporal}>+{vidaTemporalMostrar}</span>
        ) : null}
      </div>

      <div className={estilosClases.inputsSaludFila}>
        <div className={estilosClases.controlHPVertical}>
          <BotonNumerico
            onClick={() => ejecutarCambioVida(onCurar)}
            className={estilosClases.botonCurarVertical}
            title="Aplicar Curación"
          >
            CURAR
          </BotonNumerico>
          <CampoNumerico
            placeholder="0"
            min="0"
            value={hpInput}
            identidad={criaturaId}
            alConfirmar={(valor) => setHpInput(String(valor))}
            onKeyDown={(e) => {
              if (e.key === "Enter") ejecutarCambioVida(onDañar);
            }}
            className={estilosClases.inputHPVertical}
            alVaciar={() => setHpInput("")}
          />
          <BotonNumerico
            onClick={() => ejecutarCambioVida(onDañar)}
            className={estilosClases.botonDañoVertical}
            title="Aplicar Daño"
          >
            DAÑO
          </BotonNumerico>
        </div>

        <div className={estilosClases.cajaTempVertical}>
          <span className={estilosClases.etiquetaTempVertical}>TEMP</span>
          <CampoNumerico
            placeholder="0"
            min="0"
            value={vidaTemporalMostrar}
            alConfirmar={onCambiarTempHP}
            className={estilosClases.inputTempVertical}
            title="Vida Temporal"
            identidad={criaturaId}
          />
        </div>
      </div>
    </div>
  );
});

ControlesSaludTarjeta.displayName = "ControlesSaludTarjeta";
