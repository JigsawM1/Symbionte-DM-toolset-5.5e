import { beforeEach, describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import { EsquemaObjetoInventario, EsquemaRasgoPersonaje } from "@/tipos";
import type { PersonajeJugador } from "@/tipos";
import catalogo from "@/datos/clases/barbaro.json";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { normalizarCondicionesRasgos } from "./rasgos/estadoCondicionesRasgos";
import { obtenerBloqueoActivacionRasgo } from "./rasgos/bloqueoActivacionRasgo";
import { evaluarEfectosRasgosActivos } from "./rasgos/evaluadorExpresionesRasgos";
import { evaluarVentajasDeRasgosEnTirada, obtenerCompetenciasExtraRasgos } from "./evaluadorEfectosRasgos";
import { obtenerResumenDefensasRasgos } from "./rasgos/resumenDefensasRasgos";
import { resolverTiradaHabilidadRasgos } from "./rasgos/tiradaHabilidadRasgos";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
import { crearObjetoInventarioDesdeCompendio } from "./calculadorInventario";
import { tieneArmaduraEquipada } from "./rasgos/utilidadesRasgos";

function personaje(nivel = 9): PersonajeJugador {
  return { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "prueba-barbaro", especie: "", clase: "Bárbaro", nivel,
    clases: [{ nombre: "Bárbaro", subclase: "", nivel }], rasgos: obtenerRasgosClaseYSubclase("Bárbaro", nivel),
    caracteristicas: { fuerza: 18, destreza: 14, constitucion: 16, inteligencia: 10, sabiduria: 12, carisma: 10 } };
}
const rasgo = (pj: PersonajeJugador, nombre: string) => pj.rasgos.find(r => r.nombre === nombre)!;
const furia = (pj: PersonajeJugador) => rasgo(pj, "Furia");

describe("Bárbaro base: recorrido declarativo PHB 2024", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1 }));

  it.each(Array.from({ length: 20 }, (_, i) => i + 1))("valida la carga y las progresiones canónicas en nivel %i", nivel => {
    const validado = EsquemaDefinicionClaseJSON.parse(catalogo);
    expect(validado.rasgos[0].desactivarConArmaduraPesada).toBe(true);
    const pj = personaje(nivel);
    for (const r of pj.rasgos) expect(EsquemaRasgoPersonaje.safeParse(r).success).toBe(true);
    expect(furia(pj).usosMaximos).toBe(nivel >= 17 ? 6 : nivel >= 12 ? 5 : nivel >= 6 ? 4 : nivel >= 3 ? 3 : 2);
    expect(furia(pj).efectos?.find(e => e.tipo === "bono_dano_fuerza")?.valor).toBe(nivel >= 16 ? 4 : nivel >= 9 ? 3 : 2);
    expect(rasgo(pj, "Maestría con armas").selectores?.[0].maxSelecciones).toBe(nivel >= 10 ? 4 : nivel >= 4 ? 3 : 2);
    expect(pj.rasgos.some(r => r.nombre === "Conocimiento primigenio")).toBe(nivel >= 3);
    expect(pj.rasgos.some(r => r.nombre === "Golpe brutal")).toBe(nivel >= 9);
    expect(pj.rasgos.some(r => r.nombre === "Poderío indómito")).toBe(nivel >= 18);
    expect(pj.rasgos.some(r => /Rasgo de subclase/.test(r.nombre))).toBe(false);
    if (nivel >= 7) expect(furia(pj).tipoAccion).toBe("accion_adicional");
    if (nivel >= 9) {
      const gb = rasgo(pj, "Golpe brutal");
      expect(gb.formulaDados).toBe(nivel >= 17 ? "2d10" : "1d10");
      expect(gb.selectores?.[0].opciones).toHaveLength(nivel >= 13 ? 4 : 2);
      expect(gb.selectores?.[0].maxSelecciones).toBe(nivel >= 17 ? 2 : 1);
    }
  });

  it("no preselecciona maestrías, golpes ni dotes en una ficha nueva", () => {
    const pj = personaje(20);
    pj.rasgos = sincronizarRasgosAutomaticos(pj);
    for (const r of pj.rasgos.filter(r => r.origen === "clase")) for (const s of r.selectores ?? []) expect(s.valorActual).toEqual([]);
    expect(pj.rasgos.filter(r => r.origen === "dote")).toHaveLength(0);
  });

  it.each(["Armadura de Placas", "Cota de Mallas", "Cota de Anillas", "Armadura de Bandas"])("bloquea Furia sin gastar y la finaliza al equipar %s del catálogo", nombre => {
    const base = OBJETOS_INICIALES.find(o => o.nombre === nombre)!;
    expect(base).toBeDefined();
    expect(base.subcategoria).toBe("Pesada");
    const pesada = crearObjetoInventarioDesdeCompendio(base);
    const pj = personaje();
    const id = usarAlmacenDM.getState().crearPersonaje(pj);
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    const estado = usarAlmacenDM.getState();
    estado.agregarObjetoInventario(id, pesada);
    estado.alternarEquipadoObjeto(id, pesada.idInstancia);
    expect(obtenerBloqueoActivacionRasgo(leer(), furia(leer())).bloqueado).toBe(true);
    estado.alternarActivoRasgo(id, furia(leer()).id);
    expect(furia(leer()).activo).toBe(false);
    expect(furia(leer()).usosRestantes).toBe(4);
    estado.alternarEquipadoObjeto(id, pesada.idInstancia);
    estado.alternarActivoRasgo(id, furia(leer()).id);
    expect(furia(leer()).usosRestantes).toBe(3);
    expect(obtenerResumenDefensasRasgos(leer()).resistencias).toEqual(["Contundente", "Cortante", "Perforante"]);
    estado.alternarEquipadoObjeto(id, pesada.idInstancia);
    expect(furia(leer()).activo).toBe(false);
    expect(furia(leer()).usosRestantes).toBe(3);
    expect(leer().efectosActivos.some(e => e.nombre === "Furia")).toBe(false);
    expect(leer().condicionesActivas).not.toContain("Furia");
    expect(evaluarEfectosRasgosActivos(leer()).some(e => e.tipo === "resistencia_dano")).toBe(false);
  });

  it.each([
    ["Protección del centinela", "Armadura Pesada", undefined, "Pesada"],
    ["Protección del centinela", "", "Sin Bono", "Pesada"],
    ["Semiplacas del centinela", "Mediana", "Máximo 2", "Mediana"],
    ["Protección del explorador", "Ligera", "Completo", "Ligera"]
  ])("respeta la clasificación del inventario para %s (%s, %s)", (nombre, subcategoria, bonoDestreza, tipo) => {
    const objeto = EsquemaObjetoInventario.parse({ idInstancia: "proteccion", idObjeto: "proteccion", nombre, subcategoria, bonoDestreza, categoria: "armaduras" });
    const id = usarAlmacenDM.getState().crearPersonaje(personaje(15));
    const estado = usarAlmacenDM.getState();
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    estado.agregarObjetoInventario(id, objeto);
    estado.alternarActivoRasgo(id, furia(leer()).id);
    expect(furia(leer()).activo).toBe(true);
    estado.alternarEquipadoObjeto(id, objeto.idInstancia);
    expect(tieneArmaduraEquipada(leer()).tipo).toBe(tipo);
    expect(furia(leer()).activo).toBe(tipo !== "Pesada");
    if (tipo === "Pesada") {
      estado.alternarActivoRasgo(id, furia(leer()).id);
      expect(furia(leer()).activo).toBe(false);
    }
    expect(furia(leer()).usosRestantes).toBe(4);
  });

  it.each(["Incapacitado", "Aturdido", "Paralizado", "Petrificado", "Inconsciente"])("apaga Furia antes de nivel 15 por %s", condicion => {
    const pj = personaje(14); furia(pj).activo = true; pj.condicionesActivas = [condicion];
    expect(furia(normalizarCondicionesRasgos(pj)).activo).toBe(false);
    expect(evaluarVentajasDeRasgosEnTirada(pj, { tipo: "salvacion", subtipo: "destreza" }).tieneVentaja).toBe(false);
  });

  it("la modificación pasiva de nivel 15 funciona sin armar la recuperación", () => {
    const pj = personaje(15); furia(pj).activo = true;
    expect(rasgo(pj, "Furia persistente").activo).toBe(false);
    pj.condicionesActivas = ["Incapacitado"];
    expect(furia(normalizarCondicionesRasgos(pj)).activo).toBe(true);
    pj.condicionesActivas = ["Inconsciente"];
    expect(furia(normalizarCondicionesRasgos(pj)).activo).toBe(false);
  });

  it("respeta la caducidad de 100 rondas y la retirada del efecto", () => {
    const id = usarAlmacenDM.getState().crearPersonaje(personaje());
    const estado = usarAlmacenDM.getState();
    estado.alternarActivoRasgo(id, "rasgo_cls_barbaro_furia");
    const pj = usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    expect(pj.efectosActivos.find(e => e.nombre === "Furia")?.expiraRonda).toBe(101);
    expect(furia(normalizarCondicionesRasgos(pj, 100)).activo).toBe(true);
    expect(furia(normalizarCondicionesRasgos(pj, 101)).activo).toBe(false);
    estado.quitarCondicionPersonaje(id, "Furia");
    expect(furia(usarAlmacenDM.getState().personajes.find(p => p.id === id)!).activo).toBe(false);
  });

  it("agota y recupera Furia parcialmente en descanso corto y totalmente en largo", () => {
    let pj = personaje(9); furia(pj).usosRestantes = 0;
    expect(obtenerBloqueoActivacionRasgo(pj, furia(pj)).bloqueado).toBe(true);
    pj = ejecutarDescansoCorto(pj, 0).personajeActualizado;
    expect(furia(pj).usosRestantes).toBe(1);
    pj = ejecutarDescansoLargo(pj).personajeActualizado;
    expect(furia(pj).usosRestantes).toBe(4);
  });

  it("la iniciativa recupera solo con consentimiento y conserva el uso si Furia está completa", () => {
    const pj = personaje(15); furia(pj).usosRestantes = 2;
    const id = usarAlmacenDM.getState().crearPersonaje(pj);
    const estado = usarAlmacenDM.getState();
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    estado.dispararRasgosIniciativaPersonaje(id);
    expect(furia(leer()).usosRestantes).toBe(2);
    estado.alternarActivoRasgo(id, rasgo(leer(), "Furia persistente").id);
    estado.establecerUsosRestantesRasgoPersonaje(id, furia(leer()).id, 5);
    estado.dispararRasgosIniciativaPersonaje(id);
    expect(rasgo(leer(), "Furia persistente").usosRestantes).toBe(1);
    estado.establecerUsosRestantesRasgoPersonaje(id, furia(leer()).id, 2);
    estado.dispararRasgosIniciativaPersonaje(id);
    expect(furia(leer()).usosRestantes).toBe(5);
    expect(rasgo(leer(), "Furia persistente").usosRestantes).toBe(0);
    expect(rasgo(leer(), "Furia persistente").activo).toBe(false);
  });

  it("conserva elecciones, estado y gasto al reconstruir y guardar", () => {
    let pj = personaje(17); furia(pj).usosRestantes = 2; furia(pj).activo = true;
    rasgo(pj, "Maestría con armas").selectores![0].valorActual = ["push", "cleave"];
    rasgo(pj, "Golpe brutal").selectores![0].valorActual = ["golpe_desgarrador", "golpe_contundente"];
    pj = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(pj))));
    pj.rasgos = sincronizarRasgosAutomaticos(pj);
    expect(furia(pj).usosRestantes).toBe(2);
    expect(furia(pj).activo).toBe(true);
    expect(rasgo(pj, "Maestría con armas").selectores![0].valorActual).toEqual(["push", "cleave"]);
    expect(new Set(furia(pj).efectos?.map(e => JSON.stringify(e))).size).toBe(furia(pj).efectos?.length);
    pj.nivel = 9; pj.clases[0].nivel = 9; pj.rasgos = sincronizarRasgosAutomaticos(pj);
    expect(furia(pj).usosRestantes).toBe(0);
    expect(rasgo(pj, "Golpe brutal").selectores![0].valorActual).toEqual(["golpe_contundente"]);
    expect(rasgo(pj, "Golpe brutal").formulaDados).toBe("1d10");
  });

  it("usa el nivel de Bárbaro en multiclase y el nivel total para competencia", () => {
    const pj = personaje(3); pj.nivel = 20; pj.clases.push({ nombre: "Guerrero", subclase: "", nivel: 17 });
    pj.rasgos = sincronizarRasgosAutomaticos(pj);
    furia(pj).activo = true;
    expect(furia(pj).usosMaximos).toBe(3);
    expect(furia(pj).efectos?.find(e => e.tipo === "bono_dano_fuerza")?.valor).toBe(2);
    expect(pj.rasgos.some(r => r.nombre === "Furia persistente")).toBe(false);
    expect(calcularEstadisticasPersonaje(pj).bonoCompetencia).toBe(6);
  });

  it("retira elecciones futuras al cargar una ficha deshidratada con nivel reducido", () => {
    const pj = personaje(17);
    rasgo(pj, "Golpe brutal").selectores![0].valorActual = ["golpe_desgarrador", "golpe_contundente"];
    const guardado = deshidratarPersonaje(pj); guardado.nivel = 9; guardado.clases[0].nivel = 9;
    const recargado = hidratarPersonaje(guardado);
    expect(rasgo(recargado, "Golpe brutal").selectores![0].valorActual).toEqual(["golpe_contundente"]);
  });

  it("aplica y retira la habilidad adicional sin borrar competencias independientes", () => {
    const pj = personaje(3); pj.gradosHabilidades.atletismo = "pericia";
    const id = usarAlmacenDM.getState().crearPersonaje(pj);
    const estado = usarAlmacenDM.getState(); const cp = rasgo(pj, "Conocimiento primigenio");
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    estado.actualizarSeleccionRasgo(id, cp.id, cp.selectores![0].id, ["percepcion"]);
    expect(obtenerCompetenciasExtraRasgos(leer()).habilidades).toContain("percepcion");
    estado.actualizarSeleccionRasgo(id, cp.id, cp.selectores![0].id, ["no-existe"]);
    expect(obtenerCompetenciasExtraRasgos(leer()).habilidades).toContain("percepcion");
    estado.actualizarSeleccionRasgo(id, cp.id, cp.selectores![0].id, []);
    expect(obtenerCompetenciasExtraRasgos(leer()).habilidades).not.toContain("percepcion");
    expect(leer().gradosHabilidades.atletismo).toBe("pericia");
  });

  it("elige el mayor bono, conserva pericia y permite preferir Fuerza por su ventaja", () => {
    const pj = personaje(3); furia(pj).activo = true; pj.caracteristicas.destreza = 20; pj.gradosHabilidades.acrobacias = "pericia";
    const stats = calcularEstadisticasPersonaje(pj);
    expect(resolverTiradaHabilidadRasgos(pj, "acrobacias", stats.modificadores, stats.habilidades.acrobacias)).toMatchObject({ caracteristica: "destreza", bono: 9 });
    expect(resolverTiradaHabilidadRasgos(pj, "acrobacias", stats.modificadores, stats.habilidades.acrobacias, "fuerza")).toMatchObject({ caracteristica: "fuerza", bono: 8 });
    pj.caracteristicas.destreza = 18;
    const empate = calcularEstadisticasPersonaje({ ...pj });
    expect(resolverTiradaHabilidadRasgos(pj, "acrobacias", empate.modificadores, empate.habilidades.acrobacias).caracteristica).toBe("fuerza");
    furia(pj).activo = false;
    expect(resolverTiradaHabilidadRasgos(pj, "acrobacias", stats.modificadores, 9).opciones).toEqual([]);
  });

  it("Campeón primigenio respeta el máximo y no se acumula al reconstruir", () => {
    const pj = personaje(20); pj.caracteristicas.fuerza = 24; pj.caracteristicas.constitucion = 22;
    for (let i = 0; i < 3; i++) pj.rasgos = sincronizarRasgosAutomaticos(pj);
    const stats = calcularEstadisticasPersonaje(pj);
    expect(stats.puntuacionesEfectivas.fuerza).toBe(25);
    expect(stats.puntuacionesEfectivas.constitucion).toBe(25);
    expect(pj.caracteristicas.fuerza).toBe(24);
  });
});
