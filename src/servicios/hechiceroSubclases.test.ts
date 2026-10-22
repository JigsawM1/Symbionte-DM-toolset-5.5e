import { obtenerResumenDefensasRasgos } from "./rasgos/resumenDefensasRasgos";
import { EsquemaMecanicasRasgo } from "@/tipos/mecanicasRasgos";
import { beforeEach, describe, expect, it } from "vitest";
import type { PersonajeJugador } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { obtenerVelocidadesEfectivas, calcularBonoHPMaximoRasgos } from "./evaluadorEfectosRasgos";
import { operarRecursoRasgo } from "./rasgos/conversionRecursosRasgos";
import { normalizarCondicionesRasgos } from "./rasgos/estadoCondicionesRasgos";
import { obtenerTablaRasgo, tirarFilasTabla, resolverFilaTabla } from "./rasgos/tablasAleatoriasRasgos";
import { emitirTiradaConRasgos } from "./rasgos/emisionTiradaRasgos";
import { evaluarEfectosCondicionesEnTirada } from "./procesadorCondiciones";
import { obtenerConcesionConRecurso, obtenerOpcionesRecursoConjuro } from "./rasgos/lanzamientoRecursoRasgos";
import { normalizarMecanicasRasgos } from "./rasgos/normalizarMecanicasRasgos";
import { validarLanzamiento, prepararLanzamiento } from "./servicioLanzamientoConjuros";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { crearBorradorRasgo, construirRasgoDesdeBorrador } from "./rasgos/borradorRasgo";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import metamagia from "@/datos/metamagia.json";

const subclases = ["Hechicería Aberrante", "Hechicería del Mecanismo de Relojería", "Hechicería Dracónica", "Hechicería de Magia Salvaje"];
function personaje(sub = subclases[0], nivel = 18): PersonajeJugador {
  const pj: PersonajeJugador = { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "subclase-prueba", nombre: "Prueba", especie: "", clase: "Hechicero", subclase: sub, nivel,
    clases: [{ nombre: "Hechicero", nivel, subclase: sub }], rasgos: obtenerRasgosClaseYSubclase("Hechicero", nivel, sub),
    caracteristicas: { fuerza: 10, destreza: 14, constitucion: 14, inteligencia: 12, sabiduria: 10, carisma: 18 },
    esLanzador: true, clasesLanzadoras: [{ clase: "Hechicero", nivel, tipoLanzador: "completo", modeloConjuros: "preparados", habilidadConjuro: "carisma" }],
    espaciosConjuroMaximos: { "1": 4, "2": 3, "5": 2 }, espaciosConjuroGastados: {}, hpMaximoBase: 40, hpMaximo: 40, hpActual: 40 };
  return { ...pj, rasgos: sincronizarRasgosAutomaticos(pj) };
}
const rasgo = (pj: PersonajeJugador, nombre: string) => pj.rasgos.find(r => r.nombre === nombre)!;
const fuente = (pj: PersonajeJugador) => rasgo(pj, "Fuente de magia");
const cargar = (pj: PersonajeJugador) => { usarAlmacenDM.setState({ personajes: [pj], colaIniciativa: [], rondaActual: 1 }); };
const leer = () => usarAlmacenDM.getState().personajes[0];
const recargar = (pj: PersonajeJugador) => hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(pj))));

beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1 }));

