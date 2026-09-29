import type { PersonajeJugador } from "@/tipos/personaje";
import type { Caracteristica } from "@/tipos/personaje";

export interface ResultadoRequisitoDote {
  cumple: boolean;
  motivo?: string;
}

/**
 * Normaliza cadenas de texto para comparaciones tolerantes (sin acentos, minúsculas, espacios recortados).
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Extrae la puntuación efectiva de una característica del personaje,
 * considerando sobreescrituras fijas si existen.
 */
function obtenerPuntuacionCaracteristica(
  personaje: PersonajeJugador | null | undefined,
  stat: Caracteristica
): number {
  if (!personaje) return 10;
  if (personaje.overridesFijos && typeof personaje.overridesFijos[stat] === "number") {
    return personaje.overridesFijos[stat] as number;
  }
  return personaje.caracteristicas?.[stat] ?? 10;
}

const NOMBRES_CARACTERISTICAS: Readonly<Record<Caracteristica, string>> = {
  fuerza: "Fuerza",
  destreza: "Destreza",
  constitucion: "Constitución",
  inteligencia: "Inteligencia",
  sabiduria: "Sabiduría",
  carisma: "Carisma"
};

const ABREV_CARACTERISTICAS: Readonly<Record<Caracteristica, string>> = {
  fuerza: "FUE",
  destreza: "DES",
  constitucion: "CON",
  inteligencia: "INT",
  sabiduria: "SAB",
  carisma: "CAR"
};

const CARACTERISTICAS_CANONICAS: readonly Caracteristica[] = [
  "fuerza",
  "destreza",
  "constitucion",
  "inteligencia",
  "sabiduria",
  "carisma"
];

const REGEX_REQUISITO_CARACTERISTICAS =
  /(?:(?:fuerza|destreza|constitucion|inteligencia|sabiduria|carisma)(?:,\s*|\s+o\s+)?)+\s*(\d+)\s*o\s*mas/gi;

function extraerCaracteristicasDeTexto(texto: string): Caracteristica[] {
  const encontradas: Caracteristica[] = [];
  for (const c of CARACTERISTICAS_CANONICAS) {
    if (new RegExp(`\\b${c}\\b`, "i").test(texto)) {
      encontradas.push(c);
    }
  }
  return encontradas;
}

interface RequisitoArmaduraDef {
  readonly patron: string;
  readonly claves: readonly string[];
  readonly motivo: string;
}

const REQUISITOS_ARMADURAS: readonly RequisitoArmaduraDef[] = [
  {
    patron: "entrenamiento con armaduras pesadas",
    claves: ["pesadas", "pesada", "heavy"],
    motivo: "Requiere entrenamiento con armaduras pesadas"
  },
  {
    patron: "entrenamiento con armaduras medias",
    claves: ["medias", "mediana", "media", "medium"],
    motivo: "Requiere entrenamiento con armaduras medias"
  },
  {
    patron: "entrenamiento con armaduras ligeras",
    claves: ["ligeras", "ligera", "light"],
    motivo: "Requiere entrenamiento con armaduras ligeras"
  },
  {
    patron: "competencia con escudos",
    claves: ["escudos", "escudo", "shield"],
    motivo: "Requiere competencia con escudos"
  }
];

const NIVEL_MINIMO_ESTILO_COMBATE_POR_CLASE: Readonly<Record<string, number>> = {
  guerrero: 1,
  fighter: 1,
  paladin: 2,
  explorador: 2,
  ranger: 2
};

/**
 * Evalúa si un personaje cumple con los requisitos declarados en una dote (PHB 2024 / D&D 5.5e).
 * Si no se especifica requisito o está vacío, retorna cumple: true.
 *
 * @param requisito Cadena de texto con el requisito canónico (ej: "Nivel 4 o más, Destreza 13 o más").
 * @param personaje Hoja del personaje activo o null/undefined si se evalúa sin contexto completo.
 * @param nivelEfectivo Nivel de la clase o personaje que otorga el rasgo (override de nivel).
 */
