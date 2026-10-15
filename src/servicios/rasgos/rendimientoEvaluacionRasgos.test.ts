import { afterEach, describe, expect, it, vi } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaRasgoPersonaje, type PersonajeJugador, type SelectorRasgo } from "@/tipos";
import { resolverExtensionesRasgos } from "./extensionesRasgos";
import { opcionesElegiblesConjuros, seleccionOpcionValida } from "./seleccionesRasgos";

const rasgo = (id: string) => EsquemaRasgoPersonaje.parse({ id, nombre: id, descripcion: "Base",
  tipoAccion: "pasivo", origen: "personalizado", personalizado: true, fuente: "Prueba", nivelRequerido: 1 });
const selector = (): SelectorRasgo => ({ id: "trucos", tipo: "unico", tipoSelector: "conjuro", etiqueta: "Trucos",
  maxSelecciones: 1, valorActual: [], filtroConjuros: { soloConocidos: true, requiereDano: true },
  opciones: ["h_rayo-de-escarcha", "h_descarga-sobrenatural"].map(id => ({ id, nombre: id, descripcion: "" })) });
const personaje = (): PersonajeJugador => ({ ...structuredClone(PERSONAJE_POR_DEFECTO),
  trucosConocidosIds: ["h_rayo-de-escarcha"], rasgos: [] });

afterEach(() => { vi.restoreAllMocks(); });

describe("Proyección de extensiones sin copiar catálogos ajenos", () => {
  it("no copia profundamente rasgos cuando no hay una extensión adquirida", () => {
    const padre = rasgo("padre");
    const futura = { ...rasgo("futura"), categoriaMecanica: "extension" as const, ligadoA: padre.id, nivelRequerido: 6 };
    const clonar = vi.spyOn(globalThis, "structuredClone");
    expect(resolverExtensionesRasgos([padre, futura], 5)).toEqual([padre]);
    expect(clonar).not.toHaveBeenCalled();
  });
  it("fusiona varias extensiones copiando solo su padre una vez y sin mutar el original", () => {
    const padre = rasgo("padre");
    padre.selectores = [{ ...selector(), filtroConjuros: undefined }];
    const ajeno = rasgo("ajeno");
    const primera = { ...rasgo("primera"), categoriaMecanica: "extension" as const, ligadoA: padre.id,
      selectores: [{ ...selector(), maxSelecciones: 2, opciones: [{ id: "extra", nombre: "Extra", descripcion: "" }] }] };
    const segunda = { ...rasgo("segunda"), categoriaMecanica: "extension" as const, ligadoA: padre.id, nivelRequerido: 6,
      efectos: [{ tipo: "bono_ataque" as const, objetivo: "todos_ataques", valor: 1 }] };
    const originales = [padre, ajeno, segunda, primera];
    const antes = structuredClone(originales);
    const clonar = vi.spyOn(globalThis, "structuredClone");
    const efectivos = resolverExtensionesRasgos(originales, 6);
    expect(clonar).toHaveBeenCalledTimes(1);
    expect(efectivos[0].selectores?.[0].opciones.map(o => o.id)).toContain("extra");
    expect(efectivos[0].selectores?.[0].maxSelecciones).toBe(2);
    expect(efectivos[0].efectos).toEqual(segunda.efectos);
    expect(originales).toEqual(antes);
    expect(resolverExtensionesRasgos(originales, 6)).toEqual(efectivos);
    expect(resolverExtensionesRasgos([padre, ajeno, primera], 5)[0].efectos).toEqual(padre.efectos);
  });
  it("no aplica extensiones apagadas o sin padre", () => {
    const padre = rasgo("padre");
    const extension = { ...rasgo("extension"), categoriaMecanica: "extension" as const, ligadoA: padre.id, activo: false };
    expect(resolverExtensionesRasgos([padre, extension], 20)).toEqual([padre]);
    expect(resolverExtensionesRasgos([{ ...extension, activo: true }], 20)).toEqual([]);
  });
});

describe("Validación puntual de elecciones sin recorrer todos los conjuros", () => {
  it("coincide con el filtro completo para opciones conocidas, bloqueadas y desconocidas", () => {
    const s = selector();
    const pj = personaje();
    for (const id of [...s.opciones.map(o => o.id), "desconocido"]) {
      expect(seleccionOpcionValida(s, id, [id], 9, pj)).toBe(opcionesElegiblesConjuros(s, pj).some(o => o.id === id));
    }
  });
  it("comprueba requisitos anidados y argumentos con alias tras cambiar los trucos conocidos", () => {
    const hijo = selector();
    const padre: SelectorRasgo = { ...selector(), tipoSelector: "invocacion", filtroConjuros: undefined,
      opciones: [{ id: "invocacion", nombre: "Invocación", descripcion: "", repetible: true, selectores: [hijo] }] };
    const pj = personaje();
    expect(seleccionOpcionValida(padre, "invocacion:Rayo de escarcha", ["invocacion:Rayo de escarcha"], 9, pj)).toBe(true);
    expect(seleccionOpcionValida(padre, "invocacion:h_descarga-sobrenatural", [], 9, pj)).toBe(false);
    pj.trucosConocidosIds = [];
    expect(seleccionOpcionValida(padre, "invocacion", [], 9, pj)).toBe(false);
    pj.trucosConocidosIds = ["h_descarga-sobrenatural"];
    expect(seleccionOpcionValida(padre, "invocacion:h_descarga-sobrenatural", [], 9, pj)).toBe(true);
  });
  it("detiene la consulta de un selector anidado al encontrar una opción elegible", () => {
    const hijo = selector();
    const leerSegunda = vi.fn(() => "h_descarga-sobrenatural");
    Object.defineProperty(hijo.opciones[1], "id", { get: leerSegunda });
    const padre: SelectorRasgo = { ...selector(), filtroConjuros: undefined,
      opciones: [{ id: "invocacion", nombre: "Invocación", descripcion: "", selectores: [hijo] }] };
    expect(seleccionOpcionValida(padre, "invocacion", [], 9, personaje())).toBe(true);
    expect(leerSegunda).not.toHaveBeenCalled();
  });
});
