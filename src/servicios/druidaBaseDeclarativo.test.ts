import { beforeEach, describe, expect, it } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import druida from "@/datos/clases/druida.json";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import type { PersonajeJugador } from "@/tipos";
import { aplicarBuildClaseAPersonaje, construirBuildClase } from "./gestorClases";
import { calcularEstadisticasPersonaje } from "./personajes/calculadorEstadisticasPersonaje";
import { calcularMaximosConjurosYTrucos } from "./calculadorMagia";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { operarRecursoRasgo } from "./rasgos/conversionRecursosRasgos";
import { normalizarCondicionesRasgos } from "./rasgos/estadoCondicionesRasgos";
import { aplicarModificadoresInvocacionesAHechizo } from "./rasgos/evaluadorCombateRasgos";
import { obtenerCompetenciasExtraRasgos } from "./rasgos/evaluadorSalvacionesRasgos";
import { evaluarConjuroEnFormaBestia } from "./reglasFormaSalvaje";
import { elegirConjuroClase } from "./rasgos/listasConjurosRasgos";
import { resolverConjurosAcciones } from "./calculadorAccionesCombate";
import { prepararDanoIntegrado } from "./rasgos/resolucionAsistidaRasgos";
import { identificarTurnoPropio } from "./rasgos/limitesTurnoRasgos";
import { obtenerClasesLanzamiento } from "./rasgos/modificadoresConjuroRasgos";

const estado = usarAlmacenDM.getState;
const ficha = (id: string) => estado().personajes.find(p => p.id === id)!;
const rasgo = (p: PersonajeJugador, clave: string) => p.rasgos.find(r => r.id === `rasgo_cls_druida_${clave}`)!;
const hechizo = (id: string) => HECHIZOS_INICIALES.find(h => h.id === id)!;
const base = (nivel: number) => aplicarBuildClaseAPersonaje({
  ...structuredClone(PERSONAJE_POR_DEFECTO), especie: "",
  caracteristicas: { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 10, sabiduria: 16, carisma: 10 }
}, "Druida", nivel);
const recargar = (p: PersonajeJugador) => hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(p))), HECHIZOS_INICIALES);

