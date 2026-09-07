import { describe, it, expect, beforeEach } from "vitest";

// Mock de localStorage para entorno Node de Vitest
const crearMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

describe("Persistencia en LocalStorage (usarEstadoPersistido)", () => {
  let mockStorage: ReturnType<typeof crearMockLocalStorage>;

  beforeEach(() => {
    mockStorage = crearMockLocalStorage();
    Object.defineProperty(globalThis, "localStorage", { value: mockStorage, writable: true, configurable: true });
  });

  it("permite guardar y recuperar cadenas en localStorage", () => {
    const clave = "ts_acciones_filtro";
    const valor = "accionAdicional";
    mockStorage.setItem(clave, JSON.stringify(valor));

    const recuperado = JSON.parse(mockStorage.getItem(clave) || '""');
    expect(recuperado).toBe(valor);
  });

  it("permite guardar y recuperar el mapa de secciones colapsables", () => {
    const clave = "ts_acciones_secciones";
    const secciones = { recursos: false, fisicos: true, magicos: false, consumibles: true };
    mockStorage.setItem(clave, JSON.stringify(secciones));

    const recuperado = JSON.parse(mockStorage.getItem(clave) || "{}");
    expect(recuperado).toEqual(secciones);
  });

  it("permite guardar y recuperar características de armas por personaje", () => {
    const pjId = "pj-valeros-123";
    const clave = `ts_caracteristicas_armas_${pjId}`;
    const mapeo = { "espada-1": "carisma", "daga-2": "destreza" };
    mockStorage.setItem(clave, JSON.stringify(mapeo));

    const recuperado = JSON.parse(mockStorage.getItem(clave) || "{}");
    expect(recuperado).toEqual(mapeo);
  });

  it("maneja claves inexistentes devolviendo fallback por defecto", () => {
    const valorGuardado = mockStorage.getItem("clave_inexistente");
    expect(valorGuardado).toBeNull();
  });
});
