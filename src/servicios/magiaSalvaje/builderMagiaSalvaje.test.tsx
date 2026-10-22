import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EsquemaMecanicasRasgo } from "@/tipos/mecanicasRasgos";
import { obtenerAccionesTabla, obtenerTablaRasgo, resolverTablaRasgo } from "@/servicios/rasgos/tablasAleatoriasRasgos";
import { operarCapacidadRasgo } from "@/servicios/rasgos/operacionesAvanzadasRasgos";
import { TablaAleatoriaRasgo } from "@/componentes/caracteristicas/rasgos/TablaAleatoriaRasgo";
import { TarjetaUltimaSobrecarga } from "@/componentes/caracteristicas/magiaSalvaje/TarjetaUltimaSobrecarga";
import { FilaSobrecargaMagiaSalvaje } from "@/componentes/caracteristicas/magiaSalvaje/FilaSobrecargaMagiaSalvaje";
import { deshidratarPersonaje, hidratarPersonaje } from "@/servicios/serializadorPersonaje";
import { obtenerEntradasMagiaSalvaje, buscarEntradaPorTirada, obtenerUltimoResultadoMagiaSalvaje } from "./servicioMagiaSalvaje";
import { personaje, ID_RASGO_TABLA_OLEADA, ID_RASGO_MAREAS_CAOS, ID_RASGO_OLEADA_DOMADA } from "./fixtures";

function personalizado() {
  const pj = personaje();
  const tabla = pj.rasgos.find(r => r.id === ID_RASGO_TABLA_OLEADA)!;
  const consulta = pj.rasgos.find(r => r.id === ID_RASGO_MAREAS_CAOS)!;
  const elegir = pj.rasgos.find(r => r.id === ID_RASGO_OLEADA_DOMADA)!;
  tabla.id = "tabla-propia"; tabla.nombre = "Tabla de prueba";
  tabla.tablaAleatoria!.filas = [
    { id: "primera", desde: 1, hasta: 50, texto: "Texto personalizado", titulo: "Efecto propio", subtiradas: [{ formula: "1d4", opciones: [{ numero: 1, texto: "Aliado propio" }] }] },
    { id: "ultima", desde: 51, hasta: 100, texto: "Fila final distinta de 97" }
  ];
  consulta.id = "acceso-propio"; consulta.tablaAleatoria!.idRasgoTabla = tabla.id;
  elegir.id = "eleccion-propia"; elegir.nombre = "Elegir en mi tabla"; elegir.tablaAleatoria!.idRasgoTabla = tabla.id;
  pj.rasgos = [tabla, consulta, elegir].map(r => ({ ...r, origen: "personalizado", personalizado: true }));
  return pj;
}

