import React, { useState, useEffect } from "react";
import type { PersonajeJugador, Caracteristica } from "@/tipos";
import { CARACTERISTICAS_CLAVES } from "@/constantes";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import estilos from "./HojaPersonaje.module.css";

interface PanelAtributosPersonajeProps {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  alTirarCaracteristica: (carac: Caracteristica, nombre: string, bono: number) => void;
  alTirarSalvacion: (carac: Caracteristica, nombre: string, bono: number) => void;
  alAlternarSalvacion: (carac: Caracteristica) => void;
  alModificarCaracteristicaBase: (carac: Caracteristica, valor: number) => void;
}

export const PanelAtributosPersonaje: React.FC<PanelAtributosPersonajeProps> = ({
  personaje,
  statsCalculadas,
  alTirarCaracteristica,
  alTirarSalvacion,
  alAlternarSalvacion,
  alModificarCaracteristicaBase
}) => {
  const { modificadores, salvaciones, pasivas } = statsCalculadas;

  // Estado local para permitir escribir libremente y dejar el campo vacío antes de confirmar
  const [valoresLocales, setValoresLocales] = useState<Record<Caracteristica, string>>({
    fuerza: String(personaje.caracteristicas?.fuerza ?? 10),
    destreza: String(personaje.caracteristicas?.destreza ?? 10),
    constitucion: String(personaje.caracteristicas?.constitucion ?? 10),
    inteligencia: String(personaje.caracteristicas?.inteligencia ?? 10),
    sabiduria: String(personaje.caracteristicas?.sabiduria ?? 10),
    carisma: String(personaje.caracteristicas?.carisma ?? 10)
  });

  useEffect(() => {
    setValoresLocales({
      fuerza: String(personaje.caracteristicas?.fuerza ?? 10),
      destreza: String(personaje.caracteristicas?.destreza ?? 10),
      constitucion: String(personaje.caracteristicas?.constitucion ?? 10),
      inteligencia: String(personaje.caracteristicas?.inteligencia ?? 10),
      sabiduria: String(personaje.caracteristicas?.sabiduria ?? 10),
      carisma: String(personaje.caracteristicas?.carisma ?? 10)
    });
  }, [personaje.caracteristicas]);

  const manejarGuardarAtributo = (carac: Caracteristica) => {
    const valNum = parseInt(valoresLocales[carac], 10);
    if (!isNaN(valNum) && valNum >= 1 && valNum <= 30) {
      alModificarCaracteristicaBase(carac, valNum);
    } else {
      // Si el campo quedó vacío o inválido, restablecer al valor anterior
      setValoresLocales((prev) => ({
        ...prev,
        [carac]: String(personaje.caracteristicas?.[carac] ?? 10)
      }));
    }
  };

  return (
    <section className={estilos.filaAtributosSentidos}>
      {/* Cuadrícula 3x2 de Características */}
      <div className={estilos.gridAtributos}>
        {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => {
          const carac = clave as Caracteristica;
          const override = personaje.overridesFijos?.[carac];
          const mod = modificadores[carac] || 0;
          const modTexto = mod >= 0 ? `+${mod}` : `${mod}`;
          const bonoSalvacion = salvaciones[carac] || 0;
          const salvTexto = bonoSalvacion >= 0 ? `+${bonoSalvacion}` : `${bonoSalvacion}`;
          const tieneCompetenciaSalv = personaje.competenciasSalvacion?.[carac] || false;

          return (
            <div
              key={carac}
              className={`${estilos.neoRaised} ${estilos.tarjetaAtributo}`}
              onClick={() => alTirarCaracteristica(carac, etiqueta, mod)}
              title={`Prueba de ${etiqueta} (${modTexto}). Haz clic para tirar en 3D.`}
            >
              <span className={estilos.nombreAtributo}>{etiqueta}</span>

              <div className={`${estilos.circuloModificador} ${estilos.neoPressed}`}>
                <span className={estilos.textoModificador}>{modTexto}</span>
              </div>

              {/* Input numérico directo sin flechas, editable libremente al estilo de la vida */}
              <input
                type="number"
                className={estilos.badgePuntuacionBase}
                value={override !== null && override !== undefined ? override : valoresLocales[carac]}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const texto = e.target.value;
                  setValoresLocales((prev) => ({ ...prev, [carac]: texto }));
                }}
                onBlur={() => manejarGuardarAtributo(carac)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    manejarGuardarAtributo(carac);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                title={
                  override !== null && override !== undefined
                    ? `Override fijo activo: ${override}. Modifica en configuración.`
                    : "Puntuación base. Escribe para modificar directamente."
                }
              />

              {/* Fila de Salvación: Check aislado a la izquierda y Tirada a la derecha */}
              <div
                className={estilos.filaSalvacionAtributo}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Botón exclusivo para alternar el check de salvación */}
                <button
                  type="button"
                  className={estilos.botonToggleSalvacion}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alAlternarSalvacion(carac);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={
                    tieneCompetenciaSalv
                      ? "Competente en Salvación (Clic para desactivar)"
                      : "Sin competencia (Clic para activar)"
                  }
                >
                  <div
                    className={`${estilos.puntoCompetenciaSalvacion} ${
                      tieneCompetenciaSalv ? estilos.puntoCompetenciaActivo : ""
                    }`}
                  />
                </button>

                {/* Botón exclusivo para la tirada 3D de salvación */}
                <button
                  type="button"
                  className={`${estilos.botonTextoSalvacion} ${
                    tieneCompetenciaSalv ? estilos.textoSalvacionCompetente : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alTirarSalvacion(carac, `Salvación de ${etiqueta}`, bonoSalvacion);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={`Tirada de Salvación de ${etiqueta} (${salvTexto}). Clic para tirar en 3D.`}
                >
                  {salvTexto} Salv.
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel Lateral: Sentidos Pasivos con justify-content: center */}
      <div className={`${estilos.neoRaised} ${estilos.panelSentidosPasivos}`}>
        <span className={estilos.tituloPanelLateral}>Sentidos Pasivos</span>

        <div className={`${estilos.itemSentidoPasivo} ${estilos.neoPressed}`}>
          <span className={estilos.valorSentidoPasivo}>{pasivas.percepcion}</span>
          <span className={estilos.labelSentidoPasivo}>Percepción<br />Pasiva</span>
        </div>

        <div className={`${estilos.itemSentidoPasivo} ${estilos.neoPressed}`}>
          <span className={estilos.valorSentidoPasivo}>{pasivas.investigacion}</span>
          <span className={estilos.labelSentidoPasivo}>Investigación<br />Pasiva</span>
        </div>

        <div className={`${estilos.itemSentidoPasivo} ${estilos.neoPressed}`}>
          <span className={estilos.valorSentidoPasivo}>{pasivas.perspicacia}</span>
          <span className={estilos.labelSentidoPasivo}>Perspicacia<br />Pasiva</span>
        </div>
      </div>
    </section>
  );
};
