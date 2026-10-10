import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PanelAccesibilidad } from "./PanelAccesibilidad";
import { PrevisualizadorAccesibilidad } from "./PrevisualizadorAccesibilidad";

describe("PanelAccesibilidad y PrevisualizadorAccesibilidad", () => {
  it("renderiza el previsualizador con los indicadores tácticos", () => {
    const html = renderToStaticMarkup(<PrevisualizadorAccesibilidad />);
    expect(html).toContain("Vista Previa de Lectura Táctica");
    expect(html).toContain("NIV 5");
    expect(html).toContain("48 / 48");
    expect(html).toContain("1d20 + 7");
  });

  it("renderiza todos los grupos de control de accesibilidad", () => {
    const html = renderToStaticMarkup(<PanelAccesibilidad />);
    expect(html).toContain("ACCESIBILIDAD Y PERSONALIZACIÓN VISUAL");
    expect(html).toContain("Tamaño de Letra");
    expect(html).toContain("Familia Tipográfica");
    expect(html).toContain("Modo de Contraste");
    expect(html).toContain("Adaptación para Daltonismo");
    expect(html).toContain("Color de Acento de la Interfaz");
    expect(html).toContain("Navegación y Lectura Guiada");
    expect(html).toContain("Restablecer por Defecto");
  });
});

