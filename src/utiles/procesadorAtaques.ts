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
  tipoDaño: string
): string {
  try {
    const nombreSaneado = sanitizarEtiqueta(ataqueNombre || "Ataque");
    const bonoNum = parseInt(String(bonoAtaqueStr || "").replace(/[^\d-]/g, ""), 10) || 0;
    const bonoFormateado = `${bonoNum >= 0 ? "+" : ""}${bonoNum}`;
    const grupoAtaque = `!Ataque ${nombreSaneado}:1d20${bonoFormateado}`;

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
