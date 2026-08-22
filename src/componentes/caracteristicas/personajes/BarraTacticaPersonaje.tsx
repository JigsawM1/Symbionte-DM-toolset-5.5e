import React, { useState } from "react";
import { SelectorSugerencias } from "@/componentes/comunes/SelectorSugerencias";
import { CONDICIONES_2024 } from "@/utiles/datosIniciales";
import { obtenerDetalleCondicion } from "@/servicios/resolutorCondiciones";
import { X, Moon, Sunrise } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

export type ModoTirada = "disv" | "plano" | "vent";

interface BarraTacticaPersonajeProps {
  modoTirada: ModoTirada;
  condicionesActivas: string[];
  alCambiarModoTirada: (modo: ModoTirada) => void;
  alEjecutarDescansoCorto: () => void;
  alEjecutarDescansoLargo: () => void;
  alAplicarCondicion: (condicion: string) => void;
  alQuitarCondicion: (condicion: string) => void;
}

export const BarraTacticaPersonaje: React.FC<BarraTacticaPersonajeProps> = ({
  modoTirada,
  condicionesActivas,
  alCambiarModoTirada,
  alEjecutarDescansoCorto,
  alEjecutarDescansoLargo,
  alAplicarCondicion,
  alQuitarCondicion
}) => {
  const [condicionSeleccionada, setCondicionSeleccionada] = useState("");

  const sugerenciasCondiciones = CONDICIONES_2024.map((c) => c.nombre);


  return (
    <section className={`${estilos.neoRaised} ${estilos.seccionBarraTactica}`}>
      {/* Columna Izquierda: Descansos y Modulador de Tiradas */}
      <div className={estilos.columnaControlesTacticos}>
        <div className={estilos.filaDescansosVentaja}>
          {/* Botones de Descanso */}
          <div className={`${estilos.grupoBotonesPill} ${estilos.neoPressed}`}>
            <button
              type="button"
              className={estilos.botonPill}
              onClick={alEjecutarDescansoCorto}
              title="Descanso Corto (Gastar dados de golpe para curar)"
            >
              <Moon size={11} style={{ marginRight: 2 }} />
              Corto
            </button>
            <button
              type="button"
              className={estilos.botonPill}
              onClick={alEjecutarDescansoLargo}
              title="Descanso Largo (Restaurar HP, dados y reducir cansancio)"
            >
              <Sunrise size={11} style={{ marginRight: 2 }} />
              Largo
            </button>
          </div>

          {/* Selector de Ventaja/Desventaja */}
          <div className={`${estilos.grupoBotonesPill} ${estilos.neoPressed}`}>
            <button
              type="button"
              className={`${estilos.botonPill} ${modoTirada === "disv" ? estilos.botonPillActivo : ""}`}
              onClick={() => alCambiarModoTirada("disv")}
              title="Tirar con Desventaja (2d20 menor)"
            >
              Disv
            </button>
            <button
              type="button"
              className={`${estilos.botonPill} ${modoTirada === "plano" ? estilos.botonPillActivo : ""}`}
              onClick={() => alCambiarModoTirada("plano")}
              title="Tirada normal plana (1d20)"
            >
              Plano
            </button>
            <button
              type="button"
              className={`${estilos.botonPill} ${modoTirada === "vent" ? estilos.botonPillActivo : ""}`}
              onClick={() => alCambiarModoTirada("vent")}
              title="Tirar con Ventaja (2d20 mayor)"
            >
              Vent
            </button>
          </div>
        </div>

        {/* Selector de Condiciones y Efectos con autocompletado */}
        <div>
          <SelectorSugerencias
            valor={condicionSeleccionada}
            alCambiar={(val) => {
              if (val && sugerenciasCondiciones.includes(val)) {
                alAplicarCondicion(val);
                setCondicionSeleccionada("");
              } else {
                setCondicionSeleccionada(val);
              }
            }}
            opciones={sugerenciasCondiciones}
            placeholder="Añadir Condición o Estado..."
          />
        </div>
      </div>

      {/* Columna Derecha: Condiciones Activas */}
      <div className={`${estilos.columnaCondicionesActivas} ${estilos.neoPressed}`}>
        <span className={estilos.tituloCondicionesActivas}>Condiciones Activas</span>
        <div className={estilos.listaChipsCondiciones}>
          {condicionesActivas.length > 0 ? (
            condicionesActivas.map((cond) => {
              const detalle = obtenerDetalleCondicion(cond);
              const tooltip =
                detalle.efectos && detalle.efectos.length > 0
                  ? `${detalle.titulo}\n\n${detalle.efectos.map((e) => `• ${e}`).join("\n")}`
                  : `${detalle.titulo}: ${detalle.descripcion}`;

              return (
                <span
                  key={cond}
                  className={estilos.chipCondicion}
                  title={tooltip}
                >
                  {cond}
                  <button
                    type="button"
                    className={estilos.chipBotonCerrar}
                    onClick={() => alQuitarCondicion(cond)}
                    title={`Quitar condición ${cond}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })
          ) : (
            <span className={estilos.textoSinCondiciones}>Sin estados alterados</span>
          )}
        </div>
      </div>
    </section>
  );
};
