export interface AtributosArmaInferidos {
  dadoBase: string;
  tipoDano: "Contundente" | "Perforante" | "Cortante";
  alcance: string;
  tipoAtaque: "Cuerpo a Cuerpo" | "A Distancia";
  subcategoria: "Sencilla" | "Marcial" | "De Fuego";
  propiedades: string[];
  danoVersatil?: string;
}

interface ReglaInferenciaArma {
  patrones: string[];
  atributos: AtributosArmaInferidos;
}

const REGLAS_INFERENCIA_ARMAS: ReglaInferenciaArma[] = [
  {
    patrones: ["arco largo", "longbow"],
    atributos: {
      dadoBase: "1d8",
      tipoDano: "Perforante",
      alcance: "150/600 ft",
      tipoAtaque: "A Distancia",
      subcategoria: "Marcial",
      propiedades: ["A dos manos", "Pesada", "Munición"]
    }
  },
  {
    patrones: ["arco corto", "shortbow"],
    atributos: {
      dadoBase: "1d6",
      tipoDano: "Perforante",
      alcance: "80/320 ft",
      tipoAtaque: "A Distancia",
      subcategoria: "Sencilla",
      propiedades: ["A dos manos", "Munición"]
    }
  },
  {
    patrones: ["ballesta ligera", "light crossbow"],
    atributos: {
      dadoBase: "1d8",
      tipoDano: "Perforante",
      alcance: "80/320 ft",
      tipoAtaque: "A Distancia",
      subcategoria: "Sencilla",
      propiedades: ["A dos manos", "Carga", "Munición"]
    }
  },
  {
    patrones: ["ballesta pesada", "heavy crossbow"],
    atributos: {
      dadoBase: "1d10",
      tipoDano: "Perforante",
      alcance: "100/400 ft",
      tipoAtaque: "A Distancia",
      subcategoria: "Marcial",
      propiedades: ["A dos manos", "Pesada", "Carga", "Munición"]
    }
  },
  {
    patrones: ["ballesta de mano", "hand crossbow"],
    atributos: {
      dadoBase: "1d6",
      tipoDano: "Perforante",
      alcance: "30/120 ft",
      tipoAtaque: "A Distancia",
      subcategoria: "Marcial",
      propiedades: ["Ligera", "Carga", "Munición"]
    }
  },
  {
    patrones: ["daga", "dagger"],
    atributos: {
      dadoBase: "1d4",
      tipoDano: "Perforante",
      alcance: "20/60 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Sencilla",
      propiedades: ["Sutil", "Ligera", "Arrojadiza"]
    }
  },
  {
    patrones: ["espada corta", "shortsword"],
    atributos: {
      dadoBase: "1d6",
      tipoDano: "Perforante",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["Sutil", "Ligera"]
    }
  },
  {
    patrones: ["espada larga", "longsword"],
    atributos: {
      dadoBase: "1d8",
      danoVersatil: "1d10",
      tipoDano: "Cortante",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["Versátil"]
    }
  },
  {
    patrones: ["espadon", "espadón", "greatsword"],
    atributos: {
      dadoBase: "2d6",
      tipoDano: "Cortante",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["A dos manos", "Pesada"]
    }
  },
  {
    patrones: ["cimitarra", "scimitar"],
    atributos: {
      dadoBase: "1d6",
      tipoDano: "Cortante",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["Sutil", "Ligera"]
    }
  },
  {
    patrones: ["estoque", "rapier"],
    atributos: {
      dadoBase: "1d8",
      tipoDano: "Perforante",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["Sutil"]
    }
  },
  {
    patrones: ["hacha de batalla", "battleaxe"],
    atributos: {
      dadoBase: "1d8",
      danoVersatil: "1d10",
      tipoDano: "Cortante",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["Versátil"]
    }
  },
  {
    patrones: ["gran hacha", "greataxe"],
    atributos: {
      dadoBase: "1d12",
      tipoDano: "Cortante",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["A dos manos", "Pesada"]
    }
  },
  {
    patrones: ["lanza", "spear"],
    atributos: {
      dadoBase: "1d6",
      danoVersatil: "1d8",
      tipoDano: "Perforante",
      alcance: "20/60 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Sencilla",
      propiedades: ["Versátil", "Arrojadiza"]
    }
  },
  {
    patrones: ["baston", "bastón", "quarterstaff"],
    atributos: {
      dadoBase: "1d6",
      danoVersatil: "1d8",
      tipoDano: "Contundente",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Sencilla",
      propiedades: ["Versátil"]
    }
  },
  {
    patrones: ["martillo de guerra", "warhammer"],
    atributos: {
      dadoBase: "1d8",
      danoVersatil: "1d10",
      tipoDano: "Contundente",
      alcance: "5 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["Versátil"]
    }
  },
  {
    patrones: ["tridente", "trident"],
    atributos: {
      dadoBase: "1d8",
      danoVersatil: "1d10",
      tipoDano: "Perforante",
      alcance: "20/60 ft",
      tipoAtaque: "Cuerpo a Cuerpo",
      subcategoria: "Marcial",
      propiedades: ["Versátil", "Arrojadiza"]
    }
  }
];

const ATRIBUTOS_POR_DEFECTO: AtributosArmaInferidos = {
  dadoBase: "1d6",
  tipoDano: "Contundente",
  alcance: "5 ft",
  tipoAtaque: "Cuerpo a Cuerpo",
  subcategoria: "Sencilla",
  propiedades: []
};

/**
 * Infiere propiedades y atributos base de combate para armas mediante búsqueda por patrones.
 */
export function inferirAtributosArma(nombreNorm: string): AtributosArmaInferidos {
  for (const regla of REGLAS_INFERENCIA_ARMAS) {
    if (regla.patrones.some((p) => nombreNorm.includes(p))) {
      return regla.atributos;
    }
  }
  return ATRIBUTOS_POR_DEFECTO;
}
