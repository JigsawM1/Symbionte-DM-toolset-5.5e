import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PosicionTS } from "@/tipos/personaje";

describe("Slice Personajes - Gestión de Movimiento Dinámico y TaleSpire", () => {
  const idPj = "pj-movimiento-test-1";

  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [
        {
          ...PERSONAJE_POR_DEFECTO,
          id: idPj,
          nombre: "Corredor Élfico",
          velocidad: { caminar: 30, planea: false, nadar: 0, volar: 0, escalar: 0 },
          idMiniaturaTS: "mini-elfo-1",
          movimientoGastado: 0,
          movimientoMaximoTemporal: null,
          ultimaPosicionTS: null,
          ultimoBoardIdTS: null,
          historialMovimiento: []
        }
      ],
      idPersonajeActivo: idPj
    });
  });

  it("registra primer avistamiento de miniatura sin restar movimiento", () => {
    const posInicial: PosicionTS = { locId: 0, x: 10, y: 0, z: 10 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, posInicial, "board-alpha");

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(0);
    expect(pj.ultimaPosicionTS).toEqual(posInicial);
    expect(pj.ultimoBoardIdTS).toBe("board-alpha");
    expect(pj.historialMovimiento.length).toBe(0);
  });

  it("calcula y acumula movimiento físico de TaleSpire al desplazarse", () => {
    const posInicial: PosicionTS = { locId: 0, x: 10, y: 0, z: 10 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, posInicial, "board-alpha");

    // Desplazamiento de 2 casillas en X (10 pies)
    const pos2: PosicionTS = { locId: 0, x: 12, y: 0, z: 10 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos2, "board-alpha");

    let pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(10);
    expect(pj.historialMovimiento.length).toBe(1);
    expect(pj.historialMovimiento[0].tipo).toBe("talespire");
    expect(pj.historialMovimiento[0].delta).toBe(10);

    // Desplazamiento adicional de 1 casilla en Z (5 pies)
    const pos3: PosicionTS = { locId: 0, x: 12, y: 0, z: 11 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos3, "board-alpha");

    pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(15);
    expect(pj.historialMovimiento.length).toBe(2);
  });

  it("permite deshacer el último movimiento de TaleSpire restaurando posición y gasto", () => {
    const pos1: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    const pos2: PosicionTS = { locId: 0, x: 3, y: 0, z: 0 }; // +15 ft

    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos1, "board-alpha");
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos2, "board-alpha");

    expect(usarAlmacenDM.getState().personajes[0].movimientoGastado).toBe(15);

    // Deshacer el movimiento
    usarAlmacenDM.getState().deshacerUltimoMovimientoPersonaje(idPj);

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(0);
    expect(pj.ultimaPosicionTS).toEqual(pos1);
    expect(pj.historialMovimiento.length).toBe(0);
  });

  it("permite ajuste manual de movimiento restante y registra en historial", () => {
    // Velocidad base = 30 ft. Se ajusta manualmente a 15 ft restantes
    usarAlmacenDM.getState().modificarMovimientoRestanteManualPersonaje(idPj, 15);

    let pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(15);
    expect(pj.historialMovimiento.length).toBe(1);
    expect(pj.historialMovimiento[0].tipo).toBe("manual");

    // Deshacer el ajuste manual
    usarAlmacenDM.getState().deshacerUltimoMovimientoPersonaje(idPj);

    pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(0);
    expect(pj.historialMovimiento.length).toBe(0);
  });

  it("permite alternar Acción Carrera (Dash) duplicando velocidad disponible", () => {
    // Activar carrera: 30 ft -> 60 ft
    usarAlmacenDM.getState().alternarAccionCarreraPersonaje(idPj);

    let pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoMaximoTemporal).toBe(60);

    // Desactivar carrera
    usarAlmacenDM.getState().alternarAccionCarreraPersonaje(idPj);
    pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoMaximoTemporal).toBeNull();
  });

  it("restablece el movimiento gastado y carrera a 0 al iniciar nuevo turno", () => {
    usarAlmacenDM.getState().modificarMovimientoGastadoPersonaje(idPj, 20);
    usarAlmacenDM.getState().alternarAccionCarreraPersonaje(idPj);

    expect(usarAlmacenDM.getState().personajes[0].movimientoGastado).toBe(20);

    usarAlmacenDM.getState().restablecerMovimientoPersonaje(idPj);

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(0);
    expect(pj.movimientoMaximoTemporal).toBeNull();
  });

  it("no deduce movimiento si la miniatura cambia de tablero o de subtablero", () => {
    const pos1: PosicionTS = { locId: 0, x: 5, y: 0, z: 5 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos1, "board-alpha");

    // Teletransporte a subtablero locId = 2
    const pos2: PosicionTS = { locId: 2, x: 100, y: 10, z: 200 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos2, "board-alpha");

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(0);
    expect(pj.ultimaPosicionTS).toEqual(pos2);
  });

  it("cambia el tipo de terreno y aplica el multiplicador en movimientos posteriores", () => {
    // 1. Establecer terreno difícil (2x)
    usarAlmacenDM.getState().establecerTipoTerrenoPersonaje(idPj, "dificil");
    let pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.tipoTerreno).toBe("dificil");
    expect(pj.multiplicadorTerreno).toBe(2);

    // 2. Posición inicial
    const pos1: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos1, "board-alpha");

    // 3. Mover 2 casillas (10 pies base * 2x = 20 pies gastados)
    const pos2: PosicionTS = { locId: 0, x: 2, y: 0, z: 0 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos2, "board-alpha");

    pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(20);

    // 4. Cambiar a terreno extremo (3x) y mover 1 casilla (5 pies base * 3x = 15 ft adicionales -> 35 ft total)
    usarAlmacenDM.getState().establecerTipoTerrenoPersonaje(idPj, "extremo");
    const pos3: PosicionTS = { locId: 0, x: 3, y: 0, z: 0 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos3, "board-alpha");

    pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.tipoTerreno).toBe("extremo");
    expect(pj.multiplicadorTerreno).toBe(3);
    expect(pj.movimientoGastado).toBe(35);
  });

  it("calcula elevación vertical 3D en el movimiento físico del personaje", () => {
    const pos1: PosicionTS = { locId: 0, x: 0, y: 0, z: 0 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos1, "board-alpha");

    // Subir 4 casillas en Y y avanzar 3 en Z = 5 casillas 3D (25 ft)
    const pos2: PosicionTS = { locId: 0, x: 0, y: 4, z: 3 };
    usarAlmacenDM.getState().registrarMovimientoTSPersonaje(idPj, pos2, "board-alpha");

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.movimientoGastado).toBe(25);
  });
});
