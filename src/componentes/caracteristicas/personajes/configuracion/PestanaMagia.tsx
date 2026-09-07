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
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            Habilitar Lanzamiento de Conjuros
          </span>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
            Activa la pestaña de conjuros, espacios de magia y reserva de maná.
          </p>
        </div>

        <input
          type="checkbox"
          checked={form.esLanzador}
          onChange={(e) => alAlternarEsLanzador(e.target.checked)}
          style={{ width: 18, height: 18, cursor: "pointer" }}
        />
      </div>

      {form.esLanzador && (
        <>
          {/* Configuración de Clases Lanzadoras */}
          <div className={estilos.seccionClasesLanzadoras}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", textTransform: "uppercase" }}>
                Clases Lanzadoras de Magia
              </span>

              <button
                type="button"
                onClick={alAgregarClaseLanzadora}
                style={{
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(96, 165, 250, 0.3)",
                  borderRadius: 4,
                  color: "#93c5fd",
                  fontSize: 11,
                  padding: "3px 8px",
                  cursor: "pointer"
                }}
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
                  className={estilos.inputFormulario}
                  style={{ height: 32, fontSize: 11 }}
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
                  className={estilos.inputFormulario}
                  style={{ height: 32, fontSize: 11, textAlign: "center" }}
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
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    padding: 4
                  }}
                  title="Eliminar clase"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Overrides Manuales de Espacios */}
          <div className={estilos.seccionOverridesEspacios}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", textTransform: "uppercase" }}>
              Overrides Manuales de Espacios de Conjuro
            </span>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
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
                    <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
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
                      className={estilos.inputFormulario}
                      style={{ height: 30, fontSize: 11, padding: 4, textAlign: "center" }}
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
