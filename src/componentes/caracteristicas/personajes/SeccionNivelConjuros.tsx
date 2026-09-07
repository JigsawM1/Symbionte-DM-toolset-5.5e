import React from "react";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import type { ModoLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { TarjetaConjuroCompacta } from "./TarjetaConjuroCompacta";
import estilos from "./PanelConjurosPersonaje.module.css";

interface SeccionNivelConjurosProps {
  titulo: string;
  icono?: React.ReactNode;
  nivel: number;
  esTruco?: boolean;
  conjurosVisibles: HechizoBase[];
  conjurosFiltrados: HechizoBase[];
  estaAbierta: boolean;
  alAlternar: () => void;
  hayFiltrosActivos: boolean;
  personaje: PersonajeJugador;
  bonoAtaqueMagico: number;
  estaPreparado: (hechizo: HechizoBase) => boolean;
  esHechizoDeSubclase: (hechizo: HechizoBase) => boolean;
  requierePreparacion: boolean;
  esLanzadorPacto: boolean;
  nivelEspacioPacto: number;
  sistemaMagia: "espacios" | "puntos";
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  alAlternarOcultar: (hechizoId: string) => void;
  alAlternarPreparado?: (hechizoId: string) => void;
  alQuitarDeLista: (hechizoId: string) => void;
  alAbrirDetalleCompleto: (hechizo: HechizoBase) => void;
  alLanzar: (
    modo: ModoLanzamiento,
    nivelLanzamiento?: number,
    hechizo?: HechizoBase
  ) => Promise<boolean | void>;
  alAnadirTrucos?: () => void;
  totalTrucosConocidos?: number;
}

export const SeccionNivelConjuros: React.FC<SeccionNivelConjurosProps> = ({
  titulo,
  icono,
  nivel,
  esTruco = false,
  conjurosVisibles,
  conjurosFiltrados,
  estaAbierta,
  alAlternar,
  hayFiltrosActivos,
  personaje,
  bonoAtaqueMagico,
  estaPreparado,
  esHechizoDeSubclase,
  requierePreparacion,
  esLanzadorPacto,
  nivelEspacioPacto,
  sistemaMagia,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  alAlternarOcultar,
  alAlternarPreparado,
  alQuitarDeLista,
  alAbrirDetalleCompleto,
  alLanzar,
  alAnadirTrucos,
  totalTrucosConocidos = 0
}) => {
  return (
    <div className={estilos.seccionNivel}>
      <div
        className={estilos.cabeceraNivelInteractiva}
        onClick={alAlternar}
        role="button"
        tabIndex={0}
        title={`Clic para ${estaAbierta ? "colapsar" : "expandir"} ${titulo}`}
      >
        <div className={estilos.tituloNivelFila}>
          {icono}
          <span className={esTruco ? estilos.tituloNivelTexto : estilos.tituloNivelPrincipal}>
            {titulo}
          </span>
          <span className={estilos.badgeConteoNivel}>
            {hayFiltrosActivos
              ? `${conjurosFiltrados.length} / ${conjurosVisibles.length}`
              : conjurosVisibles.length}
          </span>
        </div>
        <div className={estilos.ladoDerechoCabeceraNivel}>
          {esTruco && conjurosVisibles.length > 0 && (
            <span className={estilos.textoEscalado}>
              Escalado: Nivel {personaje.nivel || 1}
            </span>
          )}
          {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbierta && (
        <>
          {esTruco && totalTrucosConocidos === 0 ? (
            <div className={estilos.filaVacioTrucos}>
              <p className={estilos.textoVacio}>No tienes trucos listos.</p>
              {alAnadirTrucos && (
                <button
                  type="button"
                  onClick={alAnadirTrucos}
                  className={estilos.botonAnadirTrucos}
                >
                  <BookOpen size={11} />
                  Añadir Trucos
                </button>
              )}
            </div>
          ) : conjurosVisibles.length === 0 ? (
            <div className={estilos.filaVacioTrucos}>
              <p className={estilos.textoVacio}>
                {esTruco
                  ? `Todos tus trucos (${totalTrucosConocidos}) están en la sección de Conjuros Ocultos.`
                  : "Todos los conjuros de este nivel están en la sección de Conjuros Ocultos."}
              </p>
            </div>
          ) : conjurosFiltrados.length === 0 ? (
            <p className={estilos.alertaFiltroVacioNivel}>
              Ningún {esTruco ? "truco" : `conjuro de nivel ${nivel}`} coincide con los filtros aplicados.
            </p>
          ) : (
            <div className={estilos.listaTarjetas}>
              {conjurosFiltrados.map((hechizo) => (
                <TarjetaConjuroCompacta
                  key={`${esTruco ? "truco" : "conjuro"}-${hechizo.id}`}
                  hechizo={hechizo}
                  nombrePersonaje={personaje.nombre}
                  nivelPersonaje={personaje.nivel || 1}
                  bonoAtaqueMagico={bonoAtaqueMagico}
                  estaPreparado={esTruco ? true : estaPreparado(hechizo)}
                  esDeSubclase={esHechizoDeSubclase(hechizo)}
                  mostrarTogglePreparado={!esTruco && requierePreparacion}
                  esConcentracionActual={personaje.concentracionActiva?.hechizoId === hechizo.id}
                  esOculto={false}
                  alAlternarOcultar={() => alAlternarOcultar(hechizo.id)}
                  bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                  motivoBloqueoArmadura={motivoBloqueoArmadura}
                  alAlternarPreparado={
                    !esTruco && alAlternarPreparado
                      ? () => alAlternarPreparado(hechizo.id)
                      : undefined
                  }
                  alQuitarDeLista={() => alQuitarDeLista(hechizo.id)}
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
