import React from "react";
import { FlaskConical, ChevronDown, ChevronRight } from "lucide-react";
import { TarjetaConsumibleAccion } from "./TarjetaConsumibleAccion";
import type { ConsumibleAccionCalculado } from "./usarCalculoAtaquesJugador";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionConsumiblesAtaqueProps {
  consumiblesFiltrados: ConsumibleAccionCalculado[];
  estaAbierta: boolean;
  alAlternar: () => void;
  alUsarConsumible: (cons: ConsumibleAccionCalculado) => void;
}

export const SeccionConsumiblesAtaque: React.FC<SeccionConsumiblesAtaqueProps> = ({
  consumiblesFiltrados,
  estaAbierta,
  alAlternar,
  alUsarConsumible
}) => {
  if (consumiblesFiltrados.length === 0) {
    return null;
  }

  return (
    <div className={estilos.seccionGrupoAtaques}>
      <div
        className={estilos.cabeceraGrupoAtaques}
        onClick={alAlternar}
        role="button"
        tabIndex={0}
        title="Clic para mostrar u ocultar consumibles y pociones"
      >
        <div className={estilos.tituloGrupoAtaques}>
          <FlaskConical size={14} color="#10b981" />
          <span>Consumibles y Pociones</span>
          <span className={estilos.badgeConteoSeccion}>{consumiblesFiltrados.length}</span>
        </div>
        <div className={estilos.ladoDerechoCabecera}>
          {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbierta && (
        <div className={estilos.listaAtaques}>
          {consumiblesFiltrados.map((cons) => (
            <TarjetaConsumibleAccion
              key={cons.idInstancia}
              consumible={cons}
              alUsar={alUsarConsumible}
            />
          ))}
        </div>
      )}
    </div>
  );
};
