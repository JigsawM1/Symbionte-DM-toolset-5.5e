import type { ObjetoInventario, ObjetoJuego, TipoContenedor } from "@/tipos";

export type TipoMunicion =
  | "flechas"
  | "virotes"
  | "balas_honda"
  | "balas_fuego"
  | "agujas"
  | "generica";

export interface ReglaArmaMunicion {
  tipoMunicion: TipoMunicion;
  nombreMunicionEsperada: string;
  nombreContenedorRecomendado: string;
  patronesArma: string[];
  patronesMunicion: string[];
  patronesExclusionMunicion?: string[];
}

/** Patrones e identificadores inequívocos de Contenedores de Munición que NUNCA deben contarse como proyectiles consumibles */
export const PATRONES_CONTENEDORES_MUNICION = [
  "carcaj",
  "quiver",
  "aljaba",
  "caja de virotes",
  "caja de virote",
  "bolt case",
  "crossbow bolt case",
  "crossbow-bolt-case",
  "case-crossbow-bolt",
  "estuche de virotes",
  "funda de virotes",
  "bolsa de balas",
  "bullet pouch",
  "bullet-pouch",
  "estuche de agujas",
  "needle case",
  "needle-case",
  "cartridge-pouch",
  "cartuchera",
  "frasco de polvora",
  "cuerno de polvora",
  "powder horn",
  "bolsita",
  "bolsa",
  "pouch"
];

/**
 * Determina de forma estricta si un objeto es un Contenedor Físico de Munición (no munición consumible).
 */
export function esContenedorFisicoMunicion(nombreOId: string): boolean {
  const norm = normalizarTexto(nombreOId);
  return PATRONES_CONTENEDORES_MUNICION.some((patron) =>
    norm.includes(normalizarTexto(patron)) || norm === normalizarTexto(patron)
  );
}

export const REGLAS_MUNICION: ReglaArmaMunicion[] = [
  {
    tipoMunicion: "flechas",
    nombreMunicionEsperada: "Flechas",
    nombreContenedorRecomendado: "Carcaj",
    patronesArma: ["arco", "longbow", "shortbow", "arco corto", "arco largo"],
    patronesMunicion: ["flecha", "arrow", "flechas"],
    patronesExclusionMunicion: ["carcaj", "quiver", "aljaba", "virote", "bala", "aguja", "case", "estuche"]
  },
  {
    tipoMunicion: "virotes",
    nombreMunicionEsperada: "Virotes",
    nombreContenedorRecomendado: "Caja de Virotes de Ballesta",
    patronesArma: ["ballesta", "crossbow", "ballesta ligera", "ballesta pesada", "ballesta de mano"],
    patronesMunicion: ["virote", "bolt", "virotes"],
    patronesExclusionMunicion: ["caja", "case", "estuche", "funda", "carcaj", "flecha", "bala", "aguja"]
  },
  {
    tipoMunicion: "balas_honda",
    nombreMunicionEsperada: "Balas de Honda",
    nombreContenedorRecomendado: "Bolsa de Balas",
    patronesArma: ["honda", "sling"],
    patronesMunicion: ["balas, honda", "bala de honda", "balas de honda", "sling bullet", "bala, honda"],
    patronesExclusionMunicion: ["bolsa", "pouch", "bolsita", "fuego", "arma de fuego", "flecha", "virote", "aguja"]
  },
  {
    tipoMunicion: "balas_fuego",
    nombreMunicionEsperada: "Balas de Arma de Fuego",
    nombreContenedorRecomendado: "Cartuchera",
    patronesArma: ["pistola", "mosquete", "rifle", "trabuco", "pistol", "musket", "firearm", "arma de fuego"],
    patronesMunicion: ["balas, arma de fuego", "bala de arma de fuego", "balas de pistola", "balas de mosquete", "bullet, firearm"],
    patronesExclusionMunicion: ["frasco", "cuerno", "cartuchera", "powder horn", "bolsa", "pouch", "bolsita", "honda", "flecha", "virote", "aguja"]
  },
  {
    tipoMunicion: "agujas",
    nombreMunicionEsperada: "Agujas de Cerbatana",
    nombreContenedorRecomendado: "Estuche de Agujas",
    patronesArma: ["cerbatana", "blowgun"],
    patronesMunicion: ["aguja", "agujas", "needle", "blowgun needle"],
    patronesExclusionMunicion: ["estuche", "case", "bolsa", "pouch", "bolsita", "carcaj", "quiver", "flecha", "virote", "bala"]
  }
];

