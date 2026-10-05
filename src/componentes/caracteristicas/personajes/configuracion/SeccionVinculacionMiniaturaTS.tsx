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
 * Componente interactivo para la vinculación manual y automática de la miniatura 3D de TaleSpire.
 * Permite:
 * 1. Vincular directamente la miniatura actualmente seleccionada en el tablero 3D de TaleSpire.
 * 2. Explorar y elegir entre las miniaturas asignadas al jugador en el tablero actual.
 * 3. Desvincular manualmente la miniatura.
 * 4. Ingresar o editar manualmente el identificador GUID de la miniatura.
 */
export const SeccionVinculacionMiniaturaTS: React.FC<SeccionVinculacionMiniaturaTSProps> = ({
  idMiniaturaTS,
  nombrePersonaje,
  alActualizarMiniatura
}) => {
  const [cargandoSeleccion, setCargandoSeleccion] = useState<boolean>(false);
  const [cargandoMinisJugador, setCargandoMinisJugador] = useState<boolean>(false);
  const [minisJugador, setMinisJugador] = useState<InfoCriatura[]>([]);
  const [mensajeFeedback, setMensajeFeedback] = useState<{ texto: string; tipo: "exito" | "error" | "info" } | null>(null);
  const [mostrarEntradaManual, setMostrarEntradaManual] = useState<boolean>(false);
  const [idManual, setIdManual] = useState<string>(idMiniaturaTS || "");

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
      setIdManual(idStr);
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
   * Consulta las miniaturas pertenecientes al jugador conectado en TaleSpire.
   */
  const manejarCargarMiniaturasJugador = async () => {
    if (!ts.estaDisponible) {
      mostrarMensaje("TaleSpire no está disponible en este entorno.", "info");
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
        return;
      }

      const ids = fragmentos
        .map((f: { id?: string } | string) => (typeof f === "string" ? f : f.id || ""))
        .filter(Boolean);

      const infos = await ts.creatures.getMoreInfo(ids);
      setMinisJugador(infos || []);

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
    setIdManual("");
    mostrarMensaje("Miniatura desvinculada del personaje.", "info");
  };

  const manejarAplicarManual = (e: React.FormEvent) => {
    e.preventDefault();
    const idLimpio = idManual.trim();
    if (idLimpio) {
      alActualizarMiniatura(idLimpio);
      mostrarMensaje(`ID de miniatura asignado manualmente: ${idLimpio}`, "exito");
    } else {
      manejarDesvincular();
    }
    setMostrarEntradaManual(false);
  };

  return (
    <div className={estilos.campoFormulario}>
      <div className={estilos.cabeceraCampoConBadge}>
        <label className={`${estilos.labelFormulario} ${estilos.labelFormularioSinMargen}`}>
          Miniatura 3D en Tablero (TaleSpire)
        </label>
        {idMiniaturaTS && (
          <span className={estilos.badgeRangoXP}>
            ID: {idMiniaturaTS.length > 16 ? `${idMiniaturaTS.slice(0, 16)}...` : idMiniaturaTS}
          </span>
        )}
      </div>

      {/* Barra de Estado y Botones Principales de Vinculación */}
      <div className={estilos.contenedorVinculacionMini}>
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

        {/* Botón Acción Rápida: Vincular Selección Actual de TaleSpire */}
        <button
          type="button"
          onClick={manejarVincularSeleccionActual}
          disabled={cargandoSeleccion}
          className={`${estilos.botonDetectarJugador} ${estilos.botonVincularSeleccion}`}
          title="Asigna la miniatura que tienes seleccionada físicamente en TaleSpire"
        >
          <Crosshair size={13} />
          {cargandoSeleccion ? "Consultando..." : "Vincular Selección 3D"}
        </button>

        {/* Botón: Buscar Miniaturas asignadas al Jugador */}
        <button
          type="button"
          onClick={manejarCargarMiniaturasJugador}
          disabled={cargandoMinisJugador}
          className={estilos.botonDetectarJugador}
          title="Escanear y mostrar las miniaturas asignadas a tu jugador en el tablero"
        >
          <RefreshCw size={13} />
          {cargandoMinisJugador ? "Buscando..." : "Mis Miniaturas"}
        </button>

        {/* Botón: Desvincular si tiene miniatura asignada */}
        {idMiniaturaTS && (
          <button
            type="button"
            onClick={manejarDesvincular}
            className={`${estilos.botonDetectarJugador} ${estilos.botonDesvincularMini}`}
            title="Desvincular la miniatura actual de este personaje"
          >
            <Unlink size={13} />
            Desvincular
          </button>
        )}
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

      {/* Lista de miniaturas asignadas al jugador si se escanearon */}
      {minisJugador.length > 0 && (
        <div className={estilos.listaMinisDetectadas}>
          <span className={estilos.tituloListaMinis}>
            Miniaturas asignadas a tu jugador en TaleSpire (haz clic para vincular):
          </span>
          <div className={estilos.grillaMinisDetectadas}>
            {minisJugador.map((mini) => {
              const estaVinculada = idMiniaturaTS === mini.id;
              return (
                <button
                  key={mini.id}
                  type="button"
                  onClick={() => {
                    alActualizarMiniatura(mini.id, mini.position, mini.boardId);
                    setIdManual(mini.id);
                    mostrarMensaje(`Miniatura '${mini.name || "Sin nombre"}' vinculada.`, "exito");
                  }}
                  className={`${estilos.botonMiniDetectada} ${
                    estaVinculada ? estilos.botonMiniDetectadaActiva : ""
                  }`}
                  title={`ID: ${mini.id}`}
                >
                  <span className={estilos.nombreMiniDetectada}>{mini.name || "Sin Nombre"}</span>
                  <span className={estilos.idMiniDetectada}>
                    {mini.id.slice(0, 8)}...
                  </span>
                  {estaVinculada && <Check size={12} className={estilos.iconoCheckMini} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Alternar entrada manual de GUID */}
      <div className={estilos.contenedorEntradaManualToggle}>
        <button
          type="button"
          onClick={() => setMostrarEntradaManual(!mostrarEntradaManual)}
          className={estilos.botonToggleManual}
        >
          {mostrarEntradaManual ? "Ocultar edición manual de ID" : "Editar ID manualmente..."}
        </button>
      </div>

      {mostrarEntradaManual && (
        <form onSubmit={manejarAplicarManual} className={estilos.formularioManualMini}>
          <input
            type="text"
            className={`${estilos.inputFormulario} ${estilos.inputManualMini}`}
            value={idManual}
            onChange={(e) => setIdManual(e.target.value)}
            placeholder="Introduce el GUID de la miniatura de TaleSpire"
          />
          <button type="submit" className={estilos.botonDetectarJugador}>
            Guardar ID
          </button>
        </form>
      )}
    </div>
  );
};
