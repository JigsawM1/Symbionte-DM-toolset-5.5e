import { beforeEach, describe, expect, it } from "vitest";
import clerigo from "@/datos/clases/clerigo.json";
import { HECHIZOS_INICIALES as HECHIZOS } from "@/utiles/datosIniciales";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import { EsquemaPersonajeJugador } from "@/tipos/personaje";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { aplicarBuildClaseAPersonaje } from "./gestorClases";
import { sincronizarMagiaMulticlase } from "./sincronizadorMulticlase";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { ataqueMock } from "./barbaroSubclasesFixtures";
import { obtenerBonosHabilidadesRasgos } from "./rasgos/evaluadorSalvacionesRasgos";
import { calcularMaximosConjurosYTrucos } from "./calculadorMagia";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { evaluarEfectosRasgosActivos, aplicarModificadoresInvocacionesAHechizo } from "./evaluadorEfectosRasgos";
import { calcularInfoTruco } from "@/utiles/utilesConjuros";
import { prepararResolucionAsistida, aplicarResolucionAsistida } from "./rasgos/resolucionAsistidaRasgos";
import { emitirTiradaDanoConRasgos } from "./rasgos/emisionTiradaRasgos";
import { construirRasgoDesdeBorrador, crearBorradorRasgo } from "./rasgos/borradorRasgo";
import type { PersonajeJugador } from "@/tipos";

function crear(nivel: number): PersonajeJugador {
  return aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "clerigo", especie: "",
    caracteristicas: { fuerza: 10, destreza: 14, constitucion: 12, inteligencia: 20, sabiduria: 18, carisma: 10 }
  }, "Clérigo", nivel);
}
const id = (nombre: string) => `rasgo_cls_clerigo_${nombre}`;
const rasgo = (p: PersonajeJugador, nombre: string) => p.rasgos.find(r => r.id === id(nombre))!;
const estado = () => usarAlmacenDM.getState();
const pj = () => estado().personajes[0];
const elegir = (nombre: string, selector: string, valor: string[]) => estado().actualizarSeleccionRasgo(pj().id, id(nombre), selector, valor);
const recargar = (p: PersonajeJugador) => hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(p)))), HECHIZOS);

