import { describe, it, expect } from "vitest";
import { calcularEstadisticasPersonaje } from "./usarEstadoPersonajes";
import type { PersonajeJugador, ObjetoInventario } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";

describe("calcularEstadisticasPersonaje - Efectos Pasivos de Objetos", () => {
  const crearPersonajeBase = (): PersonajeJugador => ({
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-test-pasivos",
    nombre: "Héroe de Prueba",
    nivel: 5,
    caracteristicas: {
      fuerza: 14, // Mod +2
      destreza: 14, // Mod +2
      constitucion: 12, // Mod +1
      inteligencia: 10, // Mod 0
      sabiduria: 10, // Mod 0
      carisma: 10 // Mod 0
    },
    competenciasSalvacion: {
      fuerza: true, // +2 carac + 3 prof = +5
      destreza: false, // +2
      constitucion: false, // +1
      inteligencia: false,
      sabiduria: false,
      carisma: false
    },
    inventario: []
  });

  it("debe aplicar bonos a CA de objetos mágicos equipados y sintonizados", () => {
    const pj = crearPersonajeBase();
    pj.inventario = [
      {
        idInstancia: "inv_anillo_1",
        idObjeto: "anillo_proteccion",
        nombre: "Anillo de Protección",
        categoria: "objetos-magicos",
        esConsumible: false,
        subcategoria: "Maravilloso",
        pesoLb: 0,
        cantidad: 1,
        equipable: true,
        equipado: true,
        sintonizacionRequerida: true,
        sintonizado: true,
        esMagico: true,
        rareza: "Raro",
        notas: "",
        efectosPasivos: [
          { tipo: "CA", bono: "CA", valor: 1, descripcion: "+1 a la CA" },
          { tipo: "SALVACIÓN", bono: "Todas", valor: 1, descripcion: "+1 a todas las salvaciones" }
        ]
      } as ObjetoInventario
    ];

    const stats = calcularEstadisticasPersonaje(pj);
    // Base 10 + DES (+2) + Anillo de Protección (+1) = 13 CA
    expect(stats.claseArmadura.total).toBe(13);
    // Anillo de Protección también otorga +1 a todas las salvaciones
    expect(stats.salvaciones.fuerza).toBe(6); // 5 base + 1
    expect(stats.salvaciones.destreza).toBe(3); // 2 base + 1
  });

  it("NO debe aplicar efectos pasivos si el objeto requiere sintonización pero no está sintonizado", () => {
    const pj = crearPersonajeBase();
    pj.inventario = [
      {
        idInstancia: "inv_anillo_1",
        idObjeto: "anillo_proteccion",
        nombre: "Anillo de Protección",
        categoria: "objetos-magicos",
        esConsumible: false,
        subcategoria: "Maravilloso",
        pesoLb: 0,
        cantidad: 1,
        equipable: true,
        equipado: true,
        sintonizacionRequerida: true,
        sintonizado: false, // No sintonizado
        esMagico: true,
        rareza: "Raro",
        notas: "",
        efectosPasivos: [
          { tipo: "CA", bono: "CA", valor: 1, descripcion: "+1 a la CA" },
          { tipo: "SALVACIÓN", bono: "Todas", valor: 1, descripcion: "+1 a todas las salvaciones" }
        ]
      } as ObjetoInventario
    ];

    const stats = calcularEstadisticasPersonaje(pj);
    // Base 10 + DES (+2) = 12 CA
    expect(stats.claseArmadura.total).toBe(12);
    expect(stats.salvaciones.fuerza).toBe(5);
  });

  it("NO debe aplicar efectos pasivos si el objeto está sintonizado pero no equipado", () => {
    const pj = crearPersonajeBase();
    pj.inventario = [
      {
        idInstancia: "inv_anillo_1",
        idObjeto: "anillo_proteccion",
        nombre: "Anillo de Protección",
        categoria: "objetos-magicos",
        esConsumible: false,
        subcategoria: "Maravilloso",
        pesoLb: 0,
        cantidad: 1,
        equipable: true,
        equipado: false, // Guardado en la mochila
        sintonizacionRequerida: true,
        sintonizado: true,
        esMagico: true,
        rareza: "Raro",
        notas: "",
        efectosPasivos: [
          { tipo: "CA", bono: "CA", valor: 1, descripcion: "+1 a la CA" },
          { tipo: "SALVACIÓN", bono: "Todas", valor: 1, descripcion: "+1 a todas las salvaciones" }
        ]
      } as ObjetoInventario
    ];

    const stats = calcularEstadisticasPersonaje(pj);
    expect(stats.claseArmadura.total).toBe(12);
    expect(stats.salvaciones.fuerza).toBe(5);
  });

  it("debe aplicar overrides de caracteristica (ej. Cinturón de Fuerza de Gigante = 19)", () => {
    const pj = crearPersonajeBase();
    pj.inventario = [
      {
        idInstancia: "inv_cinturon_1",
        idObjeto: "cinturon_fuerza_colinas",
        nombre: "Cinturón de Fuerza de Gigante de las Colinas",
        categoria: "objetos-magicos",
        esConsumible: false,
        subcategoria: "Maravilloso",
        pesoLb: 1,
        cantidad: 1,
        equipable: true,
        equipado: true,
        sintonizacionRequerida: true,
        sintonizado: true,
        esMagico: true,
        rareza: "Raro",
        notas: "",
        efectosPasivos: [
          { tipo: "CARACTERÍSTICA", bono: "FUE", valor: 19, descripcion: "Fija la Fuerza en 19" }
        ]
      } as ObjetoInventario
    ];

    const stats = calcularEstadisticasPersonaje(pj);
    // Fuerza base 14 pasa a 19 (+4 mod)
    expect(stats.puntuacionesEfectivas.fuerza).toBe(19);
    expect(stats.modificadores.fuerza).toBe(4);
    // Salvación FUE: +4 mod + 3 competencia = +7
    expect(stats.salvaciones.fuerza).toBe(7);
  });

  it("debe aplicar correctamente el +3 de CA de un escudo con caBase = 3 (Aspis del Baluarte Inquebrantable)", () => {
    const pj = crearPersonajeBase();
    pj.inventario = [
      {
        idInstancia: "inv_aspis_1",
        idObjeto: "o_homebrew_317bdeef-dd52-498c-bc31-98df3939b5ff",
        nombre: "Aspis del Baluarte Inquebrantable Armadura",
        categoria: "escudos",
        esConsumible: false,
        subcategoria: "Escudo",
        pesoLb: 6,
        cantidad: 1,
        equipable: true,
        equipado: true,
        sintonizacionRequerida: true,
        sintonizado: true,
        esMagico: true,
        rareza: "Raro",
        notas: "",
        propiedades: "Escudo, CA +3",
        caBase: 3,
        desventajaSigilo: false
      } as ObjetoInventario
    ];

    const stats = calcularEstadisticasPersonaje(pj);
    // Base 10 + DES (+2) + Escudo (+3) = 15 CA
    expect(stats.claseArmadura.bonoEscudo).toBe(3);
    expect(stats.claseArmadura.total).toBe(15);
    expect(stats.claseArmadura.desglose).toContain("Aspis del Baluarte Inquebrantable Armadura +3");
  });

  it("debe extraer el bonificador de CA de las propiedades si caBase no está explícito en el objeto", () => {
    const pj = crearPersonajeBase();
    pj.inventario = [
      {
        idInstancia: "inv_escudo_custom_1",
        idObjeto: "escudo_pesado_custom",
        nombre: "Escudo Pavés Reforzado",
        categoria: "escudos",
        esConsumible: false,
        subcategoria: "Escudo",
        pesoLb: 10,
        cantidad: 1,
        equipable: true,
        equipado: true,
        propiedades: "Escudo, CA +3, Pesado",
        desventajaSigilo: true
      } as ObjetoInventario
    ];

    const stats = calcularEstadisticasPersonaje(pj);
    // Base 10 + DES (+2) + Escudo (+3) = 15 CA
    expect(stats.claseArmadura.bonoEscudo).toBe(3);
    expect(stats.claseArmadura.total).toBe(15);
    expect(stats.desventajaSigiloArmadura).toBe(true);
  });

  it("un escudo estándar sin caBase personalizada debe continuar otorgando +2", () => {
    const pj = crearPersonajeBase();
    pj.inventario = [
      {
        idInstancia: "inv_escudo_std",
        idObjeto: "shield",
        nombre: "Escudo",
        categoria: "escudos",
        esConsumible: false,
        subcategoria: "Escudo",
        pesoLb: 6,
        cantidad: 1,
        equipable: true,
        equipado: true
      } as ObjetoInventario
    ];

    const stats = calcularEstadisticasPersonaje(pj);
    // Base 10 + DES (+2) + Escudo (+2) = 14 CA
    expect(stats.claseArmadura.bonoEscudo).toBe(2);
    expect(stats.claseArmadura.total).toBe(14);
  });
});

