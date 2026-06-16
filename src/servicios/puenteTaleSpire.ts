/**
 * puenteTaleSpire.ts
 * ------------------
 * EventBus tipado centralizado que actúa como puente receptor de los callbacks
 * CEF de TaleSpire y redistribuye los eventos estructurados a suscriptores locales.
 *
 * Programado 100% en español.
 */

import type { ColaIniciativaTS, SeleccionCriaturas, ResultadosTirada } from "../tipos/talespire";

type CallbackEvento<T> = (data: T) => void | Promise<void>;

class PuenteTaleSpireClass {
  private oyentes: Record<string, CallbackEvento<any>[]> = {};

  constructor() {
    this.registrarCallbacksGlobales();
  }

  /**
   * Suscribe un callback a un evento específico.
   * Devuelve una función para cancelar la suscripción.
   */
  on<T>(evento: "iniciativaActualizada", callback: CallbackEvento<{ queue?: ColaIniciativaTS } | undefined>): () => void;
  on<T>(evento: "seleccionCriaturas", callback: CallbackEvento<SeleccionCriaturas>): () => void;
  on<T>(evento: "resultadosDados", callback: CallbackEvento<ResultadosTirada>): () => void;
  on<T>(evento: "estadoSimbionte", callback: CallbackEvento<any>): () => void;
  on<T>(evento: "estadoCriatura", callback: CallbackEvento<any>): () => void;
  on<T>(evento: string, callback: CallbackEvento<T>): () => void {
    if (!this.oyentes[evento]) {
      this.oyentes[evento] = [];
    }
    this.oyentes[evento].push(callback);
    return () => this.off(evento, callback);
  }

  /**
   * Elimina la suscripción de un callback.
   */
  off<T>(evento: string, callback: CallbackEvento<T>) {
    if (!this.oyentes[evento]) return;
    this.oyentes[evento] = this.oyentes[evento].filter((cb) => cb !== callback);
  }

  /**
   * Emite un evento con datos asociados a todos sus oyentes registrados.
   */
  emit(evento: string, data: any) {
    if (!this.oyentes[evento]) return;
    this.oyentes[evento].forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error(`[Puente TaleSpire] Error en callback del evento "${evento}":`, e);
      }
    });
  }

  /**
   * Registra los callbacks globales en window que inyecta/llama TaleSpire
   * según las suscripciones declaradas en el manifiesto.
   */
  private registrarCallbacksGlobales() {
    if (typeof window === "undefined") return;

    console.log("[Puente TaleSpire] Inicializando callbacks globales en window...");

    window.manejarCambioEstadoSimbionte = (evento) => {
      console.log("[Puente TaleSpire] Callback manejarCambioEstadoSimbionte:", evento);
      this.emit("estadoSimbionte", evento);
    };

    window.initiativeUpdated = (payload) => {
      console.log("[Puente TaleSpire] Callback initiativeUpdated:", payload);
      this.emit("iniciativaActualizada", payload);
    };

    window.manejarEventoIniciativa = (payload) => {
      console.log("[Puente TaleSpire] Callback manejarEventoIniciativa:", payload);
      this.emit("iniciativaActualizada", payload);
    };

    window.manejarCambioEstadoCriatura = (evento) => {
      console.log("[Puente TaleSpire] Callback manejarCambioEstadoCriatura:", evento);
      this.emit("estadoCriatura", evento);
    };

    window.manejarCambioSeleccionCriatura = (evento) => {
      console.log("[Puente TaleSpire] Callback manejarCambioSeleccionCriatura:", evento);
      this.emit("seleccionCriaturas", evento);
    };

    window.manejarResultadosDados = async (resultados) => {
      console.log("[Puente TaleSpire] Callback manejarResultadosDados:", resultados);
      this.emit("resultadosDados", resultados);
    };

    // Registrar oyentes de eventos DOM estándar en window y document para redundancia CEF
    const manejarEventoIniciativaDOM = (e: Event) => {
      console.log("[Puente TaleSpire DOM] Capturado evento de iniciativa en el DOM:", e.type);
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
