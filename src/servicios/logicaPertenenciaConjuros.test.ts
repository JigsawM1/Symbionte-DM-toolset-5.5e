import { describe, it, expect } from "vitest";
import {
  expandirSetHechizos,
  crearClavesLookupHechizos,
  crearSetsPertenencia,
  verificarEnSet,
  crearPredicadosPertenencia,
  verificarHechizoDeSubclase,
  clasificarTipoAccion
} from "./logicaPertenenciaConjuros";
import type { PersonajeJugador, HechizoBase } from "@/tipos";

describe("logicaPertenenciaConjuros", () => {
  const hechizoEscudo: HechizoBase = {
    id: "h_escudo",
    nombre: "Escudo",
    nivel: 1,
    escuela: "Abjuración",
    tiempoLanzamiento: "1 reacción, que realizas cuando eres impactado por un ataque",
    alcance: "Personal",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "1 ronda",
    descripcion: "Una barrera invisible te protege.",
    ritual: false,
    concentracion: false,
    clases: ["Mago", "Hechicero"]
  };

  const hechizoPasoBrumoso: HechizoBase = {
    id: "h_paso_brumoso",
    nombre: "Paso brumoso",
    nivel: 2,
    escuela: "Conjuración",
    tiempoLanzamiento: "1 acción adicional",
    alcance: "Personal",
    componentesSeleccionados: { verbal: true, somatico: false, material: false },
    duracion: "Instantánea",
    descripcion: "Rodeado de niebla plateada, te teletransportas.",
    ritual: false,
    concentracion: false,
    clases: ["Hechicero", "Mago"]
  };

  const trucoLuz: HechizoBase = {
    id: "h_luz",
    nombre: "Luz",
    nivel: 0,
    escuela: "Evocación",
    tiempoLanzamiento: "1 acción",
    alcance: "Contacto",
    componentesSeleccionados: { verbal: true, somatico: false, material: true },
    duracion: "1 hora",
    descripcion: "Haces que un objeto emita luz brillante.",
    ritual: false,
    concentracion: false,
    clases: ["Clérigo", "Mago"]
  };

  describe("clasificarTipoAccion", () => {
    it("clasifica acciones normales", () => {
      expect(clasificarTipoAccion("1 acción")).toBe("accion");
      expect(clasificarTipoAccion("1 action")).toBe("accion");
    });

    it("clasifica acciones adicionales / bonus", () => {
      expect(clasificarTipoAccion("1 acción adicional")).toBe("accionAdicional");
      expect(clasificarTipoAccion("1 bonus action")).toBe("accionAdicional");
    });

    it("clasifica reacciones", () => {
      expect(clasificarTipoAccion("1 reacción, cuando recibes daño")).toBe("reaccion");
      expect(clasificarTipoAccion("1 reaccion")).toBe("reaccion");
    });
  });

  describe("expandirSetHechizos y verificarEnSet", () => {
    it("expande variantes normalizadas, slugs y alias", () => {
      const set = expandirSetHechizos(["Curar heridas"]);
      expect(set.has("Curar heridas")).toBe(true);
      expect(set.has("curar heridas")).toBe(true);
      expect(set.has("h_curar_heridas")).toBe(true);
    });

    it("verificarEnSet funciona con y sin mapa de lookup", () => {
      const set = expandirSetHechizos(["h_escudo"]);
      expect(verificarEnSet(set, "h_escudo")).toBe(true);
      expect(verificarEnSet(set, "Escudo")).toBe(true);
      expect(verificarEnSet(set, "h_otra_cosa")).toBe(false);

      const lookup = crearClavesLookupHechizos([hechizoEscudo]);
      expect(verificarEnSet(set, "h_escudo", lookup)).toBe(true);
    });
  });

  describe("crearPredicadosPertenencia - Diferencia crucial Preparados vs Conocidos", () => {
    const baseDatos = [trucoLuz, hechizoEscudo, hechizoPasoBrumoso];
    const clavesLookup = crearClavesLookupHechizos(baseDatos);

    it("modelo 'preparados': si un conjuro está conocido pero no preparado, NO está en lista", () => {
      const sets = {
        setPreparadosIds: expandirSetHechizos([]), // Nada preparado
        setConocidosIds: expandirSetHechizos(["h_escudo"]), // Pero está en conocidos
        setTrucosIds: expandirSetHechizos([]),
        setSiemprePreparados: expandirSetHechizos([])
      };

      const predicados = crearPredicadosPertenencia({
        sets,
        clavesLookup,
        modelo: "preparados",
        resolutorOrigen: () => null
      });

      // En modelo preparados, el conjuro conocido sin preparar debe ser rechazado
      expect(predicados.estaEnLista(hechizoEscudo)).toBe(false);
      expect(predicados.estaPreparado(hechizoEscudo)).toBe(false);
    });

    it("modelo 'conocidos': si un conjuro está conocido, SI está en lista", () => {
      const sets = {
        setPreparadosIds: expandirSetHechizos([]),
        setConocidosIds: expandirSetHechizos(["h_escudo"]),
        setTrucosIds: expandirSetHechizos([]),
        setSiemprePreparados: expandirSetHechizos([])
      };

      const predicados = crearPredicadosPertenencia({
        sets,
        clavesLookup,
        modelo: "conocidos",
        resolutorOrigen: () => null
      });

      expect(predicados.estaEnLista(hechizoEscudo)).toBe(true);
    });

    it("conjuros otorgados por subclase/rasgos siempre están preparados y en lista", () => {
      const sets = {
        setPreparadosIds: expandirSetHechizos([]),
        setConocidosIds: expandirSetHechizos([]),
        setTrucosIds: expandirSetHechizos([]),
        setSiemprePreparados: expandirSetHechizos(["h_paso_brumoso"])
      };

      const predicados = crearPredicadosPertenencia({
        sets,
        clavesLookup,
        modelo: "preparados",
        resolutorOrigen: () => null
      });

      expect(predicados.esHechizoDeSubclase(hechizoPasoBrumoso)).toBe(true);
      expect(predicados.esHechizoOtorgado(hechizoPasoBrumoso)).toBe(true);
      expect(predicados.estaPreparado(hechizoPasoBrumoso)).toBe(true);
      expect(predicados.estaEnLista(hechizoPasoBrumoso)).toBe(true);
    });

    it("trucos conocidos están siempre preparados y en lista", () => {
      const sets = {
        setPreparadosIds: expandirSetHechizos([]),
        setConocidosIds: expandirSetHechizos([]),
        setTrucosIds: expandirSetHechizos(["h_luz"]),
        setSiemprePreparados: expandirSetHechizos([])
      };

      const predicados = crearPredicadosPertenencia({
        sets,
        clavesLookup,
        modelo: "preparados",
        resolutorOrigen: () => null
      });

      expect(predicados.estaPreparado(trucoLuz)).toBe(true);
      expect(predicados.estaEnLista(trucoLuz)).toBe(true);
    });
  });

  describe("verificarHechizoDeSubclase", () => {
    it("retorna false si personaje o hechizo son nulos", () => {
      expect(verificarHechizoDeSubclase(hechizoEscudo, null)).toBe(false);
    });

    it("retorna true si el hechizo está en conjurosSiemprePreparadosIds", () => {
      const pj: Partial<PersonajeJugador> = {
        id: "pj-1",
        nombre: "Clérigo",
        clase: "Clérigo",
        nivel: 3,
        conjurosSiemprePreparadosIds: ["h_escudo"]
      };

      expect(verificarHechizoDeSubclase(hechizoEscudo, pj as PersonajeJugador)).toBe(true);
      expect(verificarHechizoDeSubclase(hechizoPasoBrumoso, pj as PersonajeJugador)).toBe(false);
    });
  });

  describe("crearSetsPertenencia", () => {
    it("crea sets vacíos para personaje nulo", () => {
      const sets = crearSetsPertenencia(null);
      expect(sets.setPreparadosIds.size).toBe(0);
      expect(sets.setConocidosIds.size).toBe(0);
      expect(sets.setTrucosIds.size).toBe(0);
      expect(sets.setSiemprePreparados.size).toBe(0);
    });

    it("crea sets con IDs expandidos a partir de la ficha", () => {
      const pj: Partial<PersonajeJugador> = {
        id: "pj-sets",
        conjurosPreparadosIds: ["h_escudo"],
        conjurosConocidosIds: ["h_paso_brumoso"],
        trucosConocidosIds: ["h_luz"],
        conjurosSiemprePreparadosIds: ["Bendición"]
      };

      const sets = crearSetsPertenencia(pj as PersonajeJugador);
      expect(sets.setPreparadosIds.has("h_escudo")).toBe(true);
      expect(sets.setConocidosIds.has("h_paso_brumoso")).toBe(true);
      expect(sets.setTrucosIds.has("h_luz")).toBe(true);
      expect(sets.setSiemprePreparados.has("h_bendicion")).toBe(true);
    });
  });
});
