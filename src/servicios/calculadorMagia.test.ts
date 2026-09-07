import { describe, it, expect } from "vitest";
import {
  calcularNivelLanzadorMulticlase,
  calcularEspaciosConjuro,
  calcularPuntosConjuro,
  calcularCDConjuros,
  calcularBonoAtaqueConjuro,
  calcularEspaciosPacto,
  obtenerCostePuntos,
  detectarTipoLanzador,
  calcularMaximosConjurosYTrucos
} from "./calculadorMagia";
import type { ClaseLanzadora } from "@/tipos";

describe("calculadorMagia - Reglas de Magia D&D 2024", () => {
  describe("calcularNivelLanzadorMulticlase", () => {
    it("debe calcular correctamente un lanzador completo mono-clase (Mago 5)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];
      expect(calcularNivelLanzadorMulticlase(clases)).toBe(5);
    });

    it("debe calcular correctamente un medio-lanzador mono-clase (Paladín 1 y Paladín 5)", () => {
      const paladin1: ClaseLanzadora[] = [
        { clase: "Paladín", nivel: 1, tipoLanzador: "medio", habilidadConjuro: "carisma", modeloConjuros: "preparados" }
      ];
      expect(calcularNivelLanzadorMulticlase(paladin1)).toBe(1);

      const paladin5: ClaseLanzadora[] = [
        { clase: "Paladín", nivel: 5, tipoLanzador: "medio", habilidadConjuro: "carisma", modeloConjuros: "preparados" }
      ];
      expect(calcularNivelLanzadorMulticlase(paladin5)).toBe(3);
    });

    it("debe calcular correctamente un tercio-lanzador mono-clase (Caballero Arcano 6)", () => {
      const caballero6: ClaseLanzadora[] = [
        { clase: "Guerrero", nivel: 6, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos" }
      ];
      expect(calcularNivelLanzadorMulticlase(caballero6)).toBe(2);
    });

    it("debe combinar correctamente multiclase mixta (Mago 4 + Caballero Arcano 6)", () => {
      const multiclase: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 4, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" },
        { clase: "Guerrero", nivel: 6, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos" }
      ];
      // Mago 4 + floor(6/3)=2 => Nivel lanzador 6
      expect(calcularNivelLanzadorMulticlase(multiclase)).toBe(6);
    });

    it("no debe sumar niveles de Magia de Pacto al nivel combinado", () => {
      const multiclaseBrujo: ClaseLanzadora[] = [
        { clase: "Clérigo", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" },
        { clase: "Brujo", nivel: 5, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      expect(calcularNivelLanzadorMulticlase(multiclaseBrujo)).toBe(3);
    });

    it("debe retornar 0 para listas vacías o clases no lanzadoras", () => {
      expect(calcularNivelLanzadorMulticlase([])).toBe(0);
      const noLanzador: ClaseLanzadora[] = [
        { clase: "Bárbaro", nivel: 5, tipoLanzador: "ninguno", habilidadConjuro: null, modeloConjuros: "ninguno" }
      ];
      expect(calcularNivelLanzadorMulticlase(noLanzador)).toBe(0);
    });
  });

  describe("calcularEspaciosConjuro", () => {
    it("debe devolver espacios correctos para lanzador nivel 1", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Clérigo", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" }
      ];
      const espacios = calcularEspaciosConjuro(clases);
      expect(espacios).toEqual({ "1": 2 });
    });

    it("debe devolver espacios correctos para lanzador nivel 5 (4 de nv1, 3 de nv2, 2 de nv3)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];
      const espacios = calcularEspaciosConjuro(clases);
      expect(espacios).toEqual({ "1": 4, "2": 3, "3": 2 });
    });

    it("debe respetar overrides manuales definidos por el usuario", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];
      const overrides = { "1": 5, "3": 0 }; // 5 de nivel 1, y quita los de nivel 3
      const espacios = calcularEspaciosConjuro(clases, overrides);
      expect(espacios).toEqual({ "1": 5, "2": 3 });
    });
  });

  describe("calcularPuntosConjuro", () => {
    it("debe calcular puntos y nivel máximo para lanzador nivel 5 (27 pts, max nv3)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Hechicero", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      const resultado = calcularPuntosConjuro(clases);
      expect(resultado).toEqual({ puntosMaximos: 27, nivelMaximo: 3 });
    });

    it("debe permitir override de puntos totales", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Hechicero", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      const resultado = calcularPuntosConjuro(clases, 40);
      expect(resultado).toEqual({ puntosMaximos: 40, nivelMaximo: 3 });
    });
  });

  describe("calcularCDConjuros y calcularBonoAtaqueConjuro", () => {
    it("debe calcular CD de salvación (8 + PB + Mod)", () => {
      // PB +3, Mod +4 => 8 + 3 + 4 = 15
      expect(calcularCDConjuros(3, 4)).toBe(15);
      // PB +2, Mod -1 => 8 + 2 - 1 = 9
      expect(calcularCDConjuros(2, -1)).toBe(9);
    });

    it("debe calcular bono de ataque con conjuros (PB + Mod)", () => {
      // PB +3, Mod +4 => 3 + 4 = 7
      expect(calcularBonoAtaqueConjuro(3, 4)).toBe(7);
      // PB +2, Mod 0 => 2 + 0 = 2
      expect(calcularBonoAtaqueConjuro(2, 0)).toBe(2);
    });
  });

  describe("calcularEspaciosPacto", () => {
    it("debe calcular espacios de pacto del Brujo en niveles 1, 5, 11 y 17", () => {
      expect(calcularEspaciosPacto(1)).toEqual({ espacios: 1, nivel: 1 });
      expect(calcularEspaciosPacto(5)).toEqual({ espacios: 2, nivel: 3 });
      expect(calcularEspaciosPacto(11)).toEqual({ espacios: 3, nivel: 5 });
      expect(calcularEspaciosPacto(17)).toEqual({ espacios: 4, nivel: 5 });
    });
  });

  describe("obtenerCostePuntos", () => {
    it("debe devolver el coste en puntos según la tabla DMG", () => {
      expect(obtenerCostePuntos(1)).toBe(2);
      expect(obtenerCostePuntos(2)).toBe(3);
      expect(obtenerCostePuntos(3)).toBe(5);
      expect(obtenerCostePuntos(5)).toBe(7);
      expect(obtenerCostePuntos(9)).toBe(13);
      expect(obtenerCostePuntos(0)).toBe(0);
    });
  });

  describe("detectarTipoLanzador", () => {
    it("debe detectar clases estándar", () => {
      const mago = detectarTipoLanzador("Mago");
      expect(mago).toEqual({ tipo: "completo", habilidad: "inteligencia", modelo: "grimorio" });

      const clerigo = detectarTipoLanzador("Clérigo");
      expect(clerigo).toEqual({ tipo: "completo", habilidad: "sabiduria", modelo: "preparados" });

      const brujo = detectarTipoLanzador("Brujo");
      expect(brujo).toEqual({ tipo: "pacto", habilidad: "carisma", modelo: "conocidos" });
    });

    it("debe detectar subclases tercio-lanzadoras", () => {
      const caballero = detectarTipoLanzador("Guerrero", "Caballero Arcano");
      expect(caballero).toEqual({ tipo: "tercio", habilidad: "inteligencia", modelo: "conocidos" });

      const embaucador = detectarTipoLanzador("Pícaro", "Embaucador Arcano");
      expect(embaucador).toEqual({ tipo: "tercio", habilidad: "inteligencia", modelo: "conocidos" });
    });

    it("debe retornar null para clases no lanzadoras", () => {
      expect(detectarTipoLanzador("Bárbaro")).toBeNull();
      expect(detectarTipoLanzador("Monje")).toBeNull();
    });
  });

  describe("calcularMaximosConjurosYTrucos", () => {
    it("debe calcular máximos oficiales para Mago nivel 1 (3 trucos, 4 preparados)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];
      const maximos = calcularMaximosConjurosYTrucos(clases, 1, 3);
      expect(maximos).toEqual({
        maxTrucos: 3,
        maxConjuros: 4,
        modelo: "conocidos" // o preparados según la clase
      });
    });

    it("debe calcular máximos oficiales para Brujo nivel 5 (3 trucos, 6 conocidos)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Brujo", nivel: 5, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      const maximos = calcularMaximosConjurosYTrucos(clases, 5, 4);
      expect(maximos).toEqual({
        maxTrucos: 3,
        maxConjuros: 6,
        modelo: "conocidos"
      });
    });

    it("debe calcular máximos oficiales para Clérigo nivel 5 (4 trucos, 9 preparados)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Clérigo", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" }
      ];
      const maximos = calcularMaximosConjurosYTrucos(clases, 5, 3);
      expect(maximos).toEqual({
        maxTrucos: 4,
        maxConjuros: 9,
        modelo: "preparados"
      });
    });

    it("debe sumar correctamente para multiclase (Mago 3 + Brujo 2)", () => {
      const multiclase: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" },
        { clase: "Brujo", nivel: 2, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      // Mago 3: 3 trucos, 6 preparados. Brujo 2: 2 trucos, 3 conocidos.
      // Total: 5 trucos, 9 conjuros
      const maximos = calcularMaximosConjurosYTrucos(multiclase, 5, 3);
      expect(maximos.maxTrucos).toBe(5);
      expect(maximos.maxConjuros).toBe(9);
    });

    it("debe retornar 0 para listas vacías", () => {
      expect(calcularMaximosConjurosYTrucos([])).toEqual({
        maxTrucos: 0,
        maxConjuros: 0,
        modelo: "preparados"
      });
    });
  });
});

