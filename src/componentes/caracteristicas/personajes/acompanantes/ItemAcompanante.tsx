import React, { useState, useMemo, useRef, useEffect } from "react";
import { Footprints, Sparkles, Link2, Unlink } from "lucide-react";
import type {
  AcompanantePersonaje,
  MonstruoBase,
  TipoTerreno,
  PlantillaInvocacion
} from "@/tipos";
import { INFORMACION_TERRENO } from "@/tipos";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { usarAccionesPersonajes } from "@/almacen/selectores";
import { TarjetaCriaturaIniciativa } from "@/componentes/caracteristicas/iniciativa/TarjetaCriaturaIniciativa";
import { formatearVelocidad } from "@/almacen/sanitizacion";
import { calcularEstadoVelocidadDinamica } from "@/servicios/calculadorDistanciaTS";
import { PopoverVelocidadAcompanante } from "./PopoverVelocidadAcompanante";
import estilos from "./SeccionAcompanantesPersonaje.module.css";

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

export interface ItemAcompananteProps {
  personajeId: string;
  acomp: AcompanantePersonaje;
  plantilla: MonstruoBase | null;
  plantillaInvocacion?: PlantillaInvocacion | null;
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
  onEstablecerVidaMaxima?: (val: number) => void;
  onLanzarAtaqueRapido: (accNom: string, accBono: string, accDados: string, accTipo: string) => void;
  onCambiarNivelConjuroInvocacion?: (nuevoNivel: number) => void;
  onCambiarSubtipoInvocacion?: (nuevoSubtipo: string) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
}

export const ItemAcompanante: React.FC<ItemAcompananteProps> = ({
  personajeId,
  acomp,
  plantilla,
  plantillaInvocacion,
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
  onEstablecerVidaMaxima,
  onLanzarAtaqueRapido,
  onCambiarNivelConjuroInvocacion,
  onCambiarSubtipoInvocacion,
  obtenerPercepcionPasiva
}) => {
  const { vincularMiniaturaTSAcompanante } = usarAccionesPersonajes();

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
  const popoverRef = useRef<HTMLDivElement>(null);

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
        onEstablecerVidaMaxima={onEstablecerVidaMaxima}
        onLanzarAtaqueRapido={onLanzarAtaqueRapido}
        obtenerPercepcionPasiva={obtenerPercepcionPasiva}
      />

      {/* Barra de Control Dinámico de Invocación (D&D 5.5e / PHB 2024) */}
      {plantillaInvocacion && onCambiarNivelConjuroInvocacion && (
        <div className={estilos.barraControlInvocacion}>
          <div className={estilos.cabeceraControlInvocacion}>
            <Sparkles size={13} className={estilos.iconoInvocacion} />
            <span className={estilos.etiquetaNivelInvocacion}>Nivel de Conjuro:</span>
            <span className={estilos.conjuroAsociadoBadge}>
              ({plantillaInvocacion.conjuroAsociado})
            </span>
          </div>

          <div className={estilos.filaBotonesNivel}>
            {Array.from(
              { length: plantillaInvocacion.nivelMaximo - plantillaInvocacion.nivelMinimo + 1 },
              (_, i) => plantillaInvocacion.nivelMinimo + i
            ).map((nv) => {
              const esActivo = (acomp.nivelConjuroInvocacion || plantillaInvocacion.nivelMinimo) === nv;
              return (
                <button
                  key={nv}
                  type="button"
                  onClick={() => onCambiarNivelConjuroInvocacion(nv)}
                  className={`${estilos.botonNivelInvocacion} ${esActivo ? estilos.botonNivelInvocacionActivo : ""}`}
                  title={`Escalar estadísticas a espacio de conjuro nivel ${nv}`}
                >
                  {nv}
                </button>
              );
            })}

            {plantillaInvocacion.subtiposDisponibles.length > 1 && onCambiarSubtipoInvocacion && (
              <div className={estilos.filaBotonesSubtipo}>
                {plantillaInvocacion.subtiposDisponibles.map((sub: string) => {
                  const esActivo = (acomp.subtipoInvocacion || plantillaInvocacion.subtiposDisponibles[0]) === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => onCambiarSubtipoInvocacion(sub)}
                      className={`${estilos.botonSubtipoInvocacion} ${esActivo ? estilos.botonSubtipoInvocacionActivo : ""}`}
                      title={`Seleccionar forma o subtipo ${sub}`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
          <Footprints size={12} color="var(--pj-texto-cian)" />
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

        {/* Popover Menú Flotante de Movimiento */}
        {menuVelocidadAbierto && (
          <PopoverVelocidadAcompanante
            personajeId={personajeId}
            acomp={acomp}
            estadoVelocidad={estadoVelocidad}
            tipoTerrenoActual={tipoTerrenoActual}
            onCerrar={() => setMenuVelocidadAbierto(false)}
          />
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
