import { describe, it, expect } from "vitest";
import {
  sonHerramientasEquivalentes,
  obtenerCompetenciasExtraRasgos,
  obtenerCompetenciasEfectivasTexto
} from "./evaluadorEfectosRasgos";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

function crearRasgo(parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje {
  return {
    descripcion: "",
    origen: "dote",
    fuente: "Dote General",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: true,
    notas: "",
    esActivable: false,
    efectos: [],
    selectores: [],
    ...parcial
  };
}

describe("Competencias en Herramientas otorgadas por Dotes", () => {
  describe("sonHerramientasEquivalentes", () => {
    it("debe reconocer equivalencia entre Útiles de envenenador y Kit de venenos", () => {
      expect(sonHerramientasEquivalentes("Útiles de envenenador", "Kit de venenos")).toBe(true);
      expect(sonHerramientasEquivalentes("kit de venenos", "útiles de envenenador")).toBe(true);
      expect(sonHerramientasEquivalentes("Kit de envenenador", "Útiles de envenenador")).toBe(true);
    });

    it("debe reconocer equivalencia entre Útiles de cocinero y Utensilios de cocinero", () => {
      expect(sonHerramientasEquivalentes("Útiles de cocinero", "Utensilios de cocinero")).toBe(true);
      expect(sonHerramientasEquivalentes("kit de cocinero", "útiles de cocinero")).toBe(true);
    });

    it("debe retornar false para herramientas no equivalentes", () => {
      expect(sonHerramientasEquivalentes("Útiles de cocinero", "Útiles de envenenador")).toBe(false);
      expect(sonHerramientasEquivalentes("Herramientas de ladrón", "Kit de venenos")).toBe(false);
    });
  });

  describe("Extracción de herramientas desde dotes", () => {
    it("debe extraer Útiles de cocinero del dote Chef", () => {
      const rasgoChef = crearRasgo({
        id: "dote_chef",
        nombre: "Chef",
        efectos: [
          {
            tipo: "competencia",
            objetivo: "herramientas",
            valor: "Útiles de cocinero",
            descripcion: "Competencia con útiles de cocinero"
          }
        ]
      });

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        rasgos: [rasgoChef]
      };

      const extra = obtenerCompetenciasExtraRasgos(pj);
      expect(extra.herramientas).toContain("Útiles de cocinero");

      const efectivas = obtenerCompetenciasEfectivasTexto(pj);
      expect(efectivas.herramientasLista).toContain("Útiles de cocinero");
      expect(efectivas.herramientasTexto).toContain("Útiles de cocinero");
    });

    it("debe extraer Útiles de envenenador del dote Envenenador", () => {
      const rasgoEnvenenador = crearRasgo({
        id: "dote_envenenador",
        nombre: "Envenenador",
        efectos: [
          {
            tipo: "competencia",
            objetivo: "herramientas",
            valor: "Útiles de envenenador",
            descripcion: "Competencia con útiles de envenenador"
          }
        ]
      });

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        rasgos: [rasgoEnvenenador]
      };

      const extra = obtenerCompetenciasExtraRasgos(pj);
      expect(extra.herramientas).toContain("Útiles de envenenador");

      const efectivas = obtenerCompetenciasEfectivasTexto(pj);
      expect(efectivas.herramientasLista).toContain("Útiles de envenenador");
      expect(efectivas.herramientasTexto).toContain("Útiles de envenenador");
    });

    it("no debe duplicar herramientas si el personaje ya tenía una variante sinónima", () => {
      const rasgoEnvenenador = crearRasgo({
        id: "dote_envenenador",
        nombre: "Envenenador",
        efectos: [
          {
            tipo: "competencia",
            objetivo: "herramientas",
            valor: "Útiles de envenenador",
            descripcion: "Competencia con útiles de envenenador"
          }
        ]
      });

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        herramientasLista: ["Kit de venenos"],
        herramientas: "Kit de venenos",
        rasgos: [rasgoEnvenenador]
      };

      const efectivas = obtenerCompetenciasEfectivasTexto(pj);
      // Debe haber exactamente 1 elemento en la lista debido a la deduplicación de alias
      expect(efectivas.herramientasLista).toHaveLength(1);
    });

    it("debe reflejar competencias de herramientas en calcularEstadisticasPersonaje", () => {
      const rasgoChef = crearRasgo({
        id: "dote_chef",
        nombre: "Chef",
        efectos: [
          {
            tipo: "competencia",
            objetivo: "herramientas",
            valor: "Útiles de cocinero",
            descripcion: "Competencia con útiles de cocinero"
          }
        ]
      });

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        rasgos: [rasgoChef]
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.competenciasEfectivas.herramientasTexto).toContain("Útiles de cocinero");
      expect(stats.competenciasEfectivas.herramientasLista).toContain("Útiles de cocinero");
    });
  });
});
