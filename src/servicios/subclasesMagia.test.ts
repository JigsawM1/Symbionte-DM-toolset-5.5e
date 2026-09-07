import { describe, it, expect } from "vitest";
import {
  obtenerConjurosSiemprePreparadosSubclase,
  obtenerConjurosSubclasePersonaje,
  obtenerNivelesArcanoMisticoDisponibles,
  calcularConteoPreparadosEfectivos
} from "./calculadorMagia";
import { CATALOGO_CONJUROS_SUBCLASES } from "@/constantes/subclasesConjurosConstantes";

describe("Fase 2: Catálogo y Cálculo de Conjuros de Subclase D&D 2024", () => {
  it("debe contener las 12 clases oficiales y sus subclases en el catálogo maestro", () => {
    expect(CATALOGO_CONJUROS_SUBCLASES.length).toBeGreaterThanOrEqual(20);

    const clasesPresentes = new Set(CATALOGO_CONJUROS_SUBCLASES.map((c) => c.clase));
    expect(clasesPresentes.has("Clérigo")).toBe(true);
    expect(clasesPresentes.has("Paladín")).toBe(true);
    expect(clasesPresentes.has("Brujo")).toBe(true);
    expect(clasesPresentes.has("Druida")).toBe(true);
    expect(clasesPresentes.has("Hechicero")).toBe(true);
    expect(clasesPresentes.has("Explorador")).toBe(true);
    expect(clasesPresentes.has("Bardo")).toBe(true);
    expect(clasesPresentes.has("Mago")).toBe(true);
    expect(clasesPresentes.has("Guerrero")).toBe(true);
    expect(clasesPresentes.has("Pícaro")).toBe(true);
    expect(clasesPresentes.has("Monje")).toBe(true);
    expect(clasesPresentes.has("Bárbaro")).toBe(true);
  });

  describe("1. Clérigo (Dominios Divinos)", () => {
    it("Dominio de la Vida: otorga conjuros acumulativos por nivel", () => {
      const nv3 = obtenerConjurosSiemprePreparadosSubclase("Clérigo", "Dominio de la Vida", 3);
      expect(nv3.conjuros).toEqual(["Auxilio", "Bendición", "Curar heridas", "Restablecimiento menor"]);

      const nv5 = obtenerConjurosSiemprePreparadosSubclase("Clérigo", "Dominio de la Vida", 5);
      expect(nv5.conjuros).toContain("Palabra de curación en masa");
      expect(nv5.conjuros).toContain("Revivir");
      expect(nv5.conjuros.length).toBe(6);

      const nv9 = obtenerConjurosSiemprePreparadosSubclase("Clérigo", "Dominio de la Vida", 9);
      expect(nv9.conjuros).toContain("Restablecimiento mayor");
      expect(nv9.conjuros).toContain("Curar heridas en masa");
      expect(nv9.conjuros.length).toBe(10);
    });

    it("Dominio de la Luz: otorga Bola de fuego a Nv 5 y Columna de llamas a Nv 9", () => {
      const nv9 = obtenerConjurosSiemprePreparadosSubclase("Clérigo", "Dominio de la Luz", 9);
      expect(nv9.conjuros).toContain("Manos ardientes");
      expect(nv9.conjuros).toContain("Bola de fuego");
      expect(nv9.conjuros).toContain("Muro de fuego");
      expect(nv9.conjuros).toContain("Columna de llamas");
      expect(nv9.conjuros).toContain("Escrudiñar");
    });
  });

  describe("2. Paladín (Juramentos)", () => {
    it("Juramento de Venganza: desbloquea conjuros hasta nivel 17", () => {
      const nv3 = obtenerConjurosSiemprePreparadosSubclase("Paladín", "Juramento de Venganza", 3);
      expect(nv3.conjuros).toEqual(["Perdición", "Marca del cazador"]);

      const nv5 = obtenerConjurosSiemprePreparadosSubclase("Paladín", "Juramento de Venganza", 5);
      expect(nv5.conjuros).toContain("Inmovilizar persona");
      expect(nv5.conjuros).toContain("Paso brumoso");

      const nv17 = obtenerConjurosSiemprePreparadosSubclase("Paladín", "Juramento de Venganza", 17);
      expect(nv17.conjuros).toContain("Inmovilizar monstruo");
      expect(nv17.conjuros).toContain("Escrudiñar");
      expect(nv17.conjuros.length).toBe(10);
    });

    it("Juramento de Gloria y Antiguos", () => {
      const gloria = obtenerConjurosSiemprePreparadosSubclase("Paladín", "Juramento de Gloria", 9);
      expect(gloria.conjuros).toContain("Saeta guía");
      expect(gloria.conjuros).toContain("Acelerar");

      const antiguos = obtenerConjurosSiemprePreparadosSubclase("Paladín", "Juramento de los Antiguos", 5);
      expect(antiguos.conjuros).toContain("Rayo lunar");
      expect(antiguos.conjuros).toContain("Paso brumoso");
    });
  });

  describe("3. Brujo (Patrones y Arcano Místico)", () => {
    it("Patrón Celestial: otorga trucos extra (Luz, Llama sagrada) y conjuros curativos", () => {
      const celestial = obtenerConjurosSiemprePreparadosSubclase("Brujo", "Patrón Celestial", 5);
      expect(celestial.trucos).toEqual(["Luz", "Llama sagrada"]);
      expect(celestial.conjuros).toContain("Auxilio");
      expect(celestial.conjuros).toContain("Curar heridas");
      expect(celestial.conjuros).toContain("Luz del día");
      expect(celestial.conjuros).toContain("Revivir");
    });

    it("Patrón Infernal y Gran Primigenio", () => {
      const infernal = obtenerConjurosSiemprePreparadosSubclase("Brujo", "Patrón Infernal", 5);
      expect(infernal.conjuros).toContain("Bola de fuego");
      expect(infernal.conjuros).toContain("Manos ardientes");

      const primigenio = obtenerConjurosSiemprePreparadosSubclase("Brujo", "Patrón del Gran Primigenio", 10);
      expect(primigenio.conjuros).toContain("Maldición");
      expect(primigenio.conjuros).toContain("Telequinesis");
    });

    it("Arcano Místico: calcula los niveles disponibles según nivel de Brujo", () => {
      expect(obtenerNivelesArcanoMisticoDisponibles(1)).toEqual([]);
      expect(obtenerNivelesArcanoMisticoDisponibles(10)).toEqual([]);
      expect(obtenerNivelesArcanoMisticoDisponibles(11)).toEqual([6]);
      expect(obtenerNivelesArcanoMisticoDisponibles(12)).toEqual([6]);
      expect(obtenerNivelesArcanoMisticoDisponibles(13)).toEqual([6, 7]);
      expect(obtenerNivelesArcanoMisticoDisponibles(15)).toEqual([6, 7, 8]);
      expect(obtenerNivelesArcanoMisticoDisponibles(17)).toEqual([6, 7, 8, 9]);
      expect(obtenerNivelesArcanoMisticoDisponibles(20)).toEqual([6, 7, 8, 9]);
    });
  });

  describe("4. Druida (Círculos)", () => {
    it("Círculo de la Tierra: soporta variantes de bioma (Árida, Polar, Templada, Tropical)", () => {
      const polar = obtenerConjurosSiemprePreparadosSubclase("Druida", "Círculo de la Tierra", 5, "polar");
      expect(polar.trucos).toContain("Rayo de escarcha");
      expect(polar.conjuros).toContain("Tormenta de aguanieve");

      const arida = obtenerConjurosSiemprePreparadosSubclase("Druida", "Círculo de la Tierra", 5, "árida");
      expect(arida.trucos).toContain("Saeta de fuego");
      expect(arida.conjuros).toContain("Bola de fuego");
    });

    it("Círculo de la Luna, Mar y Estrellas", () => {
      const luna = obtenerConjurosSiemprePreparadosSubclase("Druida", "Círculo de la Luna", 5);
      expect(luna.conjuros).toContain("Rayo lunar");
      expect(luna.conjuros).toContain("Conjurar animales");

      const estrellas = obtenerConjurosSiemprePreparadosSubclase("Druida", "Círculo de las Estrellas", 3);
      expect(estrellas.trucos).toContain("Guía");
      expect(estrellas.conjuros).toContain("Saeta guía");
    });
  });

  describe("5. Hechicero", () => {
    it("Hechicería Aberrante y Mecanismo de Relojería", () => {
      const aberrante = obtenerConjurosSiemprePreparadosSubclase("Hechicero", "Hechicería Aberrante", 5);
      expect(aberrante.trucos).toContain("Astilla mental");
      expect(aberrante.conjuros).toContain("Hambre de Hadar");

      const relojeria = obtenerConjurosSiemprePreparadosSubclase("Hechicero", "Hechicería del Mecanismo de Relojería", 5);
      expect(relojeria.conjuros).toContain("Disipar magia");
      expect(relojeria.conjuros).toContain("Auxilio");
    });
  });

  describe("6. Clases con trucos o conjuros específicos (Bardo, Mago, Guerrero, Pícaro, Monje, Bárbaro)", () => {
    it("Bardo Glamour: Hechizar persona, Imagen múltiple, Orden imperiosa", () => {
      const glamour = obtenerConjurosSiemprePreparadosSubclase("Bardo", "Colegio del Glamour", 6);
      expect(glamour.conjuros).toEqual(["Hechizar persona", "Imagen múltiple", "Orden imperiosa"]);
    });

    it("Mago Abjurador (Nv 10) e Ilusionista (Nv 3, Nv 6)", () => {
      const abj = obtenerConjurosSiemprePreparadosSubclase("Mago", "Abjurador", 10);
      expect(abj.conjuros).toContain("Contrahechizo");
      expect(abj.conjuros).toContain("Disipar magia");

      const ilu = obtenerConjurosSiemprePreparadosSubclase("Mago", "Ilusionista", 6);
      expect(ilu.trucos).toContain("Ilusión menor");
      expect(ilu.conjuros).toContain("Invocar bestia");
      expect(ilu.conjuros).toContain("Invocar feérico");
    });

    it("Guerrero Psiónico (Nv 18): Telequinesis", () => {
      const psi = obtenerConjurosSiemprePreparadosSubclase("Guerrero", "Guerrero Psiónico", 18);
      expect(psi.conjuros).toContain("Telequinesis");
    });

    it("Pícaro Embaucador Arcano: Mano de mago", () => {
      const picaro = obtenerConjurosSiemprePreparadosSubclase("Pícaro", "Embaucador Arcano", 3);
      expect(picaro.trucos).toContain("Mano de mago");
    });

    it("Monje Guerrero de la Sombra: Oscuridad e Ilusión menor", () => {
      const sombra = obtenerConjurosSiemprePreparadosSubclase("Monje", "Guerrero de la Sombra", 3);
      expect(sombra.conjuros).toContain("Oscuridad");
      expect(sombra.trucos).toContain("Ilusión menor");
    });

    it("Bárbaro Senda del Corazón Salvaje: Rituales de bestias", () => {
      const barbaro = obtenerConjurosSiemprePreparadosSubclase("Bárbaro", "Senda del Corazón Salvaje", 10);
      expect(barbaro.conjuros).toContain("Sentidos de la bestia");
      expect(barbaro.conjuros).toContain("Hablar con los animales");
      expect(barbaro.conjuros).toContain("Comunión con la naturaleza");
    });
  });

  describe("Resolución Multiclase y Conteo Efectivo", () => {
    it("obtenerConjurosSubclasePersonaje combina múltiples subclases de un personaje", () => {
      const multi = obtenerConjurosSubclasePersonaje([
        { nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 },
        { nombre: "Brujo", subclase: "Patrón Celestial", nivel: 3 },
        { nombre: "Paladín", subclase: "Juramento de Gloria", nivel: 3 }
      ]);

      expect(multi.conjuros).toContain("Auxilio");
      expect(multi.conjuros).toContain("Curar heridas");
      expect(multi.conjuros).toContain("Bendición");
      expect(multi.conjuros).toContain("Saeta guía");
      expect(multi.conjuros).toContain("Rayo abrasador");
      expect(multi.trucos).toContain("Luz");
      expect(multi.trucos).toContain("Llama sagrada");
    });

    it("calcularConteoPreparadosEfectivos desglosa correctamente libres y subclase", () => {
      const preparados = ["auxilio", "bendicion", "escudo", "proyectil-magico"];
      const subclase = ["auxilio", "bendicion"];

      const res = calcularConteoPreparadosEfectivos(preparados, subclase);
      expect(res.libres).toBe(2); // escudo, proyectil-magico
      expect(res.subclase).toBe(2); // auxilio, bendicion
      expect(res.total).toBe(4);
    });
  });
});
