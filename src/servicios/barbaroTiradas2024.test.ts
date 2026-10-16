import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { generarListaAtaquesFisicos } from "./calculadorAtaquesArmas";
import { emitirTiradaDanoConRasgos } from "./rasgos/emisionTiradaRasgos";
import { ejecutarTiradaAtaqueFisico, ejecutarTiradaDanoFisico, ejecutarTiradaCritico } from "./ejecutorTiradasCombate";
import { validarLanzamiento, type ModoLanzamiento } from "./servicioLanzamientoConjuros";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import { normalizarCondicionesRasgos } from "./rasgos/estadoCondicionesRasgos";
import type { HechizoBase, PersonajeJugador } from "@/tipos";

vi.mock("@/utiles/lanzadorDados", () => ({ lanzarDadosTaleSpire: vi.fn(), sanitizarEtiqueta: (s: string) => s }));

function preparar(nivel = 9): PersonajeJugador {
  const pj = { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "tiradas-barbaro", clase: "Bárbaro", nivel,
    clases: [{ nombre: "Bárbaro", nivel, subclase: "" }], rasgos: obtenerRasgosClaseYSubclase("Bárbaro", nivel) };
  for (const r of pj.rasgos) if (["Furia", "Ataque temerario", "Golpe brutal"].includes(r.nombre)) r.activo = true;
  return pj;
}
const ataque = (pj: PersonajeJugador) => generarListaAtaquesFisicos({ personajeActivo: pj,
  statsCalculadas: calcularEstadisticasPersonaje(pj), baseDatosObjetos: [], caracteristicasArmas: {} }).find(a => a.tipo === "Desarmado")!;
const conjuro: HechizoBase = { id: "prueba", nombre: "Conjuro de prueba", nivel: 0, escuela: "Evocación", tiempoLanzamiento: "1 acción",
  alcance: "30 pies", componentesSeleccionados: { verbal: true, somatico: false, material: false }, duracion: "Instantánea",
  concentracion: false, ritual: false, descripcion: "", dadosDaño: "1d6", requiereAtaque: true, ataqueCd: "ATAQUE" };

