import React, { useMemo, useCallback } from "react";
import { Sparkles, ChevronDown, ChevronRight, EyeOff } from "lucide-react";
import { TarjetaConjuroCompacta } from "@/componentes/caracteristicas/personajes/TarjetaConjuroCompacta";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import type { SolicitudLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { resolverOrigenConjuro } from "@/servicios/resolutorOrigenConjuros";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { obtenerBonoDanoConjuroExtra, tieneConjuroGratuitoActivo } from "@/servicios/evaluadorEfectosRasgos";
import { obtenerModificadorAptitudMagica } from "@/servicios/calculadorMagia";
import { usarEstadoPersistido } from "@/hooks";
import type { ConjuroAccionElemento } from "./usarCalculoAtaquesJugador";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionAtaquesMagicosProps {
  conjurosFiltrados: ConjuroAccionElemento[];
  conjurosPorNivel: Record<number, ConjuroAccionElemento[]>;
  seccionesAbiertas: Record<string, boolean>;
  alAlternarSeccion: (seccion: string) => void;
  personajeActivo: PersonajeJugador;
  bonoAtaqueMagico: number;
  tienePacto: boolean;
  sistemaMagia: "espacios" | "puntos";
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  esHechizoDeSubclase: (hechizo: HechizoBase) => boolean;
  alAbrirDetalle: (hechizo: HechizoBase) => void;
  alLanzar: (solicitud: SolicitudLanzamiento) => Promise<boolean>;
}

export const SeccionAtaquesMagicos: React.FC<SeccionAtaquesMagicosProps> = ({
  conjurosFiltrados,
  conjurosPorNivel,
  seccionesAbiertas,
  alAlternarSeccion,
  personajeActivo,
  bonoAtaqueMagico,
  tienePacto,
  sistemaMagia,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  esHechizoDeSubclase,
  alAbrirDetalle,
  alLanzar
}) => {
  // Estado persistente para IDs de conjuros ocultados por el jugador (mismo estado de PanelConjurosPersonaje)
  const claveOcultosPj = `ts_conjuros_ocultos_${personajeActivo.id || "default"}`;
  const [conjurosOcultosIds, setConjurosOcultosIds] = usarEstadoPersistido<string[]>(
    claveOcultosPj,
    []
  );

  const alternarOculto = useCallback((hechizoId: string) => {
    setConjurosOcultosIds((prev) =>
      prev.includes(hechizoId) ? prev.filter((id) => id !== hechizoId) : [...prev, hechizoId]
    );
  }, [setConjurosOcultosIds]);

  const desocultarTodos = useCallback(() => {
    setConjurosOcultosIds([]);
  }, [setConjurosOcultosIds]);

  const conjurosOcultosSet = useMemo(() => new Set(conjurosOcultosIds), [conjurosOcultosIds]);

  // Clasificación de conjuros filtrados entre visibles y ocultos
  const { conjurosVisibles, conjurosOcultos } = useMemo(() => {
    const visibles: ConjuroAccionElemento[] = [];
    const ocultos: ConjuroAccionElemento[] = [];

    for (const item of conjurosFiltrados) {
      if (conjurosOcultosSet.has(item.hechizo.id)) {
        ocultos.push(item);
      } else {
        visibles.push(item);
      }
    }

    // Ordenar ocultos por nivel y alfabéticamente por nombre
    ocultos.sort((a, b) => {
      const nivA = a.hechizo.nivel || 0;
      const nivB = b.hechizo.nivel || 0;
      if (nivA !== nivB) return nivA - nivB;
      return a.hechizo.nombre.localeCompare(b.hechizo.nombre, "es", { sensitivity: "base" });
    });

    return { conjurosVisibles: visibles, conjurosOcultos: ocultos };
  }, [conjurosFiltrados, conjurosOcultosSet]);

  if (conjurosFiltrados.length === 0) {
    return null;
  }

  const estaAbiertaGeneral = seccionesAbiertas.magicos !== false;
  const estaAbiertaOcultos = seccionesAbiertas.magicos_ocultos !== false;

  const renderizarTarjetaConjuro = (hechizo: HechizoBase, esOculto: boolean) => {
    const nomHechizoNorm = hechizo.nombre.toLowerCase().trim();
    const rasgoInnatoGratuito = (personajeActivo.rasgos || []).find((r) => {
      if (!r.tieneUsosLimitados || typeof r.usosRestantes !== "number" || r.usosRestantes <= 0) return false;
      if (r.nivelRequerido && (personajeActivo.nivel || 1) < r.nivelRequerido) return false;
      const cOtorgados = r.conjurosOtorgados || [];
      return (
        cOtorgados.some((c) => coincideHechizoId(c, hechizo.id) || coincideHechizoId(c, hechizo.nombre)) ||
        r.nombre.toLowerCase().includes(nomHechizoNorm) ||
        nomHechizoNorm.includes(r.nombre.toLowerCase())
      );
    });
    const tieneLanzamientoGratisDisponible =
      Boolean(rasgoInnatoGratuito) || tieneConjuroGratuitoActivo(personajeActivo, hechizo.nombre);
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
        mostrarTogglePreparado={false}
        esDeSubclase={esHechizoDeSubclase(hechizo)}
        origenBadge={resolverOrigenConjuro(personajeActivo, hechizo)}
        esConcentracionActual={personajeActivo.concentracionActiva?.hechizoId === hechizo.id}
        esOculto={esOculto}
        alAlternarOcultar={() => alternarOculto(hechizo.id)}
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
        espaciosConjuroMaximos={personajeActivo.espaciosConjuroMaximos || {}}
        nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
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
        title="Clic para mostrar u ocultar conjuros y acciones mágicas"
      >
        <div className={estilos.tituloGrupoAtaques}>
          <Sparkles size={14} color="#c084fc" />
          <span>Conjuros y Acciones Mágicas</span>
          <span className={estilos.badgeConteoSeccion}>{conjurosVisibles.length}</span>
        </div>
        <div className={estilos.ladoDerechoCabecera}>
          {estaAbiertaGeneral ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbiertaGeneral && (
        <div className={estilos.listaSeccionesNivelMagico}>
          {Array.from({ length: 10 }).map((_, nivel) => {
            const itemsNivel = (conjurosPorNivel[nivel] || []).filter(
              ({ hechizo }) => !conjurosOcultosSet.has(hechizo.id)
            );
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
                        <Sparkles size={13} color="#a78bfa" />
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
                    {itemsNivel.map(({ hechizo }) => renderizarTarjetaConjuro(hechizo, false))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Subsección: Conjuros Ocultos */}
          {conjurosOcultos.length > 0 && (
            <div className={estilos.seccionOcultosMagicos}>
              <div
                className={estilos.cabeceraOcultosMagicos}
                onClick={() => alAlternarSeccion("magicos_ocultos")}
                role="button"
                tabIndex={0}
                title={`Clic para ${estaAbiertaOcultos ? "colapsar" : "expandir"} conjuros ocultos`}
              >
                <div className={estilos.tituloOcultosMagicos}>
                  <EyeOff size={14} color="#94a3b8" />
                  <span>Conjuros Ocultos</span>
                  <span className={estilos.badgeConteoOcultosMagicos}>{conjurosOcultos.length}</span>
                </div>
                <div className={estilos.ladoDerechoCabeceraNivel}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      desocultarTodos();
                    }}
                    className={estilos.botonDesocultarTodosMagicos}
                    title="Mostrar y devolver todos los conjuros a sus niveles correspondientes"
                  >
                    Mostrar todos
                  </button>
                  {estaAbiertaOcultos ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </div>
              </div>

              {estaAbiertaOcultos && (
                <div className={estilos.listaTarjetasNivelMagico}>
                  {conjurosOcultos.map(({ hechizo }) => renderizarTarjetaConjuro(hechizo, true))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

