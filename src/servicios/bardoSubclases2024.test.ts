import { beforeEach, describe, expect, it } from "vitest";
import datos from "@/datos/clases/bardo.json";
import HECHIZOS from "@/utiles/compendios/all.json";
import { EsquemaHechizoBase, EsquemaPersonajeJugador, EsquemaObjetoInventario, type PersonajeJugador } from "@/tipos";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { aplicarBuildClaseAPersonaje } from "./gestorClases";
import { operarRecursoRasgo } from "./rasgos/conversionRecursosRasgos";
import { obtenerCompetenciasExtraRasgos } from "./rasgos/evaluadorSalvacionesRasgos";
import { evaluarAtaqueDesarmadoEspecial } from "./rasgos/evaluadorCombateRasgos";
import { calcularDefensaSinArmaduraRasgos } from "./rasgos/evaluadorVitalidadRasgos";
import { obtenerConjurosOtorgadosPorRasgos, tieneConjuroGratuitoActivo } from "./rasgos/evaluadorConjurosRasgos";
import { opcionesElegiblesConjuros } from "./rasgos/seleccionesRasgos";
import { normalizarCondicionesRasgos } from "./rasgos/estadoCondicionesRasgos";
import { normalizarMecanicasRasgos } from "./rasgos/normalizarMecanicasRasgos";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { prepararLanzamiento, validarLanzamiento } from "./servicioLanzamientoConjuros";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";

const colegios = datos.subclases.map(s => s.nombre);
const catalogo = HECHIZOS.map(h => EsquemaHechizoBase.parse(h));
const hechizo = (nombre: string) => catalogo.find(h => h.nombre === nombre)!;
const crear = (colegio: string, nivel = 14): PersonajeJugador => aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "bardo-subclase", especie: "",
  caracteristicas: { fuerza: 10, destreza: 14, constitucion: 12, inteligencia: 10, sabiduria: 12, carisma: 18 }
}, "Bardo", nivel, colegio);
const rasgo = (p: PersonajeJugador, nombre: string) => p.rasgos.find(r => r.nombre === nombre)!;
const reserva = (p: PersonajeJugador) => rasgo(p, "Inspiración bárdica");
const estado = () => usarAlmacenDM.getState();
const actual = () => estado().personajes[0];
const poner = (p: PersonajeJugador) => usarAlmacenDM.setState({ personajes: [p], idPersonajeActivo: p.id, baseDatosHechizos: catalogo });
const recargar = (p: PersonajeJugador) => hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(p)))), catalogo);

