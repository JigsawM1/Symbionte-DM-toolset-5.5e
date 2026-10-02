import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TablaProgresionRasgo } from "./TablaProgresionRasgo";
import type { TablaEscaladoRasgo } from "@/tipos/rasgos";

describe("TablaProgresionRasgo - Indicador de nivel actual (badge Actual y filaNivelActual)", () => {
  const tablaDosColumnasNivel: TablaEscaladoRasgo = {
    columnas: ["Nivel", "Dado de Artes marciales"],
    filas: [
      { nivel: 1, valores: ["1d6"] },
      { nivel: 5, valores: ["1d8"] },
      { nivel: 10, valores: ["1d10"] },
      { nivel: 17, valores: ["1d12"] }
    ],
    notaPie: "Cada nivel reemplaza al anterior"
  };

  it("resalta con filaNivelActual y renderiza el badge 'Actual' en tablas de 2 columnas de nivel", () => {
    const html = renderToStaticMarkup(
      <TablaProgresionRasgo tabla={tablaDosColumnasNivel} nivelPersonaje={5} />
    );

    expect(html).toContain("Actual");
    expect(html).toContain("1d8");
    // Verificar que la clase filaNivelActual está presente
    expect(html).toContain("filaNivelActual");
  });

  it("selecciona la fila alcanzada más alta menor o igual al nivel del personaje (ej. nivel 7 selecciona nivel 5)", () => {
    const html = renderToStaticMarkup(
      <TablaProgresionRasgo tabla={tablaDosColumnasNivel} nivelPersonaje={7} />
    );

    expect(html).toContain("Actual");
    // La fila de nivel 5 debe tener el badge
    expect(html).toMatch(/1d8.*Actual/s);
    // La fila de nivel 10 NO debe tener el badge Actual
    expect(html).not.toMatch(/1d10.*Actual/s);
  });

  it("resalta correctamente a nivel 1 en tablas de progresión que inician en nivel 1", () => {
    const html = renderToStaticMarkup(
      <TablaProgresionRasgo tabla={tablaDosColumnasNivel} nivelPersonaje={1} />
    );

    expect(html).toContain("Actual");
    expect(html).toMatch(/1d6.*Actual/s);
  });

  it("muestra el badge 'Actual' en tablas de conjuros de subclase de dos columnas", () => {
    const tablaConjuros: TablaEscaladoRasgo = {
      columnas: ["Nivel de explorador", "Conjuros"],
      filas: [
        { nivel: 3, valores: ["Disfrazarse"] },
        { nivel: 5, valores: ["Truco de la cuerda"] },
        { nivel: 9, valores: ["Miedo"] }
      ]
    };

    const html = renderToStaticMarkup(
      <TablaProgresionRasgo tabla={tablaConjuros} nivelPersonaje={5} />
    );

    expect(html).toContain("Actual");
    expect(html).toMatch(/Truco de la cuerda.*Actual/s);
  });

  it("muestra el badge 'Actual' en tablas de tres o más columnas", () => {
    const tablaTresColumnas: TablaEscaladoRasgo = {
      columnas: ["Nivel", "Furias", "Daño de furia"],
      filas: [
        { nivel: 1, valores: ["2", "+2"] },
        { nivel: 3, valores: ["3", "+2"] },
        { nivel: 6, valores: ["4", "+2"] }
      ]
    };

    const html = renderToStaticMarkup(
      <TablaProgresionRasgo tabla={tablaTresColumnas} nivelPersonaje={3} />
    );

    expect(html).toContain("Actual");
    expect(html).toContain("filaNivelActual");
  });

  it("NO marca 'Actual' en tablas descriptivas o aleatorias que no representan niveles (ej. 1d6)", () => {
    const tablaTiradaDados: TablaEscaladoRasgo = {
      columnas: ["1d6", "Dádiva"],
      filas: [
        { nivel: 1, valores: ["Efecto 1"] },
        { nivel: 2, valores: ["Efecto 2"] },
        { nivel: 3, valores: ["Efecto 3"] }
      ]
    };

    const html = renderToStaticMarkup(
      <TablaProgresionRasgo tabla={tablaTiradaDados} nivelPersonaje={3} />
    );

    // No debe contener el badge Actual ni la clase filaNivelActual
    expect(html).not.toContain("Actual");
    expect(html).not.toContain("filaNivelActual");
  });

  it("no muestra 'Actual' si nivelPersonaje no está definido o es inferior al primer nivel de la tabla", () => {
    const htmlSinNivel = renderToStaticMarkup(
      <TablaProgresionRasgo tabla={tablaDosColumnasNivel} nivelPersonaje={undefined} />
    );
    expect(htmlSinNivel).not.toContain("Actual");
    expect(htmlSinNivel).not.toContain("filaNivelActual");

    const tablaNivel2: TablaEscaladoRasgo = {
      columnas: ["Nivel", "Bonificación"],
      filas: [{ nivel: 2, valores: ["+10 pies"] }]
    };
    const htmlNivelBajo = renderToStaticMarkup(
      <TablaProgresionRasgo tabla={tablaNivel2} nivelPersonaje={1} />
    );
    expect(htmlNivelBajo).not.toContain("Actual");
    expect(htmlNivelBajo).not.toContain("filaNivelActual");
  });
});
