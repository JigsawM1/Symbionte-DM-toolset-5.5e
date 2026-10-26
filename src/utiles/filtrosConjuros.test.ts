import { describe, it, expect, vi } from "vitest";
import {
  tieneComponente,
  esConjuroAtaque,
  esConjuroSalvacion,
  esConjuroUtilidad,
  evaluarFiltrosHechizo,
  type FiltroComponentesConjuro
} from "./filtrosConjuros";
import * as busquedaModulo from "@/utiles/busquedaTolerante";
import type { HechizoBase } from "@/tipos";

const hechizoBase: HechizoBase = {
  id: "h_bola-de-fuego",
  nombre: "Bola de fuego",
  nivel: 3,
  escuela: "Evocación",
  tiempoLanzamiento: "1 acción",
  alcance: "150 pies",
  descripcion: "Una brillante chispa brota de tu dedo hacia un punto...",
  concentracion: false,
  requiereAtaque: false,
  ataqueCd: "CD",
  componentesSeleccionados: {
    verbal: true,
    somatico: true,
    material: true
  }
};

const componentesSinFiltro: FiltroComponentesConjuro = {
  sinV: false,
  sinS: false,
  sinM: false,
  soloM: false
};

describe("filtrosConjuros", () => {
  describe("tieneComponente", () => {
    it("devuelve los componentes según los flags activos", () => {
      expect(tieneComponente(hechizoBase.componentesSeleccionados, "V")).toBe(true);
      expect(tieneComponente(hechizoBase.componentesSeleccionados, "S")).toBe(true);
      expect(tieneComponente(hechizoBase.componentesSeleccionados, "M")).toBe(true);
    });

    it("funciona aceptando un objeto HechizoBase completo o ComponentesSeleccionados", () => {
      expect(tieneComponente(hechizoBase, "V")).toBe(true);
      expect(tieneComponente(undefined, "V")).toBe(false);
    });
  });

  describe("clasificación por tipo de resolución (Ataque, Salvación, Utilidad)", () => {
    const hechizoAtaque: HechizoBase = { ...hechizoBase, requiereAtaque: true, ataqueCd: "ATAQUE" };
    const hechizoSalvacion: HechizoBase = { ...hechizoBase, requiereAtaque: false, ataqueCd: "CD" };
    const hechizoUtilidad: HechizoBase = { ...hechizoBase, requiereAtaque: false, ataqueCd: undefined };

    it("esConjuroAtaque identifica correctamente conjuros de ataque", () => {
      expect(esConjuroAtaque(hechizoAtaque)).toBe(true);
      expect(esConjuroAtaque(hechizoSalvacion)).toBe(false);
      expect(esConjuroAtaque(hechizoUtilidad)).toBe(false);
    });

    it("esConjuroSalvacion identifica correctamente conjuros de CD", () => {
      expect(esConjuroSalvacion(hechizoAtaque)).toBe(false);
      expect(esConjuroSalvacion(hechizoSalvacion)).toBe(true);
      expect(esConjuroSalvacion(hechizoUtilidad)).toBe(false);
    });

    it("esConjuroUtilidad identifica correctamente conjuros utilitarios", () => {
      expect(esConjuroUtilidad(hechizoAtaque)).toBe(false);
      expect(esConjuroUtilidad(hechizoSalvacion)).toBe(false);
      expect(esConjuroUtilidad(hechizoUtilidad)).toBe(true);
    });
  });

  describe("evaluarFiltrosHechizo", () => {
    it("devuelve true si no hay filtros aplicados ni término de búsqueda", () => {
      expect(evaluarFiltrosHechizo(hechizoBase, "", "todos", "todos", componentesSinFiltro)).toBe(true);
    });

    it("filtra por concentración correctamente", () => {
      const hechizoConConcentracion: HechizoBase = { ...hechizoBase, concentracion: true };

      expect(evaluarFiltrosHechizo(hechizoConConcentracion, "", "con", "todos", componentesSinFiltro)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoConConcentracion, "", "sin", "todos", componentesSinFiltro)).toBe(false);

      expect(evaluarFiltrosHechizo(hechizoBase, "", "con", "todos", componentesSinFiltro)).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoBase, "", "sin", "todos", componentesSinFiltro)).toBe(true);
    });

    it("filtra por resolución (ataque, salvacion, utilidad)", () => {
      const hechizoAtaque: HechizoBase = { ...hechizoBase, requiereAtaque: true, ataqueCd: "ATAQUE" };

      expect(evaluarFiltrosHechizo(hechizoAtaque, "", "todos", "ataque", componentesSinFiltro)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoAtaque, "", "todos", "salvacion", componentesSinFiltro)).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoAtaque, "", "todos", "utilidad", componentesSinFiltro)).toBe(false);
    });

    it("filtra por componentes (sinV, sinS, sinM, soloM)", () => {
      expect(evaluarFiltrosHechizo(hechizoBase, "", "todos", "todos", { ...componentesSinFiltro, sinV: true })).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoBase, "", "todos", "todos", { ...componentesSinFiltro, sinS: true })).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoBase, "", "todos", "todos", { ...componentesSinFiltro, sinM: true })).toBe(false);

      const hechizoSinM: HechizoBase = {
        ...hechizoBase,
        componentesSeleccionados: { verbal: true, somatico: true, material: false }
      };
      expect(evaluarFiltrosHechizo(hechizoSinM, "", "todos", "todos", { ...componentesSinFiltro, soloM: true })).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoSinM, "", "todos", "todos", { ...componentesSinFiltro, sinM: true })).toBe(true);
    });

    it("ejecuta cortocircuito y NO llama a coincideBusquedaTolerante si un filtro booleano falla", () => {
      const spyCoincide = vi.spyOn(busquedaModulo, "coincideBusquedaTolerante");

      // Búsqueda con texto pero filtro de concentración incompatible ("con" para hechizo sin concentración)
      const resultado = evaluarFiltrosHechizo(
        hechizoBase,
        "bola fuego",
        "con",
        "todos",
        componentesSinFiltro
      );

      expect(resultado).toBe(false);
      expect(spyCoincide).not.toHaveBeenCalled();

      spyCoincide.mockRestore();
    });

    it("llama a coincideBusquedaTolerante sólo si los filtros booleanos pasan y hay texto de búsqueda", () => {
      const spyCoincide = vi.spyOn(busquedaModulo, "coincideBusquedaTolerante");

      const resultado = evaluarFiltrosHechizo(
        hechizoBase,
        "bola fuego",
        "todos",
        "todos",
        componentesSinFiltro
      );

      expect(resultado).toBe(true);
      expect(spyCoincide).toHaveBeenCalledTimes(1);

      spyCoincide.mockRestore();
    });
  });
});
