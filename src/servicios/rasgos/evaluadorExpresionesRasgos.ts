import {
  type PersonajeJugador,
  type RasgoPersonaje,
  type EfectoMecanicoRasgo,
  type Caracteristica
} from "@/tipos";
import { obtenerNivelEspacioPacto } from "@/constantes/invocacionesSobrenaturales";
import { DOTES_ORIGEN_DND55 } from "@/constantes/dotesConstantes";
import { logger } from "@/utiles/logger";
import {
  normalizar,
  estaRasgoActivo,
  estaFuriaActiva,
  estaAtaqueTemerarioActivo,
  estaRevelacionCelestialActiva,
  obtenerNivelClasePersonaje,
  obtenerBonoDanoFuria,
  tieneArmaduraEquipada,
  tieneEscudoEquipado
} from "./utilidadesRasgos";

/**
 * Evalúa las condiciones contextuales de un efecto mecánico de rasgo.
 */
export function cumpleCondicionEfecto(
  condicion: string | null | undefined,
  personaje: PersonajeJugador
): boolean {
  if (!condicion || condicion === "siempre") return true;

  const condNorm = normalizar(condicion);
  const estadoArmadura = tieneArmaduraEquipada(personaje);
  const tieneEscudo = tieneEscudoEquipado(personaje);

  if (condNorm === "furia_activa") {
    return estaFuriaActiva(personaje);
  }
  if (
    condNorm === "ataque_temerario_activo" ||
    condNorm === "ataque_temerario" ||
    condNorm === "ataque temerario" ||
    condNorm === "reckless" ||
    condNorm === "reckless_attack"
  ) {
    return estaAtaqueTemerarioActivo(personaje);
  }
  if (
    condNorm === "furia_y_temerario_activos" ||
    condNorm === "furia_y_ataque_temerario_activos"
  ) {
    return estaFuriaActiva(personaje) && estaAtaqueTemerarioActivo(personaje);
  }
  if (condNorm === "sin_armadura") {
    return !estadoArmadura.tieneArmadura;
  }
  if (condNorm === "sin_armadura_ni_escudo") {
    return !estadoArmadura.tieneArmadura && !tieneEscudo;
  }
  if (condNorm === "sin_armadura_pesada") {
    return !estadoArmadura.esPesada;
  }

  // Si coincide con alguna condición activa del personaje
  if ((personaje.condicionesActivas || []).some((c) => normalizar(c) === condNorm || normalizar(c).includes(condNorm))) {
    return true;
  }

  // Si coincide con algún rasgo activo del personaje
  if (estaRasgoActivo(personaje, condicion)) {
    return true;
  }

  return true;
}

/**
 * Evalúa y extrae todos los efectos mecánicos activos de los rasgos del personaje.
 * Valida estado activo, dependencias ligadas (`ligadoA`) y condiciones de activación.
 */