describe("Hechicero: catálogo y contratos compartidos", () => {
  it.each(subclases)("construye %s sin extensiones ni identificadores duplicados", sub => {
    for (const nivel of [3, 5, 6, 7, 9, 14, 18, 20]) {
      const pj = personaje(sub, nivel);
      expect(new Set(pj.rasgos.map(r => r.id)).size).toBe(pj.rasgos.length);
      expect(pj.rasgos.some(r => r.categoriaMecanica === "extension")).toBe(false);
      for (const r of pj.rasgos) expect(EsquemaRasgoPersonaje.safeParse(r).success, r.nombre).toBe(true);
    }
  });
  it.each(subclases.slice(0, 3))("concede diez conjuros reales en %s al nivel 9", sub => {
    const pj = personaje(sub, 9);
    const ids = pj.rasgos.filter(r => r.claseConjurosOtorgados).flatMap(r => r.conjurosOtorgados ?? []);
    expect(ids).toHaveLength(sub === subclases[0] ? 11 : 10);
    for (const id of ids) expect(HECHIZOS_INICIALES.some(h => h.id === id), id).toBe(true);
  });
  it.each(subclases.slice(0, 3))("desbloquea conjuros por nivel sin descripciones de ampliaciones en %s", sub => {
    for (const nivel of [3, 4, 5, 6, 7, 8, 9]) {
      const pj = personaje(sub, nivel);
      const concesion = pj.rasgos.find(r => r.claseConjurosOtorgados)!;
      expect(concesion.conjurosOtorgados).toHaveLength((sub === subclases[0] ? 5 : 4) + Math.floor((nivel - 3) / 2) * 2);
      expect(concesion.descripcion).not.toMatch(/ampliados/);
      expect(pj.rasgos.some(r => /ampliados/.test(r.nombre))).toBe(false);
      expect(recargar(pj).rasgos.find(r => r.id === concesion.id)?.conjurosOtorgados).toEqual(concesion.conjurosOtorgados);
    }
  });
  it("resuelve el escalado de conjuros personalizado tras builder, carga y bajada de nivel", () => {
    const pj = personaje(subclases[0], 9);
    const original = { ...pj.rasgos.find(r => r.claseConjurosOtorgados)!, id: "concesion-personalizada", personalizado: true };
    const nuevo = construirRasgoDesdeBorrador(crearBorradorRasgo(original), original);
    const personalizado = recargar({ ...pj, rasgos: [nuevo] });
    const inferior = { ...personalizado, nivel: 3, clases: [{ nombre: "Hechicero", nivel: 3, subclase: subclases[0] }] };
    const resultado = normalizarMecanicasRasgos(personalizado, inferior);
    expect(resultado.rasgos.find(r => r.id === original.id)?.conjurosOtorgados).toHaveLength(5);
    expect(normalizarMecanicasRasgos(resultado, { ...resultado, nivel: 9, clases: pj.clases }).rasgos.find(r => r.id === original.id)?.conjurosOtorgados).toHaveLength(11);
  });
  it("recorre builder y persistencia de todas las capacidades nuevas en rasgos personalizados", () => {
    for (const sub of subclases) for (const original of personaje(sub, 20).rasgos.filter(r => r.origen === "subclase")) {
      const b = crearBorradorRasgo({ ...original, personalizado: true });
      const nuevo = construirRasgoDesdeBorrador(b, { ...original, personalizado: true });
      expect(EsquemaRasgoPersonaje.safeParse(nuevo).success, nuevo.nombre).toBe(true);
      for (const clave of ["lanzamientoConRecurso", "reservaDados", "tablaAleatoria", "costeRecargaPadre", "gastarUsoTrasTirada", "ignorarMaterialesConjuro", "varianteSinConcentracion", "escaladoConjurosOtorgados"] as const)
        expect(nuevo[clave], `${nuevo.nombre}: ${clave}`).toEqual(original[clave]);
    }
  });
});

