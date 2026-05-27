import { HechizoBase, ObjetoHomebrew } from '../tipos';

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
    return { id: "", nombre: "Objeto Desconocido", rareza: "Común", propiedades: "Ninguna", descripcion: "Sin descripción." };
  }
  
  const obj = o as Record<string, unknown>;
  
  // Saneamiento de propiedades complejas opcionales para evitar React error #31
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

  let propiedadesArmaSaneadas: string[] | undefined = undefined;
  if (Array.isArray(obj.propiedadesArma)) {
    propiedadesArmaSaneadas = obj.propiedadesArma.map(aplanarValor);
  }

  return {
    id: aplanarValor(obj.id || obj.index || `o_${Date.now()}_${Math.random()}`).trim(),
    nombre: aplanarValor(obj.nombre || obj.name || "Objeto Desconocido"),
    rareza: aplanarValor(obj.rareza || obj.rarity || "Común"),
    propiedades: aplanarValor(obj.propiedades || "Ninguna"),
    descripcion: aplanarValor(obj.descripcion || obj.desc || obj.description || "Sin descripción disponible."),
    
    categoria: obj.categoria ? aplanarValor(obj.categoria) : undefined,
    costoValor: obj.costoValor !== undefined ? (Number(obj.costoValor) || 0) : undefined,
    costoUnidad: obj.costoUnidad ? aplanarValor(obj.costoUnidad) : undefined,
    peso: obj.peso ? aplanarValor(obj.peso) : undefined,
    tipoArma: obj.tipoArma ? aplanarValor(obj.tipoArma) : undefined,
    estiloAtaque: obj.estiloAtaque ? aplanarValor(obj.estiloAtaque) : undefined,
    alcance: obj.alcance ? aplanarValor(obj.alcance) : undefined,
    propiedadesArma: propiedadesArmaSaneadas,
    dadosDaño: obj.dadosDaño ? aplanarValor(obj.dadosDaño) : undefined,
    tipoDaño: obj.tipoDaño ? aplanarValor(obj.tipoDaño) : undefined,
    bonoAtaque: obj.bonoAtaque ? aplanarValor(obj.bonoAtaque) : undefined,
    bonoDaño: obj.bonoDaño ? aplanarValor(obj.bonoDaño) : undefined,
    bonosMagicos: bonosMagicosSaneados
  };
}

export function sanearHechizoCD(h: HechizoBase): HechizoBase {
  if (!h) return h;

  let cdSalv: string | undefined = undefined;

  // Si ya tiene un valor de cdSalvacion, intentamos normalizarlo primero si no es genérico
  const valorOriginal = h.cdSalvacion ? String(h.cdSalvacion).toUpperCase().trim() : "";

  if (valorOriginal && valorOriginal !== "CD DC" && valorOriginal !== "DC" && valorOriginal !== "CD" && valorOriginal !== "N/A") {
    // Si contiene el nombre de una característica, la normalizamos en español
    if (valorOriginal === "FUE" || valorOriginal.includes("STR") || valorOriginal.includes("FUE")) cdSalv = "Fuerza";
    else if (valorOriginal === "DES" || valorOriginal.includes("DEX") || valorOriginal.includes("DES")) cdSalv = "Destreza";
    else if (valorOriginal === "CON") cdSalv = "Constitución";
    else if (valorOriginal === "INT") cdSalv = "Inteligencia";
    else if (valorOriginal === "SAB" || valorOriginal.includes("WIS") || valorOriginal.includes("SAB")) cdSalv = "Sabiduría";
    else if (valorOriginal === "CAR" || valorOriginal.includes("CHA") || valorOriginal.includes("CAR")) cdSalv = "Carisma";
    else {
      // Si no coincide con las siglas típicas pero tiene otro valor no genérico, lo dejamos aplanado
      cdSalv = aplanarValor(h.cdSalvacion);
    }
  }

  // Si no se resolvió arriba (es genérico o está vacío), intentamos deducir de la descripción
  if (!cdSalv) {
    const descLower = (h.descripcion || "").toLowerCase();
    if (descLower.includes("salvación de destreza") || descLower.includes("tirada de salvación de destreza") || descLower.includes("salvación: dex") || descLower.includes("salvación: des") || descLower.includes("salvacion de destreza")) {
      cdSalv = "Destreza";
    } else if (descLower.includes("salvación de sabiduría") || descLower.includes("tirada de salvación de sabiduría") || descLower.includes("salvación: sab") || descLower.includes("salvación: wis") || descLower.includes("salvacion de sabiduria") || descLower.includes("salvación de sabidur")) {
      cdSalv = "Sabiduría";
    } else if (descLower.includes("salvación de constitución") || descLower.includes("tirada de salvación de constitución") || descLower.includes("salvación: con") || descLower.includes("salvacion de constitucion")) {
      cdSalv = "Constitución";
    } else if (descLower.includes("salvación de inteligencia") || descLower.includes("tirada de salvación de inteligencia") || descLower.includes("salvación: int") || descLower.includes("salvacion de inteligencia")) {
      cdSalv = "Inteligencia";
    } else if (descLower.includes("salvación de fuerza") || descLower.includes("tirada de salvación de fuerza") || descLower.includes("salvación: fue") || descLower.includes("salvación: str") || descLower.includes("salvacion de fuerza")) {
      cdSalv = "Fuerza";
    } else if (descLower.includes("salvación de carisma") || descLower.includes("tirada de salvación de carisma") || descLower.includes("salvación: car") || descLower.includes("salvación: cha") || descLower.includes("salvacion de carisma")) {
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
