import React from "react";
import { Sparkles, Flame, ArrowRight } from "lucide-react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { escribirEstadoPersistido } from "@/hooks";
import type { PersonajeJugador } from "@/tipos";
import estilos from "./VistaAtaquesJugador.module.css";

const CLAVE_SUBPESTANA_MAGIA = "ts_magia_subpestana";

interface PillRecursoMagico {
  texto: string;
  agotado: boolean;
}

interface SeccionRecursosMagicosAtaqueProps {
  personajeActivo: PersonajeJugador;
  espaciosConjuroMaximos: Record<string, number>;
  tienePacto: boolean;
  sistemaMagia: "espacios" | "puntos";
  alRomperConcentracion?: (pjId: string) => void;
  alIrAMagia?: () => void;
}

function construirPillsRecursosMagicos(
  personaje: PersonajeJugador,
  espaciosConjuroMaximos: Record<string, number>,
  tienePacto: boolean,
  sistemaMagia: "espacios" | "puntos"
): PillRecursoMagico[] {
  const pills: PillRecursoMagico[] = [];

  if (sistemaMagia === "puntos") {
    const max = personaje.puntosConjuroMaximos || 0;
    if (max > 0) {
      const disp = Math.max(0, max - (personaje.puntosConjuroGastados || 0));
      pills.push({ texto: `Puntos (${disp}/${max})`, agotado: disp === 0 });
    }
  } else {
    for (let nivel = 1; nivel <= 9; nivel++) {
      const max = espaciosConjuroMaximos[nivel] ?? 0;
      if (max > 0) {
        const disp = Math.max(0, max - (personaje.espaciosConjuroGastados?.[nivel] ?? 0));
        pills.push({ texto: `Nv.${nivel} (${disp}/${max})`, agotado: disp === 0 });
      }
    }
  }

  if (tienePacto) {
    const maxP = personaje.espaciosPactoMaximos || 0;
    if (maxP > 0) {
      const dispP = Math.max(0, maxP - (personaje.espaciosPactoGastados || 0));
      pills.push({
        texto: `Pacto Nv.${personaje.nivelEspacioPacto || 1} (${dispP}/${maxP})`,
        agotado: dispP === 0
      });
    }
  }

  return pills;
}

export const SeccionRecursosMagicosAtaque: React.FC<SeccionRecursosMagicosAtaqueProps> = ({
  personajeActivo,
  espaciosConjuroMaximos,
  tienePacto,
  sistemaMagia,
  alRomperConcentracion,
  alIrAMagia
}) => {
  const tieneConcentracion = Boolean(personajeActivo.concentracionActiva);
  const pillsRecursos = construirPillsRecursosMagicos(
    personajeActivo,
    espaciosConjuroMaximos,
    tienePacto,
    sistemaMagia
  );

  if (pillsRecursos.length === 0 && !tienePacto && !tieneConcentracion) {
    return null;
  }

  const irAMagia = () => {
    // Al navegar desde Acciones, forzamos aterrizar en la subpestaña de lanzamiento y recursos.
    escribirEstadoPersistido(CLAVE_SUBPESTANA_MAGIA, "lanzamiento");
    if (alIrAMagia) {
      alIrAMagia();
      return;
    }
    usarAlmacenDM.getState().establecerPestaña("magia");
  };

  return (
    <section
      className={estilos.puenteEstadoMagia}
      data-concentracion={tieneConcentracion ? "true" : "false"}
      aria-label="Resumen de recursos mágicos"
    >
      {tieneConcentracion && personajeActivo.concentracionActiva ? (
        <>
          <div className={estilos.filaSuperiorPuenteMagia}>
            <div className={estilos.estadoConcentracionPuente}>
              <Flame size={14} color="var(--pj-texto-oro)" aria-hidden="true" />
              <span className={estilos.etiquetaConcentracionPuente}>
                Conc.: <strong>{personajeActivo.concentracionActiva.nombreHechizo}</strong>
              </span>
              <button
                type="button"
                className={estilos.botonRomperPuente}
                onClick={() => alRomperConcentracion?.(personajeActivo.id)}
              >
                Romper
              </button>
            </div>

            <button
              type="button"
              className={estilos.botonIrAMagia}
              onClick={irAMagia}
              title="Abrir la pestaña Magia para gestionar ranuras y conjuros"
            >
              <span>Ir a Magia</span>
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>

          {pillsRecursos.length > 0 && (
            <div className={estilos.resumenRecursosPuente}>
              {pillsRecursos.map((pill) => (
                <span
                  key={pill.texto}
                  className={estilos.pillRecursoPuente}
                  data-agotado={pill.agotado ? "true" : "false"}
                >
                  {pill.texto}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className={estilos.filaCompactaPuenteMagia}>
          <div className={estilos.grupoIzquierdoPuenteCompacto}>
            <Sparkles size={13} color="var(--pj-texto-magia)" aria-hidden="true" />
            <span className={estilos.tituloPuenteMagia}>Estado Mágico</span>
            {pillsRecursos.map((pill) => (
              <span
                key={pill.texto}
                className={estilos.pillRecursoPuente}
                data-agotado={pill.agotado ? "true" : "false"}
              >
                {pill.texto}
              </span>
            ))}
          </div>

          <button
            type="button"
            className={estilos.botonIrAMagia}
            onClick={irAMagia}
            title="Abrir la pestaña Magia para gestionar ranuras y conjuros"
          >
            <span>Ir a Magia</span>
            <ArrowRight size={12} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
};
