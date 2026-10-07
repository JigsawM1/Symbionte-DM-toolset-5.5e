import { sanitizarEtiqueta } from "./lanzadorDados";
import { logger } from "./logger";

/**
 * Representa un componente individual de daño en un ataque rápido
 */
export interface ComponenteDano {
  dados: string;
  tipo: string;
}

/**
 * Desglosa cadenas de dados y tipos de daño en componentes estructurados.
 * Soporta entradas separadas por '/' (ej. "1d6+3 / 1d4" con "contundente / veneno")
 * así como dados compuestos con '+' o tipos separados por comas.
 *
 * @param dadosDaño Cadena con la fórmula o fórmulas de dados (ej: "1d6+3 / 1d4")
 * @param tipoDaño Cadena con el tipo o tipos de daño (ej: "contundente / veneno")
 * @returns Array de componentes de daño con sus respectivos dados y tipos
 */
export function desglosarAtaqueRapido(
  dadosDaño: string,
  tipoDaño: string
): ComponenteDano[] {
  try {
    const dadosLimpio = (dadosDaño || "").trim();
    const tipoLimpio = (tipoDaño || "").trim();

    if (!dadosLimpio) {
      return [{ dados: "1d6", tipo: tipoLimpio || "fuerza" }];
    }

    // 1. Separar por barra '/' si existe
    let partesDados = dadosLimpio.split("/").map((d) => d.trim()).filter(Boolean);
    let partesTipos = tipoLimpio ? tipoLimpio.split("/").map((t) => t.trim()).filter(Boolean) : [];

    // Si los tipos no estaban separados por '/', pero sí por comas o '+'
    if (partesTipos.length <= 1 && partesDados.length > 1 && tipoLimpio) {
      const splitPorComa = tipoLimpio.split(/[,+&]|\by\b/i).map((t) => t.trim()).filter(Boolean);
      if (splitPorComa.length === partesDados.length) {
        partesTipos = splitPorComa;
      }
    }

    // Si los dados no tenían '/', pero tenían una fórmula compuesta con '+' entre dados
    // ej: "2d8+7+1d10" -> "2d8+7" y "1d10"
    if (partesDados.length === 1) {
      const matchCompuesto = dadosLimpio.match(/^(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*\+\s*(\d+d\d+(?:\s*[+-]\s*\d+)?)$/i);
      if (matchCompuesto) {
        partesDados = [matchCompuesto[1].trim(), matchCompuesto[2].trim()];
      }
    }

    const componentes: ComponenteDano[] = partesDados.map((dados, idx) => {
      let tipo = partesTipos[idx] || "";
      if (!tipo) {
        tipo = idx === 0 ? (partesTipos[0] || tipoLimpio || "fuerza") : `daño extra ${idx + 1}`;
      }
      return {
        dados,
        tipo
      };
    });

    return componentes.length > 0 ? componentes : [{ dados: "1d6", tipo: tipoLimpio || "fuerza" }];
  } catch (error) {
    logger.error("[ProcesadorAtaques] Error al desglosar ataque rápido:", error);
    return [{ dados: dadosDaño || "1d6", tipo: tipoDaño || "fuerza" }];
  }
}

/**
 * Construye la fórmula de dados para TaleSpire con etiquetas individuales por cada tipo de daño.
 * Formato de salida: "!Ataque [Nombre]:1d20+[Bono]/Daño [Tipo1]:[Dados1]/Daño [Tipo2]:[Dados2]"
 *
 * @param ataqueNombre Nombre del ataque (ej: "Bastón de Enredaderas", "Desgarrar")
 * @param bonoAtaqueStr Bonificador al impacto (ej: "+5", "5", "-1")
 * @param dadosDaño Fórmula o fórmulas de dados de daño (ej: "1d6+3 / 1d4")
 * @param tipoDaño Tipo o tipos de daño (ej: "contundente / veneno")
 * @returns Cadena formateada para enviar a TaleSpire
 */
export function construirFormulaAtaqueRapido(
  ataqueNombre: string,
  bonoAtaqueStr: string,
  dadosDaño: string,
  tipoDaño: string,
  criaturaNombre?: string
): string {
  try {
    const nombreSaneado = sanitizarEtiqueta(ataqueNombre || "Ataque");
    const bonoNum = parseInt(String(bonoAtaqueStr || "").replace(/[^\d-]/g, ""), 10) || 0;
    const bonoFormateado = `${bonoNum >= 0 ? "+" : ""}${bonoNum}`;
    const prefijoCriatura = criaturaNombre ? `${sanitizarEtiqueta(criaturaNombre)} - ` : "";
    const nombreAtaqueGrupo = criaturaNombre ? nombreSaneado : `Ataque ${nombreSaneado}`;
    const grupoAtaque = `!${prefijoCriatura}${nombreAtaqueGrupo}:1d20${bonoFormateado}`;

    const componentes = desglosarAtaqueRapido(dadosDaño, tipoDaño);
    const gruposDano = componentes.map((comp, idx) => {
      const dadosLimpios = comp.dados.replace(/\s+/g, "");
      const tipoLower = comp.tipo.toLowerCase().trim();
      
      let etiquetaDano = "";
      if (tipoLower.startsWith("daño") || tipoLower.startsWith("dano")) {
        etiquetaDano = sanitizarEtiqueta(comp.tipo);
      } else if (tipoLower === "físico" || tipoLower === "fisico" || tipoLower === "") {
        etiquetaDano = idx === 0 ? "Daño" : `Daño Extra ${idx + 1}`;
      } else {
        // Capitalizar primera letra del tipo
        const tipoCap = comp.tipo.charAt(0).toUpperCase() + comp.tipo.slice(1);
        etiquetaDano = sanitizarEtiqueta(`Daño ${tipoCap}`);
      }

      return `${etiquetaDano}:${dadosLimpios}`;
    });

    return [grupoAtaque, ...gruposDano].join("/");
  } catch (error) {
    logger.error("[ProcesadorAtaques] Error al construir fórmula de ataque rápido:", error);
    const bonoNum = parseInt(String(bonoAtaqueStr || "").replace(/[^\d-]/g, ""), 10) || 0;
    return `!Ataque ${sanitizarEtiqueta(ataqueNombre || "Ataque")}:1d20${bonoNum >= 0 ? "+" : ""}${bonoNum}/Daño:${(dadosDaño || "1d6").replace(/\s+/g, "")}`;
  }
}

/**
 * Formatea un ataque rápido para ser visualizado en tooltips o previsualizaciones en la UI.
 * Ejemplo: "d20+5 | Daño: 1d6+3 (contundente) + 1d4 (veneno)"
 */
export function formatearDetalleAtaqueRapido(
  bonoAtaqueStr: string,
  dadosDaño: string,
  tipoDaño: string
): string {
  try {
    const bonoNum = parseInt(String(bonoAtaqueStr || "").replace(/[^\d-]/g, ""), 10) || 0;
    const bonoFormateado = `${bonoNum >= 0 ? "+" : ""}${bonoNum}`;
    const componentes = desglosarAtaqueRapido(dadosDaño, tipoDaño);

    const desgloseDano = componentes
      .map((c) => `${c.dados} (${c.tipo})`)
      .join(" + ");

    return `Tirar ataque: d20${bonoFormateado} | Daño: ${desgloseDano}`;
  } catch (error) {
    logger.error("[ProcesadorAtaques] Error al formatear detalle de ataque rápido:", error);
    return `Tirar ataque: d20${bonoAtaqueStr} | Daño: ${dadosDaño}`;
  }
}

/**
 * Parámetros de entrada para extraer datos de un ataque de criatura hacia un ataque rápido.
 */
export interface ParametrosExtraccionAtaque {
  nombre: string;
  bonificadorAtaque?: number | string;
  daño?: string;
  descripcion?: string;
}

/**
 * Datos estructurados extraídos de un ataque para rellenar el formulario de ataque rápido.
 */
export interface DatosAtaqueRapidoExtraidos {
  nombre: string;
  bonificadorAtaque: string;
  dadosDaño: string;
  tipoDaño: string;
  danosAdicionales: ComponenteDano[];
}

/** Normaliza cadenas descriptivas a los tipos de daño canónicos del compendio */
export function normalizarTipoDanoTexto(texto: string): string | null {
  if (!texto) return null;
  const t = texto.toLowerCase();

  if (t.includes("cortante mágico") || t.includes("cortante magico")) return "cortante mágico";
  if (t.includes("perforante mágico") || t.includes("perforante magico")) return "perforante mágico";
  if (t.includes("contundente mágico") || t.includes("contundente magico")) return "contundente mágico";
  if (t.includes("cortante") || t.includes("slashing")) return "cortante";
  if (t.includes("perforante") || t.includes("piercing")) return "perforante";
  if (t.includes("contundente") || t.includes("bludgeoning")) return "contundente";
  if (t.includes("fuego") || t.includes("fire")) return "fuego";
  if (t.includes("frío") || t.includes("frio") || t.includes("cold")) return "frío";
  if (t.includes("veneno") || t.includes("poison")) return "veneno";
  if (t.includes("ácido") || t.includes("acido") || t.includes("acid")) return "ácido";
  if (t.includes("psíquico") || t.includes("psiquico") || t.includes("psychic")) return "psíquico";
  if (t.includes("necrótico") || t.includes("necrotico") || t.includes("necrotic")) return "necrótico";
  if (t.includes("radiante") || t.includes("radiant")) return "radiante";
  if (t.includes("relámpago") || t.includes("relampago") || t.includes("lightning") || t.includes("rayo")) return "relámpago";
  if (t.includes("trueno") || t.includes("thunder")) return "trueno";
  if (t.includes("fuerza") || t.includes("force")) return "fuerza";

  return null;
}

/** Infiere el tipo de daño en base a palabras clave en el nombre del ataque */
export function inferirTipoPorNombreAtaque(nombre: string): string {
  const n = (nombre || "").toLowerCase();
  if (n.includes("mordisco") || n.includes("colmillo") || n.includes("pico") || n.includes("daga") || n.includes("lanza") || n.includes("flecha") || n.includes("arco") || n.includes("arpon") || n.includes("arpón") || n.includes("cuerno") || n.includes("aguijón") || n.includes("aguijon")) return "perforante";
  if (n.includes("garra") || n.includes("espada") || n.includes("cimitarra") || n.includes("hacha") || n.includes("desgarrar") || n.includes("cuchilla") || n.includes("tajada") || n.includes("guadaña")) return "cortante";
  if (n.includes("golpe") || n.includes("maza") || n.includes("martillo") || n.includes("cola") || n.includes("tentáculo") || n.includes("tentaculo") || n.includes("puño") || n.includes("embestida") || n.includes("garrote") || n.includes("aplastar")) return "contundente";
  if (n.includes("fuego") || n.includes("flama") || n.includes("llamarada") || n.includes("ígneo") || n.includes("igneo") || n.includes("quemadura")) return "fuego";
  if (n.includes("hielo") || n.includes("escarcha") || n.includes("gélido") || n.includes("gelido") || n.includes("frío") || n.includes("frio") || n.includes("invernal")) return "frío";
  if (n.includes("veneno") || n.includes("ponzoña") || n.includes("tóxico") || n.includes("toxico")) return "veneno";
  if (n.includes("ácido") || n.includes("acido") || n.includes("corrosivo")) return "ácido";
  if (n.includes("rayo") || n.includes("relámpago") || n.includes("relampago") || n.includes("eléctrico") || n.includes("electrico")) return "relámpago";
  if (n.includes("trueno") || n.includes("estruendo") || n.includes("sónico") || n.includes("sonico")) return "trueno";
  if (n.includes("necrótico") || n.includes("necrotico") || n.includes("muerte") || n.includes("drenar")) return "necrótico";
  if (n.includes("radiante") || n.includes("sagrado") || n.includes("solar") || n.includes("luz")) return "radiante";
  if (n.includes("psíquico") || n.includes("psiquico") || n.includes("mente") || n.includes("mental")) return "psíquico";
  return "fuerza";
}

/**
 * Extrae y desglosa los datos de una acción de monstruo para pre-rellenar
 * un ataque rápido de TaleSpire.
 */
export function extraerDatosAtaqueParaAtaqueRapido(
  accion: ParametrosExtraccionAtaque
): DatosAtaqueRapidoExtraidos {
  try {
    const nombreLimpio = (accion.nombre || "").trim() || "Ataque";

    // 1. Bonificador de ataque
    let bonoResultado = "+0";
    const bonoProp = accion.bonificadorAtaque;

    if (bonoProp !== undefined && bonoProp !== null && String(bonoProp).trim() !== "") {
      const bonoNum = parseInt(String(bonoProp).replace(/[^\d-]/g, ""), 10);
      if (!isNaN(bonoNum)) {
        bonoResultado = `${bonoNum >= 0 ? "+" : ""}${bonoNum}`;
      }
    } else if (accion.descripcion) {
      // Buscar en la descripción patrones comunes de D&D: "+5 al ataque", "+5 al impacto", "+5 to hit"
      const matchBonoDesc = accion.descripcion.match(/([+-]\d+)\s*(?:al ataque|al impacto|to hit)/i)
        || accion.descripcion.match(/(?:ataque|impacto|to hit)[^,.:;]*?([+-]\d+)/i)
        || accion.descripcion.match(/\b([+-]\d+)\b/);
      if (matchBonoDesc) {
        const bonoNum = parseInt(matchBonoDesc[1], 10);
        if (!isNaN(bonoNum)) {
          bonoResultado = `${bonoNum >= 0 ? "+" : ""}${bonoNum}`;
        }
      }
    }

    // 2. Extracción de dados y tipo de daño
    const REGEX_DADOS = /\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/gi;
    const textoDano = (accion.daño || "").trim();
    const textoDesc = (accion.descripcion || "").trim();

    // Caso A: Si el campo 'daño' ya viene con separador '/'
    if (textoDano.includes("/")) {
      const partes = textoDano.split("/").map((p) => p.trim()).filter(Boolean);
      const componentesNormalizados: ComponenteDano[] = [];

      for (let i = 0; i < partes.length; i++) {
        const parte = partes[i];
        const matchDado = parte.match(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/i);
        const dadoLimpio = matchDado ? matchDado[1].replace(/\s+/g, "") : parte.replace(/\s+/g, "");
        const tipoLimpio = normalizarTipoDanoTexto(parte)
          || normalizarTipoDanoTexto(textoDesc)
          || (i === 0 ? inferirTipoPorNombreAtaque(nombreLimpio) : "fuerza");

        componentesNormalizados.push({
          dados: dadoLimpio || "1d6",
          tipo: tipoLimpio
        });
      }

      return {
        nombre: nombreLimpio,
        bonificadorAtaque: bonoResultado,
        dadosDaño: componentesNormalizados[0]?.dados || "1d6",
        tipoDaño: componentesNormalizados[0]?.tipo || "fuerza",
        danosAdicionales: componentesNormalizados.slice(1)
      };
    }

    // Caso B: Extraer dados de 'daño' o de 'descripcion'
    const coincidenciasDano: string[] = [];
    let matchD: RegExpExecArray | null;
    while ((matchD = REGEX_DADOS.exec(textoDano)) !== null) {
      coincidenciasDano.push(matchD[1].replace(/\s+/g, ""));
    }

    const componentesExtraidos: ComponenteDano[] = [];

    if (coincidenciasDano.length > 0) {
      const primerDado = coincidenciasDano[0];
      const primerTipo = normalizarTipoDanoTexto(textoDano)
        || normalizarTipoDanoTexto(textoDesc)
        || inferirTipoPorNombreAtaque(nombreLimpio);

      componentesExtraidos.push({ dados: primerDado, tipo: primerTipo });

      // Dados adicionales en el texto del daño
      for (let i = 1; i < coincidenciasDano.length; i++) {
        const dadoExtra = coincidenciasDano[i];
        const subtexto = textoDano.slice(textoDano.indexOf(dadoExtra));
        const tipoExtra = normalizarTipoDanoTexto(subtexto)
          || normalizarTipoDanoTexto(textoDesc)
          || "fuerza";
        componentesExtraidos.push({ dados: dadoExtra, tipo: tipoExtra });
      }

      // Si solo había 1 dado en el daño, comprobar si la descripción añade más daños (ej. veneno)
      if (coincidenciasDano.length === 1 && textoDesc) {
        const todosDadosDesc: Array<{ dados: string; indice: number }> = [];
        REGEX_DADOS.lastIndex = 0;
        let matchDesc: RegExpExecArray | null;
        while ((matchDesc = REGEX_DADOS.exec(textoDesc)) !== null) {
          todosDadosDesc.push({
            dados: matchDesc[1].replace(/\s+/g, ""),
            indice: matchDesc.index
          });
        }

        if (todosDadosDesc.length > 1) {
          for (let j = 1; j < todosDadosDesc.length; j++) {
            const dadoExtra = todosDadosDesc[j];
            const fragmento = textoDesc.slice(dadoExtra.indice, dadoExtra.indice + 60);
            const tipoExtra = normalizarTipoDanoTexto(fragmento) || "fuerza";
            componentesExtraidos.push({ dados: dadoExtra.dados, tipo: tipoExtra });
          }
        }
      }
    } else {
      // Buscar en descripción si 'daño' está vacío
      const todosDadosDesc: Array<{ dados: string; indice: number }> = [];
      REGEX_DADOS.lastIndex = 0;
      let matchDesc: RegExpExecArray | null;
      while ((matchDesc = REGEX_DADOS.exec(textoDesc)) !== null) {
        todosDadosDesc.push({
          dados: matchDesc[1].replace(/\s+/g, ""),
          indice: matchDesc.index
        });
      }

      if (todosDadosDesc.length > 0) {
        for (let k = 0; k < todosDadosDesc.length; k++) {
          const item = todosDadosDesc[k];
          const fragmento = textoDesc.slice(item.indice, item.indice + 60);
          const tipo = normalizarTipoDanoTexto(fragmento)
            || (k === 0 ? normalizarTipoDanoTexto(textoDesc) : null)
            || (k === 0 ? inferirTipoPorNombreAtaque(nombreLimpio) : "fuerza");
          componentesExtraidos.push({ dados: item.dados, tipo });
        }
      } else {
        componentesExtraidos.push({
          dados: "1d6",
          tipo: normalizarTipoDanoTexto(textoDesc) || inferirTipoPorNombreAtaque(nombreLimpio)
        });
      }
    }

    const dadosPrincipal = componentesExtraidos[0]?.dados || "1d6";
    const tipoPrincipal = componentesExtraidos[0]?.tipo || "fuerza";
    const danosAdicionales = componentesExtraidos.slice(1);

    return {
      nombre: nombreLimpio,
      bonificadorAtaque: bonoResultado,
      dadosDaño: dadosPrincipal,
      tipoDaño: tipoPrincipal,
      danosAdicionales
    };
  } catch (error) {
    logger.error("[ProcesadorAtaques] Error al extraer datos de ataque rápido:", error);
    return {
      nombre: (accion.nombre || "").trim() || "Ataque",
      bonificadorAtaque: "+0",
      dadosDaño: "1d6",
      tipoDaño: "fuerza",
      danosAdicionales: []
    };
  }
}