/** Capacidad máxima oficial por unidad de contenedor de munición según reglas D&D 5.5e / 5e */
export const CAPACIDADES_CONTENEDORES_MUNICION: Record<string, { capacidadMaxima: number; nombre: string }> = {
  "quiver": { capacidadMaxima: 20, nombre: "Carcaj" },
  "carcaj": { capacidadMaxima: 20, nombre: "Carcaj" },
  "aljaba": { capacidadMaxima: 20, nombre: "Carcaj" },
  "crossbow-bolt-case": { capacidadMaxima: 20, nombre: "Caja de Virotes de Ballesta" },
  "case-crossbow-bolt": { capacidadMaxima: 20, nombre: "Caja de Virotes de Ballesta" },
  "caja de virotes de ballesta": { capacidadMaxima: 20, nombre: "Caja de Virotes de Ballesta" },
  "caja de virotes": { capacidadMaxima: 20, nombre: "Caja de Virotes de Ballesta" },
  "estuche de virotes": { capacidadMaxima: 20, nombre: "Caja de Virotes de Ballesta" },
  "bullet-pouch": { capacidadMaxima: 20, nombre: "Bolsa de Balas" },
  "bolsa de balas": { capacidadMaxima: 20, nombre: "Bolsa de Balas" },
  "bullet pouch": { capacidadMaxima: 20, nombre: "Bolsa de Balas" },
  "needle-case": { capacidadMaxima: 50, nombre: "Estuche de Agujas" },
  "estuche de agujas": { capacidadMaxima: 50, nombre: "Estuche de Agujas" },
  "cartridge-pouch": { capacidadMaxima: 20, nombre: "Cartuchera" },
  "cartuchera": { capacidadMaxima: 20, nombre: "Cartuchera" },
  "pouch": { capacidadMaxima: 20, nombre: "Bolsita" },
  "bolsita": { capacidadMaxima: 20, nombre: "Bolsita" },
  "bolsa": { capacidadMaxima: 20, nombre: "Bolsita" },
  "frasco de polvora": { capacidadMaxima: 20, nombre: "Frasco de Pólvora" },
  "cuerno de polvora": { capacidadMaxima: 20, nombre: "Cuerno de Pólvora" }
};

export interface EstadoMunicionArma {
  requiereMunicion: boolean;
  tipoMunicionEsperada?: TipoMunicion;
  nombreMunicionEsperada?: string;
  nombreContenedorRecomendado?: string;
  /** Cantidad lista y utilizable por el lanzador de ataques (solo la que está en contenedor activo) */
  municionDisponibleCantidad: number;
  /** Items compatibles que están activos en contenedor listo para disparar */
  itemsCompatibles: ObjetoInventario[];
  itemPrincipal?: ObjetoInventario;
  tieneContenedorEnInventario: boolean;
  nombreContenedorDetectado?: string;
  municionEnContenedor: number;
  municionSueltEnMochila: number;
  municionEnCompartimentosExternos: number;
  municionTotalGlobal: number;
  capacidadContenedoresTotal: number;
  puedeDisparar: boolean;
  motivoBloqueo?: string;
}

export interface InfoAlmacenamientoMunicion {
  nombreContenedor: string;
  tieneContenedor: boolean;
  cantidadContenedores: number;
  capacidadUnitaria: number;
  capacidadTotal: number;
  almacenadasEnContenedor: number;
  sueltasEnMochila: number;
  enCompartimentoExterno: number;
  ubicacionContenedor: TipoContenedor;
  totalMunicion: number;
  estaLleno: boolean;
  estaEnMochila: boolean;
}

export interface InfoContenedorFisico {
  esContenedorMunicion: boolean;
  nombreContenedor: string;
  capacidadUnitaria: number;
  capacidadTotal: number;
  cantidadContenedores: number;
  tipoProyectil: string;
  totalAlmacenado: number;
  totalInventarioMochila: number;
  totalInventarioExterno: number;
  estaLleno: boolean;
  estaEnMochila: boolean;
}

/**
 * Normaliza un string eliminando acentos y espacios extra para comparaciones robustas.
 */
export function normalizarTexto(texto: string): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Comprueba si un objeto está llevado encima en la mochila/cuerpo (no en bolsa de contención, montura o almacén).
 */
export function esItemEnMochila(item: ObjetoInventario): boolean {
  const contenedor = item.contenedor || "mochila";
  return contenedor === "mochila";
}

/**
 * Obtiene la capacidad oficial de un contenedor por su nombre o índice, ajustando según el tipo de munición alojada.
 */
export function obtenerCapacidadContenedor(nombreOIndex: string, tipoMunicion?: TipoMunicion): number {
  const norm = normalizarTexto(nombreOIndex);

  if (tipoMunicion === "agujas" && (norm.includes("bols") || norm.includes("pouch") || norm.includes("estuche") || norm.includes("needle"))) {
    return 50; // Capacidad oficial de 50 agujas de cerbatana en una Bolsita o Estuche de Agujas
  }

  for (const [clave, config] of Object.entries(CAPACIDADES_CONTENEDORES_MUNICION)) {
    if (norm.includes(normalizarTexto(clave)) || norm.includes(normalizarTexto(config.nombre)) || norm === normalizarTexto(clave)) {
      return config.capacidadMaxima;
    }
  }
  return 20; // Fallback estándar D&D
}

