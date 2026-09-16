import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { aplicarBuildClaseAPersonaje } from "@/servicios/gestorClases";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { CATALOGO_CLASES_DND55 } from "@/constantes/clasesDND55";
import { obtenerMaxInvocacionesBrujo } from "@/constantes/invocacionesSobrenaturales";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

describe("D&D 5.5e - Brujo (Warlock) y Subclases Canónicas", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [],
      idPersonajeActivo: null,
    });
  });

  describe("Catálogo Oficial y Definición de Clase", () => {
    it("el catálogo contiene la clase Brujo con atributo principal Carisma y sus 4 subclases canónicas", () => {
      const defBrujo = CATALOGO_CLASES_DND55.find((c) => c.nombre === "Brujo");
      expect(defBrujo).toBeDefined();
      expect(defBrujo?.dadoGolpe).toBe("d8");
      expect(defBrujo?.caracteristicasPrimarias).toContain("carisma");
      expect(defBrujo?.subclases).toBeDefined();
      expect(defBrujo?.subclases.length).toBe(4);
      expect(defBrujo?.subclases.some((s) => s.nombre === "Patrón de los Archihadas")).toBe(true);
      expect(defBrujo?.subclases.some((s) => s.nombre === "Patrón Celestial")).toBe(true);
      expect(defBrujo?.subclases.some((s) => s.nombre === "Patrón Infernal")).toBe(true);
      expect(defBrujo?.subclases.some((s) => s.nombre === "Patrón del Gran Primigenio")).toBe(true);
    });
  });

  describe("Brujo Base: Progresión y Rasgos Declarativos", () => {
    it("a nivel 1 adquiere Magia del pacto e Invocaciones sobrenaturales", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-brujo-1",
        nombre: "Malakor",
        clase: "Brujo",
        nivel: 1,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 16 },
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 1);
      const nombresRasgos = pjActualizado.rasgos.map((r: RasgoPersonaje) => r.nombre);

      expect(nombresRasgos).toContain("Magia del pacto");
      expect(nombresRasgos).toContain("Invocaciones sobrenaturales");
    });

    it("a nivel 2 adquiere Astucia mágica con 1 uso por descanso largo", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-brujo-2",
        clase: "Brujo",
        nivel: 2,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 2);
      const rasgoAstucia = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Astucia mágica");

      expect(rasgoAstucia).toBeDefined();
      expect(rasgoAstucia?.categoriaMecanica).toBe("consumible");
      expect(rasgoAstucia?.usosMaximos).toBe(1);
      expect(rasgoAstucia?.recuperacion).toBe("descanso_largo");
    });

    it("a nivel 9 adquiere Contactar con el patrón con conjuro contactar con otro plano", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-brujo-9",
        clase: "Brujo",
        nivel: 9,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 9);
      const rasgoContactar = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Contactar con el patrón");

      expect(rasgoContactar).toBeDefined();
      expect(rasgoContactar?.categoriaMecanica).toBe("consumible");
      expect(rasgoContactar?.usosMaximos).toBe(1);
      expect(rasgoContactar?.conjurosOtorgados).toContain("contactar con otro plano");
    });

    it("a nivel 11 Arcano místico incluye tabla de progresión interactiva con nota de apilamiento", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-brujo-11",
        clase: "Brujo",
        nivel: 11,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 11);
      const arcano = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Arcano místico");

      expect(arcano).toBeDefined();
      expect(arcano?.tablaProgresion).toBeDefined();
      expect(arcano?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(arcano?.tablaProgresion?.filas.length).toBe(4);
      expect(arcano?.tablaProgresion?.filas[0]).toEqual({ nivel: 11, valores: ["Conjuro de nivel 6"] });
      expect(arcano?.tablaProgresion?.filas[3]).toEqual({ nivel: 17, valores: ["Conjuro de nivel 9"] });
      expect(arcano?.tablaProgresion?.notaPie).toBe("Se apilan los niveles");
    });

    it("a nivel 20 Maestro sobrenatural extiende Astucia mágica aumentando sus usos", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-brujo-20",
        clase: "Brujo",
        nivel: 20,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 20);
      const maestro = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Maestro sobrenatural");
      expect(maestro).toBeDefined();
      expect(maestro?.ligadoA).toBe("Astucia mágica");
    });
  });

  describe("Subclase: Patrón de los Archihadas (Señor Feérico)", () => {
    it("a nivel 3 Conjuros de archihada incluye tabla de progresión con los 4 niveles canónicos", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-hada-conjuros",
        clase: "Brujo",
        subclase: "Patrón de los Archihadas",
        nivel: 3,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 3, "Patrón de los Archihadas");
      const conjurosRasgo = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Conjuros de archihada");

      expect(conjurosRasgo).toBeDefined();
      expect(conjurosRasgo?.tablaProgresion).toBeDefined();
      expect(conjurosRasgo?.tablaProgresion?.columnas).toEqual(["Nivel de brujo", "Conjuros"]);
      expect(conjurosRasgo?.tablaProgresion?.filas.length).toBe(4);
      expect(conjurosRasgo?.tablaProgresion?.filas[0].valores[0]).toContain("Paso brumoso");
    });

    it("a nivel 3 adquiere Pasos feéricos con dado 1d10 y usos dependientes de Carisma", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-hada-3",
        clase: "Brujo",
        subclase: "Patrón de los Archihadas",
        nivel: 3,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 16 }, // mod +3
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 3, "Patrón de los Archihadas");
      const pasos = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Pasos feéricos");

      expect(pasos).toBeDefined();
      expect(pasos?.categoriaMecanica).toBe("consumible");
      expect(pasos?.tipoAccion).toBe("accion_adicional");
      expect(pasos?.formulaDados).toBe("1d10");
      expect(pasos?.usosMaximos).toBe(3);
    });

    it("a nivel 6 Escapada brumosa usa 2d10 y gasta usos del padre (Pasos feéricos)", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-hada-6",
        clase: "Brujo",
        subclase: "Patrón de los Archihadas",
        nivel: 6,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 18 }, // mod +4
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 6, "Patrón de los Archihadas");
      const escapada = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Escapada brumosa");
      const pasos = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Pasos feéricos");

      expect(escapada).toBeDefined();
      expect(escapada?.tipoAccion).toBe("reaccion");
      expect(escapada?.formulaDados).toBe("2d10");
      expect(escapada?.ligadoA).toBe("Pasos feéricos");
      expect(escapada?.gastarDePadre).toBe(true);
      expect(pasos?.usosMaximos).toBe(4);
    });

    it("a nivel 10 Defensas fascinantes otorga reacción 1/1 descanso largo e inmunidad a hechizado", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-hada-10",
        clase: "Brujo",
        subclase: "Patrón de los Archihadas",
        nivel: 10,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 10, "Patrón de los Archihadas");
      const defensas = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Defensas fascinantes");

      expect(defensas).toBeDefined();
      expect(defensas?.categoriaMecanica).toBe("consumible");
      expect(defensas?.usosMaximos).toBe(1);
      expect(defensas?.recuperacion).toBe("descanso_largo");
      expect(defensas?.tipoAccion).toBe("reaccion");
      expect(defensas?.efectos).toMatchObject([
        { tipo: "inmunidad_condicion", objetivo: "hechizado" },
      ]);
    });
  });

  describe("Subclase: Patrón Celestial", () => {
    it("a nivel 3 Conjuros celestiales incluye tabla de progresión con los 4 niveles canónicos", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-celestial-conjuros",
        clase: "Brujo",
        subclase: "Patrón Celestial",
        nivel: 3,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 3, "Patrón Celestial");
      const conjurosRasgo = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Conjuros celestiales");

      expect(conjurosRasgo).toBeDefined();
      expect(conjurosRasgo?.tablaProgresion).toBeDefined();
      expect(conjurosRasgo?.tablaProgresion?.columnas).toEqual(["Nivel de brujo", "Conjuros"]);
      expect(conjurosRasgo?.tablaProgresion?.filas.length).toBe(4);
      expect(conjurosRasgo?.tablaProgresion?.filas[0].valores[0]).toContain("Curar heridas");
    });

    it("Luz sanadora calcula la reserva de dados 1d6 como 1 + nivel", () => {
      const pjInicial3: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-celestial-3",
        clase: "Brujo",
        subclase: "Patrón Celestial",
        nivel: 3,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 16 },
      };

      const pjActualizado3 = aplicarBuildClaseAPersonaje(pjInicial3, "Brujo", 3, "Patrón Celestial");
      const luz3 = pjActualizado3.rasgos.find((r: RasgoPersonaje) => r.nombre === "Luz sanadora");

      expect(luz3).toBeDefined();
      expect(luz3?.formulaDados).toBe("1d6");
      expect(luz3?.usosMaximos).toBe(4); // 1 + 3 = 4

      const pjInicial10: PersonajeJugador = {
        ...pjInicial3,
        nivel: 10,
      };
      const pjActualizado10 = aplicarBuildClaseAPersonaje(pjInicial10, "Brujo", 10, "Patrón Celestial");
      const luz10 = pjActualizado10.rasgos.find((r: RasgoPersonaje) => r.nombre === "Luz sanadora");
      expect(luz10?.usosMaximos).toBe(11); // 1 + 10 = 11
    });

    it("a nivel 6 Alma radiante otorga resistencia al daño radiante", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-celestial-6",
        clase: "Brujo",
        subclase: "Patrón Celestial",
        nivel: 6,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 6, "Patrón Celestial");
      const alma = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Alma radiante");

      expect(alma).toBeDefined();
      expect(alma?.efectos).toMatchObject([
        { tipo: "personalizado", objetivo: "radiante" },
      ]);
    });

    it("a nivel 10 Resiliencia celestial otorga PG temp con fórmula nivel + carisma bajo demanda", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-celestial-10",
        clase: "Brujo",
        subclase: "Patrón Celestial",
        nivel: 10,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 18 }, // mod +4
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 10, "Patrón Celestial");
      const resiliencia = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Resiliencia celestial");

      expect(resiliencia).toBeDefined();
      expect(resiliencia?.tieneUsosLimitados).toBe(false);
      expect(resiliencia?.efectos?.[0].tipo).toBe("hp_temporal");
      expect(resiliencia?.efectos?.[0].valor).toBe("nivel + carisma");
    });

    it("a nivel 14 Venganza abrasadora inflige 2d8+carisma con 1 uso por descanso largo", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-celestial-14",
        clase: "Brujo",
        subclase: "Patrón Celestial",
        nivel: 14,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 14, "Patrón Celestial");
      const venganza = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Venganza abrasadora");

      expect(venganza).toBeDefined();
      expect(venganza?.categoriaMecanica).toBe("consumible");
      expect(venganza?.usosMaximos).toBe(1);
      expect(venganza?.recuperacion).toBe("descanso_largo");
      expect(venganza?.formulaDados).toBe("2d8+carisma");
    });
  });

  describe("Subclase: Patrón Infernal", () => {
    it("a nivel 3 Conjuros infernales incluye tabla de progresión con los 4 niveles canónicos", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-infernal-conjuros",
        clase: "Brujo",
        subclase: "Patrón Infernal",
        nivel: 3,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 3, "Patrón Infernal");
      const conjurosRasgo = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Conjuros infernales");

      expect(conjurosRasgo).toBeDefined();
      expect(conjurosRasgo?.tablaProgresion).toBeDefined();
      expect(conjurosRasgo?.tablaProgresion?.columnas).toEqual(["Nivel de brujo", "Conjuros"]);
      expect(conjurosRasgo?.tablaProgresion?.filas.length).toBe(4);
      expect(conjurosRasgo?.tablaProgresion?.filas[0].valores[0]).toContain("Manos ardientes");
    });

    it("a nivel 3 Bendición del Oscuro otorga PG temporales con fórmula carisma + nivel bajo demanda", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-infernal-3",
        clase: "Brujo",
        subclase: "Patrón Infernal",
        nivel: 3,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 16 },
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 3, "Patrón Infernal");
      const bendicion = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Bendición del Oscuro");

      expect(bendicion).toBeDefined();
      expect(bendicion?.tieneUsosLimitados).toBe(false);
      expect(bendicion?.efectos?.[0].tipo).toBe("hp_temporal");
      expect(bendicion?.efectos?.[0].valor).toBe("max(1, carisma + nivel)");
    });

    it("a nivel 6 Propia suerte del Oscuro otorga 1d10 recuperable en descanso largo y usos por Carisma", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-infernal-6",
        clase: "Brujo",
        subclase: "Patrón Infernal",
        nivel: 6,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 16 }, // mod +3
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 6, "Patrón Infernal");
      const suerte = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Propia suerte del Oscuro");

      expect(suerte).toBeDefined();
      expect(suerte?.formulaDados).toBe("1d10");
      expect(suerte?.usosMaximos).toBe(3);
      expect(suerte?.recuperacion).toBe("descanso_largo");
    });

    it("a nivel 10 Resiliencia infernal provee un selector con 12 tipos de daño (excluyendo fuerza)", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-infernal-10",
        clase: "Brujo",
        subclase: "Patrón Infernal",
        nivel: 10,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 10, "Patrón Infernal");
      const resiliencia = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Resiliencia infernal");

      expect(resiliencia).toBeDefined();
      const primerSelector = resiliencia?.selectores?.[0];
      expect(primerSelector).toBeDefined();
      expect(primerSelector?.opciones.length).toBe(12);
      const idsOpciones = primerSelector?.opciones.map((o) => o.id) || [];
      expect(idsOpciones).not.toContain("fuerza");
      expect(idsOpciones).toContain("fuego");
      expect(idsOpciones).toContain("necrotico");
    });

    it("a nivel 14 Arrojar al Infierno inflige 8d10 con 1 uso por descanso largo", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-infernal-14",
        clase: "Brujo",
        subclase: "Patrón Infernal",
        nivel: 14,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 14, "Patrón Infernal");
      const arrojar = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Arrojar al Infierno");

      expect(arrojar).toBeDefined();
      expect(arrojar?.formulaDados).toBe("8d10");
      expect(arrojar?.usosMaximos).toBe(1);
      expect(arrojar?.recuperacion).toBe("descanso_largo");
    });
  });

  describe("Subclase: Patrón del Gran Primigenio", () => {
    it("a nivel 3 Conjuros del Gran Primigenio incluye tabla de progresión con los 4 niveles canónicos", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-primigenio-conjuros",
        clase: "Brujo",
        subclase: "Patrón del Gran Primigenio",
        nivel: 3,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 3, "Patrón del Gran Primigenio");
      const conjurosRasgo = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Conjuros del Gran Primigenio");

      expect(conjurosRasgo).toBeDefined();
      expect(conjurosRasgo?.tablaProgresion).toBeDefined();
      expect(conjurosRasgo?.tablaProgresion?.columnas).toEqual(["Nivel de brujo", "Conjuros"]);
      expect(conjurosRasgo?.tablaProgresion?.filas.length).toBe(4);
      expect(conjurosRasgo?.tablaProgresion?.filas[0].valores[0]).toContain("Detectar pensamientos");
    });

    it("a nivel 3 adquiere Mente despierta y Conjuros psíquicos", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-primigenio-3",
        clase: "Brujo",
        subclase: "Patrón del Gran Primigenio",
        nivel: 3,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 3, "Patrón del Gran Primigenio");
      const nombresRasgos = pjActualizado.rasgos.map((r: RasgoPersonaje) => r.nombre);

      expect(nombresRasgos).toContain("Mente despierta");
      expect(nombresRasgos).toContain("Conjuros psíquicos");
    });

    it("a nivel 6 Combatiente clarividente otorga 1 uso recuperable en descanso corto", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-primigenio-6",
        clase: "Brujo",
        subclase: "Patrón del Gran Primigenio",
        nivel: 6,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 6, "Patrón del Gran Primigenio");
      const combatiente = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Combatiente clarividente");

      expect(combatiente).toBeDefined();
      expect(combatiente?.categoriaMecanica).toBe("consumible");
      expect(combatiente?.usosMaximos).toBe(1);
      expect(combatiente?.recuperacion).toBe("descanso_corto");
    });

    it("a nivel 10 Escudo de pensamientos confiere resistencia al daño psíquico", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-primigenio-10",
        clase: "Brujo",
        subclase: "Patrón del Gran Primigenio",
        nivel: 10,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 10, "Patrón del Gran Primigenio");
      const escudo = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Escudo de pensamientos");

      expect(escudo).toBeDefined();
      expect(escudo?.efectos).toMatchObject([
        { tipo: "personalizado", objetivo: "psiquico" },
      ]);
    });

    it("a nivel 14 Crear esclavo es un rasgo pasivo permanente", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-primigenio-14",
        clase: "Brujo",
        subclase: "Patrón del Gran Primigenio",
        nivel: 14,
      };

      const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, "Brujo", 14, "Patrón del Gran Primigenio");
      const esclavo = pjActualizado.rasgos.find((r: RasgoPersonaje) => r.nombre === "Crear esclavo");

      expect(esclavo).toBeDefined();
      expect(esclavo?.categoriaMecanica).toBe("pasivo_permanente");
      expect(esclavo?.tipoAccion).toBe("pasivo");
    });
  });

  describe("Reactividad de Atributos en el Almacén", () => {
    it("al cambiar Carisma en el personaje, los usos de Pasos feéricos se recalculan reactivamente", () => {
      const pjConHada: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-reactivo-brujo",
        nombre: "Kael",
        clase: "Brujo",
        subclase: "Patrón de los Archihadas",
        nivel: 3,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 14 }, // mod +2
      };

      const pjConstruido = aplicarBuildClaseAPersonaje(pjConHada, "Brujo", 3, "Patrón de los Archihadas");
      const pasosOriginal = pjConstruido.rasgos.find((r: RasgoPersonaje) => r.nombre === "Pasos feéricos");
      expect(pasosOriginal?.usosMaximos).toBe(2);

      // Simulamos incremento de Carisma a 18 (mod +4) mediante sincronizarRasgosAutomaticos
      const pjModificado: PersonajeJugador = {
        ...pjConstruido,
        caracteristicas: { ...pjConstruido.caracteristicas, carisma: 18 },
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pjModificado);
      const pasosActualizado = rasgosSincronizados.find((r: RasgoPersonaje) => r.nombre === "Pasos feéricos");

      expect(pasosActualizado?.usosMaximos).toBe(4);
    });
  });

  describe("Invocaciones Sobrenaturales: Escalado de Límite y Selección Múltiple", () => {
    it("obtenerMaxInvocacionesBrujo retorna la progresión canónica oficial 2024", () => {
      expect(obtenerMaxInvocacionesBrujo(1)).toBe(1);
      expect(obtenerMaxInvocacionesBrujo(2)).toBe(3);
      expect(obtenerMaxInvocacionesBrujo(3)).toBe(3);
      expect(obtenerMaxInvocacionesBrujo(4)).toBe(3);
      expect(obtenerMaxInvocacionesBrujo(5)).toBe(5);
      expect(obtenerMaxInvocacionesBrujo(6)).toBe(5);
      expect(obtenerMaxInvocacionesBrujo(7)).toBe(6);
      expect(obtenerMaxInvocacionesBrujo(8)).toBe(6);
      expect(obtenerMaxInvocacionesBrujo(9)).toBe(7);
      expect(obtenerMaxInvocacionesBrujo(11)).toBe(7);
      expect(obtenerMaxInvocacionesBrujo(12)).toBe(8);
      expect(obtenerMaxInvocacionesBrujo(14)).toBe(8);
      expect(obtenerMaxInvocacionesBrujo(15)).toBe(9);
      expect(obtenerMaxInvocacionesBrujo(17)).toBe(9);
      expect(obtenerMaxInvocacionesBrujo(18)).toBe(10);
      expect(obtenerMaxInvocacionesBrujo(20)).toBe(10);
    });

    it("el rasgo escala maxSelecciones según el nivel del Brujo (1 a Nv 1, 3 a Nv 2, 5 a Nv 5, 10 a Nv 18)", () => {
      const pjNv1 = aplicarBuildClaseAPersonaje({ ...PERSONAJE_POR_DEFECTO, id: "pj-inv-1", clase: "Brujo", nivel: 1 }, "Brujo", 1);
      const rasgoNv1 = pjNv1.rasgos.find((r: RasgoPersonaje) => r.nombre === "Invocaciones sobrenaturales");
      expect(rasgoNv1?.selectores?.[0].maxSelecciones).toBe(1);

      const pjNv2 = aplicarBuildClaseAPersonaje({ ...PERSONAJE_POR_DEFECTO, id: "pj-inv-2", clase: "Brujo", nivel: 2 }, "Brujo", 2);
      const rasgoNv2 = pjNv2.rasgos.find((r: RasgoPersonaje) => r.nombre === "Invocaciones sobrenaturales");
      expect(rasgoNv2?.selectores?.[0].maxSelecciones).toBe(3);
      expect(rasgoNv2?.selectores?.[0].tipo).toBe("multiple");

      const pjNv5 = aplicarBuildClaseAPersonaje({ ...PERSONAJE_POR_DEFECTO, id: "pj-inv-5", clase: "Brujo", nivel: 5 }, "Brujo", 5);
      const rasgoNv5 = pjNv5.rasgos.find((r: RasgoPersonaje) => r.nombre === "Invocaciones sobrenaturales");
      expect(rasgoNv5?.selectores?.[0].maxSelecciones).toBe(5);

      const pjNv9 = aplicarBuildClaseAPersonaje({ ...PERSONAJE_POR_DEFECTO, id: "pj-inv-9", clase: "Brujo", nivel: 9 }, "Brujo", 9);
      const rasgoNv9 = pjNv9.rasgos.find((r: RasgoPersonaje) => r.nombre === "Invocaciones sobrenaturales");
      expect(rasgoNv9?.selectores?.[0].maxSelecciones).toBe(7);

      const pjNv18 = aplicarBuildClaseAPersonaje({ ...PERSONAJE_POR_DEFECTO, id: "pj-inv-18", clase: "Brujo", nivel: 18 }, "Brujo", 18);
      const rasgoNv18 = pjNv18.rasgos.find((r: RasgoPersonaje) => r.nombre === "Invocaciones sobrenaturales");
      expect(rasgoNv18?.selectores?.[0].maxSelecciones).toBe(10);
    });

    it("permite seleccionar y persistir múltiples invocaciones simultáneamente en el almacén Zustand", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-multi-inv",
        nombre: "Zariel",
        clase: "Brujo",
        nivel: 5,
        clases: [{ nombre: "Brujo", subclase: "", nivel: 5 }],
      };

      const pjConRasgos = aplicarBuildClaseAPersonaje(pjBase, "Brujo", 5);
      usarAlmacenDM.setState({
        personajes: [pjConRasgos],
        idPersonajeActivo: "pj-multi-inv"
      });

      const rasgoInv = pjConRasgos.rasgos.find((r: RasgoPersonaje) => r.nombre === "Invocaciones sobrenaturales");
      expect(rasgoInv).toBeDefined();
      expect(rasgoInv?.selectores?.[0].maxSelecciones).toBe(5);

      const store = usarAlmacenDM.getState();
      const eleccionesNv5 = [
        "pacto_del_filo",
        "filo_sediento",
        "descarga_agonica",
        "vigor_infernal",
        "armadura_de_sombras"
      ];

      store.actualizarSeleccionRasgo(
        "pj-multi-inv",
        rasgoInv!.id,
        "invocaciones_sobrenaturales_aprendidas",
        eleccionesNv5
      );

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-multi-inv");
      const rasgoActualizado = pjActualizado?.rasgos.find((r) => r.nombre === "Invocaciones sobrenaturales");
      const selectorActualizado = rasgoActualizado?.selectores?.[0];

      expect(selectorActualizado?.valorActual).toEqual(eleccionesNv5);
      expect(selectorActualizado?.valorActual?.length).toBe(5);
      expect(selectorActualizado?.maxSelecciones).toBe(5);
    });

    it("sincronizarRasgosAutomaticos preserva las invocaciones seleccionadas al subir de nivel", () => {
      const pjNv2: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-level-up",
        clase: "Brujo",
        nivel: 2,
        clases: [{ nombre: "Brujo", subclase: "", nivel: 2 }],
      };

      const pjConstruido = aplicarBuildClaseAPersonaje(pjNv2, "Brujo", 2);
      const rasgoInv = pjConstruido.rasgos.find((r: RasgoPersonaje) => r.nombre === "Invocaciones sobrenaturales")!;

      // El jugador eligió 3 invocaciones a nivel 2
      const eleccionesNv2 = ["pacto_del_grimorio", "descarga_agonica", "vigor_infernal"];
      const rasgoConSelecciones = {
        ...rasgoInv,
        selectores: rasgoInv.selectores?.map((s) => ({
          ...s,
          valorActual: eleccionesNv2
        }))
      };

      const pjConElecciones: PersonajeJugador = {
        ...pjConstruido,
        rasgos: pjConstruido.rasgos.map((r) => r.id === rasgoInv.id ? rasgoConSelecciones : r)
      };

      // El personaje sube a nivel 5
      const pjSubidoANv5: PersonajeJugador = {
        ...pjConElecciones,
        nivel: 5,
        clases: [{ nombre: "Brujo", subclase: "", nivel: 5 }]
      };

      const rasgosNv5 = sincronizarRasgosAutomaticos(pjSubidoANv5);
      const rasgoSincronizadoNv5 = rasgosNv5.find((r) => r.nombre === "Invocaciones sobrenaturales");
      const selectorNv5 = rasgoSincronizadoNv5?.selectores?.[0];

      // maxSelecciones debe ser 5, y las 3 elecciones previas deben seguir intactas
      expect(selectorNv5?.maxSelecciones).toBe(5);
      expect(selectorNv5?.valorActual).toEqual(eleccionesNv2);
    });
  });
});
