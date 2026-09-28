import { describe, it, expect } from "vitest";
import { evaluarRequisitoDote } from "./evaluadorRequisitosDotes";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos/personaje";

describe("evaluadorRequisitosDotes", () => {
  it("cumple automáticamente si no hay requisito definido o está vacío", () => {
    expect(evaluarRequisitoDote(undefined, null)).toEqual({ cumple: true });
    expect(evaluarRequisitoDote("", null)).toEqual({ cumple: true });
    expect(evaluarRequisitoDote("   ", null)).toEqual({ cumple: true });
  });

  describe("Requisito de Nivel", () => {
    it("bloquea si el nivel del personaje es menor al requerido", () => {
      const pj: PersonajeJugador = { ...PERSONAJE_POR_DEFECTO, nivel: 3 };
      const resultado = evaluarRequisitoDote("Nivel 4 o más", pj);
      expect(resultado.cumple).toBe(false);
      expect(resultado.motivo).toContain("Requiere nivel 4 o más (nivel actual: 3)");
    });

    it("permite si el nivel es igual o superior", () => {
      const pj: PersonajeJugador = { ...PERSONAJE_POR_DEFECTO, nivel: 4 };
      expect(evaluarRequisitoDote("Nivel 4 o más", pj).cumple).toBe(true);
    });

    it("respeta el nivelEfectivo cuando se pasa como override", () => {
      const pj: PersonajeJugador = { ...PERSONAJE_POR_DEFECTO, nivel: 1 };
      // Override nivel 19 para rasgo Don Épico
      expect(evaluarRequisitoDote("Nivel 19 o más", pj, 19).cumple).toBe(true);
      expect(evaluarRequisitoDote("Nivel 19 o más", pj, 4).cumple).toBe(false);
    });
  });

  describe("Requisito de Puntuaciones de Características", () => {
    it("evalúa 'Fuerza o Destreza 13 o más'", () => {
      const pjBajo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 10, destreza: 12 }
      };
      const resultadoBajo = evaluarRequisitoDote("Nivel 4 o más, Fuerza o Destreza 13 o más", pjBajo, 4);
      expect(resultadoBajo.cumple).toBe(false);
      expect(resultadoBajo.motivo).toContain("Requiere Fuerza o Destreza 13 o más");

      const pjFuerza: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 14, destreza: 10 }
      };
      expect(evaluarRequisitoDote("Nivel 4 o más, Fuerza o Destreza 13 o más", pjFuerza, 4).cumple).toBe(true);
    });

    it("evalúa 'Fuerza o Destreza 19 o más' para dones épicos", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 19,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 18, destreza: 16 }
      };
      const res = evaluarRequisitoDote("Nivel 19 o más, Fuerza o Destreza 19 o más", pj);
      expect(res.cumple).toBe(false);

      const pjEpico: PersonajeJugador = {
        ...pj,
        caracteristicas: { ...pj.caracteristicas, fuerza: 20 }
      };
      expect(evaluarRequisitoDote("Nivel 19 o más, Fuerza o Destreza 19 o más", pjEpico).cumple).toBe(true);
    });

    it("evalúa 'Inteligencia, Sabiduría o Carisma 13 o más'", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        caracteristicas: {
          ...PERSONAJE_POR_DEFECTO.caracteristicas,
          inteligencia: 10,
          sabiduria: 12,
          carisma: 14
        }
      };
      expect(
        evaluarRequisitoDote("Nivel 4 o más; Inteligencia, Sabiduría o Carisma 13 o más", pj, 4).cumple
      ).toBe(true);
    });
  });

  describe("Requisito de Magia y Conjuros", () => {
    it("bloquea si el personaje no tiene aptitud de conjuros", () => {
      const pjNoMagico: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 4,
        esLanzador: false,
        clasesLanzadoras: [],
        espaciosConjuroMaximos: {},
        espaciosPactoMaximos: 0,
        trucosConocidosIds: [],
        conjurosConocidosIds: []
      };
      const res = evaluarRequisitoDote("Nivel 4 o más, aptitud para lanzar al menos un conjuro", pjNoMagico);
      expect(res.cumple).toBe(false);
      expect(res.motivo).toContain("Requiere aptitud para lanzar conjuros");
    });

    it("cumple si el personaje tiene espacios de conjuro o trucos", () => {
      const pjMagico: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 4,
        trucosConocidosIds: ["h_descarga_sobrenatural"]
      };
      expect(
        evaluarRequisitoDote("Nivel 4 o más, aptitud para lanzar al menos un conjuro", pjMagico).cumple
      ).toBe(true);
    });
  });

  describe("Requisito de Armaduras y Escudos", () => {
    it("evalúa entrenamiento con armaduras pesadas", () => {
      const pjSinPesadas: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        competenciasArmadurasGrupos: ["ligeras", "medias"]
      };
      const res = evaluarRequisitoDote("Nivel 4 o más, entrenamiento con armaduras pesadas", pjSinPesadas, 4);
      expect(res.cumple).toBe(false);
      expect(res.motivo).toContain("Requiere entrenamiento con armaduras pesadas");

      const pjConPesadas: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        competenciasArmadurasGrupos: ["pesadas"]
      };
      expect(
        evaluarRequisitoDote("Nivel 4 o más, entrenamiento con armaduras pesadas", pjConPesadas, 4).cumple
      ).toBe(true);
    });

    it("evalúa competencia con escudos", () => {
      const pjConEscudos: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        competenciasArmaduras: "Armaduras ligeras, medias y escudos"
      };
      expect(
        evaluarRequisitoDote("Nivel 4 o más, competencia con escudos", pjConEscudos, 4).cumple
      ).toBe(true);
    });
  });

  describe("Requisito de Estilo de Combate", () => {
    it("cumple si el personaje tiene rasgo de estilo o clase marcial", () => {
      const pjGuerrero: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clases: [{ nombre: "Guerrero", subclase: "", nivel: 1 }]
      };
      expect(evaluarRequisitoDote("Rasgo Estilo de combate", pjGuerrero).cumple).toBe(true);

      const pjMago: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clases: [{ nombre: "Mago", subclase: "", nivel: 4 }],
        rasgos: []
      };
      expect(evaluarRequisitoDote("Rasgo Estilo de combate", pjMago).cumple).toBe(false);
    });
  });
});
