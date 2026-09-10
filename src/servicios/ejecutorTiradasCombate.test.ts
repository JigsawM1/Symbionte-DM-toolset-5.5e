import { describe, it, expect, vi, beforeEach } from "vitest";
import { ejecutarTiradaAtaqueFisico } from "./ejecutorTiradasCombate";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador, AtaquePersonajeCalculado, RasgoPersonaje } from "@/tipos";

// Mock del lanzador de dados para auditar las llamadas enviadas a TaleSpire
vi.mock("@/utiles/lanzadorDados", () => ({
  lanzarDadosTaleSpire: vi.fn(),
  sanitizarEtiqueta: vi.fn((s: string) => s)
}));

import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";

describe("ejecutorTiradasCombate - Tiradas con Ventaja de Ataque Temerario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ataqueFuerza: AtaquePersonajeCalculado = {
    id: "hacha-batalla-inst",
    nombre: "Hacha de Batalla",
    tipo: "Arma",
    subtipo: "Cuerpo a Cuerpo",
    tipoAccion: "accion",
    caracteristicaUsada: "fuerza",
    bonoAtaque: 5,
    dadoDano: "1d8+3",
    dadoDanoBase: "1d8",
    modificadorDano: 3,
    esDanoFijo: false,
    tipoDano: "Cortante",
    propiedades: ["Versátil"],
    tieneTiradaAtaque: true
  };

  const rasgoAtaqueTemerario: RasgoPersonaje = {
    id: "rasgo_cls_barbaro_ataque_temerario",
    nombre: "Ataque Temerario",
    descripcion: "Ventaja en tiradas de ataque con Fuerza",
    tipoAccion: "pasivo",
    esActivable: true,
    categoriaMecanica: "activable",
    condicionAlActivar: "Ataque Temerario",
    activo: false,
    origen: "clase",
    fuente: "Bárbaro",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    nivelRequerido: 2,
    personalizado: false,
    notas: ""
  };

  const basePj: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "barbaro-test-1",
    nombre: "Conan el Bárbaro",
    clase: "Bárbaro",
    nivel: 3,
    caracteristicas: {
      fuerza: 16,
      destreza: 14,
      constitucion: 16,
      inteligencia: 10,
      sabiduria: 12,
      carisma: 8
    },
    rasgos: [rasgoAtaqueTemerario],
    condicionesActivas: [],
    efectosActivos: []
  };

  it("cuando Ataque Temerario está en condicionesActivas, envía la fórmula estándar 1d20+5 y tipoTiradaForzado 'ventaja' a TaleSpire", async () => {
    const pjConCondicion: PersonajeJugador = {
      ...basePj,
      condicionesActivas: ["Ataque Temerario"]
    };

    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueFuerza,
      personajeActivo: pjConCondicion,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: vi.fn(),
      agregarNotificacion: vi.fn()
    });

    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
    const [formula, etiqueta, , , tipoTiradaForzado] = vi.mocked(lanzarDadosTaleSpire).mock.calls[0];

    // TaleSpire requiere la fórmula estándar 1d20+X y NO la sintaxis 2d20kh1
    expect(formula).toBe("1d20+5");
    expect(formula).not.toContain("kh1");
    expect(etiqueta).toContain("Ataque con Hacha de Batalla (Ventaja)");
    expect(tipoTiradaForzado).toBe("ventaja");
  });

  it("cuando Ataque Temerario está únicamente en efectosActivos (1 ronda), también otorga ventaja en TaleSpire", async () => {
    const pjConEfecto: PersonajeJugador = {
      ...basePj,
      efectosActivos: [{ id: "ef_temerario", nombre: "Ataque Temerario", expiraRonda: 2 }]
    };

    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueFuerza,
      personajeActivo: pjConEfecto,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: vi.fn(),
      agregarNotificacion: vi.fn()
    });

    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
    const [formula, etiqueta, , , tipoTiradaForzado] = vi.mocked(lanzarDadosTaleSpire).mock.calls[0];

    expect(formula).toBe("1d20+5");
    expect(etiqueta).toContain("(Ventaja)");
    expect(tipoTiradaForzado).toBe("ventaja");
  });

  it("cuando el rasgo Ataque Temerario está conmutado activo en la ficha, otorga ventaja en TaleSpire", async () => {
    const pjConRasgoActivo: PersonajeJugador = {
      ...basePj,
      rasgos: basePj.rasgos.map((r) =>
        r.id === "rasgo_cls_barbaro_ataque_temerario" ? { ...r, activo: true } : r
      )
    };

    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueFuerza,
      personajeActivo: pjConRasgoActivo,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: vi.fn(),
      agregarNotificacion: vi.fn()
    });

    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
    const [formula, etiqueta, , , tipoTiradaForzado] = vi.mocked(lanzarDadosTaleSpire).mock.calls[0];

    expect(formula).toBe("1d20+5");
    expect(etiqueta).toContain("(Ventaja)");
    expect(tipoTiradaForzado).toBe("ventaja");
  });

  it("cuando Golpe Brutal está activo junto a Ataque Temerario, renuncia a la ventaja a cambio de daño y la tirada se envía como plano", async () => {
    const rasgoGolpeBrutal: RasgoPersonaje = {
      id: "rasgo_cls_barbaro_golpe_brutal",
      nombre: "Golpe Brutal",
      descripcion: "Renuncia a la ventaja a cambio de 1d10 extra",
      tipoAccion: "pasivo",
      esActivable: true,
      categoriaMecanica: "activable",
      activo: true,
      origen: "clase",
      fuente: "Bárbaro",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      nivelRequerido: 9,
      personalizado: false,
      notas: ""
    };

    const pjConGolpeBrutal: PersonajeJugador = {
      ...basePj,
      condicionesActivas: ["Ataque Temerario"],
      rasgos: [...basePj.rasgos, rasgoGolpeBrutal]
    };

    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueFuerza,
      personajeActivo: pjConGolpeBrutal,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: vi.fn(),
      agregarNotificacion: vi.fn()
    });

    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
    const [formula, etiqueta, , , tipoTiradaForzado] = vi.mocked(lanzarDadosTaleSpire).mock.calls[0];

    expect(formula).toBe("1d20+5");
    expect(etiqueta).toContain("Golpe Brutal (Renuncia a ventaja)");
    expect(tipoTiradaForzado).toBeUndefined(); // Modo plano
  });

  it("en una tirada normal sin condiciones, envía la tirada plana estándar", async () => {
    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueFuerza,
      personajeActivo: basePj,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: vi.fn(),
      agregarNotificacion: vi.fn()
    });

    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
    const [formula, etiqueta, , , tipoTiradaForzado] = vi.mocked(lanzarDadosTaleSpire).mock.calls[0];

    expect(formula).toBe("1d20+5");
    expect(etiqueta).not.toContain("(Ventaja)");
    expect(tipoTiradaForzado).toBeUndefined();
  });
});
