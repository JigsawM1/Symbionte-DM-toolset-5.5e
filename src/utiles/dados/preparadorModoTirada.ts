import { normalizarFormulaDados, sanitizarEtiqueta } from "./normalizadorFormulasDados";
import type {
  MetadataTiradaEspecial,
  ModoTiradaD20,
  ResultadoPreparacionFormula
} from "./tiposDados";

/** Patrón para detectar dados no-d20 adicionales en una fórmula (ej. +1d8 de Bendición o Iniciativa). */
const PATRON_DADOS_EXTRA = /[+-](?:\d+)?d(?!20\b)\d+/gi;
const REGEX_ETIQUETA_GRUPO = /^!?(.+):([^:]+)$/;
const REGEX_SUFIJO_MODO = /\s*\((?:ventaja|desventaja)\)\s*/gi;
const REGEX_D20 = /\b1?d20\b/i;

function combinarNombreGrupoConEtiqueta(nombreBase: string, etiquetaEnFormula: string): string {
  if (nombreBase.toLowerCase() === "tirada" || !nombreBase) {
    return etiquetaEnFormula;
  }
  if (!etiquetaEnFormula) {
    return nombreBase;
  }
  const lowerFormula = etiquetaEnFormula.toLowerCase();
  const lowerBase = nombreBase.toLowerCase();
  if (lowerFormula.includes(lowerBase)) {
    return etiquetaEnFormula;
  }
  if (!lowerBase.includes(lowerFormula) && lowerFormula !== "ataque" && lowerFormula !== "tirada") {
    return `${nombreBase} - ${etiquetaEnFormula}`;
  }
  return nombreBase;
}

/**
 * Resuelve el modo efectivo de una tirada d20 aplicando la regla D&D 5.5e (2024):
 * la presencia simultánea de ventaja y desventaja se anula a tirada plana, y el modo
 * forzado a `"plano"` prevalece sobre el selector global.
 */
export function resolverModoTiradaEfectivo(
  tipoTiradaGlobal: ModoTiradaD20,
  tipoTiradaForzado?: ModoTiradaD20
): ModoTiradaD20 {
  const tieneVentaja =
    tipoTiradaForzado !== "plano" &&
    (tipoTiradaGlobal === "ventaja" || tipoTiradaForzado === "ventaja");
  const tieneDesventaja =
    tipoTiradaForzado !== "plano" &&
    (tipoTiradaGlobal === "desventaja" || tipoTiradaForzado === "desventaja");

  if (tieneVentaja === tieneDesventaja) return "plano";
  return tieneVentaja ? "ventaja" : "desventaja";
}

function prepararFormulaConVentajaDesventaja(
  formula: string,
  etiqueta: string,
  nombreEtiquetaBase: string,
  tipoTirada: "ventaja" | "desventaja"
): { formulaProcesada: string; tiradaEspecial: MetadataTiradaEspecial | null } {
  const sufijoTipo = tipoTirada === "ventaja" ? "Ventaja" : "Desventaja";
  const grupos = formula.split("/");
  let d20Encontrado = false;
  let tiradaEspecial: MetadataTiradaEspecial | null = null;

  const gruposProcesados = grupos.map((grupo) => {
    const matchEtiqueta = grupo.match(REGEX_ETIQUETA_GRUPO);
    let formulaDados = grupo.trim();
    let nombreBaseGrupo = nombreEtiquetaBase;

    if (matchEtiqueta) {
      const etiquetaEnFormula = sanitizarEtiqueta(matchEtiqueta[1].trim().replace(REGEX_SUFIJO_MODO, ""));
      formulaDados = matchEtiqueta[2].trim();
      nombreBaseGrupo = combinarNombreGrupoConEtiqueta(nombreBaseGrupo, etiquetaEnFormula);
    }

    if (REGEX_D20.test(formulaDados)) {
      d20Encontrado = true;
      const grupoAName = `${nombreBaseGrupo} (${sufijoTipo} 1)`;
      const grupoBName = `${nombreBaseGrupo} (${sufijoTipo} 2)`;
      const dadosExtra = formulaDados.match(PATRON_DADOS_EXTRA)?.join("") ?? "";
      const formulaD20 = formulaDados.replace(PATRON_DADOS_EXTRA, "");
      const grupoBonificacionName = dadosExtra ? `${nombreBaseGrupo} (Dados adicionales)` : undefined;

      tiradaEspecial = {
        tipo: tipoTirada,
        etiquetaOriginal: etiqueta || nombreBaseGrupo,
        nombreGrupoOriginal: nombreBaseGrupo,
        grupoAName,
        grupoBName,
        grupoBonificacionName
      };

      return (
        `${grupoAName}:${formulaD20}/${grupoBName}:${formulaD20}` +
        (grupoBonificacionName ? `/${grupoBonificacionName}:${dadosExtra.replace(/^\+/, "")}` : "")
      );
    }
    return grupo;
  });

  return {
    formulaProcesada: d20Encontrado ? gruposProcesados.join("/") : formula,
    tiradaEspecial: d20Encontrado ? tiradaEspecial : null
  };
}

