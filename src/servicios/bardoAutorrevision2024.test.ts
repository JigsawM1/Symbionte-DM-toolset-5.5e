import { beforeEach, describe, expect, it } from "vitest";
import HECHIZOS from "@/utiles/compendios/all.json";
import { EsquemaHechizoBase, EsquemaPersonajeJugador, type PersonajeJugador } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { prepararCargaPersistida } from "@/almacen/cargaPersistida";
import { aplicarBuildClaseAPersonaje } from "./gestorClases";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { resolverClaseLanzamiento } from "./rasgos/modificadoresConjuroRasgos";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { validarLanzamiento } from "./servicioLanzamientoConjuros";
import { habilidadElegible } from "./rasgos/habilidadesSelectores";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";

const catalogo = HECHIZOS.map(h => EsquemaHechizoBase.parse(h));
const hechizo = (nombre: string) => catalogo.find(h => h.nombre === nombre)!;
const estado = () => usarAlmacenDM.getState();
const actual = () => estado().personajes[0];
const crear = (nivel = 1) => aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "bardo-revision", especie: "",
  caracteristicas: { fuerza: 10, destreza: 14, constitucion: 12, inteligencia: 12, sabiduria: 14, carisma: 18 }
}, "Bardo", nivel);
const poner = (pj: PersonajeJugador) => usarAlmacenDM.setState({ personajes: [pj], idPersonajeActivo: pj.id });
function multiclase(pj: PersonajeJugador, clase = "Mago", nivel = 1): PersonajeJugador {
  return { ...pj, nivel: pj.nivel + nivel, clases: [...pj.clases, { nombre: clase, nivel, subclase: "" }],
    clasesLanzadoras: [...pj.clasesLanzadoras, { clase, nivel, tipoLanzador: "completo", habilidadConjuro: clase === "Mago" ? "inteligencia" : "sabiduria",
      modeloConjuros: clase === "Mago" ? "grimorio" : "preparados" }] };
}
function elegirIniciado() {
  const asi = actual().rasgos.find(r => r.nombre === "Mejora de característica")!;
  estado().actualizarSeleccionRasgo(actual().id, asi.id, asi.selectores![0].id, ["dote_iniciado_magia_clerigo"]);
  const dote = actual().rasgos.find(r => r.nombre === "Iniciado en la Magia (Clérigo)")!;
  const selector = dote.selectores!.find(s => s.id === "selector_conjuro_nv1_iniciado_clerigo")!;
  estado().actualizarSeleccionRasgo(actual().id, dote.id, selector.id, [hechizo("Curar heridas").id]);
  return asi;
}

