import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  lanzarDadosTaleSpire,
  procesarResultadosDadosTaleSpire,
  extraerPayloadResultadosDados,
  crearDescriptoresManualmente
} from "@/utiles/lanzadorDados";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ts } from "@/utiles/TaleSpireAdapter";
import type { DescriptorTirada, GrupoResultadosTirada } from "@/tipos/talespire";

describe("Lanzador de Dados - Ventaja, Desventaja y Notificación a TaleSpire", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      tipoTirada: "plano",
      colaIniciativa: [],
      notificaciones: []
    });
    vi.restoreAllMocks();
  });

  describe("extraerPayloadResultadosDados (Normalización Polimórfica)", () => {
    it("extrae correctamente desde el objeto nativo directo de TaleSpire (v0.1)", () => {
      const nativoTaleSpire = {
        rollId: "roll-abc-123",
        clientId: "client-xyz",
        resultsGroups: [
          { name: "Ataque (A)", result: { value: 18 } },
          { name: "Ataque (B)", result: { value: 12 } }
        ],
        gmOnly: false,
        quiet: false
      };

      const payload = extraerPayloadResultadosDados(nativoTaleSpire);
      expect(payload).not.toBeNull();
      expect(payload?.rollId).toBe("roll-abc-123");
      expect(payload?.resultsGroups).toHaveLength(2);
    });

    it("extrae correctamente desde un wrapper con kind y payload", () => {
      const wrapperCEF = {
        kind: "rollResults",
        payload: {
          rollId: "roll-wrapped-456",
          resultsGroups: [{ name: "Iniciativa", result: { value: 15 } }]
        }
      };

      const payload = extraerPayloadResultadosDados(wrapperCEF);
      expect(payload).not.toBeNull();
      expect(payload?.rollId).toBe("roll-wrapped-456");
      expect(payload?.resultsGroups).toHaveLength(1);
    });

    it("extrae correctamente desde una cadena JSON serializada", () => {
      const jsonString = JSON.stringify({
        rollId: "roll-json-789",
        resultsGroups: [{ name: "FUE", result: { value: 10 } }]
      });

      const payload = extraerPayloadResultadosDados(jsonString);
      expect(payload).not.toBeNull();
      expect(payload?.rollId).toBe("roll-json-789");
    });

    it("extrae correctamente desde un CustomEvent con propiedad detail", () => {
      const eventoDOM = {
        type: "manejarResultadosDados",
        detail: {
          rollId: "roll-dom-999",
          resultsGroups: [{ name: "DEX", result: { value: 20 } }]
        }
      };

      const payload = extraerPayloadResultadosDados(eventoDOM);
      expect(payload).not.toBeNull();
      expect(payload?.rollId).toBe("roll-dom-999");
    });

    it("retorna null ante valores vacíos, nulos o sin rollId/resultsGroups", () => {
      expect(extraerPayloadResultadosDados(null)).toBeNull();
      expect(extraerPayloadResultadosDados(undefined)).toBeNull();
      expect(extraerPayloadResultadosDados({})).toBeNull();
      expect(extraerPayloadResultadosDados("invalido")).toBeNull();
      expect(extraerPayloadResultadosDados({ rollId: "solo-id" })).toBeNull();
    });
  });

  describe("Tirada con Ventaja: Notificación y Anuncio en TaleSpire", () => {
    it("anuncia en TaleSpire el dado mayor cuando recibe el formato nativo directo de TaleSpire", async () => {
      usarAlmacenDM.setState({ tipoTirada: "ventaja" });

      const spyEstaDisponible = vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
      const spyDebugLog = vi.spyOn(ts.debug, "log").mockImplementation(() => {});

      let descriptorsEnviados: DescriptorTirada[] = [];
      let silenceChatEnviado = false;

      vi.spyOn(ts.dice, "putDiceInTray").mockImplementation(async (desc, silence) => {
        descriptorsEnviados = desc;
        silenceChatEnviado = silence ?? false;
        return "roll-ventaja-1";
      });

      vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async (f) => {
        return crearDescriptoresManualmente(f) as DescriptorTirada[];
      });

      // Lanzar tirada con ventaja
      await lanzarDadosTaleSpire("1d20+4", "Sigilo");

      expect(silenceChatEnviado).toBe(true);
      expect(descriptorsEnviados).toHaveLength(2);
      expect(descriptorsEnviados[0].name).toBe("Sigilo (Ventaja 1)");
      expect(descriptorsEnviados[1].name).toBe("Sigilo (Ventaja 2)");

      // Simular respuesta nativa directa de TaleSpire (sin kind ni payload intermedio)
      const mockResultGroups: GrupoResultadosTirada[] = [
        { name: "Sigilo (Ventaja 1)", result: { value: 7 } },
        { name: "Sigilo (Ventaja 2)", result: { value: 16 } }
      ];

      vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockImplementation(async (grupo: unknown) => {
        const g = grupo as { name?: string };
        if (g?.name === "Sigilo (Ventaja 1)") return 11; // 7 + 4
        if (g?.name === "Sigilo (Ventaja 2)") return 20; // 16 + 4
        return 0;
      });

      let gruposEnviadosAlChat: GrupoResultadosTirada[] | null = null;
      let rollIdEnviadoAlChat: string | null | undefined = null;

      vi.spyOn(ts.dice, "sendDiceResult").mockImplementation(async (grupos, rollId) => {
        gruposEnviadosAlChat = grupos as GrupoResultadosTirada[];
        rollIdEnviadoAlChat = rollId;
      });

      const eventoNativoTaleSpire = {
        rollId: "roll-ventaja-1",
        clientId: "ts-client-local",
        resultsGroups: mockResultGroups,
        gmOnly: false,
        quiet: false
      };

      const procesado = await procesarResultadosDadosTaleSpire(eventoNativoTaleSpire);

      expect(procesado).toBe(true);
      expect(rollIdEnviadoAlChat).toBe("roll-ventaja-1");
      expect(gruposEnviadosAlChat).toHaveLength(1);
      // Debe elegir el grupo B (20 > 11) y nombrarlo con (Ventaja)
      expect(gruposEnviadosAlChat![0].name).toBe("Sigilo (Ventaja)");

      // Verificar que NO se generen notificaciones toast redundantes cuando la tarjeta nativa se envió con éxito
      const notifs = usarAlmacenDM.getState().notificaciones;
      expect(notifs.length).toBe(0);

      spyEstaDisponible.mockRestore();
      spyDebugLog.mockRestore();
    });

    it("ejecuta fallback a ts.chat.send si ts.dice.sendDiceResult falla o arroja error", async () => {
      usarAlmacenDM.setState({ tipoTirada: "ventaja" });

      vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
      vi.spyOn(ts.debug, "log").mockImplementation(() => {});

      vi.spyOn(ts.dice, "putDiceInTray").mockResolvedValue("roll-fallback-chat");
      vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async (f) => {
        return crearDescriptoresManualmente(f) as DescriptorTirada[];
      });

      await lanzarDadosTaleSpire("1d20+3", "Ataque Espada");

      const mockResultGroups = [
        { name: "Ataque Espada (Ventaja 1)", result: { value: 14 } },
        { name: "Ataque Espada (Ventaja 2)", result: { value: 9 } }
      ];

      vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockImplementation(async (g: unknown) => {
        const grupo = g as { name?: string };
        return grupo?.name === "Ataque Espada (Ventaja 1)" ? 17 : 12;
      });

      // Simular falla en sendDiceResult
      vi.spyOn(ts.dice, "sendDiceResult").mockRejectedValue(new Error("sendDiceResult no soportado"));

      let mensajeChatEnviado = "";
      vi.spyOn(ts.chat, "send").mockImplementation(async (msg) => {
        mensajeChatEnviado = msg;
        return true;
      });

      const procesado = await procesarResultadosDadosTaleSpire({
        rollId: "roll-fallback-chat",
        resultsGroups: mockResultGroups
      });

      expect(procesado).toBe(true);
      // Debe haber avisado por chat con el resultado ganador
      expect(mensajeChatEnviado).toContain("Ataque Espada (Ventaja)");
      expect(mensajeChatEnviado).toContain("17");
    });
  });

  describe("Tirada con Desventaja: Notificación y Anuncio en TaleSpire", () => {
    it("anuncia en TaleSpire el dado menor cuando recibe el formato nativo directo", async () => {
      usarAlmacenDM.setState({ tipoTirada: "desventaja" });

      vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
      vi.spyOn(ts.debug, "log").mockImplementation(() => {});

      vi.spyOn(ts.dice, "putDiceInTray").mockResolvedValue("roll-desventaja-1");
      vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async (f) => {
        return crearDescriptoresManualmente(f) as DescriptorTirada[];
      });

      await lanzarDadosTaleSpire("1d20+2", "Salvacion de DES");

      const mockResultGroups = [
        { name: "Salvacion de DES (Desventaja 1)", result: { value: 18 } },
        { name: "Salvacion de DES (Desventaja 2)", result: { value: 5 } }
      ];

      vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockImplementation(async (g: unknown) => {
        const grupo = g as { name?: string };
        return grupo?.name === "Salvacion de DES (Desventaja 1)" ? 20 : 7;
      });

      let gruposEnviadosAlChat: GrupoResultadosTirada[] | null = null;
      vi.spyOn(ts.dice, "sendDiceResult").mockImplementation(async (grupos) => {
        gruposEnviadosAlChat = grupos as GrupoResultadosTirada[];
      });

      const procesado = await procesarResultadosDadosTaleSpire({
        rollId: "roll-desventaja-1",
        resultsGroups: mockResultGroups
      });

      expect(procesado).toBe(true);
      expect(gruposEnviadosAlChat).toHaveLength(1);
      // Debe elegir el menor (7 < 20) y nombrarlo con (Desventaja)
      expect(gruposEnviadosAlChat![0].name).toBe("Salvacion de DES (Desventaja)");
    });
  });
});
