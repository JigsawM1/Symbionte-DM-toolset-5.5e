/**
 * categoriasEquipoConstantes.ts
 * -----------------------------
 * Catálogo canónico y diccionario de categorías de equipo para D&D 5.5e (2024 PHB).
 * Provee metadatos visuales, configuración de iconos de Lucide-React (cero emojis)
 * y función pura para resolver la categoría oficial a partir de los datos crudos del compendio.
 */

export const CATEGORIAS_EQUIPO = [
  "armas",
  "armaduras",
  "escudos",
  "herramientas",
  "focos-magicos",
  "consumibles",
  "municion",
  "contenedores",
  "paquetes-equipo",
  "objetos-magicos",
  "equipo-aventurero"
] as const;

export type CategoriaEquipo = (typeof CATEGORIAS_EQUIPO)[number];

export interface InfoCategoriaEquipo {
  id: CategoriaEquipo;
  etiqueta: string;
  descripcion: string;
  color: string;
  nombreIcono:
    | "Swords"
    | "Shield"
    | "Wrench"
    | "Sparkles"
    | "FlaskConical"
    | "Crosshair"
    | "Package"
    | "PackageOpen"
    | "Wand2"
    | "Backpack";
}

export const DICCIONARIO_CATEGORIAS_EQUIPO: Record<CategoriaEquipo, InfoCategoriaEquipo> = {
  "armas": {
    id: "armas",
    etiqueta: "Armas",
    descripcion: "Armas cuerpo a cuerpo, a distancia y de fuego (sencillas y marciales)",
    color: "#f87171",
    nombreIcono: "Swords"
  },
  "armaduras": {
    id: "armaduras",
    etiqueta: "Armaduras",
    descripcion: "Armaduras corporales (ligeras, medianas y pesadas)",
    color: "#60a5fa",
    nombreIcono: "Shield"
  },
  "escudos": {
    id: "escudos",
    etiqueta: "Escudos",
    descripcion: "Escudos protectores (+2 CA al equiparse)",
    color: "#38bdf8",
    nombreIcono: "Shield"
  },
  "herramientas": {
    id: "herramientas",
    etiqueta: "Herramientas",
    descripcion: "Herramientas de artesano, instrumentos musicales, sets de juego y útiles de ladrón",
    color: "#f59e0b",
    nombreIcono: "Wrench"
  },
  "focos-magicos": {
    id: "focos-magicos",
    etiqueta: "Focos Mágicos",
    descripcion: "Focos arcanos, focos druídicos y símbolos sagrados de lanzamiento",
    color: "#c084fc",
    nombreIcono: "Sparkles"
  },
  "consumibles": {
    id: "consumibles",
    etiqueta: "Consumibles",
    descripcion: "Pociones, elixires, raciones, venenos, pergaminos y consumibles de aventura",
    color: "#10b981",
    nombreIcono: "FlaskConical"
  },
  "municion": {
    id: "municion",
    etiqueta: "Munición",
    descripcion: "Flechas, virotes, balas de honda/arma de fuego y agujas",
    color: "#06b6d4",
    nombreIcono: "Crosshair"
  },
  "contenedores": {
    id: "contenedores",
    etiqueta: "Contenedores",
    descripcion: "Mochilas, carcajes, alforjas, cofres, barriles y bolsas",
    color: "#eab308",
    nombreIcono: "Package"
  },
  "paquetes-equipo": {
    id: "paquetes-equipo",
    etiqueta: "Paquetes de Equipo",
    descripcion: "Kits de equipo de aventurero con contenidos desempaquetables",
    color: "#a855f7",
    nombreIcono: "PackageOpen"
  },
  "objetos-magicos": {
    id: "objetos-magicos",
    etiqueta: "Objetos Mágicos",
    descripcion: "Objetos maravillosos, varas, anillos, artefactos y equipo imbuido",
    color: "#ec4899",
    nombreIcono: "Wand2"
  },
  "equipo-aventurero": {
    id: "equipo-aventurero",
    etiqueta: "Equipo de Aventuras",
    descripcion: "Útiles de exploración, iluminación, supervivencia, ropa y libros",
    color: "#94a3b8",
    nombreIcono: "Backpack"
  }
};

/**
 * Normaliza un texto eliminando tildes y caracteres diacríticos.
 */
