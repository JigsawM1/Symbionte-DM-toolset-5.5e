import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { CATALOGO_MANIOBRAS_COMBATE } from "@/constantes/maniobrasCombate";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { sincronizarRasgosAutomaticos } from "../compendioRasgos";
import { deshidratarPersonaje, hidratarPersonaje } from "../serializadorPersonaje";
import { resolverRecursosPadre } from "./evaluadorRecursosRasgos";
import { obtenerDadosExtraAtaque, obtenerDanosSecundariosAtaque } from "./evaluadorCombateRasgos";
import { evaluarVentajasDeRasgosEnTirada } from "./evaluadorSalvacionesRasgos";
import { obtenerVelocidadesEfectivas } from "./evaluadorMovilidadRasgos";
import { resolverExtensionesRasgos } from "./extensionesRasgos";
import { dadosAdicionalesTirada, emitirTiradaConRasgos, emitirTiradaDanoConRasgos } from "./emisionTiradaRasgos";
import { crearBorradorRasgo, construirRasgoDesdeBorrador } from "./borradorRasgo";
import { ejecutarTiradaDanoFisico, ejecutarTiradaCritico } from "../ejecutorTiradasCombate";
import type { AtaquePersonajeCalculado } from "@/tipos";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";

vi.mock("@/utiles/lanzadorDados", () => ({ lanzarDadosTaleSpire: vi.fn(), sanitizarEtiqueta: (s: string) => s }));
const estado = () => usarAlmacenDM.getState();
const pj = () => estado().personajes[0];
const rasgo = (nombre: string) => pj().rasgos.find(r => r.nombre === nombre)!;
const activar = (nombre: string) => estado().alternarActivoRasgo(pj().id, rasgo(nombre).id);
const contexto = { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false } as const;
const desactivar = (id: string) => { if (pj().rasgos.find(r => r.id === id)?.activo) estado().alternarActivoRasgo(pj().id, id); };
function crear(subclase = "Maestro del Combate", nivel = 7) {
  const id = estado().crearPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), clase: "Guerrero", subclase, nivel,
    clases: [{ nombre: "Guerrero", subclase, nivel }], velocidad: { caminar: 30, volar: 40, planea: false },
    caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 8, destreza: 6, inteligencia: 16 } });
  return id;
}
function aprender(...ids: string[]) {
  const caja = rasgo("Opciones de maniobras");
  estado().actualizarSeleccionRasgo(pj().id, caja.id, caja.selectores![0].id, ids);
}

