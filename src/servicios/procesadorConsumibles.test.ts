import { describe, it, expect } from "vitest";
import { detectarInfoConsumible, evaluarFormulaDados } from "./procesadorConsumibles";

describe("procesadorConsumibles - D&D 5.5e (2024)", () => {
  it("detecta poción de curación estándar como Acción Adicional y 2d4+2", () => {
    const info = detectarInfoConsumible("Poción de Curación", "Recuperas 2d4+2 puntos de golpe");
    expect(info.esPocion).toBe(true);
    expect(info.esAccionAdicional).toBe(true);
    expect(info.esCurativo).toBe(true);
    expect(info.formulaCuracion).toBe("2d4+2");
  });

  it("detecta poción de curación mayor como 4d4+4", () => {
    const info = detectarInfoConsumible("Poción de Curación Mayor");
    expect(info.esPocion).toBe(true);
    expect(info.esCurativo).toBe(true);
    expect(info.formulaCuracion).toBe("4d4+4");
  });

  it("detecta poción de curación superior como 8d4+8", () => {
    const info = detectarInfoConsumible("Poción de Curación Superior");
    expect(info.formulaCuracion).toBe("8d4+8");
  });

  it("detecta poción de curación suprema como 10d4+20", () => {
    const info = detectarInfoConsumible("Poción de Curación Suprema");
    expect(info.formulaCuracion).toBe("10d4+20");
  });

  it("detecta consumibles no curativos como Antídoto", () => {
    const info = detectarInfoConsumible("Antídoto", "Cura el envenenamiento al beberlo.");
    expect(info.esCurativo).toBe(false);
    expect(info.formulaCuracion).toBeUndefined();
  });

  it("evaluarFormulaDados calcula un rango válido", () => {
    for (let i = 0; i < 20; i++) {
      const val = evaluarFormulaDados("2d4+2");
      expect(val).toBeGreaterThanOrEqual(4); // min 2*1 + 2 = 4
      expect(val).toBeLessThanOrEqual(10);   // max 2*4 + 2 = 10
    }
  });
});
