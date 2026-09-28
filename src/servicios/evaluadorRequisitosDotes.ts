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

  const fue = obtenerPuntuacionCaracteristica(personaje, "fuerza");
  const des = obtenerPuntuacionCaracteristica(personaje, "destreza");
  const con = obtenerPuntuacionCaracteristica(personaje, "constitucion");
  const int = obtenerPuntuacionCaracteristica(personaje, "inteligencia");
  const sab = obtenerPuntuacionCaracteristica(personaje, "sabiduria");
  const car = obtenerPuntuacionCaracteristica(personaje, "carisma");

  // 2. Verificaciones compuestas de características
  if (reqNorm.includes("fuerza o destreza 19 o mas")) {
    const maxVal = Math.max(fue, des);
    if (maxVal < 19) {
      return {
        cumple: false,
        motivo: `Requiere Fuerza o Destreza 19 o más (actual: FUE ${fue}, DES ${des})`
      };
    }
  } else if (reqNorm.includes("fuerza o destreza 13 o mas")) {
    const maxVal = Math.max(fue, des);
    if (maxVal < 13) {
      return {
        cumple: false,
        motivo: `Requiere Fuerza o Destreza 13 o más (actual: FUE ${fue}, DES ${des})`
      };
    }
  }

  if (reqNorm.includes("destreza o constitucion 13 o mas")) {
    const maxVal = Math.max(des, con);
    if (maxVal < 13) {
      return {
        cumple: false,
        motivo: `Requiere Destreza o Constitución 13 o más (actual: DES ${des}, CON ${con})`
      };
    }
  }

  if (reqNorm.includes("inteligencia, sabiduria o carisma 13 o mas")) {
    const maxVal = Math.max(int, sab, car);
    if (maxVal < 13) {
      return {
        cumple: false,
        motivo: `Requiere Inteligencia, Sabiduría o Carisma 13 o más (actual: INT ${int}, SAB ${sab}, CAR ${car})`
      };
    }
  }

  if (reqNorm.includes("sabiduria o carisma 13 o mas")) {
    const maxVal = Math.max(sab, car);
    if (maxVal < 13) {
      return {
        cumple: false,
        motivo: `Requiere Sabiduría o Carisma 13 o más (actual: SAB ${sab}, CAR ${car})`
      };
    }
  }

  if (reqNorm.includes("inteligencia o sabiduria 13 o mas")) {
    const maxVal = Math.max(int, sab);
    if (maxVal < 13) {
      return {
        cumple: false,
        motivo: `Requiere Inteligencia o Sabiduría 13 o más (actual: INT ${int}, SAB ${sab})`
      };
    }
  }

  // Verificaciones individuales de características
  if (reqNorm.includes("fuerza 13 o mas") && !reqNorm.includes("fuerza o destreza")) {
    if (fue < 13) {
      return { cumple: false, motivo: `Requiere Fuerza 13 o más (actual: ${fue})` };
    }
  }

  if (reqNorm.includes("destreza 13 o mas") && !reqNorm.includes("o destreza") && !reqNorm.includes("destreza o")) {
    if (des < 13) {
      return { cumple: false, motivo: `Requiere Destreza 13 o más (actual: ${des})` };
    }
  }

  if (reqNorm.includes("inteligencia 13 o mas") && !reqNorm.includes("inteligencia,") && !reqNorm.includes("inteligencia o")) {
    if (int < 13) {
      return { cumple: false, motivo: `Requiere Inteligencia 13 o más (actual: ${int})` };
    }
  }

  if (reqNorm.includes("carisma 13 o mas") && !reqNorm.includes("o carisma")) {
    if (car < 13) {
      return { cumple: false, motivo: `Requiere Carisma 13 o más (actual: ${car})` };
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

  // 4. Verificación de Armaduras y Escudos
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

  if (reqNorm.includes("entrenamiento con armaduras pesadas")) {
    if (!tieneCompetenciaGrupo("pesadas") && !tieneCompetenciaGrupo("pesada")) {
      return { cumple: false, motivo: "Requiere entrenamiento con armaduras pesadas" };
    }
  }

  if (reqNorm.includes("entrenamiento con armaduras medias")) {
    if (!tieneCompetenciaGrupo("medias") && !tieneCompetenciaGrupo("mediana") && !tieneCompetenciaGrupo("media")) {
      return { cumple: false, motivo: "Requiere entrenamiento con armaduras medias" };
    }
  }

  if (reqNorm.includes("entrenamiento con armaduras ligeras")) {
    if (!tieneCompetenciaGrupo("ligeras") && !tieneCompetenciaGrupo("ligera")) {
      return { cumple: false, motivo: "Requiere entrenamiento con armaduras ligeras" };
    }
  }

  if (reqNorm.includes("competencia con escudos")) {
    if (!tieneCompetenciaGrupo("escudos") && !tieneCompetenciaGrupo("escudo")) {
      return { cumple: false, motivo: "Requiere competencia con escudos" };
    }
  }

  // 5. Verificación de Rasgo Estilo de Combate
  if (reqNorm.includes("rasgo estilo de combate")) {
    const tieneRasgoEstilo = (personaje.rasgos || []).some((r) =>
      normalizar(r.nombre).includes("estilo de combate")
    );
    const clasesConEstilo = ["guerrero", "paladin", "explorador"];
    const tieneClaseMarcial = (personaje.clases || []).some((c) =>
      clasesConEstilo.includes(normalizar(c.nombre)) && (c.nivel || 1) >= (normalizar(c.nombre) === "guerrero" ? 1 : 2)
    );

    if (!tieneRasgoEstilo && !tieneClaseMarcial) {
      return { cumple: false, motivo: "Requiere el rasgo Estilo de combate" };
    }
  }

  return { cumple: true };
}
