import React from "react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { TrackerEspaciosConjuro } from "@/componentes/caracteristicas/personajes/TrackerEspaciosConjuro";
import { TrackerEspaciosPacto } from "@/componentes/caracteristicas/personajes/TrackerEspaciosPacto";
import { TrackerPuntosConjuro } from "@/componentes/caracteristicas/personajes/TrackerPuntosConjuro";
import type { PersonajeJugador } from "@/tipos";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionRecursosMagicosAtaqueProps {
  personajeActivo: PersonajeJugador;
  tieneMagiaEstandar: boolean;
  tienePacto: boolean;
  sistemaMagia: "espacios" | "puntos";
  estaAbierta: boolean;
  alAlternar: () => void;
  alGastarEspacioConjuro: (pjId: string, nivel: number) => void;
  alRecuperarEspacioConjuro: (pjId: string, nivel: number) => void;
  alRecuperarTodosEspaciosConjuro: (pjId: string) => void;
  alGastarPuntosConjuro: (pjId: string, cantidad: number) => void;
  alRecuperarPuntosConjuro: (pjId: string, cantidad: number) => void;
  alRecuperarTodosPuntosConjuro: (pjId: string) => void;
  alGastarEspacioPacto: (pjId: string) => void;
  alRecuperarEspaciosPacto: (pjId: string) => void;
}

export const SeccionRecursosMagicosAtaque: React.FC<SeccionRecursosMagicosAtaqueProps> = ({
  personajeActivo,
  tieneMagiaEstandar,
  tienePacto,
  sistemaMagia,
  estaAbierta,
  alAlternar,
  alGastarEspacioConjuro,
  alRecuperarEspacioConjuro,
  alRecuperarTodosEspaciosConjuro,
  alGastarPuntosConjuro,
  alRecuperarPuntosConjuro,
  alRecuperarTodosPuntosConjuro,
  alGastarEspacioPacto,
  alRecuperarEspaciosPacto
}) => {
  if (!tieneMagiaEstandar && !tienePacto) {
    return null;
  }

  return (
    <div className={estilos.seccionGrupoAtaques}>
      <div
        className={estilos.cabeceraGrupoAtaques}
        onClick={alAlternar}
        role="button"
        tabIndex={0}
        title="Clic para mostrar u ocultar espacios y recursos mágicos"
      >
        <div className={estilos.tituloGrupoAtaques}>
          <Sparkles size={14} color="#c084fc" />
          <span>Espacios y Recursos de Conjuro</span>
        </div>
        <div className={estilos.ladoDerechoCabecera}>
          {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbierta && (
        <div className={estilos.listaAtaques}>
          {tieneMagiaEstandar &&
            (sistemaMagia === "puntos" ? (
              <TrackerPuntosConjuro
                puntosMaximos={personajeActivo.puntosConjuroMaximos || 0}
                puntosGastados={personajeActivo.puntosConjuroGastados || 0}
                nivelMaximo={personajeActivo.nivelConjuroMaximo || 0}
                alGastarPuntos={(cant) => alGastarPuntosConjuro(personajeActivo.id, cant)}
                alRecuperarPuntos={(cant) => alRecuperarPuntosConjuro(personajeActivo.id, cant)}
                alRecuperarTodosPuntos={() => alRecuperarTodosPuntosConjuro(personajeActivo.id)}
                mostrarBotonRestablecer={false}
                mostrarGastoManual={false}
              />
            ) : (
              <TrackerEspaciosConjuro
                espaciosMaximos={personajeActivo.espaciosConjuroMaximos || {}}
                espaciosGastados={personajeActivo.espaciosConjuroGastados || {}}
                alGastarEspacio={(niv) => alGastarEspacioConjuro(personajeActivo.id, niv)}
                alRecuperarEspacio={(niv) => alRecuperarEspacioConjuro(personajeActivo.id, niv)}
                alRecuperarTodosEspacios={() => alRecuperarTodosEspaciosConjuro(personajeActivo.id)}
                mostrarBotonRestablecer={false}
                soloLectura={true}
              />
            ))}

          {tienePacto && (
            <TrackerEspaciosPacto
              espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
              espaciosPactoGastados={personajeActivo.espaciosPactoGastados || 0}
              nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 1}
              alGastarEspacioPacto={() => alGastarEspacioPacto(personajeActivo.id)}
              alRecuperarEspaciosPacto={() => alRecuperarEspaciosPacto(personajeActivo.id)}
              mostrarBotonRecuperar={false}
              soloLectura={true}
            />
          )}
        </div>
      )}
    </div>
  );
};
