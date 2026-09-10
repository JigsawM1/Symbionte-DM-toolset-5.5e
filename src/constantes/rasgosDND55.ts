import type {
  DotePersonaje,
  EfectoMecanicoRasgo,
  SelectorRasgo,
  TablaEscaladoRasgo
} from "@/tipos/rasgos";
import { CATALOGO_CLASES_DND55 } from "./clasesDND55";

// =======================================================
// DICCIONARIO CANÓNICO DE RASGOS D&D 5.5e (PHB 2024)
// =======================================================

export interface PlantillaRasgoClase {
  nivel: number;
  nombre: string;
  descripcion: string;
  tipoAccion: "pasivo" | "accion" | "accion_adicional" | "reaccion" | "especial";
  subclase?: string;
  tieneUsosLimitados?: boolean;
  obtenerUsosMaximos?: (nivel: number) => number;
  formulaUsos?: string | null;
  recuperacion?: "descanso_corto" | "descanso_largo" | "manual" | "ninguno";
  formulaDados?: string;

  // ── ESCALADOS GENÉRICOS (reemplazan bifurcaciones por nombre en el builder) ──
  /** Tabla de escalado de fórmula de dados por nivel mínimo */
  escaladoFormulaDados?: Array<{ nivelMinimo: number; valor: string }>;
  /** Escalado de usos máximos: por tabla de nivel o por modificador de stat */
  escaladoUsos?: {
    tipo: "por_nivel" | "por_modificador";
    tabla?: Array<{ nivelMinimo: number; valor: number }>;
    modificador?: string; // "carisma", "sabiduria", etc.
    minimo?: number;
  };
  /** Cambio de tipo de recuperación por nivel mínimo */
  escaladoRecuperacion?: Array<{ nivelMinimo: number; valor: "descanso_corto" | "descanso_largo" | "manual" | "ninguno" }>;
  /** Si true, el builder sincroniza el `valor` de efectos dado_extra_dano/ataque_desarmado/bono_dano_fuerza con la formulaDados resuelta */
  sincronizarEfectosConFormula?: boolean;

  // Mecánicas estructuradas
  esActivable?: boolean;
  autoDesactivar?: boolean;
  ligadoA?: string;
  gastarDePadre?: boolean;
  heredarDadosPadre?: boolean;
  condicionAlActivar?: string;
  conjurosOtorgados?: string[];
  restaurarUsosAlActivar?: { idRasgoObjetivo: string; cantidad: number | "maximo" };
  categoriaMecanica?: "consumible" | "activable" | "selector_informativo" | "pasivo_permanente" | "extension" | "curacion";
  formulaEscalado?: string;
  efectos?: EfectoMecanicoRasgo[];
  selectores?: SelectorRasgo[];
  tablaProgresion?: TablaEscaladoRasgo;
}


export interface PlantillaRasgoEspecie {
  nombre: string;
  descripcion: string;
  subespecie?: string;
  tipoAccion: "pasivo" | "accion" | "accion_adicional" | "reaccion" | "especial";
  nivelRequerido?: number;
  tieneUsosLimitados?: boolean;
  usosMaximos?: number;
  obtenerUsosMaximos?: (nivel: number, bonificadorCompetencia?: number) => number;
  formulaUsos?: string | null;
  recuperacion?: "descanso_corto" | "descanso_largo" | "manual" | "ninguno";
  formulaDados?: string;
  
  // Mecánicas estructuradas
  esActivable?: boolean;
  autoDesactivar?: boolean;
  ligadoA?: string;
  condicionAlActivar?: string;
  conjurosOtorgados?: string[];
  categoriaMecanica?: "consumible" | "activable" | "selector_informativo" | "pasivo_permanente" | "extension" | "curacion";
  formulaEscalado?: string;
  efectos?: EfectoMecanicoRasgo[];
  selectores?: SelectorRasgo[];
  tablaProgresion?: TablaEscaladoRasgo;
}