describe("Regresiones de la autorrevisión del Bardo", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], baseDatosHechizos: catalogo }));

  it("adquiere dos procedencias mediante acciones y conserva el libro al retirar Bardo", () => {
    poner(multiclase(crear()));
    const id = hechizo("Caída de pluma").id;
    estado().alternarConjuroPreparado(actual().id, id, "Bardo");
    estado().agregarConjuroConocido(actual().id, id, "Mago");
    expect(actual().eleccionesConjurosClase?.Mago.conjuros).toEqual([id]);
    const recargado = hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(actual())))));
    const mago = aplicarBuildClaseAPersonaje(recargado, "Mago", 1);
    expect(mago.conjurosConocidosIds).toContain(id);
    expect(mago.eleccionesConjurosClase?.Mago.conjuros).toEqual([id]);
    expect(mago.eleccionesConjurosClase?.Bardo.conjuros).toEqual([]);
  });

  it("prepara y desprepara un libro sin borrar el aprendizaje ni la preparación de otra clase", () => {
    poner(multiclase(crear()));
    const id = hechizo("Caída de pluma").id;
    estado().alternarConjuroPreparado(actual().id, id, "Bardo");
    estado().agregarConjuroConocido(actual().id, id, "Mago");
    estado().alternarConjuroPreparado(actual().id, id, "Mago");
    expect(actual().eleccionesConjurosClase?.Mago.preparados).toEqual([id]);
    const recargado = hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(actual())))));
    expect(recargado.eleccionesConjurosClase?.Mago.preparados).toEqual([id]);
    poner(recargado);
    estado().alternarConjuroPreparado(actual().id, id, "Mago");
    expect(actual().eleccionesConjurosClase?.Mago.conjuros).toEqual([id]);
    expect(actual().eleccionesConjurosClase?.Mago.preparados).toEqual([]);
    expect(actual().conjurosPreparadosIds).toEqual([id]);
    estado().alternarConjuroPreparado(actual().id, id, "Bardo");
    expect(actual().conjurosPreparadosIds).toEqual([]);
    expect(actual().conjurosConocidosIds).toContain(id);
  });

  it.each(["trucos", "conjuros"])("desaprender %s de una clase conserva la otra y permite retirar después la última", tipo => {
    poner(multiclase(crear()));
    const id = catalogo.find(h => h.nivel === (tipo === "trucos" ? 0 : 1) && h.clases?.includes("Bardo") && h.clases.includes("Mago"))!.id;
    const agregar = tipo === "trucos" ? estado().agregarTrucoConocido : estado().agregarConjuroConocido;
    const quitar = tipo === "trucos" ? estado().quitarTrucoConocido : estado().quitarConjuroConocido;
    const lista = () => tipo === "trucos" ? actual().trucosConocidosIds : actual().conjurosConocidosIds;
    agregar(actual().id, id, "Bardo");agregar(actual().id, id, "Mago");
    quitar(actual().id, id, "Mago");
    expect(lista()).toContain(id);
    quitar(actual().id, id, "Bardo");
    expect(lista()).not.toContain(id);
  });

  it("prepara el mismo conjuro para dos clases sin duplicar la lista global", () => {
    poner(multiclase(crear(), "Clérigo"));
    const id = hechizo("Curar heridas").id;
    estado().alternarConjuroPreparado(actual().id, id, "Bardo");
    estado().alternarConjuroPreparado(actual().id, id, "Clérigo");
    expect(actual().eleccionesConjurosClase?.["Clérigo"].conjuros).toEqual([id]);
    expect(actual().conjurosPreparadosIds).toEqual([id]);
    estado().alternarConjuroPreparado(actual().id, id, "Bardo");
    expect(actual().conjurosPreparadosIds).toEqual([id]);
    estado().alternarConjuroPreparado(actual().id, id, "Clérigo");
    expect(actual().conjurosPreparadosIds).toEqual([]);
  });

  it.each([false, true])("retirar la dote retira solo su concesión; aprendizaje de clase previo: %s", independiente => {
    poner(crear(4));
    const id = hechizo("Curar heridas").id;
    if (independiente) estado().alternarConjuroPreparado(actual().id, id, "Bardo");
    const asi = elegirIniciado();
    expect(actual().conjurosSiemprePreparadosIds).toContain(id);
    estado().actualizarSeleccionRasgo(actual().id, asi.id, asi.selectores![0].id, []);
    expect(actual().conjurosSiemprePreparadosIds).not.toContain(id);
    expect(actual().conjurosPreparadosIds.includes(id)).toBe(independiente);
    const recargado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(actual()))));
    expect(recargado.conjurosSiemprePreparadosIds).not.toContain(id);
    expect(recargado.conjurosPreparadosIds.includes(id)).toBe(independiente);
  });

  it("sustituir una dote tampoco deja sus conjuros", () => {
    poner(crear(4));
    const asi = elegirIniciado();
    estado().actualizarSeleccionRasgo(actual().id, asi.id, asi.selectores![0].id, ["dote_alerta"]);
    expect(actual().conjurosSiemprePreparadosIds).toEqual([]);
    expect(actual().conjurosPreparadosIds).toEqual([]);
  });

  it("Secretos no autoriza a lanzar como una clase donante sin nivel ni aprendizaje", () => {
    poner(multiclase(crear(10)));
    const fuego = hechizo("Bola de fuego");
    estado().alternarConjuroPreparado(actual().id, fuego.id, "Bardo");
    const solicitud = aplicarConfiguracionConjurosRasgos(actual(), { modo: "espacio", hechizo: fuego, nivelLanzamiento: 3, claseLanzamiento: "Mago" });
    expect(resolverClaseLanzamiento(actual(), fuego, "Mago")).toBeUndefined();
    expect(validarLanzamiento(solicitud, { personajeActual: actual() }).permitido).toBe(false);
    expect(aplicarConfiguracionConjurosRasgos(actual(), { modo: "espacio", hechizo: fuego }).modificadorHabilidad).toBe(4);
  });

  it("una segunda clase con nivel suficiente requiere adquirir también el conjuro", () => {
    poner(multiclase(crear(10), "Mago", 5));
    const fuego = hechizo("Bola de fuego");
    estado().alternarConjuroPreparado(actual().id, fuego.id, "Bardo");
    expect(resolverClaseLanzamiento(actual(), fuego, "Mago")).toBeUndefined();
    estado().agregarConjuroConocido(actual().id, fuego.id, "Mago");
    expect(resolverClaseLanzamiento(actual(), fuego, "Mago")).toBe("Mago");
    expect(aplicarConfiguracionConjurosRasgos(actual(), { modo: "espacio", hechizo: fuego, claseLanzamiento: "Mago" }).modificadorHabilidad).toBe(1);
  });

  it("un conjuro preparado por Mago no permite superar el cupo de Bardo", () => {
    poner(multiclase(crear()));
    const compartidos = catalogo.filter(h => h.nivel === 1 && h.clases?.includes("Bardo") && h.clases.includes("Mago")).slice(0, 5);
    expect(compartidos).toHaveLength(5);
    for (const h of compartidos.slice(0, 4)) estado().alternarConjuroPreparado(actual().id, h.id, "Bardo");
    estado().agregarConjuroConocido(actual().id, compartidos[4].id, "Mago");
    estado().alternarConjuroPreparado(actual().id, compartidos[4].id, "Mago");
    estado().alternarConjuroPreparado(actual().id, compartidos[4].id, "Bardo");
    expect(actual().eleccionesConjurosClase?.Bardo.conjuros).toHaveLength(4);
    expect(actual().conjurosPreparadosIds).toContain(compartidos[4].id);
  });

  it("las altas como conocidos no eluden el cupo preparado de una clase sin libro", () => {
    poner(crear());
    for (const h of catalogo.filter(h => h.nivel === 1 && h.clases?.includes("Bardo")).slice(0, 5)) estado().agregarConjuroConocido(actual().id, h.id, "Bardo");
    expect(actual().eleccionesConjurosClase?.Bardo.conjuros).toHaveLength(4);
  });

  it("valida el catálogo efectivo y restaura elecciones homebrew con la carga persistida real", () => {
    const custom = { ...hechizo("Caída de pluma"), id: "h_custom_bardo_revision", nombre: "Conjuro de prueba" };
    usarAlmacenDM.setState({ baseDatosHechizos: [...catalogo, custom] });
    poner(crear());
    estado().alternarConjuroPreparado(actual().id, custom.id, "Bardo");
    expect(actual().conjurosPreparadosIds).toContain(custom.id);
    estado().modificarCaracteristicaBasePersonaje(actual().id, "carisma", 16);
    expect(actual().conjurosPreparadosIds).toContain(custom.id);
    const carga = prepararCargaPersistida({ hechizos_homebrew: [custom], personajes: [deshidratarPersonaje(actual())] });
    expect(carga.personajes![0].eleccionesConjurosClase?.Bardo.conjuros).toContain(custom.id);
    expect(carga.personajes![0].conjurosPreparadosIds).toContain(custom.id);
    estado().aplicarBuildClasePersonaje(actual().id, "Bardo", 2);
    expect(actual().conjurosPreparadosIds).toContain(custom.id);
  });

  it("retira un conjuro homebrew de Secretos si desaparece su ampliación", () => {
    const custom = { ...hechizo("Bola de fuego"), id: "h_custom_secretos_revision", nombre: "Secreto de prueba" };
    usarAlmacenDM.setState({ baseDatosHechizos: [...catalogo, custom] });
    poner(crear(10));
    estado().alternarConjuroPreparado(actual().id, custom.id, "Bardo");
    expect(actual().conjurosPreparadosIds).toContain(custom.id);
    estado().actualizarPersonaje(actual().id, { rasgos: actual().rasgos.filter(r => !r.ampliacionListaConjuros) });
    expect(actual().conjurosPreparadosIds).not.toContain(custom.id);
  });

  it.each(["opcion", "padre"])("una rama inhabilitada por %s no bloquea Pericia", motivo => {
    const p = crear(2); p.gradosHabilidades.historia = "competente";
    const pericia = p.rasgos.find(r => r.nombre === "Pericia")!;
    const padre = { ...pericia, id: "padre_revision", activo: motivo !== "padre", selectores: [{ ...pericia.selectores![0], id: "selector_padre_revision",
      valorActual: ["a"], opciones: [{ id: "a", nombre: "A", descripcion: "" }, { id: "b", nombre: "B", descripcion: "" }] }] };
    const hijo = { ...pericia, id: "hijo_revision", ligadoA: padre.id, requiereOpcion: motivo === "opcion" ? "b" : undefined,
      selectores: [{ ...pericia.selectores![0], id: "selector_inhabilitado_revision", valorActual: ["historia"] }] };
    p.rasgos.push(padre, hijo);
    expect(habilidadElegible(pericia.selectores![0], "historia", p)).toBe(true);
    expect(calcularEstadisticasPersonaje(p).gradosHabilidadesEfectivos.historia).toBe("competente");
  });
});
