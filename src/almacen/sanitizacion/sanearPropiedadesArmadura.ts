import type { ObjetoBase, Armadura, Escudo, EquipoAventuras, TipoBonoDestreza } from "@/tipos";
import type { CategoriaEquipo } from "@/constantes/categoriasEquipoConstantes";
import { aplanarValor } from "./comun";

/** Estrategia pura: Sanitización de armaduras (CA, bonos de destreza, fuerza mínima y sigilo) */
export function sanearPropiedadesArmadura(
  baseObjeto: ObjetoBase,
  obj: Record<string, unknown>,
  propiedadesSaneadas?: string | string[]
): Armadura {
  let subArmor = "Ligera";
  let subTxt = aplanarValor(obj.subcategoria || obj.armor_category || "").toUpperCase();

  if (Array.isArray(obj.equipment_categories)) {
    const catsTxt = obj.equipment_categories
      .map((c: unknown) => {
        if (c && typeof c === "object") {
          const cObj = c as Record<string, unknown>;
          return aplanarValor(cObj.index || cObj.name || "").toUpperCase();
        }
        return aplanarValor(c).toUpperCase();
      })
      .join(" | ");
    subTxt = subTxt ? `${subTxt} | ${catsTxt}` : catsTxt;
  }

  if (subTxt.includes("PESADA") || subTxt.includes("HEAVY")) subArmor = "Pesada";
  else if (subTxt.includes("MEDIANA") || subTxt.includes("MEDIUM")) subArmor = "Mediana";

  let caBaseSaneada = 10;
  let dexBonus = true;
  let maxBonus: number | undefined = undefined;

  if (obj.armor_class && typeof obj.armor_class === "object") {
    const acObj = obj.armor_class as Record<string, unknown>;
    caBaseSaneada = Number(acObj.base) || 10;
    dexBonus = acObj.dex_bonus !== undefined ? !!acObj.dex_bonus : true;
    maxBonus = acObj.max_bonus !== undefined && acObj.max_bonus !== null ? Number(acObj.max_bonus) : undefined;
  } else {
    caBaseSaneada = Number(obj.caBase || obj.ca || 10) || 10;
  }

  let reqFuerza = obj.str_minimum !== undefined ? (Number(obj.str_minimum) || undefined) : undefined;
  if (reqFuerza === undefined) {
    reqFuerza = obj.requisitoFuerza !== undefined ? (Number(obj.requisitoFuerza) || undefined) : undefined;
  }
  if (reqFuerza !== undefined && reqFuerza <= 0) {
    reqFuerza = undefined;
  }

  const desSigilo = !!(obj.stealth_disadvantage !== undefined ? obj.stealth_disadvantage : (obj.desventajaSigilo || obj.desvSigilo));

  let bonoDest: TipoBonoDestreza = "Completo";
  if (obj.armor_class && typeof obj.armor_class === "object") {
    if (!dexBonus) {
      bonoDest = "Sin Bono";
    } else if (maxBonus === 2) {
      bonoDest = "Máximo 2";
    } else {
      bonoDest = "Completo";
    }
  } else if (obj.bonoDestreza !== undefined) {
    const bdTxt = aplanarValor(obj.bonoDestreza);
    if (["Completo", "Máximo 2", "Sin Bono"].includes(bdTxt)) {
      bonoDest = bdTxt as TipoBonoDestreza;
    }
  } else {
    if (subArmor === "Mediana") bonoDest = "Máximo 2";
    else if (subArmor === "Pesada") bonoDest = "Sin Bono";
  }

  let tiempoEquiparSaneado = obj.tiempoEquipar !== undefined
    ? (typeof obj.tiempoEquipar === "number" ? obj.tiempoEquipar : aplanarValor(obj.tiempoEquipar))
    : undefined;
  if (!tiempoEquiparSaneado && obj.don_time) {
    tiempoEquiparSaneado = aplanarValor(obj.don_time);
    if (obj.doff_time) {
      tiempoEquiparSaneado += ` (Quitar: ${aplanarValor(obj.doff_time)})`;
    }
  }

  return {
    ...baseObjeto,
    propiedades: propiedadesSaneadas,
    categoria: "armaduras",
    subcategoria: subArmor,
    caBase: caBaseSaneada,
    requisitoFuerza: reqFuerza,
    desventajaSigilo: desSigilo,
    bonoDestreza: bonoDest,
    tiempoEquipar: tiempoEquiparSaneado
  } as Armadura;
}

/** Estrategia pura: Sanitización de escudos (CA escudo y sigilo) */
export function sanearPropiedadesEscudo(
  baseObjeto: ObjetoBase,
  obj: Record<string, unknown>,
  propiedadesSaneadas?: string | string[]
): Escudo {
  let caEscudo = 2;
  if (obj.armor_class && typeof obj.armor_class === "object") {
    const acObj = obj.armor_class as Record<string, unknown>;
    caEscudo = Number(acObj.base) || 2;
  } else if (obj.caBase || obj.ca) {
    caEscudo = Number(obj.caBase || obj.ca) || 2;
  }
  const desSigilo = !!(obj.stealth_disadvantage !== undefined ? obj.stealth_disadvantage : (obj.desventajaSigilo || obj.desvSigilo));
  const subEscudo = aplanarValor(obj.subcategoria || "") || "Escudo";

  return {
    ...baseObjeto,
    propiedades: propiedadesSaneadas,
    categoria: "escudos",
    subcategoria: subEscudo,
    caBase: caEscudo,
    desventajaSigilo: desSigilo,
    equipable: true
  } as Escudo;
}

/** Estrategia pura: Sanitización de equipo de aventuras, contenedores y consumibles */
export function sanearPropiedadesEquipoAventuras(
  baseObjeto: ObjetoBase,
  obj: Record<string, unknown>,
  categoriaSaneada: CategoriaEquipo,
  propiedadesSaneadas?: string | string[]
): EquipoAventuras {
  const cant = obj.cantidad !== undefined ? (Number(obj.cantidad) || undefined) : undefined;

  return {
    ...baseObjeto,
    propiedades: propiedadesSaneadas,
    categoria: categoriaSaneada,
    cantidad: cant
  } as EquipoAventuras;
}
