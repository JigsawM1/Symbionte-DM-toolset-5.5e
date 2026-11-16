import { describe, it, expect } from "vitest";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { CATALOGO_CONJUROS_SUBCLASES } from "@/constantes/subclasesConjurosConstantes";
import {
  calcularEstadisticasMagicasPorOrigen,
  obtenerHabilidadConjuroPersonaje,
  obtenerModificadorAptitudMagica
} from "./estadisticasCombateMagico";
import {
  calcularConteoPreparadosEfectivos,
  obtenerConjurosSiemprePreparadosSubclase,
  obtenerConjurosSubclasePersonaje
} from "./conjurosSubclase";
import {
  construirPerfilLanzadorPersonaje,
  obtenerNivelesConjuroDisponiblesPersonaje,
  puedePersonajeLanzarHechizo
} from "./elegibilidadConjurosPersonaje";

function crearPersonajeBase(parcial: Partial<PersonajeJugador>): PersonajeJugador {
  return {
    ...PERSONAJE_POR_DEFECTO,
    ...parcial,
    caracteristicas: {
      ...PERSONAJE_POR_DEFECTO.caracteristicas,
      ...(parcial.caracteristicas ?? {})
    }
  };
}

function crearHechizoPrueba(
  parcial: Partial<HechizoBase> & Pick<HechizoBase, "id" | "nombre" | "nivel">
): HechizoBase {
  return {
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Acción",
    alcance: "60 pies",
    descripcion: "Hechizo de prueba.",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    ...parcial
  };
}

