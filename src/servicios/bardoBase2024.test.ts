import { beforeEach, describe, expect, it } from "vitest";
import bardo from "@/datos/clases/bardo.json";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import { EsquemaPersonajeJugador } from "@/tipos/personaje";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { aplicarBuildClaseAPersonaje, obtenerRasgosClaseYSubclase } from "./gestorClases";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { operarRecursoRasgo } from "./rasgos/conversionRecursosRasgos";
import { normalizarMecanicasRasgos } from "./rasgos/normalizarMecanicasRasgos";
import { aplicarCambioClaseNivel } from "./sincronizadorMulticlase";
import type { PersonajeJugador } from "@/tipos";

export function crearBardo(nivel: number, carisma = 18): PersonajeJugador {
  return aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "bardo", especie: "",
    caracteristicas: { fuerza: 10, destreza: 14, constitucion: 12, inteligencia: 10, sabiduria: 12, carisma },
    gradosHabilidades: { ...PERSONAJE_POR_DEFECTO.gradosHabilidades, interpretacion: "competente", persuasion: "competente", historia: "competente", sigilo: "competente" }
  }, "Bardo", nivel);
}

const inspiracion = (p: PersonajeJugador) => p.rasgos.find(r => r.id === "rasgo_cls_bardo_inspiracion_bardica")!;
const estado = () => usarAlmacenDM.getState();
const actual = () => estado().personajes[0];
const pericia = () => actual().rasgos.find(r => r.id === "rasgo_cls_bardo_pericia")!;

