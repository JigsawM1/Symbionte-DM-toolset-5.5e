import type { PersonajeJugador } from "@/tipos";
import { CATALOGO_CONJUROS_SUBCLASES } from "@/constantes/subclasesConjurosConstantes";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { normalizarTextoMagia } from "./catalogoProgresionMagica";
import type { ConjurosSubclaseResultado, ConteoPreparadosEfectivos } from "./tiposMagia";

const PALABRAS_VACIAS_SUBCLASE: ReadonlySet<string> = new Set([
  "de", "del", "la", "las", "el", "los", "y", "en", "para", "por", "un", "una",
  "dominio", "juramento", "circulo", "senda", "patron", "camino", "colegio",
  "escuela", "disciplina", "orden", "origen", "pacto", "guerrero", "hechiceria"
]);

function extraerTokensSignificativos(textoNormalizado: string): string[] {
  return textoNormalizado
    .split(/\s+/)
    .filter((token) => token.length > 2 && !PALABRAS_VACIAS_SUBCLASE.has(token));
}

/**
 * Obtiene la lista de conjuros y trucos siempre preparados otorgados por una subclase
 * hasta el nivel de clase especificado en D&D 5.5e (2024).
 */
export function obtenerConjurosSiemprePreparadosSubclase(
  clase: string,
  subclase: string,
  nivelClase: number,
  variante?: string
): ConjurosSubclaseResultado {
  if (!clase || !subclase || nivelClase <= 0) {
    return { conjuros: [], trucos: [] };
  }

  const claseNorm = normalizarTextoMagia(clase);
  const subclaseNorm = normalizarTextoMagia(subclase);
  const varianteNorm = variante ? normalizarTextoMagia(variante) : "";

  const definicion = CATALOGO_CONJUROS_SUBCLASES.find((item) => {
    const itemClaseNorm = normalizarTextoMagia(item.clase);
    const itemSubclaseNorm = normalizarTextoMagia(item.subclase);
    const coincideClase =
      claseNorm.includes(itemClaseNorm) || itemClaseNorm.includes(claseNorm);
    if (!coincideClase) return false;

    if (
      subclaseNorm.includes(itemSubclaseNorm) ||
      itemSubclaseNorm.includes(subclaseNorm)
    ) {
      return true;
    }

    const tokensA = extraerTokensSignificativos(subclaseNorm);
    const tokensB = extraerTokensSignificativos(itemSubclaseNorm);
    return tokensA.length > 0 && tokensB.length > 0 && tokensA.some((t) => tokensB.includes(t));
  });

  if (!definicion) {
    return { conjuros: [], trucos: [] };
  }

  let progresionAUsar = definicion.progresion;
  if (definicion.variantes) {
    for (const [nombreVar, progVar] of Object.entries(definicion.variantes)) {
      const varNorm = normalizarTextoMagia(nombreVar);
      if (
        varianteNorm.includes(varNorm) ||
        subclaseNorm.includes(varNorm) ||
        varNorm.includes(varianteNorm)
      ) {
        progresionAUsar = progVar;
        break;
      }
    }
  }

  const conjurosSet = new Set<string>();
  const trucosSet = new Set<string>();

  for (const entrada of progresionAUsar) {
    if (nivelClase >= entrada.nivelClase) {
      (entrada.conjuros || []).forEach((c) => conjurosSet.add(c));
      (entrada.trucos || []).forEach((t) => trucosSet.add(t));
    }
  }

  return {
    conjuros: Array.from(conjurosSet),
    trucos: Array.from(trucosSet)
  };
}

/**
 * Obtiene todos los conjuros y trucos siempre preparados de un personaje,
 * considerando todas sus clases y subclases en multiclase.
 */
export function obtenerConjurosSubclasePersonaje(
  clases?: Array<{ nombre: string; subclase?: string; nivel: number }>,
  clasePrincipal?: string,
  subclasePrincipal?: string,
  nivelPrincipal?: number
): ConjurosSubclaseResultado {
  const conjuros: string[] = [];
  const trucos: string[] = [];

  const listaClases =
    clases && clases.length > 0
      ? clases
      : [
          {
            nombre: clasePrincipal || "",
            subclase: subclasePrincipal || "",
            nivel: nivelPrincipal || 1
          }
        ];

  for (const item of listaClases) {
    const nombreClase = item.nombre || (item as { clase?: string }).clase || "";
    const subclase = item.subclase || "";
    const nivel = item.nivel || 1;
    if (!nombreClase || !subclase || nivel <= 0) continue;

    const res = obtenerConjurosSiemprePreparadosSubclase(nombreClase, subclase, nivel);
    for (const conjuro of res.conjuros) {
      if (!conjuros.some((id) => coincideHechizoId(id, conjuro))) {
        conjuros.push(conjuro);
      }
    }
    for (const truco of res.trucos) {
      if (!trucos.some((id) => coincideHechizoId(id, truco))) {
        trucos.push(truco);
      }
    }
  }

  return { conjuros, trucos };
}

/**
 * Calcula el desglose de conjuros preparados efectivos separando los preparados libres
 * de los otorgados automáticamente por la subclase (los cuales no consumen límite diario).
 */
export function calcularConteoPreparadosEfectivos(
  preparadosIds: readonly string[],
  siemprePreparadosIds: readonly string[]
): ConteoPreparadosEfectivos {
  const siempreSet = new Set(siemprePreparadosIds.map((s) => s.toLowerCase().trim()));
  let subclase = 0;

  for (const id of preparadosIds) {
    if (siempreSet.has(id.toLowerCase().trim())) {
      subclase++;
    }
  }

  return { libres: preparadosIds.length - subclase, subclase, total: preparadosIds.length };
}

/**
 * Determina de forma pura si un personaje tiene conjuros o trucos de subclase pendientes de sincronizar.
 */
export function requiereSincronizacionSubclase(
  pj: PersonajeJugador,
  resSubclase: ConjurosSubclaseResultado
): boolean {
  const siemprePrep = pj.conjurosSiemprePreparadosIds || [];
  const trucos = pj.trucosConocidosIds || [];

  const faltaConjuro = resSubclase.conjuros.some(
    (c) => !siemprePrep.some((id) => coincideHechizoId(id, c))
  );
  if (faltaConjuro) return true;

  return resSubclase.trucos.some(
    (t) => !trucos.some((id) => coincideHechizoId(id, t))
  );
}
