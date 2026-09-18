import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MetricasRapidasPersonaje } from "./MetricasRapidasPersonaje";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { InformacionCA } from "@/almacen/selectores/usarEstadoPersonajes";
import type { PersonajeJugador } from "@/tipos";

describe("MetricasRapidasPersonaje - Simetría y Tooltips de Métricas", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-metricas-test",
    nombre: "Garrick",
    ca: 15,
    velocidad: { caminar: 30, planea: false, nadar: 0, volar: 0, escalar: 0 },
    iniciativaBono: 1,
    inspiracion: false
  };

  const caMock: InformacionCA = {
    total: 15,
    base: 12,
    modDestrezaAplicado: 2,
    bonoEscudo: 0,
    bonosMagicos: 1,
    armaduraEquipadaNombre: "Cuero Tachonado",
    escudoEquipadoNombre: null,
    tipoArmadura: "Ligera",
    desglose: "Armadura de Cuero Tachonado (12) + DES (2) + Estilo Defensivo (1)"
  };

  const propsBase = {
    personaje: personajeBase,
    bonoCompetencia: 3,
    modDestreza: 2,
    claseArmadura: caMock,
    penalizacionArmadura: undefined,
    bonoVelocidad: 0,
    alTirarIniciativa: vi.fn(),
    alAlternarInspiracion: vi.fn()
  };

  it("renderiza las 5 cajas métricas con clases de simetría y tooltips", () => {
    const html = renderToStaticMarkup(<MetricasRapidasPersonaje {...propsBase} />);

    // Verifica que existan las 5 métricas
    expect(html).toContain("Clase Armadura");
    expect(html).toContain("15");
    expect(html).toContain("Iniciativa");
    expect(html).toContain("+3"); // modDestreza (2) + iniciativaBono (1) = +3
    expect(html).toContain("Velocidad");
    expect(html).toContain("30");
    expect(html).toContain("Competencia");
    expect(html).toContain("+3");
    expect(html).toContain("Insp.");

    // Verifica que los contenedores incluyan la clase para simetría visual
    expect(html).toContain("contenedorTooltipMetrica");
  });

  it("formatea la iniciativa con signo negativo cuando el modificador total es menor a 0", () => {
    const html = renderToStaticMarkup(
      <MetricasRapidasPersonaje
        {...propsBase}
        modDestreza={-2}
        personaje={{ ...personajeBase, iniciativaBono: 0 }}
      />
    );

    expect(html).toContain("-2");
  });

  it("muestra alerta de falta de competencia en armadura cuando penalizacionArmadura está activa", () => {
    const html = renderToStaticMarkup(
      <MetricasRapidasPersonaje
        {...propsBase}
        penalizacionArmadura={{
          sinCompetencia: true,
          armaduraNoCompetente: "Cota de Malla",
          escudoNoCompetente: null
        }}
      />
    );

    expect(html).toContain("alertaSinCompetenciaArmadura");
  });

  it("renderiza el botón de inspiración activa con su clase correspondiente", () => {
    const html = renderToStaticMarkup(
      <MetricasRapidasPersonaje
        {...propsBase}
        personaje={{ ...personajeBase, inspiracion: true }}
      />
    );

    expect(html).toContain("botonInspiracionActiva");
  });
});
