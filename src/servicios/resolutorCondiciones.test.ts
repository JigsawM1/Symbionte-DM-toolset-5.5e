import { describe, it, expect } from "vitest";
import { obtenerDetalleCondicion } from "./resolutorCondiciones";

describe("resolutorCondiciones — Diccionario Oficial de Condiciones y Efectos", () => {
  it("debe resolver el efecto Desangrándose oficialmente registrado", () => {
    const detalle = obtenerDetalleCondicion("Desangrándose");
    expect(detalle.titulo).toBe("Desangrándose (Bloodied)");
    expect(detalle.descripcion).toContain("50%");
    expect(detalle.descripcion).toContain("automáticamente");
  });

  it("debe resolver Desangrándose insensible a mayúsculas y sin acentos (desangrandose)", () => {
    const detalleSinAcento = obtenerDetalleCondicion("desangrandose");
    expect(detalleSinAcento.titulo).toBe("Desangrándose (Bloodied)");

    const detalleMayus = obtenerDetalleCondicion("DESANGRÁNDOSE");
    expect(detalleMayus.titulo).toBe("Desangrándose (Bloodied)");

    const detalleIngles = obtenerDetalleCondicion("bloodied");
    expect(detalleIngles.titulo).toBe("Desangrándose (Bloodied)");
  });

  it("debe resolver condiciones estándar como Cegado o Derribado", () => {
    const detalleCegado = obtenerDetalleCondicion("Cegado");
    expect(detalleCegado.titulo.toLowerCase()).toContain("cegado");
    expect(detalleCegado.efectos?.length).toBeGreaterThan(0);
  });

  it("debe resolver efectos predefinidos como Bendecir o Concentración", () => {
    const detalleBendecir = obtenerDetalleCondicion("Bendecir");
    expect(detalleBendecir.titulo).toContain("Bendecir");
    expect(detalleBendecir.descripcion).toContain("1d4");
  });

  it("debe resolver Furia de los Dioses sin confundirla con Furia base", () => {
    const detalleDioses = obtenerDetalleCondicion("Furia de los Dioses");
    expect(detalleDioses.titulo).toBe("Furia de los Dioses (Rage of the Gods)");
    expect(detalleDioses.descripcion).toContain("guerrero divino");
    expect(detalleDioses.efectos).toBeDefined();
    expect(detalleDioses.efectos?.some((e) => e.toLowerCase().includes("vuelo"))).toBe(true);
    expect(detalleDioses.efectos?.some((e) => e.toLowerCase().includes("necrótico") || e.toLowerCase().includes("necrotico"))).toBe(true);

    const detalleFuriaBase = obtenerDetalleCondicion("Furia");
    expect(detalleFuriaBase.titulo).toBe("Furia (Rage)");
    expect(detalleFuriaBase.descripcion).toContain("Fuerza");
  });

  it("debe devolver un fallback coherente para efectos desconocidos", () => {
    const fallback = obtenerDetalleCondicion("EfectoMisteriosoHomebrew");
    expect(fallback.titulo).toBe("EfectoMisteriosoHomebrew");
    expect(fallback.descripcion).toContain("EfectoMisteriosoHomebrew");
  });
});
