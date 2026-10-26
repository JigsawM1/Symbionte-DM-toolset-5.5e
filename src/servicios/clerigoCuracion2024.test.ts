import { describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { aplicarBuildClaseAPersonaje } from "./gestorClases";
import { prepararLanzamiento, type SolicitudLanzamiento } from "./servicioLanzamientoConjuros";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { formulaCuracionConjuro, maximizarDadosCuracion, resolverCuracionPendiente, formulaCuracionPendiente } from "./rasgos/curacionDeclarativa";
import { aplicarResolucionAsistida, prepararResolucionAsistida } from "./rasgos/resolucionAsistidaRasgos";
import { obtenerConjurosSubclasePersonaje } from "./calculadorMagia";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { EsquemaHechizoBase, type PersonajeJugador } from "@/tipos";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { sincronizarMagiaMulticlase } from "./sincronizadorMulticlase";

const sanador = "rasgo_sub_vida_sanador_bendito";
const discipulo = "rasgo_sub_vida_discipulo_vida";
const h = (id: string) => EsquemaHechizoBase.parse(HECHIZOS_INICIALES.find(h => h.id === id));
const crear = (nivel = 17) => ({ ...aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "vida", especie: "",
  caracteristicas: { fuerza: 10, destreza: 10, constitucion: 12, inteligencia: 20, sabiduria: 16, carisma: 18 }
}, "Clérigo", nivel, "Dominio de la Vida"), hpActual: 10, hpMaximo: 100 });
const r = (p: PersonajeJugador, id: string) => p.rasgos.find(r => r.id === id)!;
function lanzar(p: PersonajeJugador, id: string, nivel = h(id).nivel, modo: SolicitudLanzamiento["modo"] = "espacio") {
  const s = aplicarConfiguracionConjurosRasgos(p, { modo, hechizo: h(id), nivelLanzamiento: nivel, claseLanzamiento: "Clérigo", curacionEnTurno: true });
  const preparado = prepararLanzamiento(s, { personajeActual: p, espaciosConjuroMaximos: p.espaciosConjuroMaximos });
  const resultado = consumirRecursoConjuro(p, preparado.gasto);
  if (!resultado.permitido) throw new Error(resultado.motivo);
  return { preparado, personaje: resultado.personaje };
}

