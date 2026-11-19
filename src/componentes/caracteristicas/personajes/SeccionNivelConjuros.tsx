import { obtenerMaximosEspaciosEfectivos } from "@/servicios/rasgos/conversionRecursosRasgos";
import React from "react";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import type { ModoLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import type { OrigenConjuroBadge } from "@/servicios/resolutorOrigenConjuros";
import { obtenerBonoDanoConjuroExtra, tieneLanzamientoGratuitoDisponible } from "@/servicios/evaluadorEfectosRasgos";
import { obtenerModificadorAptitudMagica } from "@/servicios/calculadorMagia";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
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
  obtenerOrigenConjuro?: (hechizo: HechizoBase) => OrigenConjuroBadge | null;
  requierePreparacion?: boolean;
  esLanzadorPacto: boolean;
  nivelEspacioPacto: number;
  sistemaMagia: "espacios" | "puntos";
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  conjurosEnAccionesSet?: Set<string>;
  alAlternarAcciones?: (hechizoId: string) => void;
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
  obtenerOrigenConjuro,
  requierePreparacion: _requierePreparacion,
  esLanzadorPacto,
  nivelEspacioPacto,
  sistemaMagia,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  conjurosEnAccionesSet,
  alAlternarAcciones,
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
          <span className={estilos.tituloNivelPrincipal}>
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
          ) : conjurosFiltrados.length === 0 ? (
            <p className={estilos.alertaFiltroVacioNivel}>
              Ningún {esTruco ? "truco" : `conjuro de nivel ${nivel}`} coincide con los filtros aplicados.
            </p>
          ) : (
            <div className={estilos.listaTarjetas}>
              {conjurosFiltrados.map((hechizo) => {
                const tieneLanzamientoGratisDisponible = tieneLanzamientoGratuitoDisponible(personaje, hechizo);
                const modificadorHabilidad = obtenerModificadorAptitudMagica(personaje);
                const bonoDanoMagico = obtenerBonoDanoConjuroExtra(personaje, {
                  esTruco,
                  nivelLanzamiento: nivel,
                  tipoDano: hechizo.tipoDaño,
                  escuela: hechizo.escuela,
                  nombreConjuro: hechizo.nombre
                });
                const origenBadge = obtenerOrigenConjuro
                  ? obtenerOrigenConjuro(hechizo)
                  : (esHechizoDeSubclase(hechizo) ? "subclase" : null);
                const esOtorgado = Boolean(origenBadge) || esHechizoDeSubclase(hechizo);
                const puntosConjuroDisponibles = Math.max(
                  0,
                  (personaje.puntosConjuroMaximos || 0) - (personaje.puntosConjuroGastados || 0)
                );

                return (
                  <TarjetaConjuroCompacta
                    key={`${esTruco ? "truco" : "conjuro"}-${hechizo.id}`}
                    hechizo={hechizo}
                    nombrePersonaje={personaje.nombre}
                    nivelPersonaje={personaje.nivel || 1}
                    bonoAtaqueMagico={bonoAtaqueMagico}
                    bonoDanoMagico={bonoDanoMagico}
                    modificadorHabilidad={modificadorHabilidad}
                    estaPreparado={esTruco ? true : estaPreparado(hechizo)}
                    esPreparador={!esTruco && Boolean(alAlternarPreparado)}
                    esDeSubclase={esHechizoDeSubclase(hechizo)}
                    origenBadge={origenBadge}
                    esConcentracionActual={personaje.concentracionActiva?.hechizoId === hechizo.id}
                    enAcciones={conjurosEnAccionesSet?.has(hechizo.id) ?? false}
                    alAlternarAcciones={alAlternarAcciones ? () => alAlternarAcciones(hechizo.id) : undefined}
                    bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                    motivoBloqueoArmadura={motivoBloqueoArmadura}
                    tieneLanzamientoGratisDisponible={tieneLanzamientoGratisDisponible}
                    alLanzarGratis={tieneLanzamientoGratisDisponible ? async () => { await alLanzar("gratuitoInnato", hechizo.nivel, hechizo); } : undefined}
                    alAlternarPreparado={
                      !esTruco && alAlternarPreparado
                        ? () => alAlternarPreparado(hechizo.id)
                        : undefined
                    }
                    alQuitarDeLista={esOtorgado ? undefined : () => alQuitarDeLista(hechizo.id)}
                    alAbrirDetalleCompleto={alAbrirDetalleCompleto}
                    alLanzar={(modo, niv) => alLanzar(modo, niv, hechizo)}
                    esLanzadorPacto={esLanzadorPacto}
                    nivelEspacioPacto={nivelEspacioPacto}
                    espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
                    espaciosPactoGastados={personaje.espaciosPactoGastados || 0}
                    espaciosConjuroMaximos={obtenerMaximosEspaciosEfectivos(personaje)}
                    espaciosConjuroGastados={personaje.espaciosConjuroGastados}
                    nivelConjuroMaximo={personaje.nivelConjuroMaximo || 0}
                    puntosConjuroDisponibles={puntosConjuroDisponibles}
                    costePuntosPorNivel={COSTE_PUNTOS_POR_NIVEL}
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
