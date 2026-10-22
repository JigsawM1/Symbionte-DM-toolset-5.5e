import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ts } from "@/utiles/TaleSpireAdapter";
import { limpiarRegistrosTiradas, procesarResultadosDadosTaleSpire, crearDescriptoresManualmente } from "@/utiles/lanzadorDados";
import { operarCapacidadRasgo } from "@/servicios/rasgos/operacionesAvanzadasRasgos";
import { deshidratarPersonaje, hidratarPersonaje } from "@/servicios/serializadorPersonaje";
import { PanelCaosControlado } from "@/componentes/caracteristicas/magiaSalvaje/PanelCaosControlado";
import { TarjetaUltimaSobrecarga } from "@/componentes/caracteristicas/magiaSalvaje/TarjetaUltimaSobrecarga";
import { FilaSobrecargaMagiaSalvaje } from "@/componentes/caracteristicas/magiaSalvaje/FilaSobrecargaMagiaSalvaje";
import { TablaAleatoriaRasgo } from "@/componentes/caracteristicas/rasgos/TablaAleatoriaRasgo";
import {
  combinarPercentil, solicitarPercentiles, resolverSubtiradasDeFila,
  obtenerUltimoResultadoMagiaSalvaje as ultimo, obtenerEnviosPendientesMagiaSalvaje as pendientes
} from "./servicioMagiaSalvaje";
import { resolverTablaRasgo } from "@/servicios/rasgos/tablasAleatoriasRasgos";
import { personaje, buscarEntrada as buscarEntradaPorTirada, ID_RASGO_TABLA_OLEADA, ID_RASGO_MAREAS_CAOS, ID_RASGO_OLEADA_DOMADA } from "./fixtures";
import type { DescriptorTirada, GrupoResultadosTirada } from "@/tipos/talespire";