/**
 * Obtiene la regla de munición asociada a un nombre de arma o propiedades.
 */
export function obtenerReglaMunicion(
  nombreArma: string,
  propiedades: string[] = []
): ReglaArmaMunicion | null {
  const nombreNorm = normalizarTexto(nombreArma);
  const propsNorm = propiedades.map(normalizarTexto);

  const esArmaMunicion =
    propsNorm.some((p) => p.includes("municion") || p.includes("ammunition"));

  for (const regla of REGLAS_MUNICION) {
    const coincideArma = regla.patronesArma.some((patron) =>
      nombreNorm.includes(normalizarTexto(patron))
    );
    if (coincideArma) {
      return regla;
    }
  }

  if (esArmaMunicion) {
    // Fallback a flechas si tiene la propiedad munición
    return REGLAS_MUNICION[0];
  }

  return null;
}

/**
 * Comprueba si un objeto de inventario es munición compatible con un arma específica,
 * priorizando el campo relacional `ammunition` del compendio cuando está presente.
 * REGLA FUNDAMENTAL: Los contenedores (Carcaj, Caja de Virotes, Bolsa de Balas, Bolsita, Estuche de Agujas, Cartuchera) NUNCA son munición consumible.
 */
export function esMunicionCompatibleConArma(
  nombreArma: string,
  itemInventario: ObjetoInventario,
  propiedadesArma: string[] = [],
  baseDatosCompendio?: ObjetoJuego[]
): boolean {
  const nomArmaNorm = normalizarTexto(nombreArma);
  const nomItemNorm = normalizarTexto(itemInventario.nombre);
  const idItemNorm = normalizarTexto(itemInventario.idObjeto || "");

  // 0. EXCLUSIÓN ABSOLUTA: Si el objeto es un contenedor físico de munición, JAMÁS es munición consumible
  if (esContenedorFisicoMunicion(nomItemNorm) || esContenedorFisicoMunicion(idItemNorm)) {
    return false;
  }

  // 1. Prioridad: campo estructurado `ammunition` del compendio
  if (baseDatosCompendio && baseDatosCompendio.length > 0) {
    const armaComp = baseDatosCompendio.find(
      (o) => o.id === nombreArma || normalizarTexto(o.nombre) === nomArmaNorm
    );

    if (armaComp?.ammunition) {
      const targetIndex = normalizarTexto(armaComp.ammunition.index);
      const targetName = normalizarTexto(armaComp.ammunition.name);

      if (
        (itemInventario.idObjeto && idItemNorm === targetIndex) ||
        nomItemNorm === targetName
      ) {
        return true;
      }

      const itemComp = baseDatosCompendio.find(
        (o) => o.id === itemInventario.idObjeto || normalizarTexto(o.nombre) === nomItemNorm
      );
      if (itemComp && (normalizarTexto(itemComp.id) === targetIndex || normalizarTexto(itemComp.nombre) === targetName)) {
        return true;
      }

      return false;
    }
  }

  // 2. Fallback por reglas heurísticas de compatibilidad
  const regla = obtenerReglaMunicion(nombreArma, propiedadesArma);
  if (!regla) return false;

  if (regla.patronesExclusionMunicion) {
    const tieneExclusion = regla.patronesExclusionMunicion.some((excl) =>
      nomItemNorm.includes(normalizarTexto(excl))
    );
    if (tieneExclusion) {
      return false;
    }
  }

  return regla.patronesMunicion.some((patron) =>
    nomItemNorm.includes(normalizarTexto(patron))
  );
}

/**
 * Detecta si el personaje posee el contenedor adecuado para la munición del arma LLEVADO ENCIMA (en la mochila).
 * Incluye resolución de contención no conflictiva cuando múltiples tipos de munición comparten Bolsitas genéricas.
 */
