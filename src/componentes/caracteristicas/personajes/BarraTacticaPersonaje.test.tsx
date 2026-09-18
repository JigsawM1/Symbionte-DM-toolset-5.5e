import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BarraTacticaPersonaje } from "./BarraTacticaPersonaje";

describe("BarraTacticaPersonaje - Controles tácticos y autocompletado de condiciones", () => {
  const propsBase = {
    modoTirada: "plano" as const,
    condicionesActivas: [] as string[],
    hpActual: 20,
    hpMaximo: 20,
    alCambiarModoTirada: vi.fn(),
    alEjecutarDescansoCorto: vi.fn(),
    alEjecutarDescansoLargo: vi.fn(),
    alAplicarCondicion: vi.fn(),
    alQuitarCondicion: vi.fn()
  };

  it("renderiza correctamente los botones de descanso y modo de tiradas", () => {
    const html = renderToStaticMarkup(<BarraTacticaPersonaje {...propsBase} />);

    expect(html).toContain("Corto");
    expect(html).toContain("Largo");
    expect(html).toContain("Disv");
    expect(html).toContain("Plano");
    expect(html).toContain("Vent");
  });

  it("renderiza el SelectorSugerencias con placeholder para añadir condiciones", () => {
    const html = renderToStaticMarkup(<BarraTacticaPersonaje {...propsBase} />);

    expect(html).toContain('placeholder="Añadir Condición o Estado..."');
    expect(html).toContain('title="Mostrar sugerencias"');
  });

  it("muestra 'Sin estados alterados ni efectos' cuando no hay ninguna condición activa", () => {
    const html = renderToStaticMarkup(<BarraTacticaPersonaje {...propsBase} />);

    expect(html).toContain("Sin estados alterados ni efectos");
  });

  it("renderiza chips de condiciones manuales añadidas con sus botones de remover", () => {
    const html = renderToStaticMarkup(
      <BarraTacticaPersonaje
        {...propsBase}
        condicionesActivas={["Cegado", "Envenenado"]}
      />
    );

    expect(html).toContain("Cegado");
    expect(html).toContain("Envenenado");
    expect(html).not.toContain("Sin estados alterados ni efectos");
  });

  it("renderiza chip automático de desangrándose cuando el HP está por debajo del 50%", () => {
    const html = renderToStaticMarkup(
      <BarraTacticaPersonaje
        {...propsBase}
        hpActual={9}
        hpMaximo={20}
      />
    );

    expect(html).toContain("Desangrándose");
  });

  it("renderiza chip automático de penalización por armadura sin competencia", () => {
    const html = renderToStaticMarkup(
      <BarraTacticaPersonaje
        {...propsBase}
        penalizacionArmadura={{
          sinCompetencia: true,
          armaduraNoCompetente: "Cota de Malla",
          escudoNoCompetente: null
        }}
      />
    );

    expect(html).toContain("SIN COMPETENCIA (ARMADURA)");
  });

  it("renderiza chip de concentración activa y ronda actual del combate", () => {
    const html = renderToStaticMarkup(
      <BarraTacticaPersonaje
        {...propsBase}
        rondaActual={3}
        concentracionActiva={{
          hechizoId: "hechizo-bendecir",
          nombreHechizo: "Bendecir"
        }}
      />
    );

    expect(html).toContain("Ronda 3");
    expect(html).toContain("[CON] BENDECIR");
  });
});
