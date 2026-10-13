import { describe, expect, it, vi } from "vitest";
import { emitirSalvacionConRasgos } from "./emisionSalvacionRasgos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaRasgoPersonaje } from "@/tipos";
import { crearBorradorRasgo, construirRasgoDesdeBorrador } from "./borradorRasgo";
import { resolverRecursosPadre } from "./evaluadorRecursosRasgos";
import { obtenerResumenDefensasRasgos } from "./resumenDefensasRasgos";
import { sincronizarRasgosAutomaticos } from "../compendioRasgos";
import { obtenerOpcionesDotesEstiloCombate } from "../clases/dotesClase";

const rasgo = (id: string) => EsquemaRasgoPersonaje.parse({ id, nombre: "Nombre propio", activo: true, origen: "personalizado", personalizado: true });
describe("Capacidades reutilizables de rasgos", () => {
  it("un fallo conserva el estado y un envío exitoso lo desactiva una sola vez", async () => {
    const pj = { ...PERSONAJE_POR_DEFECTO, rasgos: [{ ...rasgo("propio"), autoDesactivarAlTirarSalvacion: true }] };
    const apagar = vi.fn();
    expect(await emitirSalvacionConRasgos(pj, async () => false, apagar)).toBe(false);
    expect(apagar).not.toHaveBeenCalled();
    expect(await emitirSalvacionConRasgos(pj, async () => true, apagar)).toBe(true);
    expect(apagar).toHaveBeenCalledTimes(1);
    expect(apagar).toHaveBeenCalledWith("propio");
  });
  it("un doble clic durante el envío no emite una segunda salvación", async () => {
    const pj = { ...PERSONAJE_POR_DEFECTO, rasgos: [{ ...rasgo("propio"), autoDesactivarAlTirarSalvacion: true }] };
    let terminar!: (resultado: boolean) => void;
    const emisor = vi.fn(() => new Promise<boolean>(resolve => { terminar = resolve; }));
    const apagar = vi.fn();
    const primera = emitirSalvacionConRasgos(pj, emisor, apagar);
    expect(await emitirSalvacionConRasgos(pj, emisor, apagar)).toBe(false);
    terminar(true);
    await primera;
    expect(emisor).toHaveBeenCalledTimes(1);
    expect(apagar).toHaveBeenCalledTimes(1);
  });
  it("una extensión nueva del builder modifica el dado del padre sin alterar la declaración", () => {
    const padre = { ...rasgo("reserva"), formulaDados: "1d8" };
    const b = crearBorradorRasgo();
    Object.assign(b, { nombre: "Mejora propia", categoriaMecanica: "extension", ligadoA: padre.id, formulaDados: "1d12" });
    const extension = construirRasgoDesdeBorrador(b);
    const pj = { ...PERSONAJE_POR_DEFECTO, rasgos: [padre, extension] };
    expect(resolverRecursosPadre(pj, padre).formulaDadosEfectiva).toBe("1d12");
    expect(padre.formulaDados).toBe("1d8");
    expect(crearBorradorRasgo(extension).ligadoA).toBe(padre.id);
  });
  it("el resumen deduplica fuentes y distingue daño de condiciones", () => {
    const pj = { ...PERSONAJE_POR_DEFECTO, especie: "", rasgos: [{ ...rasgo("defensas"), efectos: [
      { tipo: "resistencia_dano" as const, objetivo: "Fuego", valor: "true" },
      { tipo: "resistencia_dano" as const, objetivo: "fuego", valor: "true" },
      { tipo: "inmunidad_dano" as const, objetivo: "Veneno", valor: "true" },
      { tipo: "inmunidad_condicion" as const, objetivo: "Hechizado", valor: "true" }
    ] }] };
    const resultado = obtenerResumenDefensasRasgos(pj);
    expect(resultado.resistencias).toHaveLength(1);
    expect(resultado.inmunidadesDano).toEqual(["Veneno"]);
    expect(resultado.inmunidadesCondiciones).toEqual(["Hechizado"]);
  });
  it("resincronizar reconstruye el estilo de un selector homebrew sin depender de su nombre", () => {
    const padre = { ...rasgo("propio"), selectores: [{ id: "eleccion", tipo: "unico" as const, tipoSelector: "dote" as const,
      categoriaDote: "estilo_combate" as const, etiqueta: "Don", opciones: obtenerOpcionesDotesEstiloCombate(""),
      maxSelecciones: 1, valorActual: ["dote_estilo_defensa"] }] };
    const resultado = sincronizarRasgosAutomaticos({ ...PERSONAJE_POR_DEFECTO, rasgos: [padre] });
    expect(resultado.find(r => r.origen === "dote" && r.ligadoA === padre.id)?.nombre).toBe("Defensa");
  });
});
