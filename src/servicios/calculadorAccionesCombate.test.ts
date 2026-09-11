import { describe, it, expect } from "vitest";
import { resolverConjurosAcciones, verificarHechizoDeSubclase } from "./calculadorAccionesCombate";
import { aplicarEspecieAPersonaje } from "./gestorEspecies";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import type { HechizoBase, PersonajeJugador } from "@/tipos";

describe("calculadorAccionesCombate - Resolución de Conjuros en Acciones de Combate", () => {
  it("resuelve trucos innatos de especie para Aasimar a nivel 1 (Luz)", () => {
    const pjAasimar = aplicarEspecieAPersonaje(
      { ...PERSONAJE_POR_DEFECTO, nivel: 1 },
      { especieId: "aasimar" }
    );

    const accionesMagicas = resolverConjurosAcciones(pjAasimar, HECHIZOS_INICIALES);
    const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

    expect(nombres).toContain("luz");
    const luz = accionesMagicas.find((a) => a.hechizo.nombre.toLowerCase() === "luz");
    expect(luz?.tipoAccion).toBe("accion");
  });

  describe("Alto Elfo - Desbloqueo progresivo de conjuros de linaje por nivel", () => {
    it("a nivel 1 solo tiene disponible el truco de mago (Prestidigitación)", () => {
      const pj = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 1 },
        { especieId: "elfo", subespecieId: "alto_elfo" }
      );

      const accionesMagicas = resolverConjurosAcciones(pj, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("prestidigitación");
      expect(nombres).not.toContain("detectar magia");
      expect(nombres).not.toContain("paso brumoso");
    });

    it("a nivel 3 desbloquea Detectar magia pero aún no Paso brumoso", () => {
      const pj = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 3 },
        { especieId: "elfo", subespecieId: "alto_elfo" }
      );

      const accionesMagicas = resolverConjurosAcciones(pj, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("prestidigitación");
      expect(nombres).toContain("detectar magia");
      expect(nombres).not.toContain("paso brumoso");

      const detectar = accionesMagicas.find((a) => a.hechizo.nombre.toLowerCase() === "detectar magia");
      expect(detectar?.tipoAccion).toBe("accion");
    });

    it("a nivel 5 desbloquea Paso brumoso como acción adicional", () => {
      const pj = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 5 },
        { especieId: "elfo", subespecieId: "alto_elfo" }
      );

      const accionesMagicas = resolverConjurosAcciones(pj, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("prestidigitación");
      expect(nombres).toContain("detectar magia");
      expect(nombres).toContain("paso brumoso");

      const pasoBrumoso = accionesMagicas.find((a) => a.hechizo.nombre.toLowerCase() === "paso brumoso");
      expect(pasoBrumoso?.tipoAccion).toBe("accionAdicional");
    });

    it("respeta el truco seleccionado en el selector de rasgo si se modifica", () => {
      const pj = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 1 },
        { especieId: "elfo", subespecieId: "alto_elfo" }
      );

      // Simular cambio del selector de truco a Rayo de fuego
      const rasgosModificados = (pj.rasgos || []).map((r) => {
        if (r.selectores?.some((s) => s.id === "selector_truco_alto_elfo")) {
          return {
            ...r,
            conjurosOtorgados: ["descarga_de_fuego"],
            selectores: r.selectores.map((s) =>
              s.id === "selector_truco_alto_elfo" ? { ...s, valorActual: ["descarga_de_fuego"] } : s
            )
          };
        }
        return r;
      });

      const pjPersonalizado: PersonajeJugador = {
        ...pj,
        trucosConocidosIds: ["descarga_de_fuego"],
        rasgos: rasgosModificados
      };

      const accionesMagicas = resolverConjurosAcciones(pjPersonalizado, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("descarga de fuego");
    });
  });

  describe("Drow - Desbloqueo progresivo", () => {
    it("a nivel 3 contiene Luces danzantes y Fuego feérico, pero no Oscuridad", () => {
      const pjDrow = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 3 },
        { especieId: "elfo", subespecieId: "drow" }
      );

      const accionesMagicas = resolverConjurosAcciones(pjDrow, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("luces danzantes");
      expect(nombres).toContain("fuego feérico");
      expect(nombres).not.toContain("oscuridad");
    });

    it("a nivel 5 desbloquea Oscuridad", () => {
      const pjDrow = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 5 },
        { especieId: "elfo", subespecieId: "drow" }
      );

      const accionesMagicas = resolverConjurosAcciones(pjDrow, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("luces danzantes");
      expect(nombres).toContain("fuego feérico");
      expect(nombres).toContain("oscuridad");
    });
  });

  describe("Clasificación de economía de acciones", () => {
    it("clasifica correctamente acciones, acciones adicionales y reacciones", () => {
      const hechizoReaccion: HechizoBase = {
        id: "h_escudo",
        nombre: "Escudo",
        nivel: 1,
        escuela: "Abjuración",
        tiempoLanzamiento: "1 reacción, que realizas cuando eres impactado por un ataque",
        alcance: "Personal",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        descripcion: "Un destello invisible de fuerza te protege.",
        duracion: "1 ronda",
        concentracion: false,
        ritual: false
      };

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        conjurosPreparadosIds: ["h_escudo"]
      };

      const res = resolverConjurosAcciones(pj, [hechizoReaccion]);
      expect(res).toHaveLength(1);
      expect(res[0].tipoAccion).toBe("reaccion");
    });
  });

  describe("verificarHechizoDeSubclase", () => {
    it("detecta hechizos de subclase mediante coincidencia flexible de ID y nombre", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Clérigo",
        subclase: "Dominio de la Vida",
        clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 }],
        nivel: 3
      };

      const hechizoBendicion: HechizoBase = {
        id: "h_bendicion",
        nombre: "Bendición",
        nivel: 1,
        escuela: "Encantamiento",
        tiempoLanzamiento: "1 acción",
        alcance: "30 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        descripcion: "Bendices hasta a tres criaturas.",
        duracion: "Concentración, hasta 1 minuto",
        concentracion: true,
        ritual: false
      };

      expect(verificarHechizoDeSubclase(hechizoBendicion, pj)).toBe(true);
    });
  });
});