describe("Bárbaro base: restricciones y emisiones reales del consumidor", () => {
  beforeEach(() => { vi.mocked(lanzarDadosTaleSpire).mockReset().mockResolvedValue(true); usarAlmacenDM.setState({ personajes: [], colaIniciativa: [] }); });

  it.each([9, 17])("añade daño del mismo tipo y desactiva tras daño normal y crítico, nivel %i", async nivel => {
    for (const emitir of [ejecutarTiradaDanoFisico, ejecutarTiradaCritico]) {
      const pj = preparar(nivel); const a = ataque(pj); const desactivar = vi.fn();
      expect(a.dadoDano).toContain(nivel === 17 ? "2d10" : "1d10");
      expect(a.dadoDanoBase).toBe(nivel === 17 ? "1+2d10" : "1+1d10");
      expect(a.tipoDano).toBe("Contundente");
      expect(await emitirTiradaDanoConRasgos(pj, a, () => emitir(a, pj), desactivar)).toBe(true);
      expect(desactivar).toHaveBeenCalledWith("rasgo_cls_barbaro_golpe_brutal");
      expect(lanzarDadosTaleSpire).toHaveBeenCalled();
    }
  });

  it("conserva la activación al fallar la emisión o tirar daño ajeno", async () => {
    const pj = preparar(); const a = ataque(pj); const desactivar = vi.fn();
    expect(await emitirTiradaDanoConRasgos(pj, a, async () => false, desactivar)).toBe(false);
    expect(desactivar).not.toHaveBeenCalled();
    await emitirTiradaDanoConRasgos(pj, { ...a, caracteristicaUsada: "destreza" }, async () => true, desactivar);
    expect(desactivar).not.toHaveBeenCalled();
  });

  it("renuncia a toda ventaja por metadatos, incluso con identidad personalizada", async () => {
    const pj = preparar(); const gb = pj.rasgos.find(r => r.nombre === "Golpe brutal")!;
    gb.id = "opcion-propia"; gb.nombre = "Poder propio";
    const notificar = vi.fn();
    await ejecutarTiradaAtaqueFisico({ ataque: ataque(pj), personajeActivo: pj, statsCalculadas: calcularEstadisticasPersonaje(pj),
      baseDatosObjetos: [], modificarCantidadObjeto: vi.fn(), agregarNotificacion: notificar });
    expect(vi.mocked(lanzarDadosTaleSpire).mock.calls[0][4]).toBe("plano");
    expect(vi.mocked(lanzarDadosTaleSpire).mock.calls[0][1]).toContain("Renuncia a ventaja");
    expect(notificar).not.toHaveBeenCalled();
  });

  it("impide ataque y daño con desventaja aunque Ataque temerario la contrarreste", async () => {
    const pj = preparar(); pj.condicionesActivas = ["Envenenado"];
    const a = ataque(pj); const notificar = vi.fn(); const desactivar = vi.fn();
    await ejecutarTiradaAtaqueFisico({ ataque: a, personajeActivo: pj, statsCalculadas: calcularEstadisticasPersonaje(pj),
      baseDatosObjetos: [], modificarCantidadObjeto: vi.fn(), agregarNotificacion: notificar });
    expect(lanzarDadosTaleSpire).not.toHaveBeenCalled();
    expect(notificar).toHaveBeenCalled();
    expect(await emitirTiradaDanoConRasgos(pj, a, () => ejecutarTiradaDanoFisico(a, pj), desactivar)).toBe(false);
    expect(desactivar).not.toHaveBeenCalled();
  });

  it("no añade daño ni renuncia cuando falta el padre adquirido o activo", () => {
    const pj = preparar(); pj.rasgos.find(r => r.nombre === "Ataque temerario")!.activo = false;
    expect(ataque(pj).dadoDano).not.toContain("d10");
    pj.rasgos = pj.rasgos.filter(r => r.nombre !== "Ataque temerario");
    expect(ataque(pj).dadoDano).not.toContain("d10");
  });

  it("rechaza la desventaja manual sin emitir ni retirar el estado", async () => {
    const pj = preparar(); const a = ataque(pj); const desactivar = vi.fn();
    await ejecutarTiradaAtaqueFisico({ ataque: a, personajeActivo: pj, statsCalculadas: calcularEstadisticasPersonaje(pj),
      tipoTiradaManual: "desventaja", baseDatosObjetos: [], modificarCantidadObjeto: vi.fn(), agregarNotificacion: vi.fn() });
    expect(lanzarDadosTaleSpire).not.toHaveBeenCalled();
    expect(await emitirTiradaDanoConRasgos(pj, a, async () => true, desactivar, "desventaja")).toBe(false);
    expect(desactivar).not.toHaveBeenCalled();
  });

  it.each<ModoLanzamiento>(["truco", "espacio", "ritual", "objetoMagico", "arcanoMistico", "gratuitoInnato", "ataqueMagico"])("bloquea %s antes de gastar recursos", modo => {
    const pj = preparar(); pj.espaciosPactoGastados = 1;
    const antes = JSON.stringify(pj);
    expect(validarLanzamiento({ modo, hechizo: conjuro }, { personajeActual: pj })).toEqual({ permitido: false, motivo: "Un rasgo activo impide lanzar conjuros." });
    expect(JSON.stringify(pj)).toBe(antes);
    pj.rasgos.find(r => r.nombre === "Furia")!.activo = false;
    expect(validarLanzamiento({ modo: "truco", hechizo: conjuro }, { personajeActual: pj }).permitido).toBe(true);
  });

  it("retira concentración al activar sin borrar efectos independientes", () => {
    const pj = preparar(); pj.rasgos.find(r => r.nombre === "Furia")!.activo = false;
    pj.condicionesActivas = ["Concentración", "Bendecir"];
    pj.efectosActivos = [{ id: "concentracion", nombre: "Concentración: Detectar magia", concentracion: true }, { id: "otro", nombre: "Ayuda" }];
    const id = usarAlmacenDM.getState().crearPersonaje(pj);
    usarAlmacenDM.getState().alternarActivoRasgo(id, "rasgo_cls_barbaro_furia");
    const actual = usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    expect(actual.condicionesActivas).not.toContain("Concentración");
    expect(actual.efectosActivos.some(e => e.concentracion)).toBe(false);
    expect(actual.efectosActivos.some(e => e.id === "otro")).toBe(true);
  });

  it("la finalización automática apaga los hijos activables", () => {
    const pj = preparar();
    pj.condicionesActivas = ["Incapacitado"];
    pj.rasgos.find(r => r.nombre === "Golpe brutal")!.ligadoA = "rasgo_cls_barbaro_furia";
    expect(normalizarCondicionesRasgos(pj).rasgos.find(r => r.nombre === "Golpe brutal")!.activo).toBe(false);
  });

  it("Furia divina conserva el daño desarmado físico y su grupo necrótico también en crítico", async () => {
    const pj = preparar(14);
    pj.subclase = "Senda del Fanático"; pj.clases[0].subclase = pj.subclase;
    pj.rasgos = obtenerRasgosClaseYSubclase("Bárbaro", 14, pj.subclase);
    pj.caracteristicas.fuerza = 18;
    for (const r of pj.rasgos) if (["Furia", "Furia divina"].includes(r.nombre)) {
      r.activo = true;
      if (r.nombre === "Furia divina") r.selectores![0].valorActual = ["necrotico"];
    }
    const a = ataque(pj);
    expect(a.dadoDano).toBe("8/1d6+7"); expect(a.tipoDano).toBe("Contundente / Necrótico");
    vi.mocked(lanzarDadosTaleSpire).mockResolvedValue(true);
    await ejecutarTiradaDanoFisico(a, pj);
    expect(vi.mocked(lanzarDadosTaleSpire).mock.calls.at(-1)?.[0]).toMatch(/1d1\+7\/.*Necr[oó]tico.*:1d6\+7/);
    await ejecutarTiradaCritico(a, pj);
    expect(vi.mocked(lanzarDadosTaleSpire).mock.calls.at(-1)?.[0]).toMatch(/1d1\+7\/.*Necr[oó]tico.*:2d6\+7/);
  });
});
