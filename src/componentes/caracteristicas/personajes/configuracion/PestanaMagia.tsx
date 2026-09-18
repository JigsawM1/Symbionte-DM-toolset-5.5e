import React from "react";
import { X } from "lucide-react";
import type { PersonajeJugador, Caracteristica, TipoLanzador, ClaseLanzadora } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import estilos from "./ConfiguracionPersonaje.module.css";

export interface PestanaMagiaProps {
  form: PersonajeJugador;
  alAlternarEsLanzador: (nuevoEsLanzador: boolean) => void;
  alAgregarClaseLanzadora: () => void;
  alActualizarClaseLanzadora: (
    index: number,
    campo: keyof ClaseLanzadora,
    valor: string | number
  ) => void;
  alEliminarClaseLanzadora: (index: number) => void;
  alActualizarOverrideEspacios: (nivel: number, cantidad: number) => void;
}

/**
 * Pestaña de Configuración Mágica:
 * Interruptor de aptitud mágica, clases lanzadoras configurables y overrides manuales de espacios de conjuro por nivel.
 */
export const PestanaMagia: React.FC<PestanaMagiaProps> = ({
  form,
  alAlternarEsLanzador,
  alAgregarClaseLanzadora,
  alActualizarClaseLanzadora,
  alEliminarClaseLanzadora,
  alActualizarOverrideEspacios
}) => {
  return (
    <>
      {/* Interruptor de Lanzador */}
      <div className={estilos.tarjetaMagiaCaja}>
        <div>
          <span className={estilos.tituloInterruptorMagia}>
            Habilitar Lanzamiento de Conjuros
          </span>
          <p className={estilos.descripcionInterruptorMagia}>
            Activa la pestaña de conjuros, espacios de magia y reserva de maná.
          </p>
        </div>

        <input
          type="checkbox"
          checked={form.esLanzador}
          onChange={(e) => alAlternarEsLanzador(e.target.checked)}
          className={estilos.checkboxInterruptorMagia}
        />
      </div>

      {form.esLanzador && (
        <>
          {/* Configuración de Clases Lanzadoras */}
          <div className={estilos.seccionClasesLanzadoras}>
            <div className={estilos.cabeceraClasesLanzadoras}>
              <span className={estilos.tituloClasesLanzadoras}>
                Clases Lanzadoras de Magia
              </span>

              <button
                type="button"
                onClick={alAgregarClaseLanzadora}
                className={estilos.botonAnadirClaseLanzadora}
              >
                + Añadir Clase
              </button>
            </div>

            {(form.clasesLanzadoras || []).map((claseItem, idx) => (
              <div key={`clase-lan-${idx}`} className={estilos.filaClaseLanzadora}>
                {/* Nombre de la clase */}
                <input
                  type="text"
                  value={claseItem.clase}
                  onChange={(e) => alActualizarClaseLanzadora(idx, "clase", e.target.value)}
                  placeholder="Clase"
                  className={`${estilos.inputFormulario} ${estilos.inputClaseLanzadora}`}
                />

                {/* Nivel en la clase */}
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={claseItem.nivel}
                  onChange={(e) =>
                    alActualizarClaseLanzadora(idx, "nivel", parseInt(e.target.value, 10) || 1)
                  }
                  className={`${estilos.inputFormulario} ${estilos.inputNivelLanzador}`}
                />

                {/* Tipo de lanzador */}
                <SelectorDesplegable<TipoLanzador>
                  valor={claseItem.tipoLanzador}
                  alCambiar={(val) => alActualizarClaseLanzadora(idx, "tipoLanzador", val)}
                  tamano="compacto"
                  opciones={[
                    { valor: "completo", etiqueta: "Completo (×1)" },
                    { valor: "medio", etiqueta: "Medio (÷2)" },
                    { valor: "tercio", etiqueta: "Tercio (÷3)" },
                    { valor: "pacto", etiqueta: "Pacto (Brujo)" }
                  ]}
                />

                {/* Habilidad de conjuro */}
                <SelectorDesplegable<Caracteristica>
                  valor={claseItem.habilidadConjuro || "inteligencia"}
                  alCambiar={(val) => alActualizarClaseLanzadora(idx, "habilidadConjuro", val)}
                  tamano="compacto"
                  opciones={[
                    { valor: "inteligencia", etiqueta: "Inteligencia" },
                    { valor: "sabiduria", etiqueta: "Sabiduría" },
                    { valor: "carisma", etiqueta: "Carisma" }
                  ]}
                />

                {/* Botón Eliminar */}
                <button
                  type="button"
                  onClick={() => alEliminarClaseLanzadora(idx)}
                  className={estilos.botonEliminarClaseLanzadora}
                  title="Eliminar clase"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Overrides Manuales de Espacios */}
          <div className={estilos.seccionOverridesEspacios}>
            <span className={estilos.tituloOverridesEspacios}>
              Overrides Manuales de Espacios de Conjuro
            </span>
            <p className={estilos.descripcionOverridesEspacios}>
              Establece cantidades fijas por nivel si juegas con reglas caseras o deseas modificar los calculados.
            </p>

            <div className={estilos.gridOverridesEspacios}>
              {Array.from({ length: 9 }).map((_, i) => {
                const nv = i + 1;
                const valActual =
                  form.overrideEspaciosConjuro?.[String(nv)] ??
                  form.espaciosConjuroMaximos?.[String(nv)] ??
                  0;

                return (
                  <div key={`override-nv-${nv}`} className={estilos.itemOverrideEspacio}>
                    <span className={estilos.etiquetaNivelOverride}>
                      Nivel {nv}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={valActual}
                      onChange={(e) => {
                        const cant = parseInt(e.target.value, 10) || 0;
                        alActualizarOverrideEspacios(nv, cant);
                      }}
                      className={`${estilos.inputFormulario} ${estilos.inputCantidadOverride}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};
