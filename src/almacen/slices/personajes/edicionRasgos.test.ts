import { beforeEach, describe, expect, it } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { RasgoPersonaje } from "@/tipos";

const rasgo: RasgoPersonaje = {
  id: "don_a", nombre: "Don A", descripcion: "", origen: "personalizado",
  fuente: "Homebrew", tipoAccion: "pasivo", tieneUsosLimitados: false,
  recuperacion: "ninguno", personalizado: true, activo: true, notas: "",
  conjurosOtorgados: ["hechizo_a"]
};

describe("Edición de rasgos y procedencia de conjuros", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({ personajes: [{ ...PERSONAJE_POR_DEFECTO, id: "auditoria", rasgos: [],
      conjurosSiemprePreparadosIds: [], conjurosPreparadosIds: [], conjurosConocidosIds: [], trucosConocidosIds: [] }] });
  });

  it("retira el conjuro anterior y añade el nuevo a las listas al editar", () => {
    const acciones = usarAlmacenDM.getState();
    acciones.agregarRasgoPersonaje("auditoria", rasgo);
    acciones.actualizarRasgoPersonaje("auditoria", rasgo.id, { conjurosOtorgados: ["hechizo_b"] });
    const personaje = usarAlmacenDM.getState().personajes[0];
    expect(personaje.conjurosSiemprePreparadosIds).toEqual(["hechizo_b"]);
    expect(personaje.conjurosPreparadosIds).toEqual(["hechizo_b"]);
    expect(personaje.conjurosConocidosIds).toEqual(["hechizo_b"]);
  });

  it("mantiene un conjuro concedido por otro rasgo", () => {
    const acciones = usarAlmacenDM.getState();
    acciones.agregarRasgoPersonaje("auditoria", rasgo);
    acciones.agregarRasgoPersonaje("auditoria", { ...rasgo, id: "don_b" });
    acciones.actualizarRasgoPersonaje("auditoria", rasgo.id, { conjurosOtorgados: ["hechizo_b"] });
    expect(usarAlmacenDM.getState().personajes[0].conjurosSiemprePreparadosIds).toEqual(["hechizo_a", "hechizo_b"]);
  });

  it("mantiene conjuros otorgados por efectos de otro rasgo al eliminar", () => {
    const acciones = usarAlmacenDM.getState();
    acciones.agregarRasgoPersonaje("auditoria", rasgo);
    acciones.agregarRasgoPersonaje("auditoria", { ...rasgo, id: "don_b", conjurosOtorgados: [],
      efectos: [{ tipo: "conjuro_otorgado", objetivo: "conjuro", valor: "hechizo_a" }] });
    acciones.eliminarRasgoPersonaje("auditoria", rasgo.id);
    expect(usarAlmacenDM.getState().personajes[0].conjurosSiemprePreparadosIds).toContain("hechizo_a");
  });
});
