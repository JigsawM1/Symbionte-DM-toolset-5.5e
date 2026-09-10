import { describe, it, expect } from "vitest";
import {
  resolverBonosYDadosExtraCombate,
  componerFormulasDano
} from "./calculadorDanoCombate";
import { aplicarBuildClaseAPersonaje } from "./gestorClases";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador } from "@/tipos";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";

describe("Servicio Calculador de Daño en Combate (calculadorDanoCombate.ts)", () => {
  describe("Escalado Dinámico de Frenesí (2d6 -> 3d6 -> 4d6)", () => {
    it("debe otorgar 2d6 de daño extra a nivel 3-8 de Bárbaro Bersérker", () => {
      let pjNv3 = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 3, "Senda del Berserker");
      // Activar Furia, Ataque Temerario y Frenesí con Fuerza 18 (+4)
      pjNv3 = {
        ...pjNv3,
        caracteristicas: { ...pjNv3.caracteristicas, fuerza: 18 },
        condicionesActivas: ["Furia", "Ataque Temerario"],
        rasgos: (pjNv3.rasgos || []).map((r) =>
          r.nombre === "Frenesí" || r.nombre === "Furia" || r.nombre === "Ataque temerario"
            ? { ...r, activo: true }
            : r
        )
      };

      const stats = calcularEstadisticasPersonaje(pjNv3);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjNv3,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 4,
        bonoMagico: 0,
        furiaEstaActiva: true,
        yaIncluyeFuriaEnEfectos: true // El rasgo Furia ya aporta bono_dano_fuerza vía efectos
      });

      expect(resultado.dadosExtra).toContain("2d6");
      expect(resultado.modDanoTotal).toBe(6); // 4 (Fuerza) + 2 (Furia vía efectos)
    });

    it("debe otorgar 3d6 de daño extra a nivel 9-15 de Bárbaro Bersérker", () => {
      let pjNv9 = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 9, "Senda del Berserker");
      pjNv9 = {
        ...pjNv9,
        caracteristicas: { ...pjNv9.caracteristicas, fuerza: 18 },
        condicionesActivas: ["Furia", "Ataque Temerario"],
        rasgos: (pjNv9.rasgos || []).map((r) =>
          r.nombre === "Frenesí" || r.nombre === "Furia" || r.nombre === "Ataque temerario"
            ? { ...r, activo: true }
            : r
        )
      };

      const stats = calcularEstadisticasPersonaje(pjNv9);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjNv9,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 4,
        bonoMagico: 0,
        furiaEstaActiva: true,
        yaIncluyeFuriaEnEfectos: true
      });

      expect(resultado.dadosExtra).toContain("3d6");
      expect(resultado.modDanoTotal).toBe(7); // 4 (Fuerza) + 3 (Furia vía efectos)
    });

    it("debe otorgar 4d6 de daño extra a nivel 16-20 de Bárbaro Bersérker", () => {
      let pjNv16 = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 16, "Senda del Berserker");
      pjNv16 = {
        ...pjNv16,
        caracteristicas: { ...pjNv16.caracteristicas, fuerza: 20 },
        condicionesActivas: ["Furia", "Ataque Temerario"],
        rasgos: (pjNv16.rasgos || []).map((r) =>
          r.nombre === "Frenesí" || r.nombre === "Furia" || r.nombre === "Ataque temerario"
            ? { ...r, activo: true }
            : r
        )
      };

      const stats = calcularEstadisticasPersonaje(pjNv16);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjNv16,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 5,
        bonoMagico: 0,
        furiaEstaActiva: true,
        yaIncluyeFuriaEnEfectos: true
      });

      expect(resultado.dadosExtra).toContain("4d6");
      expect(resultado.modDanoTotal).toBe(9); // 5 (Fuerza) + 4 (Furia vía efectos)
    });
  });

  describe("Escalado Dinámico de Golpe Brutal (1d10 -> 2d10) y Desacoplamiento de Furia", () => {
    it("debe otorgar 1d10 de daño adicional a nivel 9-16 con ataque de Fuerza cuando Ataque Temerario y Golpe Brutal están activos (sin requerir Furia)", () => {
      let pjNv9 = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 9);
      // Ataque temerario y Golpe Brutal activos, pero Furia INACTIVA
      pjNv9 = {
        ...pjNv9,
        caracteristicas: { ...pjNv9.caracteristicas, fuerza: 18 },
        condicionesActivas: ["Ataque Temerario"],
        rasgos: (pjNv9.rasgos || []).map((r) =>
          r.nombre === "Golpe brutal" || r.nombre === "Ataque temerario" ? { ...r, activo: true } : r
        )
      };

      const stats = calcularEstadisticasPersonaje(pjNv9);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjNv9,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 4,
        bonoMagico: 0,
        furiaEstaActiva: false, // ¡Furia inactiva!
        yaIncluyeFuriaEnEfectos: false
      });

      expect(resultado.dadosExtra).toContain("1d10");
      expect(resultado.modDanoTotal).toBe(4); // Solo Fuerza, sin Furia
    });

    it("debe otorgar 2d10 de daño adicional a nivel 17-20 (Golpe Brutal Mejorado II)", () => {
      let pjNv17 = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 17);
      pjNv17 = {
        ...pjNv17,
        caracteristicas: { ...pjNv17.caracteristicas, fuerza: 20 },
        condicionesActivas: ["Ataque Temerario"],
        rasgos: (pjNv17.rasgos || []).map((r) =>
          r.nombre === "Golpe brutal" || r.nombre === "Ataque temerario" ? { ...r, activo: true } : r
        )
      };

      const stats = calcularEstadisticasPersonaje(pjNv17);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjNv17,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 5,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(resultado.dadosExtra).toContain("2d10");
      expect(resultado.dadosExtra).not.toContain("1d10"); // No duplicar
    });

    it("debe acumular Frenesí (3d6) y Golpe Brutal (1d10) simultáneamente en un Bersérker de nivel 9", () => {
      let pjNv9 = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 9, "Senda del Berserker");
      pjNv9 = {
        ...pjNv9,
        caracteristicas: { ...pjNv9.caracteristicas, fuerza: 18 },
        condicionesActivas: ["Furia", "Ataque Temerario"],
        rasgos: (pjNv9.rasgos || []).map((r) =>
          r.nombre === "Frenesí" || r.nombre === "Golpe brutal" || r.nombre === "Furia" || r.nombre === "Ataque temerario"
            ? { ...r, activo: true }
            : r
        )
      };

      const stats = calcularEstadisticasPersonaje(pjNv9);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjNv9,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 4,
        bonoMagico: 1, // Arma +1
        furiaEstaActiva: true,
        yaIncluyeFuriaEnEfectos: true
      });

      expect(resultado.dadosExtra).toContain("3d6");
      expect(resultado.dadosExtra).toContain("1d10");
      expect(resultado.modDanoTotal).toBe(8); // 4 (Fuerza) + 1 (Mágico) + 3 (Furia vía efectos)
    });
  });

  describe("Soporte Genérico para Rasgos Activables del Builder", () => {
    it("debe resolver formulaDados de un rasgo activable sin efectos mecánicos estructurados", () => {
      const pjConRasgoBuilder: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 16 },
        rasgos: [
          {
            id: "rasgo_homebrew_dano",
            nombre: "Poder Ancestral",
            descripcion: "Añade 1d8 de daño sagrado",
            fuente: "Homebrew",
            origen: "personalizado",
            tipoAccion: "pasivo",
            tieneUsosLimitados: false,
            recuperacion: "ninguno",
            personalizado: true,
            activo: true,
            esActivable: true,
            formulaDados: "1d8",
            efectos: [],
            notas: ""
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pjConRasgoBuilder);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjConRasgoBuilder,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(resultado.dadosExtra).toContain("1d8");
    });
  });

  describe("Composición de Fórmulas de Daño (componerFormulasDano)", () => {
    it("debe componer correctamente fórmula con dados extra y daño secundario", () => {
      const { dadoDanoTotalBase, formulaDano } = componerFormulasDano(
        "1d12",
        7,
        ["3d6", "1d10"],
        ["1d6+4"]
      );

      expect(dadoDanoTotalBase).toBe("1d12+3d6+1d10/1d6+4");
      expect(formulaDano).toBe("1d12+3d6+1d10+7/1d6+4");
    });
  });
});
