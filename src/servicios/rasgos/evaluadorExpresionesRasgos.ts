import { normalizarCondicionesRasgos, claveEstado } from "./estadoCondicionesRasgos";
import { resolverExtensionesRasgos } from "./extensionesRasgos";
import { seleccionesValidas } from "./seleccionesRasgos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import {
  type PersonajeJugador,
  type RasgoPersonaje,
  type EfectoMecanicoRasgo,
  type Caracteristica
} from "@/tipos";
import {
  obtenerNivelEspacioPacto,
  CATALOGO_INVOCACIONES_SOBRENATURALES
} from "@/constantes/invocacionesSobrenaturales";
import { DOTES_ORIGEN_DND55 } from "@/constantes/dotesConstantes";
import { logger } from "@/utiles/logger";
import {
  normalizar,
  estaRasgoActivo,
  esRasgoHabilitadoPorOpcion,
  estaFuriaActiva,
  estaAtaqueTemerarioActivo,
  estaRevelacionCelestialActiva,
  obtenerNivelClasePersonaje,
  obtenerBonoDanoFuria,
  tieneArmaduraEquipada,
  tieneEscudoEquipado
} from "./utilidadesRasgos";
import { resolverRasgoRecurso } from "./utilidadesRasgos";


/**
 * Evalúa las condiciones contextuales de un efecto mecánico de rasgo.
 */
export const MAPA_TIPOS_DANO_CANONICOS: Record<string, string> = {
  necrotico: "Necrótico", psiquico: "Psíquico", radiante: "Radiante",
  fuego: "Fuego", frio: "Frío", acido: "Ácido",
  relampago: "Relámpago", trueno: "Trueno", veneno: "Veneno", fuerza: "Fuerza"
};

export function cumpleCondicionEfecto(
  condicion: string | null | undefined,
  personaje: PersonajeJugador
): boolean {
  if (!condicion || condicion === "siempre") return true;

  const condNorm = normalizar(condicion);
  if (condNorm.startsWith("rasgo_activo:")) return estaRasgoActivo(personaje, condicion.slice("rasgo_activo:".length));
  if (condNorm.startsWith("sin_condiciones:")) {
    const excluidas = condNorm.slice("sin_condiciones:".length).split(",").map(claveEstado);
    return !(personaje.condicionesActivas ?? []).some(c => excluidas.includes(claveEstado(c)));
  }
  if (condNorm.includes("descanso")) return true;
  if (condNorm === "concentracion") return Boolean(personaje.concentracionActiva) || (personaje.condicionesActivas ?? []).some(c => normalizar(c).includes("concentra"));
  if (condNorm === "luz_tenue_u_oscuridad") return (personaje.condicionesActivas ?? []).some(c => ["luz tenue", "oscuridad"].includes(normalizar(c)));
  const estadoArmadura = tieneArmaduraEquipada(personaje);
  const tieneEscudo = tieneEscudoEquipado(personaje);

  if (condNorm === "furia_activa") return estaFuriaActiva(personaje);
  if (condNorm.includes("temerario") || condNorm.includes("reckless")) {
    return estaAtaqueTemerarioActivo(personaje);
  }
  if (condNorm === "furia_y_temerario_activos" || condNorm === "furia_y_ataque_temerario_activos") {
    return estaFuriaActiva(personaje) && estaAtaqueTemerarioActivo(personaje);
  }
  if (condNorm === "sin_armadura") return !estadoArmadura.tieneArmadura;
  if (condNorm === "con_armadura") return estadoArmadura.tieneArmadura;
  if (condNorm === "sin_escudo") return !tieneEscudo;
  if (condNorm === "con_escudo") return tieneEscudo;
  if (condNorm === "sin_armadura_ni_escudo") return !estadoArmadura.tieneArmadura && !tieneEscudo;
  if (condNorm === "con_armadura_o_escudo") return estadoArmadura.tieneArmadura || tieneEscudo;
  if (condNorm === "sin_armadura_pesada") return !estadoArmadura.esPesada;

  if (condNorm.startsWith("opcion_") || condNorm.startsWith("selector_")) {
    const claveOpcion = condNorm.replace(/^(opcion_|selector_)/, "");
    return (personaje.rasgos || []).some(
      (r) =>
        r.activo !== false &&
        (r.selectores || []).some((sel) =>
          (sel.valorActual || []).some((v) => normalizar(v).includes(claveOpcion))
        )
    );
  }

  // Si coincide con alguna condición activa del personaje
  if ((personaje.condicionesActivas || []).some((c) => normalizar(c).includes(condNorm))) {
    return true;
  }

  // Si coincide con algún rasgo del personaje, comprobar su activación
  const rasgoCoincidente = (personaje.rasgos || []).find(
    (r) => normalizar(r.id) === condNorm || normalizar(r.nombre) === condNorm
  );
  if (rasgoCoincidente) {
    return rasgoCoincidente.activo !== false;
  }

  return false;
}

