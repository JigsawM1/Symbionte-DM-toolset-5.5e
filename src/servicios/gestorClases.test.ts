import { describe, it, expect } from "vitest";
import {
  obtenerCatalogoClases,
  obtenerTodasSubclases,
  obtenerClasePorNombre,
  obtenerClasePorId,
  obtenerSubclasesDeClase,
  obtenerSubclasePorNombre,
  obtenerRasgosClaseYSubclase,
  obtenerConjurosSubclaseBuild,
  construirBuildClase,
  aplicarBuildClaseAPersonaje
} from "./gestorClases";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador } from "@/tipos";

describe("Servicio Gestor de Clases y Subclases D&D 5.5e (2024)", () => {
  it("debe contener exactamente las 12 clases oficiales del PHB 2024", () => {
    const clases = obtenerCatalogoClases();
    expect(clases).toHaveLength(12);

    const nombresEsperados = [
      "Bárbaro", "Bardo", "Brujo", "Clérigo", "Druida", "Explorador",
      "Guerrero", "Hechicero", "Mago", "Monje", "Paladín", "Pícaro"
    ];

    const nombresObtenidos = clases.map((c) => c.nombre);
    nombresEsperados.forEach((nombre) => {
      expect(nombresObtenidos).toContain(nombre);
    });
  });

  it("debe contener exactamente 48 subclases canónicas (4 por cada una de las 12 clases)", () => {
    const clases = obtenerCatalogoClases();
    const todasSubclases = obtenerTodasSubclases();

    expect(todasSubclases).toHaveLength(48);

    clases.forEach((c) => {
      const subclasesDeClase = obtenerSubclasesDeClase(c.nombre);
      expect(subclasesDeClase).toHaveLength(4);
    });
  });

  it("debe buscar clases por nombre o ID de forma tolerante a tildes y mayúsculas", () => {
    expect(obtenerClasePorNombre("barbaro")?.nombre).toBe("Bárbaro");
    expect(obtenerClasePorNombre("BÁRBARO")?.nombre).toBe("Bárbaro");
    expect(obtenerClasePorNombre("clerigo")?.nombre).toBe("Clérigo");
    expect(obtenerClasePorNombre("Clérigo")?.nombre).toBe("Clérigo");
    expect(obtenerClasePorNombre("pícaro")?.nombre).toBe("Pícaro");
    expect(obtenerClasePorNombre("picaro")?.nombre).toBe("Pícaro");
    expect(obtenerClasePorId("wizard") || obtenerClasePorNombre("mago")?.nombre).toBe("Mago");
  });

  it("debe buscar subclases dentro de una clase de forma tolerante", () => {
    const berserker = obtenerSubclasePorNombre("Bárbaro", "berserker");
    expect(berserker).toBeDefined();
    expect(berserker?.nombre).toBe("Senda del Berserker");

    const campeon = obtenerSubclasePorNombre("Guerrero", "campeon");
    expect(campeon).toBeDefined();
    expect(campeon?.nombre).toBe("Campeón");

    const vida = obtenerSubclasePorNombre("Clérigo", "vida");
    expect(vida).toBeDefined();
    expect(vida?.nombre).toBe("Dominio de la Vida");
  });

  it("debe filtrar correctamente los rasgos de clase y subclase según el nivel", () => {
    // Bárbaro nivel 1 (solo rasgos de clase nivel 1)
    const rasgosNv1 = obtenerRasgosClaseYSubclase("Bárbaro", 1);
    expect(rasgosNv1.some((r) => r.nombre === "Furia")).toBe(true);
    expect(rasgosNv1.some((r) => r.nombre === "Defensa sin armadura")).toBe(true);
    expect(rasgosNv1.some((r) => r.nombre === "Ataque temerario")).toBe(false); // Nivel 2

    // Bárbaro nivel 3 con Senda del Berserker
    const rasgosNv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3, "Senda del Berserker");
    expect(rasgosNv3.some((r) => r.nombre === "Ataque temerario")).toBe(true);
    expect(rasgosNv3.some((r) => r.nombre === "Frenesí")).toBe(true); // Rasgo de subclase lvl 3
    expect(rasgosNv3.some((r) => r.nombre === "Furia ciega")).toBe(false); // Rasgo de subclase lvl 6

    // Bárbaro nivel 6 con Senda del Berserker
    const rasgosNv6 = obtenerRasgosClaseYSubclase("Bárbaro", 6, "Senda del Berserker");
    expect(rasgosNv6.some((r) => r.nombre === "Furia ciega")).toBe(true);
  });

  it("debe retornar los conjuros siempre preparados de subclases según el nivel", () => {
    // Clérigo Dominio de la Vida nivel 3
    const magiaNv3 = obtenerConjurosSubclaseBuild("Clérigo", "Dominio de la Vida", 3);
    expect(magiaNv3.conjuros).toContain("Bendición");
    expect(magiaNv3.conjuros).toContain("Curar heridas");
    expect(magiaNv3.conjuros).not.toContain("Revivir"); // Nivel 5

    // Clérigo Dominio de la Vida nivel 5
    const magiaNv5 = obtenerConjurosSubclaseBuild("Clérigo", "Dominio de la Vida", 5);
    expect(magiaNv5.conjuros).toContain("Revivir");
    expect(magiaNv5.conjuros).toContain("Palabra de curación en masa");
  });

  it("debe construir una build completa y calcular todas las métricas de clase", () => {
    const buildMago = construirBuildClase("Mago", 6, "Evocador");
    expect(buildMago).not.toBeNull();
    expect(buildMago?.dadoGolpe).toBe("d6");
    expect(buildMago?.salvacionesCompetentes).toEqual(["inteligencia", "sabiduria"]);
    expect(buildMago?.configuracionMagica?.tipoLanzador).toBe("completo");
    expect(buildMago?.configuracionMagica?.habilidadConjuro).toBe("inteligencia");
    expect(buildMago?.rasgos.some((r) => r.nombre === "Esculpir conjuros")).toBe(true);

    const buildGuerrero = construirBuildClase("Guerrero", 3, "Campeón");
    expect(buildGuerrero).not.toBeNull();
    expect(buildGuerrero?.dadoGolpe).toBe("d10");
    expect(buildGuerrero?.salvacionesCompetentes).toEqual(["fuerza", "constitucion"]);
    expect(buildGuerrero?.competenciasArmaduras).toContain("Armaduras Pesadas");
  });

  it("debe aplicar una build de clase completa al personaje de forma inmutable", () => {
    const base: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-test-1",
      nombre: "Héroe de Prueba"
    };

    const actualizado = aplicarBuildClaseAPersonaje(base, "Paladín", 3, "Juramento de Entrega");

    expect(actualizado.clase).toBe("Paladín");
    expect(actualizado.subclase).toBe("Juramento de Entrega");
    expect(actualizado.nivel).toBe(3);
    expect(actualizado.tipoDadoGolpe).toBe("d10");
    expect(actualizado.competenciasSalvacion.sabiduria).toBe(true);
    expect(actualizado.competenciasSalvacion.carisma).toBe(true);
    expect(actualizado.competenciasSalvacion.fuerza).toBe(false);
    expect(actualizado.esLanzador).toBe(true);
    expect(actualizado.clasesLanzadoras[0].tipoLanzador).toBe("medio");
    expect(actualizado.conjurosSiemprePreparadosIds).toContain("Protección contra el bien y el mal");
    expect(actualizado.rasgos.some((r) => r.nombre === "Imposición de manos")).toBe(true);
  });

  it("los rasgos activables deben estar desactivados por defecto (activo: false)", () => {
    const rasgosBarbaro = obtenerRasgosClaseYSubclase("Bárbaro", 9, "Senda del Fanático");

    // Furia es activable -> debe nacer con activo: false
    const rasgoFuria = rasgosBarbaro.find((r) => r.nombre === "Furia");
    expect(rasgoFuria).toBeDefined();
    expect(rasgoFuria?.esActivable).toBe(true);
    expect(rasgoFuria?.activo).toBe(false);

    // Ataque temerario es activable -> debe nacer con activo: false
    const rasgoTemerario = rasgosBarbaro.find((r) => r.nombre === "Ataque temerario");
    expect(rasgoTemerario).toBeDefined();
    expect(rasgoTemerario?.esActivable).toBe(true);
    expect(rasgoTemerario?.activo).toBe(false);

    // Furia divina es activable -> debe nacer con activo: false
    const rasgoFuriaDivina = rasgosBarbaro.find((r) => r.nombre === "Furia divina");
    expect(rasgoFuriaDivina).toBeDefined();
    expect(rasgoFuriaDivina?.esActivable).toBe(true);
    expect(rasgoFuriaDivina?.activo).toBe(false);

    // Rasgo pasivo (Defensa sin armadura) -> debe tener activo: true
    const rasgoDefensa = rasgosBarbaro.find((r) => r.nombre === "Defensa sin armadura");
    expect(rasgoDefensa).toBeDefined();
    expect(rasgoDefensa?.esActivable).toBe(false);
    expect(rasgoDefensa?.activo).toBe(true);
  });

  it("Furia Divina debe escalar su fórmula de dados según la mitad del nivel de bárbaro (redondeando abajo)", () => {
    // Nivel 3: 1d6 + floor(3/2) = 1d6+1
    const rasgosNv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3, "Senda del Fanático");
    const fdNv3 = rasgosNv3.find((r) => r.nombre === "Furia divina");
    expect(fdNv3?.formulaDados).toBe("1d6+1");

    // Nivel 6: 1d6 + floor(6/2) = 1d6+3
    const rasgosNv6 = obtenerRasgosClaseYSubclase("Bárbaro", 6, "Senda del Fanático");
    const fdNv6 = rasgosNv6.find((r) => r.nombre === "Furia divina");
    expect(fdNv6?.formulaDados).toBe("1d6+3");

    // Nivel 9: 1d6 + floor(9/2) = 1d6+4
    const rasgosNv9 = obtenerRasgosClaseYSubclase("Bárbaro", 9, "Senda del Fanático");
    const fdNv9 = rasgosNv9.find((r) => r.nombre === "Furia divina");
    expect(fdNv9?.formulaDados).toBe("1d6+4");

    // Nivel 14: 1d6 + floor(14/2) = 1d6+7
    const rasgosNv14 = obtenerRasgosClaseYSubclase("Bárbaro", 14, "Senda del Fanático");
    const fdNv14 = rasgosNv14.find((r) => r.nombre === "Furia divina");
    expect(fdNv14?.formulaDados).toBe("1d6+7");
  });
});
