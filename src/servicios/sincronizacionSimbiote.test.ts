import { describe, it, expect, beforeEach } from "vitest";
import {
  proyectarEstadoCombatePJ,
  procesarMensajeSyncEntrante,
} from "./sincronizacionSimbiote";
import {
  type EstadoCombatePJ,
  type EstadoIniciativaDM,
  EsquemaWireMensajeSync,
  serializarEstadoCombatePJ,
  deserializarEstadoCombatePJ,
  serializarIniciativaDM,
  deserializarIniciativaDM,
  dividirEnChunksIniciativa,
} from "@/tipos/sync";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";

describe("Sincronización Simbiote - Wire Format y DTOs", () => {
  it("proyectarEstadoCombatePJ extrae correctamente pasivas, CA, vitalidad y concentración", () => {
    const pjMock = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-1",
      nombre: "Gandalf el Gris",
      hpActual: 24,
      hpMaximo: 30,
      hpTemporal: 5,
      ca: 15,
      condicionesActivas: ["cegado"],
      efectosActivos: [
        { id: "ef-1", nombre: "Bendición", expiraRonda: 4, concentracion: false },
      ],
      concentracionActiva: { hechizoId: "hech-1", nombreHechizo: "Escudo de Fe" },
      espaciosConjuroMaximos: { "1": 4, "2": 3 },
      espaciosConjuroGastados: { "1": 1, "2": 0 },
    };

    const dto = proyectarEstadoCombatePJ(pjMock);

    expect(dto.id).toBe("pj-1");
    expect(dto.nombre).toBe("Gandalf el Gris");
    expect(dto.hpActual).toBe(24);
    expect(dto.hpMaximo).toBe(30);
    expect(dto.hpTemporal).toBe(5);
    expect(dto.condiciones).toEqual(["cegado"]);
    expect(dto.efectos).toHaveLength(1);
    expect(dto.concentracion).toEqual({
      hechizoId: "hech-1",
      nombreHechizo: "Escudo de Fe",
    });
    expect(dto.pasivas).toHaveProperty("percepcion");
    expect(dto.pasivas).toHaveProperty("investigacion");
    expect(dto.pasivas).toHaveProperty("perspicacia");
  });

  it("serializar y deserializar EstadoCombatePJ preserva la fidelidad de los datos", () => {
    const dtoOriginal: EstadoCombatePJ = {
      id: "pj-42",
      idMiniaturaTS: "mini-ts-99",
      nombre: "Legolas",
      iniciativa: 18,
      hpActual: 45,
      hpMaximo: 50,
      hpTemporal: 0,
      ca: 16,
      condiciones: ["envenenado"],
      efectos: [{ id: "e1", nombre: "Marca del Cazador", expiraRonda: 5, concentracion: true }],
      pasivas: { percepcion: 16, investigacion: 12, perspicacia: 14 },
      conjuros: {
        espaciosMaximos: { "1": 4, "2": 2 },
        espaciosGastados: { "1": 2, "2": 1 },
      },
      concentracion: { hechizoId: "h-cazador", nombreHechizo: "Marca del Cazador" },
    };

    const wire = serializarEstadoCombatePJ(dtoOriginal);
    const jsonStr = JSON.stringify(wire);

    // El paquete compactado de un PJ debe ser significativamente menor al límite de red
    expect(jsonStr.length).toBeLessThan(450);

    const dtoReconstruido = deserializarEstadoCombatePJ(wire);

    expect(dtoReconstruido.id).toBe(dtoOriginal.id);
    expect(dtoReconstruido.idMiniaturaTS).toBe(dtoOriginal.idMiniaturaTS);
    expect(dtoReconstruido.nombre).toBe(dtoOriginal.nombre);
    expect(dtoReconstruido.hpActual).toBe(dtoOriginal.hpActual);
    expect(dtoReconstruido.ca).toBe(dtoOriginal.ca);
    expect(dtoReconstruido.condiciones).toEqual(dtoOriginal.condiciones);
    expect(dtoReconstruido.efectos).toEqual(dtoOriginal.efectos);
    expect(dtoReconstruido.pasivas).toEqual(dtoOriginal.pasivas);
    expect(dtoReconstruido.concentracion).toEqual(dtoOriginal.concentracion);
  });

  it("serializar y deserializar iniciativa DM preserva la cola y la configuración", () => {
    const colaMock: CriaturaIniciativa[] = [
      {
        id: "c1",
        nombre: "Orco Líder",
        iniciativa: 14,
        vidaActual: 30,
        vidaMaxima: 45,
        vidaTemporal: 0,
        ca: 15,
        esMonstruo: true,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 1,
        velocidad: "30 pies",
      },
      {
        id: "c2",
        nombre: "Guerrero Humano",
        iniciativa: 18,
        vidaActual: 55,
        vidaMaxima: 55,
        vidaTemporal: 5,
        ca: 18,
        esMonstruo: false,
        condiciones: ["asustado"],
        efectos: [{ id: "e1", nombre: "Heroísmo", expiraRonda: 3 }],
        bonificadorIniciativa: 2,
        velocidad: "30 pies",
      },
    ];

    const dmOriginal: EstadoIniciativaDM = {
      cola: colaMock,
      indiceTurnoActivo: 1,
      rondaActual: 2,
      mostrarPorcentajeVidaAJugadores: true,
      metodoVidaMonstruo: "maximo",
    };

    const wire = serializarIniciativaDM(dmOriginal);
    const dmReconstruido = deserializarIniciativaDM(wire);

    expect(dmReconstruido.indiceTurnoActivo).toBe(1);
    expect(dmReconstruido.rondaActual).toBe(2);
    expect(dmReconstruido.mostrarPorcentajeVidaAJugadores).toBe(true);
    expect(dmReconstruido.metodoVidaMonstruo).toBe("maximo");
    expect(dmReconstruido.cola).toHaveLength(2);
    expect(dmReconstruido.cola[0].nombre).toBe("Orco Líder");
    expect(dmReconstruido.cola[1].condiciones).toEqual(["asustado"]);
  });

  it("dividirEnChunksIniciativa particiona correctamente una cola extensa", () => {
    const cola: CriaturaIniciativa[] = Array.from({ length: 8 }, (_, idx) => ({
      id: `c-${idx}`,
      nombre: `Esqueleto ${idx + 1}`,
      iniciativa: 10 + idx,
      vidaActual: 13,
      vidaMaxima: 13,
      vidaTemporal: 0,
      ca: 13,
      esMonstruo: true,
      condiciones: [],
      bonificadorIniciativa: 2,
      velocidad: "30 pies",
    }));

    const wire = serializarIniciativaDM({
      cola,
      indiceTurnoActivo: 0,
      rondaActual: 1,
      mostrarPorcentajeVidaAJugadores: true,
      metodoVidaMonstruo: "azar",
    });

    const chunks = dividirEnChunksIniciativa(wire);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].chunk).toBe(1);
    expect(chunks[0].total).toBe(2);
    expect(chunks[0].c.length).toBe(4);
    expect(chunks[1].chunk).toBe(2);
    expect(chunks[1].c.length).toBe(4);
    expect([...chunks[0].c, ...chunks[1].c]).toHaveLength(8);
  });

  it("EsquemaWireMensajeSync valida y discrimina por tipo de mensaje", () => {
    const msgReq = { v: 1, t: "REQ" };
    const parseReq = EsquemaWireMensajeSync.safeParse(msgReq);
    expect(parseReq.success).toBe(true);

    const msgInvalido = { v: 1, t: "DESCONOCIDO", d: {} };
    const parseInvalido = EsquemaWireMensajeSync.safeParse(msgInvalido);
    expect(parseInvalido.success).toBe(false);
  });
});

