import React from "react";
import { Swords, ChevronDown, ChevronRight } from "lucide-react";
import { TarjetaAtaquePersonaje } from "./TarjetaAtaquePersonaje";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
import type { Caracteristica, PersonajeJugador } from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import type { AtaquePersonajeCalculado } from "./usarCalculoAtaquesJugador";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionAtaquesFisicosProps {
  ataquesFisicos: AtaquePersonajeCalculado[];
  personajeActivo: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje | null;
  estaAbierta: boolean;
  alAlternar: () => void;
  alTirarAtaque: (ataque: AtaquePersonajeCalculado) => void;
  alTirarDano: (ataque: AtaquePersonajeCalculado, usarDosManos?: boolean) => void;
  alTirarCritico: (ataque: AtaquePersonajeCalculado, usarDosManos?: boolean) => void;
  alCambiarCaracteristica: (idInstancia: string, nuevaCarac: Caracteristica) => void;
}

export const SeccionAtaquesFisicos: React.FC<SeccionAtaquesFisicosProps> = ({
  ataquesFisicos,
  personajeActivo,
  statsCalculadas,
  estaAbierta,
  alAlternar,
  alTirarAtaque,
  alTirarDano,
  alTirarCritico,
  alCambiarCaracteristica
}) => {
  if (ataquesFisicos.length === 0) {
    return null;
  }

  return (
    <div className={estilos.seccionGrupoAtaques}>
      <div
        className={estilos.cabeceraGrupoAtaques}
        onClick={alAlternar}
        role="button"
        tabIndex={0}
        title="Clic para mostrar u ocultar armas y ataques físicos"
      >
        <div className={estilos.tituloGrupoAtaques}>
          <Swords size={14} color="#38bdf8" />
          <span>Armas y Ataques Físicos</span>
          <span className={estilos.badgeConteoSeccion}>{ataquesFisicos.length}</span>
        </div>
        <div className={estilos.ladoDerechoCabecera}>
          {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbierta && (
        <div className={estilos.listaAtaques}>
          {ataquesFisicos.map((ataque) => {
            const evalCond = evaluarEfectosCondicionesEnTirada({
              tipo: "ataque",
              caracteristica: ataque.caracteristicaUsada as Caracteristica,
              penalizacionArmadura: !!statsCalculadas?.penalizacionArmadura?.sinCompetencia,
              desventajaSigiloArmadura: !!statsCalculadas?.desventajaSigiloArmadura,
              condicionesActivas: personajeActivo?.condicionesActivas,
              personaje: personajeActivo
            });

            return (
              <TarjetaAtaquePersonaje
                key={ataque.id}
                ataque={ataque}
                evaluacionCondiciones={evalCond}
                alTirarAtaque={alTirarAtaque}
                alTirarDano={alTirarDano}
                alTirarCritico={alTirarCritico}
                alCambiarCaracteristica={alCambiarCaracteristica}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
