import { describe, it, expect } from "vitest";
import {
  CATALOGO_INVOCACIONES,
  obtenerPlantillaInvocacionPorId,
  esIdInvocacionEscalable,
  calcularCAInvocacion,
  calcularVidaInvocacion,
  calcularAtaquesPorAccionInvocacion,
  proyectarInvocacionAMonstruo,
  extraerContextoLanzador
} from "./factoriaInvocaciones";
import type { ContextoLanzadorInvocacion } from "@/tipos/invocaciones";
import type { PersonajeJugador } from "@/tipos";

describe("factoriaInvocaciones (DND 5.5e / PHB 2024)", () => {
  const contextoLanzadorPrueba: ContextoLanzadorInvocacion = {
    modificadorAtaqueConjuros: 7,
    cdSalvacionConjuros: 15,
    bonificadorCompetencia: 3,
    habilidadConjurosMod: 4
  };

  it("debe cargar el catalogo de invocaciones canonicas con al menos 10 criaturas", () => {
    expect(CATALOGO_INVOCACIONES.length).toBeGreaterThanOrEqual(10);
    expect(esIdInvocacionEscalable("inv_corcel_sobrenatural")).toBe(true);
    expect(esIdInvocacionEscalable("inv_espiritu_bestial")).toBe(true);
    expect(esIdInvocacionEscalable("m_goblin_aleatorio")).toBe(false);
  });

  it("debe extraer correctamente el contexto del lanzador para un Druida o Paladin", () => {
    const druidaMock = {
      id: "pj-1",
      nombre: "Druida Elfo",
      clase: "Druida",
      nivel: 5,
      caracteristicas: {
        fuerza: 10,
        destreza: 14,
        constitucion: 14,
        inteligencia: 12,
        sabiduria: 18,
        carisma: 10
      }
    } as unknown as PersonajeJugador;

    const ctx = extraerContextoLanzador(druidaMock);
    expect(ctx.bonificadorCompetencia).toBe(3);
    expect(ctx.habilidadConjurosMod).toBe(4);
    expect(ctx.modificadorAtaqueConjuros).toBe(7);
    expect(ctx.cdSalvacionConjuros).toBe(15);
  });

  describe("Corcel Sobrenatural (Hallar corcel)", () => {
    const plantillaCorcel = obtenerPlantillaInvocacionPorId("inv_corcel_sobrenatural");
    if (!plantillaCorcel) throw new Error("Plantilla de corcel no encontrada");

    it("calcula CA y Vida exactas a nivel 2 (nivel base)", () => {
      const ca = calcularCAInvocacion(plantillaCorcel, 2);
      const vida = calcularVidaInvocacion(plantillaCorcel, 2);
      expect(ca).toBe(12);
      expect(vida).toBe(25);
    });

    it("calcula CA y Vida exactas a nivel 7 coincidiendo con 5e.tools (CA 17, HP 75)", () => {
      const ca = calcularCAInvocacion(plantillaCorcel, 7);
      const vida = calcularVidaInvocacion(plantillaCorcel, 7);
      expect(ca).toBe(17);
      expect(vida).toBe(75);
    });

    it("proyecta el monstruo completo a nivel 7 con subtipo Celestial", () => {
      const proyectado = proyectarInvocacionAMonstruo(
        plantillaCorcel,
        7,
        contextoLanzadorPrueba,
        "Celestial"
      );

      expect(proyectado.ca).toBe(17);
      expect(proyectado.vidaMaxima).toBe(75);
      expect(proyectado.velocidad).toContain("Volar 60 pies");
      expect(proyectado.accionesRapidas[0].bonificadorAtaque).toBe("+7");
      expect(proyectado.accionesRapidas[0].dadosDaño).toBe("1d8+7");
      expect(proyectado.accionesRapidas[0].tipoDaño).toBe("radiante");

      const tieneToqueSanador = proyectado.accionesAdicionales?.some((a) =>
        a.nombre.includes("Toque sanador")
      );
      const tieneMiradaSiniestra = proyectado.accionesAdicionales?.some((a) =>
        a.nombre.includes("Mirada siniestra")
      );
      expect(tieneToqueSanador).toBe(true);
      expect(tieneMiradaSiniestra).toBe(false);
    });

    it("proyecta el monstruo con subtipo Infernal inyectando la CD de conjuros", () => {
      const proyectado = proyectarInvocacionAMonstruo(
        plantillaCorcel,
        3,
        contextoLanzadorPrueba,
        "Infernal"
      );

      expect(proyectado.accionesRapidas[0].tipoDaño).toBe("necrótico");
      const accionMirada = proyectado.accionesAdicionales?.find((a) =>
        a.nombre.includes("Mirada siniestra")
      );
      expect(accionMirada).toBeDefined();
      expect(accionMirada?.descripcion).toContain("CD 15");
    });
  });

  describe("Espiritu Bestial (Invocar bestia)", () => {
    const plantillaBestia = obtenerPlantillaInvocacionPorId("inv_espiritu_bestial");
    if (!plantillaBestia) throw new Error("Plantilla bestial no encontrada");

    it("escala ataques por accion segun la mitad del nivel de conjuro", () => {
      expect(calcularAtaquesPorAccionInvocacion(plantillaBestia, 2)).toBe(1);
      expect(calcularAtaquesPorAccionInvocacion(plantillaBestia, 3)).toBe(1);
      expect(calcularAtaquesPorAccionInvocacion(plantillaBestia, 4)).toBe(2);
      expect(calcularAtaquesPorAccionInvocacion(plantillaBestia, 6)).toBe(3);
    });

    it("a nivel 4 genera accion de Ataque multiple y dano 1d8+8", () => {
      const proyectado = proyectarInvocacionAMonstruo(
        plantillaBestia,
        4,
        contextoLanzadorPrueba,
        "Tierra"
      );

      expect(proyectado.ca).toBe(15);
      expect(proyectado.vidaMaxima).toBe(30);
      const tieneAtaqueMultiple = proyectado.acciones.some(
        (a) => a.nombre === "Ataque múltiple"
      );
      expect(tieneAtaqueMultiple).toBe(true);

      const ataqueDesgarro = proyectado.acciones.find((a) => a.nombre === "Desgarro");
      expect(ataqueDesgarro?.daño).toBe("1d8+8");
    });
  });
});
