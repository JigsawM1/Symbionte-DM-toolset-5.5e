import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type DragEvent, type SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ObjetoInventario } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { usarInventarioOrdenado } from "./usarInventarioOrdenado";
import { clasificarMochilaPorTipo, ordenarInventarioPlano } from "@/servicios/clasificadorInventario";

const persistencia = vi.hoisted(() => ({
  actual: undefined as Record<string, boolean> | undefined,
  clave: ""
}));

// Solo se sustituye el almacenamiento; los callbacks pertenecen al hook real.
vi.mock("@/hooks", () => ({
  usarEstadoPersistido: (clave: string, inicial: Record<string, boolean>) => {
    persistencia.clave = clave;
    persistencia.actual ??= { ...inicial };
    return [persistencia.actual, (cambio: SetStateAction<Record<string, boolean>>) => {
      persistencia.actual = typeof cambio === "function" ? cambio(persistencia.actual ?? {}) : cambio;
    }];
  }
}));

const crearItem = (datos: Partial<ObjetoInventario>): ObjetoInventario => ({
  idInstancia: "espada", idObjeto: "espada", nombre: "Espada", categoria: "armas",
  esConsumible: false, subcategoria: "", pesoLb: 3, cantidad: 1, equipable: true,
  equipado: false, sintonizado: false, esMagico: false, rareza: "Común",
  sintonizacionRequerida: false, notas: "", contenedor: "mochila", ...datos
});

function montarInventario(inventario: ObjetoInventario[] = []) {
  const personaje = { ...PERSONAJE_POR_DEFECTO, inventario };
  const acciones = {
    alCambiarContenedor: vi.fn(), alAlternarEquipado: vi.fn(),
    alReordenarInventario: vi.fn(), agregarNotificacion: vi.fn()
  };
  const captura: { actual?: ReturnType<typeof usarInventarioOrdenado> } = {};
  renderToStaticMarkup(createElement(() => {
    captura.actual = usarInventarioOrdenado({
      personaje, statsCalculadas: calcularEstadisticasPersonaje(personaje),
      baseDatosObjetos: [], ...acciones
    });
    return null;
  }));
  if (!captura.actual) throw new Error("El hook de inventario no se ejecutó");
  return { hook: captura.actual, acciones };
}

