import { describe, it, expect } from "vitest";
import {
  calcularModificadorCaracteristica,
  obtenerValorDadoCaras,
  ejecutarDescansoCorto,
  ejecutarDescansoLargo
} from "./procesadorDescansos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador } from "@/tipos";

describe("procesadorDescansos (D&D 5.5e)", () => {
  it("calcula modificadores de característica correctamente", () => {
    expect(calcularModificadorCaracteristica(10)).toBe(0);
    expect(calcularModificadorCaracteristica(11)).toBe(0);
    expect(calcularModificadorCaracteristica(12)).toBe(1);
    expect(calcularModificadorCaracteristica(15)).toBe(2);
    expect(calcularModificadorCaracteristica(20)).toBe(5);
    expect(calcularModificadorCaracteristica(8)).toBe(-1);
    expect(calcularModificadorCaracteristica(5)).toBe(-3);
  });

  it("obtiene las caras de los dados de golpe estándar", () => {
    expect(obtenerValorDadoCaras("d6")).toBe(6);
    expect(obtenerValorDadoCaras("d8")).toBe(8);
    expect(obtenerValorDadoCaras("d10")).toBe(10);
    expect(obtenerValorDadoCaras("d12")).toBe(12);
  });

  describe("Descanso Corto", () => {
    it("cura HP al gastar dados de golpe respetando mod CON", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        hpMaximo: 20,
        hpActual: 5,
        dadosGolpeTotal: 3,
        dadosGolpeRestantes: 3,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, constitucion: 14 } // Mod +2
      };

      // Gastamos 1 dado con tirada 6 -> Cura 6 + 2 = 8 HP
      const resultado = ejecutarDescansoCorto(pj, 1, [6]);
      expect(resultado.personajeActualizado.hpActual).toBe(13);
      expect(resultado.personajeActualizado.dadosGolpeRestantes).toBe(2);
      expect(resultado.acciones).toHaveLength(2);
    });

    it("no supera el HP máximo al curar", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        hpMaximo: 20,
        hpActual: 18,
        dadosGolpeTotal: 2,
        dadosGolpeRestantes: 2,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, constitucion: 14 } // Mod +2
      };

      // Tirada 6 + 2 = 8, pero solo faltaban 2 HP para el maximo
      const resultado = ejecutarDescansoCorto(pj, 1, [6]);
      expect(resultado.personajeActualizado.hpActual).toBe(20);
      expect(resultado.personajeActualizado.dadosGolpeRestantes).toBe(1);
    });

    it("maneja caso de 0 dados a gastar de forma limpia", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        hpMaximo: 20,
        hpActual: 10,
        dadosGolpeTotal: 2,
        dadosGolpeRestantes: 2
      };

      const resultado = ejecutarDescansoCorto(pj, 0);
      expect(resultado.personajeActualizado.hpActual).toBe(10);
      expect(resultado.personajeActualizado.dadosGolpeRestantes).toBe(2);
    });
  });

  describe("Descanso Largo", () => {
    it("restaura HP al máximo, elimina temp HP, recupera la mitad de dados de golpe y reduce cansancio", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        hpMaximo: 50,
        hpActual: 12,
        hpTemporal: 8,
        dadosGolpeTotal: 6,
        dadosGolpeRestantes: 1,
        cansancio: 2,
        salvacionesMuerte: { exitos: 1, fallos: 2 }
      };

      const resultado = ejecutarDescansoLargo(pj);
      const pjAct = resultado.personajeActualizado;

      expect(pjAct.hpActual).toBe(50);
      expect(pjAct.hpTemporal).toBe(0);
      // Recupera floor(6 / 2) = 3 dados -> 1 + 3 = 4 dados restantes
      expect(pjAct.dadosGolpeRestantes).toBe(4);
      expect(pjAct.cansancio).toBe(1); // 2 -> 1
      expect(pjAct.salvacionesMuerte).toEqual({ exitos: 0, fallos: 0 });
    });

    it("recupera como mínimo 1 dado de golpe en personajes de nivel 1", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        hpMaximo: 10,
        hpActual: 3,
        dadosGolpeTotal: 1,
        dadosGolpeRestantes: 0,
        cansancio: 0
      };

      const resultado = ejecutarDescansoLargo(pj);
      expect(resultado.personajeActualizado.dadosGolpeRestantes).toBe(1);
    });

    it("recarga las cargas de objetos mágicos del inventario", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        hpMaximo: 20,
        hpActual: 20,
        inventario: [
          {
            idInstancia: "inv_vara_1",
            idObjeto: "vara_misiles",
            nombre: "Vara de Proyectiles Mágicos",
            tipoPrincipal: "Equipo de Aventuras",
            cantidad: 1,
            pesoLb: 1,
            equipado: true,
            sintonizado: true,
            cargasMaximas: 7,
            cargasActuales: 2,
            notas: ""
          } as import("@/tipos").ObjetoInventario
        ]
      };

      const resultado = ejecutarDescansoLargo(pj);
      expect(resultado.personajeActualizado.inventario[0].cargasActuales).toBe(7);
      expect(resultado.acciones.some((a) => a.tipo === "recurso" && a.cambio === 5)).toBe(true);
    });
  });
});
