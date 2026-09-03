import type { Habilidad, Caracteristica } from "@/tipos";

// ==========================================
// 1. DESCRIPCIONES DE CARACTERÍSTICAS Y SALVACIONES
// ==========================================

export const DESCRIPCIONES_CARACTERISTICAS: Record<Caracteristica, string> = {
  fuerza: "Resistir físicamente una fuerza directa.",
  destreza: "Esquivar una amenaza.",
  constitucion: "Resistir un peligro tóxico.",
  inteligencia: "Identificar una ilusión como falsa.",
  sabiduria: "Resistir una agresión mental.",
  carisma: "Reafirmar tu identidad."
};

// ==========================================
// 2. DESCRIPCIONES OFICIALES DE HABILIDADES (D&D 5.5e)
// ==========================================

export const DESCRIPCIONES_HABILIDADES: Record<Habilidad, string> = {
  acrobacias: "Conservar el equilibrio en situaciones difíciles o realizar una proeza acrobática.",
  atletismo: "Saltar más lejos de lo normal, mantenerse a flote en aguas revueltas o romper algo.",
  arcanos: "Recordar información acerca de conjuros, objetos mágicos y los planos de existencia.",
  engaño: "Contar una mentira convincente o llevar un disfraz de manera creíble.",
  historia: "Recordar información sobre acontecimientos, personas, naciones y culturas de carácter histórico.",
  perspicacia: "Discernir el estado de ánimo y las intenciones de una persona.",
  intimidacion: "Asustar o amenazar a alguien para que haga lo que tú quieres.",
  investigacion: "Encontrar información oculta en libros o deducir cómo funciona algo.",
  medicina: "Diagnosticar una enfermedad o determinar de qué ha muerto un fallecido reciente.",
  naturaleza: "Recordar información acerca del terreno, la flora, la fauna y el clima.",
  percepcion: "Mediante una combinación de sentidos, darse cuenta de algo que es fácil pasar por alto.",
  interpretacion: "Actuar, contar una historia, tocar un instrumento o bailar.",
  persuasion: "Convencer a alguien de algo de una manera sincera y amable.",
  religion: "Recordar información sobre dioses, rituales religiosos y símbolos sagrados.",
  juegoManos: "Vaciar los bolsillos a alguien, ocultar un objeto que llevas en la mano o hacer trucos de prestidigitación.",
  sigilo: "Pasar desapercibido al caminar en silencio y ocultarse detrás de las cosas.",
  supervivencia: "Seguir huellas, forrajear, encontrar un camino o evitar peligros naturales.",
  manejoAnimales: "Tranquilizar o adiestrar a un animal, o conseguir que se comporte de una determinada forma."
};

// ==========================================
// 3. DICCIONARIO CATEGORIZADO DE ARMAS (D&D 5.5e)
// ==========================================

export const ARMAS_SENCILLAS_CUERPO_A_CUERPO = [
  "Bastón",
  "Daga",
  "Garrote",
  "Garrote grande",
  "Hacha de mano",
  "Hoz",
  "Jabalina",
  "Lanza",
  "Martillo ligero",
  "Maza"
] as const;

export const ARMAS_SENCILLAS_A_DISTANCIA = [
  "Arco corto",
  "Ballesta ligera",
  "Dardo",
  "Honda"
] as const;

export const ARMAS_MARCIALES_CUERPO_A_CUERPO = [
  "Alabarda",
  "Cimitarra",
  "Espada corta",
  "Espada larga",
  "Espadón",
  "Estoque",
  "Guja",
  "Hacha a dos manos",
  "Hacha de guerra",
  "Lanza de caballería",
  "Látigo",
  "Lucero del alba",
  "Mangual",
  "Martillo de guerra",
  "Maza a dos manos",
  "Pica",
  "Pico de guerra",
  "Tridente"
] as const;

export const ARMAS_MARCIALES_A_DISTANCIA = [
  "Arco largo",
  "Ballesta de mano",
  "Ballesta pesada",
  "Cerbatana"
] as const;

export const ARMAS_DE_FUEGO = [
  "Mosquete (Arma de fuego)",
  "Pistola (Arma de fuego)"
] as const;

export const TODAS_ARMAS_SENCILLAS = [
  ...ARMAS_SENCILLAS_CUERPO_A_CUERPO,
  ...ARMAS_SENCILLAS_A_DISTANCIA
];

export const TODAS_ARMAS_MARCIALES = [
  ...ARMAS_MARCIALES_CUERPO_A_CUERPO,
  ...ARMAS_MARCIALES_A_DISTANCIA
];