describe("Inventario: callbacks del producto", () => {
  beforeEach(() => {
    persistencia.actual = undefined;
    vi.clearAllMocks();
  });

  it.each([undefined, { recursos: false, personalizada: true }])(
    "colapsa y expande defaults y claves persistidas sin mutar el estado anterior: %j",
    (guardado) => {
      persistencia.actual = guardado;
      const { hook } = montarInventario();
      const anterior = persistencia.actual;
      hook.colapsarTodasSecciones();
      expect(persistencia.clave).toBe("ts_inventario_secciones_abiertas");
      expect(Object.keys(persistencia.actual ?? {})).toHaveLength(guardado ? 17 : 16);
      expect(Object.values(persistencia.actual ?? {}).every((valor) => !valor)).toBe(true);
      expect(persistencia.actual).not.toBe(anterior);
      if (guardado) expect(guardado).toEqual({ recursos: false, personalizada: true });
      else expect(Object.values(anterior ?? {}).every(Boolean)).toBe(true);
      hook.expandirTodasSecciones();
      expect(Object.values(persistencia.actual ?? {}).every(Boolean)).toBe(true);
      hook.alternarSeccion("recursos");
      expect(persistencia.actual?.recursos).toBe(false);
    }
  );

  it("conserva reordenación entre tarjetas y traslado desde contenedor especial", () => {
    const { hook, acciones } = montarInventario([
      crearItem({ contenedor: "bolsa_contencion" }), crearItem({ idInstancia: "otra" })
    ]);
    hook.manejarReordenarItems("espada", "otra");
    expect(acciones.alCambiarContenedor).toHaveBeenCalledWith("espada", "mochila");
    expect(acciones.alReordenarInventario).toHaveBeenCalledWith("espada", "otra");
    expect(acciones.alAlternarEquipado).not.toHaveBeenCalled();
  });

  it("equipa sobre tarjeta equipada y rechaza un objeto no equipable", () => {
    const { hook, acciones } = montarInventario([
      crearItem({}), crearItem({ idInstancia: "equipada", equipado: true }),
      crearItem({ idInstancia: "pocion", categoria: "consumibles", equipable: false })
    ]);
    hook.manejarReordenarItems("espada", "equipada");
    expect(acciones.alAlternarEquipado).toHaveBeenCalledTimes(1);
    expect(acciones.alAlternarEquipado).toHaveBeenCalledWith("espada");
    hook.manejarReordenarItems("pocion", "equipada");
    expect(acciones.alAlternarEquipado).toHaveBeenCalledTimes(1);
    expect(acciones.agregarNotificacion).toHaveBeenLastCalledWith(expect.any(String), "advertencia");
    expect(acciones.alReordenarInventario).not.toHaveBeenCalled();
  });

  it.each([
    "equipados", "bolsa_contencion", "montura", "almacen", "mochila", "consumibles",
    "municion", "armas", "armaduras", "escudos", "herramientas", "focos-magicos",
    "contenedores", "paquetes-equipo", "magicos", "equipo"
  ])("conserva el drop de la zona %s y detiene la propagación", (destino) => {
    const { hook, acciones } = montarInventario([
      crearItem({ contenedor: destino === "bolsa_contencion" ? "montura" : "bolsa_contencion" })
    ]);
    const evento = {
      preventDefault: vi.fn(), stopPropagation: vi.fn(),
      dataTransfer: { getData: () => JSON.stringify({ idInstancia: "espada" }) }
    } as unknown as DragEvent;
    hook.manejarDrop(evento, destino);
    expect(evento.preventDefault).toHaveBeenCalledTimes(1);
    expect(evento.stopPropagation).toHaveBeenCalledTimes(1);
    const contenedor = ["bolsa_contencion", "montura", "almacen"].includes(destino) ? destino : "mochila";
    expect(acciones.alCambiarContenedor).toHaveBeenCalledWith("espada", contenedor);
    expect(acciones.alAlternarEquipado).toHaveBeenCalledTimes(destino === "equipados" ? 1 : 0);
    expect(acciones.alReordenarInventario).not.toHaveBeenCalled();
  });

  it("conserva las once subsecciones, sus pesos y el respaldo vacío", () => {
    const categorias = ["consumibles", "municion", "armas", "armaduras", "escudos", "herramientas",
      "focos-magicos", "contenedores", "paquetes-equipo", "objetos-magicos", "equipo-aventurero"] as const;
    const items = categorias.map((categoria) => crearItem({
      idInstancia: categoria, categoria, pesoLb: 0.25, cantidad: 3
    }));
    const grupos = clasificarMochilaPorTipo(items, []);
    expect(grupos.map((grupo) => grupo.id)).toEqual([
      "consumibles", "municion", "armas", "armaduras", "escudos", "herramientas",
      "focos-magicos", "contenedores", "paquetes-equipo", "magicos", "equipo"
    ]);
    expect(grupos.every((grupo) => grupo.pesoTotal === 0.75 && !grupo.esContenedorEspecial)).toBe(true);
    expect(grupos.flatMap((grupo) => grupo.items)).toEqual(items);
    expect(clasificarMochilaPorTipo([], []).map((grupo) => [grupo.id, grupo.items, grupo.pesoTotal]))
      .toEqual([["equipo", [], 0]]);
  });

  it("preserva orden de tipo/personalizado, recientes y desempates sin mutar la entrada", () => {
    const items = [crearItem({ idInstancia: "b", nombre: "Beta", pesoLb: 5 }),
      crearItem({ idInstancia: "a", nombre: "Alfa", pesoLb: 1 })];
    const ids = (criterio: Parameters<typeof ordenarInventarioPlano>[1]) =>
      ordenarInventarioPlano(items, criterio, "", []).map((item) => item.idInstancia);
    expect(ids("tipo")).toEqual(["b", "a"]);
    expect(ids("personalizado")).toEqual(["b", "a"]);
    expect(ids("reciente")).toEqual(["a", "b"]);
    expect(ids("peso-desc")).toEqual(["b", "a"]);
    expect(ids("peso-asc")).toEqual(["a", "b"]);
    expect(ids("nombre-asc")).toEqual(["a", "b"]);
    expect(ids("valor-desc")).toEqual(["b", "a"]);
    expect(items.map((item) => item.idInstancia)).toEqual(["b", "a"]);
  });
});
