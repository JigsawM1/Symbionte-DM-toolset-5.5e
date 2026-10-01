import { describe, it, expect } from "vitest";
import {
  calcularDistanciaMovimientoTS,
  calcularEstadoVelocidadDinamica
} from "./calculadorDistanciaTS";
import type { PosicionTS } from "@/tipos/personaje";

describe("calculadorDistanciaTS - Geometría y Manejo de Subtableros TaleSpire", () => {
  it("calcula distancia en línea recta en casillas x 5 pies", () => {
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 3, y: 0, z: 0 }; // 3 casillas = 15 ft

    const resultado = calcularDistanciaMovimientoTS(posA, posB);
    expect(resultado.distanciaCasillas).toBe(3);
    expect(resultado.distanciaBruta).toBe(15);
    expect(resultado.distanciaPies).toBe(15);
    expect(resultado.esCambioMapaOSubtablero).toBe(false);
  });

  it("calcula distancia decimal fluida sin redondeo a 5 pies por defecto", () => {
    // 1 casilla en X y 1 casilla en Z = sqrt(2) ≈ 1.414 casillas ≈ 7.07 pies -> 7.1 pies exactos
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 1, y: 0, z: 1 };

    const resultado = calcularDistanciaMovimientoTS(posA, posB);
    expect(resultado.distanciaCasillas).toBeCloseTo(1.414, 2);
    expect(resultado.distanciaBruta).toBeCloseTo(7.071, 2);
    expect(resultado.distanciaPies).toBe(7.1);
  });

  it("calcula movimientos finos de 0.1 y 0.2 pies con precisión decimal", () => {
    // 0.02 casillas * 5 pies/casilla = 0.1 pies
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 0.02, y: 0, z: 0 };

    const res01 = calcularDistanciaMovimientoTS(posA, posB);
    expect(res01.distanciaPies).toBe(0.1);

    // 0.04 casillas * 5 pies/casilla = 0.2 pies
    const posC: PosicionTS = { locId: 0, x: 0.04, y: 0, z: 0 };
    const res02 = calcularDistanciaMovimientoTS(posA, posC);
    expect(res02.distanciaPies).toBe(0.2);
  });

  it("permite redondeo opcional a 5 pies cuando se solicita explícitamente", () => {
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 1, y: 0, z: 1 };

    const resultado = calcularDistanciaMovimientoTS(posA, posB, null, null, { redondearA5Pies: true });
    expect(resultado.distanciaPies).toBe(5); // Math.round(7.071 / 5) * 5 = 5
  });

  it("filtra únicamente micro-movimientos residuales < 0.05 pies", () => {
    const posA: PosicionTS = { locId: 0, x: 5.0, y: 1.0, z: 5.0 };
    const posB: PosicionTS = { locId: 0, x: 5.002, y: 1.0, z: 5.0 }; // 0.01 pies (< 0.05 pies)

    const resultado = calcularDistanciaMovimientoTS(posA, posB);
    expect(resultado.distanciaPies).toBe(0);
    expect(resultado.distanciaBruta).toBeLessThan(0.05);
    expect(resultado.esCambioMapaOSubtablero).toBe(false);
  });

  it("no calcula distancia si cambia el subtablero (locId diferente)", () => {
    const posA: PosicionTS = { locId: 0, x: 10, y: 2, z: 10 };
    const posB: PosicionTS = { locId: 1, x: 50, y: 2, z: 80 }; // Otro subtablero

    const resultado = calcularDistanciaMovimientoTS(posA, posB);
    expect(resultado.distanciaPies).toBe(0);
    expect(resultado.esCambioMapaOSubtablero).toBe(true);
  });

  it("no calcula distancia si cambia el ID del tablero", () => {
    const posA: PosicionTS = { locId: 0, x: 10, y: 2, z: 10 };
    const posB: PosicionTS = { locId: 0, x: 15, y: 2, z: 10 };

    const resultado = calcularDistanciaMovimientoTS(posA, posB, "board-1", "board-2");
    expect(resultado.distanciaPies).toBe(0);
    expect(resultado.esCambioMapaOSubtablero).toBe(true);
  });

  it("incluye la altura vertical Y por defecto en el cálculo 3D", () => {
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 0, y: 4, z: 3 }; // 3 en Z, 4 en Y -> diagonal 3D = 5 casillas = 25 pies

    const porDefecto = calcularDistanciaMovimientoTS(posA, posB);
    expect(porDefecto.distanciaCasillas).toBe(5); // sqrt(3^2 + 4^2) = 5
    expect(porDefecto.distanciaPies).toBe(25);

    const sinAltura = calcularDistanciaMovimientoTS(posA, posB, null, null, { incluirAltura: false });
    expect(sinAltura.distanciaCasillas).toBe(3); // Solo Z
    expect(sinAltura.distanciaPies).toBe(15);
  });

  it("aplica multiplicadores de terreno oficiales (Normal 1x, Difícil 2x, Extremo 3x)", () => {
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 2, y: 0, z: 0 }; // 2 casillas = 10 pies base

    // 1. Normal (1x) -> 10 ft
    const normal = calcularDistanciaMovimientoTS(posA, posB, null, null, { multiplicadorTerreno: 1 });
    expect(normal.distanciaPies).toBe(10);

    // 2. Difícil D&D 5.5e (2x) -> 20 ft
    const dificil = calcularDistanciaMovimientoTS(posA, posB, null, null, { multiplicadorTerreno: 2 });
    expect(dificil.distanciaPies).toBe(20);

    // 3. Extremo (3x) -> 30 ft
    const extremo = calcularDistanciaMovimientoTS(posA, posB, null, null, { multiplicadorTerreno: 3 });
    expect(extremo.distanciaPies).toBe(30);
  });

  it("calcula distancia 3D combinada con terreno difícil y decimales precisos", () => {
    // 1 en X, 1 en Z, 1 en Y = sqrt(3) ≈ 1.732 casillas * 5 = 8.66 ft * 2 (difícil) = 17.32 ft -> 17.3 ft
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 1, y: 1, z: 1 };

    const resultado = calcularDistanciaMovimientoTS(posA, posB, null, null, { multiplicadorTerreno: 2 });
    expect(resultado.distanciaCasillas).toBeCloseTo(1.732, 2);
    expect(resultado.distanciaBruta).toBeCloseTo(17.32, 1);
    expect(resultado.distanciaPies).toBe(17.3);
  });
});

describe("calcularEstadoVelocidadDinamica", () => {
  it("calcula movimiento restante normal con velocidad base y bono de rasgos", () => {
    const estado = calcularEstadoVelocidadDinamica(30, 10, 15, null);
    expect(estado.velocidadTotal).toBe(40);
    expect(estado.movimientoGastado).toBe(15);
    expect(estado.movimientoRestante).toBe(25);
    expect(estado.agotado).toBe(false);
  });

  it("marca agotado cuando se consume todo el movimiento", () => {
    const estado = calcularEstadoVelocidadDinamica(30, 0, 30, null);
    expect(estado.movimientoRestante).toBe(0);
    expect(estado.agotado).toBe(true);
  });

  it("maneja acción de carrera / dash con movimiento máximo temporal", () => {
    // 30 base + carrera = 60
    const estado = calcularEstadoVelocidadDinamica(30, 0, 10, 60);
    expect(estado.velocidadTotal).toBe(60);
    expect(estado.movimientoGastado).toBe(10);
    expect(estado.movimientoRestante).toBe(50);
    expect(estado.esCarreraActiva).toBe(true);
  });
});
