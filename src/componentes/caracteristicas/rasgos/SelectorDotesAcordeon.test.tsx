import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SelectorDotesAcordeon } from "./SelectorDotesAcordeon";
import { obtenerOpcionesDotesParaSelector } from "@/servicios/gestorClases";
import type { SelectorRasgo } from "@/tipos/rasgos";

describe("SelectorDotesAcordeon - Resolución Declarativa de Categorías", () => {
  it("muestra la etiqueta correcta cuando la opción porta su categoría de forma explícita", () => {
    const selector: SelectorRasgo = {
      id: "selector_test_categorias",
      tipo: "unico",
      etiqueta: "Dotes",
      maxSelecciones: 1,
      opciones: [
        {
          id: "dote_custom_1",
          nombre: "Dote de Prueba Origen",
          descripcion: "Descripción",
          categoria: "origen"
        },
        {
          id: "dote_custom_2",
          nombre: "Dote de Prueba Épica",
          descripcion: "Descripción",
          categoria: "don_epico"
        },
        {
          id: "dote_custom_3",
          nombre: "Dote de Prueba Estilo",
          descripcion: "Descripción",
          categoria: "estilo_combate"
        },
        {
          id: "dote_custom_4",
          nombre: "Dote de Prueba General",
          descripcion: "Descripción",
          categoria: "general"
        }
      ],
      valorActual: []
    };

    const html = renderToStaticMarkup(
      <SelectorDotesAcordeon
        selector={selector}
        alActualizarSeleccion={vi.fn()}
      />
    );

    expect(html).toContain("Dote de Prueba Origen");
    expect(html).toContain("Origen");
    expect(html).toContain("Dote de Prueba Épica");
    expect(html).toContain("Don épico");
    expect(html).toContain("Dote de Prueba Estilo");
    expect(html).toContain("Estilo");
    expect(html).toContain("Dote de Prueba General");
    expect(html).toContain("General");
  });

  it("resuelve canónicamente dotes de origen que antes se clasificaban erróneamente como General", () => {
    const selector: SelectorRasgo = {
      id: "selector_test_origen_reales",
      tipo: "unico",
      etiqueta: "Dotes",
      maxSelecciones: 1,
      opciones: [
        // Dotes de origen reales que no estaban en la lista quemada antigua
        {
          id: "dote_duro",
          nombre: "Duro",
          descripcion: "HP extra"
        },
        {
          id: "dote_sanador",
          nombre: "Sanador",
          descripcion: "Curación con equipo médico"
        },
        {
          id: "dote_iniciado_magia_clerigo",
          nombre: "Iniciado en la Magia (Clérigo)",
          descripcion: "Trucos y conjuros"
        }
      ],
      valorActual: []
    };

    const html = renderToStaticMarkup(
      <SelectorDotesAcordeon
        selector={selector}
        alActualizarSeleccion={vi.fn()}
      />
    );

    // Todas deben mostrar Origen gracias a la resolución del compendio
    expect(html).toContain("Duro");
    expect(html).toContain("Sanador");
    expect(html).toContain("Iniciado en la Magia (Clérigo)");
    // Comprobar que el badge de categoría muestra "Origen" exactamente 3 veces
    const matchesOrigen = html.match(/>Origen<\/span>/g);
    expect(matchesOrigen?.length).toBe(3);
    expect(html).not.toContain(">General</span>");
  });

  it("obtenerOpcionesDotesParaSelector incluye la propiedad categoria en todas sus opciones", () => {
    const opciones = obtenerOpcionesDotesParaSelector();
    expect(opciones.length).toBeGreaterThan(0);

    for (const op of opciones) {
      expect(op.categoria, `La dote ${op.id} debe incluir la propiedad categoria`).toBeDefined();
      expect(["origen", "general", "estilo_combate", "don_epico", "personalizado"]).toContain(op.categoria);
    }
  });
});