function normalizarTextoSeguro(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Resuelve la CategoriaEquipo canónica y si el objeto es consumible
 * a partir de los datos crudos del compendio o de homebrew.
 */
export function resolverCategoriaDesdeSRD(item: Record<string, unknown>): {
  categoria: CategoriaEquipo;
  esConsumible: boolean;
} {
  const nombreNorm = normalizarTextoSeguro(String(item.name || item.nombre || ""));
  const subcatNorm = normalizarTextoSeguro(String(item.subcategoria || ""));
  const esVeneno = Boolean(item.esVeneno || item.tipoVeneno);

  // Extraer tokens de categorías en equipment_categories
  const tokensCat: string[] = [];
  if (Array.isArray(item.equipment_categories)) {
    for (const c of item.equipment_categories) {
      if (c && typeof c === "object") {
        const cObj = c as Record<string, unknown>;
        if (cObj.index) tokensCat.push(normalizarTextoSeguro(String(cObj.index)));
        if (cObj.name) tokensCat.push(normalizarTextoSeguro(String(cObj.name)));
      } else if (typeof c === "string") {
        tokensCat.push(normalizarTextoSeguro(c));
      }
    }
  } else if (item.equipment_category && typeof item.equipment_category === "object") {
    const ecObj = item.equipment_category as Record<string, unknown>;
    if (ecObj.index) tokensCat.push(normalizarTextoSeguro(String(ecObj.index)));
    if (ecObj.name) tokensCat.push(normalizarTextoSeguro(String(ecObj.name)));
  } else if (typeof item.categoria === "string") {
    tokensCat.push(normalizarTextoSeguro(item.categoria));
  }

  const tieneToken = (...palabras: string[]): boolean => {
    return tokensCat.some((t) => palabras.some((p) => t.includes(p)));
  };

  // 1. Escudos
  if (tieneToken("shield", "escudo") || nombreNorm === "escudo" || nombreNorm.includes("escudo")) {
    return { categoria: "escudos", esConsumible: false };
  }

  // 2. Armaduras corporales
  if (tieneToken("armor", "armadura") && !tieneToken("shield", "escudo")) {
    return { categoria: "armaduras", esConsumible: false };
  }

  // 3. Armas
  if (tieneToken("weapon", "arma") || item.weapon_category !== undefined || item.damage !== undefined) {
    return { categoria: "armas", esConsumible: false };
  }

  // 4. Munición
  if (tieneToken("ammunition", "municion")) {
    return { categoria: "municion", esConsumible: true };
  }

  // 5. Herramientas, instrumentos musicales, sets de juego
  if (
    tieneToken(
      "tools",
      "herramientas",
      "artisans-tools",
      "artesano",
      "musical-instruments",
      "instrumento",
      "gaming-sets",
      "juego",
      "other-tools"
    )
  ) {
    return { categoria: "herramientas", esConsumible: false };
  }

  // 6. Focos Mágicos y Símbolos Sagrados
  if (
    tieneToken("arcane-foci", "druidic-foci", "holy-symbols", "foco", "enfoque", "simbolo") ||
    nombreNorm.includes("foco") ||
    nombreNorm.includes("simbolo sagrado") ||
    nombreNorm.includes("bolsa de componentes") ||
    nombreNorm.includes("relicario") ||
    nombreNorm.includes("amuleto") ||
    nombreNorm.includes("emblema")
  ) {
    return { categoria: "focos-magicos", esConsumible: false };
  }

  // 7. Paquetes de equipo con contents
  if (tieneToken("equipment-packs", "paquete") || item.contents !== undefined) {
    return { categoria: "paquetes-equipo", esConsumible: false };
  }

  // 8. Contenedores físicos y almacenamiento
  if (
    item.storage !== undefined ||
    nombreNorm === "mochila" ||
    nombreNorm === "carcaj" ||
    nombreNorm === "cofre" ||
    nombreNorm === "barril" ||
    nombreNorm === "saco" ||
    nombreNorm === "bolsa" ||
    nombreNorm.includes("alforja") ||
    nombreNorm.includes("caja de virotes") ||
    nombreNorm.includes("bolsa de balas") ||
    nombreNorm.includes("cartuchera") ||
    nombreNorm.includes("estuche de agujas")
  ) {
    return { categoria: "contenedores", esConsumible: false };
  }

  // 9. Consumibles (pociones, venenos, pergaminos, raciones, ácido, etc.)
  if (
    subcatNorm.includes("consumible") ||
    esVeneno ||
    nombreNorm.includes("pocion") ||
    nombreNorm.includes("pocima") ||
    nombreNorm.includes("pergamino") ||
    nombreNorm.includes("veneno") ||
    nombreNorm.includes("antidoto") ||
    nombreNorm.includes("antitoxina") ||
    nombreNorm.includes("racion") ||
    nombreNorm.includes("agua bendita") ||
    nombreNorm.includes("fuego de alquimista") ||
    nombreNorm.includes("acido") ||
    nombreNorm.includes("abrojo") ||
    nombreNorm.includes("aceite")
  ) {
    return { categoria: "consumibles", esConsumible: true };
  }

  // 10. Objetos Mágicos
  if (
    Boolean(item.magic_item || item.esMagico) ||
    (item.rareza && item.rareza !== "Común" && item.rareza !== "comun") ||
    tieneToken("magic-item", "maravilloso", "wondrous")
  ) {
    return { categoria: "objetos-magicos", esConsumible: false };
  }

  // 11. Equipo de Aventurero general por defecto
  return { categoria: "equipo-aventurero", esConsumible: false };
}

/**
 * Catálogo canónico de subcategorías sugeridas por cada categoría de equipo (D&D 5.5e).
 */
export const SUBCATEGORIAS_POR_CATEGORIA: Record<
  CategoriaEquipo,
  readonly { valor: string; etiqueta: string }[]
> = {
  armas: [
    { valor: "Sencilla", etiqueta: "Arma Sencilla" },
    { valor: "Marcial", etiqueta: "Arma Marcial" },
    { valor: "De Fuego", etiqueta: "Arma de Fuego" }
  ],
  armaduras: [
    { valor: "Ligera", etiqueta: "Armadura Ligera" },
    { valor: "Mediana", etiqueta: "Armadura Mediana" },
    { valor: "Pesada", etiqueta: "Armadura Pesada" }
  ],
  escudos: [
    { valor: "Escudo", etiqueta: "Escudo Estándar" },
    { valor: "Pavés", etiqueta: "Pavés / Escudo Torre" },
    { valor: "Broquel", etiqueta: "Broquel" }
  ],
  herramientas: [
    { valor: "Herramientas de Artesano", etiqueta: "Herramientas de Artesano" },
    { valor: "Instrumento Musical", etiqueta: "Instrumento Musical" },
    { valor: "Kit de Juego", etiqueta: "Kit de Juego" },
    { valor: "Útiles de Ladrón", etiqueta: "Útiles de Ladrón" },
    { valor: "Kit de Navegación", etiqueta: "Kit de Navegación" },
    { valor: "Kit de Venenos", etiqueta: "Kit de Venenos" },
    { valor: "Kit de Disfraz", etiqueta: "Kit de Disfraz" },
    { valor: "Kit de Falsificación", etiqueta: "Kit de Falsificación" },
    { valor: "Kit de Herboristería", etiqueta: "Kit de Herboristería" }
  ],
  "focos-magicos": [
    { valor: "Foco Arcano", etiqueta: "Foco Arcano (Varita, Bastón, Orbe, Cristal)" },
    { valor: "Foco Druídico", etiqueta: "Foco Druídico (Muérdago, Tótem)" },
    { valor: "Símbolo Sagrado", etiqueta: "Símbolo Sagrado (Relicario, Emblema)" }
  ],
  consumibles: [
    { valor: "Poción", etiqueta: "Poción / Elixir" },
    { valor: "Pergamino", etiqueta: "Pergamino" },
    { valor: "Veneno", etiqueta: "Veneno" },
    { valor: "Munición Especial", etiqueta: "Munición Especial" },
    { valor: "Provisión", etiqueta: "Provisión / Ración" },
    { valor: "Consumible Mágico", etiqueta: "Consumible Mágico" }
  ],
  municion: [
    { valor: "Flechas", etiqueta: "Flechas" },
    { valor: "Virotes", etiqueta: "Virotes de Ballesta" },
    { valor: "Balas", etiqueta: "Balas de Honda / Arma de Fuego" },
    { valor: "Agujas", etiqueta: "Agujas de Cerbatana" }
  ],
  contenedores: [
    { valor: "Mochila", etiqueta: "Mochila" },
    { valor: "Carcaj", etiqueta: "Carcaj" },
    { valor: "Bolsa", etiqueta: "Bolsa / Saquito" },
    { valor: "Alforja", etiqueta: "Alforja" },
    { valor: "Cofre", etiqueta: "Cofre / Barril" },
    { valor: "Estuche", etiqueta: "Estuche (Agujas / Mapas)" }
  ],
  "paquetes-equipo": [
    { valor: "Paquete de Aventurero", etiqueta: "Paquete de Aventurero" },
    { valor: "Paquete de Explorador", etiqueta: "Paquete de Explorador" },
    { valor: "Paquete de Diplomático", etiqueta: "Paquete de Diplomático" },
    { valor: "Paquete de Sacerdote", etiqueta: "Paquete de Sacerdote" },
    { valor: "Paquete de Erudito", etiqueta: "Paquete de Erudito" },
    { valor: "Paquete Personalizado", etiqueta: "Paquete Personalizado" }
  ],
  "objetos-magicos": [
    { valor: "Objeto Maravilloso", etiqueta: "Objeto Maravilloso" },
    { valor: "Anillo", etiqueta: "Anillo Mágico" },
    { valor: "Vara", etiqueta: "Vara Mágica" },
    { valor: "Bastón", etiqueta: "Bastón Mágico" },
    { valor: "Amuleto", etiqueta: "Amuleto / Talismán" },
    { valor: "Artefacto", etiqueta: "Artefacto" }
  ],
  "equipo-aventurero": [
    { valor: "Equipo Estándar", etiqueta: "Equipo Estándar" },
    { valor: "Iluminación", etiqueta: "Iluminación (Antorcha, Linterna)" },
    { valor: "Cuerda y Escalada", etiqueta: "Cuerda y Escalada" },
    { valor: "Vestimenta", etiqueta: "Vestimenta y Ropa" },
    { valor: "Documento o Libro", etiqueta: "Documento o Libro" }
  ]
};

/**
 * Opciones preformateadas de categorías para selectores desplegables de UI.
 */
export const OPCIONES_CATEGORIAS_SELECTOR = CATEGORIAS_EQUIPO.map((cat) => {
  const info = DICCIONARIO_CATEGORIAS_EQUIPO[cat];
  return {
    valor: cat,
    etiqueta: info.etiqueta,
    color: info.color
  };
});
