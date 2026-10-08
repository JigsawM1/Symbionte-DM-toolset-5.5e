import type { DefinicionClase, DefinicionSubclase, PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { CATALOGO_CLASES_DND55, DICCIONARIO_CLASES_POR_NOMBRE, DICCIONARIO_CLASES_POR_ID, TODAS_SUBCLASES_DND55 } from "@/constantes/clasesDND55";


/**
 * Normaliza cadenas de texto para comparaciones tolerantes (insensible a tildes, mayúsculas y espacios).
 */
export function normalizarTextoClase(texto: unknown): string {
  if (typeof texto !== "string") return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Determina si el nombre de un rasgo corresponde a un marcador o placeholder
 * de adquisición de subclase que no debe renderizarse directamente en la ficha.
 */
export function esRasgoPlaceholderSubclase(nombre: string): boolean {
  if (!nombre) return false;
  const norm = normalizarTextoClase(nombre);
  return (
    norm === "subclase" ||
    norm.startsWith("subclase de") ||
    norm === "rasgo de subclase" ||
    norm.includes("rasgo de subclase")
  );
}

/**
 * Retorna la lista completa de las 12 clases oficiales de D&D 5.5e (2024).
 */
export function obtenerCatalogoClases(): DefinicionClase[] {
  return CATALOGO_CLASES_DND55;
}

/**
 * Retorna todas las 48 subclases canónicas del sistema.
 */
export function obtenerTodasSubclases(): DefinicionSubclase[] {
  return TODAS_SUBCLASES_DND55;
}

/**
 * Busca una clase por su ID o clave interna.
 */
export function obtenerClasePorId(id: string): DefinicionClase | undefined {
  if (!id) return undefined;
  const idNorm = normalizarTextoClase(id);
  return DICCIONARIO_CLASES_POR_ID[idNorm] || CATALOGO_CLASES_DND55.find((c) => normalizarTextoClase(c.id) === idNorm);
}

/**
 * Busca una clase de forma tolerante e insensible a acentos/mayúsculas por su nombre.
 */
export function obtenerClasePorNombre(nombre: string): DefinicionClase | undefined {
  if (!nombre) return undefined;
  if (DICCIONARIO_CLASES_POR_NOMBRE[nombre]) {
    return DICCIONARIO_CLASES_POR_NOMBRE[nombre];
  }
  const norm = normalizarTextoClase(nombre);
  return CATALOGO_CLASES_DND55.find((c) => {
    const cNorm = normalizarTextoClase(c.nombre);
    const idNorm = normalizarTextoClase(c.id);
    return cNorm === norm || idNorm === norm || cNorm.includes(norm) || norm.includes(cNorm);
  });
}

/**
 * Retorna las subclases pertenecientes a una clase específica.
 */
export function obtenerSubclasesDeClase(claseNombreOId: string): DefinicionSubclase[] {
  const clase = obtenerClasePorNombre(claseNombreOId) || obtenerClasePorId(claseNombreOId);
  if (!clase) return [];
  return clase.subclases;
}

/**
 * Busca una subclase por nombre tolerante dentro de una clase (o en el catálogo global si no se especifica clase).
 */
export const ALIAS_SUBCLASES_EQUIVALENTES: Record<string, string> = {
  "camino de la sombra": "guerrero de la sombra",
  "camino de la misericordia": "guerrero de la misericordia",
  "camino de los elementos": "guerrero de los elementos",
  "camino de la mano abierta": "guerrero de la mano abierta",
  "guerrero de la sombra": "camino de la sombra",
  "guerrero de la misericordia": "camino de la misericordia",
  "guerrero de los elementos": "camino de los elementos",
  "guerrero de la mano abierta": "camino de la mano abierta"
};

export function obtenerSubclasePorNombre(
  claseNombreOId?: string,
  subclaseNombre?: string
): DefinicionSubclase | undefined {
  if (!subclaseNombre) return undefined;
  const subNorm = normalizarTextoClase(subclaseNombre);
  const alias = ALIAS_SUBCLASES_EQUIVALENTES[subNorm];

  const coincideSubclase = (s: DefinicionSubclase): boolean => {
    const sNorm = normalizarTextoClase(s.nombre);
    const sId = normalizarTextoClase(s.id);
    return (
      sNorm === subNorm ||
      sId === subNorm ||
      (!!alias && (sNorm === alias || sId === alias)) ||
      sNorm.includes(subNorm) ||
      subNorm.includes(sNorm)
    );
  };

  if (claseNombreOId) {
    const subclases = obtenerSubclasesDeClase(claseNombreOId);
    const encontrada = subclases.find(coincideSubclase);
    if (encontrada) return encontrada;
  }

  // Búsqueda global de contingencia
  return TODAS_SUBCLASES_DND55.find(coincideSubclase);
}

/**
 * Obtiene el nivel efectivo que aplica a un rasgo en el contexto de un personaje.
 * - Para rasgos de clase o subclase (o asociados a una clase específica): retorna el nivel individual de dicha clase.
 * - Para rasgos de especie, subespecie, dote, trasfondo o personalizados (o si no se identifica la clase): retorna el nivel general del personaje.
 */
export function obtenerNivelEfectivoParaRasgo(
  personaje: PersonajeJugador | null | undefined,
  rasgo: RasgoPersonaje | null | undefined
): number {
  if (!personaje) return 1;
  const nivelGeneral = Math.max(1, Math.min(20, personaje.nivel || 1));
  if (!rasgo) return nivelGeneral;

  // Si es claramente un rasgo general no dependiente de clase (especie, dote, trasfondo), aplica el nivel general
  if (
    rasgo.origen === "especie" ||
    rasgo.origen === "subespecie" ||
    rasgo.origen === "dote" ||
    rasgo.origen === "trasfondo"
  ) {
    return nivelGeneral;
  }

  // Clases configuradas en el personaje
  const clasesPersonaje: Array<{ nombre: string; subclase?: string; nivel: number }> =
    personaje.clases && personaje.clases.length > 0
      ? personaje.clases
      : [
          {
            nombre: personaje.clase || "Guerrero",
            subclase: personaje.subclase || "",
            nivel: personaje.nivel || 1
          }
        ];

  // Si el personaje solo cuenta con una clase configurada, su nivel coincide con el general
  if (clasesPersonaje.length === 1) {
    return clasesPersonaje[0].nivel || nivelGeneral;
  }

  const normFuente = normalizarTextoClase(rasgo.fuente || "");
  const normId = normalizarTextoClase(rasgo.id || "");
  const normNombre = normalizarTextoClase(rasgo.nombre || "");

  // 1. Búsqueda por coincidencia directa con las clases del personaje
  for (const c of clasesPersonaje) {
    const normNombreClase = normalizarTextoClase(c.nombre);
    const normSubclaseClase = normalizarTextoClase(c.subclase || "");

    // Coincidencia con el nombre de la clase en la fuente o en el id
    if (normNombreClase && (normFuente.includes(normNombreClase) || normId.includes(`_${normNombreClase}_`))) {
      return c.nivel;
    }

    // Coincidencia con la subclase configurada
    if (normSubclaseClase && (normFuente.includes(normSubclaseClase) || normId.includes(`_${normSubclaseClase}_`))) {
      return c.nivel;
    }
  }

  // 2. Búsqueda por catálogo oficial de clases y subclases canónicas
  for (const c of clasesPersonaje) {
    const defClase = obtenerClasePorNombre(c.nombre);
    if (!defClase) continue;

    const idClaseNorm = normalizarTextoClase(defClase.id);
    if (normId.includes(`_${idClaseNorm}_`) || normFuente.includes(idClaseNorm)) {
      return c.nivel;
    }

    // Comprobar si el rasgo figura en la lista de rasgos de esta clase
    if (defClase.rasgos.some((r) => normalizarTextoClase(r.nombre) === normNombre)) {
      return c.nivel;
    }

    // Comprobar si pertenece a alguna de las subclases de esta clase
    for (const sub of defClase.subclases) {
      const subNombreNorm = normalizarTextoClase(sub.nombre);
      const subIdNorm = normalizarTextoClase(sub.id);
      if (
        (subNombreNorm && (normFuente.includes(subNombreNorm) || normId.includes(`_${subNombreNorm}_`))) ||
        (subIdNorm && normId.includes(`_${subIdNorm}_`)) ||
        sub.rasgos.some((r) => normalizarTextoClase(r.nombre) === normNombre)
      ) {
        return c.nivel;
      }
    }
  }

  // Fallback seguro: nivel general del personaje si no se detectó vinculación a una clase específica
  return nivelGeneral;
}
