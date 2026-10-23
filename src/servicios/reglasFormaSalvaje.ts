import type { PersonajeJugador, MonstruoBase } from "@/tipos";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";

/**
 * Convierte un string de desafío (VD) como "0", "1/8", "1/4", "1/2", "1", "2" a número decimal.
 */
export function convertirVDANumero(vd: string | undefined): number {
  if (!vd) return 0;
  const limpio = vd.trim();
  if (limpio === "1/8") return 0.125;
  if (limpio === "1/4") return 0.25;
  if (limpio === "1/2") return 0.5;
  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : num;
}

/**
 * Determina si una bestia tiene velocidad volando.
 */
export function bestiaTieneVuelo(bestia: MonstruoBase): boolean {
  if (typeof bestia.velocidad === "string") {
    const s = bestia.velocidad.toLowerCase();
    return s.includes("vuelo") || s.includes("volar") || s.includes("fly");
  }
  if (bestia.velocidad && typeof bestia.velocidad === "object") {
    const v = bestia.velocidad as any;
    return (v.volar ?? v.volando ?? 0) > 0;
  }
  return false;
}

export interface ReglasFormaSalvajeNivel {
  maxFormasConocidas: number;
  vdMaximo: number;
  vdMaximoTexto: string;
  puedeVolar: boolean;
}

/**
 * Obtiene el nivel efectivo de Druida de un personaje (soporta multiclase).
 */
export function obtenerNivelDruida(pj: PersonajeJugador): number {
  if (Array.isArray(pj.clases) && pj.clases.length > 0) {
    const claseDruida = pj.clases.find(
      (c) => c.nombre.toLowerCase().trim() === "druida"
    );
    if (claseDruida) return Math.max(1, claseDruida.nivel || 1);
  }
  if (pj.clase?.toLowerCase().trim() === "druida") {
    return Math.max(1, pj.nivel || 1);
  }
  return Math.max(1, pj.nivel || 1);
}

/**
 * Determina si el druida pertenece al Círculo de la Luna (Circle of the Moon).
 */
export function esDruidaCirculoLuna(pj: PersonajeJugador): boolean {
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const sub = normalizar(pj.subclase || "");
  if (sub.includes("luna") || sub.includes("moon")) return true;

  if (Array.isArray(pj.clases)) {
    return pj.clases.some((c) => {
      const s = normalizar(c.subclase || "");
      return s.includes("luna") || s.includes("moon");
    });
  }
  return false;
}

/**
 * Calcula los límites de Forma salvaje de acuerdo a las reglas de D&D 5.5e (PHB 2024).
 * En PHB 2024:
 * - Nivel 2: 4 formas conocidas, VD máx 1/4, No vuela
 * - Nivel 4: 6 formas conocidas, VD máx 1/2, No vuela
 * - Nivel 8+: 8 formas conocidas, VD máx 1 (o nivel/3 para Círculo de la Luna), Sí vuela
 */
export function calcularReglasFormaSalvaje(
  nivelDruida: number,
  esCirculoLuna: boolean = false
): ReglasFormaSalvajeNivel {
  let maxFormasConocidas = 4;
  let vdMaximo = 0.25;
  let vdMaximoTexto = "1/4";
  let puedeVolar = false;

  if (nivelDruida >= 8) {
    maxFormasConocidas = 8;
    puedeVolar = true;
    vdMaximo = 1;
    vdMaximoTexto = "1";
  } else if (nivelDruida >= 4) {
    maxFormasConocidas = 6;
    vdMaximo = 0.5;
    vdMaximoTexto = "1/2";
    puedeVolar = false;
  }

  // Círculo de la Luna (2024): VD máx = floor(nivel / 3) a partir de nv 3 (ej. Nv 3 -> VD 1, Nv 6 -> VD 2, Nv 9 -> VD 3)
  if (esCirculoLuna && nivelDruida >= 3) {
    const vdLuna = Math.floor(nivelDruida / 3);
    if (vdLuna > vdMaximo) {
      vdMaximo = vdLuna;
      vdMaximoTexto = String(vdLuna);
    }
  }

  return {
    maxFormasConocidas,
    vdMaximo,
    vdMaximoTexto,
    puedeVolar
  };
}

/**
 * Evalúa si una criatura es elegible para la reserva de formas conocidas de un druida.
 */
export function esBestiaValidaParaDruida(
  bestia: MonstruoBase,
  nivelDruida: number,
  esCirculoLuna: boolean = false
): boolean {
  const tipo = (bestia.tipo || "").toLowerCase();
  if (!tipo.includes("bestia") && !tipo.includes("beast")) return false;

  const reglas = calcularReglasFormaSalvaje(nivelDruida, esCirculoLuna);
  const vdNum = convertirVDANumero(bestia.desafio);

  if (vdNum > reglas.vdMaximo) return false;
  if (!reglas.puedeVolar && bestiaTieneVuelo(bestia)) return false;

  return true;
}

/**
 * Obtiene todas las bestias del compendio oficial y homebrew que el druida puede aprender.
 */
export function obtenerBestiasElegiblesCompendio(
  nivelDruida: number,
  esCirculoLuna: boolean = false,
  catalogoHomebrew: MonstruoBase[] = []
): MonstruoBase[] {
  const todas = [...MONSTRUOS_INICIALES, ...catalogoHomebrew];
  const mapa = new Map<string, MonstruoBase>();

  for (const criatura of todas) {
    if (esBestiaValidaParaDruida(criatura, nivelDruida, esCirculoLuna)) {
      if (!mapa.has(criatura.id)) {
        mapa.set(criatura.id, criatura);
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const vdA = convertirVDANumero(a.desafio);
    const vdB = convertirVDANumero(b.desafio);
    if (vdA !== vdB) return vdA - vdB;
    return a.nombre.localeCompare(b.nombre);
  });
}

/**
 * Calcula los PG temporales otorgados al adoptar Forma salvaje (D&D 5.5e):
 * - Druida estándar: nivel de druida
 * - Círculo de la Luna: 3 * nivel de druida
 */
export function calcularHpTemporalFormaSalvaje(
  nivelDruida: number,
  esCirculoLuna: boolean = false
): number {
  return esCirculoLuna ? nivelDruida * 3 : nivelDruida;
}

/**
 * Recupera el objeto de la bestia actualmente activa del personaje, si la hay.
 */
export function obtenerBestiaFormaActiva(
  pj: PersonajeJugador,
  catalogoHomebrew: MonstruoBase[] = []
): MonstruoBase | null {
  const idActiva = pj.formaSalvaje?.formaActivaId;
  if (!idActiva) return null;

  const enHomebrew = catalogoHomebrew.find((m) => m.id === idActiva);
  if (enHomebrew) return enHomebrew;

  const enOficiales = MONSTRUOS_INICIALES.find((m) => m.id === idActiva);
  return enOficiales || null;
}