export function detectarContenedorMunicion(
  tipoMunicion: TipoMunicion,
  inventario: ObjetoInventario[],
  itemMunicionCompendio?: ObjetoJuego,
  soloLlevadoEncima: boolean = true
): { tieneContenedor: boolean; nombreContenedor?: string; cantidadContenedores: number; capacidadTotal: number; estaEnMochila: boolean } {
  const inv = inventario || [];
  const itemsFiltrados = soloLlevadoEncima ? inv.filter(esItemEnMochila) : inv;

  // 0. Prioridad: campo estructurado `storage` directo del objeto de munición si es contenedor específico
  if (itemMunicionCompendio?.storage) {
    const targetStorageIndex = normalizarTexto(itemMunicionCompendio.storage.index);
    const targetStorageName = normalizarTexto(itemMunicionCompendio.storage.name);

    const esGenerico = targetStorageIndex === "pouch" || targetStorageName === "bolsita" || targetStorageName === "bolsa";
    if (!esGenerico) {
      const itemsContenedorStorage = itemsFiltrados.filter((item) => {
        const nomNorm = normalizarTexto(item.nombre);
        const idNorm = normalizarTexto(item.idObjeto || "");
        return (
          idNorm === targetStorageIndex ||
          nomNorm === targetStorageName ||
          nomNorm.includes(targetStorageName)
        );
      });

      if (itemsContenedorStorage.length > 0) {
        const cantidadTotal = itemsContenedorStorage.reduce((acc, it) => acc + (Math.max(1, it.cantidad) || 1), 0);
        const capacidadUnitaria = obtenerCapacidadContenedor(targetStorageIndex || targetStorageName, tipoMunicion);
        return {
          tieneContenedor: true,
          nombreContenedor: itemsContenedorStorage[0].nombre,
          cantidadContenedores: cantidadTotal,
          capacidadTotal: cantidadTotal * capacidadUnitaria,
          estaEnMochila: true
        };
      }
    }
  }

  // 1. Prioridad: Contenedores Dedicados Específicos
  // (ej. "Bolsa de Balas", "Estuche de Agujas", "Cartuchera", "Frasco de Pólvora", "Carcaj", "Caja de Virotes")
  const patronesDedicadosPorTipo: Record<TipoMunicion, string[]> = {
    flechas: ["carcaj", "quiver", "porta flechas", "aljaba"],
    virotes: ["caja de virotes", "bolt case", "case-crossbow-bolt", "caja de virotes de ballesta", "estuche de virotes"],
    balas_honda: ["bolsa de balas", "bullet pouch", "bullet-pouch"],
    balas_fuego: ["cartuchera", "cartridge-pouch", "frasco de polvora", "cuerno de polvora", "powder horn"],
    agujas: ["estuche de agujas", "needle case", "needle-case"],
    generica: []
  };

  const patronesDedicados = patronesDedicadosPorTipo[tipoMunicion] || [];
  const contenedoresDedicados = itemsFiltrados.filter((item) => {
    const nomNorm = normalizarTexto(item.nombre);
    const idNorm = normalizarTexto(item.idObjeto || "");
    return patronesDedicados.some((pat) => nomNorm.includes(normalizarTexto(pat)) || idNorm.includes(normalizarTexto(pat)));
  });

  if (contenedoresDedicados.length > 0) {
    const cantidadTotal = contenedoresDedicados.reduce((acc, it) => acc + (Math.max(1, it.cantidad) || 1), 0);
    const capacidadUnitaria = obtenerCapacidadContenedor(contenedoresDedicados[0].nombre, tipoMunicion);
    return {
      tieneContenedor: true,
      nombreContenedor: contenedoresDedicados[0].nombre,
      cantidadContenedores: cantidadTotal,
      capacidadTotal: cantidadTotal * capacidadUnitaria,
      estaEnMochila: true
    };
  }

  // 2. Si no hay contenedor dedicado, buscar Bolsitas Genéricas ("Bolsita", "Bolsa", "Pouch")
  const esMunicionAptaParaBolsita = tipoMunicion === "agujas" || tipoMunicion === "balas_honda" || tipoMunicion === "balas_fuego" || tipoMunicion === "generica";
  if (!esMunicionAptaParaBolsita) {
    return { tieneContenedor: false, cantidadContenedores: 0, capacidadTotal: 0, estaEnMochila: false };
  }

  const bolsitasGenericas = itemsFiltrados.filter((item) => {
    const nomNorm = normalizarTexto(item.nombre);
    const idNorm = normalizarTexto(item.idObjeto || "");
    const esDedicadoOtro = [
      "carcaj", "quiver", "caja de virotes", "bolt case", "case-crossbow-bolt", "bolsa de balas", "bullet pouch",
      "bullet-pouch", "estuche de agujas", "needle case", "needle-case", "frasco de polvora", "cuerno de polvora",
      "cartuchera", "cartridge-pouch"
    ].some((d) => nomNorm.includes(d) || idNorm.includes(d));

    if (esDedicadoOtro) return false;
    return nomNorm.includes("bolsita") || nomNorm.includes("bolsa") || nomNorm.includes("pouch") || idNorm === "pouch";
  });

  if (bolsitasGenericas.length === 0) {
    return { tieneContenedor: false, cantidadContenedores: 0, capacidadTotal: 0, estaEnMochila: false };
  }

  // Número total de Bolsitas genéricas físicas que tiene el personaje
  const totalBolsitasFisicas = bolsitasGenericas.reduce((acc, it) => acc + (Math.max(1, it.cantidad) || 1), 0);

  // Resolver partición ordenada de bolsitas entre los tipos de munición presentes en la mochila
  const tiposCompatiblesOrden: TipoMunicion[] = ["agujas", "balas_honda", "balas_fuego"];
  let bolsitasDisponiblesRestantes = totalBolsitasFisicas;
  let bolsitasAsignadasAEsteTipo = 0;

  for (const t of tiposCompatiblesOrden) {
    if (bolsitasDisponiblesRestantes <= 0) break;

    // Buscar si hay ítems de este tipo en la mochila (y que no tengan contenedor dedicado)
    const itemsDeEsteTipo = itemsFiltrados.filter((it) => {
      if (esContenedorFisicoMunicion(it.nombre)) return false;
      const n = normalizarTexto(it.nombre);
      if (t === "agujas") return n.includes("aguja") || n.includes("needle");
      if (t === "balas_honda") return (n.includes("bala") && n.includes("honda")) || n === "balas, honda";
      if (t === "balas_fuego") return n.includes("bala") && (n.includes("fuego") || n.includes("pistola") || n.includes("mosquete"));
      return false;
    });

    const cantidadMunicionEsteTipo = itemsDeEsteTipo.reduce((acc, it) => acc + (Math.max(0, it.cantidad) || 0), 0);
    if (cantidadMunicionEsteTipo > 0) {
      const capPorBolsa = obtenerCapacidadContenedor("Bolsita", t);
      const bolsasNecesarias = Math.max(1, Math.ceil(cantidadMunicionEsteTipo / capPorBolsa));
      const bolsasTomadas = Math.min(bolsitasDisponiblesRestantes, bolsasNecesarias);

      if (t === tipoMunicion) {
        bolsitasAsignadasAEsteTipo = bolsasTomadas;
        break;
      } else {
        bolsitasDisponiblesRestantes -= bolsasTomadas;
      }
    } else if (t === tipoMunicion) {
      bolsitasAsignadasAEsteTipo = bolsitasDisponiblesRestantes;
      break;
    }
  }

  if (bolsitasAsignadasAEsteTipo > 0) {
    const capUnitaria = obtenerCapacidadContenedor(bolsitasGenericas[0].nombre, tipoMunicion);
    return {
      tieneContenedor: true,
      nombreContenedor: bolsitasGenericas[0].nombre,
      cantidadContenedores: bolsitasAsignadasAEsteTipo,
      capacidadTotal: bolsitasAsignadasAEsteTipo * capUnitaria,
      estaEnMochila: true
    };
  }

  return { tieneContenedor: false, cantidadContenedores: 0, capacidadTotal: 0, estaEnMochila: false };
}

