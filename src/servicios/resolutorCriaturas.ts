/**
 * resolutorCriaturas.ts
 * ---------------------
 * Servicio centralizado para la normalización de nombres de miniaturas y la
 * resolución de plantillas de monstruos (D&D 5.5e) en base a asociaciones.
 *
 * Programado 100% en español.
 */

import type { MonstruoBase } from '../almacen/usarAlmacenDM';
import { calcularVidaPorDados } from '../almacen/sanitizacion';
import type { IndiceMonstruos } from './indiceMonstruos';

/**
 * Normaliza un nombre proveniente de TaleSpire convirtiéndolo a minúsculas
 * y quitando sufijos numéricos (#123, 2, A, etc) para obtener el nombre base.
 */
export function normalizarNombreTaleSpire(nombre: string): { completo: string; base: string } {
  const completo = nombre.toLowerCase().trim();
  const base = completo
    .replace(/\s+\d+$/g, "")
    .replace(/\s+#[a-zA-Z0-9]+$/g, "")
    .replace(/\s+[a-zA-Z]$/g, "")
    .trim();
  return { completo, base };
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
  const { completo, base } = normalizarNombreTaleSpire(nombre);

  // 1. Buscar por asociación directa (ID de miniatura física)
  const idAsociada = asociaciones[id];
  if (idAsociada) {
    const plantilla = indice.porId.get(idAsociada);
    if (plantilla) return plantilla;
  }

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
