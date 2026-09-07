import { describe, it, expect } from "vitest";
import { sanearObjetoHomebrew, formatearSubtituloCriatura, sanearMonstruoSentidosYPasiva, formatearRecargaTexto } from "./sanitizacion";
import type { Arma, Armadura } from "@/tipos";

describe("sanearObjetoHomebrew", () => {
  it("debe sanear un objeto básico con valores por defecto si recibe un input inválido", () => {
    const saneado = sanearObjetoHomebrew(null);
    expect(saneado.nombre).toBe("Objeto Desconocido");
    expect(saneado.rareza).toBe("Común");
    expect(saneado.esMagico).toBe(false);
  });

  it("debe sanear campos mágicos y narrativas comunes", () => {
    const raw = {
      nombre: "Espada de las Sombras",
      rareza: "Raro",
      esMagico: true,
      tipoPrincipal: "Arma",
      sintonizacionRequerida: true,
      condicionSintonizacion: "por un Pícaro",
      cargas: 5,
      formulaRecarga: "1d4+1 cargas al amanecer",
      modificadorAtaqueDano: 2,
    };

    const saneado = sanearObjetoHomebrew(raw);
    expect(saneado.esMagico).toBe(true);
    expect(saneado.sintonizacionRequerida).toBe(true);
    expect(saneado.condicionSintonizacion).toBe("por un Pícaro");
    expect(saneado.cargas).toBe(5);
    expect(saneado.formulaRecarga).toBe("1d4+1 cargas al amanecer");
    expect(saneado.modificadorAtaqueDano).toBe(2);
  });

  it("debe migrar automáticamente los bonosMagicos del esquema legacy a efectosPasivos", () => {
    const raw = {
      nombre: "Vara de Poder",
      rareza: "Muy Raro",
      esMagico: true,
      tipoPrincipal: "Equipo de Aventuras",
      bonosMagicos: [
        { categoria: "CA", bono: "CA", valor: 1 },
        { categoria: "SALVACIÓN", bono: "FUE", valor: 2 }
      ]
    };

    const saneado = sanearObjetoHomebrew(raw);
    expect(saneado.efectosPasivos).toBeDefined();
    expect(saneado.efectosPasivos?.length).toBe(2);
    expect(saneado.efectosPasivos?.[0]).toEqual({
      tipo: "CA",
      bono: "CA",
      valor: 1
    });
    expect(saneado.efectosPasivos?.[1]).toEqual({
      tipo: "SALVACIÓN",
      bono: "FUE",
      valor: 2
    });
  });

  it("debe sanear la estructura de efectosPasivos nativos", () => {
    const raw = {
      nombre: "Amuleto de Salud",
      rareza: "Raro",
      esMagico: true,
      tipoPrincipal: "Equipo de Aventuras",
      efectosPasivos: [
        { tipo: "CARACTERÍSTICA", bono: "CON", valor: 19, descripcion: "Tu puntuación de Constitución es 19." }
      ]
    };

    const saneado = sanearObjetoHomebrew(raw);
    expect(saneado.efectosPasivos?.length).toBe(1);
    expect(saneado.efectosPasivos?.[0]).toEqual({
      tipo: "CARACTERÍSTICA",
      bono: "CON",
      valor: 19,
      descripcion: "Tu puntuación de Constitución es 19."
    });
  });

  it("debe sanear hechizos vinculados y datos de artesanía", () => {
    const raw = {
      nombre: "Anillo de Tres Deseos",
      rareza: "Legendario",
      esMagico: true,
      tipoPrincipal: "Equipo de Aventuras",
      hechizosVinculados: [
        { nombre: "Deseo", cd: 18, costeCargas: 1 }
      ],
      artesania: {
        tallerRequerido: "Forja Arcana",
        componentes: ["Polvo de Diamante", "Esquirla Astral"]
      }
    };

    const saneado = sanearObjetoHomebrew(raw);
    expect(saneado.hechizosVinculados?.length).toBe(1);
    expect(saneado.hechizosVinculados?.[0]).toEqual({
      nombre: "Deseo",
      cd: 18,
      costeCargas: 1
    });
    expect(saneado.artesania).toEqual({
      tallerRequerido: "Forja Arcana",
      componentes: ["Polvo de Diamante", "Esquirla Astral"]
    });
  });

  it("debe sanear campos específicos de Armas", () => {
    const raw = {
      nombre: "Espada de Mano y Media",
      tipoPrincipal: "Arma",
      danoVersatil: "1d10",
      municionRequerida: false,
    };

    const saneado = sanearObjetoHomebrew(raw) as Arma;
    expect(saneado.tipoPrincipal).toBe("Arma");
    expect(saneado.danoVersatil).toBe("1d10");
    expect(saneado.municionRequerida).toBe(false);
  });

  it("debe sanear campos específicos de Armaduras", () => {
    const raw = {
      nombre: "Cota de Malla",
      tipoPrincipal: "Armadura",
      caBase: 16,
      tiempoEquipar: "10 minutos",
    };

    const saneado = sanearObjetoHomebrew(raw) as Armadura;
    expect(saneado.tipoPrincipal).toBe("Armadura");
    expect(saneado.caBase).toBe(16);
    expect(saneado.tiempoEquipar).toBe("10 minutos");
  });

  it("debe sanear el nuevo formato de compendio con multiples categorias, costo en espanol y campos relacionales", () => {
    const raw = {
      index: "alchemists-supplies",
      name: "Suministros de Alquimista",
      equipment_categories: [
        { index: "artisans-tools", name: "Herramientas de Artesano" },
        { index: "tools", name: "Herramientas" }
      ],
      cost: {
        quantity: 50,
        unit: "po"
      },
      ability: { index: "int", name: "INT" },
      craft: [
        { index: "acid", name: "Ácido" },
        { index: "alchemists-fire", name: "Fuego de Alquimista" }
      ],
      utilize: [
        {
          name: "Identificar una sustancia",
          dc: { dc_type: { index: "int", name: "INT" }, dc_value: 15 }
        }
      ],
      weight: 8,
      description: "Una herramienta te ayuda."
    };

    const saneado = sanearObjetoHomebrew(raw);
    expect(saneado.tipoPrincipal).toBe("Equipo de Aventuras");
    expect(saneado.subcategoria).toBe("Herramienta"); // Inferido de artisans-tools / tools
    expect(saneado.valorPO).toBe(50);
    expect(saneado.craft).toEqual([
      { index: "acid", name: "Ácido" },
      { index: "alchemists-fire", name: "Fuego de Alquimista" }
    ]);
    expect(saneado.descripcion).toContain("Característica asociada");
    expect(saneado.descripcion).toContain("INT");
    expect(saneado.descripcion).toContain("Identificar una sustancia");
  });

  it("debe sanear armas con mastery y two_handed_damage, y armaduras con don/doff time", () => {
    const rawArma = {
      index: "battleaxe",
      name: "Hacha de Batalla",
      equipment_categories: [
        { index: "martial-weapons", name: "Armas Marciales" }
      ],
      cost: { quantity: 10, unit: "po" },
      damage: {
        damage_dice: "1d8",
        damage_type: { index: "slashing", name: "Cortante" }
      },
      mastery: { index: "topple", name: "Derribar" },
      two_handed_damage: {
        damage_dice: "1d10",
        damage_type: { index: "slashing", name: "Cortante" }
      }
    };

    const saneadoArma = sanearObjetoHomebrew(rawArma) as Arma;
    expect(saneadoArma.tipoPrincipal).toBe("Arma");
    expect(saneadoArma.subcategoria).toBe("Marcial");
    expect(saneadoArma.maestria).toBe("Topple (Derribar)");
    expect(saneadoArma.danoVersatil).toBe("1d10 (cortante)");

    const rawArmadura = {
      index: "breastplate",
      name: "Coraza",
      equipment_categories: [
        { index: "medium-armor", name: "Armadura Media" }
      ],
      cost: { quantity: 400, unit: "po" },
      armor_class: { base: 14, dex_bonus: true, max_bonus: 2 },
      don_time: "5 minutos",
      doff_time: "1 minuto"
    };

    const saneadoArmadura = sanearObjetoHomebrew(rawArmadura) as Armadura;
    expect(saneadoArmadura.tipoPrincipal).toBe("Armadura");
    expect(saneadoArmadura.subcategoria).toBe("Mediana");
    expect(saneadoArmadura.tiempoEquipar).toBe("5 minutos (Quitar: 1 minuto)");
  });

  it("debe procesar y convertir correctamente los costos en unidades de espanol", () => {
    const rawPlata = {
      nombre: "Garrote",
      cost: { quantity: 1, unit: "pp" } // 1 pieza de plata = 0.1 PO
    };
    const saneadoPlata = sanearObjetoHomebrew(rawPlata);
    expect(saneadoPlata.valorPO).toBe(0.1);
    expect(saneadoPlata.costoOriginal).toEqual({ cantidad: 1, unidad: "PP" });

    const rawCobre = {
      nombre: "Vela",
      cost: { quantity: 1, unit: "pc" } // 1 pieza de cobre = 0.01 PO
    };
    const saneadoCobre = sanearObjetoHomebrew(rawCobre);
    expect(saneadoCobre.valorPO).toBe(0.01);
    expect(saneadoCobre.costoOriginal).toEqual({ cantidad: 1, unidad: "PC" });
  });
});