/**
 * Calcula el estado detallado de almacenamiento de una munición en relación con los contenedores disponibles.
 * - Los propios contenedores (Carcaj, Caja de Virotes, Bolsa de Balas, Bolsita, Estuche de Agujas, Cartuchera) NUNCA son tratados como munición.
 * - Si las flechas/agujas están en la montura/bolsa de contención, NO se guardan en el contenedor ni lo rellenan automáticamente.
 */
export function calcularAlmacenamientoMunicion(
  itemMunicion: ObjetoInventario,
  inventario: ObjetoInventario[],
  itemMunicionComp?: ObjetoJuego
): InfoAlmacenamientoMunicion | null {
  const nomNorm = normalizarTexto(itemMunicion.nombre);
  const idNorm = normalizarTexto(itemMunicion.idObjeto || "");

  // Si este ítem es un contenedor físico, no es una munición
  if (esContenedorFisicoMunicion(nomNorm) || esContenedorFisicoMunicion(idNorm)) {
    return null;
  }

  let tipoMunicion: TipoMunicion = "generica";

  if (nomNorm.includes("flecha") || nomNorm.includes("arrow")) tipoMunicion = "flechas";
  else if (nomNorm.includes("virote") || nomNorm.includes("bolt")) tipoMunicion = "virotes";
  else if (nomNorm.includes("bala") && nomNorm.includes("honda")) tipoMunicion = "balas_honda";
  else if (nomNorm.includes("bala") && (nomNorm.includes("fuego") || nomNorm.includes("pistola") || nomNorm.includes("mosquete"))) tipoMunicion = "balas_fuego";
  else if (nomNorm.includes("aguja") || nomNorm.includes("needle")) tipoMunicion = "agujas";
  else if (!itemMunicionComp?.storage) return null;

  const ubicacion = itemMunicion.contenedor || "mochila";
  const estaEnMochila = ubicacion === "mochila";
  const totalMunicion = Math.max(0, itemMunicion.cantidad) || 0;

  // Detectar contenedor que esté llevado en la mochila/cuerpo
  const contenedorInfo = detectarContenedorMunicion(tipoMunicion, inventario, itemMunicionComp, true);
  const nombreContenedor = contenedorInfo.nombreContenedor || itemMunicionComp?.storage?.name || (tipoMunicion === "agujas" ? "Estuche de Agujas" : tipoMunicion === "balas_fuego" ? "Cartuchera" : tipoMunicion === "balas_honda" ? "Bolsa de Balas" : "Carcaj");
  const capacidadUnitaria = obtenerCapacidadContenedor(nombreContenedor, tipoMunicion);

  // Si esta munición está en un compartimento externo (ej. carro o bolsa de contención)
  if (!estaEnMochila) {
    return {
      nombreContenedor,
      tieneContenedor: contenedorInfo.tieneContenedor,
      cantidadContenedores: contenedorInfo.cantidadContenedores,
      capacidadUnitaria,
      capacidadTotal: contenedorInfo.capacidadTotal,
      almacenadasEnContenedor: 0,
      sueltasEnMochila: 0,
      enCompartimentoExterno: totalMunicion,
      ubicacionContenedor: ubicacion,
      totalMunicion,
      estaLleno: false,
      estaEnMochila: false
    };
  }

  // Si está en la mochila pero no hay contenedor libre en la mochila
  if (!contenedorInfo.tieneContenedor || contenedorInfo.capacidadTotal <= 0) {
    return {
      nombreContenedor,
      tieneContenedor: false,
      cantidadContenedores: 0,
      capacidadUnitaria,
      capacidadTotal: 0,
      almacenadasEnContenedor: 0,
      sueltasEnMochila: totalMunicion,
      enCompartimentoExterno: 0,
      ubicacionContenedor: "mochila",
      totalMunicion,
      estaLleno: false,
      estaEnMochila: true
    };
  }

  // Si está en la mochila y hay contenedor en la mochila
  const capacidadTotal = contenedorInfo.capacidadTotal;
  const almacenadas = Math.min(totalMunicion, capacidadTotal);
  const sueltas = Math.max(0, totalMunicion - capacidadTotal);

  return {
    nombreContenedor,
    tieneContenedor: true,
    cantidadContenedores: contenedorInfo.cantidadContenedores,
    capacidadUnitaria,
    capacidadTotal,
    almacenadasEnContenedor: almacenadas,
    sueltasEnMochila: sueltas,
    enCompartimentoExterno: 0,
    ubicacionContenedor: "mochila",
    totalMunicion,
    estaLleno: totalMunicion >= capacidadTotal,
    estaEnMochila: true
  };
}

