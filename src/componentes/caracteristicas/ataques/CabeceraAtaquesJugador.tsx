import React from "react";
import { Swords, AlertTriangle } from "lucide-react";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import type { FiltroAccion } from "./usarCalculoAtaquesJugador";
import estilos from "./VistaAtaquesJugador.module.css";

interface CabeceraAtaquesJugadorProps {
  conteoTotal: number;
  conteoAccion: number;
  conteoAccionAdicional: number;
  conteoReaccion: number;
  conteoConsumibles: number;
  filtro: FiltroAccion;
  alCambiarFiltro: (nuevoFiltro: FiltroAccion) => void;
  statsCalculadas: EstadisticasCalculadasPersonaje | null;
}

export const CabeceraAtaquesJugador: React.FC<CabeceraAtaquesJugadorProps> = ({
  conteoTotal,
  conteoAccion,
  conteoAccionAdicional,
  conteoReaccion,
  conteoConsumibles,
  filtro,
  alCambiarFiltro,
  statsCalculadas
}) => {
  const filtrosVisibles: Array<{ id: FiltroAccion; etiqueta: string; conteo: number }> = [
    { id: "todas", etiqueta: "Todas", conteo: conteoTotal },
    { id: "accion", etiqueta: "Acción", conteo: conteoAccion },
    { id: "accionAdicional", etiqueta: "Adicional", conteo: conteoAccionAdicional },
    { id: "reaccion", etiqueta: "Reacción", conteo: conteoReaccion },
    { id: "consumibles", etiqueta: "Consumibles", conteo: conteoConsumibles }
  ];

  return (
    <div className={estilos.cabeceraPrincipal}>
      <div className={estilos.filaTitulo}>
        <div className={estilos.grupoTitulo}>
          <Swords size={18} color="var(--pj-texto-cian)" aria-hidden="true" />
          <h2 className={estilos.tituloTexto}>Acciones de Combate</h2>
          <span className={estilos.contadorBadge}>{conteoTotal}</span>
        </div>
      </div>

      {/* Barra de Filtros Tácticos de Acción */}
      <div className={estilos.barraFiltros}>
        {filtrosVisibles.map((op) => (
          <button
            key={op.id}
            type="button"
            aria-pressed={filtro === op.id}
            className={`${estilos.botonFiltro} ${filtro === op.id ? estilos.botonFiltroActivo : ""}`}
            onClick={() => alCambiarFiltro(op.id)}
          >
            <span>{op.etiqueta}</span>
            <span className={estilos.badgeConteoFiltro}>{op.conteo}</span>
          </button>
        ))}
      </div>

      {/* Banner de Advertencia: Penalización por Armadura sin Competencia (D&D 5.5e) */}
      {statsCalculadas?.penalizacionArmadura?.sinCompetencia && (
        <div className={estilos.bannerPenalizacionArmadura} role="status">
          <AlertTriangle size={16} color="var(--pj-texto-alerta)" className={estilos.bannerPenalizacionIcono} aria-hidden="true" />
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