/**
 * Evalúa y extrae todos los efectos mecánicos activos de los rasgos del personaje.
 * Valida estado activo, dependencias ligadas (`ligadoA`) y condiciones de activación.
 */
export function evaluarEfectosRasgosActivos(personaje: PersonajeJugador): EfectoMecanicoRasgo[] {
  personaje = normalizarCondicionesRasgos(personaje);
  const efectosResultado: EfectoMecanicoRasgo[] = [];
  const rasgos = resolverExtensionesRasgos(personaje.rasgos || [], personaje.nivel || 1);

  for (const rasgo of rasgos) {
    // Si el rasgo exige un nivel mínimo superior al nivel actual del personaje, omitirlo
    if (rasgo.nivelRequerido && obtenerNivelEfectivoParaRasgo(personaje, rasgo) < rasgo.nivelRequerido) continue;

    const nomNorm = normalizar(rasgo.nombre);
    const idNorm = normalizar(rasgo.id);
    const esRevelacion =
      nomNorm.includes("revelacion celestial") ||
      idNorm.includes("revelacion_celestial");

    // Si es Revelación celestial y está activa globalmente (condición o efecto en barra táctica), considerarla activa
    const estaActivo = rasgo.activo !== false || (esRevelacion && estaRevelacionCelestialActiva(personaje));

    // Si el rasgo está desactivado explícitamente, omitirlo
    if (!estaActivo) continue;

    // Si está ligado a otro rasgo (y no es solo delegación de gasto de padre), verificar que el padre esté activo
    if (rasgo.ligadoA && !rasgo.gastarDePadre) {
      const padreActivo = estaRasgoActivo(personaje, rasgo.ligadoA);
      if (!padreActivo) continue;
    }

    // Si requiere una opción específica del rasgo padre, verificar que esté seleccionada
    if (rasgo.requiereOpcion && !esRasgoHabilitadoPorOpcion(rasgo, rasgos)) {
      continue;
    }

    // Efectos base del rasgo (con hidratación de respaldo si proviene de un snapshot antiguo de localStorage)
    let efectosBase = rasgo.efectos?.map(ef => typeof ef.valor === "string" && ef.valor.includes("dados_padre")
      ? { ...ef, valor: resolverFormulaDinamica(ef.valor, personaje, rasgo.fuente, rasgo) } : ef);
    // 1. Efectos base del rasgo
    if (Array.isArray(efectosBase)) {
      // Detección de selector de tipo de daño asociado al rasgo (ej. Golpe divino, Devorador de vida)
      let tipoDanoSelector: string | undefined;
      if (Array.isArray(rasgo.selectores)) {
        for (const sel of rasgo.selectores) {
          const idLower = sel.id.toLowerCase();
          const etiqLower = (sel.etiqueta || "").toLowerCase();
          const esSelectorTipoDano = rasgo.idSelectorTipoDano ? sel.id === rasgo.idSelectorTipoDano :
            idLower.includes("tipo_dano") ||
            idLower.includes("damage_type") ||
            etiqLower.includes("tipo de daño") ||
            etiqLower.includes("tipo de dano") ||
            sel.opciones?.some((o) =>
              ["radiante", "necrotico", "psiquico", "fuego", "frio", "acido", "relampago", "trueno", "veneno", "fuerza"].includes(
                o.id.toLowerCase()
              )
            );

          const valoresValidos = seleccionesValidas(sel, obtenerNivelEfectivoParaRasgo(personaje, rasgo), personaje);
          if (esSelectorTipoDano && valoresValidos.length > 0) {
            const val = valoresValidos[0];
            const opEncontrada = sel.opciones?.find(
              (o) => o.id.toLowerCase() === val.toLowerCase() || normalizar(o.nombre) === normalizar(val)
            );
            const claveNorm = val.toLowerCase().replace(/[\u0300-\u036f]/g, "");
            tipoDanoSelector = opEncontrada?.nombre || MAPA_TIPOS_DANO_CANONICOS[claveNorm] || (val.charAt(0).toUpperCase() + val.slice(1));
            break;
          }
        }
      }

      for (const efecto of efectosBase) {
        if (rasgo.idSelectorTipoDano && !tipoDanoSelector && efecto.tipo === "dano_secundario") continue;
        if (efecto.selectorObjetivo) {
          const sel = rasgo.selectores?.find(s => s.id === efecto.selectorObjetivo);
          const valores = sel ? seleccionesValidas(sel, obtenerNivelEfectivoParaRasgo(personaje, rasgo), personaje) : [];
          if (efecto.activo !== false && cumpleCondicionEfecto(efecto.condicion, personaje))
            for (const valor of valores) efectosResultado.push({ ...efecto, aplicaA: valor });
          continue;
        }
        if (efecto.activo !== false && cumpleCondicionEfecto(efecto.condicion, personaje)) {
          let efFinal = efecto;
          if (efecto.tipo === "dano_secundario" && tipoDanoSelector) {
            efFinal = {
              ...efecto,
              tipoDano: tipoDanoSelector
            };
          }

          if (efecto.tipo === "dado_extra_dano") {
            const rasgosReductores = rasgos.filter((hijo) => {
              if (hijo.activo === false || !hijo.reducirDadosPadre || !hijo.ligadoA) return false;
              const ligHijo = normalizar(hijo.ligadoA);
              return ligHijo === idNorm || ligHijo === nomNorm;
            });

            if (rasgosReductores.length > 0) {
              let dadosARestar = 0;
              for (const rRed of rasgosReductores) {
                for (const sel of rRed.selectores || []) {
                  for (const val of sel.valorActual || []) {
                    const op = sel.opciones?.find((o) => o.id === val || normalizar(o.nombre) === normalizar(val));
                    dadosARestar += typeof op?.costeDados === "number" && op.costeDados > 0 ? op.costeDados : op?.formulaDados ? parseInt(op.formulaDados.match(/^(\d+)d/i)?.[1] || "1", 10) : 1;
                  }
                }
              }
              if (dadosARestar > 0) {
                const valorStr = String(efecto.valor || "");
                const matchDados = valorStr.match(/^(\d+)d(\d+)(.*)$/i);
                if (matchDados) {
                  const cantActual = parseInt(matchDados[1], 10);
                  const caras = matchDados[2];
                  const resto = matchDados[3] || "";
                  const nuevaCant = Math.max(0, cantActual - dadosARestar);
                  if (nuevaCant > 0) {
                    efFinal = {
                      ...efecto,
                      valor: `${nuevaCant}d${caras}${resto}`
                    };
                  } else {
                    continue;
                  }
                }
              }
            }
          }
          efectosResultado.push({
            ...efFinal,
            descripcion: efFinal.descripcion || `${rasgo.nombre}`
          });
        }
      }
    }

    // 2. Efectos procedentes de opciones seleccionadas en selectores
    if (Array.isArray(rasgo.selectores)) {
      for (const selector of rasgo.selectores) {
        const selecciones = selector.modo === "consulta" ? selector.opciones.map(o => o.id)
          : selector.tipoSelector === "invocacion" || selector.filtroHabilidades ? seleccionesValidas(selector, obtenerNivelEfectivoParaRasgo(personaje, rasgo), personaje) : selector.valorActual || [];
        for (const opId of selecciones) {
          if (rasgos.some(r => r.idSelectorOrigen === selector.id && r.ligadoA === rasgo.id && r.requiereOpcion === opId)) continue;
          if (selector.tipoSelector === "dote" && rasgos.some(r => r.origen === "dote" && r.ligadoA === rasgo.id)) continue;
          const baseSinArg = opId.includes(":") ? opId.split(":")[0] : opId;
          const baseId = baseSinArg.includes("__") ? baseSinArg.split("__")[0] : baseSinArg;
          let opcion = selector.opciones?.find((o) => o.id === opId || o.id === baseId);

          // Respaldo dinámico para catálogo de invocaciones si selector.opciones no viene hidratado
          if (
            !opcion &&
            (selector.claveOpcionesDinamicas === "invocaciones_brujo" ||
              selector.tipoSelector === "invocacion" ||
              selector.id?.includes("invocacion"))
          ) {
            const invCatalogo = CATALOGO_INVOCACIONES_SOBRENATURALES.find(
              (i) => i.id === baseId || i.id === opId
            );
            if (invCatalogo) {
              opcion = invCatalogo as unknown as import("@/tipos/rasgos").OpcionSelector;
            }
          }

          if (opcion && Array.isArray(opcion.efectos)) {
            for (const efOp of opcion.efectos) {
              if (efOp.selectorObjetivo && !opId.includes(":")) continue;
              if (efOp.activo !== false && cumpleCondicionEfecto(efOp.condicion, personaje)) {
                let efectoFinal = efOp.selectorObjetivo ? { ...efOp, aplicaA: opId.split(":")[1] } : efOp;
                if (efOp.tipo === "dano_secundario") {
                  let tipoDanoResuelto = efOp.tipoDano;
                  if (opId.includes(":")) {
                    const subtipo = opId.split(":")[1].toLowerCase().replace(/[\u0300-\u036f]/g, "");
                    tipoDanoResuelto = MAPA_TIPOS_DANO_CANONICOS[subtipo] || (subtipo.charAt(0).toUpperCase() + subtipo.slice(1));
                  } else if (opcion.selectores?.[0]?.valorActual?.[0]) {
                    const v = opcion.selectores[0].valorActual[0].toLowerCase().replace(/[\u0300-\u036f]/g, "");
                    tipoDanoResuelto = MAPA_TIPOS_DANO_CANONICOS[v] || tipoDanoResuelto;
                  }
                  efectoFinal = { ...efOp, tipoDano: tipoDanoResuelto };
                } else if (
                  efOp.tipo === "bono_dano_conjuro" &&
                  normalizar(efOp.objetivo).includes("modificador_habilidad")
                ) {
                  if (opId.includes(":")) {
                    const trucoTarget = opId.split(":")[1].trim();
                    if (trucoTarget) {
                      efectoFinal = { ...efOp, aplicaA: trucoTarget };
                    }
                  }
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
            const dote = DOTES_ORIGEN_DND55.find(d => normalizar(d.id) === doteNorm || normalizar(d.id).replace(/^dote_/, "") === doteNorm.replace(/^dote_/, "") || normalizar(d.nombre) === doteNorm);
            if (dote?.efectos && !(personaje.rasgos || []).some(r => r.id === dote.id || (r.origen === "dote" && normalizar(r.nombre) === normalizar(dote.nombre)))) {
              for (const efDote of dote.efectos) {
                if (efDote.activo !== false && cumpleCondicionEfecto(efDote.condicion, personaje)) {
                  efectosResultado.push({ ...efDote, descripcion: efDote.descripcion || `Lecciones de los Primeros (${dote.nombre})` });
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
  nombreClaseContexto?: string,
  rasgo?: RasgoPersonaje
): string {
  if (typeof formula === "number") return String(formula);
  if (!formula || typeof formula !== "string") return "";

  const nivelGlobal = personaje.nivel || 1;
  const nivelClase = rasgo ? obtenerNivelEfectivoParaRasgo(personaje, rasgo) : nombreClaseContexto
    ? obtenerNivelClasePersonaje(personaje, nombreClaseContexto) || nivelGlobal
    : nivelGlobal;
  const mitadNivel = Math.max(1, Math.floor(nivelClase / 2));
  const nivelBarbaro = obtenerNivelClasePersonaje(personaje, "barbaro") || (normalizar(personaje.clase || "").includes("barbaro") ? nivelGlobal : 0);
  const bonoFuria = obtenerBonoDanoFuria(nivelBarbaro || nivelGlobal);
  const bonoCompetencia = Math.floor((nivelGlobal - 1) / 4) + 2;

  const nivelBrujo =
    obtenerNivelClasePersonaje(personaje, "brujo") ||
    (normalizar(personaje.clase || "").includes("brujo") ? nivelGlobal : 0) ||
    1;
  const nivelEspacioPacto =
    personaje.nivelEspacioPacto && personaje.nivelEspacioPacto > 0
      ? personaje.nivelEspacioPacto
      : obtenerNivelEspacioPacto(nivelBrujo);

  // Modificadores de características para tiradas dinámicas (ej. 1d12+constitucion)
  const stats = personaje.caracteristicas || (personaje as { estadisticas?: Record<Caracteristica, number> }).estadisticas;
  const modCon = stats?.constitucion !== undefined ? Math.floor((stats.constitucion - 10) / 2) : 0;
  const modFue = stats?.fuerza !== undefined ? Math.floor((stats.fuerza - 10) / 2) : 0;
  const modDes = stats?.destreza !== undefined ? Math.floor((stats.destreza - 10) / 2) : 0;
  const modInt = stats?.inteligencia !== undefined ? Math.floor((stats.inteligencia - 10) / 2) : 0;
  const modSab = stats?.sabiduria !== undefined ? Math.floor((stats.sabiduria - 10) / 2) : 0;
  const modCar = stats?.carisma !== undefined ? Math.floor((stats.carisma - 10) / 2) : 0;

  // Normalizar prefijos de modificadores (ej. "modificador_carisma", "modificador por carisma", "mod_carisma")
  const formulaNormalizada = formula
    .replace(/\bdados_padre\b/gi, () => rasgo ? resolverRasgoRecurso(rasgo, personaje.rasgos, "dados")?.formulaDados ?? "0" : "0")
    .replace(/modificador[_\s]*(de[_\s]+|por[_\s]+)?/gi, "")
    .replace(/mod[_\s]+/gi, "");

  const reemplazado = formulaNormalizada
    .replace(/nivel_espacio_pacto/gi, String(nivelEspacioPacto))
    .replace(/espacio_pacto/gi, String(nivelEspacioPacto))
    .replace(/dano_furia/gi, String(bonoFuria))
    .replace(/mitad_nivel/gi, String(mitadNivel))
    .replace(/bono_competencia/gi, String(bonoCompetencia))
    .replace(/\b(pb|bc)\b/gi, String(bonoCompetencia))
    .replace(/nivel_([a-záéíóúñ]+)/gi, (_m, nombreClaseCapturada) => {
      const clsNorm = normalizar(nombreClaseCapturada);
      if (clsNorm === "espacio_pacto") return String(nivelEspacioPacto);
      if (clsNorm === "barbaro") return String(nivelBarbaro || nivelGlobal);
      if (clsNorm === "brujo") return String(nivelBrujo);
      const lvl = obtenerNivelClasePersonaje(personaje, clsNorm);
      if (lvl > 0) return String(lvl);
      if (nombreClaseContexto && normalizar(nombreClaseContexto).includes(clsNorm)) return String(nivelClase);
      return String(normalizar(personaje.clase || "").includes(clsNorm) ? nivelClase : 0);
    })
    .replace(/\bnivel\b/gi, String(nivelClase))
    .replace(/\b(constitucion|con)\b/gi, String(modCon))
    .replace(/\b(fuerza|fue|str)\b/gi, String(modFue))
    .replace(/\b(destreza|des|dex)\b/gi, String(modDes))
    .replace(/\b(inteligencia|int)\b/gi, String(modInt))
    .replace(/\b(sabiduria|sab|wis)\b/gi, String(modSab))
    .replace(/\b(carisma|car|cha)\b/gi, String(modCar))
    .replace(/max\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)\s*d(\d+)/gi, (_m, minStr, valStr, caraStr) => {
      const cantDados = Math.max(parseInt(minStr, 10), parseInt(valStr, 10));
      return `${cantDados}d${caraStr}`;
    })
    .replace(/max\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/gi, (_m, minStr, valStr) => {
      return String(Math.max(parseInt(minStr, 10), parseInt(valStr, 10)));
    })
    .replace(/(\d+)\s+d/gi, "$1d")
    .replace(/\+\s*\+/g, "+")
    .replace(/\+\s*-/g, "-")
    .trim();

  // Si no contiene notación de dados ('d' o 'D') y contiene únicamente elementos aritméticos evaluables,
  // resolvemos la operación automáticamente para entregar el resultado numérico plano (ej. "5*20" -> "100", "5*3" -> "15").
  if (!/[dD]/.test(reemplazado) && /^[0-9+\-*\/()\s]+$/.test(reemplazado)) {
    try {
      const resultadoNumerico = evaluarExpresionNumericaSegura(reemplazado);
      if (!Number.isNaN(resultadoNumerico)) {
        return String(resultadoNumerico);
      }
    } catch (error) {
      logger.warn(`[Evaluador Expresiones] Error al evaluar numéricamente expresión "${reemplazado}":`, error);
    }
  }

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
