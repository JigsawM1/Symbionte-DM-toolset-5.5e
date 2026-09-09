import type {
  DefinicionEspecie
} from "@/tipos/especies";

// =======================================================
// CATÁLOGO CANÓNICO DE ESPECIES / RAZAS D&D 5.5e (2024)
// =======================================================

export const CATALOGO_ESPECIES_DND55: DefinicionEspecie[] = [
  // -----------------------------------------------------
  // 1. AASIMAR
  // -----------------------------------------------------
  {
    id: "aasimar",
    nombre: "Aasimar",
    descripcion: "Los aasimar son seres imbuidos con la chispa divina de los Planos Superiores, manifestando dones celestiales de luz, curación y alas espirituales.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Mediano", "Pequeño"],
    tamanoPorDefecto: "Mediano",
    velocidadBase: 30,
    visionOscuridad: 60,
    resistenciasDanio: ["Necrótico", "Radiante"],
    conjurosInnatos: [
      {
        hechizoId: "luz",
        nombreHechizo: "Luz",
        caracteristica: "carisma",
        esTruco: true,
        descripcion: "Conoces el truco luz. El Carisma es tu aptitud mágica para lanzarlo."
      }
    ],
    rasgos: [
      {
        nombre: "Tipo de criatura",
        descripcion: "Eres una criatura del tipo Humanoide.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Tamaño",
        descripcion: "Eres Mediano o Pequeño. Eliges el tamaño cuando seleccionas esta especie.",
        tipoAccion: "pasivo",
        categoriaMecanica: "selector_informativo",
        selectores: [
          {
            id: "selector_tamano_especie",
            tipo: "unico",
            etiqueta: "Tamaño",
            maxSelecciones: 1,
            opciones: [
              {
                id: "mediano",
                nombre: "Mediano",
                descripcion: "Tu personaje es de tamaño Mediano."
              },
              {
                id: "pequeno",
                nombre: "Pequeño",
                descripcion: "Tu personaje es de tamaño Pequeño."
              }
            ],
            valorActual: ["mediano"]
          }
        ]
      },
      {
        nombre: "Resistencia celestial",
        descripcion: "Tienes resistencia al daño necrótico y al radiante.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Visión en la oscuridad",
        descripcion: "Tienes visión en la oscuridad hasta 60 pies.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Portador de luz",
        descripcion: "Conoces el truco luz. El Carisma es tu aptitud mágica para lanzarlo.",
        tipoAccion: "pasivo",
        conjurosOtorgados: ["luz"],
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Manos curativas",
        descripcion: "Como acción de magia, tocas a una criatura y tiras una cantidad de d4 igual a tu bonificador por competencia. La criatura recupera una cantidad de puntos de golpe igual al resultado total de la tirada. Cuando uses este atributo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
        tipoAccion: "accion",
        tieneUsosLimitados: true,
        usosMaximos: 1,
        recuperacion: "descanso_largo",
        formulaDados: "2d4",
        formulaEscalado: "bono_competencia",
        categoriaMecanica: "curacion"
      },
      {
        nombre: "Revelación celestial",
        descripcion: "Cuando alcanzas el nivel 3 de personaje, puedes transformarte como acción adicional y usar una de las opciones que aparecen a continuación (elige la opción cada vez que te transformes). La transformación dura 1 minuto o hasta que le pongas fin (no requiere acción). Cuando te transformes, no podrás volver a hacerlo hasta que finalices un descanso largo.\n\nUna vez en cada uno de tus turnos hasta que finalice la transformación, puedes infligir daño adicional a un objetivo cuando le hagas daño con un ataque o un conjuro. El daño adicional es igual a tu bonificador por competencia y el tipo es necrótico para Mortaja necrótica o radiante para Alas celestiales y Fulgor interior.\n\nEstas son las opciones de transformación:\n\n - *Alas celestiales:* Dos alas espectrales brotan temporalmente de tu espalda. Hasta que la transformación termine, tienes una velocidad volando igual a tu velocidad.\n\n - *Fulgor interior:* De tus ojos y tu boca surge temporalmente una luz abrasadora. Durante este tiempo, emites luz brillante en un radio de 10 pies y luz tenue 10 pies más allá y, al final de cada uno de tus turnos, cada criatura a 10 pies o menos de ti recibirá una cantidad de daño radiante igual a tu bonificador por competencia.\n\n - *Mortaja necrótica:* Tus ojos se vuelven brevemente pozos de oscuridad y unas alas que no te permiten volar brotan temporalmente de tu espalda. Las criaturas que no sean tus aliados y estén a 10 pies o menos de ti deberán superar una tirada de salvación de Carisma (CD 8 más tu modificador por Carisma y tu bonificador por competencia) o tendrán el estado de asustadas hasta el final de tu siguiente turno.",
        tipoAccion: "accion_adicional",
        nivelRequerido: 3,
        tieneUsosLimitados: true,
        usosMaximos: 1,
        recuperacion: "descanso_largo",
        esActivable: true,
        categoriaMecanica: "selector_informativo",
        selectores: [
          {
            id: "opcion_revelacion_celestial",
            tipo: "unico",
            etiqueta: "Opción de Revelación Celestial",
            maxSelecciones: 1,
            opciones: [
              {
                id: "alas_celestiales",
                nombre: "Alas celestiales",
                descripcion: "Dos alas espectrales brotan temporalmente de tu espalda. Hasta que la transformación termine, tienes una velocidad volando igual a tu velocidad. Daño extra radiante igual a tu PB una vez por turno."
              },
              {
                id: "fulgor_interior",
                nombre: "Fulgor interior",
                descripcion: "De tus ojos y tu boca surge una luz abrasadora. Emites luz brillante en 10 pies y tenue otros 10 pies. Al final de cada uno de tus turnos, cada criatura a 10 pies o menos recibe daño radiante igual a tu PB. Daño extra radiante igual a tu PB una vez por turno."
              },
              {
                id: "mortaja_necrotica",
                nombre: "Mortaja necrótica",
                descripcion: "Tus ojos se vuelven pozos de oscuridad y brotan alas que no vuelan. Las criaturas no aliadas a 10 pies o menos deben superar una salvación de Carisma (CD 8 + mod CAR + PB) o estarán asustadas hasta el final de tu siguiente turno. Daño extra necrótico igual a tu PB una vez por turno."
              }
            ],
            valorActual: ["alas_celestiales"]
          }
        ]
      }
    ]
  },

  // -----------------------------------------------------
  // 2. ELFO
  // -----------------------------------------------------
  {
    id: "elfo",
    nombre: "Elfo",
    descripcion: "Criaturas longevas y mágicas vinculadas al reino feérico, con sentidos sobrenaturales y linajes ancestrales.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Mediano"],
    tamanoPorDefecto: "Mediano",
    velocidadBase: 30,
    visionOscuridad: 60,
    rasgos: [
      {
        nombre: "Visión en la oscuridad",
        descripcion: "Tienes visión en la oscuridad hasta 60 pies.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Linaje élfico",
        descripcion: "Formas parte de un linaje que te otorga capacidades sobrenaturales según la opción elegida.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Ascendencia feérica",
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
        descripcion: "No necesitas dormir y la magia no puede dormirte. Puedes finalizar un descanso largo en 4 horas de meditación.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      }
    ],
    subespecies: [
      {
        id: "drow",
        especiePadre: "elfo",
        nombre: "Drow",
        descripcion: "Adaptados a las profundidades con visión en la oscuridad superior y magia oscura.",
        modificadores: { visionOscuridad: 120 },
        rasgos: [
          {
            nombre: "Visión en la oscuridad superior (120 pies)",
            descripcion: "El alcance de tu visión en la oscuridad aumenta a 120 pies.",
            tipoAccion: "pasivo"
          }
        ],
        conjurosInnatos: [
          { hechizoId: "luces_danzantes", nombreHechizo: "Luces danzantes", caracteristica: "elegir", esTruco: true, nivelRequerido: 1 },
          { hechizoId: "fuego_feerico", nombreHechizo: "Fuego feérico", caracteristica: "elegir", esTruco: false, nivelRequerido: 3, usosGratis: 1, recuperacion: "descanso_largo" },
          { hechizoId: "oscuridad", nombreHechizo: "Oscuridad", caracteristica: "elegir", esTruco: false, nivelRequerido: 5, usosGratis: 1, recuperacion: "descanso_largo" }
        ]
      },
      {
        id: "alto_elfo",
        especiePadre: "elfo",
        nombre: "Alto elfo",
        descripcion: "Maestros arcanos capaces de aprender y sustituir trucos de la lista de mago.",
        rasgos: [
          {
            nombre: "Magia de alto elfo",
            descripcion: "Conoces el truco prestidigitación y puedes sustituirlo tras un descanso largo por otro de mago.",
            tipoAccion: "pasivo"
          }
        ],
        conjurosInnatos: [
          { hechizoId: "prestidigitacion", nombreHechizo: "Prestidigitación", caracteristica: "elegir", esTruco: true, nivelRequerido: 1 },
          { hechizoId: "detectar_magia", nombreHechizo: "Detectar magia", caracteristica: "elegir", esTruco: false, nivelRequerido: 3, usosGratis: 1, recuperacion: "descanso_largo" },
          { hechizoId: "paso_brumoso", nombreHechizo: "Paso brumoso", caracteristica: "elegir", esTruco: false, nivelRequerido: 5, usosGratis: 1, recuperacion: "descanso_largo" }
        ]
      },
      {
        id: "elfo_bosques",
        especiePadre: "elfo",
        nombre: "Elfo de los bosques",
        descripcion: "Ágiles habitantes de las espesuras con velocidad aumentada y magia druídica.",
        modificadores: { velocidad: 35 },
        rasgos: [
          {
            nombre: "Pies veloces",
            descripcion: "Tu velocidad base aumenta a 35 pies.",
            tipoAccion: "pasivo"
          }
        ],
        conjurosInnatos: [
          { hechizoId: "saber_druidico", nombreHechizo: "Saber druídico", caracteristica: "elegir", esTruco: true, nivelRequerido: 1 },
          { hechizoId: "zancada_prodigiosa", nombreHechizo: "Zancada prodigiosa", caracteristica: "elegir", esTruco: false, nivelRequerido: 3, usosGratis: 1, recuperacion: "descanso_largo" },
          { hechizoId: "pasar_sin_rastro", nombreHechizo: "Pasar sin rastro", caracteristica: "elegir", esTruco: false, nivelRequerido: 5, usosGratis: 1, recuperacion: "descanso_largo" }
        ]
      }
    ]
  },

  // -----------------------------------------------------
  // 3. ENANO
  // -----------------------------------------------------
  {
    id: "enano",
    nombre: "Enano",
    descripcion: "Fuertes y resistentes artesanos forjados en las profundidades de la piedra y las montañas.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Mediano"],
    tamanoPorDefecto: "Mediano",
    velocidadBase: 30,
    visionOscuridad: 120,
    resistenciasDanio: ["Veneno"],
    rasgos: [
      {
        nombre: "Visión en la oscuridad",
        descripcion: "Tienes visión en la oscuridad hasta 120 pies.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Resistencia enana",
        descripcion: "Tienes resistencia al daño de veneno y ventaja en tiradas de salvación contra el estado de envenenado.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Aguante enano",
        descripcion: "Tus puntos de golpe máximos se incrementan en 1 y aumentarán en 1 más cada vez que subas un nivel.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Afinidad con la piedra",
        descripcion: "Como acción adicional, ganas visión de temblor a 60 pies sobre piedra durante 10 minutos (usos igual a PB por descanso largo).",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        usosMaximos: 2,
        recuperacion: "descanso_largo",
        formulaEscalado: "bono_competencia"
      }
    ]
  },

  // -----------------------------------------------------
  // 4. GNOMO
  // -----------------------------------------------------
  {
    id: "gnomo",
    nombre: "Gnomo",
    descripcion: "Pequeños seres de aguda inteligencia, curiosidad insaciable y afinidad natural con la ilusión y los inventos.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Pequeño"],
    tamanoPorDefecto: "Pequeño",
    velocidadBase: 30,
    visionOscuridad: 60,
    rasgos: [
      {
        nombre: "Astucia gnoma",
        descripcion: "Tienes ventaja en las tiradas de salvación de Inteligencia, Sabiduría y Carisma.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Linaje gnomo",
        descripcion: "Formas parte de un linaje que te otorga capacidades sobrenaturales.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Visión en la oscuridad",
        descripcion: "Tienes visión en la oscuridad hasta 60 pies.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      }
    ],
    subespecies: [
      {
        id: "gnomo_bosques",
        especiePadre: "gnomo",
        nombre: "Gnomo de los bosques",
        descripcion: "Amigos de los animales silvestres y creadores de ilusiones menores.",
        conjurosInnatos: [
          { hechizoId: "ilusion_menor", nombreHechizo: "Ilusión menor", caracteristica: "elegir", esTruco: true },
          { hechizoId: "hablar_con_animales", nombreHechizo: "Hablar con los animales", caracteristica: "elegir", esTruco: false, nivelRequerido: 1, usosGratis: "bono_competencia", recuperacion: "descanso_largo" }
        ],
        rasgos: [
          {
            nombre: "Magia del bosque",
            descripcion: "Conoces el truco ilusión menor y puedes lanzar hablar con los animales tantas veces como tu PB por descanso largo.",
            tipoAccion: "pasivo"
          }
        ]
      },
      {
        id: "gnomo_rocas",
        especiePadre: "gnomo",
        nombre: "Gnomo de las rocas",
        descripcion: "Ingenieros innatos que fabrican dispositivos mecánicos y juguetes animados.",
        conjurosInnatos: [
          { hechizoId: "prestidigitacion", nombreHechizo: "Prestidigitación", caracteristica: "elegir", esTruco: true },
          { hechizoId: "reparar", nombreHechizo: "Reparar", caracteristica: "elegir", esTruco: true }
        ],
        rasgos: [
          {
            nombre: "Inventor de artilugios",
            descripcion: "Conoces prestidigitación y reparar. Puedes crear hasta 3 artilugios Diminutos que ejecutan efectos mágicos al toque.",
            tipoAccion: "especial"
          }
        ]
      }
    ]
  },

  // -----------------------------------------------------
  // 5. GOLIAT
  // -----------------------------------------------------
  {
    id: "goliat",
    nombre: "Goliat",
    descripcion: "Descendientes gigantescos que portan la resistencia elemental de las cumbres montañosas.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Mediano"],
    tamanoPorDefecto: "Mediano",
    velocidadBase: 35,
    visionOscuridad: 0,
    rasgos: [
      {
        nombre: "Constitución poderosa",
        descripcion: "Tienes ventaja en pruebas para poner fin al estado de agarrado y cuentas como un tamaño superior para capacidad de carga.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Forma grande",
        descripcion: "A partir de nivel 5, puedes cambiar de tamaño a Grande como acción adicional durante 10 minutos (1/descanso largo). Ganas ventaja en pruebas de Fuerza y +10 pies de velocidad.",
        tipoAccion: "accion_adicional",
        nivelRequerido: 5,
        tieneUsosLimitados: true,
        usosMaximos: 1,
        recuperacion: "descanso_largo",
        esActivable: true
      },
      {
        nombre: "Linaje gigante",
        descripcion: "Desciendes de los gigantes. Obtienes un beneficio sobrenatural utilizable tantas veces como tu PB por descanso largo.",
        tipoAccion: "especial",
        tieneUsosLimitados: true,
        usosMaximos: 2,
        recuperacion: "descanso_largo",
        formulaEscalado: "bono_competencia"
      }
    ]
  },

  // -----------------------------------------------------
  // 6. HUMANO
  // -----------------------------------------------------
  {
    id: "humano",
    nombre: "Humano",
    descripcion: "Adaptables, tenaces e inventivos, los humanos prosperan en cualquier entorno con versatilidad inigualable.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Mediano", "Pequeño"],
    tamanoPorDefecto: "Mediano",
    velocidadBase: 30,
    visionOscuridad: 0,
    rasgos: [
      {
        nombre: "Ingenio ingenioso",
        descripcion: "Obtienes inspiración heroica tras finalizar un descanso largo.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Diestro",
        descripcion: "Ganas competencia en una habilidad de tu elección.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Versátil",
        descripcion: "Obtienes una dote de origen de tu elección al nivel 1.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      }
    ]
  },

  // -----------------------------------------------------
  // 7. MEDIANO
  // -----------------------------------------------------
  {
    id: "mediano",
    nombre: "Mediano",
    descripcion: "Amables, ágiles y afortunados supervivientes capaces de deslizarse entre el peligro.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Pequeño"],
    tamanoPorDefecto: "Pequeño",
    velocidadBase: 30,
    visionOscuridad: 0,
    rasgos: [
      {
        nombre: "Valiente",
        descripcion: "Tienes ventaja en las tiradas de salvación que hagas para evitar o poner fin al estado de asustado.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Agilidad de mediano",
        descripcion: "Puedes moverte a través del espacio ocupado por cualquier criatura de tamaño superior al tuyo.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Fortuna",
        descripcion: "Cuando saques un 1 en una prueba con d20, podrás repetir la tirada y deberás utilizar el nuevo resultado.",
        tipoAccion: "reaccion"
      },
      {
        nombre: "Sigiloso por naturaleza",
        descripcion: "Puedes llevar a cabo la acción de esconderte incluso tras una criatura al menos una categoría superior a ti.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      }
    ]
  },

  // -----------------------------------------------------
  // 8. ORCO
  // -----------------------------------------------------
  {
    id: "orco",
    nombre: "Orco",
    descripcion: "Poderosos combatientes con resistencia inquebrantable e impulsos de adrenalina frente a la batalla.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Mediano"],
    tamanoPorDefecto: "Mediano",
    velocidadBase: 30,
    visionOscuridad: 120,
    rasgos: [
      {
        nombre: "Descarga de adrenalina",
        descripcion: "Puedes llevar a cabo la acción de correr como acción adicional. Obtienes puntos de golpe temporales iguales a tu bonificador por competencia (usos igual a PB por descanso corto o largo).",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        usosMaximos: 2,
        recuperacion: "descanso_corto",
        formulaEscalado: "bono_competencia"
      },
      {
        nombre: "Visión en la oscuridad",
        descripcion: "Tienes visión en la oscuridad hasta 120 pies.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Aguante incansable",
        descripcion: "Cuando tus puntos de golpe se reducen a 0 pero no mueres inmediatamente, puedes recuperar 1 punto de golpe (1/descanso largo).",
        tipoAccion: "reaccion",
        tieneUsosLimitados: true,
        usosMaximos: 1,
        recuperacion: "descanso_largo"
      }
    ]
  },

  // -----------------------------------------------------
  // 9. TIEFLING
  // -----------------------------------------------------
  {
    id: "tiefling",
    nombre: "Tiefling",
    descripcion: "Portadores de un legado de los Planos Inferiores manifestado en astucia, cuernos y magia flamígera o sombría.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Mediano", "Pequeño"],
    tamanoPorDefecto: "Mediano",
    velocidadBase: 30,
    visionOscuridad: 60,
    conjurosInnatos: [
      {
        hechizoId: "taumaturgia",
        nombreHechizo: "Taumaturgia",
        caracteristica: "elegir",
        esTruco: true,
        descripcion: "Conoces el truco taumaturgia usando tu aptitud mágica elegida."
      }
    ],
    rasgos: [
      {
        nombre: "Visión en la oscuridad",
        descripcion: "Tienes visión en la oscuridad hasta 60 pies.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Presencia sobrenatural",
        descripcion: "Conoces el truco taumaturgia con tu misma aptitud mágica de linaje.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Legado infernal",
        descripcion: "Eres destinatario de un legado sobrenatural (Abisal, Ctónico o Infernal).",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      }
    ],
    subespecies: [
      {
        id: "legado_abisal",
        especiePadre: "tiefling",
        nombre: "Legado abisal",
        descripcion: "Vinculado al caos del Abismo con resistencia al veneno y magia entálpica.",
        resistenciasDanio: ["Veneno"],
        conjurosInnatos: [
          { hechizoId: "rociada_venenosa", nombreHechizo: "Rociada venenosa", caracteristica: "elegir", esTruco: true, nivelRequerido: 1 },
          { hechizoId: "rayo_nauseabundo", nombreHechizo: "Rayo nauseabundo", caracteristica: "elegir", esTruco: false, nivelRequerido: 3, usosGratis: 1, recuperacion: "descanso_largo" },
          { hechizoId: "inmovilizar_persona", nombreHechizo: "Inmovilizar persona", caracteristica: "elegir", esTruco: false, nivelRequerido: 5, usosGratis: 1, recuperacion: "descanso_largo" }
        ],
        rasgos: [
          {
            nombre: "Resistencia abisal",
            descripcion: "Tienes resistencia al daño de veneno.",
            tipoAccion: "pasivo"
          }
        ]
      },
      {
        id: "legado_ctonico",
        especiePadre: "tiefling",
        nombre: "Legado ctónico",
        descripcion: "Vinculado al inframundo con resistencia necrótica y magia fúnebre.",
        resistenciasDanio: ["Necrótico"],
        conjurosInnatos: [
          { hechizoId: "toque_helado", nombreHechizo: "Toque helado", caracteristica: "elegir", esTruco: true, nivelRequerido: 1 },
          { hechizoId: "falsa_vida", nombreHechizo: "Falsa vida", caracteristica: "elegir", esTruco: false, nivelRequerido: 3, usosGratis: 1, recuperacion: "descanso_largo" },
          { hechizoId: "rayo_debilitador", nombreHechizo: "Rayo debilitador", caracteristica: "elegir", esTruco: false, nivelRequerido: 5, usosGratis: 1, recuperacion: "descanso_largo" }
        ],
        rasgos: [
          {
            nombre: "Resistencia ctónica",
            descripcion: "Tienes resistencia al daño necrótico.",
            tipoAccion: "pasivo"
          }
        ]
      },
      {
        id: "legado_infernal",
        especiePadre: "tiefling",
        nombre: "Legado infernal",
        descripcion: "Vinculado a los Nueve Infiernos con resistencia al fuego y llamas punitivas.",
        resistenciasDanio: ["Fuego"],
        conjurosInnatos: [
          { hechizoId: "descarga_fuego", nombreHechizo: "Descarga de fuego", caracteristica: "elegir", esTruco: true, nivelRequerido: 1 },
          { hechizoId: "reprension_infernal", nombreHechizo: "Reprensión infernal", caracteristica: "elegir", esTruco: false, nivelRequerido: 3, usosGratis: 1, recuperacion: "descanso_largo" },
          { hechizoId: "oscuridad", nombreHechizo: "Oscuridad", caracteristica: "elegir", esTruco: false, nivelRequerido: 5, usosGratis: 1, recuperacion: "descanso_largo" }
        ],
        rasgos: [
          {
            nombre: "Resistencia infernal",
            descripcion: "Tienes resistencia al daño de fuego.",
            tipoAccion: "pasivo"
          }
        ]
      }
    ]
  },

  // -----------------------------------------------------
  // 10. DRACÓNIDO
  // -----------------------------------------------------
  {
    id: "draconido",
    nombre: "Dracónido",
    descripcion: "Orgullosos guerreros que canalizan el poder elemental y la furia destructiva de sus ancestros dragones.",
    tipoCriatura: "Humanoide",
    tamanoOpciones: ["Mediano"],
    tamanoPorDefecto: "Mediano",
    velocidadBase: 30,
    visionOscuridad: 60,
    rasgos: [
      {
        nombre: "Linaje dracónico",
        descripcion: "Tu linaje proviene de un progenitor dragón, afectando a tu aliento y resistencia elemental.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Ataque de aliento",
        descripcion: "Al tomar la acción de atacar, sustituyes un ataque por una exhalación mágica (cono de 15 pies o línea de 30 pies) infligiendo 1d10 de daño elemental (aumenta a nivel 5, 11 y 17). Usos igual a PB por descanso largo.",
        tipoAccion: "accion",
        tieneUsosLimitados: true,
        usosMaximos: 2,
        recuperacion: "descanso_largo",
        formulaDados: "1d10",
        formulaEscalado: "bono_competencia"
      },
      {
        nombre: "Resistencia al daño",
        descripcion: "Tienes resistencia al tipo de daño asociado con tu linaje dracónico.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Visión en la oscuridad",
        descripcion: "Tienes visión en la oscuridad hasta 60 pies.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      },
      {
        nombre: "Vuelo dracónico",
        descripcion: "A nivel 5, puedes manifestar alas espectrales durante 10 minutos como acción adicional (1/descanso largo) con velocidad de vuelo igual a tu velocidad.",
        tipoAccion: "accion_adicional",
        nivelRequerido: 5,
        tieneUsosLimitados: true,
        usosMaximos: 1,
        recuperacion: "descanso_largo",
        esActivable: true
      }
    ]
  }
];

// =======================================================
// MAPAS DE ACCESO RÁPIDO
// =======================================================

export const DICCIONARIO_ESPECIES_POR_ID: Record<string, DefinicionEspecie> = Object.fromEntries(
  CATALOGO_ESPECIES_DND55.map((esp) => [esp.id.toLowerCase(), esp])
);

export const DICCIONARIO_ESPECIES_POR_NOMBRE: Record<string, DefinicionEspecie> = Object.fromEntries(
  CATALOGO_ESPECIES_DND55.map((esp) => [esp.nombre.toLowerCase(), esp])
);
