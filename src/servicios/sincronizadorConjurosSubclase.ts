import type { PersonajeJugador, ClasePersonaje } from "@/tipos";
import { obtenerConjurosSubclasePersonaje } from "@/servicios/calculadorMagia";
import { deduplicarListaIds, crearMatcherHechizos } from "@/servicios/comparadorHechizos";
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
  const esNuevoSiemprePrep = crearMatcherHechizos(nuevosSiemprePrep);
  const eliminadosSubclase = viejosSiemprePrep.filter((viejo) => !esNuevoSiemprePrep(viejo));

  // Filtrar de preparados los que correspondían a la subclase anterior
  const esEliminadoSubclase = crearMatcherHechizos(eliminadosSubclase);
  const preparados = deduplicarListaIds(
    (pj.conjurosPreparadosIds || []).filter((prep) => !esEliminadoSubclase(prep))
  );
  // Añadir los nuevos de subclase sin duplicar
  const esPreparado = crearMatcherHechizos(preparados);
  nuevosSiemprePrep.forEach((nuevo) => {
    if (!esPreparado(nuevo)) {
      preparados.push(nuevo);
    }
  });

  // Filtrar de conocidos los eliminados de subclase
  const aprendizajesIndependientes = crearMatcherHechizos(pj.aprendizajesConjurosIndependientes?.conjuros ?? []);
  const conocidos = deduplicarListaIds(
    (pj.conjurosConocidosIds || []).filter(
      (con) => !esEliminadoSubclase(con) || aprendizajesIndependientes(con)
    )
  );
  const esConocido = crearMatcherHechizos(conocidos);
  nuevosSiemprePrep.forEach((nuevo) => {
    if (!esConocido(nuevo)) {
      conocidos.push(nuevo);
    }
  });

  // Trucos de subclase, especie y rasgos
  const trucos = deduplicarListaIds([...(pj.trucosConocidosIds || [])]);
  const esTrucoRegistrado = crearMatcherHechizos(trucos);
  (resultadoSubclase.trucos || []).forEach((t) => {
    if (!esTrucoRegistrado(t)) {
      trucos.push(t);
    }
  });

  for (const r of pj.rasgos || []) {
    if (r.activo === false) continue;
    if (Array.isArray(r.conjurosOtorgados)) {
      for (const c of r.conjurosOtorgados) {
        const cNorm = c.toLowerCase().trim();
        const esTruco = cNorm === "luz" || (r.descripcion && r.descripcion.toLowerCase().includes("truco " + cNorm));
        if (esTruco && !esTrucoRegistrado(c)) {
          trucos.push(c);
        }
      }
    }
  }

  // Limpiar trucos espurios derivados de placeholders de texto (ej. "2 trucos de Mago a elección")
  const trucosSaneados = trucos.filter(
    (t) => !t.toLowerCase().includes("a elecci") && !t.toLowerCase().includes("a elección")
  );

  const sonIgualesArrays = (a?: string[], b?: string[]) => {
    const arrA = a || [];
    const arrB = b || [];
    if (arrA.length !== arrB.length) return false;
    return arrA.every((v, i) => v === arrB[i]);
  };

  if (
    sonIgualesArrays(nuevosSiemprePrep, pj.conjurosSiemprePreparadosIds) &&
    sonIgualesArrays(preparados, pj.conjurosPreparadosIds) &&
    sonIgualesArrays(conocidos, pj.conjurosConocidosIds) &&
    sonIgualesArrays(trucosSaneados, pj.trucosConocidosIds)
  ) {
    return pj;
  }

  return {
    ...pj,
    conjurosSiemprePreparadosIds: nuevosSiemprePrep,
    conjurosPreparadosIds: preparados,
    conjurosConocidosIds: conocidos,
    trucosConocidosIds: trucosSaneados
  };
}
