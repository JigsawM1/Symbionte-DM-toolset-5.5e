import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import {
  calcularReglasFormaSalvaje,
  esBestiaValidaParaDruida,
  calcularHpTemporalFormaSalvaje,
  } from "./reglasFormaSalvaje";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { generarListaAtaquesFisicos } from "./calculadorAtaquesArmas";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";

describe("Druida D&D 5.5e (2024) - Reglas y Mecánicas de Forma Salvaje", () => {
  const lobo = MONSTRUOS_INICIALES.find((m) => m.id === "m_lobo")!;
  const cuervo = MONSTRUOS_INICIALES.find((m) => m.id === "m_cuervo")!;

  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [],
      idPersonajeActivo: null
    });
  });

  describe("1. Reglas Canónicas por Nivel (Límites, VD y Vuelo)", () => {
    it("Nivel 2: 4 formas conocidas, VD máx 1/4, No vuela", () => {
      const reglas = calcularReglasFormaSalvaje(2, false);
      expect(reglas.maxFormasConocidas).toBe(4);
      expect(reglas.vdMaximo).toBe(0.25);
      expect(reglas.puedeVolar).toBe(false);

      expect(esBestiaValidaParaDruida(lobo, 2, false)).toBe(true); // Lobo es VD 1/4
      expect(esBestiaValidaParaDruida(cuervo, 2, false)).toBe(false); // Cuervo vuela, no permitida a nivel 2
    });

    it("Nivel 4: 6 formas conocidas, VD máx 1/2, No vuela", () => {
      const reglas = calcularReglasFormaSalvaje(4, false);
      expect(reglas.maxFormasConocidas).toBe(6);
      expect(reglas.vdMaximo).toBe(0.5);
      expect(reglas.puedeVolar).toBe(false);
    });

    it("Nivel 8: 8 formas conocidas, VD máx 1, Sí vuela", () => {
      const reglas = calcularReglasFormaSalvaje(8, false);
      expect(reglas.maxFormasConocidas).toBe(8);
      expect(reglas.vdMaximo).toBe(1);
      expect(reglas.puedeVolar).toBe(true);

      expect(esBestiaValidaParaDruida(cuervo, 8, false)).toBe(true);
    });

    it("Círculo de la Luna: Escala el VD máx a Nivel/3", () => {
      const reglasNv3 = calcularReglasFormaSalvaje(3, true);
      expect(reglasNv3.vdMaximo).toBe(1); // floor(3/3) = 1

      const reglasNv6 = calcularReglasFormaSalvaje(6, true);
      expect(reglasNv6.vdMaximo).toBe(2); // floor(6/3) = 2
    });
  });

  describe("2. Puntos de Golpe Temporales según Reglas 2024", () => {
    it("Druida base recibe PG temporales iguales a su nivel", () => {
      expect(calcularHpTemporalFormaSalvaje(2, false)).toBe(2);
      expect(calcularHpTemporalFormaSalvaje(5, false)).toBe(5);
    });

    it("Druida Círculo de la Luna recibe 3x su nivel en PG temporales", () => {
      expect(calcularHpTemporalFormaSalvaje(3, true)).toBe(9);
      expect(calcularHpTemporalFormaSalvaje(6, true)).toBe(18);
    });
  });

  describe("3. Estado del Personaje, Adopción de Estadísticas y Combate", () => {
    it("Adopta Fuerza y Destreza de la bestia pero mantiene Sabiduría, Inteligencia y Carisma", () => {
      const store = usarAlmacenDM.getState();
      const idPj = store.crearPersonaje({
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 3,
        caracteristicas: {
          fuerza: 8,
          destreza: 12,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 16,
          carisma: 10
        },
        rasgos: [
          {
            id: "rasgo_forma_salvaje",
            nombre: "Forma salvaje",
            origen: "clase",
            fuente: "PHB 2024",
            tipoAccion: "accion_adicional",
            personalizado: false,
            activo: false,
            notas: "",
            categoriaMecanica: "consumible",
            esActivable: true,
            tieneUsosLimitados: true,
            usosMaximos: 2,
            usosRestantes: 2,
            recuperacion: "descanso_dinamico",
            descripcion: ""
          }
        ]
      });

      // Transformar en Lobo (Lobo tiene FUE 12, DES 15, CA 13)
      store.transformarEnFormaSalvaje(idPj, "m_lobo");

      const pjTransformado = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      expect(pjTransformado.formaSalvaje.formaActivaId).toBe("m_lobo");
      expect(pjTransformado.condicionesActivas).toContain("Forma salvaje");
      expect(pjTransformado.hpTemporal).toBe(3); // Nivel 3 = 3 PG temporales

      // Gasto de 1 uso
      const rasgoActual = pjTransformado.rasgos.find((r) => r.nombre === "Forma salvaje");
      expect(rasgoActual?.usosRestantes).toBe(1);

      // Estadísticas calculadas
      const stats = calcularEstadisticasPersonaje(pjTransformado);
      expect(stats.puntuacionesEfectivas.fuerza).toBe(lobo.caracteristicas.fuerza); // 12 de Lobo
      expect(stats.puntuacionesEfectivas.destreza).toBe(lobo.caracteristicas.destreza); // 15 de Lobo
      expect(stats.puntuacionesEfectivas.sabiduria).toBe(16); // Mantiene druida
      expect(stats.puntuacionesEfectivas.inteligencia).toBe(10); // Mantiene druida

      // CA adoptada
      expect(stats.claseArmadura.total).toBe(lobo.ca);

      // Ataques de la bestia generados en combate
      const ataques = generarListaAtaquesFisicos({
        personajeActivo: pjTransformado,
        statsCalculadas: stats,
        baseDatosObjetos: [],
        caracteristicasArmas: {}
      });

      const ataqueMordisco = ataques.find((a) => a.nombre.includes("Mordisco") || a.subtipo === "Forma Salvaje");
      expect(ataqueMordisco).toBeDefined();

      // Revertir forma
      store.revertirFormaSalvaje(idPj);
      const pjRevertido = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      expect(pjRevertido.formaSalvaje.formaActivaId).toBeNull();
      expect(pjRevertido.condicionesActivas).not.toContain("Forma salvaje");

      const statsRevertidas = calcularEstadisticasPersonaje(pjRevertido);
      expect(statsRevertidas.puntuacionesEfectivas.fuerza).toBe(8);
      expect(statsRevertidas.puntuacionesEfectivas.destreza).toBe(12);
    });

    it("Respeta el límite del pool de formas conocidas al guardarlas", () => {
      const store = usarAlmacenDM.getState();
      const idPj = store.crearPersonaje({
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 2 // Límite de 4 formas conocidas
      });

      store.establecerFormasConocidasDruida(idPj, [
        "m_lobo",
        "m_rata",
        "m_arana",
        "m_caballo_de_monta",
        "m_vaca" // 5 formas: debe recortar a 4
      ]);

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      expect(pj.formaSalvaje.formasConocidasIds).toHaveLength(4);
      expect(pj.formaSalvaje.formasConocidasIds).toEqual([
        "m_lobo",
        "m_rata",
        "m_arana",
        "m_caballo_de_monta"
      ]);
    });
  });
});
