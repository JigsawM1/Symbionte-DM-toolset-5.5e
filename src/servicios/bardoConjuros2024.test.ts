import { describe, expect, it } from "vitest";
import HECHIZOS from "@/utiles/compendios/all.json";
import { EsquemaHechizoBase, type PersonajeJugador } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { aplicarBuildClaseAPersonaje } from "./gestorClases";
import { calcularMaximosConjurosYTrucos, puedePersonajeLanzarHechizo } from "./calculadorMagia";
import { elegirConjuroClase, reconciliarEleccionesConjuros } from "./rasgos/listasConjurosRasgos";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { prepararLanzamiento, validarLanzamiento } from "./servicioLanzamientoConjuros";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { crearResolutorOrigenConjuros } from "./resolutorOrigenConjuros";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";

const hechizo = (nombre: string) => EsquemaHechizoBase.parse(HECHIZOS.find(h => h.nombre === nombre));
const crear = (nivel: number) => aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "bardo-magia", especie: "",
  caracteristicas: { fuerza: 10, destreza: 14, constitucion: 12, inteligencia: 10, sabiduria: 12, carisma: 18 }
}, "Bardo", nivel);

describe("Magia del Bardo 2024: listas, aptitud, cupos y procedencia", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])("respeta la progresión oficial de preparados y trucos a nivel %i", nivel => {
    const p = crear(nivel);
    const preparados = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
    const max = calcularMaximosConjurosYTrucos(p.clasesLanzadoras, p.nivel);
    expect(max.maxConjuros).toBe(preparados[nivel - 1]);
    expect(max.maxTrucos).toBe(nivel >= 10 ? 4 : nivel >= 4 ? 3 : 2);
    expect(p.clasesLanzadoras[0].habilidadConjuro).toBe("carisma");
  });

  it("Secretos amplía exactamente las tres listas para nivel 1+ a partir de Bardo 10", () => {
    const fuego = hechizo("Bola de fuego");
    const diez = crear(10);
    expect(puedePersonajeLanzarHechizo(crear(9), fuego)).toBe(false);
    expect(puedePersonajeLanzarHechizo(diez, fuego)).toBe(true);
    const trucoAjeno = HECHIZOS.find(h => h.nivel === 0 && h.clases.includes("Clérigo") && !h.clases.includes("Bardo"))!;
    expect(puedePersonajeLanzarHechizo(diez, EsquemaHechizoBase.parse(trucoAjeno))).toBe(false);
    const nueve = HECHIZOS.find(h => h.nivel === 9 && h.clases.includes("Mago") && !h.clases.includes("Bardo"))!;
    expect(puedePersonajeLanzarHechizo(diez, EsquemaHechizoBase.parse(nueve))).toBe(false);
    const ajeno = HECHIZOS.find(h => h.nivel > 0 && h.nivel <= 5 && !h.clases.some(c => ["Bardo", "Clérigo", "Druida", "Mago"].includes(c)))!;
    expect(puedePersonajeLanzarHechizo(diez, EsquemaHechizoBase.parse(ajeno))).toBe(false);
    const apagado = { ...diez, rasgos: diez.rasgos.map(r => r.ampliacionListaConjuros ? { ...r, activo: false } : r) };
    expect(puedePersonajeLanzarHechizo(apagado, fuego)).toBe(false);
  });

  it("el almacén valida cupos y niveles de nuevas elecciones y permite sustituciones libres", () => {
    const p = crear(1);
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    const estado = usarAlmacenDM.getState;
    const actual = () => estado().personajes[0];
    const conjuros = HECHIZOS.filter(h => h.nivel === 1 && h.clases.includes("Bardo")).slice(0, 5);
    for (const h of conjuros) estado().alternarConjuroPreparado(p.id, h.id);
    expect(actual().conjurosPreparadosIds).toHaveLength(4);
    estado().alternarConjuroPreparado(p.id, conjuros[0].id);
    estado().alternarConjuroPreparado(p.id, conjuros[4].id);
    expect(actual().conjurosPreparadosIds).toContain(conjuros[4].id);
    estado().alternarConjuroPreparado(p.id, hechizo("Bola de fuego").id);
    expect(actual().conjurosPreparadosIds).not.toContain(hechizo("Bola de fuego").id);
    const trucos = HECHIZOS.filter(h => h.nivel === 0 && h.clases.includes("Bardo")).slice(0, 3);
    for (const h of trucos) estado().agregarTrucoConocido(p.id, h.id);
    expect(actual().trucosConocidosIds).toHaveLength(2);
  });

  it("un conjuro de Secretos conserva Carisma y límites de Bardo con otra clase lanzadora principal", () => {
    const base = crear(10);
    const p: PersonajeJugador = { ...base, nivel: 20, clase: "Clérigo 10 / Bardo 10",
      clases: [{ nombre: "Clérigo", nivel: 10, subclase: "" }, { nombre: "Bardo", nivel: 10, subclase: "" }],
      clasesLanzadoras: [{ clase: "Clérigo", nivel: 10, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" }, ...base.clasesLanzadoras] };
    const fuego = hechizo("Bola de fuego");
    const elegido = elegirConjuroClase(p, fuego.id, "conjuros")!;
    expect(elegido.eleccionesConjurosClase?.Bardo.conjuros).toEqual([fuego.id]);
    const solicitud = aplicarConfiguracionConjurosRasgos(elegido, { modo: "espacio", hechizo: fuego, nivelLanzamiento: 3 });
    expect(solicitud.claseLanzamiento).toBe("Bardo");
    expect(solicitud.modificadorHabilidad).toBe(4);
    expect(solicitud.cdSalvacionPersonaje).toBe(18);
    const preparado = prepararLanzamiento(solicitud, { personajeActual: elegido, espaciosConjuroMaximos: elegido.espaciosConjuroMaximos });
    expect(preparado.claseLanzamiento).toBe("Bardo");
    expect(preparado.gasto).toEqual({ tipo: "espacio", nivel: 3 });
    expect(validarLanzamiento({ ...solicitud, claseLanzamiento: "Clérigo" }, { personajeActual: elegido }).permitido).toBe(false);
    const bajo = { ...p, clases: [{ nombre: "Clérigo", nivel: 10, subclase: "" }, { nombre: "Bardo", nivel: 9, subclase: "" }] };
    expect(puedePersonajeLanzarHechizo(bajo, fuego)).toBe(false);
    const baseBaja = crear(9);
    const guerrero: PersonajeJugador = { ...baseBaja, nivel: 20, clases: [{ nombre: "Bardo", nivel: 9, subclase: "" }, { nombre: "Guerrero", nivel: 11, subclase: "" }] };
    expect(puedePersonajeLanzarHechizo(guerrero, hechizo("Palabra de poder: sanar"))).toBe(false);
  });

  it("retirar Secretos elimina solo sus aprendizajes registrados y conserva los independientes y antiguos", () => {
    const fuego = hechizo("Bola de fuego");
    const base = crear(10);
    let p = elegirConjuroClase(base, fuego.id, "conjuros")!;
    p = { ...p, conjurosPreparadosIds: [fuego.id], conjurosConocidosIds: [fuego.id] };
    const sinSecretos = { ...p, rasgos: p.rasgos.filter(r => !r.ampliacionListaConjuros) };
    expect(reconciliarEleccionesConjuros(sinSecretos).conjurosPreparadosIds).toEqual([]);
    const protegido = reconciliarEleccionesConjuros({ ...sinSecretos, aprendizajesConjurosIndependientes: { trucos: [], conjuros: [fuego.id] } });
    expect(protegido.conjurosPreparadosIds).toEqual([fuego.id]);
    expect(reconciliarEleccionesConjuros({ ...sinSecretos, eleccionesConjurosClase: undefined }).conjurosPreparadosIds).toEqual([fuego.id]);
    const recargado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(p))));
    expect(recargado.eleccionesConjurosClase?.Bardo.conjuros).toEqual([fuego.id]);
    expect(aplicarBuildClaseAPersonaje(recargado, "Bardo", 9).conjurosPreparadosIds).not.toContain(fuego.id);
  });

  it("Palabras de creación concede solo dos siempre preparados fuera del cupo, con Carisma", () => {
    const p = crear(20);
    const origen = crearResolutorOrigenConjuros(p);
    const sanar = hechizo("Palabra de poder: sanar");
    expect(origen(sanar)).toBe("clase");
    expect(origen(hechizo("Palabra de poder: matar"))).toBe("clase");
    expect(origen(hechizo("Palabra de poder: aturdir"))).toBeNull();
    expect(elegirConjuroClase(p, sanar.id, "conjuros")?.eleccionesConjurosClase).toBeUndefined();
    expect(aplicarConfiguracionConjurosRasgos(p, { modo: "espacio", hechizo: sanar }).modificadorHabilidad).toBe(4);
  });

  it("retirar una preparación de Bardo conserva otra procedencia sin duplicar el conjuro", () => {
    const base = crear(10);
    const compartido = HECHIZOS.find(h => h.nivel === 1 && h.clases.includes("Bardo") && h.clases.includes("Clérigo"))!;
    const p: PersonajeJugador = { ...base, nivel: 11, clases: [{ nombre: "Bardo", nivel: 10, subclase: "" }, { nombre: "Clérigo", nivel: 1, subclase: "" }],
      clasesLanzadoras: [...base.clasesLanzadoras, { clase: "Clérigo", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" }],
      conjurosPreparadosIds: [compartido.id], eleccionesConjurosClase: { Bardo: { trucos: [], conjuros: [compartido.id] }, "Clérigo": { trucos: [], conjuros: [compartido.id] } } };
    usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id });
    usarAlmacenDM.getState().alternarConjuroPreparado(p.id, compartido.id, "Bardo");
    const actual = usarAlmacenDM.getState().personajes[0];
    expect(actual.conjurosPreparadosIds).toEqual([compartido.id]);
    expect(actual.eleccionesConjurosClase?.Bardo.conjuros).toEqual([]);
    expect(actual.eleccionesConjurosClase?.["Clérigo"].conjuros).toEqual([compartido.id]);
  });
});
