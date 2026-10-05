/**
 * resolutorCriaturas.ts
 * ---------------------
 * Servicio centralizado para la normalización de nombres de miniaturas y la
 * resolución de plantillas de monstruos (D&D 5.5e) en base a asociaciones.
 *
 */

import type { MonstruoBase } from "@/almacen/usarAlmacenDM";
import { calcularVidaPorDados } from "@/almacen/sanitizacion";
import type { IndiceMonstruos } from "./indiceMonstruos";

/**
 * Determina si un nombre está vacío, tiene solo espacios, o es un punto simple (o secuencia de puntos/espacios).
 */
export function esNombreVacioODot(nombre: string): boolean {
  const limpio = (nombre || "").trim();
  return limpio === "" || limpio === "." || limpio.replace(/[.\s]/g, "") === "";
}

const cacheNormalizacionTS = new Map<string, { completo: string; base: string }>();
const LIMITE_CACHE_TS = 500;

/**
 * Normaliza un nombre proveniente de TaleSpire convirtiéndolo a minúsculas
 * y quitando sufijos numéricos (#123, 2, A, etc) para obtener el nombre base.
 * Emplea caché en memoria para evitar ejecuciones repetitivas de regex.
 */
export function normalizarNombreTaleSpire(nombre: string): { completo: string; base: string } {
  const clave = nombre || "";
  const enCache = cacheNormalizacionTS.get(clave);
  if (enCache) return enCache;

  const completo = clave.toLowerCase().trim();
  const base = completo
    .replace(/\s+\d+$/g, "")
    .replace(/\s+#[a-zA-Z0-9]+$/g, "")
    .replace(/\s+[a-zA-Z]$/g, "")
    .trim();
  const res = { completo, base };

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

  return normA.completo === normB.completo || normA.base === normB.base;
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

  const { completo, base } = normalizarNombreTaleSpire(nombre);

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

  // 3. Fallback: Buscar coincidencia exacta por nombre completo o nombre base
  const plantillaExacta = indice.porNombre.get(completo) || indice.porNombre.get(base);
  if (plantillaExacta) return plantillaExacta;

  // 4. Fallback parcial: Buscar coincidencia parcial de prefijo más larga (secuencial O(N))
  let plantillaGanadora: MonstruoBase | undefined = undefined;
  let longitudMaxima = 0;

  for (const m of indice.listaCompleta) {
    const nombrePlantilla = m.nombre.toLowerCase().trim();
    if (completo.startsWith(nombrePlantilla) || base.startsWith(nombrePlantilla)) {
      if (nombrePlantilla.length > longitudMaxima) {
        longitudMaxima = nombrePlantilla.length;
        plantillaGanadora = m;
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
