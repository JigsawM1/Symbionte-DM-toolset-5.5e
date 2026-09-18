import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionRasgosAtaque } from "./SeccionRasgosAtaque";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import type { RasgoAccionCombate } from "./usarCalculoAtaquesJugador";

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

describe("SeccionRasgosAtaque - Función de Ocultar Rasgos Tácticos", () => {
  let mockStorage: ReturnType<typeof crearMockLocalStorage>;

  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-guerrero-test",
    nombre: "Conan",
    clase: "Guerrero",
    nivel: 3
  };

  const crearRasgoPrueba = (parcial: { id: string; nombre: string } & Partial<RasgoPersonaje>): RasgoPersonaje => {
    return EsquemaRasgoPersonaje.parse(parcial);
  };

  const crearRasgoAccionPrueba = (
    rasgo: RasgoPersonaje,
    categoriasCombate: ("accion" | "accionAdicional" | "reaccion" | "consumible" | "activable" | "especial")[] = ["accion"]
  ): RasgoAccionCombate => ({
    rasgo,
    categoriasCombate,
    tipoAccionCalculado: "accion",
    esConsumible: false,
    esActivable: false,
    tieneDados: Boolean(rasgo.formulaDados),
    usosRestantes: rasgo.usosRestantes ?? 1,
    usosMaximos: rasgo.usosMaximos ?? 1
  });

  const rasgoSegundoAliento = crearRasgoPrueba({
    id: "rasgo-segundo-aliento",
    nombre: "Segundo Aliento",
    descripcion: "Recuperas 1d10 + nivel de vida como acción adicional.",
    tipoAccion: "accion_adicional",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    usosRestantes: 1,
    recuperacion: "descanso_corto",
    formulaDados: "1d10+3"
  });

  const rasgoOleadaAccion = crearRasgoPrueba({
    id: "rasgo-oleada-accion",
    nombre: "Oleada de Acción",
    descripcion: "Puedes realizar una acción adicional en tu turno.",
    tipoAccion: "accion",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    usosRestantes: 1,
    recuperacion: "descanso_corto"
  });

  const rasgoDesviarProyectiles = crearRasgoPrueba({
    id: "rasgo-desviar-proyectiles",
    nombre: "Desviar Proyectiles",
    descripcion: "Usas tu reacción para reducir el daño de un ataque a distancia.",
    tipoAccion: "reaccion"
  });

  const itemSegundoAliento = crearRasgoAccionPrueba(rasgoSegundoAliento, ["accionAdicional"]);
  const itemOleadaAccion = crearRasgoAccionPrueba(rasgoOleadaAccion, ["accion"]);
  const itemDesviarProyectiles = crearRasgoAccionPrueba(rasgoDesviarProyectiles, ["reaccion"]);

  const rasgosFiltradosBase: RasgoAccionCombate[] = [
    itemOleadaAccion,
    itemSegundoAliento,
    itemDesviarProyectiles
  ];

  const propsBase = {
    personajeActivo: personajeBase,
    filtro: "todas" as const,
    rasgosFiltrados: rasgosFiltradosBase,
    rasgosAcciones: [itemOleadaAccion],
    rasgosAccionesAdicionales: [itemSegundoAliento],
    rasgosReacciones: [itemDesviarProyectiles],
    rasgosConsumibles: [],
    rasgosActivables: [],
    estaAbierta: true,
    alAlternar: vi.fn(),
    alAbrirDetalle: vi.fn(),
    alGastarUso: vi.fn(),
    alRecuperarUso: vi.fn(),
    alAlternarActivo: vi.fn(),
    obtenerBloqueoToggleRasgo: vi.fn().mockReturnValue({ bloqueado: false }),
    resolverRecursosPadre: vi.fn().mockReturnValue({})
  };

  beforeEach(() => {
    mockStorage = crearMockLocalStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  });

  it("renderiza los rasgos visibles y el botón para ocultar cuando no hay ninguno oculto", () => {
    const html = renderToStaticMarkup(<SeccionRasgosAtaque {...propsBase} />);

    expect(html).toContain("Rasgos y Habilidades Tácticas");
    expect(html).toContain("Oleada de Acción");
    expect(html).toContain("Segundo Aliento");
    expect(html).toContain("Desviar Proyectiles");

    // Botón para ocultar rasgo
    expect(html).toContain('title="Ocultar rasgo"');

    // No debe mostrar la subsección de ocultos
    expect(html).not.toContain("Rasgos Ocultos");
    expect(html).not.toContain("Mostrar todos");
  });

  it("oculta un rasgo de su categoría y lo traslada a la subsección Rasgos Ocultos cuando su ID está en localStorage", () => {
    const claveStorage = `ts_rasgos_ocultos_${personajeBase.id}`;
    mockStorage.setItem(claveStorage, JSON.stringify(["rasgo-oleada-accion"]));

    const html = renderToStaticMarkup(<SeccionRasgosAtaque {...propsBase} />);

    // La subsección de ocultos debe aparecer
    expect(html).toContain("Rasgos Ocultos");
    expect(html).toContain("Mostrar todos");

    // La tarjeta de Oleada de Acción tiene el botón para restaurar
    expect(html).toContain('title="Mostrar rasgo (restaurar a su categoría)"');

    // Las otras subcategorías con rasgos visibles siguen presentes
    expect(html).toContain("Acciones Adicionales");
    expect(html).toContain("Segundo Aliento");
    expect(html).toContain("Reacciones");
    expect(html).toContain("Desviar Proyectiles");
  });

  it("omite una subcategoría si todos sus rasgos están ocultos", () => {
    // Ocultamos el único rasgo de la categoría "Acciones" (Oleada de Acción)
    const claveStorage = `ts_rasgos_ocultos_${personajeBase.id}`;
    mockStorage.setItem(claveStorage, JSON.stringify(["rasgo-oleada-accion"]));

    const html = renderToStaticMarkup(<SeccionRasgosAtaque {...propsBase} />);

    // La subcategoría "Acciones" debe omitirse porque no tiene ningún rasgo visible
    expect(html).not.toContain("<span>Acciones</span>");

    // En cambio, Acciones Adicionales y Reacciones siguen visibles
    expect(html).toContain("Acciones Adicionales");
    expect(html).toContain("Reacciones");

    // Y Oleada de Acción está en Rasgos Ocultos
    expect(html).toContain("Rasgos Ocultos");
    expect(html).toContain("Oleada de Acción");
  });

  it("mantiene visible la sección principal si todos los rasgos están ocultos para permitir desocultarlos", () => {
    const claveStorage = `ts_rasgos_ocultos_${personajeBase.id}`;
    mockStorage.setItem(
      claveStorage,
      JSON.stringify([
        "rasgo-oleada-accion",
        "rasgo-segundo-aliento",
        "rasgo-desviar-proyectiles"
      ])
    );

    const html = renderToStaticMarkup(<SeccionRasgosAtaque {...propsBase} />);

    // La cabecera general sigue presente con conteo visible 0
    expect(html).toContain("Rasgos y Habilidades Tácticas");
    expect(html).toContain("Rasgos Ocultos");
    expect(html).toContain("Mostrar todos");

    // Ninguna subsección regular se muestra
    expect(html).not.toContain("<span>Acciones</span>");
    expect(html).not.toContain("Acciones Adicionales");
    expect(html).not.toContain("<span>Reacciones</span>");
  });

  it("funciona correctamente en modo filtrado directo (filtro !== 'todas')", () => {
    const claveStorage = `ts_rasgos_ocultos_${personajeBase.id}`;
    mockStorage.setItem(claveStorage, JSON.stringify(["rasgo-oleada-accion"]));

    const html = renderToStaticMarkup(
      <SeccionRasgosAtaque
        {...propsBase}
        filtro="accion"
        rasgosFiltrados={[itemOleadaAccion]}
      />
    );

    // Muestra la sección principal y la subsección de ocultos
    expect(html).toContain("Rasgos y Habilidades Tácticas");
    expect(html).toContain("Rasgos Ocultos");
    expect(html).toContain("Oleada de Acción");
    expect(html).toContain('title="Mostrar rasgo (restaurar a su categoría)"');
  });

  it("no renderiza nada cuando rasgosFiltrados está completamente vacío", () => {
    const html = renderToStaticMarkup(
      <SeccionRasgosAtaque
        {...propsBase}
        rasgosFiltrados={[]}
        rasgosAcciones={[]}
        rasgosAccionesAdicionales={[]}
        rasgosReacciones={[]}
      />
    );

    expect(html).toBe("");
  });

  it("respeta el estado de colapso de la sección principal (estaAbierta = false)", () => {
    const html = renderToStaticMarkup(
      <SeccionRasgosAtaque {...propsBase} estaAbierta={false} />
    );

    expect(html).toContain("Rasgos y Habilidades Tácticas");
    // Al estar colapsada, no renderiza las subsecciones internas ni tarjetas
    expect(html).not.toContain("Oleada de Acción");
    expect(html).not.toContain("Segundo Aliento");
  });
});
