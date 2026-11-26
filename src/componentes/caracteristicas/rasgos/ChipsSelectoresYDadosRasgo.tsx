import React from "react";
import type { RasgoPersonaje } from "@/tipos";
import { Dices, X, Zap } from "lucide-react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { resolverExtensionesRasgos } from "@/servicios/rasgos/extensionesRasgos";
import { resumenRespuestaPredefinida } from "@/servicios/rasgos/respuestasPredefinidasRasgos";
import estilos from "./VistaRasgosJugador.module.css";

interface ChipsSelectoresYDadosRasgoProps {
  rasgo: RasgoPersonaje;
  idPersonaje?: string;
  alVerDetalle?: () => void;
}

export const ChipsSelectoresYDadosRasgo: React.FC<ChipsSelectoresYDadosRasgoProps> = ({
  rasgo,
  idPersonaje,
  alVerDetalle
}) => {
  const tieneSelectoresConOpciones =
    Array.isArray(rasgo.selectores) && rasgo.selectores.length > 0;
  const tieneDadosGuardados =
    Array.isArray(rasgo.dadosGuardados) && rasgo.dadosGuardados.length > 0;
  const pjParaResumen = idPersonaje && rasgo.respuestaPredefinida?.efectosTirada?.length
    ? usarAlmacenDM.getState().personajes.find((p) => p.id === idPersonaje)
    : undefined;
  const rasgoResumen = pjParaResumen
    ? resolverExtensionesRasgos(pjParaResumen.rasgos, pjParaResumen.nivel).find((r) => r.id === rasgo.id) ?? rasgo
    : rasgo;
  const resumenAuto = resumenRespuestaPredefinida(rasgoResumen);

  if (!tieneSelectoresConOpciones && !tieneDadosGuardados && !resumenAuto) {
    return null;
  }

  return (
    <>
      {/* Chips de opciones seleccionadas en selectores (ej. conjuros de Erudito, armas de Maestría, tamaño) */}
      {tieneSelectoresConOpciones && (
        <div className={estilos.contenedorChipsSelectores}>
          {rasgo.selectores!.map((sel) => {
            const opcionesElegidas = sel.opciones.filter((o) =>
              (sel.valorActual || []).some(
                (v) => v === o.id || v === o.id.replace(/^h_/, "") || o.id === `h_${v}`
              )
            );
            if (opcionesElegidas.length === 0) return null;
            return (
              <div key={sel.id} className={estilos.filaChipsSelector}>
                <span className={estilos.etiquetaChipsSelector}>{sel.etiqueta}:</span>
                {opcionesElegidas.map((op) => (
                  <span
                    key={op.id}
                    className={estilos.chipOpcionSeleccionada}
                    title={op.descripcion || op.nombre}
                    onClick={(e) => {
                      e.stopPropagation();
                      alVerDetalle?.();
                    }}
                  >
                    {op.nombre}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Chips de Dados Guardados interactivos (ej. Portento) */}
      {tieneDadosGuardados && (
        <div className={estilos.contenedorChipsSelectores}>
          <div className={estilos.filaChipsSelector}>
            <span className={estilos.etiquetaChipsSelector}>Dados de presagio:</span>
            {rasgo.dadosGuardados!.map((dado, idx) => (
              <button
                key={`dado-guardado-${idx}`}
                type="button"
                className={estilos.chipDadoPresagio}
                onClick={(e) => {
                  e.stopPropagation();
                  if (idPersonaje) {
                    usarAlmacenDM.getState().consumirDadoGuardado(idPersonaje, rasgo.id, idx);
                    usarAlmacenDM.getState().agregarNotificacion(
                      `¡Dado de presagio (${dado}) utilizado!`,
                      "info"
                    );
                  }
                }}
                title={`Hacer clic para consumir dado de presagio (${dado})`}
              >
                <Dices size={10} color="var(--pj-texto-acento)" />
                <strong>{dado}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {resumenAuto && (
        <div className={estilos.contenedorChipsSelectores}>
          <div className={estilos.filaChipsSelector}>
            <span
              className={`${estilos.chipOpcionSeleccionada} ${estilos.chipRespuestaAuto}`}
              title="Respuesta predefinida activa (clic para editar en detalle)"
              onClick={(e) => {
                e.stopPropagation();
                alVerDetalle?.();
              }}
            >
              <Zap size={10} aria-hidden="true" />
              <span>{resumenAuto}</span>
              {idPersonaje && (
                <button
                  type="button"
                  className={estilos.botonLimpiarAuto}
                  aria-label="Volver a preguntar siempre"
                  title="Volver a preguntar siempre"
                  onClick={(e) => {
                    e.stopPropagation();
                    usarAlmacenDM.getState().actualizarRasgoPersonaje(idPersonaje, rasgo.id, {
                      respuestaPredefinida: undefined
                    });
                  }}
                >
                  <X size={10} aria-hidden="true" />
                </button>
              )}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

