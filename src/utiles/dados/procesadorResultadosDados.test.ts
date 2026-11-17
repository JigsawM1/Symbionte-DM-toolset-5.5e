import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import { limpiarRegistrosTiradas, registrarTiradaActiva } from "./registroTiradasActivas";
import { procesarResultadosConDependencias } from "./procesadorResultadosDados";
import type { PuertoEfectosTiradaEstado } from "./tiposDados";

function crearPuertoMock(): PuertoEfectosTiradaEstado {
  return {
    obtenerModoTiradaGlobal: vi.fn(() => "plano"),
    restablecerModoTiradaGlobal: vi.fn(),
    puedeGastarDadoGolpe: vi.fn(() => true),
    aplicarCuracionDirectaRasgo: vi.fn(),
    aplicarResultadoHpTemporal: vi.fn(),
    aplicarResultadoSalvacionMuerte: vi.fn(),
    aplicarResultadoIniciativa: vi.fn(),
    gastarDadoGolpeYNotificar: vi.fn()
  };
}

describe("procesadorResultadosDados (Strategy de resolución sin dependencia de Zustand)", () => {
  beforeEach(() => {
    limpiarRegistrosTiradas();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    limpiarRegistrosTiradas();
  });

  it("despacha correctamente todas las estrategias directas mediante PuertoEfectosTiradaEstado", async () => {
    const puerto = crearPuertoMock();
    vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockResolvedValueOnce(17);
    registrarTiradaActiva("r-inic", {
      efecto: { tipo: "iniciativa", criaturaId: "c1", nombrePersonaje: "Goblin" }
    });
    expect(
      await procesarResultadosConDependencias(
        { rollId: "r-inic", resultsGroups: [{ name: "Iniciativa", result: { value: 17 } }] },
        puerto
      )
    ).toBe(false);
    expect(puerto.aplicarResultadoIniciativa).toHaveBeenCalledWith(
      expect.objectContaining({ criaturaId: "c1" }),
      17
    );

    vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockResolvedValueOnce(20);
    registrarTiradaActiva("r-muerte", { efecto: { tipo: "salvacionMuerte", personajeId: "pj-1" } });
    await procesarResultadosConDependencias(
      { rollId: "r-muerte", resultsGroups: [{ name: "Muerte", result: { value: 20 } }] },
      puerto
    );
    expect(puerto.aplicarResultadoSalvacionMuerte).toHaveBeenCalledWith("pj-1", 20);

    vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockResolvedValueOnce(6);
    registrarTiradaActiva("r-hptemp", {
      efecto: { tipo: "hpTemporalRasgo", personajeId: "pj-1", multiplicador: 2 }
    });
    await procesarResultadosConDependencias(
      { rollId: "r-hptemp", resultsGroups: [{ name: "Manto", result: { value: 6 } }] },
      puerto
    );
    expect(puerto.aplicarResultadoHpTemporal).toHaveBeenCalledWith("pj-1", 12);

    vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockResolvedValueOnce(7);
    registrarTiradaActiva("r-hd", { efecto: { tipo: "dadoGolpe", personajeId: "pj-1" } });
    await procesarResultadosConDependencias(
      { rollId: "r-hd", resultsGroups: [{ name: "Dado Golpe", result: { value: 7 } }] },
      puerto
    );
    expect(puerto.gastarDadoGolpeYNotificar).toHaveBeenCalledWith("pj-1", 7);
  });

  it("reintenta sendDiceResult sin rollId si el primer envío falla y aplica salvación de muerte con ventaja", async () => {
    const puerto = crearPuertoMock();
    registrarTiradaActiva("r-esp-muerte", {
      especial: {
        tipo: "ventaja",
        etiquetaOriginal: "Salvación Muerte",
        nombreGrupoOriginal: "Salvacion Muerte",
        grupoAName: "Salvacion Muerte (Ventaja 1)",
        grupoBName: "Salvacion Muerte (Ventaja 2)"
      },
      efecto: { tipo: "salvacionMuerte", personajeId: "pj-9" }
    });

    vi.spyOn(ts.dice, "evaluateDiceResultsGroup")
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(18);
    const sendSpy = vi
      .spyOn(ts.dice, "sendDiceResult")
      .mockRejectedValueOnce(new Error("rollId inválido"))
      .mockResolvedValueOnce(undefined);

    const resultado = await procesarResultadosConDependencias(
      {
        rollId: "r-esp-muerte",
        resultsGroups: [
          { name: "Salvacion Muerte (Ventaja 1)", result: { value: 4 } },
          { name: "Salvacion Muerte (Ventaja 2)", result: { value: 18 } }
        ]
      },
      puerto
    );

    expect(resultado).toBe(true);
    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy.mock.calls[1]).toHaveLength(1);
    expect(puerto.aplicarResultadoSalvacionMuerte).toHaveBeenCalledWith("pj-9", 18);
  });

  it("envía grupos al chat si faltan grupo A o B para no silenciar la tirada", async () => {
    const puerto = crearPuertoMock();
    registrarTiradaActiva("r-incompleto", {
      especial: {
        tipo: "ventaja",
        etiquetaOriginal: "Percepción",
        nombreGrupoOriginal: "Percepcion",
        grupoAName: "Percepcion (Ventaja 1)",
        grupoBName: "Percepcion (Ventaja 2)"
      }
    });

    const sendSpy = vi.spyOn(ts.dice, "sendDiceResult").mockResolvedValueOnce(undefined);
    const grupos = [{ name: "Otro grupo", result: { value: 11 } }];

    const res = await procesarResultadosConDependencias(
      { rollId: "r-incompleto", resultsGroups: grupos },
      puerto
    );

    expect(res).toBe(false);
    expect(sendSpy).toHaveBeenCalledWith(grupos, "r-incompleto");
  });

  it("registra con logger.error si falla evaluateDiceResultsGroup en un efecto directo sin lanzar excepción", async () => {
    const puerto = crearPuertoMock();
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockRejectedValueOnce(new Error("Fallo SDK TS"));

    registrarTiradaActiva("r-error", {
      efecto: { tipo: "curacionRasgo", personajeId: "pj-1", nombreRasgo: "Segundo aliento" }
    });

    const res = await procesarResultadosConDependencias(
      { rollId: "r-error", resultsGroups: [{ name: "Segundo aliento", result: { value: 5 } }] },
      puerto
    );

    expect(res).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    expect(puerto.aplicarCuracionDirectaRasgo).not.toHaveBeenCalled();
  });
});
