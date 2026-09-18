import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionAtaquesMagicos } from "./SeccionAtaquesMagicos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import type { ConjuroAccionElemento } from "./usarCalculoAtaquesJugador";

// Mock de localStorage para entorno Node de Vitest
const crearMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

describe("SeccionAtaquesMagicos - Función de Ocultar Conjuros", () => {
  let mockStorage: ReturnType<typeof crearMockLocalStorage>;

  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-mago-test",
    nombre: "Elminster",
    espaciosConjuroMaximos: { 1: 4, 2: 3 },
    espaciosConjuroGastados: { 1: 0, 2: 0 }
  };

  const trucoDescarga: HechizoBase = {
    id: "hechizo-descarga-fuego",
    nombre: "Descarga de Fuego",
    nivel: 0,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "120 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Lanzas una mota de fuego."
  };

  const conjuroMisil: HechizoBase = {
    id: "hechizo-proyectil-magico",
    nombre: "Proyectil Mágico",
    nivel: 1,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "120 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Creas tres dardos brillantes de fuerza mágica."
  };

  const conjuroEscudo: HechizoBase = {
    id: "hechizo-escudo",
    nombre: "Escudo",
    nivel: 1,
    escuela: "Abjuracion",
    tiempoLanzamiento: "1 Reaccion",
    alcance: "Personal",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "1 ronda",
    concentracion: false,
    ritual: false,
    descripcion: "Una barrera invisible de fuerza mágica te protege."
  };

  const conjurosFiltradosBase: ConjuroAccionElemento[] = [
    { hechizo: trucoDescarga, tipoAccion: "accion" },
    { hechizo: conjuroMisil, tipoAccion: "accion" },
    { hechizo: conjuroEscudo, tipoAccion: "reaccion" }
  ];

  const conjurosPorNivelBase: Record<number, ConjuroAccionElemento[]> = {
    0: [{ hechizo: trucoDescarga, tipoAccion: "accion" }],
    1: [
      { hechizo: conjuroMisil, tipoAccion: "accion" },
      { hechizo: conjuroEscudo, tipoAccion: "reaccion" }
    ],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: []
  };

  const propsBase = {
    conjurosFiltrados: conjurosFiltradosBase,
    conjurosPorNivel: conjurosPorNivelBase,
    seccionesAbiertas: {
      magicos: true,
      magicos_nv_0: true,
      magicos_nv_1: true,
      magicos_ocultos: true
    },
    alAlternarSeccion: vi.fn(),
    personajeActivo: personajeBase,
    bonoAtaqueMagico: 5,
    tienePacto: false,
    sistemaMagia: "espacios" as const,
    estaBloqueadoPorArmadura: false,
    esHechizoDeSubclase: vi.fn().mockReturnValue(false),
    alAbrirDetalle: vi.fn(),
    alLanzar: vi.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    mockStorage = crearMockLocalStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  });

  it("renderiza conjuros visibles y el botón para ocultar cuando no hay conjuros ocultos", () => {
    const html = renderToStaticMarkup(<SeccionAtaquesMagicos {...propsBase} />);

    // Título y badge general con los 3 conjuros visibles
    expect(html).toContain("Conjuros y Acciones Mágicas");
    expect(html).toContain("Descarga de Fuego");
    expect(html).toContain("Proyectil Mágico");
    expect(html).toContain("Escudo");

    // Botón para ocultar conjuro
    expect(html).toContain('title="Ocultar conjuro"');

    // No debe renderizar la subsección de ocultos
    expect(html).not.toContain("Conjuros Ocultos");
    expect(html).not.toContain("Mostrar todos");
  });

  it("oculta un conjuro de su nivel y lo coloca en la subsección Conjuros Ocultos cuando su ID está en localStorage", () => {
    // Marcamos "Proyectil Mágico" como oculto
    const claveStorage = `ts_conjuros_ocultos_${personajeBase.id}`;
    mockStorage.setItem(claveStorage, JSON.stringify(["hechizo-proyectil-magico"]));

    const html = renderToStaticMarkup(<SeccionAtaquesMagicos {...propsBase} />);

    // La subsección de ocultos debe aparecer
    expect(html).toContain("Conjuros Ocultos");
    expect(html).toContain("Mostrar todos");

    // "Descarga de Fuego" y "Escudo" siguen en sus niveles visibles
    expect(html).toContain("Trucos Listos");
    expect(html).toContain("Nivel 1");

    // En la tarjeta de Proyectil Mágico debe tener el botón para restaurar
    expect(html).toContain('title="Mostrar conjuro (restaurar a su nivel)"');
  });

  it("omite la cabecera de nivel si todos los conjuros de dicho nivel están ocultos", () => {
    // Ocultamos ambos conjuros de nivel 1
    const claveStorage = `ts_conjuros_ocultos_${personajeBase.id}`;
    mockStorage.setItem(
      claveStorage,
      JSON.stringify(["hechizo-proyectil-magico", "hechizo-escudo"])
    );

    const html = renderToStaticMarkup(<SeccionAtaquesMagicos {...propsBase} />);

    // El truco de nivel 0 sigue visible
    expect(html).toContain("Trucos Listos");
    expect(html).toContain("Descarga de Fuego");

    // La cabecera "Nivel 1" no debe renderizarse porque itemsVisibles es 0
    expect(html).not.toContain("Nivel 1</span>");

    // Ambos conjuros de nivel 1 deben estar en la subsección de ocultos
    expect(html).toContain("Conjuros Ocultos");
    expect(html).toContain("Proyectil Mágico");
    expect(html).toContain("Escudo");
  });

  it("mantiene visible la sección principal si todos los conjuros están ocultos para permitir desocultarlos", () => {
    // Ocultamos todos los conjuros
    const claveStorage = `ts_conjuros_ocultos_${personajeBase.id}`;
    mockStorage.setItem(
      claveStorage,
      JSON.stringify([
        "hechizo-descarga-fuego",
        "hechizo-proyectil-magico",
        "hechizo-escudo"
      ])
    );

    const html = renderToStaticMarkup(<SeccionAtaquesMagicos {...propsBase} />);

    // La cabecera general sigue presente con conteo visible 0
    expect(html).toContain("Conjuros y Acciones Mágicas");
    expect(html).toContain("Conjuros Ocultos");
    expect(html).toContain("Mostrar todos");

    // Ningún nivel regular se muestra
    expect(html).not.toContain("Trucos Listos");
    expect(html).not.toContain("Nivel 1</span>");
  });

  it("no renderiza nada cuando conjurosFiltrados está completamente vacío", () => {
    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        conjurosFiltrados={[]}
        conjurosPorNivel={{}}
      />
    );

    expect(html).toBe("");
  });

  it("respeta el estado de colapso general (seccionesAbiertas.magicos = false)", () => {
    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        seccionesAbiertas={{ ...propsBase.seccionesAbiertas, magicos: false }}
      />
    );

    expect(html).toContain("Conjuros y Acciones Mágicas");
    // Al estar cerrada la sección principal, no se renderizan ni trucos ni conjuros
    expect(html).not.toContain("Trucos Listos");
    expect(html).not.toContain("Descarga de Fuego");
  });

  it("respeta el estado de colapso de la subsección de ocultos (seccionesAbiertas.magicos_ocultos = false)", () => {
    const claveStorage = `ts_conjuros_ocultos_${personajeBase.id}`;
    mockStorage.setItem(claveStorage, JSON.stringify(["hechizo-escudo"]));

    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        seccionesAbiertas={{ ...propsBase.seccionesAbiertas, magicos_ocultos: false }}
      />
    );

    // Muestra la cabecera de ocultos pero no la tarjeta interna de Escudo
    expect(html).toContain("Conjuros Ocultos");
    expect(html).not.toContain("Una barrera invisible de fuerza mágica te protege.");
  });
});
