import { describe, it, expect } from "vitest";
import {
  calcularCapacidadCarga,
  calcularPesoInventario,
  calcularDesglosePesosPorContenedor,
  calcularPesoMonedas,
  calcularPesoTotal,
  estaSobrecargado,
  calcularEquivalentePO,
  evaluarOperacionMoneda,
  contarSintonizaciones,
  puedeSintonizar,
  desempaquetarPaqueteInventario,
  crearObjetoInventarioDesdeCompendio
} from "./calculadorInventario";
import type { ObjetoInventario, BolsaMonedas } from "@/tipos";

describe("calculadorInventario", () => {
  describe("calcularCapacidadCarga", () => {
    it("debe calcular FUE × 15 lb para criaturas Medianas", () => {
      expect(calcularCapacidadCarga(10)).toBe(150);
      expect(calcularCapacidadCarga(16)).toBe(240);
    });

    it("debe aplicar multiplicadores de tamaño correctamente", () => {
      // Pequeño ×0.75
      expect(calcularCapacidadCarga(10, null, "Pequeño")).toBe(112.5);
      // Diminuto ×0.5
      expect(calcularCapacidadCarga(10, null, "Diminuto")).toBe(75);
      // Grande ×2
      expect(calcularCapacidadCarga(10, null, "Grande")).toBe(300);
    });

    it("debe priorizar el override de fuerza si está presente", () => {
      expect(calcularCapacidadCarga(10, 19)).toBe(285); // 19 × 15
    });
  });

  describe("calcularPesoInventario y Contenedores", () => {
    const crearObj = (datos: Partial<ObjetoInventario>): ObjetoInventario => ({
      idInstancia: "i1",
      idObjeto: "obj_item",
      nombre: "Item",
      tipoPrincipal: "Equipo de Aventuras",
      pesoLb: 5,
      cantidad: 1,
      equipable: false,
      equipado: false,
      sintonizado: false,
      esMagico: false,
      rareza: "Común",
      sintonizacionRequerida: false,
      notas: "",
      contenedor: "mochila",
      ...datos
    });

    it("debe sumar el peso de los objetos en mochila y equipados", () => {
      const inventario = [
        crearObj({ pesoLb: 10, cantidad: 1, contenedor: "mochila" }),
        crearObj({ pesoLb: 2, cantidad: 3, contenedor: "mochila" }) // 6 lb
      ];
      expect(calcularPesoInventario(inventario)).toBe(16);
    });

    it("debe ignorar objetos en Bolsa de Contención y Montura para la carga del PJ", () => {
      const inventario = [
        crearObj({ pesoLb: 10, contenedor: "mochila" }),
        crearObj({ pesoLb: 50, contenedor: "bolsa_contencion" }),
        crearObj({ pesoLb: 100, contenedor: "montura" })
      ];
      expect(calcularPesoInventario(inventario, true)).toBe(10);
    });

    it("debe calcular el desglose exacto por contenedor", () => {
      const inventario = [
        crearObj({ pesoLb: 10, contenedor: "mochila" }),
        crearObj({ pesoLb: 20, contenedor: "bolsa_contencion" }),
        crearObj({ pesoLb: 30, contenedor: "montura" }),
        crearObj({ pesoLb: 40, contenedor: "almacen" })
      ];
      const desglose = calcularDesglosePesosPorContenedor(inventario);
      expect(desglose.mochilaYEquipados).toBe(10);
      expect(desglose.bolsaContencion).toBe(20);
      expect(desglose.montura).toBe(30);
      expect(desglose.almacen).toBe(40);
      expect(desglose.totalRealFisico).toBe(100);
    });

    it("debe calcular el peso total combinado y verificar sobrecarga", () => {
      const inventario = [crearObj({ pesoLb: 100, contenedor: "mochila" })];
      const monedas: BolsaMonedas = { pc: 0, pp: 0, pe: 0, po: 50, ppt: 0 }; // 1 lb
      const total = calcularPesoTotal(inventario, monedas);
      expect(total).toBe(101);
      expect(estaSobrecargado(total, 100)).toBe(true);
      expect(estaSobrecargado(total, 150)).toBe(false);
    });
  });


  describe("calcularPesoMonedas y Monedero", () => {
    it("debe calcular 50 monedas = 1 libra", () => {
      const monedas: BolsaMonedas = { pc: 50, pp: 0, pe: 0, po: 50, ppt: 0 };
      expect(calcularPesoMonedas(monedas)).toBe(2); // 100 monedas = 2 lb
    });

    it("debe calcular el valor equivalente en PO", () => {
      const monedas: BolsaMonedas = { pc: 100, pp: 10, pe: 2, po: 5, ppt: 1 };
      // 100 pc = 1 po
      // 10 pp = 1 po
      // 2 pe = 1 po
      // 5 po = 5 po
      // 1 ppt = 10 po
      // Total = 1 + 1 + 1 + 5 + 10 = 18 PO
      expect(calcularEquivalentePO(monedas)).toBe(18);
    });

    it("debe evaluar operaciones aritméticas en inputs de moneda", () => {
      expect(evaluarOperacionMoneda(10, "+20")).toBe(30);
      expect(evaluarOperacionMoneda(50, "-15")).toBe(35);
      expect(evaluarOperacionMoneda(10, "100 - 30")).toBe(70);
      expect(evaluarOperacionMoneda(10, "45")).toBe(45);
      expect(evaluarOperacionMoneda(10, "-50")).toBe(0); // Clamped a 0
    });
  });

  describe("Sintonizaciones", () => {
    it("debe contar correctamente los objetos sintonizados", () => {
      const inventario = [
        { idInstancia: "1", sintonizado: true } as ObjetoInventario,
        { idInstancia: "2", sintonizado: true } as ObjetoInventario,
        { idInstancia: "3", sintonizado: false } as ObjetoInventario
      ];
      expect(contarSintonizaciones(inventario)).toBe(2);
    });

    it("debe permitir sintonizar si requiere sintonización y hay menos de 3 activas", () => {
      const obj = { idInstancia: "1", sintonizacionRequerida: true, sintonizado: false } as ObjetoInventario;
      const inventario = [
        { idInstancia: "2", sintonizado: true } as ObjetoInventario,
        { idInstancia: "3", sintonizado: true } as ObjetoInventario
      ];
      expect(puedeSintonizar(obj, contarSintonizaciones(inventario))).toBe(true);
    });

    it("debe bloquear sintonización si ya hay 3 sintonizaciones activas", () => {
      const obj = { idInstancia: "1", sintonizacionRequerida: true, sintonizado: false } as ObjetoInventario;
      const inventario = [
        { idInstancia: "2", sintonizado: true } as ObjetoInventario,
        { idInstancia: "3", sintonizado: true } as ObjetoInventario,
        { idInstancia: "4", sintonizado: true } as ObjetoInventario
      ];
      expect(puedeSintonizar(obj, contarSintonizaciones(inventario))).toBe(false);
    });
  });

  describe("desempaquetarPaqueteInventario", () => {
    it("debe desempaquetar los contenidos de un paquete, agregarlos a la mochila y remover el paquete", () => {
      const db = [
        {
          id: "paquete_explorador",
          nombre: "Paquete de Explorador",
          tipoPrincipal: "Equipo de Aventuras",
          contents: [
            { item: { index: "mochila_base", name: "Mochila" }, quantity: 1 },
            { item: { index: "antorcha", name: "Antorcha" }, quantity: 10 }
          ]
        },
        {
          id: "mochila_base",
          nombre: "Mochila",
          tipoPrincipal: "Equipo de Aventuras",
          pesoLb: 5
        },
        {
          id: "antorcha",
          nombre: "Antorcha",
          tipoPrincipal: "Equipo de Aventuras",
          pesoLb: 1
        }
      ];

      const invInicial: ObjetoInventario[] = [
        {
          idInstancia: "inst_paquete_1",
          idObjeto: "paquete_explorador",
          nombre: "Paquete de Explorador",
          tipoPrincipal: "Equipo de Aventuras",
          cantidad: 1,
          pesoLb: 15,
          equipado: false,
          sintonizado: false,
          notas: "",
          contenedor: "mochila",
          esMagico: false,
          rareza: "Común",
          equipable: false,
          sintonizacionRequerida: false
        }
      ];

      const invFinal = desempaquetarPaqueteInventario(invInicial, "inst_paquete_1", db as unknown as import("@/tipos").ObjetoJuego[]);

      // El paquete original debe haber sido removido
      expect(invFinal.find((o) => o.idInstancia === "inst_paquete_1")).toBeUndefined();
      expect(invFinal.length).toBe(2);

      const mochila = invFinal.find((o) => o.nombre === "Mochila");
      expect(mochila).toBeDefined();
      expect(mochila?.cantidad).toBe(1);
      expect(mochila?.pesoLb).toBe(5);

      const antorchas = invFinal.find((o) => o.nombre === "Antorcha");
      expect(antorchas).toBeDefined();
      expect(antorchas?.cantidad).toBe(10);
      expect(antorchas?.pesoLb).toBe(1);
    });

    it("debe fusionar cantidades si el jugador ya poseía objetos idénticos en su mochila", () => {
      const db = [
        {
          id: "carcaj_flechas",
          nombre: "Carcaj con Flechas",
          tipoPrincipal: "Equipo de Aventuras",
          contents: [
            { item: { index: "flechas", name: "Flechas" }, quantity: 20 }
          ]
        },
        {
          id: "flechas",
          nombre: "Flechas",
          tipoPrincipal: "Equipo de Aventuras",
          pesoLb: 1
        }
      ];

      const invInicial: ObjetoInventario[] = [
        {
          idInstancia: "inst_flechas_previa",
          idObjeto: "flechas",
          nombre: "Flechas",
          tipoPrincipal: "Equipo de Aventuras",
          cantidad: 5,
          pesoLb: 1,
          equipado: false,
          sintonizado: false,
          notas: "",
          contenedor: "mochila",
          esMagico: false,
          rareza: "Común",
          equipable: false,
          sintonizacionRequerida: false
        },
        {
          idInstancia: "inst_carcaj_1",
          idObjeto: "carcaj_flechas",
          nombre: "Carcaj con Flechas",
          tipoPrincipal: "Equipo de Aventuras",
          cantidad: 1,
          pesoLb: 2,
          equipado: false,
          sintonizado: false,
          notas: "",
          contenedor: "mochila",
          esMagico: false,
          rareza: "Común",
          equipable: false,
          sintonizacionRequerida: false
        }
      ];

      const invFinal = desempaquetarPaqueteInventario(invInicial, "inst_carcaj_1", db as unknown as import("@/tipos").ObjetoJuego[]);
      expect(invFinal.length).toBe(1);
      expect(invFinal[0].nombre).toBe("Flechas");
      expect(invFinal[0].cantidad).toBe(25); // 5 + 20
    });
  });

  describe("crearObjetoInventarioDesdeCompendio con Packs / Lotes", () => {
    it("crea 20 unidades individuales con peso unitario (0.05 lb) al añadir 1 pack de Flechas (20 uds, 1 lb)", () => {
      const objetoCompendio = {
        id: "arrows",
        nombre: "Flechas",
        tipoPrincipal: "Equipo de Aventuras",
        quantity: 20,
        pesoLb: 1,
        pesoUnitario: 0.05,
        valorPO: 1
      } as unknown as import("@/tipos").ObjetoJuego;

      const resultado = crearObjetoInventarioDesdeCompendio(objetoCompendio, 1);
      expect(resultado.cantidad).toBe(20);
      expect(resultado.pesoLb).toBe(0.05);

      // El peso total de las 20 flechas debe ser exactamente 1 lb
      expect(resultado.cantidad * resultado.pesoLb).toBe(1);
    });

    it("crea 40 unidades individuales con peso unitario (0.05 lb) al añadir 2 packs de Flechas", () => {
      const objetoCompendio = {
        id: "arrows",
        nombre: "Flechas",
        tipoPrincipal: "Equipo de Aventuras",
        quantity: 20,
        pesoLb: 1,
        valorPO: 1
      } as unknown as import("@/tipos").ObjetoJuego;

      const resultado = crearObjetoInventarioDesdeCompendio(objetoCompendio, 2);
      expect(resultado.cantidad).toBe(40);
      expect(resultado.pesoLb).toBe(0.05);
    });

    it("mantiene cantidad y peso intactos para objetos individuales estándar", () => {
      const objetoCompendio = {
        id: "longsword",
        nombre: "Espada Larga",
        tipoPrincipal: "Arma",
        pesoLb: 3,
        valorPO: 15
      } as unknown as import("@/tipos").ObjetoJuego;

      const resultado = crearObjetoInventarioDesdeCompendio(objetoCompendio, 1);
      expect(resultado.cantidad).toBe(1);
      expect(resultado.pesoLb).toBe(3);
    });
  });
});

