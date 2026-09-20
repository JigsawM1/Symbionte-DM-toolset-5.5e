import type {
  PersonajeJugador,
  HechizoBase,
  ModeloConjuros,
  TipoAccionConsumida
} from "@/tipos";
import { MAPA_ALIAS_HECHIZOS } from "@/constantes/subclasesConjurosConstantes";
import { generarIdSlug } from "@/utiles/generarId";
import { obtenerConjurosSubclasePersonaje } from "@/servicios/calculadorMagia";
import type { OrigenConjuroBadge } from "@/servicios/resolutorOrigenConjuros";

/**
 * Representa los 4 conjuntos de identificadores de conjuros del personaje
 * pre-expandidos para permitir consultas O(1).
 */
export interface SetsPertenenciaConjuros {
  setPreparadosIds: Set<string>;
  setConocidosIds: Set<string>;
  setTrucosIds: Set<string>;
  setSiemprePreparados: Set<string>;
}

/**
 * Parámetros requeridos para inicializar la factoría de predicados de pertenencia.
 */
export interface ParametrosPertenencia {
  sets: SetsPertenenciaConjuros;
  clavesLookup: Map<string, string[]>;
  modelo: ModeloConjuros;
  resolutorOrigen: (hechizo: HechizoBase) => OrigenConjuroBadge | null;
}

/**
 * Conjunto de predicados puros para consultar la disponibilidad y estado
 * de un conjuro para un personaje específico.
 */
export interface PredicadosPertenencia {
  esHechizoDeSubclase: (hechizo: HechizoBase) => boolean;
  esHechizoOtorgado: (hechizo: HechizoBase) => boolean;
  estaPreparado: (hechizo: HechizoBase) => boolean;
  estaEnLista: (hechizo: HechizoBase) => boolean;
}

/**
 * Expande un array de identificadores de hechizos agregando variantes normalizadas,
 * slugs y alias canónicos a un Set hash para permitir consultas O(1).
 */
export function expandirSetHechizos(ids: string[] = []): Set<string> {
  const set = new Set<string>();
  for (const raw of ids) {
    if (!raw) continue;
    set.add(raw);
    const norm = raw.toLowerCase().trim();
    set.add(norm);
    const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    set.add(sinTildes);
    const slug = generarIdSlug("h", raw);
    set.add(slug);
    const slugGuionesBajos = slug.replace(/-/g, "_");
    if (slugGuionesBajos !== slug) set.add(slugGuionesBajos);

    const alias = MAPA_ALIAS_HECHIZOS[sinTildes] || MAPA_ALIAS_HECHIZOS[norm] || [];
    for (const al of alias) {
      set.add(al);
      set.add(al.toLowerCase().trim());
      const alSlug = generarIdSlug("h", al);
      set.add(alSlug);
      const alSlugGuionesBajos = alSlug.replace(/-/g, "_");
      if (alSlugGuionesBajos !== alSlug) set.add(alSlugGuionesBajos);
    }
  }
  return set;
}

/**
 * Precalcula todas las variantes de búsqueda de cada hechizo en el catálogo
 * (ID, nombre, sin tildes, slugs y alias) para consultas ultra-rápidas O(1).
 */
export function crearClavesLookupHechizos(baseDatos: HechizoBase[]): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const h of baseDatos) {
    const claves: string[] = [h.id];
    const norm = (h.nombre || "").toLowerCase().trim();
    claves.push(norm);
    const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (sinTildes !== norm) claves.push(sinTildes);
    const slug = generarIdSlug("h", h.nombre || "");
    claves.push(slug);
    const slugGuionesBajos = slug.replace(/-/g, "_");
    if (slugGuionesBajos !== slug) claves.push(slugGuionesBajos);

    const alias = MAPA_ALIAS_HECHIZOS[sinTildes] || MAPA_ALIAS_HECHIZOS[norm] || [];
    for (const al of alias) {
      claves.push(al);
      const alNorm = al.toLowerCase().trim();
      if (alNorm !== al) claves.push(alNorm);
      const alSlug = generarIdSlug("h", al);
      claves.push(alSlug);
      const alSlugGuionesBajos = alSlug.replace(/-/g, "_");
      if (alSlugGuionesBajos !== alSlug) claves.push(alSlugGuionesBajos);
    }
    mapa.set(h.id, claves);
  }
  return mapa;
}

/**
 * Genera los 4 conjuntos de pertenencia (preparados, conocidos, trucos y siempre preparados)
 * a partir de la información actual del personaje.
 */
