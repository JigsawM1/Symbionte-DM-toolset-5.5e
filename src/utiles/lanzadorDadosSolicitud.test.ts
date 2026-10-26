import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ts } from "./TaleSpireAdapter";
import { crearDescriptoresManualmente, limpiarRegistrosTiradas, procesarResultadosDadosTaleSpire, solicitarResultadoTirada } from "./lanzadorDados";
import type { DescriptorTirada } from "@/tipos/talespire";

describe("Solicitudes de dados: resultado nativo visible y evaluación única", () => {
  beforeEach(() => {
    limpiarRegistrosTiradas();
    vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async f => crearDescriptoresManualmente(f) as DescriptorTirada[]);
    vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockResolvedValue(32);
  });
  afterEach(() => { limpiarRegistrosTiradas(); vi.restoreAllMocks(); });

  it.each([undefined, false, true])("mostrarResultadoEnChat=%s conserva la etiqueta, el total y la política de chat", async mostrarResultadoEnChat => {
    const enviar = vi.spyOn(ts.dice, "putDiceInTray").mockResolvedValue("resplandor-real");
    const publicar = vi.spyOn(ts.dice, "sendDiceResult").mockResolvedValue(undefined);
    const solicitud = solicitarResultadoTirada({ etiqueta: "Resplandor del alba", mostrarResultadoEnChat,
      grupos: [{ nombre: "Daño radiante · Resplandor del alba", formula: "2d10+20" }] });
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledOnce());
    const grupo = { name: "Dano radiante  Resplandor del alba", result: { value: 32 } };
    expect(enviar).toHaveBeenCalledWith([{ name: grupo.name, roll: "2d10+20" }], mostrarResultadoEnChat !== true);
    expect(await procesarResultadosDadosTaleSpire({ rollId: "resplandor-real", resultsGroups: [grupo] })).toBe(false);
    expect(await solicitud).toEqual({ rollId: "resplandor-real", origen: "talespire", totales: [32] });
    await procesarResultadosDadosTaleSpire({ rollId: "resplandor-real", resultsGroups: [grupo] });
    expect(ts.dice.evaluateDiceResultsGroup).toHaveBeenCalledOnce();
    expect(publicar).not.toHaveBeenCalled();
  });
});
