import { describe, it, expect, vi } from "vitest";
import { COSTE_PUNTOS_POR_NIVEL, PERSONAJE_POR_DEFECTO } from "@/constantes";
import { consumirRecursoConjuro } from "../consumidorRecursosConjuros";
import { prepararLanzamiento, validarLanzamiento } from "../servicioLanzamientoConjuros";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import {
  calcularEspaciosPacto,
  esLanzadorDePacto,
  obtenerNivelesArcanoMisticoDisponibles
} from "./magiaPactoBrujo";
import {
  gastarRecursoLanzamientoConjuro,
  obtenerOpcionesLanzamientoConjuro
} from "./lanzamientoYUpcasting";

describe("Magia de Pacto (Brujo), Upcasting y Delegación de Gasto", () => {
  it("valida la progresión completa de Pact Magic del Brujo de nivel 1 a 20 y acotamiento defensivo", () => {
    const esperados: Array<[number, number, number]> = [
      [1, 1, 1],
      [2, 2, 1],
      [3, 2, 2],
      [5, 2, 3],
      [7, 2, 4],
      [9, 2, 5],
      [11, 3, 5],
      [16, 3, 5],
      [17, 4, 5],
      [20, 4, 5]
    ];

    for (const [nivelBrujo, espacios, nivel] of esperados) {
      expect(calcularEspaciosPacto(nivelBrujo)).toEqual({ espacios, nivel });
    }

    expect(calcularEspaciosPacto(-5)).toEqual({ espacios: 1, nivel: 1 });
    expect(calcularEspaciosPacto(25)).toEqual({ espacios: 4, nivel: 5 });
    expect(esLanzadorDePacto({ clase: "Brujo", tipoLanzador: "pacto" })).toBe(true);
    expect(esLanzadorDePacto({ clase: "Warlock", tipoLanzador: "completo" })).toBe(true);
    expect(esLanzadorDePacto({ clase: "Mago", tipoLanzador: "completo" })).toBe(false);
  });

  it("calcula los niveles de Arcano Místico desbloqueados de nivel 1 al 20", () => {
    expect(obtenerNivelesArcanoMisticoDisponibles(10)).toEqual([]);
    expect(obtenerNivelesArcanoMisticoDisponibles(11)).toEqual([6]);
    expect(obtenerNivelesArcanoMisticoDisponibles(13)).toEqual([6, 7]);
    expect(obtenerNivelesArcanoMisticoDisponibles(15)).toEqual([6, 7, 8]);
    expect(obtenerNivelesArcanoMisticoDisponibles(17)).toEqual([6, 7, 8, 9]);
    expect(obtenerNivelesArcanoMisticoDisponibles(20)).toEqual([6, 7, 8, 9]);
  });

  it("genera opciones de lanzamiento para Trucos, Modo Libre DM, Brujo Puro y Puntos DMG", () => {
    expect(obtenerOpcionesLanzamientoConjuro({ nivelHechizo: 0 })).toEqual([
      { nivel: 0, etiqueta: "Truco", tipo: "estandar" }
    ]);

    const libre = obtenerOpcionesLanzamientoConjuro({
      nivelHechizo: 6,
      permitirUpcastLibre: true
    });
    expect(libre.map((o) => o.nivel)).toEqual([6, 7, 8, 9]);
    expect(libre[0].etiqueta).toBe("Nv. 6");
    expect(libre[1].etiqueta).toBe("Nv. 7 ↑");

    expect(
      obtenerOpcionesLanzamientoConjuro({
        nivelHechizo: 1,
        esLanzadorPacto: true,
        nivelEspacioPacto: 3,
        espaciosPactoMaximos: 2
      })
    ).toEqual([{ nivel: 3, etiqueta: "Pacto Nv. 3", tipo: "pacto" }]);

    const puntosDMG = obtenerOpcionesLanzamientoConjuro({
      nivelHechizo: 2,
      sistemaMagia: "puntos",
      nivelConjuroMaximo: 4
    });
    expect(puntosDMG.map((o) => o.nivel)).toEqual([2, 3, 4]);
  });

  it("etiqueta correctamente multiclase Brujo + Mago y maneja fallback sin ranuras", () => {
    const opciones = obtenerOpcionesLanzamientoConjuro({
      nivelHechizo: 1,
      espaciosConjuroMaximos: { "1": 4, "2": 3, "3": 2 },
      esLanzadorPacto: true,
      nivelEspacioPacto: 3,
      espaciosPactoMaximos: 2
    });

    expect(opciones).toEqual([
      { nivel: 1, etiqueta: "Nv. 1", tipo: "estandar" },
      { nivel: 2, etiqueta: "Nv. 2 ↑", tipo: "estandar" },
      { nivel: 3, etiqueta: "Nv. 3 ↑ (Pacto/Estándar)", tipo: "pacto" }
    ]);

    const soloPactoNv4 = obtenerOpcionesLanzamientoConjuro({
      nivelHechizo: 1,
      espaciosConjuroMaximos: { "1": 2 },
      esLanzadorPacto: true,
      nivelEspacioPacto: 4,
      espaciosPactoMaximos: 2
    });
    expect(soloPactoNv4[1]).toEqual({ nivel: 4, etiqueta: "Nv. 4 ↑ (Pacto)", tipo: "pacto" });

    expect(obtenerOpcionesLanzamientoConjuro({ nivelHechizo: 2 })).toEqual([
      { nivel: 2, etiqueta: "Nv. 2", tipo: "estandar" }
    ]);
  });

  it.each([
    { gastadosPacto: 0, sistemaMagia: "espacios", gasto: "pacto", saldos: [1, 0, 0] },
    { gastadosPacto: 1, sistemaMagia: "espacios", gasto: "espacio", saldos: [1, 1, 0] },
    { gastadosPacto: 1, sistemaMagia: "puntos", gasto: "puntos", saldos: [1, 0, 2] }
  ] as const)("gasta solo $gasto al lanzar con $gastadosPacto ranuras de Pacto usadas", ({
    gastadosPacto, sistemaMagia, gasto, saldos
  }) => {
    const hechizo = HECHIZOS_INICIALES.find((h) => h.nivel === 1)!;
    const personaje = {
      ...PERSONAJE_POR_DEFECTO,
      espaciosConjuroMaximos: { 1: 2 },
      espaciosPactoMaximos: 1,
      espaciosPactoGastados: gastadosPacto,
      nivelEspacioPacto: 1,
      puntosConjuroMaximos: 3
    };
    const contexto = {
      personajeActual: personaje, sistemaMagia, costePuntosPorNivel: COSTE_PUNTOS_POR_NIVEL,
      esLanzadorPacto: true, nivelEspacioPacto: 1, espaciosPactoMaximos: 1,
      espaciosPactoGastados: gastadosPacto
    };
    const solicitud = { modo: "espacio", hechizo, nivelLanzamiento: 1 } as const;
    const preparado = prepararLanzamiento(solicitud, contexto);
    expect(preparado.gasto.tipo).toBe(gasto);
    expect(validarLanzamiento(solicitud, contexto, preparado).permitido).toBe(true);
    const resultado = consumirRecursoConjuro(personaje, preparado.gasto);
    expect(resultado.permitido).toBe(true);
    if (!resultado.permitido) throw new Error(resultado.motivo);
    expect([
      resultado.personaje.espaciosPactoGastados,
      resultado.personaje.espaciosConjuroGastados[1] ?? 0,
      resultado.personaje.puntosConjuroGastados
    ]).toEqual(saldos);
  });

  it("prioriza gasto de Pacto cuando coincide el nivel y delega a estándar o puntos DMG si el pacto está agotado", () => {
    const onPacto = vi.fn();
    const onEspacio = vi.fn();
    const onPuntos = vi.fn();

    expect(gastarRecursoLanzamientoConjuro({ nivelLanzamiento: 0 })).toEqual({
      recursoGastado: "ninguno"
    });

    const resPacto = gastarRecursoLanzamientoConjuro({
      nivelLanzamiento: 3,
      esLanzadorPacto: true,
      nivelEspacioPacto: 3,
      espaciosPactoMaximos: 2,
      espaciosPactoGastados: 1,
      espaciosConjuroMaximos: { "1": 4, "3": 2 },
      alGastarEspacioPacto: onPacto,
      alGastarEspacio: onEspacio
    });
    expect(resPacto).toEqual({ recursoGastado: "pacto", nivel: 3 });
    expect(onPacto).toHaveBeenCalledTimes(1);
    expect(onEspacio).not.toHaveBeenCalled();

    // Pacto agotado (2/2): delega a ranura estándar de nivel 3
    const resDelegado = gastarRecursoLanzamientoConjuro({
      nivelLanzamiento: 3,
      esLanzadorPacto: true,
      nivelEspacioPacto: 3,
      espaciosPactoMaximos: 2,
      espaciosPactoGastados: 2,
      espaciosConjuroMaximos: { "1": 4, "3": 2 },
      alGastarEspacioPacto: onPacto,
      alGastarEspacio: onEspacio
    });
    expect(resDelegado).toEqual({ recursoGastado: "espacio", nivel: 3 });
    expect(onEspacio).toHaveBeenCalledWith(3);

    // Delegación a Puntos DMG
    const resPuntos = gastarRecursoLanzamientoConjuro({
      nivelLanzamiento: 4,
      sistemaMagia: "puntos",
      costePuntosPorNivel: COSTE_PUNTOS_POR_NIVEL,
      alGastarPuntos: onPuntos
    });
    expect(resPuntos).toEqual({ recursoGastado: "puntos", puntos: 6, nivel: 4 });
    expect(onPuntos).toHaveBeenCalledWith(6);
  });
});
