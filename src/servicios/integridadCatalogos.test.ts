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
import { CATALOGO_INVOCACIONES_SOBRENATURALES } from "@/constantes/invocacionesSobrenaturales";

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

  describe("5. Validación Funcional de Bárbaro, Bardo, Brujo, Invocaciones y Dotes", () => {
    it("Bárbaro: calcula correctamente los usos de Furia según el nivel", async () => {
      const { construirBuildClase } = await import("./gestorClases");
      const nivelesFuria: Array<{ nivel: number; usosEsperados: number }> = [
        { nivel: 1, usosEsperados: 2 },
        { nivel: 2, usosEsperados: 2 },
        { nivel: 3, usosEsperados: 3 },
        { nivel: 5, usosEsperados: 3 },
        { nivel: 6, usosEsperados: 4 },
        { nivel: 11, usosEsperados: 4 },
        { nivel: 12, usosEsperados: 5 },
        { nivel: 16, usosEsperados: 5 },
        { nivel: 17, usosEsperados: 6 },
        { nivel: 20, usosEsperados: 6 }
      ];

      for (const { nivel, usosEsperados } of nivelesFuria) {
        const build = construirBuildClase("Bárbaro", nivel);
        expect(build).not.toBeNull();
        if (!build) return;
        const furia = build.rasgos.find((r) => r.nombre === "Furia");
        expect(furia, `Furia debe existir en nivel ${nivel}`).toBeDefined();
        expect(furia?.usosMaximos).toBe(usosEsperados);
      }
    });

    it("Bárbaro (Fanático): escala Guerrero de los dioses y calcula Furia persistente", async () => {
      const { construirBuildClase } = await import("./gestorClases");
      const buildNv15 = construirBuildClase("Bárbaro", 15, "senda_del_fanatico");
      expect(buildNv15).not.toBeNull();
      if (!buildNv15) return;
      
      const guerreroDioses = buildNv15.rasgos.find((r) => r.nombre === "Guerrero de los dioses");
      expect(guerreroDioses?.usosMaximos).toBe(6); // >= 12 -> 6

      const furiaPersistente = buildNv15.rasgos.find((r) => r.nombre === "Furia persistente");
      expect(furiaPersistente?.usosMaximos).toBe(1);
    });

    it("Bardo (Glamour): Manto de majestad y Majestad inquebrantable resuelven 1 uso", async () => {
      const { construirBuildClase } = await import("./gestorClases");
      const buildNv14 = construirBuildClase("Bardo", 14, "colegio_del_glamour");
      expect(buildNv14).not.toBeNull();
      if (!buildNv14) return;

      const manto = buildNv14.rasgos.find((r) => r.nombre === "Manto de majestad");
      expect(manto?.usosMaximos).toBe(1);

      const majestad = buildNv14.rasgos.find((r) => r.nombre === "Majestad inquebrantable");
      expect(majestad?.usosMaximos).toBe(1);

      const inspiracion = buildNv14.rasgos.find((r) => r.nombre === "Inspiración bárdica");
      expect(inspiracion?.escaladoUsos).toEqual({
        tipo: "por_modificador",
        modificador: "carisma",
        minimo: 1
      });
    });

    it("Brujo (Celestial): Luz sanadora escala dinámicamente como (nivel + 1)", async () => {
      const { construirBuildClase } = await import("./gestorClases");
      const nivelesBrujo = [3, 7, 14, 20];
      for (const nivel of nivelesBrujo) {
        const build = construirBuildClase("Brujo", nivel, "patron_celestial");
        expect(build).not.toBeNull();
        if (!build) return;
        const luz = build.rasgos.find((r) => r.nombre === "Luz sanadora");
        expect(luz, `Luz sanadora debe existir en nivel ${nivel}`).toBeDefined();
        expect(luz?.usosMaximos).toBe(nivel + 1);
      }
    });

    it("Brujo: Invocaciones sobrenaturales tiene opciones reales y escala selecciones", async () => {
      const { construirBuildClase } = await import("./gestorClases");
      const buildNv2 = construirBuildClase("Brujo", 2);
      expect(buildNv2).not.toBeNull();
      if (!buildNv2) return;
      const rasgoInvocaciones = buildNv2.rasgos.find((r) => r.nombre === "Invocaciones sobrenaturales");
      const selector = rasgoInvocaciones?.selectores?.find((s) => s.id === "invocaciones_sobrenaturales_aprendidas");

      expect(selector).toBeDefined();
      expect(selector?.opciones.length).toBeGreaterThan(15);
      // Nivel 2 -> escaladoMaxSelecciones debe resolver 3
      expect(selector?.maxSelecciones).toBe(3);

      const buildNv5 = construirBuildClase("Brujo", 5);
      expect(buildNv5).not.toBeNull();
      if (!buildNv5) return;
      const selectorNv5 = buildNv5.rasgos.find((r) => r.nombre === "Invocaciones sobrenaturales")
        ?.selectores?.find((s) => s.id === "invocaciones_sobrenaturales_aprendidas");
      expect(selectorNv5?.maxSelecciones).toBe(5);
    });

    it("Dotes: Iniciado en la Magia posee conjuros de nivel 0 y nivel 1 reales", () => {
      const mago = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_iniciado_magia_mago");
      expect(mago).toBeDefined();
      const selectorTruco = mago?.selectores?.find((s) => s.id === "selector_truco_1_iniciado_mago");
      const selectorNv1 = mago?.selectores?.find((s) => s.id === "selector_conjuro_nv1_iniciado_mago");
      expect(selectorTruco?.opciones.length).toBeGreaterThan(0);
      expect(selectorNv1?.opciones.length).toBeGreaterThan(0);
    });
  });

  describe("6. Catálogo de Invocaciones Sobrenaturales (JSON Modular)", () => {
    it("carga exactamente las 28 invocaciones oficiales de D&D 5.5e", () => {
      expect(CATALOGO_INVOCACIONES_SOBRENATURALES).toHaveLength(28);
    });

    it("no existen IDs duplicados entre las invocaciones sobrenaturales", () => {
      const ids = CATALOGO_INVOCACIONES_SOBRENATURALES.map((i) => i.id);
      expect(new Set(ids).size).toBe(28);
    });

    it("todas las invocaciones poseen niveles mínimos válidos (1 a 20)", () => {
      for (const inv of CATALOGO_INVOCACIONES_SOBRENATURALES) {
        expect(inv.nivelMinimo).toBeGreaterThanOrEqual(1);
        expect(inv.nivelMinimo).toBeLessThanOrEqual(20);
        expect(inv.nombre.length).toBeGreaterThan(0);
        expect(inv.descripcion.length).toBeGreaterThan(0);
      }
    });

    it("Pacto del filo conserva su selector interactivo de tipo de daño", () => {
      const pactoFilo = CATALOGO_INVOCACIONES_SOBRENATURALES.find((i) => i.id === "pacto_del_filo");
      expect(pactoFilo).toBeDefined();
      expect(pactoFilo?.selectores?.[0].id).toBe("tipo_dano_pacto_del_filo");
      expect(pactoFilo?.selectores?.[0].opciones).toHaveLength(4);
    });
  });
});