describe("Orígenes Discriminados de Magia, Subclases y Elegibilidad", () => {
  it("resuelve CD y Ataque Mágico según origen discriminado: clase, dote, especie y objeto", () => {
    const pj = crearPersonajeBase({
      nivel: 5, // Bono competencia = +3
      clase: "Clérigo 3 / Mago 2",
      clasesLanzadoras: [
        { clase: "Clérigo", nivel: 3, tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados" },
        { clase: "Mago", nivel: 2, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
      ],
      caracteristicas: {
        fuerza: 10,
        destreza: 12,
        constitucion: 14,
        inteligencia: 18, // +4
        sabiduria: 16, // +3
        carisma: 14 // +2
      }
    });

    const modsPrecalculados = { inteligencia: 4, sabiduria: 3, carisma: 2 } as const;

    expect(obtenerHabilidadConjuroPersonaje(pj, "Mago")).toBe("inteligencia");
    expect(obtenerModificadorAptitudMagica(pj, "sabiduria", modsPrecalculados)).toBe(3);
    expect(obtenerModificadorAptitudMagica(null)).toBe(0);

    // Origen clase: Mago (+4 INT, PB +3, +1 foco arcano)
    const estMago = calcularEstadisticasMagicasPorOrigen(
      pj,
      { tipo: "clase", clase: "Mago", bonoExtraCD: 1, bonoExtraAtaque: 1 },
      { modificadoresPrecalculados: modsPrecalculados }
    );
    expect(estMago).toEqual({
      origen: "clase",
      habilidad: "inteligencia",
      modificadorHabilidad: 4,
      bonoCompetencia: 3,
      cdConjuros: 16,
      bonoAtaqueConjuro: 8
    });

    // Origen dote: Iniciado en la Magia (CAR +2)
    const estDote = calcularEstadisticasMagicasPorOrigen(
      pj,
      { tipo: "dote", nombreDote: "Iniciado en la Magia", habilidadConjuro: "carisma" },
      { modificadoresPrecalculados: modsPrecalculados }
    );
    expect(estDote.cdConjuros).toBe(13);
    expect(estDote.bonoAtaqueConjuro).toBe(5);

    // Origen especie: Sabiduría (+3)
    const estEspecie = calcularEstadisticasMagicasPorOrigen(
      pj,
      { tipo: "especie", nombreEspecie: "Elfo", habilidadConjuro: "sabiduria" },
      { modificadoresPrecalculados: modsPrecalculados }
    );
    expect(estEspecie.cdConjuros).toBe(14);
    expect(estEspecie.bonoAtaqueConjuro).toBe(6);

    // Origen objeto: Vara con CD fija 17 y ataque +9
    const estObjetoFijo = calcularEstadisticasMagicasPorOrigen(
      pj,
      { tipo: "objeto", nombreObjeto: "Vara de Mago", cdFija: 17, bonoAtaqueFijo: 9 },
      { modificadoresPrecalculados: modsPrecalculados }
    );
    expect(estObjetoFijo.cdConjuros).toBe(17);
    expect(estObjetoFijo.bonoAtaqueConjuro).toBe(9);

    // Origen objeto dinámico sin valores fijos: hereda estadísticas del portador
    const estObjetoDinamico = calcularEstadisticasMagicasPorOrigen(
      pj,
      { tipo: "objeto", nombreObjeto: "Grimorio vinculado", habilidadRespaldo: "inteligencia" },
      { modificadoresPrecalculados: modsPrecalculados }
    );
    expect(estObjetoDinamico.cdConjuros).toBe(15);
    expect(estObjetoDinamico.bonoAtaqueConjuro).toBe(7);
  });

  it("resuelve subclases oficiales, variantes declarativas y conteo de preparados efectivos", () => {
    CATALOGO_CONJUROS_SUBCLASES.push({
      clase: "Druida",
      subclase: "Círculo de Prueba Bioma",
      progresion: [],
      variantes: {
        polar: [{ nivelClase: 3, conjuros: ["h_inmovilizar-persona"], trucos: ["h_rayo-de-escarcha"] }],
        arida: [{ nivelClase: 3, conjuros: ["h_manos-ardientes"], trucos: ["h_descarga-de-fuego"] }]
      }
    });
    try {
      const polar = obtenerConjurosSiemprePreparadosSubclase("Druida", "Círculo de Prueba Bioma", 5, "Polar");
      const arida = obtenerConjurosSiemprePreparadosSubclase("Druida", "Círculo de Prueba Bioma", 5, "Árida");
      expect(polar).toEqual({ conjuros: ["h_inmovilizar-persona"], trucos: ["h_rayo-de-escarcha"] });
      expect(arida).toEqual({ conjuros: ["h_manos-ardientes"], trucos: ["h_descarga-de-fuego"] });
    } finally {
      CATALOGO_CONJUROS_SUBCLASES.pop();
    }

    const multi = obtenerConjurosSubclasePersonaje([
      { nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 },
      { nombre: "Paladín", subclase: "Juramento de Entrega", nivel: 5 }
    ]);
    expect(multi.conjuros).toContain("h_auxilio");
    expect(multi.conjuros).toContain("Zona de verdad");
    expect(multi.conjuros).not.toContain("Auxilio"); // deduplicado con h_auxilio
    expect(multi.conjuros.length).toBeGreaterThanOrEqual(6);

    expect(
      calcularConteoPreparadosEfectivos(
        ["h_bendecir", "h_curar-heridas", "h_escudo-de-fe"],
        ["h_bendecir", "h_curar-heridas"]
      )
    ).toEqual({ libres: 1, subclase: 2, total: 3 });
  });

  it("evalúa perfil lanzador, Arcano Místico, trucos raciales en no-lanzadores y Puntos de Conjuro", () => {
    const guerreroConTruco = crearPersonajeBase({
      esLanzador: false,
      clase: "Guerrero",
      trucosConocidosIds: ["h_mano-de-mago"]
    });
    const manoMago = crearHechizoPrueba({ id: "h_mano-de-mago", nombre: "Mano de mago", nivel: 0, clases: ["mago"] });
    const bolaFuego = crearHechizoPrueba({ id: "h_bola-de-fuego", nombre: "Bola de fuego", nivel: 3, clases: ["mago"] });
    const universalNv1 = crearHechizoPrueba({ id: "h_universal", nombre: "Universal", nivel: 1, clases: [] });

    expect(puedePersonajeLanzarHechizo(guerreroConTruco, manoMago)).toBe(true);
    expect(puedePersonajeLanzarHechizo(guerreroConTruco, bolaFuego)).toBe(false);

    const brujo13 = crearPersonajeBase({
      esLanzador: true,
      clase: "Brujo",
      nivel: 13,
      clasesLanzadoras: [
        { clase: "Brujo", nivel: 13, tipoLanzador: "pacto", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ],
      espaciosPactoMaximos: 3,
      nivelEspacioPacto: 5,
      arcanoMisticoIds: ["7:h_teletransporte"]
    });
    const nivelesBrujo = obtenerNivelesConjuroDisponiblesPersonaje(brujo13);
    expect(nivelesBrujo.has(6)).toBe(true);
    expect(nivelesBrujo.has(7)).toBe(true);

    const hechiceroPuntos = crearPersonajeBase({
      esLanzador: true,
      clase: "Hechicero",
      nivel: 5,
      clasesLanzadoras: [
        { clase: "Hechicero", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
      ],
      puntosConjuroMaximos: 27,
      nivelConjuroMaximo: 3
    });
    const perfil = construirPerfilLanzadorPersonaje(hechiceroPuntos);
    expect(puedePersonajeLanzarHechizo(hechiceroPuntos, universalNv1, perfil)).toBe(true);
  });
});
