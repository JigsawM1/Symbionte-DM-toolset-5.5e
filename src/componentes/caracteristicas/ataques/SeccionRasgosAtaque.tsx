import React, { useMemo, useCallback, useState } from "react";
import { Zap, ChevronDown, ChevronRight, EyeOff, PawPrint } from "lucide-react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import type { RasgoAccionCombate } from "./usarCalculoAtaquesJugador";
import { TarjetaRasgo } from "@/componentes/caracteristicas/rasgos/TarjetaRasgo";
import { DivisorSeccionAccion } from "./DivisorSeccionAccion";
import { obtenerBestiaFormaActiva } from "@/servicios/reglasFormaSalvaje";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionRasgosAtaqueProps {
  personajeActivo: PersonajeJugador;
  rasgosFiltrados: RasgoAccionCombate[];
  mostrarDivisor?: boolean;
  ocultosAbiertos?: boolean;
  alAlternarOcultos?: () => void;
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

/**
 * Renderiza el bloque plano de rasgos tácticos de combate (Propuesta A),
 * separando Forma Salvaje cuando está activa y manteniendo el cajón de Rasgos Ocultos
 * como único colapsable al pie (cerrado por defecto).
 */
export const SeccionRasgosAtaque: React.FC<SeccionRasgosAtaqueProps> = ({
  personajeActivo,
  rasgosFiltrados,
  mostrarDivisor = true,
  ocultosAbiertos,
  alAlternarOcultos,
  alAbrirDetalle,
  alGastarUso,
  alRecuperarUso,
  alAlternarActivo,
  obtenerBloqueoToggleRasgo,
  resolverRecursosPadre,
  alAlternarOcultar,
  alDesocultarTodos
}) => {
  const [ocultosAbiertosLocal, setOcultosAbiertosLocal] = useState(false);
  const estaAbiertoOcultos = ocultosAbiertos ?? ocultosAbiertosLocal;

  const alternarCajonOcultos = useCallback(() => {
    if (alAlternarOcultos) {
      alAlternarOcultos();
      return;
    }
    setOcultosAbiertosLocal((prev) => !prev);
  }, [alAlternarOcultos]);

  const { rasgosVisibles, rasgosOcultos } = useMemo(() => {
    const visibles: RasgoAccionCombate[] = [];
    const ocultos: RasgoAccionCombate[] = [];

    for (const item of rasgosFiltrados) {
      if (item.rasgo.oculto) {
        ocultos.push(item);
      } else {
        visibles.push(item);
      }
    }

    ocultos.sort((a, b) =>
      a.rasgo.nombre.localeCompare(b.rasgo.nombre, "es", { sensitivity: "base" })
    );

    return { rasgosVisibles: visibles, rasgosOcultos: ocultos };
  }, [rasgosFiltrados]);

  const bestiaActiva = useMemo(
    () => (personajeActivo ? obtenerBestiaFormaActiva(personajeActivo) : null),
    [personajeActivo]
  );

  const { rasgosFormaSalvaje, rasgosClaseVisibles } = useMemo(() => {
    if (!bestiaActiva) {
      return { rasgosFormaSalvaje: [] as RasgoAccionCombate[], rasgosClaseVisibles: rasgosVisibles };
    }
    const forma: RasgoAccionCombate[] = [];
    const clase: RasgoAccionCombate[] = [];
    for (const item of rasgosVisibles) {
      if (item.esDeFormaSalvaje) {
        forma.push(item);
      } else {
        clase.push(item);
      }
    }
    return { rasgosFormaSalvaje: forma, rasgosClaseVisibles: clase };
  }, [bestiaActiva, rasgosVisibles]);

  if (rasgosFiltrados.length === 0) {
    return null;
  }

  const renderTarjeta = (item: RasgoAccionCombate, index: number, esOculto = false) => {
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
        alAlternarOcultar={() => alAlternarOcultar?.(personajeActivo.id, item.rasgo.id)}
      />
    );
  };

  return (
    <section className={estilos.bloqueSeccionPlana} aria-label="Rasgos y habilidades tácticas">
      {bestiaActiva && rasgosFormaSalvaje.length > 0 && (
        <div className={estilos.bloqueSeccionPlana}>
          <DivisorSeccionAccion
            icono={<PawPrint size={13} color="var(--pj-texto-exito)" aria-hidden="true" />}
            titulo={`Forma salvaje: ${bestiaActiva.nombre}`}
            conteo={rasgosFormaSalvaje.length}
            tono="exito"
          />
          <div className={estilos.listaAtaques}>
            {rasgosFormaSalvaje.map((item, idx) => renderTarjeta(item, idx, false))}
          </div>
        </div>
      )}

      {rasgosClaseVisibles.length > 0 && (
        <div className={estilos.bloqueSeccionPlana}>
          {mostrarDivisor && (
            <DivisorSeccionAccion
              icono={<Zap size={13} color="var(--pj-texto-oro)" aria-hidden="true" />}
              titulo="Rasgos de Acción"
              conteo={rasgosClaseVisibles.length}
              tono="oro"
            />
          )}
          <div className={estilos.listaAtaques}>
            {rasgosClaseVisibles.map((item, idx) => renderTarjeta(item, idx, false))}
          </div>
        </div>
      )}

      {rasgosOcultos.length > 0 && (
        <div className={estilos.seccionOcultosRasgos}>
          <div className={estilos.barraCabeceraOcultosRasgos}>
            <button
              type="button"
              className={estilos.botonColapsarOcultosRasgos}
              onClick={alternarCajonOcultos}
              aria-expanded={estaAbiertoOcultos}
              title={`Clic para ${estaAbiertoOcultos ? "colapsar" : "expandir"} rasgos ocultos`}
            >
              <div className={estilos.tituloOcultosRasgos}>
                <EyeOff size={14} color="var(--pj-texto-terciario)" aria-hidden="true" />
                <span>Rasgos Ocultos</span>
                <span className={estilos.badgeConteoOcultosRasgos}>{rasgosOcultos.length}</span>
              </div>
              <div className={estilos.ladoDerechoCabeceraNivel}>
                {estaAbiertoOcultos ? (
                  <ChevronDown size={13} aria-hidden="true" />
                ) : (
                  <ChevronRight size={13} aria-hidden="true" />
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => alDesocultarTodos?.(personajeActivo.id)}
              className={estilos.botonDesocultarTodosRasgos}
              title="Mostrar y devolver todos los rasgos a sus categorías correspondientes"
            >
              Mostrar todos
            </button>
          </div>

          {estaAbiertoOcultos && (
            <div className={estilos.listaAtaques}>
              {rasgosOcultos.map((item, idx) => renderTarjeta(item, idx, true))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
