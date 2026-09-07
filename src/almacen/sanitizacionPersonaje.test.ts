import { describe, it, expect } from "vitest";
import { sanearPersonaje } from "./sanitizacion";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";

describe("sanearPersonaje", () => {
  it("debe devolver un personaje por defecto válido ante entrada null o undefined", () => {
    const resNull = sanearPersonaje(null);
    expect(resNull).toBeDefined();
    expect(resNull.id).toBeDefined();
    expect(resNull.nombre).toBe("Nuevo Personaje");
    expect(resNull.caracteristicas.fuerza).toBe(10);
    expect(resNull.salvacionesMuerte).toEqual({ exitos: 0, fallos: 0 });

    const resUndef = sanearPersonaje(undefined);
    expect(resUndef.nombre).toBe("Nuevo Personaje");
  });

  it("debe preservar los datos existentes y rellenar los campos faltantes de versiones anteriores", () => {
    const pjAntiguo = {
      id: "pj_legacy_1",
      nombre: "Thorin",
      clase: "Guerrero",
      nivel: 5,
      hpMaximo: 45,
      hpActual: 38
      // No incluye caracteristicas, bolsaMonedas, salvacionesMuerte, etc.
    };

    const saneado = sanearPersonaje(pjAntiguo);

    expect(saneado.id).toBe("pj_legacy_1");
    expect(saneado.nombre).toBe("Thorin");
    expect(saneado.clase).toBe("Guerrero");
    expect(saneado.hpMaximo).toBe(45);
    expect(saneado.hpActual).toBe(38);
    // Campos rellenados con defaults seguros
    expect(saneado.caracteristicas).toBeDefined();
    expect(saneado.caracteristicas.fuerza).toBe(10);
    expect(saneado.salvacionesMuerte).toEqual({ exitos: 0, fallos: 0 });
    expect(saneado.bolsaMonedas).toEqual({ pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 });
    expect(saneado.inventario).toEqual([]);
    expect(saneado.clases.length).toBeGreaterThan(0);
  });

  it("debe mantener inalterado un personaje completamente válido", () => {
    const pjCompleto = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_completo_1",
      nombre: "Aleron",
      clase: "Mago",
      nivel: 3,
      hpMaximo: 22,
      hpActual: 22,
      bolsaMonedas: { pc: 10, pp: 5, pe: 0, po: 50, ppt: 2 }
    };

    const saneado = sanearPersonaje(pjCompleto);
    expect(saneado.id).toBe("pj_completo_1");
    expect(saneado.nombre).toBe("Aleron");
    expect(saneado.bolsaMonedas.po).toBe(50);
  });
});
