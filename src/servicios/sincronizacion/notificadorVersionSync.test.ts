import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  gestionarNotificacionVersionIncompatible,
  reiniciarNotificadorVersion,
  COOLDOWN_NOTIFICACION_VERSION_MS,
} from "./notificadorVersionSync";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { VERSION_PROTOCOLO_SYNC } from "@/tipos/sync";
import type { FragmentoCliente } from "@/tipos/talespire";

describe("notificadorVersionSync", () => {
  let agregarNotificacionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    reiniciarNotificadorVersion();
    agregarNotificacionMock = vi.fn();
    usarAlmacenDM.setState({
      esGM: false,
      agregarNotificacion: agregarNotificacionMock,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    reiniciarNotificadorVersion();
  });

  it("no emite alertas si el payload no es un objeto o no contiene propiedad 'v'", () => {
    gestionarNotificacionVersionIncompatible(null);
    gestionarNotificacionVersionIncompatible(undefined);
    gestionarNotificacionVersionIncompatible("mensaje plano");
    gestionarNotificacionVersionIncompatible(42);
    gestionarNotificacionVersionIncompatible({ mensaje: "sin version" });

    expect(agregarNotificacionMock).not.toHaveBeenCalled();
  });

  it("no emite alertas si 'v' coincide con la versión local actual", () => {
    gestionarNotificacionVersionIncompatible({ v: VERSION_PROTOCOLO_SYNC, t: "REQ" });
    expect(agregarNotificacionMock).not.toHaveBeenCalled();
  });

  describe("Caso 1: Cliente local desactualizado (vRemota > VERSION_PROTOCOLO_SYNC)", () => {
    it("notifica al usuario local para que actualice su Simbionte", () => {
      gestionarNotificacionVersionIncompatible({ v: VERSION_PROTOCOLO_SYNC + 1 });

      expect(agregarNotificacionMock).toHaveBeenCalledTimes(1);
      expect(agregarNotificacionMock).toHaveBeenCalledWith(
        "Tu versión del Simbionte está desactualizada. Por favor actualiza a la última versión para poder sincronizar.",
        "advertencia"
      );
    });

    it("aplica ventana de enfriamiento (cooldown) y no bombardea al usuario ante ráfagas de paquetes", () => {
      // 10 paquetes consecutivos en una fracción de segundo
      for (let i = 0; i < 10; i++) {
        gestionarNotificacionVersionIncompatible({ v: VERSION_PROTOCOLO_SYNC + 1 });
      }

      // Solo 1 notificación emitida a pesar de recibir 10 paquetes
      expect(agregarNotificacionMock).toHaveBeenCalledTimes(1);

      // Avanzar el tiempo 30 segundos (dentro del cooldown de 60s)
      vi.advanceTimersByTime(30_000);
      gestionarNotificacionVersionIncompatible({ v: VERSION_PROTOCOLO_SYNC + 1 });
      expect(agregarNotificacionMock).toHaveBeenCalledTimes(1);

      // Avanzar el tiempo más allá del cooldown (> 60s)
      vi.advanceTimersByTime(COOLDOWN_NOTIFICACION_VERSION_MS + 100);
      gestionarNotificacionVersionIncompatible({ v: VERSION_PROTOCOLO_SYNC + 1 });
      expect(agregarNotificacionMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("Caso 2: Remitente remoto desactualizado (vRemota < VERSION_PROTOCOLO_SYNC)", () => {
    const remitenteAlice: FragmentoCliente = {
      id: "cliente-alice",
      player: { id: "p-alice", name: "Alice" },
    };

    it("si el cliente local es Jugador (no DM), silencia por completo el aviso para no confundirlo", () => {
      usarAlmacenDM.setState({ esGM: false });

      for (let i = 0; i < 5; i++) {
        gestionarNotificacionVersionIncompatible({ v: 1 }, remitenteAlice);
      }

      expect(agregarNotificacionMock).not.toHaveBeenCalled();
    });

    it("si el cliente local es DM, le notifica identificando el nombre del jugador desactualizado", () => {
      usarAlmacenDM.setState({ esGM: true });

      gestionarNotificacionVersionIncompatible({ v: 1 }, remitenteAlice);

      expect(agregarNotificacionMock).toHaveBeenCalledTimes(1);
      expect(agregarNotificacionMock).toHaveBeenCalledWith(
        'El jugador "Alice" tiene una versión desactualizada del Simbionte y no puede sincronizar.',
        "advertencia"
      );
    });

    it("si el remitente no tiene nombre disponible, usa redacción genérica clara", () => {
      usarAlmacenDM.setState({ esGM: true });

      gestionarNotificacionVersionIncompatible({ v: 1 });

      expect(agregarNotificacionMock).toHaveBeenCalledTimes(1);
      expect(agregarNotificacionMock).toHaveBeenCalledWith(
        "Un participante tiene una versión desactualizada del Simbionte y no puede sincronizar.",
        "advertencia"
      );
    });

    it("el DM no recibe ráfagas duplicadas del mismo remitente desactualizado", () => {
      usarAlmacenDM.setState({ esGM: true });

      // Alice envía 15 paquetes seguidos
      for (let i = 0; i < 15; i++) {
        gestionarNotificacionVersionIncompatible({ v: 1 }, remitenteAlice);
      }

      expect(agregarNotificacionMock).toHaveBeenCalledTimes(1);
    });

    it("distintos remitentes desactualizados generan alertas independientes para el DM", () => {
      usarAlmacenDM.setState({ esGM: true });

      const remitenteBob: FragmentoCliente = {
        id: "cliente-bob",
        player: { id: "p-bob", name: "Bob" },
      };

      gestionarNotificacionVersionIncompatible({ v: 1 }, remitenteAlice);
      gestionarNotificacionVersionIncompatible({ v: 1 }, remitenteBob);

      expect(agregarNotificacionMock).toHaveBeenCalledTimes(2);
      expect(agregarNotificacionMock).toHaveBeenNthCalledWith(
        1,
        'El jugador "Alice" tiene una versión desactualizada del Simbionte y no puede sincronizar.',
        "advertencia"
      );
      expect(agregarNotificacionMock).toHaveBeenNthCalledWith(
        2,
        'El jugador "Bob" tiene una versión desactualizada del Simbionte y no puede sincronizar.',
        "advertencia"
      );
    });
  });

  describe("reiniciarNotificadorVersion", () => {
    it("limpia el mapa de enfriamientos permitiendo emitir alertas nuevamente de inmediato", () => {
      usarAlmacenDM.setState({ esGM: true });

      const remitente: FragmentoCliente = {
        id: "cliente-1",
        player: { id: "p-1", name: "Jugador 1" },
      };

      gestionarNotificacionVersionIncompatible({ v: 1 }, remitente);
      expect(agregarNotificacionMock).toHaveBeenCalledTimes(1);

      // Enfriamiento activo
      gestionarNotificacionVersionIncompatible({ v: 1 }, remitente);
      expect(agregarNotificacionMock).toHaveBeenCalledTimes(1);

      // Reseteo de sesión
      reiniciarNotificadorVersion();

      gestionarNotificacionVersionIncompatible({ v: 1 }, remitente);
      expect(agregarNotificacionMock).toHaveBeenCalledTimes(2);
    });
  });
});
