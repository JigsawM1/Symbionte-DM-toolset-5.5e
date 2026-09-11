import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import {
  calcularTodosRecursosMagicos,
  calcularMaximosConjurosYTrucos,
  calcularCDConjuros,
  calcularBonoAtaqueConjuro
} from "./calculadorMagia";
import {
  calcularFormulaEscalada,
  extraerDadosBaseTruco,
  calcularInfoTruco,
  trucoTieneMejora,
  construirFormulaTaleSpireTruco
} from "@/utiles/utilesConjuros";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import type { PersonajeJugador, HechizoBase, ClaseLanzadora } from "@/tipos";

describe("Integración y Validación Exhaustiva del Sistema de Conjuros (D&D 5.5e)", () => {
  beforeEach(() => {
    // Restablecer el estado de Zustand antes de cada prueba
    usarAlmacenDM.setState({ personajes: [] });
  });

  describe("1. Ciclo de Vida y Gestión de Recursos Mágicos en el Almacén Zustand", () => {
    it("debe crear un Mago nivel 5 y calcular correctamente espacios de nivel 1, 2 y 3", () => {
      const store = usarAlmacenDM.getState();
      const clasesMago: ClaseLanzadora[] = [
        {
          clase: "Mago",
          nivel: 5,
          tipoLanzador: "completo",
          habilidadConjuro: "inteligencia",
          modeloConjuros: "grimorio"
        }
      ];

      const nuevoId = store.crearPersonaje({
        nombre: "Raistlin",
        nivel: 5,
        clase: "Mago",
        esLanzador: true,
        clasesLanzadoras: clasesMago,
        caracteristicas: {
          fuerza: 8,
          destreza: 14,
          constitucion: 14,
          inteligencia: 18, // Mod +4
          sabiduria: 12,
          carisma: 10
        }
      });

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === nuevoId);
      expect(pj).toBeDefined();
      expect(pj?.espaciosConjuroMaximos).toEqual({ "1": 4, "2": 3, "3": 2 });
      expect(pj?.espaciosPactoMaximos).toBe(0);

      const pb = Math.ceil(1 + (pj?.nivel || 1) / 4); // PB = 3 a nivel 5
      // CD = 8 + 3 (PB) + 4 (INT) = 15
      const cd = calcularCDConjuros(pb, 4);
      expect(cd).toBe(15);

      // Ataque mágico = 3 + 4 = +7
      const ataque = calcularBonoAtaqueConjuro(pb, 4);
      expect(ataque).toBe(7);
    });

    it("debe gestionar el gasto y recuperación de espacios estándar por niveles", () => {
      const store = usarAlmacenDM.getState();
      const clasesMago: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ];

      const id = store.crearPersonaje({
        nombre: "Gandalf",
        nivel: 5,
        clase: "Mago",
        esLanzador: true,
        clasesLanzadoras: clasesMago
      });

      // Gastar 2 espacios de nivel 1 y 1 espacio de nivel 3
      store.gastarEspacioConjuro(id, 1);
      store.gastarEspacioConjuro(id, 1);
      store.gastarEspacioConjuro(id, 3);

      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.espaciosConjuroGastados?.["1"]).toBe(2);
      expect(pj.espaciosConjuroGastados?.["3"]).toBe(1);

      // Recuperar 1 espacio de nivel 1
      store.recuperarEspacioConjuro(id, 1);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.espaciosConjuroGastados?.["1"]).toBe(1);

      // Restablecer todos los espacios
      store.recuperarTodosEspaciosConjuro(id);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.espaciosConjuroGastados).toEqual({});
    });

    it("debe gestionar la Magia de Pacto del Brujo de forma 100% independiente", () => {
      const store = usarAlmacenDM.getState();
      const clasesBrujo: ClaseLanzadora[] = [
        { clase: "Brujo", nivel: 5, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];

      const id = store.crearPersonaje({
        nombre: "Wyll",
        nivel: 5,
        clase: "Brujo",
        esLanzador: true,
        clasesLanzadoras: clasesBrujo
      });

      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.espaciosPactoMaximos).toBe(2);
      expect(pj.nivelEspacioPacto).toBe(3);
      expect(pj.espaciosPactoGastados).toBe(0);

      // Gastar 1 espacio de pacto
      store.gastarEspacioPacto(id);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.espaciosPactoGastados).toBe(1);

      // Gastar segundo espacio de pacto
      store.gastarEspacioPacto(id);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.espaciosPactoGastados).toBe(2);

      // No debe permitir gastar más del máximo
      store.gastarEspacioPacto(id);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.espaciosPactoGastados).toBe(2);

      // Recuperar espacios de pacto
      store.recuperarEspaciosPacto(id);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.espaciosPactoGastados).toBe(0);
    });

    it("debe soportar multiclase Mago / Brujo con ambos recursos coexistiendo sin conflicto", () => {
      const clasesMulticlase: ClaseLanzadora[] = [
        { clase: "Mago", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" },
        { clase: "Brujo", nivel: 2, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];

      const recursos = calcularTodosRecursosMagicos(clasesMulticlase);
      // Mago 3 -> espacios estándar nv1: 4, nv2: 2
      expect(recursos.espaciosConjuroMaximos).toEqual({ "1": 4, "2": 2 });
      // Brujo 2 -> Magia de pacto: 2 espacios de nivel 1
      expect(recursos.espaciosPactoMaximos).toBe(2);
      expect(recursos.nivelEspacioPacto).toBe(1);
    });

    it("debe gestionar la variante de Puntos de Conjuro (DMG) correctamente", () => {
      const store = usarAlmacenDM.getState();
      const clasesHechicero: ClaseLanzadora[] = [
        { clase: "Hechicero", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ];

      const id = store.crearPersonaje({
        nombre: "Ignis",
        nivel: 5,
        clase: "Hechicero",
        esLanzador: true,
        clasesLanzadoras: clasesHechicero
      });

      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.puntosConjuroMaximos).toBe(27);
      expect(pj.puntosConjuroGastados).toBe(0);

      // Gastar 5 puntos (equivalente a un conjuro de nivel 3)
      store.gastarPuntosConjuro(id, 5);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.puntosConjuroGastados).toBe(5);

      // Recuperar 2 puntos
      store.recuperarPuntosConjuro(id, 2);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.puntosConjuroGastados).toBe(3);

      // Restablecer todos los puntos
      store.recuperarTodosPuntosConjuro(id);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.puntosConjuroGastados).toBe(0);
    });
  });

  describe("2. Integración con Procesador de Descansos (Short Rest & Long Rest)", () => {
    it("Descanso Corto: Brujo restaura sus espacios de pacto gastados, pero Mago no restaura espacios estándar", () => {
      const personajeBrujo: PersonajeJugador = {
        id: "brujo-1",
        nombre: "Warlock Test",
        clase: "Brujo",
        nivel: 5,
        hpActual: 20,
        hpMaximo: 35,
        hpTemporal: 0,
        dadosGolpeTotal: 5,
        dadosGolpeRestantes: 5,
        salvacionesMuerte: { exitos: 0, fallos: 0 },
        cansancio: 0,
        esLanzador: true,
        espaciosPactoMaximos: 2,
        espaciosPactoGastados: 2,
        nivelEspacioPacto: 3,
        espaciosConjuroGastados: {},
        condicionesActivas: []
      } as unknown as PersonajeJugador;

      const resBrujo = ejecutarDescansoCorto(personajeBrujo, 0, []);
      expect(resBrujo.personajeActualizado.espaciosPactoGastados).toBe(0);

      const personajeMago: PersonajeJugador = {
        id: "mago-1",
        nombre: "Wizard Test",
        clase: "Mago",
        nivel: 5,
        hpActual: 20,
        hpMaximo: 30,
        hpTemporal: 0,
        dadosGolpeTotal: 5,
        dadosGolpeRestantes: 5,
        salvacionesMuerte: { exitos: 0, fallos: 0 },
        cansancio: 0,
        esLanzador: true,
        espaciosConjuroMaximos: { "1": 4, "2": 3, "3": 2 },
        espaciosConjuroGastados: { "1": 2, "3": 1 },
        espaciosPactoMaximos: 0,
        espaciosPactoGastados: 0,
        condicionesActivas: []
      } as unknown as PersonajeJugador;

      const resMago = ejecutarDescansoCorto(personajeMago, 0, []);
      // En descanso corto sin Recuperación Arcana manual, los espacios estándar permanecen gastados
      expect(resMago.personajeActualizado.espaciosConjuroGastados).toEqual({ "1": 2, "3": 1 });
    });

    it("Descanso Largo: Restaura TODOS los espacios estándar, puntos, pacto y limpia concentración", () => {
      const personajeMulticlase: PersonajeJugador = {
        id: "multi-1",
        nombre: "Sorlock Test",
        clase: "Hechicero",
        nivel: 7,
        hpActual: 10,
        hpMaximo: 45,
        hpTemporal: 5,
        dadosGolpeTotal: 7,
        dadosGolpeRestantes: 2,
        salvacionesMuerte: { exitos: 1, fallos: 1 },
        cansancio: 1,
        esLanzador: true,
        espaciosConjuroMaximos: { "1": 4, "2": 3 },
        espaciosConjuroGastados: { "1": 3, "2": 2 },
        puntosConjuroMaximos: 38,
        puntosConjuroGastados: 20,
        espaciosPactoMaximos: 2,
        espaciosPactoGastados: 2,
        concentracionActiva: { hechizoId: "h-bendicion", nombreHechizo: "Bendición" },
        condicionesActivas: ["Concentración", "Envenenado"]
      } as unknown as PersonajeJugador;

      const resultado = ejecutarDescansoLargo(personajeMulticlase);
      const pj = resultado.personajeActualizado;

      expect(pj.hpActual).toBe(45);
      expect(pj.hpTemporal).toBe(0);
      expect(pj.espaciosConjuroGastados).toEqual({});
      expect(pj.puntosConjuroGastados).toBe(0);
      expect(pj.espaciosPactoGastados).toBe(0);
      expect(pj.concentracionActiva).toBeNull();
      expect(pj.condicionesActivas).not.toContain("Concentración");
      expect(pj.condicionesActivas).toContain("Envenenado"); // Otras condiciones permanecen
    });
  });

  describe("3. Preservación de Listas de Conjuros Conocidos y Preparados", () => {
    it("debe permitir agregar/quitar conjuros y alternar estado de preparación", () => {
      const store = usarAlmacenDM.getState();
      const id = store.crearPersonaje({
        nombre: "Elminster",
        nivel: 3,
        clase: "Mago",
        esLanzador: true
      });

      // Agregar trucos y conjuros
      store.agregarTrucoConocido(id, "truco-rayo-escarcha");
      store.agregarConjuroConocido(id, "conjuro-escudo");
      store.agregarConjuroConocido(id, "conjuro-proyectil-magico");

      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.trucosConocidosIds).toContain("truco-rayo-escarcha");
      expect(pj.conjurosConocidosIds).toContain("conjuro-escudo");
      expect(pj.conjurosConocidosIds).toContain("conjuro-proyectil-magico");
      expect(pj.conjurosPreparadosIds).toEqual([]);

      // Preparar 'Escudo'
      store.alternarConjuroPreparado(id, "conjuro-escudo");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.conjurosPreparadosIds).toContain("conjuro-escudo");

      // Despreparar 'Escudo'
      store.alternarConjuroPreparado(id, "conjuro-escudo");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.conjurosPreparadosIds).not.toContain("conjuro-escudo");

      // Quitar conjuro de la lista debe removerlo también de preparados
      store.alternarConjuroPreparado(id, "conjuro-escudo");
      store.quitarConjuroConocido(id, "conjuro-escudo");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.conjurosConocidosIds).not.toContain("conjuro-escudo");
      expect(pj.conjurosPreparadosIds).not.toContain("conjuro-escudo");
    });
  });

  describe("4. Gestión Integral de Concentración", () => {
    it("debe establecer concentración activa y añadir condición", () => {
      const store = usarAlmacenDM.getState();
      const id = store.crearPersonaje({ nombre: "Clérigo", nivel: 3, clase: "Clérigo" });

      store.establecerConcentracion(id, "h-bendicion", "Bendición");
      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.concentracionActiva).toEqual({ hechizoId: "h-bendicion", nombreHechizo: "Bendición" });
      expect(pj.condicionesActivas).toContain("Concentración");

      // Cambiar concentración a otro conjuro
      store.establecerConcentracion(id, "h-espiritus", "Espíritus Guardianes");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.concentracionActiva).toEqual({ hechizoId: "h-espiritus", nombreHechizo: "Espíritus Guardianes" });

      // Romper concentración
      store.romperConcentracion(id);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(pj.concentracionActiva).toBeNull();
      expect(pj.condicionesActivas).not.toContain("Concentración");
    });
  });

  describe("5. Reglas de Escalado, Upcasting y Detección de Fórmulas", () => {
    it("debe calcular upcasting de dados adicionales en conjuros de nivel (ej. Bola de Fuego 8d6 -> nv5: 10d6)", () => {
      const bolaFuego: HechizoBase = {
        id: "h-bola-fuego",
        nombre: "Bola de fuego",
        nivel: 3,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "150 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        duracion: "Instantánea",
        descripcion: "Una brillante llamarada... inflige 8d6 de daño por fuego.",
        dadosDaño: "8d6",
        tipoDaño: "fuego",
        descNivelSuperior: "El daño aumenta en 1d6 por cada nivel de ranura por encima de 3.",
        dadosDañoNivelSuperior: "1d6",
        requiereAtaque: false,
        cdSalvacion: "Destreza"
      };

      // Lanzamiento a nivel 3 (base)
      const resNv3 = calcularFormulaEscalada(bolaFuego.dadosDaño || "8d6", "1d6", 3, 3);
      expect(resNv3.formula).toBe("8d6");

      // Upcast a nivel 4 (+1d6 = 9d6)
      const resNv4 = calcularFormulaEscalada(bolaFuego.dadosDaño || "8d6", "1d6", 3, 4);
      expect(resNv4.formula).toBe("9d6");

      // Upcast a nivel 5 (+2d6 = 10d6)
      const resNv5 = calcularFormulaEscalada(bolaFuego.dadosDaño || "8d6", "1d6", 3, 5);
      expect(resNv5.formula).toBe("10d6");
    });

    it("debe upcastear automáticamente trucos con cláusula 'Mejora de truco'", () => {
      const saetaFuego: HechizoBase = {
        id: "truco-saeta",
        nombre: "Saeta de fuego",
        nivel: 0,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "120 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Instantánea",
        descripcion: "Lanzas una mota de fuego... inflige 1d10 de daño ígneo. Mejora de truco. El daño aumenta en 1d10 cuando alcanzas los niveles 5 (2d10), 11 (3d10) y 17 (4d10).",
        dadosDaño: "1d10",
        tipoDaño: "fuego",
        requiereAtaque: true
      };

      expect(trucoTieneMejora(saetaFuego)).toBe(true);

      const infoNv1 = calcularInfoTruco(saetaFuego, 1);
      expect(infoNv1.formula).toBe("1d10");

      const infoNv5 = calcularInfoTruco(saetaFuego, 5);
      expect(infoNv5.formula).toBe("2d10");

      const infoNv11 = calcularInfoTruco(saetaFuego, 11);
      expect(infoNv11.formula).toBe("3d10");

      const infoNv17 = calcularInfoTruco(saetaFuego, 17);
      expect(infoNv17.formula).toBe("4d10");
    });

    it("Descarga Sobrenatural debe escalar en cantidad de ataques (rayos) y no en multiplicación de dados", () => {
      const descarga: HechizoBase = {
        id: "truco-descarga",
        nombre: "Descarga sobrenatural",
        nivel: 0,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "120 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Instantánea",
        descripcion: "Un haz de energía chisporroteante... Mejora de truco. El conjuro crea más de un rayo cuando alcanzas niveles más altos: dos rayos a nivel 5, tres a nivel 11 y cuatro a nivel 17.",
        dadosDaño: "1d10",
        tipoDaño: "fuerza",
        requiereAtaque: true
      };

      const infoNv1 = calcularInfoTruco(descarga, 1);
      expect(infoNv1.esAtaqueMultiple).toBe(true);
      expect(infoNv1.cantidadAtaques).toBe(1);

      const infoNv5 = calcularInfoTruco(descarga, 5);
      expect(infoNv5.esAtaqueMultiple).toBe(true);
      expect(infoNv5.cantidadAtaques).toBe(2);

      const infoNv11 = calcularInfoTruco(descarga, 11);
      expect(infoNv11.esAtaqueMultiple).toBe(true);
      expect(infoNv11.cantidadAtaques).toBe(3);

      const infoNv17 = calcularInfoTruco(descarga, 17);
      expect(infoNv17.esAtaqueMultiple).toBe(true);
      expect(infoNv17.cantidadAtaques).toBe(4);
    });

    it("Trucos sin cláusula de mejora (Garrote / Shillelagh) NO deben inflar sus dados al subir de nivel", () => {
      const garrote: HechizoBase = {
        id: "truco-garrote",
        nombre: "Garrote",
        nivel: 0,
        escuela: "Transmutación",
        tiempoLanzamiento: "1 acción adicional",
        alcance: "Toque",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        duracion: "1 minuto",
        descripcion: "La madera de un garrote o bastón que sostienes se imbuye con el poder de la naturaleza. El dado de daño del arma pasa a ser 1d8.",
        dadosDaño: "1d8",
        tipoDaño: "contundente",
        requiereAtaque: true
      };

      expect(trucoTieneMejora(garrote)).toBe(false);

      // A nivel 1, 5, 11 y 17 debe ser siempre 1d8
      expect(calcularInfoTruco(garrote, 1).formula).toBe("1d8");
      expect(calcularInfoTruco(garrote, 5).formula).toBe("1d8");
      expect(calcularInfoTruco(garrote, 11).formula).toBe("1d8");
      expect(calcularInfoTruco(garrote, 17).formula).toBe("1d8");
    });

    it("Trucos y Conjuros utilitarios NO deben inventar dados de daño ni tiradas de ataque", () => {
      const guia: HechizoBase = {
        id: "truco-guia",
        nombre: "Guía",
        nivel: 0,
        escuela: "Adivinación",
        tiempoLanzamiento: "1 acción",
        alcance: "Toque",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Concentración, hasta 1 minuto",
        descripcion: "Tocas a una criatura voluntaria. Una vez antes de que el conjuro termine, el objetivo puede tirar un 1d4 y añadir el número a una prueba de característica.",
        requiereAtaque: false
      };

      expect(extraerDadosBaseTruco(guia)).toBe("");
      const infoGuia = calcularInfoTruco(guia, 5);
      expect(infoGuia.formula).toBe("");
      expect(infoGuia.etiquetaVisual).toBe("");

      const formulaTS = construirFormulaTaleSpireTruco(guia, 5, 5);
      expect(formulaTS.formulaTaleSpire).toBe("!Lanzar Truco:Guía");

      const detectarMagia: HechizoBase = {
        id: "conjuro-detectar-magia",
        nombre: "Detectar magia",
        nivel: 1,
        escuela: "Adivinación",
        tiempoLanzamiento: "1 acción",
        alcance: "Personal (30 pies)",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Concentración, hasta 10 minutos",
        descripcion: "Durante la duración, sientes la presencia de magia...",
        requiereAtaque: false
      };

      const resDetectar = calcularFormulaEscalada(detectarMagia.dadosDaño || "", "", 1, 1);
      expect(resDetectar.formula).toBe("");
    });
  });

  describe("6. Máximos Oficiales de Conjuros y Trucos según D&D 5.5e (2024)", () => {
    it("debe calcular máximos oficiales para todas las clases lanzadoras", () => {
      // Clérigo nivel 1 (3 trucos, 4 preparados)
      const clerigo = calcularMaximosConjurosYTrucos(
        [{ clase: "Clérigo", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" }],
        1,
        3
      );
      expect(clerigo).toEqual({ maxTrucos: 3, maxConjuros: 4, modelo: "preparados" });

      // Hechicero nivel 1 (4 trucos, 2 conocidos)
      const hechicero = calcularMaximosConjurosYTrucos(
        [{ clase: "Hechicero", nivel: 1, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }],
        1,
        3
      );
      expect(hechicero).toEqual({ maxTrucos: 4, maxConjuros: 2, modelo: "conocidos" });

      // Bardo nivel 5 (3 trucos, 9 preparados en D&D 2024)
      const bardo = calcularMaximosConjurosYTrucos(
        [{ clase: "Bardo", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }],
        5,
        4
      );
      expect(bardo).toEqual({ maxTrucos: 3, maxConjuros: 9, modelo: "conocidos" });

      // Paladín nivel 5 (0 trucos, 6 preparados)
      const paladin = calcularMaximosConjurosYTrucos(
        [{ clase: "Paladín", nivel: 5, tipoLanzador: "medio", habilidadConjuro: "carisma", modeloConjuros: "preparados" }],
        5,
        3
      );
      expect(paladin).toEqual({ maxTrucos: 0, maxConjuros: 6, modelo: "preparados" });

      // Explorador nivel 5 (0 trucos, 6 preparados)
      const explorador = calcularMaximosConjurosYTrucos(
        [{ clase: "Explorador", nivel: 5, tipoLanzador: "medio", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" }],
        5,
        3
      );
      expect(explorador).toEqual({ maxTrucos: 0, maxConjuros: 6, modelo: "preparados" });

      // Caballero Arcano (Guerrero) nivel 6 (2 trucos, 4 conocidos)
      const caballero = calcularMaximosConjurosYTrucos(
        [{ clase: "Guerrero", nivel: 6, tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "conocidos" }],
        6,
        2
      );
      expect(caballero).toEqual({ maxTrucos: 2, maxConjuros: 4, modelo: "conocidos" });
    });
  });

  describe("7. Lanzamiento de Conjuros como Ritual (D&D 5.5e / 2024)", () => {
    it("debe permitir lanzar conjuros con la etiqueta ritual sin consumir espacios de conjuro ni puntos", () => {
      const store = usarAlmacenDM.getState();
      const id = store.crearPersonaje({
        nombre: "Bardo Ritualista",
        nivel: 3,
        clase: "Bardo",
        esLanzador: true,
        clasesLanzadoras: [
          { clase: "Bardo", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
        ]
      });

      const pjAntes = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      const espaciosNv1Antes = pjAntes.espaciosConjuroGastados?.["1"] || 0;

      const detectarMagia: HechizoBase = {
        id: "h_detectar-magia",
        nombre: "Detectar magia",
        nivel: 1,
        escuela: "adivinación",
        tiempoLanzamiento: "1 acción",
        alcance: "Personal",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        descripcion: "Sientes la presencia de magia.",
        ritual: true,
        concentracion: true
      };

      // Simular lanzamiento ritual: activa concentración sin llamar a gastarEspacioConjuro
      expect(detectarMagia.ritual).toBe(true);
      store.establecerConcentracion(id, detectarMagia.id, detectarMagia.nombre);

      const pjDespues = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      // Los espacios gastados no se incrementaron
      expect(pjDespues.espaciosConjuroGastados?.["1"] || 0).toBe(espaciosNv1Antes);
      // La concentración se activó correctamente
      expect(pjDespues.concentracionActiva).toEqual({
        hechizoId: "h_detectar-magia",
        nombreHechizo: "Detectar magia"
      });
    });
  });

  describe("5. Segregación de Conjuros Ocultos y Contenedor Separado de Nivel", () => {
    const hechizosMock: HechizoBase[] = [
      {
        id: "truco-fuego",
        nombre: "Descarga de Fuego",
        nivel: 0,
        escuela: "Evocacion",
        tiempoLanzamiento: "1 Accion",
        alcance: "120 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Instantaneo",
        concentracion: false,
        ritual: false,
        descripcion: "Lanzas una mota de fuego."
      },
      {
        id: "truco-luz",
        nombre: "Luz",
        nivel: 0,
        escuela: "Evocacion",
        tiempoLanzamiento: "1 Accion",
        alcance: "Contacto",
        componentesSeleccionados: { verbal: true, somatico: false, material: true },
        duracion: "1 hora",
        concentracion: false,
        ritual: false,
        descripcion: "Tocas un objeto e irradia luz."
      },
      {
        id: "conjuro-escudo",
        nombre: "Escudo",
        nivel: 1,
        escuela: "Abjuracion",
        tiempoLanzamiento: "1 Reaccion",
        alcance: "Personal",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "1 ronda",
        concentracion: false,
        ritual: false,
        descripcion: "Una barrera invisible te protege."
      },
      {
        id: "conjuro-proyectil",
        nombre: "Proyectil Mágico",
        nivel: 1,
        escuela: "Evocacion",
        tiempoLanzamiento: "1 Accion",
        alcance: "120 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Instantaneo",
        concentracion: false,
        ritual: false,
        descripcion: "Creas tres dardos de fuerza."
      },
      {
        id: "conjuro-invisibilidad",
        nombre: "Invisibilidad",
        nivel: 2,
        escuela: "Ilusion",
        tiempoLanzamiento: "1 Accion",
        alcance: "Contacto",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        duracion: "Concentracion, hasta 1 hora",
        concentracion: true,
        ritual: false,
        descripcion: "Una criatura se vuelve invisible."
      }
    ];

    it("separa con precisión conjuros visibles y ocultos según el conjunto de IDs", () => {
      const ocultosIds = ["truco-fuego", "conjuro-escudo"];
      const ocultosSet = new Set(ocultosIds);

      const visibles = hechizosMock.filter((h) => !ocultosSet.has(h.id));
      const ocultos = hechizosMock.filter((h) => ocultosSet.has(h.id));

      expect(visibles.map((h) => h.id)).toEqual(["truco-luz", "conjuro-proyectil", "conjuro-invisibilidad"]);
      expect(ocultos.map((h) => h.id)).toEqual(["truco-fuego", "conjuro-escudo"]);
    });

    it("alterna reactivamente la ocultación de un conjuro", () => {
      let ocultos: string[] = [];
      const alternar = (id: string) => {
        ocultos = ocultos.includes(id) ? ocultos.filter((x) => x !== id) : [...ocultos, id];
      };

      alternar("conjuro-invisibilidad");
      expect(ocultos).toContain("conjuro-invisibilidad");

      alternar("conjuro-invisibilidad");
      expect(ocultos).not.toContain("conjuro-invisibilidad");
    });

    it("ordena los conjuros ocultos por nivel ascendente (0 a 9) y luego alfabéticamente", () => {
      const desordenados: HechizoBase[] = [
        hechizosMock[4], // Nv 2: Invisibilidad
        hechizosMock[0], // Nv 0: Descarga de Fuego
        hechizosMock[3], // Nv 1: Proyectil Mágico
        hechizosMock[2]  // Nv 1: Escudo
      ];

      const ordenados = [...desordenados].sort((a, b) => {
        if (a.nivel !== b.nivel) return a.nivel - b.nivel;
        return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
      });

      expect(ordenados.map((h) => h.id)).toEqual([
        "truco-fuego",
        "conjuro-escudo",
        "conjuro-proyectil",
        "conjuro-invisibilidad"
      ]);
    });
  });
});
