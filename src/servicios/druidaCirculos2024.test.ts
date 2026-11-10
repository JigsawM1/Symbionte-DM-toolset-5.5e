import { beforeEach, describe, expect, it } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import type { PersonajeJugador } from "@/tipos";
import { aplicarBuildClaseAPersonaje, construirBuildClase } from "./gestorClases";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { evaluarConjuroEnFormaBestia } from "./reglasFormaSalvaje";
import { obtenerOpcionesRecursoConjuro } from "./rasgos/lanzamientoRecursoRasgos";
import { obtenerVelocidadesEfectivas } from "./rasgos/evaluadorMovilidadRasgos";
import { evaluarEfectosRasgosActivos } from "./rasgos/evaluadorExpresionesRasgos";
import { obtenerMinimoNaturalD20 } from "./rasgos/emisionTiradaRasgos";
import { operarRecursoRasgo } from "./rasgos/conversionRecursosRasgos";
import { prepararResolucionAsistida, prepararDanoIntegrado } from "./rasgos/resolucionAsistidaRasgos";
import { calcularEstadisticasPersonaje } from "./personajes/calculadorEstadisticasPersonaje";
import { resolverClaseLanzamiento } from "./rasgos/modificadoresConjuroRasgos";
import { obtenerConcesionRasgo } from "./rasgos/concesionesRasgos";
import { evaluarVentajasDeRasgosEnTirada } from "./rasgos/evaluadorSalvacionesRasgos";
import { finalizarRasgosDelTurno } from "./rasgos/estadoCondicionesRasgos";

const estado = usarAlmacenDM.getState;
const hechizo = (id: string) => HECHIZOS_INICIALES.find(h => h.id === `h_${id}`)!;
const rasgo = (pj: PersonajeJugador, sufijo: string) => pj.rasgos.find(r => r.id.endsWith(`_${sufijo}`))!;
const resistencias = (pj: PersonajeJugador) => evaluarEfectosRasgosActivos(pj).filter(e => e.tipo === "resistencia_dano").map(e => e.objetivo);
const crear = (nivel: number, circulo: string) => {
  const pj = aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), especie: "",
    caracteristicas: { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 10, sabiduria: 16, carisma: 10 }
  }, "Druida", nivel, circulo);
  const id = estado().crearPersonaje(pj);
  return () => estado().personajes.find(p => p.id === id)!;
};
const activar = (pj: PersonajeJugador, idRasgo: string, selectores: Record<string, string[]> = {}) =>
  estado().alternarActivoRasgo(pj.id, idRasgo, { selectores, opcionales: [] });
const solicitud = (idRasgo: string, idOpcion: string, propio = false) => ({ idRasgo, idOpcion, confirmado: true, incluirDados: true, propio });

