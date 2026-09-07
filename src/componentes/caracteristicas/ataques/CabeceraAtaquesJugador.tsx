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
  filtro,
  alCambiarFiltro,
  personajes,
  personajeActivo,
  alSeleccionarPersonaje,
  statsCalculadas
}) => {
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
        <button
          type="button"
          className={`${estilos.botonFiltro} ${filtro === "todas" ? estilos.botonFiltroActivo : ""}`}
          onClick={() => alCambiarFiltro("todas")}
        >
          <span>Todas</span>
          <span className={estilos.badgeConteoFiltro}>({conteoTotal})</span>
        </button>

        <button
          type="button"
          className={`${estilos.botonFiltro} ${filtro === "accion" ? estilos.botonFiltroActivo : ""}`}
          onClick={() => alCambiarFiltro("accion")}
        >
          <span>Acción</span>
          <span className={estilos.badgeConteoFiltro}>({conteoAccion})</span>
        </button>

        <button
          type="button"
          className={`${estilos.botonFiltro} ${filtro === "accionAdicional" ? estilos.botonFiltroActivo : ""}`}
          onClick={() => alCambiarFiltro("accionAdicional")}
        >
          <span>Acción Adicional</span>
          <span className={estilos.badgeConteoFiltro}>({conteoAccionAdicional})</span>
        </button>

        <button
          type="button"
          className={`${estilos.botonFiltro} ${filtro === "reaccion" ? estilos.botonFiltroActivo : ""}`}
          onClick={() => alCambiarFiltro("reaccion")}
        >
          <span>Reacción</span>
          <span className={estilos.badgeConteoFiltro}>({conteoReaccion})</span>
        </button>
      </div>

      {/* Banner de Advertencia: Penalización por Armadura sin Competencia (D&D 5.5e) */}
      {statsCalculadas?.penalizacionArmadura?.sinCompetencia && (
        <div className={estilos.bannerPenalizacionArmadura}>
          <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
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
