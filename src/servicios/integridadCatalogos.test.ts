import { describe, it, expect } from "vitest";
import { CATALOGO_CLASES_DND55, TODAS_SUBCLASES_DND55 } from "@/constantes/clasesDND55";
import { CATALOGO_ESPECIES_DND55 } from "@/constantes/especiesDND55";
import {
  DOTES_ORIGEN_DND55,
  DOTES_GENERALES_DND55,
  DOTES_EPICAS_DND55,
  TODAS_LAS_DOTES_CANONICAS_DND55
} from "@/constantes/dotesConstantes";
import { RASGOS_POR_ESPECIE, RASGOS_POR_CLASE } from "@/constantes/rasgosDND55";

describe("Integridad de Catálogos D&D 5.5e (JSON Modular e Hidratación)", () => {
  describe("1. Catálogo de Clases y Subclases", () => {
    it("carga exactamente las 12 clases oficiales de D&D 5.5e", () => {
      expect(CATALOGO_CLASES_DND55).toHaveLength(12);
      const nombresEsperados = [
        "Bárbaro", "Bardo", "Brujo", "Clérigo", "Druida", "Explorador",
        "Guerrero", "Hechicero", "Mago", "Monje", "Paladín", "Pícaro"
      ];
      for (const nombre of nombresEsperados) {
        const encontrada = CATALOGO_CLASES_DND55.find((c) => c.nombre === nombre);
        expect(encontrada, `Falta la clase ${nombre}`).toBeDefined();
      }
    });

    it("cada clase posee exactamente 4 subclases oficiales (total 48 subclases)", () => {
      expect(TODAS_SUBCLASES_DND55).toHaveLength(48);
      for (const clase of CATALOGO_CLASES_DND55) {
        expect(clase.subclases).toHaveLength(4);
      }
    });

    it("no existen IDs duplicados entre clases ni entre subclases", () => {
      const idsClases = CATALOGO_CLASES_DND55.map((c) => c.id);
      expect(new Set(idsClases).size).toBe(12);

      const idsSubclases = TODAS_SUBCLASES_DND55.map((s) => s.id);
      expect(new Set(idsSubclases).size).toBe(48);
    });

    it("las invocaciones sobrenaturales del Brujo están correctamente hidratadas con opciones", () => {
      const brujo = CATALOGO_CLASES_DND55.find((c) => c.id === "brujo");
      expect(brujo).toBeDefined();
      const rasgoInvocaciones = brujo?.rasgos.find((r) => r.nombre === "Invocaciones sobrenaturales");
      expect(rasgoInvocaciones).toBeDefined();
      const selector = rasgoInvocaciones?.selectores?.[0];
      expect(selector).toBeDefined();
      expect(selector?.opciones.length).toBeGreaterThan(10);
    });
  });

  describe("2. Catálogo de Especies y Subespecies", () => {
    it("carga exactamente las 10 especies oficiales de D&D 5.5e", () => {
      expect(CATALOGO_ESPECIES_DND55).toHaveLength(10);
    });

    it("el dracónido posee sus 10 linajes canónicos como subespecies", () => {
      const draconido = CATALOGO_ESPECIES_DND55.find((e) => e.id === "draconido");
      expect(draconido).toBeDefined();
      expect(draconido?.subespecies).toHaveLength(10);
    });

    it("el elfo de los bosques posee su modificador de velocidad a 35 pies", () => {
      const elfo = CATALOGO_ESPECIES_DND55.find((e) => e.id === "elfo");
      const elfoBosques = elfo?.subespecies?.find((s) => s.id === "elfo_bosques");
      expect(elfoBosques?.modificadores?.velocidad).toBe(35);
    });

    it("el drow posee su modificador de visión en la oscuridad a 120 pies", () => {
      const elfo = CATALOGO_ESPECIES_DND55.find((e) => e.id === "elfo");
      const drow = elfo?.subespecies?.find((s) => s.id === "drow");
      expect(drow?.modificadores?.visionOscuridad).toBe(120);
    });
  });

  describe("3. Catálogo de Dotes Canónicas", () => {
    it("carga 12 dotes de origen, 43 generales y 12 dones épicos (total 67 dotes)", () => {
      expect(DOTES_ORIGEN_DND55).toHaveLength(12);
      expect(DOTES_GENERALES_DND55).toHaveLength(43);
      expect(DOTES_EPICAS_DND55).toHaveLength(12);
      expect(TODAS_LAS_DOTES_CANONICAS_DND55).toHaveLength(67);
    });

    it("no existen IDs duplicados entre las 67 dotes canónicas", () => {
      const idsDotes = TODAS_LAS_DOTES_CANONICAS_DND55.map((d) => d.id);
      expect(new Set(idsDotes).size).toBe(67);
    });

    it("Iniciado en la Magia (Clérigo, Druida, Mago) posee sus opciones de conjuros hidratadas", () => {
      const clerigo = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_iniciado_magia_clerigo");
      const druida = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_iniciado_magia_druida");
      const mago = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_iniciado_magia_mago");

      expect(clerigo?.selectores?.[0].opciones.length).toBeGreaterThan(0);
      expect(druida?.selectores?.[0].opciones.length).toBeGreaterThan(0);
      expect(mago?.selectores?.[0].opciones.length).toBeGreaterThan(0);
    });

    it("Lanzador Ritual posee los conjuros rituales de nivel 1 hidratados", () => {
      const lanzadorRitual = DOTES_GENERALES_DND55.find((d) => d.id === "dote_lanzador_ritual");
      const selectorRituales = lanzadorRitual?.selectores?.find((s) => s.id === "selector_rituales_nv1");
      expect(selectorRituales).toBeDefined();
      expect(selectorRituales?.opciones.length).toBeGreaterThan(5);
    });
  });

  describe("4. Diccionarios y Derivaciones de Rasgos", () => {
    it("RASGOS_POR_ESPECIE contiene las 10 especies mapeadas", () => {
      const especies = Object.keys(RASGOS_POR_ESPECIE);
      expect(especies).toHaveLength(10);
    });

    it("RASGOS_POR_CLASE contiene las 12 clases mapeadas con sus rasgos y subclases", () => {
      const clases = Object.keys(RASGOS_POR_CLASE);
      expect(clases).toHaveLength(12);
      for (const nombreClase of clases) {
        expect(RASGOS_POR_CLASE[nombreClase].length).toBeGreaterThan(15);
      }
    });
  });
});
