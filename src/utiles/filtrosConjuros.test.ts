import { describe, it, expect } from "vitest";
import {
  evaluarFiltrosHechizo,
  esConjuroAtaque,
  esConjuroSalvacion,
  esConjuroUtilidad,
  tieneComponente,
  type FiltroComponentesConjuro
} from "@/utiles/filtrosConjuros";
import type { HechizoBase } from "@/tipos";

const hechizoBaseMock: HechizoBase = {
  id: "proyectil-magico",
  nombre: "Proyectil Mágico",
  nivel: 1,
  escuela: "Evocación",
  tiempoLanzamiento: "1 acción",
  alcance: "120 pies",
  duracion: "Instantánea",
  concentracion: false,
  descripcion: "Creas tres dardos de fuerza mágica brillante.",
  componentesSeleccionados: {
    verbal: true,
    somatico: true,
    material: false
  },
  requiereAtaque: false,
  ataqueCd: "N/A"
};

const filtroComponentesSinFiltros: FiltroComponentesConjuro = {
  sinV: false,
  sinS: false,
  sinM: false,
  soloM: false
};

describe("Filtros de Conjuros (filtrosConjuros)", () => {
  describe("Funciones auxiliares", () => {
    it("identifica componentes del conjuro correctamente", () => {
      expect(tieneComponente(hechizoBaseMock, "V")).toBe(true);
      expect(tieneComponente(hechizoBaseMock, "S")).toBe(true);
      expect(tieneComponente(hechizoBaseMock, "M")).toBe(false);
      expect(tieneComponente(undefined, "V")).toBe(false);
    });

    it("clasifica el tipo de resolución (ataque, salvación, utilidad)", () => {
      const hechizoAtaque: HechizoBase = { ...hechizoBaseMock, requiereAtaque: true, ataqueCd: "ATAQUE" };
      const hechizoSalvacion: HechizoBase = { ...hechizoBaseMock, ataqueCd: "CD" };
      const hechizoUtilidad: HechizoBase = { ...hechizoBaseMock, requiereAtaque: false, ataqueCd: "N/A" };

      expect(esConjuroAtaque(hechizoAtaque)).toBe(true);
      expect(esConjuroSalvacion(hechizoSalvacion)).toBe(true);
      expect(esConjuroUtilidad(hechizoUtilidad)).toBe(true);
    });
  });

  describe("evaluarFiltrosHechizo", () => {
    it("devuelve true sin ningún filtro activo", () => {
      const resultado = evaluarFiltrosHechizo(
        hechizoBaseMock,
        "",
        "todos",
        "todos",
        filtroComponentesSinFiltros
      );
      expect(resultado).toBe(true);
    });

    it("filtra correctamente por concentración (sin / con)", () => {
      const hechizoConcentracion: HechizoBase = { ...hechizoBaseMock, concentracion: true };

      expect(evaluarFiltrosHechizo(hechizoConcentracion, "", "sin", "todos", filtroComponentesSinFiltros)).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoConcentracion, "", "con", "todos", filtroComponentesSinFiltros)).toBe(true);

      expect(evaluarFiltrosHechizo(hechizoBaseMock, "", "sin", "todos", filtroComponentesSinFiltros)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoBaseMock, "", "con", "todos", filtroComponentesSinFiltros)).toBe(false);
    });

    it("filtra correctamente por tipo de resolución (ataque / salvación / utilidad)", () => {
      const hechizoAtaque: HechizoBase = { ...hechizoBaseMock, requiereAtaque: true };

      expect(evaluarFiltrosHechizo(hechizoAtaque, "", "todos", "ataque", filtroComponentesSinFiltros)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoAtaque, "", "todos", "salvacion", filtroComponentesSinFiltros)).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoAtaque, "", "todos", "utilidad", filtroComponentesSinFiltros)).toBe(false);
    });

    it("filtra correctamente por componentes (sinV, sinS, sinM, soloM)", () => {
      const filtroSinV: FiltroComponentesConjuro = { ...filtroComponentesSinFiltros, sinV: true };
      const filtroSinM: FiltroComponentesConjuro = { ...filtroComponentesSinFiltros, sinM: true };

      expect(evaluarFiltrosHechizo(hechizoBaseMock, "", "todos", "todos", filtroSinV)).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoBaseMock, "", "todos", "todos", filtroSinM)).toBe(true);
    });

    it("filtra por búsqueda por texto de manera tolerante", () => {
      expect(evaluarFiltrosHechizo(hechizoBaseMock, "proyectil", "todos", "todos", filtroComponentesSinFiltros)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoBaseMock, "evocacion", "todos", "todos", filtroComponentesSinFiltros)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoBaseMock, "bola de fuego", "todos", "todos", filtroComponentesSinFiltros)).toBe(false);
    });

    it("aplica cortocircuito cuando falla un filtro O(1) ignorando el texto de búsqueda", () => {
      const hechizoIncompatible: HechizoBase = { ...hechizoBaseMock, concentracion: true };
      // "proyectil" coincidiría en texto, pero el filtro "sin" concentración debe descartarlo de inmediato
      const resultado = evaluarFiltrosHechizo(
        hechizoIncompatible,
        "proyectil",
        "sin",
        "todos",
        filtroComponentesSinFiltros
      );
      expect(resultado).toBe(false);
    });
  });
});
