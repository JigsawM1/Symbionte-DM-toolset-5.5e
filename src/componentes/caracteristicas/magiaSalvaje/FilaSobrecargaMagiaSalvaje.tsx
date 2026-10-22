import React from "react";
import { Sparkles } from "lucide-react";
import type { EntradaMagiaSalvaje } from "@/servicios/magiaSalvaje/servicioMagiaSalvaje";
import estilos from "./MagiaSalvaje.module.css";
import type { ResultadoSubtirada } from "@/tipos";
import { ResultadosSubtiradas } from "./ResultadosSubtiradas";
import { TextoEnriquecidoDND } from "@/componentes/comunes/TextoEnriquecidoDND";

interface FilaSobrecargaMagiaSalvajeProps {
  entrada: EntradaMagiaSalvaje;
  esActiva: boolean;
  subtiradasResultado?: ResultadoSubtirada[];
  modoSeleccionDomada?: boolean;
  elegible?: boolean;
  alElegirDomada?: (entrada: EntradaMagiaSalvaje) => void;
}

export const FilaSobrecargaMagiaSalvaje: React.FC<FilaSobrecargaMagiaSalvajeProps> = ({
  entrada,
  esActiva,
  subtiradasResultado,
  modoSeleccionDomada = false,
  elegible = true,
  alElegirDomada
}) => {
  const rangoTexto = `${entrada.desde.toString().padStart(2, "0")}-${entrada.hasta === 100 ? "00" : entrada.hasta.toString().padStart(2, "0")}`;
  const subtabla = entrada.subtiradas?.[0];

  return (
    <article
      id={`sobrecarga-${entrada.desde}`}
      tabIndex={-1}
      aria-label={`${rangoTexto}: ${entrada.titulo}`}
      className={`${estilos.filaItem} ${esActiva ? estilos.filaItemActiva : ""}`}
    >
      <div className={estilos.columnaDado}>
        <div className={estilos.cajaRango}>{rangoTexto}</div>
        {modoSeleccionDomada && (
          <button
            type="button"
            disabled={!elegible}
            onClick={() => alElegirDomada?.(entrada)}
            className={estilos.botonActivarFila}
            title={elegible ? "Elegir este efecto" : "La acción no permite elegir esta fila"}
          >
            {elegible ? "ELEGIR" : "EXCLUIDO"}
          </button>
        )}
      </div>

      <div className={estilos.columnaContenido}>
        <div className={estilos.cabeceraFila}>
          <h4 className={estilos.tituloFila}>{entrada.titulo}</h4>
          {esActiva && <span className={estilos.badgeActual}>Último resultado</span>}
          {entrada.badge && <span className={estilos.badgePropiedad}>{entrada.badge}</span>}
        </div>

        <TextoEnriquecidoDND texto={entrada.texto} className={estilos.descripcionFila} />
        {esActiva && <ResultadosSubtiradas resultados={subtiradasResultado} />}

        {subtabla?.opciones && (
          <details className={estilos.cajaSubtabla}>
            <summary className={estilos.cabeceraSubtabla}>
              <Sparkles size={12} aria-hidden="true" />
              {subtabla.titulo ?? `Opciones de ${subtabla.formula}`} · {subtabla.formula}
            </summary>

            <div className={estilos.gridOpciones}>
              {subtabla.opciones.map((op) => (
                <div
                  key={op.numero}
                  className={estilos.itemOpcion}
                >
                  <span className={estilos.numeroOpcion}>{op.numero}</span>
                  <span className={estilos.textoOpcion}>{op.texto}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </article>
  );
};