/**
 * Calcula la información y ocupación de un contenedor físico de munición (ej. Carcaj, Caja de Virotes, Bolsa de Balas, Bolsita, Estuche de Agujas, Cartuchera).
 * Solo se consideran para llenarlo las municiones que están en la MOCHILA / cuerpo (excluyendo otros contenedores).
 */
export function calcularContenidoContenedorMunicion(
  itemContenedor: ObjetoInventario,
  inventario: ObjetoInventario[]
): InfoContenedorFisico | null {
  const nomNorm = normalizarTexto(itemContenedor.nombre);
  const idNorm = normalizarTexto(itemContenedor.idObjeto || "");

  if (!esContenedorFisicoMunicion(nomNorm) && !esContenedorFisicoMunicion(idNorm)) {
    return null;
  }

  const esCarcaj = nomNorm.includes("carcaj") || nomNorm.includes("quiver") || nomNorm.includes("aljaba") || idNorm === "quiver";
  const esCajaVirotes = nomNorm.includes("caja de virotes") || nomNorm.includes("bolt case") || nomNorm.includes("estuche de virotes") || idNorm === "case-crossbow-bolt" || idNorm === "crossbow-bolt-case";
  const esBolsaBalas = nomNorm.includes("bolsa de balas") || nomNorm.includes("bullet pouch") || idNorm === "bullet-pouch";
  const esEstucheAgujas = nomNorm.includes("estuche de agujas") || nomNorm.includes("needle case") || idNorm === "needle-case";
  const esCartuchera = nomNorm.includes("cartuchera") || idNorm === "cartridge-pouch";
  const esFrascoPolvora = nomNorm.includes("frasco de polvora") || nomNorm.includes("cuerno de polvora") || nomNorm.includes("powder horn");
  const esBolsita = nomNorm.includes("bolsita") || nomNorm.includes("pouch") || nomNorm.includes("bolsa") || idNorm === "pouch";

  if (!esCarcaj && !esCajaVirotes && !esBolsaBalas && !esEstucheAgujas && !esFrascoPolvora && !esCartuchera && !esBolsita) {
    return null;
  }

  let tipoProyectil = "proyectiles";
  let patronMunicion = ["flecha", "arrow"];
  let capacidadUnitaria = 20;

  if (esCarcaj) {
    tipoProyectil = "flechas";
    patronMunicion = ["flecha", "arrow"];
    capacidadUnitaria = 20;
  } else if (esCajaVirotes) {
    tipoProyectil = "virotes";
    patronMunicion = ["virote", "bolt"];
    capacidadUnitaria = 20;
  } else if (esBolsaBalas) {
    tipoProyectil = "balas";
    patronMunicion = ["bala, honda", "balas de honda", "bala de honda", "balas, honda", "sling bullet"];
    capacidadUnitaria = 20;
  } else if (esEstucheAgujas) {
    tipoProyectil = "agujas";
    patronMunicion = ["aguja", "needle"];
    capacidadUnitaria = 50;
  } else if (esCartuchera || esFrascoPolvora) {
    tipoProyectil = "balas";
    patronMunicion = [
      "balas, arma de fuego",
      "bala, arma de fuego",
      "balas de arma de fuego",
      "bala de arma de fuego",
      "balas de pistola",
      "bala de pistola",
      "balas de mosquete",
      "bala de mosquete",
      "bullet, firearm",
      "bullets, firearm",
      "firearm",
      "polvora"
    ];
    capacidadUnitaria = 20;
  } else if (esBolsita) {
    // Detectar si en el inventario hay agujas o balas de honda para clasificar la bolsita
    const hayAgujas = inventario.some((it) => {
      const n = normalizarTexto(it.nombre);
      return !esContenedorFisicoMunicion(n) && (n.includes("aguja") || n.includes("needle"));
    });
    const hayBalas = inventario.some((it) => {
      const n = normalizarTexto(it.nombre);
      return !esContenedorFisicoMunicion(n) && n.includes("bala");
    });

    if (hayAgujas) {
      tipoProyectil = "agujas";
      patronMunicion = ["aguja", "needle"];
      capacidadUnitaria = 50;
    } else if (hayBalas) {
      tipoProyectil = "balas";
      patronMunicion = ["bala, honda", "balas de honda", "bala de honda", "balas, honda", "sling bullet"];
      capacidadUnitaria = 20;
    } else {
      tipoProyectil = "agujas / balas";
      patronMunicion = ["aguja", "needle", "bala"];
      capacidadUnitaria = 50;
    }
  }

  const estaEnMochila = esItemEnMochila(itemContenedor);

  // Proyectiles compatibles en la MOCHILA (excluyendo contenedores)
  const itemsCompatiblesMochila = inventario.filter((it) => {
    const itNorm = normalizarTexto(it.nombre);
    if (esContenedorFisicoMunicion(itNorm)) return false;
    return esItemEnMochila(it) && patronMunicion.some((p) => itNorm.includes(normalizarTexto(p)));
  });

  // Proyectiles compatibles en compartimentos externos (excluyendo contenedores)
  const itemsCompatiblesExternos = inventario.filter((it) => {
    const itNorm = normalizarTexto(it.nombre);
    if (esContenedorFisicoMunicion(itNorm)) return false;
    return !esItemEnMochila(it) && patronMunicion.some((p) => itNorm.includes(normalizarTexto(p)));
  });

  const totalInventarioMochila = itemsCompatiblesMochila.reduce((acc, it) => acc + (Math.max(0, it.cantidad) || 0), 0);
  const totalInventarioExterno = itemsCompatiblesExternos.reduce((acc, it) => acc + (Math.max(0, it.cantidad) || 0), 0);

  const cantidadContenedores = Math.max(1, itemContenedor.cantidad || 1);
  const capacidadTotal = cantidadContenedores * capacidadUnitaria;

  const totalAlmacenado = estaEnMochila ? Math.min(totalInventarioMochila, capacidadTotal) : 0;

  return {
    esContenedorMunicion: true,
    nombreContenedor: itemContenedor.nombre,
    capacidadUnitaria,
    capacidadTotal,
    cantidadContenedores,
    tipoProyectil,
    totalAlmacenado,
    totalInventarioMochila,
    totalInventarioExterno,
    estaLleno: totalAlmacenado >= capacidadTotal,
    estaEnMochila
  };
}