export const COMPETENCIAS_COMBATE_ESPECIALES = [
  "Ataque desarmado",
  "Armas improvisadas"
] as const;

export const GRUPOS_ARMAS = [
  { id: "sencillas", etiqueta: "Todas las armas sencillas (simples)", armas: TODAS_ARMAS_SENCILLAS },
  { id: "marciales", etiqueta: "Todas las armas marciales", armas: TODAS_ARMAS_MARCIALES },
  { id: "fuego", etiqueta: "Armas de fuego", armas: ARMAS_DE_FUEGO }
];

// ==========================================
// 4. DICCIONARIO CATEGORIZADO DE ARMADURAS (D&D 5.5e)
// ==========================================

export const ARMADURAS_LIGERAS = [
  "Armadura acolchada",
  "Armadura de cuero",
  "Armadura de cuero tachonado"
] as const;

export const ARMADURAS_MEDIAS = [
  "Armadura de pieles",
  "Camisa de malla",
  "Cota de escamas",
  "Coraza",
  "Media armadura"
] as const;

export const ARMADURAS_PESADAS = [
  "Cota guarnecida",
  "Cota de malla",
  "Armadura de bandas",
  "Armadura de placas"
] as const;

export const ESCUDOS = [
  "Escudo"
] as const;

export const GRUPOS_ARMADURAS = [
  { id: "ligeras", etiqueta: "Todas las armaduras ligeras", armaduras: ARMADURAS_LIGERAS },
  { id: "medias", etiqueta: "Todas las armaduras medias", armaduras: ARMADURAS_MEDIAS },
  { id: "pesadas", etiqueta: "Todas las armaduras pesadas", armaduras: ARMADURAS_PESADAS },
  { id: "escudos", etiqueta: "Escudos", armaduras: ESCUDOS }
];

// ==========================================
// 5. DICCIONARIO CATEGORIZADO DE IDIOMAS (D&D 5.5e)
// ==========================================

export const IDIOMAS_ESTANDAR = [
  "Común",
  "Dracónico",
  "Elfo",
  "Enano",
  "Gigante",
  "Gnomo",
  "Goblin",
  "Lengua de signos común",
  "Mediano",
  "Orco"
] as const;

export const IDIOMAS_INUSUALES = [
  "Abisal",
  "Infracomún",
  "Celestial",
  "Jerga de ladrones",
  "Druídico",
  "Primordial",
  "Habla de las profundidades",
  "Silvano",
  "Infernal"
] as const;

// ==========================================
// 6. DICCIONARIO CATEGORIZADO DE HERRAMIENTAS (D&D 5.5e)
// ==========================================

export const HERRAMIENTAS_ARTESANO = [
  "Herramientas de albañil",
  "Herramientas de alfarero",
  "Herramientas de carpintero",
  "Herramientas de cartógrafo",
  "Herramientas de curtidor",
  "Herramientas de ebanista",
  "Herramientas de herrero",
  "Herramientas de joyero",
  "Herramientas de manitas",
  "Herramientas de soplador de vidrio",
  "Herramientas de tejedor",
  "Herramientas de zapatero",
  "Suministros de alquimista",
  "Suministros de calígrafo",
  "Suministros de cervecero",
  "Suministros de pintor",
  "Útiles de cocinero"
] as const;

export const OTRAS_HERRAMIENTAS = [
  "Herramientas de ladrón",
  "Herramientas de navegante",
  "Útiles de envenenador",
  "Útiles de herborista",
  "Útiles para disfrazarse",
  "Útiles para falsificar"
] as const;

export const INSTRUMENTOS_MUSICALES = [
  "Chirimía",
  "Cuerno",
  "Dulcémele",
  "Flauta",
  "Flauta de pan",
  "Gaita",
  "Laúd",
  "Lira",
  "Tambor",
  "Viola"
] as const;

export const JUEGOS_MESA = [
  "Ajedrez dragón",
  "Apuesta de los tres dragones",
  "Dados",
  "Naipes"
] as const;

// ==========================================
// 7. FUNCIONES PURAS DE FORMATEO Y VINCULACIÓN
// ==========================================

/**
 * Genera un texto resumen legible de armas a partir de los grupos y armas individuales seleccionadas.
 */
