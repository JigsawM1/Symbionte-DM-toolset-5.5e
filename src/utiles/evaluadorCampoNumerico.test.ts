import { describe, expect, it } from "vitest";
import { evaluarCampoNumerico } from "./evaluadorCampoNumerico";

describe("evaluador común de campos numéricos", () => {
  it.each([
    ["25", 25], ["=25", 25], ["+5", 25], ["-5", 15], ["=-3", -3],
    ["20+5*2", 30], ["(20+10)/2", 15], ["+10+5", 35], ["-10+5", 15],
    ["=-(2+3)", -5], ["2*-3", -6], [" 1 + 2 * (3 + 4) ", 15],
    ["0", 0], ["2,5", 3], ["5/2", 3], [".5*4", 2], ["=-0", 0], ["1e3", 1000]
  ])("resuelve %s completamente", (texto, valor) => {
    expect(evaluarCampoNumerico(texto, 20)).toMatchObject({ estado: "valido", valor });
  });
  it.each(["12abc", "2**3", "1/0", "0/0", "1d6", "nivel+2", "max(1,2)", "2 3", "1.2.3", "1,234.56", "()", "=", "+", "(1+2", "1)", "Infinity", "NaN", "1e309"]) (
    "rechaza %s sin aceptar un prefijo numérico", texto => {
      expect(evaluarCampoNumerico(texto, 20).estado).toBe("invalido");
    }
  );
  it("distingue vacío, asignación e incremento", () => {
    expect(evaluarCampoNumerico("  ", 20)).toEqual({ estado: "vacio" });
    expect(evaluarCampoNumerico("-3", 20)).toMatchObject({ operacion: "incremento", valor: 17 });
    expect(evaluarCampoNumerico("=-3", 20)).toMatchObject({ operacion: "asignacion", valor: -3 });
  });
  it("conserva decimales y aplica límites después del cálculo", () => {
    expect(evaluarCampoNumerico("1,5/2", 0, { tipo: "decimal" })).toMatchObject({ valor: 0.75 });
    expect(evaluarCampoNumerico("-30", 20, { min: 0 })).toMatchObject({ valor: 0 });
    expect(evaluarCampoNumerico("+30", 20, { max: 30 })).toMatchObject({ valor: 30 });
    expect(evaluarCampoNumerico("20/3", 0, { tipo: "decimal" })).toMatchObject({ valor: 20 / 3 });
    expect(evaluarCampoNumerico("=1e-7", 0, { tipo: "decimal" })).toMatchObject({ valor: 0.0000001 });
  });
  it("rechaza desbordamiento y anidamiento excesivo", () => {
    expect(evaluarCampoNumerico("9".repeat(400), 0).estado).toBe("invalido");
    expect(evaluarCampoNumerico("(".repeat(70) + "1" + ")".repeat(70), 0).estado).toBe("invalido");
  });
});
