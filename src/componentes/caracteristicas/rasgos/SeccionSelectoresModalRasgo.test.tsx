import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionSelectoresModalRasgo } from "./SeccionSelectoresModalRasgo";
import type { SelectorRasgo } from "@/tipos";

describe("SeccionSelectoresModalRasgo - Paginación en Modo Lista", () => {
  const opciones12 = Array.from({ length: 12 }, (_, i) => ({
    id: `opcion_${i + 1}`,
    nombre: `Conjuro Ritual ${i + 1}`,
    descripcion: `Descripción del ritual ${i + 1}`
  }));

  const selectorMultipleLista: SelectorRasgo = {
    id: "selector_rituales_nv1",
    tipo: "multiple",
    visualizacion: "lista",
    etiqueta: "Rituales Nivel 1",
    maxSelecciones: 3,
    opciones: opciones12,
    valorActual: ["opcion_1", "opcion_7"]
  };

  it("renderiza solo los primeros 4 elementos y muestra el control de paginación", () => {
    const html = renderToStaticMarkup(
      <SeccionSelectoresModalRasgo
        selectores={[selectorMultipleLista]}
        opcionesTrucosMago={[]}
        alActualizarSeleccion={vi.fn()}
      />
    );

    // Debe mostrar los primeros 4
    expect(html).toContain("Conjuro Ritual 1");
    expect(html).toContain("Conjuro Ritual 4");
    // NO debe mostrar el 5 en la primera página
    expect(html).not.toContain("Conjuro Ritual 5");

    // Debe mostrar el control de paginación con 3 páginas (ceil(12 / 4) = 3)
    expect(html).toContain("1 / 3");
    expect(html).toContain("1-4 de 12 opciones");
  });

  it("no muestra paginación en selectores con 4 o menos elementos", () => {
    const selectorCorto: SelectorRasgo = {
      id: "selector_corto",
      tipo: "multiple",
      visualizacion: "lista",
      etiqueta: "Opciones Pocas",
      maxSelecciones: 2,
      opciones: opciones12.slice(0, 4),
      valorActual: []
    };

    const html = renderToStaticMarkup(
      <SeccionSelectoresModalRasgo
        selectores={[selectorCorto]}
        opcionesTrucosMago={[]}
        alActualizarSeleccion={vi.fn()}
      />
    );

    expect(html).toContain("Conjuro Ritual 1");
    expect(html).toContain("Conjuro Ritual 4");
    expect(html).not.toContain("1 / 1");
  });

  it("renderiza paginación en selectores de tipo único con visualización en lista (ej. Influencia Sombría)", () => {
    const selectorUnicoLista: SelectorRasgo = {
      id: "selector_conjuro_nv1_influencia_sombria",
      tipo: "unico",
      visualizacion: "lista",
      etiqueta: "Conjuro de Nivel 1 (Ilusión o Nigromancia)",
      maxSelecciones: 1,
      opciones: opciones12,
      valorActual: []
    };

    const html = renderToStaticMarkup(
      <SeccionSelectoresModalRasgo
        selectores={[selectorUnicoLista]}
        opcionesTrucosMago={[]}
        alActualizarSeleccion={vi.fn()}
      />
    );

    // Debe mostrar los primeros 4 elementos de la lista
    expect(html).toContain("Conjuro Ritual 1");
    expect(html).toContain("Conjuro Ritual 4");
    // NO debe mostrar el 5 en la primera página
    expect(html).not.toContain("Conjuro Ritual 5");

    // Debe mostrar el control de paginación
    expect(html).toContain("1 / 3");
    expect(html).toContain("1-4 de 12 opciones");
  });
});
