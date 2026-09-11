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

  describe("Bono Numérico de Daño a Ataques con Bono de Competencia (+PB) - Revelación Celestial y Builder", () => {
    it("debe sumar +PB (2 a nivel 3) al daño numérico directo cuando el rasgo está activo", () => {
      const pjAsimarNv3: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 3,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 16 }, // Mod +3
        rasgos: [
          {
            id: "rasgo_esp_aasimar_revelacion_celestial",
            nombre: "Revelación celestial",
            descripcion: "Añade +PB al daño de ataques y conjuros",
            origen: "especie",
            fuente: "Especie: Asimar",
            tipoAccion: "accion_adicional",
            tieneUsosLimitados: true,
            usosMaximos: 1,
            usosRestantes: 0,
            recuperacion: "descanso_largo",
            personalizado: false,
            activo: true,
            esActivable: true,
            notas: "",
            efectos: [
              {
                tipo: "bono_dano_ataque",
                objetivo: "todos_ataques",
                valor: "bono_competencia",
                aplicaA: "todos_ataques",
                descripcion: "Revelación celestial (+PB daño en ataques)"
              }
            ]
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pjAsimarNv3);
      expect(stats.bonoCompetencia).toBe(2);

      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjAsimarNv3,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Modificador total: 3 (Fuerza) + 2 (PB de Revelación celestial) = 5
      expect(resultado.modDanoTotal).toBe(5);

      // Composición de fórmula directa al arma (ej. espada larga 1d8)
      const { formulaDano } = componerFormulasDano("1d8", resultado.modDanoTotal, resultado.dadosExtra, resultado.danosSecundarios);
      expect(formulaDano).toBe("1d8+5");
    });

    it("debe escalar a +PB (4 a nivel 9) y aplicar también a armas a distancia", () => {
      const pjAsimarNv9: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 9,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, destreza: 18 }, // Mod +4
        rasgos: [
          {
            id: "rasgo_esp_aasimar_revelacion_celestial",
            nombre: "Revelación celestial",
            descripcion: "Añade +PB al daño de ataques y conjuros",
            origen: "especie",
            fuente: "Especie: Asimar",
            tipoAccion: "accion_adicional",
            tieneUsosLimitados: true,
            usosMaximos: 1,
            usosRestantes: 0,
            recuperacion: "descanso_largo",
            personalizado: false,
            activo: true,
            esActivable: true,
            notas: "",
            efectos: [
              {
                tipo: "bono_dano_ataque",
                objetivo: "todos_ataques",
                valor: "bono_competencia",
                aplicaA: "todos_ataques",
                descripcion: "Revelación celestial (+PB daño en ataques)"
              }
            ]
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pjAsimarNv9);
      expect(stats.bonoCompetencia).toBe(4);

      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjAsimarNv9,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "destreza", esCuerpoACuerpo: false, esDistancia: true },
        caracUsada: "destreza",
        modAtributo: 4,
        bonoMagico: 1, // Arco +1
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Modificador total: 4 (Destreza) + 1 (Mágico) + 4 (PB) = 9
      expect(resultado.modDanoTotal).toBe(9);

      const { formulaDano } = componerFormulasDano("1d6", resultado.modDanoTotal, resultado.dadosExtra, resultado.danosSecundarios);
      expect(formulaDano).toBe("1d6+9");
    });

    it("no debe aplicar bono si el rasgo está desactivado (activo: false)", () => {
      const pjInactivo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 3,
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 16 },
        rasgos: [
          {
            id: "rasgo_esp_aasimar_revelacion_celestial",
            nombre: "Revelación celestial",
            descripcion: "Añade +PB al daño de ataques y conjuros",
            origen: "especie",
            fuente: "Especie: Asimar",
            tipoAccion: "accion_adicional",
            tieneUsosLimitados: true,
            usosMaximos: 1,
            usosRestantes: 1,
            recuperacion: "descanso_largo",
            personalizado: false,
            activo: false,
            esActivable: true,
            notas: "",
            efectos: [
              {
                tipo: "bono_dano_ataque",
                objetivo: "todos_ataques",
                valor: "bono_competencia",
                aplicaA: "todos_ataques",
                descripcion: "Revelación celestial (+PB daño en ataques)"
              }
            ]
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pjInactivo);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjInactivo,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Modificador solo el atributo (3), sin bono de PB
      expect(resultado.modDanoTotal).toBe(3);
    });

    it("debe admitir tokens alternativos 'pb' y 'bc' creados desde el Builder", () => {
      const pjBuilder: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 5, // PB = 3
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 14 }, // Mod +2
        rasgos: [
          {
            id: "rasgo_homebrew_poder_divino",
            nombre: "Poder Divino Personalizado",
            descripcion: "Homebrew",
            origen: "personalizado",
            fuente: "Personalizado",
            tipoAccion: "pasivo",
            tieneUsosLimitados: false,
            recuperacion: "ninguno",
            personalizado: true,
            activo: true,
            esActivable: false,
            notas: "",
            efectos: [
              {
                tipo: "bono_dano_ataque",
                objetivo: "todos_ataques",
                valor: "pb",
                aplicaA: "todos_ataques",
                descripcion: "Bono PB"
              }
            ]
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pjBuilder);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjBuilder,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "desarmado", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 2,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Modificador: 2 (Fuerza) + 3 (PB de nivel 5) = 5
      expect(resultado.modDanoTotal).toBe(5);
    });

    it("debe aplicar +PB al daño de ataque cuando el usuario se aplica la condición 'Alas Celestiales' directamente (Barra Táctica)", () => {
      const pjConCondicion: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 5, // PB = 3
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 16 }, // Mod +3
        condicionesActivas: ["Alas Celestiales"],
        rasgos: [] // Sin rasgo explícito o sin efectos configurados
      };

      const stats = calcularEstadisticasPersonaje(pjConCondicion);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjConCondicion,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Modificador: 3 (Fuerza) + 3 (PB por Alas Celestiales) = 6
      expect(resultado.modDanoTotal).toBe(6);

      const { formulaDano } = componerFormulasDano("1d8", resultado.modDanoTotal, resultado.dadosExtra, resultado.danosSecundarios);
      expect(formulaDano).toBe("1d8+6");
    });

    it("debe aplicar +PB al daño cuando el efecto 'Fulgor Interior' está en efectosActivos (Combat Tracker)", () => {
      const pjConEfecto: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 4, // PB = 2
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 14 }, // Mod +2
        efectosActivos: [
          {
            id: "ef_fulgor",
            nombre: "Fulgor Interior",
            expiraRonda: 10,
            concentracion: false
          }
        ],
        rasgos: []
      };

      const stats = calcularEstadisticasPersonaje(pjConEfecto);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjConEfecto,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 2,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Modificador: 2 (Fuerza) + 2 (PB por Fulgor Interior) = 4
      expect(resultado.modDanoTotal).toBe(4);
    });

    it("debe auto-hidratar y sumar +PB si el rasgo proviene de un snapshot antiguo de localStorage (sin efectos)", () => {
      const pjSnapshotAntiguo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 3, // PB = 2
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, fuerza: 16 }, // Mod +3
        condicionesActivas: ["Mortaja Necrótica"],
        rasgos: [
          {
            id: "rasgo_esp_aasimar_revelacion_celestial",
            nombre: "Revelación celestial",
            descripcion: "Añade +PB al daño de ataques y conjuros",
            origen: "especie",
            fuente: "Especie: Asimar",
            tipoAccion: "accion_adicional",
            tieneUsosLimitados: true,
            usosMaximos: 1,
            usosRestantes: 0,
            recuperacion: "descanso_largo",
            personalizado: false,
            activo: false, // Inactivo en el snapshot
            esActivable: true,
            notas: "",
            efectos: [] // Vacío como en el localStorage antiguo
          }
        ]
      };

      const stats = calcularEstadisticasPersonaje(pjSnapshotAntiguo);
      const resultado = resolverBonosYDadosExtraCombate({
        personajeActivo: pjSnapshotAntiguo,
        statsCalculadas: stats,
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Modificador: 3 (Fuerza) + 2 (PB por Revelación celestial activa) = 5
      expect(resultado.modDanoTotal).toBe(5);
    });
  });
});

