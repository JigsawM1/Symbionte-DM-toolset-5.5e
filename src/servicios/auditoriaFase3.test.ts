import { describe, it, expect } from "vitest";
import type { PersonajeJugador, RasgoPersonaje, ObjetoInventario } from "@/tipos";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { fusionarEstadoRasgo } from "./rasgos/fusionarEstadoRasgo";
import { resolverEscaladosRasgo } from "./clases/escaladosRasgos";
import { resolverIdRasgoObjetivoGasto } from "@/servicios/evaluadorEfectosRasgos";
import { sonObjetosApilables } from "./compatibilidadInventario";
import { esSelectorDeConjuros } from "@/utiles/selectoresConjuros";
import { cumpleCondicionEfecto } from "./rasgos/evaluadorExpresionesRasgos";
import { aplicarCambioClaseNivel, sincronizarMagiaMulticlase } from "./sincronizadorMulticlase";

function crearPjPrueba(parcial: Partial<PersonajeJugador> = {}): PersonajeJugador {
  return {
    id: "pj-auditoria-f3",
    nombre: "Héroe Auditoría F3",
    nivel: 3,
    clase: "Guerrero",
    clases: [{ nombre: "Guerrero", subclase: "Campeón", nivel: 3 }],
    caracteristicas: {
      fuerza: 16,
      destreza: 14,
      constitucion: 14,
      inteligencia: 10,
      sabiduria: 12,
      carisma: 8
    },
    hpMaximoBase: 28,
    hpMaximo: 28,
    hpActual: 20,
    hpTemporal: 0,
    dadosGolpeTotal: 3,
    dadosGolpeRestantes: 2,
    tipoDadoGolpe: "d10",
    iniciativaBono: 2,
    rasgos: [],
    inventario: [],
    condicionesActivas: [],
    efectosActivos: [],
    esLanzador: false,
    espaciosConjuroMaximos: {},
    espaciosConjuroGastados: {},
    conjurosPreparadosIds: [],
    conjurosConocidosIds: [],
    trucosConocidosIds: [],
    conjurosSiemprePreparadosIds: [],
    ...parcial
  } as PersonajeJugador;
}