describe("Fase 2: Aberrante", () => {
  it("ofrece pago alternativo solo para conjuros concedidos y procedencia compatible", () => {
    const pj = personaje();
    const hechizo = HECHIZOS_INICIALES.find(h => h.id === "h_brazos-de-hadar")!;
    expect(obtenerOpcionesRecursoConjuro(pj, hechizo, "Hechicero")).toHaveLength(1);
    expect(obtenerOpcionesRecursoConjuro(pj, hechizo, "Mago")).toEqual([]);
    expect(obtenerOpcionesRecursoConjuro(pj, { ...hechizo, nivel: 0 })).toEqual([]);
    expect(obtenerOpcionesRecursoConjuro(pj, { ...hechizo, id: "ajeno" })).toEqual([]);
    const agotado = { ...pj, rasgos: pj.rasgos.map(r => r.id === fuente(pj).id ? { ...r, usosRestantes: 0 } : r) };
    expect(obtenerOpcionesRecursoConjuro(agotado, hechizo)[0].recurso.usosRestantes).toBe(0);
  });
  it("cobra por cada alteración, conserva selección y termina sus velocidades juntas", () => {
    const pj = personaje(); cargar(pj);
    const r = rasgo(pj, "Revelación de la carne");
    const elecciones = { selectores: { revelacion: ["adaptacion_acuatica", "vuelo_reluciente"] }, opcionales: [] };
    usarAlmacenDM.getState().alternarActivoRasgo(pj.id, r.id, elecciones);
    expect(fuente(leer()).usosRestantes).toBe(16);
    const velocidades = obtenerVelocidadesEfectivas(leer());
    expect(velocidades.nadar).toBe(velocidades.caminar * 2);
    expect(velocidades.volar).toBe(velocidades.caminar);
    expect(rasgo(recargar(leer()), r.nombre).selectores?.[0].valorActual).toEqual(elecciones.selectores.revelacion);
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj.id, r.id, "revelacion", ["ver_invisible"]);
    expect(rasgo(leer(), r.nombre).selectores?.[0].valorActual).toHaveLength(2);
    const final = normalizarCondicionesRasgos(leer(), 101);
    expect(rasgo(final, r.nombre).activo).toBe(false);
    expect(obtenerVelocidadesEfectivas(final).volar).toBeFalsy();
    expect(fuente(final).usosRestantes).toBe(16);
  });
  it("rechaza decisiones incompletas y pago insuficiente sin estados parciales", () => {
    let pj = personaje(); pj = { ...pj, rasgos: pj.rasgos.map(r => r.id === fuente(pj).id ? { ...r, usosRestantes: 1 } : r) }; cargar(pj);
    const r = rasgo(pj, "Revelación de la carne");
    for (const valores of [[], ["inexistente"], ["adaptacion_acuatica", "vuelo_reluciente"]])
      usarAlmacenDM.getState().alternarActivoRasgo(pj.id, r.id, { selectores: { revelacion: valores }, opcionales: [] });
    expect(rasgo(leer(), r.nombre).activo).toBe(false); expect(fuente(leer()).usosRestantes).toBe(1);
    expect(rasgo(leer(), r.nombre).selectores?.[0].valorActual).toEqual([]);
  });
  it("lanza solo concesiones psiónicas al nivel base; cobra puntos y conserva espacios", () => {
    const pj = personaje(); const r = rasgo(pj, "Hechicería psiónica");
    const h = HECHIZOS_INICIALES.find(h => h.id === "h_invocar-aberracion")!;
    expect(obtenerConcesionConRecurso(pj, r.id, h)?.coste).toBe(4);
    expect(obtenerConcesionConRecurso(pj, r.id, h, 5)).toBeUndefined();
    expect(obtenerConcesionConRecurso(pj, r.id, HECHIZOS_INICIALES.find(h => h.id === "h_bola-de-fuego")!)).toBeUndefined();
    const solicitud = { modo: "recursoRasgo" as const, idRasgoOrigen: r.id, hechizo: h, claseLanzamiento: "Hechicero" };
    expect(validarLanzamiento(solicitud, { personajeActual: pj }).permitido).toBe(true);
    const consumo = consumirRecursoConjuro(pj, prepararLanzamiento(solicitud, { personajeActual: pj }).gasto);
    expect(consumo.permitido).toBe(true);
    if (consumo.permitido) { expect(fuente(consumo.personaje).usosRestantes).toBe(14); expect(consumo.personaje.espaciosConjuroGastados).toEqual({}); }
    const inferior = { ...pj, nivel: 20, clases: [{ nombre: "Hechicero", nivel: 5, subclase: pj.subclase }, { nombre: "Mago", nivel: 15, subclase: "" }] };
    expect(obtenerConcesionConRecurso(inferior, r.id, h)).toBeUndefined();
  });
  it("recarga Implosión por cinco puntos y únicamente un uso", () => {
    const pj = personaje(); cargar(pj); const r = rasgo(pj, "Implosión deformadora");
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, r.id);
    usarAlmacenDM.getState().recargarUsoRasgoConPadre(pj.id, r.id);
    usarAlmacenDM.getState().recargarUsoRasgoConPadre(pj.id, r.id);
    expect(fuente(leer()).usosRestantes).toBe(13); expect(rasgo(leer(), r.nombre).usosRestantes).toBe(1);
  });
});

