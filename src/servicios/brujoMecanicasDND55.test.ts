import { describe, it, expect } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { construirBuildClase, aplicarBuildClaseAPersonaje } from "@/servicios/gestorClases";
import { CATALOGO_CLASES_DND55 } from "@/servicios/hidratadorClases";
import { CATALOGO_INVOCACIONES_SOBRENATURALES, generarOpcionesSelectorInvocaciones } from "@/constantes/invocacionesSobrenaturales";
import type { PersonajeJugador } from "@/tipos";

describe("D&D 5.5e (PHB 2024) - Mecánicas Declarativas de la Clase Brujo y Subclases", () => {
  function crearBrujo(nivel: number, idSubclase?: string): PersonajeJugador {
    const base: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: `pj-brujo-${nivel}`,
      nombre: "Brujo de Prueba",
      clase: "Brujo",
      nivel,
      caracteristicas: {
        fuerza: 10,
        destreza: 14,
        constitucion: 14,
        inteligencia: 10,
        sabiduria: 12,
        carisma: 18
      }
    };
    return aplicarBuildClaseAPersonaje(base, "Brujo", nivel, idSubclase);
  }

  describe("1. CLASE BASE BRUJO (Niveles 1 a 20)", () => {
    it("Nivel 1: Magia del pacto es pasivo_permanente y no tiene contadores residuales", () => {
      const build = construirBuildClase("Brujo", 1);
      expect(build).not.toBeNull();
      const magia = build?.rasgos.find((r) => r.nombre === "Magia del pacto");
      expect(magia).toBeDefined();
      expect(magia?.categoriaMecanica).toBe("pasivo_permanente");
      expect(magia?.tieneUsosLimitados).toBe(false);
      expect(magia?.recuperacion).toBe("ninguno");
    });

    it("Nivel 2: Astucia mágica es consumible con 1 uso por descanso largo", () => {
      const build = construirBuildClase("Brujo", 2);
      const astucia = build?.rasgos.find((r) => r.nombre === "Astucia mágica");
      expect(astucia).toBeDefined();
      expect(astucia?.categoriaMecanica).toBe("consumible");
      expect(astucia?.tieneUsosLimitados).toBe(true);
      expect(astucia?.usosMaximos).toBe(1);
      expect(astucia?.recuperacion).toBe("descanso_largo");
      expect(astucia?.tipoAccion).toBe("especial");
    });

    it("Nivel 3: Subclase de brujo está declarado como pasivo_permanente en el catálogo de clase", () => {
      const claseBrujo = CATALOGO_CLASES_DND55.find((c) => c.id === "brujo");
      expect(claseBrujo).toBeDefined();
      const sub = claseBrujo?.rasgos.find((r) => r.nombre === "Subclase de brujo");
      expect(sub).toBeDefined();
      expect(sub?.categoriaMecanica).toBe("pasivo_permanente");
    });

    it("Niveles 4, 8, 12, 16: Mejora de característica son selector_informativo con dotes", () => {
      const build = construirBuildClase("Brujo", 16);
      const mejoras = build?.rasgos.filter((r) => r.nombre === "Mejora de característica");
      expect(mejoras).toHaveLength(4);
      for (const m of mejoras || []) {
        expect(m.categoriaMecanica).toBe("selector_informativo");
        expect(m.selectores?.length).toBeGreaterThan(0);
      }
    });

    it("Nivel 9: Contactar con el patrón es consumible con 1 uso y conjuro otorgado y gratuito", () => {
      const build = construirBuildClase("Brujo", 9);
      const contactar = build?.rasgos.find((r) => r.nombre === "Contactar con el patrón");
      expect(contactar).toBeDefined();
      expect(contactar?.categoriaMecanica).toBe("consumible");
      expect(contactar?.usosMaximos).toBe(1);
      expect(contactar?.recuperacion).toBe("descanso_largo");
      expect(contactar?.conjurosOtorgados).toContain("contactar con otro plano");
      expect(contactar?.conjuroGratuito).toBe("contactar con otro plano");
      expect(contactar?.tipoAccion).toBe("especial");
    });

    it("Nivel 11: Arcano místico es consumible y escala sus usos de 1 a 4 por nivel", () => {
      const buildNv11 = construirBuildClase("Brujo", 11);
      const arcano11 = buildNv11?.rasgos.find((r) => r.nombre === "Arcano místico");
      expect(arcano11?.categoriaMecanica).toBe("consumible");
      expect(arcano11?.usosMaximos).toBe(1);

      const buildNv13 = construirBuildClase("Brujo", 13);
      const arcano13 = buildNv13?.rasgos.find((r) => r.nombre === "Arcano místico");
      expect(arcano13?.usosMaximos).toBe(2);

      const buildNv15 = construirBuildClase("Brujo", 15);
      const arcano15 = buildNv15?.rasgos.find((r) => r.nombre === "Arcano místico");
      expect(arcano15?.usosMaximos).toBe(3);

      const buildNv17 = construirBuildClase("Brujo", 17);
      const arcano17 = buildNv17?.rasgos.find((r) => r.nombre === "Arcano místico");
      expect(arcano17?.usosMaximos).toBe(4);
    });

    it("Niveles 13, 15, 17: Arcano místico II, III y IV se fusionan como extensiones en Arcano místico", () => {
      const buildNv20 = construirBuildClase("Brujo", 20);
      const arcanoPadre = buildNv20?.rasgos.find((r) => r.nombre === "Arcano místico");
      expect(arcanoPadre).toBeDefined();
      // No deben existir tarjetas separadas de Arcano místico II, III o IV
      const hijos = buildNv20?.rasgos.filter((r) => r.nombre.startsWith("Arcano místico "));
      expect(hijos).toHaveLength(0);
      // Las descripciones deben estar concatenadas en el padre
      expect(arcanoPadre?.descripcion).toContain("Arcano místico II");
      expect(arcanoPadre?.descripcion).toContain("Arcano místico III");
      expect(arcanoPadre?.descripcion).toContain("Arcano místico IV");
    });

    it("Nivel 19: Don épico es selector_informativo con dote épica", () => {
      const build = construirBuildClase("Brujo", 19);
      const don = build?.rasgos.find((r) => r.nombre === "Don épico");
      expect(don).toBeDefined();
      expect(don?.categoriaMecanica).toBe("selector_informativo");
      expect(don?.selectores?.length).toBeGreaterThan(0);
    });

    it("Nivel 20: Maestro sobrenatural se fusiona como extensión en Astucia mágica", () => {
      const build = construirBuildClase("Brujo", 20);
      const astucia = build?.rasgos.find((r) => r.nombre === "Astucia mágica");
      expect(astucia).toBeDefined();
      // No debe haber tarjeta separada de Maestro sobrenatural
      const maestro = build?.rasgos.find((r) => r.nombre === "Maestro sobrenatural");
      expect(maestro).toBeUndefined();
      // Su descripción debe estar fusionada en Astucia mágica
      expect(astucia?.descripcion).toContain("Maestro sobrenatural (Nv. 20)");
    });

    it("Integración con PersonajeJugador: aplicarBuildClaseAPersonaje asigna rasgos correctamente", () => {
      const pj = crearBrujo(5, "patron_de_los_archihadas");
      expect(pj.clase).toBe("Brujo");
      expect(pj.nivel).toBe(5);
      expect(pj.subclase).toBe("Patrón de los Archihadas");
      expect(pj.rasgos?.some((r) => r.nombre === "Pasos feéricos")).toBe(true);
    });
  });

  describe("2. SUBCLASE PATRÓN DE LOS ARCHIHADAS", () => {
    it("Nivel 3: Conjuros de archihada es pasivo_permanente y Pasos feéricos es consumible", () => {
      const build = construirBuildClase("Brujo", 3, "patron_de_los_archihadas");
      const conjuros = build?.rasgos.find((r) => r.nombre === "Conjuros de archihada");
      expect(conjuros?.categoriaMecanica).toBe("pasivo_permanente");

      const pasos = build?.rasgos.find((r) => r.nombre === "Pasos feéricos");
      expect(pasos?.categoriaMecanica).toBe("consumible");
      expect(pasos?.formulaDados).toBe("1d10");
      expect(pasos?.escaladoUsos?.tipo).toBe("por_modificador");
      expect(pasos?.escaladoUsos?.modificador).toBe("carisma");
    });

    it("Nivel 6: Escapada brumosa es consumible de reacción con 2d10 gastando de Pasos feéricos", () => {
      const build = construirBuildClase("Brujo", 6, "patron_de_los_archihadas");
      const pasos = build?.rasgos.find((r) => r.nombre === "Pasos feéricos");
      expect(pasos).toBeDefined();
      const escapada = build?.rasgos.find((r) => r.nombre === "Escapada brumosa");
      expect(escapada).toBeDefined();
      expect(escapada?.categoriaMecanica).toBe("consumible");
      expect(escapada?.tipoAccion).toBe("reaccion");
      expect(escapada?.formulaDados).toBe("2d10");
      expect(escapada?.ligadoA).toBe("Pasos feéricos");
      expect(escapada?.gastarDePadre).toBe(true);
    });

    it("Nivel 10 y 14: Defensas fascinantes tiene 1 uso e inmunidad, y Magia embrujadora es pasivo_permanente", () => {
      const build = construirBuildClase("Brujo", 14, "patron_de_los_archihadas");
      const defensas = build?.rasgos.find((r) => r.nombre === "Defensas fascinantes");
      expect(defensas?.categoriaMecanica).toBe("consumible");
      expect(defensas?.usosMaximos).toBe(1);
      const efHechizado = defensas?.efectos?.find((e) => e.tipo === "inmunidad_condicion");
      expect(efHechizado?.objetivo).toBe("hechizado");

      const embrujadora = build?.rasgos.find((r) => r.nombre === "Magia embrujadora");
      expect(embrujadora?.categoriaMecanica).toBe("pasivo_permanente");
    });
  });

  describe("3. SUBCLASE PATRÓN CELESTIAL", () => {
    it("Nivel 3: Conjuros celestiales es pasivo_permanente y Luz sanadora es curacion escalando nivel + 1", () => {
      const build = construirBuildClase("Brujo", 3, "patron_celestial");
      const conjuros = build?.rasgos.find((r) => r.nombre === "Conjuros celestiales");
      expect(conjuros?.categoriaMecanica).toBe("pasivo_permanente");

      const luz = build?.rasgos.find((r) => r.nombre === "Luz sanadora");
      expect(luz?.categoriaMecanica).toBe("curacion");
      expect(luz?.usosMaximos).toBe(4); // 3 + 1
      expect(luz?.formulaDados).toBe("1d6");
    });

    it("Nivel 6: Alma radiante tiene resistencia radiante", () => {
      const build = construirBuildClase("Brujo", 6, "patron_celestial");
      const alma = build?.rasgos.find((r) => r.nombre === "Alma radiante");
      expect(alma?.categoriaMecanica).toBe("pasivo_permanente");
      const efRes = alma?.efectos?.find((e) => e.objetivo === "radiante");
      expect(efRes?.valor).toBe("resistencia");
    });

    it("Nivel 10 y 14: Resiliencia celestial otorga hp_temporal y Venganza abrasadora tiene 1 uso", () => {
      const build = construirBuildClase("Brujo", 14, "patron_celestial");
      const res = build?.rasgos.find((r) => r.nombre === "Resiliencia celestial");
      expect(res?.categoriaMecanica).toBe("pasivo_permanente");
      expect(res?.efectos?.some((e) => e.tipo === "hp_temporal")).toBe(true);

      const venganza = build?.rasgos.find((r) => r.nombre === "Venganza abrasadora");
      expect(venganza?.categoriaMecanica).toBe("consumible");
      expect(venganza?.usosMaximos).toBe(1);
    });
  });

  describe("4. SUBCLASE PATRÓN INFERNAL", () => {
    it("Nivel 3: Conjuros infernales es pasivo_permanente y Bendición del Oscuro es hp_temporal", () => {
      const build = construirBuildClase("Brujo", 3, "patron_infernal");
      const conjuros = build?.rasgos.find((r) => r.nombre === "Conjuros infernales");
      expect(conjuros?.categoriaMecanica).toBe("pasivo_permanente");

      const bendicion = build?.rasgos.find((r) => r.nombre === "Bendición del Oscuro");
      expect(bendicion?.categoriaMecanica).toBe("pasivo_permanente");
      expect(bendicion?.efectos?.some((e) => e.tipo === "hp_temporal")).toBe(true);
    });

    it("Nivel 6: Propia suerte del Oscuro es consumible 1d10 con usos por Carisma", () => {
      const build = construirBuildClase("Brujo", 6, "patron_infernal");
      const suerte = build?.rasgos.find((r) => r.nombre === "Propia suerte del Oscuro");
      expect(suerte?.categoriaMecanica).toBe("consumible");
      expect(suerte?.formulaDados).toBe("1d10");
      expect(suerte?.escaladoUsos?.modificador).toBe("carisma");
    });

    it("Nivel 10: Resiliencia infernal es selector_informativo con los tipos de daño", () => {
      const build = construirBuildClase("Brujo", 10, "patron_infernal");
      const res = build?.rasgos.find((r) => r.nombre === "Resiliencia infernal");
      expect(res?.categoriaMecanica).toBe("selector_informativo");
      const selector = res?.selectores?.[0];
      expect(selector?.opciones.length).toBeGreaterThan(10);
    });

    it("Nivel 14: Arrojar al Infierno es consumible con 1 uso y 8d10 de dados", () => {
      const build = construirBuildClase("Brujo", 14, "patron_infernal");
      const arrojar = build?.rasgos.find((r) => r.nombre === "Arrojar al Infierno");
      expect(arrojar?.categoriaMecanica).toBe("consumible");
      expect(arrojar?.usosMaximos).toBe(1);
      expect(arrojar?.formulaDados).toBe("8d10");
    });
  });

  describe("5. SUBCLASE PATRÓN DEL GRAN PRIMIGENIO", () => {
    it("Nivel 3: Conjuros del Gran Primigenio, Mente despierta y Conjuros psíquicos son pasivo_permanente", () => {
      const build = construirBuildClase("Brujo", 3, "patron_del_gran_primigenio");
      const conjuros = build?.rasgos.find((r) => r.nombre === "Conjuros del Gran Primigenio");
      const mente = build?.rasgos.find((r) => r.nombre === "Mente despierta");
      const psiquicos = build?.rasgos.find((r) => r.nombre === "Conjuros psíquicos");

      expect(conjuros?.categoriaMecanica).toBe("pasivo_permanente");
      expect(mente?.categoriaMecanica).toBe("pasivo_permanente");
      expect(psiquicos?.categoriaMecanica).toBe("pasivo_permanente");
    });

    it("Nivel 6: Combatiente clarividente es consumible ligado a Mente despierta con 1 uso por descanso corto", () => {
      const build = construirBuildClase("Brujo", 6, "patron_del_gran_primigenio");
      const comb = build?.rasgos.find((r) => r.nombre === "Combatiente clarividente");
      expect(comb?.categoriaMecanica).toBe("consumible");
      expect(comb?.usosMaximos).toBe(1);
      expect(comb?.recuperacion).toBe("descanso_corto");
      expect(comb?.ligadoA).toBe("Mente despierta");
    });

    it("Nivel 10 y 14: Maldición sobrenatural, Escudo de pensamientos y Crear esclavo", () => {
      const build = construirBuildClase("Brujo", 14, "patron_del_gran_primigenio");
      const maldicion = build?.rasgos.find((r) => r.nombre === "Maldición sobrenatural");
      expect(maldicion?.categoriaMecanica).toBe("pasivo_permanente");
      expect(maldicion?.conjurosOtorgados).toContain("maldición");

      const escudo = build?.rasgos.find((r) => r.nombre === "Escudo de pensamientos");
      expect(escudo?.categoriaMecanica).toBe("pasivo_permanente");
      expect(escudo?.efectos?.find((e) => e.objetivo === "psiquico")?.valor).toBe("resistencia");

      const esclavo = build?.rasgos.find((r) => r.nombre === "Crear esclavo");
      expect(esclavo?.categoriaMecanica).toBe("pasivo_permanente");
    });
  });

  describe("6. INVOCACIONES Y SELECTORES DINÁMICOS", () => {
    it("todas las 28 invocaciones del catálogo poseen categoriaMecanica definida", () => {
      expect(CATALOGO_INVOCACIONES_SOBRENATURALES).toHaveLength(28);
      for (const inv of CATALOGO_INVOCACIONES_SOBRENATURALES) {
        expect(inv.categoriaMecanica, `Invocación ${inv.id} debe tener categoriaMecanica`).toBeDefined();
      }
    });

    it("Descarga agónica, Descarga ahuyentadora y Lanza sobrenatural poseen selectores con claveOpcionesDinamicas trucos_brujo", () => {
      const ids = ["descarga_agonica", "descarga_ahuyentadora", "lanza_sobrenatural"];
      for (const id of ids) {
        const inv = CATALOGO_INVOCACIONES_SOBRENATURALES.find((i) => i.id === id);
        expect(inv?.categoriaMecanica).toBe("selector_informativo");
        const sel = inv?.selectores?.[0];
        expect(sel, `Invocación ${id} debe tener un selector`).toBeDefined();
        expect(sel?.claveOpcionesDinamicas).toBe("trucos_brujo");
      }
    });

    it("generarOpcionesSelectorInvocaciones hidrata los selectores de trucos con las opciones del compendio", () => {
      const opcionesInvocaciones = generarOpcionesSelectorInvocaciones(5);
      const invAgonica = opcionesInvocaciones.find((i) => i.id === "descarga_agonica");
      const selectorTruco = invAgonica?.selectores?.[0];

      expect(selectorTruco).toBeDefined();
      expect(selectorTruco?.opciones.length).toBeGreaterThan(5);
      const tieneDescarga = selectorTruco?.opciones.some((op) => op.nombre.toLowerCase().includes("descarga sobrenatural"));
      expect(tieneDescarga).toBe(true);
    });
  });
});
