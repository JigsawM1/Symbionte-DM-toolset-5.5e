import type { DescriptorTirada } from "@/tipos/talespire";

const REGEX_EXPRESION_DADOS = /\b(?:\d+)?d\d+\b/i;
const REGEX_PREFIJO_DADO = /^d\d+/i;
const REGEX_SOLO_MODIFICADOR = /^[+-]?\d+$/;
const REGEX_ROLL20_KEEP = /\b2d20k[hl]1\b/gi;
const REGEX_CARACTERES_NO_DADOS = /[^d0-9+\-*/()]/g;
const REGEX_ETIQUETA_GRUPO = /^!?(.+):([^:]+)$/;
const REGEX_ETIQUETA_DESCRIPTOR = /^(.+):([^:]+)$/;
const REGEX_GRUPO_COMPUESTO = /([^:+]+):([0-9d+\-*/()]+)/g;

/** Tabla ordenada de correspondencias para detectar tipos de daño en español e inglés. */
const REGLAS_TIPO_DANO: ReadonlyArray<readonly [ReadonlyArray<string>, string]> = [
  [["cortante"], "Cortante"],
  [["perforante"], "Perforante"],
  [["contundente"], "Contundente"],
  [["fuego"], "Fuego"],
  [["frío", "frio"], "Frío"],
  [["veneno"], "Veneno"],
  [["ácido", "acido"], "Ácido"],
  [["psíquico", "psiquico"], "Psíquico"],
  [["necrótico", "necrotico"], "Necrótico"],
  [["radiante"], "Radiante"],
  [["relámpago", "relampago", "rayo"], "Relámpago"],
  [["trueno"], "Trueno"],
  [["fuerza"], "Fuerza"],
  [["slashing"], "Cortante"],
  [["piercing"], "Perforante"],
  [["bludgeoning"], "Contundente"],
  [["fire"], "Fuego"],
  [["cold"], "Frío"],
  [["poison"], "Veneno"],
  [["acid"], "Ácido"],
  [["psychic"], "Psíquico"],
  [["necrotic"], "Necrótico"],
  [["radiant"], "Radiante"],
  [["lightning"], "Relámpago"],
  [["thunder"], "Trueno"],
  [["force"], "Fuerza"]
];

/**
 * Sanitiza una etiqueta para remover acentos, eñes y caracteres no ASCII
 * que no son soportados correctamente por la interfaz 3D o el chat de TaleSpire.
 */
export function sanitizarEtiqueta(etiqueta: string): string {
  if (!etiqueta) return "";
  return etiqueta
    .replace(/[áäâà]/gi, "a")
    .replace(/[éëêè]/gi, "e")
    .replace(/[íïîì]/gi, "i")
    .replace(/[óöôò]/gi, "o")
    .replace(/[úüûù]/gi, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[Ñ]/g, "N")
    .replace(/[^a-zA-Z0-9\s()+-]/g, "")
    .trim();
}

/**
 * Determina si una cadena contiene al menos una expresión de dados estándar D&D (ej: 1d20, d20, 2d6, 3d8+4, 1d4).
 */
export function contieneExpresionDados(cadena: string): boolean {
  return Boolean(cadena && REGEX_EXPRESION_DADOS.test(cadena));
}

/**
 * Limpia y normaliza una fórmula de dados simple (sin etiquetas).
 */
export function limpiarYNormalizarDadosSimples(formulaSimple: string): string {
  let limpia = (formulaSimple || "").replace(/\s+/g, "").toLowerCase();
  if (!limpia) return "1d20";

  if (REGEX_PREFIJO_DADO.test(limpia)) {
    limpia = "1" + limpia;
  }

  if (REGEX_SOLO_MODIFICADOR.test(limpia)) {
    const signo = limpia.startsWith("-") || limpia.startsWith("+") ? "" : "+";
    limpia = `1d20${signo}${limpia}`;
  }

  limpia = limpia.replace(REGEX_ROLL20_KEEP, "1d20").replace(REGEX_CARACTERES_NO_DADOS, "");
  return REGEX_EXPRESION_DADOS.test(limpia) ? limpia || "1d20" : "1d20";
}

/**
 * Normaliza y limpia una fórmula de dados para asegurar la compatibilidad con TaleSpire.
 * Soporta la sintaxis de etiquetas oficial de TaleSpire (ej. "Ataque:1d20+5/Dano:2d6+3").
 */
export function normalizarFormulaDados(formula: string): string {
  if (!formula) return "1d20";

  return formula
    .split("/")
    .map((grupo) => {
      const trimmedGrupo = grupo.trim();
      const matchEtiqueta = trimmedGrupo.match(REGEX_ETIQUETA_GRUPO);
      if (matchEtiqueta) {
        return `${sanitizarEtiqueta(matchEtiqueta[1].trim())}:${limpiarYNormalizarDadosSimples(matchEtiqueta[2].trim())}`;
      }
      return limpiarYNormalizarDadosSimples(trimmedGrupo);
    })
    .join("/");
}

/**
 * Construye descriptores de dados manualmente a partir de una fórmula
 * cuando la API de TaleSpire no expone o retorna vacío en `makeRollDescriptors`.
 */
export function crearDescriptoresManualmente(formula: string): DescriptorTirada[] {
  if (!formula) return [{ name: "Tirada", roll: "1d20" }];

  const formulaLimpia = formula.replace(/!/g, "");
  const partes = formulaLimpia.split("/");

  if (partes.length === 1) {
    if (!formulaLimpia.includes(":")) {
      return [{ name: "Tirada", roll: formulaLimpia }];
    }

    REGEX_GRUPO_COMPUESTO.lastIndex = 0;
    const descriptores: DescriptorTirada[] = [];
    let match: RegExpExecArray | null;
    while ((match = REGEX_GRUPO_COMPUESTO.exec(formulaLimpia)) !== null) {
      descriptores.push({ name: match[1].trim(), roll: match[2].trim() });
    }
    return descriptores.length > 0 ? descriptores : [{ name: "Tirada", roll: formulaLimpia }];
  }

  return partes.map((parte) => {
    const match = parte.trim().match(REGEX_ETIQUETA_DESCRIPTOR);
    return match
      ? { name: match[1].trim(), roll: match[2].trim() }
      : { name: "Tirada", roll: parte.trim() };
  });
}

/**
 * Detecta el tipo de daño en base a un texto descriptivo en español o inglés.
 */
export function detectarTipoDaño(descripcion: string, valorPredeterminado: string = "Daño"): string {
  if (!descripcion) return valorPredeterminado;
  const desc = descripcion.toLowerCase();

  for (const [palabrasClave, tipoCanonico] of REGLAS_TIPO_DANO) {
    if (palabrasClave.some((palabra) => desc.includes(palabra))) {
      return tipoCanonico;
    }
  }
  return valorPredeterminado;
}
