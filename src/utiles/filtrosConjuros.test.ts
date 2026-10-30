import { describe, it, expect, vi } from "vitest";
import {
  evaluarFiltrosHechizo,
  tieneComponente,
  esConjuroAtaque,
  esConjuroSalvacion,
  esConjuroUtilidad,
  type FiltroComponentesConjuro
} from "./filtrosConjuros";
import type { HechizoBase } from "@/tipos";
import * as busquedaTolerante from "@/utiles/busquedaTolerante";

const filtroCompBase: FiltroComponentesConjuro = {
  sinV: false,
  sinS: false,
  sinM: false,
  soloM: false
};

const hechizoPrueba: HechizoBase = {
  id: "h_bola_fuego",
  nombre: "Bola de Fuego",
  nivel: 3,
  escuela: "Evocación",
  tiempoLanzamiento: "1 acción",
  alcance: "150 pies",
  componentesSeleccionados: {
    verbal: true,
    somatico: true,
    material: true
  },
  duracion: "Instantánea",
  concentracion: false,
  ritual: false,
  descripcion: "Una brillante chispa salta de tu dedo hacia un punto...",
  ataqueCd: "CD",
  cdSalvacion: "Destreza"
};

const hechizoAtaqueConcentracion: HechizoBase = {
  id: "h_rayo_brujo",
  nombre: "Rayo Brujo",
  nivel: 1,
  escuela: "Evocación",
  tiempoLanzamiento: "1 acción",
  alcance: "30 pies",
  componentesSeleccionados: {
    verbal: true,
    somatico: true,
    material: true
  },
  duracion: "Concentración, hasta 1 minuto",
  concentracion: true,
  ritual: false,
  descripcion: "Un rayo de energía azul crepitante lanza un ataque...",
  requiereAtaque: true,
  ataqueCd: "ATAQUE"
};

const hechizoUtilidadSoloV: HechizoBase = {
  id: "h_palabra_curacion",
  nombre: "Palabra de Curación",
  nivel: 1,
  escuela: "Evocación",
  tiempoLanzamiento: "1 acción bonus",
  alcance: "60 pies",
  componentesSeleccionados: {
    verbal: true,
    somatico: false,
    material: false
  },
  duracion: "Instantánea",
  concentracion: false,
  ritual: false,
  descripcion: "Una criatura de tu elección recupera puntos de vida."
};

describe("filtrosConjuros", () => {
  describe("funciones auxiliares de componentes y clasificación", () => {
    it("detecta componentes correctamente", () => {
      expect(tieneComponente(hechizoPrueba.componentesSeleccionados, "V")).toBe(true);
      expect(tieneComponente(hechizoPrueba.componentesSeleccionados, "S")).toBe(true);
      expect(tieneComponente(hechizoPrueba.componentesSeleccionados, "M")).toBe(true);

      expect(tieneComponente(hechizoUtilidadSoloV.componentesSeleccionados, "S")).toBe(false);
      expect(tieneComponente(undefined, "V")).toBe(false);
    });

    it("clasifica la resolución del conjuro correctamente", () => {
      expect(esConjuroSalvacion(hechizoPrueba)).toBe(true);
      expect(esConjuroAtaque(hechizoPrueba)).toBe(false);

      expect(esConjuroAtaque(hechizoAtaqueConcentracion)).toBe(true);
      expect(esConjuroSalvacion(hechizoAtaqueConcentracion)).toBe(false);

      expect(esConjuroUtilidad(hechizoUtilidadSoloV)).toBe(true);
      expect(esConjuroAtaque(hechizoUtilidadSoloV)).toBe(false);
      expect(esConjuroSalvacion(hechizoUtilidadSoloV)).toBe(false);
    });
  });

  describe("evaluarFiltrosHechizo", () => {
    it("devuelve true si no hay filtros restrictivos", () => {
      const res = evaluarFiltrosHechizo(
        hechizoPrueba,
        "",
        "todos",
        "todos",
        filtroCompBase
      );
      expect(res).toBe(true);
    });

    it("filtra por concentración correctamente", () => {
      expect(evaluarFiltrosHechizo(hechizoPrueba, "", "sin", "todos", filtroCompBase)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoPrueba, "", "con", "todos", filtroCompBase)).toBe(false);

      expect(evaluarFiltrosHechizo(hechizoAtaqueConcentracion, "", "sin", "todos", filtroCompBase)).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoAtaqueConcentracion, "", "con", "todos", filtroCompBase)).toBe(true);
    });

    it("filtra por tipo de resolución correctamente", () => {
      expect(evaluarFiltrosHechizo(hechizoPrueba, "", "todos", "salvacion", filtroCompBase)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoPrueba, "", "todos", "ataque", filtroCompBase)).toBe(false);

      expect(evaluarFiltrosHechizo(hechizoAtaqueConcentracion, "", "todos", "ataque", filtroCompBase)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoAtaqueConcentracion, "", "todos", "utilidad", filtroCompBase)).toBe(false);

      expect(evaluarFiltrosHechizo(hechizoUtilidadSoloV, "", "todos", "utilidad", filtroCompBase)).toBe(true);
    });

    it("filtra por componentes verbales/somáticos/materiales", () => {
      expect(evaluarFiltrosHechizo(hechizoUtilidadSoloV, "", "todos", "todos", { ...filtroCompBase, sinS: true })).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoUtilidadSoloV, "", "todos", "todos", { ...filtroCompBase, sinV: true })).toBe(false);

      expect(evaluarFiltrosHechizo(hechizoPrueba, "", "todos", "todos", { ...filtroCompBase, sinM: true })).toBe(false);
      expect(evaluarFiltrosHechizo(hechizoPrueba, "", "todos", "todos", { ...filtroCompBase, soloM: true })).toBe(true);
    });

    it("filtra por término de búsqueda en nombre o descripción", () => {
      expect(evaluarFiltrosHechizo(hechizoPrueba, "fuego", "todos", "todos", filtroCompBase)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoPrueba, "chispa", "todos", "todos", filtroCompBase)).toBe(true);
      expect(evaluarFiltrosHechizo(hechizoPrueba, "hielo", "todos", "todos", filtroCompBase)).toBe(false);
    });

    it("realiza cortocircuito evaluando primero concentración/resolución/componentes antes de la búsqueda de texto", () => {
      const spyCoincide = vi.spyOn(busquedaTolerante, "coincideBusquedaTolerante");

      // Búsqueda con 'fuego' pero filtro de concentración incompatible ('con' cuando el hechizo no requiere concentración)
      const res = evaluarFiltrosHechizo(hechizoPrueba, "fuego", "con", "todos", filtroCompBase);

      expect(res).toBe(false);
      // Confirma que coincideBusquedaTolerante no llegó a ser invocada
      expect(spyCoincide).not.toHaveBeenCalled();

      spyCoincide.mockRestore();
    });
  });
});
