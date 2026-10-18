import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonajeJugador } from "@/tipos";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import catalogo from "@/datos/clases/barbaro.json";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { obtenerVelocidadesEfectivas, obtenerSentidosEfectivos } from "./rasgos/evaluadorMovilidadRasgos";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { ejecutarDescansoLargo, ejecutarDescansoCorto } from "./procesadorDescansos";
import { evaluarEfectosRasgosActivos } from "./rasgos/evaluadorExpresionesRasgos";
import { obtenerResumenDefensasRasgos } from "./rasgos/resumenDefensasRasgos";
import { normalizarCondicionesRasgos } from "./rasgos/estadoCondicionesRasgos";
import { emitirTiradaDanoConRasgos } from "./rasgos/emisionTiradaRasgos";
import { emitirSalvacionConRasgos } from "./rasgos/emisionSalvacionRasgos";
import { obtenerBonosSalvacionesRasgos } from "./rasgos/evaluadorSalvacionesRasgos";
import { aplicaEfectoAAtaque } from "./rasgos/evaluadorCombateRasgos";
import { obtenerRasgosRituales } from "./rasgos/conjurosRitualesRasgos";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { validarLanzamiento, prepararLanzamiento } from "./servicioLanzamientoConjuros";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { ataqueMock } from "./barbaroSubclasesFixtures";
import { emitirCuracionConDados } from "./rasgos/tiradaCuracionDados";
import { crearObjetoInventarioDesdeCompendio } from "./calculadorInventario";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";

const subclases = ["Senda del Berserker", "Senda del Corazón Salvaje", "Senda del Árbol del Mundo", "Senda del Fanático"];
const estado = () => usarAlmacenDM.getState();
function crear(subclase: string, nivel = 14) {
  const pj: PersonajeJugador = { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "subclases", especie: "", clase: "Bárbaro", subclase, nivel,
    clases: [{ nombre: "Bárbaro", nivel, subclase }], rasgos: obtenerRasgosClaseYSubclase("Bárbaro", nivel, subclase) };
  const id = estado().crearPersonaje(pj);
  const leer = () => estado().personajes.find(p => p.id === id)!;
  const rasgo = (nombre: string) => leer().rasgos.find(r => r.nombre === nombre)!;
  const activar = (nombre: string, elecciones: Record<string, string[]> = {}, opcionales: string[] = []) => estado().alternarActivoRasgo(id, rasgo(nombre).id, { selectores: elecciones, opcionales });
  return { id, leer, rasgo, activar };
}