describe("Clérigo base PHB 2024: recorrido declarativo", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], idPersonajeActivo: null }));

  it.each(Array.from({ length: 20 }, (_, i) => i + 1))("nivel %i: adquisición, magia, dados y reservas sin duplicados", nivel => {
    const catalogo = EsquemaDefinicionClaseJSON.parse(clerigo);
    expect(catalogo.rasgos.find(r => r.id === id("chispa_divina"))?.resolucionAsistida?.opciones).toHaveLength(3);
    const p = crear(nivel);
    expect(p.rasgos.every(r => (r.nivelRequerido ?? 1) <= nivel)).toBe(true);
    expect(new Set(p.rasgos.map(r => r.id)).size).toBe(p.rasgos.length);
    expect(p.rasgos.some(r => r.categoriaMecanica === "extension")).toBe(false);
    expect(p.rasgos.filter(r => r.origen === "dote")).toHaveLength(0);
    expect(rasgo(p, "orden_divina").selectores?.[0].valorActual).toEqual([]);
    if (nivel >= 2) {
      expect(rasgo(p, "canalizar_divinidad").usosMaximos).toBe(nivel >= 18 ? 4 : nivel >= 6 ? 3 : 2);
      expect(rasgo(p, "chispa_divina").formulaDados).toBe(`${nivel >= 18 ? 4 : nivel >= 13 ? 3 : nivel >= 7 ? 2 : 1}d8+sabiduria`);
      expect(rasgo(p, "chispa_divina").esActivable).toBe(false);
      expect(rasgo(p, "expulsar_muertos_vivientes").formulaDados).toBe(nivel >= 5 ? "max(1, sabiduria)d8" : undefined);
    }
    const maxima = calcularMaximosConjurosYTrucos(p.clasesLanzadoras, nivel, 4);
    expect(maxima).toEqual({ maxTrucos: nivel >= 10 ? 5 : nivel >= 4 ? 4 : 3,
      maxConjuros: [4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22][nivel - 1], modelo: "preparados" });
    expect(p.clasesLanzadoras[0].habilidadConjuro).toBe("sabiduria");
  });

  it("Orden divina concede y retira competencias, bonus y truco sin borrar otra procedencia", () => {
    const p = crear(7);
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    elegir("orden_divina", "selector_orden_divina", ["inexistente"]);
    expect(rasgo(pj(), "orden_divina").selectores?.[0].valorActual).toEqual([]);
    elegir("orden_divina", "selector_orden_divina", ["protector"]);
    expect(evaluarEfectosRasgosActivos(pj()).some(e => e.objetivo === "armaduras_pesadas")).toBe(true);
    elegir("orden_divina", "selector_orden_divina", ["taumaturgo"]);
    expect(evaluarEfectosRasgosActivos(pj()).some(e => e.objetivo === "armaduras_pesadas")).toBe(false);
    expect(obtenerBonosHabilidadesRasgos(pj())).toMatchObject({ arcanos: 4, religion: 4 });
    const selector = rasgo(pj(), "taumaturgo").selectores![0];
    expect(selector.opciones.some(o => o.id === "h_tanido-por-los-muertos")).toBe(true);
    elegir("taumaturgo", selector.id, ["h_taumaturgia"]);
    expect(pj().trucosConocidosIds).toContain("h_taumaturgia");
    const guardado = recargar(pj());
    usarAlmacenDM.setState({ personajes: [{ ...guardado, aprendizajesConjurosIndependientes: { trucos: ["h_taumaturgia"], conjuros: [] } }] });
    elegir("orden_divina", "selector_orden_divina", []);
    expect(pj().trucosConocidosIds).toContain("h_taumaturgia");
    expect(evaluarEfectosRasgosActivos(pj()).some(e => e.objetivo === "religion")).toBe(false);
  });

  it.each([false, true])("reconciliar cambios e hijos conserva otras procedencias: %s", independiente => {
    const p = crear(7);
    if (independiente) {
      p.trucosConocidosIds = ["h_taumaturgia"];
      p.aprendizajesConjurosIndependientes = { trucos: ["h_taumaturgia"], conjuros: [] };
    }
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    elegir("orden_divina", "selector_orden_divina", ["taumaturgo"]);
    const selector = rasgo(pj(), "taumaturgo").selectores![0].id;
    elegir("taumaturgo", selector, ["h_taumaturgia"]);
    elegir("taumaturgo", selector, ["h_luz"]);
    expect(pj().trucosConocidosIds.includes("h_taumaturgia")).toBe(independiente);
    expect(pj().trucosConocidosIds.filter(id => id === "h_luz")).toHaveLength(1);
    for (let i = 0; i < 2; i++) {
      elegir("orden_divina", "selector_orden_divina", ["protector"]);
      expect(rasgo(pj(), "taumaturgo").activo).toBe(false);
      expect(pj().trucosConocidosIds).not.toContain("h_luz");
      usarAlmacenDM.setState({ personajes: [recargar(pj())] });
      elegir("orden_divina", "selector_orden_divina", ["taumaturgo"]);
      expect(rasgo(pj(), "taumaturgo").activo).toBe(true);
      expect(pj().trucosConocidosIds.filter(id => id === "h_luz")).toHaveLength(1);
      const reconstruido = aplicarBuildClaseAPersonaje(pj(), "Clérigo", 7);
      usarAlmacenDM.setState({ personajes: [recargar(reconstruido)] });
    }
    elegir("taumaturgo", selector, []);
    expect(pj().trucosConocidosIds).not.toContain("h_luz");
    expect(pj().trucosConocidosIds.includes("h_taumaturgia")).toBe(independiente);
  });

  it("Canalizar conserva el gasto al reaplicar, subir nivel y recargar; recupera uno en corto y todos en largo", () => {
    const p = crear(5);
    rasgo(p, "canalizar_divinidad").usosRestantes = 0;
    expect(rasgo(aplicarBuildClaseAPersonaje(p, "Clérigo", 5), "canalizar_divinidad").usosRestantes).toBe(0);
    const subido = recargar(aplicarBuildClaseAPersonaje(p, "Clérigo", 6));
    expect(rasgo(subido, "canalizar_divinidad").usosRestantes).toBe(1);
    const corto = ejecutarDescansoCorto(subido, 0).personajeActualizado;
    expect(rasgo(corto, "canalizar_divinidad").usosRestantes).toBe(2);
    expect(rasgo(ejecutarDescansoLargo(corto).personajeActualizado, "canalizar_divinidad").usosRestantes).toBe(3);
  });

  it("Dotes exige elección, rechaza requisitos y duplicados; Mejora de característica conserva elecciones independientes", () => {
    const p = crear(8);
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    elegir("mejora_caracteristica_4", "selector_dote_asi_clerigo_nv4", ["dote_don_destino"]);
    expect(rasgo(pj(), "mejora_caracteristica_4").selectores?.[0].valorActual).toEqual([]);
    elegir("mejora_caracteristica_4", "selector_dote_asi_clerigo_nv4", ["dote_alerta"]);
    elegir("mejora_caracteristica_8", "selector_dote_asi_clerigo_nv8", ["dote_alerta"]);
    expect(rasgo(pj(), "mejora_caracteristica_8").selectores?.[0].valorActual).toEqual([]);
    for (const nivel of [4, 8]) elegir(`mejora_caracteristica_${nivel}`, `selector_dote_asi_clerigo_nv${nivel}`, ["dote_mejora_caracteristica"]);
    expect(pj().rasgos.filter(r => r.origen === "dote")).toHaveLength(2);
    const guardado = recargar(pj());
    expect(guardado.rasgos.filter(r => r.origen === "dote")).toHaveLength(2);
    usarAlmacenDM.setState({ personajes: [guardado] });
    elegir("mejora_caracteristica_4", "selector_dote_asi_clerigo_nv4", []);
    expect(pj().rasgos.filter(r => r.origen === "dote")).toHaveLength(1);
  });

  it("Chispa y Abrasar resuelven y gastan una vez, rechazan agotamiento y no curan al propio clérigo", () => {
    let p = crear(7);
    const solicitud = { idRasgo: id("chispa_divina"), idOpcion: "curacion", incluirDados: true, propio: false, confirmado: false };
    expect(prepararResolucionAsistida(p, solicitud)?.formula).toBe("2d8+4");
    expect(aplicarResolucionAsistida(p, { ...solicitud, propio: true }, 12)).toBeUndefined();
    p = aplicarResolucionAsistida(p, solicitud, 12)!;
    expect(p.hpActual).toBe(crear(7).hpActual);
    expect(rasgo(p, "canalizar_divinidad").usosRestantes).toBe(2);
    const expulsar = { ...solicitud, idRasgo: id("expulsar_muertos_vivientes"), idOpcion: "expulsar" };
    expect(prepararResolucionAsistida(p, expulsar)?.formula).toBe("4d8");
    p = aplicarResolucionAsistida(p, expulsar, 18)!;
    expect(rasgo(p, "canalizar_divinidad").usosRestantes).toBe(1);
    p = aplicarResolucionAsistida(p, { ...expulsar, incluirDados: false })!;
    expect(rasgo(p, "canalizar_divinidad").usosRestantes).toBe(0);
    expect(prepararResolucionAsistida(p, solicitud)).toBeUndefined();
  });

  it("Golpe divino respeta elección, tipo, extensión, reconstrucción y desactivación solo al daño de arma emitido", async () => {
    const p = crear(14);
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    elegir("golpes_benditos", "selector_golpes_benditos", ["golpe_divino"]);
    elegir("golpe_divino", "selector_tipo_dano_golpe_divino", ["necrotico"]);
    estado().alternarActivoRasgo(p.id, id("golpe_divino"));
    const guardado = recargar(pj());
    expect(evaluarEfectosRasgosActivos(guardado).filter(e => e.tipo === "dano_secundario")).toMatchObject([{ valor: "2d8", tipoDano: "Necrótico" }]);
    const ataque = ataqueMock("fuerza");
    const desactivados: string[] = [];
    await emitirTiradaDanoConRasgos(guardado, { ...ataque, tipo: "Arma" }, async () => false, x => desactivados.push(x));
    expect(desactivados).toEqual([]);
    await emitirTiradaDanoConRasgos(guardado, { ...ataque, tipo: "Desarmado" }, async () => true, x => desactivados.push(x));
    await emitirTiradaDanoConRasgos(guardado, { ...ataque, tipo: "Conjuro" }, async () => true, x => desactivados.push(x));
    expect(desactivados).toEqual([]);
    await emitirTiradaDanoConRasgos(guardado, { ...ataque, tipo: "Arma" }, async () => true, x => desactivados.push(x));
    expect(desactivados).toEqual([id("golpe_divino")]);
    const inferior = aplicarBuildClaseAPersonaje(guardado, "Clérigo", 13);
    expect(evaluarEfectosRasgosActivos(inferior).find(e => e.tipo === "dano_secundario")?.valor).toBe("1d8");
  });

  it("Multiclase conserva niveles de clérigo y aplica Sabiduría una vez solo al truco de esa clase", () => {
    const clases = [{ nombre: "Mago", subclase: "", nivel: 13 }, { nombre: "Clérigo", subclase: "", nivel: 7 }];
    let p = { ...crear(7), clase: "Mago / Clérigo", nivel: 20, clases, ...sincronizarMagiaMulticlase(clases) };
    p.rasgos = sincronizarRasgosAutomaticos(p);
    p = { ...p, rasgos: p.rasgos.map(r => r.id === id("golpes_benditos") ? { ...r, selectores: r.selectores?.map(s => ({ ...s, valorActual: ["lanzamiento_potente"] })) } : r) };
    p.rasgos = sincronizarRasgosAutomaticos(p);
    expect(rasgo(p, "chispa_divina").formulaDados).toBe("2d8+sabiduria");
    const h = HECHIZOS.find(h => h.id === "h_tanido-por-los-muertos")!;
    expect(aplicarModificadoresInvocacionesAHechizo(h, p).bonoModificadorRasgo).toBeUndefined();
    const clerical = aplicarModificadoresInvocacionesAHechizo(h, p, "Clérigo");
    expect(clerical.bonoModificadorRasgo).toBe(4);
    expect(calcularInfoTruco(clerical, 20, 0, 5).formula).toContain("+4");
    const mago = aplicarModificadoresInvocacionesAHechizo(h, p, "Mago");
    expect(mago.agregarModificadorHabilidad).not.toBe(true);
    expect(mago.bonoModificadorRasgo).toBeUndefined();
  });

  it("Vitalidad exige elección y confirmación, aplica máximo propio y conserva metadatos en el editor", () => {
    let p = crear(14);
    const solicitud = { idRasgo: id("golpes_benditos_mejorados_lanzamiento"), idOpcion: "vitalidad", incluirDados: true, propio: true, confirmado: true };
    expect(prepararResolucionAsistida(p, solicitud)).toBeUndefined();
    p = { ...p, hpTemporal: 12, rasgos: p.rasgos.map(r => r.id === id("golpes_benditos") ? { ...r, selectores: r.selectores?.map(s => ({ ...s, valorActual: ["lanzamiento_potente"] })) } : r) };
    p.rasgos = sincronizarRasgosAutomaticos(p);
    expect(prepararResolucionAsistida(p, { ...solicitud, confirmado: false })).toBeUndefined();
    expect(prepararResolucionAsistida(p, solicitud)?.formula).toBe("8");
    expect(aplicarResolucionAsistida(p, solicitud, 8)?.hpTemporal).toBe(12);
    const r = rasgo(p, "golpes_benditos_mejorados_lanzamiento");
    expect(construirRasgoDesdeBorrador(crearBorradorRasgo(r, "clase"), r).resolucionAsistida).toEqual(r.resolucionAsistida);
  });
});