describe("Fase 3: Mecanismo de Relojería", () => {
  it("calcula usos de equilibrio con Carisma y conserva el gasto", () => {
    const pj = personaje(subclases[1]); expect(rasgo(pj, "Restaurar equilibrio").usosMaximos).toBe(4);
    cargar(pj); usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, rasgo(pj, "Restaurar equilibrio").id);
    expect(rasgo(recargar(leer()), "Restaurar equilibrio").usosRestantes).toBe(3);
  });
  it("inicializa Carisma al crear desde el builder y permite gastar todos los usos", () => {
    const pj = personaje(subclases[1]);
    const id = usarAlmacenDM.getState().crearPersonaje({ ...pj, rasgos: obtenerRasgosClaseYSubclase("Hechicero", 18, subclases[1]) });
    const actual = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    expect(rasgo(actual(), "Restaurar equilibrio").usosMaximos).toBe(4);
    expect(rasgo(actual(), "Restaurar equilibrio").usosRestantes).toBe(4);
    for (let n = 3; n >= 0; n--) {
      usarAlmacenDM.getState().gastarUsoRasgoPersonaje(id, rasgo(actual(), "Restaurar equilibrio").id);
      expect(rasgo(actual(), "Restaurar equilibrio").usosRestantes).toBe(n);
    }
  });
  it("compra 1–5d8, sustituye reserva, gasta después y limpia solo en largo", () => {
    let pj = personaje(subclases[1]); const idRasgo = rasgo(pj, "Bastión de la ley").id;
    pj = operarRecursoRasgo(pj, { tipo: "comprarDados", idRasgo, cantidad: 5 })!;
    expect(fuente(pj).usosRestantes).toBe(13);
    pj = operarRecursoRasgo(pj, { tipo: "gastarDados", idRasgo, cantidad: 2 })!;
    expect(rasgo(recargar(pj), "Bastión de la ley").dadosReserva).toBe(3);
    expect(rasgo(ejecutarDescansoCorto(pj, 0).personajeActualizado, "Bastión de la ley").dadosReserva).toBe(3);
    pj = operarRecursoRasgo(pj, { tipo: "comprarDados", idRasgo, cantidad: 1 })!;
    expect(rasgo(pj, "Bastión de la ley").dadosReserva).toBe(1);
    expect(operarRecursoRasgo(pj, { tipo: "gastarDados", idRasgo, cantidad: 2 })).toBeUndefined();
    expect(operarRecursoRasgo(pj, { tipo: "comprarDados", idRasgo, cantidad: 6 })).toBeUndefined();
    expect(rasgo(ejecutarDescansoLargo(pj).personajeActualizado, "Bastión de la ley").dadosReserva).toBe(0);
  });
  it.each([["Trance del orden", 5], ["Cabalgata de relojería", 7]] as const)("recarga %s con el coste declarado", (nombre, coste) => {
    const pj = personaje(subclases[1]); cargar(pj); const r = rasgo(pj, nombre);
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, r.id);
    usarAlmacenDM.getState().recargarUsoRasgoConPadre(pj.id, r.id);
    expect(fuente(leer()).usosRestantes).toBe(18 - coste);
  });
});

