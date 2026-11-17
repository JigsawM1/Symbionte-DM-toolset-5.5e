import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  abortarSolicitudPendiente,
  contarDadosGolpeEnVuelo,
  limpiarRegistrosTiradas,
  limpiarTiradasExpiradas,
  reclamarSolicitudPendiente,
  reclamarTiradaActiva,
  registrarSolicitudPendiente,
  registrarTiradaActiva,
  TTL_TIRADAS_EN_MEMORIA_MS
} from "./registroTiradasActivas";

describe("registroTiradasActivas (Ciclo de vida, TTL, AbortSignal y atomicidad)", () => {
  beforeEach(() => {
    limpiarRegistrosTiradas();
  });

  afterEach(() => {
    limpiarRegistrosTiradas();
  });

  it("registra y reclama de forma atómica una entrada combinada especial + efecto", () => {
    registrarTiradaActiva(
      "roll-1",
      {
        especial: {
          tipo: "ventaja",
          etiquetaOriginal: "Iniciativa",
          nombreGrupoOriginal: "Iniciativa",
          grupoAName: "Iniciativa (Ventaja 1)",
          grupoBName: "Iniciativa (Ventaja 2)"
        },
        efecto: {
          tipo: "iniciativa",
          criaturaId: "pj-1",
          nombrePersonaje: "Valeros"
        }
      },
      1000
    );

    const primeraLectura = reclamarTiradaActiva("roll-1");
    expect(primeraLectura?.creadoEn).toBe(1000);
    expect(primeraLectura?.especial?.creadoEn).toBe(1000);
    expect(primeraLectura?.efecto?.tipo).toBe("iniciativa");

    // La segunda reclamación debe devolver undefined para evitar doble aplicación
    expect(reclamarTiradaActiva("roll-1")).toBeUndefined();
  });

  it("cuenta correctamente los dados de golpe en vuelo por personaje", () => {
    registrarTiradaActiva("hd-1", { efecto: { tipo: "dadoGolpe", personajeId: "pj-1" } }, 100);
    registrarTiradaActiva("hd-2", { efecto: { tipo: "dadoGolpe", personajeId: "pj-1" } }, 200);
    registrarTiradaActiva("hd-3", { efecto: { tipo: "dadoGolpe", personajeId: "pj-2" } }, 300);
    registrarTiradaActiva("cur-1", { efecto: { tipo: "curacionRasgo", personajeId: "pj-1" } }, 400);

    expect(contarDadosGolpeEnVuelo("pj-1")).toBe(2);
    expect(contarDadosGolpeEnVuelo("pj-2")).toBe(1);

    reclamarTiradaActiva("hd-1");
    expect(contarDadosGolpeEnVuelo("pj-1")).toBe(1);
  });

  it("purga únicamente las tiradas y solicitudes expiradas por TTL y limpia listeners AbortSignal", () => {
    const controllerVencido = new AbortController();
    const controllerVigente = new AbortController();
    const removeVencido = vi.spyOn(controllerVencido.signal, "removeEventListener");
    const removeVigente = vi.spyOn(controllerVigente.signal, "removeEventListener");
    const rejectVencida = vi.fn();
    const rejectVigente = vi.fn();

    registrarTiradaActiva("tirada-vieja", { efecto: { tipo: "salvacionMuerte", personajeId: "p1" } }, 1000);
    registrarTiradaActiva("tirada-nueva", { efecto: { tipo: "salvacionMuerte", personajeId: "p2" } }, 500000);

    registrarSolicitudPendiente("sol-vieja", {
      resolve: vi.fn(),
      reject: rejectVencida,
      gruposNombres: ["G1"],
      creadoEn: 1000,
      signal: controllerVencido.signal,
      onAbort: () => {}
    });
    registrarSolicitudPendiente("sol-nueva", {
      resolve: vi.fn(),
      reject: rejectVigente,
      gruposNombres: ["G2"],
      creadoEn: 500000,
      signal: controllerVigente.signal,
      onAbort: () => {}
    });

    limpiarTiradasExpiradas(1000 + TTL_TIRADAS_EN_MEMORIA_MS + 1);

    expect(reclamarTiradaActiva("tirada-vieja")).toBeUndefined();
    expect(reclamarTiradaActiva("tirada-nueva")).toBeDefined();

    expect(rejectVencida).toHaveBeenCalledWith(expect.any(Error));
    expect(removeVencido).toHaveBeenCalledTimes(1);
    expect(rejectVigente).not.toHaveBeenCalled();
    expect(removeVigente).not.toHaveBeenCalled();
    expect(reclamarSolicitudPendiente("sol-nueva")).toBeDefined();
  });

  it("aborta solicitudes activas con AbortError y desvincula el listener", () => {
    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, "removeEventListener");
    const reject = vi.fn();
    const onAbort = () => abortarSolicitudPendiente("sol-abort");
    controller.signal.addEventListener("abort", onAbort, { once: true });

    registrarSolicitudPendiente("sol-abort", {
      resolve: vi.fn(),
      reject,
      gruposNombres: ["Caos"],
      creadoEn: Date.now(),
      signal: controller.signal,
      onAbort
    });

    controller.abort();

    expect(reject).toHaveBeenCalledTimes(1);
    expect(reject.mock.calls[0][0]).toMatchObject({ name: "AbortError" });
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(reclamarSolicitudPendiente("sol-abort")).toBeUndefined();
  });

  it("rechaza solicitudes activas cuando se invoca limpiarRegistrosTiradas", () => {
    const reject = vi.fn();
    registrarSolicitudPendiente("sol-reset", {
      resolve: vi.fn(),
      reject,
      gruposNombres: ["D100"],
      creadoEn: Date.now()
    });

    limpiarRegistrosTiradas();
    expect(reject).toHaveBeenCalledWith(new Error("Registro de tiradas reiniciado."));
  });
});
