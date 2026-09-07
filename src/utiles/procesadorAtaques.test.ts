import { describe, it, expect } from "vitest";
import {
  desglosarAtaqueRapido,
  construirFormulaAtaqueRapido,
  formatearDetalleAtaqueRapido
} from "./procesadorAtaques";

describe("procesadorAtaques", () => {
  describe("desglosarAtaqueRapido", () => {
    it("debe desglosar un daño simple", () => {
      const resultado = desglosarAtaqueRapido("1d6+3", "contundente");
      expect(resultado).toEqual([
        { dados: "1d6+3", tipo: "contundente" }
      ]);
    });

    it("debe desglosar múltiples daños separados por /", () => {
      const resultado = desglosarAtaqueRapido("1d6+3 / 1d4", "contundente / veneno");
      expect(resultado).toEqual([
        { dados: "1d6+3", tipo: "contundente" },
        { dados: "1d4", tipo: "veneno" }
      ]);
    });

    it("debe desglosar múltiples daños separados por comas en el tipo", () => {
      const resultado = desglosarAtaqueRapido("2d8+7 / 1d10", "cortante, fuego");
      expect(resultado).toEqual([
        { dados: "2d8+7", tipo: "cortante" },
        { dados: "1d10", tipo: "fuego" }
      ]);
    });

    it("debe desglosar dados compuestos con +", () => {
      const resultado = desglosarAtaqueRapido("2d8+7+1d10", "cortante / relámpago");
      expect(resultado).toEqual([
        { dados: "2d8+7", tipo: "cortante" },
        { dados: "1d10", tipo: "relámpago" }
      ]);
    });

    it("debe manejar tolerancias cuando hay más dados que tipos", () => {
      const resultado = desglosarAtaqueRapido("1d8+3 / 1d6 / 1d4", "cortante");
      expect(resultado).toEqual([
        { dados: "1d8+3", tipo: "cortante" },
        { dados: "1d6", tipo: "daño extra 2" },
        { dados: "1d4", tipo: "daño extra 3" }
      ]);
    });
  });

  describe("construirFormulaAtaqueRapido", () => {
    it("debe construir fórmula para ataque simple", () => {
      const formula = construirFormulaAtaqueRapido("Espada", "+5", "1d8+3", "cortante");
      expect(formula).toBe("!Ataque Espada:1d20+5/Dano Cortante:1d8+3");
    });

    it("debe construir fórmula con múltiples tipos de daño separados por /", () => {
      const formula = construirFormulaAtaqueRapido(
        "Bastón de Enredaderas",
        "+5",
        "1d6+3 / 1d4",
        "contundente / veneno"
      );
      expect(formula).toBe("!Ataque Baston de Enredaderas:1d20+5/Dano Contundente:1d6+3/Dano Veneno:1d4");
    });

    it("debe sanitizar acentos y eñes en las etiquetas", () => {
      const formula = construirFormulaAtaqueRapido(
        "Desgarrar Dragón",
        "+12",
        "2d8+7 / 1d10",
        "cortante / relámpago"
      );
      expect(formula).toBe("!Ataque Desgarrar Dragon:1d20+12/Dano Cortante:2d8+7/Dano Relampago:1d10");
    });

    it("debe manejar bonos negativos o sin signo", () => {
      const formula = construirFormulaAtaqueRapido("Dardo", "-1", "1d4-1", "perforante");
      expect(formula).toBe("!Ataque Dardo:1d20-1/Dano Perforante:1d4-1");
    });
  });

  describe("formatearDetalleAtaqueRapido", () => {
    it("debe generar un texto legible para múltiples daños", () => {
      const texto = formatearDetalleAtaqueRapido(
        "+5",
        "1d6+3 / 1d4",
        "contundente / veneno"
      );
      expect(texto).toBe("Tirar ataque: d20+5 | Daño: 1d6+3 (contundente) + 1d4 (veneno)");
    });
  });
});