describe("Bardo base 2024: datos y consumidores reales", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], idPersonajeActivo: null }));

  it.each(Array.from({ length: 20 }, (_, i) => i + 1))("carga y construye el nivel %i sin reservas ni extensiones duplicadas", nivel => {
    const catalogo = EsquemaDefinicionClaseJSON.parse(bardo);
    expect(catalogo.rasgos.find(r => r.nivel === 5 && r.categoriaMecanica === "extension")?.recuperarUsosConEspacio).toBe(1);
    const p = crearBardo(nivel);
    const r = inspiracion(p);
    expect(r.formulaDados).toBe(nivel >= 15 ? "1d12" : nivel >= 10 ? "1d10" : nivel >= 5 ? "1d8" : "1d6");
    expect(r.usosMaximos).toBe(4);
    expect(r.tipoAccion).toBe("accion_adicional");
    expect(r.recuperarUsosConEspacio).toBe(nivel >= 5 ? 1 : undefined);
    expect(r.noGastarAlTirarDados).toBe(true);
    expect(new Set(p.rasgos.map(r => r.id)).size).toBe(p.rasgos.length);
    expect(p.rasgos.some(r => r.categoriaMecanica === "extension")).toBe(false);
    expect(p.rasgos.filter(r => r.origen === "dote")).toHaveLength(0);
    expect(p.rasgos.find(r => r.id === "rasgo_cls_bardo_pericia")?.selectores ?? []).toHaveLength(nivel >= 9 ? 2 : nivel >= 2 ? 1 : 0);
  });

  it("Pericia valida competencia, cupo y duplicados entre adquisiciones; sus efectos se retiran", () => {
    const p = crearBardo(9);
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    const [a, b] = pericia().selectores!;
    estado().actualizarSeleccionRasgo(p.id, pericia().id, a.id, ["arcanos"]);
    expect(pericia().selectores![0].valorActual).toEqual([]);
    estado().actualizarSeleccionRasgo(p.id, pericia().id, a.id, ["historia", "persuasion", "sigilo"]);
    expect(pericia().selectores![0].valorActual).toEqual([]);
    estado().actualizarSeleccionRasgo(p.id, pericia().id, a.id, ["interpretacion", "persuasion"]);
    estado().actualizarSeleccionRasgo(p.id, pericia().id, b.id, ["interpretacion"]);
    expect(pericia().selectores![1].valorActual).toEqual([]);
    estado().actualizarSeleccionRasgo(p.id, pericia().id, b.id, ["historia", "sigilo"]);
    expect(calcularEstadisticasPersonaje(actual()).gradosHabilidadesEfectivos.historia).toBe("pericia");
    expect(actual().gradosHabilidades.historia).toBe("competente");
    const recargado = hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(actual())))));
    expect(recargado.rasgos.find(r => r.id === pericia().id)?.selectores?.[1].valorActual).toEqual(["historia", "sigilo"]);
    const inferior = aplicarBuildClaseAPersonaje(recargado, "Bardo", 8);
    expect(calcularEstadisticasPersonaje(inferior).gradosHabilidadesEfectivos.historia).toBe("competente");
    expect(calcularEstadisticasPersonaje(inferior).gradosHabilidadesEfectivos.interpretacion).toBe("pericia");
    estado().actualizarSeleccionRasgo(p.id, pericia().id, a.id, []);
    expect(calcularEstadisticasPersonaje(actual()).gradosHabilidadesEfectivos.interpretacion).toBe("competente");
    const apagado = { ...actual(), rasgos: actual().rasgos.map(r => r.id === pericia().id ? { ...r, activo: false } : r) };
    expect(calcularEstadisticasPersonaje(apagado).gradosHabilidadesEfectivos.historia).toBe("competente");
  });

  it("Aprendiz de mucho usa competencia total y no se acumula con pericia", () => {
    const p = crearBardo(2);
    const multi = { ...p, nivel: 13, clases: [{ nombre: "Bardo", nivel: 2, subclase: "" }, { nombre: "Guerrero", nivel: 11, subclase: "" }] };
    const stats = calcularEstadisticasPersonaje(multi);
    expect(stats.habilidades.arcanos).toBe(2);
    expect(stats.habilidades.persuasion).toBe(9);
    const sinRasgo = { ...multi, rasgos: [] };
    expect(calcularEstadisticasPersonaje(sinRasgo).habilidades.arcanos).toBe(0);
    expect(inspiracion(multi).formulaDados).toBe("1d6");
  });

  it.each([1, 3, 5, 9])("un espacio de nivel %i recupera exactamente un uso sin modificar PG", nivel => {
    const p = crearBardo(17);
    inspiracion(p).usosRestantes = 0;
    const nuevo = operarRecursoRasgo(p, { tipo: "recuperarUsosConEspacio", idRasgo: inspiracion(p).id, nivel })!;
    expect(inspiracion(nuevo).usosRestantes).toBe(1);
    expect(nuevo.espaciosConjuroGastados[nivel]).toBe(1);
    expect(nuevo.hpTemporal).toBe(p.hpTemporal);
    expect(operarRecursoRasgo({ ...nuevo, rasgos: nuevo.rasgos.map(r => r.id === inspiracion(p).id ? { ...r, usosRestantes: 4 } : r) },
      { tipo: "recuperarUsosConEspacio", idRasgo: inspiracion(p).id, nivel })).toBeUndefined();
  });

  it("conversión revalida adquisición, espacio agotado, inactividad y espacio de pacto", () => {
    const p = crearBardo(4); inspiracion(p).usosRestantes = 0;
    const op = { tipo: "recuperarUsosConEspacio" as const, idRasgo: inspiracion(p).id, nivel: 1 };
    expect(operarRecursoRasgo(p, op)).toBeUndefined();
    const cinco = crearBardo(5); inspiracion(cinco).usosRestantes = 0;
    expect(operarRecursoRasgo({ ...cinco, espaciosConjuroGastados: { 1: 4 } }, op)).toBeUndefined();
    inspiracion(cinco).activo = false;
    expect(operarRecursoRasgo(cinco, op)).toBeUndefined();
    inspiracion(cinco).activo = true;
    const pacto = operarRecursoRasgo({ ...cinco, espaciosPactoMaximos: 1, espaciosPactoGastados: 0, nivelEspacioPacto: 2 }, { ...op, pacto: true, nivel: 2 })!;
    expect(pacto.espaciosPactoGastados).toBe(1);
    expect(inspiracion(pacto).usosRestantes).toBe(1);
  });

  it("estrategia de puntos de conjuro recupera usos con coste escalonado (2, 4, 6... n+2) y reinicia en descanso", () => {
    const cinco = crearBardo(5);
    const id = inspiracion(cinco).id;
    const conPuntos = { ...cinco, puntosConjuroMaximos: 27, puntosConjuroGastados: 0 };
    inspiracion(conPuntos).usosRestantes = 0;

    // 1er uso consecutivo: 2 puntos (m = 0 -> 2 pts)
    const r1 = operarRecursoRasgo(conPuntos, { tipo: "recuperarUsosConEspacio", modo: "puntos", idRasgo: id, puntos: 2, cantidadUsos: 1 });
    expect(r1).toBeDefined();
    expect(inspiracion(r1!).usosRestantes).toBe(1);
    expect(inspiracion(r1!).usosRecuperadosConPuntos).toBe(1);
    expect(r1!.puntosConjuroGastados).toBe(2);

    // 2º uso consecutivo sobre r1: 4 puntos (m = 1 -> 4 pts)
    const r1Segundo = operarRecursoRasgo(r1!, { tipo: "recuperarUsosConEspacio", modo: "puntos", idRasgo: id, puntos: 4, cantidadUsos: 1 });
    expect(r1Segundo).toBeDefined();
    expect(inspiracion(r1Segundo!).usosRestantes).toBe(2);
    expect(inspiracion(r1Segundo!).usosRecuperadosConPuntos).toBe(2);
    expect(r1Segundo!.puntosConjuroGastados).toBe(6);

    // 2 usos simultáneos desde cero: 2 + 4 = 6 puntos
    const r2 = operarRecursoRasgo(conPuntos, { tipo: "recuperarUsosConEspacio", modo: "puntos", idRasgo: id, puntos: 6, cantidadUsos: 2 });
    expect(r2).toBeDefined();
    expect(inspiracion(r2!).usosRestantes).toBe(2);
    expect(inspiracion(r2!).usosRecuperadosConPuntos).toBe(2);
    expect(r2!.puntosConjuroGastados).toBe(6);

    // Rechazo si la equivalencia no es exacta según la progresión escalonada
    expect(operarRecursoRasgo(conPuntos, { tipo: "recuperarUsosConEspacio", modo: "puntos", idRasgo: id, puntos: 4, cantidadUsos: 2 })).toBeUndefined();
    expect(operarRecursoRasgo(r1!, { tipo: "recuperarUsosConEspacio", modo: "puntos", idRasgo: id, puntos: 2, cantidadUsos: 1 })).toBeUndefined();

    // Rechazo si no hay suficientes puntos disponibles
    const sinPuntos = { ...conPuntos, puntosConjuroGastados: 26 };
    expect(operarRecursoRasgo(sinPuntos, { tipo: "recuperarUsosConEspacio", modo: "puntos", idRasgo: id, puntos: 2, cantidadUsos: 1 })).toBeUndefined();

    // Rechazo si la reserva de inspiración ya está completa
    const llena = { ...conPuntos, rasgos: conPuntos.rasgos.map(r => r.id === id ? { ...r, usosRestantes: 4 } : r) };
    expect(operarRecursoRasgo(llena, { tipo: "recuperarUsosConEspacio", modo: "puntos", idRasgo: id, puntos: 2, cantidadUsos: 1 })).toBeUndefined();

    // Reinicio de contador tras descanso corto (Inspiración en nivel 5 es descanso corto)
    const descansado = ejecutarDescansoCorto(r1Segundo!, 0).personajeActualizado;
    expect(inspiracion(descansado).usosRecuperadosConPuntos).toBe(0);
  });

  it("descansos, cambio de Carisma, reconstrucción y guardado conservan correctamente el gasto", () => {
    const p = crearBardo(4);
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    estado().gastarUsoRasgoPersonaje(p.id, inspiracion(p).id, 2);
    expect(inspiracion(actual()).usosRestantes).toBe(2);
    expect(inspiracion(ejecutarDescansoCorto(actual(), 0).personajeActualizado).usosRestantes).toBe(2);
    expect(inspiracion(ejecutarDescansoLargo(actual()).personajeActualizado).usosRestantes).toBe(4);
    estado().modificarCaracteristicaBasePersonaje(p.id, "carisma", 20);
    expect(inspiracion(actual()).usosRestantes).toBe(3);
    const cinco = aplicarBuildClaseAPersonaje(actual(), "Bardo", 5);
    expect(inspiracion(cinco).usosRestantes).toBe(3);
    expect(inspiracion(ejecutarDescansoCorto(cinco, 0).personajeActualizado).usosRestantes).toBe(5);
    const recargado = hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(cinco)))));
    expect(inspiracion(recargado).usosRestantes).toBe(3);
    expect(inspiracion(recargado).recuperarUsosConEspacio).toBe(1);
    expect(inspiracion(crearBardo(1, 6)).usosMaximos).toBe(1);
  });

  it.each([0, 1, 2, 3, 4])("Inspiración superior respeta %i usos restantes y el máximo de Carisma", restantes => {
    const p = crearBardo(18); inspiracion(p).usosRestantes = restantes;
    usarAlmacenDM.setState({ personajes: [p] });
    estado().dispararRasgosIniciativaPersonaje(p.id);
    expect(inspiracion(actual()).usosRestantes).toBe(Math.max(2, restantes));
    const minimo = crearBardo(18, 6); inspiracion(minimo).usosRestantes = 0;
    usarAlmacenDM.setState({ personajes: [minimo] }); estado().dispararRasgosIniciativaPersonaje(minimo.id);
    expect(inspiracion(actual()).usosRestantes).toBe(1);
  });

  it("una dote existente sobrevive y el nivel 9 no concede Pericia por nivel total en multiclase", () => {
    const p = crearBardo(19);
    const don = p.rasgos.find(r => r.nivelRequerido === 19)!;
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    estado().actualizarSeleccionRasgo(p.id, don.id, don.selectores![0].id, ["dote_don_recuerdo_conjuros"]);
    const recompuesto = aplicarBuildClaseAPersonaje(actual(), "Bardo", 19);
    expect(recompuesto.rasgos.find(r => r.id === don.id)?.selectores![0].valorActual).toEqual(["dote_don_recuerdo_conjuros"]);
    estado().actualizarSeleccionRasgo(p.id, don.id, don.selectores![0].id, []);
    expect(actual().rasgos.some(r => r.origen === "dote" && r.ligadoA === don.id)).toBe(false);
    const multi = { ...crearBardo(8), nivel: 10, clases: [{ nombre: "Bardo", nivel: 8, subclase: "" }, { nombre: "Guerrero", nivel: 2, subclase: "" }] };
    const nuevo = normalizarMecanicasRasgos(multi, aplicarCambioClaseNivel(multi, 0, "8"));
    expect(nuevo.rasgos.find(r => r.id === "rasgo_cls_bardo_pericia")?.selectores).toHaveLength(1);
    expect(obtenerRasgosClaseYSubclase("Bardo", 20).some(r => r.nombre === "Contraencantamiento" && r.tipoAccion === "reaccion" && !r.esActivable)).toBe(true);
  });
});