describe("Contrato de tablas en el builder", () => {
  it.each([[3, 1, false], [14, 2, false], [18, 2, true]] as const)("nivel %i construye las capacidades efectivas", (nivel, tiradas, domada) => {
    const pj = personaje(nivel);
    const tabla = resolverTablaRasgo(pj, ID_RASGO_MAREAS_CAOS)!;
    expect(tabla.configuracion).toMatchObject({ presentacion: "magia_salvaje", tiradas, modo: "aleatoria" });
    expect(tabla.configuracion.filas).toHaveLength(25);
    expect(obtenerAccionesTabla(pj, tabla.rasgoTabla.id).some(a => a.configuracion.modo === "elegir")).toBe(domada);
    const restaurado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(pj))));
    expect(resolverTablaRasgo(restaurado, ID_RASGO_MAREAS_CAOS)?.configuracion).toEqual(tabla.configuracion);
  });

  it("valida la presentación percentil y exige una referencia para consultar", () => {
    const esquema = EsquemaMecanicasRasgo.shape.tablaAleatoria;
    expect(esquema.safeParse({ dado: 20, presentacion: "magia_salvaje" }).success).toBe(false);
    expect(esquema.safeParse({ modo: "consultar" }).success).toBe(false);
    expect(esquema.safeParse({ modo: "consultar", idRasgoTabla: "tabla-propia" }).success).toBe(true);
  });

  it("el constructor rechaza IDs repetidos e identifica la fila duplicada", () => {
    const pj = personalizado();
    const cfg = pj.rasgos[0].tablaAleatoria!;
    cfg.filas![1].id = cfg.filas![0].id;
    const validacion = EsquemaMecanicasRasgo.shape.tablaAleatoria.safeParse(cfg);
    expect(validacion.success).toBe(false);
    if (!validacion.success) expect(validacion.error.issues).toContainEqual(expect.objectContaining({
      path: ["filas", 1, "id"], message: "ID de fila repetido: primera."
    }));
  });

  it("una ficha antigua con IDs repetidos no permite elegir ni gastar y conserva su historial", () => {
    const pj = personalizado();
    pj.rasgos[0].tablaAleatoria!.filas![1].id = "primera";
    pj.rasgos[2].resultadoTabla = { texto: "Resultado previo", enviado: false, id: "previo" };
    pj.rasgos[2].resultadosTablaPendientes = [{ texto: "Envío anterior", enviado: false, id: "pendiente" }];
    const anterior = structuredClone(pj);
    for (const r of pj.rasgos) {
      expect(resolverTablaRasgo(pj, r.id)).toBeUndefined();
      const html = renderToStaticMarkup(<TablaAleatoriaRasgo personaje={pj} rasgo={r} />);
      expect(html).toContain("Tabla no disponible"); expect(html).toContain("disabled");
    }
    expect(obtenerAccionesTabla(pj, "tabla-propia")).toEqual([]);
    expect(operarCapacidadRasgo(pj, { tipo: "guardarTabla", idRasgo: "eleccion-propia",
      texto: "Última fila excluida", detalle: { idFila: "primera" } })).toBeUndefined();
    expect(pj).toEqual(anterior);
  });

  it("resuelve también una extensión declarada en la ficha sin construir lógica de clase", () => {
    const pj = personalizado();
    pj.rasgos[0].tablaAleatoria!.tiradas = 1;
    pj.rasgos.push({ ...pj.rasgos[2], id: "extension-propia", categoriaMecanica: "extension", ligadoA: "tabla-propia",
      tablaAleatoria: { dado: 100, modo: "aleatoria", tiradas: 2 }, nivelRequerido: 14 });
    expect(resolverTablaRasgo(pj, "acceso-propio")?.configuracion.tiradas).toBe(2);
    expect(pj.rasgos[0].tablaAleatoria!.tiradas).toBe(1);
    pj.rasgos.at(-1)!.activo = false;
    expect(resolverTablaRasgo(pj, "acceso-propio")?.configuracion.tiradas).toBe(1);
  });

  it("usa filas, subtiradas y presentación de la ficha aunque cambien los IDs y nombres", () => {
    const pj = personalizado();
    const resuelta = resolverTablaRasgo(pj, "acceso-propio")!;
    const entradas = obtenerEntradasMagiaSalvaje(resuelta.filasCompletas);
    expect(buscarEntradaPorTirada(25, entradas)).toMatchObject({ id: "primera", texto: "Texto personalizado", titulo: "Efecto propio" });
    expect(entradas[0].subtiradas?.[0].opciones?.[0].texto).toBe("Aliado propio");
    expect(obtenerAccionesTabla(pj, "tabla-propia").map(a => a.rasgoAccion.id)).toEqual(["tabla-propia", "eleccion-propia"]);
    expect(renderToStaticMarkup(<TablaAleatoriaRasgo personaje={pj} rasgo={pj.rasgos[1]} />)).toContain("Ver Magia Salvaje");
    delete pj.rasgos[0].tablaAleatoria!.presentacion;
    expect(renderToStaticMarkup(<TablaAleatoriaRasgo personaje={pj} rasgo={pj.rasgos[1]} />)).toContain("Tirar en la tabla");
  });

  it("excluye la última fila declarada en UI y guardado, sin gastar recursos al rechazarla", () => {
    const pj = personalizado();
    const tabla = resolverTablaRasgo(pj, "eleccion-propia")!;
    expect(tabla.configuracion.filas.map(f => f.id)).toEqual(["primera"]);
    const ultima = obtenerEntradasMagiaSalvaje(tabla.filasCompletas)[1];
    const html = renderToStaticMarkup(<FilaSobrecargaMagiaSalvaje entrada={ultima} esActiva={false} modoSeleccionDomada elegible={false} />);
    expect(html).toContain("disabled"); expect(html).toContain("EXCLUIDO");
    const op = { tipo: "guardarTabla" as const, idRasgo: "eleccion-propia", texto: "No permitido", detalle: { idFila: "ultima" } };
    expect(operarCapacidadRasgo(pj, op)).toBeUndefined();
    expect(pj.rasgos[2].usosRestantes).toBe(1);
    pj.rasgos[2].tablaAleatoria!.excluirUltima = false;
    const siguiente = operarCapacidadRasgo(pj, op)!;
    expect(siguiente.rasgos[2].usosRestantes).toBe(0);
    expect(operarCapacidadRasgo(siguiente, op)).toBeUndefined();
  });

  it("revalida filas, nivel y recursos antes de guardar", () => {
    const pj = personalizado();
    const op = { tipo: "guardarTabla" as const, idRasgo: "eleccion-propia", texto: "Efecto", detalle: { idFila: "primera" } };
    expect(resolverTablaRasgo(pj, op.idRasgo)?.disponible).toBe(true);
    expect(operarCapacidadRasgo(pj, { ...op, detalle: { idFila: "primera", tiradaD100: 60 } })).toBeUndefined();
    pj.rasgos[0].tablaAleatoria!.filas![0].id = "otra";
    expect(operarCapacidadRasgo(pj, op)).toBeUndefined();
    pj.rasgos[0].tablaAleatoria!.filas![0].id = "primera";
    pj.rasgos[2].usosRestantes = 0;
    expect(resolverTablaRasgo(pj, op.idRasgo)?.disponible).toBe(false);
    expect(operarCapacidadRasgo(pj, op)).toBeUndefined();
    pj.rasgos[2].usosRestantes = 1; pj.rasgos[2].nivelRequerido = 20;
    expect(operarCapacidadRasgo(pj, op)).toBeUndefined();
  });

  it.each(["ausente", "tabla-propia", "eleccion-propia"])("rechaza referencias inválidas (%s)", referencia => {
    const pj = personalizado();
    pj.rasgos[0].tablaAleatoria!.idRasgoTabla = referencia;
    expect(obtenerTablaRasgo(pj, pj.rasgos[0])).toBeUndefined();
    expect(operarCapacidadRasgo(pj, { tipo: "guardarTabla", idRasgo: "tabla-propia", texto: "Inválida", detalle: { idFila: "primera" } })).toBeUndefined();
    const html = renderToStaticMarkup(<TablaAleatoriaRasgo personaje={pj} rasgo={pj.rasgos[0]} />);
    expect(html).toContain("Tabla no disponible"); expect(html).toContain("disabled");
  });

  it("conserva tablas y resultados personalizados al persistir y usa texto histórico para filas retiradas", () => {
    const pj = personalizado();
    pj.rasgos[1].resultadoTabla = { texto: "Efecto histórico retirado", enviado: false, idFila: "retirada", fecha: 30 };
    const restaurado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(pj))));
    expect(resolverTablaRasgo(restaurado, "acceso-propio")?.configuracion.filas).toEqual(pj.rasgos[0].tablaAleatoria!.filas);
    const propietario = obtenerUltimoResultadoMagiaSalvaje(restaurado, "tabla-propia")!;
    expect(propietario.id).toBe("acceso-propio");
    const html = renderToStaticMarkup(<TarjetaUltimaSobrecarga resultado={propietario.resultadoTabla} alReintentarEnvio={() => {}} enviandoChat={false} />);
    expect(html).toContain("Efecto histórico retirado");
  });

  it("mantiene recargar en tablas genéricas y guarda idFila", () => {
    const pj = personalizado();
    delete pj.rasgos[0].tablaAleatoria!.presentacion;
    pj.rasgos[1].tablaAleatoria!.modo = "recargar";
    pj.rasgos[1].usosRestantes = 0;
    const op = { tipo: "guardarTabla" as const, idRasgo: "acceso-propio", texto: "Recarga", detalle: { idFila: "primera" } };
    const siguiente = operarCapacidadRasgo(pj, op)!;
    expect(siguiente.rasgos[1]).toMatchObject({ usosRestantes: 1, resultadoTabla: { idFila: "primera" } });
    expect(operarCapacidadRasgo(siguiente, op)).toBeUndefined();
  });
});
