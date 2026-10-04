import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  PawPrint,
  Search,
  X,
  Link2,
  Unlink,
  Plus,
  Minus,
  Footprints,
  Mountain,
  RotateCcw,
  RefreshCw
} from "lucide-react";
import type {
  PersonajeJugador,
  AcompanantePersonaje,
  MonstruoBase,
  HechizoBase,
  TipoTerreno
} from "@/tipos";
import { INFORMACION_TERRENO } from "@/tipos";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import {
  usarEstadoHomebrew,
  usarEstadoIniciativa,
  usarAccionesPersonajes
} from "@/almacen/selectores";
import { TarjetaCriaturaIniciativa } from "@/componentes/caracteristicas/iniciativa/TarjetaCriaturaIniciativa";
import { PanelFichaDnD } from "@/componentes/caracteristicas/iniciativa/PanelFichaDnD";
import { formatearVelocidad, normalizarTexto } from "@/almacen/sanitizacion";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import { generarId } from "@/utiles/generarId";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { construirFormulaAtaqueRapido } from "@/utiles/procesadorAtaques";
import { calcularEstadoVelocidadDinamica } from "@/servicios/calculadorDistanciaTS";
import estilos from "./SeccionAcompanantesPersonaje.module.css";

interface SeccionAcompanantesPersonajeProps {
  personaje: PersonajeJugador;
}

/**
 * Obtiene la velocidad base en pies para un acompañante a partir de sus datos o su plantilla.
 */
