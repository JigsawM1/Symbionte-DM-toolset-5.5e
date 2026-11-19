import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionRecursosMagicosAtaque } from "./SeccionRecursosMagicosAtaque";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { logger } from "@/utiles/logger";
import type { PersonajeJugador } from "@/tipos";

const crearMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => (key in store ? store[key] : null),
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    }
  };
};

interface PropsElementoConClick {
  children?: React.ReactNode;
  title?: string;
  onClick?: () => void;
}

function buscarElementoPorTitulo(
  nodo: React.ReactNode,
  titulo: string
): React.ReactElement<PropsElementoConClick> | null {
  if (Array.isArray(nodo)) {
    for (const hijo of nodo) {
      const encontrado = buscarElementoPorTitulo(hijo, titulo);
      if (encontrado) return encontrado;
    }
    return null;
  }

  if (!React.isValidElement<PropsElementoConClick>(nodo)) {
    return null;
  }

  if (nodo.props.title === titulo) {
    return nodo;
  }

  return buscarElementoPorTitulo(nodo.props.children, titulo);
}

describe("SeccionRecursosMagicosAtaque - Barra-Puente Compacta de Recursos Mágicos", () => {
  const descriptorOriginalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let mockStorage: ReturnType<typeof crearMockLocalStorage>;

  beforeEach(() => {
    mockStorage = crearMockLocalStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (descriptorOriginalStorage) {
      Object.defineProperty(globalThis, "localStorage", descriptorOriginalStorage);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-mago-1",
    nombre: "Elminster",
    espaciosConjuroMaximos: { 1: 4, 2: 3 },
    espaciosConjuroGastados: { 1: 1, 2: 0 }
  };

  const propsBase = {
    personajeActivo: personajeBase,
    espaciosConjuroMaximos: personajeBase.espaciosConjuroMaximos,
    tienePacto: false,
    sistemaMagia: "espacios" as const,
    alRomperConcentracion: vi.fn(),
    alIrAMagia: vi.fn()
  };

  it("renderiza las micro-pills de ranuras disponibles y el acceso directo a Magia", () => {
    const html = renderToStaticMarkup(<SeccionRecursosMagicosAtaque {...propsBase} />);

    expect(html).toContain("Estado Mágico");
    expect(html).toContain('data-concentracion="false"');
    expect(html).toContain("Nv.1 (3/4)");
    expect(html).toContain("Nv.2 (3/3)");
    expect(html).toContain('data-agotado="false"');
    expect(html).not.toContain('data-agotado="true"');
    expect(html).toContain("Ir a Magia");
    expect(html).not.toContain("Romper");
  });

  it("muestra el resumen si los únicos espacios son adicionales", () => {
    const html = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={{ ...personajeBase, espaciosConjuroMaximos: {}, espaciosConjuroAdicionales: { 3: 1 } }}
        espaciosConjuroMaximos={{ 3: 1 }}
      />
    );
    expect(html).toContain("Nv.3 (1/1)");
    expect(html).not.toContain("Nv.1");
  });

  it("marca con data-agotado=\"true\" las micro-pills con recursos agotados (0/X)", () => {
    const personajeParcialmenteAgotado: PersonajeJugador = {
      ...personajeBase,
      espaciosConjuroMaximos: { 1: 4, 2: 3 },
      espaciosConjuroGastados: { 1: 1, 2: 3 },
      espaciosPactoMaximos: 2,
      espaciosPactoGastados: 2,
      nivelEspacioPacto: 3
    };

    const html = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={personajeParcialmenteAgotado}
        tienePacto={true}
      />
    );

    expect(html).toMatch(/data-agotado="false"[^>]*>Nv\.1 \(3\/4\)</);
    expect(html).toMatch(/data-agotado="true"[^>]*>Nv\.2 \(0\/3\)</);
    expect(html).toMatch(/data-agotado="true"[^>]*>Pacto Nv\.3 \(0\/2\)</);

    const htmlPuntosAgotados = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={{
          ...personajeBase,
          puntosConjuroMaximos: 10,
          puntosConjuroGastados: 10
        }}
        sistemaMagia="puntos"
      />
    );

    expect(htmlPuntosAgotados).toMatch(/data-agotado="true"[^>]*>Puntos \(0\/10\)</);
  });

  it("muestra la concentración activa en oro con botón Romper cuando concentracionActiva está presente", () => {
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

    expect(html).toContain('data-concentracion="true"');
    expect(html).toContain("var(--pj-texto-oro)");
    expect(html).toContain("Conc.:");
    expect(html).toContain("Bendición");
    expect(html).toContain("Romper");
    expect(html).toContain("Ir a Magia");
  });

  it("no renderiza nada si no hay magia estándar, ni pacto ni concentración activa", () => {
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
        espaciosConjuroMaximos={{}}
        tienePacto={false}
      />
    );

    expect(html).toBe("");
  });

  it("renderiza la barra-puente si no hay espacios estándar ni pacto pero sí concentración activa", () => {
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
        espaciosConjuroMaximos={{}}
        tienePacto={false}
      />
    );

    expect(html).toContain('data-concentracion="true"');
    expect(html).toContain("Invisibilidad");
    expect(html).toContain("Romper");
    expect(html).toContain("Ir a Magia");
  });

  it("resume puntos de conjuro y espacios de pacto cuando corresponden", () => {
    const brujoPuntos: PersonajeJugador = {
      ...personajeBase,
      puntosConjuroMaximos: 17,
      puntosConjuroGastados: 5,
      espaciosPactoMaximos: 2,
      espaciosPactoGastados: 1,
      nivelEspacioPacto: 3
    };

    const html = renderToStaticMarkup(
      <SeccionRecursosMagicosAtaque
        {...propsBase}
        personajeActivo={brujoPuntos}
        sistemaMagia="puntos"
        tienePacto={true}
      />
    );

    expect(html).toContain("Puntos (12/17)");
    expect(html).toContain("Pacto Nv.3 (1/2)");
  });

  it("al pulsar Ir a Magia guarda \"lanzamiento\" en ts_magia_subpestana antes de invocar alIrAMagia", () => {
    localStorage.setItem("ts_magia_subpestana", JSON.stringify("compendio"));

    let valorEnLocalStorageDuranteCallback: string | null = null;
    const alIrAMagia = vi.fn(() => {
      valorEnLocalStorageDuranteCallback = localStorage.getItem("ts_magia_subpestana");
    });

    const arbol = SeccionRecursosMagicosAtaque({
      ...propsBase,
      alIrAMagia
    });
    const botonIrAMagia = buscarElementoPorTitulo(
      arbol,
      "Abrir la pestaña Magia para gestionar ranuras y conjuros"
    );

    expect(botonIrAMagia).not.toBeNull();
    botonIrAMagia?.props.onClick?.();

    expect(alIrAMagia).toHaveBeenCalledTimes(1);
    expect(valorEnLocalStorageDuranteCallback).toBe(JSON.stringify("lanzamiento"));
    expect(localStorage.getItem("ts_magia_subpestana")).toBe(JSON.stringify("lanzamiento"));
  });

  it("usa establecerPestaña(\"magia\") y registra advertencia si localStorage falla al pulsar Ir a Magia", () => {
    const errorStorage = new Error("Cuota excedida");
    vi.spyOn(mockStorage, "setItem").mockImplementation(() => {
      throw errorStorage;
    });
    const espiaWarn = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const espiaPestana = vi
      .spyOn(usarAlmacenDM.getState(), "establecerPestaña")
      .mockImplementation(() => {});

    const arbol = SeccionRecursosMagicosAtaque({
      ...propsBase,
      alIrAMagia: undefined
    });
    const botonIrAMagia = buscarElementoPorTitulo(
      arbol,
      "Abrir la pestaña Magia para gestionar ranuras y conjuros"
    );

    botonIrAMagia?.props.onClick?.();

    expect(espiaWarn).toHaveBeenCalledTimes(1);
    expect(espiaPestana).toHaveBeenCalledWith("magia");
  });
});