export function evaluarRequisitoDote(
  requisito: string | undefined,
  personaje: PersonajeJugador | null | undefined,
  nivelEfectivo?: number
): ResultadoRequisitoDote {
  if (!requisito || requisito.trim() === "") {
    return { cumple: true };
  }

  const reqNorm = normalizar(requisito);
  const nivelActual = nivelEfectivo ?? personaje?.nivel ?? 1;

  // 1. Verificación de Nivel: "Nivel X o más"
  const matchNivel = reqNorm.match(/nivel\s*(\d+)\s*o\s*mas/);
  if (matchNivel) {
    const nivelRequerido = parseInt(matchNivel[1], 10);
    if (nivelActual < nivelRequerido) {
      return {
        cumple: false,
        motivo: `Requiere nivel ${nivelRequerido} o más (nivel actual: ${nivelActual})`
      };
    }
  }

  // Si no hay datos de personaje para verificar atributos o competencias, pasa si cumplió el nivel
  if (!personaje) {
    return { cumple: true };
  }

  // 2. Verificaciones dinámicas de características (individuales y compuestas)
  for (const match of reqNorm.matchAll(REGEX_REQUISITO_CARACTERISTICAS)) {
    const fragmento = match[0];
    const minimo = parseInt(match[1], 10);
    const stats = extraerCaracteristicasDeTexto(fragmento);
    if (stats.length === 0) continue;

    const valores = stats.map((s) => ({
      stat: s,
      valor: obtenerPuntuacionCaracteristica(personaje, s)
    }));
    const maximo = Math.max(...valores.map((v) => v.valor));

    if (maximo < minimo) {
      if (stats.length === 1) {
        return {
          cumple: false,
          motivo: `Requiere ${NOMBRES_CARACTERISTICAS[stats[0]]} ${minimo} o más (actual: ${valores[0].valor})`
        };
      }

      const textoRequerido = stats.length === 2
        ? `${NOMBRES_CARACTERISTICAS[stats[0]]} o ${NOMBRES_CARACTERISTICAS[stats[1]]}`
        : `${stats.slice(0, -1).map((s) => NOMBRES_CARACTERISTICAS[s]).join(", ")} o ${NOMBRES_CARACTERISTICAS[stats[stats.length - 1]]}`;

      const desgloseActual = valores.map((v) => `${ABREV_CARACTERISTICAS[v.stat]} ${v.valor}`).join(", ");
      return {
        cumple: false,
        motivo: `Requiere ${textoRequerido} ${minimo} o más (actual: ${desgloseActual})`
      };
    }
  }

  // 3. Verificación de Aptitud Mágica / Lanzamiento de Conjuros
  const requiereMagia =
    reqNorm.includes("aptitud para lanzar al menos un conjuro") ||
    reqNorm.includes("rasgo lanzamiento de conjuros o magia del pacto");

  if (requiereMagia) {
    const tieneEspaciosNormales = Object.values(personaje.espaciosConjuroMaximos || {}).some((v) => v > 0);
    const tieneEspaciosPacto = (personaje.espaciosPactoMaximos || 0) > 0;
    const tieneClasesLanzadoras = (personaje.clasesLanzadoras || []).length > 0;
    const tieneHechizosConocidos =
      (personaje.trucosConocidosIds || []).length > 0 ||
      (personaje.conjurosConocidosIds || []).length > 0 ||
      (personaje.conjurosPreparadosIds || []).length > 0;
    const tieneRasgoMagico = (personaje.rasgos || []).some((r) => {
      const nom = normalizar(r.nombre);
      return nom.includes("lanzamiento de conjuros") || nom.includes("magia del pacto");
    });

    const esApto =
      Boolean(personaje.esLanzador) ||
      tieneEspaciosNormales ||
      tieneEspaciosPacto ||
      tieneClasesLanzadoras ||
      tieneHechizosConocidos ||
      tieneRasgoMagico;

    if (!esApto) {
      return {
        cumple: false,
        motivo: "Requiere aptitud para lanzar conjuros o rasgo Magia del pacto"
      };
    }
  }

  // 4. Verificación declarativa de Armaduras y Escudos
  const gruposArmadura = new Set(
    (personaje.competenciasArmadurasGrupos || []).map((g) => normalizar(String(g)))
  );
  const textoArmaduras = normalizar(personaje.competenciasArmaduras || "");
  const listaArmaduras = (personaje.competenciasArmadurasLista || []).map((a) => normalizar(a));

  const tieneCompetenciaGrupo = (clave: string): boolean => {
    if (gruposArmadura.has(clave)) return true;
    if (textoArmaduras.includes(clave)) return true;
    return listaArmaduras.some((a) => a.includes(clave));
  };

  for (const def of REQUISITOS_ARMADURAS) {
    if (reqNorm.includes(def.patron)) {
      const tieneCompetencia = def.claves.some((k) => tieneCompetenciaGrupo(k));
      if (!tieneCompetencia) {
        return { cumple: false, motivo: def.motivo };
      }
    }
  }

  // 5. Verificación de Rasgo Estilo de Combate
  if (reqNorm.includes("rasgo estilo de combate") || reqNorm.includes("estilo de combate")) {
    const tieneRasgoEstilo = (personaje.rasgos || []).some((r) =>
      normalizar(r.nombre).includes("estilo de combate") || normalizar(r.id).includes("estilo_combate")
    );
    const tieneClaseMarcial = (personaje.clases || []).some((c) => {
      const cNorm = normalizar(c.nombre);
      const nivelMinimo = NIVEL_MINIMO_ESTILO_COMBATE_POR_CLASE[cNorm];
      return nivelMinimo !== undefined && (c.nivel || 1) >= nivelMinimo;
    });

    if (!tieneRasgoEstilo && !tieneClaseMarcial) {
      return { cumple: false, motivo: "Requiere el rasgo Estilo de combate" };
    }
  }

  return { cumple: true };
}