describe("Círculos de 2024 en el almacén de la ficha", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1, indiceTurnoActivo: 0, baseDatosHechizos: HECHIZOS_INICIALES }));

  it("concede los hitos de Mar por nivel de Druida, incluso con espacios multiclase superiores", () => {
    for (const [nivel, conjuros] of [[2, 0], [3, 4], [5, 6], [7, 8], [9, 10], [20, 10]]) {
      const ficha = crear(nivel, "Círculo del Mar");
      const r = rasgo(ficha(), "conjuros_del_circulo_del_mar");
      expect(r ? obtenerConcesionRasgo(ficha(), r, "conjuros").length : 0).toBe(conjuros);
      expect(r ? obtenerConcesionRasgo(ficha(), r, "trucos") : []).toEqual(nivel >= 3 ? ["h_rayo-de-escarcha"] : []);
    }
    const ficha = crear(3, "Círculo del Mar");
    estado().actualizarPersonaje(ficha().id, {
      nivel: 13,
      clases: [{ nombre: "Druida", nivel: 3, subclase: "Círculo del Mar" }, { nombre: "Mago", nivel: 10, subclase: "" }]
    });
    expect(ficha().nivel).toBe(13);
    expect(ficha().conjurosSiemprePreparadosIds).not.toContain("h_conjurar-elemental");
    expect(rasgo(ficha(), "ira_del_mar").alcanceResolucionPies).toBe(5);
    expect(construirBuildClase("Druida", 14, "Círculo del Mar")?.rasgos.filter(r => r.id.endsWith("_ira_del_mar"))).toHaveLength(1);
  });

  it("Tierra cambia la concesión y la resistencia solo tras un descanso largo", () => {
    const ficha = crear(10, "Círculo de la Tierra");
    const lista = rasgo(ficha(), "conjuros_del_circulo_de_la_tierra");
    const elegir = (opcion: string) => estado().actualizarSeleccionRasgo(ficha().id, lista.id, "selector_tierra_bioma", [opcion]);
    expect(lista.selectores?.[0].valorActual).toEqual([]);
    elegir("arida");
    expect(ficha().trucosConocidosIds).toContain(hechizo("descarga-de-fuego").id);
    expect(ficha().conjurosSiemprePreparadosIds).toContain(hechizo("muro-de-piedra").id);
    expect(resolverClaseLanzamiento(ficha(), hechizo("bola-de-fuego"))).toBe("Druida");
    expect(resistencias(ficha())).toContain("fuego");
    elegir("polar");
    expect(ficha().trucosConocidosIds).not.toContain(hechizo("rayo-de-escarcha").id);
    estado().ejecutarDescansoPersonaje(ficha().id, "largo");
    elegir("polar");
    expect(ficha().trucosConocidosIds).not.toContain(hechizo("descarga-de-fuego").id);
    expect(ficha().trucosConocidosIds).toContain(hechizo("rayo-de-escarcha").id);
    expect(resistencias(ficha())).toEqual(["frío"]);
    const guardado = hidratarPersonaje(deshidratarPersonaje(ficha()), HECHIZOS_INICIALES);
    expect(guardado.trucosConocidosIds).toContain(hechizo("rayo-de-escarcha").id);
  });

  it("Auxilio resuelve daño y curación con un solo gasto y Recuperación natural separa sus usos", () => {
    const ficha = crear(14, "Círculo de la Tierra");
    const lista = rasgo(ficha(), "conjuros_del_circulo_de_la_tierra");
    estado().actualizarSeleccionRasgo(ficha().id, lista.id, "selector_tierra_bioma", ["arida"]);
    const auxilio = solicitud(rasgo(ficha(), "auxilio_de_la_tierra").id, "auxilio", true);
    expect(prepararResolucionAsistida(ficha(), auxilio)?.formula).toBe("4d6");
    expect(operarRecursoRasgo(ficha(), { tipo: "resolverAsistida", solicitud: auxilio, resultado: 12 })).toBeUndefined();
    expect(estado().operarRecursoRasgoPersonaje(ficha().id, { tipo: "resolverAsistida", solicitud: auxilio, resultado: 12, curacion: 8 })).toBe(true);
    expect(rasgo(ficha(), "forma_salvaje").usosRestantes).toBe(2);
    const gratis = obtenerOpcionesRecursoConjuro(ficha(), hechizo("bola-de-fuego"), "Druida")[0];
    expect(gratis.coste).toBe(1);
    expect(obtenerOpcionesRecursoConjuro(ficha(), hechizo("rayo-de-escarcha"))).toEqual([]);
    const espacios = rasgo(ficha(), "recuperacion_natural_espacios");
    expect(operarRecursoRasgo(ficha(), { tipo: "recuperarEspaciosDescanso", idRasgo: espacios.id, espacios: { 1: 1 } })).toBeUndefined();
    estado().gastarEspacioConjuro(ficha().id, 1);
    estado().ejecutarDescansoPersonaje(ficha().id, "corto");
    expect(estado().operarRecursoRasgoPersonaje(ficha().id, { tipo: "recuperarEspaciosDescanso", idRasgo: espacios.id, espacios: { 1: 1 } })).toBe(true);
    expect(rasgo(ficha(), "recuperacion_natural").usosRestantes).toBe(1);
    expect(rasgo(ficha(), "recuperacion_natural_espacios").usosRestantes).toBe(0);
  });

  it("Luna transforma por configuración y restringe los conjuros a la concesión adquirida", () => {
    const ficha = crear(7, "Círculo de la Luna");
    estado().establecerFormasConocidasDruida(ficha().id, ["m_lobo"]);
    estado().transformarEnFormaSalvaje(ficha().id, "m_lobo");
    expect(ficha().hpTemporal).toBe(21);
    expect(calcularEstadisticasPersonaje(ficha()).claseArmadura.total).toBe(16);
    expect(evaluarConjuroEnFormaBestia(ficha(), hechizo("voluta-estelar"), "Druida")).toBe("permitido");
    expect(evaluarConjuroEnFormaBestia(ficha(), hechizo("voluta-estelar"), "Bardo")).toBe("bloqueado");
    expect(evaluarConjuroEnFormaBestia(ficha(), hechizo("curar-heridas-en-masa"), "Druida")).toBe("bloqueado");
    const alto = aplicarBuildClaseAPersonaje(ficha(), "Druida", 14, "Círculo de la Luna");
    const impacto = solicitud(rasgo(alto, "forma_lunar").id, "radiante");
    expect(prepararDanoIntegrado(alto, impacto)).toEqual({ formula: "2d10", tipoDano: "Radiante" });
    const gasto = { tipo: "confirmarDanoIntegrado" as const, solicitud: impacto, turnoPrevio: "otra-ficha:2" };
    const usado = operarRecursoRasgo(alto, gasto, "otra-ficha:2")!;
    expect(operarRecursoRasgo(usado, gasto, "otra-ficha:2")).toBeUndefined();
    expect(operarRecursoRasgo(usado, { ...gasto, turnoPrevio: "otra-ficha:3" }, "otra-ficha:3")).toBeDefined();
  });

  it("Paso lunar da ventaja y acepta recarga con un espacio de nivel 2", () => {
    const ficha = crear(10, "Círculo de la Luna");
    const paso = rasgo(ficha(), "paso_a_la_luz_de_la_luna");
    activar(ficha(), paso.id);
    expect(rasgo(ficha(), "paso_a_la_luz_de_la_luna").usosRestantes).toBe(2);
    expect(evaluarVentajasDeRasgosEnTirada(ficha(), { tipoTirada: "ataque" }).tieneVentaja).toBe(true);
    expect(operarRecursoRasgo(ficha(), { tipo: "recuperarUsosConEspacio", idRasgo: paso.id, nivel: 1 })).toBeUndefined();
    expect(estado().operarRecursoRasgoPersonaje(ficha().id, { tipo: "recuperarUsosConEspacio", idRasgo: paso.id, nivel: 2 })).toBe(true);
    expect(rasgo(ficha(), "paso_a_la_luz_de_la_luna").usosRestantes).toBe(3);
    expect(ficha().espaciosConjuroGastados[2]).toBe(1);
    const turno = { colaIniciativa: [{ id: ficha().id }, { id: "otra-ficha" }], indiceTurnoActivo: 0, rondaActual: 1 };
    expect(rasgo(finalizarRasgosDelTurno(ficha(), turno, { ...turno, indiceTurnoActivo: 1 }), "paso_a_la_luz_de_la_luna").activo).toBe(false);
    activar(ficha(), paso.id);
    expect(evaluarVentajasDeRasgosEnTirada(ficha(), { tipoTirada: "ataque" }).tieneVentaja).toBe(false);
  });

  it("Mar gasta dos usos solo al activar ambos portadores y retira las defensas al terminar", () => {
    const ficha = crear(14, "Círculo del Mar");
    const ira = rasgo(ficha(), "ira_del_mar");
    expect(ira.alcanceResolucionPies).toBe(10);
    expect(obtenerVelocidadesEfectivas(ficha()).nadar).toBe(30);
    activar(ficha(), ira.id, { selector_portador_emanacion: ["propio", "aliado"] });
    expect(rasgo(ficha(), "forma_salvaje").usosRestantes).toBe(1);
    expect(obtenerVelocidadesEfectivas(ficha()).volar).toBe(30);
    expect(resistencias(ficha())).toContain("trueno");
    const golpe = solicitud(ira.id, "golpe");
    expect(prepararResolucionAsistida(ficha(), golpe)?.formula).toBe("3d6");
    expect(estado().operarRecursoRasgoPersonaje(ficha().id, { tipo: "resolverAsistida", solicitud: golpe, resultado: 8 })).toBe(true);
    expect(rasgo(ficha(), "forma_salvaje").usosRestantes).toBe(1);
    estado().alternarActivoRasgo(ficha().id, ira.id, { selectores: {}, opcionales: [], desactivar: true });
    expect(resistencias(ficha())).not.toContain("trueno");
    expect(obtenerVelocidadesEfectivas(ficha()).volar).toBeUndefined();
  });

  it("Estrellas conserva los usos del mapa, aplica Dragón y exige un espacio para Cáliz", () => {
    const ficha = crear(14, "Círculo de las Estrellas");
    const mapa = rasgo(ficha(), "mapa_estelar");
    expect(ficha().trucosConocidosIds).not.toContain(hechizo("guia").id);
    activar(ficha(), mapa.id);
    expect(ficha().trucosConocidosIds).toContain(hechizo("guia").id);
    expect(rasgo(ficha(), "mapa_estelar").usosRestantes).toBe(3);
    const saeta = consumirRecursoConjuro(ficha(), { tipo: "recursoRasgo", idRasgo: mapa.id, hechizo: hechizo("saeta-guia"), nivel: 1 });
    expect(saeta.permitido).toBe(true);
    if (saeta.permitido) {
      const recuperado = hidratarPersonaje(deshidratarPersonaje(saeta.personaje), HECHIZOS_INICIALES);
      expect(rasgo(recuperado, "mapa_estelar")).toMatchObject({ activo: true, usosRestantes: 2 });
      expect(recuperado.espaciosConjuroGastados[1] ?? 0).toBe(0);
    }
    activar(ficha(), mapa.id);
    expect(ficha().trucosConocidosIds).not.toContain(hechizo("guia").id);
    const forma = rasgo(ficha(), "forma_estelar");
    activar(ficha(), forma.id, { selector_constelacion_estelar: ["dragon"] });
    expect(obtenerMinimoNaturalD20(ficha(), "sabiduria")).toBe(10);
    expect(obtenerMinimoNaturalD20(ficha(), "constitucion")).toBe(1);
    expect(obtenerVelocidadesEfectivas(ficha())).toMatchObject({ volar: 20, planea: true });
    expect(resistencias(ficha())).toContain("cortante");
    estado().actualizarSeleccionRasgo(ficha().id, forma.id, "selector_constelacion_estelar", ["caliz"]);
    expect(obtenerMinimoNaturalD20(ficha(), "sabiduria")).toBe(1);
    expect(rasgo(ficha(), "forma_estelar_caliz")).toMatchObject({ curacionTrasConjuroConEspacio: true, activo: true });
    expect(hechizo("curar-heridas").curacion).toBeDefined();
    const consumo = consumirRecursoConjuro(ficha(), { tipo: "espacio", nivel: 1, conjuroCuracion: hechizo("curar-heridas") });
    expect(consumo.permitido && rasgo(consumo.personaje, "forma_estelar_caliz").resolucionesCuracionPendientes?.[0].formula).toBe("2d8 + 3");
  });

  it("Presagio fija la paridad una vez por descanso sin gastar una reacción al consultar", () => {
    const ficha = crear(6, "Círculo de las Estrellas");
    const presagio = rasgo(ficha(), "presagio_cosmico");
    const consulta = { tipo: "guardarTabla" as const, idRasgo: presagio.id, texto: "Desventura", detalle: { idFila: "desventura", tiradaD100: 1 } };
    expect(operarRecursoRasgo(ficha(), consulta)).toBeUndefined();
    estado().ejecutarDescansoPersonaje(ficha().id, "largo");
    expect(estado().operarRecursoRasgoPersonaje(ficha().id, consulta)).toBe(true);
    expect(rasgo(ficha(), "presagio_cosmico").usosRestantes).toBe(3);
    expect(operarRecursoRasgo(ficha(), consulta)).toBeUndefined();
    expect(prepararResolucionAsistida(ficha(), solicitud(presagio.id, "ventura"))).toBeUndefined();
    expect(estado().operarRecursoRasgoPersonaje(ficha().id, { tipo: "resolverAsistida", solicitud: solicitud(presagio.id, "desventura"), resultado: 4 })).toBe(true);
    expect(rasgo(ficha(), "presagio_cosmico").usosRestantes).toBe(2);
  });

  it("retira Guía de la concesión antigua al hidratar y conserva la elección independiente", () => {
    const ficha = crear(3, "Círculo de las Estrellas");
    const legado = { ...deshidratarPersonaje(ficha()), conjurosSiemprePreparadosIds: ["Saeta guía"],
      conjurosPreparadosIds: ["Saeta guía"], trucosConocidosIds: ["Guía"] };
    const restaurada = hidratarPersonaje(legado, HECHIZOS_INICIALES);
    expect(restaurada.conjurosPreparadosIds).not.toContain("Saeta guía");
    expect(restaurada.trucosConocidosIds).not.toContain("Guía");
    expect(hidratarPersonaje({ ...legado, aprendizajesConjurosIndependientes: { conjuros: [], trucos: ["h_guia"] } },
      HECHIZOS_INICIALES).trucosConocidosIds).toContain("Guía");
  });
});
