import { describe, it, expect } from "vitest";
import type { HechizoBase } from "@/tipos";
import {
  evaluarFiltrosHechizo,
  esConjuroAtaque,
  esConjuroSalvacion,
  esConjuroUtilidad,
  tieneComponente,
  type FiltroComponentesConjuro
} from "./filtrosConjuros";

const HECHIZO_BASE_PRUEBA: HechizoBase = {
  id: "bola-de-fuego",
  nombre: "Bola de Fuego",
  nivel: 3,
  escuela: "Evocación",
  tiempoLanzamiento: "1 acción",
  alcance: "150 pies",
  componentes: "V, S, M",
  duracion: "Instantánea",
  descripcion: "Una explosión brillante despliega un resplandor de fuego en una esfera de 20 pies.",
  concentracion: false,
  ritual: false,
  ataqueCd: "CD",
  componentesSeleccionados: { verbal: true, somatico: true, material: true }
};

const FILTRO_COMPONENTES_VACIO: FiltroComponentesConjuro = {
  sinV: false,
  sinS: false,
  sinM: false,
  soloM: false
};

describe("filtrosConjuros - Utilidades y evaluador de filtros de conjuro", () => {
  describe("tieneComponente", () => {
    it("identifica componentes verbales, somáticos y materiales correctamente", () => {
      expect(tieneComponente(HECHIZO_BASE_PRUEBA, "V")).toBe(true);
      expect(tieneComponente(HECHIZO_BASE_PRUEBA, "S")).toBe(true);
      expect(tieneComponente(HECHIZO_BASE_PRUEBA, "M")).toBe(true);

      const hechizoSinV = {
        ...HECHIZO_BASE_PRUEBA,
        componentesSeleccionados: { verbal: false, somatico: true, material: false }
      };
      expect(tieneComponente(hechizoSinV, "V")).toBe(false);
      expect(tieneComponente(hechizoSinV, "S")).toBe(true);
      expect(tieneComponente(hechizoSinV, "M")).toBe(false);
    });

    it("maneja objetos sin componentesSeleccionados o undefined de forma segura", () => {
      expect(tieneComponente(undefined, "V")).toBe(false);
      expect(tieneComponente({}, "V")).toBe(false);
    });
  });

  describe("Clasificación de tipo de resolución (Ataque, Salvación, Utilidad)", () => {
    it("clasifica conjuros de ataque correctamente", () => {
      const hechizoAtaque: HechizoBase = {
        ...HECHIZO_BASE_PRUEBA,
        requiereAtaque: true,
        ataqueCd: "ATAQUE"
      };
      expect(esConjuroAtaque(hechizoAtaque)).toBe(true);
      expect(esConjuroSalvacion(hechizoAtaque)).toBe(false);
      expect(esConjuroUtilidad(hechizoAtaque)).toBe(false);
    });

    it("clasifica conjuros de salvación por CD correctamente", () => {
      expect(esConjuroAtaque(HECHIZO_BASE_PRUEBA)).toBe(false);
      expect(esConjuroSalvacion(HECHIZO_BASE_PRUEBA)).toBe(true);
      expect(esConjuroUtilidad(HECHIZO_BASE_PRUEBA)).toBe(false);
    });

    it("clasifica conjuros de utilidad correctamente", () => {
      const hechizoUtilidad: HechizoBase = {
        ...HECHIZO_BASE_PRUEBA,
        requiereAtaque: false,
        ataqueCd: undefined
      };
      expect(esConjuroAtaque(hechizoUtilidad)).toBe(false);
      expect(esConjuroSalvacion(hechizoUtilidad)).toBe(false);
      expect(esConjuroUtilidad(hechizoUtilidad)).toBe(true);
    });
  });

  describe("evaluarFiltrosHechizo", () => {
    it("retorna true cuando todos los filtros están vacíos/por defecto", () => {
      const resultado = evaluarFiltrosHechizo(
        HECHIZO_BASE_PRUEBA,
        "",
        "todos",
        "todos",
        FILTRO_COMPONENTES_VACIO
      );
      expect(resultado).toBe(true);
    });

    it("filtra por concentración correctamente con cortocircuito directo", () => {
      const hechizoConConcentracion: HechizoBase = {
        ...HECHIZO_BASE_PRUEBA,
        concentracion: true
      };

      expect(
        evaluarFiltrosHechizo(HECHIZO_BASE_PRUEBA, "", "con", "todos", FILTRO_COMPONENTES_VACIO)
      ).toBe(false);

      expect(
        evaluarFiltrosHechizo(hechizoConConcentracion, "", "sin", "todos", FILTRO_COMPONENTES_VACIO)
      ).toBe(false);

      expect(
        evaluarFiltrosHechizo(hechizoConConcentracion, "", "con", "todos", FILTRO_COMPONENTES_VACIO)
      ).toBe(true);
    });

    it("filtra por resolución (ataque/salvación/utilidad) correctamente", () => {
      expect(
        evaluarFiltrosHechizo(HECHIZO_BASE_PRUEBA, "", "todos", "ataque", FILTRO_COMPONENTES_VACIO)
      ).toBe(false);

      expect(
        evaluarFiltrosHechizo(HECHIZO_BASE_PRUEBA, "", "todos", "salvacion", FILTRO_COMPONENTES_VACIO)
      ).toBe(true);
    });

    it("filtra por componentes (sinV, sinS, sinM, soloM) correctamente", () => {
      expect(
        evaluarFiltrosHechizo(HECHIZO_BASE_PRUEBA, "", "todos", "todos", {
          ...FILTRO_COMPONENTES_VACIO,
          sinV: true
        })
      ).toBe(false);

      const hechizoSoloSomático: HechizoBase = {
        ...HECHIZO_BASE_PRUEBA,
        componentesSeleccionados: { verbal: false, somatico: true, material: false }
      };

      expect(
        evaluarFiltrosHechizo(hechizoSoloSomático, "", "todos", "todos", {
          ...FILTRO_COMPONENTES_VACIO,
          sinV: true,
          sinM: true
        })
      ).toBe(true);

      expect(
        evaluarFiltrosHechizo(hechizoSoloSomático, "", "todos", "todos", {
          ...FILTRO_COMPONENTES_VACIO,
          soloM: true
        })
      ).toBe(false);
    });

    it("evalúa la búsqueda de texto cuando la muestra pasa los filtros previos", () => {
      expect(
        evaluarFiltrosHechizo(
          HECHIZO_BASE_PRUEBA,
          "fuego",
          "todos",
          "salvacion",
          FILTRO_COMPONENTES_VACIO
        )
      ).toBe(true);

      expect(
        evaluarFiltrosHechizo(
          HECHIZO_BASE_PRUEBA,
          "curacion",
          "todos",
          "salvacion",
          FILTRO_COMPONENTES_VACIO
        )
      ).toBe(false);
    });
  });
});
