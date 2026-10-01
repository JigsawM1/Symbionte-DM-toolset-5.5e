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

  it("redondea movimientos diagonales al múltiplo de 5 pies más cercano", () => {
    // 1 casilla en X y 1 casilla en Z = sqrt(2) ≈ 1.414 casillas ≈ 7.07 pies -> 5 pies (o 10 si se redondea arriba)
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 1, y: 0, z: 1 };

    const resultado = calcularDistanciaMovimientoTS(posA, posB);
    expect(resultado.distanciaCasillas).toBeCloseTo(1.414, 2);
    expect(resultado.distanciaBruta).toBeCloseTo(7.071, 2);
    expect(resultado.distanciaPies).toBe(5); // Math.round(7.071 / 5) * 5 = 5
  });

  it("filtra micro-movimientos (jitter o rotación en el mismo lugar)", () => {
    const posA: PosicionTS = { locId: 0, x: 5.0, y: 1.0, z: 5.0 };
    const posB: PosicionTS = { locId: 0, x: 5.05, y: 1.0, z: 5.05 }; // ~0.35 pies (< 1.0 pie)

    const resultado = calcularDistanciaMovimientoTS(posA, posB);
    expect(resultado.distanciaPies).toBe(0);
    expect(resultado.distanciaBruta).toBeLessThan(1.0);
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

  it("admite incluir altura vertical cuando la opción está activa", () => {
    const posA: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const posB: PosicionTS = { locId: 0, x: 0, y: 4, z: 3 }; // 3 en Z, 4 en Y -> diagonal 3D = 5 casillas = 25 pies

    const sinAltura = calcularDistanciaMovimientoTS(posA, posB, null, null, { incluirAltura: false });
    expect(sinAltura.distanciaCasillas).toBe(3); // Solo Z
    expect(sinAltura.distanciaPies).toBe(15);

    const conAltura = calcularDistanciaMovimientoTS(posA, posB, null, null, { incluirAltura: true });
    expect(conAltura.distanciaCasillas).toBe(5); // sqrt(3^2 + 4^2) = 5
    expect(conAltura.distanciaPies).toBe(25);
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