afterEach(() => { limpiarRegistrosTiradas(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const obtenerUltimoResultadoMagiaSalvaje = (pj: ReturnType<typeof personaje>) => ultimo(pj, ID_RASGO_TABLA_OLEADA);
const obtenerEnviosPendientesMagiaSalvaje = (pj: ReturnType<typeof personaje>) => pendientes(pj, ID_RASGO_TABLA_OLEADA);

describe("Dados percentiles", () => {
  it.each([[0, 10, 100], [100, 10, 100], [0, 1, 1], [40, 10, 40], [90, 9, 99], [20, 7, 27]])(
    "%i decenas y %i unidades producen %i", (d, u, esperado) => expect(combinarPercentil(d, u)).toBe(esperado)
  );
  it("cubre cada percentil exactamente una vez con las cien combinaciones físicas", () => {
    const valores = Array.from({ length: 10 }, (_, d) => Array.from({ length: 10 }, (_, u) => combinarPercentil(d * 10, u + 1))).flat();
    expect(valores.sort((a, b) => a - b)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(() => combinarPercentil(37, 4)).toThrow();
  });
  it("resuelve dos pares físicos independientes aunque TaleSpire devuelva los grupos en otro orden", async () => {
    vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(true);
    let nombres: string[] = [];
    const descriptores = vi.spyOn(ts.dice, "makeRollDescriptors").mockImplementation(async formula => {
      nombres = formula.split("/").map(g => g.split(":")[0]);
      return crearDescriptoresManualmente(formula) as DescriptorTirada[];
    });
    const emision = vi.spyOn(ts.dice, "putDiceInTray").mockResolvedValue("percentiles-fisicos");
    const evaluar = vi.spyOn(ts.dice, "evaluateDiceResultsGroup")
      .mockImplementation(async g => ((g as GrupoResultadosTirada).result as { value: number }).value);
    const pendiente = solicitarPercentiles(2);
    await vi.waitFor(() => expect(emision).toHaveBeenCalledOnce());
    const grupos = [0, 10, 40, 2].map((value, i) => ({ name: nombres[i], result: { value } }));
    await procesarResultadosDadosTaleSpire({ rollId: "percentiles-fisicos", resultsGroups: grupos.reverse() });
    expect(await pendiente).toEqual({ origen: "talespire", tiradas: [100, 42] });
    expect(descriptores.mock.calls[0][0].match(/1d100/g)).toHaveLength(2);
    expect(descriptores.mock.calls[0][0].match(/1d10\b/g)).toHaveLength(2);
    expect(evaluar).toHaveBeenCalledTimes(4);
    await procesarResultadosDadosTaleSpire({ rollId: "percentiles-fisicos", resultsGroups: grupos });
    expect(evaluar).toHaveBeenCalledTimes(4);
  });
  it("el modo local compone decenas y unidades con la misma convención", async () => {
    vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(false);
    const valores = [0, 0.99, 0.4, 0.99];
    expect((await solicitarPercentiles(2, undefined, () => valores.shift() ?? 0)).tiradas).toEqual([100, 40]);
  });
});

describe("Tabla única, subtiradas y elección de efectos", () => {
  it("un envío nativo sin retorno confirma la oleada y no crea falsos pendientes al volver a tirar", async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("TS", { chat: { send: enviar } });
    const pj = personaje();
    const guardado = operarCapacidadRasgo(pj, { tipo: "guardarTabla", idRasgo: ID_RASGO_TABLA_OLEADA,
      texto: "Oleada enviada", detalle: { id: "enviada", idFila: "oleada_1", estadoEnvio: "pendiente" } })!;
    expect(await ts.chat.send("Oleada enviada")).toBe(true);
    const confirmado = operarCapacidadRasgo(guardado, { tipo: "enviarTabla", idRasgo: ID_RASGO_TABLA_OLEADA, idResultado: "enviada" })!;
    expect(obtenerUltimoResultadoMagiaSalvaje(confirmado)?.resultadoTabla?.enviado).toBe(true);
    const siguiente = operarCapacidadRasgo(confirmado, { tipo: "guardarTabla", idRasgo: ID_RASGO_TABLA_OLEADA,
      texto: "Segunda oleada", detalle: { id: "segunda", idFila: "oleada_9", estadoEnvio: "pendiente" } })!;
    expect(obtenerEnviosPendientesMagiaSalvaje(siguiente)).toHaveLength(0);
    expect(enviar).toHaveBeenCalledOnce();
  });
  it.each([undefined, "oleada-anterior"])("permite volver a tirar con un envío pendiente y lo conserva al recargar (%s)", id => {
    const pj = personaje();
    const tabla = pj.rasgos.find(r => r.id === ID_RASGO_TABLA_OLEADA)!;
    const anterior = { id, texto: "Oleada pendiente anterior", enviado: false };
    tabla.resultadoTabla = anterior;
    const actualizado = operarCapacidadRasgo(pj, { tipo: "guardarTabla", idRasgo: tabla.id, texto: "Nueva oleada",
      detalle: { id: "oleada-nueva", idFila: "oleada_9", fecha: 20, estadoEnvio: "pendiente" } })!;
    expect(actualizado).toBeDefined();
    const restaurado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(actualizado))));
    expect(restaurado.rasgos.find(r => r.id === ID_RASGO_TABLA_OLEADA)?.tablaAleatoria?.filas?.find(f => f.id === "oleada_5"))
      .toMatchObject({ titulo: "INVOCACIÓN DE ALIADO", badge: "Subtabla 1d4", duracion: "1 MINUTO" });
    expect(obtenerEnviosPendientesMagiaSalvaje(restaurado)).toEqual([{ idRasgo: tabla.id, resultado: anterior }]);
    expect(obtenerUltimoResultadoMagiaSalvaje(restaurado)?.resultadoTabla?.id).toBe("oleada-nueva");
    const confirmado = operarCapacidadRasgo(restaurado, { tipo: "enviarTabla", idRasgo: tabla.id,
      idResultado: id, textoResultado: anterior.texto })!;
    expect(obtenerEnviosPendientesMagiaSalvaje(confirmado)).toHaveLength(0);
    expect(obtenerUltimoResultadoMagiaSalvaje(confirmado)?.resultadoTabla?.enviado).toBe(false);
    expect(pj.rasgos.find(r => r.id === tabla.id)?.resultadoTabla).toEqual(anterior);
  });
  it("una confirmación tardía no marca como enviada una oleada diferente", () => {
    const pj = personaje();
    const tabla = pj.rasgos.find(r => r.id === ID_RASGO_TABLA_OLEADA)!;
    tabla.resultadoTabla = { texto: "Actual sin identificador", enviado: false };
    expect(operarCapacidadRasgo(pj, { tipo: "enviarTabla", idRasgo: tabla.id, idResultado: "otro" })).toBeUndefined();
    expect(operarCapacidadRasgo(pj, { tipo: "enviarTabla", idRasgo: tabla.id, textoResultado: "Otro texto" })).toBeUndefined();
  });
  it("abrir desde Mareas permite tirar normalmente con usos disponibles o agotados y sin modificar su estado", () => {
    const pj = personaje();
    const mareas = pj.rasgos.find(r => r.id === ID_RASGO_MAREAS_CAOS)!;
    for (const [activo, usos] of [[false, 1], [true, 1], [false, 0]] as const) {
      mareas.activo = activo;
      mareas.usosRestantes = usos;
      const r = resolverTablaRasgo(pj, mareas.id)!.rasgoAccion;
      expect(r.id).toBe(ID_RASGO_TABLA_OLEADA);
      expect(r.tablaAleatoria?.modo).toBe("aleatoria");
      expect(r.tablaAleatoria?.tiradas).toBe(2);
      const siguiente = operarCapacidadRasgo(pj, { tipo: "guardarTabla", idRasgo: mareas.id, texto: "Oleada libre", detalle: { idFila: "oleada_9", estadoEnvio: "local" } })!;
      expect(siguiente.rasgos.find(x => x.id === mareas.id)).toEqual(mareas);
      expect(mareas.usosRestantes).toBe(usos);
    }
  });
  it("Oleada domada conserva el modo de elección de filas", () => {
    const pj = personaje();
    expect(resolverTablaRasgo(pj, ID_RASGO_OLEADA_DOMADA)?.configuracion.modo).toBe("elegir");
  });
  it("guarda y restaura la subtabla del rasgo de origen y muestra el resultado tanto en la tarjeta como en su fila", async () => {
    vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(false);
    const pj = personaje();
    const mareas = pj.rasgos.find(r => r.id === ID_RASGO_MAREAS_CAOS)!;
    mareas.usosRestantes = 0; mareas.activo = false;
    const fila = buscarEntradaPorTirada(6)!;
    const subtiradas = await resolverSubtiradasDeFila(fila, undefined, () => 0.3);
    // Resultado histórico que pertenecía a Mareas antes de convertirlo en acceso de consulta.
    mareas.resultadoTabla = { texto: "Oleada confirmada", enviado: false,
      id: "resultado-6", fecha: 10, tiradaD100: 6, idFila: fila.id, subtiradas, estadoEnvio: "local" };
    const restaurado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(pj))));
    expect(restaurado.rasgos.find(r => r.id === mareas.id)?.usosRestantes).toBe(0);
    const resultado = obtenerUltimoResultadoMagiaSalvaje(restaurado)!.resultadoTabla!;
    expect(resultado.subtiradas?.[0]).toMatchObject({ total: 2, opcionElegida: "Flumph" });
    const tarjeta = renderToStaticMarkup(<TarjetaUltimaSobrecarga resultado={resultado} entrada={fila} alReintentarEnvio={() => {}} enviandoChat={false} />);
    const htmlFila = renderToStaticMarkup(<FilaSobrecargaMagiaSalvaje entrada={fila} esActiva subtiradasResultado={resultado.subtiradas} />);
    for (const html of [tarjeta, htmlFila]) { expect(html).toContain("Resultado de las subtiradas"); expect(html).toContain("Flumph"); }
  });
  it("resuelve las subtiradas condicionales de curación solo para la opción elegida", async () => {
    vi.spyOn(ts, "estaDisponible", "get").mockReturnValue(false);
    expect(await resolverSubtiradasDeFila(buscarEntradaPorTirada(100)!, undefined, () => 0)).toMatchObject([
      { formula: "1d6", total: 1 }, { formula: "2d10", total: 2 }
    ]);
    expect(await resolverSubtiradasDeFila(buscarEntradaPorTirada(100)!, undefined, () => 0.99)).toHaveLength(1);
  });
  it("muestra el efecto completo de ambas alternativas antes de elegir, sin botones de tiradas auxiliares", () => {
    const a = buscarEntradaPorTirada(6)!; const b = buscarEntradaPorTirada(26)!;
    const html = renderToStaticMarkup(<PanelCaosControlado eleccion={{ tiradaA: 6, entradaA: a, tiradaB: 26, entradaB: b, origen: "local" }} alElegir={() => {}} />);
    expect(html).toContain("La criatura está bajo el control del DM");
    expect(html).toContain("Plano Astral");
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain("Elegir opción A"); expect(html).toContain("Elegir opción B");
  });
  it("los rasgos que usan la tabla muestran únicamente el acceso a la pantalla compartida", () => {
    const pj = personaje();
    for (const id of [ID_RASGO_TABLA_OLEADA, ID_RASGO_MAREAS_CAOS, ID_RASGO_OLEADA_DOMADA]) {
      const r = pj.rasgos.find(x => x.id === id)!;
      expect(resolverTablaRasgo(pj, r.id)?.configuracion.presentacion).toBe("magia_salvaje");
      const html = renderToStaticMarkup(<TablaAleatoriaRasgo personaje={pj} rasgo={r} />);
      expect(html.match(/<button/g)).toHaveLength(1);
      expect(html).toContain("Ver Magia Salvaje"); expect(html).not.toContain("Tirar en la tabla");
    }
    expect(resolverTablaRasgo(pj, pj.rasgos.find(r => r.nombre === "Torcer la suerte")!.id)).toBeUndefined();
  });
  it("la elección de Oleada domada guarda la fila y consume solo el uso propio una vez", () => {
    const pj = personaje();
    const op = { tipo: "guardarTabla" as const, idRasgo: ID_RASGO_OLEADA_DOMADA, texto: "Efecto elegido", detalle: { idFila: "oleada_25", estadoEnvio: "local" as const } };
    const siguiente = operarCapacidadRasgo(pj, op)!;
    expect(siguiente.rasgos.find(r => r.id === op.idRasgo)?.usosRestantes).toBe(0);
    expect(operarCapacidadRasgo(siguiente, op)).toBeUndefined();
    expect(siguiente.rasgos.find(r => r.id === ID_RASGO_TABLA_OLEADA)?.resultadoTabla).toBeUndefined();
  });
});
