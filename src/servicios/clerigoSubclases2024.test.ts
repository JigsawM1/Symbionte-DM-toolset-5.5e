import { beforeEach, describe, expect, it } from "vitest";
import clerigo from "@/datos/clases/clerigo.json";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import { EsquemaPersonajeJugador } from "@/tipos/personaje";
import { EsquemaHechizoBase, type PersonajeJugador } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { aplicarBuildClaseAPersonaje } from "./gestorClases";
import { normalizarMecanicasRasgos } from "./rasgos/normalizarMecanicasRasgos";
import { normalizarCondicionesRasgos } from "./rasgos/estadoCondicionesRasgos";
import { aplicarResolucionAsistida, prepararResolucionAsistida } from "./rasgos/resolucionAsistidaRasgos";
import { registrarCuracionAlFinalizar, resolverCuracionPendiente } from "./rasgos/curacionDeclarativa";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { evaluarVentajasDeRasgosEnTirada } from "./rasgos/evaluadorSalvacionesRasgos";
import { evaluarEfectosRasgosActivos } from "./evaluadorEfectosRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { prepararLanzamiento, validarLanzamiento, type SolicitudLanzamiento } from "./servicioLanzamientoConjuros";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { obtenerConcesionConRecurso } from "./rasgos/lanzamientoRecursoRasgos";
import { obtenerAtaquePosterior } from "./rasgos/conjurosTemporalesRasgos";
import { construirRasgoDesdeBorrador, crearBorradorRasgo } from "./rasgos/borradorRasgo";
import { obtenerConjurosSubclasePersonaje } from "./calculadorMagia";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";

const dominios = ["Dominio de la Vida", "Dominio de la Luz", "Dominio del Engaño", "Dominio de la Guerra"];
const canal = "rasgo_cls_clerigo_canalizar_divinidad";
const r = (p: PersonajeJugador, id: string) => p.rasgos.find(r => r.id === id)!;
const h = (id: string) => EsquemaHechizoBase.parse(HECHIZOS_INICIALES.find(h => h.id === id));
const recargar = (p: PersonajeJugador) => hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(p)))), HECHIZOS_INICIALES);
function crear(dominio: string, nivel: number) {
  const p = aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "dominio", especie: "",
    caracteristicas: { fuerza: 10, destreza: 14, constitucion: 12, inteligencia: 20, sabiduria: 18, carisma: 16 }
  }, "Clérigo", nivel, dominio);
  return normalizarMecanicasRasgos(undefined, { ...p, hpMaximo: 100, hpActual: 10 });
}
const solicitud = (idRasgo: string, idOpcion = "curacion") => ({ idRasgo, idOpcion, incluirDados: true, propio: false, confirmado: true });

