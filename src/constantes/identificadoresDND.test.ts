import { describe, it, expect } from "vitest";
import {
  esLanzadorCarisma,
  esLanzadorSabiduria,
  esLanzadorInteligencia,
  resolverAtributoConjuroClase,
  esClasePacto,
  esClaseBarbaro,
  ID_CLASE
} from "./identificadoresDND";

describe("identificadoresDND — Conjuntos declarativos y predicados de clase", () => {
  describe("esLanzadorCarisma", () => {
    it("reconoce clases canónicas y variantes en español e inglés", () => {
      expect(esLanzadorCarisma("Bardo")).toBe(true);
      expect(esLanzadorCarisma("brujo")).toBe(true);
      expect(esLanzadorCarisma("Hechicero")).toBe(true);
      expect(esLanzadorCarisma("Paladín")).toBe(true);
      expect(esLanzadorCarisma("warlock")).toBe(true);
      expect(esLanzadorCarisma("sorcerer")).toBe(true);
      expect(esLanzadorCarisma("bard")).toBe(true);
      expect(esLanzadorCarisma("paladin")).toBe(true);
    });

    it("rechaza clases que no usan Carisma", () => {
      expect(esLanzadorCarisma("Clérigo")).toBe(false);
      expect(esLanzadorCarisma("Mago")).toBe(false);
      expect(esLanzadorCarisma("Guerrero")).toBe(false);
      expect(esLanzadorCarisma("")).toBe(false);
    });
  });

  describe("esLanzadorSabiduria", () => {
    it("reconoce clases canónicas y variantes en español e inglés", () => {
      expect(esLanzadorSabiduria("Clérigo")).toBe(true);
      expect(esLanzadorSabiduria("Druida")).toBe(true);
      expect(esLanzadorSabiduria("Explorador")).toBe(true);
      expect(esLanzadorSabiduria("cleric")).toBe(true);
      expect(esLanzadorSabiduria("druid")).toBe(true);
      expect(esLanzadorSabiduria("ranger")).toBe(true);
    });

    it("rechaza clases que no usan Sabiduría", () => {
      expect(esLanzadorSabiduria("Mago")).toBe(false);
      expect(esLanzadorSabiduria("Bardo")).toBe(false);
      expect(esLanzadorSabiduria("")).toBe(false);
    });
  });

  describe("esLanzadorInteligencia", () => {
    it("reconoce mago, wizard y artífice", () => {
      expect(esLanzadorInteligencia("Mago")).toBe(true);
      expect(esLanzadorInteligencia("wizard")).toBe(true);
      expect(esLanzadorInteligencia("Artífice")).toBe(true);
      expect(esLanzadorInteligencia("artificer")).toBe(true);
    });

    it("rechaza clases que no usan Inteligencia", () => {
      expect(esLanzadorInteligencia("Brujo")).toBe(false);
      expect(esLanzadorInteligencia("Druida")).toBe(false);
    });
  });

  describe("resolverAtributoConjuroClase", () => {
    it("resuelve la característica principal de forma declarativa", () => {
      expect(resolverAtributoConjuroClase("Bardo")).toBe("carisma");
      expect(resolverAtributoConjuroClase("Warlock")).toBe("carisma");
      expect(resolverAtributoConjuroClase("Clérigo")).toBe("sabiduria");
      expect(resolverAtributoConjuroClase("Druid")).toBe("sabiduria");
      expect(resolverAtributoConjuroClase("Mago")).toBe("inteligencia");
      expect(resolverAtributoConjuroClase("Guerrero")).toBeNull();
      expect(resolverAtributoConjuroClase("")).toBeNull();
    });
  });

  describe("esClasePacto", () => {
    it("reconoce Brujo y Warlock", () => {
      expect(esClasePacto("Brujo")).toBe(true);
      expect(esClasePacto("warlock")).toBe(true);
      expect(esClasePacto("Mago")).toBe(false);
      expect(esClasePacto("")).toBe(false);
    });
  });

  describe("esClaseBarbaro", () => {
    it("reconoce Bárbaro y Barbarian", () => {
      expect(esClaseBarbaro("Bárbaro")).toBe(true);
      expect(esClaseBarbaro(ID_CLASE.BARBARO)).toBe(true);
      expect(esClaseBarbaro("barbarian")).toBe(true);
      expect(esClaseBarbaro("Guerrero")).toBe(false);
      expect(esClaseBarbaro("")).toBe(false);
    });
  });
});
