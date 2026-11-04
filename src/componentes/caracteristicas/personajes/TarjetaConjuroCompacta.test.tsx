import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TarjetaConjuroCompacta } from "./TarjetaConjuroCompacta";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import type { HechizoBase } from "@/tipos";

describe("TarjetaConjuroCompacta - Renderizado y Optimización", () => {
  const hechizoEjemplo = HECHIZOS_INICIALES.find((h) => h.nivel > 0) || HECHIZOS_INICIALES[0];
  const trucoEncontrado = HECHIZOS_INICIALES.find((h) => h.nivel === 0);
  const trucoEjemplo: HechizoBase = trucoEncontrado || {
    ...hechizoEjemplo,
    id: "h_truco_prueba",
    nombre: "Descarga de Prueba",
    nivel: 0,
    escuela: "Evocación",
    tiempoLanzamiento: "1 acción",
    alcance: "120 pies",
    duracion: "Instantáneo",
    descripcion: "Dispara un rayo de energía.",
    clases: ["Hechicero", "Mago"]
  };

  const propsBase = {
    hechizo: hechizoEjemplo,
    nombrePersonaje: "Garrick",
    nivelPersonaje: 3,
    bonoAtaqueMagico: 5,
    bonoDanoMagico: 0,
    modificadorHabilidad: 3,
    estaPreparado: true,
    alAbrirDetalleCompleto: vi.fn(),
    alLanzar: vi.fn()
  };

  it("renderiza correctamente un conjuro estándar con su botón de Lanzar y metadatos", () => {
    const html = renderToStaticMarkup(<TarjetaConjuroCompacta {...propsBase} />);

    expect(html).toContain(hechizoEjemplo.nombre);
    expect(html).toContain("Lanzar");
    expect(html).toContain(hechizoEjemplo.escuela);
  });

  it("renderiza correctamente un truco con escalado de nivel", () => {
    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={trucoEjemplo}
        nivelPersonaje={5}
      />
    );

    expect(html).toContain(trucoEjemplo.nombre);
    expect(html).toContain("Lanzar");
  });

  it("muestra badge de ritual si el hechizo es ritual", () => {
    const hechizoRitual: HechizoBase = {
      ...hechizoEjemplo,
      ritual: true
    };

    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoRitual}
      />
    );

    expect(html).toContain("tagRitual");
    expect(html).toContain("Ritual");
  });

  it("muestra badge de concentración si el hechizo requiere concentración", () => {
    const hechizoConcentracion: HechizoBase = {
      ...hechizoEjemplo,
      concentracion: true
    };

    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoConcentracion}
      />
    );

    expect(html).toContain("tagConcentracion");
  });

  it("aplica clase de concentración cuando es la concentración actual del personaje", () => {
    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        esConcentracionActual={true}
      />
    );

    expect(html).toContain("tarjetaConcentracion");
  });

  it("está memoizado con React.memo para prevenir re-renders de listas completas de conjuros", () => {
    // Verificamos que TarjetaConjuroCompacta exponga la estructura de componente memoizado de React
    expect((TarjetaConjuroCompacta as unknown as { $$typeof: symbol }).$$typeof).toBe(
      Symbol.for("react.memo")
    );
  });
});