function prepararFormulaPlana(formula: string, nombreEtiquetaBase: string): string {
  const grupos = formula.split("/");
  let d20Modificado = false;
  const gruposProcesados = grupos.map((grupo) => {
    if (d20Modificado) return grupo;
    const matchEtiqueta = grupo.match(REGEX_ETIQUETA_GRUPO);
    let formulaDados = grupo.trim();
    let nombreBase = nombreEtiquetaBase;

    if (matchEtiqueta) {
      formulaDados = matchEtiqueta[2].trim();
      nombreBase = combinarNombreGrupoConEtiqueta(nombreBase, sanitizarEtiqueta(matchEtiqueta[1].trim()));
    }

    if (REGEX_D20.test(formulaDados) && nombreBase && nombreBase.toLowerCase() !== "tirada") {
      d20Modificado = true;
      return `${nombreBase}:${formulaDados}`;
    }
    return grupo;
  });

  if (d20Modificado) return gruposProcesados.join("/");
  if (!formula.includes(":") && nombreEtiquetaBase && nombreEtiquetaBase.toLowerCase() !== "tirada") {
    return `${nombreEtiquetaBase}:${formula.trim()}`;
  }
  return formula;
}

/**
 * Prepara la fórmula y los metadatos de ventaja/desventaja antes de enviar la tirada a TaleSpire.
 * Separa dados adicionales no-d20 en un grupo independiente para comparar únicamente los d20.
 */
export function prepararFormulaSegunModoTirada(
  formula: string,
  etiqueta: string,
  tipoTirada: ModoTiradaD20
): ResultadoPreparacionFormula {
  const nombreEtiqueta = sanitizarEtiqueta(etiqueta.trim() || "Tirada");
  const etiquetaLimpiaParam = etiqueta ? etiqueta.replace(/:\s*/g, " - ").trim() : "";
  const etiquetaSinSufijoTipo = etiquetaLimpiaParam.replace(REGEX_SUFIJO_MODO, "").trim();
  const nombreEtiquetaBase = sanitizarEtiqueta(etiquetaSinSufijoTipo) || "Tirada";

  const { formulaProcesada, tiradaEspecial } =
    tipoTirada === "plano"
      ? { formulaProcesada: prepararFormulaPlana(formula, nombreEtiquetaBase), tiradaEspecial: null }
      : prepararFormulaConVentajaDesventaja(formula, etiqueta, nombreEtiquetaBase, tipoTirada);

  return {
    formulaProcesada,
    formulaLimpia: normalizarFormulaDados(formulaProcesada),
    nombreEtiqueta,
    tiradaEspecial
  };
}

/**
 * Extrae el valor entero directo de una fórmula sin expresión de dados (ej. "Preservar vida:15").
 */
export function extraerValorNumericoDirecto(formula: string): number {
  const partes = formula.split(":");
  const parteNumerica = partes.length > 1 ? partes[1] : formula;
  return parseInt(parteNumerica.replace(/[^0-9]/g, ""), 10) || 0;
}
