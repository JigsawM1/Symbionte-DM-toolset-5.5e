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
  EventoEstadoSimbionte,
  FragmentoCliente
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
  /** sync.onSyncMessage → syncMessageReceived { str, fromClient } */
  mensajeSync:           { datos: unknown; strCrudo: string; fromClient?: FragmentoCliente };
  /** sync.onClientEvent → eventoClienteSync */
  eventoClienteSync:     EventoClienteTS;
}

type NombreEvento = keyof MapaEventosPuente;
type CallbackEvento<E extends NombreEvento> = (data: MapaEventosPuente[E]) => void | Promise<void>;

/** Colección de oyentes indexada por evento, preservando la correlación evento↔tipo. */
type ColeccionOyentes = {
  [E in NombreEvento]?: CallbackEvento<E>[];
};

class PuenteTaleSpireClass {
  private oyentes: ColeccionOyentes = {};
  private manejarEventoIniciativaDOM?: (e: Event) => void;
  private manejarResultadosDadosDOM?: (e: Event) => void;

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
      } catch (err) {
        logger.debug("[puenteTaleSpire] Payload string no es JSON válido, utilizándolo tal cual:", err);
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

    window.onRollResults = async (resultados) => {
      logger.debug("[Puente TaleSpire] Callback onRollResults:", resultados);
      this.emit("resultadosDados", this.deserializarPayload(resultados) as ResultadosTirada);
    };

    // clients.onClientEvent → clientJoinedBoard | clientLeftBoard | clientModeChanged
    window.manejarEventoCliente = (evento) => {
      logger.debug("[Puente TaleSpire] Callback manejarEventoCliente:", evento);
      this.emit("eventoCliente", this.deserializarPayload(evento) as EventoClienteTS);
    };

    // sync.onSyncMessage → syncMessageReceived { str, fromClient } (con extracción robusta multiformato)
    const procesarMensajeSyncExtraccion = (evento: unknown, clienteParam?: unknown) => {
      logger.debug("[Puente TaleSpire] Mensaje sync recibido en puente:", evento, clienteParam);

      let str = "";
      let datos: unknown = null;
      let fromClient: FragmentoCliente | undefined =
        clienteParam && typeof clienteParam === "object" ? (clienteParam as FragmentoCliente) : undefined;

      // 1. Si el primer argumento es un string JSON o plano
      if (typeof evento === "string") {
        str = evento;
        try {
          datos = JSON.parse(str);
        } catch {
          datos = null;
        }
      } else if (evento && typeof evento === "object") {
        const ev = evento as Record<string, unknown>;

        // 2. Si ya es un objeto de TaleSpire con propiedad "str"
        if (typeof ev.str === "string") {
          str = ev.str;
          if (ev.fromClient && typeof ev.fromClient === "object") {
            fromClient = ev.fromClient as FragmentoCliente;
          }
          try {
            datos = JSON.parse(str);
          } catch {
            datos = null;
          }
        }
        // 3. Wrapper de evento { kind: "syncMessageReceived", payload: ... }
        else if (ev.kind === "syncMessageReceived" && ev.payload) {
          if (typeof ev.payload === "string") {
            str = ev.payload;
            try {
              datos = JSON.parse(str);
            } catch {
              datos = null;
            }
          } else if (typeof ev.payload === "object") {
            const p = ev.payload as Record<string, unknown>;
            if (typeof p.str === "string") {
              str = p.str;
              if (p.fromClient && typeof p.fromClient === "object") {
                fromClient = p.fromClient as FragmentoCliente;
              }
              try {
                datos = JSON.parse(str);
              } catch {
                datos = null;
              }
            } else {
              datos = p;
              try {
                str = JSON.stringify(p);
              } catch {
                str = "";
              }
            }
          }
        }
        // 4. Payload deserializado directamente con estructura { t, v }
        else if ("t" in ev && "v" in ev) {
          datos = ev;
          try {
            str = JSON.stringify(ev);
          } catch {
            str = "";
          }
        }
      }

      // Si tenemos datos como objeto que aún no se parsearon pero tenemos str
      if (!datos && str) {
        try {
          datos = JSON.parse(str);
        } catch (e) {
          logger.warn("[Puente TaleSpire] Error parseando JSON en mensajeSync:", e);
        }
      }

      if (datos) {
        this.emit("mensajeSync", { datos, strCrudo: str, fromClient });
      } else {
        logger.warn("[Puente TaleSpire] Mensaje sync recibido sin datos interpretables:", evento);
      }
    };

    window.manejarMensajeSync = procesarMensajeSyncExtraccion;
    (window as unknown as Record<string, unknown>).syncMessageReceived = procesarMensajeSyncExtraccion;
    (window as unknown as Record<string, unknown>).onSyncMessage = procesarMensajeSyncExtraccion;

    // Escuchar también en BroadcastChannel para sincronización entre pestañas o desarrollo local
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const canalSync = new BroadcastChannel("talespire-simbiote-sync");
        canalSync.onmessage = (ev) => {
          logger.debug("[Puente TaleSpire BroadcastChannel] Mensaje recibido:", ev.data);
          if (ev.data && typeof ev.data === "object" && "str" in ev.data) {
            procesarMensajeSyncExtraccion(ev.data.str, ev.data.fromClient);
          } else {
            procesarMensajeSyncExtraccion(ev.data);
          }
        };
      } catch (e) {
        logger.debug("[Puente TaleSpire] No se pudo inicializar BroadcastChannel:", e);
      }
    }

    // sync.onClientEvent → manejarEventoClienteSync
    window.manejarEventoClienteSync = (evento) => {
      logger.debug("[Puente TaleSpire] Callback manejarEventoClienteSync:", evento);
      this.emit("eventoClienteSync", this.deserializarPayload(evento) as EventoClienteTS);
    };

    // Registrar oyentes de eventos DOM estándar en window y document para redundancia CEF
    this.manejarEventoIniciativaDOM = (e: Event) => {
      logger.debug("[Puente TaleSpire DOM] Capturado evento de iniciativa en el DOM:", e.type);
      // Los eventos DOM inyectados por CEF no suelen traer el payload completo en details
      this.emit("iniciativaActualizada", undefined);
    };

    this.manejarResultadosDadosDOM = (e: Event) => {
      logger.debug("[Puente TaleSpire DOM] Capturado evento de dados en el DOM:", e.type);
      const customEv = e as CustomEvent;
      if (customEv.detail) {
        this.emit("resultadosDados", this.deserializarPayload(customEv.detail) as ResultadosTirada);
      }
    };

    window.addEventListener("initiativeUpdated", this.manejarEventoIniciativaDOM);
    document.addEventListener("initiativeUpdated", this.manejarEventoIniciativaDOM);
    window.addEventListener("manejarEventoIniciativa", this.manejarEventoIniciativaDOM);
    document.addEventListener("manejarEventoIniciativa", this.manejarEventoIniciativaDOM);
    window.addEventListener("manejarResultadosDados", this.manejarResultadosDadosDOM);
    document.addEventListener("manejarResultadosDados", this.manejarResultadosDadosDOM);
    window.addEventListener("onRollResults", this.manejarResultadosDadosDOM);
    document.addEventListener("onRollResults", this.manejarResultadosDadosDOM);
  }

  /**
   * Limpia y desuscribe todos los event listeners DOM, callbacks globales y suscriptores.
   * Evita fugas de memoria al recargar o desmontar el puente en pruebas o tiempo de ejecución.
   */
  public destruir(): void {
    if (typeof window !== "undefined") {
      if (this.manejarEventoIniciativaDOM) {
        window.removeEventListener("initiativeUpdated", this.manejarEventoIniciativaDOM);
        document.removeEventListener("initiativeUpdated", this.manejarEventoIniciativaDOM);
        window.removeEventListener("manejarEventoIniciativa", this.manejarEventoIniciativaDOM);
        document.removeEventListener("manejarEventoIniciativa", this.manejarEventoIniciativaDOM);
      }

      if (this.manejarResultadosDadosDOM) {
        window.removeEventListener("manejarResultadosDados", this.manejarResultadosDadosDOM);
        document.removeEventListener("manejarResultadosDados", this.manejarResultadosDadosDOM);
        window.removeEventListener("onRollResults", this.manejarResultadosDadosDOM);
        document.removeEventListener("onRollResults", this.manejarResultadosDadosDOM);
      }

      delete window.manejarCambioEstadoSimbionte;
      delete window.initiativeUpdated;
      delete window.manejarEventoIniciativa;
      delete window.manejarCambioEstadoCriatura;
      delete window.manejarCambioSeleccionCriatura;
      delete window.manejarResultadosDados;
      delete window.onRollResults;
      delete window.manejarEventoCliente;
      delete window.manejarMensajeSync;
      delete (window as unknown as Record<string, unknown>).syncMessageReceived;
      delete (window as unknown as Record<string, unknown>).onSyncMessage;
      delete window.manejarEventoClienteSync;
    }

    this.oyentes = {};
  }
}

export const puenteTaleSpire = new PuenteTaleSpireClass();