export function formatearResumenCompetenciasArmas(
  grupos: string[] = [],
  individuales: string[] = []
): string {
  const partes: string[] = [];

  if (grupos.includes("sencillas")) {
    partes.push("Armas sencillas");
  }
  if (grupos.includes("marciales")) {
    partes.push("Armas marciales");
  }
  if (grupos.includes("fuego")) {
    partes.push("Armas de fuego");
  }

  // Agregar armas individuales que no pertenezcan a los grupos ya seleccionados
  const armasFiltradas = individuales.filter((arma) => {
    if (grupos.includes("sencillas") && (TODAS_ARMAS_SENCILLAS as readonly string[]).includes(arma)) {
      return false;
    }
    if (grupos.includes("marciales") && (TODAS_ARMAS_MARCIALES as readonly string[]).includes(arma)) {
      return false;
    }
    if (grupos.includes("fuego") && (ARMAS_DE_FUEGO as readonly string[]).includes(arma)) {
      return false;
    }
    return true;
  });

  partes.push(...armasFiltradas);

  return partes.length > 0 ? partes.join(", ") : "Ninguna";
}

/**
 * Genera un texto resumen legible de armaduras a partir de los grupos y armaduras individuales seleccionadas.
 */
export function formatearResumenCompetenciasArmaduras(
  grupos: string[] = [],
  individuales: string[] = []
): string {
  const partes: string[] = [];

  if (grupos.includes("ligeras")) {
    partes.push("Armaduras ligeras");
  }
  if (grupos.includes("medias")) {
    partes.push("Armaduras medias");
  }
  if (grupos.includes("pesadas")) {
    partes.push("Armaduras pesadas");
  }
  if (grupos.includes("escudos")) {
    partes.push("Escudos");
  }

  const armadurasFiltradas = individuales.filter((armadura) => {
    if (grupos.includes("ligeras") && (ARMADURAS_LIGERAS as readonly string[]).includes(armadura)) {
      return false;
    }
    if (grupos.includes("medias") && (ARMADURAS_MEDIAS as readonly string[]).includes(armadura)) {
      return false;
    }
    if (grupos.includes("pesadas") && (ARMADURAS_PESADAS as readonly string[]).includes(armadura)) {
      return false;
    }
    if (grupos.includes("escudos") && (ESCUDOS as readonly string[]).includes(armadura)) {
      return false;
    }
    return true;
  });

  partes.push(...armadurasFiltradas);

  return partes.length > 0 ? partes.join(", ") : "Ninguna";
}

/**
 * Comprueba si un personaje es competente con un arma específica (por nombre o por grupo de subcategoría).
 */
export function esCompetenteConArma(
  nombreArma: string,
  subcategoria: "Sencilla" | "Marcial" | "De Fuego" | string,
  gruposCompetencias: string[] = [],
  listaIndividual: string[] = []
): boolean {
  const subNormalizada = subcategoria?.toLowerCase().trim() || "";

  const tieneGrupoSencillas = gruposCompetencias.some((g) => {
    const gn = g.toLowerCase();
    return gn === "sencillas" || gn.includes("sencill") || gn.includes("simple");
  });
  if (subNormalizada.includes("sencilla") && tieneGrupoSencillas) {
    return true;
  }

  const tieneGrupoMarciales = gruposCompetencias.some((g) => {
    const gn = g.toLowerCase();
    return gn === "marciales" || gn.includes("marcial");
  });
  if (subNormalizada.includes("marcial") && tieneGrupoMarciales) {
    return true;
  }

  const tieneGrupoFuego = gruposCompetencias.some((g) => {
    const gn = g.toLowerCase();
    return gn === "fuego" || gn.includes("fuego") || gn.includes("firearm");
  });
  if ((subNormalizada.includes("fuego") || subNormalizada.includes("firearm")) && tieneGrupoFuego) {
    return true;
  }

  const nombreLimpio = nombreArma.toLowerCase().trim();

  // Detección tolerante de combate desarmado y armas improvisadas
  const esDesarmado = nombreLimpio.includes("desarmado") || nombreLimpio.includes("sin armas") || nombreLimpio.includes("unarmed");
  if (esDesarmado) {
    return listaIndividual.some((arma) => {
      const a = arma.toLowerCase().trim();
      return a.includes("desarmado") || a.includes("sin armas") || a.includes("unarmed");
    });
  }

  const esImprovisada = nombreLimpio.includes("improvisad") || subNormalizada.includes("improvisad");
  if (esImprovisada) {
    return listaIndividual.some((arma) => {
      const a = arma.toLowerCase().trim();
      return a.includes("improvisad");
    });
  }

  return listaIndividual.some((arma) => arma.toLowerCase().trim() === nombreLimpio);
}

/**
 * Comprueba si un personaje es competente con una armadura específica (por nombre o por categoría).
 */
