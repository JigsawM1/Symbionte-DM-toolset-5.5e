import { describe, it, expect } from "vitest";
import {
  aplicarCondicion,
  quitarCondicion,
  reducirNivelCansancio,
  NIVEL_MAXIMO_CANSANCIO,
  EstrategiaCansancio,
  EstrategiaCondicionSimple,
  evaluarEfectosCondicionesEnTirada
} from "./procesadorCondiciones";

describe("procesadorCondiciones — Strategy Pattern", () => {
  describe("EstrategiaCondicionSimple", () => {
    it("debe agregar una condición simple nueva", () => {
      const iniciales: string[] = ["Envenenado"];
      const resultado = aplicarCondicion(iniciales, "Cegado");
      expect(resultado).toEqual(["Envenenado", "Cegado"]);
    });

    it("no debe duplicar una condición simple existente (idempotencia)", () => {
      const iniciales: string[] = ["Envenenado", "Cegado"];
      const resultado = aplicarCondicion(iniciales, "Cegado");
      expect(resultado).toEqual(["Envenenado", "Cegado"]);
    });

    it("debe ignorar condiciones vacías o compuestas solo de espacios", () => {
      const iniciales: string[] = ["Envenenado"];
      const resultado = aplicarCondicion(iniciales, "   ");
      expect(resultado).toEqual(["Envenenado"]);
    });
  });

  describe("EstrategiaCansancio (D&D 5.5e Exhaustion)", () => {
    it("debe inicializar Cansado en Nivel 1 si no existía", () => {
      const iniciales: string[] = ["Paralizado"];
      const resultado = aplicarCondicion(iniciales, "Cansado");
      expect(resultado).toEqual(["Paralizado", "Cansado (Niv. 1)"]);
    });

    it("debe reconocer la variante 'exhausted'", () => {
      const iniciales: string[] = [];
      const resultado = aplicarCondicion(iniciales, "exhausted");
      expect(resultado).toEqual(["Cansado (Niv. 1)"]);
    });

    it("debe incrementar progresivamente el nivel de Cansado", () => {
      let condiciones: string[] = [];
      for (let i = 1; i <= NIVEL_MAXIMO_CANSANCIO; i++) {
        condiciones = aplicarCondicion(condiciones, "Cansado");
        expect(condiciones).toEqual([`Cansado (Niv. ${i})`]);
      }
    });

    it("no debe superar el nivel máximo de Cansado (Nivel 6)", () => {
      const iniciales = ["Cansado (Niv. 6)"];
      const resultado = aplicarCondicion(iniciales, "Cansado");
      expect(resultado).toEqual(["Cansado (Niv. 6)"]);
    });

    it("debe respetar otras condiciones al apilar Cansado", () => {
      const iniciales = ["Aturdido", "Cansado (Niv. 2)", "Invisible"];
      const resultado = aplicarCondicion(iniciales, "cansado");
      expect(resultado).toEqual(["Aturdido", "Invisible", "Cansado (Niv. 3)"]);
    });
  });

  describe("quitarCondicion", () => {
    it("debe eliminar una condición simple correctamente", () => {
      const iniciales = ["Cegado", "Envenenado", "Paralizado"];
      const resultado = quitarCondicion(iniciales, "Envenenado");
      expect(resultado).toEqual(["Cegado", "Paralizado"]);
    });

    it("debe eliminar Cansado por su nombre exacto con nivel", () => {
      const iniciales = ["Cegado", "Cansado (Niv. 3)"];
      const resultado = quitarCondicion(iniciales, "Cansado (Niv. 3)");
      expect(resultado).toEqual(["Cegado"]);
    });
  });

  describe("reducirNivelCansancio", () => {
    it("debe decrementar en 1 el nivel de cansancio si es mayor a 1", () => {
      const iniciales = ["Cansado (Niv. 4)", "Cegado"];
      const resultado = reducirNivelCansancio(iniciales);
      expect(resultado).toEqual(["Cegado", "Cansado (Niv. 3)"]);
    });

    it("debe eliminar completamente Cansado si está en nivel 1", () => {
      const iniciales = ["Cansado (Niv. 1)", "Cegado"];
      const resultado = reducirNivelCansancio(iniciales);
      expect(resultado).toEqual(["Cegado"]);
    });

    it("no debe alterar la lista si no hay cansancio", () => {
      const iniciales = ["Cegado", "Paralizado"];
      const resultado = reducirNivelCansancio(iniciales);
      expect(resultado).toEqual(["Cegado", "Paralizado"]);
    });
  });

  describe("evaluarEfectosCondicionesEnTirada", () => {
    it("debe imponer desventaja en pruebas de FUE/DES por armadura sin competencia", () => {
      const resFue = evaluarEfectosCondicionesEnTirada({
        tipo: "caracteristica",
        caracteristica: "fuerza",
        penalizacionArmadura: true
      });
      expect(resFue.tieneDesventaja).toBe(true);
      expect(resFue.modoEfectivo).toBe("desventaja");

      const resSab = evaluarEfectosCondicionesEnTirada({
        tipo: "caracteristica",
        caracteristica: "sabiduria",
        penalizacionArmadura: true
      });
      expect(resSab.tieneDesventaja).toBe(false);
      expect(resSab.modoEfectivo).toBe("plano");
    });

    it("debe imponer desventaja en Sigilo si la armadura es ruidosa", () => {
      const resSigilo = evaluarEfectosCondicionesEnTirada({
        tipo: "caracteristica",
        habilidad: "sigilo",
        desventajaSigiloArmadura: true
      });
      expect(resSigilo.tieneDesventaja).toBe(true);
      expect(resSigilo.modoEfectivo).toBe("desventaja");

      const resAtletismo = evaluarEfectosCondicionesEnTirada({
        tipo: "caracteristica",
        habilidad: "atletismo",
        desventajaSigiloArmadura: true
      });
      expect(resAtletismo.tieneDesventaja).toBe(false);
    });

    it("debe imponer desventaja en ataques y pruebas si está Envenenado", () => {
      const resAtaque = evaluarEfectosCondicionesEnTirada({
        tipo: "ataque",
        condicionesActivas: ["Envenenado"]
      });
      expect(resAtaque.tieneDesventaja).toBe(true);
      expect(resAtaque.modoEfectivo).toBe("desventaja");

      const resPrueba = evaluarEfectosCondicionesEnTirada({
        tipo: "caracteristica",
        caracteristica: "inteligencia",
        condicionesActivas: ["Envenenado"]
      });
      expect(resPrueba.tieneDesventaja).toBe(true);
    });

    it("debe calcular el penalizador de cansancio de D&D 2024 (-2 * nivel)", () => {
      const res = evaluarEfectosCondicionesEnTirada({
        tipo: "ataque",
        condicionesActivas: ["Cansado (Niv. 3)"]
      });
      expect(res.penalizadorD20).toBe(-6);
      expect(res.motivosModificadores).toContain("Cansancio Niv. 3 (-6)");
    });

    it("debe anular ventaja y desventaja si ambas están presentes (tirada plana)", () => {
      const res = evaluarEfectosCondicionesEnTirada({
        tipo: "ataque",
        condicionesActivas: ["Invisible", "Envenenado"]
      });
      expect(res.tieneVentaja).toBe(true);
      expect(res.tieneDesventaja).toBe(true);
      expect(res.modoEfectivo).toBe("plano");
    });
  });

  describe("Instanciación directa de estrategias", () => {
    it("EstrategiaCansancio aplicaPara detecta variantes correctamente", () => {
      const estrategia = new EstrategiaCansancio();
      expect(estrategia.aplicaPara("Cansado")).toBe(true);
      expect(estrategia.aplicaPara("cansado (niv. 2)")).toBe(true);
      expect(estrategia.aplicaPara("Exhausted")).toBe(true);
      expect(estrategia.aplicaPara("Envenenado")).toBe(false);
    });

    it("EstrategiaCondicionSimple aplicaPara acepta cualquier condición", () => {
      const estrategia = new EstrategiaCondicionSimple();
      expect(estrategia.aplicaPara("Cualquier")).toBe(true);
    });
  });
});
