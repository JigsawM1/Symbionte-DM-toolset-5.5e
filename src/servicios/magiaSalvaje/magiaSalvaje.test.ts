import { describe, it, expect } from "vitest";
import { entradas as ENTRADAS_MAGIA_SALVAJE_2024, buscarEntrada as buscarEntradaPorTirada } from "./fixtures";
import {
  formatearSobrecargaParaChat,
  solicitarPercentiles
} from "./servicioMagiaSalvaje";

describe("Módulo de Sobrecarga de Magia Salvaje (D&D 5.5 / PHB 2024)", () => {
  it("posee exactamente 25 entradas oficiales cubriendo del 1 al 100 sin huecos", () => {
    expect(ENTRADAS_MAGIA_SALVAJE_2024.length).toBe(25);

    for (let tirada = 1; tirada <= 100; tirada++) {
      const entrada = buscarEntradaPorTirada(tirada);
      expect(entrada, `La tirada ${tirada} debe encontrar una entrada`).toBeDefined();
      expect(tirada).toBeGreaterThanOrEqual(entrada!.desde);
      expect(tirada).toBeLessThanOrEqual(entrada!.hasta);
    }
  });

  it("rechaza tiradas fuera del rango 1-100", () => {
    expect(buscarEntradaPorTirada(0)).toBeUndefined();
    expect(buscarEntradaPorTirada(101)).toBeUndefined();
    expect(buscarEntradaPorTirada(-5)).toBeUndefined();
  });

  it("las subtablas oficiales poseen las opciones completas de su dado correspondiente", () => {
    const conSubtabla = ENTRADAS_MAGIA_SALVAJE_2024.flatMap(e => e.subtiradas?.filter(s => s.opciones) ?? []);
    expect(conSubtabla.length).toBe(4); // 1d4 (Aliado), 1d8 (Rareza), 1d10 (Conjuros caos), 1d6 (Milagro caos)

    for (const st of conSubtabla) {
      const caras = Number(st.formula.slice(2));
      expect(st.opciones!.length).toBe(caras);
      for (let i = 1; i <= caras; i++) {
        const op = st.opciones!.find((o) => o.numero === i);
        expect(op, `Subtabla ${st.titulo} debe contener opción ${i}`).toBeDefined();
        expect(op!.texto.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("formatea correctamente el texto de sobrecarga para el chat de TaleSpire", () => {
    const entrada = buscarEntradaPorTirada(25)!; // Destierro Astral (25-28)
    const texto = formatearSobrecargaParaChat("Raistlin", 25, entrada);
    expect(texto).toContain("SOBRECARGA DE MAGIA SALVAJE · Raistlin");
    expect(texto).toContain("Percentil: 25 (25-28) → DESTIERRO ASTRAL");
    expect(texto).toContain("Plano Astral");
    expect(texto).toContain("Duración: HASTA EL FINAL DE TU SIGUIENTE TURNO");
  });

  it("formatea subtiradas anidadas cuando aplican", () => {
    const entrada = buscarEntradaPorTirada(5)!; // Invocación de aliado (05-08)
    const texto = formatearSobrecargaParaChat("Raistlin", 6, entrada, [{ formula: "1d4", total: 2, opcionElegida: "Flumph" }]);
    expect(texto).toContain("1d4: [2] → Flumph");
  });

  it("resuelve un percentil local y encuentra la entrada correspondiente", async () => {
    const valores = [0.36, 0.66]; // 30 y 7: percentil 37.
    const res = await solicitarPercentiles(1, undefined, () => valores.shift() ?? 0);
    expect(res.tiradas).toEqual([37]);
    expect(buscarEntradaPorTirada(res.tiradas[0])?.titulo).toBe("PLANTA EN MACETA");
  });
});
