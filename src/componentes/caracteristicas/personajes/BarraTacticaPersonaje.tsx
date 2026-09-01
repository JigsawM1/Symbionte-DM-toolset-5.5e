import React, { useState } from "react";
import { SelectorSugerencias, ChipCondicion } from "@/componentes/comunes";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import type { PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import type { ConcentracionActiva } from "@/tipos";
import { Moon, Sunrise } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

export type ModoTirada = "disv" | "plano" | "vent";

interface BarraTacticaPersonajeProps {
  modoTirada: ModoTirada;
  condicionesActivas: string[];
  hpActual: number;
  hpMaximo: number;
  penalizacionArmadura?: PenalizacionArmadura | null;
  desventajaSigiloArmadura?: boolean;
  concentracionActiva?: ConcentracionActiva | null;
  alCambiarModoTirada: (modo: ModoTirada) => void;
  alEjecutarDescansoCorto: () => void;
  alEjecutarDescansoLargo: () => void;
  alAplicarCondicion: (condicion: string) => void;
  alQuitarCondicion: (condicion: string) => void;
  alRomperConcentracion?: () => void;
}

export const BarraTacticaPersonaje: React.FC<BarraTacticaPersonajeProps> = ({
  modoTirada,
  condicionesActivas,
  hpActual,
  hpMaximo,
  penalizacionArmadura,
  desventajaSigiloArmadura = false,
  concentracionActiva,
  alCambiarModoTirada,
  alEjecutarDescansoCorto,
  alEjecutarDescansoLargo,
  alAplicarCondicion,
  alQuitarCondicion,
  alRomperConcentracion
}) => {
  const [condicionSeleccionada, setCondicionSeleccionada] = useState("");

  const sugerenciasCondiciones = [
    ...CONDICIONES_2024.map((c) => c.nombre),
    ...EFECTOS_PREDEFINIDOS.map((e) => e.nombre)
  ];

  // Estados automáticos derivados del personaje
  const estaDesangrandose = hpActual > 0 && hpActual < hpMaximo / 2;
  const tienePenalizacionArmadura = Boolean(penalizacionArmadura?.sinCompetencia);
  const tieneDesventajaSigilo = Boolean(desventajaSigiloArmadura);
  const tieneConcentracion = Boolean(concentracionActiva);

  // Filtrar condiciones manuales para evitar duplicar las automáticas
  const condicionesManuales = condicionesActivas.filter((cond) => {
    const min = cond.toLowerCase();
    if (tieneConcentracion && min === "concentración") return false;
    if (min.includes("desangr") || min.includes("bloodied")) return false;
    if (tienePenalizacionArmadura && (min.includes("sin competencia") || min.includes("incompetencia"))) return false;
    if (tieneDesventajaSigilo && (min.includes("desventaja en sigilo") || min.includes("sigilo ruidoso"))) return false;
    return true;
  });

  const hayCondicionesOEstados =
    condicionesManuales.length > 0 ||
    estaDesangrandose ||
    tienePenalizacionArmadura ||
    tieneDesventajaSigilo ||
    tieneConcentracion;

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

      {/* Columna Derecha: Condiciones Activas y Efectos Automáticos */}
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

              {/* Chip automático de Armadura / Escudo sin Competencia (D&D 5.5e) */}
              {tienePenalizacionArmadura && (
                <ChipCondicion
                  nombre="Armadura sin Competencia"
                  esAlerta
                  textoCustom="SIN COMPETENCIA (ARMADURA)"
                  alineacionTooltip="derecha"
                  tooltipCustom={`Armadura sin Competencia (D&D 5.5e)\n\n• Vistes ${[
                    penalizacionArmadura?.armaduraNoCompetente,
                    penalizacionArmadura?.escudoNoCompetente
                  ]
                    .filter(Boolean)
                    .join(" y ")} sin entrenamiento.\n• Desventaja en tiradas de ataque y pruebas/salvaciones de FUE y DES.\n• Incapacidad total para lanzar conjuros.`}
                />
              )}

              {/* Chip automático de Desventaja en Sigilo por Armadura */}
              {tieneDesventajaSigilo && (
                <ChipCondicion
                  nombre="Desventaja en Sigilo (Armadura)"
                  esSigilo
                  textoCustom="SIGILO RUIDOSO (ARMADURA)"
                  alineacionTooltip="derecha"
                />
              )}

              {/* Chip de Concentración Activa */}
              {tieneConcentracion && concentracionActiva && (
                <ChipCondicion
                  nombre="Concentración"
                  concentracion
                  textoCustom={`[CON] ${concentracionActiva.nombreHechizo.toUpperCase()}`}
                  tooltipCustom={`Concentración Activa\n\n• Manteniendo conjuro: ${concentracionActiva.nombreHechizo}.\n• Si sufres daño, debes superar una salvación de Constitución (CD 10 o mitad del daño recibido).`}
                  alineacionTooltip="derecha"
                  onQuitar={alRomperConcentracion}
                />
              )}

              {/* Condiciones manuales añadidas por el usuario */}
              {condicionesManuales.map((cond) => (
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
