import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import React, { useState, useRef, useEffect } from "react";
import { Trash2, Swords, Dices } from "lucide-react";
import { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { MonstruoBase } from "@/utiles/datosIniciales";
import { formatearDetalleAtaqueRapido } from "@/utiles/procesadorAtaques";
import type { PasivasCombatePJ } from "@/tipos/sync";
import { InsigniasPasivasJugador } from "./InsigniasPasivasJugador";
import { ModalRetratoPersonaje } from "@/componentes/caracteristicas/personajes/ModalRetratoPersonaje";
import { PanelBarrasHorda } from "./horda/PanelBarrasHorda";
import { esCriaturaHorda } from "@/servicios/combateHordas";
import { SelectoresEstadoTarjeta } from "./subcomponentes/SelectoresEstadoTarjeta";
import { ControlesSaludTarjeta } from "./subcomponentes/ControlesSaludTarjeta";
import { CabeceraNombreTarjeta } from "./subcomponentes/CabeceraNombreTarjeta";
import estilosClases from "./TarjetaCriaturaIniciativa.module.css";

export interface CallbacksTarjetaBasicos {
  onEliminar?: () => void;
  onSeleccionar?: () => void;
  onCurar?: (cantidad: number) => void;
  onDañar?: (cantidad: number) => void;
  onCambiarTempHP?: (cantidad: number) => void;
  onAñadirCondicion?: (condicion: string) => void;
  onQuitarCondicion?: (condicion: string) => void;
  onAñadirEfecto?: (nombre: string, duracion: number, opciones?: { concentracion?: boolean }) => void;
  onQuitarEfecto?: (efectoId: string) => void;
  onLanzarIniciativa?: () => void;
  onEstablecerIniciativa?: (nuevaIniciativa: number) => void;
  onEstablecerVidaMaxima?: (nuevaVidaMaxima: number) => void;
  onLanzarAtaqueRapido?: (ataqueNombre: string, bonoAtaque: string, dadosDaño: string, tipoDaño: string) => void;
  obtenerPercepcionPasiva?: (plantilla: MonstruoBase | null) => number;
  onAlternarRol?: () => void;
  onConfigurarBarrasHorda?: (cantidad: number) => void;
  onSeleccionarBarraHorda?: (indice: number) => void;
  onAlternarModoDanoHorda?: () => void;
}

export interface AccionesTarjetaCriaturaIniciativa {
  salud: Required<Pick<CallbacksTarjetaBasicos, "onCurar" | "onDañar" | "onCambiarTempHP">> &
    Pick<CallbacksTarjetaBasicos, "onEstablecerVidaMaxima">;
  estado: Required<Pick<CallbacksTarjetaBasicos, "onAñadirCondicion" | "onQuitarCondicion" | "onAñadirEfecto" | "onQuitarEfecto">>;
  combate: Required<
    Pick<
      CallbacksTarjetaBasicos,
      "onEliminar" | "onSeleccionar" | "onLanzarIniciativa" | "onEstablecerIniciativa" | "onLanzarAtaqueRapido" | "obtenerPercepcionPasiva"
    >
  > & Pick<CallbacksTarjetaBasicos, "onAlternarRol">;
  horda: Pick<CallbacksTarjetaBasicos, "onConfigurarBarrasHorda" | "onSeleccionarBarraHorda" | "onAlternarModoDanoHorda">;
}

export interface TarjetaCriaturaIniciativaProps extends CallbacksTarjetaBasicos {
  criatura: CriaturaIniciativa;
  esTurnoActivo: boolean;
  estaSeleccionadaEnTS?: boolean;
  plantilla: MonstruoBase | null;
  pasivasJugador?: PasivasCombatePJ | null;
  avatarUrlPJ?: string | null;
  rondaActual?: number;
  acciones?: AccionesTarjetaCriaturaIniciativa;
}

const NOOP = () => {};
const PERCEPCION_PASIVA_BASE = () => 10;

function resolverCallbacksTarjeta(props: TarjetaCriaturaIniciativaProps) {
  const { acciones } = props;
  return {
    onEliminar: acciones?.combate.onEliminar ?? props.onEliminar ?? NOOP,
    onSeleccionar: acciones?.combate.onSeleccionar ?? props.onSeleccionar ?? NOOP,
    onLanzarIniciativa: acciones?.combate.onLanzarIniciativa ?? props.onLanzarIniciativa ?? NOOP,
    onEstablecerIniciativa: acciones?.combate.onEstablecerIniciativa ?? props.onEstablecerIniciativa ?? NOOP,
    onLanzarAtaqueRapido: acciones?.combate.onLanzarAtaqueRapido ?? props.onLanzarAtaqueRapido ?? NOOP,
    obtenerPercepcionPasiva: acciones?.combate.obtenerPercepcionPasiva ?? props.obtenerPercepcionPasiva ?? PERCEPCION_PASIVA_BASE,
    onAlternarRol: acciones?.combate.onAlternarRol ?? props.onAlternarRol,
    onCurar: acciones?.salud.onCurar ?? props.onCurar ?? NOOP,
    onDañar: acciones?.salud.onDañar ?? props.onDañar ?? NOOP,
    onCambiarTempHP: acciones?.salud.onCambiarTempHP ?? props.onCambiarTempHP ?? NOOP,
    onEstablecerVidaMaxima: acciones?.salud.onEstablecerVidaMaxima ?? props.onEstablecerVidaMaxima,
    onAñadirCondicion: acciones?.estado.onAñadirCondicion ?? props.onAñadirCondicion ?? NOOP,
    onQuitarCondicion: acciones?.estado.onQuitarCondicion ?? props.onQuitarCondicion ?? NOOP,
    onAñadirEfecto: acciones?.estado.onAñadirEfecto ?? props.onAñadirEfecto ?? NOOP,
    onQuitarEfecto: acciones?.estado.onQuitarEfecto ?? props.onQuitarEfecto ?? NOOP,
    onConfigurarBarrasHorda: acciones?.horda.onConfigurarBarrasHorda ?? props.onConfigurarBarrasHorda,
    onSeleccionarBarraHorda: acciones?.horda.onSeleccionarBarraHorda ?? props.onSeleccionarBarraHorda,
    onAlternarModoDanoHorda: acciones?.horda.onAlternarModoDanoHorda ?? props.onAlternarModoDanoHorda,
  };
}

export const TarjetaCriaturaIniciativa: React.FC<TarjetaCriaturaIniciativaProps> = React.memo((props) => {
  const { criatura, esTurnoActivo, estaSeleccionadaEnTS = false, plantilla, pasivasJugador, avatarUrlPJ, rondaActual } = props;
  const cb = resolverCallbacksTarjeta(props);
  const pasivasEfectivas = pasivasJugador || criatura.pasivas || null;
  const avatarEfectivo = !criatura.esMonstruo ? (criatura.avatarUrl || avatarUrlPJ || undefined) : undefined;
  const esHordaActiva = esCriaturaHorda(criatura) && Boolean(criatura.barrasVida && criatura.barrasVida.length > 1);
  const idxBarraActiva = esHordaActiva
    ? Math.max(0, Math.min((criatura.barrasVida?.length ?? 1) - 1, criatura.indiceBarraActiva ?? 0))
    : 0;
  const barraActiva = esHordaActiva ? criatura.barrasVida?.[idxBarraActiva] : undefined;
  const vidaActualMostrar = barraActiva ? barraActiva.vidaActual : criatura.vidaActual;
  const vidaMaximaMostrar = barraActiva ? barraActiva.vidaMaxima : criatura.vidaMaxima;
  const vidaTemporalMostrar = barraActiva ? (barraActiva.vidaTemporal ?? 0) : (criatura.vidaTemporal ?? 0);

  const [verRetrato, setVerRetrato] = useState(false);
  const [editandoIniciativa, setEditandoIniciativa] = useState(false);
  const refInputIniciativa = useRef<HTMLInputElement>(null);
  const estaMuerto = criatura.vidaActual === 0;

  useEffect(() => {
    if (editandoIniciativa && refInputIniciativa.current) {
      refInputIniciativa.current.focus();
      refInputIniciativa.current.select();
    }
  }, [editandoIniciativa]);

  return (
    <div
      className={estilosClases.tarjetaCriaturaBrutal}
      data-turno-activo={esTurnoActivo}
      data-seleccionada-ts={estaSeleccionadaEnTS}
      data-muerto={estaMuerto}
    >
      <div
        className={estilosClases.barraLateralRol}
        data-es-monstruo={criatura.esMonstruo}
        onClick={cb.onAlternarRol}
        title={
          criatura.esMonstruo
            ? "Monstruo / Enemigo (Clic para cambiar a Jugador)"
            : "Jugador / Aliado (Clic para cambiar a Monstruo)"
        }
      />

      <div className={estilosClases.columnaIniciativaYAvatar}>
        {avatarEfectivo && (
          <>
            <img
              src={avatarEfectivo}
              alt={criatura.nombre}
              className={estilosClases.avatarPjIniciativa}
              title="Ver retrato ampliado"
              onClick={(e) => { e.stopPropagation(); setVerRetrato(true); }}
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
            />
            {verRetrato && (
              <ModalRetratoPersonaje
                nombre={criatura.nombre || "Personaje"}
                imagen={avatarEfectivo}
                alCerrar={() => setVerRetrato(false)}
              />
            )}
          </>
        )}

        <div
          className={`${estilosClases.bloqueIniciativaIzquierda} ${avatarEfectivo ? estilosClases.bloqueIniciativaConAvatar : ""}`}
          data-turno-activo={esTurnoActivo}
        >
          <button
            onClick={(e) => { e.stopPropagation(); cb.onLanzarIniciativa(); }}
            className={estilosClases.botonDadoIniciativa}
            title="Lanzar dado de iniciativa en TaleSpire"
          >
            <Dices size={12} />
          </button>

          {editandoIniciativa ? (
            <CampoNumerico
              ref={refInputIniciativa}
              value={criatura.iniciativa}
              alConfirmar={cb.onEstablecerIniciativa}
              onBlur={() => setEditandoIniciativa(false)}
              className={estilosClases.inputIniciativaEditable}
              data-turno-activo={esTurnoActivo}
              identidad={criatura.id}
            />
          ) : (
            <span
              onClick={() => setEditandoIniciativa(true)}
              className={estilosClases.valorInicGigante}
              data-turno-activo={esTurnoActivo}
              title="Clic para editar iniciativa manualmente"
            >
              {criatura.iniciativa}
            </span>
          )}
        </div>
      </div>

      <div className={estilosClases.cuerpoTarjetaCentral}>
        <CabeceraNombreTarjeta
          criatura={criatura}
          plantilla={plantilla}
          esTurnoActivo={esTurnoActivo}
          estaMuerto={estaMuerto}
          estaSeleccionadaEnTS={estaSeleccionadaEnTS}
          onSeleccionar={cb.onSeleccionar}
          onAlternarRol={cb.onAlternarRol}
          obtenerPercepcionPasiva={cb.obtenerPercepcionPasiva}
        />

        <SelectoresEstadoTarjeta
          criatura={criatura}
          rondaActual={rondaActual}
          esHordaActiva={esHordaActiva}
          onAñadirCondicion={cb.onAñadirCondicion}
          onQuitarCondicion={cb.onQuitarCondicion}
          onAñadirEfecto={cb.onAñadirEfecto}
          onQuitarEfecto={cb.onQuitarEfecto}
          onConfigurarBarrasHorda={cb.onConfigurarBarrasHorda}
          onSeleccionarBarraHorda={cb.onSeleccionarBarraHorda ?? NOOP}
          onAlternarModoDanoHorda={cb.onAlternarModoDanoHorda ?? NOOP}
        />

        {criatura.esMonstruo && esHordaActiva && cb.onConfigurarBarrasHorda && (
          <PanelBarrasHorda
            criatura={criatura}
            onConfigurarBarras={cb.onConfigurarBarrasHorda}
            onSeleccionarBarra={cb.onSeleccionarBarraHorda ?? NOOP}
            onAlternarModoDano={cb.onAlternarModoDanoHorda ?? NOOP}
          />
        )}
      </div>

      <div className={estilosClases.cajaAccionesRapidasColumn}>
        {plantilla && plantilla.accionesRapidas && plantilla.accionesRapidas.length > 0 ? (
          <div className={estilosClases.contenedorAccionesRapidasBotones}>
            {plantilla.accionesRapidas.slice(0, 2).map((acc, index) => (
              <button
                key={index}
                onClick={() => cb.onLanzarAtaqueRapido(acc.nombre, acc.bonificadorAtaque, acc.dadosDaño, acc.tipoDaño)}
                className={estilosClases.botonAccionRapidaMedieval}
                title={formatearDetalleAtaqueRapido(acc.bonificadorAtaque, acc.dadosDaño, acc.tipoDaño)}
              >
                <Swords size={10} className={estilosClases.iconoEspadasPeligro} />
                <span>{acc.nombre}</span>
              </button>
            ))}
          </div>
        ) : !criatura.esMonstruo && pasivasEfectivas ? (
          <InsigniasPasivasJugador pasivas={pasivasEfectivas} />
        ) : (
          <div className={estilosClases.sinAccionesAviso}>
            {criatura.esMonstruo ? "Sin ataques rápidos cargados" : "Ficha de Jugador"}
          </div>
        )}
      </div>

      <ControlesSaludTarjeta
        criaturaId={criatura.id}
        vidaActualMostrar={vidaActualMostrar}
        vidaMaximaMostrar={vidaMaximaMostrar}
        vidaTemporalMostrar={vidaTemporalMostrar}
        vidaTotalHordaActual={criatura.vidaActual}
        vidaTotalHordaMaxima={criatura.vidaMaxima}
        indiceBarraActiva={barraActiva ? idxBarraActiva : undefined}
        estaMuerto={estaMuerto}
        onCurar={cb.onCurar}
        onDañar={cb.onDañar}
        onCambiarTempHP={cb.onCambiarTempHP}
        onEstablecerVidaMaxima={cb.onEstablecerVidaMaxima}
      />

      <button
        onClick={cb.onEliminar}
        className={estilosClases.botonEliminarDeCola}
        title="Eliminar de la iniciativa"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
});

TarjetaCriaturaIniciativa.displayName = "TarjetaCriaturaIniciativa";