describe("Vida 2024: curación declarativa y procedencia mágica", () => {
  it.each([1, 3, 5, 9])("curación directa de nivel %i: escala, maximiza y suma el espacio real una vez", nivel => {
    const p = crear(); const { preparado, personaje } = lanzar(p, "h_curar-heridas", nivel);
    expect(preparado.formula.formulaTaleSpire).toContain("Curación");
    expect(preparado.formula.formulaTaleSpire).not.toMatch(/\d+d\d+/);
    expect(preparado.formula.formulaTaleSpire.endsWith(`+3+${nivel + 2}`)).toBe(true);
    expect(r(personaje, sanador).resolucionesCuracionPendientes).toHaveLength(1);
    const pendiente = r(personaje, sanador).resolucionesCuracionPendientes![0];
    const guardado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(personaje))), HECHIZOS_INICIALES);
    const aplicado = resolverCuracionPendiente(guardado, sanador, pendiente.id, true, nivel + 2)!;
    expect(aplicado.hpActual).toBe(12 + nivel);
    expect(resolverCuracionPendiente(aplicado, sanador, pendiente.id, true, nivel + 2)).toBeUndefined();
    expect(r(aplicarBuildClaseAPersonaje(aplicado, "Clérigo", 17, "Dominio de la Vida"), sanador).resolucionesCuracionPendientes).toHaveLength(0);
  });

  it("varios destinatarios generan una sola autocuración; descartar no cura", () => {
    const { personaje } = lanzar(crear(), "h_curar-heridas-en-masa");
    const pendientes = r(personaje, sanador).resolucionesCuracionPendientes!;
    expect(pendientes).toHaveLength(1);
    const descartado = resolverCuracionPendiente(personaje, sanador, pendientes[0].id, false)!;
    expect(descartado.hpActual).toBe(10);
    expect(resolverCuracionPendiente(descartado, sanador, pendientes[0].id, true, 7)).toBeUndefined();
  });

  it("sin espacio no hay Discípulo ni Sanador; maximización sigue disponible", () => {
    const p = crear();
    const preparado = prepararLanzamiento({ modo: "recursoRasgo", idRasgoOrigen: "rasgo_cls_clerigo_intercesion_divina", hechizo: h("h_curar-heridas"), modificadorHabilidad: 3 }, { personajeActual: p });
    const resultado = consumirRecursoConjuro(p, preparado.gasto);
    expect(preparado.formula.formulaTaleSpire).toContain("16+3");
    if (!resultado.permitido) throw new Error(resultado.motivo);
    expect(r(resultado.personaje, sanador).resolucionesCuracionPendientes).toBeUndefined();
    expect(formulaCuracionConjuro(p, h("h_curar-heridas"), 1, 3, undefined, true)).toBe("16+3");
  });

  it("curación diferida y posterior requieren confirmar cada evento y su turno", () => {
    const { personaje } = lanzar(crear(), "h_aura-de-vitalidad");
    const pendiente = r(personaje, discipulo).resolucionesCuracionPendientes![0];
    expect(pendiente.repetible).toBe(true);
    expect(formulaCuracionPendiente(pendiente)).toBe("12");
    expect(formulaCuracionPendiente(pendiente, true)).toBe("12+5");
    const primera = resolverCuracionPendiente(personaje, discipulo, pendiente.id, true, 12)!;
    expect(primera.hpActual).toBe(22);
    expect(r(primera, discipulo).resolucionesCuracionPendientes).toHaveLength(1);
    const fin = resolverCuracionPendiente(primera, discipulo, pendiente.id, false)!;
    expect(resolverCuracionPendiente(fin, discipulo, pendiente.id, true, 12)).toBeUndefined();
    const regenerar = lanzar(crear(), "h_regenerar");
    expect(regenerar.preparado.formula.formulaTaleSpire).toContain("32+15+9");
    expect(r(regenerar.personaje, discipulo).resolucionesCuracionPendientes![0].formula).toBe("1");
  });

  it("curación derivada nunca maximiza el daño; conserva las cantidades fijas", () => {
    const p = crear(); const { preparado, personaje } = lanzar(p, "h_toque-vampirico");
    expect(preparado.formula.formulaTaleSpire).toContain("3d6");
    const pendiente = r(personaje, discipulo).resolucionesCuracionPendientes![0];
    expect(formulaCuracionPendiente(pendiente, false, 15)).toBe("7");
    expect(formulaCuracionPendiente(pendiente, true, 15)).toBe("7+5");
    expect(maximizarDadosCuracion("4d8+15-2")).toBe("32+15-2");
    expect(h("h_palabra-de-poder-sanar").curacion?.tipo).toBe("completa");
  });

  it("Aura de vida y Conjurar celestial separan cada curación de su daño y condiciones", () => {
    const aura = lanzar(crear(), "h_aura-de-vida");
    expect(r(aura.personaje, discipulo).resolucionesCuracionPendientes![0].formula).toBe("1");
    const celestial = lanzar(crear(), "h_conjurar-celestial", 8);
    expect(celestial.preparado.formula.formulaTaleSpire).toContain("7d12");
    const pendiente = r(celestial.personaje, discipulo).resolucionesCuracionPendientes![0];
    expect(formulaCuracionPendiente(pendiente)).toBe("48+12+3");
    expect(formulaCuracionPendiente(pendiente, true)).toBe("48+12+3+10");
    expect(resolverCuracionPendiente(celestial.personaje, discipulo, pendiente.id, true, 999, true)).toBeUndefined();
    expect(resolverCuracionPendiente(celestial.personaje, discipulo, pendiente.id, true, 73, true)?.hpActual).toBe(83);
  });

  it("Sanación suprema afecta Chispa curativa pero no su daño ni PG temporales", () => {
    const p = crear(); const idRasgo = "rasgo_cls_clerigo_chispa_divina";
    const solicitud = { idRasgo, idOpcion: "curacion", propio: false, confirmado: true, incluirDados: true };
    expect(prepararResolucionAsistida(p, solicitud)?.formula).toBe("24+3");
    expect(prepararResolucionAsistida(p, { ...solicitud, idOpcion: "radiante" })?.formula).toBe("3d8+3");
    const nuevo = aplicarResolucionAsistida(p, solicitud, 27)!;
    expect(r(nuevo, "rasgo_cls_clerigo_canalizar_divinidad").usosRestantes).toBe(2);
    const otraReserva = { ...r(p, "rasgo_cls_clerigo_canalizar_divinidad"), id: "otra_reserva" };
    const otraCuracion = { ...r(p, idRasgo), id: "otra_curacion", ligadoA: otraReserva.id };
    expect(prepararResolucionAsistida({ ...p, rasgos: [...p.rasgos, otraReserva, otraCuracion] }, { ...solicitud, idRasgo: otraCuracion.id })?.formula).toBe("3d8+3");
  });

  it("multiclase: nivel de clérigo, aptitud efectiva distinta y espacios de pacto", () => {
    let p = crear(6);
    p = { ...p, nivel: 11, clase: "Bardo", clases: [{ nombre: "Bardo", nivel: 5, subclase: "" }, { nombre: "Clérigo", nivel: 6, subclase: "Dominio de la Vida" }] };
    p = { ...p, ...sincronizarMagiaMulticlase(p.clases) }; p = { ...p, rasgos: sincronizarRasgosAutomaticos(p) };
    const s = aplicarConfiguracionConjurosRasgos(p, { modo: "espacio", hechizo: h("h_curar-heridas"), claseLanzamiento: "Bardo", nivelLanzamiento: 3, curacionEnTurno: true });
    expect(s.modificadorHabilidad).toBe(4);
    const preparado = prepararLanzamiento(s, { personajeActual: p, espaciosConjuroMaximos: p.espaciosConjuroMaximos });
    expect(preparado.formula.formulaTaleSpire).toContain("+4+5");
    const preserve = prepararResolucionAsistida(p, { idRasgo: "rasgo_sub_vida_preservar_vida", idOpcion: "curacion", propio: false, confirmado: true, incluirDados: true });
    expect(preserve?.formula).toBe("30");
    const pacto = prepararLanzamiento(s, { personajeActual: { ...p, espaciosConjuroMaximos: {} }, esLanzadorPacto: true, nivelEspacioPacto: 3, espaciosPactoMaximos: 2, espaciosPactoGastados: 0 });
    expect(pacto.gasto.tipo).toBe("pacto");
    expect(pacto.formula.formulaTaleSpire).toContain("+4+5");
  });

  it("los conjuros siempre preparados respetan el nivel de la clase y se retiran por dominio", () => {
    const lista = (nivel: number, subclase = "Dominio de la Vida") => obtenerConjurosSubclasePersonaje([{ nombre: "Mago", nivel: 14 }, { nombre: "Clérigo", nivel, subclase }]).conjuros;
    expect(lista(3)).toHaveLength(4); expect(lista(5)).toHaveLength(6); expect(lista(7)).toHaveLength(8); expect(lista(9)).toHaveLength(10);
    expect(lista(3)).toContain("h_bendecir"); expect(lista(3, "Dominio de la Luz")).not.toContain("h_bendecir");
    const p = { ...crear(6), conjurosConocidosIds: ["h_curar-heridas"], aprendizajesConjurosIndependientes: { conjuros: ["h_curar-heridas"], trucos: [] } };
    expect(aplicarBuildClaseAPersonaje(p, "Clérigo", 6, "Dominio de la Guerra").conjurosConocidosIds).toContain("h_curar-heridas");
  });
});