describe("Maniobras y poderes mediante contratos generales", () => {
  beforeEach(() => { estado(); usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1 }); vi.clearAllMocks(); });

  it("hidrata veinte maniobras, materializa solo las aprendidas y evita duplicarlas en la subclase", () => {
    crear();
    expect(CATALOGO_MANIOBRAS_COMBATE).toHaveLength(20);
    expect(rasgo("Opciones de maniobras").selectores![0].opciones).toHaveLength(20);
    expect(pj().rasgos.filter(r => r.idSelectorOrigen === "maniobras_aprendidas")).toHaveLength(0);
    aprender("maniobra_finta", "maniobra_parada");
    expect(pj().rasgos.filter(r => r.idSelectorOrigen === "maniobras_aprendidas")).toHaveLength(2);
    aprender("maniobra_parada");
    expect(pj().rasgos.some(r => r.nombre === "Finta")).toBe(false);
  });

  it.each([[3, "1d8"], [10, "1d10"], [18, "1d12"]])("hereda el dado de supremacía a nivel %i sin duplicar progresiones", (nivel, dado) => {
    crear("Maestro del Combate", nivel as number); aprender("maniobra_ataque_y_desarme"); activar("Ataque y desarme");
    expect(obtenerDadosExtraAtaque(pj(), contexto)).toMatchObject([{ dados: dado }]);
  });

  it("Finta gasta una vez, mantiene ventaja y añade daño hasta emitirlo correctamente", async () => {
    crear(); aprender("maniobra_finta"); activar("Finta");
    expect(rasgo("Supremacía en combate").usosRestantes).toBe(4);
    expect(evaluarVentajasDeRasgosEnTirada(pj(), { tipoTirada: "ataque", subtipo: "fuerza" }).tieneVentaja).toBe(true);
    expect(obtenerDadosExtraAtaque(pj(), contexto)).toMatchObject([{ dados: "1d8" }]);
    await emitirTiradaConRasgos(pj(), "iniciativa", async () => true, desactivar);
    expect(rasgo("Finta").activo).toBe(true);
    await emitirTiradaConRasgos(pj(), "dano", async () => false, desactivar);
    expect(rasgo("Finta").activo).toBe(true);
    await emitirTiradaConRasgos(pj(), "dano", async () => true, desactivar);
    expect(rasgo("Finta").activo).toBe(false);
    expect(rasgo("Supremacía en combate").usosRestantes).toBe(4);
    expect(obtenerDadosExtraAtaque(pj(), contexto)).toEqual([]);
  });

  it.each([
    ["maniobra_emboscada", "Emboscada", "habilidad.sigilo"],
    ["maniobra_emboscada", "Emboscada", "iniciativa"],
    ["maniobra_evaluacion_tactica", "Evaluación táctica", "habilidad.historia"],
    ["maniobra_evaluacion_tactica", "Evaluación táctica", "habilidad.investigacion"],
    ["maniobra_evaluacion_tactica", "Evaluación táctica", "habilidad.perspicacia"],
    ["maniobra_presencia_imponente", "Presencia imponente", "habilidad.interpretacion"],
    ["maniobra_presencia_imponente", "Presencia imponente", "habilidad.intimidacion"],
    ["maniobra_presencia_imponente", "Presencia imponente", "habilidad.persuasion"]
  ])("aplica %s únicamente a %s en %s", async (id, nombre, objetivo) => {
    crear(); aprender(id); activar(nombre);
    expect(dadosAdicionalesTirada(pj(), objetivo)).toBe("+1d8");
    expect(dadosAdicionalesTirada(pj(), "habilidad.atletismo")).toBe("");
    await emitirTiradaConRasgos(pj(), "habilidad.atletismo", async () => true, desactivar);
    expect(rasgo(nombre).activo).toBe(true);
    await emitirTiradaConRasgos(pj(), objetivo, async () => true, desactivar);
    expect(rasgo(nombre).activo).toBe(false);
  });

  it("bloquea Emboscada al estar incapacitado, y la reserva agotada impide otra activación", () => {
    crear(); aprender("maniobra_emboscada");
    estado().aplicarCondicionPersonaje(pj().id, "Incapacitado"); activar("Emboscada");
    expect(rasgo("Emboscada").activo).toBe(false);
    expect(rasgo("Supremacía en combate").usosRestantes).toBe(5);
    estado().quitarCondicionPersonaje(pj().id, "Incapacitado");
    estado().establecerUsosRestantesRasgoPersonaje(pj().id, rasgo("Supremacía en combate").id, 0); activar("Emboscada");
    expect(rasgo("Emboscada").activo).toBe(false);
  });

  it("Parada admite ambos modificadores negativos y Reagrupar usa el nivel de Guerrero en multiclase", () => {
    crear(); aprender("maniobra_parada", "maniobra_reagrupar");
    expect(resolverRecursosPadre(pj(), rasgo("Parada")).formulaDadosEfectiva).toBe("1d8-1");
    estado().actualizarPersonaje(pj().id, { nivel: 12, clases: [
      { nombre: "Guerrero", subclase: "Maestro del Combate", nivel: 7 }, { nombre: "Mago", subclase: "", nivel: 5 }
    ] });
    expect(resolverRecursosPadre(pj(), rasgo("Reagrupar")).formulaDadosEfectiva).toBe("1d8+3");
  });

  it("concede poderes por nivel y fusiona Empujón como extensión del Golpe", () => {
    crear("Guerrero Psiónico", 3);
    expect(pj().rasgos.filter(r => r.idSelectorOrigen === "poderes_psionicos")).toHaveLength(3);
    estado().actualizarPersonaje(pj().id, { nivel: 7, clases: [{ nombre: "Guerrero", subclase: "Guerrero Psiónico", nivel: 7 }] });
    expect(pj().rasgos.filter(r => r.idSelectorOrigen === "poderes_psionicos")).toHaveLength(5);
    expect(resolverExtensionesRasgos(pj().rasgos, 7).find(r => r.nombre === "Golpe psiónico")!.descripcion).toContain("Empujón telequinético");
    expect(resolverExtensionesRasgos(pj().rasgos, 7).some(r => r.nombre === "Empujón telequinético")).toBe(false);
  });

  it("Campo y Golpe usan la misma reserva y el Golpe separa Fuerza del daño principal", () => {
    crear("Guerrero Psiónico", 11);
    expect(resolverRecursosPadre(pj(), rasgo("Campo protector")).formulaDadosEfectiva).toBe("1d10+3");
    activar("Golpe psiónico");
    expect(rasgo("Poder psiónico").usosRestantes).toBe(7);
    expect(obtenerDanosSecundariosAtaque(pj(), contexto)).toMatchObject([{ formula: "1d10+3", tipoDano: "Fuerza" }]);
    expect(obtenerDanosSecundariosAtaque(pj(), { ...contexto, tipo: "desarmado" })).toEqual([]);
    expect(obtenerDadosExtraAtaque(pj(), contexto)).toEqual([]);
  });

  it("el daño desarmado conserva Golpe psiónico hasta un daño de arma", async () => {
    crear("Guerrero Psiónico"); activar("Golpe psiónico");
    const ataque: AtaquePersonajeCalculado = { id: "prueba", nombre: "Ataque", tipo: "Desarmado", tipoAccion: "accion",
      caracteristicaUsada: "fuerza", bonoAtaque: 2, dadoDano: "1", dadoDanoBase: "1", modificadorDano: 0,
      esDanoFijo: true, tipoDano: "Contundente", propiedades: [], tieneTiradaAtaque: true };
    await emitirTiradaDanoConRasgos(pj(), ataque, async () => true, desactivar);
    expect(rasgo("Golpe psiónico").activo).toBe(true);
    await emitirTiradaDanoConRasgos(pj(), { ...ataque, tipo: "Arma" }, async () => true, desactivar);
    expect(rasgo("Golpe psiónico").activo).toBe(false);
    expect(rasgo("Poder psiónico").usosRestantes).toBe(5);
  });

  it.each(["Movimiento telequinético", "Salto psiónico"])("%s utiliza su uso propio, recarga con padre y recupera en descanso", nombre => {
    crear("Guerrero Psiónico");
    const usar = () => nombre === "Salto psiónico" ? activar(nombre) : estado().gastarUsoRasgoPersonaje(pj().id, rasgo(nombre).id);
    estado().recargarUsoRasgoConPadre(pj().id, rasgo(nombre).id);
    expect(rasgo("Poder psiónico").usosRestantes).toBe(6);
    usar();
    expect(rasgo(nombre).usosRestantes).toBe(0);
    expect(rasgo("Poder psiónico").usosRestantes).toBe(6);
    estado().recargarUsoRasgoConPadre(pj().id, rasgo(nombre).id);
    expect(rasgo(nombre).usosRestantes).toBe(1);
    expect(rasgo("Poder psiónico").usosRestantes).toBe(5);
    if (rasgo(nombre).activo && rasgo(nombre).esActivable) activar(nombre);
    usar();
    estado().establecerUsosRestantesRasgoPersonaje(pj().id, rasgo("Poder psiónico").id, 0);
    estado().recargarUsoRasgoConPadre(pj().id, rasgo(nombre).id);
    expect(rasgo(nombre).usosRestantes).toBe(0);
    estado().ejecutarDescansoPersonaje(pj().id, "corto");
    expect(rasgo(nombre).usosRestantes).toBe(1);
  });

  it.each(["expirar", "retirar", "cancelar"])("Salto restaura el vuelo anterior al %s", modo => {
    crear("Guerrero Psiónico"); activar("Salto psiónico");
    expect(obtenerVelocidadesEfectivas(pj()).volar).toBe(60);
    expect(pj().efectosActivos.find(e => e.nombre === "Salto psiónico")).toMatchObject({ duracion: 1, expiraRonda: 2 });
    if (modo === "expirar") estado().avanzarRonda();
    else if (modo === "retirar") estado().quitarEfectoPersonaje(pj().id, pj().efectosActivos.find(e => e.nombre === "Salto psiónico")!.id);
    else activar("Salto psiónico");
    expect(rasgo("Salto psiónico").activo).toBe(false);
    expect(obtenerVelocidadesEfectivas(pj()).volar).toBe(40);
    expect(rasgo("Salto psiónico").usosRestantes).toBe(0);
  });

  it("conserva activaciones, selecciones y gasto al serializar y reconstruir", () => {
    crear(); aprender("maniobra_finta"); activar("Finta");
    const recargado = hidratarPersonaje(deshidratarPersonaje(pj()));
    expect(recargado.rasgos.find(r => r.nombre === "Finta")).toMatchObject({ activo: true, autoDesactivarAlTirarDano: true });
    expect(recargado.rasgos.find(r => r.nombre === "Supremacía en combate")!.usosRestantes).toBe(4);
    expect(sincronizarRasgosAutomaticos(recargado).filter(r => r.nombre === "Finta")).toHaveLength(1);
  });

  it("Salto calcula el doble de la velocidad efectiva y conserva un vuelo superior", () => {
    crear("Guerrero Psiónico"); activar("Salto psiónico");
    estado().actualizarPersonaje(pj().id, { cansancio: 1 });
    expect(obtenerVelocidadesEfectivas(pj())).toMatchObject({ caminar: 25, volar: 50 });
    estado().actualizarPersonaje(pj().id, { cansancio: 0, velocidad: { caminar: 30, volar: 90, planea: false } });
    expect(obtenerVelocidadesEfectivas(pj()).volar).toBe(90);
    estado().aplicarCondicionPersonaje(pj().id, "Apresado");
    expect(obtenerVelocidadesEfectivas(pj()).volar).toBe(0);
  });

  it("las mismas capacidades se editan y ejecutan desde un rasgo personalizado", async () => {
    crear();
    const b = crearBorradorRasgo(); b.nombre = "Reserva propia"; b.formulaDados = "1d6"; b.tieneUsosLimitados = true; b.usosMaximos = 2; b.usosRestantes = 2;
    b.selectores = [{ id: "opciones_propias", tipo: "multiple", modo: "consulta", materializarRasgos: true, etiqueta: "Técnicas propias",
      maxSelecciones: 1, valorActual: [], opciones: [{ id: "tecnica", nombre: "Técnica propia", descripcion: "", esActivable: true,
        gastarDePadre: true, autoDesactivarEnTirada: ["iniciativa"], efectos: [{ tipo: "dado_extra_tirada", objetivo: "iniciativa", valor: "dados_padre" }] }] }];
    estado().agregarRasgoPersonaje(pj().id, { ...construirRasgoDesdeBorrador(b), id: "reserva_propia" });
    activar("Técnica propia");
    expect(rasgo("Reserva propia").usosRestantes).toBe(1);
    expect(dadosAdicionalesTirada(pj(), "iniciativa")).toBe("+1d6");
    const guardado = construirRasgoDesdeBorrador(crearBorradorRasgo(rasgo("Técnica propia")), rasgo("Técnica propia"));
    expect(guardado.autoDesactivarEnTirada).toEqual(["iniciativa"]);
    await emitirTiradaConRasgos(pj(), "iniciativa", async () => true, desactivar);
    expect(rasgo("Técnica propia").activo).toBe(false);
  });

  it("una emisión pendiente evita dobles tiradas y un error permite reintentar", async () => {
    crear(); aprender("maniobra_finta"); activar("Finta");
    let completar!: (r: boolean) => void;
    const primera = emitirTiradaConRasgos(pj(), "dano", () => new Promise<boolean>(r => { completar = r; }), desactivar);
    const emitir = vi.fn(async () => true);
    expect(await emitirTiradaConRasgos(pj(), "dano", emitir, desactivar)).toBe(false);
    expect(emitir).not.toHaveBeenCalled(); completar(false); await primera;
    await expect(emitirTiradaConRasgos(pj(), "dano", async () => { throw new Error("sin emisión"); }, desactivar)).rejects.toThrow();
    expect(rasgo("Finta").activo).toBe(true);
    expect(await emitirTiradaConRasgos(pj(), "dano", emitir, desactivar)).toBe(true);
  });
});

describe("Emisión de daño normal y crítico con grupo de Fuerza", () => {
  const ataque: AtaquePersonajeCalculado = { id: "espada", nombre: "Espada", tipo: "Arma", subtipo: "Cuerpo a Cuerpo", tipoAccion: "accion",
    caracteristicaUsada: "fuerza", bonoAtaque: 5, dadoDano: "1d8+3/1d10+3", dadoDanoBase: "1d8/1d10+3", modificadorDano: 3,
    esDanoFijo: false, tipoDano: "Cortante/Fuerza", propiedades: [], tieneTiradaAtaque: true };
  it.each([ejecutarTiradaDanoFisico, ejecutarTiradaCritico])("propaga el resultado de emisión y mantiene los grupos", async ejecutar => {
    vi.mocked(lanzarDadosTaleSpire).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    expect(await ejecutar(ataque, null)).toBe(false);
    expect(await ejecutar(ataque, null)).toBe(true);
    const formula = vi.mocked(lanzarDadosTaleSpire).mock.calls.at(-1)![0];
    expect(formula).toContain("/"); expect(formula).toContain("Fuerza");
    expect(formula).toContain(ejecutar === ejecutarTiradaCritico ? "2d10+3" : "1d10+3");
  });
});
