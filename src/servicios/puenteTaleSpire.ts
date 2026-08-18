/**
 * puenteTaleSpire.ts
 * ------------------
 * EventBus tipado centralizado que actúa como puente receptor de los callbacks
 * CEF de TaleSpire y redistribuye los eventos estructurados a suscriptores locales.
 *
 * Tipos directamente mapeados a la API oficial de TaleSpire v0.1:
 *   - iniciativaActualizada → initiative.onInitiativeEvent → initiativeQueue
 *   - seleccionCriaturas   → creatures.onCreatureSelectionChange → creatureSelection
 *   - resultadosDados      → dice.onRollResults → rollResults
 *   - estadoSimbionte      → symbiote.onStateChangeEvent → EventoEstadoSimbionte
 *   - estadoCriatura       → creatures.onCreatureStateChange → EventoCriaturaTS (union)
 *   - eventoCliente        → clients.onClientEvent → EventoClienteTS
 *
 */

import type {
  ColaIniciativaTS,
  SeleccionCriaturas,
  ResultadosTirada,
  EventoClienteTS,
  EventoCriaturaTS,
  EventoEstadoSimbionte
} from "@/tipos/talespire";
import { logger } from "@/utiles/logger";

/**
 * Contrato exhaustivo evento → tipo de payload, alineado con la API oficial v0.1.
 * Añadir aquí cualquier evento nuevo; el compilador propagará el tipado a `on` y `emit`.
 */
export interface MapaEventosPuente {
  /** initiative.onInitiativeEvent → initiativeUpdated */
  iniciativaActualizada: { queue?: ColaIniciativaTS } | undefined;
  /** creatures.onCreatureSelectionChange → creatureSelection */
  seleccionCriaturas:    SeleccionCriaturas;
  /** dice.onRollResults → rollResults */
  resultadosDados:       ResultadosTirada;
  /** symbiote.onStateChangeEvent → hasInitialized | willShutdown | etc. */
  estadoSimbionte:       EventoEstadoSimbionte;
  /** creatures.onCreatureStateChange → union discriminada por `kind` */
  estadoCriatura:        EventoCriaturaTS;
  /** clients.onClientEvent → clientJoinedBoard | clientLeftBoard | clientModeChanged */
  eventoCliente:         EventoClienteTS;
}

type NombreEvento = keyof MapaEventosPuente;
type CallbackEvento<E extends NombreEvento> = (data: MapaEventosPuente[E]) => void | Promise<void>;

/** Colección de oyentes indexada por evento, preservando la correlación evento↔tipo. */
type ColeccionOyentes = {
  [E in NombreEvento]?: CallbackEvento<E>[];
};

class PuenteTaleSpireClass {
  private oyentes: ColeccionOyentes = {};

  constructor() {
    this.registrarCallbacksGlobales();
  }

  /**
   * Suscribe un callback tipado a un evento específico.
   * El tipo del payload se infiere automáticamente del nombre del evento.
   * Devuelve una función de limpieza para cancelar la suscripción.
   */
  on<E extends NombreEvento>(evento: E, callback: CallbackEvento<E>): () => void {
    if (!this.oyentes[evento]) {
      this.oyentes[evento] = [] as ColeccionOyentes[E];
    }
    (this.oyentes[evento] as CallbackEvento<E>[]).push(callback);
    return () => this.off(evento, callback);
  }

  /**
   * Elimina la suscripción de un callback.
   */
  off<E extends NombreEvento>(evento: E, callback: CallbackEvento<E>) {
    if (!this.oyentes[evento]) return;
    (this.oyentes[evento] as CallbackEvento<E>[]) =
      (this.oyentes[evento] as CallbackEvento<E>[]).filter((cb) => cb !== callback);
  }

