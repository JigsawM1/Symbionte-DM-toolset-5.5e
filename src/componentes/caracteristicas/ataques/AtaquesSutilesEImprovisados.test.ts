import { describe, it, expect } from "vitest";
import { esCompetenteConArma, COMPETENCIAS_COMBATE_ESPECIALES } from "@/constantes/competenciasConstantes";

describe("Reglas de Combate D&D 5.5e: Armas Sutiles, Improvisadas y Golpe Desarmado", () => {

  describe("4. Validación de Competencias de Combate con esCompetenteConArma", () => {
    it("reconoce las competencias especiales de combate en singular, plural y variantes tolerantes", () => {
      expect(COMPETENCIAS_COMBATE_ESPECIALES).toContain("Ataque desarmado");
      expect(COMPETENCIAS_COMBATE_ESPECIALES).toContain("Armas improvisadas");

      const listaConDesarmado = ["Ataque desarmado", "Daga", "Espada corta"];
      const listaConImprovisadas = ["Armas improvisadas", "Espada larga"];

      // Ataque desarmado
      expect(esCompetenteConArma("Golpe sin Armas", "Sencilla", [], listaConDesarmado)).toBe(true);
      expect(esCompetenteConArma("Ataque Desarmado", "Sencilla", [], listaConDesarmado)).toBe(true);
      expect(esCompetenteConArma("Golpe sin Armas", "Sencilla", [], [])).toBe(false);

      // Armas improvisadas
      expect(esCompetenteConArma("Golpe con Arma Improvisada", "Improvisada", [], listaConImprovisadas)).toBe(true);
      expect(esCompetenteConArma("Arma Improvisada", "Improvisada", [], listaConImprovisadas)).toBe(true);
      expect(esCompetenteConArma("Arma Improvisada", "Improvisada", [], [])).toBe(false);
    });
  });
});
