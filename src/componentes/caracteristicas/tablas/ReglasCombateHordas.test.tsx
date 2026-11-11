import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReglasCombateHordas } from "./ReglasCombateHordas";
import { TablasDM } from "./TablasDM";
import { ReglasBasicas } from "./ReglasBasicas";

describe("ReglasCombateHordas y TablasDM", () => {
  it("renderiza la tabla canónica de hordas DMG con los rangos de d20 y probabilidades", () => {
    const html = renderToStaticMarkup(<ReglasCombateHordas />);

    expect(html).toContain("Tabla Canónica de Hordas (DMG)");
    expect(html).toContain("1 – 5");
    expect(html).toContain("6 – 12");
    expect(html).toContain("13 – 14");
    expect(html).toContain("15 – 16");
    expect(html).toContain("17 – 18");
    expect(html).toContain("19");
    expect(html).toContain("20");
    expect(html).toContain("21+");
    expect(html).toContain("Simulador Rápido de Impactos");
    expect(html).toContain("Directivas del Sistema 5.5e");
  });

  it("incluye la pestaña de Hordas en la barra de navegación de TablasDM", () => {
    const html = renderToStaticMarkup(<TablasDM />);

    expect(html).toContain("Hordas");
    expect(html).toContain("Combate en masa · D&amp;D 5.5e");
    expect(html).toContain("Condiciones");
    expect(html).toContain("Calculadoras");
    expect(html).toContain("Críticos y pifias");
    expect(html).toContain("Reglas básicas");
  });

  it("incluye el resumen de Combate por Hordas en la vista de ReglasBasicas", () => {
    const html = renderToStaticMarkup(<ReglasBasicas />);

    expect(html).toContain("COMBATE POR HORDAS (D&amp;D 5.5e)");
    expect(html).toContain("Tabla de Hordas DMG");
    expect(html).toContain("d20 NECESARIO (CA/CD - BONO)");
    expect(html).toContain("Ventaja / Desventaja");
  });
});
