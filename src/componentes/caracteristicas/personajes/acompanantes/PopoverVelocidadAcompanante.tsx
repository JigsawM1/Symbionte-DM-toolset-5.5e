import React from "react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { Footprints, X, Mountain, Minus, Plus, RotateCcw, RefreshCw } from "lucide-react";
import type { AcompanantePersonaje, TipoTerreno } from "@/tipos";
import { INFORMACION_TERRENO } from "@/tipos";
import { usarAccionesPersonajes } from "@/almacen/selectores";
import type { EstadoVelocidadDinamica } from "@/servicios/calculadorDistanciaTS";
import estilos from "./SeccionAcompanantesPersonaje.module.css";

export interface PopoverVelocidadAcompananteProps {
  personajeId: string;
  acomp: AcompanantePersonaje;
  estadoVelocidad: EstadoVelocidadDinamica;
  tipoTerrenoActual: TipoTerreno;
  onCerrar: () => void;
}

export const PopoverVelocidadAcompanante: React.FC<PopoverVelocidadAcompananteProps> = ({
  personajeId,
  acomp,
  estadoVelocidad,
  tipoTerrenoActual,
  onCerrar
}) => {
  const {
    modificarMovimientoRestanteManualAcompanante,
    modificarMovimientoGastadoAcompanante,
    deshacerUltimoMovimientoAcompanante,
    restablecerMovimientoAcompanante,
    alternarAccionCarreraAcompanante,
    establecerTipoTerrenoAcompanante
  } = usarAccionesPersonajes();

  const infoTerrenoActual = INFORMACION_TERRENO[tipoTerrenoActual] || INFORMACION_TERRENO.normal;
  const historial = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];
  const tieneHistorial = historial.length > 0;
  const ultimoRegistro = tieneHistorial ? historial[historial.length - 1] : null;

  return (
    <div className={estilos.popoverVelocidadAcomp}>
      <div className={estilos.cabeceraPopoverVelocidad}>
        <span className={estilos.tituloPopoverVelocidad}>
          <Footprints size={13} color="var(--pj-texto-cian)" />
          Movimiento: {acomp.nombre}
        </span>
        <button
          type="button"
          className={estilos.botonCerrarPopover}
          onClick={onCerrar}
          title="Cerrar panel"
        >
          <X size={13} />
        </button>
      </div>

      <div className={estilos.cuerpoPopoverVelocidad}>
        {/* Badge de estado TaleSpire */}
        <div
          className={`${estilos.badgeTSEnlace} ${!acomp.idMiniaturaTS ? estilos.badgeTSDesconectado : ""}`}
        >
          <span
            className={`${estilos.puntoTSEnlace} ${!acomp.idMiniaturaTS ? estilos.puntoTSInactivo : ""}`}
          />
          {acomp.idMiniaturaTS ? "Miniatura detectada en TaleSpire" : "Modo Manual"}
        </div>

        {/* Selector de Terreno (Normal 1x, Difícil 2x, Extremo 3x) */}
        <div className={estilos.seccionTerrenoPopover}>
          <div className={estilos.cabeceraTerreno}>
            <span className={estilos.tituloTerreno}>
              <Mountain size={11} color="var(--pj-texto-terciario)" />
              Tipo de Terreno
            </span>
          </div>

          <div className={estilos.grupoBotonesTerreno}>
            {(["normal", "dificil", "extremo"] as TipoTerreno[]).map((tipo) => {
              const info = INFORMACION_TERRENO[tipo];
              const esActivo = tipoTerrenoActual === tipo;
              const claseActivo = esActivo
                ? tipo === "normal"
                  ? estilos.botonTerrenoActivoNormal
                  : tipo === "dificil"
                  ? estilos.botonTerrenoActivoDificil
                  : estilos.botonTerrenoActivoExtremo
                : "";

              return (
                <button
                  key={tipo}
                  type="button"
                  className={`${estilos.botonTerreno} ${claseActivo}`}
                  onClick={() => establecerTipoTerrenoAcompanante(personajeId, acomp.id, tipo)}
                  title={`${info.nombre}: ${info.descripcion}`}
                >
                  <span>{info.nombre}</span>
                  <span className={estilos.subMultiplicadorTerreno}>{info.multiplicador}x</span>
                </button>
              );
            })}
          </div>

          <div className={estilos.descripcionTerrenoTexto}>
            {infoTerrenoActual.descripcion}
          </div>
        </div>

        {/* Caja Resumen de Movimiento */}
        <div className={estilos.resumenMovimientoCaja}>
          <div>
            <div className={estilos.etiquetaMovimientoGrande}>Movimiento Restante</div>
            <div className={estilos.valorMovimientoGrande}>
              {estadoVelocidad.movimientoRestante} / {estadoVelocidad.velocidadTotal} ft
            </div>
          </div>
          {(acomp.movimientoGastado || 0) > 0 && (
            <div className={estilos.gastadoSubtexto}>
              Gastado: {acomp.movimientoGastado} ft
            </div>
          )}
        </div>

        {/* Ajuste Manual Rápido */}
        <div className={estilos.filaAjusteManual}>
          <button
            type="button"
            className={estilos.botonPasoPies}
            onClick={() =>
              modificarMovimientoGastadoAcompanante(personajeId, acomp.id, 5, "Ajuste manual")
            }
            title="Gastar 5 pies de movimiento"
          >
            <Minus size={11} />
            5 ft
          </button>

          <CampoNumerico
            step="any"
            min="0"
            max={estadoVelocidad.velocidadTotal * 2}
            className={estilos.inputRestanteManual}
            value={estadoVelocidad.movimientoRestante}
            alConfirmar={(valor) => modificarMovimientoRestanteManualAcompanante(personajeId, acomp.id, valor)}
            title="Escribe directamente los pies restantes y pulsa Enter"
            tipo="decimal" identidad={acomp.id}
          />

          <button
            type="button"
            className={estilos.botonPasoPies}
            onClick={() =>
              modificarMovimientoGastadoAcompanante(personajeId, acomp.id, -5, "Ajuste manual")
            }
            title="Recuperar 5 pies de movimiento"
          >
            <Plus size={11} />
            5 ft
          </button>
        </div>

        {/* Botones de Acción: Carrera, Deshacer y Restablecer Turno */}
        <div className={estilos.filaBotonesAccionVelocidad}>
          <button
            type="button"
            className={`
              ${estilos.botonAccionVelocidad}
              ${estadoVelocidad.esCarreraActiva ? estilos.botonCarreraActivo : ""}
            `}
            onClick={() => alternarAccionCarreraAcompanante(personajeId, acomp.id)}
            title="Acción Carrera: duplica la velocidad de este turno"
          >
            <Footprints size={12} />
            {estadoVelocidad.esCarreraActiva ? "Carrera ON" : "Carrera OFF"}
          </button>

          <button
            type="button"
            className={estilos.botonAccionVelocidad}
            onClick={() => deshacerUltimoMovimientoAcompanante(personajeId, acomp.id)}
            disabled={!tieneHistorial}
            title={
              ultimoRegistro
                ? `Deshacer: ${ultimoRegistro.descripcion}`
                : "No hay movimientos previos para deshacer"
            }
          >
            <RotateCcw size={12} />
            Deshacer
          </button>

          <button
            type="button"
            className={`${estilos.botonAccionVelocidad} ${estilos.botonRestablecerTurno}`}
            onClick={() => restablecerMovimientoAcompanante(personajeId, acomp.id)}
            title="Restablece la velocidad al 100% (iniciar nuevo turno)"
          >
            <RefreshCw size={12} />
            Restablecer
          </button>
        </div>

        {/* Pie con último movimiento */}
        {ultimoRegistro && (
          <div className={estilos.piePopoverHistorial}>
            <span>Último: {ultimoRegistro.descripcion}</span>
          </div>
        )}
      </div>
    </div>
  );
};