describe("Fase 4: Dracónica", () => {
  it("deriva PG por nivel de clase y CA sin acumular la base", () => {
    const pj = personaje(subclases[2], 14);
    expect(calcularBonoHPMaximoRasgos(pj)).toBe(14);
    const creado = usarAlmacenDM.getState().crearPersonaje(pj);
    const efectivo = usarAlmacenDM.getState().personajes.find(p => p.id === creado)!;
    expect(calcularEstadisticasPersonaje(efectivo).hpMaximoEfectivo).toBe(54);
    expect(recargar(recargar(efectivo)).hpMaximoBase).toBe(efectivo.hpMaximoBase);
    usarAlmacenDM.getState().actualizarPersonaje(creado, { nivel: 15, clases: [{ nombre: "Hechicero", nivel: 15, subclase: pj.subclase }] });
    expect(usarAlmacenDM.getState().personajes.find(p => p.id === creado)?.hpMaximo).toBe(55);
    const stats = calcularEstadisticasPersonaje(pj); expect(stats.claseArmadura.total).toBe(16);
    expect(recargar(recargar(pj)).hpMaximoBase).toBe(40);
    const multi = { ...pj, nivel: 20, clases: [{ nombre: "Hechicero", nivel: 14, subclase: pj.subclase }, { nombre: "Guerrero", nivel: 6, subclase: "" }] };
    expect(calcularBonoHPMaximoRasgos(multi)).toBe(14);
  });
  it.each(["espacio", "gratuitoInnato"] as const)("Compañero: %s ignora solo materiales y permite duración sin concentración", modo => {
    const pj = personaje(subclases[2]); const h = HECHIZOS_INICIALES.find(h => h.id === "h_invocar-dragon")!;
    const solicitud = aplicarConfiguracionConjurosRasgos(pj, { modo, hechizo: h, sinConcentracion: true });
    expect(solicitud.hechizo.componentesSeleccionados?.material).toBe(false);
    expect(solicitud.hechizo.componentesSeleccionados?.verbal).toBe(h.componentesSeleccionados?.verbal);
    expect(solicitud.hechizo.componentesSeleccionados?.somatico).toBe(h.componentesSeleccionados?.somatico);
    expect(prepararLanzamiento(solicitud, { personajeActual: pj }).activarConcentracion).toBe(false);
    const normal = { ...solicitud, sinConcentracion: false };
    expect(prepararLanzamiento(normal, { personajeActual: pj }).activarConcentracion).toBe(true);
    expect(validarLanzamiento(solicitud, { personajeActual: personaje() }).permitido).toBe(false);
  });
});

