import type { DotePersonaje, OpcionSelector } from "@/tipos/rasgos";
import HECHIZOS_JSON from "@/utiles/compendios/all.json";

function normalizar(texto: string = ""): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface HechizoCompendioMinimo {
  id: string;
  nombre: string;
  nivel: number;
  clases?: string[];
  escuela?: string;
  tiempoLanzamiento?: string;
  alcance?: string;
}

function generarOpcionesConjuros(claseObjetivo: string, nivel: number): OpcionSelector[] {
  const claseNorm = normalizar(claseObjetivo);
  return (HECHIZOS_JSON as unknown as HechizoCompendioMinimo[])
    .filter((h) => {
      if (h.nivel !== nivel) return false;
      return (h.clases || []).some((c) => normalizar(c).includes(claseNorm));
    })
    .map((h) => ({
      id: h.id,
      nombre: h.nombre,
      descripcion: [h.escuela, h.tiempoLanzamiento, h.alcance].filter(Boolean).join(" • ")
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const OPCIONES_APTITUD_MAGICA: OpcionSelector[] = [
  { id: "inteligencia", nombre: "Inteligencia", descripcion: "Usa tu modificador de Inteligencia como aptitud mágica" },
  { id: "sabiduria", nombre: "Sabiduría", descripcion: "Usa tu modificador de Sabiduría como aptitud mágica" },
  { id: "carisma", nombre: "Carisma", descripcion: "Usa tu modificador de Carisma como aptitud mágica" }
];

const trucosClerigo = generarOpcionesConjuros("clérigo", 0);
const conjuros1Clerigo = generarOpcionesConjuros("clérigo", 1);

const trucosDruida = generarOpcionesConjuros("druida", 0);
const conjuros1Druida = generarOpcionesConjuros("druida", 1);

const trucosMago = generarOpcionesConjuros("mago", 0);
const conjuros1Mago = generarOpcionesConjuros("mago", 1);

// =======================================================
// CATÁLOGO CANÓNICO DE DOTES D&D 5.5e (PHB 2024)
// =======================================================

export const DOTES_ORIGEN_DND55: DotePersonaje[] = [
  {
    id: "dote_alerta",
    nombre: "Alerta",
    categoria: "origen",
    descripcion:
      "Siempre estás atento al peligro. Sumas tu bonificador de competencia a la tirada de iniciativa y puedes intercambiar tu resultado de iniciativa con el de un aliado voluntario inmediatamente después de tirar (siempre que ninguno esté incapacitado).",
    beneficios: ["+PB a iniciativa", "Intercambio de iniciativa con un aliado"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "modificador_stat",
        objetivo: "iniciativa",
        valor: "bono_competencia",
        descripcion: "+PB a Iniciativa"
      }
    ]
  },
  {
    id: "dote_fabricante",
    nombre: "Fabricante",
    categoria: "origen",
    descripcion:
      "Tienes talento para crear objetos. Obtienes competencia con tres herramientas de artesano a tu elección de la tabla Fabricación rápida, recibes un 20% de descuento al comprar cualquier objeto no mágico, y tras finalizar un descanso largo puedes fabricar rápidamente un objeto útil que dura hasta tu siguiente descanso largo.",
    beneficios: ["Competencia con 3 herramientas de artesano", "20% de descuento en objetos no mágicos", "Fabricación rápida tras descanso largo"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_sanador",
    nombre: "Sanador",
    categoria: "origen",
    descripcion:
      "Posees la aptitud para reparar heridas en combate. Médico de batalla: como acción de utilizar, puedes gastar un uso de un estuche de sanador para atender a una criatura a 5 pies o menos; esa criatura puede gastar uno de sus dados de golpe y recupera puntos de golpe iguales a la tirada más tu bonificador por competencia. Repetir tiradas de curación: al tirar dados para determinar cuántos PG restableces con un conjuro o con Médico de batalla, puedes volver a tirar si obtienes un 1 (usando el nuevo resultado).",
    beneficios: ["Médico de batalla (curar dado de golpe + PB con estuche)", "Relanzar 1s en tiradas de curación"],
    fuente: "PHB 2024",
    tipoAccion: "accion",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_iniciado_magia_clerigo",
    nombre: "Iniciado en la Magia (Clérigo)",
    categoria: "origen",
    descripcion:
      "Aprendes dos trucos a tu elección de la lista de conjuros de Clérigo y un conjuro de nivel 1 de la misma lista. Siempre tienes ese conjuro preparado. Puedes lanzarlo una vez sin gastar un espacio de conjuro y recuperas la capacidad de hacerlo tras un descanso largo. También puedes lanzarlo usando cualquier espacio de conjuro que tengas. Inteligencia, Sabiduría o Carisma es tu aptitud mágica para estos conjuros.",
    beneficios: [
      "2 trucos de Clérigo a tu elección",
      "1 conjuro de nivel 1 de Clérigo (1 gratis/descanso largo o con espacios)",
      "Aptitud mágica a elegir (INT, SAB o CAR)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    recuperacion: "descanso_largo",
    categoriaMecanica: "consumible",
    conjurosOtorgados: [],
    selectores: [
      {
        id: "selector_truco_1_iniciado_clerigo",
        tipo: "unico",
        etiqueta: "Primer Truco de Clérigo",
        maxSelecciones: 1,
        opciones: trucosClerigo,
        valorActual: []
      },
      {
        id: "selector_truco_2_iniciado_clerigo",
        tipo: "unico",
        etiqueta: "Segundo Truco de Clérigo",
        maxSelecciones: 1,
        opciones: trucosClerigo,
        valorActual: []
      },
      {
        id: "selector_conjuro_nv1_iniciado_clerigo",
        tipo: "unico",
        visualizacion: "lista",
        etiqueta: "1 Conjuro de Nivel 1 de Clérigo",
        maxSelecciones: 1,
        opciones: conjuros1Clerigo,
        valorActual: []
      },
      {
        id: "selector_aptitud_iniciado_clerigo",
        tipo: "unico",
        etiqueta: "Aptitud Mágica",
        maxSelecciones: 1,
        opciones: OPCIONES_APTITUD_MAGICA,
        valorActual: ["sabiduria"]
      }
    ]
  },
  {
    id: "dote_iniciado_magia_druida",
    nombre: "Iniciado en la Magia (Druida)",
    categoria: "origen",
    descripcion:
      "Aprendes dos trucos a tu elección de la lista de conjuros de Druida y un conjuro de nivel 1 de la misma lista. Siempre tienes ese conjuro preparado. Puedes lanzarlo una vez sin gastar un espacio de conjuro y recuperas la capacidad de hacerlo tras un descanso largo. También puedes lanzarlo usando cualquier espacio de conjuro que tengas. Inteligencia, Sabiduría o Carisma es tu aptitud mágica para estos conjuros.",
    beneficios: [
      "2 trucos de Druida a tu elección",
      "1 conjuro de nivel 1 de Druida (1 gratis/descanso largo o con espacios)",
      "Aptitud mágica a elegir (INT, SAB o CAR)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    recuperacion: "descanso_largo",
    categoriaMecanica: "consumible",
    conjurosOtorgados: [],
    selectores: [
      {
        id: "selector_truco_1_iniciado_druida",
        tipo: "unico",
        etiqueta: "Primer Truco de Druida",
        maxSelecciones: 1,
        opciones: trucosDruida,
        valorActual: []
      },
      {
        id: "selector_truco_2_iniciado_druida",
        tipo: "unico",
        etiqueta: "Segundo Truco de Druida",
        maxSelecciones: 1,
        opciones: trucosDruida,
        valorActual: []
      },
      {
        id: "selector_conjuro_nv1_iniciado_druida",
        tipo: "unico",
        visualizacion: "lista",
        etiqueta: "1 Conjuro de Nivel 1 de Druida",
        maxSelecciones: 1,
        opciones: conjuros1Druida,
        valorActual: []
      },
      {
        id: "selector_aptitud_iniciado_druida",
        tipo: "unico",
        etiqueta: "Aptitud Mágica",
        maxSelecciones: 1,
        opciones: OPCIONES_APTITUD_MAGICA,
        valorActual: ["sabiduria"]
      }
    ]
  },
  {
    id: "dote_iniciado_magia_mago",
    nombre: "Iniciado en la Magia (Mago)",
    categoria: "origen",
    descripcion:
      "Aprendes dos trucos a tu elección de la lista de conjuros de Mago y un conjuro de nivel 1 de la misma lista. Siempre tienes ese conjuro preparado. Puedes lanzarlo una vez sin gastar un espacio de conjuro y recuperas la capacidad de hacerlo tras un descanso largo. También puedes lanzarlo usando cualquier espacio de conjuro que tengas. Inteligencia, Sabiduría o Carisma es tu aptitud mágica para estos conjuros.",
    beneficios: [
      "2 trucos de Mago a tu elección",
      "1 conjuro de nivel 1 de Mago (1 gratis/descanso largo o con espacios)",
      "Aptitud mágica a elegir (INT, SAB o CAR)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    recuperacion: "descanso_largo",
    categoriaMecanica: "consumible",
    conjurosOtorgados: [],
    selectores: [
      {
        id: "selector_truco_1_iniciado_mago",
        tipo: "unico",
        etiqueta: "Primer Truco de Mago",
        maxSelecciones: 1,
        opciones: trucosMago,
        valorActual: []
      },
      {
        id: "selector_truco_2_iniciado_mago",
        tipo: "unico",
        etiqueta: "Segundo Truco de Mago",
        maxSelecciones: 1,
        opciones: trucosMago,
        valorActual: []
      },
      {
        id: "selector_conjuro_nv1_iniciado_mago",
        tipo: "unico",
        visualizacion: "lista",
        etiqueta: "1 Conjuro de Nivel 1 de Mago",
        maxSelecciones: 1,
        opciones: conjuros1Mago,
        valorActual: []
      },
      {
        id: "selector_aptitud_iniciado_mago",
        tipo: "unico",
        etiqueta: "Aptitud Mágica",
        maxSelecciones: 1,
        opciones: OPCIONES_APTITUD_MAGICA,
        valorActual: ["inteligencia"]
      }
    ]
  },
  {
    id: "dote_musico",
    nombre: "Músico",
    categoria: "origen",
    descripcion:
      "Tienes un talento natural para la interpretación musical. Obtienes competencia con tres instrumentos musicales a tu elección. Canción alentadora: al finalizar un descanso corto o largo, puedes tocar una melodía con un instrumento con el que tengas competencia para otorgar Inspiración heroica a tantos aliados que escuchen la música como tu bonificador por competencia.",
    beneficios: ["Competencia con 3 instrumentos musicales", "Canción alentadora (Inspiración heroica a PB aliados tras descanso)"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_afortunado",
    nombre: "Afortunado",
    categoria: "origen",
    descripcion:
      "Tienes una suerte inexplicable que parece activarse en los momentos más adecuados. Puntos de suerte: tienes una cantidad de puntos de suerte igual a tu bonificador por competencia. Ventaja: al tirar un d20 para una prueba con d20, puedes gastar 1 punto de suerte para darte ventaja. Desventaja: cuando una criatura tire un d20 en una tirada de ataque contra ti, puedes gastar 1 punto de suerte para imponerle desventaja. Recuperas todos los puntos de suerte tras un descanso largo.",
    beneficios: [
      "Puntos de suerte iguales a tu PB",
      "Ventaja propia o desventaja al atacante (1 punto)",
      "Recuperación en descanso largo"
    ],
    fuente: "PHB 2024",
    tipoAccion: "reaccion",
    tieneUsosLimitados: true,
    usosMaximos: 2,
    formulaEscalado: "bono_competencia",
    recuperacion: "descanso_largo",
    categoriaMecanica: "consumible"
  },
  {
    id: "dote_atacante_salvaje",
    nombre: "Atacante Salvaje",
    categoria: "origen",
    descripcion:
      "Te has entrenado para asestar golpes especialmente destructivos. Una vez por turno, cuando impactes a un objetivo con un arma, puedes tirar los dados de daño del arma dos veces y usar cualquiera de los dos resultados contra el objetivo.",
    beneficios: ["Tirar dos veces dados de daño de arma 1 vez/turno"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_habilidoso",
    nombre: "Habilidoso",
    categoria: "origen",
    descripcion:
      "Has desarrollado un amplio abanico de talentos. Obtienes competencia en cualquier combinación de tres habilidades o herramientas de tu elección. Puedes elegir esta dote más de una vez.",
    beneficios: ["Competencia en 3 habilidades o herramientas a elección", "Repetible"],
    fuente: "PHB 2024",
    repetible: true,
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_duro",
    nombre: "Duro",
    categoria: "origen",
    descripcion:
      "Eres excepcionalmente resistente. Tus puntos de golpe máximos aumentan en una cantidad igual al doble del nivel de tu personaje en el momento de obtener esta dote. A partir de entonces, cada vez que subas un nivel de personaje, tus puntos de golpe máximos aumentan en 2 puntos de golpe adicionales.",
    beneficios: ["+2 HP máximos por nivel de personaje"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "modificador_hp_maximo",
        objetivo: "hp_maximo",
        valor: "2*nivel",
        descripcion: "Duro (+2 HP máx. por nivel)"
      }
    ]
  },
  {
    id: "dote_maton_taberna",
    nombre: "Matón de Taberna",
    categoria: "origen",
    descripcion:
      "Acostumbrado a las riñas de taberna, has aprendido trucos para el combate sin armas. Ataque desarmado mejorado: cuando impactes con tu ataque desarmado y causes daño, puedes infligir daño contundente igual a 1d4 más tu modificador de Fuerza, en lugar del daño habitual. Repetir tiradas de daño: siempre que tires un dado de daño para tu ataque desarmado, puedes volver a tirarlo si sacas un 1. Armamento improvisado: tienes competencia con armas improvisadas. Empujar: al impactar a una criatura con un ataque desarmado como parte de la acción de atacar en tu turno, puedes dañarla y además empujarla a 5 pies de distancia de ti (una vez por turno).",
    beneficios: [
      "Ataque desarmado 1d4 + FUE contundente",
      "Competencia con armas improvisadas",
      "Relanzar 1s en daño desarmado",
      "Empujar 5 pies al golpear desarmado (1/turno)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "ataque_desarmado",
        objetivo: "fuerza",
        valor: "1d4",
        descripcion: "Golpe Desarmado (Matón de Taberna)"
      },
      {
        tipo: "competencia",
        objetivo: "armas_improvisadas",
        valor: "improvisadas",
        descripcion: "Competencia con Armas Improvisadas"
      }
    ]
  }
];

export const DOTES_GENERALES_Y_EPICAS_DND55: DotePersonaje[] = [
  {
    id: "dote_tirador_primera",
    nombre: "Tirador de Primera (Sharpshooter)",
    categoria: "general",
    requisito: "Destreza 13+",
    descripcion:
      "Dominas el combate a distancia: disparar a alcance largo no te impone desventaja, tus ataques a distancia ignoran cobertura media y tres cuartos, y no tienes desventaja al disparar cuerpo a cuerpo.",
    beneficios: ["Ignora cobertura media y 3/4", "Sin desventaja a alcance largo", "Sin penalización cuerpo a cuerpo"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_maestro_armas_pesadas",
    nombre: "Maestro en Armas Pesadas (Great Weapon Master)",
    categoria: "general",
    requisito: "Fuerza 13+",
    descripcion:
      "Cuando asestes un crítico o reduzcas a 0 HP a una criatura con un arma cuerpo a cuerpo pesada, puedes hacer otro ataque como acción adicional. Sumas tu PB al daño de armas pesadas.",
    beneficios: ["Ataque extra tras crítico/muerte", "+PB al daño con armas pesadas"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_combatiente_dos_armas",
    nombre: "Combatiente con Dos Armas (Dual Wielder)",
    categoria: "general",
    requisito: "Fuerza o Destreza 13+",
    descripcion:
      "Puedes usar combate con dos armas incluso con armas que no sean ligeras. Puedes hacer un ataque adicional extra como acción adicional.",
    beneficios: ["Uso con armas no ligeras", "Ataque adicional secundario"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_resiliente",
    nombre: "Resiliente",
    categoria: "general",
    descripcion:
      "Aumentas una puntuación de característica en +1 y ganas competencia en las tiradas de salvación con esa característica.",
    beneficios: ["+1 a característica", "Competencia en salvación elegida"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_don_pericia_combate",
    nombre: "Don de la Pericia en Combate",
    categoria: "don_epico",
    requisito: "Nivel 19+",
    descripcion:
      "Aumentas una característica en +1 (máx 30). Si fallas una tirada de ataque, puedes convertirla en un acierto una vez por turno.",
    beneficios: ["+1 característica (máx 30)", "Convertir fallo en acierto (1/turno)"],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  }
];

export const TODAS_LAS_DOTES_CANONICAS_DND55: DotePersonaje[] = [
  ...DOTES_ORIGEN_DND55,
  ...DOTES_GENERALES_Y_EPICAS_DND55
];
