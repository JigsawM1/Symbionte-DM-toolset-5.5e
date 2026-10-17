/**
 * resolutorCriaturas.ts
 * ---------------------
 * Servicio centralizado para la normalización de nombres de miniaturas y la
 * resolución de plantillas de monstruos (D&D 5.5e) en base a asociaciones.
 *
 */

import type { MonstruoBase, CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { calcularVidaPorDados } from "@/almacen/sanitizacion";
import type { IndiceMonstruos } from "./indiceMonstruos";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { PasivasCombatePJ } from "@/tipos/sync";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";

/**
 * Determina si un nombre está vacío, tiene solo espacios, o es un punto simple (o secuencia de puntos/espacios).
 */
export function esNombreVacioODot(nombre: string): boolean {
  const limpio = (nombre || "").trim();
  return limpio === "" || limpio === "." || limpio.replace(/[.\s]/g, "") === "";
}

export interface NombreNormalizadoTS {
  completo: string;
  base: string;
  completoSinTildes: string;
  baseSinTildes: string;
}

const cacheNormalizacionTS = new Map<string, NombreNormalizadoTS>();
const LIMITE_CACHE_TS = 500;

function quitarDiacriticos(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza un nombre proveniente de TaleSpire convirtiéndolo a minúsculas,
 * quitando sufijos numéricos (#123, 2, A, etc) y precalculando variantes sin diacríticos.
 * Emplea caché en memoria para evitar ejecuciones repetitivas de regex y NFD.
 */
export function normalizarNombreTaleSpire(nombre: string): NombreNormalizadoTS {
  const clave = nombre || "";
  const enCache = cacheNormalizacionTS.get(clave);
  if (enCache) return enCache;

  // Limpiar etiquetas entre paréntesis o corchetes como (PJ), [PJ], (Guerrero), etc.
  const sinEtiquetas = clave.toLowerCase().trim().replace(/\s*[\(\[][^)\]]*[\)\]]/g, "").trim();
  const completo = clave.toLowerCase().trim();

  // Quitar sufijos numéricos o de instancia (#123, 2, A, etc)
  const base = (sinEtiquetas || completo)
    .replace(/\s+\d+$/g, "")
    .replace(/\s+#[a-zA-Z0-9]+$/g, "")
    .replace(/\s+[a-zA-Z]$/g, "")
    .trim();

  const res: NombreNormalizadoTS = {
    completo,
    base,
    completoSinTildes: quitarDiacriticos(completo),
    baseSinTildes: quitarDiacriticos(base)
  };

  if (cacheNormalizacionTS.size >= LIMITE_CACHE_TS) {
    cacheNormalizacionTS.clear();
  }
  cacheNormalizacionTS.set(clave, res);
  return res;
}

/**
 * Comprueba si dos nombres coinciden en el contexto de TaleSpire,
 * evaluando tanto el nombre completo como el nombre base sin sufijos de instancia (#1, 2, A, etc.).
 * Corrige el defecto de comparación por referencia de objetos y aprovecha la caché de normalización.
 */
export function coincidenNombresTaleSpire(nombreA?: string | null, nombreB?: string | null): boolean {
  if (!nombreA || !nombreB) return false;
  if (esNombreVacioODot(nombreA) || esNombreVacioODot(nombreB)) return false;

  const normA = normalizarNombreTaleSpire(nombreA);
  const normB = normalizarNombreTaleSpire(nombreB);

  return (
    normA.completo === normB.completo ||
    normA.base === normB.base ||
    normA.completo === normB.base ||
    normA.base === normB.completo ||
    normA.completoSinTildes === normB.completoSinTildes ||
    normA.baseSinTildes === normB.baseSinTildes ||
    normA.completoSinTildes === normB.baseSinTildes ||
    normA.baseSinTildes === normB.completoSinTildes
  );
}

/**
 * Resuelve una plantilla de monstruo a partir del ID de la criatura o su nombre,
 * utilizando búsquedas ultrarrápidas O(1) en el IndiceMonstruos.
 */
export function resolverPlantillaPorCriatura(
  id: string,
  nombre: string,
  asociaciones: Record<string, string>,
  indice: IndiceMonstruos
): MonstruoBase | undefined {
  // 1. Buscar por asociación directa (ID de miniatura física)
  const idAsociada = asociaciones[id];
  if (idAsociada) {
    const plantilla = indice.porId.get(idAsociada);
    if (plantilla) return plantilla;
  }

  // Si el nombre está vacío o es un punto, no asociar automáticamente por nombre
  if (esNombreVacioODot(nombre)) {
    return undefined;
  }

  const { completo, base, completoSinTildes, baseSinTildes } = normalizarNombreTaleSpire(nombre);

  // 2. Buscar por asociación persistente por nombre
  const idPorNombreCompleto = asociaciones[`nombre_base:${completo}`];
  if (idPorNombreCompleto) {
    const plantilla = indice.porId.get(idPorNombreCompleto);
    if (plantilla) return plantilla;
  }

  const idPorNombreBase = asociaciones[`nombre_base:${base}`];
  if (idPorNombreBase) {
    const plantilla = indice.porId.get(idPorNombreBase);
    if (plantilla) return plantilla;
  }

  // 3. Fallback O(1): Buscar coincidencia exacta por nombre completo o nombre base (con o sin diacríticos)
  const plantillaExacta =
    indice.porNombre.get(completo) ||
    indice.porNombre.get(base) ||
    indice.porNombreSinTildes?.get(completoSinTildes) ||
    indice.porNombreSinTildes?.get(baseSinTildes);
  if (plantillaExacta) return plantillaExacta;

  // 4. Fallback parcial: Buscar coincidencia parcial de prefijo más larga usando entradas pre-normalizadas
  let plantillaGanadora: MonstruoBase | undefined = undefined;
  let longitudMaxima = 0;

  if (indice.entradasPrefijo && indice.entradasPrefijo.length > 0) {
    for (const entrada of indice.entradasPrefijo) {
      if (
        completo.startsWith(entrada.nombreLower) ||
        base.startsWith(entrada.nombreLower) ||
        completoSinTildes.startsWith(entrada.nombreSinTildes) ||
        baseSinTildes.startsWith(entrada.nombreSinTildes)
      ) {
        if (entrada.longitud > longitudMaxima) {
          longitudMaxima = entrada.longitud;
          plantillaGanadora = entrada.monstruo;
        }
      }
    }
  } else {
    for (const m of indice.listaCompleta) {
      const nombrePlantilla = m.nombre.toLowerCase().trim();
      const pSinTildes = quitarDiacriticos(nombrePlantilla);
      if (
        completo.startsWith(nombrePlantilla) ||
        base.startsWith(nombrePlantilla) ||
        completoSinTildes.startsWith(pSinTildes) ||
        baseSinTildes.startsWith(pSinTildes)
      ) {
        if (nombrePlantilla.length > longitudMaxima) {
          longitudMaxima = nombrePlantilla.length;
          plantillaGanadora = m;
        }
      }
    }
  }

  return plantillaGanadora;
}

/**
 * Calcula los puntos de vida iniciales (máximos y actuales) de una criatura nativa,
 * aplicando el método de cálculo de vida del DM o los stats que vengan de TaleSpire.
 */
export function calcularVidaInicial(
  plantilla: MonstruoBase | undefined,
  metodoVida: string,
  maxHpTS?: number,
  hpTS?: number
): { vidaMaxima: number; vidaActual: number } {
  let vidaMax = 10;
  let vidaAct = 10;

  if (plantilla && metodoVida !== "estandar") {
    vidaMax = calcularVidaPorDados(
      plantilla.vidaNotas || "",
      plantilla.vidaMaxima,
      metodoVida as "estandar" | "maximo" | "azar"
    );
    vidaAct = vidaMax;
  } else if (maxHpTS !== undefined && maxHpTS > 0) {
    vidaMax = maxHpTS;
    vidaAct = hpTS !== undefined ? hpTS : maxHpTS;
  } else if (plantilla) {
    vidaMax = plantilla.vidaMaxima;
    vidaAct = vidaMax;
  }

  return { vidaMaxima: vidaMax, vidaActual: vidaAct };
}

/**
 * Busca de forma tolerante el PersonajeJugador asociado a una miniatura o criatura,
 * comparando por ID directo, ID de miniatura en TaleSpire, ID de dueño o coincidencia de nombres normalizados.
 */
export function resolverPersonajeAsociado(
  idCriatura: string,
  nombreCriatura: string,
  personajes: PersonajeJugador[],
  idPersonajeDuenio?: string
): PersonajeJugador | undefined {
  if (!personajes || personajes.length === 0) return undefined;

  const idLimpio = idCriatura ? idCriatura.toLowerCase() : "";

  return personajes.find((pj) => {
    // 1. Coincidencia por ID de personaje
    if (pj.id === idCriatura || (pj.id && idLimpio && pj.id.toLowerCase() === idLimpio)) {
      return true;
    }

    // 2. Coincidencia por ID de miniatura TaleSpire asignada en la ficha
    if (pj.idMiniaturaTS && (pj.idMiniaturaTS === idCriatura || pj.idMiniaturaTS.toLowerCase() === idLimpio)) {
      return true;
    }

    // 3. Coincidencia por dueño explícito
    if (idPersonajeDuenio && pj.id === idPersonajeDuenio) {
      return true;
    }

    // 4. Coincidencia por nombre normalizado tolerante (sin diacríticos ni sufijos de instancia/rol)
    return coincidenNombresTaleSpire(pj.nombre, nombreCriatura);
  });
}

/**
 * Localiza el PersonajeJugador asociado a una CriaturaIniciativa (por ID directo, ID de miniatura TS,
 * ID de dueño o coincidencia de nombres normalizados).
 * Nota: No bloquea por criatura.esMonstruo para posibilitar la autorreparación de miniaturas de PJ mal catalogadas.
 */
export function resolverPersonajePorCriatura(
  criatura: CriaturaIniciativa,
  personajes: PersonajeJugador[]
): PersonajeJugador | undefined {
  return resolverPersonajeAsociado(
    criatura.id,
    criatura.nombre,
    personajes,
    criatura.idPersonajeDuenio
  );
}

const PASIVAS_NEUTRAS_PJ: PasivasCombatePJ = Object.freeze({
  percepcion: 10,
  investigacion: 10,
  perspicacia: 10,
});

const cachePasivasPorPersonaje = new WeakMap<PersonajeJugador, PasivasCombatePJ>();

/**
 * Obtiene las puntuaciones pasivas de combate (percepción, investigación y perspicacia)
 * correspondientes a una criatura de jugador, preservando estabilidad referencial.
 */
export function obtenerPasivasCriatura(
  criatura: CriaturaIniciativa,
  personajes: PersonajeJugador[]
): PasivasCombatePJ | null {
  if (criatura.pasivas) {
    return criatura.pasivas;
  }
  const pj = resolverPersonajePorCriatura(criatura, personajes);
  if (pj) {
    const enCache = cachePasivasPorPersonaje.get(pj);
    if (enCache) return enCache;

    const stats = calcularEstadisticasPersonaje(pj);
    const calculadas: PasivasCombatePJ = {
      percepcion: stats.pasivas?.percepcion ?? 10,
      investigacion: stats.pasivas?.investigacion ?? 10,
      perspicacia: stats.pasivas?.perspicacia ?? 10,
    };
    cachePasivasPorPersonaje.set(pj, calculadas);
    return calculadas;
  }
  if (criatura.esMonstruo) {
    return null;
  }
  return PASIVAS_NEUTRAS_PJ;
}
