import React, { useState } from "react";
import { SelectorSugerencias, ChipCondicion } from "@/componentes/comunes";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import { Moon, Sunrise } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

export type ModoTirada = "disv" | "plano" | "vent";

interface BarraTacticaPersonajeProps {
  modoTirada: ModoTirada;
  condicionesActivas: string[];
  hpActual: number;
  hpMaximo: number;
  alCambiarModoTirada: (modo: ModoTirada) => void;
  alEjecutarDescansoCorto: () => void;
  alEjecutarDescansoLargo: () => void;
  alAplicarCondicion: (condicion: string) => void;
  alQuitarCondicion: (condicion: string) => void;
}

export const BarraTacticaPersonaje: React.FC<BarraTacticaPersonajeProps> = ({
  modoTirada,
  condicionesActivas,
  hpActual,
  hpMaximo,
  alCambiarModoTirada,
  alEjecutarDescansoCorto,
  alEjecutarDescansoLargo,
  alAplicarCondicion,
  alQuitarCondicion
}) => {
  const [condicionSeleccionada, setCondicionSeleccionada] = useState("");

  const sugerenciasCondiciones = [
    ...CONDICIONES_2024.map((c) => c.nombre),
    ...EFECTOS_PREDEFINIDOS.map((e) => e.nombre)
  ];

  // Estado automático de sangrado: vida actual menor al 50% del máximo efectivo
  const estaDesangrandose = hpActual > 0 && hpActual < hpMaximo / 2;
  const hayCondicionesOEstados = condicionesActivas.length > 0 || estaDesangrandose;

  return (
    <section className={`${estilos.neoRaised} ${estilos.seccionBarraTactica}`}>
      {/* Columna Izquierda: Descansos y Modulador de Tiradas */}
      <div className={estilos.columnaControlesTacticos}>
        <div className={estilos.filaDescansosVentaja}>
          {/* Botones de Descanso */}
          <div className={`${estilos.grupoBotonesPill} ${estilos.neoPressed}`}>
            <button
              type="button"
              className={`${estilos.botonPill} ${estilos.botonPillDescansoCorto}`}
              onClick={alEjecutarDescansoCorto}
              title="Descanso Corto (Gastar dados de golpe para curar)"
            >
              <Moon size={11} style={{ marginRight: 2 }} />
              Corto
            </button>
            <button
              type="button"
              className={`${estilos.botonPill} ${estilos.botonPillDescansoLargo}`}
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
              className={`${estilos.botonPill} ${estilos.botonPillDisv} ${
                modoTirada === "disv" ? estilos.botonPillActivoDisv : ""
              }`}
              onClick={() => alCambiarModoTirada("disv")}
              title="Tirar con Desventaja (2d20 menor)"
            >
              Disv
            </button>
            <button
              type="button"
              className={`${estilos.botonPill} ${
                modoTirada === "plano" ? estilos.botonPillActivoPlano : ""
              }`}
              onClick={() => alCambiarModoTirada("plano")}
              title="Tirada normal plana (1d20)"
            >
              Plano
            </button>
            <button
              type="button"
              className={`${estilos.botonPill} ${estilos.botonPillVent} ${
                modoTirada === "vent" ? estilos.botonPillActivoVent : ""
              }`}
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

      {/* Columna Derecha: Condiciones Activas y Sangrado Automático */}
      <div className={`${estilos.columnaCondicionesActivas} ${estilos.neoPressed}`}>
        <span className={estilos.tituloCondicionesActivas}>Condiciones Activas</span>
        <div className={estilos.listaChipsCondiciones}>
          {hayCondicionesOEstados ? (
            <>
              {/* Chip automático de Desangrándose (<50% de HP) */}
              {estaDesangrandose && (
                <ChipCondicion
                  nombre="Desangrándose"
                  esDesangrado
                  alineacionTooltip="derecha"
                />
              )}

              {/* Condiciones manuales y de cansancio */}
              {condicionesActivas.map((cond) => (
                <ChipCondicion
                  key={cond}
                  nombre={cond}
                  alineacionTooltip="derecha"
                  onQuitar={() => alQuitarCondicion(cond)}
                />
              ))}
            </>
          ) : (
            <span className={estilos.textoSinCondiciones}>Sin estados alterados</span>
          )}
        </div>
      </div>
    </section>
  );
};
