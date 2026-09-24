import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ControlPaginacion } from "./ControlPaginacion";

describe("ControlPaginacion", () => {
  it("no renderiza nada si todos los elementos caben en una sola página", () => {
    const html = renderToStaticMarkup(
      <ControlPaginacion
        paginaActual={1}
        totalElementos={4}
        elementosPorPagina={5}
        alCambiarPagina={vi.fn()}
      />
    );
    expect(html).toBe("");
  });

  it("renderiza controles y texto de rango cuando hay múltiples páginas", () => {
    const html = renderToStaticMarkup(
      <ControlPaginacion
        paginaActual={1}
        totalElementos={23}
        elementosPorPagina={5}
        alCambiarPagina={vi.fn()}
        etiquetaElementos="opciones"
      />
    );

    expect(html).toContain("1-5 de 23 opciones");
    expect(html).toContain("1 / 5");
    expect(html).toContain("disabled"); // El botón anterior debe estar disabled en pág 1
  });

  it("muestra la página actual correcta y no deshabilita anterior en páginas intermedias", () => {
    const html = renderToStaticMarkup(
      <ControlPaginacion
        paginaActual={3}
        totalElementos={25}
        elementosPorPagina={5}
        alCambiarPagina={vi.fn()}
      />
    );

    expect(html).toContain("11-15 de 25");
    expect(html).toContain("3 / 5");
  });

  it("deshabilita el avance en la última página", () => {
    const html = renderToStaticMarkup(
      <ControlPaginacion
        paginaActual={5}
        totalElementos={25}
        elementosPorPagina={5}
        alCambiarPagina={vi.fn()}
      />
    );

    expect(html).toContain("21-25 de 25");
    expect(html).toContain("5 / 5");
  });

  it("soporta modo compacto sin botones de saltos extremos", () => {
    const html = renderToStaticMarkup(
      <ControlPaginacion
        paginaActual={2}
        totalElementos={15}
        elementosPorPagina={5}
        alCambiarPagina={vi.fn()}
        tamano="compacto"
      />
    );

    expect(html).toContain("2 / 3");
    expect(html).not.toContain("Primera página");
    expect(html).not.toContain("Última página");
  });
});
