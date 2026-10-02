import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TooltipUniversal } from "./TooltipUniversal";

describe("TooltipUniversal - Comportamiento de Renderizado y Deshabilitación", () => {
  it("renderiza el contenedor y sus hijos correctamente cuando está activo", () => {
    const html = renderToStaticMarkup(
      <TooltipUniversal
        titulo="Título de Prueba"
        contenido="Contenido de Prueba"
        className="clase-personalizada"
      >
        <button type="button">Botón Hijo</button>
      </TooltipUniversal>
    );

    expect(html).toContain("Botón Hijo");
    expect(html).toContain("clase-personalizada");
  });

  it("mantiene el contenedor estructural intacto cuando está deshabilitado para evitar saltos de layout", () => {
    const htmlDeshabilitado = renderToStaticMarkup(
      <TooltipUniversal
        titulo="Título"
        contenido="Contenido"
        deshabilitado={true}
        className="clase-personalizada"
      >
        <span>Elemento Protegido</span>
      </TooltipUniversal>
    );

    // El contenedor y los hijos se mantienen
    expect(htmlDeshabilitado).toContain("Elemento Protegido");
    expect(htmlDeshabilitado).toContain("clase-personalizada");
  });

  it("no renderiza el contenido flotante estáticamente en SSR ni cuando está deshabilitado", () => {
    const html = renderToStaticMarkup(
      <TooltipUniversal
        titulo="Info Secreta"
        contenido="Detalle Privado"
        deshabilitado={true}
      >
        <div>Tarjeta</div>
      </TooltipUniversal>
    );

    expect(html).toContain("Tarjeta");
    expect(html).not.toContain("Info Secreta");
    expect(html).not.toContain("Detalle Privado");
  });
});
