import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO } from "@/tipos/accesibilidad";

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

describe("SliceAccesibilidad - Gestión de Estado y Persistencia Local", () => {
  let mockStorage: ReturnType<typeof crearMockLocalStorage>;

  beforeEach(() => {
    mockStorage = crearMockLocalStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true
    });
    usarAlmacenDM.getState().restablecerAccesibilidad();
  });

  it("inicializa con la configuración por defecto", () => {
    const estado = usarAlmacenDM.getState().accesibilidad;
    expect(estado.escalaFuente).toBe(CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO.escalaFuente);
    expect(estado.factorEscala).toBe(1.0);
    expect(estado.modoContraste).toBe("estandar");
    expect(estado.modoDaltonismo).toBe("ninguno");
  });

  it("actualiza la escala tipográfica y ajusta el factor numérico", () => {
    usarAlmacenDM.getState().actualizarAccesibilidad({ escalaFuente: "grande" });
    const estado = usarAlmacenDM.getState().accesibilidad;

    expect(estado.escalaFuente).toBe("grande");
    expect(estado.factorEscala).toBe(1.15);

    // Debe guardarse en localStorage
    const guardado = JSON.parse(mockStorage.getItem("simbionte_accesibilidad") || "{}");
    expect(guardado.escalaFuente).toBe("grande");
    expect(guardado.factorEscala).toBe(1.15);
  });

  it("actualiza modo de contraste y daltonismo correctamente", () => {
    usarAlmacenDM.getState().actualizarAccesibilidad({
      modoContraste: "alto",
      modoDaltonismo: "deuteranopia",
      colorAcento: "cian",
      focoAumentado: true
    });

    const estado = usarAlmacenDM.getState().accesibilidad;
    expect(estado.modoContraste).toBe("alto");
    expect(estado.modoDaltonismo).toBe("deuteranopia");
    expect(estado.colorAcento).toBe("cian");
    expect(estado.focoAumentado).toBe(true);
  });

  it("restablece todas las opciones de accesibilidad a los valores originales", () => {
    usarAlmacenDM.getState().actualizarAccesibilidad({
      escalaFuente: "muy-grande",
      familiaFuente: "dislexia",
      modoContraste: "alto"
    });

    usarAlmacenDM.getState().restablecerAccesibilidad();
    const estado = usarAlmacenDM.getState().accesibilidad;

    expect(estado.escalaFuente).toBe("normal");
    expect(estado.factorEscala).toBe(1.0);
    expect(estado.familiaFuente).toBe("estandar");
    expect(estado.modoContraste).toBe("estandar");
  });
});