describe("Fase 5: Magia Salvaje", () => {
  it("cubre d100 completo; cada fila resuelve solo sus subtiradas", () => {
    const pj = personaje(subclases[3]); const cfg = obtenerTablaRasgo(pj, rasgo(pj, "Tabla de Oleada de magia salvaje"))!;
    expect(cfg.tiradas).toBe(2);
    expect(obtenerTablaRasgo(pj, rasgo(pj, "Mareas de caos"))!.tiradas).toBe(2);
    for (let n = 1; n <= 100; n++) {
      const resultado = tirarFilasTabla(cfg, () => (n - 0.5) / 100); expect(resultado[0].fila.desde <= n && resultado[0].fila.hasta >= n).toBe(true);
    }
    expect(resolverFilaTabla(cfg.filas[1], () => 0)).toContain("1d4: 1");
    expect(resolverFilaTabla(cfg.filas[2], () => 0)).not.toContain("Subtiradas");
    expect(resolverFilaTabla(cfg.filas[24], () => 0)).toContain("2d10: 1 + 1 = 2");
    expect(resolverFilaTabla(cfg.filas[24], () => 0.99)).not.toContain("2d10:");
    expect(obtenerTablaRasgo(pj, rasgo(pj, "Oleada domada"))!.filas).toHaveLength(24);
  });
  it("Mareas prepara ventaja; cancelar, fallo y daño no consumen, una prueba exitosa sí", async () => {
    const pj = personaje(subclases[3]); cargar(pj); const r = rasgo(pj, "Mareas de caos");
    const activar = () => usarAlmacenDM.getState().alternarActivoRasgo(pj.id, r.id);
    activar(); expect(rasgo(leer(), r.nombre).usosRestantes).toBe(1);
    activar(); expect(rasgo(leer(), r.nombre).usosRestantes).toBe(1); activar();
    expect(evaluarEfectosCondicionesEnTirada({ personaje: leer(), tipo: "ataque" }).tieneVentaja).toBe(true);
    const finalizar = (idRasgo: string, consumir?: boolean) => { if (consumir) usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, { tipo: "finalizarPreparacion", idRasgo }); };
    await emitirTiradaConRasgos(leer(), "ataque", async () => false, finalizar);
    await emitirTiradaConRasgos(leer(), "dano", async () => true, finalizar);
    expect(rasgo(leer(), r.nombre).activo).toBe(true);
    await emitirTiradaConRasgos(leer(), "ataque", async () => true, finalizar);
    expect(rasgo(leer(), r.nombre).activo).toBe(false); expect(rasgo(leer(), r.nombre).usosRestantes).toBe(0);
    const nuevo = operarRecursoRasgo(leer(), { tipo: "guardarTabla", idRasgo: r.id, texto: "Resultado confirmado", detalle: { idFila: "oleada_9" } })!;
    expect(rasgo(nuevo, r.nombre).usosRestantes).toBe(0);
    expect(rasgo(recargar(nuevo), "Tabla de Oleada de magia salvaje").resultadoTabla?.texto).toBe("Resultado confirmado");
  });
});

describe("Fase 6: Metamagia", () => {
  it.each([[2, 2], [10, 4], [17, 6]])("ofrece diez opciones y %i niveles permiten %i elecciones", (nivel, max) => {
    const pj = personaje(subclases[0], nivel); const r = rasgo(pj, "Metamagia");
    expect(r.selectores?.[0].opciones).toHaveLength(10); expect(r.selectores?.[0].maxSelecciones).toBe(max);
  });
  it("materializa elecciones; cobra 2/1 y permite gratis solo al 20 con Innata", () => {
    const pj = personaje(subclases[0], 20); cargar(pj); const r = rasgo(pj, "Metamagia");
    const opciones = r.selectores![0].opciones.slice(0, 2);
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj.id, r.id, "metamagia", opciones.map(o => o.id));
    const hijo = leer().rasgos.find(r => r.idSelectorOrigen === "metamagia" && r.nombre === opciones[0].nombre)!;
    expect(hijo.costeFijo).toBe(2);
    expect(operarRecursoRasgo(leer(), { tipo: "usarOpcion", idRasgo: hijo.id, gratis: true })).toBeUndefined();
    const pagado = operarRecursoRasgo(leer(), { tipo: "usarOpcion", idRasgo: hijo.id })!; expect(fuente(pagado).usosRestantes).toBe(18);
    cargar(pagado); usarAlmacenDM.getState().alternarActivoRasgo(pj.id, rasgo(pj, "Hechicería innata").id);
    const gratis = operarRecursoRasgo(leer(), { tipo: "usarOpcion", idRasgo: hijo.id, gratis: true })!;
    expect(fuente(gratis).usosRestantes).toBe(18);
    expect(rasgo(recargar(gratis), "Metamagia").selectores?.[0].valorActual).toHaveLength(2);
    expect(metamagia.filter(o => o.costeFijo === 2).map(o => o.nombre)).toEqual(["Conjuro Acelerado", "Conjuro Intensificado"]);
  });
});


