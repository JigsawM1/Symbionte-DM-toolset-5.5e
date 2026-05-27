import { HechizoBase, ObjetoHomebrew } from '../tipos';

// Función auxiliar robusta para aplanar de forma segura cualquier estructura a string (previene error #31 de React)
export function aplanarValor(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map(aplanarValor).filter(Boolean).join("\n");
    }
    if (val.nombre !== undefined) return aplanarValor(val.nombre);
    if (val.name !== undefined) return aplanarValor(val.name);
    if (val.index !== undefined) return aplanarValor(val.index);
    const keys = Object.keys(val);
    if (keys.length > 0) {
      for (const k of keys) {
        if (typeof val[k] === "string") return val[k].trim();
      }
      return aplanarValor(val[keys[0]]);
    }
  }
  return "";
}

export function sanearObjetoHomebrew(o: any): ObjetoHomebrew {
  if (!o) {
    return { id: "", nombre: "Objeto Desconocido", rareza: "Común", propiedades: "Ninguna", descripcion: "Sin descripción." };
  }
  
  // Saneamiento de propiedades complejas opcionales para evitar React error #31
  let bonosMagicosSaneados: any[] | undefined = undefined;
  if (Array.isArray(o.bonosMagicos)) {
    bonosMagicosSaneados = o.bonosMagicos.map((b: any) => ({
      categoria: aplanarValor(b.categoria || b.category || "OTRO"),
      bono: aplanarValor(b.bono || b.bonus || ""),
      valor: Number(b.valor || b.value) || 0
    }));
  }

  let propiedadesArmaSaneadas: string[] | undefined = undefined;
  if (Array.isArray(o.propiedadesArma)) {
    propiedadesArmaSaneadas = o.propiedadesArma.map(aplanarValor);
  }

  return {
    id: aplanarValor(o.id || o.index || `o_${Date.now()}_${Math.random()}`).trim(),
    nombre: aplanarValor(o.nombre || o.name || "Objeto Desconocido"),
    rareza: aplanarValor(o.rareza || o.rarity || "Común"),
    propiedades: aplanarValor(o.propiedades || "Ninguna"),
    descripcion: aplanarValor(o.descripcion || o.desc || o.description || "Sin descripción disponible."),
    
    categoria: o.categoria ? aplanarValor(o.categoria) : undefined,
    costoValor: o.costoValor !== undefined ? (Number(o.costoValor) || 0) : undefined,
    costoUnidad: o.costoUnidad ? aplanarValor(o.costoUnidad) : undefined,
    peso: o.peso ? aplanarValor(o.peso) : undefined,
    tipoArma: o.tipoArma ? aplanarValor(o.tipoArma) : undefined,
    estiloAtaque: o.estiloAtaque ? aplanarValor(o.estiloAtaque) : undefined,
    alcance: o.alcance ? aplanarValor(o.alcance) : undefined,
    propiedadesArma: propiedadesArmaSaneadas,
    dadosDaño: o.dadosDaño ? aplanarValor(o.dadosDaño) : undefined,
    tipoDaño: o.tipoDaño ? aplanarValor(o.tipoDaño) : undefined,
    bonoAtaque: o.bonoAtaque ? aplanarValor(o.bonoAtaque) : undefined,
    bonoDaño: o.bonoDaño ? aplanarValor(o.bonoDaño) : undefined,
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