describe("formatearSubtituloCriatura y sanearMonstruoSentidosYPasiva", () => {
  it("debe formatear subtítulos con tipo, tamaño y alineación según D&D 5.5e", () => {
    expect(
      formatearSubtituloCriatura("Humanoide", "Mediano o Pequeño", "neutral malvado")
    ).toBe("Humanoide Mediano o Pequeño, neutral malvado");

    expect(
      formatearSubtituloCriatura("Monstruosidad", "Grande", "Caótico malvado")
    ).toBe("Monstruosidad Grande, Caótico malvado");

    expect(
      formatearSubtituloCriatura("Monstruosidad", "Grande", "-")
    ).toBe("Monstruosidad Grande");

    expect(
      formatearSubtituloCriatura("Bestia", "Mediano", undefined)
    ).toBe("Bestia Mediano");

    expect(
      formatearSubtituloCriatura(undefined, "Gargantuesco", "Legal bueno")
    ).toBe("Gargantuesco, Legal bueno");

    expect(
      formatearSubtituloCriatura("Humanoide", "", "")
    ).toBe("Humanoide");
  });

  it("debe sanear correctamente tamaño, alineacion, accionesAdicionales, equipo, tesoros y accionesLegendariasTotal en formato string", () => {
    const monstruoRaw = {
      id: "m-1",
      nombre: "Vampiro Siervo",
      tipo: "Humanoide",
      tamaño: " Mediano ",
      alineacion: " Neutral malvado ",
      ca: 15,
      vidaMaxima: 82,
      caracteristicas: { fuerza: 16, destreza: 14, constitucion: 16, inteligencia: 10, sabiduria: 12, carisma: 14 },
      accionesAdicionales: [
        { nombre: "Paso Sombrío", descripcion: "Se teletransporta 30 pies." }
      ],
      accionesLegendariasTotal: "3 (4 en guarida)",
      accionesLegendarias: [
        { nombre: "Golpe Rápido", descripcion: "Hace un ataque.", uso: "1" }
      ],
      equipo: "Armadura de cuero, arco corto",
      tesoros: "Reliquias"
    };

    const saneado = sanearMonstruoSentidosYPasiva(monstruoRaw as unknown as import("@/tipos").MonstruoBase);
    expect(saneado.tamaño).toBe("Mediano");
    expect(saneado.alineacion).toBe("Neutral malvado");
    expect(saneado.accionesAdicionales?.length).toBe(1);
    expect(saneado.accionesAdicionales?.[0].nombre).toBe("Paso Sombrío");
    expect(saneado.accionesLegendariasTotal).toBe("3 (4 en guarida)");
    expect(saneado.equipo).toBe("Armadura de cuero, arco corto");
    expect(saneado.tesoros).toBe("Reliquias");
  });

  it("debe formatear correctamente los textos de recarga y uso", () => {
    expect(formatearRecargaTexto("5-6")).toBe("Recarga 5-6");
    expect(formatearRecargaTexto("6")).toBe("Recarga 6");
    expect(formatearRecargaTexto("5—6")).toBe("Recarga 5-6");
    expect(formatearRecargaTexto("recarga 5-6")).toBe("Recarga 5-6");
    expect(formatearRecargaTexto("recharge 5-6")).toBe("Recarga 5-6");
    expect(formatearRecargaTexto(undefined, "1/Día")).toBe("1/Día");
    expect(formatearRecargaTexto("", "3/día")).toBe("3/día");
    expect(formatearRecargaTexto("", "")).toBe("");
  });
});