export function esCompetenteConArmadura(
  nombreArmadura: string,
  subcategoria: "Ligera" | "Mediana" | "Pesada" | "Escudo" | string,
  gruposCompetencias: string[] = [],
  listaIndividual: string[] = []
): boolean {
  const subNormalizada = subcategoria?.toLowerCase().trim() || "";

  const tieneLigeras = gruposCompetencias.some((g) => {
    const gn = g.toLowerCase();
    return gn === "ligeras" || gn.includes("liger");
  });
  if (subNormalizada.includes("ligera") && tieneLigeras) {
    return true;
  }

  const tieneMedias = gruposCompetencias.some((g) => {
    const gn = g.toLowerCase();
    return gn === "medias" || gn.includes("mediana") || gn.includes("media");
  });
  if ((subNormalizada.includes("mediana") || subNormalizada.includes("media")) && tieneMedias) {
    return true;
  }

  const tienePesadas = gruposCompetencias.some((g) => {
    const gn = g.toLowerCase();
    return gn === "pesadas" || gn.includes("pesad");
  });
  if (subNormalizada.includes("pesada") && tienePesadas) {
    return true;
  }

  const tieneEscudos = gruposCompetencias.some((g) => {
    const gn = g.toLowerCase();
    return gn === "escudos" || gn.includes("escudo");
  });
  if (subNormalizada.includes("escudo") && tieneEscudos) {
    return true;
  }

  const nombreLimpio = nombreArmadura.toLowerCase().trim();
  return listaIndividual.some((arm) => arm.toLowerCase().trim() === nombreLimpio);
}

/**
 * Resuelve y sincroniza las competencias de armas y armaduras procedentes de una clase o build
 * mapeando cadenas canónicas a los IDs de grupo oficiales y poblando sus listas individuales.
 */
export function resolverGruposYSustitutosCompetencias(
  armasRaw: string[] = [],
  armadurasRaw: string[] = []
): {
  competenciasArmasGrupos: ("sencillas" | "marciales" | "fuego")[];
  competenciasArmasLista: string[];
  competenciasArmas: string;
  competenciasArmadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
  competenciasArmadurasLista: string[];
  competenciasArmaduras: string;
} {
  const gruposArmasSet = new Set<"sencillas" | "marciales" | "fuego">();
  const armasListaSet = new Set<string>();

  for (const item of armasRaw) {
    const norm = item.toLowerCase().trim();
    if (norm.includes("sencill") || norm.includes("simple")) {
      gruposArmasSet.add("sencillas");
      TODAS_ARMAS_SENCILLAS.forEach((a) => armasListaSet.add(a));
    } else if (norm.includes("marcial")) {
      gruposArmasSet.add("marciales");
      TODAS_ARMAS_MARCIALES.forEach((a) => armasListaSet.add(a));
    } else if (norm.includes("fuego") || norm.includes("firearm")) {
      gruposArmasSet.add("fuego");
      ARMAS_DE_FUEGO.forEach((a) => armasListaSet.add(a));
    } else if (norm) {
      armasListaSet.add(item.trim());
    }
  }

  const gruposArmadurasSet = new Set<"ligeras" | "medias" | "pesadas" | "escudos">();
  const armadurasListaSet = new Set<string>();

  for (const item of armadurasRaw) {
    const norm = item.toLowerCase().trim();
    if (norm.includes("liger")) {
      gruposArmadurasSet.add("ligeras");
      ARMADURAS_LIGERAS.forEach((a) => armadurasListaSet.add(a));
    } else if (norm.includes("mediana") || norm.includes("media")) {
      gruposArmadurasSet.add("medias");
      ARMADURAS_MEDIAS.forEach((a) => armadurasListaSet.add(a));
    } else if (norm.includes("pesad")) {
      gruposArmadurasSet.add("pesadas");
      ARMADURAS_PESADAS.forEach((a) => armadurasListaSet.add(a));
    } else if (norm.includes("escudo")) {
      gruposArmadurasSet.add("escudos");
      ESCUDOS.forEach((a) => armadurasListaSet.add(a));
    } else if (norm) {
      armadurasListaSet.add(item.trim());
    }
  }

  const competenciasArmasGrupos = Array.from(gruposArmasSet);
  const competenciasArmasLista = Array.from(armasListaSet);
  const competenciasArmadurasGrupos = Array.from(gruposArmadurasSet);
  const competenciasArmadurasLista = Array.from(armadurasListaSet);

  return {
    competenciasArmasGrupos,
    competenciasArmasLista,
    competenciasArmas: formatearResumenCompetenciasArmas(competenciasArmasGrupos, competenciasArmasLista),
    competenciasArmadurasGrupos,
    competenciasArmadurasLista,
    competenciasArmaduras: formatearResumenCompetenciasArmaduras(competenciasArmadurasGrupos, competenciasArmadurasLista)
  };
}
