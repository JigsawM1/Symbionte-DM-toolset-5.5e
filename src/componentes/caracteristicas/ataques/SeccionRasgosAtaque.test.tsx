import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionRasgosAtaque } from "./SeccionRasgosAtaque";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import type { RasgoAccionCombate } from "./usarCalculoAtaquesJugador";

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

describe("SeccionRasgosAtaque — Flujo Plano A + C y Cajón de Ocultos", () => {
  let mockStorage: ReturnType<typeof crearMockLocalStorage>;

  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-guerrero-test",
    nombre: "Conan",
    clase: "Guerrero",
    nivel: 3
  };

  const crearRasgoPrueba = (
    parcial: { id: string; nombre: string } & Partial<RasgoPersonaje>
  ): RasgoPersonaje => {
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
    rasgosFiltrados: rasgosFiltradosBase,
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

  it("renderiza los rasgos directamente bajo el divisor ligero Rasgos de Acción sin sub-acordeones", () => {
    const html = renderToStaticMarkup(<SeccionRasgosAtaque {...propsBase} />);

    expect(html).toContain("<section");
    expect(html).toContain('aria-label="Rasgos y habilidades tácticas"');
    expect(html).toContain("Rasgos de Acción");
    expect(html).toContain("Oleada de Acción");
    expect(html).toContain("Segundo Aliento");
    expect(html).toContain("Desviar Proyectiles");
    expect(html).toContain('title="Ocultar rasgo"');

    // Sin sub-acordeones heredados ni cajón de ocultos cuando no hay ocultos
    expect(html).not.toContain("Activables y Modos de Combate");
    expect(html).not.toContain("Rasgos Ocultos");
    expect(html).not.toContain("Mostrar todos");
  });

  it("omite el divisor Rasgos de Acción en vista filtrada cuando mostrarDivisor es false", () => {
    const html = renderToStaticMarkup(
      <SeccionRasgosAtaque {...propsBase} mostrarDivisor={false} />
    );

    expect(html).not.toContain("Rasgos de Acción");
    expect(html).toContain("Oleada de Acción");
    expect(html).toContain("Segundo Aliento");
  });

  it("inicia el cajón de Rasgos Ocultos cerrado por defecto (aria-expanded='false') y muestra botón hermano 'Mostrar todos'", () => {
    const itemOleadaOculto = {
      ...itemOleadaAccion,
      rasgo: { ...itemOleadaAccion.rasgo, oculto: true }
    };

    const htmlCerrado = renderToStaticMarkup(
      <SeccionRasgosAtaque
        {...propsBase}
        rasgosFiltrados={[itemOleadaOculto, itemSegundoAliento]}
      />
    );

    expect(htmlCerrado).toContain("Rasgos Ocultos");
    expect(htmlCerrado).toContain('aria-expanded="false"');
    expect(htmlCerrado).toContain("Mostrar todos");
    // Cerrado por defecto: no renderiza la tarjeta oculta hasta expandir
    expect(htmlCerrado).not.toContain("Oleada de Acción");
    expect(htmlCerrado).toContain("Segundo Aliento");

    // El botón de colapsar Rasgos Ocultos se cierra antes de abrir el botón hermano "Mostrar todos"
    const idxColapsoOcultos = htmlCerrado.indexOf("Rasgos Ocultos");
    const idxCierreBotonOcultos = htmlCerrado.indexOf("</button>", idxColapsoOcultos);
    const idxMostrarTodos = htmlCerrado.indexOf("Mostrar todos");
    expect(idxColapsoOcultos).toBeGreaterThan(-1);
    expect(idxCierreBotonOcultos).toBeGreaterThan(idxColapsoOcultos);
    expect(idxMostrarTodos).toBeGreaterThan(idxCierreBotonOcultos);
    expect(htmlCerrado).not.toContain('role="button"');
    expect(htmlCerrado).not.toContain("#22c55e");
  });

  it("despliega las tarjetas ocultas con botón para restaurar cuando ocultosAbiertos es true", () => {
    const itemOleadaOculto = {
      ...itemOleadaAccion,
      rasgo: { ...itemOleadaAccion.rasgo, oculto: true }
    };

    const htmlAbierto = renderToStaticMarkup(
      <SeccionRasgosAtaque
        {...propsBase}
        ocultosAbiertos={true}
        alAlternarOcultos={vi.fn()}
        rasgosFiltrados={[itemOleadaOculto, itemSegundoAliento]}
      />
    );

    expect(htmlAbierto).toContain('aria-expanded="true"');
    expect(htmlAbierto).toContain("Oleada de Acción");
    expect(htmlAbierto).toContain('title="Mostrar rasgo (restaurar a su categoría)"');
  });

  it("mantiene visible el cajón Rasgos Ocultos si todos los rasgos están ocultos para permitir desocultarlos", () => {
    const itemOleadaOculto = {
      ...itemOleadaAccion,
      rasgo: { ...itemOleadaAccion.rasgo, oculto: true }
    };

    const html = renderToStaticMarkup(
      <SeccionRasgosAtaque {...propsBase} rasgosFiltrados={[itemOleadaOculto]} />
    );

    expect(html).not.toContain("Rasgos de Acción");
    expect(html).toContain("Rasgos Ocultos");
    expect(html).toContain("Mostrar todos");
  });

  it("no renderiza nada cuando rasgosFiltrados está completamente vacío", () => {
    const html = renderToStaticMarkup(
      <SeccionRasgosAtaque {...propsBase} rasgosFiltrados={[]} />
    );

    expect(html).toBe("");
  });

  it("renderiza el divisor dedicado de Forma Salvaje separado de los rasgos de clase cuando hay una bestia activa", () => {
    const pjDruidaLobo: PersonajeJugador = {
      ...personajeBase,
      clase: "Druida",
      nivel: 2,
      formaSalvaje: {
        formasConocidasIds: ["m_lobo"],
        formaActivaId: "m_lobo",
        hpTemporalAlTransformar: 2
      },
      condicionesActivas: ["Forma salvaje"]
    };

    const rasgoLobo = crearRasgoPrueba({
      id: "rasgo_bestia_m_lobo_0_tacticas_manada",
      nombre: "Tácticas de manada",
      descripcion: "El lobo tiene ventaja en ataques con aliado cercano.",
      tipoAccion: "pasivo",
      origen: "personalizado",
      fuente: "Forma salvaje: Lobo",
      personalizado: false,
      activo: true
    });

    const rasgoFormaSalvajeClase = crearRasgoPrueba({
      id: "rasgo_cls_druida_forma_salvaje",
      nombre: "Forma salvaje",
      descripcion: "Puedes usar Forma salvaje como acción adicional.",
      tipoAccion: "accion_adicional",
      origen: "clase",
      fuente: "Druida",
      tieneUsosLimitados: true,
      usosMaximos: 2,
      usosRestantes: 1,
      personalizado: false,
      activo: true
    });

    const itemBestia: RasgoAccionCombate = {
      ...crearRasgoAccionPrueba(rasgoLobo, ["especial"]),
      esDeFormaSalvaje: true
    };
    const itemClase: RasgoAccionCombate = {
      ...crearRasgoAccionPrueba(rasgoFormaSalvajeClase, ["accionAdicional", "consumible"]),
      esDeFormaSalvaje: false
    };

    const html = renderToStaticMarkup(
      <SeccionRasgosAtaque
        {...propsBase}
        personajeActivo={pjDruidaLobo}
        rasgosFiltrados={[itemBestia, itemClase]}
      />
    );

    expect(html).toContain("Forma salvaje: Lobo");
    expect(html).toContain("Tácticas de manada");
    expect(html).toContain("Rasgos de Acción");
    expect(html).toContain("Forma salvaje");
  });
});
