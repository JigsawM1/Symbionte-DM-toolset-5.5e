import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Clock,
  FlaskConical,
  Sliders,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import type { RasgoAccionCombate, FiltroAccion } from "./usarCalculoAtaquesJugador";
import { TarjetaRasgo } from "@/componentes/caracteristicas/rasgos/TarjetaRasgo";
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
  alGastarUso: (idPj: string, idRasgo: string) => void;
  alRecuperarUso: (idPj: string, idRasgo: string) => void;
  alAlternarActivo: (idPj: string, idRasgo: string) => void;
  obtenerBloqueoToggleRasgo: (r: RasgoPersonaje) => { bloqueado: boolean; motivo?: string };
  resolverRecursosPadre: (r: RasgoPersonaje) => {
    usosPadre?: { restantes: number; maximos: number; nombre: string };
    formulaDadosEfectiva?: string;
  };
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
  resolverRecursosPadre
}) => {
  const [subseccionesAbiertas, setSubseccionesAbiertas] = useState<Record<string, boolean>>({
    acciones: true,
    adicionales: true,
    reacciones: true,
    consumibles: true,
    activables: true
  });

  const alternarSubseccion = (clave: string) => {
    setSubseccionesAbiertas((prev) => ({
      ...prev,
      [clave]: !prev[clave]
    }));
  };

  if (rasgosFiltrados.length === 0) {
    return null;
  }

  const renderTarjeta = (item: RasgoAccionCombate, index: number) => {
    const bloqueo = obtenerBloqueoToggleRasgo(item.rasgo);
    const recursosPadre = resolverRecursosPadre(item.rasgo);

    return (
      <TarjetaRasgo
        key={`rasgo_accion_${item.rasgo.id}_${item.rasgo.nivelRequerido || 0}_${index}`}
        rasgo={item.rasgo}
        nombrePersonaje={personajeActivo.nombre || "Personaje"}
        idPersonaje={personajeActivo.id}
        alGastarUso={() => alGastarUso(personajeActivo.id, item.rasgo.id)}
        alRecuperarUso={() => alRecuperarUso(personajeActivo.id, item.rasgo.id)}
        alAlternarActivo={() => alAlternarActivo(personajeActivo.id, item.rasgo.id)}
        deshabilitadoToggle={bloqueo.bloqueado}
        motivoDeshabilitado={bloqueo.motivo}
        alVerDetalle={() => alAbrirDetalle(item.rasgo)}
        usosPadre={recursosPadre.usosPadre}
        formulaDadosEfectiva={recursosPadre.formulaDadosEfectiva}
      />
    );
  };

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
          <Sparkles size={14} color="#38bdf8" />
          <span>Rasgos y Habilidades Tácticas</span>
          <span className={estilos.badgeConteoSeccion}>{rasgosFiltrados.length}</span>
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
              {/* 1. Subsección: Acciones */}
              {rasgosAcciones.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("acciones")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de acciones"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <Zap size={13} color="#f59e0b" />
                      <span>Acciones</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{rasgosAcciones.length}</span>
                      {subseccionesAbiertas.acciones !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.acciones !== false && (
                    <div className={estilos.listaAtaques}>
                      {rasgosAcciones.map((item, idx) => renderTarjeta(item, idx))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Subsección: Acciones Adicionales */}
              {rasgosAccionesAdicionales.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("adicionales")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de acciones adicionales"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <Clock size={13} color="#38bdf8" />
                      <span>Acciones Adicionales</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{rasgosAccionesAdicionales.length}</span>
                      {subseccionesAbiertas.adicionales !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.adicionales !== false && (
                    <div className={estilos.listaAtaques}>
                      {rasgosAccionesAdicionales.map((item, idx) => renderTarjeta(item, idx))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Subsección: Reacciones */}
              {rasgosReacciones.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("reacciones")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de reacciones"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <Sparkles size={13} color="#c084fc" />
                      <span>Reacciones</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{rasgosReacciones.length}</span>
                      {subseccionesAbiertas.reacciones !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.reacciones !== false && (
                    <div className={estilos.listaAtaques}>
                      {rasgosReacciones.map((item, idx) => renderTarjeta(item, idx))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Subsección: Recursos Tácticos y Consumibles */}
              {rasgosConsumibles.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("consumibles")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de recursos tácticos y consumibles"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <FlaskConical size={13} color="#10b981" />
                      <span>Recursos Tácticos y Consumibles</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{rasgosConsumibles.length}</span>
                      {subseccionesAbiertas.consumibles !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.consumibles !== false && (
                    <div className={estilos.listaAtaques}>
                      {rasgosConsumibles.map((item, idx) => renderTarjeta(item, idx))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Subsección: Activables y Modos Tácticos */}
              {rasgosActivables.length > 0 && (
                <div className={estilos.seccionNivelMagico}>
                  <div
                    className={estilos.cabeceraNivelMagico}
                    onClick={() => alternarSubseccion("activables")}
                    role="button"
                    tabIndex={0}
                    title="Clic para alternar subsección de activables y modos tácticos"
                  >
                    <div className={estilos.tituloNivelMagico}>
                      <Sliders size={13} color="#ec4899" />
                      <span>Activables y Modos de Combate</span>
                    </div>
                    <div className={estilos.ladoDerechoCabecera}>
                      <span className={estilos.badgeConteoNivelMagico}>{rasgosActivables.length}</span>
                      {subseccionesAbiertas.activables !== false ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </div>
                  </div>
                  {subseccionesAbiertas.activables !== false && (
                    <div className={estilos.listaAtaques}>
                      {rasgosActivables.map((item, idx) => renderTarjeta(item, idx))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Vista Filtrada Táctica Directa */
            <div className={estilos.listaAtaques}>
              {rasgosFiltrados.map((item, idx) => renderTarjeta(item, idx))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeccionRasgosAtaque;
