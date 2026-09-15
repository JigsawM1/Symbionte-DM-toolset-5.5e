import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SelectorSugerencias } from "./SelectorSugerencias";

describe("SelectorSugerencias - Debounce y Filtrado D&D 5.5e", () => {
  const opcionesEjemplo = [
    { valor: "pocion-curacion", etiqueta: "Poción de Curación", grupo: "Pociones" },
    { valor: "pocion-invisibilidad", etiqueta: "Poción de Invisibilidad", grupo: "Pociones" },
    { valor: "espada-larga", etiqueta: "Espada Larga", grupo: "Armas" },
    { valor: "pergamino-fuego", etiqueta: "Pergamino de Bola de Fuego", grupo: "Pergaminos" }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza el componente con placeholder y sin errores", () => {
    const alCambiar = vi.fn();
    const html = renderToStaticMarkup(
      <SelectorSugerencias
        valor=""
        alCambiar={alCambiar}
        opciones={opcionesEjemplo}
        placeholder="Buscar objeto..."
      />
    );

    expect(html).toContain('placeholder="Buscar objeto..."');
    expect(html).toContain('spellcheck="false"');
  });

  it("renderiza con el valor seleccionado inicial", () => {
    const alCambiar = vi.fn();
    const html = renderToStaticMarkup(
      <SelectorSugerencias
        valor="Espada Larga"
        alCambiar={alCambiar}
        opciones={opcionesEjemplo}
      />
    );

    expect(html).toContain('value="Espada Larga"');
  });

  it("acepta configuración personalizada de tiempoEsperaDebounce", () => {
    const alCambiar = vi.fn();
    const elemento = (
      <SelectorSugerencias
        valor="Curación"
        alCambiar={alCambiar}
        opciones={opcionesEjemplo}
        tiempoEsperaDebounce={300}
      />
    );
    expect(elemento.props.tiempoEsperaDebounce).toBe(300);
  });
});