describe("Sincronización Simbiote - Manejo de Mensajes en Store", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      esGM: false,
      colaIniciativa: [],
      indiceTurnoActivo: 0,
      rondaActual: 1,
      mostrarPorcentajeVidaAJugadores: false,
      metodoVidaMonstruo: "azar",
      personajes: [
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "pj-test-1",
          nombre: "Bárbaro Enano",
          hpActual: 50,
          hpMaximo: 50,
        },
      ],
      aplicandoSync: false,
    });
  });

  it("jugador aplica mensaje DM actualizando la cola y la configuración del Master", () => {
    const mensajeDM = {
      v: 1,
      t: "DM",
      d: {
        c: [
          {
            id: "m1",
            n: "Dragón Rojo",
            i: 22,
            va: 250,
            vm: 250,
            vt: 0,
            ca: 19,
            m: true,
            c: [],
          },
        ],
        t: 0,
        r: 3,
        v: true,
        mv: "maximo",
      },
    };

    procesarMensajeSyncEntrante({ datos: mensajeDM, strCrudo: JSON.stringify(mensajeDM) });

    const estadoFinal = usarAlmacenDM.getState();
    expect(estadoFinal.rondaActual).toBe(3);
    expect(estadoFinal.mostrarPorcentajeVidaAJugadores).toBe(true);
    expect(estadoFinal.metodoVidaMonstruo).toBe("maximo");
    expect(estadoFinal.colaIniciativa).toHaveLength(1);
    expect(estadoFinal.colaIniciativa[0].nombre).toBe("Dragón Rojo");
  });

  it("DM actualiza personaje de jugador al recibir mensaje PJ", () => {
    usarAlmacenDM.setState({ esGM: true });

    const mensajePJ = {
      v: 1,
      t: "PJ",
      d: {
        id: "pj-test-1",
        n: "Bárbaro Enano",
        i: 12,
        va: 35, // Daño sufrido
        vm: 50,
        vt: 10, // Furia temporal
        ca: 16,
        c: ["furia"],
        e: [],
        p: [12, 10, 14] as [number, number, number],
      },
    };

    procesarMensajeSyncEntrante({ datos: mensajePJ, strCrudo: JSON.stringify(mensajePJ) });

    const estadoFinal = usarAlmacenDM.getState();
    const pjActualizado = estadoFinal.personajes.find((p) => p.id === "pj-test-1");

    expect(pjActualizado).toBeDefined();
    expect(pjActualizado?.hpActual).toBe(35);
    expect(pjActualizado?.hpTemporal).toBe(10);
    expect(pjActualizado?.condicionesActivas).toEqual(["furia"]);
  });
});