// -------------------------------------------------------
// 1. RASGOS DE CLASES Y SUBCLASES OFICIALES (D&D 5.5e / 2024)
// Derivados dinámicamente de CATALOGO_CLASES_DND55
// -------------------------------------------------------

export const RASGOS_POR_CLASE: Record<string, PlantillaRasgoClase[]> = Object.fromEntries(
  CATALOGO_CLASES_DND55.map((c) => [
    c.nombre,
    [
      ...c.rasgos,
      ...c.subclases.flatMap((sub) => sub.rasgos)
    ]
  ])
);

// -------------------------------------------------------
// 2. RASGOS DE ESPECIES OFICIALES (D&D 5.5e / 2024)
// -------------------------------------------------------

export const RASGOS_POR_ESPECIE: Record<string, PlantillaRasgoEspecie[]> = {
  "Humano": [
    {
      nombre: "Ingenio ingenioso",
      descripcion: "Ganas una dote de origen adicional de tu elección al nivel 1.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Versátil",
      descripcion: "Ganas competencia en una habilidad de tu elección.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Inspiración heroica",
      descripcion: "Al finalizar un descanso largo, ganas automáticamente Inspiración heroica si no la tenías.",
      tipoAccion: "pasivo"
    }
  ],

  "Elfo": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Tienes visión en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo",
      categoriaMecanica: "pasivo_permanente"
    },
    {
      nombre: "Linaje élfico",
      descripcion: "Formas parte de un linaje que te otorga capacidades sobrenaturales y conjuros a tus respectivos niveles.",
      tipoAccion: "pasivo",
      categoriaMecanica: "pasivo_permanente"
    },
    {
      nombre: "Linaje feérico",
      descripcion: "Tienes ventaja en las tiradas de salvación para evitar o poner fin al estado de hechizado.",
      tipoAccion: "pasivo",
      categoriaMecanica: "pasivo_permanente"
    },
    {
      nombre: "Sentidos agudos",
      descripcion: "Tienes competencia en la habilidad de Percepción, Perspicacia o Supervivencia.",
      tipoAccion: "pasivo",
      categoriaMecanica: "pasivo_permanente"
    },
    {
      nombre: "Trance",
      descripcion: "No necesitas dormir y la magia no puede dormirte. Puedes finalizar un descanso largo en 4 horas si las pasas en meditación.",
      tipoAccion: "pasivo",
      categoriaMecanica: "pasivo_permanente"
    }
  ],

  "Enano": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies (o 120 pies con linaje profundo).",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Resistencia enana",
      descripcion: "Tienes resistencia al daño por veneno y ventaja en tiradas de salvación contra el estado Envenenado.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Dureza enana",
      descripcion: "Tus puntos de golpe máximos aumentan en 1 por cada nivel que tengas.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Sentido de la piedra",
      descripcion: "Como acción adicional, ganas visión de temblor (sentido sísmico) a 60 pies sobre piedra durante 10 minutos (3 usos/descanso largo).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 3,
      recuperacion: "descanso_largo"
    }
  ],

  "Mediano": [
    {
      nombre: "Afortunado (Mediano)",
      descripcion: "Cuando sacas un 1 en el d20 en una tirada de ataque, prueba de característica o salvación, puedes repetir el dado y debes usar el nuevo resultado.",
      tipoAccion: "reaccion"
    },
    {
      nombre: "Valiente",
      descripcion: "Tienes ventaja en las tiradas de salvación para evitar o terminar el estado Asustado.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Agilidad de mediano",
      descripcion: "Puedes moverte a través del espacio de cualquier criatura que sea de un tamaño superior al tuyo.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Sigilo natural",
      descripcion: "Puedes intentar esconderte incluso cuando estés oculto únicamente tras una criatura que sea al menos de un tamaño superior al tuyo.",
      tipoAccion: "pasivo"
    }
  ],

  "Gnomo": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Astucia gnómica",
      descripcion: "Tienes ventaja en todas las tiradas de salvación de Inteligencia, Sabiduría y Carisma contra magia.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Linaje gnómico",
      descripcion: "Gnomo del bosque (conoce el truco Ilusión menor y habla con bestias) o Gnomo de las rocas (conoce Prestidigitación e inventa artilugios).",
      tipoAccion: "pasivo"
    }
  ],

  "Tiefling": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Legado infernal",
      descripcion: "Obtienes resistencia a un tipo de daño (Fuego, Veneno o Necrótico) y conjuros sobrenaturales innatos según tu linaje (Abisal, Ctónico o Infernal).",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Taumaturgia innata",
      descripcion: "Conoces el truco Taumaturgia y lo lanzas usando Carisma o Inteligencia.",
      tipoAccion: "pasivo"
    }
  ],

  "Dracónido": [
    {
      nombre: "Arma de aliento",
      descripcion: "Cuando lleves a cabo la acción de atacar, puedes sustituir uno de tus ataques por una exhalación mágica destructiva (cono de 15 pies o línea de 30 pies) de tu tipo de dragón (usos iguales a tu bonificador de competencia).",
      tipoAccion: "accion",
      tieneUsosLimitados: true,
      usosMaximos: 2,
      recuperacion: "descanso_largo",
      formulaDados: "1d10"
    },
    {
      nombre: "Resistencia a daño dracónico",
      descripcion: "Tienes resistencia al tipo de daño asociado con tu linaje dracónico (Fuego, Frío, Ácido, Relámpago o Veneno).",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Vuelo dracónico (Nivel 5)",
      descripcion: "A partir de nivel 5, puedes desplegar alas espectrales como acción adicional durante 10 minutos (1/descanso largo).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo"
    }
  ],

  "Orco": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 120 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Embestida impetuosa",
      descripcion: "Como acción adicional, puedes moverte hasta tu velocidad hacia un enemigo y ganas puntos de golpe temporales iguales a tu bonificador de competencia (usos iguales a PB).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 2,
      recuperacion: "descanso_corto"
    },
    {
      nombre: "Resistencia implacable",
      descripcion: "Cuando tus puntos de golpe se reducen a 0 pero no mueres en el acto, puedes quedar a 1 punto de golpe en su lugar (1/descanso largo).",
      tipoAccion: "reaccion",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo"
    }
  ],

  "Goliat": [
    {
      nombre: "Ascendencia de gigantes",
      descripcion: "Obtienes un poder sobrenatural de gigante (Gigante de fuego, escarcha, colina, piedra, tormenta o nubes) utilizable tantas veces como tu bonificador de competencia.",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 2,
      recuperacion: "descanso_largo"
    },
    {
      nombre: "Forma gigantesca (Nivel 5)",
      descripcion: "A nivel 5, puedes hacerte de tamaño Grande durante 10 minutos como acción adicional (1/descanso largo).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo"
    },
    {
      nombre: "Poderosa complexión",
      descripcion: "Cuentas como un tamaño superior para determinar tu capacidad de carga y peso que puedes empujar, arrastrar o levantar.",
      tipoAccion: "pasivo"
    }
  ],

  "Aasimar": [
    {
      nombre: "Visión en la oscuridad",
      descripcion: "Puedes ver en la oscuridad hasta 60 pies.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Manos sanadoras",
      descripcion: "Como acción de magia, tocas a una criatura y tiras tantos d4 como tu bonificador de competencia, curándole esa cantidad de HP (1/descanso largo).",
      tipoAccion: "accion",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo",
      formulaDados: "2d4"
    },
    {
      nombre: "Resistencia celestial",
      descripcion: "Tienes resistencia al daño radiante y necrótico.",
      tipoAccion: "pasivo"
    },
    {
      nombre: "Revelación celestial (Nivel 3)",
      descripcion: "Como acción adicional, desatas tu poder divino durante 1 minuto (Alas radiantes, Consunción radiante o Velo necrótico).",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      recuperacion: "descanso_largo"
    }
  ]
};

