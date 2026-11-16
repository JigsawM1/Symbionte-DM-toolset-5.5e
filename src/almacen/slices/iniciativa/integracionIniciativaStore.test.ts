import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaAcompanantePersonaje, type MonstruoBase, type PersonajeJugador } from "@/tipos";

describe("Subsistema de Iniciativa - Pruebas de Integración en Store", () => {
  const estadoInicial = usarAlmacenDM.getState();

  beforeEach(() => {
    vi.restoreAllMocks();
    usarAlmacenDM.setState({
      esGM: true,
      colaIniciativa: [],
      indiceTurnoActivo: 0,
      rondaActual: 1,
      personajes: [],
      asociacionesFichas: {},
      baseDatosMonstruos: [],
      notificaciones: []
    });
  });

  afterEach(() => {
    usarAlmacenDM.setState(estadoInicial, true);
    vi.unstubAllGlobals();
  });

  it("soporta contrato nombrado y posicional en agregarCriaturaAIniciativa (individual y horda)", () => {
    const store = usarAlmacenDM.getState();

    store.agregarCriaturaAIniciativa({
      nombre: "Esqueletos Guardias",
      iniciativa: 12,
      vidaMax: 13,
      ca: 13,
      esMonstruo: true,
      velocidad: "30 pies",
      bonifInic: 2,
      idPlantillaAsociada: "mon_esqueleto",
      cantidadHorda: 4
    });

    store.agregarCriaturaAIniciativa("Aliado Posicional", 15, 22, 16, false, "30 pies", 2);

    const estado = usarAlmacenDM.getState();
    expect(estado.colaIniciativa).toHaveLength(2);

    const horda = estado.colaIniciativa[0];
    expect(horda.barrasVida).toHaveLength(4);
    expect(horda.vidaActual).toBe(52);
    expect(horda.resumenHorda?.vivos).toBe(4);
    expect(estado.asociacionesFichas[horda.id]).toBe("mon_esqueleto");

    const aliado = estado.colaIniciativa[1];
    expect(aliado.nombre).toBe("Aliado Posicional");
    expect(aliado.esMonstruo).toBe(false);
    expect(aliado.vidaMaxima).toBe(22);
  });

  it("sincroniza vida, vida máxima, vida temporal y Derribado en PJ y Acompañante", () => {
    const acomp = EsquemaAcompanantePersonaje.parse({
      id: "acomp_lobo_1",
      nombre: "Lobo Fiel",
      idPlantilla: "mon_lobo",
      idMiniaturaTS: "mini_lobo_1",
      vidaActual: 18,
      vidaMaxima: 18,
      vidaTemporal: 4,
      ca: 13
    });

    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_explorador",
      nombre: "Faelar",
      idMiniaturaTS: "mini_faelar",
      hpMaximo: 40,
      hpActual: 40,
      hpTemporal: 0,
      tipoTerreno: "normal",
      multiplicadorTerreno: 1,
      acompanantes: [acomp]
    };

    const filaPj: CriaturaIniciativa = {
      id: "mini_faelar",
      nombre: "Faelar",
      iniciativa: 17,
      vidaMaxima: 40,
      vidaActual: 40,
      vidaTemporal: 0,
      ca: 16,
      condiciones: [],
      efectos: [],
      bonificadorIniciativa: 3,
      esMonstruo: false,
      velocidad: "30 pies",
      idPersonajeDuenio: pj.id
    };

    const filaAcomp: CriaturaIniciativa = {
      id: "mini_lobo_1",
      nombre: "Lobo Fiel",
      iniciativa: 14,
      vidaMaxima: 18,
      vidaActual: 18,
      vidaTemporal: 4,
      ca: 13,
      condiciones: [],
      efectos: [],
      bonificadorIniciativa: 2,
      esMonstruo: false,
      velocidad: "40 pies",
      idPersonajeDuenio: pj.id,
      idAcompanante: acomp.id,
      esAcompanante: true
    };

    usarAlmacenDM.setState({ personajes: [pj], colaIniciativa: [filaPj, filaAcomp] });

    const s = usarAlmacenDM.getState();
    s.dañarCriaturaIniciativa("mini_lobo_1", 7);
    s.modificarVidaMaximaCriaturaIniciativa("mini_lobo_1", 24);
    s.actualizarVidaTemporal("mini_lobo_1", 5);
    s.agregarCondicionACriatura("mini_faelar", "Derribado");
    s.agregarCondicionACriatura("mini_lobo_1", "Derribado");

    let pjActualizado = usarAlmacenDM.getState().personajes[0];
    let acompActualizado = pjActualizado.acompanantes[0];

    expect(acompActualizado.vidaTemporal).toBe(5);
    expect(acompActualizado.vidaActual).toBe(15);
    expect(acompActualizado.vidaMaxima).toBe(24);
    expect(pjActualizado.tipoTerreno).toBe("dificil");
    expect(pjActualizado.multiplicadorTerreno).toBe(2);
    expect(pjActualizado.historialMovimiento.some((h) => h.tipo === "terreno")).toBe(true);
    expect(acompActualizado.tipoTerreno).toBe("dificil");
    expect(acompActualizado.multiplicadorTerreno).toBe(2);

    usarAlmacenDM.getState().quitarCondicionDeCriatura("mini_faelar", "Derribado");
    usarAlmacenDM.getState().quitarCondicionDeCriatura("mini_lobo_1", "Derribado");

    pjActualizado = usarAlmacenDM.getState().personajes[0];
    acompActualizado = pjActualizado.acompanantes[0];
    expect(pjActualizado.tipoTerreno).toBe("normal");
    expect(pjActualizado.multiplicadorTerreno).toBe(1);
    expect(acompActualizado.tipoTerreno).toBe("normal");
    expect(acompActualizado.multiplicadorTerreno).toBe(1);
  });

  it("ejecutarSalvacionEnArea acepta objeto nombrado, absorbe vida temporal y propaga condiciones al PJ", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // d20 = 1 -> fallo garantizado

    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_objetivo",
      nombre: "Lyra",
      idMiniaturaTS: "mini_lyra",
      hpMaximo: 30,
      hpActual: 30,
      condicionesActivas: []
    };

    const plantillaMonstruo = {
      id: "mon_ogro",
      nombre: "Ogro",
      ca: 11,
      vidaMaxima: 59,
      iniciativaBonificador: -1,
      caracteristicas: { fuerza: 19, destreza: 8, constitucion: 16, inteligencia: 5, sabiduria: 7, carisma: 7 }
    } as unknown as MonstruoBase;

    usarAlmacenDM.setState({
      personajes: [pj],
      baseDatosMonstruos: [plantillaMonstruo],
      colaIniciativa: [
        {
          id: "mini_lyra",
          nombre: "Lyra",
          iniciativa: 16,
          vidaMaxima: 30,
          vidaActual: 30,
          vidaTemporal: 6,
          ca: 15,
          condiciones: [],
          efectos: [],
          bonificadorIniciativa: 2,
          esMonstruo: false,
          velocidad: "30 pies",
          idPersonajeDuenio: pj.id
        }
      ]
    });

    const resultado = usarAlmacenDM.getState().ejecutarSalvacionEnArea({
      caracteristica: "destreza",
      cd: 15,
      dañoBruto: 10,
      condicionOEfecto: { nombre: "Derribado", tipo: "condicion" },
      mitigacion: "mitad",
      idsObjetivo: ["mini_lyra"]
    });

    expect(resultado?.resultados[0].exito).toBe(false);
    expect(resultado?.resultados[0].dañoSufrido).toBe(10);

    const estado = usarAlmacenDM.getState();
    expect(estado.colaIniciativa[0].vidaTemporal).toBe(0);
    expect(estado.colaIniciativa[0].vidaActual).toBe(26);
    expect(estado.colaIniciativa[0].condiciones).toContain("Derribado");
    expect(estado.personajes[0].condicionesActivas).toContain("Derribado");
  });

  it("emite una notificación de error en el store si importarIniciativaTaleSpire falla", async () => {
    vi.stubGlobal("TS", {
      initiative: {
        getQueue: vi.fn().mockRejectedValue(new Error("Fallo de puente CEF"))
      }
    });

    await usarAlmacenDM.getState().importarIniciativaTaleSpire();

    const notificaciones = usarAlmacenDM.getState().notificaciones;
    expect(notificaciones.some((n) => n.tipo === "error" && n.mensaje.includes("TaleSpire"))).toBe(true);
  });
});