describe("Bárbaro: cuatro subclases PHB 2024", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1 }));
  it.each(subclases)("valida adquisición, construcción y persistencia de %s en todos los niveles", subclase => {
    EsquemaDefinicionClaseJSON.parse(catalogo);
    for (let nivel = 1; nivel <= 20; nivel++) {
      const { leer } = crear(subclase, nivel);
      const propios = leer().rasgos.filter(r => r.origen === "subclase");
      expect(propios.every(r => [3, 6, 10, 14].includes(r.nivelRequerido!) && r.nivelRequerido! <= nivel)).toBe(true);
      if (nivel < 3) expect(propios).toHaveLength(0);
      const recargado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(leer()))));
      expect(recargado.rasgos.map(r => r.id)).toEqual(leer().rasgos.map(r => r.id));
      expect(new Set(recargado.rasgos.map(r => r.id)).size).toBe(recargado.rasgos.length);
    }
  });

  it.each([[3, "2d6"], [8, "2d6"], [9, "3d6"], [15, "3d6"], [16, "4d6"], [20, "4d6"]])("Frenesí escala en Bárbaro %s", (nivel, formula) => {
    const { rasgo } = crear(subclases[0], Number(nivel));
    expect(rasgo("Frenesí").formulaDados).toBe(formula);
  });

  it("Frenesí requiere ambos padres y se conserva ante daño ajeno o emisión fallida", async () => {
    const { leer, rasgo, activar } = crear(subclases[0]);
    activar("Frenesí"); expect(rasgo("Frenesí").activo).toBe(false);
    activar("Furia"); activar("Ataque temerario"); activar("Frenesí");
    const apagar = vi.fn();
    await emitirTiradaDanoConRasgos(leer(), ataqueMock("destreza"), async () => true, apagar);
    await emitirTiradaDanoConRasgos(leer(), ataqueMock("fuerza"), async () => false, apagar);
    expect(apagar).not.toHaveBeenCalled();
    await emitirTiradaDanoConRasgos(leer(), ataqueMock("fuerza"), async () => true, apagar);
    expect(apagar).toHaveBeenCalledWith(rasgo("Frenesí").id);
    expect(normalizarCondicionesRasgos(leer(),101).rasgos.find(r=>r.nombre==="Frenesí")?.activo).toBe(false);
    activar("Furia"); expect(rasgo("Frenesí").activo).toBe(false);
  });

  it("Furia ciega retira estados previos y bloquea los nuevos solo durante Furia", () => {
    const { id, leer, activar } = crear(subclases[0], 6);
    estado().aplicarCondicionPersonaje(id, "Hechizado"); estado().aplicarCondicionPersonaje(id, "Asustado");
    activar("Furia"); expect(leer().condicionesActivas).not.toContain("Hechizado"); expect(leer().condicionesActivas).not.toContain("Asustado");
    estado().aplicarCondicionPersonaje(id, "ASUSTADO"); expect(leer().condicionesActivas).not.toContain("ASUSTADO");
    activar("Furia"); estado().aplicarCondicionPersonaje(id, "Asustado"); expect(leer().condicionesActivas).toContain("Asustado");
  });

  it.each([[0, "Presencia intimidante"], [3, "Presencia fervorosa"]])("recarga opcional fuera de Furia: %s", (indice, nombre) => {
    const { id, rasgo } = crear(subclases[Number(indice)]);
    estado().gastarUsoRasgoPersonaje(id, rasgo(String(nombre)).id);
    estado().recargarUsoRasgoConPadre(id, rasgo(String(nombre)).id);
    expect(rasgo(String(nombre)).usosRestantes).toBe(1); expect(rasgo("Furia").usosRestantes).toBe(4);
    estado().recargarUsoRasgoConPadre(id, rasgo(String(nombre)).id); expect(rasgo("Furia").usosRestantes).toBe(4);
  });

  it("elige animales antes del gasto, fija elecciones y retira los aportes de la elección anterior", () => {
    const { id, leer, rasgo, activar } = crear(subclases[1]);
    activar("Furia"); expect(rasgo("Furia").activo).toBe(false); expect(rasgo("Furia").usosRestantes).toBe(5);
    const opciones = { furia_tierras_salvajes_opcion: ["oso"], poder_tierras_salvajes_opcion: ["halcon"] };
    activar("Furia", opciones);
    expect(rasgo("Furia").activo).toBe(true);
    expect(obtenerResumenDefensasRasgos(leer()).resistencias).toContain("Fuego");
    expect(obtenerResumenDefensasRasgos(leer()).resistencias).not.toContain("Fuerza");
    expect(obtenerVelocidadesEfectivas(leer()).volar).toBe(obtenerVelocidadesEfectivas(leer()).caminar);
    estado().actualizarSeleccionRasgo(id, rasgo("Furia").id, "furia_tierras_salvajes_opcion", ["lobo"]);
    expect(rasgo("Furia").selectores?.find(s => s.id === "furia_tierras_salvajes_opcion")?.valorActual).toEqual(["oso"]);
    activar("Furia"); activar("Furia", { ...opciones, furia_tierras_salvajes_opcion: ["lobo"], poder_tierras_salvajes_opcion: ["carnero"] });
    expect(obtenerResumenDefensasRasgos(leer()).resistencias).not.toContain("Fuego");
    expect(obtenerVelocidadesEfectivas(leer()).volar).toBeUndefined();
  });

  it("el Aspecto cambia inicialmente y tras descanso largo; conserva la elección al guardar", () => {
    const { id, leer, rasgo } = crear(subclases[1], 6);
    const elegir = (opcion: string) => estado().actualizarSeleccionRasgo(id, rasgo("Aspecto de las tierras salvajes").id, "aspecto_tierras_salvajes_opcion", [opcion]);
    elegir("buho"); elegir("salmon");
    expect(rasgo("Aspecto de las tierras salvajes").selectores?.[0].valorActual).toEqual(["buho"]);
    expect(obtenerSentidosEfectivos(leer()).visionOscuridad).toBe(60);
    estado().actualizarPersonaje(id, ejecutarDescansoLargo(leer()).personajeActualizado);
    elegir("salmon"); expect(obtenerVelocidadesEfectivas(leer()).nadar).toBe(obtenerVelocidadesEfectivas(leer()).caminar);
    const guardado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(leer()))));
    expect(guardado.rasgos.find(r => r.nombre === "Aspecto de las tierras salvajes")?.selectores?.[0].cambioDisponible).toBe(false);
  });

  it("Vitalidad usa nivel de Bárbaro, respeta PG temporales mayores y no se repite al reconstruir", () => {
    const { id, leer, activar } = crear(subclases[2], 3);
    estado().actualizarPersonaje(id, { nivel: 12, clases: [{ nombre: "Guerrero", nivel: 9, subclase: "" }, { nombre: "Bárbaro", nivel: 3, subclase: subclases[2] }] });
    activar("Furia"); expect(leer().hpTemporal).toBe(3);
    estado().actualizarPersonaje(id, { hpTemporal: 1, rasgos: sincronizarRasgosAutomaticos(leer()) }); expect(leer().hpTemporal).toBe(1);
    activar("Furia"); expect(leer().hpTemporal).toBe(1);
    estado().actualizarPersonaje(id, { hpTemporal: 20 }); activar("Furia"); expect(leer().hpTemporal).toBe(20);
  });

  it.each([[2, "Viaje por el Árbol: viaje lejano"], [3, "Enfoque fanático"]])("las reservas por Furia no se recargan al reconstruir ni descansar: %s", (indice, nombre) => {
    const { id, leer, rasgo, activar } = crear(subclases[Number(indice)]);
    activar("Furia"); estado().gastarUsoRasgoPersonaje(id, rasgo(String(nombre)).id); expect(rasgo(String(nombre)).usosRestantes).toBe(0);
    estado().actualizarPersonaje(id, { rasgos: sincronizarRasgosAutomaticos(leer()) }); expect(rasgo(String(nombre)).usosRestantes).toBe(0);
    expect(ejecutarDescansoCorto(leer(), 0).personajeActualizado.rasgos.find(r => r.nombre === nombre)?.usosRestantes).toBe(0);
    activar("Furia"); activar("Furia"); expect(rasgo(String(nombre)).usosRestantes).toBe(1);
  });

  it.each([3,4,6,8,10,12,14,16,18,20])("Furia divina usa Bárbaro %i y admite Destreza, sin conjuros", nivel => {
    const { leer, rasgo, activar } = crear(subclases[3], nivel);
    activar("Furia"); activar("Furia divina", { furia_divina_tipo_dano: ["necrotico"] });
    const dano = evaluarEfectosRasgosActivos(leer()).find(e => e.tipo === "dano_secundario")!;
    expect(dano.valor).toBe(`1d6+${Math.floor(nivel/2)}`); expect(dano.tipoDano).toBe("Necrótico");
    expect(aplicaEfectoAAtaque(dano.aplicaA, dano.objetivo, {tipo:"arma",caracteristica:"destreza",esDistancia:true,esCuerpoACuerpo:false})).toBe(true);
    expect(aplicaEfectoAAtaque(dano.aplicaA, dano.objetivo, {tipo:"conjuro",caracteristica:"fuerza",esDistancia:false,esCuerpoACuerpo:true})).toBe(false);
    expect(rasgo("Furia divina").autoDesactivarAlTirarDano).toBe(true);
  });

  it.each([[3,4],[5,4],[6,5],[11,5],[12,6],[16,6],[17,7],[20,7]])("reserva d12 de Guerrero en %i", (nivel, cantidad) => {
    const { rasgo } = crear(subclases[3], nivel);
    expect(rasgo("Guerrero de los dioses").usosMaximos).toBe(cantidad);
    expect(rasgo("Guerrero de los dioses").tiradaCuracion?.destino).toBe("propio");
  });

  it("Enfoque consume solo tras emitir y añade el bono de clase sin permanecer encendido", async () => {
    const { id, leer, rasgo, activar } = crear(subclases[3], 9);
    activar("Furia"); activar("Enfoque fanático");
    expect(rasgo("Enfoque fanático").usosRestantes).toBe(1); expect(obtenerBonosSalvacionesRasgos(leer()).fuerza).toBe(3);
    const apagar = (idRasgo: string) => estado().alternarActivoRasgo(id, idRasgo);
    const gastar = (idRasgo: string) => estado().gastarUsoRasgoPersonaje(id, idRasgo);
    await emitirSalvacionConRasgos(leer(), async () => false, apagar, gastar); expect(rasgo("Enfoque fanático").usosRestantes).toBe(1);
    await emitirSalvacionConRasgos(leer(), async () => true, apagar, gastar); expect(rasgo("Enfoque fanático").usosRestantes).toBe(0);
    expect(obtenerBonosSalvacionesRasgos(leer()).fuerza).toBe(0);
  });

  it("la curación variable valida cantidad, conserva dados ante fallo y rechaza emisiones simultáneas", async () => {
    const { leer, rasgo } = crear(subclases[3], 6);
    const curacion = rasgo("Guerrero de los dioses"); const consumir = vi.fn();
    const fallar = vi.fn(async () => false);
    for (const cantidad of [0, -1, 1.5, 6]) expect(await emitirCuracionConDados(leer(), curacion, cantidad, fallar, consumir)).toBe(false);
    expect(fallar).not.toHaveBeenCalled();
    await emitirCuracionConDados(leer(), curacion, 2, fallar, consumir); expect(consumir).not.toHaveBeenCalled();
    let completar: (aceptada: boolean) => void = () => {};
    const emitir = vi.fn(() => new Promise<boolean>(resolver => { completar = resolver; }));
    const primera = emitirCuracionConDados(leer(), curacion, 3, emitir, consumir);
    expect(await emitirCuracionConDados(leer(), curacion, 3, emitir, consumir)).toBe(false);
    completar(true); expect(await primera).toBe(true);
    expect(emitir).toHaveBeenCalledWith("3d12", true); expect(consumir).toHaveBeenCalledTimes(1); expect(consumir).toHaveBeenCalledWith(3);
  });

  it("la forma divina es opcional, dura diez rondas, sobrevive a Furia y termina a 0 PG", () => {
    const { id, leer, rasgo, activar } = crear(subclases[3]);
    activar("Furia de los dioses"); expect(rasgo("Furia de los dioses").activo).toBe(false);
    activar("Furia", {}, [rasgo("Furia de los dioses").id]);
    expect(rasgo("Furia de los dioses").usosRestantes).toBe(0); expect(rasgo("Furia de los dioses").activo).toBe(true);
    expect(normalizarCondicionesRasgos(leer(), 11).rasgos.find(r => r.nombre === "Furia de los dioses")?.activo).toBe(false);
    activar("Furia"); expect(rasgo("Furia de los dioses").activo).toBe(true);
    expect(obtenerResumenDefensasRasgos(leer()).resistencias).toContain("Psíquico");
    activar("Revivificación"); expect(rasgo("Furia").usosRestantes).toBe(3);
    estado().actualizarPersonaje(id, { hpActual: 0 }); expect(rasgo("Furia de los dioses").activo).toBe(false);
  });

  it("Halcón permite escudo, pierde vuelo con armadura y una activación inválida no cambia elecciones", () => {
    const { id, leer, rasgo, activar } = crear(subclases[1]);
    const opciones = {furia_tierras_salvajes_opcion:["oso"],poder_tierras_salvajes_opcion:["halcon"]};
    activar("Furia", {...opciones,poder_tierras_salvajes_opcion:["inventado"]});
    expect(rasgo("Furia").usosRestantes).toBe(5); expect(rasgo("Furia").selectores?.every(s=>!s.valorActual.length)).toBe(true);
    activar("Furia", opciones);
    const equipar = (nombre: string) => {
      const objeto = crearObjetoInventarioDesdeCompendio(OBJETOS_INICIALES.find(o=>o.nombre===nombre)!);
      estado().agregarObjetoInventario(id,objeto);estado().alternarEquipadoObjeto(id,objeto.idInstancia);
    };
    equipar("Escudo"); expect(obtenerVelocidadesEfectivas(leer()).volar).toBe(40);
    equipar("Armadura de Cuero"); expect(obtenerVelocidadesEfectivas(leer()).volar).toBeUndefined();
    expect(rasgo("Furia").activo).toBe(true);
  });

  it("la retirada de subclase elimina su estado con procedencia y conserva efectos independientes", () => {
    const {id, leer, rasgo, activar} = crear(subclases[3]);
    activar("Furia",{},[rasgo("Furia de los dioses").id]);
    const guardado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(leer()))));
    expect(guardado.rasgos.find(r=>r.nombre==="Furia de los dioses")?.ligadoA).toBeUndefined();
    expect(guardado.rasgos.find(r=>r.nombre==="Furia de los dioses")?.usosRestantes).toBe(0);
    estado().actualizarPersonaje(id,{subclase:"",clases:[{nombre:"Bárbaro",nivel:14,subclase:""}],
      efectosActivos:[...leer().efectosActivos,{id:"ajeno",nombre:"Protección independiente"}]});
    estado().actualizarPersonaje(id,{rasgos:sincronizarRasgosAutomaticos(leer())});
    expect(leer().efectosActivos.some(e=>e.nombre.includes("Dioses"))).toBe(false);
    expect(leer().efectosActivos.some(e=>e.id==="ajeno")).toBe(true);
  });

  it("los rituales tienen fuente propia y Sabiduría, no crean espacios ni permiten otros modos", () => {
    const { id, leer, rasgo, activar } = crear(subclases[1], 10);
    expect(obtenerRasgosRituales(leer())).toHaveLength(2);
    expect(leer().clasesLanzadoras).toHaveLength(0);
    const hechizo = HECHIZOS_INICIALES.find(h => h.id === "h_sentidos-de-la-bestia")!;
    const solicitud = aplicarConfiguracionConjurosRasgos(leer(), {hechizo,modo:"ritual",idRasgoOrigen:rasgo("Hablante de los animales").id});
    expect(solicitud.cdSalvacionPersonaje).toBe(8 + 4 + Math.floor((leer().caracteristicas.sabiduria-10)/2));
    expect(validarLanzamiento(solicitud,{personajeActual:leer()}).permitido).toBe(true);
    expect(prepararLanzamiento(solicitud,{}).gasto.tipo).toBe("ninguno");
    expect(validarLanzamiento({...solicitud,modo:"espacio"},{personajeActual:leer()}).permitido).toBe(false);
    activar("Furia", {furia_tierras_salvajes_opcion:["aguila"]});
    expect(validarLanzamiento(solicitud,{personajeActual:leer()}).permitido).toBe(false);
    estado().actualizarPersonaje(id,{conjurosConocidosIds:[hechizo.id],aprendizajesConjurosIndependientes:{conjuros:[hechizo.id],trucos:[]},subclase:"",clases:[{nombre:"Bárbaro",nivel:10,subclase:""}]});
    estado().actualizarPersonaje(id,{rasgos:sincronizarRasgosAutomaticos(leer())});
    expect(obtenerRasgosRituales(leer())).toHaveLength(0); expect(leer().conjurosConocidosIds).toContain(hechizo.id);
  });
});
