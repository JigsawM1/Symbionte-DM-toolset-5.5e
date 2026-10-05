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

  it("debe actualizar la vida máxima en caliente y ajustar vidaActual si excede el nuevo máximo", () => {
    // Aumentar vida máxima en caliente a 35
    usarAlmacenDM.getState().actualizarAcompanante("pj_test_1", "acomp_lobo_1", {
      vidaMaxima: 35,
      vidaActual: Math.min(20, 35)
    });

    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.vidaMaxima).toBe(35);
    expect(acomp?.vidaActual).toBe(20);

    // Reducir vida máxima por debajo de vida actual (ej. a 15)
    usarAlmacenDM.getState().actualizarAcompanante("pj_test_1", "acomp_lobo_1", {
      vidaMaxima: 15,
      vidaActual: Math.min(acomp?.vidaActual || 20, 15)
    });

    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    acomp = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(acomp?.vidaMaxima).toBe(15);
    expect(acomp?.vidaActual).toBe(15);
  });

  it("debe gestionar acompañantes de tipo invocación escalable y recalcular nivel y estadísticas", () => {
    // Añadir Corcel Sobrenatural a nivel 2 (base)
    const corcelInvocacion: import("@/tipos").AcompanantePersonaje = {
      id: "acomp_corcel_1",
      nombre: "Corcel sobrenatural",
      idPlantilla: "inv_corcel_sobrenatural",
      vidaActual: 25,
      vidaMaxima: 25,
      vidaTemporal: 0,
      ca: 12,
      condiciones: [],
      efectos: [],
      iniciativa: 0,
      idMiniaturaTS: null,
      velocidad: "60 pies",
      movimientoGastado: 0,
      movimientoMaximoTemporal: null,
      tipoTerreno: "normal",
      multiplicadorTerreno: 1,
      ultimaPosicionTS: null,
      ultimoBoardIdTS: null,
      historialMovimiento: [],
      esInvocacion: true,
      nivelConjuroInvocacion: 2,
      subtipoInvocacion: "Celestial"
    };

    usarAlmacenDM.getState().agregarAcompanantePersonaje("pj_test_1", corcelInvocacion);

    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    let corcel = pj?.acompanantes?.find((a) => a.id === "acomp_corcel_1");
    expect(corcel?.esInvocacion).toBe(true);
    expect(corcel?.nivelConjuroInvocacion).toBe(2);
    expect(corcel?.ca).toBe(12);

    // Escalar en caliente a nivel 7 (como en 5e.tools / PHB 2024: CA 17, HP 75)
    usarAlmacenDM.getState().actualizarAcompanante("pj_test_1", "acomp_corcel_1", {
      nivelConjuroInvocacion: 7,
      vidaMaxima: 75,
      vidaActual: 75,
      ca: 17,
      velocidad: "60 pies, Volar 60 pies"
    });

    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    corcel = pj?.acompanantes?.find((a) => a.id === "acomp_corcel_1");
    expect(corcel?.nivelConjuroInvocacion).toBe(7);
    expect(corcel?.vidaMaxima).toBe(75);
    expect(corcel?.ca).toBe(17);
    expect(corcel?.velocidad).toBe("60 pies, Volar 60 pies");
  });

  it("modificarVidaCriaturaIniciativa para un monstruo enemigo NO debe alterar a un acompañante con nombre similar", () => {
    // Configurar iniciativa con un monstruo 'Lobo #1' y el acompañante aliado 'Lobo Guardián'
    usarAlmacenDM.setState({
      colaIniciativa: [
        {
          id: "mini_lobo_enemigo",
          nombre: "Lobo #1",
          iniciativa: 15,
          vidaActual: 11,
          vidaMaxima: 11,
          vidaTemporal: 0,
          ca: 13,
          esMonstruo: true,
          condiciones: [],
          efectos: [],
          velocidad: "40 pies"
        },
        {
          id: "mini_lobo_aliado",
          nombre: "Lobo Guardián",
          iniciativa: 12,
          vidaActual: 20,
          vidaMaxima: 20,
          vidaTemporal: 0,
          ca: 13,
          esMonstruo: false,
          esAcompanante: true,
          idAcompanante: "acomp_lobo_1",
          idPersonajeDuenio: "pj_test_1",
          condiciones: [],
          efectos: [],
          velocidad: "40 pies"
        }
      ]
    });

    // DM daña al monstruo enemigo bajándole la vida a 2
    usarAlmacenDM.getState().modificarVidaCriaturaIniciativa("mini_lobo_enemigo", 2);

    const monstruo = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === "mini_lobo_enemigo");
    expect(monstruo?.vidaActual).toBe(2);

    // El acompañante aliado debe seguir con sus 20 PV intactos tanto en el personaje como en la cola
    const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_1");
    const loboAliado = pj?.acompanantes?.find((a) => a.id === "acomp_lobo_1");
    expect(loboAliado?.vidaActual).toBe(20);

    const criaturaAliadaCola = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === "mini_lobo_aliado");
    expect(criaturaAliadaCola?.vidaActual).toBe(20);
  });

  it("actualizarAcompanante debe sincronizar la colaIniciativa si el acompañante está presente", () => {
    usarAlmacenDM.setState({
      colaIniciativa: [
        {
          id: "mini_lobo_uuid_123",
          nombre: "Lobo Guardián",
          iniciativa: 10,
          vidaActual: 20,
          vidaMaxima: 20,
          vidaTemporal: 0,
          ca: 13,
          esMonstruo: false,
          esAcompanante: true,
          idAcompanante: "acomp_lobo_1",
          idPersonajeDuenio: "pj_test_1",
          condiciones: [],
          efectos: [],
          velocidad: "40 pies"
        }
      ]
    });

    usarAlmacenDM.getState().actualizarAcompanante("pj_test_1", "acomp_lobo_1", {
      ca: 16,
      vidaMaxima: 35,
      vidaActual: 35
    });

    const enCola = usarAlmacenDM.getState().colaIniciativa.find((c) => c.idAcompanante === "acomp_lobo_1");
    expect(enCola?.ca).toBe(16);
    expect(enCola?.vidaMaxima).toBe(35);
    expect(enCola?.vidaActual).toBe(35);
  });
});