describe("Druida base desde los consumidores de la ficha", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], baseDatosHechizos: HECHIZOS_INICIALES }));

  it("guarda, prepara y retira conjuros fuera de lista por separado del cupo de clase", () => {
    const id = estado().crearPersonaje(base(1));
    const proyectil = "h_proyectil-magico";
    const descarga = "h_descarga-de-fuego";
    estado().alternarConjuroPreparado(id, proyectil, "Druida");
    expect(ficha(id).conjurosPreparadosIds).not.toContain(proyectil);
    estado().alternarConjuroIndependiente(id, proyectil);
    estado().alternarConjuroIndependiente(id, descarga);
    expect(ficha(id).conjurosConocidosIds).toContain(proyectil);
    expect(ficha(id).conjurosPreparadosIds).toContain(proyectil);
    expect(resolverConjurosAcciones(ficha(id), HECHIZOS_INICIALES).map(c => c.hechizo.id)).toContain(proyectil);
    estado().agregarTrucoConocido(id, "h_guia", "Druida");
    estado().agregarTrucoConocido(id, "h_voluta-estelar", "Druida");
    expect(ficha(id).eleccionesConjurosClase?.Druida.trucos).toEqual(["h_guia", "h_voluta-estelar"]);
    estado().alternarConjuroPreparado(id, proyectil);
    expect(ficha(id).conjurosPreparadosIds).not.toContain(proyectil);
    expect(ficha(id).conjurosConocidosIds).toContain(proyectil);
    estado().alternarConjuroPreparado(id, proyectil);
    expect(recargar(aplicarBuildClaseAPersonaje(ficha(id), "Druida", 2)).aprendizajesConjurosIndependientes).toMatchObject({
      conjuros: [proyectil], trucos: [descarga]
    });
    estado().alternarConjuroIndependiente(id, proyectil);
    estado().alternarConjuroIndependiente(id, descarga);
    expect(ficha(id).conjurosConocidosIds).not.toContain(proyectil);
    expect(ficha(id).conjurosPreparadosIds).not.toContain(proyectil);
    expect(ficha(id).trucosConocidosIds).not.toContain(descarga);
  });

  it("valida el catálogo y aplica la progresión mágica y la reserva en los veinte niveles", () => {
    expect(EsquemaDefinicionClaseJSON.safeParse(druida).success).toBe(true);
    const preparados = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
    for (const [indice, cantidad] of preparados.entries()) {
      const nivel = indice + 1;
      const pj = base(nivel);
      expect(calcularMaximosConjurosYTrucos(pj.clasesLanzadoras, nivel)).toMatchObject({
        maxConjuros: cantidad, maxTrucos: nivel < 4 ? 2 : nivel < 10 ? 3 : 4
      });
      expect(rasgo(pj, "forma_salvaje")?.usosMaximos).toBe(nivel < 2 ? undefined : nivel < 6 ? 2 : nivel < 17 ? 3 : 4);
      expect(rasgo(pj, "conjurar_como_bestia")?.permiteConjurosEnBestia ?? false).toBe(nivel >= 18);
    }
    expect(construirBuildClase("Druida", 2, "Círculo del Mar")?.rasgos.some(r => r.origen === "subclase")).toBe(false);
    expect(construirBuildClase("Druida", 3, "Círculo del Mar")?.rasgos.some(r => r.origen === "subclase")).toBe(true);
  });

  it("concede idioma y preparación, hidrata el truco anidado y retira sus aportes al elegir Guardián", () => {
    const id = estado().crearPersonaje(base(1));
    const orden = rasgo(ficha(id), "orden_primigenio");
    expect(orden.selectores?.[0].valorActual).toEqual([]);
    expect(ficha(id).conjurosSiemprePreparadosIds).toContain("h_hablar-con-los-animales");
    expect(obtenerCompetenciasExtraRasgos(ficha(id)).idiomas).toContain("Druídico");
    expect(ficha(id).idiomasLista).not.toContain("Druídico");
    estado().actualizarSeleccionRasgo(id, orden.id, "selector_orden_primigenio", ["mago"]);
    const mago = rasgo(ficha(id), "orden_primigenio_mago");
    const selector = mago.selectores![0];
    estado().actualizarSeleccionRasgo(id, mago.id, selector.id, ["h_bola-de-fuego"]);
    expect(rasgo(ficha(id), "orden_primigenio_mago").selectores?.[0].valorActual).toEqual([]);
    estado().actualizarSeleccionRasgo(id, mago.id, selector.id, ["h_voluta-estelar"]);
    expect(ficha(id).trucosConocidosIds).toContain("h_voluta-estelar");
    expect(ficha(id).conjurosSiemprePreparadosIds).not.toContain("h_voluta-estelar");
    expect(calcularEstadisticasPersonaje(ficha(id)).habilidades.arcanos).toBe(3);
    const restaurado = recargar(ficha(id));
    expect(rasgo(restaurado, "orden_primigenio_mago").selectores?.[0].valorActual).toEqual(["h_voluta-estelar"]);
    expect(restaurado.trucosConocidosIds).toContain("h_voluta-estelar");
    estado().actualizarSeleccionRasgo(id, orden.id, "selector_orden_primigenio", ["guardian"]);
    expect(ficha(id).trucosConocidosIds).not.toContain("h_voluta-estelar");
    expect(obtenerCompetenciasExtraRasgos(ficha(id))).toMatchObject({ armasGrupos: ["marciales"], armadurasGrupos: ["medias"] });
    const independiente = { ...restaurado, aprendizajesConjurosIndependientes: { conjuros: [], trucos: ["h_voluta-estelar"] } };
    expect(aplicarBuildClaseAPersonaje(independiente, "Guerrero", 1).trucosConocidosIds).toContain("h_voluta-estelar");
  });

  it("otorga Encontrar familiar desde nivel 2 como un conjuro preparado normal de Druida", () => {
    const pj = base(2);
    const companero = rasgo(pj, "companero_salvaje");
    const familiar = hechizo("h_encontrar-familiar");
    expect(base(1).conjurosSiemprePreparadosIds).not.toContain(familiar.id);
    expect(companero).toMatchObject({ conjurosOtorgados: [familiar.id], claseConjurosOtorgados: "Druida", tipoAccion: "pasivo" });
    expect(companero.lanzamientoConRecurso).toBeUndefined();
    expect(recargar(pj).conjurosSiemprePreparadosIds).toContain(familiar.id);
    expect(aplicarBuildClaseAPersonaje(pj, "Druida", 1).conjurosSiemprePreparadosIds).not.toContain(familiar.id);
    expect(resolverConjurosAcciones(pj, HECHIZOS_INICIALES).filter(c => c.hechizo.id === familiar.id)).toEqual([
      expect.objectContaining({ hechizo: familiar })
    ]);
    const pagoEspacio = consumirRecursoConjuro(pj, { tipo: "espacio", nivel: 1 });
    if (!pagoEspacio.permitido) throw new Error(pagoEspacio.motivo);
    expect(rasgo(pagoEspacio.personaje, "forma_salvaje").usosRestantes).toBe(2);
    expect(pagoEspacio.personaje.espaciosConjuroGastados[1]).toBe(1);
    expect(pagoEspacio.personaje.efectosActivos).toEqual([]);
  });

  it("valida la transformación, preserva el gasto al recargar y habilita una sola sustitución tras descanso largo", () => {
    const id = estado().crearPersonaje(base(2));
    estado().transformarEnFormaSalvaje(id, "m_lobo");
    expect(rasgo(ficha(id), "forma_salvaje").usosRestantes).toBe(2);
    estado().establecerFormasConocidasDruida(id, ["m_lobo", "m_cuervo"]);
    expect(ficha(id).formaSalvaje.formasConocidasIds).toEqual(["m_lobo"]);
    estado().transformarEnFormaSalvaje(id, "m_lobo");
    estado().transformarEnFormaSalvaje(id, "m_lobo");
    expect(ficha(id).formaSalvaje.formaActivaId).toBe("m_lobo");
    expect(rasgo(recargar(ficha(id)), "forma_salvaje").usosRestantes).toBe(0);
    const reconstruido = aplicarBuildClaseAPersonaje(ficha(id), "Druida", 2);
    expect(rasgo(reconstruido, "forma_salvaje")).toMatchObject({ usosRestantes: 0, activo: true });
    expect(reconstruido.formaSalvaje.formaActivaId).toBe("m_lobo");
    estado().agregarPersonajeAIniciativa(ficha(id));
    expect(normalizarCondicionesRasgos(ficha(id), 601).formaSalvaje.formaActivaId).toBe("m_lobo");
    const impedido = normalizarCondicionesRasgos({ ...ficha(id), condicionesActivas: ["Incapacitado"] });
    expect(impedido.formaSalvaje.formaActivaId).toBeNull();
    const corto = ejecutarDescansoCorto(ficha(id), 0).personajeActualizado;
    expect(corto.formaSalvaje.formaActivaId).toBeNull();
    expect(rasgo(corto, "forma_salvaje").usosRestantes).toBe(1);
    estado().establecerFormasConocidasDruida(id, ["m_rata"]);
    expect(ficha(id).formaSalvaje.formasConocidasIds).toEqual(["m_lobo"]);
    estado().actualizarPersonaje(id, ejecutarDescansoLargo(ficha(id)).personajeActualizado);
    estado().establecerFormasConocidasDruida(id, ["m_rata"]);
    estado().establecerFormasConocidasDruida(id, ["m_lobo"]);
    expect(ficha(id).formaSalvaje.formasConocidasIds).toEqual(["m_rata"]);
  });

  it("convierte de forma indivisible y mantiene independiente la recuperación de iniciativa", () => {
    const id = estado().crearPersonaje(base(20));
    const resurgimiento = rasgo(ficha(id), "resurgimiento_salvaje");
    const forma = rasgo(ficha(id), "forma_salvaje");
    const archidruida = rasgo(ficha(id), "archidruida");
    const convertir = { tipo: "convertirEspacio" as const, idRasgo: resurgimiento.id, nivel: 3, origen: "ordinario" as const };
    expect(operarRecursoRasgo(ficha(id), convertir, "turno:1")).toBeUndefined();
    expect(estado().operarRecursoRasgoPersonaje(id, { tipo: "crearEspacio", idRasgo: archidruida.id, nivel: 8, cantidad: 1 })).toBe(true);
    expect(ficha(id).espaciosConjuroAdicionales[8]).toBe(1);
    expect(rasgo(ficha(id), "forma_salvaje").usosRestantes).toBe(0);
    const recuperado = operarRecursoRasgo(ficha(id), convertir, "turno:1")!;
    expect(rasgo(recuperado, "forma_salvaje").usosRestantes).toBe(1);
    expect(recuperado.espaciosConjuroGastados[3]).toBe(1);
    const agotado = { ...recuperado, rasgos: recuperado.rasgos.map(r => r.id === forma.id ? { ...r, usosRestantes: 0 } : r) };
    expect(operarRecursoRasgo(agotado, convertir, "turno:1")).toBeUndefined();
    estado().dispararRasgosIniciativaPersonaje(id);
    expect(rasgo(ficha(id), "forma_salvaje").usosRestantes).toBe(1);
    expect(rasgo(ficha(id), "archidruida").usosRestantes).toBe(0);
    expect(ejecutarDescansoLargo(ficha(id)).personajeActualizado.espaciosConjuroAdicionales).toEqual({});
  });

  it("restringe el bono y alcance por procedencia y fusiona la mejora de Furia de forma reversible", () => {
    const id = estado().crearPersonaje(base(15));
    const furia = rasgo(ficha(id), "furia_elemental");
    const voluta = hechizo("h_voluta-estelar");
    estado().actualizarSeleccionRasgo(id, furia.id, "selector_furia_elemental", ["lanzamiento_potente"]);
    const mejorada = aplicarModificadoresInvocacionesAHechizo(voluta, ficha(id), "Druida");
    expect(mejorada).toMatchObject({ alcance: "360 pies", bonoModificadorRasgo: 3 });
    expect(aplicarModificadoresInvocacionesAHechizo(mejorada, ficha(id), "Druida").alcance).toBe("360 pies");
    expect(aplicarModificadoresInvocacionesAHechizo(voluta, ficha(id), "Bardo").bonoModificadorRasgo).toBeUndefined();
    expect(aplicarModificadoresInvocacionesAHechizo(hechizo("h_resistencia"), ficha(id), "Druida").bonoModificadorRasgo).toBeUndefined();
    estado().actualizarSeleccionRasgo(id, furia.id, "selector_furia_elemental", ["golpe_primordial"]);
    expect(rasgo(ficha(id), "furia_elemental_golpe_primordial").formulaDados).toBe("2d8");
    const revertida = aplicarModificadoresInvocacionesAHechizo(mejorada, ficha(id), "Druida");
    expect(revertida.alcance).toBe("60 pies");
    expect(revertida.bonoModificadorRasgo).toBeUndefined();
  });

  it("aplica Golpe primordial al daño una vez por turno y retira su resolución al cambiar de opción", () => {
    const id = estado().crearPersonaje(base(7));
    const furia = rasgo(ficha(id), "furia_elemental");
    const elegir = (opcion: string) => estado().actualizarSeleccionRasgo(id, furia.id, "selector_furia_elemental", [opcion]);
    elegir("golpe_primordial");
    const golpe = rasgo(ficha(id), "furia_elemental_golpe_primordial");
    const solicitud = { idRasgo: golpe.id, idOpcion: "frio", confirmado: true, incluirDados: true, propio: false };
    const op = { tipo: "confirmarDanoIntegrado" as const, solicitud };
    expect(prepararDanoIntegrado(ficha(id), solicitud)).toEqual({ formula: "1d8", tipoDano: "Frío" });
    expect(prepararDanoIntegrado(ficha(id), { ...solicitud, confirmado: false })).toBeUndefined();
    const cola = [{ id: "otro" }, { id: "mi-mini", idPersonajeDuenio: id }];
    const turno = (indiceTurnoActivo: number) => identificarTurnoPropio(ficha(id), { colaIniciativa: cola, indiceTurnoActivo, rondaActual: 1 });
    expect(turno(0)).toBe(false);
    expect(operarRecursoRasgo(ficha(id), op, turno(0))).toBeUndefined();
    expect(turno(1)).toBe("mi-mini:1");
    const usado = operarRecursoRasgo(ficha(id), op, turno(1))!;
    estado().actualizarPersonaje(id, usado);
    elegir("lanzamiento_potente");
    expect(prepararDanoIntegrado(ficha(id), solicitud)).toBeUndefined();
    elegir("golpe_primordial");
    expect(operarRecursoRasgo(ficha(id), op, turno(1))).toBeUndefined();
    expect(operarRecursoRasgo(ficha(id), op, "mi-mini:2")).toBeDefined();
  });

  it("limita el repertorio multiclase por nivel de Druida y aplica las excepciones materiales al nivel 18", () => {
    const pj = base(2);
    const mago = { ...pj.clasesLanzadoras[0], clase: "Mago", habilidadConjuro: "inteligencia" as const, nivel: 5 };
    expect(elegirConjuroClase({ ...pj, nivel: 7, clasesLanzadoras: [...pj.clasesLanzadoras, mago] }, "h_conjurar-animales", "conjuros", "Druida")).toBeUndefined();
    const id = estado().crearPersonaje(base(18));
    estado().establecerFormasConocidasDruida(id, ["m_lobo"]);
    estado().transformarEnFormaSalvaje(id, "m_lobo");
    expect(evaluarConjuroEnFormaBestia(ficha(id), hechizo("h_rayo-de-luna"))).toBe("permitido");
    expect(evaluarConjuroEnFormaBestia(ficha(id), hechizo("h_revivir"))).toBe("bloqueado");
    expect(evaluarConjuroEnFormaBestia(ficha(id), { ...hechizo("h_rayo-de-luna"), materialCostosoOConsumido: undefined })).toBe("confirmar");
  });

  it("valida dotes de los hitos y conserva la elección de característica del Don épico", () => {
    const pj = base(19);
    const id = estado().crearPersonaje({ ...pj, caracteristicas: { ...pj.caracteristicas, sabiduria: 17 } });
    estado().actualizarSeleccionRasgo(id, rasgo(ficha(id), "orden_primigenio").id, "selector_orden_primigenio", ["mago"]);
    estado().actualizarSeleccionRasgo(id, rasgo(ficha(id), "furia_elemental").id, "selector_furia_elemental", ["lanzamiento_potente"]);
    const mejora = ficha(id).rasgos.find(r => r.nivelRequerido === 4 && r.selectores?.[0].tipoSelector === "dote")!;
    const don = ficha(id).rasgos.find(r => r.nivelRequerido === 19 && r.selectores?.[0].tipoSelector === "dote")!;
    const idViaje = "dote_don_viaje_dimensional";
    expect(mejora.selectores![0].valorActual).toEqual([]);
    expect(don.selectores![0].valorActual).toEqual([]);
    expect(don.selectores![0].opciones[0].id).toBe(idViaje);
    estado().actualizarSeleccionRasgo(id, mejora.id, mejora.selectores![0].id, ["dote_mejora_caracteristica"]);
    expect(ficha(id).rasgos.some(r => r.origen === "dote" && r.ligadoA === mejora.id)).toBe(true);
    estado().actualizarSeleccionRasgo(id, don.id, don.selectores![0].id, [idViaje]);
    const viaje = ficha(id).rasgos.find(r => r.origen === "dote" && r.ligadoA === don.id)!;
    estado().actualizarSeleccionRasgo(id, viaje.id, viaje.selectores![0].id, ["sabiduria"]);
    const restaurado = recargar(ficha(id));
    const stats = calcularEstadisticasPersonaje(restaurado);
    expect(stats.puntuacionesEfectivas.sabiduria).toBe(18);
    expect(stats.habilidades.arcanos).toBe(4);
    expect(aplicarModificadoresInvocacionesAHechizo(hechizo("h_voluta-estelar"), restaurado, "Druida").bonoModificadorRasgo).toBe(4);
    estado().actualizarSeleccionRasgo(id, don.id, don.selectores![0].id, []);
    expect(calcularEstadisticasPersonaje(ficha(id)).puntuacionesEfectivas.sabiduria).toBe(17);
    expect(ficha(id).rasgos.some(r => r.origen === "dote" && r.ligadoA === mejora.id)).toBe(true);
  });

  it("distingue las dos procedencias de un truco compartido y su alcance efectivo", () => {
    const id = estado().crearPersonaje(base(15));
    estado().actualizarSeleccionRasgo(id, rasgo(ficha(id), "furia_elemental").id, "selector_furia_elemental", ["lanzamiento_potente"]);
    const pj = ficha(id);
    const bardo = aplicarBuildClaseAPersonaje(structuredClone(PERSONAJE_POR_DEFECTO), "Bardo", 1).clasesLanzadoras[0];
    const voluta = hechizo("h_voluta-estelar");
    const eleccion = { trucos: [voluta.id], conjuros: [] };
    const multi = { ...pj, clasesLanzadoras: [...pj.clasesLanzadoras, bardo], eleccionesConjurosClase: { Druida: eleccion, Bardo: eleccion } };
    expect(obtenerClasesLanzamiento(multi, voluta).candidatas).toEqual(["Druida", "Bardo"]);
    expect(aplicarModificadoresInvocacionesAHechizo(voluta, multi, "Druida").alcance).toBe("360 pies");
    expect(aplicarModificadoresInvocacionesAHechizo(voluta, multi, "Bardo").alcance).toBe("60 pies");
    estado().actualizarSeleccionRasgo(id, rasgo(pj, "orden_primigenio").id, "selector_orden_primigenio", ["mago"]);
    const mago = rasgo(ficha(id), "orden_primigenio_mago");
    estado().actualizarSeleccionRasgo(id, mago.id, mago.selectores![0].id, [voluta.id]);
    expect(obtenerClasesLanzamiento({ ...multi, rasgos: ficha(id).rasgos, eleccionesConjurosClase: { Bardo: eleccion } }, voluta))
      .toEqual({ candidatas: ["Druida", "Bardo"], adquiridas: ["Bardo"] });
  });
});
