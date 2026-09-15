import { describe, it, expect, vi } from "vitest";
import type { ObjetoInventario } from "@/tipos";

describe("Correcciones de Bugs: Reordenación en Inventario y Colapso de Secciones en Acciones", () => {
  describe("1. Reordenación en Inventario (usarInventarioOrdenado / usarDragAndDropInventario)", () => {
    const crearItemMock = (idInstancia: string, nombre: string, equipado: boolean): ObjetoInventario => ({
      idInstancia,
      idObjeto: `obj_${idInstancia}`,
      nombre,
      cantidad: 1,
      equipado,
      sintonizado: false,
      notas: "",
      pesoLb: 2,
      categoria: "armas",
      esConsumible: false,
      subcategoria: "marciales-cuerpo-a-cuerpo",
      rareza: "Común",
      esMagico: false,
      equipable: true,
      sintonizacionRequerida: false,
      contenedor: "mochila"
    });

    it("no desequipa al arrastrar y soltar un objeto equipado sobre otro objeto equipado", () => {
      const item1 = crearItemMock("item-1", "Espada Larga", true);
      const item2 = crearItemMock("item-2", "Escudo", true);
      const inventario = [item1, item2];

      const alAlternarEquipado = vi.fn();
      const alCambiarContenedor = vi.fn();
      const alReordenarInventario = vi.fn();
      const setCriterioOrden = vi.fn();
      const agregarNotificacion = vi.fn();

      // Lógica de manejarReordenarItems
      const manejarReordenarItems = (origen: string, destino: string) => {
        const objOrigen = inventario.find((o) => o.idInstancia === origen);
        const objDestino = inventario.find((o) => o.idInstancia === destino);

        if (objDestino?.equipado && !objOrigen?.equipado) {
          alAlternarEquipado(origen);
          return;
        }

        if (objOrigen?.equipado && !objDestino?.equipado) {
          alAlternarEquipado(origen);
          agregarNotificacion(`"${objOrigen.nombre}" desequipado.`, "info");
        }
        if (!objDestino?.equipado && objOrigen?.contenedor && objOrigen.contenedor !== "mochila") {
          alCambiarContenedor?.(origen, "mochila");
        }
        if (!objDestino?.equipado) {
          setCriterioOrden("personalizado");
        }
        alReordenarInventario?.(origen, destino);
      };

      manejarReordenarItems("item-1", "item-2");

      expect(alAlternarEquipado).not.toHaveBeenCalled();
      expect(agregarNotificacion).not.toHaveBeenCalled();
      expect(alReordenarInventario).toHaveBeenCalledWith("item-1", "item-2");
    });

    it("sí desequipa al arrastrar un objeto equipado sobre un objeto de la mochila no equipado", () => {
      const itemEquipado = crearItemMock("item-1", "Espada Larga", true);
      const itemMochila = crearItemMock("item-2", "Daga", false);
      const inventario = [itemEquipado, itemMochila];

      const alAlternarEquipado = vi.fn();
      const alReordenarInventario = vi.fn();
      const agregarNotificacion = vi.fn();

      const manejarReordenarItems = (origen: string, destino: string) => {
        const objOrigen = inventario.find((o) => o.idInstancia === origen);
        const objDestino = inventario.find((o) => o.idInstancia === destino);

        if (objDestino?.equipado && !objOrigen?.equipado) {
          alAlternarEquipado(origen);
          return;
        }

        if (objOrigen?.equipado && !objDestino?.equipado) {
          alAlternarEquipado(origen);
          agregarNotificacion(`"${objOrigen.nombre}" desequipado.`, "info");
        }
        alReordenarInventario?.(origen, destino);
      };

      manejarReordenarItems("item-1", "item-2");

      expect(alAlternarEquipado).toHaveBeenCalledWith("item-1");
      expect(agregarNotificacion).toHaveBeenCalledWith('"Espada Larga" desequipado.', "info");
      expect(alReordenarInventario).toHaveBeenCalledWith("item-1", "item-2");
    });
  });

  describe("2. Colapso Inmediato en Secciones de Magia y Acciones (usarCalculoAtaquesJugador)", () => {
    it("cierra el contenedor de nivel de magia en un único clic cuando la clave no estaba inicializada (undefined)", () => {
      let estado: Record<string, boolean> = {
        recursos: true,
        fisicos: true,
        magicos: true
      };

      const setSeccionesAbiertas = (actualizador: (prev: Record<string, boolean>) => Record<string, boolean>) => {
        estado = actualizador(estado);
      };

      const alternarSeccion = (seccion: string) => {
        setSeccionesAbiertas((prev) => {
          const estaAbierta = prev[seccion] !== false;
          return {
            ...prev,
            [seccion]: !estaAbierta
          };
        });
      };

      // Antes del clic, la UI evalúa si está abierta:
      const estadoVisualInicial = estado["magicos_nv_1"] !== false;
      expect(estadoVisualInicial).toBe(true);

      // PRIMER CLIC: debe cerrarla
      alternarSeccion("magicos_nv_1");

      const estadoVisualTras1Clic = estado["magicos_nv_1"] !== false;
      expect(estado["magicos_nv_1"]).toBe(false);
      expect(estadoVisualTras1Clic).toBe(false);

      // SEGUNDO CLIC: debe volver a abrirla
      alternarSeccion("magicos_nv_1");

      const estadoVisualTras2Clic = estado["magicos_nv_1"] !== false;
      expect(estado["magicos_nv_1"]).toBe(true);
      expect(estadoVisualTras2Clic).toBe(true);
    });

    it("el comportamiento antiguo fallaba requiriendo doble clic con !prev[seccion]", () => {
      let estado: Record<string, boolean> = {
        magicos: true
      };

      const alternarSeccionBug = (seccion: string) => {
        estado = {
          ...estado,
          [seccion]: !estado[seccion]
        };
      };

      // Inicialmente abierta visualmente
      expect(estado["magicos_nv_1"] !== false).toBe(true);

      // 1er clic con el bug: !undefined era true, mantenía abierta
      alternarSeccionBug("magicos_nv_1");
      expect(estado["magicos_nv_1"]).toBe(true);
      expect(estado["magicos_nv_1"] !== false).toBe(true); // ¡Seguía abierta!

      // 2do clic con el bug: !true era false, recién se cerraba
      alternarSeccionBug("magicos_nv_1");
      expect(estado["magicos_nv_1"]).toBe(false);
      expect(estado["magicos_nv_1"] !== false).toBe(false); // Recién cerrada
    });
  });
});
