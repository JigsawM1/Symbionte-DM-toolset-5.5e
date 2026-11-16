import type { Caracteristica, PersonajeJugador } from "@/tipos";
import { obtenerBonoCompetenciaPorNivel, resolverAtributoConjuroClase } from "@/constantes";
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
import { logger } from "@/utiles/logger";
import { detectarTipoLanzador, normalizarTextoMagia } from "./catalogoProgresionMagica";
import type { ContextoOrigenMagia, EstadisticasMagicasResueltas } from "./tiposMagia";

/**
 * Calcula la Clase de Dificultad (CD) para tiradas de salvación de conjuros.
 * Fórmula oficial: 8 + Bono de Competencia + Modificador de Característica (+ bonoExtra opcional)
 */
export function calcularCDConjuros(
  bonoCompetencia: number,
  modificadorHabilidad: number,
  bonoExtra: number = 0
): number {
  return 8 + bonoCompetencia + modificadorHabilidad + bonoExtra;
}

/**
 * Calcula el Bonificador de Ataque con Conjuros.
 * Fórmula oficial: Bono de Competencia + Modificador de Característica (+ bonoExtra opcional)
 */
export function calcularBonoAtaqueConjuro(
  bonoCompetencia: number,
  modificadorHabilidad: number,
  bonoExtra: number = 0
): number {
  return bonoCompetencia + modificadorHabilidad + bonoExtra;
}

/**
 * Obtiene la característica de lanzamiento del personaje, priorizando la clase indicada si existe.
 */
export function obtenerHabilidadConjuroPersonaje(
  pj: PersonajeJugador | null | undefined,
  claseObjetivo?: string
): Caracteristica {
  const clasesLanzadoras = pj?.clasesLanzadoras;
  if (clasesLanzadoras && clasesLanzadoras.length > 0) {
    if (claseObjetivo) {
      const objetivoNorm = normalizarTextoMagia(claseObjetivo);
      const coincidente = clasesLanzadoras.find(
        (c) => normalizarTextoMagia(c.clase) === objetivoNorm
      );
      if (coincidente?.habilidadConjuro) {
        return coincidente.habilidadConjuro;
      }
    }
    if (clasesLanzadoras[0].habilidadConjuro) {
      return clasesLanzadoras[0].habilidadConjuro;
    }
  }

  const atributoResuelto = resolverAtributoConjuroClase(claseObjetivo || pj?.clase || "");
  return atributoResuelto || "inteligencia";
}

/**
 * Obtiene el modificador numérico de aptitud mágica del personaje (ej. +3, +4).
 * Reutiliza modificadores precalculados cuando se proveen o deriva desde las estadísticas del personaje.
 */
export function obtenerModificadorAptitudMagica(
  pj: PersonajeJugador | null | undefined,
  aptitud?: Caracteristica,
  modificadoresPrecalculados?: Partial<Record<Caracteristica, number>>
): number {
  if (!pj) return 0;
  const habilidad = aptitud ?? obtenerHabilidadConjuroPersonaje(pj);

  if (modificadoresPrecalculados && typeof modificadoresPrecalculados[habilidad] === "number") {
    return modificadoresPrecalculados[habilidad]!;
  }

  try {
    const stats = calcularEstadisticasPersonaje(pj);
    if (stats?.modificadores && typeof stats.modificadores[habilidad] === "number") {
      return stats.modificadores[habilidad];
    }
  } catch (error) {
    logger.warn(
      "[calculadorMagia] Fallo al calcular estadísticas completas para aptitud mágica, aplicando fallback:",
      error
    );
  }

  const valorCarac = pj.caracteristicas ? (pj.caracteristicas[habilidad] ?? 10) : 10;
  return Math.floor((valorCarac - 10) / 2);
}

/**
 * Resuelve CD, bono de ataque y aptitud mágica según la unión discriminada del origen de magia
 * (clase, dote, especie u objeto mágico).
 */
export function calcularEstadisticasMagicasPorOrigen(
  pj: PersonajeJugador | null | undefined,
  origen: ContextoOrigenMagia,
  opciones?: {
    readonly bonoCompetencia?: number;
    readonly modificadoresPrecalculados?: Partial<Record<Caracteristica, number>>;
  }
): EstadisticasMagicasResueltas {
  const bonoCompetencia =
    opciones?.bonoCompetencia ?? obtenerBonoCompetenciaPorNivel(pj?.nivel ?? 1);
  const bonoExtraCD = origen.bonoExtraCD ?? 0;
  const bonoExtraAtaque = origen.bonoExtraAtaque ?? 0;

  switch (origen.tipo) {
    case "clase": {
      const habilidad =
        origen.habilidadExplicita ??
        detectarTipoLanzador(origen.clase, origen.subclase)?.habilidad ??
        obtenerHabilidadConjuroPersonaje(pj, origen.clase);
      const modificadorHabilidad = obtenerModificadorAptitudMagica(
        pj,
        habilidad,
        opciones?.modificadoresPrecalculados
      );
      return {
        origen: "clase",
        habilidad,
        modificadorHabilidad,
        bonoCompetencia,
        cdConjuros: calcularCDConjuros(bonoCompetencia, modificadorHabilidad, bonoExtraCD),
        bonoAtaqueConjuro: calcularBonoAtaqueConjuro(
          bonoCompetencia,
          modificadorHabilidad,
          bonoExtraAtaque
        )
      };
    }

    case "dote":
    case "especie": {
      const habilidad = origen.habilidadConjuro;
      const modificadorHabilidad = obtenerModificadorAptitudMagica(
        pj,
        habilidad,
        opciones?.modificadoresPrecalculados
      );
      return {
        origen: origen.tipo,
        habilidad,
        modificadorHabilidad,
        bonoCompetencia,
        cdConjuros: calcularCDConjuros(bonoCompetencia, modificadorHabilidad, bonoExtraCD),
        bonoAtaqueConjuro: calcularBonoAtaqueConjuro(
          bonoCompetencia,
          modificadorHabilidad,
          bonoExtraAtaque
        )
      };
    }

    case "objeto": {
      const habilidad = origen.habilidadRespaldo ?? obtenerHabilidadConjuroPersonaje(pj);
      const modificadorHabilidad = obtenerModificadorAptitudMagica(
        pj,
        habilidad,
        opciones?.modificadoresPrecalculados
      );
      const cdBase =
        typeof origen.cdFija === "number" && Number.isFinite(origen.cdFija)
          ? origen.cdFija + bonoExtraCD
          : calcularCDConjuros(bonoCompetencia, modificadorHabilidad, bonoExtraCD);
      const ataqueBase =
        typeof origen.bonoAtaqueFijo === "number" && Number.isFinite(origen.bonoAtaqueFijo)
          ? origen.bonoAtaqueFijo + bonoExtraAtaque
          : calcularBonoAtaqueConjuro(bonoCompetencia, modificadorHabilidad, bonoExtraAtaque);

      return {
        origen: "objeto",
        habilidad,
        modificadorHabilidad,
        bonoCompetencia,
        cdConjuros: cdBase,
        bonoAtaqueConjuro: ataqueBase
      };
    }
  }
}
