import React from "react";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import type { ModoLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { TarjetaConjuroCompacta } from "../TarjetaConjuroCompacta";
import estilos from "../PanelConjurosPersonaje.module.css";

interface SeccionConjurosOcultosProps {
  personaje: PersonajeJugador;
  todosConjurosOcultos: HechizoBase[];
  conjurosOcultosFiltrados: HechizoBase[];
  estaAbierta: boolean;
  alAlternar: () => void;
  hayFiltrosActivos: boolean;
  desocultarTodos: () => void;
  alternarOculto: (hechizoId: string) => void;
  bonoAtaqueMagico: number;
  estaPreparado: (hechizo: HechizoBase) => boolean;
  esHechizoDeSubclase: (hechizo: HechizoBase) => boolean;
  requierePreparacion: boolean;
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  alAlternarPreparado: (hechizoId: string) => void;
  alQuitarTruco: (hechizoId: string) => void;
  alQuitarConjuro: (hechizoId: string) => void;
  alAbrirDetalleCompleto: (h: HechizoBase) => void;
  alLanzar: (modo: ModoLanzamiento, nivelLanzamiento?: number, hechizo?: HechizoBase) => Promise<boolean | void>;
  esLanzadorPacto: boolean;
  nivelEspacioPacto: number;
  sistemaMagia: "espacios" | "puntos";
}

export const SeccionConjurosOcultos: React.FC<SeccionConjurosOcultosProps> = ({
  personaje,
  todosConjurosOcultos,
  conjurosOcultosFiltrados,
  estaAbierta,
  alAlternar,
  hayFiltrosActivos,
  desocultarTodos,
  alternarOculto,
  bonoAtaqueMagico,
  estaPreparado,
  esHechizoDeSubclase,
  requierePreparacion,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  alAlternarPreparado,
  alQuitarTruco,
  alQuitarConjuro,
  alAbrirDetalleCompleto,
  alLanzar,
  esLanzadorPacto,
  nivelEspacioPacto,
  sistemaMagia
}) => {
  if (todosConjurosOcultos.length === 0) {
    return null;
  }

  return (
    <div className={estilos.seccionOcultos}>
      <div
        className={estilos.cabeceraNivelInteractiva}
        onClick={alAlternar}
        role="button"
        tabIndex={0}
        title={`Clic para ${estaAbierta ? "colapsar" : "expandir"} conjuros ocultos`}
      >
        <div className={estilos.tituloNivelFila}>
          <EyeOff size={14} color="#94a3b8" />
          <span className={estilos.tituloOcultosTexto}>Conjuros Ocultos</span>
          <span className={estilos.badgeConteoOcultos}>
            {hayFiltrosActivos
              ? `${conjurosOcultosFiltrados.length} / ${todosConjurosOcultos.length}`
              : todosConjurosOcultos.length}
          </span>
        </div>
        <div className={estilos.ladoDerechoCabeceraNivel}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              desocultarTodos();
            }}
            className={estilos.botonDesocultarTodos}
            title="Mostrar y devolver todos los conjuros a sus niveles correspondientes"
          >
            Mostrar todos
          </button>
          {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbierta && (
        <>
          {conjurosOcultosFiltrados.length === 0 ? (
            <p className={estilos.alertaFiltroVacioNivel}>
              Ningún conjuro oculto coincide con los filtros aplicados.
            </p>
          ) : (
            <div className={estilos.listaTarjetas}>
              {conjurosOcultosFiltrados.map((hechizo) => {
                const esTruco = hechizo.nivel === 0;
                return (
                  <TarjetaConjuroCompacta
                    key={`oculto-${hechizo.id}`}
                    hechizo={hechizo}
                    nombrePersonaje={personaje.nombre}
                    nivelPersonaje={personaje.nivel || 1}
                    bonoAtaqueMagico={bonoAtaqueMagico}
                    estaPreparado={esTruco ? true : estaPreparado(hechizo)}
                    esDeSubclase={esHechizoDeSubclase(hechizo)}
                    mostrarTogglePreparado={!esTruco && requierePreparacion}
                    esConcentracionActual={personaje.concentracionActiva?.hechizoId === hechizo.id}
                    esOculto={true}
                    alAlternarOcultar={() => alternarOculto(hechizo.id)}
                    bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                    motivoBloqueoArmadura={motivoBloqueoArmadura}
                    alAlternarPreparado={esTruco ? undefined : () => alAlternarPreparado(hechizo.id)}
                    alQuitarDeLista={() => (esTruco ? alQuitarTruco(hechizo.id) : alQuitarConjuro(hechizo.id))}
                    alAbrirDetalleCompleto={alAbrirDetalleCompleto}
                    alLanzar={(modo, niv) => alLanzar(modo, niv, hechizo)}
                    esLanzadorPacto={esLanzadorPacto}
                    nivelEspacioPacto={nivelEspacioPacto}
                    espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
                    espaciosPactoGastados={personaje.espaciosPactoGastados || 0}
                    espaciosConjuroMaximos={personaje.espaciosConjuroMaximos || {}}
                    nivelConjuroMaximo={personaje.nivelConjuroMaximo || 0}
                    sistemaMagia={sistemaMagia}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
