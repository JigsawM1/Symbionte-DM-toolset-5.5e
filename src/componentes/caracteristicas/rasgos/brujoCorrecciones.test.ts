import { beforeEach, describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { aplicarBuildClaseAPersonaje } from "@/servicios/gestorClases";
import { deshidratarPersonaje, hidratarPersonaje } from "@/servicios/serializadorPersonaje";
import { migrarMetadatosRasgos } from "@/servicios/migradorRasgosHeredados";
import { agruparRasgosJerarquicos, resolverRecursosPadre } from "@/componentes/caracteristicas/rasgos/utilidadesProgresionRasgos";
import { crearBorradorRasgo, construirRasgoDesdeBorrador } from "@/servicios/rasgos/borradorRasgo";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";

const crear = (subclase = "Patrón de los Archihadas") => aplicarBuildClaseAPersonaje({
  ...structuredClone(PERSONAJE_POR_DEFECTO), id: "brujo-correcciones", especie: "", rasgos: [],
  trucosConocidosIds: ["h_descarga-sobrenatural", "h_toque-helado"],
  caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 16 }
}, "Brujo", 9, subclase);
const pj = () => usarAlmacenDM.getState().personajes[0];

describe("Correcciones del Brujo: dados, agrupación y compatibilidad", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [crear()], idPersonajeActivo: "brujo-correcciones", colaIniciativa: [] }));

  it("restaura las fórmulas independientes y descuenta la reserva compartida sin rellenarla al recargar", () => {
    const pasos = pj().rasgos.find(r => r.nombre === "Pasos feéricos")!;
    const escapada = pj().rasgos.find(r => r.nombre === "Escapada brumosa")!;
    expect(pasos.formulaDados).toBe("1d10");
    expect(pasos.selectores).toEqual([]);
    expect(escapada.formulaDados).toBe("2d10");
    expect(escapada.heredarDadosPadre).toBe(false);
    expect(resolverRecursosPadre(pj(), escapada).formulaDadosEfectiva).toBe("2d10");
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj().id, escapada.id);
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj().id, pasos.id);
    const recargado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(pj()))));
    expect(recargado.rasgos.find(r => r.id === pasos.id)?.usosRestantes).toBe(1);
    expect(recargado.rasgos.find(r => r.id === escapada.id)?.formulaDados).toBe("2d10");
  });

  it("migra metadatos retirados conservando contador y notas, de forma idempotente", () => {
    const antiguo = crear("Patrón Celestial");
    const luz = antiguo.rasgos.find(r => r.nombre === "Luz sanadora")!;
    luz.usosRestantes = 2;
    luz.notas = "Reserva gastada en mesa";
    delete luz.tiradaCuracionManual;
    const guardado = { ...luz, curacionDirigida: { maxDados: "max(1, carisma)", alcance: 60 } };
    const [migrado] = migrarMetadatosRasgos([guardado]);
    expect(migrado).not.toHaveProperty("curacionDirigida");
    expect(migrado.tiradaCuracionManual).toEqual({ maxDados: "max(1, carisma)" });
    expect(migrado.usosRestantes).toBe(2);
    expect(migrado.notas).toBe(luz.notas);
    expect(migrarMetadatosRasgos([migrado])).toEqual([migrado]);
    const reconstruido = hidratarPersonaje({ ...antiguo, rasgos: [guardado] });
    expect(reconstruido.rasgos.find(r => r.id === luz.id)?.usosRestantes).toBe(2);
  });

  it("retira el selector antiguo y recupera las tiradas sin reiniciar el gasto", () => {
    const antiguo = crear();
    const pasos = antiguo.rasgos.find(r => r.nombre === "Pasos feéricos")!;
    pasos.usosRestantes = 1;
    pasos.formulaDados = undefined;
    pasos.selectores = [{ id: "efecto_pasos_feericos", tipo: "unico", etiqueta: "Consulta", modo: "consulta", maxSelecciones: 1, opciones: [], valorActual: [] }];
    const escapada = antiguo.rasgos.find(r => r.nombre === "Escapada brumosa")!;
    escapada.formulaDados = undefined;
    escapada.gastarDePadre = false;
    const migrados = migrarMetadatosRasgos(antiguo.rasgos);
    expect(migrados.find(r => r.id === pasos.id)?.selectores).toBeUndefined();
    expect(migrados.find(r => r.id === pasos.id)?.usosRestantes).toBe(1);
    expect(migrados.find(r => r.id === escapada.id)?.gastarDePadre).toBe(true);
    expect(migrados.find(r => r.id === escapada.id)?.formulaDados).toBe("2d10");
  });

  it("no sobrescribe rasgos personalizados que compartan el ID de un rasgo oficial", () => {
    const propio = { ...crear().rasgos.find(r => r.nombre === "Pasos feéricos")!, personalizado: true, formulaDados: "3d4" };
    expect(migrarMetadatosRasgos([propio])[0].formulaDados).toBe("3d4");
  });

  it("convierte la curación dirigida antigua de un rasgo personalizado sin perder su límite propio", () => {
    const propio = { ...crear("Patrón Celestial").rasgos.find(r => r.nombre === "Luz sanadora")!,
      personalizado: true, tiradaCuracionManual: undefined, curacionDirigida: { maxDados: "max(1, inteligencia)", alcance: 30 } };
    const [migrado] = migrarMetadatosRasgos([propio]);
    expect(migrado.tiradaCuracionManual).toEqual({ maxDados: "max(1, inteligencia)" });
    expect(migrado.usosRestantes).toBe(propio.usosRestantes);
    expect(migrado).not.toHaveProperty("curacionDirigida");
    expect(migrarMetadatosRasgos([migrado])).toEqual([migrado]);
  });

  it("Luz sanadora conserva la reserva y la configuración manual al pasar por el constructor y recargar", () => {
    const celestial = crear("Patrón Celestial");
    const luz = celestial.rasgos.find(r => r.nombre === "Luz sanadora")!;
    luz.usosRestantes = 2;
    const recargado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(celestial))));
    const efectivo = recargado.rasgos.find(r => r.id === luz.id)!;
    expect(efectivo.usosMaximos).toBe(10);
    expect(efectivo.usosRestantes).toBe(2);
    expect(efectivo).not.toHaveProperty("curacionDirigida");
    const personalizado = construirRasgoDesdeBorrador(crearBorradorRasgo(efectivo));
    expect(EsquemaRasgoPersonaje.parse(personalizado).tiradaCuracionManual).toEqual(efectivo.tiradaCuracionManual);
  });

  it("agrupa invocaciones repetidas por relación declarada, sin duplicarlas en Clase ni perder elecciones", () => {
    const padre = pj().rasgos.find(r => r.nombre === "Invocaciones sobrenaturales")!;
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id, padre.id, padre.selectores![0].id,
      ["descarga_agonica:h_descarga-sobrenatural", "descarga_agonica__dos:h_toque-helado", "pacto_del_grimorio"]);
    const libro = pj().rasgos.find(r => r.nombre === "Pacto del grimorio")!;
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id, libro.id, libro.selectores![0].id, ["h_rayo-de-escarcha"]);
    const recargado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(pj()))));
    const grupo = agruparRasgosJerarquicos(recargado.rasgos, recargado.clases!)["clases"][0];
    expect(grupo.rasgosInvocaciones).toHaveLength(3);
    expect(grupo.rasgosBase.some(r => r.idSelectorOrigen)).toBe(false);
    expect(grupo.rasgosInvocaciones!.find(r => r.id === libro.id)?.selectores![0].valorActual).toEqual(["h_rayo-de-escarcha"]);
    expect(grupo.rasgosInvocaciones!.filter(r => r.nombre === "Descarga agónica").map(r => r.selectores![0].valorActual))
      .toEqual([["h_descarga-sobrenatural"], ["h_toque-helado"]]);
    const hijo = grupo.rasgosInvocaciones![0];
    const filtrado = agruparRasgosJerarquicos([hijo], recargado.clases!, recargado.rasgos).clases[0];
    expect(filtrado.rasgoInvocaciones?.id).toBe(padre.id);
    expect(filtrado.rasgosInvocaciones).toEqual([hijo]);
    expect(filtrado.rasgosBase).toEqual([]);
  });
});
