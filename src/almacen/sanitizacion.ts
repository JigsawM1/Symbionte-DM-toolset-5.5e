import { HechizoBase, ObjetoHomebrew, Rareza, Arma, Armadura, EquipoAventuras, TipoBonoDestreza, SubcategoriaEquipo, VelocidadEstructurada, SentidosEstructurados, MonstruoBase } from '../tipos';

// Normaliza el texto eliminando acentos y convirtiendo a minúsculas
export function normalizarTexto(texto: string): string {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
      subcategoria: "Maravilloso",
      equipable: false
    };
  }
  
  const obj = o as Record<string, unknown>;
  const idSaneado = aplanarValor(obj.id || obj.index || `o_${Date.now()}_${Math.random()}`).trim();
  const nombreSaneado = aplanarValor(obj.nombre || obj.name || "Objeto Desconocido");
  
  // Procesar descripción — puede ser string o array de strings
  const descField = obj.descripcion !== undefined ? obj.descripcion
                  : obj.description !== undefined ? obj.description
                  : obj.desc;
  let descSaneada: string;
  if (Array.isArray(descField)) {
    descSaneada = descField.map(aplanarValor).filter(Boolean).join("\n");
  } else {
    descSaneada = aplanarValor(descField || "Sin descripción disponible.");
  }
  
  // Extraer Rareza limpia
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

  // Parsear Peso (Lb)
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

  // Costo estructurado y conversión automática
  let costoOriginalSaneado: { cantidad: number; unidad: "PC" | "PP" | "PE" | "PO" | "PPT" } | undefined = undefined;
  if (obj.costoOriginal && typeof obj.costoOriginal === "object") {
    const co = obj.costoOriginal as Record<string, unknown>;
    costoOriginalSaneado = {
      cantidad: Number(co.cantidad) || 0,
      unidad: (co.unidad as any) || "PO"
    };
  }

  // Parsear Costo/Valor (PO)
  let valorSaneado = 0;
  if (costoOriginalSaneado) {
    const cant = costoOriginalSaneado.cantidad;
    const unit = costoOriginalSaneado.unidad;
    if (unit === "PC") valorSaneado = cant / 100;
    else if (unit === "PP") valorSaneado = cant / 10;
    else if (unit === "PE") valorSaneado = cant / 2;
    else if (unit === "PO") valorSaneado = cant;
    else if (unit === "PPT") valorSaneado = cant * 10;
  } else if (obj.cost && typeof obj.cost === "object" && obj.cost !== null) {
    const costObj = obj.cost as Record<string, unknown>;
    const cantidad = Number(costObj.quantity) || 0;
    const unidadIngles = aplanarValor(costObj.unit || "gp").toLowerCase().trim();
    let unidadEsp: "PC" | "PP" | "PE" | "PO" | "PPT" = "PO";
    
    if (unidadIngles === "cp") {
      valorSaneado = cantidad / 100;
      unidadEsp = "PC";
    } else if (unidadIngles === "sp") {
      valorSaneado = cantidad / 10;
      unidadEsp = "PP";
    } else if (unidadIngles === "ep") {
      valorSaneado = cantidad / 2;
      unidadEsp = "PE";
    } else if (unidadIngles === "gp") {
      valorSaneado = cantidad;
      unidadEsp = "PO";
    } else if (unidadIngles === "pp" || unidadIngles === "plat") {
      valorSaneado = cantidad * 10;
      unidadEsp = "PPT";
    } else {
      valorSaneado = cantidad;
    }
    
    costoOriginalSaneado = { cantidad, unidad: unidadEsp };
  } else if (obj.valorPO !== undefined) {
    valorSaneado = Number(obj.valorPO) || 0;
    costoOriginalSaneado = { cantidad: valorSaneado, unidad: "PO" };
  } else if (obj.costoValor !== undefined) {
    valorSaneado = Number(obj.costoValor) || 0;
    const costoUnidad = aplanarValor(obj.costoUnidad || "PO").toUpperCase();
    let unidadEsp: "PC" | "PP" | "PE" | "PO" | "PPT" = "PO";
    if (costoUnidad === "PC") {
      valorSaneado = valorSaneado / 100;
      unidadEsp = "PC";
    } else if (costoUnidad === "PP") {
      valorSaneado = valorSaneado / 10;
      unidadEsp = "PP";
    } else if (costoUnidad === "PE") {
      valorSaneado = valorSaneado / 2;
      unidadEsp = "PE";
    } else if (costoUnidad === "PPT") {
      valorSaneado = valorSaneado * 10;
      unidadEsp = "PPT";
    }
    costoOriginalSaneado = { cantidad: Number(obj.costoValor) || 0, unidad: unidadEsp };
  }

  // Extraer efectos pasivos (reemplazando bonosMagicos) y migrar bonosMagicos si es necesario
  let efectosPasivosSaneados: { tipo: string; bono: string; valor?: number | string; descripcion?: string }[] | undefined = undefined;
  if (Array.isArray(obj.efectosPasivos)) {
    efectosPasivosSaneados = obj.efectosPasivos.map((e) => {
      const eObj = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
      return {
        tipo: aplanarValor(eObj.tipo || eObj.categoria || "Otro"),
        bono: aplanarValor(eObj.bono || ""),
        valor: eObj.valor !== undefined && eObj.valor !== "" ? (typeof eObj.valor === "number" ? eObj.valor : aplanarValor(eObj.valor)) : undefined,
        descripcion: eObj.descripcion !== undefined ? aplanarValor(eObj.descripcion) : undefined
      };
    });
  } else if (Array.isArray(obj.bonosMagicos)) {
    // Migración de compatibilidad
    efectosPasivosSaneados = obj.bonosMagicos.map((b) => {
      const bObj = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
      return {
        tipo: aplanarValor(bObj.categoria || bObj.category || "Otro"),
        bono: aplanarValor(bObj.bono || bObj.bonus || ""),
        valor: Number(bObj.valor || bObj.value) || 0
      };
    });
  }

  // Extraer sintonizacionRequerida y cargas (ahora en la base)
  const sintonizacionRequeridaSaneada = obj.sintonizacionRequerida !== undefined
    ? !!obj.sintonizacionRequerida
    : (obj.attunement !== undefined ? !!obj.attunement : undefined);
  const cargasSaneadas = obj.cargas !== undefined && obj.cargas !== ""
    ? (Number(obj.cargas) || undefined)
    : (obj.charges !== undefined && obj.charges !== "" ? (Number(obj.charges) || undefined) : undefined);

  // Propiedades mágicas y narrativas comunes
  const condicionSintonizacionSaneada = obj.condicionSintonizacion !== undefined ? aplanarValor(obj.condicionSintonizacion) : undefined;
  const formulaRecargaSaneada = obj.formulaRecarga !== undefined ? aplanarValor(obj.formulaRecarga) : undefined;
  const estaMalditoSaneado = obj.estaMaldito !== undefined ? !!obj.estaMaldito : undefined;
  const esConscienteSaneado = obj.esConsciente !== undefined ? !!obj.esConsciente : undefined;
  const modificadorAtaqueDanoSaneado = obj.modificadorAtaqueDano !== undefined && obj.modificadorAtaqueDano !== ""
    ? (Number(obj.modificadorAtaqueDano) || undefined)
    : undefined;

  // Hechizos vinculados
  let hechizosVinculadosSaneados: { nombre: string; cd?: number; bonoAtaque?: number; costeCargas?: number }[] | undefined = undefined;
  if (Array.isArray(obj.hechizosVinculados)) {
    hechizosVinculadosSaneados = obj.hechizosVinculados.map((h) => {
      const hObj = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
      return {
        nombre: aplanarValor(hObj.nombre || "Hechizo"),
        cd: hObj.cd !== undefined && hObj.cd !== "" ? Number(hObj.cd) || undefined : undefined,
        bonoAtaque: hObj.bonoAtaque !== undefined && hObj.bonoAtaque !== "" ? Number(hObj.bonoAtaque) || undefined : undefined,
        costeCargas: hObj.costeCargas !== undefined && hObj.costeCargas !== "" ? Number(hObj.costeCargas) || undefined : undefined
      };
    });
  }

  // Artesanía
  let artesaniaSaneada: { tallerRequerido: string; componentes: string[] } | undefined = undefined;
  if (obj.artesania && typeof obj.artesania === "object") {
    const artObj = obj.artesania as Record<string, unknown>;
    artesaniaSaneada = {
      tallerRequerido: aplanarValor(artObj.tallerRequerido || ""),
      componentes: Array.isArray(artObj.componentes) ? artObj.componentes.map(aplanarValor).filter(Boolean) : []
    };
  }

  // Determinar tipoPrincipal
  let tipoPrincipalSaneado: "Arma" | "Armadura" | "Equipo de Aventuras" = "Equipo de Aventuras";
  let catTxt = "";
  if (obj.equipment_category && typeof obj.equipment_category === "object") {
    const ecObj = obj.equipment_category as Record<string, unknown>;
    catTxt = aplanarValor(ecObj.index || ecObj.name || "").toUpperCase();
  } else {
    catTxt = aplanarValor(obj.tipoPrincipal || obj.categoria || "Equipo de Aventuras").toUpperCase();
  }

  if (catTxt === "ARMADURA" || catTxt === "ARMOR" || catTxt.includes("ARMOR") || catTxt.includes("ARMADURA")) {
    tipoPrincipalSaneado = "Armadura";
  } else if (catTxt === "ARMA" || catTxt === "WEAPON" || catTxt.includes("WEAPON") || catTxt.includes("ARMA")) {
    tipoPrincipalSaneado = "Arma";
  }

  // Conservar propiedades de string
  const propiedadesSaneadas = obj.propiedades && typeof obj.propiedades === "string" ? aplanarValor(obj.propiedades) : undefined;

  // Nuevos campos específicos: equipable y venenos
  const equipableSaneado = obj.equipable !== undefined
    ? !!obj.equipable
    : (tipoPrincipalSaneado === "Arma" || tipoPrincipalSaneado === "Armadura");

  const esVenenoSaneado = obj.esVeneno !== undefined ? !!obj.esVeneno : undefined;
  const tipoVenenoSaneado = obj.tipoVeneno ? (aplanarValor(obj.tipoVeneno) as "Contacto" | "Ingerido" | "Inhalado" | "Lesión") : undefined;
  const cdSalvacionVenenoSaneado = obj.cdSalvacionVeneno !== undefined && obj.cdSalvacionVeneno !== "" ? (Number(obj.cdSalvacionVeneno) || undefined) : undefined;
  const efectoVenenoSaneado = obj.efectoVeneno !== undefined ? aplanarValor(obj.efectoVeneno) : undefined;

  // Estructura base común
  const baseObjeto = {
    id: idSaneado,
    nombre: nombreSaneado,
    nombreNormalizado: normalizarTexto(nombreSaneado),
    descripcion: descSaneada,
    pesoLb: pesoSaneado,
    valorPO: valorSaneado,
    rareza: rarezaSaneada,
    esMagico: esMagicoSaneado,
    costoOriginal: costoOriginalSaneado,
    esVeneno: esVenenoSaneado,
    tipoVeneno: tipoVenenoSaneado,
    cdSalvacionVeneno: cdSalvacionVenenoSaneado,
    efectoVeneno: efectoVenenoSaneado,
    equipable: equipableSaneado,
    sintonizacionRequerida: sintonizacionRequeridaSaneada,
    cargas: cargasSaneadas,
    condicionSintonizacion: condicionSintonizacionSaneada,
    formulaRecarga: formulaRecargaSaneada,
    estaMaldito: estaMalditoSaneado,
    esConsciente: esConscienteSaneado,
    modificadorAtaqueDano: modificadorAtaqueDanoSaneado,
    efectosPasivos: efectosPasivosSaneados,
    hechizosVinculados: hechizosVinculadosSaneados,
    artesania: artesaniaSaneada
  };

  // Saneamiento específico por tipo
  if (tipoPrincipalSaneado === "Arma") {
    let subArma: "Sencilla" | "Marcial" | "De Fuego" = "Sencilla";
    const subTxt = aplanarValor(obj.subcategoria || obj.weapon_category || obj.tipoArma || "Sencilla").toUpperCase();
    if (subTxt.includes("MARCIAL") || subTxt.includes("MARTIAL")) subArma = "Marcial";
    else if (subTxt.includes("FUEGO") || subTxt.includes("FIRE")) subArma = "De Fuego";

    let estiloAtq: "Cuerpo a Cuerpo" | "A Distancia" = "Cuerpo a Cuerpo";
    const estiloTxt = aplanarValor(obj.tipoAtaque || obj.weapon_range || obj.estiloAtaque || "Cuerpo a Cuerpo").toUpperCase();
    if (estiloTxt.includes("DISTANCIA") || estiloTxt.includes("RANGED") || estiloTxt === "RANGED") estiloAtq = "A Distancia";

    let dadoDanoSaneado = "1d4";
    let tipoDanoSaneado = "Cortante";
    
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

    let propsArma: string[] = [];
    const rawProps = obj.properties || obj.propiedadesArma || obj.propiedades;
    
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

    const maestriaSaneada = aplanarValor(obj.maestria || "Ninguna");

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

    const danoVersatilSaneado = obj.danoVersatil !== undefined ? aplanarValor(obj.danoVersatil) : undefined;
    const municionRequeridaSaneada = obj.municionRequerida !== undefined ? !!obj.municionRequerida : undefined;

    return {
      ...baseObjeto,
      tipoPrincipal: "Arma",
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
  } else if (tipoPrincipalSaneado === "Armadura") {
    let subArmor: "Ligera" | "Mediana" | "Pesada" | "Escudo" = "Ligera";
    const subTxt = aplanarValor(obj.subcategoria || obj.armor_category || "Ligera").toUpperCase();
    if (subTxt.includes("MEDIANA") || subTxt.includes("MEDIUM")) subArmor = "Mediana";
    else if (subTxt.includes("PESADA") || subTxt.includes("HEAVY")) subArmor = "Pesada";
    else if (subTxt.includes("ESCUDO") || subTxt.includes("SHIELD")) subArmor = "Escudo";

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

    const tiempoEquiparSaneado = obj.tiempoEquipar !== undefined
      ? (typeof obj.tiempoEquipar === "number" ? obj.tiempoEquipar : aplanarValor(obj.tiempoEquipar))
      : undefined;

    return {
      ...baseObjeto,
      propiedades: propiedadesSaneadas,
      tipoPrincipal: "Armadura",
      subcategoria: subArmor,
      caBase: caBaseSaneada,
      requisitoFuerza: reqFuerza,
      desventajaSigilo: desSigilo,
      bonoDestreza: bonoDest,
      tiempoEquipar: tiempoEquiparSaneado
    } as Armadura;
  } else {
    let subEquipo: SubcategoriaEquipo = "Maravilloso";
    const subTxt = aplanarValor(obj.subcategoria || obj.equipment_category || "Maravilloso").toUpperCase();
    if (subTxt.includes("CONSUMIBLE")) subEquipo = "Consumible";
    else if (subTxt.includes("MUNICIÓN") || subTxt.includes("MUNITION") || subTxt.includes("AMMUNITION")) subEquipo = "Munición";
    else if (subTxt.includes("HERRAMIENTA") || subTxt.includes("TOOL")) subEquipo = "Herramienta";
    else if (subTxt.includes("INSTRUMENTO") || subTxt.includes("INSTRUMENT")) subEquipo = "Instrumento";
    else if (subTxt.includes("PAQUETE") || subTxt.includes("PACK") || subTxt.includes("GEAR") || subTxt.includes("STANDARD-GEAR")) subEquipo = "Paquete";

    const cant = obj.cantidad !== undefined ? (Number(obj.cantidad) || undefined) : undefined;

    return {
      ...baseObjeto,
      propiedades: propiedadesSaneadas,
      tipoPrincipal: "Equipo de Aventuras",
      subcategoria: subEquipo,
      cantidad: cant
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
    nombreNormalizado: normalizarTexto(h.nombre),
    descripcionNormalizada: normalizarTexto(h.descripcion),
    escuelaNormalizada: normalizarTexto(h.escuela || ""),
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

export function parsearVelocidad(velStr: string): VelocidadEstructurada {
  const result: VelocidadEstructurada = { caminar: 0, planea: false };
  if (!velStr) return result;

  const partes = velStr.toLowerCase().split(",");
  for (const parte of partes) {
    const numMatch = parte.match(/(\d+)\s*pies?/);
    const valor = numMatch ? parseInt(numMatch[1], 10) : 30;
    
    if (parte.includes("nadar") || parte.includes("swim")) {
      result.nadar = valor;
    } else if (parte.includes("volar") || parte.includes("fly")) {
      result.volar = valor;
      if (parte.includes("suspenderse") || parte.includes("hover")) {
        result.planea = true;
      }
    } else if (parte.includes("trepar") || parte.includes("climb")) {
      result.escalar = valor;
    } else if (parte.includes("excavar") || parte.includes("burrow")) {
      result.excavar = valor;
    } else {
      result.caminar = valor;
    }
  }
  return result;
}

export function parsearSentidos(sentidosStr: string): SentidosEstructurados {
  const result: SentidosEstructurados = { percepcionPasiva: 10 };
  if (!sentidosStr) return result;

  const partes = sentidosStr.toLowerCase().split(",");
  for (const parte of partes) {
    const numMatch = parte.match(/(\d+)\s*pies?/);
    const valor = numMatch ? parseInt(numMatch[1], 10) : 60;
    
    if (parte.includes("oscuridad") || parte.includes("darkvision")) {
      result.visionOscuridad = valor;
    } else if (parte.includes("ciega") || parte.includes("blindsight")) {
      result.visionCiega = valor;
    } else if (parte.includes("verdadera") || parte.includes("truesight")) {
      result.visionVerdadera = valor;
    } else if (parte.includes("sísmico") || parte.includes("sismico") || parte.includes("tremorsense")) {
      result.sentidoSismico = valor;
    } else if (parte.includes("pasiva") || parte.includes("passive")) {
      const pasivaMatch = parte.match(/(\d+)/);
      if (pasivaMatch) {
        result.percepcionPasiva = parseInt(pasivaMatch[1], 10);
      }
    }
  }
  return result;
}

export function formatearVelocidad(vel: VelocidadEstructurada | string | undefined): string {
  if (!vel) return "0 pies";
  if (typeof vel === "string") return vel;
  
  const partes: string[] = [];
  if (vel.caminar) partes.push(`${vel.caminar} pies`);
  if (vel.nadar) partes.push(`Nadar ${vel.nadar} pies`);
  if (vel.volar) {
    partes.push(`Volar ${vel.volar} pies${vel.planea ? " (suspenderse)" : ""}`);
  }
  if (vel.escalar) partes.push(`Trepar ${vel.escalar} pies`);
  if (vel.excavar) partes.push(`Excavar ${vel.excavar} pies`);
  
  return partes.length > 0 ? partes.join(", ") : "0 pies";
}

export function formatearSentidos(sentidos: SentidosEstructurados | string | undefined): string {
  if (!sentidos) return "";
  if (typeof sentidos === "string") return sentidos;
  
  const partes: string[] = [];
  if (sentidos.visionOscuridad) partes.push(`Visión en la oscuridad ${sentidos.visionOscuridad} pies`);
  if (sentidos.visionCiega) partes.push(`Visión ciega ${sentidos.visionCiega} pies`);
  if (sentidos.visionVerdadera) partes.push(`Visión verdadera ${sentidos.visionVerdadera} pies`);
  if (sentidos.sentidoSismico) partes.push(`Sentido sísmico ${sentidos.sentidoSismico} pies`);
  partes.push(`Percepción pasiva ${sentidos.percepcionPasiva}`);
  
  return partes.join(", ");
}

export function sanearMonstruoSentidosYPasiva(m: MonstruoBase): MonstruoBase {
  let sentidosObj: SentidosEstructurados;
  if (m.sentidos && typeof m.sentidos === "object" && !Array.isArray(m.sentidos)) {
    sentidosObj = { ...(m.sentidos as any) };
  } else {
    sentidosObj = parsearSentidos(typeof m.sentidos === "string" ? m.sentidos : "");
  }

  if (sentidosObj.percepcionPasiva === 10) {
    const sab = m.caracteristicas?.sabiduria ?? 10;
    const modSab = Math.floor((sab - 10) / 2);
    const percBono = m.habilidades?.percepcion;
    const valorCalculado = 10 + (percBono !== undefined ? percBono : modSab);
    if (valorCalculado !== 10) {
      sentidosObj.percepcionPasiva = valorCalculado;
    }
  }

  return {
    ...m,
    nombreNormalizado: normalizarTexto(m.nombre),
    sentidos: sentidosObj
  };
}
