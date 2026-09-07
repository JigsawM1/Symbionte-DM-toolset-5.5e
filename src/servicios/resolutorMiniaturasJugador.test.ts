import { describe, it, expect } from "vitest";
import { emparejarPersonajesConCriaturas } from "./resolutorMiniaturasJugador";
import type { PersonajeJugador } from "@/tipos";
import type { InfoCriatura } from "@/tipos/talespire";

import { PERSONAJE_POR_DEFECTO } from "@/constantes";

function crearPJMock(id: string, nombre: string): PersonajeJugador {
  return {
    ...PERSONAJE_POR_DEFECTO,
    id,
    nombre
  };
}

function crearCriaturaMock(id: string, name: string): InfoCriatura {
  return {
    id,
    name,
    isUnique: false,
    nameSet: true,
    link: "",
    position: { locId: 0, x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    boardId: "board-1",
    morphs: [{ boardAssetId: "asset-1", scale: 1 }],
    activeMorphIndex: 0,
    hp: { name: "HP", value: 10, max: 10 },
    stats: [],
    torchIsOn: false,
    isExplicitlyHidden: false,
    isFlying: false,
    idsOfActivePersistentEmotes: [],
    ownerIds: ["player-1"]
  };
}

describe("resolutorMiniaturasJugador", () => {
  it("debe retornar mapa vacío si no hay personajes", () => {
    const mapa = emparejarPersonajesConCriaturas([], [crearCriaturaMock("c1", "Zulen")]);
    expect(mapa.size).toBe(0);
  });

  it("debe emparejar exactamente por coincidencia de nombre", () => {
    const pj1 = crearPJMock("pj-1", "Zulen");
    const pj2 = crearPJMock("pj-2", "Larynda");
    const c1 = crearCriaturaMock("mini-1", "Larynda");
    const c2 = crearCriaturaMock("mini-2", "Zulen");

    const mapa = emparejarPersonajesConCriaturas([pj1, pj2], [c1, c2]);
    expect(mapa.get("pj-1")?.id).toBe("mini-2");
    expect(mapa.get("pj-2")?.id).toBe("mini-1");
  });

  it("debe emparejar ignorando diferencias de mayúsculas/minúsculas y espacios en blanco", () => {
    const pj = crearPJMock("pj-1", "  Zulen El Bravo  ");
    const c = crearCriaturaMock("mini-1", "zulen el bravo");

    const mapa = emparejarPersonajesConCriaturas([pj], [c]);
    expect(mapa.get("pj-1")?.id).toBe("mini-1");
  });

  it("debe emparejar por defecto 1-a-1 cuando hay 1 solo personaje y 1 sola criatura asignada", () => {
    const pj = crearPJMock("pj-1", "Mi Personaje");
    const c = crearCriaturaMock("mini-1", "Guerrero Humano");

    const mapa = emparejarPersonajesConCriaturas([pj], [c]);
    expect(mapa.get("pj-1")?.id).toBe("mini-1");
  });

  it("debe asignar null a personajes sin coincidencia cuando hay múltiples criaturas y nombres distintos", () => {
    const pj1 = crearPJMock("pj-1", "Arturo");
    const pj2 = crearPJMock("pj-2", "Merlín");
    const c1 = crearCriaturaMock("mini-1", "Lancelot");
    const c2 = crearCriaturaMock("mini-2", "Galahad");

    const mapa = emparejarPersonajesConCriaturas([pj1, pj2], [c1, c2]);
    expect(mapa.get("pj-1")).toBeNull();
    expect(mapa.get("pj-2")).toBeNull();
  });
});
