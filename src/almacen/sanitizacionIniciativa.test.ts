import { describe, it, expect } from "vitest";
import {
  sanearCriaturaIniciativa,
  sanearElementoPendiente,
  sanearEncuentroGuardado
} from "./sanitizacion";

describe("sanitizacion - sanearCriaturaIniciativa", () => {
  it("debe retornar null ante entradas inválidas (null, undefined, tipos primitivos)", () => {
    expect(sanearCriaturaIniciativa(null)).toBeNull();
    expect(sanearCriaturaIniciativa(undefined)).toBeNull();
    expect(sanearCriaturaIniciativa("cadena")).toBeNull();
    expect(sanearCriaturaIniciativa(123)).toBeNull();
  });

  it("debe sanear y asignar valores por defecto a un objeto incompleto", () => {
    const criatura = sanearCriaturaIniciativa({
      id: "criatura-1",
      nombre: "Goblin",
      vidaActual: "12",
      vidaMaxima: "15",
      ca: "13"
    });

    expect(criatura).not.toBeNull();
    expect(criatura?.id).toBe("criatura-1");
    expect(criatura?.nombre).toBe("Goblin");
    expect(criatura?.vidaActual).toBe(12);
    expect(criatura?.vidaMaxima).toBe(15);
    expect(criatura?.ca).toBe(13);
    expect(criatura?.condiciones).toEqual([]);
    expect(criatura?.esMonstruo).toBe(true);
  });
});

describe("sanitizacion - sanearElementoPendiente", () => {
  it("debe retornar null ante entradas no objeto", () => {
    expect(sanearElementoPendiente(null)).toBeNull();
    expect(sanearElementoPendiente(42)).toBeNull();
  });

  it("debe normalizar campos de tarea pendiente", () => {
    const tarea = sanearElementoPendiente({
      texto: "Preparar emboscada",
      completado: 1
    });

    expect(tarea).not.toBeNull();
    expect(tarea?.texto).toBe("Preparar emboscada");
    expect(tarea?.completado).toBe(true);
    expect(typeof tarea?.id).toBe("string");
  });
});

describe("sanitizacion - sanearEncuentroGuardado", () => {
  it("debe sanitizar la cola interna de criaturas y datos del encuentro", () => {
    const encuentro = sanearEncuentroGuardado({
      nombre: "Cueva de los Trasgos",
      ronda: "2",
      cola: [
        { id: "t1", nombre: "Trasgo Líder", vidaActual: 20 },
        null,
        "invalido"
      ]
    });

    expect(encuentro).not.toBeNull();
    expect(encuentro?.nombre).toBe("Cueva de los Trasgos");
    expect(encuentro?.ronda).toBe(2);
    expect(encuentro?.cola.length).toBe(1);
    expect(encuentro?.cola[0].nombre).toBe("Trasgo Líder");
  });
});
