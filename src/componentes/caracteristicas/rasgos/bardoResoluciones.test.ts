import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { aplicarBuildClaseAPersonaje } from "@/servicios/gestorClases";
import { tirarRasgoConResultado } from "./tirarRasgoConResultado";
import { elegirIniciativaOpcional } from "./elegirIniciativaOpcional";

const mocks = vi.hoisted(() => ({ tirar: vi.fn(), elegir: vi.fn() }));
vi.mock("@/utiles/lanzadorDados", () => ({ solicitarResultadoTirada: mocks.tirar }));
vi.mock("./elegirVarianteConjuro", () => ({ elegirOpcionLanzamiento: mocks.elegir }));
const actual = () => usarAlmacenDM.getState().personajes[0];
const recurso = () => actual().rasgos.find(r => r.nombre === "Inspiración bárdica")!;
const rasgo = (nombre: string) => actual().rasgos.find(r => r.nombre === nombre)!;
const sembrar = (colegio = "Colegio del Conocimiento", nivel = 14) => {
  const p = aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "resoluciones", especie: "",
    caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 18 } }, "Bardo", nivel, colegio);
  usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
};

describe("Resoluciones de Bardo: controles, emisión y recursos", () => {
  beforeEach(() => { vi.resetAllMocks();sembrar();mocks.tirar.mockResolvedValue({ totales: [7] }); });
  it("una emisión fallida de Habilidad inigualable libera su reserva", async () => {
    mocks.tirar.mockRejectedValue(new Error("Emisión fallida"));
    await tirarRasgoConResultado(actual().id, rasgo("Habilidad inigualable").id, "1d10");
    expect(recurso().usosRestantes).toBe(4);expect(actual().intentoRasgoPendiente).toBeUndefined();
    expect(mocks.elegir).not.toHaveBeenCalled();
  });
  it("cerrar tras tirar conserva el último uso reservado y reabrir no repite el dado", async () => {
    recurso().usosRestantes = 1;mocks.elegir.mockResolvedValueOnce(undefined).mockResolvedValueOnce("fallo");
    const id = rasgo("Habilidad inigualable").id;
    await tirarRasgoConResultado(actual().id, id, "1d10");
    expect(recurso().usosRestantes).toBe(0);expect(actual().intentoRasgoPendiente?.resultado).toBe(7);
    await tirarRasgoConResultado(actual().id, id, "1d10");
    expect(mocks.tirar).toHaveBeenCalledTimes(1);expect(recurso().usosRestantes).toBe(1);
  });
  it("una doble pulsación durante la emisión no crea dos intentos", async () => {
    let terminar!: (r: { totales: number[] }) => void;
    mocks.tirar.mockImplementation(() => new Promise(resolve => { terminar = resolve; }));
    mocks.elegir.mockResolvedValue("exito");const id = rasgo("Habilidad inigualable").id;
    const primera = tirarRasgoConResultado(actual().id, id, "1d10");
    await tirarRasgoConResultado(actual().id, id, "1d10");terminar({ totales: [7] });await primera;
    expect(mocks.tirar).toHaveBeenCalledTimes(1);expect(recurso().usosRestantes).toBe(3);
  });
  it("Manto de inspiración no gasta si falla la emisión", async () => {
    sembrar("Colegio del Glamour", 6);mocks.tirar.mockRejectedValue(new Error("Emisión fallida"));
    await tirarRasgoConResultado(actual().id, rasgo("Manto de inspiración").id, "1d8");
    expect(recurso().usosRestantes).toBe(4);
  });
  it("cancelar Tándem no emite ni consume; una emisión fallida tampoco consume", async () => {
    sembrar("Colegio de la Danza", 18);mocks.elegir.mockResolvedValueOnce(undefined);
    expect(await elegirIniciativaOpcional(actual().id)).toBeUndefined();expect(mocks.tirar).not.toHaveBeenCalled();
    mocks.elegir.mockResolvedValue(`${rasgo("Juego de pies en tándem").id}:antes`);
    mocks.tirar.mockRejectedValue(new Error("Emisión fallida"));
    expect(await elegirIniciativaOpcional(actual().id)).toBeUndefined();expect(recurso().usosRestantes).toBe(4);
  });
});
