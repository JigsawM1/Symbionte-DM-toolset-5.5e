import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChipCondicion } from "./ChipCondicion";

describe("ChipCondicion - Concentración y Efectos D&D 5.5e", () => {
  it("extrae el nombre del conjuro y muestra [CON] ESCUDO DE LA FE con estilo y tooltip 5.5e", () => {
    const html = renderToStaticMarkup(
      React.createElement(ChipCondicion, {
        nombre: "Concentración: Escudo de la Fe",
        concentracion: true
      })
    );
    expect(html).toContain("[CON] ESCUDO DE LA FE");
    expect(html).toContain("chip-condicion-concentracion");
    expect(html).toContain("Salvación de Constitución CD 10");
  });

  it("soporta formato con paréntesis Concentración (Bendición)", () => {
    const html = renderToStaticMarkup(
      React.createElement(ChipCondicion, {
        nombre: "Concentración (Bendición)",
        concentracion: true
      })
    );
    expect(html).toContain("[CON] BENDICIÓN");
    expect(html).toContain("chip-condicion-concentracion");
  });

  it("soporta condición únicamente nombrada Concentración", () => {
    const html = renderToStaticMarkup(
      React.createElement(ChipCondicion, {
        nombre: "Concentración",
        concentracion: true
      })
    );
    expect(html).toContain("[CON] CONCENTRACIÓN");
    expect(html).toContain("chip-condicion-concentracion");
  });
});
