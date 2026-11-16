import { describe, it, expect } from "vitest";
import type { ClaseLanzadora } from "@/tipos";
import { TABLA_ESPACIOS_CONJURO, TABLA_PUNTOS_CONJURO } from "@/constantes";
import {
  CONJUROS_POR_CLASE_Y_NIVEL,
  TRUCOS_POR_CLASE_Y_NIVEL,
  normalizarClaveClaseMagica,
  calcularMaximosConjurosYTrucos
} from "./catalogoProgresionMagica";
import {
  calcularNivelLanzadorMulticlase,
  calcularNivelLanzadorEfectivo,
  calcularEspaciosConjuro,
  calcularPuntosConjuro,
  obtenerCostePuntos
} from "./calculadorRanurasMulticlase";
import { calcularTodosRecursosMagicos } from "./magiaPactoBrujo";

function crearClase(
  clase: string,
  nivel: number,
  tipoLanzador: ClaseLanzadora["tipoLanzador"],
  habilidadConjuro: ClaseLanzadora["habilidadConjuro"],
  modeloConjuros: ClaseLanzadora["modeloConjuros"]
): ClaseLanzadora {
  return { clase, nivel, tipoLanzador, habilidadConjuro, modeloConjuros };
}

describe("Progresión Nv 1-20 y Reglas de Multiclase (D&D 5.5e)", () => {
  it("recorre los niveles 1 al 20 de lanzador completo validando espacios y puntos DMG", () => {
    for (let nivel = 1; nivel <= 20; nivel++) {
      const mago = [crearClase("Mago", nivel, "completo", "inteligencia", "grimorio")];
      expect(calcularNivelLanzadorMulticlase(mago)).toBe(nivel);
      expect(calcularNivelLanzadorEfectivo(mago)).toBe(nivel);

      const espaciosEsperados: Record<string, number> = {};
      for (const [nvRanura, cant] of Object.entries(TABLA_ESPACIOS_CONJURO[nivel])) {
        if (cant > 0) espaciosEsperados[nvRanura] = cant;
      }
      expect(calcularEspaciosConjuro(mago)).toEqual(espaciosEsperados);
      expect(calcularPuntosConjuro(mago)).toEqual({
        puntosMaximos: TABLA_PUNTOS_CONJURO[nivel].puntos,
        nivelMaximo: TABLA_PUNTOS_CONJURO[nivel].nivelMax
      });
    }
  });

  it("recorre los niveles 1 al 20 de semilanzadores (Paladín/Explorador 2024)", () => {
    for (let nivel = 1; nivel <= 20; nivel++) {
      const paladin = [crearClase("Paladín", nivel, "medio", "carisma", "preparados")];
      const esperado = Math.max(1, Math.ceil(nivel / 2));
      expect(calcularNivelLanzadorMulticlase(paladin)).toBe(esperado);
      expect(calcularNivelLanzadorEfectivo(paladin)).toBe(esperado);
      expect(calcularEspaciosConjuro(paladin)["1"]).toBeGreaterThanOrEqual(2);
    }
  });

  it("recorre los niveles 1 al 20 de tercio-lanzadores distinguiendo Nv 1-2 sin magia y Nv 3-20", () => {
    for (let nivel = 1; nivel <= 20; nivel++) {
      const caballero = [crearClase("Caballero Arcano", nivel, "tercio", "inteligencia", "preparados")];
      expect(calcularNivelLanzadorMulticlase(caballero)).toBe(Math.floor(nivel / 3));
      expect(calcularNivelLanzadorEfectivo(caballero)).toBe(Math.ceil(nivel / 3));
    }
    expect(calcularEspaciosConjuro([crearClase("Caballero Arcano", 3, "tercio", "inteligencia", "preparados")])).toEqual({
      "1": 2
    });
    expect(calcularEspaciosConjuro([crearClase("Caballero Arcano", 19, "tercio", "inteligencia", "preparados")])).toEqual({
      "1": 4,
      "2": 3,
      "3": 3,
      "4": 1
    });
  });

  it("calcula multiclase compleja triple: Brujo 5 + Mago 5 + Paladín 4", () => {
    const clases: ClaseLanzadora[] = [
      crearClase("Brujo", 5, "pacto", "carisma", "conocidos"),
      crearClase("Mago", 5, "completo", "inteligencia", "grimorio"),
      crearClase("Paladín", 4, "medio", "carisma", "preparados")
    ];

    // Estándar combinado = 5 (Mago) + floor(4/2) = 7; Brujo no aporta a tabla estándar
    expect(calcularNivelLanzadorMulticlase(clases)).toBe(7);
    const recursos = calcularTodosRecursosMagicos(clases);
    expect(recursos).toEqual({
      espaciosConjuroMaximos: { "1": 4, "2": 3, "3": 3, "4": 1 },
      puntosConjuroMaximos: 38,
      nivelConjuroMaximo: 4,
      espaciosPactoMaximos: 2,
      nivelEspacioPacto: 3
    });
  });

  it("combina Clérigo 3 + Druida 4 + Explorador 5 + Caballero Arcano 6 (nivel lanzador 11) y limita a tope 20", () => {
    const combinacion = [
      crearClase("Clérigo", 3, "completo", "sabiduria", "preparados"),
      crearClase("Druida", 4, "completo", "sabiduria", "preparados"),
      crearClase("Explorador", 5, "medio", "sabiduria", "conocidos"),
      crearClase("Caballero Arcano", 6, "tercio", "inteligencia", "preparados")
    ];
    expect(calcularNivelLanzadorMulticlase(combinacion)).toBe(11);

    const desbordada = [
      crearClase("Mago", 18, "completo", "inteligencia", "grimorio"),
      crearClase("Clérigo", 10, "completo", "sabiduria", "preparados")
    ];
    expect(calcularNivelLanzadorMulticlase(desbordada)).toBe(20);
  });

  it("aplica redondeo hacia abajo en multiclase de dos semilanzadores (Paladín 3 + Explorador 3)", () => {
    const monoPaladin = [crearClase("Paladín", 3, "medio", "carisma", "preparados")];
    const multiSemi = [
      crearClase("Paladín", 3, "medio", "carisma", "preparados"),
      crearClase("Explorador", 3, "medio", "sabiduria", "conocidos")
    ];
    expect(calcularNivelLanzadorMulticlase(monoPaladin)).toBe(2);
    expect(calcularNivelLanzadorMulticlase(multiSemi)).toBe(2); // floor(3/2)+floor(3/2)=1+1
  });

  it("normaliza claves declarativas, valida límites Nv 1-20 de las 10 clases y maneja casos de borde", () => {
    expect(normalizarClaveClaseMagica("Guerrero", "tercio")).toBe("caballero arcano");
    expect(normalizarClaveClaseMagica("Pícaro", "tercio")).toBe("embaucador arcano");
    expect(normalizarClaveClaseMagica("Clérigo")).toBe("clerigo");
    expect(normalizarClaveClaseMagica("Wizard")).toBe("mago");

    for (const [clave, trucos] of Object.entries(TRUCOS_POR_CLASE_Y_NIVEL)) {
      expect(trucos).toHaveLength(20);
      expect(CONJUROS_POR_CLASE_Y_NIVEL[clave]).toHaveLength(20);
    }

    const homebrew = [crearClase("Cronomante", 8, "completo", "inteligencia", "preparados")];
    expect(calcularMaximosConjurosYTrucos(homebrew, 8, 4)).toEqual({
      maxTrucos: 4,
      maxConjuros: 12,
      modelo: "preparados"
    });
    expect(obtenerCostePuntos(-2)).toBe(0);
    expect(obtenerCostePuntos(99)).toBe(0);

    // Override elimina ranuras si es 0 e ignora negativos
    const mago = [crearClase("Mago", 3, "completo", "inteligencia", "grimorio")];
    expect(calcularEspaciosConjuro(mago, { "1": 0, "2": 4, "3": -1 })).toEqual({ "2": 4 });
  });
});