/**
 * Evalúa el estado completo de munición de un arma para la interfaz de combate y el lanzador de ataques.
 * REGLAS ESTRICTAS:
 * 1. Los contenedores físicos NUNCA se contabilizan como munición consumible.
 * 2. El lanzador SOLO puede disparar proyectiles cargados en un contenedor táctico activo en la mochila.
 */
export function resolverEstadoMunicionArma(
  nombreArma: string,
  propiedadesArma: string[],
  inventario: ObjetoInventario[] = [],
  baseDatosCompendio?: ObjetoJuego[]
): EstadoMunicionArma {
  const nomArmaNorm = normalizarTexto(nombreArma);
  const armaComp = baseDatosCompendio?.find(
    (o) => o.id === nombreArma || normalizarTexto(o.nombre) === nomArmaNorm
  );

  const regla = obtenerReglaMunicion(nombreArma, propiedadesArma);

  const tieneAmmunitionCompendio = Boolean(armaComp?.ammunition);
  const tienePropiedadMunicion = propiedadesArma.some((p) =>
    normalizarTexto(p).includes("municion") || normalizarTexto(p).includes("ammunition")
  );

  if (!regla && !tieneAmmunitionCompendio && !tienePropiedadMunicion) {
    return {
      requiereMunicion: false,
      municionDisponibleCantidad: 0,
      itemsCompatibles: [],
      tieneContenedorEnInventario: false,
      municionEnContenedor: 0,
      municionSueltEnMochila: 0,
      municionEnCompartimentosExternos: 0,
      municionTotalGlobal: 0,
      capacidadContenedoresTotal: 0,
      puedeDisparar: true
    };
  }

  // 1. Filtrar todos los proyectiles compatibles en inventario (excluyendo contenedores físicos)
  const todosCompatibles = inventario.filter((item) =>
    esMunicionCompatibleConArma(nombreArma, item, propiedadesArma, baseDatosCompendio)
  );

  // 2. Separar los que están en la MOCHILA (cuerpo) de los que están en compartimentos externos
  const compatiblesMochila = todosCompatibles.filter(esItemEnMochila);
  const compatiblesExternos = todosCompatibles.filter((it) => !esItemEnMochila(it));

  const totalMochila = compatiblesMochila.reduce((acc, it) => acc + (Math.max(0, it.cantidad) || 0), 0);
  const totalExterno = compatiblesExternos.reduce((acc, it) => acc + (Math.max(0, it.cantidad) || 0), 0);
  const totalGlobal = totalMochila + totalExterno;

  const itemPrincipal = compatiblesMochila.length > 0 ? compatiblesMochila[0] : todosCompatibles[0];

  const itemMunicionComp = itemPrincipal && baseDatosCompendio
    ? baseDatosCompendio.find(
        (o) => o.id === itemPrincipal.idObjeto || normalizarTexto(o.nombre) === normalizarTexto(itemPrincipal.nombre)
      )
    : undefined;

  const tipoMunicion = regla?.tipoMunicion || "generica";
  const nombreEsperado = armaComp?.ammunition?.name || regla?.nombreMunicionEsperada || "Munición";
  const contenedorRecomendado = itemMunicionComp?.storage?.name || regla?.nombreContenedorRecomendado || (tipoMunicion === "agujas" ? "Estuche de Agujas" : tipoMunicion === "balas_fuego" ? "Cartuchera" : tipoMunicion === "balas_honda" ? "Bolsa de Balas" : "Contenedor");

  // Detectar si el personaje tiene el contenedor en su MOCHILA/cuerpo
  const contenedorInfo = detectarContenedorMunicion(tipoMunicion, inventario, itemMunicionComp, true);
  const capacidadTotal = contenedorInfo.capacidadTotal;

  // Solo las flechas/agujas que están en la mochila y caben en el contenedor están listas para disparar
  const enContenedor = contenedorInfo.tieneContenedor ? Math.min(totalMochila, capacidadTotal) : 0;
  const sueltaMochila = contenedorInfo.tieneContenedor ? Math.max(0, totalMochila - capacidadTotal) : totalMochila;

  // Regla de disparo: Solo puede disparar si hay proyectiles listos en el contenedor de la mochila
  const puedeDisparar = enContenedor > 0;
  let motivoBloqueo: string | undefined;

  if (!contenedorInfo.tieneContenedor) {
    motivoBloqueo = `No tienes un ${contenedorRecomendado} en tu equipo para desenfundar ${nombreEsperado.toLowerCase()}.`;
  } else if (enContenedor <= 0) {
    if (totalExterno > 0 && totalMochila === 0) {
      motivoBloqueo = `Tus ${nombreEsperado} están en un carro/bolsa de contención y no pueden recargar tu ${contenedorInfo.nombreContenedor} en combate.`;
    } else {
      motivoBloqueo = `Tu ${contenedorInfo.nombreContenedor} está vacío (0/${capacidadTotal}).`;
    }
  }

  return {
    requiereMunicion: true,
    tipoMunicionEsperada: tipoMunicion,
    nombreMunicionEsperada: nombreEsperado,
    nombreContenedorRecomendado: contenedorRecomendado,
    municionDisponibleCantidad: enContenedor,
    itemsCompatibles: compatiblesMochila,
    itemPrincipal,
    tieneContenedorEnInventario: contenedorInfo.tieneContenedor,
    nombreContenedorDetectado: contenedorInfo.nombreContenedor,
    municionEnContenedor: enContenedor,
    municionSueltEnMochila: sueltaMochila,
    municionEnCompartimentosExternos: totalExterno,
    municionTotalGlobal: totalGlobal,
    capacidadContenedoresTotal: capacityOrZero(capacidadTotal),
    puedeDisparar,
    motivoBloqueo
  };
}

function capacityOrZero(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}
