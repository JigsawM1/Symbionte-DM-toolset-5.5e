import { beforeEach, describe, expect, it, vi } from "vitest";
import { ts } from "./TaleSpireAdapter";
import { lanzarDadosTaleSpire, procesarResultadosDadosTaleSpire, crearDescriptoresManualmente, limpiarRegistrosTiradas } from "./lanzadorDados";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { DescriptorTirada } from "@/tipos/talespire";

describe("Resultados nativos simulados de curación por rasgo", () => {
  beforeEach(() => {
    vi.restoreAllMocks(); limpiarRegistrosTiradas();
    usarAlmacenDM.setState({ tipoTirada: "plano", personajes: [{ ...structuredClone(PERSONAJE_POR_DEFECTO),
      id:"curacion", nombre:"Prueba", hpActual:1, hpMaximo:100, hpMaximoBase:100, rasgos:[] }] });
  });
  it("aplica una sola vez el resultado de varios d12 aunque llegue simultáneamente duplicado", async () => {
    vi.spyOn(ts,"estaDisponible","get").mockReturnValue(true);
    vi.spyOn(ts.debug,"log").mockImplementation(()=>{});
    vi.spyOn(ts.dice,"isValidRollString").mockReturnValue(true);
    vi.spyOn(ts.dice,"makeRollDescriptors").mockImplementation(async f=>crearDescriptoresManualmente(f) as DescriptorTirada[]);
    vi.spyOn(ts.dice,"putDiceInTray").mockResolvedValue("curacion-d12");
    let completar: (total: number)=>void = ()=>{};
    const resultado = new Promise<number>(resolver=>{completar=resolver;});
    const evaluar=vi.spyOn(ts.dice,"evaluateDiceResultsGroup").mockReturnValue(resultado);
    const curar=vi.spyOn(usarAlmacenDM.getState(),"aplicarCuracionPersonaje");
    expect(await lanzarDadosTaleSpire("2d12","Curación propia",undefined,undefined,undefined,
      {tipo:"curacionRasgo",personajeId:"curacion",rasgoId:"reserva",nombreRasgo:"Curación propia",cantidadDadosGastados:2})).toBe(true);
    const evento={rollId:"curacion-d12",resultsGroups:[{name:"Curación propia",result:{value:13}}]};
    const primero=procesarResultadosDadosTaleSpire(evento);
    const duplicado=procesarResultadosDadosTaleSpire(evento);
    completar(13); await Promise.all([primero,duplicado]);
    expect(evaluar).toHaveBeenCalledTimes(1); expect(curar).toHaveBeenCalledTimes(1);
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(14);
    await procesarResultadosDadosTaleSpire(evento); expect(curar).toHaveBeenCalledTimes(1);
  });
});
