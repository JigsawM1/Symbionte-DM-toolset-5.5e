/**
 * calculadorSalvaciones.ts
 * ------------------------
 * Cálculo puro de las tiradas de salvación del personaje: competencias base
 * y por rasgos, personalizaciones, bonos pasivos de equipo, Enfoque fanático,
 * superposición de Forma Salvaje (D&D 2024) y efectos `bono_salvacion`.
 */

import type { Caracteristica, EfectoPasivo, MonstruoBase, PersonajeJugador } from "@/tipos";
import { obtenerBonosSalvacionesRasgos } from "@/servicios/rasgos/evaluadorSalvacionesRasgos";
import {
  obtenerBonoDanoFuria,
  obtenerNivelClasePersonaje
} from "@/servicios/rasgos/utilidadesRasgos";
import {
  LISTA_CARACTERISTICAS,
  MAPA_ALIAS_CARAC,
  normalizarTextoEstadistica,
  type CompetenciasExtraRasgos
} from "./tiposEstadisticasPersonaje";

/** Calcula los modificadores finales de tiradas de salvación por característica. */
export function calcularTiradasSalvacion(
  pj: PersonajeJugador | null | undefined,
  bonoCompetencia: number,
  modificadores: Record<Caracteristica, number>,
  compExtraRasgos: CompetenciasExtraRasgos,
  bestiaActiva: MonstruoBase | null,
  efectosPasivosActivos: readonly EfectoPasivo[]
): Record<Caracteristica, number> {
  const personalizacionesCarac = pj?.personalizacionesCaracteristicas || {};
  const salvaciones = {} as Record<Caracteristica, number>;

  for (const stat of LISTA_CARACTERISTICAS) {
    const tieneCompetencia =
      Boolean(pj?.competenciasSalvacion?.[stat]) || compExtraRasgos.salvaciones.includes(stat);
    salvaciones[stat] =
      modificadores[stat] +
      (tieneCompetencia ? bonoCompetencia : 0) +
      (personalizacionesCarac[stat]?.bonoSalvacionExtra || 0);
  }

  // Bonos pasivos de objetos equipados/sintonizados
  for (const efecto of efectosPasivosActivos) {
    const tipoNorm = normalizarTextoEstadistica(efecto.tipo || "");
    if (!tipoNorm.includes("salvacion")) continue;

    const bonoNorm = normalizarTextoEstadistica(efecto.bono || "");
    const valNum = Number(efecto.valor) || 0;
    if (bonoNorm === "todas" || bonoNorm === "universal" || bonoNorm === "todas las salvaciones") {
      for (const stat of LISTA_CARACTERISTICAS) {
        salvaciones[stat] += valNum;
      }
    } else {
      const caracClave = MAPA_ALIAS_CARAC[bonoNorm];
      if (caracClave) {
        salvaciones[caracClave] += valNum;
      }
    }
  }

  // Enfoque fanático (Senda del Fanático): bono de Daño de Furia a todas las salvaciones si está activo
  if (pj) {
    const rasgosPj = pj.rasgos || [];
    const rasgoEnfoque = rasgosPj.find(
      (r) =>
        (r.id.includes("enfoque_fanatico") ||
          normalizarTextoEstadistica(r.nombre).includes("enfoque fanatico")) &&
        r.activo
    );
    const yaTieneBonoDeclarativo = rasgosPj.some(
      (r) => r.activo && r.efectos?.some((e) => e.tipo === "bono_salvacion")
    );
    if (rasgoEnfoque && !yaTieneBonoDeclarativo) {
      const nivelBarbaro =
        obtenerNivelClasePersonaje(pj, "bárbaro") ||
        obtenerNivelClasePersonaje(pj, "barbaro") ||
        pj.nivel ||
        1;
      const bonoFuriaSalv = obtenerBonoDanoFuria(nivelBarbaro);
      for (const stat of LISTA_CARACTERISTICAS) {
        salvaciones[stat] += bonoFuriaSalv;
      }
    }
  }

  // D&D 2024: en Forma salvaje conserva sus competencias y usa el bono de la bestia si es superior
  if (bestiaActiva?.salvaciones) {
    for (const [k, modBestia] of Object.entries(bestiaActiva.salvaciones)) {
      if (typeof modBestia === "number" && k in salvaciones) {
        const clave = k as Caracteristica;
        salvaciones[clave] = Math.max(salvaciones[clave], modBestia);
      }
    }
  }

  // Bonos a salvaciones procedentes de efectos mecánicos de rasgos (bono_salvacion)
  if (pj) {
    const bonosSalvRasgos = obtenerBonosSalvacionesRasgos(pj, modificadores);
    for (const stat of LISTA_CARACTERISTICAS) {
      salvaciones[stat] += bonosSalvRasgos[stat] || 0;
    }
  }

  return salvaciones;
}
