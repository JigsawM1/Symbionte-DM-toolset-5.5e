import type { ObjetoBase, Arma } from "@/tipos";
import { aplanarValor } from "./comun";

/** Estrategia pura: Sanitización de armas (cuerpo a cuerpo, distancia, daño, maestría y propiedades) */
export function sanearPropiedadesArma(baseObjeto: ObjetoBase, obj: Record<string, unknown>): Arma {
  let subArma = "Sencilla";
  let subTxt = aplanarValor(obj.subcategoria || obj.weapon_category || obj.tipoArma || "").toUpperCase();

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

  if (subTxt.includes("FUEGO") || subTxt.includes("FIREARM") || subTxt.includes("FIRE")) subArma = "De Fuego";
  else if (subTxt.includes("MARCIAL") || subTxt.includes("MARTIAL")) subArma = "Marcial";

  let estiloAtq: "Cuerpo a Cuerpo" | "A Distancia" = "Cuerpo a Cuerpo";
  let estiloInferido = false;
  if (Array.isArray(obj.equipment_categories)) {
    const catTxt = obj.equipment_categories.map((c: unknown) => {
      if (c && typeof c === "object") {
        const cObj = c as Record<string, unknown>;
        return aplanarValor(cObj.index || cObj.name || "").toUpperCase();
      }
      return aplanarValor(c).toUpperCase();
    }).join(" | ");
    if (catTxt.includes("DISTANCIA") || catTxt.includes("RANGED")) {
      estiloAtq = "A Distancia";
      estiloInferido = true;
    } else if (catTxt.includes("MELEE") || catTxt.includes("CUERPO")) {
      estiloAtq = "Cuerpo a Cuerpo";
      estiloInferido = true;
    }
  }
  if (!estiloInferido) {
    const estiloTxt = aplanarValor(obj.tipoAtaque || obj.weapon_range || obj.estiloAtaque || "").toUpperCase();
    if (estiloTxt.includes("DISTANCIA") || estiloTxt.includes("RANGED")) {
      estiloAtq = "A Distancia";
    }
  }

  let dadoDanoSaneado = "1d4";
  let tipoDanoSaneado = "Cortante";

  const DAÑO_TRADUCCION: Record<string, string> = {
    "piercing": "perforante", "perforante": "perforante",
    "slashing": "cortante", "cortante": "cortante",
    "bludgeoning": "contundente", "contundente": "contundente",
    "fire": "fuego", "fuego": "fuego",
    "cold": "frío", "frío": "frío", "frio": "frío",
    "lightning": "relámpago", "relámpago": "relámpago", "relampago": "relámpago",
    "acid": "ácido", "ácido": "ácido", "acido": "ácido",
    "poison": "veneno", "veneno": "veneno",
    "necrotic": "necrótico", "necrótico": "necrótico", "necrotico": "necrótico",
    "radiant": "radiante", "radiante": "radiante",
    "thunder": "trueno", "trueno": "trueno",
    "force": "fuerza", "fuerza": "fuerza",
    "psychic": "psíquico", "psíquico": "psíquico", "psiquico": "psíquico"
  };

  if (obj.damage && typeof obj.damage === "object") {
    const dmgObj = obj.damage as Record<string, unknown>;
    dadoDanoSaneado = aplanarValor(dmgObj.damage_dice || "") || "1d4";
    if (dmgObj.damage_type && typeof dmgObj.damage_type === "object") {
      const dtObj = dmgObj.damage_type as Record<string, unknown>;
      const rawTipo = aplanarValor(dtObj.name || dtObj.index || "").toLowerCase();
      tipoDanoSaneado = DAÑO_TRADUCCION[rawTipo] || aplanarValor(dtObj.name || dtObj.index || "Cortante");
    }
  } else {
    dadoDanoSaneado = aplanarValor(obj.dadoDano || obj.dadosDaño || "1d4") || "1d4";
    const rawTipo = aplanarValor(obj.tipoDano || obj.tipoDaño || "Cortante").toLowerCase();
    tipoDanoSaneado = DAÑO_TRADUCCION[rawTipo] || aplanarValor(obj.tipoDano || obj.tipoDaño || "Cortante");
  }

  let propsArma: string[] = [];
  const rawProps = obj.properties || obj.propiedadesArma || obj.propiedades;

  const PROP_TRADUCCION: Record<string, string> = {
    "finesse": "Sutil", "sutil": "Sutil",
    "versatile": "Versátil", "versátil": "Versátil",
    "heavy": "Pesada", "pesado": "Pesada", "pesada": "Pesada",
    "light": "Ligera", "ligero": "Ligera", "ligera": "Ligera",
    "loading": "Recarga", "recarga": "Recarga",
    "range": "A distancia", "a distancia": "A distancia",
    "reach": "Alcance", "alcance": "Alcance",
    "thrown": "Arrojadiza", "arrojadizo": "Arrojadiza", "arrojadiza": "Arrojadiza",
    "two-handed": "A dos manos", "a dos manos": "A dos manos",
    "silvered": "Plateada", "plateado": "Plateada", "plateada": "Plateada",
    "special": "Especial", "especial": "Especial",
    "ammunition": "Munición", "munición": "Munición",
    "attunement": "Sintonización", "sintonización": "Sintonización", "sintonizacion": "Sintonización",
    "nick": "Mellar", "mellar": "Mellar",
    "push": "Empujar", "empujar": "Empujar",
    "slow": "Ralentizar", "ralentizar": "Ralentizar",
    "graze": "Rozar", "rozar": "Rozar",
    "cleave": "Hender", "hender": "Hender",
    "topple": "Derribar", "derribar": "Derribar",
    "vex": "Molestar", "molestar": "Molestar",
    "sap": "Debilitar", "debilita": "Debilitar"
  };

  if (Array.isArray(rawProps)) {
    propsArma = rawProps.map((p) => {
      if (p && typeof p === "object") {
        const pObj = p as Record<string, unknown>;
        const rawName = aplanarValor(pObj.name || pObj.nombre || pObj.index || "");
        const key = rawName.toLowerCase().trim();
        return PROP_TRADUCCION[key] || rawName;
      }
      const rawName = aplanarValor(p);
      const key = rawName.toLowerCase().trim();
      return PROP_TRADUCCION[key] || rawName;
    }).filter(Boolean);
  } else if (typeof rawProps === "string" && rawProps) {
    propsArma = rawProps.split(",").map(p => {
      const rawName = p.trim();
      const key = rawName.toLowerCase();
      return PROP_TRADUCCION[key] || rawName;
    }).filter(Boolean);
  }

  const rawMaestria = aplanarValor(
    (obj.mastery && typeof obj.mastery === "object"
      ? (obj.mastery as Record<string,unknown>).name || (obj.mastery as Record<string,unknown>).index
      : obj.mastery) || obj.maestria || ""
  ).toLowerCase().trim();

  const MAESTRIA_MAP: Record<string, string> = {
    "cleave": "Cleave (Hender)", "tajo": "Cleave (Hender)", "hender": "Cleave (Hender)", "cleave (hender)": "Cleave (Hender)",
    "graze": "Graze (Rozar)", "rozar": "Graze (Rozar)", "roce": "Graze (Rozar)", "graze (rozar)": "Graze (Rozar)",
    "nick": "Nick (Mellar)", "corte": "Nick (Mellar)", "golpe rápido": "Nick (Mellar)", "muesca": "Nick (Mellar)", "nick (corte)": "Nick (Mellar)",
    "push": "Push (Empujar)", "empujar": "Push (Empujar)", "empuje": "Push (Empujar)", "push (empujar)": "Push (Empujar)",
    "sap": "Sap (Debilitar)", "debilitar": "Sap (Debilitar)", "menoscabo": "Sap (Debilitar)", "sap (debilitar)": "Sap (Debilitar)",
    "slow": "Slow (Ralentizar)", "ralentizar": "Slow (Ralentizar)", "lentitud": "Slow (Ralentizar)", "lento": "Slow (Ralentizar)", "slow (ralentizar)": "Slow (Ralentizar)",
    "topple": "Topple (Derribar)", "derribar": "Topple (Derribar)", "derribo": "Topple (Derribar)", "topple (derribar)": "Topple (Derribar)",
    "vex": "Vex (Molestar)", "irritar": "Vex (Molestar)", "acoso": "Vex (Molestar)", "vejar": "Vex (Molestar)", "vex (irritar)": "Vex (Molestar)", "vex (molestar)": "Vex (Molestar)", "molestar": "Vex (Molestar)"
  };

  const maestriaSaneada = MAESTRIA_MAP[rawMaestria] || "Ninguna";

  let alcNormal: number | undefined = undefined;
  let alcLargo: number | undefined = undefined;

  if (obj.throw_range && typeof obj.throw_range === "object") {
    const tr = obj.throw_range as Record<string, unknown>;
    alcNormal = Number(tr.normal) || undefined;
    alcLargo = Number(tr.long) || undefined;
  } else if (obj.range && typeof obj.range === "object") {
    const r = obj.range as Record<string, unknown>;
    alcNormal = Number(r.normal) || undefined;
    alcLargo = Number(r.long) || undefined;
  }

  if (alcNormal === undefined) {
    alcNormal = obj.alcanceNormal !== undefined ? (Number(obj.alcanceNormal) || undefined) : undefined;
  }
  if (alcLargo === undefined) {
    alcLargo = obj.alcanceLargo !== undefined ? (Number(obj.alcanceLargo) || undefined) : undefined;
  }

  if (alcNormal === undefined && obj.alcance !== undefined) {
    const alcTxt = aplanarValor(obj.alcance);
    const matchAlc = alcTxt.match(/(\d+)\/(\d+)/);
    if (matchAlc) {
      alcNormal = parseInt(matchAlc[1]);
      alcLargo = parseInt(matchAlc[2]);
    } else {
      const matchSingle = alcTxt.match(/(\d+)/);
      if (matchSingle) alcNormal = parseInt(matchSingle[1]);
    }
  }

  let danoVersatilSaneado = obj.danoVersatil !== undefined ? aplanarValor(obj.danoVersatil) : undefined;
  if (!danoVersatilSaneado && obj.two_handed_damage && typeof obj.two_handed_damage === "object") {
    const thObj = obj.two_handed_damage as Record<string, unknown>;
    const thDice = aplanarValor(thObj.damage_dice || "");
    let thType = "";
    if (thObj.damage_type && typeof thObj.damage_type === "object") {
      const thtObj = thObj.damage_type as Record<string, unknown>;
      const rawType = aplanarValor(thtObj.name || thtObj.index || "").toLowerCase();
      thType = DAÑO_TRADUCCION[rawType] || aplanarValor(thtObj.name || thtObj.index || "");
    }
    if (thDice) {
      danoVersatilSaneado = `${thDice}${thType ? ` (${thType})` : ""}`;
    }
  }
  const municionRequeridaSaneada = propsArma.some(p => p.toLowerCase().includes("munición") || p.toLowerCase().includes("ammunition"));

  return {
    ...baseObjeto,
    categoria: "armas",
    subcategoria: subArma,
    tipoAtaque: estiloAtq,
    dadoDano: dadoDanoSaneado,
    tipoDano: tipoDanoSaneado,
    propiedades: propsArma,
    maestria: maestriaSaneada,
    alcanceNormal: alcNormal,
    alcanceLargo: alcLargo,
    danoVersatil: danoVersatilSaneado,
    municionRequerida: municionRequeridaSaneada
  } as Arma;
}
