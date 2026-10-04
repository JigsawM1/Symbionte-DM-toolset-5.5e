import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador, AcompanantePersonaje } from "@/tipos";

describe("Gestión Dinámica de Acompañantes y Sidekicks (Movilidad y Terrenos)", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj_test_1",
    nombre: "Héroe Test",
    velocidad: {
      caminar: 30,
      planea: false
    },
    acompanantes: []
  };

  const sidekickBase: AcompanantePersonaje = {
    id: "acomp_lobo_1",
    nombre: "Lobo Guardián",
    idPlantilla: "lobo_plantilla",
    vidaActual: 20,
    vidaMaxima: 20,
    vidaTemporal: 0,
    ca: 13,
    condiciones: [],
    efectos: [],
    iniciativa: 2,
    idMiniaturaTS: "mini_lobo_uuid_123",
    velocidad: {
      caminar: 40,
      planea: false
    },
    movimientoGastado: 0,
    movimientoMaximoTemporal: null,
    tipoTerreno: "normal",
    multiplicadorTerreno: 1,
    ultimaPosicionTS: null,
    ultimoBoardIdTS: null,
    historialMovimiento: []
  };

  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [{ ...personajeBase, acompanantes: [{ ...sidekickBase }] }],
      idPersonajeActivo: "pj_test_1"
    });
  });

  it("debe agregar un nuevo acompañante con valores iniciales de movimiento", () => {
    const nuevoSidekick: AcompanantePersonaje = {
      id: "acomp_halcon_2",
      nombre: "Halcón Explorador",
      idPlantilla: "halcon_plantilla",
      vidaActual: 10,
      vidaMaxima: 10,
      vidaTemporal: 0,
      ca: 14,
      condiciones: [],
      efectos: [],
      iniciativa: 3,
      idMiniaturaTS: null,
      velocidad: {
        caminar: 60,
        planea: false
      },
      movimientoGastado: 0,
      movimientoMaximoTemporal: null,
      tipoTerreno: "normal",
      multiplicadorTerreno: 1,
      ultimaPosicionTS: null,
      ultimoBoardIdTS: null,
      historialMovimiento: []
    };

    usarAlmacenDM.getState().agregarAcompanantePersonaje("pj_test_1", nuevoSidekick);

    const pjs = usarAlmacenDM.getState().personajes;
    const pj = pjs.find((p) => p.id === "pj_test_1");
    expect(pj?.acompanantes?.length).toBe(2);
    expect(pj?.acompanantes?.find((a) => a.id === "acomp_halcon_2")?.velocidad).toEqual({
      caminar: 60,
      planea: false
    });
  });

  it("debe vincular y desvincular una miniatura de TaleSpire al acompañante", () => {
    usarAlmacenDM.getState().vincularMiniaturaTSAcompanante("pj_test_1", "acomp_lobo_1", "mini_lobo_nueva");
    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.idMiniaturaTS).toBe("mini_lobo_nueva");

    usarAlmacenDM.getState().vincularMiniaturaTSAcompanante("pj_test_1", "acomp_lobo_1", null);
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.idMiniaturaTS).toBeNull();
  });

  it("debe registrar movimiento físico en terreno normal (multiplicador 1x)", () => {
    // Establecer posición inicial
    usarAlmacenDM
      .getState()
      .establecerPosicionInicialTSAcompanante("pj_test_1", "acomp_lobo_1", { locId: 0, x: 0, y: 0, z: 0 });

    // Mover 1 casilla (1 casilla = 5 pies de distancia euclidiana = 1 unidad TS * 5 = 5 pies)
    usarAlmacenDM.getState().registrarMovimientoTSAcompanante(
      "pj_test_1",
      "acomp_lobo_1",
      { locId: 0, x: 1, y: 0, z: 0 },
      undefined,
      { numberPerTile: 5, multiplicadorTerreno: 1 }
    );

    const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    const acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");

    expect(acomp?.movimientoGastado).toBe(5);
    expect(acomp?.historialMovimiento?.length).toBe(1);
    expect(acomp?.historialMovimiento?.[0].delta).toBe(5);
  });

  it("debe registrar movimiento físico con terreno difícil (multiplicador 2x)", () => {
    // Establecer terreno difícil
    usarAlmacenDM
      .getState()
      .establecerTipoTerrenoAcompanante("pj_test_1", "acomp_lobo_1", "dificil");

    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.tipoTerreno).toBe("dificil");
    expect(acomp?.multiplicadorTerreno).toBe(2);

    // Establecer posición inicial
    usarAlmacenDM
      .getState()
      .establecerPosicionInicialTSAcompanante("pj_test_1", "acomp_lobo_1", { locId: 0, x: 0, y: 0, z: 0 });

    // Mover 1 casilla (5 pies de tablero * 2x = 10 pies gastados)
    usarAlmacenDM.getState().registrarMovimientoTSAcompanante(
      "pj_test_1",
      "acomp_lobo_1",
      { locId: 0, x: 1, y: 0, z: 0 },
      undefined,
      { numberPerTile: 5, multiplicadorTerreno: 2 }
    );

    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");

    expect(acomp?.movimientoGastado).toBe(10);
  });

  it("debe registrar movimiento físico con terreno extremo (multiplicador 3x)", () => {
    usarAlmacenDM
      .getState()
      .establecerTipoTerrenoAcompanante("pj_test_1", "acomp_lobo_1", "extremo");

    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.tipoTerreno).toBe("extremo");
    expect(acomp?.multiplicadorTerreno).toBe(3);

    usarAlmacenDM
      .getState()
      .establecerPosicionInicialTSAcompanante("pj_test_1", "acomp_lobo_1", { locId: 0, x: 0, y: 0, z: 0 });

    // Mover 2 casillas (10 pies de tablero * 3x = 30 pies gastados)
    usarAlmacenDM.getState().registrarMovimientoTSAcompanante(
      "pj_test_1",
      "acomp_lobo_1",
      { locId: 0, x: 2, y: 0, z: 0 },
      undefined,
      { numberPerTile: 5, multiplicadorTerreno: 3 }
    );

    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");

    expect(acomp?.movimientoGastado).toBe(30);
  });

  it("debe alternar la acción de Carrera (Dash) duplicando la velocidad máxima temporal", () => {
    // Lobo velocidad base = 40. Con carrera => 80
    usarAlmacenDM.getState().alternarAccionCarreraAcompanante("pj_test_1", "acomp_lobo_1");

    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.movimientoMaximoTemporal).toBe(80);

    // Alternar nuevamente la desactiva (vuelve a null)
    usarAlmacenDM.getState().alternarAccionCarreraAcompanante("pj_test_1", "acomp_lobo_1");

    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.movimientoMaximoTemporal).toBeNull();
  });

  it("debe permitir ajuste manual de pies gastados y restantes", () => {
    // Gastar 15 pies
    usarAlmacenDM
      .getState()
      .modificarMovimientoGastadoAcompanante("pj_test_1", "acomp_lobo_1", 15, "Ajuste manual +15");

    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.movimientoGastado).toBe(15);

    // Ajustar manualmente restante a 10 (base 40 - 10 = gastado 30)
    usarAlmacenDM
      .getState()
      .modificarMovimientoRestanteManualAcompanante("pj_test_1", "acomp_lobo_1", 10);

    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.movimientoGastado).toBe(30);
  });

  it("debe deshacer el último movimiento del acompañante", () => {
    usarAlmacenDM
      .getState()
      .establecerPosicionInicialTSAcompanante("pj_test_1", "acomp_lobo_1", { locId: 0, x: 0, y: 0, z: 0 });

    usarAlmacenDM.getState().registrarMovimientoTSAcompanante(
      "pj_test_1",
      "acomp_lobo_1",
      { locId: 0, x: 1, y: 0, z: 0 },
      undefined,
      { numberPerTile: 5, multiplicadorTerreno: 1 }
    );

    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.movimientoGastado).toBe(5);

    // Deshacer movimiento
    usarAlmacenDM.getState().deshacerUltimoMovimientoAcompanante("pj_test_1", "acomp_lobo_1");

    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.movimientoGastado).toBe(0);
    expect(acomp?.ultimaPosicionTS).toEqual({ locId: 0, x: 0, y: 0, z: 0 });
  });

  it("debe restablecer el movimiento del acompañante para un nuevo turno", () => {
    // Aplicar carrera y gasto
    usarAlmacenDM.getState().alternarAccionCarreraAcompanante("pj_test_1", "acomp_lobo_1");
    usarAlmacenDM
      .getState()
      .modificarMovimientoGastadoAcompanante("pj_test_1", "acomp_lobo_1", 50, "Gasto turno");

    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.movimientoGastado).toBe(50);
    expect(acomp?.movimientoMaximoTemporal).toBe(80);

    // Restablecer turno
    usarAlmacenDM.getState().restablecerMovimientoAcompanante("pj_test_1", "acomp_lobo_1");

    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.movimientoGastado).toBe(0);
    expect(acomp?.movimientoMaximoTemporal).toBeNull();
    const ultimoReg = acomp?.historialMovimiento?.[(acomp?.historialMovimiento?.length || 1) - 1];
    expect(ultimoReg?.tipo).toBe("reinicio");
    expect(ultimoReg?.nuevoGastado).toBe(0);
  });
});