// -------------------------------------------------------
// 3. DOTES CANÓNICAS DE D&D 5.5e (PHB 2024)
// -------------------------------------------------------

export const DOTES_CANONICAS_DND55: DotePersonaje[] = [
  {
    id: "dote_alerta",
    nombre: "Alerta",
    categoria: "origen",
    descripcion: "Siempre estás atento al peligro. Sumas tu bonificador de competencia a la iniciativa y puedes intercambiar tu tirada de iniciativa con la de un aliado voluntario.",
    beneficios: ["+PB a iniciativa", "Intercambio de iniciativa"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_iniciativa_magica",
    nombre: "Iniciado en la Magia",
    categoria: "origen",
    descripcion: "Aprendes dos trucos y un conjuro de nivel 1 de la lista de Clérigo, Druida o Mago. Puedes lanzar el conjuro de nivel 1 una vez al día sin gastar espacio.",
    beneficios: ["2 Trucos elegidos", "1 Conjuro de Nivel 1 (1/descanso largo)"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_suerte",
    nombre: "Afortunado",
    categoria: "origen",
    descripcion: "Tienes puntos de suerte iguales a tu bonificador de competencia. Puedes gastar un punto para ganar ventaja en un d20 o imponer desventaja a un atacante contra ti.",
    beneficios: ["Puntos de suerte iguales a PB", "Ventaja propia o desventaja a atacante"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_musico",
    nombre: "Músico",
    categoria: "origen",
    descripcion: "Al finalizar un descanso corto o largo, tocas música para inspirar a tus aliados. Otorgas Inspiración heroica a tantos compañeros como tu bonificador de competencia.",
    beneficios: ["Inspiración heroica para aliados tras descanso"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_duro",
    nombre: "Duro / Robusto",
    categoria: "origen",
    descripcion: "Tus puntos de golpe máximos aumentan en una cantidad igual al doble de tu nivel.",
    beneficios: ["+2 HP por nivel"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_tirador_primera",
    nombre: "Tirador de Primera (Sharpshooter)",
    categoria: "general",
    requisito: "Destreza 13+",
    descripcion: "Dominas el combate a distancia: disparar a alcance largo no te impone desventaja, tus ataques a distancia ignoran cobertura media y tres cuartos, y no tienes desventaja al disparar cuerpo a cuerpo.",
    beneficios: ["Ignora cobertura media y 3/4", "Sin desventaja a alcance largo", "Sin penalización cuerpo a cuerpo"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_maestro_armas_pesadas",
    nombre: "Maestro en Armas Pesadas (Great Weapon Master)",
    categoria: "general",
    requisito: "Fuerza 13+",
    descripcion: "Cuando asestes un crítico o reduzcas a 0 HP a una criatura con un arma cuerpo a cuerpo pesada, puedes hacer otro ataque como acción adicional. Sumas tu PB al daño de armas pesadas.",
    beneficios: ["Ataque extra tras crítico/muerte", "+PB al daño con armas pesadas"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_combatiente_dos_armas",
    nombre: "Combatiente con Dos Armas (Dual Wielder)",
    categoria: "general",
    requisito: "Fuerza o Destreza 13+",
    descripcion: "Puedes usar combate con dos armas incluso con armas que no sean ligeras. Puedes hacer un ataque adicional extra como acción adicional.",
    beneficios: ["Uso con armas no ligeras", "Ataque adicional secundario"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_resiliente",
    nombre: "Resiliente",
    categoria: "general",
    descripcion: "Aumentas una puntuación de característica en +1 y ganas competencia en las tiradas de salvación con esa característica.",
    beneficios: ["+1 a característica", "Competencia en salvación elegida"],
    fuente: "PHB 2024"
  },
  {
    id: "dote_don_pericia_combate",
    nombre: "Don de la Pericia en Combate",
    categoria: "don_epico",
    requisito: "Nivel 19+",
    descripcion: "Aumentas una característica en +1 (máx 30). Si fallas una tirada de ataque, puedes convertirla en un acierto una vez por turno.",
    beneficios: ["+1 característica (máx 30)", "Convertir fallo en acierto (1/turno)"],
    fuente: "PHB 2024"
  }
];
