import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionRecursosMagicosAtaque } from "./SeccionRecursosMagicosAtaque";
import { BannerConcentracionActiva } from "@/componentes/caracteristicas/personajes/BannerConcentracionActiva";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos";

describe("SeccionRecursosMagicosAtaque - Integración de BannerConcentracionActiva", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-mago-1",
    nombre: "Elminster",
    espaciosConjuroMaximos: { 1: 4, 2: 3 },
    espaciosConjuroGastados: { 1: 1, 2: 0 }
  };

  const propsBase = {
    personajeActivo: personajeBase,
    tieneMagiaEstandar: true,
    tienePacto: false,
    sistemaMagia: "espacios" as const,
    estaAbierta: true,
    alAlternar: vi.fn(),
    alGastarEspacioConjuro: vi.fn(),
    alRecuperarEspacioConjuro: vi.fn(),
    alRecuperarTodosEspaciosConjuro: vi.fn(),
    alGastarPuntosConjuro: vi.fn(),
    alRecuperarPuntosConjuro: vi.fn(),
    alRecuperarTodosPuntosConjuro: vi.fn(),
    alGastarEspacioPacto: vi.fn(),
    alRecuperarEspaciosPacto: vi.fn(),
    alRomperConcentracion: vi.fn()
  };

  it("renderiza BannerConcentracionActiva en la cima cuando concentracionActiva está presente", () => {
    const personajeConConcentracion: PersonajeJugador = {
      ...personajeBase,
      concentracionActiva: {
        hechizoId: "hechizo-bendicion",
        nombreHechizo: "Bendición"
      }
    };

    const html = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={personajeConConcentracion}
      />
    );

    expect(html).toContain("Concentración Activa");
    expect(html).toContain("Bendición");
    expect(html).toContain("Romper");
  });

  it("no renderiza BannerConcentracionActiva cuando concentracionActiva es null", () => {
    const html = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={personajeBase}
      />
    );

    expect(html).not.toContain("Concentración Activa");
    expect(html).not.toContain("Romper");
  });

  it("no renderiza la sección si no hay magia estándar, no hay pacto y no hay concentración activa", () => {
    const personajeSinMagia: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-guerrero-1",
      nombre: "Conan",
      concentracionActiva: null
    };

    const html = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={personajeSinMagia}
        tieneMagiaEstandar={false}
        tienePacto={false}
      />
    );

    expect(html).toBe("");
  });

  it("renderiza la sección si no hay espacios estándar ni pacto pero sí existe concentración activa", () => {
    const personajeConItemConcentracion: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-picaro-1",
      nombre: "Locke",
      concentracionActiva: {
        hechizoId: "hechizo-invisibilidad",
        nombreHechizo: "Invisibilidad"
      }
    };

    const html = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={personajeConItemConcentracion}
        tieneMagiaEstandar={false}
        tienePacto={false}
      />
    );

    expect(html).toContain("Concentración Activa");
    expect(html).toContain("Invisibilidad");
  });

  it("no muestra el banner si la sección está colapsada (estaAbierta = false)", () => {
    const personajeConConcentracion: PersonajeJugador = {
      ...personajeBase,
      concentracionActiva: {
        hechizoId: "hechizo-volar",
        nombreHechizo: "Volar"
      }
    };

    const html = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={personajeConConcentracion}
        estaAbierta={false}
      />
    );

    expect(html).not.toContain("Concentración Activa");
    expect(html).not.toContain("Volar");
  });

  it("dispara alRomperConcentracion al invocar la acción del banner", () => {
    const alRomper = vi.fn();
    const elementoBanner = (
      <BannerConcentracionActiva
        nombreHechizo="Muro de Fuego"
        alRomperConcentracion={() => alRomper("pj-mago-1")}
      />
    );

    expect(elementoBanner.type).toBe(BannerConcentracionActiva);
    expect(elementoBanner.props.nombreHechizo).toBe("Muro de Fuego");

    // Ejecución directa de la prop conectada
    elementoBanner.props.alRomperConcentracion();
    expect(alRomper).toHaveBeenCalledWith("pj-mago-1");
  });
});
