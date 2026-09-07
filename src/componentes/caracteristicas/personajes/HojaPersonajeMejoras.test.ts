import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { aplicarResultadoSalvacionMuerteEnEstado } from "@/utiles/lanzadorDados";
import type { PersonajeJugador } from "@/tipos";

describe("Mejoras de la Vista de Jugador (D&D 5.5e)", () => {
  const personajeTestId = "pj-test-mejoras";

  beforeEach(() => {
    const pjInicial: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: personajeTestId,
      nombre: "Mialee",
      clase: "Mago",
      nivel: 5,
      hpMaximo: 30,
      hpActual: 0,
      dadosGolpeTotal: 5,
      dadosGolpeRestantes: 5,
      tipoDadoGolpe: "d6",
      salvacionesMuerte: { exitos: 0, fallos: 0 },
      conjurosConocidosIds: ["bola-de-fuego", "escudo", "proyectil-magico"],
      conjurosPreparadosIds: ["bola-de-fuego", "escudo"]
    };

    usarAlmacenDM.setState({
      personajes: [pjInicial],
      idPersonajeActivo: personajeTestId
    });
  });

  describe("1. Tirada de Salvación de la Muerte (D&D 5.5e)", () => {
    it("con 1 natural en el dado añade exactamente 2 fallos de muerte", () => {
      aplicarResultadoSalvacionMuerteEnEstado(personajeTestId, 1);
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.salvacionesMuerte.fallos).toBe(2);
      expect(pj?.salvacionesMuerte.exitos).toBe(0);
    });

    it("con 20 natural en el dado otorga 3 éxitos automáticos y +1 HP", () => {
      aplicarResultadoSalvacionMuerteEnEstado(personajeTestId, 20);
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.salvacionesMuerte.exitos).toBe(3);
      expect(pj?.salvacionesMuerte.fallos).toBe(0);
      expect(pj?.hpActual).toBe(1);
    });

    it("con resultado entre 10 y 19 añade 1 éxito", () => {
      aplicarResultadoSalvacionMuerteEnEstado(personajeTestId, 14);
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.salvacionesMuerte.exitos).toBe(1);
      expect(pj?.salvacionesMuerte.fallos).toBe(0);
    });

    it("con resultado entre 2 y 9 añade 1 fallo", () => {
      aplicarResultadoSalvacionMuerteEnEstado(personajeTestId, 7);
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.salvacionesMuerte.fallos).toBe(1);
      expect(pj?.salvacionesMuerte.exitos).toBe(0);
    });
  });

  describe("2. Dados de Golpe Editables Inline", () => {
    it("permite cambiar la cantidad de dados de golpe restantes directamente", () => {
      const state = usarAlmacenDM.getState();
      state.establecerDadosGolpeRestantesPersonaje(personajeTestId, 3);
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.dadosGolpeRestantes).toBe(3);
    });

    it("limita el valor a los límites [0, dadosGolpeTotal]", () => {
      const state = usarAlmacenDM.getState();
      // Exceso por arriba
      state.establecerDadosGolpeRestantesPersonaje(personajeTestId, 10);
      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.dadosGolpeRestantes).toBe(5);

      // Exceso por abajo (negativo)
      state.establecerDadosGolpeRestantesPersonaje(personajeTestId, -2);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.dadosGolpeRestantes).toBe(0);
    });
  });

  describe("3. Descanso Corto sin Consumo Forzado de Dados de Golpe", () => {
    it("ejecuta descanso corto con 0 dados sin restar dados de golpe ni curar HP automáticamente", () => {
      const state = usarAlmacenDM.getState();
      const resultado = state.ejecutarDescansoPersonaje(personajeTestId, "corto", 0);

      expect(resultado).not.toBeNull();
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.dadosGolpeRestantes).toBe(5);
      expect(pj?.hpActual).toBe(0);
      expect(resultado?.acciones.some((a) => a.descripcion.includes("sin gastar dados de golpe"))).toBe(true);
    });

    it("ejecuta descanso largo recuperando HP al máximo, dados de golpe y restableciendo concentración", () => {
      const state = usarAlmacenDM.getState();
      state.establecerDadosGolpeRestantesPersonaje(personajeTestId, 1);
      const resultado = state.ejecutarDescansoPersonaje(personajeTestId, "largo");

      expect(resultado).not.toBeNull();
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.hpActual).toBe(30);
      expect(pj?.dadosGolpeRestantes).toBeGreaterThanOrEqual(3);
      expect(resultado?.acciones.length).toBeGreaterThan(0);
    });
  });

  describe("4. Despreparar Conjuros de la Hoja de Personaje", () => {
    it("elimina el conjuro de preparadosIds sin borrarlo de conocidosIds", () => {
      const state = usarAlmacenDM.getState();
      state.desprepararConjuroPersonaje(personajeTestId, "bola-de-fuego");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeTestId);
      expect(pj?.conjurosPreparadosIds).not.toContain("bola-de-fuego");
      expect(pj?.conjurosConocidosIds).toContain("bola-de-fuego");
      expect(pj?.conjurosPreparadosIds).toContain("escudo");
    });
  });
});
