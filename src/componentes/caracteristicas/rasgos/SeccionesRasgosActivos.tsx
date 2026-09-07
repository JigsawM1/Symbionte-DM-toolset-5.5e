import React from "react";
import type { PersonajeJugador, RasgoPersonaje, OrigenRasgo } from "@/tipos";
import {
  ChevronDown,
  ChevronRight,
  User,
  Award,
  Layers,
  Plus
} from "lucide-react";
import type { DatosJerarquicosRasgos, SeccionesColapsadas } from "./usarVistaRasgos";
import { GrupoClaseRasgos } from "./GrupoClaseRasgos";
import estilos from "./VistaRasgosJugador.module.css";

interface SeccionesRasgosActivosProps {
  personajeActivo: PersonajeJugador;
  datosJerarquicos: DatosJerarquicosRasgos;
  seccionesColapsadas: SeccionesColapsadas;
  alternarColapso: (clave: string) => void;
  abrirModalCreacion: (origen: OrigenRasgo) => void;
  renderizarTarjetaRasgo: (rasgo: RasgoPersonaje, idx: number) => React.ReactNode;
  actualizarSeleccionRasgo: (
    idPersonaje: string,
    idRasgo: string,
    idSelector: string,
    valores: string[]
  ) => void;
}

export const SeccionesRasgosActivos: React.FC<SeccionesRasgosActivosProps> = ({
  personajeActivo,
  datosJerarquicos,
  seccionesColapsadas,
  alternarColapso,
  abrirModalCreacion,
  renderizarTarjetaRasgo,
  actualizarSeleccionRasgo
}) => {
  return (
    <>
      {/* BLOQUE 1: ESPECIE / RAZA */}
      {datosJerarquicos.especie.length > 0 && (
        <div className={estilos.seccionPrincipal}>
          <div
            className={estilos.cabeceraSeccionPrincipal}
            onClick={() => alternarColapso("especie")}
          >
            <div className={estilos.ladoIzquierdoCabecera}>
              {seccionesColapsadas.especie ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              <User size={13} color="#10b981" />
              <span className={estilos.tituloSeccion}>
                Raza: {personajeActivo.especie || "Humano"}
                {personajeActivo.subespecie ? ` (${personajeActivo.subespecie})` : ""}
              </span>
              <span className={estilos.badgeConteoSeccion}>
                {datosJerarquicos.especie.length}
              </span>
            </div>
          </div>

          {!seccionesColapsadas.especie && (
            <div className={estilos.cuerpoSeccionPrincipal}>
              {datosJerarquicos.especie.map(renderizarTarjetaRasgo)}
            </div>
          )}
        </div>
      )}

      {/* BLOQUE 2: CLASES, SUBCLASES E INVOCACIONES */}
      {datosJerarquicos.clases.map((mc) => (
        <GrupoClaseRasgos
          key={`grupo_clase_${mc.clase.nombre}`}
          grupo={mc}
          idPersonaje={personajeActivo.id}
          seccionesColapsadas={seccionesColapsadas}
          alternarColapso={alternarColapso}
          renderizarTarjetaRasgo={renderizarTarjetaRasgo}
          actualizarSeleccionRasgo={actualizarSeleccionRasgo}
        />
      ))}

      {/* BLOQUE 3: DOTES */}
      {datosJerarquicos.dotes.length > 0 && (
        <div className={estilos.seccionPrincipal}>
          <div
            className={estilos.cabeceraSeccionPrincipal}
            onClick={() => alternarColapso("dotes")}
          >
            <div className={estilos.ladoIzquierdoCabecera}>
              {seccionesColapsadas.dotes ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              <Award size={13} color="#a78bfa" />
              <span className={estilos.tituloSeccion}>Dotes</span>
              <span className={estilos.badgeConteoSeccion}>
                {datosJerarquicos.dotes.length}
              </span>
            </div>

            <button
              type="button"
              className={estilos.botonHerramienta}
              style={{ padding: "2px 6px", fontSize: 10.5 }}
              onClick={(e) => {
                e.stopPropagation();
                abrirModalCreacion("dote");
              }}
              title="Añadir nueva dote"
            >
              <Plus size={11} />
              <span>Dote</span>
            </button>
          </div>

          {!seccionesColapsadas.dotes && (
            <div className={estilos.cuerpoSeccionPrincipal}>
              {datosJerarquicos.dotes.map(renderizarTarjetaRasgo)}
            </div>
          )}
        </div>
      )}

      {/* BLOQUE 4: PERSONALIZADOS Y HOMEBREW */}
      <div className={estilos.seccionPrincipal}>
        <div
          className={estilos.cabeceraSeccionPrincipal}
          onClick={() => alternarColapso("personalizados")}
        >
          <div className={estilos.ladoIzquierdoCabecera}>
            {seccionesColapsadas.personalizados ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
            <Layers size={13} color="#38bdf8" />
            <span className={estilos.tituloSeccion}>
              Rasgos Personalizados y Homebrew
            </span>
            <span className={estilos.badgeConteoSeccion}>
              {datosJerarquicos.personalizados.length}
            </span>
          </div>

          <button
            type="button"
            className={`${estilos.botonHerramienta} ${estilos.botonHerramientaPrimario}`}
            style={{ padding: "2px 6px", fontSize: 10.5 }}
            onClick={(e) => {
              e.stopPropagation();
              abrirModalCreacion("personalizado");
            }}
            title="Crear rasgo o dote Homebrew"
          >
            <Plus size={11} />
            <span>Crear Homebrew</span>
          </button>
        </div>

        {!seccionesColapsadas.personalizados && (
          <div className={estilos.cuerpoSeccionPrincipal}>
            {datosJerarquicos.personalizados.length === 0 ? (
              <div style={{ textAlign: "center", padding: "12px 6px", color: "#64748b", fontSize: 11.5 }}>
                No has añadido rasgos personalizados o homebrew. Pulsa en "+ Crear Homebrew" para agregar uno.
              </div>
            ) : (
              datosJerarquicos.personalizados.map(renderizarTarjetaRasgo)
            )}
          </div>
        )}
      </div>
    </>
  );
};