describe("Bardo: recorrido declarativo de las cuatro subclases", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], baseDatosHechizos: catalogo }));
  it.each(colegios.flatMap(c => Array.from({ length: 20 }, (_, i) => [c, i + 1] as const)))("carga %s en nivel %i", (colegio, nivel) => {
    expect(EsquemaDefinicionClaseJSON.parse(datos).subclases).toHaveLength(4);
    const p = crear(colegio, nivel);
    expect(new Set(p.rasgos.map(r => r.id)).size).toBe(p.rasgos.length);
    expect(p.rasgos.filter(r => r.origen === "subclase").every(r => (r.nivelRequerido ?? 1) <= nivel)).toBe(true);
    expect(reserva(p).formulaDados).toBe(nivel >= 15 ? "1d12" : nivel >= 10 ? "1d10" : nivel >= 5 ? "1d8" : "1d6");
    expect(reserva(p).tipoAccion).toBe("accion_adicional");
    expect(p.rasgos.filter(r => r.categoriaMecanica === "extension")).toEqual([]);
  });

  it.each([3, 5, 10, 15])("Danza obtiene su dado por referencia y no gasta al atacar en nivel %i", nivel => {
    const p = crear(colegios[0], nivel);
    expect(evaluarAtaqueDesarmadoEspecial(p).dadoDanoBase).toBe(reserva(p).formulaDados);
    expect(evaluarAtaqueDesarmadoEspecial(p).caracteristicaSugerida).toBe("destreza");
    expect(reserva(p).usosRestantes).toBe(4);
    const defensa = calcularDefensaSinArmaduraRasgos(p, calcularEstadisticasPersonaje(p).modificadores);
    expect(defensa?.bonoExtra).toBe(4);
    const otraDefensa = { ...rasgo(p, "Juego de pies deslumbrante"), id: "defensa_independiente", efectos: [{ tipo: "modificador_ca" as const, objetivo: "defensa_sin_armadura", valor: "sabiduria", permiteEscudo: false }] };
    expect(calcularEstadisticasPersonaje({ ...p, rasgos: [otraDefensa, ...p.rasgos] }).claseArmadura.total).toBe(16);
    expect(rasgo(p, "Juego de pies deslumbrante").efectos?.some(e => e.tipo === "ventaja")).toBe(false);
  });

  it("Danza pierde sus cálculos bajo armadura o escudo; multiclase usa el dado de Bardo", () => {
    const p = crear(colegios[0], 3);
    const multi = { ...p, nivel: 20, clases: [{ nombre: "Bardo", subclase: colegios[0], nivel: 3 }, { nombre: "Guerrero", subclase: "", nivel: 17 }] };
    expect(evaluarAtaqueDesarmadoEspecial(multi).dadoDanoBase).toBe("1d6");
    const equipado = { ...multi, inventario: [EsquemaObjetoInventario.parse({ idInstancia: "escudo", idObjeto: "escudo", nombre: "Escudo", categoria: "escudos", subcategoria: "Escudo", equipado: true, cantidad: 1, pesoLb: 6 })] };
    expect(evaluarAtaqueDesarmadoEspecial(equipado).aplica).toBe(false);
    expect(calcularDefensaSinArmaduraRasgos(equipado, calcularEstadisticasPersonaje(multi).modificadores)).toBeNull();
  });

  it.each([true, false])("Tándem respeta el orden de recuperación antes=%s", recuperarAntes => {
    const p = crear(colegios[0], 18);reserva(p).usosRestantes = 2;
    const op = { tipo: "iniciativaOpcional" as const, idRasgo: rasgo(p, "Juego de pies en tándem").id, recuperarAntes };
    const res = operarRecursoRasgo(p, op)!;
    expect(reserva(res).usosRestantes).toBe(recuperarAntes ? 1 : 2);
    expect(reserva(p).usosRestantes).toBe(2);
    expect(operarRecursoRasgo({ ...p, condicionesActivas: ["Incapacitado"] }, op)).toBeUndefined();
  });

  it("Tándem con cero usos solo está disponible si la recuperación sucede antes", () => {
    const p = crear(colegios[0], 18);reserva(p).usosRestantes = 0;
    const op = { tipo: "iniciativaOpcional" as const, idRasgo: rasgo(p, "Juego de pies en tándem").id };
    expect(operarRecursoRasgo(p, { ...op, recuperarAntes: false })).toBeUndefined();
    expect(reserva(operarRecursoRasgo(p, { ...op, recuperarAntes: true })!).usosRestantes).toBe(1);
  });

  it.each([
    { cfg: { cantidad: 2 }, normal: 3, tandem: 2 },
    { cfg: { cantidad: "maximo" as const }, normal: 4, tandem: 4 },
    { cfg: { hastaCantidad: 3 }, normal: 3, tandem: 3 }
  ])("iniciativa y Tándem comparten restauración $cfg sin aplicar el respaldo", ({ cfg, normal, tandem }) => {
    const p = crear(colegios[0], 18);reserva(p).usosRestantes = 1;
    const superior = rasgo(p, "Inspiración superior");
    superior.restaurarUsosAlActivar = { idRasgoObjetivo: reserva(p).id, ...cfg };
    p.rasgos.push({ ...superior, id: "restauracion_respaldo", nombre: "Restauración de respaldo",
      restaurarUsosAlActivar: { idRasgoObjetivo: reserva(p).id, cantidad: "maximo", siNoDisparado: superior.id } });
    poner(p);estado().dispararRasgosIniciativaPersonaje(p.id);
    expect(reserva(actual()).usosRestantes).toBe(normal);
    const proyectado = operarRecursoRasgo(p, { tipo: "iniciativaOpcional", idRasgo: rasgo(p, "Juego de pies en tándem").id, recuperarAntes: false })!;
    expect(reserva(proyectado).usosRestantes).toBe(tandem);
    expect(reserva(p).usosRestantes).toBe(1);
  });

  it("Glamour concede preparados sin dar lanzamientos gratuitos ni consumir el cupo", () => {
    const p = crear(colegios[1], 3);
    expect(p.conjurosSiemprePreparadosIds.length).toBeGreaterThanOrEqual(2);
    expect(tieneConjuroGratuitoActivo(p, "Hechizar persona")).toBe(false);
    expect(tieneConjuroGratuitoActivo(p, "Imagen múltiple")).toBe(false);
    expect(rasgo(p, "Magia cautivadora").trasLanzarConjuro?.escuelas).toContain("Encantamiento");
    expect(rasgo(p, "Manto de inspiración").efectos).not.toContainEqual(expect.objectContaining({ tipo: "hp_temporal", objetivo: "propio" }));
    expect(rasgo(p, "Manto de inspiración").multiplicadorResultadoManual).toBe(2);
  });

  it("Magia cautivadora recarga solo su reserva gastando una Inspiración", () => {
    poner(crear(colegios[1], 3));
    const r = rasgo(actual(), "Magia cautivadora");
    estado().gastarUsoRasgoPersonaje(actual().id, r.id);
    expect(rasgo(actual(), r.nombre).usosRestantes).toBe(0);
    expect(reserva(actual()).usosRestantes).toBe(4);
    estado().recargarUsoRasgoConPadre(actual().id, r.id);
    expect(rasgo(actual(), r.nombre).usosRestantes).toBe(1);
    expect(reserva(actual()).usosRestantes).toBe(3);
  });

  it("Manto de majestad consume una vez, permite repetir agotado y mantiene la concesión al terminar", () => {
    const p = crear(colegios[1], 6);const r = rasgo(p, "Manto de majestad");const orden = hechizo("Orden imperiosa");
    const solicitud = aplicarConfiguracionConjurosRasgos(p, { modo: "estadoRasgo", hechizo: orden, nivelLanzamiento: 1, idRasgoOrigen: r.id, claseLanzamiento: "Bardo" });
    expect(validarLanzamiento(solicitud, { personajeActual: p })).toEqual({ permitido: true });
    const prep = prepararLanzamiento(solicitud, { personajeActual: p });
    const consumo = consumirRecursoConjuro(p, prep.gasto);
    expect(consumo.permitido).toBe(true);if (!consumo.permitido) return;
    const activo = consumo.personaje;
    expect(rasgo(activo, r.nombre).usosRestantes).toBe(0);
    expect(activo.concentracionActiva?.idRasgoOrigen).toBe(r.id);
    expect(validarLanzamiento(solicitud, { personajeActual: activo }).permitido).toBe(true);
    const repetido = consumirRecursoConjuro(activo, prep.gasto);
    expect(repetido.permitido).toBe(true);
    expect(recargar(activo).concentracionActiva?.idRasgoOrigen).toBe(r.id);
    const terminado = normalizarCondicionesRasgos({ ...activo, concentracionActiva: null });
    expect(rasgo(terminado, r.nombre).activo).toBe(false);
    expect(validarLanzamiento(solicitud, { personajeActual: terminado }).permitido).toBe(false);
    expect(terminado.conjurosSiemprePreparadosIds).toEqual(activo.conjurosSiemprePreparadosIds);
    expect(normalizarCondicionesRasgos(activo, 11).concentracionActiva).toBeNull();
    expect(normalizarCondicionesRasgos({ ...activo, condicionesActivas: [...activo.condicionesActivas, "Incapacitado"] }).concentracionActiva).toBeNull();
  });

  it("Manto de majestad exige espacio de nivel 3+ y admite pacto; no permite activar sin lanzar", () => {
    const p = crear(colegios[1], 6);rasgo(p, "Manto de majestad").usosRestantes = 0;
    const idRasgo = rasgo(p, "Manto de majestad").id;
    expect(operarRecursoRasgo(p, { tipo: "recuperarUsosConEspacio", idRasgo, nivel: 2 })).toBeUndefined();
    expect(rasgo(operarRecursoRasgo(p, { tipo: "recuperarUsosConEspacio", idRasgo, nivel: 3 })!, "Manto de majestad").usosRestantes).toBe(1);
    expect(operarRecursoRasgo({ ...p, espaciosPactoMaximos: 1, espaciosPactoGastados: 0, nivelEspacioPacto: 3 }, { tipo: "recuperarUsosConEspacio", idRasgo, nivel: 3, pacto: true })?.espaciosPactoGastados).toBe(1);
    poner(crear(colegios[1], 6));estado().alternarActivoRasgo(actual().id, idRasgo);
    expect(rasgo(actual(), "Manto de majestad").activo).toBe(false);
  });

  it.each(["corto", "largo"])("el descanso %s finaliza el Manto breve y su concentración", descanso => {
    const p = crear(colegios[1], 6);const r = rasgo(p, "Manto de majestad");
    const gasto = prepararLanzamiento({ modo: "estadoRasgo", hechizo: hechizo("Orden imperiosa"), idRasgoOrigen: r.id, nivelLanzamiento: 1 }, { personajeActual: p }).gasto;
    const res = consumirRecursoConjuro(p, gasto);expect(res.permitido).toBe(true);if (!res.permitido) return;
    const descansado = (descanso === "corto" ? ejecutarDescansoCorto(res.personaje, 0) : ejecutarDescansoLargo(res.personaje)).personajeActualizado;
    expect(descansado.concentracionActiva).toBeNull();expect(rasgo(descansado, r.nombre).activo).toBe(false);
    expect(rasgo(descansado, r.nombre).usosRestantes).toBe(descanso === "corto" ? 0 : 1);
    expect(descansado.conjurosSiemprePreparadosIds).toContain("Orden imperiosa");
  });

  it("Conocimiento ofrece elecciones vacías y competencias derivadas retirables", () => {
    poner(crear(colegios[2], 3));const r = rasgo(actual(), "Competencias adicionales");
    expect(r.selectores![0].valorActual).toEqual([]);
    estado().actualizarSeleccionRasgo(actual().id, r.id, r.selectores![0].id, ["historia", "arcanos", "sigilo"]);
    expect(obtenerCompetenciasExtraRasgos(actual()).habilidades).toContain("historia");
    expect(actual().gradosHabilidades.historia).toBe("ninguna");
    estado().actualizarSeleccionRasgo(actual().id, r.id, r.selectores![0].id, []);
    expect(obtenerCompetenciasExtraRasgos(actual()).habilidades).not.toContain("historia");
  });

  it("Descubrimientos admite trucos y conjuros de donantes, respeta Bardo en multiclase y conserva procedencia", () => {
    const p = crear(colegios[2], 6);
    poner({ ...p, nivel: 20, caracteristicas: { ...p.caracteristicas, inteligencia: 20 },
      clasesLanzadoras: [...p.clasesLanzadoras, { clase: "Mago", nivel: 14, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }],
      espaciosConjuroMaximos: { ...p.espaciosConjuroMaximos, "7": 1 },
      clases: [{ nombre: "Bardo", subclase: colegios[2], nivel: 6 }, { nombre: "Mago", subclase: "", nivel: 14 }] });
    const r = rasgo(actual(), "Descubrimientos mágicos");const s = r.selectores![0];
    const elegibles = opcionesElegiblesConjuros(s, actual());
    expect(elegibles.some(o => o.id === hechizo("Bola de fuego").id)).toBe(true);
    expect(elegibles.some(o => o.datosConjuro?.nivel === 0)).toBe(true);
    expect(elegibles.some(o => (o.datosConjuro?.nivel ?? 0) > 3)).toBe(false);
    const ids = [hechizo("Bola de fuego").id, elegibles.find(o => o.datosConjuro?.nivel === 0)!.id];
    estado().actualizarSeleccionRasgo(actual().id, r.id, s.id, ids);
    expect(obtenerConjurosOtorgadosPorRasgos(actual())).toContain(ids[0]);
    expect(aplicarConfiguracionConjurosRasgos(actual(), { modo: "espacio", hechizo: hechizo("Bola de fuego") }).modificadorHabilidad).toBe(4);
    expect(recargar(actual()).rasgos.find(x => x.id === r.id)?.selectores![0].valorActual).toEqual(ids);
    estado().actualizarSeleccionRasgo(actual().id, r.id, s.id, [ids[0], ids[0]]);
    expect(rasgo(actual(), r.nombre).selectores![0].valorActual).toEqual(ids);
    expect(tieneConjuroGratuitoActivo(actual(), "Bola de fuego")).toBe(false);
  });

  it.each([true, false])("Habilidad inigualable confirma exitoso=%s una sola vez y conserva el resultado", exitoso => {
    let p = crear(colegios[2], 14);const r = rasgo(p, "Habilidad inigualable");
    p = operarRecursoRasgo(p, { tipo: "reservarIntento", idRasgo: r.id, id: "intento", formula: "1d10" })!;
    expect(reserva(p).usosRestantes).toBe(3);
    p = operarRecursoRasgo(p, { tipo: "anotarIntento", id: "intento", resultado: 7 })!;
    p = recargar(aplicarBuildClaseAPersonaje(p, "Bardo", 14, colegios[2]));
    expect(p.intentoRasgoPendiente?.resultado).toBe(7);
    const resuelto = operarRecursoRasgo(p, { tipo: "resolverIntento", id: "intento", exitoso })!;
    expect(reserva(resuelto).usosRestantes).toBe(exitoso ? 3 : 4);
    expect(operarRecursoRasgo(resuelto, { tipo: "resolverIntento", id: "intento", exitoso })).toBeUndefined();
  });

  it("retirar la capacidad o descansar libera una reserva pendiente sin recargar gasto previo", () => {
    let p = crear(colegios[2], 14);reserva(p).usosRestantes = 2;
    p = operarRecursoRasgo(p, { tipo: "reservarIntento", id: "pendiente", idRasgo: rasgo(p, "Habilidad inigualable").id, formula: "1d10" })!;
    expect(reserva(aplicarBuildClaseAPersonaje(p, "Bardo", 13, colegios[2])).usosRestantes).toBe(2);
    expect(ejecutarDescansoCorto(p, 0).personajeActualizado.intentoRasgoPendiente).toBeUndefined();
    expect(ejecutarDescansoLargo(p).personajeActualizado.intentoRasgoPendiente).toBeUndefined();
  });

  it("Valor conserva Inspiración y retira competencias de equipo sin fijarlas en campos manuales", () => {
    const p = crear(colegios[3], 14);
    expect(obtenerCompetenciasExtraRasgos(p).armadurasGrupos).toContain("escudos");
    expect(p.competenciasArmadurasGrupos).not.toContain("escudos");
    const cambiado = aplicarBuildClaseAPersonaje(p, "Bardo", 14, colegios[0]);
    expect(obtenerCompetenciasExtraRasgos(cambiado).armadurasGrupos).not.toContain("escudos");
    expect(reserva(p).tipoAccion).toBe("accion_adicional");
    expect(reserva(p).descripcion.match(/Inspiración en combate \(Nv\. 3\)/g)).toHaveLength(1);
    expect(reserva(normalizarMecanicasRasgos(p, p)).usosRestantes).toBe(4);
  });

  it("Descubrimientos valida el catálogo efectivo, conserva homebrew al guardar y retira solo su aportación", () => {
    const propio = EsquemaHechizoBase.parse({ ...hechizo("Bola de fuego"), id: "homebrew_descubrimiento", nombre: "Descubrimiento local", clases: ["Mago"] });
    const ajeno = EsquemaHechizoBase.parse({ ...propio, id: "homebrew_ajeno", clases: ["Bardo"] });
    const alto = EsquemaHechizoBase.parse({ ...propio, id: "homebrew_alto", nivel: 4 });
    const efectivo = [...catalogo, propio, ajeno, alto];
    poner(crear(colegios[2], 6));usarAlmacenDM.setState({ baseDatosHechizos: efectivo });
    const r = rasgo(actual(), "Descubrimientos mágicos");const s = r.selectores![0];
    estado().actualizarSeleccionRasgo(actual().id, r.id, s.id, [ajeno.id]);
    expect(rasgo(actual(), r.nombre).selectores![0].valorActual).toEqual([]);
    estado().actualizarSeleccionRasgo(actual().id, r.id, s.id, [alto.id]);
    expect(rasgo(actual(), r.nombre).selectores![0].valorActual).toEqual([]);
    estado().actualizarSeleccionRasgo(actual().id, r.id, s.id, [propio.id]);
    expect(obtenerConjurosOtorgadosPorRasgos(actual())).toContain(propio.id);
    const cargado = hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(actual())))), efectivo);
    expect(obtenerConjurosOtorgadosPorRasgos(cargado)).toContain(propio.id);
    expect(obtenerConjurosOtorgadosPorRasgos(aplicarBuildClaseAPersonaje(cargado, "Bardo", 6, colegios[2]))).toContain(propio.id);
    const independiente = { ...cargado, conjurosConocidosIds: [propio.id], aprendizajesConjurosIndependientes: { conjuros: [propio.id], trucos: [] } };
    const cambiado = aplicarBuildClaseAPersonaje(independiente, "Bardo", 6, colegios[0]);
    expect(obtenerConjurosOtorgadosPorRasgos(cambiado)).not.toContain(propio.id);
    expect(cambiado.conjurosConocidosIds).toContain(propio.id);
  });

  it("una reserva pendiente no permite repetir dado, confirmar sin resultado ni usar recursos agotados", () => {
    const p = crear(colegios[2], 14);const idRasgo = rasgo(p, "Habilidad inigualable").id;
    const op = { tipo: "reservarIntento" as const, id: "resolucion", idRasgo, formula: "1d10" };
    const reservado = operarRecursoRasgo(p, op)!;
    expect(operarRecursoRasgo(reservado, op)).toBeUndefined();
    expect(operarRecursoRasgo(reservado, { tipo: "resolverIntento", id: op.id, exitoso: true })).toBeUndefined();
    const anotado = operarRecursoRasgo(reservado, { tipo: "anotarIntento", id: op.id, resultado: 8 })!;
    expect(operarRecursoRasgo(anotado, { tipo: "anotarIntento", id: op.id, resultado: 9 })).toBeUndefined();
    expect(reserva(operarRecursoRasgo(reservado, { tipo: "cancelarIntento", id: op.id })!).usosRestantes).toBe(4);
    reserva(p).usosRestantes = 0;
    expect(operarRecursoRasgo(p, op)).toBeUndefined();
  });

  it("retirar Manto de majestad finaliza su concentración y cambiar de concentración mantiene Orden imperiosa", () => {
    const p = crear(colegios[1], 6);const r = rasgo(p, "Manto de majestad");
    const gasto = prepararLanzamiento({ modo: "estadoRasgo", hechizo: hechizo("Orden imperiosa"), idRasgoOrigen: r.id, nivelLanzamiento: 1 }, { personajeActual: p }).gasto;
    const res = consumirRecursoConjuro(p, gasto);expect(res.permitido).toBe(true);if (!res.permitido) return;
    const cambiado = aplicarBuildClaseAPersonaje(res.personaje, "Bardo", 6, colegios[0]);
    expect(cambiado.concentracionActiva).toBeNull();
    expect(cambiado.conjurosSiemprePreparadosIds).not.toContain("Orden imperiosa");
    expect(cambiado.efectosActivos.some(e => e.idRasgoOrigen === r.id)).toBe(false);
    const sustituido = normalizarCondicionesRasgos({ ...res.personaje, concentracionActiva: { hechizoId: "otro", nombreHechizo: "Otro conjuro" } });
    expect(rasgo(sustituido, r.nombre).activo).toBe(false);
    expect(sustituido.concentracionActiva?.hechizoId).toBe("otro");
    expect(sustituido.conjurosSiemprePreparadosIds).toContain("Orden imperiosa");
  });

  it("cambiar de colegio conserva un conjuro concedido que también se aprendió con la clase", () => {
    const p = crear(colegios[1], 6);const orden = hechizo("Orden imperiosa");
    const compartido = { ...p, eleccionesConjurosClase: { Bardo: { conjuros: [orden.id], trucos: [] } } };
    const cambiado = aplicarBuildClaseAPersonaje(compartido, "Bardo", 6, colegios[0]);
    expect(cambiado.conjurosSiemprePreparadosIds).not.toContain("Orden imperiosa");
    expect(cambiado.conjurosPreparadosIds).toContain("Orden imperiosa");
    expect(cambiado.conjurosConocidosIds).toContain("Orden imperiosa");
    expect(cambiado.eleccionesConjurosClase?.Bardo.conjuros).toEqual([orden.id]);
  });

  it("Majestad inquebrantable recupera en ambos descansos y finaliza por Incapacitado o duración", () => {
    const p = crear(colegios[1], 14);const r = rasgo(p, "Majestad inquebrantable");
    r.activo = true;r.usosRestantes = 0;
    p.condicionesActivas = [r.condicionAlActivar!];
    p.efectosActivos = [{ id: "majestad", nombre: r.condicionAlActivar!, idRasgoOrigen: r.id, expiraRonda: 11 }];
    expect(rasgo(normalizarCondicionesRasgos(p, 11), r.nombre).activo).toBe(false);
    expect(rasgo(normalizarCondicionesRasgos({ ...p, condicionesActivas: [...p.condicionesActivas, "Incapacitado"] }), r.nombre).activo).toBe(false);
    expect(rasgo(ejecutarDescansoCorto(p, 0).personajeActualizado, r.nombre).usosRestantes).toBe(1);
    expect(rasgo(ejecutarDescansoLargo(p).personajeActualizado, r.nombre).usosRestantes).toBe(1);
  });
});
