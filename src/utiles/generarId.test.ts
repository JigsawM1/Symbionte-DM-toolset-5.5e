import { describe, it, expect } from "vitest";
import { generarId, generarIdSlug } from "./generarId";

describe("generarId", () => {
  it("debe generar un ID con el prefijo especificado y un UUID válido", () => {
    const id = generarId("h");
    expect(id).toMatch(/^h_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

describe("generarIdSlug", () => {
  it("debe generar un slug canónico a partir de un nombre legible con tildes y espacios", () => {
    expect(generarIdSlug("h", "Bendición")).toBe("h_bendicion");
    expect(generarIdSlug("h", "Descarga sobrenatural")).toBe("h_descarga-sobrenatural");
    expect(generarIdSlug("h", "Curación rápida")).toBe("h_curacion-rapida");
  });

  it("debe ser idempotente cuando la entrada ya tiene el prefijo con guion bajo (prefijo_)", () => {
    expect(generarIdSlug("h", "h_bendicion")).toBe("h_bendicion");
    expect(generarIdSlug("h", "h_descarga-sobrenatural")).toBe("h_descarga-sobrenatural");
  });

  it("debe ser idempotente cuando la entrada ya tiene el prefijo con guion medio (prefijo-)", () => {
    expect(generarIdSlug("h", "h-bendicion")).toBe("h_bendicion");
    expect(generarIdSlug("h", "h-detectar-magia")).toBe("h_detectar-magia");
  });

  it("debe limpiar prefijos encadenados o redundantes históricos (ej. h_h-)", () => {
    expect(generarIdSlug("h", "h_h-bendicion")).toBe("h_bendicion");
    expect(generarIdSlug("h", "h_h_descarga-sobrenatural")).toBe("h_descarga-sobrenatural");
  });

  it("debe tolerar mayúsculas y espacios en blanco alrededor de la entrada prefijada", () => {
    expect(generarIdSlug("h", "  H_Bendición  ")).toBe("h_bendicion");
    expect(generarIdSlug("h", "  H-Detectar-Magia  ")).toBe("h_detectar-magia");
  });

  it("debe funcionar con otros prefijos del sistema como raza, m u o", () => {
    expect(generarIdSlug("raza", "Elfo de los bosques")).toBe("raza_elfo-de-los-bosques");
    expect(generarIdSlug("raza", "raza_elfo-de-los-bosques")).toBe("raza_elfo-de-los-bosques");
    expect(generarIdSlug("m", "m_goblin-arquero")).toBe("m_goblin-arquero");
    expect(generarIdSlug("m", "m-goblin-arquero")).toBe("m_goblin-arquero");
  });

  it("debe recurrir a generarId con fallback si el slug queda vacío", () => {
    const idVacio = generarIdSlug("h", "");
    expect(idVacio).toMatch(/^h_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const soloPrefijo = generarIdSlug("h", "h_");
    expect(soloPrefijo).toMatch(/^h_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
