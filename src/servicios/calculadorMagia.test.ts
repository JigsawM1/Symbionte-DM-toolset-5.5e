import { describe, it, expect } from "vitest";
import {
  calcularNivelLanzadorMulticlase,
  calcularEspaciosConjuro,
  calcularPuntosConjuro,
  calcularCDConjuros,
  calcularBonoAtaqueConjuro,
  calcularEspaciosPacto,
  obtenerCostePuntos,
  detectarTipoLanzador,
  calcularMaximosConjurosYTrucos,
  requiereSincronizacionSubclase,
  obtenerClasesListaMagicaPersonaje,
  obtenerNivelMaximoConjuroPorTipoClase,
  obtenerNivelesLanzablesPorClase,
  obtenerNivelesConjuroDisponiblesPersonaje,
  puedePersonajeLanzarHechizo
} from "./calculadorMagia";
import type { ClaseLanzadora, PersonajeJugador, HechizoBase } from "@/tipos";

describe("calculadorMagia - Reglas de Magia D&D 2024", () => {
  describe("calcularNivelLanzadorMulticlase", () => {
    it("debe calcular correctamente un lanzador completo mono-clase (Mago 5)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];
      expect(calcularNivelLanzadorMulticlase(clases)).toBe(5);
    });

    it("debe calcular correctamente un medio-lanzador mono-clase (Paladín 1 y Paladín 5)", () => {
      const paladin1: ClaseLanzadora[] = [
        { clase: "Paladín", nivel: 1, tipoLanzador: "medio", habilidadConjuro: "carisma", modeloConjuros: "preparados" }
      ];
      expect(calcularNivelLanzadorMulticlase(paladin1)).toBe(1);

      const paladin5: ClaseLanzadora[] = [
        { clase: "Paladín", nivel: 5, tipoLanzador: "medio", habilidadConjuro: "carisma", modeloConjuros: "preparados" }
      ];
      expect(calcularNivelLanzadorMulticlase(paladin5)).toBe(3);
    });

    it("debe calcular correctamente un tercio-lanzador mono-clase (Caballero Arcano 6)", () => {
      const caballero6: ClaseLanzadora[] = [
        { clase: "Guerrero", nivel: 6, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos" }
      ];
      expect(calcularNivelLanzadorMulticlase(caballero6)).toBe(2);
    });

    it("debe combinar correctamente multiclase mixta (Mago 4 + Caballero Arcano 6)", () => {
      const multiclase: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 4, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" },
        { clase: "Guerrero", nivel: 6, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos" }
      ];
      // Mago 4 + floor(6/3)=2 => Nivel lanzador 6
      expect(calcularNivelLanzadorMulticlase(multiclase)).toBe(6);
    });

    it("no debe sumar niveles de Magia de Pacto al nivel combinado", () => {
      const multiclaseBrujo: ClaseLanzadora[] = [
        { clase: "Clérigo", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" },
        { clase: "Brujo", nivel: 5, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      expect(calcularNivelLanzadorMulticlase(multiclaseBrujo)).toBe(3);
    });

    it("debe retornar 0 para listas vacías o clases no lanzadoras", () => {
      expect(calcularNivelLanzadorMulticlase([])).toBe(0);
      const noLanzador: ClaseLanzadora[] = [
        { clase: "Bárbaro", nivel: 5, tipoLanzador: "ninguno", habilidadConjuro: null, modeloConjuros: "ninguno" }
      ];
      expect(calcularNivelLanzadorMulticlase(noLanzador)).toBe(0);
    });
  });

  describe("calcularEspaciosConjuro", () => {
    it("debe devolver espacios correctos para lanzador nivel 1", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Clérigo", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" }
      ];
      const espacios = calcularEspaciosConjuro(clases);
      expect(espacios).toEqual({ "1": 2 });
    });

    it("debe devolver espacios correctos para lanzador nivel 5 (4 de nv1, 3 de nv2, 2 de nv3)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];
      const espacios = calcularEspaciosConjuro(clases);
      expect(espacios).toEqual({ "1": 4, "2": 3, "3": 2 });
    });

    it("debe respetar overrides manuales definidos por el usuario", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];
      const overrides = { "1": 5, "3": 0 }; // 5 de nivel 1, y quita los de nivel 3
      const espacios = calcularEspaciosConjuro(clases, overrides);
      expect(espacios).toEqual({ "1": 5, "2": 3 });
    });
  });

  describe("calcularPuntosConjuro", () => {
    it("debe calcular puntos y nivel máximo para lanzador nivel 5 (27 pts, max nv3)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Hechicero", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      const resultado = calcularPuntosConjuro(clases);
      expect(resultado).toEqual({ puntosMaximos: 27, nivelMaximo: 3 });
    });

    it("debe permitir override de puntos totales", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Hechicero", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      const resultado = calcularPuntosConjuro(clases, 40);
      expect(resultado).toEqual({ puntosMaximos: 40, nivelMaximo: 3 });
    });
  });

  describe("calcularCDConjuros y calcularBonoAtaqueConjuro", () => {
    it("debe calcular CD de salvación (8 + PB + Mod)", () => {
      // PB +3, Mod +4 => 8 + 3 + 4 = 15
      expect(calcularCDConjuros(3, 4)).toBe(15);
      // PB +2, Mod -1 => 8 + 2 - 1 = 9
      expect(calcularCDConjuros(2, -1)).toBe(9);
    });

    it("debe calcular bono de ataque con conjuros (PB + Mod)", () => {
      // PB +3, Mod +4 => 3 + 4 = 7
      expect(calcularBonoAtaqueConjuro(3, 4)).toBe(7);
      // PB +2, Mod 0 => 2 + 0 = 2
      expect(calcularBonoAtaqueConjuro(2, 0)).toBe(2);
    });
  });

  describe("calcularEspaciosPacto", () => {
    it("debe calcular espacios de pacto del Brujo en niveles 1, 5, 11 y 17", () => {
      expect(calcularEspaciosPacto(1)).toEqual({ espacios: 1, nivel: 1 });
      expect(calcularEspaciosPacto(5)).toEqual({ espacios: 2, nivel: 3 });
      expect(calcularEspaciosPacto(11)).toEqual({ espacios: 3, nivel: 5 });
      expect(calcularEspaciosPacto(17)).toEqual({ espacios: 4, nivel: 5 });
    });
  });

  describe("obtenerCostePuntos", () => {
    it("debe devolver el coste en puntos según la tabla DMG", () => {
      expect(obtenerCostePuntos(1)).toBe(2);
      expect(obtenerCostePuntos(2)).toBe(3);
      expect(obtenerCostePuntos(3)).toBe(5);
      expect(obtenerCostePuntos(5)).toBe(7);
      expect(obtenerCostePuntos(9)).toBe(13);
      expect(obtenerCostePuntos(0)).toBe(0);
    });
  });

  describe("detectarTipoLanzador", () => {
    it("debe detectar clases estándar", () => {
      const mago = detectarTipoLanzador("Mago");
      expect(mago).toEqual({ tipo: "completo", habilidad: "inteligencia", modelo: "grimorio" });

      const clerigo = detectarTipoLanzador("Clérigo");
      expect(clerigo).toEqual({ tipo: "completo", habilidad: "sabiduria", modelo: "preparados" });

      const brujo = detectarTipoLanzador("Brujo");
      expect(brujo).toEqual({ tipo: "pacto", habilidad: "carisma", modelo: "conocidos" });
    });

    it("debe detectar subclases tercio-lanzadoras", () => {
      const caballero = detectarTipoLanzador("Guerrero", "Caballero Arcano");
      expect(caballero).toEqual({ tipo: "tercio", habilidad: "inteligencia", modelo: "conocidos", listaConjuros: "mago" });

      const embaucador = detectarTipoLanzador("Pícaro", "Embaucador Arcano");
      expect(embaucador).toEqual({ tipo: "tercio", habilidad: "inteligencia", modelo: "conocidos", listaConjuros: "mago" });
    });

    it("debe retornar null para clases no lanzadoras", () => {
      expect(detectarTipoLanzador("Bárbaro")).toBeNull();
      expect(detectarTipoLanzador("Monje")).toBeNull();
    });
  });

  describe("calcularMaximosConjurosYTrucos", () => {
    it("debe calcular máximos oficiales para Mago nivel 1 (3 trucos, 4 preparados)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];
      const maximos = calcularMaximosConjurosYTrucos(clases, 1, 3);
      expect(maximos).toEqual({
        maxTrucos: 3,
        maxConjuros: 4,
        modelo: "conocidos" // o preparados según la clase
      });
    });

    it("debe calcular máximos oficiales para Brujo nivel 5 (3 trucos, 6 conocidos)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Brujo", nivel: 5, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      const maximos = calcularMaximosConjurosYTrucos(clases, 5, 4);
      expect(maximos).toEqual({
        maxTrucos: 3,
        maxConjuros: 6,
        modelo: "conocidos"
      });
    });

    it("debe calcular máximos oficiales para Clérigo nivel 5 (4 trucos, 9 preparados)", () => {
      const clases: ClaseLanzadora[] = [
        { clase: "Clérigo", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" }
      ];
      const maximos = calcularMaximosConjurosYTrucos(clases, 5, 3);
      expect(maximos).toEqual({
        maxTrucos: 4,
        maxConjuros: 9,
        modelo: "preparados"
      });
    });

    it("debe sumar correctamente para multiclase (Mago 3 + Brujo 2)", () => {
      const multiclase: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" },
        { clase: "Brujo", nivel: 2, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];
      // Mago 3: 3 trucos, 6 preparados. Brujo 2: 2 trucos, 3 conocidos.
      // Total: 5 trucos, 9 conjuros
      const maximos = calcularMaximosConjurosYTrucos(multiclase, 5, 3);
      expect(maximos.maxTrucos).toBe(5);
      expect(maximos.maxConjuros).toBe(9);
    });

    it("debe retornar 0 para listas vacías", () => {
      expect(calcularMaximosConjurosYTrucos([])).toEqual({
        maxTrucos: 0,
        maxConjuros: 0,
        modelo: "preparados"
      });
    });
  });

  describe("requiereSincronizacionSubclase", () => {
    it("debe retornar false si el Pícaro Embaucador Arcano ya tiene Mano de mago y no tiene conjuros de nivel", () => {
      const pj = {
        id: "pj-picaro-1",
        clase: "Pícaro",
        subclase: "Embaucador Arcano",
        nivel: 3,
        conjurosSiemprePreparadosIds: [],
        trucosConocidosIds: ["Mano de mago"]
      } as unknown as PersonajeJugador;

      const resSubclase = { conjuros: [], trucos: ["Mano de mago"] };
      expect(requiereSincronizacionSubclase(pj, resSubclase)).toBe(false);
    });

    it("debe retornar true si le falta Mano de mago al Embaucador Arcano", () => {
      const pj = {
        id: "pj-picaro-2",
        clase: "Pícaro",
        subclase: "Embaucador Arcano",
        nivel: 3,
        conjurosSiemprePreparadosIds: [],
        trucosConocidosIds: []
      } as unknown as PersonajeJugador;

      const resSubclase = { conjuros: [], trucos: ["Mano de mago"] };
      expect(requiereSincronizacionSubclase(pj, resSubclase)).toBe(true);
    });

    it("debe retornar true si al Clérigo le falta alguno de sus conjuros siempre preparados", () => {
      const pj = {
        id: "pj-clerigo-1",
        clase: "Clérigo",
        subclase: "Vida",
        nivel: 3,
        conjurosSiemprePreparadosIds: ["Bendición"],
        trucosConocidosIds: []
      } as unknown as PersonajeJugador;

      const resSubclase = { conjuros: ["Bendición", "Curar heridas"], trucos: [] };
      expect(requiereSincronizacionSubclase(pj, resSubclase)).toBe(true);
    });
  });

  describe("obtenerClasesListaMagicaPersonaje", () => {
    it("debe incluir 'mago' para Pícaro con subclase Embaucador Arcano", () => {
      const pj = {
        id: "pj-embaucador",
        clase: "Pícaro",
        subclase: "Embaucador Arcano",
        nivel: 3,
        clasesLanzadoras: [
          { clase: "Pícaro", nivel: 3, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos", listaConjuros: "mago" }
        ]
      } as unknown as PersonajeJugador;

      const clases = obtenerClasesListaMagicaPersonaje(pj);
      expect(clases).toContain("pícaro");
      expect(clases).toContain("mago");
    });

    it("debe incluir 'mago' para Guerrero con subclase Caballero Arcano", () => {
      const pj = {
        id: "pj-caballero",
        clase: "Guerrero",
        subclase: "Caballero Arcano",
        nivel: 3,
        clasesLanzadoras: [
          { clase: "Guerrero", nivel: 3, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos", listaConjuros: "mago" }
        ]
      } as unknown as PersonajeJugador;

      const clases = obtenerClasesListaMagicaPersonaje(pj);
      expect(clases).toContain("guerrero");
      expect(clases).toContain("mago");
    });

    it("no debe incluir 'mago' para un Pícaro Asesino", () => {
      const pj = {
        id: "pj-asesino",
        clase: "Pícaro",
        subclase: "Asesino",
        nivel: 3,
        clasesLanzadoras: []
      } as unknown as PersonajeJugador;

      const clases = obtenerClasesListaMagicaPersonaje(pj);
      expect(clases).toEqual(["pícaro"]);
    });

    it("debe retornar array vacío para personaje nulo o indefinido", () => {
      expect(obtenerClasesListaMagicaPersonaje(null)).toEqual([]);
      expect(obtenerClasesListaMagicaPersonaje(undefined)).toEqual([]);
    });
  });

  describe("obtenerNivelMaximoConjuroPorTipoClase", () => {
    it("debe calcular correctamente lanzadores completos (Mago/Clérigo)", () => {
      expect(obtenerNivelMaximoConjuroPorTipoClase("completo", 1)).toBe(1);
      expect(obtenerNivelMaximoConjuroPorTipoClase("completo", 2)).toBe(1);
      expect(obtenerNivelMaximoConjuroPorTipoClase("completo", 3)).toBe(2);
      expect(obtenerNivelMaximoConjuroPorTipoClase("completo", 5)).toBe(3);
      expect(obtenerNivelMaximoConjuroPorTipoClase("completo", 17)).toBe(9);
      expect(obtenerNivelMaximoConjuroPorTipoClase("completo", 20)).toBe(9);
    });

    it("debe calcular correctamente medio-lanzadores en D&D 2024 (Paladín/Explorador)", () => {
      expect(obtenerNivelMaximoConjuroPorTipoClase("medio", 1)).toBe(1);
      expect(obtenerNivelMaximoConjuroPorTipoClase("medio", 4)).toBe(1);
      expect(obtenerNivelMaximoConjuroPorTipoClase("medio", 5)).toBe(2);
      expect(obtenerNivelMaximoConjuroPorTipoClase("medio", 9)).toBe(3);
      expect(obtenerNivelMaximoConjuroPorTipoClase("medio", 17)).toBe(5);
      expect(obtenerNivelMaximoConjuroPorTipoClase("medio", 20)).toBe(5);
    });

    it("debe calcular correctamente tercio-lanzadores (Caballero Arcano/Embaucador Arcano)", () => {
      expect(obtenerNivelMaximoConjuroPorTipoClase("tercio", 1)).toBe(0);
      expect(obtenerNivelMaximoConjuroPorTipoClase("tercio", 2)).toBe(0);
      expect(obtenerNivelMaximoConjuroPorTipoClase("tercio", 3)).toBe(1);
      expect(obtenerNivelMaximoConjuroPorTipoClase("tercio", 6)).toBe(1);
      expect(obtenerNivelMaximoConjuroPorTipoClase("tercio", 7)).toBe(2);
      expect(obtenerNivelMaximoConjuroPorTipoClase("tercio", 13)).toBe(3);
      expect(obtenerNivelMaximoConjuroPorTipoClase("tercio", 19)).toBe(4);
    });

    it("debe calcular correctamente magia de pacto de Brujo", () => {
      expect(obtenerNivelMaximoConjuroPorTipoClase("pacto", 1)).toBe(1);
      expect(obtenerNivelMaximoConjuroPorTipoClase("pacto", 3)).toBe(2);
      expect(obtenerNivelMaximoConjuroPorTipoClase("pacto", 5)).toBe(3);
      expect(obtenerNivelMaximoConjuroPorTipoClase("pacto", 9)).toBe(5);
      expect(obtenerNivelMaximoConjuroPorTipoClase("pacto", 20)).toBe(5);
    });
  });

  describe("obtenerNivelesLanzablesPorClase", () => {
    it("debe retornar trucos y niveles 1-2 para Mago nivel 3", () => {
      const niveles = obtenerNivelesLanzablesPorClase("completo", 3);
      expect(Array.from(niveles)).toEqual([0, 1, 2]);
    });

    it("debe retornar solo nivel 1 para Paladín nivel 1 sin trucos por defecto", () => {
      const niveles = obtenerNivelesLanzablesPorClase("medio", 1);
      expect(Array.from(niveles)).toEqual([1]);
    });

    it("debe incluir trucos para Paladín si tiene dote o estilo (opción tieneTrucos: true)", () => {
      const niveles = obtenerNivelesLanzablesPorClase("medio", 1, { tieneTrucos: true });
      expect(Array.from(niveles)).toEqual([0, 1]);
    });

    it("debe retornar conjunto vacío para tercio-lanzador a nivel 2", () => {
      const niveles = obtenerNivelesLanzablesPorClase("tercio", 2);
      expect(Array.from(niveles)).toEqual([]);
    });

    it("debe retornar trucos y nivel 1 para tercio-lanzador a nivel 3", () => {
      const niveles = obtenerNivelesLanzablesPorClase("tercio", 3);
      expect(Array.from(niveles)).toEqual([0, 1]);
    });

    it("debe incluir Arcanos Místicos para Brujo nivel 11 (trucos, 1..5 y 6)", () => {
      const niveles = obtenerNivelesLanzablesPorClase("pacto", 11);
      expect(Array.from(niveles)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  describe("obtenerNivelesConjuroDisponiblesPersonaje", () => {
    it("debe obtener niveles correctos para un Mago nivel 1", () => {
      const pj = {
        id: "pj-mago-1",
        esLanzador: true,
        clase: "Mago",
        nivel: 1,
        clasesLanzadoras: [
          { clase: "Mago", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
        ],
        espaciosConjuroMaximos: { "1": 2 }
      } as unknown as PersonajeJugador;

      const niveles = obtenerNivelesConjuroDisponiblesPersonaje(pj);
      expect(niveles.has(0)).toBe(true);
      expect(niveles.has(1)).toBe(true);
      expect(niveles.has(2)).toBe(false);
    });

    it("debe obtener niveles correctos para un Pícaro Embaucador Arcano nivel 3", () => {
      const pj = {
        id: "pj-embaucador-3",
        esLanzador: true,
        clase: "Pícaro",
        subclase: "Embaucador Arcano",
        nivel: 3,
        clasesLanzadoras: [
          { clase: "Pícaro", nivel: 3, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos", listaConjuros: "mago" }
        ],
        espaciosConjuroMaximos: { "1": 2 }
      } as unknown as PersonajeJugador;

      const niveles = obtenerNivelesConjuroDisponiblesPersonaje(pj);
      expect(niveles.has(0)).toBe(true);
      expect(niveles.has(1)).toBe(true);
      expect(niveles.has(2)).toBe(false);
    });

    it("debe retornar conjunto vacío para Guerrero sin magia", () => {
      const pj = {
        id: "pj-guerrero",
        esLanzador: false,
        clase: "Guerrero",
        nivel: 3,
        clasesLanzadoras: []
      } as unknown as PersonajeJugador;

      const niveles = obtenerNivelesConjuroDisponiblesPersonaje(pj);
      expect(niveles.size).toBe(0);
    });
  });

  describe("puedePersonajeLanzarHechizo", () => {
    const hechizoMagoNv0: HechizoBase = {
      id: "descarga-de-fuego",
      nombre: "Descarga de fuego",
      nivel: 0,
      escuela: "Evocacion",
      clases: ["mago", "hechicero"],
      tiempoLanzamiento: "1 Accion",
      alcance: "120 pies",
      duracion: "Instantaneo",
      descripcion: "Lanza una mota de fuego."
    } as unknown as HechizoBase;

    const hechizoMagoNv1: HechizoBase = {
      id: "proyectil-magico",
      nombre: "Proyectil mágico",
      nivel: 1,
      escuela: "Evocacion",
      clases: ["mago", "hechicero"],
      tiempoLanzamiento: "1 Accion",
      alcance: "120 pies",
      duracion: "Instantaneo",
      descripcion: "Dispara dardos mágicos."
    } as unknown as HechizoBase;

    const hechizoMagoNv2: HechizoBase = {
      id: "rayo-abrasador",
      nombre: "Rayo abrasador",
      nivel: 2,
      escuela: "Evocacion",
      clases: ["mago", "hechicero"],
      tiempoLanzamiento: "1 Accion",
      alcance: "120 pies",
      duracion: "Instantaneo",
      descripcion: "Tres rayos de fuego."
    } as unknown as HechizoBase;

    const hechizoMagoNv3: HechizoBase = {
      id: "bola-de-fuego",
      nombre: "Bola de fuego",
      nivel: 3,
      escuela: "Evocacion",
      clases: ["mago", "hechicero"],
      tiempoLanzamiento: "1 Accion",
      alcance: "150 pies",
      duracion: "Instantaneo",
      descripcion: "Explosión ígnea."
    } as unknown as HechizoBase;

    const hechizoClerigoNv1: HechizoBase = {
      id: "bendicion",
      nombre: "Bendición",
      nivel: 1,
      escuela: "Encantamiento",
      clases: ["clerigo", "paladin"],
      tiempoLanzamiento: "1 Accion",
      alcance: "30 pies",
      duracion: "Concentracion, hasta 1 minuto",
      descripcion: "Bendice a 3 criaturas."
    } as unknown as HechizoBase;

    const hechizoClerigoNv2: HechizoBase = {
      id: "plegaria-de-curacion",
      nombre: "Plegaria de curación",
      nivel: 2,
      escuela: "Abjuracion",
      clases: ["clerigo"],
      tiempoLanzamiento: "10 Minutos",
      alcance: "30 pies",
      duracion: "Instantaneo",
      descripcion: "Cura aliados."
    } as unknown as HechizoBase;

    it("para un Mago nivel 1: permite trucos y nv1, pero bloquea nv2 y superiores", () => {
      const pjMago1 = {
        id: "pj-mago-1",
        esLanzador: true,
        clase: "Mago",
        nivel: 1,
        clasesLanzadoras: [
          { clase: "Mago", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
        ],
        espaciosConjuroMaximos: { "1": 2 }
      } as unknown as PersonajeJugador;

      expect(puedePersonajeLanzarHechizo(pjMago1, hechizoMagoNv0)).toBe(true);
      expect(puedePersonajeLanzarHechizo(pjMago1, hechizoMagoNv1)).toBe(true);
      expect(puedePersonajeLanzarHechizo(pjMago1, hechizoMagoNv2)).toBe(false);
      expect(puedePersonajeLanzarHechizo(pjMago1, hechizoMagoNv3)).toBe(false);
      // No coincide clase
      expect(puedePersonajeLanzarHechizo(pjMago1, hechizoClerigoNv1)).toBe(false);
    });

    it("para un Mago nivel 3: permite hasta nv2, pero bloquea nv3", () => {
      const pjMago3 = {
        id: "pj-mago-3",
        esLanzador: true,
        clase: "Mago",
        nivel: 3,
        clasesLanzadoras: [
          { clase: "Mago", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
        ],
        espaciosConjuroMaximos: { "1": 4, "2": 2 }
      } as unknown as PersonajeJugador;

      expect(puedePersonajeLanzarHechizo(pjMago3, hechizoMagoNv0)).toBe(true);
      expect(puedePersonajeLanzarHechizo(pjMago3, hechizoMagoNv1)).toBe(true);
      expect(puedePersonajeLanzarHechizo(pjMago3, hechizoMagoNv2)).toBe(true);
      expect(puedePersonajeLanzarHechizo(pjMago3, hechizoMagoNv3)).toBe(false);
    });

    it("para un Pícaro Embaucador Arcano nivel 3: permite trucos y nv1 de Mago, bloquea nv2", () => {
      const pjEmbaucador3 = {
        id: "pj-embaucador-3",
        esLanzador: true,
        clase: "Pícaro",
        subclase: "Embaucador Arcano",
        nivel: 3,
        clasesLanzadoras: [
          { clase: "Pícaro", nivel: 3, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos", listaConjuros: "mago" }
        ],
        espaciosConjuroMaximos: { "1": 2 }
      } as unknown as PersonajeJugador;

      expect(puedePersonajeLanzarHechizo(pjEmbaucador3, hechizoMagoNv0)).toBe(true);
      expect(puedePersonajeLanzarHechizo(pjEmbaucador3, hechizoMagoNv1)).toBe(true);
      expect(puedePersonajeLanzarHechizo(pjEmbaucador3, hechizoMagoNv2)).toBe(false);
    });

    it("para un Pícaro Ladrón sin magia: bloquea todos los conjuros", () => {
      const pjLadron = {
        id: "pj-ladron",
        esLanzador: false,
        clase: "Pícaro",
        subclase: "Ladrón",
        nivel: 3,
        clasesLanzadoras: []
      } as unknown as PersonajeJugador;

      expect(puedePersonajeLanzarHechizo(pjLadron, hechizoMagoNv0)).toBe(false);
      expect(puedePersonajeLanzarHechizo(pjLadron, hechizoMagoNv1)).toBe(false);
    });

    it("para un personaje multiclase Clérigo 1 / Mago 3: evalúa correctamente cada lista por clase", () => {
      const pjMulticlase = {
        id: "pj-multi",
        esLanzador: true,
        clases: [
          { nombre: "Clérigo", nivel: 1 },
          { nombre: "Mago", nivel: 3 }
        ],
        clase: "Clérigo 1 / Mago 3",
        nivel: 4,
        clasesLanzadoras: [
          { clase: "Clérigo", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" },
          { clase: "Mago", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
        ],
        // Caster level combinado = 4 (4 de nv1, 3 de nv2)
        espaciosConjuroMaximos: { "1": 4, "2": 3 }
      } as unknown as PersonajeJugador;

      // Clérigo nv1 puede lanzar nv1 de Clérigo
      expect(puedePersonajeLanzarHechizo(pjMulticlase, hechizoClerigoNv1)).toBe(true);
      // Clérigo nv1 NO puede aprender/preparar nv2 de Clérigo (aunque tenga ranuras multiclase)
      expect(puedePersonajeLanzarHechizo(pjMulticlase, hechizoClerigoNv2)).toBe(false);
      // Mago nv3 PUEDE lanzar nv2 de Mago
      expect(puedePersonajeLanzarHechizo(pjMulticlase, hechizoMagoNv2)).toBe(true);
      // Mago nv3 NO puede lanzar nv3 de Mago
      expect(puedePersonajeLanzarHechizo(pjMulticlase, hechizoMagoNv3)).toBe(false);
    });
  });
});

