import React, { useMemo, useCallback } from "react";
import {
  Sparkles,
  Zap,
  Clock,
  FlaskConical,
  Sliders,
  ChevronDown,
  ChevronRight,
  EyeOff
} from "lucide-react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import type { RasgoAccionCombate, FiltroAccion } from "./usarCalculoAtaquesJugador";
import { TarjetaRasgo } from "@/componentes/caracteristicas/rasgos/TarjetaRasgo";
import { usarEstadoPersistido } from "@/hooks";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionRasgosAtaqueProps {
  personajeActivo: PersonajeJugador;
  filtro: FiltroAccion;
  rasgosFiltrados: RasgoAccionCombate[];
  rasgosAcciones: RasgoAccionCombate[];
  rasgosAccionesAdicionales: RasgoAccionCombate[];
  rasgosReacciones: RasgoAccionCombate[];
  rasgosConsumibles: RasgoAccionCombate[];
  rasgosActivables: RasgoAccionCombate[];
  estaAbierta: boolean;
  alAlternar: () => void;
  alAbrirDetalle: (rasgo: RasgoPersonaje) => void;
  alGastarUso: (idPj: string, idRasgo: string, cantidad?: number) => void;
  alRecuperarUso: (idPj: string, idRasgo: string, cantidad?: number) => void;
  alAlternarActivo: (idPj: string, idRasgo: string) => void;
  obtenerBloqueoToggleRasgo: (r: RasgoPersonaje) => { bloqueado: boolean; motivo?: string };
  resolverRecursosPadre: (r: RasgoPersonaje) => {
    usosPadre?: { restantes: number; maximos: number; nombre: string };
    formulaDadosEfectiva?: string;
  };
  alAlternarOcultar?: (idPj: string, idRasgo: string) => void;
  alDesocultarTodos?: (idPj: string) => void;
}

