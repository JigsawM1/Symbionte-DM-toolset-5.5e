import React, { useState } from "react";
import { Link, Unlink, Crosshair, RefreshCw, Check, AlertCircle } from "lucide-react";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import type { PosicionTS } from "@/tipos";
import type { InfoCriatura } from "@/tipos/talespire";
import estilos from "./ConfiguracionPersonaje.module.css";

export interface SeccionVinculacionMiniaturaTSProps {
  idMiniaturaTS?: string | null;
  nombrePersonaje: string;
  alActualizarMiniatura: (idMini: string | null, posicion?: PosicionTS, boardId?: string | null) => void;
}

/**
 * Componente modular a ancho completo para la vinculación de la miniatura 3D de TaleSpire.
 * Permite:
 * 1. Vincular directamente la miniatura seleccionada físicamente en el tablero 3D de TaleSpire.
 * 2. Explorar y seleccionar con un clic las miniaturas asignadas al jugador en el tablero actual.
 * 3. Desvincular la miniatura actual.
 */
export const SeccionVinculacionMiniaturaTS: React.FC<SeccionVinculacionMiniaturaTSProps> = ({
  idMiniaturaTS,
  nombrePersonaje,
  alActualizarMiniatura
}) => {
  const [cargandoSeleccion, setCargandoSeleccion] = useState<boolean>(false);
  const [cargandoMinisJugador, setCargandoMinisJugador] = useState<boolean>(false);
  const [minisJugador, setMinisJugador] = useState<InfoCriatura[]>([]);
  const [mostrarListaMinis, setMostrarListaMinis] = useState<boolean>(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<{ texto: string; tipo: "exito" | "error" | "info" } | null>(null);

  const mostrarMensaje = (texto: string, tipo: "exito" | "error" | "info") => {
    setMensajeFeedback({ texto, tipo });
    setTimeout(() => {
      setMensajeFeedback(null);
    }, 4500);
  };

  /**
   * Vincula la miniatura que el jugador tenga actualmente seleccionada en la mesa 3D de TaleSpire.
   */
  const manejarVincularSeleccionActual = async () => {
    if (!ts.estaDisponible) {
      mostrarMensaje("TaleSpire no está disponible en este entorno.", "info");
      return;
    }

    try {
      setCargandoSeleccion(true);
      const seleccion = await ts.creatures.getSelectedCreatures();

      if (!seleccion || seleccion.length === 0) {
        mostrarMensaje(
          "No hay ninguna miniatura seleccionada en TaleSpire. Haz clic en tu miniatura en el tablero y vuelve a pulsar aquí.",
          "error"
        );
        return;
      }

      const primera = seleccion[0];
      const idStr = typeof primera === "string" ? primera : primera.id;
      if (!idStr) {
        mostrarMensaje("No se pudo obtener el identificador de la criatura seleccionada.", "error");
        return;
      }

      // Obtener detalles adicionales de la criatura
      const infos = await ts.creatures.getMoreInfo([idStr]);
      const infoCriatura = infos && infos[0] ? infos[0] : null;

      alActualizarMiniatura(idStr, infoCriatura?.position, infoCriatura?.boardId);
      mostrarMensaje(
        `Miniatura '${infoCriatura?.name || idStr}' vinculada exitosamente a ${nombrePersonaje}.`,
        "exito"
      );
    } catch (error) {
      logger.error("[SeccionVinculacionMiniaturaTS] Error al vincular selección:", error);
      mostrarMensaje("Ocurrió un error al consultar la selección de TaleSpire.", "error");
    } finally {
      setCargandoSeleccion(false);
    }
  };

  /**
   * Consulta las miniaturas pertenecientes al jugador conectado en TaleSpire y abre la lista interactiva.
   */
  const manejarCargarMiniaturasJugador = async () => {
    if (!ts.estaDisponible) {
      mostrarMensaje("TaleSpire no está disponible en este entorno.", "info");
      return;
    }

    // Si la lista ya estaba abierta con datos, alternar visibilidad
    if (minisJugador.length > 0 && mostrarListaMinis) {
      setMostrarListaMinis(false);
      return;
    }

    try {
      setCargandoMinisJugador(true);
      let playerId = await ts.clients.obtenerPlayerId();
      if (!playerId) {
        const yoJugador = await ts.players.whoAmI();
        playerId = yoJugador?.id || null;
      }

      if (!playerId) {
        mostrarMensaje("No se pudo determinar el jugador conectado en TaleSpire.", "error");
        return;
      }

      const fragmentos = await ts.creatures.getCreaturesOwnedByPlayer(playerId);
      if (!fragmentos || fragmentos.length === 0) {
        mostrarMensaje("No se encontraron miniaturas asignadas a tu usuario en este tablero.", "info");
        setMinisJugador([]);
        setMostrarListaMinis(false);
        return;
      }

      const ids = fragmentos
        .map((f: { id?: string } | string) => (typeof f === "string" ? f : f.id || ""))
        .filter(Boolean);

      const infos = await ts.creatures.getMoreInfo(ids);
      setMinisJugador(infos || []);
      setMostrarListaMinis(true);

      if (infos && infos.length > 0) {
        mostrarMensaje(`Se encontraron ${infos.length} miniatura(s) asignada(s) a tu usuario.`, "info");
      } else {
        mostrarMensaje("No se pudieron cargar detalles de las miniaturas del jugador.", "info");
      }
    } catch (error) {
      logger.error("[SeccionVinculacionMiniaturaTS] Error al cargar miniaturas del jugador:", error);
      mostrarMensaje("Error al consultar las criaturas del jugador en TaleSpire.", "error");
    } finally {
      setCargandoMinisJugador(false);
    }
  };

  const manejarDesvincular = () => {
    alActualizarMiniatura(null);
    mostrarMensaje("Miniatura desvinculada del personaje.", "info");
  };

  return (
    <div className={estilos.tarjetaVinculacionMiniatura}>
      {/* Cabecera con Estado y Desvincular */}
      <div className={estilos.cabeceraVinculacionMini}>
        <div className={estilos.grupoEstadoMini}>
          <span className={estilos.labelMiniatura}>Miniatura 3D en Tablero</span>
          <div
            className={`${estilos.indicadorMiniatura} ${
              idMiniaturaTS
                ? estilos.indicadorMiniaturaDetectada
                : estilos.indicadorMiniaturaAusente
            }`}
            title={
              idMiniaturaTS
                ? `Miniatura vinculada (ID: ${idMiniaturaTS}). Se conservará de forma persistente.`
                : "Sin miniatura vinculada. Pulsa en vincular selección para asociar tu ficha a una miniatura 3D."
            }
          >
            <span className={estilos.puntoMiniatura} />
            <span>{idMiniaturaTS ? "Miniatura Vinculada" : "Sin Miniatura en Tablero"}</span>
          </div>
        </div>

        {/* Acción de desvinculación rápida si tiene miniatura asignada */}
        {idMiniaturaTS && (
          <button
            type="button"
            onClick={manejarDesvincular}
            className={estilos.botonDesvincularMini}
            title="Desvincular la miniatura actual de este personaje"
          >
            <Unlink size={12} />
            Desvincular
          </button>
        )}
      </div>

      {/* Fila Horizontal de Acciones Principales */}
      <div className={estilos.filaBotonesAccionMini}>
        <button
          type="button"
          onClick={manejarVincularSeleccionActual}
          disabled={cargandoSeleccion}
          className={estilos.botonAccionMiniPrimario}
          title="Asigna la miniatura que tienes seleccionada físicamente en TaleSpire"
        >
          <Crosshair size={14} />
          <span>{cargandoSeleccion ? "Consultando..." : "Vincular Selección 3D"}</span>
        </button>

        <button
          type="button"
          onClick={manejarCargarMiniaturasJugador}
          disabled={cargandoMinisJugador}
          className={estilos.botonAccionMiniSecundario}
          title="Escanear y mostrar las miniaturas asignadas a tu jugador en el tablero actual"
        >
          <RefreshCw size={14} />
          <span>{cargandoMinisJugador ? "Buscando..." : "Mis Miniaturas"}</span>
        </button>

        <p className={estilos.textoAyudaMini}>
          Haz clic en tu miniatura en TaleSpire y pulsa &quot;Vincular Selección 3D&quot;, o pulsa &quot;Mis Miniaturas&quot; para elegirla.
        </p>
      </div>

      {/* Feedback contextual de la operación */}
      {mensajeFeedback && (
        <div
          className={`${estilos.mensajeFeedbackMini} ${
            mensajeFeedback.tipo === "exito"
              ? estilos.mensajeFeedbackExito
              : mensajeFeedback.tipo === "error"
              ? estilos.mensajeFeedbackError
              : estilos.mensajeFeedbackInfo
          }`}
        >
          {mensajeFeedback.tipo === "exito" && <Check size={13} />}
          {mensajeFeedback.tipo === "error" && <AlertCircle size={13} />}
          {mensajeFeedback.tipo === "info" && <Link size={13} />}
          <span>{mensajeFeedback.texto}</span>
        </div>
      )}

      {/* Lista interactiva de miniaturas asignadas al jugador */}
      {mostrarListaMinis && minisJugador.length > 0 && (
        <div className={estilos.listaMinisDetectadas}>
          <div className={estilos.cabeceraListaMinis}>
            <span className={estilos.tituloListaMinis}>
              Miniaturas asignadas a tu cuenta en TaleSpire (haz clic para vincular):
            </span>
          </div>

          <div className={estilos.grillaMinisDetectadas}>
            {minisJugador.map((mini) => {
              const estaVinculada = idMiniaturaTS === mini.id;
              return (
                <button
                  key={mini.id}
                  type="button"
                  onClick={() => {
                    alActualizarMiniatura(mini.id, mini.position, mini.boardId);
                    mostrarMensaje(`Miniatura '${mini.name || "Sin nombre"}' vinculada.`, "exito");
                  }}
                  className={`${estilos.botonMiniDetectada} ${
                    estaVinculada ? estilos.botonMiniDetectadaActiva : ""
                  }`}
                  title={`ID: ${mini.id}`}
                >
                  <span className={estilos.nombreMiniDetectada}>{mini.name || "Sin Nombre"}</span>
                  <span className={estilos.idMiniDetectada}>
                    {mini.id.length > 12 ? `${mini.id.slice(0, 12)}...` : mini.id}
                  </span>
                  {estaVinculada && <Check size={14} className={estilos.iconoCheckMini} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
