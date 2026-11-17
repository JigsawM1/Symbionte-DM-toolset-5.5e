/**
 * calculadorHabilidadesPasivas.ts
 * -------------------------------
 * Cálculo puro de grados de competencia efectivos (`ninguna`, `medio`, `competente`,
 * `pericia`), modificadores de habilidad, sustituciones por Fuerza en Furia,
 * bonos pasivos de equipo/rasgos, superposición de Forma Salvaje (D&D 2024)
 * y puntuaciones pasivas de Percepción, Investigación y Perspicacia.
 */

import type {
  Caracteristica,
  EfectoPasivo,
  GradoCompetencia,
  Habilidad,
  MonstruoBase,
  PersonajeJugador
} from "@/tipos";
import { MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes/personajeConstantes";
import { extraerSentidosBestia } from "@/servicios/reglasFormaSalvaje";
import {
  obtenerBonosHabilidadesRasgos,
  obtenerHabilidadesConFuerzaRasgos,
  tieneMedioBonoHabilidades
} from "@/servicios/rasgos/evaluadorSalvacionesRasgos";
import {
  LISTA_HABILIDADES,
  MAPA_HABILIDAD_NORMALIZADA,
  normalizarTextoEstadistica,
  type CompetenciasExtraRasgos,
  type ResultadoHabilidadesYPasivas
} from "./tiposEstadisticasPersonaje";

function calcularBonoPorGrado(grado: GradoCompetencia, bonoCompetencia: number): number {
  if (grado === "competente") return bonoCompetencia;
  if (grado === "pericia") return bonoCompetencia * 2;
  if (grado === "medio") return Math.floor(bonoCompetencia / 2);
  return 0;
}

/**
 * Resuelve los grados efectivos, totales por habilidad y puntuaciones pasivas del personaje.
 */
export function calcularHabilidadesYPasivas(
  pj: PersonajeJugador | null | undefined,
  bonoCompetencia: number,
  modificadores: Record<Caracteristica, number>,
  compExtraRasgos: CompetenciasExtraRasgos,
  bestiaActiva: MonstruoBase | null,
  efectosPasivosActivos: readonly EfectoPasivo[]
): ResultadoHabilidadesYPasivas {
  const habilidades = {} as Record<Habilidad, number>;
  const gradosHabilidadesEfectivos = {} as Record<Habilidad, GradoCompetencia>;
  const grados: Partial<Record<Habilidad, GradoCompetencia>> = pj?.gradosHabilidades ?? {};
  const personalizaciones: NonNullable<PersonajeJugador["personalizacionesHabilidades"]> =
    pj?.personalizacionesHabilidades ?? {};
  const habsConFuerzaRasgos = pj ? obtenerHabilidadesConFuerzaRasgos(pj) : new Set<string>();
  const tieneAprendiz = pj ? tieneMedioBonoHabilidades(pj) : false;

  for (const hab of LISTA_HABILIDADES) {
    const caracAsociada = MAPA_HABILIDAD_A_CARACTERISTICA[hab];
    const modBase = modificadores[caracAsociada] || 0;
    const gradoExtra = compExtraRasgos.habilidades.includes(hab) ? "competente" : "ninguna";
    const gradoGuardado = grados[hab] || "ninguna";
    const gradoBase: GradoCompetencia =
      gradoGuardado === "pericia"
        ? "pericia"
        : gradoExtra === "competente"
          ? "competente"
          : gradoGuardado;

    const grado: GradoCompetencia = compExtraRasgos.pericias.includes(hab)
      ? "pericia"
      : gradoBase === "ninguna" && tieneAprendiz
        ? "medio"
        : gradoBase;

    gradosHabilidadesEfectivos[hab] = grado;
    const custom = personalizaciones[hab];

    if (custom?.valorFijo !== null && custom?.valorFijo !== undefined) {
      habilidades[hab] = custom.valorFijo;
    } else {
      const bonoHabilidad = calcularBonoPorGrado(grado, bonoCompetencia);
      const modExtra = custom?.modificadorExtra || 0;
      const usaFuerzaPorRasgo = habsConFuerzaRasgos.has(hab);
      const modEfectivo =
        usaFuerzaPorRasgo && modificadores.fuerza > modBase ? modificadores.fuerza : modBase;
      habilidades[hab] = modEfectivo + bonoHabilidad + modExtra;
    }
  }

  // Aplicar bonos pasivos a habilidades procedentes de equipo en O(1)
  for (const efecto of efectosPasivosActivos) {
    const tipoNorm = normalizarTextoEstadistica(efecto.tipo || "");
    if (!tipoNorm.includes("habilidad") && !tipoNorm.includes("pericia")) continue;

    const bonoNorm = normalizarTextoEstadistica(efecto.bono || "");
    const valNum = Number(efecto.valor) || 0;
    if (bonoNorm === "todas" || bonoNorm === "universal") {
      for (const hab of LISTA_HABILIDADES) {
        habilidades[hab] += valNum;
      }
    } else {
      const matchHab = MAPA_HABILIDAD_NORMALIZADA.get(bonoNorm);
      if (matchHab) {
        habilidades[matchHab] += valNum;
      }
    }
  }

  // Bonos a habilidades procedentes de efectos mecánicos de rasgos (bono_habilidad)
  if (pj) {
    const bonosHabsRasgos = obtenerBonosHabilidadesRasgos(pj, undefined, modificadores);
    for (const [hab, bono] of Object.entries(bonosHabsRasgos)) {
      if (hab in habilidades && typeof bono === "number") {
        habilidades[hab as Habilidad] += bono;
      }
    }
  }

  // D&D 2024: en Forma salvaje conserva sus competencias y usa el bono de la bestia si es superior
  if (bestiaActiva?.habilidades) {
    for (const [hab, modBestia] of Object.entries(bestiaActiva.habilidades)) {
      if (typeof modBestia === "number" && hab in habilidades) {
        const clave = hab as Habilidad;
        habilidades[clave] = Math.max(habilidades[clave], modBestia);
      }
    }
  }

  const sentidosBestia = bestiaActiva ? extraerSentidosBestia(bestiaActiva) : null;
  const pasivas = {
    percepcion: Math.max(10 + (habilidades.percepcion || 0), sentidosBestia?.percepcionPasiva ?? 0),
    investigacion: 10 + (habilidades.investigacion || 0),
    perspicacia: 10 + (habilidades.perspicacia || 0)
  };

  return {
    habilidades,
    gradosHabilidadesEfectivos,
    pasivas
  };
}
