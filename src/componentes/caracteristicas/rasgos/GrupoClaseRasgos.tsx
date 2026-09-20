import React, { useMemo } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { ChevronDown, ChevronRight, Sparkles, Swords, Flame } from "lucide-react";
import { obtenerMaxInvocacionesBrujo } from "@/constantes/invocacionesSobrenaturales";
import { SelectorInvocacionesAcordeon } from "./SelectorInvocacionesAcordeon";
import type { GrupoClaseJerarquico, SeccionesColapsadas } from "./usarVistaRasgos";
import estilos from "./VistaRasgosJugador.module.css";

interface GrupoClaseRasgosProps {
  grupo: GrupoClaseJerarquico;
  idPersonaje: string;
  seccionesColapsadas: SeccionesColapsadas;
  alternarColapso: (clave: string) => void;
  renderizarTarjetaRasgo: (rasgo: RasgoPersonaje, idx: number) => React.ReactNode;
  actualizarSeleccionRasgo: (
    idPersonaje: string,
    idRasgo: string,
    idSelector: string,
    valores: string[]
  ) => void;
}

export const GrupoClaseRasgos: React.FC<GrupoClaseRasgosProps> = ({
  grupo,
  idPersonaje,
  seccionesColapsadas,
  alternarColapso,
  renderizarTarjetaRasgo,
  actualizarSeleccionRasgo
}) => {
  const claseColapsada = !!seccionesColapsadas[grupo.claveColapsoClase];
  const subclaseColapsada = !!seccionesColapsadas[grupo.claveColapsoSubclase];
  const invocacionesColapsada = !!seccionesColapsadas[grupo.claveColapsoInvocaciones];

  const selectorInvocaciones = grupo.rasgoInvocaciones?.selectores?.[0];
  const aprendidasInvocaciones = selectorInvocaciones?.valorActual || [];
  const maxInvocaciones = useMemo(() => {
    if (selectorInvocaciones?.escaladoMaxSelecciones && grupo.clase.nivel) {
      const entrada = [...selectorInvocaciones.escaladoMaxSelecciones]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => grupo.clase.nivel >= e.nivelMinimo);
      if (entrada) return entrada.valor;
    }
    if (grupo.clase.nivel) {
      return obtenerMaxInvocacionesBrujo(grupo.clase.nivel);
    }
    return selectorInvocaciones?.maxSelecciones || 1;
  }, [selectorInvocaciones, grupo.clase.nivel]);

  return (
    <React.Fragment key={`grupo_clase_${grupo.clase.nombre}`}>
      {/* Rasgos de Clase Base */}
      {grupo.rasgosBase.length > 0 && (
        <div className={estilos.seccionPrincipal}>
          <div
            className={estilos.cabeceraSeccionPrincipal}
            onClick={() => alternarColapso(grupo.claveColapsoClase)}
          >
            <div className={estilos.ladoIzquierdoCabecera}>
              {claseColapsada ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              <Swords size={13} color="#d4af37" />
              <span className={estilos.tituloSeccion}>
                Clase: {grupo.clase.nombre} (Nivel {grupo.clase.nivel})
              </span>
              <span className={estilos.badgeConteoSeccion}>
                {grupo.rasgosBase.length}
              </span>
            </div>
          </div>

          {!claseColapsada && (
            <div className={estilos.cuerpoSeccionPrincipal}>
              {grupo.rasgosBase.map(renderizarTarjetaRasgo)}
            </div>
          )}
        </div>
      )}

      {/* Rasgos de Subclase */}
      {grupo.rasgosSubclase.length > 0 && (
        <div className={`${estilos.seccionPrincipal} ${estilos.seccionSubclase}`}>
          <div
            className={estilos.cabeceraSeccionPrincipal}
            onClick={() => alternarColapso(grupo.claveColapsoSubclase)}
          >
            <div className={estilos.ladoIzquierdoCabecera}>
              {subclaseColapsada ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              <Sparkles size={13} color="#38bdf8" />
              <span className={`${estilos.tituloSeccion} ${estilos.tituloSubclase}`}>
                Subclase: {grupo.clase.subclase || "Especialización"} ({grupo.clase.nombre})
              </span>
              <span className={estilos.badgeConteoSeccion}>
                {grupo.rasgosSubclase.length}
              </span>
            </div>
          </div>

          {!subclaseColapsada && (
            <div className={estilos.cuerpoSeccionPrincipal}>
              {grupo.rasgosSubclase.map(renderizarTarjetaRasgo)}
            </div>
          )}
        </div>
      )}

      {/* Invocaciones Sobrenaturales */}
      {grupo.rasgoInvocaciones && selectorInvocaciones && (
        <div className={`${estilos.seccionPrincipal} ${estilos.seccionInvocaciones}`}>
          <div
            className={estilos.cabeceraSeccionPrincipal}
            onClick={() => alternarColapso(grupo.claveColapsoInvocaciones)}
          >
            <div className={estilos.ladoIzquierdoCabecera}>
              {invocacionesColapsada ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              <Flame size={13} color="#a78bfa" />
              <span className={`${estilos.tituloSeccion} ${estilos.tituloInvocaciones}`}>
                Invocaciones Sobrenaturales ({grupo.clase.nombre})
              </span>
              <span className={`${estilos.badgeConteoSeccion} ${estilos.badgeInvocaciones}`}>
                {aprendidasInvocaciones.length} / {maxInvocaciones}
              </span>
            </div>
          </div>

          {!invocacionesColapsada && (
            <div className={`${estilos.cuerpoSeccionPrincipal} ${estilos.cuerpoInvocaciones}`}>
              <SelectorInvocacionesAcordeon
                selector={selectorInvocaciones}
                nivelPersonaje={grupo.clase.nivel}
                alActualizarSeleccion={(idSelector, valores) => {
                  if (grupo.rasgoInvocaciones) {
                    actualizarSeleccionRasgo(
                      idPersonaje,
                      grupo.rasgoInvocaciones.id,
                      idSelector,
                      valores
                    );
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
};
