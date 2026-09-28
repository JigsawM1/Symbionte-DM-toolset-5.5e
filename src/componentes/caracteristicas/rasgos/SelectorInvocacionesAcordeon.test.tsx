import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SelectorInvocacionesAcordeon } from "./SelectorInvocacionesAcordeon";
import type { SelectorRasgo, OpcionSelector } from "@/tipos/rasgos";

describe("SelectorInvocacionesAcordeon - Paginación de Invocaciones Sobrenaturales", () => {
  const generarOpcionesInvocacion = (cantidad: number): OpcionSelector[] => {
    return Array.from({ length: cantidad }, (_, i) => ({
      id: `invocacion_${i + 1}`,
      nombre: `Invocación Mística ${i + 1}`,
      descripcion: `Descripción detallada de la invocación mística ${i + 1}.`,
      nivelMinimo: 1
    }));
  };

  it("renderiza solo las primeras 6 invocaciones en la página 1 y muestra el control de paginación", () => {
    const opciones = generarOpcionesInvocacion(14);
    const selector: SelectorRasgo = {
      id: "selector_invocaciones_brujo",
      tipo: "multiple",
      visualizacion: "lista",
      etiqueta: "Invocaciones Sobrenaturales",
      maxSelecciones: 5,
      opciones,
      valorActual: opciones.map((o) => o.id) // Marcadas como aprendidas para visualizarlas en pestaña 'aprendidas' por defecto
    };

    const html = renderToStaticMarkup(
      <SelectorInvocacionesAcordeon
        selector={selector}
        nivelPersonaje={5}
        alActualizarSeleccion={vi.fn()}
      />
    );

    // Deben aparecer las primeras 6 invocaciones
    expect(html).toContain("Invocación Mística 1");
    expect(html).toContain("Invocación Mística 6");

    // NO debe aparecer la invocación 7 en la primera página
    expect(html).not.toContain("Invocación Mística 7");

    // Control de paginación debe reflejar 3 páginas (ceil(14 / 6) = 3)
    expect(html).toContain("1 / 3");
    expect(html).toContain("1-6 de 14 invocaciones");
  });

  it("no muestra el control de paginación cuando hay 6 o menos invocaciones", () => {
    const opciones = generarOpcionesInvocacion(5);
    const selector: SelectorRasgo = {
      id: "selector_invocaciones_brujo",
      tipo: "multiple",
      visualizacion: "lista",
      etiqueta: "Invocaciones Sobrenaturales",
      maxSelecciones: 5,
      opciones,
      valorActual: opciones.map((o) => o.id)
    };

    const html = renderToStaticMarkup(
      <SelectorInvocacionesAcordeon
        selector={selector}
        nivelPersonaje={5}
        alActualizarSeleccion={vi.fn()}
      />
    );

    expect(html).toContain("Invocación Mística 1");
    expect(html).toContain("Invocación Mística 5");
    // No debe existir paginador activo
    expect(html).not.toContain("1 / 1");
  });

  it("respeta la propiedad elementosPorPagina personalizada", () => {
    const opciones = generarOpcionesInvocacion(10);
    const selector: SelectorRasgo = {
      id: "selector_invocaciones_brujo",
      tipo: "multiple",
      visualizacion: "lista",
      etiqueta: "Invocaciones Sobrenaturales",
      maxSelecciones: 5,
      opciones,
      valorActual: opciones.map((o) => o.id)
    };

    const html = renderToStaticMarkup(
      <SelectorInvocacionesAcordeon
        selector={selector}
        nivelPersonaje={5}
        elementosPorPagina={4}
        alActualizarSeleccion={vi.fn()}
      />
    );

    // Con elementosPorPagina = 4, deben mostrarse las primeras 4
    expect(html).toContain("Invocación Mística 1");
    expect(html).toContain("Invocación Mística 4");
    expect(html).not.toContain("Invocación Mística 5");

    // 10 elementos / 4 = 3 páginas
    expect(html).toContain("1 / 3");
    expect(html).toContain("1-4 de 10 invocaciones");
  });

  it("en la pestaña de aprendidas solo pagina los elementos efectivamente aprendidos", () => {
    const opciones = generarOpcionesInvocacion(10);
    const selector: SelectorRasgo = {
      id: "selector_invocaciones_brujo",
      tipo: "multiple",
      visualizacion: "lista",
      etiqueta: "Invocaciones Sobrenaturales",
      maxSelecciones: 5,
      opciones,
      // Solo 2 aprendidas de 10
      valorActual: ["invocacion_1", "invocacion_2"]
    };

    const html = renderToStaticMarkup(
      <SelectorInvocacionesAcordeon
        selector={selector}
        nivelPersonaje={5}
        alActualizarSeleccion={vi.fn()}
      />
    );

    // Solo se ven las dos aprendidas
    expect(html).toContain("Invocación Mística 1");
    expect(html).toContain("Invocación Mística 2");
    expect(html).not.toContain("Invocación Mística 3");

    // Al ser 2 <= 6 elementos, no se renderiza paginador
    expect(html).not.toContain("1 / 1");
  });
});