export function crearSetsPertenencia(personaje: PersonajeJugador | null | undefined): SetsPertenenciaConjuros {
  if (!personaje) {
    return {
      setPreparadosIds: new Set<string>(),
      setConocidosIds: new Set<string>(),
      setTrucosIds: new Set<string>(),
      setSiemprePreparados: new Set<string>()
    };
  }

  const setPreparadosIds = expandirSetHechizos(personaje.conjurosPreparadosIds || []);
  const setConocidosIds = expandirSetHechizos(personaje.conjurosConocidosIds || []);
  const setTrucosIds = expandirSetHechizos(personaje.trucosConocidosIds || []);

  const resSubclase = obtenerConjurosSubclasePersonaje(
    personaje.clases,
    personaje.clase,
    personaje.subclase,
    personaje.nivel
  );

  const listaSiemprePreparados = [
    ...(personaje.conjurosSiemprePreparadosIds || []),
    ...resSubclase.conjuros,
    ...resSubclase.trucos
  ];

  const setSiemprePreparados = expandirSetHechizos(listaSiemprePreparados);

  return {
    setPreparadosIds,
    setConocidosIds,
    setTrucosIds,
    setSiemprePreparados
  };
}

/**
 * Comprueba si un hechizo está contenido en un Set evaluando sus variantes pre-indexadas.
 */
export function verificarEnSet(
  setIds: Set<string>,
  hechizoId: string,
  clavesLookup?: Map<string, string[]>
): boolean {
  if (!hechizoId) return false;
  if (clavesLookup) {
    const claves = clavesLookup.get(hechizoId);
    if (claves) {
      for (let i = 0; i < claves.length; i++) {
        if (setIds.has(claves[i])) return true;
      }
      return false;
    }
  }
  if (setIds.has(hechizoId)) return true;
  const norm = hechizoId.toLowerCase().trim();
  if (setIds.has(norm)) return true;
  const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (setIds.has(sinTildes)) return true;
  const slug = generarIdSlug("h", hechizoId);
  if (setIds.has(slug)) return true;
  const slugBajo = slug.replace(/-/g, "_");
  return setIds.has(slugBajo);
}

/**
 * Factoría que construye los 4 predicados de pertenencia de conjuros
 * respetando el modelo de magia del personaje y los orígenes otorgados.
 */
export function crearPredicadosPertenencia(params: ParametrosPertenencia): PredicadosPertenencia {
  const { sets, clavesLookup, modelo, resolutorOrigen } = params;

  const esHechizoDeSubclase = (hechizo: HechizoBase): boolean => {
    return verificarEnSet(sets.setSiemprePreparados, hechizo.id, clavesLookup);
  };

  const esHechizoOtorgado = (hechizo: HechizoBase): boolean => {
    return resolutorOrigen(hechizo) !== null || esHechizoDeSubclase(hechizo);
  };

  const estaPreparado = (hechizo: HechizoBase): boolean => {
    if (hechizo.nivel === 0) {
      return (
        verificarEnSet(sets.setTrucosIds, hechizo.id, clavesLookup) ||
        esHechizoOtorgado(hechizo)
      );
    }
    if (esHechizoOtorgado(hechizo)) return true;
    return verificarEnSet(sets.setPreparadosIds, hechizo.id, clavesLookup);
  };

  const estaEnLista = (hechizo: HechizoBase): boolean => {
    if (hechizo.nivel === 0) {
      return (
        verificarEnSet(sets.setTrucosIds, hechizo.id, clavesLookup) ||
        esHechizoOtorgado(hechizo)
      );
    }
    if (esHechizoOtorgado(hechizo)) return true;
    if (modelo === "preparados") {
      return verificarEnSet(sets.setPreparadosIds, hechizo.id, clavesLookup);
    }
    return (
      verificarEnSet(sets.setConocidosIds, hechizo.id, clavesLookup) ||
      verificarEnSet(sets.setPreparadosIds, hechizo.id, clavesLookup)
    );
  };

  return {
    esHechizoDeSubclase,
    esHechizoOtorgado,
    estaPreparado,
    estaEnLista
  };
}

/**
 * Helper puro e independiente para validar si un hechizo pertenece a la subclase del personaje.
 */
export function verificarHechizoDeSubclase(
  hechizo: HechizoBase,
  personajeActivo: PersonajeJugador | null | undefined
): boolean {
  if (!personajeActivo || !hechizo) return false;
  const sets = crearSetsPertenencia(personajeActivo);
  return verificarEnSet(sets.setSiemprePreparados, hechizo.id);
}

/**
 * Clasifica la economía de acción de un conjuro según su tiempo de lanzamiento.
 */
export function clasificarTipoAccion(tiempoLanzamiento: string = ""): TipoAccionConsumida {
  const tiempo = tiempoLanzamiento.toLowerCase();
  if (tiempo.includes("adicional") || tiempo.includes("bonus")) {
    return "accionAdicional";
  }
  if (tiempo.includes("reacci")) {
    return "reaccion";
  }
  return "accion";
}
