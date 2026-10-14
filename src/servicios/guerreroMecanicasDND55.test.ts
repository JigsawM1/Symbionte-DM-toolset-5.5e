import { beforeEach, describe, expect, it } from "vitest";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { obtenerBonosSalvacionesRasgos } from "./rasgos/evaluadorSalvacionesRasgos";
import { resolverRecursosPadre } from "./rasgos/evaluadorRecursosRasgos";
import { crearBorradorRasgo, construirRasgoDesdeBorrador, validarRasgoParaGuardar } from "./rasgos/borradorRasgo";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { evaluarVentajasDeRasgosEnTirada } from "./rasgos/evaluadorSalvacionesRasgos";
import { construirBuildClase } from "./gestorClases";
import { calcularMaximosConjurosYTrucos } from "./calculadorMagia";
import { obtenerBonoCARasgos } from "./rasgos/evaluadorVitalidadRasgos";
import { obtenerResumenDefensasRasgos } from "./rasgos/resumenDefensasRasgos";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { aplicarConfiguracionConjuroGratuito } from "./rasgos/conjurosGratuitosRasgos";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";

const obtener = (nivel: number, nombre: string, subclase?: string) => obtenerRasgosClaseYSubclase("Guerrero", nivel, subclase).find(r => r.nombre === nombre)!;
describe("Guerrero Psiónico", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1 }));
  const crear = () => usarAlmacenDM.getState().crearPersonaje({ ...PERSONAJE_POR_DEFECTO, clase: "Guerrero", subclase: "Guerrero Psiónico", nivel: 18,
    caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, inteligencia: 16 }, clases: [{ nombre: "Guerrero", subclase: "Guerrero Psiónico", nivel: 18 }],
    rasgos: obtenerRasgosClaseYSubclase("Guerrero", 18, "Guerrero Psiónico") });
  it.each([[3, 4, "1d6", 3], [5, 6, "1d8", 3], [9, 8, "1d8", 5], [11, 8, "1d10", 5], [13, 10, "1d10", 5], [17, 12, "1d12", 5]])("escala la reserva y consulta a nivel %i", (nivel, usos, dado, cantidad) => {
    expect(obtener(nivel, "Poder psiónico", "Guerrero Psiónico")).toMatchObject({ usosMaximos: usos, formulaDados: dado, recargaDescansoCorto: 1 });
    const caja = obtener(nivel, "Opciones de poder psiónico", "Guerrero Psiónico").selectores![0];
    expect(caja.modo).toBe("consulta");
    expect(caja.opciones).toHaveLength(cantidad);
    expect(caja.opciones.every(o => !o.categoriaMecanica && !o.efectos)).toBe(true);
  });
  it("los descansos recuperan uno o todos los dados psiónicos", () => {
    const reserva = { ...obtener(17, "Poder psiónico", "Guerrero Psiónico"), usosRestantes: 2 };
    const pj = { ...PERSONAJE_POR_DEFECTO, nivel: 17, rasgos: [reserva] };
    expect(ejecutarDescansoCorto(pj, 0).personajeActualizado.rasgos[0].usosRestantes).toBe(3);
    expect(ejecutarDescansoLargo(pj).personajeActualizado.rasgos[0].usosRestantes).toBe(12);
  });
  it("Mente robusta gasta un dado y retira estados, conservando la resistencia informativa", () => {
    const id = crear();
    usarAlmacenDM.getState().aplicarCondicionPersonaje(id, "Asustado (Frightened)");
    usarAlmacenDM.getState().aplicarCondicionPersonaje(id, "Hechizado (Charmed)");
    usarAlmacenDM.getState().aplicarCondicionPersonaje(id, "Derribado (Prone)");
    const r = obtener(18, "Mente robusta", "Guerrero Psiónico");
    usarAlmacenDM.getState().alternarActivoRasgo(id, r.id);
    const pj = usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    expect(pj.condicionesActivas).toEqual(["Derribado (Prone)"]);
    expect(pj.rasgos.find(r => r.nombre === "Poder psiónico")!.usosRestantes).toBe(11);
    expect(obtenerResumenDefensasRasgos(pj).resistencias).toContain("psiquico");
  });
  it("Bastión aplica +2 una vez, expira en diez asaltos y no gasta dados en su primer uso", () => {
    const id = crear();
    const estado = usarAlmacenDM.getState();
    const r = obtener(18, "Bastión de fuerza", "Guerrero Psiónico");
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    const antes = obtenerBonoCARasgos(leer()).bonoTotal;
    estado.alternarActivoRasgo(id, r.id);
    expect(obtenerBonoCARasgos(leer()).bonoTotal).toBe(antes + 2);
    expect(obtenerBonosSalvacionesRasgos(leer()).destreza).toBe(2);
    expect(leer().rasgos.find(r => r.nombre === "Poder psiónico")!.usosRestantes).toBe(12);
    for (let i = 0; i < 10; i++) usarAlmacenDM.getState().avanzarRonda();
    expect(obtenerBonoCARasgos(leer()).bonoTotal).toBe(antes);
    expect(leer().rasgos.find(a => a.id === r.id)!.activo).toBe(false);
    expect(leer().efectosActivos).toHaveLength(0);
  });
  it("Bastión finaliza por Incapacitado y no se puede reactivar bajo ese estado", () => {
    const id = crear();
    const r = obtener(18, "Bastión de fuerza", "Guerrero Psiónico");
    usarAlmacenDM.getState().alternarActivoRasgo(id, r.id);
    usarAlmacenDM.getState().aplicarCondicionPersonaje(id, "Incapacitado (Incapacitated)");
    expect(usarAlmacenDM.getState().personajes.find(p => p.id === id)!.rasgos.find(a => a.id === r.id)!.activo).toBe(false);
  });
  it("Telequinesis utiliza Inteligencia, no requiere componentes ni concede espacios generales", () => {
    const id = crear();
    const pj = usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    const hechizo = HECHIZOS_INICIALES.find(h => h.nombre.toLocaleLowerCase("es") === "telequinesis")!;
    expect(hechizo).toBeDefined();
    const solicitud = aplicarConfiguracionConjuroGratuito(pj, { hechizo, modo: "gratuitoInnato" });
    expect(solicitud).toMatchObject({ modificadorHabilidad: 3, cdSalvacionPersonaje: 17, hechizo: { componentesSeleccionados: { verbal: false, somatico: false, material: false } } });
    expect(pj.esLanzador).toBe(false);
    expect(pj.espaciosConjuroMaximos).toEqual({});
    const consumo = consumirRecursoConjuro(pj, { tipo: "gratuitoInnato", hechizoId: hechizo.id });
    expect(consumo.permitido).toBe(true);
    if (consumo.permitido) {
      expect(consumo.personaje.rasgos.find(r => r.nombre === "Maestro telequinético")!.usosRestantes).toBe(0);
      expect(consumo.personaje.rasgos.find(r => r.nombre === "Poder psiónico")!.usosRestantes).toBe(12);
      expect(consumirRecursoConjuro(consumo.personaje, { tipo: "gratuitoInnato", hechizoId: hechizo.id }).permitido).toBe(false);
    }
  });
});
describe("Caballero Arcano", () => {
  it.each([[2, 0, 0], [3, 2, 3], [4, 3, 4], [7, 4, 5], [10, 4, 7], [19, 4, 12], [20, 4, 13]])("configura magia y progresión a nivel %i", (nivel, espaciosPrimero, conjuros) => {
    const id = usarAlmacenDM.getState().crearPersonaje({ ...PERSONAJE_POR_DEFECTO, clase: "Guerrero", subclase: "Caballero Arcano", nivel,
      clases: [{ nombre: "Guerrero", subclase: "Caballero Arcano", nivel }], rasgos: [] });
    const pj = usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    expect(pj.esLanzador).toBe(nivel >= 3);
    expect(pj.espaciosConjuroMaximos["1"] ?? 0).toBe(espaciosPrimero);
    if (nivel >= 3) {
      expect(pj.clasesLanzadoras[0]).toMatchObject({ tipoLanzador: "tercio", habilidadConjuro: "inteligencia", listaConjuros: "mago", modeloConjuros: "preparados" });
      expect(calcularMaximosConjurosYTrucos(pj.clasesLanzadoras).maxConjuros).toBe(conjuros);
      expect(calcularMaximosConjurosYTrucos(pj.clasesLanzadoras).maxTrucos).toBe(nivel >= 10 ? 3 : 2);
    }
  });
  it("la build respeta nivel de inicio y Carga arcana amplía Acción súbita", () => {
    expect(construirBuildClase("Guerrero", 2, "Caballero Arcano")!.configuracionMagica).toBeUndefined();
    const accion = obtener(15, "Acción súbita", "Caballero Arcano");
    expect(accion.descripcion).toContain("Carga arcana");
    expect(accion.origen).toBe("clase");
  });
  it("añadir y quitar un rasgo homebrew de magia conserva el lanzador independiente", () => {
    const id = usarAlmacenDM.getState().crearPersonaje({ ...PERSONAJE_POR_DEFECTO,
      clasesLanzadoras: [{ clase: "Mago", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "preparados" }] });
    const b = crearBorradorRasgo();
    b.nombre = "Magia propia";
    b.configuracionMagica = { tipoLanzador: "tercio", habilidadConjuro: "sabiduria", modeloConjuros: "preparados", nivelInicio: 1, listaConjuros: "mago" };
    const r = { ...construirRasgoDesdeBorrador(b), id: "magia_propia" };
    usarAlmacenDM.getState().agregarRasgoPersonaje(id, r);
    expect(usarAlmacenDM.getState().personajes.find(p => p.id === id)!.clasesLanzadoras).toHaveLength(2);
    usarAlmacenDM.getState().eliminarRasgoPersonaje(id, r.id);
    expect(usarAlmacenDM.getState().personajes.find(p => p.id === id)!.clasesLanzadoras).toMatchObject([{ clase: "Mago" }]);
  });
});
describe("Campeón", () => {
  it("otorga ventajas solo a iniciativa y Atletismo", () => {
    const personaje = { ...PERSONAJE_POR_DEFECTO, nivel: 3, rasgos: [obtener(3, "Atleta sobresaliente", "Campeón")] };
    expect(evaluarVentajasDeRasgosEnTirada(personaje, { tipoTirada: "iniciativa" }).tieneVentaja).toBe(true);
    expect(evaluarVentajasDeRasgosEnTirada(personaje, { tipoTirada: "caracteristica", subtipo: "atletismo" }).tieneVentaja).toBe(true);
    expect(evaluarVentajasDeRasgosEnTirada(personaje, { tipoTirada: "caracteristica", subtipo: "acrobacias" }).tieneVentaja).toBe(false);
  });
  it("concede dos estilos independientes, impide duplicados y conserva una dote ajena", () => {
    const base = { ...PERSONAJE_POR_DEFECTO, clase: "Guerrero", subclase: "Campeón", nivel: 7, clases: [{ nombre: "Guerrero", subclase: "Campeón", nivel: 7 }] };
    const rasgos = sincronizarRasgosAutomaticos(base);
    const estilo = rasgos.find(r => r.nombre === "Estilo de combate adicional")!;
    const id = usarAlmacenDM.getState().crearPersonaje({ ...base, rasgos });
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    usarAlmacenDM.getState().actualizarSeleccionRasgo(id, estilo.id, estilo.selectores![0].id, ["dote_estilo_defensa"]);
    expect(leer().rasgos.filter(r => r.origen === "dote" && r.ligadoA === estilo.id)).toHaveLength(0);
    const alternativa = estilo.selectores![0].opciones.find(o => o.id !== "dote_estilo_defensa")!.id;
    usarAlmacenDM.getState().actualizarSeleccionRasgo(id, estilo.id, estilo.selectores![0].id, [alternativa]);
    expect(leer().rasgos.filter(r => r.origen === "dote" && r.id.startsWith("dote_estilo_") && r.ligadoA)).toHaveLength(2);
    usarAlmacenDM.getState().actualizarSeleccionRasgo(id, estilo.id, estilo.selectores![0].id, []);
    expect(leer().rasgos.filter(r => r.origen === "dote" && r.id.startsWith("dote_estilo_") && r.ligadoA)).toHaveLength(1);
  });
});
describe("Maestro del Combate", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1 }));
  it.each([[3, 4, "1d8", 3], [7, 5, "1d8", 5], [10, 5, "1d10", 7], [15, 6, "1d10", 9], [18, 6, "1d12", 9]])("escala reserva, dado y maniobras a nivel %i", (nivel, usos, formula, selecciones) => {
    const padre = obtener(nivel, "Supremacía en combate", "Maestro del Combate");
    expect(padre).toMatchObject({ usosMaximos: usos, formulaDados: formula, recuperacion: "descanso_corto" });
    const sel = obtener(nivel, "Opciones de maniobras", "Maestro del Combate").selectores![0];
    expect(sel).toMatchObject({ maxSelecciones: selecciones, ubicacion: "seccion", tipoSelector: "general" });
    expect(sel.opciones).toHaveLength(20);
    expect(sel.opciones.every(o => o.descripcion && !o.categoriaMecanica && !o.formulaDados)).toBe(true);
  });
  it("restaura un uso gastando un dado y bloquea la recarga de un recurso lleno", () => {
    const rasgos = obtenerRasgosClaseYSubclase("Guerrero", 7, "Maestro del Combate");
    const reserva = rasgos.find(r => r.nombre === "Supremacía en combate")!;
    const objetivo = rasgos.find(r => r.nombre === "Conoce a tu enemigo")!;
    const recarga = rasgos.find(r => r.restaurarUsosAlActivar?.idRasgoObjetivo === objetivo.id)!;
    const id = usarAlmacenDM.getState().crearPersonaje({ ...PERSONAJE_POR_DEFECTO, clase: "Guerrero", nivel: 7, rasgos });
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!.rasgos;
    usarAlmacenDM.getState().alternarActivoRasgo(id, recarga.id);
    expect(leer().find(r => r.id === reserva.id)!.usosRestantes).toBe(5);
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(id, objetivo.id);
    usarAlmacenDM.getState().alternarActivoRasgo(id, recarga.id);
    expect(leer().find(r => r.id === objetivo.id)!.usosRestantes).toBe(1);
    expect(leer().find(r => r.id === reserva.id)!.usosRestantes).toBe(4);
    expect(leer().find(r => r.id === recarga.id)!.activo).toBe(false);
  });
  it("Implacable tira d8 sin gastar Supremacía", () => {
    expect(obtener(18, "Implacable", "Maestro del Combate")).toMatchObject({ formulaDados: "1d8", noGastarAlTirarDados: true, tieneUsosLimitados: false });
  });
});
describe("Guerrero: clase general declarativa", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1 }));
  it.each([[1, 2, 3], [4, 3, 4], [10, 4, 5], [16, 4, 6]])("escala recursos y maestrías al nivel %i", (nivel, usos, maestrias) => {
    expect(obtener(nivel, "Tomar aliento").usosMaximos).toBe(usos);
    expect(obtener(nivel, "Maestría con armas").selectores![0].maxSelecciones).toBe(maestrias);
    expect(obtener(nivel, "Maestría con armas").tieneUsosLimitados).toBe(false);
  });
  it.each([[9, 1], [13, 2], [17, 3]])("consolida Indómito a nivel %i", (nivel, usos) => {
    const rasgos = obtenerRasgosClaseYSubclase("Guerrero", nivel);
    expect(rasgos.filter(r => r.nombre === "Indómito")).toHaveLength(1);
    expect(obtener(nivel, "Indómito").usosMaximos).toBe(usos);
    expect(obtener(nivel, "Indómito").autoDesactivarAlTirarSalvacion).toBe(true);
  });
  it("consolida Acción súbita y sus dos usos, sin acción adicional", () => {
    const rasgos = obtenerRasgosClaseYSubclase("Guerrero", 20);
    expect(rasgos.filter(r => r.nombre === "Acción súbita")).toHaveLength(1);
    expect(obtener(20, "Acción súbita")).toMatchObject({ tipoAccion: "especial", usosMaximos: 2 });
  });
  it("cura por nivel de Guerrero y separa Mente táctica de autocuración en multiclase", () => {
    const pj = { ...PERSONAJE_POR_DEFECTO, nivel: 20, clases: [{ nombre: "Guerrero", subclase: "", nivel: 2 }, { nombre: "Mago", subclase: "", nivel: 18 }], rasgos: obtenerRasgosClaseYSubclase("Guerrero", 2) };
    expect(resolverRecursosPadre(pj, obtener(2, "Tomar aliento")).formulaDadosEfectiva).toBe("1d10 + 2");
    expect(resolverRecursosPadre(pj, obtener(2, "Mente táctica"))).toMatchObject({ formulaDadosEfectiva: "1d10", usosPadre: { restantes: 2 } });
  });
  it("gasta y devuelve únicamente el recurso padre, incluso con nombre personalizado", () => {
    const padre = { ...obtener(2, "Tomar aliento"), nombre: "Reserva propia", id: "reserva" };
    const hijo = { ...obtener(2, "Mente táctica"), nombre: "Prueba propia", id: "prueba", ligadoA: padre.id };
    const id = usarAlmacenDM.getState().crearPersonaje({ ...PERSONAJE_POR_DEFECTO, clase: "Guerrero", nivel: 2, rasgos: [padre, hijo] });
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(id, hijo.id);
    expect(usarAlmacenDM.getState().personajes.find(p => p.id === id)!.rasgos[0].usosRestantes).toBe(1);
    usarAlmacenDM.getState().recuperarUsoRasgoPersonaje(id, hijo.id);
    expect(usarAlmacenDM.getState().personajes.find(p => p.id === id)!.rasgos[0].usosRestantes).toBe(2);
  });
  it("aplica el bono solo cuando está activo y bloquea activaciones agotadas", () => {
    const r = { ...obtener(9, "Indómito"), nombre: "Segunda oportunidad" };
    const id = usarAlmacenDM.getState().crearPersonaje({ ...PERSONAJE_POR_DEFECTO, nivel: 20, clases: [{ nombre: "Guerrero", subclase: "", nivel: 9 }, { nombre: "Mago", subclase: "", nivel: 11 }], rasgos: [r] });
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    expect(obtenerBonosSalvacionesRasgos(leer()).destreza).toBe(0);
    usarAlmacenDM.getState().alternarActivoRasgo(id, r.id);
    expect(obtenerBonosSalvacionesRasgos(leer()).destreza).toBe(9);
    usarAlmacenDM.getState().alternarActivoRasgo(id, r.id);
    usarAlmacenDM.getState().alternarActivoRasgo(id, r.id);
    expect(leer().rasgos[0]).toMatchObject({ activo: false, usosRestantes: 0 });
  });
  it("conserva progresión y recarga al guardar y reabrir un rasgo nuevo desde el builder", () => {
    const b = crearBorradorRasgo();
    Object.assign(b, { nombre: "Recurso homebrew", tieneUsosLimitados: true, recargaDescansoCorto: 1, recuperacion: "descanso_dinamico", escaladoFormulaDados: [{ nivelMinimo: 1, valor: "1d10" }], escaladoUsos: { tipo: "por_nivel", minimo: 1, tabla: [{ nivelMinimo: 4, valor: 3 }] }, autoDesactivarAlTirarSalvacion: true });
    const r = construirRasgoDesdeBorrador(b);
    expect(validarRasgoParaGuardar(r).valido).toBe(true);
    expect(crearBorradorRasgo(r)).toMatchObject({ recargaDescansoCorto: 1, escaladoUsos: b.escaladoUsos, autoDesactivarAlTirarSalvacion: true });
  });
  it("no duplica recursos ni restaura usos gastados al resincronizar", () => {
    const pj = { ...PERSONAJE_POR_DEFECTO, clase: "Guerrero", nivel: 17, clases: [{ nombre: "Guerrero", subclase: "", nivel: 17 }], rasgos: [{ ...obtener(17, "Indómito"), usosRestantes: 1 }] };
    const resultado = sincronizarRasgosAutomaticos(pj);
    expect(resultado.filter(r => r.nombre === "Indómito")).toHaveLength(1);
    expect(resultado.find(r => r.nombre === "Indómito")!.usosRestantes).toBe(1);
  });
});
