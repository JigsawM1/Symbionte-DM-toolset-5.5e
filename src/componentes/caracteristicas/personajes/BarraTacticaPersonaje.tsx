import React, { useState } from "react";
import { SelectorSugerencias, ChipCondicion } from "@/componentes/comunes";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import type { PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import type { ConcentracionActiva, EfectoActivoPj } from "@/tipos";
import { Moon, Sunrise } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

export type ModoTirada = "disv" | "plano" | "vent";

interface BarraTacticaPersonajeProps {
  modoTirada: ModoTirada;
  condicionesActivas: string[];
  efectosActivos?: EfectoActivoPj[];
  rondaActual?: number;
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
  alQuitarEfecto?: (idEfecto: string) => void;
  alRomperConcentracion?: () => void;
}

const BarraTacticaPersonajeComponent: React.FC<BarraTacticaPersonajeProps> = ({
  modoTirada,
  condicionesActivas,
  efectosActivos = [],
  rondaActual,
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
  alQuitarEfecto,
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

  // Filtrar efectos para no duplicar el chip de concentración si ya se muestra arriba
  const efectosFiltrados = efectosActivos.filter((ef) => {
    if (tieneConcentracion && (ef.concentracion || ef.id === "ef_concentracion" || ef.nombre.toLowerCase().startsWith("concentra"))) {
      return false;
    }
    return true;
  });

  const nombresEfectosSet = new Set<string>();
  efectosFiltrados.forEach((ef) => {
    const efMin = ef.nombre.toLowerCase().trim();
    const efBase = ef.nombre.split(" (")[0].toLowerCase().trim();
    nombresEfectosSet.add(efMin);
    nombresEfectosSet.add(efBase);
  });

  // Filtrar condiciones manuales para evitar duplicar las automáticas, concentración o efectos activos
  const condicionesManuales = condicionesActivas.filter((cond) => {
    const min = cond.toLowerCase().trim();
    const base = cond.split(" (")[0].toLowerCase().trim();
    if (min.includes("concentra")) return false;
    if (min.includes("desangr") || min.includes("bloodied")) return false;
    if (tienePenalizacionArmadura && (min.includes("sin competencia") || min.includes("incompetencia"))) return false;
    if (tieneDesventajaSigilo && (min.includes("desventaja en sigilo") || min.includes("sigilo ruidoso"))) return false;
    if (nombresEfectosSet.has(min) || nombresEfectosSet.has(base)) return false;
    return true;
  });

  const hayCondicionesOEstados =
    condicionesManuales.length > 0 ||
    estaDesangrandose ||
    tienePenalizacionArmadura ||
    tieneDesventajaSigilo ||
    tieneConcentracion ||
    efectosFiltrados.length > 0;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "4px" }}>
          <span className={estilos.tituloCondicionesActivas}>Condiciones y Efectos</span>
          {rondaActual !== undefined && rondaActual > 0 && (
            <span style={{ fontSize: "10px", color: "var(--color-texto-apagado)", fontWeight: 700 }}>
              Ronda {rondaActual}
            </span>
          )}
        </div>
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
                  tooltipCustom={`Armadura sin Competencia\n\n• Vistes ${[
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
                  tooltipCustom={`Concentración Activa\n\n• Manteniendo conjuro: ${concentracionActiva.nombreHechizo}.\n• Si sufres daño, debes superar una salvación de Constitución (CD 10 o mitad del daño recibido).\n• Quedar incapacitado o lanzar otro conjuro de concentración rompe este efecto inmediatamente (D&D 5.5e).`}
                  alineacionTooltip="derecha"
                  onQuitar={alRomperConcentracion}
                />
              )}

              {/* Condiciones de estado manuales añadidas por el usuario */}
              {condicionesManuales.map((cond) => (
                <ChipCondicion
                  key={cond}
                  nombre={cond}
                  alineacionTooltip="derecha"
                  onQuitar={() => alQuitarCondicion(cond)}
                />
              ))}

              {/* Efectos mágicos y temporales con rondas restantes */}
              {efectosFiltrados.map((ef) => {
                const rondasRestantes = (ef.expiraRonda !== undefined && rondaActual !== undefined)
                  ? Math.max(0, ef.expiraRonda - rondaActual)
                  : undefined;

                return (
                  <ChipCondicion
                    key={ef.id}
                    nombre={ef.nombre}
                    concentracion={ef.concentracion}
                    expiraRonda={ef.expiraRonda}
                    rondasRestantes={rondasRestantes}
                    alineacionTooltip="derecha"
                    onQuitar={alQuitarEfecto ? () => alQuitarEfecto(ef.id) : undefined}
                  />
                );
              })}
            </>
          ) : (
            <span className={estilos.textoSinCondiciones}>Sin estados alterados ni efectos</span>
          )}
        </div>
      </div>
    </section>
  );
};

export const BarraTacticaPersonaje = React.memo(BarraTacticaPersonajeComponent);