export const SeccionRasgosAtaque: React.FC<SeccionRasgosAtaqueProps> = ({
  personajeActivo,
  filtro,
  rasgosFiltrados,
  rasgosAcciones,
  rasgosAccionesAdicionales,
  rasgosReacciones,
  rasgosConsumibles,
  rasgosActivables,
  estaAbierta,
  alAlternar,
  alAbrirDetalle,
  alGastarUso,
  alRecuperarUso,
  alAlternarActivo,
  obtenerBloqueoToggleRasgo,
  resolverRecursosPadre,
  alAlternarOcultar,
  alDesocultarTodos
}) => {
  const alternarOculto = useCallback((rasgoId: string) => {
    alAlternarOcultar?.(personajeActivo.id, rasgoId);
  }, [alAlternarOcultar, personajeActivo.id]);

  const desocultarTodos = useCallback(() => {
    alDesocultarTodos?.(personajeActivo.id);
  }, [alDesocultarTodos, personajeActivo.id]);

  const esRasgoOculto = useCallback(
    (item: RasgoAccionCombate) => Boolean(item.rasgo.oculto),
    []
  );

  // Clasificación de rasgos filtrados entre visibles y ocultos
  const { rasgosVisibles, rasgosOcultos } = useMemo(() => {
    const visibles: RasgoAccionCombate[] = [];
    const ocultos: RasgoAccionCombate[] = [];

    for (const item of rasgosFiltrados) {
      if (esRasgoOculto(item)) {
        ocultos.push(item);
      } else {
        visibles.push(item);
      }
    }

    ocultos.sort((a, b) => a.rasgo.nombre.localeCompare(b.rasgo.nombre, "es", { sensitivity: "base" }));

    return { rasgosVisibles: visibles, rasgosOcultos: ocultos };
  }, [rasgosFiltrados, esRasgoOculto]);

  const [subseccionesAbiertas, setSubseccionesAbiertas] = usarEstadoPersistido<Record<string, boolean>>(
    "ts_acciones_subsecciones_rasgos",
    {
      activables: true,
      consumibles: true,
      acciones: true,
      adicionales: true,
      reacciones: true,
      ocultos: true
    }
  );

  const alternarSubseccion = (clave: string) => {
    setSubseccionesAbiertas((prev) => {
      const estaAbiertaSub = prev[clave] !== false;
      return {
        ...prev,
        [clave]: !estaAbiertaSub
      };
    });
  };

  // Subcategorías visibles excluyendo rasgos ocultos
  const accionesVisibles = useMemo(
    () => rasgosAcciones.filter((item) => !esRasgoOculto(item)),
    [rasgosAcciones, esRasgoOculto]
  );
  const adicionalesVisibles = useMemo(
    () => rasgosAccionesAdicionales.filter((item) => !esRasgoOculto(item)),
    [rasgosAccionesAdicionales, esRasgoOculto]
  );
  const reaccionesVisibles = useMemo(
    () => rasgosReacciones.filter((item) => !esRasgoOculto(item)),
    [rasgosReacciones, esRasgoOculto]
  );
  const consumiblesVisibles = useMemo(
    () => rasgosConsumibles.filter((item) => !esRasgoOculto(item)),
    [rasgosConsumibles, esRasgoOculto]
  );
  const activablesVisibles = useMemo(
    () => rasgosActivables.filter((item) => !esRasgoOculto(item)),
    [rasgosActivables, esRasgoOculto]
  );

  if (rasgosFiltrados.length === 0) {
    return null;
  }

  const renderTarjeta = (item: RasgoAccionCombate, index: number, esOculto: boolean = false) => {
    const bloqueo = obtenerBloqueoToggleRasgo(item.rasgo);
    const recursosPadre = resolverRecursosPadre(item.rasgo);

    return (
      <TarjetaRasgo
        key={`rasgo_accion_${item.rasgo.id}_${item.rasgo.nivelRequerido || 0}_${index}`}
        rasgo={item.rasgo}
        nombrePersonaje={personajeActivo.nombre || "Personaje"}
        idPersonaje={personajeActivo.id}
        alGastarUso={(cant?: number) => alGastarUso(personajeActivo.id, item.rasgo.id, cant)}
        alRecuperarUso={(cant?: number) => alRecuperarUso(personajeActivo.id, item.rasgo.id, cant)}
        alAlternarActivo={() => alAlternarActivo(personajeActivo.id, item.rasgo.id)}
        deshabilitadoToggle={bloqueo.bloqueado}
        motivoDeshabilitado={bloqueo.motivo}
        alVerDetalle={() => alAbrirDetalle(item.rasgo)}
        usosPadre={recursosPadre.usosPadre}
        formulaDadosEfectiva={recursosPadre.formulaDadosEfectiva}
        esOculto={esOculto}
        alAlternarOcultar={() => alternarOculto(item.rasgo.id)}
      />
    );
  };

  const subseccionOcultos = rasgosOcultos.length > 0 && (
    <div className={estilos.seccionOcultosRasgos}>
      <div
        className={estilos.cabeceraOcultosRasgos}
        onClick={() => alternarSubseccion("ocultos")}
        role="button"
        tabIndex={0}
        title={`Clic para ${subseccionesAbiertas.ocultos !== false ? "colapsar" : "expandir"} rasgos ocultos`}
      >
        <div className={estilos.tituloOcultosRasgos}>
          <EyeOff size={14} color="var(--pj-texto-terciario)" />
          <span>Rasgos Ocultos</span>
          <span className={estilos.badgeConteoOcultosRasgos}>{rasgosOcultos.length}</span>
        </div>
        <div className={estilos.ladoDerechoCabeceraNivel}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              desocultarTodos();
            }}
            className={estilos.botonDesocultarTodosRasgos}
            title="Mostrar y devolver todos los rasgos a sus categorías correspondientes"
          >
            Mostrar todos
          </button>
          {subseccionesAbiertas.ocultos !== false ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </div>

      {subseccionesAbiertas.ocultos !== false && (
        <div className={estilos.listaAtaques}>
          {rasgosOcultos.map((item, idx) => renderTarjeta(item, idx, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className={estilos.seccionGrupoAtaques}>
      {/* Cabecera Principal de la Sección de Rasgos */}
      <div
        className={estilos.cabeceraGrupoAtaques}
        onClick={alAlternar}
        role="button"
        tabIndex={0}
        title="Clic para mostrar u ocultar rasgos y habilidades tácticas"
      >
        <div className={estilos.tituloGrupoAtaques}>
          <Sparkles size={14} color="var(--pj-texto-cian)" />
          <span>Rasgos y Habilidades Tácticas</span>
          <span className={estilos.badgeConteoSeccion}>{rasgosVisibles.length}</span>
        </div>
        <div className={estilos.ladoDerechoCabecera}>
          {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbierta && (
        <>
          {filtro === "todas" ? (
            /* Vista General agrupada en subsecciones colapsables */
            <div className={estilos.listaSeccionesNivelMagico}>
              {/* 1. Subsección: Activables y Modos de Combate */}
              {activablesVisibles.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("activables")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de activables y modos tácticos"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <Sliders size={13} color="var(--pj-texto-magia)" />
                      <span>Activables y Modos de Combate</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{activablesVisibles.length}</span>
                      {subseccionesAbiertas.activables !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.activables !== false && (
                    <div className={estilos.listaAtaques}>
                      {activablesVisibles.map((item, idx) => renderTarjeta(item, idx, false))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Subsección: Recursos Tácticos y Consumibles */}
              {consumiblesVisibles.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("consumibles")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de recursos tácticos y consumibles"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <FlaskConical size={13} color="var(--pj-texto-exito)" />
                      <span>Recursos Tácticos y Consumibles</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{consumiblesVisibles.length}</span>
                      {subseccionesAbiertas.consumibles !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.consumibles !== false && (
                    <div className={estilos.listaAtaques}>
                      {consumiblesVisibles.map((item, idx) => renderTarjeta(item, idx, false))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Subsección: Acciones */}
              {accionesVisibles.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("acciones")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de acciones"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <Zap size={13} color="var(--pj-texto-oro)" />
                      <span>Acciones</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{accionesVisibles.length}</span>
                      {subseccionesAbiertas.acciones !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.acciones !== false && (
                    <div className={estilos.listaAtaques}>
                      {accionesVisibles.map((item, idx) => renderTarjeta(item, idx, false))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Subsección: Acciones Adicionales */}
              {adicionalesVisibles.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("adicionales")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de acciones adicionales"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <Clock size={13} color="var(--pj-texto-cian)" />
                      <span>Acciones Adicionales</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{adicionalesVisibles.length}</span>
                      {subseccionesAbiertas.adicionales !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.adicionales !== false && (
                    <div className={estilos.listaAtaques}>
                      {adicionalesVisibles.map((item, idx) => renderTarjeta(item, idx, false))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Subsección: Reacciones */}
              {reaccionesVisibles.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("reacciones")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de reacciones"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <Sparkles size={13} color="var(--pj-texto-magia)" />
                      <span>Reacciones</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{reaccionesVisibles.length}</span>
                      {subseccionesAbiertas.reacciones !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.reacciones !== false && (
                    <div className={estilos.listaAtaques}>
                      {reaccionesVisibles.map((item, idx) => renderTarjeta(item, idx, false))}
                    </div>
                  )}
                </div>
              )}

              {/* Subsección: Rasgos Ocultos */}
              {subseccionOcultos}
            </div>
          ) : (
            /* Vista Filtrada Táctica Directa */
            <div className={estilos.listaAtaques}>
              {rasgosVisibles.map((item, idx) => renderTarjeta(item, idx, false))}
              {subseccionOcultos}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeccionRasgosAtaque;
