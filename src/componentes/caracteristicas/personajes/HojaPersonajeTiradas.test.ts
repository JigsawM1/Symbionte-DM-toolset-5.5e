import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  normalizarFormulaDados,
  sanitizarEtiqueta,
  crearDescriptoresManualmente,
  lanzarDadosTaleSpire,
  procesarResultadosDadosTaleSpire
} from "@/utiles/lanzadorDados";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ts } from "@/utiles/TaleSpireAdapter";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { DescriptorTirada } from "@/tipos/talespire";

describe("Tiradas de Hoja de Personaje - Convención TaleSpire y Combat Tracker", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      tipoTirada: "plano",
      colaIniciativa: [],
      personajes: [
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "pj-test-1",
          nombre: "Valeros el Bravo",
          jugador: "Alex",
          clase: "Guerrero",
          subclase: "Campeón",
          nivel: 3,
          especie: "Humano",
          trasfondo: "Soldado",
          alineacion: "Neutral Bueno",
          experiencia: 900,
          caracteristicas: { fuerza: 16, destreza: 14, constitucion: 14, inteligencia: 10, sabiduria: 12, carisma: 8 },
          competenciasSalvacion: { fuerza: true, destreza: false, constitucion: true, inteligencia: false, sabiduria: false, carisma: false },
          gradosHabilidades: { ...PERSONAJE_POR_DEFECTO.gradosHabilidades, atletismo: "competente", sigilo: "medio", percepcion: "pericia" },
          hpMaximoBase: 28,
          hpMaximo: 28,
          hpActual: 28,
          dadosGolpeTotal: 3,
          dadosGolpeRestantes: 3,
          ca: 18,
          caNotas: "Placas y Escudo",
          competenciasArmas: "Marciales",
          competenciasArmaduras: "Todas"
        }
      ],
      idPersonajeActivo: "pj-test-1"
    });
  });


  it("normaliza y sanitiza correctamente la fórmula de prueba de característica", () => {
    const etiqueta = "Prueba de FUE";
    const formula = `!${sanitizarEtiqueta(etiqueta)}:1d20+3`;
    const formulaNormalizada = normalizarFormulaDados(formula);

    expect(formulaNormalizada).toBe("Prueba de FUE:1d20+3");
  });

  it("normaliza y sanitiza correctamente la fórmula de salvación con tilde", () => {
    const etiqueta = "Salvación de CON";
    const formula = `!${sanitizarEtiqueta(etiqueta)}:1d20+4`;
    const formulaNormalizada = normalizarFormulaDados(formula);

    expect(formulaNormalizada).toBe("Salvacion de CON:1d20+4");
  });

  it("normaliza y sanitiza correctamente la fórmula de habilidad", () => {
    const etiqueta = "Prueba de Sigilo";
    const formula = `!${sanitizarEtiqueta(etiqueta)}:1d20+3`;
    const formulaNormalizada = normalizarFormulaDados(formula);

    expect(formulaNormalizada).toBe("Prueba de Sigilo:1d20+3");
  });

  it("normaliza y sanitiza correctamente la fórmula de iniciativa y salvación de muerte", () => {
    const inicFormula = `!${sanitizarEtiqueta("Iniciativa")}:1d20+2`;
    expect(normalizarFormulaDados(inicFormula)).toBe("Iniciativa:1d20+2");

    const muerteFormula = `!${sanitizarEtiqueta("Salvación Muerte")}:1d20`;
    expect(normalizarFormulaDados(muerteFormula)).toBe("Salvacion Muerte:1d20");
  });

  it("genera los descriptores de TaleSpire con los nombres de grupo exactos", () => {
    const formula = "!Prueba de Atletismo:1d20+5";
    const formulaNormalizada = normalizarFormulaDados(formula);
    const descriptores = crearDescriptoresManualmente(formulaNormalizada) as { name: string; roll: string }[];

    expect(descriptores).toHaveLength(1);
    expect(descriptores[0].name).toBe("Prueba de Atletismo");
    expect(descriptores[0].roll).toBe("1d20+5");
  });

  it("al tirar con ventaja preserva el nombre de la habilidad en lugar de caer en fallback de Ataque", async () => {
    // Configuramos modo ventaja
    usarAlmacenDM.setState({ tipoTirada: "ventaja" });

    const formula = `!${sanitizarEtiqueta("Prueba de Atletismo")}:1d20+5`;
    const etiqueta = "Valeros - Prueba de Atletismo";

    let rollDescriptorsCapturados: DescriptorTirada[] | null = null;
    let silenceChatCapturado: boolean = false;

    // Simulamos la disponibilidad de TaleSpire
    const spyEstaDisponible = vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    const spyDebugLog = vi.spyOn(ts.debug, "log").mockImplementation(() => {});

    const spyPutDice = vi.spyOn(ts.dice, "putDiceInTray").mockImplementation(async (desc, silence) => {
      rollDescriptorsCapturados = desc;
      silenceChatCapturado = silence ?? false;
      return "mock-roll-123";
    });

    const spyMakeRoll = vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async (f) => {
      return crearDescriptoresManualmente(f) as DescriptorTirada[];
    });

    try {
      await lanzarDadosTaleSpire(formula, etiqueta);

      // Verificamos que se crearon los dos grupos A y B con el nombre de la habilidad
      expect(rollDescriptorsCapturados).toHaveLength(2);
      expect(rollDescriptorsCapturados![0].name).toBe("Prueba de Atletismo (A)");
      expect(rollDescriptorsCapturados![0].roll).toBe("1d20+5");
      expect(rollDescriptorsCapturados![1].name).toBe("Prueba de Atletismo (B)");
      expect(rollDescriptorsCapturados![1].roll).toBe("1d20+5");
      expect(silenceChatCapturado).toBe(true);

      // Ahora simulamos la llegada de los resultados de dados desde TaleSpire
      const mockResultGroups = [
        { name: "Prueba de Atletismo (A)", description: "" },
        { name: "Prueba de Atletismo (B)", description: "" }
      ];

      vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockImplementation(async (grupo: unknown) => {
        const g = grupo as { name?: string };
        if (g?.name === "Prueba de Atletismo (A)") return 12;
        if (g?.name === "Prueba de Atletismo (B)") return 18;
        return 0;
      });

      let gruposEnviadosAlChat: { name: string; description?: string }[] | null = null;
      vi.spyOn(ts.dice, "sendDiceResult").mockImplementation(async (grupos, _rollId) => {
        gruposEnviadosAlChat = grupos as { name: string; description?: string }[];
      });

      const procesado = await procesarResultadosDadosTaleSpire({
        kind: "rollResults",
        payload: {
          rollId: "mock-roll-123",
          resultsGroups: mockResultGroups
        }
      });

      expect(procesado).toBe(true);
      expect(gruposEnviadosAlChat).toHaveLength(1);
      // El grupo ganador debe tener el nombre exacto de la habilidad con (Ventaja), no "Ataque (Ventaja)"
      expect(gruposEnviadosAlChat![0].name).toBe("Prueba de Atletismo (Ventaja)");
      expect(gruposEnviadosAlChat![0].description).toBe("Mayor de [12, 18]");
    } finally {
      spyEstaDisponible.mockRestore();
      spyDebugLog.mockRestore();
      spyPutDice.mockRestore();
      spyMakeRoll.mockRestore();
    }
  });

  it("al tirar salvación con desventaja escoge el menor y nombra el grupo correctamente", async () => {
    usarAlmacenDM.setState({ tipoTirada: "desventaja" });

    const formula = `!${sanitizarEtiqueta("Salvación de SAB")}:1d20+1`;
    const etiqueta = "Valeros - Salvación de SAB";

    let rollDescriptorsCapturados: DescriptorTirada[] | null = null;

    const spyEstaDisponible = vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    const spyDebugLog = vi.spyOn(ts.debug, "log").mockImplementation(() => {});

    const spyPutDice = vi.spyOn(ts.dice, "putDiceInTray").mockImplementation(async (desc) => {
      rollDescriptorsCapturados = desc;
      return "mock-roll-456";
    });
    const spyMakeRoll = vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async (f) => {
      return crearDescriptoresManualmente(f) as DescriptorTirada[];
    });

    try {
      await lanzarDadosTaleSpire(formula, etiqueta);

      expect(rollDescriptorsCapturados![0].name).toBe("Salvacion de SAB (A)");
      expect(rollDescriptorsCapturados![1].name).toBe("Salvacion de SAB (B)");

      const mockResultGroups = [
        { name: "Salvacion de SAB (A)", description: "" },
        { name: "Salvacion de SAB (B)", description: "" }
      ];

      vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockImplementation(async (grupo: unknown) => {
        const g = grupo as { name?: string };
        if (g?.name === "Salvacion de SAB (A)") return 15;
        if (g?.name === "Salvacion de SAB (B)") return 7;
        return 0;
      });

      let gruposEnviadosAlChat: { name: string; description?: string }[] | null = null;
      vi.spyOn(ts.dice, "sendDiceResult").mockImplementation(async (grupos) => {
        gruposEnviadosAlChat = grupos as { name: string; description?: string }[];
      });

      const procesado = await procesarResultadosDadosTaleSpire({
        kind: "rollResults",
        payload: {
          rollId: "mock-roll-456",
          resultsGroups: mockResultGroups
        }
      });

      expect(procesado).toBe(true);
      expect(gruposEnviadosAlChat![0].name).toBe("Salvacion de SAB (Desventaja)");
      expect(gruposEnviadosAlChat![0].description).toBe("Menor de [15, 7]");
    } finally {
      spyEstaDisponible.mockRestore();
      spyDebugLog.mockRestore();
      spyPutDice.mockRestore();
      spyMakeRoll.mockRestore();
    }
  });

  it("restablece tipoTirada a plano en Zustand tras lanzar la tirada con ventaja", async () => {
    // 1. Activamos ventaja
    usarAlmacenDM.setState({ tipoTirada: "ventaja" });
    expect(usarAlmacenDM.getState().tipoTirada).toBe("ventaja");

    let descriptorsTirada1: DescriptorTirada[] | null = null;
    let descriptorsTirada2: DescriptorTirada[] | null = null;

    const spyEstaDisponible = vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    const spyDebugLog = vi.spyOn(ts.debug, "log").mockImplementation(() => {});

    let contadorRolls = 0;
    const spyPutDice = vi.spyOn(ts.dice, "putDiceInTray").mockImplementation(async (desc) => {
      contadorRolls++;
      if (contadorRolls === 1) descriptorsTirada1 = desc;
      if (contadorRolls === 2) descriptorsTirada2 = desc;
      return `mock-roll-${contadorRolls}`;
    });

    const spyMakeRoll = vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async (f) => {
      return crearDescriptoresManualmente(f) as DescriptorTirada[];
    });

    try {
      // Primera tirada: debe consumir la ventaja
      await lanzarDadosTaleSpire("!Prueba de FUE:1d20+3", "Valeros - Prueba de FUE");

      // Verificamos que la primera tirada tuvo 2 subgrupos (A y B)
      expect(descriptorsTirada1).toHaveLength(2);
      expect(descriptorsTirada1![0].name).toBe("Prueba de FUE (A)");
      expect(descriptorsTirada1![1].name).toBe("Prueba de FUE (B)");

      // Verificamos que el estado global se reinició a "plano"
      expect(usarAlmacenDM.getState().tipoTirada).toBe("plano");

      // Segunda tirada: debe ser una tirada plana de 1 solo grupo
      await lanzarDadosTaleSpire("!Prueba de Atletismo:1d20+5", "Valeros - Prueba de Atletismo");

      expect(descriptorsTirada2).toHaveLength(1);
      expect(descriptorsTirada2![0].name).toBe("Prueba de Atletismo");
      expect(descriptorsTirada2![0].roll).toBe("1d20+5");
    } finally {
      spyEstaDisponible.mockRestore();
      spyDebugLog.mockRestore();
      spyPutDice.mockRestore();
      spyMakeRoll.mockRestore();
    }
  });

  it("actualiza la iniciativa del personaje en la cola del DM al recibir el resultado de los dados", async () => {
    // 1. Iniciamos con cola de iniciativa vacía
    usarAlmacenDM.setState({ colaIniciativa: [] });

    const spyEstaDisponible = vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    const spyDebugLog = vi.spyOn(ts.debug, "log").mockImplementation(() => {});
    vi.spyOn(ts.dice, "putDiceInTray").mockResolvedValue("mock-roll-init-1");
    vi.spyOn(ts.dice, "makeRollDescriptors").mockResolvedValue([{ name: "Iniciativa", roll: "1d20+2" }]);
    vi.spyOn(ts.dice, "evaluateDiceResultsGroup").mockResolvedValue(17);

    try {
      // 2. Tiramos iniciativa desde la ficha pasando metadatos de iniciativa
      await lanzarDadosTaleSpire("!Iniciativa:1d20+2", "Valeros - Iniciativa", {
        tipo: "iniciativa",
        criaturaId: "pj-test-1",
        nombrePersonaje: "Valeros el Bravo",
        idPersonaje: "pj-test-1"
      });

      // 3. Llega el evento de rollResults desde TaleSpire
      await procesarResultadosDadosTaleSpire({
        kind: "rollResults",
        payload: {
          rollId: "mock-roll-init-1",
          resultsGroups: [{ name: "Iniciativa" }]
        }
      });

      // 4. Verificamos que Valeros fue incorporado y tiene iniciativa 17
      const cola = usarAlmacenDM.getState().colaIniciativa;
      expect(cola).toHaveLength(1);
      expect(cola[0].nombre).toBe("Valeros el Bravo");
      expect(cola[0].iniciativa).toBe(17);
      expect(cola[0].esMonstruo).toBe(false);
      expect(cola[0].ca).toBe(18);
    } finally {
      spyEstaDisponible.mockRestore();
      spyDebugLog.mockRestore();
    }
  });

  it("selecciona reactivamente la ficha de personaje cuando su miniatura es seleccionada en TaleSpire", () => {
    // 1. Tenemos a Valeros y creamos a un segundo personaje
    const segundoPj = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-mago-2",
      nombre: "Ezren el Mago",
      idMiniaturaTS: "mini-ts-ezren-uuid"
    };

    usarAlmacenDM.setState({
      personajes: [
        usarAlmacenDM.getState().personajes[0],
        segundoPj
      ],
      idPersonajeActivo: "pj-test-1"
    });

    expect(usarAlmacenDM.getState().idPersonajeActivo).toBe("pj-test-1");

    // 2. Simulamos que TaleSpire selecciona la miniatura física de Ezren
    usarAlmacenDM.getState().actualizarSeleccionCriaturas([
      { id: "mini-ts-ezren-uuid", name: "Ezren el Mago" }
    ]);

    // 3. El ID de personaje activo debe haberse sincronizado a Ezren
    expect(usarAlmacenDM.getState().idPersonajeActivo).toBe("pj-mago-2");
  });

  it("anula mutuamente la ventaja seleccionada en barra táctica y la desventaja de condición (tirada plana)", async () => {
    // 1. Configuramos ventaja en la barra táctica
    usarAlmacenDM.setState({ tipoTirada: "ventaja" });

    const formula = "!Prueba de Sigilo:1d20+3";
    const etiqueta = "Valeros - Prueba de Sigilo";
    let rollDescriptorsCapturados: DescriptorTirada[] | null = null;

    const spyEstaDisponible = vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    const spyDebugLog = vi.spyOn(ts.debug, "log").mockImplementation(() => {});

    const spyPutDice = vi.spyOn(ts.dice, "putDiceInTray").mockImplementation(async (desc) => {
      rollDescriptorsCapturados = desc;
      return "mock-roll-anulacion";
    });
    const spyMakeRoll = vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async (f) => {
      return crearDescriptoresManualmente(f) as DescriptorTirada[];
    });

    try {
      // Pasamos "desventaja" como tipoTiradaForzado (ej. por armadura ruidosa)
      await lanzarDadosTaleSpire(formula, etiqueta, undefined, undefined, "desventaja");

      // Verificamos que se generó un solo grupo plano (anulación de ventaja y desventaja)
      expect(rollDescriptorsCapturados).toHaveLength(1);
      expect(rollDescriptorsCapturados![0].name).toBe("Prueba de Sigilo");
      expect(rollDescriptorsCapturados![0].roll).toBe("1d20+3");

      // El estado global de tipoTirada debe haberse restablecido a plano
      expect(usarAlmacenDM.getState().tipoTirada).toBe("plano");
    } finally {
      spyEstaDisponible.mockRestore();
      spyDebugLog.mockRestore();
      spyPutDice.mockRestore();
      spyMakeRoll.mockRestore();
    }
  });

  describe("Conjuros Utilitarios y Detección de Expresiones de Dados", () => {
    it("detecta correctamente si una cadena contiene dados o es puramente informativa", async () => {
      const { contieneExpresionDados } = await import("@/utiles/lanzadorDados");

      // Cadenas con dados
      expect(contieneExpresionDados("1d20")).toBe(true);
      expect(contieneExpresionDados("2d6+3")).toBe(true);
      expect(contieneExpresionDados("d8")).toBe(true);
      expect(contieneExpresionDados("!Ataque Rayo:1d20+5/Daño:1d8")).toBe(true);

      // Cadenas sin dados (utilitarios, buffs, rituales)
      expect(contieneExpresionDados("!Lanzar Conjuro:Escudo")).toBe(false);
      expect(contieneExpresionDados("!Lanzar Ritual:Identificar (+10 min)")).toBe(false);
      expect(contieneExpresionDados("Luz del dia")).toBe(false);
      expect(contieneExpresionDados("Bendición")).toBe(false);
    });

    it("al lanzar un conjuro sin tirada de dados (ej. Escudo) no invoca putDiceInTray ni envía spam al chat", async () => {
      const spyEstaDisponible = vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
      const spyDebugLog = vi.spyOn(ts.debug, "log").mockImplementation(() => {});
      const spyPutDice = vi.spyOn(ts.dice, "putDiceInTray").mockResolvedValue("no-debe-llamarse");
      const spyChatSend = vi.spyOn(ts.chat, "send").mockResolvedValue(true);

      try {
        await lanzarDadosTaleSpire(
          "!Lanzar Conjuro:Escudo",
          "Valeros - Escudo (Nv.1)"
        );

        // No debe haber llamado a la bandeja de dados 3D
        expect(spyPutDice).not.toHaveBeenCalled();
        // No debe saturar el chat de TaleSpire con mensajes informativos
        expect(spyChatSend).not.toHaveBeenCalled();
      } finally {
        spyEstaDisponible.mockRestore();
        spyDebugLog.mockRestore();
        spyPutDice.mockRestore();
        spyChatSend.mockRestore();
      }
    });
  });
});
