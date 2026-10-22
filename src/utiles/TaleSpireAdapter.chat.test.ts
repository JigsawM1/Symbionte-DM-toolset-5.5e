import { afterEach, describe, expect, it, vi } from "vitest";
import { ts } from "./TaleSpireAdapter";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Contrato nativo de chat sin valor de retorno", () => {
  it("confirma el envío cuando la promesa nativa se resuelve sin devolver true", async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("TS", { chat: { send: enviar } });
    expect(await ts.chat.send("Oleada de prueba")).toBe(true);
    expect(enviar).toHaveBeenCalledOnce();
    expect(enviar).toHaveBeenCalledWith("Oleada de prueba", "board");
  });

  it("espera a la respuesta nativa y conserva el rechazo si falla", async () => {
    const error = new Error("invalidTarget");
    const enviar = vi.fn().mockRejectedValue(error);
    vi.stubGlobal("TS", { chat: { send: enviar } });
    await expect(ts.chat.send("Oleada de prueba")).rejects.toBe(error);
    expect(enviar).toHaveBeenCalledOnce();
  });

  it("no confirma un envío si la API de chat no está disponible", async () => {
    vi.stubGlobal("TS", {});
    expect(await ts.chat.send("Oleada de prueba")).toBe(false);
  });

  it("normaliza también las variantes nativas de envío y su alternativa a board", async () => {
    const nativo = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("TS", { chat: { send: nativo, multiSend: nativo, sendAsCreature: nativo, multiSendAsCreature: nativo } });
    expect(await ts.chat.multiSend("Prueba", ["jugador"])).toBe(true);
    expect(await ts.chat.sendAsCreature("mini", "Prueba")).toBe(true);
    expect(await ts.chat.multiSendAsCreature("mini", "Prueba", ["jugador"])).toBe(true);
    vi.stubGlobal("TS", { chat: { send: nativo } });
    expect(await ts.chat.multiSend("Prueba", ["jugador"])).toBe(true);
    expect(nativo).toHaveBeenLastCalledWith("Prueba", "board");
  });
});
