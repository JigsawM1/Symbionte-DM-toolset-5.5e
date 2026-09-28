import { describe, it, expect, vi, beforeEach } from "vitest";
import { ejecutarTiradaAtaqueFisico } from "./ejecutorTiradasCombate";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador, AtaquePersonajeCalculado, RasgoPersonaje, ObjetoInventario } from "@/tipos";

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

describe("ejecutorTiradasCombate - Armas con Munición (Sin Prohibición de Ataque)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ataqueArcoLargo: AtaquePersonajeCalculado = {
    id: "arco-largo-inst",
    nombre: "Arco Largo",
    tipo: "Arma",
    subtipo: "A Distancia",
    tipoAccion: "accion",
    caracteristicaUsada: "destreza",
    bonoAtaque: 5,
    dadoDano: "1d8+3",
    dadoDanoBase: "1d8",
    modificadorDano: 3,
    esDanoFijo: false,
    tipoDano: "Perforante",
    propiedades: ["Munición", "A dos manos", "Pesada"],
    tieneTiradaAtaque: true,
    requiereMunicion: true,
    municionNombre: "Flechas",
    puedeDisparar: false,
    motivoBloqueo: "No tienes un Carcaj en tu equipo para desenfundar flechas."
  };

  const crearItemInv = (nombre: string, cantidad: number, contenedor: "mochila" | "montura" = "mochila"): ObjetoInventario => ({
    idInstancia: `inv-${nombre.toLowerCase().replace(/\s+/g, "-")}`,
    idObjeto: `obj-${nombre.toLowerCase().replace(/\s+/g, "-")}`,
    nombre,
    cantidad,
    contenedor,
    equipado: false,
    sintonizado: false,
    notas: "",
    pesoLb: 1,
    categoria: nombre.toLowerCase().includes("carcaj") ? "contenedores" : "municion",
    esConsumible: !nombre.toLowerCase().includes("carcaj"),
    subcategoria: nombre.toLowerCase().includes("carcaj") ? "Contenedor" : "Munición",
    esMagico: false,
    rareza: "Común",
    equipable: false,
    sintonizacionRequerida: false
  });

  const baseArquero: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "arquero-test-1",
    nombre: "Legolas",
    clase: "Explorador",
    nivel: 3,
    caracteristicas: {
      fuerza: 10,
      destreza: 16,
      constitucion: 14,
      inteligencia: 10,
      sabiduria: 14,
      carisma: 10
    },
    inventario: []
  };

  it("cuando no tiene contenedor ni flechas, emite una advertencia pero no bloquea y lanza los dados en TaleSpire", async () => {
    const notificaciones: { mensaje: string; tipo?: string }[] = [];
    const modificarCant = vi.fn();

    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueArcoLargo,
      personajeActivo: baseArquero,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: modificarCant,
      agregarNotificacion: (mensaje, tipo) => notificaciones.push({ mensaje, tipo })
    });

    // 1. Debe haber emitido advertencia
    expect(notificaciones.length).toBe(1);
    expect(notificaciones[0].tipo).toBe("advertencia");
    expect(notificaciones[0].mensaje).toContain("No tienes un Carcaj");

    // 2. No debe haber modificado inventario (sin objetos)
    expect(modificarCant).not.toHaveBeenCalled();

    // 3. Debe haber lanzado los dados en TaleSpire
    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
    const [formula, etiqueta] = vi.mocked(lanzarDadosTaleSpire).mock.calls[0];
    expect(formula).toBe("1d20+5");
    expect(etiqueta).toContain("Ataque con Arco Largo");
  });

  it("cuando tiene Carcaj pero 0 flechas, emite advertencia de carcaj vacío y lanza los dados sin descontar", async () => {
    const ataqueConCarcajVacio: AtaquePersonajeCalculado = {
      ...ataqueArcoLargo,
      puedeDisparar: false,
      motivoBloqueo: "Tu Carcaj está vacío (0/20)."
    };

    const pjConCarcajVacio: PersonajeJugador = {
      ...baseArquero,
      inventario: [crearItemInv("Carcaj", 1), crearItemInv("Flechas", 0)]
    };

    const notificaciones: { mensaje: string; tipo?: string }[] = [];
    const modificarCant = vi.fn();

    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueConCarcajVacio,
      personajeActivo: pjConCarcajVacio,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: modificarCant,
      agregarNotificacion: (mensaje, tipo) => notificaciones.push({ mensaje, tipo })
    });

    expect(notificaciones.length).toBe(1);
    expect(notificaciones[0].tipo).toBe("advertencia");
    expect(notificaciones[0].mensaje).toContain("Tu Carcaj está vacío");
    expect(modificarCant).not.toHaveBeenCalled();
    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
  });

  it("cuando tiene Carcaj y flechas listas, descuenta 1 flecha, notifica info y lanza los dados", async () => {
    const ataqueListo: AtaquePersonajeCalculado = {
      ...ataqueArcoLargo,
      puedeDisparar: true,
      motivoBloqueo: undefined
    };

    const pjListo: PersonajeJugador = {
      ...baseArquero,
      inventario: [crearItemInv("Carcaj", 1), crearItemInv("Flechas", 20)]
    };

    const notificaciones: { mensaje: string; tipo?: string }[] = [];
    const modificarCant = vi.fn();

    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueListo,
      personajeActivo: pjListo,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: modificarCant,
      agregarNotificacion: (mensaje, tipo) => notificaciones.push({ mensaje, tipo })
    });

    // Sin advertencias de bloqueo
    expect(notificaciones.some((n) => n.tipo === "advertencia")).toBe(false);
    expect(notificaciones.some((n) => n.tipo === "info")).toBe(true);
    expect(notificaciones[0].mensaje).toContain("Has disparado 1 Flechas. Quedan 19 Flechas.");

    // Descuenta 1
    expect(modificarCant).toHaveBeenCalledTimes(1);
    expect(modificarCant).toHaveBeenCalledWith("arquero-test-1", "inv-flechas", -1);

    // Lanza dados
    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
  });

  it("cuando tiene flechas en la mochila pero no tiene Carcaj, emite advertencia de contenedor, descuenta 1 proyectil y lanza el ataque", async () => {
    const pjSinCarcajConFlechas: PersonajeJugador = {
      ...baseArquero,
      inventario: [crearItemInv("Flechas", 15)]
    };

    const notificaciones: { mensaje: string; tipo?: string }[] = [];
    const modificarCant = vi.fn();

    await ejecutarTiradaAtaqueFisico({
      ataque: ataqueArcoLargo,
      personajeActivo: pjSinCarcajConFlechas,
      statsCalculadas: null,
      baseDatosObjetos: [],
      modificarCantidadObjeto: modificarCant,
      agregarNotificacion: (mensaje, tipo) => notificaciones.push({ mensaje, tipo })
    });

    // 1. Advertencia de falta de carcaj
    expect(notificaciones.some((n) => n.tipo === "advertencia" && n.mensaje.includes("No tienes un Carcaj"))).toBe(true);

    // 2. Notificación informativa de proyectil consumido
    expect(notificaciones.some((n) => n.tipo === "info" && n.mensaje.includes("Has disparado 1 Flechas"))).toBe(true);

    // 3. Descontado 1 proyectil
    expect(modificarCant).toHaveBeenCalledWith("arquero-test-1", "inv-flechas", -1);

    // 4. Tirada ejecutada en TaleSpire
    expect(lanzarDadosTaleSpire).toHaveBeenCalledTimes(1);
  });
});