describe("Consumidores y límites de capacidades reutilizables", () => {
  it("las defensas psíquicas y la afinidad aparecen en el resumen real sin ventaja genérica", () => {
    const aberrante = personaje();
    expect(obtenerResumenDefensasRasgos(aberrante).resistencias).toContain("Psíquico");
    expect(evaluarEfectosCondicionesEnTirada({ personaje: aberrante, tipo: "salvacion", caracteristica: "sabiduria" }).tieneVentaja).toBe(false);
    const draconico = personaje(subclases[2]); cargar(draconico);
    const r = rasgo(draconico, "Afinidad elemental");
    usarAlmacenDM.getState().actualizarSeleccionRasgo(draconico.id, r.id, "afinidad_elemental", ["fuego"]);
    expect(obtenerResumenDefensasRasgos(leer()).resistencias).toEqual(["Fuego"]);
    expect(rasgo(recargar(leer()), r.nombre).selectores?.[0].valorActual).toEqual(["fuego"]);
  });
  it("las alas caducan, retiran vuelo y no se recargan sin tres puntos", () => {
    const pj = personaje(subclases[2]); cargar(pj); const r = rasgo(pj, "Alas de dragón");
    usarAlmacenDM.getState().alternarActivoRasgo(pj.id, r.id);
    expect(obtenerVelocidadesEfectivas(leer()).volar).toBe(60);
    expect(leer().efectosActivos.find(e => e.idRasgoOrigen === r.id)?.expiraRonda).toBe(601);
    const final = normalizarCondicionesRasgos(leer(), 601);
    expect(obtenerVelocidadesEfectivas(final).volar).toBeFalsy();
    cargar({ ...final, rasgos: final.rasgos.map(x => x.id === fuente(final).id ? { ...x, usosRestantes: 2 } : x) });
    usarAlmacenDM.getState().recargarUsoRasgoConPadre(pj.id, r.id);
    expect(rasgo(leer(), r.nombre).usosRestantes).toBe(0); expect(fuente(leer()).usosRestantes).toBe(2);
  });
  it("conjuros psiónicos conservan su procedencia, CD innata y límite de puntos", () => {
    const pj = personaje(); cargar(pj);
    usarAlmacenDM.getState().alternarActivoRasgo(pj.id, rasgo(pj, "Hechicería innata").id);
    const hechizo = HECHIZOS_INICIALES.find(h => h.id === "h_susurros-discordantes")!;
    const solicitud = { modo: "recursoRasgo" as const, idRasgoOrigen: rasgo(pj, "Hechicería psiónica").id, hechizo, cdSalvacionPersonaje: 18 };
    expect(prepararLanzamiento(solicitud, { personajeActual: leer() }).cdSalvacion).toBe(19);
    expect(prepararLanzamiento(solicitud, { personajeActual: leer() }).claseLanzamiento).toBe("Hechicero");
    const sinPuntos = { ...leer(), rasgos: leer().rasgos.map(r => r.id === fuente(pj).id ? { ...r, usosRestantes: 0 } : r) };
    expect(validarLanzamiento(solicitud, { personajeActual: sinPuntos }).permitido).toBe(false);
    expect(validarLanzamiento({ ...solicitud, claseLanzamiento: "Mago" }, { personajeActual: leer() }).permitido).toBe(false);
  });
  it("respeta la aptitud elegida al lanzar con otra clase un conjuro también concedido", () => {
    const pj = personaje(subclases[2], 9);
    pj.clasesLanzadoras.push({ clase: "Mago", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "preparados" });
    const hechizo = HECHIZOS_INICIALES.find(h => h.id === "h_orbe-cromatico")!;
    expect(aplicarConfiguracionConjurosRasgos(pj, { modo: "espacio", hechizo, claseLanzamiento: "Mago" }).modificadorHabilidad).toBe(1);
    expect(aplicarConfiguracionConjurosRasgos(pj, { modo: "espacio", hechizo, claseLanzamiento: "Hechicero" }).modificadorHabilidad).toBe(4);
  });
  it("rechaza tablas incompletas o solapadas en la validación del builder", () => {
    for (const filas of [[{ id: "a", desde: 1, hasta: 50, texto: "a" }], [{ id: "a", desde: 1, hasta: 100, texto: "a" }, { id: "b", desde: 50, hasta: 60, texto: "b" }]])
      expect(EsquemaMecanicasRasgo.safeParse({ tablaAleatoria: { filas } }).success).toBe(false);
  });
  it("Metamagia no permite usar opciones sin puntos ni gratuidad antes de nivel 20", () => {
    const pj = personaje(subclases[0], 19); cargar(pj); const r = rasgo(pj, "Metamagia");
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj.id, r.id, "metamagia", [metamagia[0].id]);
    usarAlmacenDM.getState().alternarActivoRasgo(pj.id, rasgo(pj, "Hechicería innata").id);
    const hijo = leer().rasgos.find(r => r.idSelectorOrigen === "metamagia")!;
    const sinPuntos = { ...leer(), rasgos: leer().rasgos.map(r => r.id === fuente(pj).id ? { ...r, usosRestantes: 0 } : r) };
    expect(operarRecursoRasgo(sinPuntos, { tipo: "usarOpcion", idRasgo: hijo.id })).toBeUndefined();
    expect(operarRecursoRasgo(sinPuntos, { tipo: "usarOpcion", idRasgo: hijo.id, gratis: true })).toBeUndefined();
  });
  it("opera robustamente cuando usosRestantes es undefined en rasgos con usos limitados", () => {
    const pj = personaje(subclases[0], 6);
    const sinUsosDefinidos: PersonajeJugador = {
      ...pj,
      rasgos: pj.rasgos.map(r => ({ ...r, usosRestantes: undefined }))
    };

    const hechizoPsionico = HECHIZOS_INICIALES.find(h => h.id === "h_susurros-discordantes")!;
    const rasgoPsionico = rasgo(sinUsosDefinidos, "Hechicería psiónica");
    const consumo = consumirRecursoConjuro(sinUsosDefinidos, {
      tipo: "recursoRasgo",
      idRasgo: rasgoPsionico.id,
      hechizo: hechizoPsionico,
      nivel: 1
    });
    expect(consumo.permitido).toBe(true);
    if (consumo.permitido) {
      const f = fuente(consumo.personaje);
      expect(f.usosRestantes).toBe(5);
    }

    const pjSalvaje = personaje(subclases[3], 3);
    const salvajeSinUsos: PersonajeJugador = {
      ...pjSalvaje,
      rasgos: pjSalvaje.rasgos.map(r => r.nombre === "Mareas de caos" ? { ...r, activo: true, usosRestantes: undefined } : r)
    };
    const finMareas = operarRecursoRasgo(salvajeSinUsos, {
      tipo: "finalizarPreparacion",
      idRasgo: rasgo(salvajeSinUsos, "Mareas de caos").id
    });
    expect(finMareas).toBeDefined();
    expect(rasgo(finMareas!, "Mareas de caos").activo).toBe(false);
    expect(rasgo(finMareas!, "Mareas de caos").usosRestantes).toBe(0);

    const pjRelojeria = personaje(subclases[1], 6);
    const relojSinUsos: PersonajeJugador = {
      ...pjRelojeria,
      rasgos: pjRelojeria.rasgos.map(r => ({ ...r, usosRestantes: undefined }))
    };
    const compraBastion = operarRecursoRasgo(relojSinUsos, {
      tipo: "comprarDados",
      idRasgo: rasgo(relojSinUsos, "Bastión de la ley").id,
      cantidad: 3
    });
    expect(compraBastion).toBeDefined();
    expect(rasgo(compraBastion!, "Bastión de la ley").dadosReserva).toBe(3);
    expect(fuente(compraBastion!).usosRestantes).toBe(3);
  });
});
