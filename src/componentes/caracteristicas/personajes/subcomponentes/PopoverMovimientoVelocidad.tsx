import React from "react";
import type { TipoTerreno } from "@/tipos";
import { INFORMACION_TERRENO } from "@/tipos";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { Footprints, RotateCcw, RefreshCw, Plus, Minus, X, Mountain } from "lucide-react";
import estilos from "../HojaPersonaje.module.css";

interface PopoverMovimientoVelocidadProps {
  idPersonaje: string;
  idMiniaturaTS?: string | null;
  movimientoGastado: number;
  estadoVelocidad: {
    movimientoRestante: number;
    velocidadTotal: number;
    esCarreraActiva: boolean;
  };
  tipoTerrenoActual: TipoTerreno;
  tieneHistorial: boolean;
  ultimoRegistro: { descripcion: string } | null;
  alCerrar: () => void;
  alEstablecerTipoTerreno: (tipo: TipoTerreno) => void;
  alModificarRestante: (nuevo: number) => void;
  alModificarGastado: (delta: number) => void;
  alAlternarCarrera: () => void;
  alDeshacer: () => void;
  alRestablecer: () => void;
}

export const PopoverMovimientoVelocidad: React.FC<PopoverMovimientoVelocidadProps> = ({
  idPersonaje,
  idMiniaturaTS,
  movimientoGastado,
  estadoVelocidad,
  tipoTerrenoActual,
  tieneHistorial,
  ultimoRegistro,
  alCerrar,
  alEstablecerTipoTerreno,
  alModificarRestante,
  alModificarGastado,
  alAlternarCarrera,
  alDeshacer,
  alRestablecer
}) => {
  const infoTerrenoActual = INFORMACION_TERRENO[tipoTerrenoActual] || INFORMACION_TERRENO.normal;

  return (
    <div className={estilos.popoverVelocidad}>
      <div className={estilos.cabeceraPopoverVelocidad}>
        <span className={estilos.tituloPopoverVelocidad}>
          <Footprints size={14} color="#38bdf8" />
          Control de Movimiento
        </span>
        <button
          type="button"
          className={estilos.botonCerrarPopover}
          onClick={alCerrar}
          title="Cerrar panel"
          aria-label="Cerrar panel de movimiento"
        >
          <X size={14} />
        </button>
      </div>

      <div className={estilos.cuerpoPopoverVelocidad}>
        {/* Badge de estado TaleSpire */}
        <div className={`${estilos.badgeTSEnlace} ${!idMiniaturaTS ? estilos.badgeTSDesconectado : ""}`}>
          <span className={`${estilos.indicadorTSEnlace} ${!idMiniaturaTS ? estilos.indicadorTSEnlaceInactivo : ""}`} />
          {idMiniaturaTS ? "Miniatura detectada" : "Modo Manual"}
        </div>

        {/* Selector de Tipo de Terreno (D&D 5.5e y 3D) */}
        <div className={estilos.seccionTerrenoPopover}>
          <div className={estilos.cabeceraTerreno}>
            <span className={estilos.tituloTerreno}>
              <Mountain size={12} color="#94a3b8" />
              Terreno
            </span>
          </div>

          <div className={estilos.grupoBotonesTerreno}>
            {(["normal", "dificil", "extremo"] as TipoTerreno[]).map((tipo) => {
              const info = INFORMACION_TERRENO[tipo];
              const esActivo = tipoTerrenoActual === tipo;
              const claseActivo = esActivo
                ? (tipo === "normal" ? estilos.botonTerrenoActivoNormal : tipo === "dificil" ? estilos.botonTerrenoActivoDificil : estilos.botonTerrenoActivoExtremo)
                : "";

              return (
                <button
                  key={tipo}
                  type="button"
                  className={`${estilos.botonTerreno} ${claseActivo}`}
                  onClick={() => alEstablecerTipoTerreno(tipo)}
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
          {movimientoGastado > 0 && (
            <div className={estilos.gastadoSubtexto}>
              Gastado: {movimientoGastado} ft
            </div>
          )}
        </div>

        {/* Ajuste Manual Rápido */}
        <div className={estilos.filaAjusteManual}>
          <button
            type="button"
            className={estilos.botonPasoPies}
            onClick={() => alModificarGastado(5)}
            title="Gastar 5 pies de movimiento"
          >
            <Minus size={12} />
            5 ft
          </button>

          <CampoNumerico
            step="any"
            min="0"
            max={estadoVelocidad.velocidadTotal * 2}
            className={estilos.inputRestanteManual}
            value={estadoVelocidad.movimientoRestante}
            alConfirmar={alModificarRestante}
            title="Escribe directamente los pies restantes y pulsa Enter"
            tipo="decimal"
            identidad={idPersonaje}
          />

          <button
            type="button"
            className={estilos.botonPasoPies}
            onClick={() => alModificarGastado(-5)}
            title="Recuperar 5 pies de movimiento"
          >
            <Plus size={12} />
            5 ft
          </button>
        </div>

        {/* Botones de Acción: Carrera y Deshacer */}
        <div className={estilos.filaBotonesAccionVelocidad}>
          <button
            type="button"
            className={`
              ${estilos.botonAccionVelocidad}
              ${estadoVelocidad.esCarreraActiva ? estilos.botonCarreraActivo : ""}
            `}
            onClick={alAlternarCarrera}
            title="Acción Carrera: duplica la velocidad de este turno"
          >
            <Footprints size={13} />
            {estadoVelocidad.esCarreraActiva ? "Carrera ON" : "Carrera OFF"}
          </button>

          <button
            type="button"
            className={estilos.botonAccionVelocidad}
            onClick={alDeshacer}
            disabled={!tieneHistorial}
            title={
              ultimoRegistro
                ? `Deshacer: ${ultimoRegistro.descripcion}`
                : "No hay movimientos previos para deshacer"
            }
          >
            <RotateCcw size={13} />
            Deshacer
          </button>

          <button
            type="button"
            className={`${estilos.botonAccionVelocidad} ${estilos.botonRestablecerTurno}`}
            onClick={alRestablecer}
            title="Restablece la velocidad al 100% (iniciar nuevo turno)"
          >
            <RefreshCw size={13} />
            Restablecer Turno
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
