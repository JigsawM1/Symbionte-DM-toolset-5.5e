import { describe, it, expect } from "vitest";
import { coincideHechizoId, deduplicarListaIds, crearMatcherHechizos } from "./comparadorHechizos";

describe("comparadorHechizos", () => {
  describe("coincideHechizoId", () => {
    it("debe emparejar IDs idénticos", () => {
      expect(coincideHechizoId("h_bendicion", "h_bendicion")).toBe(true);
      expect(coincideHechizoId("Curar heridas", "Curar heridas")).toBe(true);
    });

    it("debe tolerar diferencias de mayúsculas y espacios en blanco", () => {
      expect(coincideHechizoId("  BENDICION  ", "bendicion")).toBe(true);
      expect(coincideHechizoId("Proyectil Magico", "proyectil magico")).toBe(true);
    });

    it("debe tolerar diferencias de tildes y caracteres diacríticos", () => {
      expect(coincideHechizoId("Curación rápida", "Curacion rapida")).toBe(true);
      expect(coincideHechizoId("Bendición", "Bendicion")).toBe(true);
    });

    it("debe emparejar un slug prefijado con su nombre legible", () => {
      expect(coincideHechizoId("h_bendicion", "Bendición")).toBe(true);
      expect(coincideHechizoId("h_descarga-sobrenatural", "Descarga Sobrenatural")).toBe(true);
    });

    it("debe emparejar variantes con prefijos en guion medio y doble-prefijo histórico", () => {
      expect(coincideHechizoId("h-detectar-magia", "Detectar magia")).toBe(true);
      expect(coincideHechizoId("h-detectar-magia", "h_detectar-magia")).toBe(true);
      expect(coincideHechizoId("h_h-bendicion", "Bendición")).toBe(true);
    });

    it("debe reconocer sinónimos y variantes oficiales de traducción", () => {
      expect(coincideHechizoId("Susurros disonantes", "Susurros discordantes")).toBe(true);
      expect(coincideHechizoId("Risa espantosa de Tasha", "Risa horrible de Tasha")).toBe(true);
      expect(coincideHechizoId("Vínculo telepático de Rary", "Enlace telepático de Rary")).toBe(true);
    });

    it("debe devolver false para conjuros claramente distintos", () => {
      expect(coincideHechizoId("Bola de fuego", "Rayo de escarcha")).toBe(false);
      expect(coincideHechizoId("Escudo", "Armadura de mago")).toBe(false);
    });

    it("debe gestionar correctamente cadenas vacías, nulas o no definidas", () => {
      expect(coincideHechizoId("", "Bendición")).toBe(false);
      expect(coincideHechizoId("Bendición", "")).toBe(false);
      expect(coincideHechizoId("", "")).toBe(false);
    });

    it("debe mantener consistencia y rendimiento con múltiples consultas repetidas (cache hits)", () => {
      for (let i = 0; i < 50; i++) {
        expect(coincideHechizoId("h_bendicion", "Bendición")).toBe(true);
        expect(coincideHechizoId("Bola de fuego", "Rayo de escarcha")).toBe(false);
      }
    });

    it("debe soportar un gran volumen de IDs distintos sin desbordar el caché FIFO", () => {
      for (let i = 0; i < 2500; i++) {
        expect(coincideHechizoId(`h_hechizo_${i}`, `Hechizo ${i}`)).toBe(true);
      }
      // Re-verificar que un identificador canónico sigue funcionando tras la rotación
      expect(coincideHechizoId("h_bendicion", "Bendición")).toBe(true);
    });
  });

  describe("deduplicarListaIds", () => {
    it("debe eliminar duplicados fonéticos y por slug manteniendo el primer elemento", () => {
      const entrada = ["h_bendicion", "Bendición", "bendicion", "Escudo", "escudo"];
      const resultado = deduplicarListaIds(entrada);
      expect(resultado).toEqual(["h_bendicion", "Escudo"]);
    });

    it("debe preservar una lista sin duplicados", () => {
      const entrada = ["h_luz", "h_guia", "h_fuego"];
      const resultado = deduplicarListaIds(entrada);
      expect(resultado).toEqual(["h_luz", "h_guia", "h_fuego"]);
    });

    it("debe deduplicar listas con variantes de prefijo guion medio y guion bajo", () => {
      const entrada = ["h-detectar-magia", "h_detectar-magia", "Detectar magia"];
      const resultado = deduplicarListaIds(entrada);
      expect(resultado).toEqual(["h-detectar-magia"]);
    });
  });

  describe("crearMatcherHechizos", () => {
    it("debe devolver false para un array vacío o id nulo", () => {
      const matcherVacio = crearMatcherHechizos([]);
      expect(matcherVacio("Bendición")).toBe(false);
      expect(matcherVacio("")).toBe(false);
    });

    it("debe emparejar id exacto, slug, prefijos y mayúsculas/minúsculas", () => {
      const matcher = crearMatcherHechizos(["h_bendicion", "Escudo"]);
      expect(matcher("h_bendicion")).toBe(true);
      expect(matcher("Bendición")).toBe(true);
      expect(matcher("bendicion")).toBe(true);
      expect(matcher("escudo")).toBe(true);
      expect(matcher("ESCUDO")).toBe(true);
      expect(matcher(" Bola de fuego ")).toBe(false);
    });

    it("debe emparejar sinónimos y alias pre-expandidos", () => {
      const matcher = crearMatcherHechizos(["Susurros disonantes"]);
      expect(matcher("Susurros discordantes")).toBe(true);
      expect(matcher("dissonant whispers")).toBe(true);
    });
  });
});
