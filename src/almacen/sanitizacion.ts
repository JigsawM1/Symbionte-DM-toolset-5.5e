import { HechizoBase, ObjetoHomebrew, Rareza, Arma, Armadura, EquipoAventuras, TipoBonoDestreza, SubcategoriaEquipo } from '../tipos';

// Función auxiliar robusta para aplanar de forma segura cualquier estructura a string (previene error #31 de React)
export function aplanarValor(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map(aplanarValor).filter(Boolean).join("\n");
    }
    const valObj = val as Record<string, unknown>;
    if (valObj.nombre !== undefined) return aplanarValor(valObj.nombre);
    if (valObj.name !== undefined) return aplanarValor(valObj.name);
    if (valObj.index !== undefined) return aplanarValor(valObj.index);
    const keys = Object.keys(valObj);
    if (keys.length > 0) {
      for (const k of keys) {
        if (typeof valObj[k] === "string") return (valObj[k] as string).trim();
      }
      return aplanarValor(valObj[keys[0]]);
    }
  }
  return "";
}

export function sanearObjetoHomebrew(o: unknown): ObjetoHomebrew {
  if (!o || typeof o !== "object") {
    return {
      id: `o_${Date.now()}_${Math.random()}`,
      nombre: "Objeto Desconocido",
      descripcion: "Sin descripción disponible.",
      pesoLb: 0,
      valorPO: 0,
      rareza: "Común",
      esMagico: false,
      tipoPrincipal: "Equipo de Aventuras",
      subcategoria: "Maravilloso"
    };
  }
  
  const obj = o as Record<string, unknown>;
  const idSaneado = aplanarValor(obj.id || obj.index || `o_${Date.now()}_${Math.random()}`).trim();
  const nombreSaneado = aplanarValor(obj.nombre || obj.name || "Objeto Desconocido");
  
  // Procesar descripción — puede ser string o array de strings (como en adamantine-chain-mail)
  // IMPORTANTE: usar el primer campo que exista (con su tipo real), no un || que puede elegir
  // un string aunque haya un array en otro campo.
  const descField = obj.descripcion !== undefined ? obj.descripcion
                  : obj.description !== undefined ? obj.description
                  : obj.desc;
  let descSaneada: string;
  if (Array.isArray(descField)) {
    descSaneada = descField.map(aplanarValor).filter(Boolean).join("\n");
  } else {
    descSaneada = aplanarValor(descField || "Sin descripción disponible.");
  }
  
  // Extraer Rareza limpia (procesando objeto rarity si existe)
  let rarezaSaneada: Rareza = "Común";
  let rarezaTxt = "";
  if (obj.rarity && typeof obj.rarity === "object") {
    const rObj = obj.rarity as Record<string, unknown>;
    rarezaTxt = aplanarValor(rObj.name || rObj.index || "Común");
  } else {
    rarezaTxt = aplanarValor(obj.rareza || obj.rarity || "Común");
  }
  rarezaTxt = rarezaTxt.trim();

  if (["Común", "Poco Común", "Raro", "Muy Raro", "Legendario", "Artefacto"].includes(rarezaTxt)) {
    rarezaSaneada = rarezaTxt as Rareza;
  } else {
    // Intentar mapear inglés
    const rarezaLower = rarezaTxt.toLowerCase();
    if (rarezaLower.includes("common")) {
      rarezaSaneada = rarezaLower.includes("uncommon") ? "Poco Común" : "Común";
    } else if (rarezaLower.includes("rare")) {
      rarezaSaneada = rarezaLower.includes("very rare") ? "Muy Raro" : "Raro";
    } else if (rarezaLower.includes("legend")) {
      rarezaSaneada = "Legendario";
    } else if (rarezaLower.includes("artifact")) {
      rarezaSaneada = "Artefacto";
    } else if (rarezaLower === "uncommon") {
      rarezaSaneada = "Poco Común";
    } else if (rarezaLower === "very_rare") {
      rarezaSaneada = "Muy Raro";
    }
  }

  // Auto-esMágico si rareza !== 'Común'
  const esMagicoSaneado = rarezaSaneada !== "Común" ? true : !!(obj.esMagico || obj.isMagic);

  // Parsear Peso (Lb) - admitiendo obj.weight
  let pesoSaneado = 0;
  if (obj.pesoLb !== undefined) {
    pesoSaneado = Number(obj.pesoLb) || 0;
  } else if (obj.weight !== undefined) {
    pesoSaneado = Number(obj.weight) || 0;
  } else if (obj.peso !== undefined) {
    const pesoTxt = aplanarValor(obj.peso);
    const MatchNum = pesoTxt.match(/(\d+(?:\.\d+)?)/);
    pesoSaneado = MatchNum ? parseFloat(MatchNum[1]) : 0;
  }

  // Parsear Costo/Valor (PO) - procesando el objeto cost: { quantity, unit } de equipment-es.json
  let valorSaneado = 0;
  if (obj.valorPO !== undefined) {
    valorSaneado = Number(obj.valorPO) || 0;
  } else if (obj.cost && typeof obj.cost === "object" && obj.cost !== null) {
    const costObj = obj.cost as Record<string, unknown>;
    const cantidad = Number(costObj.quantity) || 0;
    const unidad = aplanarValor(costObj.unit || "gp").toLowerCase().trim();
    if (unidad === "cp" || unidad === "pc") valorSaneado = cantidad / 100;
    else if (unidad === "sp" || unidad === "pp") valorSaneado = cantidad / 10;
    else if (unidad === "ep" || unidad === "pe") valorSaneado = cantidad / 2;
    else if (unidad === "gp" || unidad === "po") valorSaneado = cantidad;
    else if (unidad === "pp" || unidad === "ppt") valorSaneado = cantidad * 10;
    else valorSaneado = cantidad;
  } else if (obj.costoValor !== undefined) {
    valorSaneado = Number(obj.costoValor) || 0;
    // Si la unidad era de cobre, plata, etc., normalizar a PO
    const costoUnidad = aplanarValor(obj.costoUnidad || "PO").toUpperCase();
    if (costoUnidad === "PC") valorSaneado = valorSaneado / 100;
    else if (costoUnidad === "PP") valorSaneado = valorSaneado / 10;
    else if (costoUnidad === "PE") valorSaneado = valorSaneado / 2;
    else if (costoUnidad === "PPT") valorSaneado = valorSaneado * 10;
  }

  // Extraer bonos mágicos dinámicos antiguos si existen
  let bonosMagicosSaneados: { categoria: string; bono: string; valor: number }[] | undefined = undefined;
  if (Array.isArray(obj.bonosMagicos)) {
    bonosMagicosSaneados = obj.bonosMagicos.map((b) => {
      const bObj = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
      return {
        categoria: aplanarValor(bObj.categoria || bObj.category || "OTRO"),
        bono: aplanarValor(bObj.bono || bObj.bonus || ""),
        valor: Number(bObj.valor || bObj.value) || 0
      };
    });
  }

  // Determinar tipoPrincipal (admitiendo obj.equipment_category)
  let tipoPrincipalSaneado: "Arma" | "Armadura" | "Equipo de Aventuras" = "Equipo de Aventuras";
  let catTxt = "";
  if (obj.equipment_category && typeof obj.equipment_category === "object") {
    const ecObj = obj.equipment_category as Record<string, unknown>;
    catTxt = aplanarValor(ecObj.index || ecObj.name || "").toUpperCase();
  } else {
    catTxt = aplanarValor(obj.tipoPrincipal || obj.categoria || "Equipo de Aventuras").toUpperCase();
  }

  if (catTxt === "ARMA" || catTxt === "WEAPON" || catTxt.includes("WEAPON") || catTxt.includes("ARMA")) {
    tipoPrincipalSaneado = "Arma";
  } else if (catTxt === "ARMADURA" || catTxt === "ARMOR" || catTxt.includes("ARMOR") || catTxt.includes("ARMADURA")) {
    tipoPrincipalSaneado = "Armadura";
  }

  // Conservar propiedades de string para renderizado retrocompatible
  const propiedadesSaneadas = obj.propiedades && typeof obj.propiedades === "string" ? aplanarValor(obj.propiedades) : undefined;

  // Saneamiento específico por tipo
  if (tipoPrincipalSaneado === "Arma") {
    // Subcategoría de Arma
    let subArma: "Sencilla" | "Marcial" | "De Fuego" = "Sencilla";
    const subTxt = aplanarValor(obj.subcategoria || obj.weapon_category || obj.tipoArma || "Sencilla").toUpperCase();
    if (subTxt.includes("MARCIAL") || subTxt.includes("MARTIAL")) subArma = "Marcial";
    else if (subTxt.includes("FUEGO") || subTxt.includes("FIRE")) subArma = "De Fuego";

    // Tipo de Ataque
    let estiloAtq: "Cuerpo a Cuerpo" | "A Distancia" = "Cuerpo a Cuerpo";
    const estiloTxt = aplanarValor(obj.tipoAtaque || obj.weapon_range || obj.estiloAtaque || "Cuerpo a Cuerpo").toUpperCase();
    if (estiloTxt.includes("DISTANCIA") || estiloTxt.includes("RANGED") || estiloTxt === "RANGED") estiloAtq = "A Distancia";

    // Dado de Daño estructurado (de obj.damage de equipment-es.json)
    let dadoDanoSaneado = "1d4";
    let tipoDanoSaneado = "Cortante";
    
    // Mapa de traducción de tipos de daño inglés → español
    const DAÑO_TRADUCCION: Record<string, string> = {
      "piercing": "Perforante", "slashing": "Cortante", "bludgeoning": "Contundente",
      "fire": "Fuego", "cold": "Frío", "lightning": "Relámpago",
      "acid": "Ácido", "poison": "Veneno", "necrotic": "Necrótico",
      "radiant": "Radiante", "thunder": "Trueno", "force": "Fuerza",
      "psychic": "Psíquico"
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

    // Propiedades de Arma (admitiendo properties array o propiedadesArma ya traducidas)
    let propsArma: string[] = [];
    const rawProps = obj.properties || obj.propiedadesArma || obj.propiedades;
    
    // Mapa de traducción inglés → español (PHB 2024)
    const PROP_TRADUCCION: Record<string, string> = {
      "finesse": "Sutil", "sutil": "Sutil",
      "versatile": "Versátil", "versátil": "Versátil",
      "heavy": "Pesado", "pesado": "Pesado",
      "light": "Ligero", "ligero": "Ligero",
      "loading": "Carga", "carga": "Carga",
      "reach": "Alcance", "alcance": "Alcance",
      "thrown": "Arrojadiza", "arrojadiza": "Arrojadiza",
      "two-handed": "A dos manos", "a dos manos": "A dos manos",
      "silvered": "Plateado", "plateado": "Plateado",
      "special": "Especial", "especial": "Especial",
      "ammunition": "Munición", "munición": "Munición",
      "attunement": "Sintonización", "sintonización": "Sintonización", "sintonizacion": "Sintonización",
      "nick": "Golpe Rápido", "golpe rápido": "Golpe Rápido",
      "push": "Empuje", "empuje": "Empuje",
      "slow": "Lentitud", "lentitud": "Lentitud",
      "graze": "Roce", "roce": "Roce",
      "cleave": "Tajo", "tajo": "Tajo",
      "topple": "Derribo", "derribo": "Derribo",
      "vex": "Acoso", "acoso": "Acoso",
      "sap": "Menoscabo", "menoscabo": "Menoscabo"
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

    // Maestría de Arma
    const maestriaSaneada = aplanarValor(obj.maestria || "Ninguna");

    // Alcance Normal y Largo (admitiendo throw_range y range estructurados de equipment-es.json)
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

    return {
      id: idSaneado,
      nombre: nombreSaneado,
      descripcion: descSaneada,
      pesoLb: pesoSaneado,
      valorPO: valorSaneado,
      rareza: rarezaSaneada,
      esMagico: esMagicoSaneado,
      bonosMagicos: bonosMagicosSaneados,
      
      tipoPrincipal: "Arma",
      subcategoria: subArma,
      tipoAtaque: estiloAtq,
      dadoDano: dadoDanoSaneado,
      tipoDano: tipoDanoSaneado,
      propiedades: propsArma,
      maestria: maestriaSaneada,
      alcanceNormal: alcNormal,
      alcanceLargo: alcLargo
    } as Arma;
  } else if (tipoPrincipalSaneado === "Armadura") {
    // Subcategoría de Armadura
    let subArmor: "Ligera" | "Mediana" | "Pesada" | "Escudo" = "Ligera";
    const subTxt = aplanarValor(obj.subcategoria || obj.armor_category || "Ligera").toUpperCase();
    if (subTxt.includes("MEDIANA") || subTxt.includes("MEDIUM")) subArmor = "Mediana";
    else if (subTxt.includes("PESADA") || subTxt.includes("HEAVY")) subArmor = "Pesada";
    else if (subTxt.includes("ESCUDO") || subTxt.includes("SHIELD")) subArmor = "Escudo";

    // CA Base (admitiendo obj.armor_class estructurado)
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

    // Requisito de Fuerza (admitiendo str_minimum)
    let reqFuerza = obj.str_minimum !== undefined ? (Number(obj.str_minimum) || undefined) : undefined;
    if (reqFuerza === undefined) {
      reqFuerza = obj.requisitoFuerza !== undefined ? (Number(obj.requisitoFuerza) || undefined) : undefined;
    }
    if (reqFuerza !== undefined && reqFuerza <= 0) {
      reqFuerza = undefined;
    }

    // Desventaja Sigilo (admitiendo stealth_disadvantage)
    const desSigilo = !!(obj.stealth_disadvantage !== undefined ? obj.stealth_disadvantage : (obj.desventajaSigilo || obj.desvSigilo));

    // Bono Destreza
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
      // Deducir por defecto de D&D
      if (subArmor === "Mediana") bonoDest = "Máximo 2";
      else if (subArmor === "Pesada") bonoDest = "Sin Bono";
    }

    return {
      id: idSaneado,
      nombre: nombreSaneado,
      descripcion: descSaneada,
      pesoLb: pesoSaneado,
      valorPO: valorSaneado,
      rareza: rarezaSaneada,
      esMagico: esMagicoSaneado,
      bonosMagicos: bonosMagicosSaneados,
      propiedades: propiedadesSaneadas,

      tipoPrincipal: "Armadura",
      subcategoria: subArmor,
      caBase: caBaseSaneada,
      requisitoFuerza: reqFuerza,
      desventajaSigilo: desSigilo,
      bonoDestreza: bonoDest
    } as Armadura;
  } else {
    // Equipo de Aventuras
    let subEquipo: SubcategoriaEquipo = "Maravilloso";
    const subTxt = aplanarValor(obj.subcategoria || obj.equipment_category || "Maravilloso").toUpperCase();
    if (subTxt.includes("CONSUMIBLE")) subEquipo = "Consumible";
    else if (subTxt.includes("MUNICIÓN") || subTxt.includes("MUNITION") || subTxt.includes("AMMUNITION")) subEquipo = "Munición";
    else if (subTxt.includes("HERRAMIENTA") || subTxt.includes("TOOL")) subEquipo = "Herramienta";
    else if (subTxt.includes("INSTRUMENTO") || subTxt.includes("INSTRUMENT")) subEquipo = "Instrumento";
    else if (subTxt.includes("PAQUETE") || subTxt.includes("PACK") || subTxt.includes("GEAR") || subTxt.includes("STANDARD-GEAR")) subEquipo = "Paquete";

    const cant = obj.cantidad !== undefined ? (Number(obj.cantidad) || undefined) : undefined;
    const sint = obj.sintonizacionRequerida !== undefined ? !!obj.sintonizacionRequerida : undefined;
    const cg = obj.cargas !== undefined ? (Number(obj.cargas) || undefined) : undefined;

    return {
      id: idSaneado,
      nombre: nombreSaneado,
      descripcion: descSaneada,
      pesoLb: pesoSaneado,
      valorPO: valorSaneado,
      rareza: rarezaSaneada,
      esMagico: esMagicoSaneado,
      bonosMagicos: bonosMagicosSaneados,
      propiedades: propiedadesSaneadas,

      tipoPrincipal: "Equipo de Aventuras",
      subcategoria: subEquipo,
      cantidad: cant,
      sintonizacionRequerida: sint,
      cargas: cg
    } as EquipoAventuras;
  }
}

export function sanearHechizoCD(h: HechizoBase): HechizoBase {
  if (!h) return h;

  let cdSalv: string | undefined = undefined;
  const descLower = (h.descripcion || "").toLowerCase();

  // PASO 1: Máxima prioridad — buscar el patrón explícito "cd salvación: ATTR" que el
  // importador inserta intencionalmente. Este patrón es 100% fiable porque lo generamos nosotros.
  const matchCdExplicito = descLower.match(/cd\s+salvaci[oó]n:\s*([a-záéíóúüñ]+)/i);
  if (matchCdExplicito) {
    const attrRaw = matchCdExplicito[1].toUpperCase().trim();
    if (attrRaw.includes("FUE") || attrRaw.includes("STR")) cdSalv = "Fuerza";
    else if (attrRaw.includes("DES") || attrRaw.includes("DEX")) cdSalv = "Destreza";
    else if (attrRaw.includes("CON")) cdSalv = "Constitución";
    else if (attrRaw.includes("INT")) cdSalv = "Inteligencia";
    else if (attrRaw.includes("SAB") || attrRaw.includes("WIS")) cdSalv = "Sabiduría";
    else if (attrRaw.includes("CAR") || attrRaw.includes("CHA")) cdSalv = "Carisma";
  }

  // PASO 2: Si no se resolvió del patrón explícito, normalizar el campo cdSalvacion almacenado
  if (!cdSalv) {
    const valorOriginal = h.cdSalvacion ? String(h.cdSalvacion).toUpperCase().trim() : "";
    if (valorOriginal && valorOriginal !== "CD DC" && valorOriginal !== "DC" && valorOriginal !== "CD" && valorOriginal !== "N/A") {
      if (valorOriginal === "FUE" || valorOriginal === "STR") cdSalv = "Fuerza";
      else if (valorOriginal === "DES" || valorOriginal === "DEX") cdSalv = "Destreza";
      else if (valorOriginal === "CON") cdSalv = "Constitución";
      else if (valorOriginal === "INT") cdSalv = "Inteligencia";
      else if (valorOriginal === "SAB" || valorOriginal === "WIS") cdSalv = "Sabiduría";
      else if (valorOriginal === "CAR" || valorOriginal === "CHA") cdSalv = "Carisma";
      // Si ya viene en español completo, aceptarlo directamente
      else if (["Fuerza","Destreza","Constitución","Inteligencia","Sabiduría","Carisma"].includes(h.cdSalvacion as string)) {
        cdSalv = h.cdSalvacion as string;
      } else {
        cdSalv = aplanarValor(h.cdSalvacion);
      }
    }
  }

  // PASO 3: Fallback — escanear la descripción completa buscando frases naturales de salvación
  if (!cdSalv) {
    if (descLower.includes("salvación de destreza") || descLower.includes("salvacion de destreza") || descLower.includes("salvación: dex") || descLower.includes("salvación: des")) {
      cdSalv = "Destreza";
    } else if (descLower.includes("salvación de sabiduría") || descLower.includes("salvacion de sabiduria") || descLower.includes("salvación: sab") || descLower.includes("salvación: wis") || descLower.includes("salvación de sabidur")) {
      cdSalv = "Sabiduría";
    } else if (descLower.includes("salvación de constitución") || descLower.includes("salvacion de constitucion") || descLower.includes("salvación: con")) {
      cdSalv = "Constitución";
    } else if (descLower.includes("salvación de inteligencia") || descLower.includes("salvacion de inteligencia") || descLower.includes("salvación: int")) {
      cdSalv = "Inteligencia";
    } else if (descLower.includes("salvación de fuerza") || descLower.includes("salvacion de fuerza") || descLower.includes("salvación: fue") || descLower.includes("salvación: str")) {
      cdSalv = "Fuerza";
    } else if (descLower.includes("salvación de carisma") || descLower.includes("salvacion de carisma") || descLower.includes("salvación: car") || descLower.includes("salvación: cha")) {
      cdSalv = "Carisma";
    }
  }

  // Devolver el hechizo modificado con la salvación saneada (o undefined si no aplica)
  return {
    ...h,
    cdSalvacion: cdSalv && cdSalv !== "N/A" ? cdSalv : undefined
  };
}

export function calcularVidaPorDados(
  formula: string,
  promedioEstandar: number,
  metodo: "estandar" | "maximo" | "azar"
): number {
  if (metodo === "estandar" || !formula) {
    return promedioEstandar;
  }

  // Sanitizar fórmula (quitar espacios, paréntesis y pasar a minúsculas)
  const saneada = formula
    .replace(/[\s()]+/g, "")
    .replace(/[–—−]+/g, "-") // Reemplaza en-dash, em-dash y minus sign unicode por el '-' regular
    .toLowerCase();

  // Expresión regular para parsear: opcionalmente número de dados 'x', 'd', número de caras 'y', y modificador opcional '+z' o '-z'
  const match = saneada.match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) {
    return promedioEstandar;
  }

  const cantidadDados = parseInt(match[1], 10);
  const carasDado = parseInt(match[2], 10);
  const modificador = match[3] ? parseInt(match[3], 10) : 0;

  if (isNaN(cantidadDados) || isNaN(carasDado)) {
    return promedioEstandar;
  }

  if (metodo === "maximo") {
    return (cantidadDados * carasDado) + modificador;
  }

  if (metodo === "azar") {
    let total = 0;
    for (let i = 0; i < cantidadDados; i++) {
      total += Math.floor(Math.random() * carasDado) + 1;
    }
    total += modificador;
    // La vida mínima debería ser al menos 1
    return Math.max(1, total);
  }

  return promedioEstandar;
}
