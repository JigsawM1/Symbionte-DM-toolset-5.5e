import { describe, it, expect } from "vitest";
import {
  formatearResumenCompetenciasArmas,
  formatearResumenCompetenciasArmaduras,
  esCompetenteConArma,
  esCompetenteConArmadura,
  obtenerNivelPorExperiencia,
  obtenerExperienciaMinimaPorNivel,
  PERSONAJE_POR_DEFECTO
} from "@/constantes";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import type { PersonajeJugador } from "@/tipos";

describe("Competencias y Diccionarios D&D 5.5e", () => {
  describe("formatearResumenCompetenciasArmas", () => {
    it("debe resumir grupos maestros de armas simples y marciales", () => {
      const resumen = formatearResumenCompetenciasArmas(["sencillas", "marciales"], ["Daga", "Espada larga"]);
      expect(resumen).toBe("Armas sencillas, Armas marciales");
    });

    it("debe incluir armas individuales si no están cubiertas por grupos", () => {
      const resumen = formatearResumenCompetenciasArmas(["sencillas"], ["Espada larga", "Mosquete (Arma de fuego)"]);
      expect(resumen).toBe("Armas sencillas, Espada larga, Mosquete (Arma de fuego)");
    });

    it("debe retornar 'Ninguna' si no hay selecciones", () => {
      expect(formatearResumenCompetenciasArmas([], [])).toBe("Ninguna");
    });
  });

  describe("formatearResumenCompetenciasArmaduras", () => {
    it("debe resumir categorías de armaduras", () => {
      const resumen = formatearResumenCompetenciasArmaduras(["ligeras", "escudos"], ["Armadura de cuero"]);
      expect(resumen).toBe("Armaduras ligeras, Escudos");
    });

    it("debe incluir armaduras individuales exóticas", () => {
      const resumen = formatearResumenCompetenciasArmaduras([], ["Coraza", "Escudo"]);
      expect(resumen).toBe("Coraza, Escudo");
    });
  });

  describe("esCompetenteConArma", () => {
    it("debe retornar true si el personaje tiene el grupo 'sencillas' y el arma es sencilla", () => {
      expect(esCompetenteConArma("Daga", "Sencilla", ["sencillas"], [])).toBe(true);
    });

    it("debe retornar true si el personaje tiene el grupo 'marciales' y el arma es marcial", () => {
      expect(esCompetenteConArma("Espadón", "Marcial", ["marciales"], [])).toBe(true);
    });

    it("debe retornar true si el arma está en la lista individual aunque no tenga el grupo", () => {
      expect(esCompetenteConArma("Estoque", "Marcial", ["sencillas"], ["Estoque"])).toBe(true);
    });

    it("debe retornar false si no tiene el grupo ni el arma individual", () => {
      expect(esCompetenteConArma("Alabarda", "Marcial", ["sencillas"], ["Daga"])).toBe(false);
    });
  });

  describe("esCompetenteConArmadura", () => {
    it("debe validar competencia por categoría de armadura", () => {
      expect(esCompetenteConArmadura("Armadura de cuero", "Ligera", ["ligeras"], [])).toBe(true);
      expect(esCompetenteConArmadura("Cota de malla", "Pesada", ["ligeras", "medias"], [])).toBe(false);
    });

    it("debe validar competencia por armadura individual", () => {
      expect(esCompetenteConArmadura("Escudo", "Escudo", [], ["Escudo"])).toBe(true);
    });
  });

  describe("Sincronización de Experiencia y Nivel", () => {
    it("debe calcular el nivel correcto a partir de la experiencia acumulada", () => {
      expect(obtenerNivelPorExperiencia(0)).toBe(1);
      expect(obtenerNivelPorExperiencia(299)).toBe(1);
      expect(obtenerNivelPorExperiencia(300)).toBe(2);
      expect(obtenerNivelPorExperiencia(6500)).toBe(5);
      expect(obtenerNivelPorExperiencia(14000)).toBe(6);
      expect(obtenerNivelPorExperiencia(355000)).toBe(20);
      expect(obtenerNivelPorExperiencia(999999)).toBe(20);
    });

    it("debe obtener la experiencia mínima por nivel", () => {
      expect(obtenerExperienciaMinimaPorNivel(1)).toBe(0);
      expect(obtenerExperienciaMinimaPorNivel(5)).toBe(6500);
      expect(obtenerExperienciaMinimaPorNivel(20)).toBe(355000);
    });
  });

  describe("Cálculo de Estadísticas con Habilidades Personalizadas", () => {
    it("debe aplicar modificadores adicionales a las habilidades", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, destreza: 14 }, // mod +2
        gradosHabilidades: { ...PERSONAJE_POR_DEFECTO.gradosHabilidades, acrobacias: "competente" }, // PB +2
        personalizacionesHabilidades: {
          acrobacias: {
            modificadorExtra: 3,
            valorFijo: null,
            notas: "Bono de calzado mágico"
          }
        }
      };

      const stats = calcularEstadisticasPersonaje(pj);
      // Modificador Destreza (+2) + Competente (+2) + Extra (+3) = 7
      expect(stats.habilidades.acrobacias).toBe(7);
    });

    it("debe respetar un valor fijo (override) en una habilidad", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 10 },
        personalizacionesHabilidades: {
          persuasion: {
            modificadorExtra: 0,
            valorFijo: 15,
            notas: "Fijado por pacto"
          }
        }
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.habilidades.persuasion).toBe(15);
    });
  });

  describe("Características y Salvaciones D&D 5.5e", () => {
    it("debe calcular correctamente modificador base y de override fijo", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 5, // PB +3
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 14 }, // Base: 14 (+2)
        overridesFijos: { ...PERSONAJE_POR_DEFECTO.overridesFijos, fuerza: 19 }, // Override: 19 (+4)
        competenciasSalvacion: { ...PERSONAJE_POR_DEFECTO.competenciasSalvacion, fuerza: true }
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.modificadores.fuerza).toBe(4); // (19 - 10) / 2 = 4
      expect(stats.salvaciones.fuerza).toBe(7); // Mod (+4) + PB (+3) = 7
    });

    it("debe calcular salvación sin competencia usando solo el modificador", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 1, // PB +2
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, destreza: 16 }, // Mod: +3
        competenciasSalvacion: { ...PERSONAJE_POR_DEFECTO.competenciasSalvacion, destreza: false }
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.modificadores.destreza).toBe(3);
      expect(stats.salvaciones.destreza).toBe(3);
    });
  });

  describe("Penalización por Armadura sin Competencia (D&D 5.5e)", () => {
    it("debe detectar penalización cuando viste armadura pesada sin tener la competencia", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        competenciasArmadurasGrupos: ["ligeras"],
        inventario: [
          {
            idInstancia: "item-1",
            idObjeto: "cota-malla",
            nombre: "Cota de malla",
            tipoPrincipal: "Armadura",
            cantidad: 1,
            equipado: true,
            sintonizado: false,
            notas: "",
            pesoLb: 55,
            esMagico: false,
            rareza: "Común",
            equipable: true,
            sintonizacionRequerida: false
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.penalizacionArmadura.sinCompetencia).toBe(true);
      expect(stats.penalizacionArmadura.armaduraNoCompetente).toBe("Cota de malla");
      expect(stats.penalizacionArmadura.escudoNoCompetente).toBeNull();
    });

    it("debe detectar penalización cuando porta escudo sin competencia en escudos", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        competenciasArmadurasGrupos: ["ligeras", "medias"],
        inventario: [
          {
            idInstancia: "item-2",
            idObjeto: "escudo-1",
            nombre: "Escudo",
            tipoPrincipal: "Armadura",
            cantidad: 1,
            equipado: true,
            sintonizado: false,
            notas: "",
            pesoLb: 6,
            esMagico: false,
            rareza: "Común",
            equipable: true,
            sintonizacionRequerida: false
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.penalizacionArmadura.sinCompetencia).toBe(true);
      expect(stats.penalizacionArmadura.escudoNoCompetente).toBe("Escudo");
    });

    it("no debe aplicar penalización si tiene las competencias de armadura y escudo correspondientes", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        competenciasArmadurasGrupos: ["pesadas", "escudos"],
        inventario: [
          {
            idInstancia: "item-1",
            idObjeto: "placas-1",
            nombre: "Armadura de placas",
            tipoPrincipal: "Armadura",
            cantidad: 1,
            equipado: true,
            sintonizado: false,
            notas: "",
            pesoLb: 65,
            esMagico: false,
            rareza: "Común",
            equipable: true,
            sintonizacionRequerida: false
          },
          {
            idInstancia: "item-2",
            idObjeto: "escudo-1",
            nombre: "Escudo",
            tipoPrincipal: "Armadura",
            cantidad: 1,
            equipado: true,
            sintonizado: false,
            notas: "",
            pesoLb: 6,
            esMagico: false,
            rareza: "Común",
            equipable: true,
            sintonizacionRequerida: false
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.penalizacionArmadura.sinCompetencia).toBe(false);
      expect(stats.penalizacionArmadura.armaduraNoCompetente).toBeNull();
      expect(stats.penalizacionArmadura.escudoNoCompetente).toBeNull();
    });
  });

  describe("Desventaja en Sigilo por Armaduras Oficiales (D&D 5.5e)", () => {
    it("debe activar desventajaSigiloArmadura al equipar armadura de placas o cota de malla", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        inventario: [
          {
            idInstancia: "item-1",
            idObjeto: "placas-1",
            nombre: "Armadura de placas",
            tipoPrincipal: "Armadura",
            cantidad: 1,
            equipado: true,
            sintonizado: false,
            notas: "",
            pesoLb: 65,
            esMagico: false,
            rareza: "Común",
            equipable: true,
            sintonizacionRequerida: false
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.desventajaSigiloArmadura).toBe(true);
      expect(stats.claseArmadura.desventajaSigilo).toBe(true);
    });

    it("no debe activar desventajaSigiloArmadura con armadura de cuero o coraza", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        inventario: [
          {
            idInstancia: "item-1",
            idObjeto: "coraza-1",
            nombre: "Coraza",
            tipoPrincipal: "Armadura",
            cantidad: 1,
            equipado: true,
            sintonizado: false,
            notas: "",
            pesoLb: 20,
            esMagico: false,
            rareza: "Común",
            equipable: true,
            sintonizacionRequerida: false
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pj);
      expect(stats.desventajaSigiloArmadura).toBe(false);
      expect(stats.claseArmadura.desventajaSigilo).toBe(false);
    });
  });
});

