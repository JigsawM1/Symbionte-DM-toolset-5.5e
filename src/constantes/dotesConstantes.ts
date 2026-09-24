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
  ritual?: boolean;
}

export function generarOpcionesRituales(nivel: number): OpcionSelector[] {
  return (HECHIZOS_JSON as unknown as HechizoCompendioMinimo[])
    .filter((h) => h.nivel === nivel && Boolean(h.ritual))
    .map((h) => ({
      id: h.id,
      nombre: h.nombre,
      descripcion: [h.escuela, h.tiempoLanzamiento, h.alcance, "Ritual"].filter(Boolean).join(" • ")
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const ritualesNivel1 = generarOpcionesRituales(1);

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

function generarOpcionesConjurosPorEscuelas(escuelas: string[], nivel: number): OpcionSelector[] {
  const escuelasNorm = escuelas.map((e) => normalizar(e));
  return (HECHIZOS_JSON as unknown as HechizoCompendioMinimo[])
    .filter((h) => {
      if (h.nivel !== nivel) return false;
      const escuelaH = normalizar(h.escuela || "");
      return escuelasNorm.some((esc) => escuelaH.includes(esc));
    })
    .map((h) => ({
      id: h.id,
      nombre: h.nombre,
      descripcion: [h.escuela, h.tiempoLanzamiento, h.alcance].filter(Boolean).join(" • ")
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const conjuros1AdivinacionOEncantamiento = generarOpcionesConjurosPorEscuelas(["adivinación", "encantamiento"], 1);
const conjuros1IlusionONigromancia = generarOpcionesConjurosPorEscuelas(["ilusión", "ilusionismo", "nigromancia"], 1);

export const OPCIONES_PROPIEDADES_MAESTRIA: OpcionSelector[] = [
  { id: "cleave", nombre: "Cleave (Hender)", descripcion: "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes hacer una tirada de ataque contra una segunda criatura a 5 pies de la primera y dentro de tu alcance. Si impactas, la segunda criatura recibe el daño del arma sin tu modificador de característica. Solo una vez por turno." },
  { id: "graze", nombre: "Graze (Rozar)", descripcion: "Si tu tirada de ataque falla, puedes infligir daño igual al modificador de característica usado. El daño es del mismo tipo que el arma, y solo puede incrementarse aumentando el modificador." },
  { id: "nick", nombre: "Nick (Mellar)", descripcion: "Cuando haces el ataque extra de la propiedad Ligera, puedes hacerlo como parte de la acción de Atacar en vez de como Acción Adicional. Solo una vez por turno." },
  { id: "push", nombre: "Push (Empujar)", descripcion: "Si impactas a una criatura, puedes empujarla hasta 10 pies en línea recta lejos de ti si es Grande o menor." },
  { id: "sap", nombre: "Sap (Debilitar)", descripcion: "Si impactas a una criatura, esa criatura tiene Desventaja en su siguiente tirada de ataque antes del inicio de tu próximo turno." },
  { id: "slow", nombre: "Slow (Ralentizar)", descripcion: "Si impactas a una criatura e infliges daño, puedes reducir su Velocidad en 10 pies hasta el inicio de tu próximo turno. Múltiples impactos con armas Slow no acumulan la reducción." },
  { id: "topple", nombre: "Topple (Derribar)", descripcion: "Si impactas a una criatura, puedes forzar una tirada de salvación de Constitución (CD 8 + modificador de característica + bonificador de competencia). Si falla, la criatura queda Derribada." },
  { id: "vex", nombre: "Vex (Molestar)", descripcion: "Si impactas a una criatura e infliges daño, tienes Ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu próximo turno." }
];

const OPCIONES_ELEMENTOS_VERSADO: OpcionSelector[] = [
  { id: "acido", nombre: "Ácido", descripcion: "Ignora resistencia al daño de ácido y trata cualquier 1 en dados de daño como un 2" },
  { id: "frio", nombre: "Frío", descripcion: "Ignora resistencia al daño de frío y trata cualquier 1 en dados de daño como un 2" },
  { id: "fuego", nombre: "Fuego", descripcion: "Ignora resistencia al daño de fuego y trata cualquier 1 en dados de daño como un 2" },
  { id: "relampago", nombre: "Relámpago", descripcion: "Ignora resistencia al daño de relámpago y trata cualquier 1 en dados de daño como un 2" },
  { id: "trueno", nombre: "Trueno", descripcion: "Ignora resistencia al daño de trueno y trata cualquier 1 en dados de daño como un 2" }
];

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
      "Posees la aptitud para reparar heridas en combate. \n\n*Médico de batalla*: como acción de utilizar, puedes gastar un uso de un estuche de sanador para atender a una criatura a 5 pies o menos; esa criatura puede gastar uno de sus dados de golpe y recupera puntos de golpe iguales a la tirada más tu bonificador por competencia. \n\n*Repetir tiradas de curación*: al tirar dados para determinar cuántos PG restableces con un conjuro o con Médico de batalla, puedes volver a tirar si obtienes un 1 (usando el nuevo resultado).",
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
      "Tienes un talento natural para la interpretación musical. Obtienes competencia con tres instrumentos musicales a tu elección. \n\n*Canción alentadora:* al finalizar un descanso corto o largo, puedes tocar una melodía con un instrumento con el que tengas competencia para otorgar Inspiración heroica a tantos aliados que escuchen la música como tu bonificador por competencia.",
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
      "Tienes una suerte inexplicable que parece activarse en los momentos más adecuados. \n\n*Puntos de suerte:* tienes una cantidad de puntos de suerte igual a tu bonificador por competencia. \n\n*Ventaja:* al tirar un d20 para una prueba con d20, puedes gastar 1 punto de suerte para darte ventaja. \n\n*Desventaja:* cuando una criatura tire un d20 en una tirada de ataque contra ti, puedes gastar 1 punto de suerte para imponerle desventaja. \n\n*Recuperación:* recuperas todos los puntos de suerte tras un descanso largo.",
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
      "Acostumbrado a las riñas de taberna, has aprendido trucos para el combate sin armas. \n\n*Ataque desarmado mejorado:* cuando impactes con tu ataque desarmado y causes daño, puedes infligir daño contundente igual a 1d4 más tu modificador de Fuerza, en lugar del daño habitual. \n\n*Repetir tiradas de daño:* siempre que tires un dado de daño para tu ataque desarmado, puedes volver a tirarlo si sacas un 1. \n\n*Armamento improvisado:* tienes competencia con armas improvisadas. \n\n*Empujar:* al impactar a una criatura con un ataque desarmado como parte de la acción de atacar en tu turno, puedes dañarla y además empujarla a 5 pies de distancia de ti (una vez por turno).",
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
  // ── LOTE 1/4 DE DOTES GENERALES (PHB 2024) ──
  {
    id: "dote_mejora_caracteristica",
    nombre: "Mejora de Característica",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "Aumenta en 2 una puntuación de característica de tu elección o aumenta en 1 dos características de tu elección. Esta dote no puede aumentar una puntuación de característica por encima de 20. Puedes elegir esta dote más de una vez.",
    beneficios: [
      "+2 a una característica o +1 a dos características (máx 20)",
      "Repetible"
    ],
    fuente: "PHB 2024",
    repetible: true,
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_actor",
    nombre: "Actor",
    categoria: "general",
    requisito: "Nivel 4 o más, Carisma 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Carisma en 1 (máx 20). \n\n*Suplantación:* mientras te disfraces de una persona real o ficticia, tienes ventaja en las pruebas de Carisma (Engaño o Interpretación) para convencer a los demás de que eres esa persona. \n\n*Imitación:* puedes imitar los sonidos y habla de otras criaturas (Perspicacia CD 8 + mod Carisma + PB para detectarlo).",
    beneficios: [
      "+1 Carisma (máx 20)",
      "Suplantación (ventaja en Engaño/Interpretación disfrazado)",
      "Imitación de voces y sonidos (CD 8 + CAR + PB)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_atleta",
    nombre: "Atleta",
    categoria: "general",
    requisito: "Nivel 4 o más, Fuerza o Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Fuerza o Destreza en 1 (máx 20). \n\n*Velocidad trepando:* obtienes una velocidad trepando igual a tu velocidad. \n\n*Levantarse de un salto:* si estás derribado, levantarte solo cuesta 5 pies de movimiento. \n\n*Saltar:* realizas saltos con solo 5 pies de carrerilla.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Velocidad trepando igual a tu velocidad",
      "Ponerse de pie con 5 pies de movimiento",
      "Salto con carrerilla tras solo 5 pies"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "movimiento_especial",
        objetivo: "velocidad.escalar",
        valor: "caminar",
        descripcion: "Velocidad trepando igual a tu velocidad"
      }
    ]
  },
  {
    id: "dote_atacante_carga",
    nombre: "Atacante a la Carga",
    categoria: "general",
    requisito: "Nivel 4 o más, Fuerza o Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Fuerza o Destreza en 1 (máx 20). \n\n*Carrera mejorada:* al correr, tu velocidad aumenta 10 pies para esa acción. \n\n*Ataque con carga:* si te mueves al menos 10 pies en línea recta antes de acertar con un ataque cuerpo a cuerpo (acción de atacar), eliges obtener un bonificador de 1d8 a la tirada de daño del arma o empujar al objetivo hasta 10 pies (1 vez por turno).",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Carrera mejorada (+10 pies al correr)",
      "Ataque con carga activable (+1d8 daño cuerpo a cuerpo o empujar 10 pies)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "especial",
    esActivable: true,
    categoriaMecanica: "activable",
    efectos: [
      {
        tipo: "dado_extra_dano",
        objetivo: "arma_cac",
        aplicaA: "arma_cac",
        valor: "1d8",
        descripcion: "Atacante a la Carga (+1d8)"
      }
    ]
  },
  {
    id: "dote_chef",
    nombre: "Chef",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Constitución o Sabiduría en 1 (máx 20). \n\n*Útiles de cocinero:* obtienes competencia con útiles de cocinero si aún no la tienes. \n\n*Comida reconstituyente:* en un descanso corto, preparas comida para 4 + PB criaturas; quienes gasten dados de golpe recuperan 1d8 PG adicionales. \n\n*Tentempiés tonificantes:* tras descanso largo cocinas tantos tentempiés como tu PB; como acción adicional una criatura puede comerlo y ganar PB puntos de golpe temporales.",
    beneficios: [
      "+1 Constitución o Sabiduría (máx 20)",
      "Competencia con útiles de cocinero",
      "Comida reconstituyente (+1d8 curación en descanso corto)",
      "Tentempiés tonificantes (PB PG temporales como acción adicional)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "competencia",
        objetivo: "herramientas",
        valor: "Útiles de cocinero",
        descripcion: "Competencia con útiles de cocinero"
      }
    ]
  },
  {
    id: "dote_experto_ballestas",
    nombre: "Experto en Ballestas",
    categoria: "general",
    requisito: "Nivel 4 o más, Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Destreza en 1 (máx 20). \n\n*Ignorar la recarga:* ignoras la propiedad de recarga de ballestas de mano, ligeras y pesadas, y puedes cargar munición sin mano libre al empuñarlas. \n\n*Disparar cuerpo a cuerpo:* estar a 5 pies de un enemigo no impone desventaja al disparar ballestas. \n\n*Manejo doble:* puedes sumar tu modificador de característica al daño del ataque extra con ballesta ligera.",
    beneficios: [
      "+1 Destreza (máx 20)",
      "Ignorar la recarga en ballestas y cargar sin mano libre",
      "Disparar ballestas a 5 pies sin desventaja",
      "Manejo doble (sumar modificador al daño extra con ballesta ligera)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_triturador",
    nombre: "Triturador",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Fuerza o Constitución en 1 (máx 20). \n\n*Empujar:* una vez por turno, al acertar con un ataque de daño contundente, puedes mover a la criatura 5 pies a un espacio desocupado si no es más de una categoría mayor. \n\n*Crítico potenciado:* al asestar un crítico con daño contundente, las tiradas de ataque contra esa criatura tienen ventaja hasta el principio de tu siguiente turno.",
    beneficios: [
      "+1 Fuerza o Constitución (máx 20)",
      "Empujar 5 pies con daño contundente (1/turno)",
      "Ventaja grupal contra objetivo tras golpe crítico contundente"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_duelista_defensivo",
    nombre: "Duelista Defensivo",
    categoria: "general",
    requisito: "Nivel 4 o más, Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Destreza en 1 (máx 20). \n\n*Parada:* si estás empuñando un arma sutil y te aciertan con un ataque cuerpo a cuerpo, puedes usar tu reacción para sumar tu bonificador por competencia a tu clase de armadura contra ataques cuerpo a cuerpo hasta el inicio de tu siguiente turno.",
    beneficios: [
      "+1 Destreza (máx 20)",
      "Parada: Reacción para sumar +PB a la CA contra ataques cuerpo a cuerpo con arma sutil"
    ],
    fuente: "PHB 2024",
    tipoAccion: "reaccion",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_combatiente_dos_armas",
    nombre: "Combatiente con Dos Armas",
    categoria: "general",
    requisito: "Nivel 4 o más, Fuerza o Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Fuerza o Destreza en 1 (máx 20). \n\n*Manejo doble mejorado:* cuando realizas la acción de atacar en tu turno y atacas con un arma que tenga la propiedad ligera, puedes realizar un ataque extra como acción adicional con un arma distinta que no tenga la propiedad a dos manos (sin sumar modificador al daño salvo que sea negativo). \n\n*Desenvainar rápido:* puedes desenvainar o envainar dos armas sin propiedad a dos manos a la vez.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Ataque extra como acción adicional con armas sin propiedad a dos manos",
      "Desenvainar o envainar 2 armas a la vez"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_resistente",
    nombre: "Resistente",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Constitución en 1 (máx 20). \n\n*Desafiar a la muerte:* tienes ventaja en las tiradas de salvación contra muerte. \n\n*Recuperación rápida:* como acción adicional, puedes gastar uno de tus dados de puntos de golpe, tirarlo y recuperar una cantidad de puntos de golpe igual al resultado de la tirada.",
    beneficios: [
      "+1 Constitución (máx 20)",
      "Ventaja en tiradas de salvación contra la muerte",
      "Recuperación rápida (acción adicional: gastar dado de golpe para curarse)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "accion_adicional",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "ventaja",
        objetivo: "salvacion.muerte",
        valor: "true",
        descripcion: "Ventaja en tiradas de salvación contra la muerte"
      }
    ]
  },
  // ── LOTE 2/4 DE DOTES GENERALES (PHB 2024) ──
  {
    id: "dote_versado_elemento",
    nombre: "Versado en un Elemento",
    categoria: "general",
    requisito: "Nivel 4 o más, aptitud para lanzar al menos un conjuro",
    descripcion:
      "*Mejora de característica:* aumenta tu Inteligencia, Sabiduría o Carisma en 1 (máx 20). \n\n*Traspasar resistencia:* elige un tipo de daño: ácido, frío, fuego, relámpago o trueno. Los conjuros que lanzas ignoran la resistencia al daño del tipo elegido. Además, cuando tiras el daño para un conjuro que lanzas que inflija daño de ese tipo, puedes tratar cualquier 1 en un dado de daño como un 2. \n\n*Repetible:* puedes elegir esta dote más de una vez, pero debes elegir un tipo de daño diferente cada vez.",
    beneficios: [
      "+1 Inteligencia, Sabiduría o Carisma (máx 20)",
      "Ignora resistencia al daño del elemento elegido",
      "Trata los 1s en dados de daño de ese elemento como 2s",
      "Repetible (eligiendo un tipo de daño diferente)"
    ],
    fuente: "PHB 2024",
    repetible: true,
    tipoAccion: "pasivo",
    categoriaMecanica: "selector_informativo",
    selectores: [
      {
        id: "selector_elemento_versado",
        tipo: "unico",
        etiqueta: "Tipo de Daño Elemental",
        maxSelecciones: 1,
        opciones: OPCIONES_ELEMENTOS_VERSADO,
        valorActual: []
      }
    ]
  },
  {
    id: "dote_influencia_feerica",
    nombre: "Influencia Feérica",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Inteligencia, Sabiduría o Carisma en 1 (máx 20). \n\n*Magia feérica:* aprendes el conjuro Paso brumoso y un conjuro de nivel 1 a tu elección de la escuela de Adivinación o de Encantamiento. Puedes lanzar cada uno de estos conjuros sin gastar un espacio de conjuro una vez. Recuperas la capacidad de lanzarlos de esta forma cuando finalizas un descanso largo. También puedes lanzar estos conjuros utilizando espacios de conjuro que tengas del nivel apropiado. La característica para lanzar estos conjuros es la que aumentaste con el beneficio de Mejora de característica de esta dote.",
    beneficios: [
      "+1 Inteligencia, Sabiduría o Carisma (máx 20)",
      "Conjuro Paso brumoso (1 gratis/descanso largo o con espacios)",
      "1 conjuro de nivel 1 de Adivinación o Encantamiento (1 gratis/descanso largo)",
      "Aptitud mágica a elegir (INT, SAB o CAR)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "accion_adicional",
    tieneUsosLimitados: true,
    usosMaximos: 2,
    recuperacion: "descanso_largo",
    categoriaMecanica: "consumible",
    conjurosOtorgados: ["h_paso-brumoso"],
    selectores: [
      {
        id: "selector_conjuro_nv1_influencia_feerica",
        tipo: "unico",
        visualizacion: "lista",
        etiqueta: "Conjuro de Nivel 1 (Adivinación o Encantamiento)",
        maxSelecciones: 1,
        opciones: conjuros1AdivinacionOEncantamiento,
        valorActual: []
      },
      {
        id: "selector_aptitud_influencia_feerica",
        tipo: "unico",
        etiqueta: "Aptitud Mágica",
        maxSelecciones: 1,
        opciones: OPCIONES_APTITUD_MAGICA,
        valorActual: ["carisma"]
      }
    ]
  },
  {
    id: "dote_apresador",
    nombre: "Apresador",
    categoria: "general",
    requisito: "Nivel 4 o más, Fuerza o Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Fuerza o Destreza en 1 (máx 20). \n\n*Golpear y agarrar:* cuando impactes a una criatura con un ataque desarmado como parte de la acción de atacar en tu turno, puedes utilizar tanto la opción de daño como la de agarre (1 vez por turno). \n\n*Ventaja al atacar:* tienes ventaja en las tiradas de ataque contra una criatura a la que estés agarrando. \n\n*Luchador rápido:* no tienes que invertir movimiento adicional para mover a una criatura a la que tengas agarrada si es de tu tamaño o inferior.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Golpear y agarrar (daño y presa en un solo ataque desarmado 1/turno)",
      "Ventaja en tiradas de ataque contra criaturas agarradas",
      "Mover criaturas agarradas sin coste adicional de movimiento"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_maestro_armas_pesadas",
    nombre: "Maestro en Armas Pesadas",
    categoria: "general",
    requisito: "Nivel 4 o más, Fuerza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza en 1 (máx 20). \n\n*Maestría con armas pesadas:* cuando impactes a una criatura con un arma que posea la propiedad «pesada» como parte de la acción de atacar en tu turno, puedes hacer que el arma inflija daño adicional al objetivo igual a tu bonificador por competencia (+PB). \n\n*Avasallar:* inmediatamente después de asestar un impacto crítico con un arma cuerpo a cuerpo o de reducir a una criatura a 0 puntos de golpe con una, puedes realizar un ataque adicional con la misma arma como acción adicional.",
    beneficios: [
      "+1 Fuerza (máx 20)",
      "+PB al daño de armas pesadas en la acción de atacar",
      "Ataque adicional como acción adicional tras crítico o reducir a 0 PG"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "bono_dano_ataque",
        objetivo: "arma_pesada",
        aplicaA: "arma_pesada",
        valor: "bono_competencia",
        descripcion: "+PB al daño con armas pesadas (Maestro en Armas Pesadas)"
      }
    ]
  },
  {
    id: "dote_muy_acorazado",
    nombre: "Muy Acorazado",
    categoria: "general",
    requisito: "Nivel 4 o más, entrenamiento con armaduras medias",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Constitución o Fuerza en 1 (máx 20). \n\n*Entrenamiento con armaduras:* obtienes entrenamiento con armaduras pesadas.",
    beneficios: [
      "+1 Constitución o Fuerza (máx 20)",
      "Entrenamiento con armaduras pesadas"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "competencia",
        objetivo: "armaduras_pesadas",
        valor: "pesadas",
        descripcion: "Competencia con Armaduras Pesadas"
      }
    ]
  },
  {
    id: "dote_maestro_armaduras_pesadas",
    nombre: "Maestro en Armaduras Pesadas",
    categoria: "general",
    requisito: "Nivel 4 o más, entrenamiento con armaduras pesadas",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Constitución o Fuerza en 1 (máx 20). \n\n*Reducción de daño:* cuando recibas un impacto por un ataque mientras lleves puesta una armadura pesada, cualquier daño contundente, perforante y cortante que recibas de dicho ataque se reduce en una cantidad igual a tu bonificador por competencia.",
    beneficios: [
      "+1 Constitución o Fuerza (máx 20)",
      "Reducción de daño (-PB al daño contundente, perforante y cortante con armadura pesada)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_lider_inspirador",
    nombre: "Líder Inspirador",
    categoria: "general",
    requisito: "Nivel 4 o más, Sabiduría o Carisma 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Sabiduría o Carisma en 1 (máx 20). \n\n*Interpretación fortalecedora:* al finalizar un descanso corto o largo, puedes ofrecer una interpretación inspiradora: un discurso, una canción o una danza. Cuando lo hagas, elige hasta seis aliados (entre los cuales puedes incluirte a ti mismo) que estén a 30 pies o menos de ti y hayan presenciado la interpretación. Cada una de las criaturas elegidas obtiene puntos de golpe temporales iguales a tu nivel de personaje más el modificador de la característica que hayas aumentado con esta dote.",
    beneficios: [
      "+1 Sabiduría o Carisma (máx 20)",
      "Interpretación fortalecedora (Nivel + Modificador PG temporales a ti y hasta 5 aliados tras descanso)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "especial",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_mente_aguda",
    nombre: "Mente Aguda",
    categoria: "general",
    requisito: "Nivel 4 o más, Inteligencia 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Inteligencia en 1 (máx 20). \n\n*Sabiduría popular:* elige una de las siguientes habilidades: Conocimiento arcano, Historia, Investigación, Naturaleza o Religión. Si no tienes competencia en la habilidad elegida, la obtienes; si ya tienes competencia en ella, obtienes pericia. \n\n*Estudio rápido:* puedes realizar la acción de estudiar como acción adicional.",
    beneficios: [
      "+1 Inteligencia (máx 20)",
      "Sabiduría popular (competencia o pericia en Conocimiento Arcano, Historia, Investigación, Naturaleza o Religión)",
      "Estudio rápido (acción de estudiar como acción adicional)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "accion_adicional",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_ligeramente_acorazado",
    nombre: "Ligeramente Acorazado",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu Fuerza o Destreza en 1 (máx 20). \n\n*Entrenamiento con armaduras:* obtienes entrenamiento con armaduras ligeras y escudos.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Entrenamiento con armaduras ligeras y escudos"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "competencia",
        objetivo: "armaduras_ligeras",
        valor: "ligeras",
        descripcion: "Competencia con Armaduras Ligeras"
      },
      {
        tipo: "competencia",
        objetivo: "escudos",
        valor: "escudos",
        descripcion: "Competencia con Escudos"
      }
    ]
  },
  {
    id: "dote_azote_magos",
    nombre: "Azote de Magos",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza o Destreza en 1 (máx 20). \n\n*Anticoncentración:* cuando dañes a una criatura que se esté concentrando, esta tendrá desventaja en la tirada de salvación que haga para mantener la concentración. \n\n*Mente robusta:* si fallas una tirada de salvación de Inteligencia, Sabiduría o Carisma, puedes hacer que tenga éxito en su lugar. Una vez que uses este beneficio, no puedes volver a utilizarlo hasta que finalices un descanso corto o largo.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Anticoncentración (desventaja al enemigo para mantener concentración al ser dañado)",
      "Mente robusta (convertir salvación fallida de INT, SAB o CAR en éxito 1/descanso corto o largo)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "reaccion",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    recuperacion: "descanso_corto",
    categoriaMecanica: "consumible"
  },
  {
    id: "dote_entrenamiento_armas_marciales",
    nombre: "Entrenamiento con Armas Marciales",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20.\n\n*Competencia con armas:* obtienes competencia con armas marciales.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Competencia con armas marciales"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "competencia",
        objetivo: "armas_marciales",
        valor: "marciales",
        descripcion: "Competencia con todas las armas marciales"
      }
    ]
  },
  {
    id: "dote_maestro_armaduras_medias",
    nombre: "Maestro en Armaduras Medias",
    categoria: "general",
    requisito: "Nivel 4 o más, entrenamiento con armaduras medias",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20.\n\n*Portador diestro:* mientras lleves puesta una armadura media, puedes sumar 3 en lugar de 2 a tu CA si tu puntuación de Destreza es de 16 (+3) o más.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Portador diestro (límite de Destreza en CA de armaduras medias aumentado a +3)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "limite_des_armadura_media",
        objetivo: "limite_des_armadura_media",
        valor: 3,
        descripcion: "Límite máximo de Destreza aplicable a la CA con armaduras medias aumentado a 3"
      }
    ]
  },
  {
    id: "dote_moderadamente_acorazado",
    nombre: "Moderadamente Acorazado",
    categoria: "general",
    requisito: "Nivel 4 o más, entrenamiento con armaduras ligeras",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20.\n\n*Entrenamiento con armaduras:* obtienes entrenamiento con armaduras medias.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Competencia con armaduras medias"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "competencia",
        objetivo: "armaduras_medias",
        valor: "medias",
        descripcion: "Competencia con armaduras medias"
      }
    ]
  },
  {
    id: "dote_combatiente_montado",
    nombre: "Combatiente Montado",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza, Destreza o Sabiduría en 1, hasta un máximo de 20.\n\n*Golpe montado:* mientras estés montado, tienes ventaja en las tiradas de ataque contra cualquier criatura que no esté montada situada a 5 pies o menos de tu montura si su tamaño es al menos una categoría inferior al de la montura.\n\n*Esquivar de un salto:* si tu montura sufre un efecto que le permita hacer una tirada de salvación de Destreza para sufrir solo la mitad de daño, no recibe daño alguno si la supera y solo sufre la mitad si la falla (debes estar montándola y ninguno de los dos incapacitado).\n\n*Girar bruscamente:* mientras estés montado, puedes hacer que un ataque que impacte a tu montura te impacte a ti en su lugar, siempre que no tengas la condición de incapacitado.",
    beneficios: [
      "+1 Fuerza, Destreza o Sabiduría (máx 20)",
      "Golpe montado (ventaja contra criaturas no montadas de menor tamaño a 5 pies)",
      "Esquivar de un salto (montura evade daño en salvaciones de DES)",
      "Girar bruscamente (redirigir ataque contra la montura hacia ti)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_observador",
    nombre: "Observador",
    categoria: "general",
    requisito: "Nivel 4 o más, Inteligencia o Sabiduría 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Inteligencia o Sabiduría en 1, hasta un máximo de 20.\n\n*Observador perspicaz:* elige una de las siguientes habilidades: Investigación, Percepción o Perspicacia. Si no tienes competencia en la habilidad elegida, la obtienes; si ya la tienes, ganas pericia en ella.\n\n*Búsqueda rápida:* puedes llevar a cabo la acción de buscar como acción adicional.",
    beneficios: [
      "+1 Inteligencia o Sabiduría (máx 20)",
      "Observador perspicaz (competencia o pericia en Investigación, Percepción o Perspicacia)",
      "Búsqueda rápida (acción de buscar como acción adicional)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "accion_adicional",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_perforador",
    nombre: "Perforador",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20.\n\n*Horadar:* una vez por turno, cuando aciertes a una criatura con un ataque que cause daño perforante, puedes volver a tirar uno de los dados de daño del ataque y debes utilizar el nuevo resultado.\n\n*Crítico potenciado:* cuando consigas un crítico que inflija daño perforante a una criatura, puedes tirar un dado de daño más al determinar el daño perforante adicional que recibe el objetivo.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Horadar (relanzar un dado de daño perforante 1/turno)",
      "Crítico potenciado (+1 dado de daño adicional en críticos con armas perforantes)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "dado_extra_critico",
        objetivo: "dano_perforante",
        aplicaA: "perforante",
        valor: 1,
        descripcion: "+1 dado de daño adicional al daño del arma en impactos críticos con daño perforante"
      }
    ]
  },
  {
    id: "dote_envenenador",
    nombre: "Envenenador",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Destreza o Inteligencia en 1, hasta un máximo de 20.\n\n*Veneno potente:* cuando hagas una tirada de daño que cause daño de veneno, esta ignorará la resistencia a ese daño.\n\n*Preparar veneno:* obtienes competencia con los útiles de envenenador. Con 1 hora de trabajo y 50 po en materiales, creas una cantidad de dosis de veneno potente igual a tu PB. Como acción adicional, puedes aplicar una dosis a un arma o munición (dura 1 minuto o hasta impactar). La criatura alcanzada debe superar salvación CON (CD 8 + mod dote + PB) o recibir 2d8 daño de veneno y quedar envenenada hasta el final de tu siguiente turno.",
    beneficios: [
      "+1 Destreza o Inteligencia (máx 20)",
      "Veneno potente (ignora resistencia al daño de veneno)",
      "Competencia con útiles de envenenador",
      "Preparar y aplicar veneno potente como acción adicional (2d8 veneno y condición envenenado)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "accion_adicional",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "competencia",
        objetivo: "herramientas",
        valor: "Útiles de envenenador",
        descripcion: "Competencia con útiles de envenenador"
      }
    ]
  },
  {
    id: "dote_resiliente",
    nombre: "Resiliente",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* elige una característica en la que no tengas competencia en tiradas de salvación. Aumenta la puntuación de la característica elegida en 1, hasta un máximo de 20.\n\n*Competencia en tiradas de salvación:* ganas competencia en las tiradas de salvación de la característica elegida.",
    beneficios: [
      "+1 a una característica a tu elección (máx 20)",
      "Competencia en las tiradas de salvación de la característica elegida"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_lanzador_ritual",
    nombre: "Lanzador Ritual",
    categoria: "general",
    requisito: "Nivel 4 o más; Inteligencia, Sabiduría o Carisma 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Inteligencia, Sabiduría o Carisma en 1, hasta un máximo de 20.\n\n*Conjuros rituales:* elige una cantidad de conjuros de nivel 1 marcados como «ritual» igual a tu bonificador por competencia. Siempre tendrás esos conjuros preparados y podrás lanzarlos como ritual o con espacios de conjuro. La aptitud mágica es la elegida con esta dote. Cada vez que tu PB aumente, puedes añadir otro ritual de nivel 1.\n\n*Ritual rápido:* puedes lanzar uno de tus conjuros rituales preparados usando su tiempo de lanzamiento habitual sin gastar espacio de conjuro. Recuperas este uso tras finalizar un descanso largo.",
    beneficios: [
      "+1 Inteligencia, Sabiduría o Carisma (máx 20)",
      "Conjuros rituales de nivel 1 preparados (igual a tu bonificador por competencia)",
      "Ritual rápido (lanzar un ritual en su tiempo normal sin gastar espacio 1/descanso largo)",
      "Aptitud mágica a elegir (INT, SAB o CAR)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "especial",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    recuperacion: "descanso_largo",
    categoriaMecanica: "consumible",
    conjurosOtorgados: [],
    selectores: [
      {
        id: "selector_aptitud_lanzador_ritual",
        tipo: "unico",
        etiqueta: "Aptitud Mágica",
        maxSelecciones: 1,
        opciones: OPCIONES_APTITUD_MAGICA,
        valorActual: []
      },
      {
        id: "selector_rituales_nv1",
        tipo: "multiple",
        visualizacion: "lista",
        etiqueta: "Conjuros Rituales de Nivel 1 (Tantos como tu PB)",
        maxSelecciones: 2,
        escaladoMaxSelecciones: [
          { nivelMinimo: 1, valor: 2 },
          { nivelMinimo: 5, valor: 3 },
          { nivelMinimo: 9, valor: 4 },
          { nivelMinimo: 13, valor: 5 },
          { nivelMinimo: 17, valor: 6 }
        ],
        opciones: ritualesNivel1,
        valorActual: []
      }
    ]
  },
  {
    id: "dote_maestro_armas_asta",
    nombre: "Maestro en Armas de Asta",
    categoria: "general",
    requisito: "Nivel 4 o más, Fuerza o Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Destreza o Fuerza en 1, hasta un máximo de 20.\n\n*Golpe con asta:* inmediatamente después de realizar la acción de atacar con un bastón, una lanza o un arma que tenga las propiedades pesada y gran alcance, puedes usar una acción adicional para hacer un ataque cuerpo a cuerpo con el otro extremo del arma (1d4 contundente).\n\n*Golpe reactivo:* mientras empuñes un bastón, una lanza o un arma que tenga las propiedades pesada y gran alcance, puedes usar una reacción para hacer un ataque cuerpo a cuerpo contra una criatura que entre dentro de tu alcance.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Golpe con asta (acción adicional para ataque de 1d4 contundente con el extremo del arma)",
      "Golpe reactivo (reacción al ataque de oportunidad cuando un enemigo entra a tu alcance)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "accion_adicional",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_centinela",
    nombre: "Centinela",
    categoria: "general",
    requisito: "Nivel 4 o más, Fuerza o Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20.\n\n*Guardián:* cuando una criatura dentro de tu alcance realiza un ataque contra un objetivo que no seas tú, puedes usar tu reacción para realizar un ataque con arma cuerpo a cuerpo contra esa criatura.\n\n*Detener:* cuando impactas a una criatura con un ataque de oportunidad, el movimiento de la criatura se convierte en 0 para el resto del turno. Las criaturas provocan tus ataques de oportunidad incluso si realizan la acción de Destrabarse antes de salir de tu alcance.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Guardián (reacción para contraatacar si atacan a un aliado a tu alcance)",
      "Detener (ataque de oportunidad reduce movimiento a 0 e ignora Destrabarse)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "reaccion",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_influencia_sombria",
    nombre: "Influencia Sombría",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Inteligencia, Sabiduría o Carisma en 1, hasta un máximo de 20.\n\n*Magia sombría:* aprendes el conjuro Invisibilidad y un conjuro de nivel 1 de tu elección de las escuelas de Ilusión o Nigromancia. Puedes lanzar cada uno de estos conjuros una vez sin gastar un espacio de conjuro, y recuperas la capacidad de hacerlo cuando terminas un descanso largo. También puedes lanzar estos conjuros usando espacios de conjuro del nivel apropiado. Tu aptitud mágica para estos conjuros es la característica que aumentaste con esta dote.",
    beneficios: [
      "+1 Inteligencia, Sabiduría o Carisma (máx 20)",
      "Magia sombría (Invisibilidad y un conjuro nv1 Ilusión/Nigromancia gratis 1 vez c/u por descanso largo)",
      "Uso libre de espacios de conjuro propios para relanzarlos"
    ],
    fuente: "PHB 2024",
    tipoAccion: "especial",
    tieneUsosLimitados: true,
    usosMaximos: 2,
    recuperacion: "descanso_largo",
    categoriaMecanica: "consumible",
    conjurosOtorgados: ["h_invisibilidad"],
    selectores: [
      {
        id: "selector_aptitud_influencia_sombria",
        tipo: "unico",
        etiqueta: "Aptitud Mágica (Influencia Sombría)",
        maxSelecciones: 1,
        opciones: OPCIONES_APTITUD_MAGICA,
        valorActual: ["carisma"]
      },
      {
        id: "selector_conjuro_nv1_influencia_sombria",
        tipo: "unico",
        visualizacion: "lista",
        etiqueta: "Conjuro de Nivel 1 (Ilusión o Nigromancia)",
        maxSelecciones: 1,
        opciones: conjuros1IlusionONigromancia,
        valorActual: []
      }
    ]
  },
  {
    id: "dote_tirador_primera",
    nombre: "Tirador de Primera",
    categoria: "general",
    requisito: "Nivel 4 o más, Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Destreza en 1, hasta un máximo de 20.\n\n*Sortear cobertura:* tus ataques a distancia con armas ignoran la cobertura media y tres cuartos.\n\n*Disparar cuerpo a cuerpo:* estar a 5 pies de un enemigo no impone desventaja en tus tiradas de ataque a distancia con armas.\n\n*Tiros lejanos:* atacar a largo alcance no impone desventaja en tus tiradas de ataque a distancia con armas.",
    beneficios: [
      "+1 Destreza (máx 20)",
      "Sortear cobertura (ignora media y tres cuartos de cobertura a distancia)",
      "Disparar cuerpo a cuerpo (sin desventaja por tener enemigos a 5 pies)",
      "Tiros lejanos (sin desventaja a largo alcance)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_maestro_escudos",
    nombre: "Maestro en Escudos",
    categoria: "general",
    requisito: "Nivel 4 o más, competencia con escudos",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza en 1, hasta un máximo de 20.\n\n*Golpe con escudo:* si impactas a una criatura con un ataque de arma cuerpo a cuerpo durante tu turno mientras empuñas un escudo, puedes forzar inmediatamente a esa criatura a realizar una tirada de salvación de Fuerza (CD 8 + bonificador de competencia + modificador de Fuerza). Si falla, puedes derribarla o empujarla 5 pies de ti.\n\n*Interponer escudo:* si eres sometido a un efecto que te permite hacer una tirada de salvación de Destreza para sufrir solo la mitad de daño, puedes usar tu reacción para no sufrir daño si superas la salvación, interponiendo tu escudo.",
    beneficios: [
      "+1 Fuerza (máx 20)",
      "Golpe con escudo (salvación FUE CD 8+PB+FUE al impactar cuerpo a cuerpo para derribar o empujar 5 pies)",
      "Interponer escudo (reacción para no sufrir daño en salvación exitosa de Destreza a daño reducido)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "reaccion",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_experto_habilidades",
    nombre: "Experto en Habilidades",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta una puntuación de característica de tu elección en 1, hasta un máximo de 20.\n\n*Competencia en habilidad:* obtienes competencia en una habilidad de tu elección.\n\n*Pericia:* obtienes pericia en una habilidad de tu elección en la que ya seas competente.",
    beneficios: [
      "+1 a una característica a tu elección (máx 20)",
      "1 competencia en habilidad a tu elección",
      "1 pericia en una habilidad en la que ya seas competente"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_rebanador",
    nombre: "Rebanador",
    categoria: "general",
    requisito: "Nivel 4 o más, Fuerza o Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20.\n\n*Lacerar:* una vez por turno, cuando infliges daño cortante a una criatura con un ataque, puedes reducir su velocidad en 10 pies hasta el comienzo de tu siguiente turno.\n\n*Crítico potenciado:* cuando obtienes un golpe crítico que inflige daño cortante a una criatura, infliges heridas graves y la criatura tiene desventaja en todas las tiradas de ataque hasta el comienzo de tu siguiente turno.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Lacerar (1 vez/turno daño cortante reduce velocidad 10 pies)",
      "Crítico potenciado (crítico con daño cortante impone desventaja en tiradas de ataque al objetivo)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_lanzador_preciso",
    nombre: "Lanzador Preciso",
    categoria: "general",
    requisito: "Nivel 4 o más, aptitud para lanzar al menos un conjuro",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Inteligencia, Sabiduría o Carisma en 1, hasta un máximo de 20.\n\n*Alcance incrementado:* cuando lanzas un conjuro con tirada de ataque que tiene un alcance de al menos 10 pies, su alcance aumenta en 60 pies.\n\n*Ignorar cobertura:* tus tiradas de ataque de conjuro a distancia ignoran cobertura media y tres cuartos.\n\n*Disparar en melé:* estar a 5 pies de un enemigo no impone desventaja en tus tiradas de ataque de conjuros a distancia.",
    beneficios: [
      "+1 Inteligencia, Sabiduría o Carisma (máx 20)",
      "Alcance incrementado (+60 pies a conjuros con tirada de ataque de al menos 10 pies)",
      "Ignorar cobertura (ignora cobertura media y 3/4 en ataques de conjuro)",
      "Lanzar cuerpo a cuerpo (sin desventaja a 5 pies)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  },
  {
    id: "dote_telequinetico",
    nombre: "Telequinético",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Inteligencia, Sabiduría o Carisma en 1, hasta un máximo de 20.\n\n*Mano de mago menor:* aprendes el truco Mano de Mago. Puedes lanzarlo sin componentes verbales ni somáticos, puedes hacer que la mano sea invisible, y su alcance aumenta en 30 pies si ya lo conocías.\n\n*Empellón telequinético:* como acción adicional, puedes intentar mover telequinéticamente a una criatura a 30 pies que puedas ver. El objetivo debe superar una tirada de salvación de Fuerza (CD 8 + PB + mod de la característica aumentada) o ser empujado o atraído 5 pies hacia ti o lejos de ti. Una criatura puede fallar voluntariamente esta salvación.",
    beneficios: [
      "+1 Inteligencia, Sabiduría o Carisma (máx 20)",
      "Truco Mano de Mago (invisible, sin componentes y alcance extendido)",
      "Empellón telequinético (acción adicional salvación FUE CD 8+PB+Aptitud para mover 5 pies a una criatura a 30 pies)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "accion_adicional",
    categoriaMecanica: "pasivo_permanente",
    conjurosOtorgados: ["h_mano-de-mago"],
    selectores: [
      {
        id: "selector_aptitud_telequinetico",
        tipo: "unico",
        etiqueta: "Aptitud Mágica (Telequinético)",
        maxSelecciones: 1,
        opciones: OPCIONES_APTITUD_MAGICA,
        valorActual: ["inteligencia"]
      }
    ]
  },
  {
    id: "dote_maestro_de_armas",
    nombre: "Maestro de Armas",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20.\n\n*Propiedad de maestría:* obtienes el beneficio de la propiedad de maestría de un tipo de arma cuerpo a cuerpo o a distancia de tu elección con la que tengas competencia, como Despejar, Empujar o Derribar. Cada vez que termines un descanso largo, puedes cambiar el tipo de arma elegido a otro con el que tengas competencia.",
    beneficios: [
      "+1 Fuerza o Destreza (máx 20)",
      "Propiedad de maestría (desbloquea la maestría de un arma competente, intercambiable en descanso largo)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    selectores: [
      {
        id: "maestrias_aprendidas",
        tipo: "unico",
        etiqueta: "Maestría de Arma Aprendida",
        maxSelecciones: 1,
        opciones: OPCIONES_PROPIEDADES_MAESTRIA,
        valorActual: []
      }
    ]
  },
  {
    id: "dote_lanzador_en_combate",
    nombre: "Lanzador en Combate",
    categoria: "general",
    requisito: "Nivel 4 o más, aptitud para lanzar al menos un conjuro",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Constitución, Inteligencia, Sabiduría o Carisma en 1, hasta un máximo de 20.\n\n*Concentración enfocada:* tienes ventaja en las tiradas de salvación de Constitución que realizas para mantener la concentración en un conjuro.\n\n*Hechizo reactivo:* cuando una criatura hostil provoca un ataque de oportunidad tuyo al salir de tu alcance, puedes usar tu reacción para lanzar un conjuro a la criatura en lugar de realizar un ataque de oportunidad. El conjuro debe tener un tiempo de lanzamiento de 1 acción y debe tener como único objetivo a esa criatura.\n\n*Componentes somáticos:* puedes realizar los componentes somáticos de los conjuros incluso cuando tienes armas o un escudo en una o ambas manos.",
    beneficios: [
      "+1 Constitución, Inteligencia, Sabiduría o Carisma (máx 20)",
      "Ventaja en salvaciones de CON para mantener concentración",
      "Hechizo reactivo (reacción para lanzar conjuro de 1 acción a objetivo único como ataque de oportunidad)",
      "Componentes somáticos permitidos con manos ocupadas por armas/escudo"
    ],
    fuente: "PHB 2024",
    tipoAccion: "reaccion",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "ventaja",
        objetivo: "salvacion.constitucion.concentracion",
        valor: "ventaja",
        condicion: "concentracion",
        descripcion: "Ventaja en tiradas de salvación de Constitución para mantener la concentración"
      }
    ]
  },
  {
    id: "dote_telepatico",
    nombre: "Telepático",
    categoria: "general",
    requisito: "Nivel 4 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Inteligencia, Sabiduría o Carisma en 1, hasta un máximo de 20.\n\n*Habla telepática:* puedes comunicarte telepáticamente con cualquier criatura que puedas ver a 60 pies o menos de ti. La criatura comprende tu comunicación telepática solo si conoce el idioma que estás usando.\n\n*Detectar pensamientos:* puedes lanzar el conjuro Detectar Pensamientos sin gastar un espacio de conjuro ni requerir componentes verbales, somáticos ni materiales. Recuperas la capacidad de lanzarlo de esta forma cuando terminas un descanso largo. También puedes lanzarlo usando espacios de conjuro propios. Tu aptitud mágica es la característica que aumentaste con esta dote.",
    beneficios: [
      "+1 Inteligencia, Sabiduría o Carisma (máx 20)",
      "Habla telepática (comunicación mental a 60 pies con criaturas visibles que compartan idioma)",
      "Detectar pensamientos gratis 1 vez por descanso largo sin espacios ni componentes",
      "Uso libre de espacios propios para relanzarlo"
    ],
    fuente: "PHB 2024",
    tipoAccion: "accion",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    recuperacion: "descanso_largo",
    categoriaMecanica: "consumible",
    conjurosOtorgados: ["h_detectar-pensamientos"],
    selectores: [
      {
        id: "selector_aptitud_telepatico",
        tipo: "unico",
        etiqueta: "Aptitud Mágica (Telepático)",
        maxSelecciones: 1,
        opciones: OPCIONES_APTITUD_MAGICA,
        valorActual: ["inteligencia"]
      }
    ]
  },
  {
    id: "dote_veloz",
    nombre: "Veloz",
    categoria: "general",
    requisito: "Nivel 4 o más, Destreza o Constitución 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Destreza o Constitución en 1, hasta un máximo de 20.\n\n*Aumento de velocidad:* tu velocidad aumenta en 10 pies.\n\n*Corredor tenaz:* cuando realizas la acción de Correr, el terreno difícil no te cuesta movimiento adicional durante ese turno.\n\n*Movimiento ágil:* cuando realizas un ataque cuerpo a cuerpo contra una criatura, no provocas ataques de oportunidad de esa criatura durante el resto del turno, hayas impactado o no.",
    beneficios: [
      "+1 Destreza o Constitución (máx 20)",
      "+10 pies a la velocidad de movimiento a pie",
      "Corredor tenaz (ignora terreno difícil al usar la acción de Correr)",
      "Movimiento ágil (atacar cuerpo a cuerpo a un enemigo evita que provoque ataques de oportunidad suyos en ese turno)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente",
    efectos: [
      {
        tipo: "modificador_velocidad",
        objetivo: "velocidad.caminar",
        valor: 10,
        descripcion: "+10 pies a la velocidad de movimiento a pie"
      }
    ]
  },
  {
    id: "dote_acechador",
    nombre: "Acechador",
    categoria: "general",
    requisito: "Nivel 4 o más, Destreza 13 o más",
    descripcion:
      "*Mejora de característica:* aumenta tu puntuación de Destreza en 1, hasta un máximo de 20.\n\n*Visión ciega:* obtienes visión ciega con un alcance de 10 pies.\n\n*Niebla de guerra:* explotando la distracción de la batalla, tienes ventaja en las pruebas de Destreza (Sigilo) realizadas como parte de la acción de Esconderte mientras estés en combate.\n\n*En la sombra:* si estás escondido y realizas un ataque a distancia con arma que falla, realizar el ataque no revela tu posición.",
    beneficios: [
      "+1 Destreza (máx 20)",
      "Visión ciega (10 pies)",
      "Niebla de guerra (ventaja en pruebas de Sigilo al Esconderte durante el combate)",
      "En la sombra (fallar un ataque a distancia con arma mientras estás escondido no revela tu posición)"
    ],
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    categoriaMecanica: "pasivo_permanente"
  }
];

export const TODAS_LAS_DOTES_CANONICAS_DND55: DotePersonaje[] = [
  ...DOTES_ORIGEN_DND55,
  ...DOTES_GENERALES_Y_EPICAS_DND55
];