describe("Auditoría Fase 3: Reglas Canónicas D&D 5.5, Combate, Magia y Descansos", () => {
  describe("F3-01: Descansos y Recursos Canónicos (usosRestantes undefined)", () => {
    it("debe preservar recursos intactos (usosRestantes: undefined) en descanso corto", () => {
      const rasgoIntacto = {
        id: "segundo-aliento",
        nombre: "Segundo aliento",
        origen: "clase",
        usosMaximos: 2,
        usosRestantes: undefined,
        recuperacion: "descanso_corto"
      } as RasgoPersonaje;
      const pj = crearPjPrueba({ rasgos: [rasgoIntacto] });
      const resultado = ejecutarDescansoCorto(pj, 0);
      const rasgoActualizado = resultado.personajeActualizado.rasgos?.find((r) => r.id === "segundo-aliento");
      expect(rasgoActualizado?.usosRestantes).toBeUndefined();
    });

    it("debe recargar al máximo en descanso largo sin degradar a 0", () => {
      const rasgoGastado = {
        id: "induccion-furia",
        nombre: "Furia",
        origen: "clase",
        usosMaximos: 3,
        usosRestantes: 0,
        recuperacion: "descanso_largo"
      } as RasgoPersonaje;
      const pj = crearPjPrueba({ rasgos: [rasgoGastado] });
      const resultado = ejecutarDescansoLargo(pj);
      const rasgoActualizado = resultado.personajeActualizado.rasgos?.find((r) => r.id === "induccion-furia");
      expect(rasgoActualizado?.usosRestantes).toBe(3);
    });
  });

  describe("F3-02: Escalado y Fusión de Rasgos", () => {
    it("debe recalcular fórmula de dados al escalar por nivel de personaje", () => {
      const rasgoEscalable = {
        id: "aliento-dragon",
        nombre: "Arma de aliento",
        formulaDados: "1d10",
        escaladoFormulaDados: [
          { nivelMinimo: 5, valor: "2d10" },
          { nivelMinimo: 11, valor: "3d10" },
          { nivelMinimo: 17, valor: "4d10" }
        ]
      };
      const escaladoNv5 = resolverEscaladosRasgo(rasgoEscalable, 5, [], []);
      expect(escaladoNv5.formulaDados).toBe("2d10");
      const escaladoNv11 = resolverEscaladosRasgo(rasgoEscalable, 11, [], []);
      expect(escaladoNv11.formulaDados).toBe("3d10");
    });

    it("debe preservar usos restantes válidos al fusionar rasgos durante subida de nivel", () => {
      const base = {
        id: "furia",
        nombre: "Furia",
        origen: "clase",
        usosMaximos: 3,
        escaladoUsos: { tipo: "por_nivel" as const, tabla: [{ nivelMinimo: 1, valor: 2 }, { nivelMinimo: 3, valor: 3 }] }
      } as RasgoPersonaje;
      const existente = {
        ...base,
        usosMaximos: 2,
        usosRestantes: 1 // Gastó 1 de 2
      } as RasgoPersonaje;
      const fusionado = fusionarEstadoRasgo(base, existente);
      // Al subir el máximo a 3 y haber gastado 1, le quedan 2 disponibles
      expect(fusionado.usosRestantes).toBe(2);
    });
  });

  describe("F3-03: Consumo de Conjuros y Recursos Ligados", () => {
    it("debe resolver id del rasgo padre cuando gastarDePadre es verdadero", () => {
      const rasgoPadre = {
        id: "forma-salvaje",
        nombre: "Forma Salvaje",
        origen: "clase",
        usosMaximos: 2,
        usosRestantes: 2
      } as RasgoPersonaje;
      const rasgoHijo = {
        id: "companero-salvaje",
        nombre: "Compañero Salvaje",
        origen: "clase",
        ligadoA: "forma-salvaje",
        gastarDePadre: true
      } as RasgoPersonaje;
      const targetId = resolverIdRasgoObjetivoGasto(rasgoHijo, [rasgoPadre, rasgoHijo]);
      expect(targetId).toBe("forma-salvaje");
    });
  });

  describe("F3-05: Combate y Evaluador de Expresiones", () => {
    it("debe evaluar correctamente condiciones con_armadura y con_escudo", () => {
      const pjSinArmadura = crearPjPrueba({ inventario: [] });
      expect(cumpleCondicionEfecto("sin_armadura", pjSinArmadura)).toBe(true);
      expect(cumpleCondicionEfecto("con_armadura", pjSinArmadura)).toBe(false);

      const pjConArmadura = crearPjPrueba({
        inventario: [
          {
            idInstancia: "arm-1",
            idObjeto: "cota-malla",
            nombre: "Cota de malla",
            cantidad: 1,
            categoria: "armaduras",
            subcategoria: "pesada",
            equipado: true,
            pesoLb: 55,
            sintonizado: false,
            notas: ""
          } as ObjetoInventario
        ]
      });
      expect(cumpleCondicionEfecto("con_armadura", pjConArmadura)).toBe(true);
      expect(cumpleCondicionEfecto("sin_armadura", pjConArmadura)).toBe(false);
      expect(cumpleCondicionEfecto("sin_armadura_pesada", pjConArmadura)).toBe(false);
    });

    it("debe retornar false para condiciones desconocidas no cumplidas", () => {
      const pj = crearPjPrueba();
      expect(cumpleCondicionEfecto("condicion_inexistente_xyz", pj)).toBe(false);
    });
  });

  describe("F3-06: Multiclase y Dados de Golpe Canónicos", () => {
    it("debe sumar dados de golpe ganados al subir nivel preservando los dados gastados", () => {
      const pj = crearPjPrueba({
        nivel: 3,
        dadosGolpeTotal: 3,
        dadosGolpeRestantes: 1 // Gastó 2 de 3
      });
      const pjSubido = aplicarCambioClaseNivel(pj, 0, "4");
      expect(pjSubido.nivel).toBe(4);
      expect(pjSubido.dadosGolpeTotal).toBe(4);
      expect(pjSubido.dadosGolpeRestantes).toBe(2); // Ganó 1: 1 + 1 = 2 restantes de 4
    });

    it("debe proteger conjuros otorgados por rasgos al reclasificar subclases", () => {
      const sinc = sincronizarMagiaMulticlase(
        [{ nombre: "Mago", subclase: "Evocador", nivel: 5 }],
        null,
        null,
        ["proyectil-magico", "armadura-de-mago", "manos-ardientes"],
        ["proyectil-magico", "armadura-de-mago", "manos-ardientes"],
        ["rayo-de-escarcha"],
        ["manos-ardientes"], // Anterior de subclase
        ["manos-ardientes"] // Protegido por rasgo de especie
      );
      expect(sinc.conjurosPreparadosIds).toContain("manos-ardientes");
    });
  });

  describe("F3-07: Optimización Zod y Selectores", () => {
    it("debe comparar objetos apilables correctamente con WeakMap", () => {
      const objA = {
        idInstancia: "i-1",
        idObjeto: "pocion-curacion",
        nombre: "Poción de curación",
        cantidad: 1,
        categoria: "pociones",
        pesoLb: 0.5,
        equipado: false,
        sintonizado: false,
        notas: ""
      } as unknown as ObjetoInventario;
      const objB = {
        idInstancia: "i-2",
        idObjeto: "pocion-curacion",
        nombre: "Poción de curación",
        cantidad: 3,
        categoria: "pociones",
        pesoLb: 0.5,
        equipado: false,
        sintonizado: false,
        notas: ""
      } as unknown as ObjetoInventario;
      expect(sonObjetosApilables(objA, objB)).toBe(true);

      const objDistinto = {
        ...objB,
        idObjeto: "pocion-fuerza"
      } as ObjetoInventario;
      expect(sonObjetosApilables(objA, objDistinto)).toBe(false);
    });

    it("debe ser seguro ante selectores nulos o indefinidos en esSelectorDeConjuros", () => {
      expect(esSelectorDeConjuros(undefined as unknown as { id: string })).toBe(false);
      expect(esSelectorDeConjuros(null as unknown as { id: string })).toBe(false);
    });
  });
});
