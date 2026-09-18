import React from "react";
import { Swords, UserCheck, AlertTriangle } from "lucide-react";
import { SelectorDesplegable } from "@/componentes/comunes";
import type { PersonajeJugador } from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import type { FiltroAccion } from "./usarCalculoAtaquesJugador";
import estilos from "./VistaAtaquesJugador.module.css";

interface CabeceraAtaquesJugadorProps {
  conteoTotal: number;
  conteoAccion: number;
  conteoAccionAdicional: number;
  conteoReaccion: number;
  conteoConsumibles: number;
  conteoActivables: number;
  filtro: FiltroAccion;
  alCambiarFiltro: (nuevoFiltro: FiltroAccion) => void;
  personajes: PersonajeJugador[];
  personajeActivo: PersonajeJugador;
  alSeleccionarPersonaje: (id: string) => void;
  statsCalculadas: EstadisticasCalculadasPersonaje | null;
}

export const CabeceraAtaquesJugador: React.FC<CabeceraAtaquesJugadorProps> = ({
  conteoTotal,
  conteoAccion,
  conteoAccionAdicional,
  conteoReaccion,
  conteoConsumibles,
  conteoActivables,
  filtro,
  alCambiarFiltro,
  personajes,
  personajeActivo,
  alSeleccionarPersonaje,
  statsCalculadas
}) => {
  const pestanasPrincipales: Array<{ id: FiltroAccion; etiqueta: string; conteo: number }> = [
    { id: "accion", etiqueta: "Acciones", conteo: conteoAccion },
    { id: "accionAdicional", etiqueta: "Adicionales", conteo: conteoAccionAdicional },
    { id: "reaccion", etiqueta: "Reacciones", conteo: conteoReaccion }
  ];

  const opcionesSelector: Array<{ valor: FiltroAccion; etiqueta: string }> = [
    { valor: "todas", etiqueta: `Todas (${conteoTotal})` },
    { valor: "consumibles", etiqueta: `Consumibles (${conteoConsumibles})` },
    { valor: "activables", etiqueta: `Activables (${conteoActivables})` }
  ];

  const esFiltroEnSelector =
    filtro === "todas" || filtro === "consumibles" || filtro === "activables";

  return (
    <div className={estilos.cabeceraPrincipal}>
      <div className={estilos.filaTitulo}>
        <div className={estilos.grupoTitulo}>
          <Swords size={18} color="#38bdf8" />
          <h2 className={estilos.tituloTexto}>Acciones de Combate</h2>
          <span className={estilos.contadorBadge}>{conteoTotal}</span>
        </div>

        {personajes.length > 1 && (
          <div className={estilos.selectorPersonaje}>
            <UserCheck size={14} color="#94a3b8" />
            <SelectorDesplegable<string>
              valor={personajeActivo.id}
              alCambiar={alSeleccionarPersonaje}
              tamano="compacto"
              opciones={personajes.map((pj) => ({
                valor: pj.id,
                etiqueta: `${pj.nombre} (${pj.clase || "PJ"})`
              }))}
            />
          </div>
        )}
      </div>

      {/* Barra de Filtros Tácticos de Acción */}
      <div className={estilos.barraFiltros}>
        <div className={estilos.grupoPestanasPrincipales}>
          {pestanasPrincipales.map((op) => (
            <button
              key={op.id}
              type="button"
              className={`${estilos.botonFiltro} ${filtro === op.id ? estilos.botonFiltroActivo : ""}`}
              onClick={() => alCambiarFiltro(op.id)}
            >
              <span>{op.etiqueta}</span>
              <span className={estilos.badgeConteoFiltro}>({op.conteo})</span>
            </button>
          ))}
        </div>

        <div
          className={`${estilos.selectorFiltroWrapper} ${esFiltroEnSelector ? estilos.selectorFiltroActivo : ""}`}
        >
          <SelectorDesplegable<FiltroAccion>
            valor={esFiltroEnSelector ? filtro : ("" as FiltroAccion)}
            alCambiar={alCambiarFiltro}
            placeholder="Otros..."
            tamano="compacto"
            opciones={opcionesSelector}
          />
        </div>
      </div>

      {/* Banner de Advertencia: Penalización por Armadura sin Competencia (D&D 5.5e) */}
      {statsCalculadas?.penalizacionArmadura?.sinCompetencia && (
        <div className={estilos.bannerPenalizacionArmadura}>
          <AlertTriangle size={16} color="#ef4444" className={estilos.bannerPenalizacionIcono} />
          <div>
            <strong>Penalización por Armadura sin Competencia:</strong>
            {statsCalculadas.penalizacionArmadura.armaduraNoCompetente && (
              <span> No eres competente con <em>{statsCalculadas.penalizacionArmadura.armaduraNoCompetente}</em>.</span>
            )}
            {statsCalculadas.penalizacionArmadura.escudoNoCompetente && (
              <span> No eres competente con <em>{statsCalculadas.penalizacionArmadura.escudoNoCompetente}</em>.</span>
            )}
            <div>
              Tienes <strong>Desventaja</strong> en tiradas de ataque y pruebas/salvaciones de Fuerza y Destreza. <strong>No puedes lanzar conjuros</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
