import React, { useCallback } from "react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { TarjetaConjuroCompacta } from "@/componentes/caracteristicas/personajes/TarjetaConjuroCompacta";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import type { SolicitudLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { resolverOrigenConjuro } from "@/servicios/resolutorOrigenConjuros";
import { obtenerBonoDanoConjuroExtra, tieneLanzamientoGratuitoDisponible } from "@/servicios/evaluadorEfectosRasgos";
import { obtenerModificadorAptitudMagica } from "@/servicios/calculadorMagia";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import type { ConjuroAccionElemento } from "./usarCalculoAtaquesJugador";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionAtaquesMagicosProps {
  conjurosFiltrados: ConjuroAccionElemento[];
  conjurosPorNivel: Record<number, ConjuroAccionElemento[]>;
  seccionesAbiertas: Record<string, boolean>;
  alAlternarSeccion: (seccion: string) => void;
  personajeActivo: PersonajeJugador;
  espaciosConjuroMaximos: Record<string, number>;
  bonoAtaqueMagico: number;
  tienePacto: boolean;
  sistemaMagia: "espacios" | "puntos";
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  esHechizoDeSubclase: (hechizo: HechizoBase) => boolean;
  alAbrirDetalle: (hechizo: HechizoBase) => void;
  alLanzar: (solicitud: SolicitudLanzamiento) => Promise<boolean>;
  alAlternarAcciones?: (idPj: string, idHechizo: string) => void;
}

export const SeccionAtaquesMagicos: React.FC<SeccionAtaquesMagicosProps> = ({
  conjurosFiltrados,
  conjurosPorNivel,
  seccionesAbiertas,
  alAlternarSeccion,
  personajeActivo,
  espaciosConjuroMaximos,
  bonoAtaqueMagico,
  tienePacto,
  sistemaMagia,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  esHechizoDeSubclase,
  alAbrirDetalle,
  alLanzar,
  alAlternarAcciones
}) => {
  const alternarEnAcciones = useCallback((hechizoId: string) => {
    alAlternarAcciones?.(personajeActivo.id, hechizoId);
  }, [alAlternarAcciones, personajeActivo.id]);

  if (conjurosFiltrados.length === 0) {
    return null;
  }

  const estaAbiertaGeneral = seccionesAbiertas.magicos !== false;

  const renderizarTarjetaConjuro = (hechizo: HechizoBase) => {
    const tieneLanzamientoGratisDisponible = tieneLanzamientoGratuitoDisponible(personajeActivo, hechizo);
    const modificadorHabilidad = obtenerModificadorAptitudMagica(personajeActivo);
    const bonoDanoMagico = obtenerBonoDanoConjuroExtra(personajeActivo, {
      esTruco: hechizo.nivel === 0,
      nivelLanzamiento: hechizo.nivel,
      tipoDano: hechizo.tipoDaño,
      escuela: hechizo.escuela,
      nombreConjuro: hechizo.nombre
    });

    return (
      <TarjetaConjuroCompacta
        key={hechizo.id}
        hechizo={hechizo}
        nombrePersonaje={personajeActivo.nombre}
        nivelPersonaje={personajeActivo.nivel || 1}
        bonoAtaqueMagico={bonoAtaqueMagico}
        bonoDanoMagico={bonoDanoMagico}
        modificadorHabilidad={modificadorHabilidad}
        estaPreparado={true}
        esDeSubclase={esHechizoDeSubclase(hechizo)}
        origenBadge={resolverOrigenConjuro(personajeActivo, hechizo)}
        esConcentracionActual={personajeActivo.concentracionActiva?.hechizoId === hechizo.id}
        enAcciones={true}
        alAlternarAcciones={alAlternarAcciones ? () => alternarEnAcciones(hechizo.id) : undefined}
        bloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        alAbrirDetalleCompleto={(h) => alAbrirDetalle(h)}
        alLanzar={(modo, niv) => alLanzar({ modo, hechizo, nivelLanzamiento: niv })}
        tieneLanzamientoGratisDisponible={tieneLanzamientoGratisDisponible}
        alLanzarGratis={
          tieneLanzamientoGratisDisponible
            ? async () => {
                await alLanzar({ modo: "gratuitoInnato", hechizo, nivelLanzamiento: hechizo.nivel });
              }
            : undefined
        }
        esLanzadorPacto={tienePacto}
        nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 0}
        espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
        espaciosPactoGastados={personajeActivo.espaciosPactoGastados || 0}
        espaciosConjuroMaximos={espaciosConjuroMaximos}
        espaciosConjuroGastados={personajeActivo.espaciosConjuroGastados}
        nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
        puntosConjuroDisponibles={Math.max(
          0,
          (personajeActivo.puntosConjuroMaximos || 0) - (personajeActivo.puntosConjuroGastados || 0)
        )}
        costePuntosPorNivel={COSTE_PUNTOS_POR_NIVEL}
        sistemaMagia={sistemaMagia}
      />
    );
  };

  return (
    <div className={estilos.seccionGrupoAtaques}>
      <div
        className={estilos.cabeceraGrupoAtaques}
        onClick={() => alAlternarSeccion("magicos")}
        role="button"
        tabIndex={0}
        title="Clic para mostrar u ocultar conjuros fijados en Acciones"
      >
        <div className={estilos.tituloGrupoAtaques}>
          <Sparkles size={14} color="var(--pj-texto-magia)" />
          <span>Conjuros y Acciones Mágicas</span>
          <span className={estilos.badgeConteoSeccion}>{conjurosFiltrados.length}</span>
        </div>
        <div className={estilos.ladoDerechoCabecera}>
          {estaAbiertaGeneral ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbiertaGeneral && (
        <div className={estilos.listaSeccionesNivelMagico}>
          {Array.from({ length: 10 }).map((_, nivel) => {
            const itemsNivel = conjurosPorNivel[nivel] || [];
            if (itemsNivel.length === 0) return null;
            const abierta = seccionesAbiertas[`magicos_nv_${nivel}`] !== false;

            return (
              <div key={`magicos-nv-${nivel}`} className={estilos.seccionNivelMagico}>
                <div
                  className={estilos.cabeceraNivelMagico}
                  onClick={() => alAlternarSeccion(`magicos_nv_${nivel}`)}
                  role="button"
                  tabIndex={0}
                  title={`Clic para ${abierta ? "colapsar" : "expandir"} ${nivel === 0 ? "trucos" : `conjuros de nivel ${nivel}`}`}
                >
                  <div className={estilos.tituloNivelMagico}>
                    {nivel === 0 ? (
                      <>
                        <Sparkles size={13} color="var(--pj-texto-magia)" />
                        <span>Trucos Listos</span>
                      </>
                    ) : (
                      <span>Nivel {nivel}</span>
                    )}
                    <span className={estilos.badgeConteoNivelMagico}>{itemsNivel.length}</span>
                  </div>
                  <div className={estilos.ladoDerechoCabeceraNivel}>
                    {abierta ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </div>
                </div>

                {abierta && (
                  <div className={estilos.listaTarjetasNivelMagico}>
                    {itemsNivel.map(({ hechizo }) => renderizarTarjetaConjuro(hechizo))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