  /**
   * Emite un evento con datos tipados a todos sus oyentes registrados.
   */
  emit<E extends NombreEvento>(evento: E, data: MapaEventosPuente[E]) {
    const callbacks = this.oyentes[evento] as CallbackEvento<E>[] | undefined;
    if (!callbacks) return;
    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        logger.error(`[Puente TaleSpire] Error en callback del evento "${evento}":`, e);
      }
    });
  }

  /**
   * Deserializa un payload CEF que puede llegar como string JSON o como objeto.
   * Devuelve `unknown` — los llamadores concretos de `emit` ya tienen el tipo correcto.
   */
  private deserializarPayload(payload: unknown): unknown {
    if (typeof payload === "string") {
      try {
        return JSON.parse(payload);
      } catch {
        return payload;
      }
    }
    return payload;
  }

  /**
   * Registra los callbacks globales en window que inyecta/llama TaleSpire
   * según las suscripciones declaradas en el manifiesto.
   */
  private registrarCallbacksGlobales() {
    if (typeof window === "undefined") return;

    logger.info("[Puente TaleSpire] Inicializando callbacks globales en window...");

    // symbiote.onStateChangeEvent
    window.manejarCambioEstadoSimbionte = (evento) => {
      logger.debug("[Puente TaleSpire] Callback manejarCambioEstadoSimbionte:", evento);
      this.emit("estadoSimbionte", this.deserializarPayload(evento) as EventoEstadoSimbionte);
    };

    // initiative.onInitiativeEvent → initiativeUpdated
    window.initiativeUpdated = (payload) => {
      logger.debug("[Puente TaleSpire] Callback initiativeUpdated:", payload);
      this.emit("iniciativaActualizada", this.deserializarPayload(payload) as MapaEventosPuente["iniciativaActualizada"]);
    };

    window.manejarEventoIniciativa = (payload) => {
      logger.debug("[Puente TaleSpire] Callback manejarEventoIniciativa:", payload);
      this.emit("iniciativaActualizada", this.deserializarPayload(payload) as MapaEventosPuente["iniciativaActualizada"]);
    };

    // creatures.onCreatureStateChange → EventoCriaturaTS discriminado por kind
    window.manejarCambioEstadoCriatura = (evento) => {
      logger.debug("[Puente TaleSpire] Callback manejarCambioEstadoCriatura:", evento);
      this.emit("estadoCriatura", this.deserializarPayload(evento) as EventoCriaturaTS);
    };

    // creatures.onCreatureSelectionChange → creatureSelection
    window.manejarCambioSeleccionCriatura = (evento) => {
      logger.debug("[Puente TaleSpire] Callback manejarCambioSeleccionCriatura:", evento);
      this.emit("seleccionCriaturas", this.deserializarPayload(evento) as SeleccionCriaturas);
    };

    // dice.onRollResults → rollResults
    window.manejarResultadosDados = async (resultados) => {
      logger.debug("[Puente TaleSpire] Callback manejarResultadosDados:", resultados);
      this.emit("resultadosDados", this.deserializarPayload(resultados) as ResultadosTirada);
    };

    // clients.onClientEvent → clientJoinedBoard | clientLeftBoard | clientModeChanged
    window.manejarEventoCliente = (evento) => {
      logger.debug("[Puente TaleSpire] Callback manejarEventoCliente:", evento);
      this.emit("eventoCliente", this.deserializarPayload(evento) as EventoClienteTS);
    };

    // Registrar oyentes de eventos DOM estándar en window y document para redundancia CEF
    const manejarEventoIniciativaDOM = (e: Event) => {
      logger.debug("[Puente TaleSpire DOM] Capturado evento de iniciativa en el DOM:", e.type);
      // Los eventos DOM inyectados por CEF no suelen traer el payload completo en details
      this.emit("iniciativaActualizada", undefined);
    };

    window.addEventListener("initiativeUpdated", manejarEventoIniciativaDOM);
    document.addEventListener("initiativeUpdated", manejarEventoIniciativaDOM);
    window.addEventListener("manejarEventoIniciativa", manejarEventoIniciativaDOM);
    document.addEventListener("manejarEventoIniciativa", manejarEventoIniciativaDOM);
  }
}

export const puenteTaleSpire = new PuenteTaleSpireClass();