export function evaluarEfectosRasgosActivos(personaje: PersonajeJugador): EfectoMecanicoRasgo[] {
  const efectosResultado: EfectoMecanicoRasgo[] = [];
  const rasgos = personaje.rasgos || [];
  const nivelPj = personaje.nivel || 1;

  for (const rasgo of rasgos) {
    // Si el rasgo exige un nivel mínimo superior al nivel actual del personaje, omitirlo
    if (rasgo.nivelRequerido && nivelPj < rasgo.nivelRequerido) continue;

    const nomNorm = normalizar(rasgo.nombre);
    const idNorm = normalizar(rasgo.id);
    const esRevelacion =
      nomNorm.includes("revelacion celestial") ||
      idNorm.includes("revelacion_celestial");

    // Si es Revelación celestial y está activa globalmente (condición o efecto en barra táctica), considerarla activa
    const estaActivo = rasgo.activo !== false || (esRevelacion && estaRevelacionCelestialActiva(personaje));

    // Si el rasgo está desactivado explícitamente, omitirlo
    if (!estaActivo) continue;

    // Si está ligado a otro rasgo, verificar que el padre esté activo
    if (rasgo.ligadoA) {
      const padreActivo = estaRasgoActivo(personaje, rasgo.ligadoA);
      if (!padreActivo) continue;
    }

    // Efectos base del rasgo (con hidratación de respaldo si proviene de un snapshot antiguo de localStorage)
    let efectosBase = rasgo.efectos;
    if (esRevelacion && (!Array.isArray(efectosBase) || efectosBase.length === 0)) {
      efectosBase = [
        {
          tipo: "bono_dano_ataque",
          objetivo: "todos_ataques",
          valor: "bono_competencia",
          aplicaA: "todos_ataques",
          descripcion: "Revelación celestial (+PB daño en ataques)"
        },
        {
          tipo: "bono_dano_conjuro",
          objetivo: "todos_conjuros",
          valor: "bono_competencia",
          aplicaA: "todos_conjuros",
          descripcion: "Revelación celestial (+PB daño en conjuros)"
        }
      ];
    }

    // 1. Efectos base del rasgo
    if (Array.isArray(efectosBase)) {
      for (const efecto of efectosBase) {
        if (efecto.activo !== false && cumpleCondicionEfecto(efecto.condicion, personaje)) {
          efectosResultado.push({
            ...efecto,
            descripcion: efecto.descripcion || `${rasgo.nombre}`
          });
        }
      }
    }

    // 2. Efectos procedentes de opciones seleccionadas en selectores
    if (Array.isArray(rasgo.selectores)) {
      for (const selector of rasgo.selectores) {
        const selecciones = selector.valorActual || [];
        for (const opId of selecciones) {
          const baseSinArg = opId.includes(":") ? opId.split(":")[0] : opId;
          const baseId = baseSinArg.includes("__") ? baseSinArg.split("__")[0] : baseSinArg;
          const opcion = selector.opciones.find((o) => o.id === opId || o.id === baseId);
          if (opcion && Array.isArray(opcion.efectos)) {
            for (const efOp of opcion.efectos) {
              if (efOp.activo !== false && cumpleCondicionEfecto(efOp.condicion, personaje)) {
                let efectoFinal = efOp;
                if (opId.includes(":") && efOp.tipo === "dano_secundario") {
                  const subtipo = opId.split(":")[1].toLowerCase();
                  const mapaTipos: Record<string, string> = {
                    necrotico: "Necrótico",
                    psiquico: "Psíquico",
                    radiante: "Radiante"
                  };
                  const tipoDanoFormateado =
                    mapaTipos[subtipo] || (subtipo.charAt(0).toUpperCase() + subtipo.slice(1));
                  efectoFinal = { ...efOp, tipoDano: tipoDanoFormateado };
                }
                efectosResultado.push({
                  ...efectoFinal,
                  descripcion: efectoFinal.descripcion || `${rasgo.nombre} (${opcion.nombre})`
                });
              }
            }
          }

          // Soporte de efectos mecánicos para Lecciones de los Primeros (Dotes de origen canónicas)
          if (baseId === "lecciones_de_los_primeros" && opId.includes(":")) {
            const doteId = opId.split(":")[1];
            const doteNorm = normalizar(doteId);
            const dote = DOTES_ORIGEN_DND55.find(
              (d) =>
                d.id === doteId ||
                normalizar(d.id) === doteNorm ||
                normalizar(d.id).replace(/^dote_/, "") === doteNorm.replace(/^dote_/, "") ||
                normalizar(d.nombre) === doteNorm ||
                (doteNorm === "alert" && d.id === "dote_alerta") ||
                (doteNorm === "crafter" && d.id === "dote_fabricante") ||
                (doteNorm === "healer" && d.id === "dote_sanador") ||
                (doteNorm === "musician" && d.id === "dote_musico") ||
                (doteNorm === "lucky" && d.id === "dote_afortunado") ||
                (doteNorm === "savage-attacker" && d.id === "dote_atacante_salvaje") ||
                (doteNorm === "skilled" && d.id === "dote_habilidoso") ||
                (doteNorm === "tough" && d.id === "dote_duro") ||
                (doteNorm === "tavern-brawler" && d.id === "dote_maton_taberna")
            );

            if (dote && Array.isArray(dote.efectos)) {
              const yaExisteEnRasgos = (personaje.rasgos || []).some(
                (r) =>
                  r.id === dote.id ||
                  r.id === `dote_invocacion_${dote.id}` ||
                  (r.origen === "dote" && normalizar(r.nombre) === normalizar(dote.nombre))
              );
              if (yaExisteEnRasgos) continue;

              for (const efDote of dote.efectos) {
                if (efDote.activo !== false && cumpleCondicionEfecto(efDote.condicion, personaje)) {
                  efectosResultado.push({
                    ...efDote,
                    descripcion: efDote.descripcion || `Lecciones de los Primeros (${dote.nombre})`
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return efectosResultado;
}

/**
 * Resuelve dinámicamente identificadores en fórmulas de daño o dados
 * (ej. "mitad_nivel", "nivel", "dano_furia", "bono_competencia", "nivel_espacio_pacto").
 *
 * Soporta:
 * - "1d6 + mitad_nivel" -> ej. "1d6+2"
 * - "1d8 + nivel" -> ej. "1d8+5"
 * - "mitad_nivel" -> "2"
 * - "dano_furia" -> "2", "3" o "4"
 */
export function resolverFormulaDinamica(
  formula: string | number,
  personaje: PersonajeJugador,
  nombreClaseContexto?: string
): string {
  if (typeof formula === "number") return String(formula);
  if (!formula || typeof formula !== "string") return "";

  const nivelGlobal = personaje.nivel || 1;
  const nivelClase = nombreClaseContexto
    ? obtenerNivelClasePersonaje(personaje, nombreClaseContexto) || nivelGlobal
    : nivelGlobal;
  const mitadNivel = Math.max(1, Math.floor(nivelClase / 2));
  const nivelBarbaro = obtenerNivelClasePersonaje(personaje, "barbaro") || nivelGlobal;
  const bonoFuria = obtenerBonoDanoFuria(nivelBarbaro);
  const bonoCompetencia = Math.floor((nivelGlobal - 1) / 4) + 2;

  const nivelBrujo =
    personaje.clases?.find((c) => normalizar(c.nombre) === "brujo")?.nivel ||
    (normalizar(personaje.clase) === "brujo" ? personaje.nivel : 0) ||
    1;
  const nivelEspacioPacto =
    personaje.nivelEspacioPacto && personaje.nivelEspacioPacto > 0
      ? personaje.nivelEspacioPacto
      : obtenerNivelEspacioPacto(nivelBrujo);

  // Modificadores de características para tiradas dinámicas (ej. 1d12+constitucion)
  const stats = personaje.caracteristicas;
  const modCon = stats?.constitucion !== undefined ? Math.floor((stats.constitucion - 10) / 2) : 0;
  const modFue = stats?.fuerza !== undefined ? Math.floor((stats.fuerza - 10) / 2) : 0;
  const modDes = stats?.destreza !== undefined ? Math.floor((stats.destreza - 10) / 2) : 0;
  const modInt = stats?.inteligencia !== undefined ? Math.floor((stats.inteligencia - 10) / 2) : 0;
  const modSab = stats?.sabiduria !== undefined ? Math.floor((stats.sabiduria - 10) / 2) : 0;
  const modCar = stats?.carisma !== undefined ? Math.floor((stats.carisma - 10) / 2) : 0;

  // Normalizar prefijos de modificadores (ej. "modificador_carisma", "modificador por carisma", "mod_carisma")
  const formulaNormalizada = formula
    .replace(/modificador[_\s]*(de[_\s]+|por[_\s]+)?/gi, "")
    .replace(/mod[_\s]+/gi, "");

  const reemplazado = formulaNormalizada
    .replace(/nivel_espacio_pacto/gi, String(nivelEspacioPacto))
    .replace(/espacio_pacto/gi, String(nivelEspacioPacto))
    .replace(/dano_furia/gi, String(bonoFuria))
    .replace(/mitad_nivel/gi, String(mitadNivel))
    .replace(/bono_competencia/gi, String(bonoCompetencia))
    .replace(/\b(pb|bc)\b/gi, String(bonoCompetencia))
    .replace(/\bnivel\b/gi, String(nivelClase))
    .replace(/\b(constitucion|con)\b/gi, String(modCon))
    .replace(/\b(fuerza|fue|str)\b/gi, String(modFue))
    .replace(/\b(destreza|des|dex)\b/gi, String(modDes))
    .replace(/\b(inteligencia|int)\b/gi, String(modInt))
    .replace(/\b(sabiduria|sab|wis)\b/gi, String(modSab))
    .replace(/\b(carisma|car|cha)\b/gi, String(modCar))
    .replace(/(\d+)\s+d/gi, "$1d")
    .replace(/\+\s*\+/g, "+")
    .replace(/\+\s*-/g, "-")
    .trim();

  return reemplazado;
}

/**
 * Evalúa expresiones numéricas sencillas y seguras (ej. "3", "+2", "-1", "2+3", "1*5", "2*nivel", "max(1, carisma)")
 * sin recurrir a eval(), garantizando rendimiento y seguridad.
 */
export function evaluarExpresionNumericaSegura(
  expresion: string | number,
  variables?: { nivel?: number }
): number {
  if (typeof expresion === "number") return isNaN(expresion) ? 0 : expresion;
  if (!expresion || typeof expresion !== "string") return 0;

  let textoProcesado = expresion;
  if (variables && typeof variables.nivel === "number") {
    textoProcesado = textoProcesado.replace(/\bnivel\b/gi, String(variables.nivel));
  }

  // Soporte para max(a, b) y min(a, b)
  const regexMax = /max\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/i;
  let matchMax: RegExpExecArray | null;
  while ((matchMax = regexMax.exec(textoProcesado)) !== null) {
    const valA = evaluarExpresionNumericaSegura(matchMax[1], variables);
    const valB = evaluarExpresionNumericaSegura(matchMax[2], variables);
    textoProcesado = textoProcesado.replace(matchMax[0], String(Math.max(valA, valB)));
  }

  const regexMin = /min\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/i;
  let matchMin: RegExpExecArray | null;
  while ((matchMin = regexMin.exec(textoProcesado)) !== null) {
    const valA = evaluarExpresionNumericaSegura(matchMin[1], variables);
    const valB = evaluarExpresionNumericaSegura(matchMin[2], variables);
    textoProcesado = textoProcesado.replace(matchMin[0], String(Math.min(valA, valB)));
  }

  // Resolver paréntesis de expresiones aritméticas internas (ej. "12 + 5 * (2 - 1)")
  const regexParentesis = /\(([^()]+)\)/;
  let matchPar: RegExpExecArray | null;
  while ((matchPar = regexParentesis.exec(textoProcesado)) !== null) {
    const valInterno = evaluarExpresionNumericaSegura(matchPar[1], variables);
    textoProcesado = textoProcesado.replace(matchPar[0], String(valInterno));
  }

  // Reemplazar 'x' o 'X' utilizada como operador de multiplicación y remover espacios
  const limpia = textoProcesado.replace(/(\d)\s*[xX]\s*(\d)/g, "$1*$2").replace(/\s+/g, "").trim();
  if (!limpia) return 0;

  // Si es un número entero simple o con signo (ej. "4", "+2", "-3")
  if (/^[+-]?\d+$/.test(limpia)) {
    return parseInt(limpia, 10);
  }

  // Si contiene dígitos y operadores válidos (+, -, *)
  if (/^[+-]?\d+([*+-]\d+)*$/.test(limpia)) {
    try {
      const normalizadoParaSuma = limpia
        .replace(/(.)\+/g, "$1\n+")
        .replace(/(.)-/g, "$1\n-");

      const lineas = normalizadoParaSuma.split("\n");
      let total = 0;

      for (const linea of lineas) {
        if (!linea) continue;
        const signo = linea.startsWith("-") ? -1 : 1;
        const sinSigno = linea.replace(/^[+-]/, "");

        if (sinSigno.includes("*")) {
          const factores = sinSigno.split("*").map((f) => parseInt(f, 10));
          if (factores.some(isNaN)) return 0;
          const producto = factores.reduce((acc, val) => acc * val, 1);
          total += signo * producto;
        } else {
          const val = parseInt(sinSigno, 10);
          if (isNaN(val)) return 0;
          total += signo * val;
        }
      }
      return total;
    } catch (error) {
      logger.warn(`[evaluadorEfectosRasgos] Error al evaluar expresión matemática "${limpia}":`, error);
      return 0;
    }
  }

  const num = parseInt(limpia, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Calcula dinámicamente los usos máximos de un rasgo considerando su fórmula de escalado
 * (ej. "bono_competencia", "nivel", modificadores de característica).
 * Si no posee escalado dinámico, retorna rasgo.usosMaximos ?? 1.
 */
export function calcularUsosMaximosRasgo(
  rasgo: RasgoPersonaje,
  personaje: PersonajeJugador
): number {
  if (!rasgo.tieneUsosLimitados) return 1;

  const formula = (rasgo.formulaEscalado || "").toLowerCase().trim();
  const nivelPj = Math.max(1, personaje.nivel || 1);

  if (formula === "bono_competencia") {
    return Math.floor((nivelPj - 1) / 4) + 2;
  }
  if (formula === "nivel") {
    return nivelPj;
  }
  if (formula.startsWith("modificador_")) {
    const stat = formula.replace("modificador_", "") as Caracteristica;
    const score = personaje.overridesFijos?.[stat] ?? personaje.caracteristicas?.[stat] ?? 10;
    const mod = Math.floor((score - 10) / 2);
    return Math.max(1, mod);
  }

  return rasgo.usosMaximos ?? 1;
}
