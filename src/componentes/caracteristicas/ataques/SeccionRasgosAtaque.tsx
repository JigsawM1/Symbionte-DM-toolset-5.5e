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

  const subsecciones: { clave: string; lista: RasgoAccionCombate[]; titulo: string; ayuda: string; icono: React.ReactNode }[] = [
    { clave: "activables", lista: activablesVisibles, titulo: "Activables y Modos de Combate", ayuda: "Clic para alternar subsección de activables y modos tácticos", icono: <Sliders size={13} color="var(--pj-texto-magia)" /> },
    { clave: "consumibles", lista: consumiblesVisibles, titulo: "Recursos Tácticos y Consumibles", ayuda: "Clic para alternar subsección de recursos tácticos y consumibles", icono: <FlaskConical size={13} color="var(--pj-texto-exito)" /> },
    { clave: "acciones", lista: accionesVisibles, titulo: "Acciones", ayuda: "Clic para alternar subsección de acciones", icono: <Zap size={13} color="var(--pj-texto-oro)" /> },
    { clave: "adicionales", lista: adicionalesVisibles, titulo: "Acciones Adicionales", ayuda: "Clic para alternar subsección de acciones adicionales", icono: <Clock size={13} color="var(--pj-texto-cian)" /> },
    { clave: "reacciones", lista: reaccionesVisibles, titulo: "Reacciones", ayuda: "Clic para alternar subsección de reacciones", icono: <Sparkles size={13} color="var(--pj-texto-magia)" /> }
  ];

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
              {subsecciones.map(({ clave, lista, titulo, ayuda, icono }) => (
                lista.length > 0 && (
                  <div key={clave} className={estilos.seccionNivelMagico}>
                    <div
                      className={estilos.cabeceraNivelMagico}
                      onClick={() => alternarSubseccion(clave)}
                      role="button"
                      tabIndex={0}
                      title={ayuda}
                    >
                      <div className={estilos.tituloNivelMagico}>
                        {icono}
                        <span>{titulo}</span>
                      </div>
                      <div className={estilos.ladoDerechoCabecera}>
                        <span className={estilos.badgeConteoNivelMagico}>{lista.length}</span>
                        {subseccionesAbiertas[clave] !== false ? (
                          <ChevronDown size={13} />
                        ) : (
                          <ChevronRight size={13} />
                        )}
                      </div>
                    </div>
                    {subseccionesAbiertas[clave] !== false && (
                      <div className={estilos.listaAtaques}>
                        {lista.map((item, idx) => renderTarjeta(item, idx, false))}
                      </div>
                    )}
                  </div>
                )
              ))}

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