describe("Dominios PHB 2024: carga, estados y consumidores", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], idPersonajeActivo: null, rondaActual: 1 }));
  for (const dominio of dominios) it.each(Array.from({length: 20}, (_, i) => i + 1))(`${dominio}, nivel %i: carga real y progresiones`, nivel => {
    const catalogo = EsquemaDefinicionClaseJSON.parse(clerigo);
    const p = crear(dominio, nivel);
    const sub = catalogo.subclases!.find(s => s.nombre === dominio)!;
    expect(p.rasgos.every(r => (r.nivelRequerido ?? 1) <= nivel)).toBe(true);
    expect(new Set(p.rasgos.map(r => r.id)).size).toBe(p.rasgos.length);
    expect(p.rasgos.some(r => r.categoriaMecanica === "extension")).toBe(false);
    for (const rasgo of sub.rasgos.filter(r => r.categoriaMecanica !== "extension"))
      expect(p.rasgos.some(r => r.id === rasgo.id)).toBe(nivel >= rasgo.nivel);
    expect(obtenerConjurosSubclasePersonaje([{ nombre: "Clérigo", nivel, subclase: dominio }]).conjuros.slice().sort())
      .toEqual((sub.progresionConjuros ?? []).filter(f => f.nivelClase <= nivel).flatMap(f => f.conjuros ?? []).sort());
    for (const fila of sub.progresionConjuros ?? []) for (const id of fila.conjuros ?? []) expect(h(id).id).toBe(id);
    if (nivel >= 3) for (const rasgo of p.rasgos.filter(r => r.origen === "subclase")) {
      const guardado = r(recargar(p), rasgo.id);
      expect(guardado.resolucionAsistida).toEqual(rasgo.resolucionAsistida);
      expect(guardado.curacionConjuros).toEqual(rasgo.curacionConjuros);
      expect(guardado.lanzamientoConRecurso).toEqual(rasgo.lanzamientoConRecurso);
    }
  });

  it("Preservar vida limita la porción propia y consume una sola reserva, agotable", () => {
    let p = crear(dominios[0], 6);
    const s = { ...solicitud("rasgo_sub_vida_preservar_vida"), propio: true, cantidadPropia: 20 };
    expect(prepararResolucionAsistida(p, s)?.formula).toBe("30");
    expect(prepararResolucionAsistida(p, { ...s, cantidadPropia: 31 })).toBeUndefined();
    p = aplicarResolucionAsistida(p, s, 30)!;
    expect(p.hpActual).toBe(30); expect(r(p, canal).usosRestantes).toBe(2);
    expect(prepararResolucionAsistida(p, { ...s, cantidadPropia: 21 })).toBeUndefined();
    p = aplicarResolucionAsistida(p, { ...s, propio: false }, 30)!;
    p = aplicarResolucionAsistida(p, { ...s, propio: false }, 30)!;
    expect(aplicarResolucionAsistida(p, s, 30)).toBeUndefined();
    expect(r(ejecutarDescansoCorto(p, 0).personajeActualizado, canal).usosRestantes).toBe(1);
  });

  it("Fulgor mejora su recuperación y ofrece PG temporales sin doble gasto", () => {
    const id = "rasgo_sub_luz_fulgor_protector";
    const base = crear(dominios[1], 3);
    expect(r(base, id).resolucionAsistida?.opciones).toHaveLength(1);
    expect(r(base, id).usosMaximos).toBe(4);
    let p = crear(dominios[1], 6);
    p = aplicarResolucionAsistida(p, { ...solicitud(id, "proteccion"), propio: true }, 12)!;
    expect(p.hpTemporal).toBe(12); expect(r(p, id).usosRestantes).toBe(3);
    p = aplicarResolucionAsistida(p, { ...solicitud(id, "proteccion"), propio: true }, 8)!;
    expect(p.hpTemporal).toBe(12); expect(r(p, id).usosRestantes).toBe(2);
    expect(r(ejecutarDescansoCorto(p, 0).personajeActualizado, id).usosRestantes).toBe(4);
    expect(r(recargar(p), id).usosRestantes).toBe(2);
  });

  it("Bendición cambia destinatario, conserva la elección y solo termina tras descanso largo", () => {
    const id = "rasgo_sub_engano_bendicion_embaucador";
    const p = crear(dominios[2], 3);
    usarAlmacenDM.setState({ personajes: [p] });
    const estado = () => usarAlmacenDM.getState(); const actual = () => estado().personajes[0];
    const elegir = (v: string) => estado().alternarActivoRasgo(p.id, id, { selectores: { destinatario_bendicion: [v] }, opcionales: [] });
    elegir("invalido"); expect(r(actual(), id).activo).toBe(false);
    elegir("propio");
    expect(evaluarVentajasDeRasgosEnTirada(actual(), { tipo: "caracteristica", subtipo: "destreza", habilidad: "sigilo" }).tieneVentaja).toBe(true);
    expect(r(recargar(actual()), id).selectores?.[0].valorActual).toEqual(["propio"]);
    expect(r(ejecutarDescansoCorto(actual(), 0).personajeActualizado, id).activo).toBe(true);
    elegir("externo");
    expect(evaluarVentajasDeRasgosEnTirada(actual(), { tipo: "caracteristica", subtipo: "destreza", habilidad: "sigilo" }).tieneVentaja).toBe(false);
    expect(r(ejecutarDescansoLargo(actual()).personajeActualizado, id).activo).toBe(false);
  });

  it.each(["manual", "ronda", "incapacidad"])("Duplicidad: finalización %s, una curación persistente y ninguna por retirada", modo => {
    const id = "rasgo_sub_engano_invocar_duplicidad";
    const p = crear(dominios[2], 17);
    usarAlmacenDM.setState({ personajes: [p] });
    usarAlmacenDM.getState().alternarActivoRasgo(p.id, id);
    const activo = usarAlmacenDM.getState().personajes[0];
    expect(r(activo, canal).usosRestantes).toBe(2);
    expect(r(recargar(activo), id).activo).toBe(true);
    let terminado: PersonajeJugador;
    if (modo === "manual") { usarAlmacenDM.getState().alternarActivoRasgo(p.id, id); terminado = usarAlmacenDM.getState().personajes[0]; }
    else if (modo === "ronda") terminado = normalizarCondicionesRasgos(activo, 11);
    else terminado = normalizarMecanicasRasgos(activo, { ...activo, condicionesActivas: ["Incapacitado"] });
    expect(r(terminado, id).resolucionesCuracionPendientes).toHaveLength(1);
    terminado = recargar(terminado);
    const pendiente = r(terminado, id).resolucionesCuracionPendientes![0];
    const curado = resolverCuracionPendiente(terminado, id, pendiente.id, true, 17)!;
    expect(curado.hpActual).toBe(27);
    expect(resolverCuracionPendiente(curado, id, pendiente.id, true, 17)).toBeUndefined();
    const retirada = aplicarBuildClaseAPersonaje(activo, "Clérigo", 17, dominios[0]);
    expect(registrarCuracionAlFinalizar(activo, retirada).rasgos.some(r => r.resolucionesCuracionPendientes?.length)).toBe(false);
  });

  it("Golpe guiado modifica una tirada indicada, sin estado de ataque preparado", () => {
    const p = crear(dominios[3], 3); const id = "rasgo_sub_guerra_golpe_guiado";
    expect(prepararResolucionAsistida(p, solicitud(id, "externo"))).toBeUndefined();
    const preparada = prepararResolucionAsistida(p, { ...solicitud(id, "externo"), tiradaOriginal: 8 });
    expect(preparada?.opcion.tipoAccion).toBe("reaccion");
    const nuevo = aplicarResolucionAsistida(p, { ...solicitud(id, "propio"), tiradaOriginal: 8 }, 10)!;
    expect(r(nuevo, canal).usosRestantes).toBe(1);
    expect(r(nuevo, id).esActivable).toBe(false);
    expect(evaluarEfectosRasgosActivos(nuevo).some(e => e.tipo === "bono_ataque")).toBe(false);
  });

  it.each([dominios[1], dominios[3]])("%s: multiclase conserva Sabiduría y nivel de clérigo", dominio => {
    let p = crear(dominio, 3);
    p = { ...p, clase: "Mago", subclase: "", nivel: 8, clases: [{ nombre: "Mago", nivel: 5, subclase: "" }, { nombre: "Clérigo", nivel: 3, subclase: dominio }] };
    p = { ...p, rasgos: sincronizarRasgosAutomaticos(p) };
    const limitado = p.rasgos.find(r => r.origen === "subclase" && r.tieneUsosLimitados)!;
    expect(limitado.usosMaximos).toBe(4);
    if (dominio === dominios[1]) {
      expect(r(p, limitado.id).recuperacion).toBe("descanso_largo");
      expect(prepararResolucionAsistida(p, solicitud("rasgo_sub_luz_resplandor_del_alba", "radiante"))?.formula).toBe("2d10+3");
    }
    expect(p.rasgos.some(r => r.id === "rasgo_sub_guerra_bendicion_dios_guerra")).toBe(false);
  });

  it("Guerra: dos conjuros simultáneos, lanzamiento centralizado, reiteración y expiración", () => {
    let p = crear(dominios[3], 6); const id = "rasgo_sub_guerra_bendicion_dios_guerra";
    for (const conjuroId of ["h_escudo-de-fe", "h_arma-espiritual"]) {
      const s: SolicitudLanzamiento = aplicarConfiguracionConjurosRasgos(p, { modo: "recursoRasgo", idRasgoOrigen: id, hechizo: h(conjuroId) });
      expect(s.hechizo.componentesSeleccionados).toEqual(h(conjuroId).componentesSeleccionados);
      const preparado = prepararLanzamiento(s, { personajeActual: p });
      expect(validarLanzamiento(s, { personajeActual: p }, preparado).permitido).toBe(true);
      expect(preparado.activarConcentracion).toBe(false);
      const consumido = consumirRecursoConjuro(p, { ...preparado.gasto, ronda: 1 });
      expect(consumido.permitido).toBe(true); if (consumido.permitido) p = consumido.personaje;
    }
    expect(r(p, id).conjurosTemporales).toHaveLength(2); expect(r(p, canal).usosRestantes).toBe(1);
    p = recargar(p); expect(r(p, id).conjurosTemporales).toHaveLength(2);
    const posterior: SolicitudLanzamiento = { modo: "continuarConjuro", idRasgoOrigen: id, hechizo: h("h_arma-espiritual") };
    expect(obtenerAtaquePosterior(p, id, posterior.hechizo)).toBeDefined();
    expect(prepararLanzamiento(posterior, { personajeActual: p }).gasto.tipo).toBe("ninguno");
    expect(obtenerConcesionConRecurso(p, id, h("h_bola-de-fuego"))).toBeUndefined();
    expect(r(normalizarCondicionesRasgos(p, 11), id).conjurosTemporales).toHaveLength(0);
    expect(r(normalizarCondicionesRasgos({ ...p, condicionesActivas: ["Incapacitado"] }), id).conjurosTemporales).toHaveLength(0);
    expect(r(normalizarCondicionesRasgos({ ...p, salvacionesMuerte: { exitos: 0, fallos: 3 } }), id).conjurosTemporales).toHaveLength(0);
    const consumo = consumirRecursoConjuro(p, { tipo: "ninguno", conjuroId: "h_escudo-de-fe" });
    if (consumo.permitido) expect(r(consumo.personaje, id).conjurosTemporales?.map(e => e.conjuroId)).toEqual(["h_arma-espiritual"]);
  });

  it("Avatar concede tres resistencias efectivas, retirables; el editor conserva capacidades", () => {
    const p = crear(dominios[3], 17);
    expect(evaluarEfectosRasgosActivos(p).filter(e => e.tipo === "resistencia_dano").map(e => e.tipoDano).sort()).toEqual(["Contundente", "Cortante", "Perforante"]);
    expect(evaluarEfectosRasgosActivos(aplicarBuildClaseAPersonaje(p, "Clérigo", 16, dominios[3])).some(e => e.tipo === "resistencia_dano")).toBe(false);
    const vida = crear(dominios[0], 17);
    const original = r(vida, "rasgo_sub_vida_discipulo_vida");
    const borrador = crearBorradorRasgo(original);
    expect(construirRasgoDesdeBorrador(borrador, original).curacionConjuros).toEqual(original.curacionConjuros);
  });
});
