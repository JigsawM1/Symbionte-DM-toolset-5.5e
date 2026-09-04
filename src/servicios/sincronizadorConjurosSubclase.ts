import type { PersonajeJugador, ClasePersonaje } from "@/tipos";
import { obtenerConjurosSubclasePersonaje } from "@/servicios/calculadorMagia";
import { coincideHechizoId, deduplicarListaIds } from "@/servicios/comparadorHechizos";
import { obtenerConjurosOtorgadosPorRasgos } from "@/servicios/evaluadorEfectosRasgos";

/**
 * Sincroniza dinámicamente los conjuros y trucos de subclase en el personaje.
 * Si el personaje baja de nivel o cambia de subclase, elimina de sus listas los conjuros
 * que pertenecían a la subclase previa y ya no son válidos, agregando los nuevos.
 */
export function sincronizarConjurosSubclaseHelper(
  pj: PersonajeJugador,
  clasesActualizadas?: ClasePersonaje[],
  claseActualizada?: string,
  subclaseActualizada?: string,
  nivelActualizado?: number
): PersonajeJugador {
  const clases = clasesActualizadas || pj.clases;
  const clase = claseActualizada !== undefined ? claseActualizada : pj.clase;
  const subclase = subclaseActualizada !== undefined ? subclaseActualizada : pj.subclase;
  const nivel = nivelActualizado !== undefined ? nivelActualizado : pj.nivel;

  const resultadoSubclase = obtenerConjurosSubclasePersonaje(
    clases,
    clase,
    subclase,
    nivel
  );

  const conjurosRasgos = obtenerConjurosOtorgadosPorRasgos(pj);
  const nuevosSiemprePrep = Array.from(new Set([...(resultadoSubclase.conjuros || []), ...conjurosRasgos]));
  const viejosSiemprePrep = pj.conjurosSiemprePreparadosIds || [];

  // Conjuros que eran de subclase pero ya no lo son (por bajada de nivel o cambio de subclase)
  const eliminadosSubclase = viejosSiemprePrep.filter(
    (viejo) => !nuevosSiemprePrep.some((nuevo) => coincideHechizoId(viejo, nuevo))
  );

  // Filtrar de preparados los que correspondían a la subclase anterior
  const preparados = deduplicarListaIds(
    (pj.conjurosPreparadosIds || []).filter(
      (prep) => !eliminadosSubclase.some((elim) => coincideHechizoId(prep, elim))
    )
  );
  // Añadir los nuevos de subclase sin duplicar
  nuevosSiemprePrep.forEach((nuevo) => {
    if (!preparados.some((p) => coincideHechizoId(p, nuevo))) {
      preparados.push(nuevo);
    }
  });

  // Filtrar de conocidos los eliminados de subclase
  const conocidos = deduplicarListaIds(
    (pj.conjurosConocidosIds || []).filter(
      (con) => !eliminadosSubclase.some((elim) => coincideHechizoId(con, elim))
    )
  );
  nuevosSiemprePrep.forEach((nuevo) => {
    if (!conocidos.some((c) => coincideHechizoId(c, nuevo))) {
      conocidos.push(nuevo);
    }
  });

  // Trucos
  const trucos = deduplicarListaIds([...(pj.trucosConocidosIds || [])]);
  (resultadoSubclase.trucos || []).forEach((t) => {
    if (!trucos.some((tr) => coincideHechizoId(tr, t))) {
      trucos.push(t);
    }
  });

  return {
    ...pj,
    conjurosSiemprePreparadosIds: nuevosSiemprePrep,
    conjurosPreparadosIds: preparados,
    conjurosConocidosIds: conocidos,
    trucosConocidosIds: trucos
  };
}
