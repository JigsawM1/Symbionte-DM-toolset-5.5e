import { beforeEach, describe, expect, it, vi } from "vitest";
import { ts } from "./TaleSpireAdapter";
import { lanzarDadosTaleSpire, procesarResultadosDadosTaleSpire, crearDescriptoresManualmente, limpiarRegistrosTiradas } from "./lanzadorDados";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { DescriptorTirada } from "@/tipos/talespire";

describe("Dado adicional único en pruebas e iniciativa", () => {
  beforeEach(() => {
    vi.restoreAllMocks(); limpiarRegistrosTiradas();
    usarAlmacenDM.setState({ tipoTirada: "plano", colaIniciativa: [], personajes: [
      { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "dados_extra", nombre: "Prueba", rasgos: [] }
    ] });
  });
  it.each(["ventaja", "desventaja"] as const)("%s compara solo los d20 y suma el dado adicional una vez", async modo => {
    vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    vi.spyOn(ts.debug, "log").mockImplementation(() => {});
    vi.spyOn(ts.dice, "isValidRollString").mockReturnValue(true);
    vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async f => crearDescriptoresManualmente(f) as DescriptorTirada[]);
    const poner = vi.spyOn(ts.dice, "putDiceInTray").mockResolvedValue("dados-adicionales");
    vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockImplementation(async g => (g as { result: { value: number } }).result.value);
    const enviar = vi.spyOn(ts.dice, "sendDiceResult").mockResolvedValue();
    expect(await lanzarDadosTaleSpire("1d20+3+1d8", "Iniciativa", {
      tipo: "iniciativa", criaturaId: "dados_extra", idPersonaje: "dados_extra", nombrePersonaje: "Prueba"
    }, undefined, modo)).toBe(true);
    const grupos = poner.mock.calls[0][0];
    expect(grupos).toHaveLength(3);
    expect(grupos.map(g => g.roll)).toEqual(["1d20+3", "1d20+3", "1d8"]);
    await procesarResultadosDadosTaleSpire({ rollId: "dados-adicionales", resultsGroups: grupos.map((g, i) => ({
      name: g.name, result: { value: [8, 18, 4][i] }
    })) });
    expect(usarAlmacenDM.getState().colaIniciativa[0].iniciativa).toBe(modo === "ventaja" ? 22 : 12);
    expect(enviar.mock.calls[0][0]).toHaveLength(2);
    expect(enviar.mock.calls[0][0][1]).toMatchObject({ name: "Iniciativa (Dados adicionales)", result: { value: 4 } });
  });
  it.each(["plano", "ventaja", "desventaja"] as const)("la simulación de iniciativa %s incluye el dado extra", async modo => {
    vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(false);
    vi.spyOn(Math, "random").mockReturnValue(0);
    await lanzarDadosTaleSpire("1d20+3+1d8", "Iniciativa", {
      tipo: "iniciativa", criaturaId: "dados_extra", idPersonaje: "dados_extra", nombrePersonaje: "Prueba"
    }, undefined, modo);
    expect(usarAlmacenDM.getState().colaIniciativa[0].iniciativa).toBe(5);
  });
  it("no confirma una emisión cuando tanto la bandeja como el chat la rechazan", async () => {
    vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    vi.spyOn(ts.dice, "isValidRollString").mockReturnValue(true);
    vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async f => crearDescriptoresManualmente(f) as DescriptorTirada[]);
    vi.spyOn(ts.dice, "putDiceInTray").mockResolvedValue("");
    vi.spyOn(ts.chat, "send").mockResolvedValue(false);
    expect(await lanzarDadosTaleSpire("1d8+3", "Daño")).toBe(false);
  });
});