function obtenerVelocidadBaseAcompanante(
  acomp: AcompanantePersonaje,
  plantilla: MonstruoBase | null
): number {
  if (typeof acomp.velocidad === "number" && acomp.velocidad > 0) {
    return acomp.velocidad;
  }
  if (plantilla) {
    if (typeof plantilla.velocidad === "number" && plantilla.velocidad > 0) {
      return plantilla.velocidad;
    }
    if (
      typeof plantilla.velocidad === "object" &&
      plantilla.velocidad !== null &&
      typeof plantilla.velocidad.caminar === "number" &&
      plantilla.velocidad.caminar > 0
    ) {
      return plantilla.velocidad.caminar;
    }
    if (typeof plantilla.velocidad === "string") {
      const match = plantilla.velocidad.match(/(\d+)/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
  }
  return 30;
}

interface ItemAcompananteProps {
  personajeId: string;
  acomp: AcompanantePersonaje;
  plantilla: MonstruoBase | null;
  criaturasSeleccionadas: import("@/almacen/slices/sliceIniciativa").CriaturaSeleccionadaTS[];
  onSeleccionarDetalle: (id: string) => void;
  onEliminar: () => void;
  onCurar: (cant: number) => void;
  onDañar: (cant: number) => void;
  onCambiarTempHP: (cant: number) => void;
  onAñadirCondicion: (cond: string) => void;
  onQuitarCondicion: (cond: string) => void;
  onAñadirEfecto: (nombre: string, duracion: number, opciones?: { concentracion?: boolean }) => void;
  onQuitarEfecto: (efectoId: string) => void;
  onLanzarIniciativa: () => void;
  onEstablecerIniciativa: (val: number) => void;
  onLanzarAtaqueRapido: (accNom: string, accBono: string, accDados: string, accTipo: string) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
}

const ItemAcompanante: React.FC<ItemAcompananteProps> = ({
  personajeId,
  acomp,
  plantilla,
  criaturasSeleccionadas,
  onSeleccionarDetalle,
  onEliminar,
  onCurar,
  onDañar,
  onCambiarTempHP,
  onAñadirCondicion,
  onQuitarCondicion,
  onAñadirEfecto,
  onQuitarEfecto,
  onLanzarIniciativa,
  onEstablecerIniciativa,
  onLanzarAtaqueRapido,
  obtenerPercepcionPasiva
}) => {
  const {
    vincularMiniaturaTSAcompanante,
    modificarMovimientoRestanteManualAcompanante,
    modificarMovimientoGastadoAcompanante,
    deshacerUltimoMovimientoAcompanante,
    restablecerMovimientoAcompanante,
    alternarAccionCarreraAcompanante,
    establecerTipoTerrenoAcompanante
  } = usarAccionesPersonajes();

  // 1. Cálculo dinámico de velocidad y terreno
  const velocidadBase = useMemo(
    () => obtenerVelocidadBaseAcompanante(acomp, plantilla),
    [acomp, plantilla]
  );

  const tipoTerrenoActual: TipoTerreno = acomp.tipoTerreno || "normal";
  const infoTerrenoActual = INFORMACION_TERRENO[tipoTerrenoActual] || INFORMACION_TERRENO.normal;

  const estadoVelocidad = useMemo(
    () =>
      calcularEstadoVelocidadDinamica(
        velocidadBase,
        0,
        acomp.movimientoGastado || 0,
        acomp.movimientoMaximoTemporal ?? null
      ),
    [velocidadBase, acomp.movimientoGastado, acomp.movimientoMaximoTemporal]
  );

  // 2. Control de Popover de Movimiento
  const [menuVelocidadAbierto, setMenuVelocidadAbierto] = useState(false);
  const [inputRestante, setInputRestante] = useState<string>(
    estadoVelocidad.movimientoRestante.toString()
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputRestante(estadoVelocidad.movimientoRestante.toString());
  }, [estadoVelocidad.movimientoRestante]);

  useEffect(() => {
    if (!menuVelocidadAbierto) return;
    const clickFuera = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMenuVelocidadAbierto(false);
      }
    };
    document.addEventListener("mousedown", clickFuera);
    return () => document.removeEventListener("mousedown", clickFuera);
  }, [menuVelocidadAbierto]);

  const manejarAplicarInputManual = () => {
    const val = Number(inputRestante);
    if (!isNaN(val) && val >= 0) {
      modificarMovimientoRestanteManualAcompanante(personajeId, acomp.id, val);
    } else {
      setInputRestante(estadoVelocidad.movimientoRestante.toString());
    }
  };

  // Historial de movimientos
  const historial = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];
  const tieneHistorial = historial.length > 0;
  const ultimoRegistro = tieneHistorial ? historial[historial.length - 1] : null;

  const criaturaAdaptada: CriaturaIniciativa = {
    id: acomp.id,
    nombre: acomp.nombre,
    iniciativa: acomp.iniciativa ?? 0,
    vidaMaxima: acomp.vidaMaxima,
    vidaActual: acomp.vidaActual,
    vidaTemporal: acomp.vidaTemporal || 0,
    ca: acomp.ca,
    condiciones: acomp.condiciones,
    efectos: acomp.efectos,
    bonificadorIniciativa: plantilla?.iniciativaBonificador ?? 0,
    esMonstruo: true,
    velocidad:
      typeof plantilla?.velocidad === "string"
        ? plantilla.velocidad
        : formatearVelocidad(plantilla?.velocidad),
    idPlantillaAsociada: acomp.idPlantilla
  };

  const tieneMiniVinculada = Boolean(acomp.idMiniaturaTS);
  const miniSeleccionadaEnTablero =
    criaturasSeleccionadas.length > 0 ? criaturasSeleccionadas[0] : null;

  return (
    <div className={estilos.tarjetaWrapper} ref={popoverRef}>
      <TarjetaCriaturaIniciativa
        criatura={criaturaAdaptada}
        esTurnoActivo={false}
        estaSeleccionadaEnTS={Boolean(
          acomp.idMiniaturaTS &&
            criaturasSeleccionadas.some((c) => c.id === acomp.idMiniaturaTS)
        )}
        plantilla={plantilla}
        onEliminar={onEliminar}
        onSeleccionar={() => onSeleccionarDetalle(acomp.id)}
        onCurar={onCurar}
        onDañar={onDañar}
        onCambiarTempHP={onCambiarTempHP}
        onAñadirCondicion={onAñadirCondicion}
        onQuitarCondicion={onQuitarCondicion}
        onAñadirEfecto={onAñadirEfecto}
        onQuitarEfecto={onQuitarEfecto}
        onLanzarIniciativa={onLanzarIniciativa}
        onEstablecerIniciativa={onEstablecerIniciativa}
        onLanzarAtaqueRapido={onLanzarAtaqueRapido}
        obtenerPercepcionPasiva={obtenerPercepcionPasiva}
      />

      {/* Fila de Movimiento y Terreno Dinámicos */}
      <div className={estilos.filaControlesDinamicosAcompanante}>
        <div
          className={`
            ${estilos.pastillaVelocidadSidekick}
            ${estadoVelocidad.agotado ? estilos.pastillaVelocidadAgotada : ""}
            ${estadoVelocidad.esCarreraActiva ? estilos.pastillaVelocidadCarrera : ""}
          `}
          onClick={() => setMenuVelocidadAbierto((prev) => !prev)}
          role="button"
          tabIndex={0}
          title="Haz clic para gestionar velocidad, terrenos y turnos"
        >
          <Footprints size={12} color="#38bdf8" />
          <span className={estilos.textoEtiquetaVel}>Velocidad:</span>
          <span
            className={`
              ${estilos.valorVelocidadSidekick}
              ${estadoVelocidad.agotado ? estilos.valorVelocidadAgotado : ""}
              ${estadoVelocidad.esCarreraActiva ? estilos.valorVelocidadCarrera : ""}
              ${acomp.movimientoGastado && acomp.movimientoGastado > 0 && !estadoVelocidad.agotado ? estilos.valorVelocidadParcial : ""}
            `}
          >
            {estadoVelocidad.movimientoRestante}
            {(acomp.movimientoGastado || 0) > 0 || estadoVelocidad.esCarreraActiva ? (
              <span className={estilos.separadorVelocidad}>/{estadoVelocidad.velocidadTotal}</span>
            ) : null}
            <span className={estilos.unidadMetrica}>ft</span>
          </span>
        </div>

        {/* Badge de terreno */}
        <div
          className={`
            ${estilos.badgeTerreno}
            ${tipoTerrenoActual === "dificil" ? estilos.badgeTerrenoDificil : ""}
            ${tipoTerrenoActual === "extremo" ? estilos.badgeTerrenoExtremo : ""}
          `}
        >
          {tipoTerrenoActual !== "normal"
            ? `${infoTerrenoActual.nombre} (${infoTerrenoActual.multiplicador}x)`
            : "Terreno Normal (1x)"}
        </div>

        {/* Popover Menú Flotante de Movimiento para el Acompañante */}
        {menuVelocidadAbierto && (
          <div className={estilos.popoverVelocidadAcomp}>
            <div className={estilos.cabeceraPopoverVelocidad}>
              <span className={estilos.tituloPopoverVelocidad}>
                <Footprints size={13} color="#38bdf8" />
                Movimiento: {acomp.nombre}
              </span>
              <button
                type="button"
                className={estilos.botonCerrarPopover}
                onClick={() => setMenuVelocidadAbierto(false)}
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
                    <Mountain size={11} color="#94a3b8" />
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

                <input
                  type="number"
                  step="any"
                  min="0"
                  max={estadoVelocidad.velocidadTotal * 2}
                  className={estilos.inputRestanteManual}
                  value={inputRestante}
                  onChange={(e) => setInputRestante(e.target.value)}
                  onBlur={manejarAplicarInputManual}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      manejarAplicarInputManual();
                    }
                  }}
                  title="Escribe directamente los pies restantes y pulsa Enter"
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
        )}
      </div>

      {/* Barra inferior para vinculación con miniatura 3D TaleSpire */}
      <div className={estilos.barraVinculoTS}>
        <div className={estilos.infoVinculo}>
          <span
            className={`${estilos.puntoVinculo} ${
              tieneMiniVinculada ? estilos.puntoVinculoActivo : ""
            }`}
          />
          {tieneMiniVinculada ? (
            <span>Miniatura TaleSpire vinculada</span>
          ) : (
            <span>Sin miniatura física en tablero</span>
          )}
        </div>

        <div className={estilos.accionesVinculo}>
          {tieneMiniVinculada ? (
            <button
              type="button"
              onClick={() => vincularMiniaturaTSAcompanante(personajeId, acomp.id, null)}
              className={estilos.botonDesvincular}
              title="Desvincular miniatura física de TaleSpire"
            >
              <Unlink size={11} />
              Desvincular
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (miniSeleccionadaEnTablero) {
                  vincularMiniaturaTSAcompanante(
                    personajeId,
                    acomp.id,
                    miniSeleccionadaEnTablero.id
                  );
                }
              }}
              disabled={!miniSeleccionadaEnTablero}
              className={estilos.botonVincular}
              title={
                miniSeleccionadaEnTablero
                  ? `Vincular a miniatura seleccionada '${miniSeleccionadaEnTablero.name || "Criatura"}'`
                  : "Selecciona una miniatura en TaleSpire para vincularla"
              }
            >
              <Link2 size={11} />
              {miniSeleccionadaEnTablero
                ? `Vincular a '${miniSeleccionadaEnTablero.name || "Mini"}'`
                : "Selecciona mini en TaleSpire"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SeccionAcompanantesPersonaje: React.FC<SeccionAcompanantesPersonajeProps> = ({
  personaje
}) => {
  const { baseDatosMonstruos, baseDatosHechizos } = usarEstadoHomebrew();
  const { criaturasSeleccionadas } = usarEstadoIniciativa();
  const {
    agregarAcompanantePersonaje,
    eliminarAcompanantePersonaje,
    modificarVidaAcompanante,
    actualizarAcompanante
  } = usarAccionesPersonajes();

  // Estados locales para búsqueda y modal de estadísticas
  const [busqueda, setBusqueda] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [idAcompananteDetalle, setIdAcompananteDetalle] = useState<string | null>(null);

  const acompanantes = useMemo(
    () => personaje.acompanantes || [],
    [personaje.acompanantes]
  );

  // Filtrado reactivo de monstruos del compendio
  const monstruosFiltrados = useMemo(() => {
    const qNorm = normalizarTexto(busqueda);
    if (!qNorm) return [];
    return baseDatosMonstruos
      .filter((m) =>
        coincideBusquedaTolerante([m.nombre, m.tipo, m.alineacion || ""], qNorm)
      )
      .slice(0, 8);
  }, [baseDatosMonstruos, busqueda]);

  // Manejar adición de un nuevo acompañante a partir de una plantilla
  const manejarAgregarAcompanante = useCallback(
    (plantilla: MonstruoBase) => {
      const nuevoAcompanante: AcompanantePersonaje = {
        id: generarId("acomp"),
        nombre: plantilla.nombre,
        idPlantilla: plantilla.id,
        vidaActual: plantilla.vidaMaxima,
        vidaMaxima: plantilla.vidaMaxima,
        vidaTemporal: 0,
        ca: plantilla.ca,
        condiciones: [],
        efectos: [],
        iniciativa: 0,
        idMiniaturaTS: null,
        velocidad: plantilla.velocidad || "30 pies",
        movimientoGastado: 0,
        movimientoMaximoTemporal: null,
        tipoTerreno: "normal",
        multiplicadorTerreno: 1,
        ultimaPosicionTS: null,
        ultimoBoardIdTS: null,
        historialMovimiento: []
      };

      agregarAcompanantePersonaje(personaje.id, nuevoAcompanante);
      setBusqueda("");
      setMostrarSugerencias(false);
    },
    [agregarAcompanantePersonaje, personaje.id]
  );

  // Manejadores estables de tiradas y vida para TarjetaCriaturaIniciativa
  const manejarCurar = useCallback(
    (acomp: AcompanantePersonaje, cant: number) => {
      const nuevaVida = Math.min(acomp.vidaMaxima, acomp.vidaActual + cant);
      modificarVidaAcompanante(personaje.id, acomp.id, nuevaVida, acomp.vidaTemporal);
    },
    [modificarVidaAcompanante, personaje.id]
  );

  const manejarDañar = useCallback(
    (acomp: AcompanantePersonaje, cant: number) => {
      const temporal = acomp.vidaTemporal || 0;
      if (temporal > 0) {
        if (cant <= temporal) {
          modificarVidaAcompanante(personaje.id, acomp.id, acomp.vidaActual, temporal - cant);
        } else {
          const excedente = cant - temporal;
          const nuevaVida = Math.max(0, acomp.vidaActual - excedente);
          modificarVidaAcompanante(personaje.id, acomp.id, nuevaVida, 0);
        }
      } else {
        const nuevaVida = Math.max(0, acomp.vidaActual - cant);
        modificarVidaAcompanante(personaje.id, acomp.id, nuevaVida, 0);
      }
    },
    [modificarVidaAcompanante, personaje.id]
  );

  const manejarCambiarTempHP = useCallback(
    (acompId: string, vidaActual: number, cant: number) => {
      modificarVidaAcompanante(personaje.id, acompId, vidaActual, cant);
    },
    [modificarVidaAcompanante, personaje.id]
  );

  const manejarAñadirCondicion = useCallback(
    (acomp: AcompanantePersonaje, condicion: string) => {
      if (acomp.condiciones.includes(condicion)) return;
      actualizarAcompanante(personaje.id, acomp.id, {
        condiciones: [...acomp.condiciones, condicion]
      });
    },
    [actualizarAcompanante, personaje.id]
  );

  const manejarQuitarCondicion = useCallback(
    (acomp: AcompanantePersonaje, condicion: string) => {
      actualizarAcompanante(personaje.id, acomp.id, {
        condiciones: acomp.condiciones.filter((c) => c !== condicion)
      });
    },
    [actualizarAcompanante, personaje.id]
  );

  const manejarAñadirEfecto = useCallback(
    (
      acomp: AcompanantePersonaje,
      nombre: string,
      duracion: number,
      opciones?: { concentracion?: boolean }
    ) => {
      const nuevoEfecto = {
        id: generarId("ef"),
        nombre,
        duracion,
        concentracion: opciones?.concentracion
      };
      actualizarAcompanante(personaje.id, acomp.id, {
        efectos: [...(acomp.efectos || []), nuevoEfecto]
      });
    },
    [actualizarAcompanante, personaje.id]
  );

  const manejarQuitarEfecto = useCallback(
    (acomp: AcompanantePersonaje, efectoId: string) => {
      actualizarAcompanante(personaje.id, acomp.id, {
        efectos: (acomp.efectos || []).filter((e) => e.id !== efectoId)
      });
    },
    [actualizarAcompanante, personaje.id]
  );

  const manejarLanzarAtaqueRapido = useCallback(
    (
      criaturaNombre: string,
      ataqueNombre: string,
      bonoAtaque: string,
      dadosDaño: string,
      tipoDaño: string
    ) => {
      const formula = construirFormulaAtaqueRapido(
        ataqueNombre,
        bonoAtaque,
        dadosDaño,
        tipoDaño,
        criaturaNombre
      );
      lanzarDadosTaleSpire(formula, `${criaturaNombre} - ${ataqueNombre}`);
    },
    []
  );

  const manejarLanzarIniciativa = useCallback(
    (acomp: AcompanantePersonaje, plantilla: MonstruoBase | null) => {
      const bono = plantilla?.iniciativaBonificador || 0;
      const formula = `!${sanitizarEtiqueta(acomp.nombre)}:1d20${bono >= 0 ? "+" : ""}${bono}`;
      lanzarDadosTaleSpire(formula, `${acomp.nombre} - Iniciativa`);
    },
    []
  );

  const manejarLanzarTiradaD20 = useCallback(
    (criaturaNombre: string, etiqueta: string, bonificador: number) => {
      const etiquetaCompleta = `${sanitizarEtiqueta(criaturaNombre)} - ${sanitizarEtiqueta(etiqueta)}`;
      const formula = `!${etiquetaCompleta}:1d20${bonificador >= 0 ? "+" : ""}${bonificador}`;
      lanzarDadosTaleSpire(formula, `${criaturaNombre} - ${etiqueta}`);
    },
    []
  );

  const obtenerPercepcionPasiva = useCallback((plantilla: MonstruoBase | null): number => {
    if (!plantilla) return 10;
    if (typeof plantilla.sentidos === "object" && plantilla.sentidos !== null) {
      return plantilla.sentidos.percepcionPasiva || 10;
    }
    return 10;
  }, []);

  // Buscar el objeto de detalle si el modal está abierto
  const acompananteEnDetalle = useMemo(() => {
    if (!idAcompananteDetalle) return null;
    return acompanantes.find((a) => a.id === idAcompananteDetalle) || null;
  }, [acompanantes, idAcompananteDetalle]);

  const plantillaEnDetalle = useMemo(() => {
    if (!acompananteEnDetalle) return null;
    return (
      baseDatosMonstruos.find((m) => m.id === acompananteEnDetalle.idPlantilla) || null
    );
  }, [acompananteEnDetalle, baseDatosMonstruos]);

  return (
    <div className={estilos.contenedorAcompanantes}>
      {/* 1. Cabecera y Buscador de Criaturas del Compendio */}
      <section className={estilos.cabeceraSeccion}>
        <div className={estilos.tituloFila}>
          <h2 className={estilos.tituloPrincipal}>
            <PawPrint size={18} className={estilos.iconoTitulo} />
            Acompañantes y Sidekicks
          </h2>
          <span className={estilos.contadorAcompanantes}>
            {acompanantes.length} {acompanantes.length === 1 ? "criatura" : "criaturas"}
          </span>
        </div>

        <div className={estilos.barraAcciones}>
          <div className={estilos.cajaBuscador}>
            <Search size={14} className={estilos.iconoBuscador} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setMostrarSugerencias(true);
              }}
              onFocus={() => setMostrarSugerencias(true)}
              placeholder="Buscar en el compendio para añadir (ej. Lobo, Familiar, Duendecillo...)"
              className={estilos.inputBuscador}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setMostrarSugerencias(false);
                }}
                className={estilos.botonLimpiar}
                title="Limpiar búsqueda"
              >
                <X size={12} />
              </button>
            )}

            {/* Menú flotante de resultados del compendio */}
            {mostrarSugerencias && busqueda && (
              <div className={estilos.menuSugerencias}>
                {monstruosFiltrados.length === 0 ? (
                  <div className={estilos.vacioSugerencias}>
                    No se encontraron criaturas con "{busqueda}".
                  </div>
                ) : (
                  monstruosFiltrados.map((m) => (
                    <div
                      key={m.id}
                      className={estilos.itemSugerencia}
                      onClick={() => manejarAgregarAcompanante(m)}
                    >
                      <div>
                        <span className={estilos.nombreMonstruo}>{m.nombre}</span>
                        <span className={estilos.metaMonstruo}>
                          {m.tipo} | CA {m.ca} | PV {m.vidaMaxima} | CR {m.desafio || "—"}
                        </span>
                      </div>
                      <Plus size={14} color="#38bdf8" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Listado de Acompañantes */}
      {acompanantes.length === 0 ? (
        <div className={estilos.estadoVacio}>
          <PawPrint size={32} className={estilos.iconoVacio} />
          <h3 className={estilos.textoVacioTitulo}>Sin acompañantes activos</h3>
          <p className={estilos.textoVacioDesc}>
            Utiliza el buscador superior para vincular familiares, monturas, invocaciones o
            aliados tácticos a tu personaje.
          </p>
        </div>
      ) : (
        <div className={estilos.listaAcompanantes}>
          {acompanantes.map((acomp) => {
            const plantilla =
              baseDatosMonstruos.find((m) => m.id === acomp.idPlantilla) || null;

            return (
              <ItemAcompanante
                key={acomp.id}
                personajeId={personaje.id}
                acomp={acomp}
                plantilla={plantilla}
                criaturasSeleccionadas={criaturasSeleccionadas}
                onSeleccionarDetalle={(id) => setIdAcompananteDetalle(id)}
                onEliminar={() => eliminarAcompanantePersonaje(personaje.id, acomp.id)}
                onCurar={(cant) => manejarCurar(acomp, cant)}
                onDañar={(cant) => manejarDañar(acomp, cant)}
                onCambiarTempHP={(cant) =>
                  manejarCambiarTempHP(acomp.id, acomp.vidaActual, cant)
                }
                onAñadirCondicion={(cond) => manejarAñadirCondicion(acomp, cond)}
                onQuitarCondicion={(cond) => manejarQuitarCondicion(acomp, cond)}
                onAñadirEfecto={(nom, dur, opc) =>
                  manejarAñadirEfecto(acomp, nom, dur, opc)
                }
                onQuitarEfecto={(efId) => manejarQuitarEfecto(acomp, efId)}
                onLanzarIniciativa={() => manejarLanzarIniciativa(acomp, plantilla)}
                onEstablecerIniciativa={(val) =>
                  actualizarAcompanante(personaje.id, acomp.id, { iniciativa: val })
                }
                onLanzarAtaqueRapido={(accNom, accBono, accDados, accTipo) =>
                  manejarLanzarAtaqueRapido(acomp.nombre, accNom, accBono, accDados, accTipo)
                }
                obtenerPercepcionPasiva={obtenerPercepcionPasiva}
              />
            );
          })}
        </div>
      )}

      {/* 3. Modal de Estadísticas Completas (PanelFichaDnD) */}
      {idAcompananteDetalle && acompananteEnDetalle && plantillaEnDetalle && (
        <div
          className={estilos.modalFichaOverlay}
          onClick={() => setIdAcompananteDetalle(null)}
        >
          <div
            className={estilos.modalFichaContenido}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={estilos.modalFichaCabecera}>
              <h3 className={estilos.modalFichaTitulo}>
                Estadísticas: {acompananteEnDetalle.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setIdAcompananteDetalle(null)}
                className={estilos.botonCerrarModal}
                title="Cerrar ficha"
              >
                <X size={16} />
              </button>
            </div>
            <div className={estilos.modalFichaCuerpo}>
              <PanelFichaDnD
                criaturaNombre={acompananteEnDetalle.nombre}
                plantilla={plantillaEnDetalle}
                baseDatosHechizos={baseDatosHechizos}
                alHacerClicHechizo={(_hechizo: HechizoBase) => {}}
                lanzarAtaqueRapido={manejarLanzarAtaqueRapido}
                lanzarTiradaD20Interactiva={manejarLanzarTiradaD20}
                obtenerPercepcionPasiva={obtenerPercepcionPasiva}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
