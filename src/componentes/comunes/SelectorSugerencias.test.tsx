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

  it("acepta callback alSeleccionar y opciones con clave", () => {
    const alCambiar = vi.fn();
    const alSeleccionar = vi.fn();
    const opcionesConClave = [
      { clave: "item-1", valor: "Cimatarra", etiqueta: "Cimatarra", grupo: "Armas", subtitulo: "Arma • Común" }
    ];

    const elemento = (
      <SelectorSugerencias
        valor="Cimatarra"
        alCambiar={alCambiar}
        alSeleccionar={alSeleccionar}
        opciones={opcionesConClave}
      />
    );

    expect(elemento.props.alSeleccionar).toBe(alSeleccionar);
    const html = renderToStaticMarkup(elemento);
    expect(html).toContain('value="Cimatarra"');
  });

  it("renderiza botón para mostrar sugerencias y estado inicial no estancado", () => {
    const alCambiar = vi.fn();
    const html = renderToStaticMarkup(
      <SelectorSugerencias
        valor=""
        alCambiar={alCambiar}
        opciones={opcionesEjemplo}
      />
    );

    expect(html).toContain('title="Mostrar sugerencias"');
    expect(html).toContain('type="button"');
  });

  it("resetea término de búsqueda y permite re-renderizar sin filtrar todas las opciones cuando el valor es vacío", () => {
    const alCambiar = vi.fn();
    const alSeleccionar = vi.fn();

    const htmlVacio = renderToStaticMarkup(
      <SelectorSugerencias
        valor=""
        alCambiar={alCambiar}
        alSeleccionar={alSeleccionar}
        opciones={opcionesEjemplo}
        placeholder="Añadir Condición o Estado..."
      />
    );

    expect(htmlVacio).toContain('placeholder="Añadir Condición o Estado..."');
    expect(htmlVacio).toContain('value=""');
  });
});
