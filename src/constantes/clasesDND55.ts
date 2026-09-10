import type { DefinicionClase, DefinicionSubclase } from "@/tipos/clases";
import { generarOpcionesSelectorInvocaciones } from "./invocacionesSobrenaturales";

// =======================================================
// CATÁLOGO MAESTRO DE CLASES Y SUBCLASES D&D 5.5e (2024)
// Extraído de las reglas oficiales y dicionario herramientas/clases
// =======================================================

export const CATALOGO_CLASES_DND55: DefinicionClase[] = [
  {
    id: "barbaro",
    nombre: "Bárbaro",
    descripcion: "Un feroz guerrero que puede entrar en una furia impulsada por el poder primigenio para destrozar a sus enemigos y soportar heridas mortales.",
    dadoGolpe: "d12",
    caracteristicasPrimarias: ["fuerza","constitucion"],
    salvacionesCompetentes: ["fuerza","constitucion"],
    competenciasArmaduras: ["Armaduras Ligeras","Armaduras Medianas","Escudos"],
    competenciasArmas: ["Armas Sencillas","Armas Marciales"],
    competenciasHerramientas: [],
    opcionesHabilidades: {"cantidad":2,"opciones":["manejoAnimales","atletismo","intimidacion","naturaleza","percepcion","supervivencia"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Gran hacha, 4 hachas de mano, Paquete de Explorador y 15 PO","opcionB":"(B) 75 PO en monedas para comprar equipo"},
    rasgos: [
      {
        nivel: 1,
        nombre: "Furia",
        descripcion: "Puedes imbuirte de un poder primigenio llamado Furia, una fuerza que te otorga un poder y una resistencia extraordinarios. Puedes entrar en ella como acción adicional si no llevas armadura pesada.\nRecuperas un uso gastado cuando finalizas un descanso corto y recuperas todos los usos gastados cuando finalizas un descanso largo.\n\nMientras está activa, tu Furia sigue las siguientes reglas:\n\n***Resistencia al daño.*** Tienes resistencia al daño contundente, perforante y cortante.\n\n***Daño de Furia.*** Cuando haces un ataque usando Fuerza (ya sea con un arma o un ataque sin armas) y causas daño al objetivo, obtienes un bonificador al daño que aumenta a medida que ganas niveles como bárbaro.\n\n***Ventaja de Fuerza.*** Tienes ventaja en las pruebas de Fuerza y en las tiradas de salvación de Fuerza.\n\n***Sin concentración ni conjuros.*** No puedes mantener la concentración y no puedes lanzar conjuros.\n\n***Duración.*** La Furia dura hasta el final de tu siguiente turno, y termina antes si te pones una armadura pesada o si tienes el estado de incapacitado. Si tu Furia sigue activa en tu siguiente turno, puedes extenderla durante otra ronda haciendo una de las siguientes acciones:\n- Hacer una tirada de ataque contra un enemigo.\n- Obligar a un enemigo a hacer una tirada de salvación.\n- Usar una acción adicional para extender tu Furia.\nCada vez que se extiende la Furia, dura hasta el final de tu siguiente turno. Puedes mantener una Furia hasta un máximo de 10 minutos.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        formulaUsos: "(niv) => (niv >= 17 ? 6 : niv >= 12 ? 5 : niv >= 6 ? 4 : niv >= 3 ? 3 : 2)",
        obtenerUsosMaximos: (niv) => (niv >= 17 ? 6 : niv >= 12 ? 5 : niv >= 6 ? 4 : niv >= 3 ? 3 : 2),
        recuperacion: "descanso_largo",
        esActivable: true,
        condicionAlActivar: "Furia (Rage)",
        categoriaMecanica: "consumible",
        efectos: [
          {
            tipo: "bono_dano_fuerza",
            objetivo: "ataque_fuerza",
            valor: "dano_furia",
            aplicaA: "arma_fuerza",
            condicion: "furia_activa",
            descripcion: "Daño de Furia (+2 nv 1-8, +3 nv 9-15, +4 nv 16-20)"
          },
          {
            tipo: "ventaja",
            objetivo: "prueba.fuerza",
            valor: "ventaja",
            condicion: "furia_activa",
            descripcion: "Ventaja en pruebas de Fuerza"
          },
          {
            tipo: "ventaja",
            objetivo: "salvacion.fuerza",
            valor: "ventaja",
            condicion: "furia_activa",
            descripcion: "Ventaja en tiradas de salvación de Fuerza"
          }
        ],
        tablaProgresion: {
          columnas: ["Nivel", "Descripción"],
          filas: [
            { nivel: 1, valores: ["2 veces/día, +2 daño"] },
            { nivel: 3, valores: ["3 veces/día, +2 daño"] },
            { nivel: 6, valores: ["4 veces/día, +2 daño"] },
            { nivel: 9, valores: ["4 veces/día, +3 daño"] },
            { nivel: 12, valores: ["5 veces/día, +3 daño"] },
            { nivel: 16, valores: ["5 veces/día, +4 daño"] },
            { nivel: 17, valores: ["6 veces/día, +4 daño"] },
            { nivel: 20, valores: ["6 veces/día, +4 daño"] }
          ],
          notaPie: "Cada nivel reemplaza al anterior"
        }
      },
      {
        nivel: 1,
        nombre: "Defensa sin armadura",
        descripcion: "Mientras no lleves armadura, tu Clase de Armadura base es igual a 10 más tus modificadores por Destreza y Constitución. Puedes usar un *Escudo* y seguir obteniendo este beneficio.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente",
        efectos: [
          {
            tipo: "modificador_ca",
            objetivo: "defensa_sin_armadura",
            valor: "constitucion",
            condicion: "sin_armadura",
            descripcion: "Defensa sin armadura (10 + DES + CON)"
          }
        ]
      },
      {
        nivel: 1,
        nombre: "Maestría con armas",
        descripcion: "Tu entrenamiento con armas te permite utilizar las propiedades de maestría con dos tipos de armas cuerpo a cuerpo sencillas o marciales de tu elección, como *Hachas a dos manos* y *Hachas de mano*. Siempre que finalices un descanso largo, puedes practicar tácticas con armas y cambiar una de esas armas elegidas.\nCuando alcanzas ciertos niveles de bárbaro, obtienes la capacidad de usar las propiedades de maestría de más tipos de armas.",
        tipoAccion: "pasivo",
        categoriaMecanica: "selector_informativo",
        selectores: [
          {
            id: "maestrias_aprendidas",
            tipo: "multiple",
            etiqueta: "Propiedades de Maestría Elegidas",
            maxSelecciones: 2,
            escaladoMaxSelecciones: [
              { nivelMinimo: 1,  valor: 2 },
              { nivelMinimo: 4,  valor: 3 },
              { nivelMinimo: 10, valor: 4 }
            ],
            opciones: [
              { id: "cleave", nombre: "Cleave (Hender)", descripcion: "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes hacer una tirada de ataque contra una segunda criatura a 5 pies de la primera y dentro de tu alcance. Si impactas, la segunda criatura recibe el daño del arma sin tu modificador de característica. Solo una vez por turno." },
              { id: "graze", nombre: "Graze (Rozar)", descripcion: "Si tu tirada de ataque falla, puedes infligir daño igual al modificador de característica usado. El daño es del mismo tipo que el arma, y solo puede incrementarse aumentando el modificador." },
              { id: "nick", nombre: "Nick (Mellar)", descripcion: "Cuando haces el ataque extra de la propiedad Ligera, puedes hacerlo como parte de la acción de Atacar en vez de como Acción Adicional. Solo una vez por turno." },
              { id: "push", nombre: "Push (Empujar)", descripcion: "Si impactas a una criatura, puedes empujarla hasta 10 pies en línea recta lejos de ti si es Grande o menor." },
              { id: "sap", nombre: "Sap (Debilitar)", descripcion: "Si impactas a una criatura, esa criatura tiene Desventaja en su siguiente tirada de ataque antes del inicio de tu próximo turno." },
              { id: "slow", nombre: "Slow (Ralentizar)", descripcion: "Si impactas a una criatura e infliges daño, puedes reducir su Velocidad en 10 pies hasta el inicio de tu próximo turno. Múltiples impactos con armas Slow no acumulan la reducción." },
              { id: "topple", nombre: "Topple (Derribar)", descripcion: "Si impactas a una criatura, puedes forzar una tirada de salvación de Constitución (CD 8 + modificador de característica + bonificador de competencia). Si falla, la criatura queda Derribada." },
              { id: "vex", nombre: "Vex (Molestar)", descripcion: "Si impactas a una criatura e infliges daño, tienes Ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu próximo turno." }
            ],
            valorActual: ["cleave", "graze"]
          }
        ],
        tablaProgresion: {
          columnas: ["Nivel", "Descripción"],
          filas: [
            { nivel: 1, valores: ["2 tipos de armas elegidas"] },
            { nivel: 4, valores: ["3 tipos de armas elegidas"] },
            { nivel: 10, valores: ["4 tipos de armas elegidas"] }
          ],
          notaPie: "Cada nivel reemplaza al anterior"
        }
      },
      {
        nivel: 2,
        nombre: "Sentido del peligro",
        descripcion: "Obtienes un sentido asombroso para notar cuándo las cosas no son como deberían ser, dándote ventaja al esquivar peligros. Tienes ventaja en las tiradas de salvación de Destreza a menos que tengas el estado de incapacitado.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente",
        efectos: [
          {
            tipo: "ventaja",
            objetivo: "salvacion.destreza",
            valor: "ventaja",
            condicion: "siempre",
            descripcion: "Sentido del peligro (Ventaja en tiradas de salvación de Destreza)"
          }
        ]
      },
      {
        nivel: 2,
        nombre: "Ataque temerario",
        descripcion: "Puedes dejar de lado toda preocupación por la defensa para atacar con mayor ferocidad. Cuando hagas tu primera tirada de ataque en tu turno, puedes decidir atacar de forma temeraria. Hacerlo te da ventaja en las tiradas de ataque que usen Fuerza hasta el comienzo de tu siguiente turno, pero las tiradas de ataque contra ti tienen ventaja durante ese tiempo.",
        tipoAccion: "pasivo",
        esActivable: true,
        condicionAlActivar: "Ataque Temerario",
        categoriaMecanica: "activable",
        efectos: [
          {
            tipo: "ventaja",
            objetivo: "ataque_fuerza",
            valor: "ventaja",
            condicion: "ataque_temerario_activo",
            descripcion: "Ataque temerario (Ventaja en tiradas de ataque con Fuerza)"
          }
        ]
      },
      {
        nivel: 3,
        nombre: "Subclase de bárbaro",
        descripcion: "Consigues una subclase de bárbaro de tu elección. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de bárbaro. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de bárbaro e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 3,
        nombre: "Conocimiento primigenio",
        descripcion: "Ganas competencia en otra habilidad de tu elección de la lista de habilidades disponible para los bárbaros a nivel 1.\nAdemás, mientras tu Furia esté activa, puedes canalizar el poder primigenio cuando intentes ciertas tareas; siempre que hagas una prueba de característica usando una de las siguientes habilidades, puedes hacerla como una prueba de Fuerza incluso si normalmente utiliza una característica diferente: Acrobacias, Intimidación, Percepción, Sigilo o Supervivencia. Cuando usas esta capacidad, tu Fuerza representa el poder primigenio fluyendo a través de ti, afinando tu agilidad, tu presencia y tus sentidos.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente",
        efectos: [
          {
            tipo: "habilidad_con_fuerza",
            objetivo: "acrobacias,intimidacion,percepcion,sigilo,supervivencia",
            valor: "fuerza",
            condicion: "furia_activa",
            descripcion: "Conocimiento primigenio (Usa Fuerza en Acrobacias, Intimidación, Percepción, Sigilo o Supervivencia si FUE es mayor)"
          }
        ]
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de bárbaro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Ataque adicional",
        descripcion: "Cuando lleves a cabo la acción de atacar en tu turno, podrás hacer dos ataques en lugar de uno.",
        tipoAccion: "accion"
      },
      {
        nivel: 5,
        nombre: "Movimiento rápido",
        descripcion: "Tu velocidad aumenta en 10 pies mientras no lleves armadura pesada.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente",
        efectos: [
          {
            tipo: "modificador_velocidad",
            objetivo: "velocidad.caminar",
            valor: 10,
            condicion: "sin_armadura_pesada",
            descripcion: "Movimiento rápido (+10 pies sin armadura pesada)"
          }
        ]
      },
      {
        nivel: 6,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de bárbaro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Instinto salvaje",
        descripcion: "Tus instintos están tan afinados que tienes ventaja en las tiradas de iniciativa.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente",
        efectos: [
          {
            tipo: "ventaja",
            objetivo: "iniciativa",
            valor: "ventaja",
            condicion: "siempre",
            descripcion: "Instinto salvaje (Ventaja en iniciativa)"
          }
        ]
      },
      {
        nivel: 7,
        nombre: "Salto instintivo",
        descripcion: "Como parte de la acción adicional que usas para entrar en tu Furia, puedes moverte hasta la mitad de tu velocidad.",
        tipoAccion: "accion_adicional"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 9,
        nombre: "Golpe brutal",
        descripcion: "Si usas Ataque temerario, puedes renunciar a cualquier ventaja en una tirada de ataque basada en Fuerza de tu elección en tu turno. La tirada de ataque elegida no debe tener desventaja. Si la tirada de ataque elegida acierta, el objetivo sufre 1d10 de daño adicional del mismo tipo que inflige el arma o el ataque sin armas, y puedes causar un efecto de Golpe brutal de tu elección. Tienes las siguientes opciones de efectos:\n\n***Golpe contundente.*** El objetivo es empujado 15 pies en línea recta lejos de ti. Luego puedes moverte hasta la mitad de tu velocidad directamente hacia el objetivo sin provocar ataques de oportunidad.\n\n***Golpe inmovilizador.*** La velocidad del objetivo se reduce en 15 pies hasta el comienzo de tu siguiente turno. Un objetivo solo puede verse afectado por un Golpe inmovilizador a la vez (el más reciente).\n\n***Golpe brutal mejorado (II) (Nv. 17).*** El daño adicional que infliges con él aumenta a 2d10. Además, puedes aplicar hasta dos efectos diferentes de Golpe brutal a la vez en lugar de uno.",
        tipoAccion: "pasivo",
        formulaDados: "1d10",
        escaladoFormulaDados: [
          { nivelMinimo: 9,  valor: "1d10" },
          { nivelMinimo: 17, valor: "2d10" }
        ],
        sincronizarEfectosConFormula: true,
        esActivable: true,
        ligadoA: "rasgo_cls_barbaro_ataque_temerario",
        categoriaMecanica: "activable",
        efectos: [
          {
            tipo: "dado_extra_dano",
            objetivo: "arma_fuerza",
            valor: "1d10",
            aplicaA: "arma_fuerza",
            descripcion: "Golpe brutal (+1d10 al daño con armas de Fuerza)"
          }
        ],
        selectores: [
          {
            id: "efecto_golpe_brutal",
            tipo: "unico",
            etiqueta: "Efecto de Golpe Brutal",
            maxSelecciones: 1,
            escaladoMaxSelecciones: [
              { nivelMinimo: 9,  valor: 1 },
              { nivelMinimo: 17, valor: 2 }
            ],
            opciones: [
              { id: "golpe_contundente", nombre: "Golpe contundente", descripcion: "El objetivo es empujado 15 pies en línea recta lejos de ti. Puedes moverte hasta la mitad de tu velocidad hacia él sin provocar ataques de oportunidad." },
              { id: "golpe_inmovilizador", nombre: "Golpe inmovilizador", descripcion: "La velocidad del objetivo se reduce en 15 pies hasta el comienzo de tu siguiente turno." }
            ],
            opcionesDinamicas: [
              {
                nivelMinimo: 13,
                opciones: [
                  { id: "golpe_desestabilizador", nombre: "Golpe desestabilizador (Nv. 13)", descripcion: "El objetivo tiene desventaja en la siguiente tirada de salvación que haga, y no puede hacer ataques de oportunidad hasta el principio de tu siguiente turno." },
                  { id: "golpe_desgarrador", nombre: "Golpe desgarrador (Nv. 13)", descripcion: "Antes del principio de tu siguiente turno, la siguiente tirada de ataque realizada por otra criatura contra el objetivo obtiene un bonificador de +5 a la tirada. Una tirada de ataque solo puede obtener un bonificador de Golpe desgarrador." }
                ]
              }
            ],
            valorActual: ["golpe_contundente"]
          }
        ]
      },

      {
        nivel: 10,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de bárbaro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 11,
        nombre: "Furia implacable",
        descripcion: "Tu Furia puede mantenerte luchando a pesar de heridas graves. Si tus puntos de golpe se reducen a 0 mientras tu Furia está activa y no mueres en el acto, puedes hacer una tirada de salvación de Constitución CD 10. Si tienes éxito, tus puntos de golpe pasan a ser una cantidad igual al doble de tu nivel de bárbaro.\nCada vez que uses este rasgo después de la primera, la CD aumenta en 5. Cuando finalizas un descanso corto o largo, la CD se reinicia a 10.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_corto"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 13,
        nombre: "Golpe brutal mejorado",
        descripcion: "Has perfeccionado nuevas formas de atacar furiosamente. Los siguientes efectos se encuentran ahora entre tus opciones de Golpe brutal:\n\n***Golpe desestabilizador.*** El objetivo tiene desventaja en la siguiente tirada de salvación que haga, y no puede hacer ataques de oportunidad hasta el principio de tu siguiente turno.\n\n***Golpe desgarrador.*** Antes del principio de tu siguiente turno, la siguiente tirada de ataque realizada por otra criatura contra el objetivo obtiene un bonificador de +5 a la tirada. Una tirada de ataque solo puede obtener un bonificador de Golpe desgarrador.",
        tipoAccion: "pasivo",
        categoriaMecanica: "extension",
        ligadoA: "rasgo_cls_barbaro_golpe_brutal"
      },
      {
        nivel: 14,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de bárbaro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 15,
        nombre: "Furia persistente",
        descripcion: "Cuando tires iniciativa, puedes recuperar todos los usos gastados de Furia. Después de recuperar usos de Furia de esta manera, no podrás volver a hacerlo hasta que finalices un descanso largo.\nAdemás, tu Furia es tan feroz que ahora dura 10 minutos sin necesidad de que hagas nada para extenderla ronda a ronda. Tu Furia termina antes si tienes el estado de inconsciente (no solo el estado de incapacitado) o si te pones una armadura pesada.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        formulaUsos: "1",
        obtenerUsosMaximos: () => 1,
        recuperacion: "descanso_largo",
        esActivable: true,
        autoDesactivar: true,
        categoriaMecanica: "activable",
        restaurarUsosAlActivar: { idRasgoObjetivo: "rasgo_cls_barbaro_furia", cantidad: "maximo" }
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 17,
        nombre: "Golpe brutal mejorado (II)",
        descripcion: "El daño adicional de tu Golpe brutal aumenta a 2d10. Además, puedes usar dos efectos diferentes de Golpe brutal siempre que uses tu rasgo Golpe brutal.",
        tipoAccion: "pasivo",
        formulaDados: "2d10",
        categoriaMecanica: "extension",
        ligadoA: "rasgo_cls_barbaro_golpe_brutal"
      },
      {
        nivel: 18,
        nombre: "Poderío indómito",
        descripcion: "Si tu total en una prueba de Fuerza o tirada de salvación de Fuerza es menor que tu puntuación de Fuerza, puedes usar esa puntuación en lugar del total.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra dote de tu elección para la que cumplas las condiciones. Se recomienda Don de la ofensiva irresistible.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Campeón primigenio",
        descripcion: "Encarnas el poder primigenio. Tus puntuaciones de Fuerza y Constitución aumentan en 4, hasta un máximo de 25.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente",
        efectos: [
          {
            tipo: "modificador_stat",
            objetivo: "fuerza",
            valor: 4,
            condicion: "siempre",
            descripcion: "Campeón primigenio (+4 Fuerza, máx 25)"
          },
          {
            tipo: "modificador_stat",
            objetivo: "constitucion",
            valor: 4,
            condicion: "siempre",
            descripcion: "Campeón primigenio (+4 Constitución, máx 25)"
          }
        ]
      },
    ],
    subclases: [
      {
        id: "senda_del_berserker",
        clasePadre: "barbaro",
        nombre: "Senda del Berserker",
        descripcion: "Los bárbaros que recorren la Senda del Berserker dirigen su Furia principalmente hacia la violencia. Su senda es una de furia desenfrenada, y se emocionan en el caos de la batalla mientras permiten que su Furia se apodere de ellos y los fortalezca.",
        lema: "Canaliza la furia en una violencia frenética",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Frenesí",
            descripcion: "Si usas Ataque temerario mientras tu Furia está activa, infliges daño adicional al primer objetivo que aciertes en tu turno con un ataque basado en Fuerza. Para determinar el daño adicional, tira una cantidad de d6 igual a tu bonificador de Daño de Furia y súmalos. El daño tiene el mismo tipo que el arma o ataque sin armas utilizado para el ataque.",
            tipoAccion: "pasivo",
            subclase: "Senda del Berserker",
            esActivable: true,
            categoriaMecanica: "activable",
            ligadoA: "rasgo_cls_barbaro_ataque_temerario",
            formulaDados: "2d6",
            escaladoFormulaDados: [
              { nivelMinimo: 1,  valor: "2d6" },
              { nivelMinimo: 9,  valor: "3d6" },
              { nivelMinimo: 16, valor: "4d6" }
            ],
            sincronizarEfectosConFormula: true,
            efectos: [
              {
                tipo: "dado_extra_dano",
                objetivo: "arma_fuerza",
                valor: "2d6",
                aplicaA: "arma_fuerza",
                condicion: "furia_y_temerario_activos",
                descripcion: "Frenesí"
              }
            ]
          },

          {
            nivel: 6,
            nombre: "Furia ciega",
            descripcion: "Tienes inmunidad a los estados de hechizado y asustado mientras tu Furia esté activa. Si estás hechizado o asustado cuando entras en Furia, el estado termina en ti.",
            tipoAccion: "pasivo",
            subclase: "Senda del Berserker"
          },
          {
            nivel: 10,
            nombre: "Represalia",
            descripcion: "Cuando recibes daño de una criatura que está a 5 pies o menos de ti, puedes usar tu reacción para hacer un ataque cuerpo a cuerpo contra esa criatura, usando un arma o un ataque sin armas.",
            tipoAccion: "reaccion",
            subclase: "Senda del Berserker"
          },
          {
            nivel: 14,
            nombre: "Presencia intimidante",
            descripcion: "Como acción adicional, puedes infundir terror en otros con tu presencia amenazante y tu poder primigenio. Cuando lo hagas, cada criatura de tu elección en una emanación de 30 pies centrada en ti debe hacer una tirada de salvación de Sabiduría (CD 8 más tu modificador por Fuerza y tu bonificador por competencia). Si falla la tirada, la criatura tendrá el estado de asustado durante 1 minuto. Al final de cada uno de los turnos de la criatura asustada, esta repite la tirada de salvación, terminando el efecto sobre sí misma si tiene éxito.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes un uso de tu Furia (no requiere acción) para recuperar su uso.",
            tipoAccion: "accion_adicional",
            subclase: "Senda del Berserker",
            tieneUsosLimitados: true,
            formulaUsos: "1",
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "senda_del_corazon_salvaje",
        clasePadre: "barbaro",
        nombre: "Senda del Corazón Salvaje",
        descripcion: "Los bárbaros que siguen la Senda del Corazón Salvaje se consideran parientes de los animales. Estos bárbaros aprenden medios mágicos para comunicarse con los animales, y su Furia intensifica su conexión con la naturaleza al llenarlos de poder sobrenatural.",
        lema: "Camina en comunión con el mundo animal",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Sentidos de la bestia","Hablar con los animales"]},{"nivelClase":10,"conjuros":["Comunión con la naturaleza"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Hablante de los animales",
            descripcion: "Puedes lanzar los conjuros *Sentidos de la bestia* y *Hablar con los animales*, pero solo como rituales. La Sabiduría es tu aptitud mágica para lanzarlos.",
            tipoAccion: "pasivo",
            subclase: "Senda del Corazón Salvaje"
          },
          {
            nivel: 3,
            nombre: "Furia de las tierras salvajes",
            descripcion: "Tu Furia recurre al poder primigenio de los animales. Siempre que actives tu Furia, obtienes una de las siguientes opciones a tu elección.\n\n***Oso.*** Mientras tu Furia esté activa, tienes resistencia a todos los tipos de daño excepto fuerza, necrótico, psíquico y radiante.\n\n***Águila.*** Cuando actives tu Furia, puedes llevar a cabo las acciones de destrabarse y correr como parte de esa acción adicional. Mientras tu Furia esté activa, puedes gastar una acción adicional para llevar a cabo ambas acciones.\n\n***Lobo.*** Mientras tu Furia esté activa, tus aliados tienen ventaja en las tiradas de ataque contra cualquier enemigo tuyo a 5 pies o menos de ti.",
            tipoAccion: "accion_adicional",
            subclase: "Senda del Corazón Salvaje",
            categoriaMecanica: "selector_informativo",
            ligadoA: "rasgo_cls_barbaro_furia",
            selectores: [
              {
                id: "furia_tierras_salvajes_opcion",
                tipo: "unico",
                etiqueta: "Aspecto de Furia Primigenia",
                maxSelecciones: 1,
                opciones: [
                  { id: "oso", nombre: "Oso", descripcion: "Resistencia a todo daño excepto fuerza, necrótico, psíquico y radiante durante Furia" },
                  { id: "aguila", nombre: "Águila", descripcion: "Destrabarse y Correr como acción adicional durante Furia" },
                  { id: "lobo", nombre: "Lobo", descripcion: "Tus aliados tienen ventaja al atacar a enemigos a 5 pies de ti durante Furia" }
                ],
                valorActual: ["oso"]
              }
            ]
          },
          {
            nivel: 6,
            nombre: "Aspecto de las tierras salvajes",
            descripcion: "Obtienes una de las siguientes opciones de tu elección. Siempre que finalices un descanso largo, puedes cambiar tu elección.\n\n***Búho.*** Tienes visión en la oscuridad a una distancia de 60 pies. Si ya posees visión en la oscuridad, su alcance aumenta en 60 pies.\n\n***Pantera.*** Tienes una velocidad trepando igual a tu velocidad.\n\n***Salmón.*** Tienes una velocidad nadando igual a tu velocidad.",
            tipoAccion: "pasivo",
            subclase: "Senda del Corazón Salvaje",
            categoriaMecanica: "selector_informativo",
            selectores: [
              {
                id: "aspecto_tierras_salvajes_opcion",
                tipo: "unico",
                etiqueta: "Aspecto de las Tierras Salvajes",
                maxSelecciones: 1,
                opciones: [
                  { id: "buho", nombre: "Búho", descripcion: "+60 pies de visión en la oscuridad" },
                  { id: "pantera", nombre: "Pantera", descripcion: "Velocidad trepando igual a tu velocidad al caminar" },
                  { id: "salmon", nombre: "Salmón", descripcion: "Velocidad nadando igual a tu velocidad al caminar" }
                ],
                valorActual: ["buho"]
              }
            ]
          },
          {
            nivel: 10,
            nombre: "Hablante de la naturaleza",
            descripcion: "Puedes lanzar el conjuro *Comunión con la naturaleza*, pero solo como ritual. La Sabiduría es tu aptitud mágica para lanzarlo.",
            tipoAccion: "pasivo",
            subclase: "Senda del Corazón Salvaje"
          },
          {
            nivel: 14,
            nombre: "Poder de las tierras salvajes",
            descripcion: "Siempre que actives tu Furia, obtienes una de las siguientes opciones a tu elección.\n\n***Halcón.*** Mientras tu Furia esté activa, tienes una velocidad volando igual a tu velocidad si no llevas armadura.\n\n***León.*** Mientras tu Furia esté activa, cualquiera de tus enemigos a 5 pies o menos de ti tiene desventaja en las tiradas de ataque contra objetivos que no sean tú u otro bárbaro que tenga esta opción activa.\n\n***Carnero.*** Mientras tu Furia esté activa, puedes hacer que una criatura Grande o más pequeña tenga el estado de derribado cuando la aciertes con un ataque cuerpo a cuerpo.",
            tipoAccion: "pasivo",
            subclase: "Senda del Corazón Salvaje",
            categoriaMecanica: "selector_informativo",
            ligadoA: "rasgo_cls_barbaro_furia",
            selectores: [
              {
                id: "poder_tierras_salvajes_opcion",
                tipo: "unico",
                etiqueta: "Poder de las Tierras Salvajes",
                maxSelecciones: 1,
                opciones: [
                  { id: "halcon", nombre: "Halcón", descripcion: "Velocidad volando igual a tu velocidad si no llevas armadura durante Furia" },
                  { id: "leon", nombre: "León", descripcion: "Enemigos a 5 pies tienen desventaja al atacar a tus aliados durante Furia" },
                  { id: "carnero", nombre: "Carnero", descripcion: "Derriba a criaturas Grandes o menores al acertar ataque cuerpo a cuerpo durante Furia" }
                ],
                valorActual: ["halcon"]
              }
            ]
          },
        ]
      },
      {
        id: "senda_del_arbol_del_mundo",
        clasePadre: "barbaro",
        nombre: "Senda del Árbol del Mundo",
        descripcion: "Los bárbaros que siguen la Senda del Árbol del Mundo se conectan con el árbol cósmico Yggdrasil a través de su Furia. Este árbol crece entre los Planos Exteriores, conectándolos entre sí y con el Plano Material. Estos bárbaros se sirven de la magia del árbol para obtener vitalidad y como un medio para el viaje dimensional.",
        lema: "Rastrea las raíces y ramas del multiverso",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Vitalidad del Árbol",
            descripcion: "Tu Furia recurre a la fuerza vital del Árbol del Mundo. Obtienes los siguientes beneficios.\n\n***Oleada de vitalidad.*** Cuando activas tu Furia, obtienes una cantidad de puntos de golpe temporales igual a tu nivel de bárbaro.\n\n***Fuerza dadora de vida.*** Al principio de cada uno de tus turnos mientras tu Furia esté activa, puedes elegir a otra criatura a 10 pies o menos de ti para que gane puntos de golpe temporales. Para determinar la cantidad de puntos de golpe temporales, tira una cantidad de d6 igual a tu bonificador de Daño de Furia y súmalos. Si cualquiera de estos puntos de golpe temporales permanece cuando tu Furia termine, desaparecerá.",
            tipoAccion: "pasivo",
            subclase: "Senda del Árbol del Mundo",
            categoriaMecanica: "selector_informativo",
            ligadoA: "rasgo_cls_barbaro_furia",
            selectores: [
              {
                id: "vitalidad_arbol_opcion",
                tipo: "unico",
                etiqueta: "Efecto de Vitalidad del Árbol",
                maxSelecciones: 1,
                opciones: [
                  { id: "oleada_vitalidad", nombre: "Oleada de vitalidad", descripcion: "Gana PV temporales iguales a tu nivel de bárbaro al entrar en Furia" },
                  { id: "fuerza_dadora_vida", nombre: "Fuerza dadora de vida", descripcion: "Otorga PV temporales (d6 igual a daño de Furia) a un aliado a 10 pies al inicio de tu turno" }
                ],
                valorActual: ["oleada_vitalidad"]
              }
            ]
          },
          {
            nivel: 6,
            nombre: "Ramas del Árbol",
            descripcion: "Siempre que una criatura que puedas ver empiece su turno a 30 pies o menos de ti mientras tu Furia esté activa, puedes usar tu reacción para conjurar ramas espectrales del Árbol del Mundo a su alrededor. El objetivo debe tener éxito en una tirada de salvación de Fuerza (CD 8 más tu modificador por Fuerza y bonificador por competencia) o ser teletransportado a un espacio sin ocupar que puedas ver a 5 pies o menos de ti, o en el espacio sin ocupar más cercano que puedas ver. Después de que el objetivo se teletransporte, puedes reducir su velocidad a 0 hasta el final del turno actual.",
            tipoAccion: "reaccion",
            subclase: "Senda del Árbol del Mundo"
          },
          {
            nivel: 10,
            nombre: "Raíces golpeadoras",
            descripcion: "Durante tu turno, tu alcance es 10 pies mayor con cualquier arma cuerpo a cuerpo que tenga la propiedad pesada o versátil, ya que los zarcillos del Árbol del Mundo se extienden desde ti. Cuando aciertas con tal arma en tu turno, puedes activar la propiedad de maestría Empujar o Derribar además de una propiedad de maestría diferente que estés usando con esa arma.",
            tipoAccion: "pasivo",
            subclase: "Senda del Árbol del Mundo"
          },
          {
            nivel: 14,
            nombre: "Viaje por el Árbol",
            descripcion: "Cuando activas tu Furia y como acción adicional mientras tu Furia está activa, puedes teletransportarte hasta 60 pies a un espacio sin ocupar que puedas ver.\nAdemás, una vez por Furia, puedes aumentar el alcance de ese teletransporte a 150 pies. Cuando lo hagas, también puedes llevar contigo hasta a seis criaturas voluntarias que estén a 10 pies o menos de ti. Cada criatura se teletransporta a un espacio sin ocupar de tu elección a 10 pies o menos de tu espacio de destino.",
            tipoAccion: "accion_adicional",
            subclase: "Senda del Árbol del Mundo"
          },
        ]
      },
      {
        id: "senda_del_fanatico",
        clasePadre: "barbaro",
        nombre: "Senda del Fanático",
        descripcion: "Los bárbaros que recorren la Senda del Fanático reciben bendiciones de un dios o un panteón. Estos bárbaros experimentan su Furia como un episodio extático de unión divina que les infunde poder. A menudo son aliados de los sacerdotes y otros seguidores de su dios o panteón.",
        lema: "Furia en extática unión con un dios",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Furia divina",
            descripcion: "Puedes canalizar poder divino en tus golpes. En cada uno de tus turnos mientras tu Furia esté activa, la primera criatura que aciertes con un arma o un ataque sin armas sufrirá daño adicional igual a 1d6 más la mitad de tu nivel de bárbaro (redondeando hacia abajo). El daño adicional es necrótico o radiante; tú eliges el tipo cada vez que causas el daño.",
            tipoAccion: "pasivo",
            subclase: "Senda del Fanático",
            formulaDados: "1d6+1",
            escaladoFormulaDados: [
              { nivelMinimo: 3,  valor: "1d6+1" },
              { nivelMinimo: 4,  valor: "1d6+2" },
              { nivelMinimo: 6,  valor: "1d6+3" },
              { nivelMinimo: 8,  valor: "1d6+4" },
              { nivelMinimo: 10, valor: "1d6+5" },
              { nivelMinimo: 12, valor: "1d6+6" },
              { nivelMinimo: 14, valor: "1d6+7" },
              { nivelMinimo: 16, valor: "1d6+8" },
              { nivelMinimo: 18, valor: "1d6+9" },
              { nivelMinimo: 20, valor: "1d6+10" }
            ],
            sincronizarEfectosConFormula: true,
            esActivable: true,
            categoriaMecanica: "activable",
            ligadoA: "rasgo_cls_barbaro_furia",
            efectos: [
              {
                tipo: "dano_secundario",
                objetivo: "arma_fuerza",
                valor: "1d6+mitad_nivel",
                tipoDano: "Radiante o Necrótico",
                aplicaA: "arma_fuerza",
                descripcion: "Furia divina (1d6 + mitad nivel bárbaro Radiante o Necrótico)"
              }
            ]
          },
          {
            nivel: 3,
            nombre: "Guerrero de los dioses",
            descripcion: "Una entidad divina te ayuda a asegurar que puedas continuar la lucha. Tienes una reserva de cuatro d12 que puedes gastar para curarte a ti mismo. Como acción adicional, puedes gastar dados de la reserva, tirarlos y recuperar una cantidad de puntos de golpe igual al total de la tirada.\nTu reserva recupera todos los dados gastados cuando finalizas un descanso largo.\nLa cantidad máxima de dados de la reserva aumenta en uno cuando alcanzas los niveles de bárbaro 6 (5 dados), 12 (6 dados) y 17 (7 dados).",
            tipoAccion: "accion_adicional",
            subclase: "Senda del Fanático",
            tieneUsosLimitados: true,
            formulaUsos: "(niv) => (niv >= 17 ? 7 : niv >= 12 ? 6 : niv >= 6 ? 5 : 4)",
            obtenerUsosMaximos: (niv) => (niv >= 17 ? 7 : niv >= 12 ? 6 : niv >= 6 ? 5 : 4),
            escaladoUsos: {
              tipo: "por_nivel",
              tabla: [
                { nivelMinimo: 3, valor: 4 },
                { nivelMinimo: 6, valor: 5 },
                { nivelMinimo: 12, valor: 6 },
                { nivelMinimo: 17, valor: 7 }
              ]
            },
            formulaDados: "1d12",
            recuperacion: "descanso_largo",
            esActivable: false,
            categoriaMecanica: "curacion"
          },
          {
            nivel: 6,
            nombre: "Enfoque fanático",
            descripcion: "Una vez por cada Furia activa, si fallas una tirada de salvación, puedes repetirla con un bonificador igual a tu bonificador de Daño de Furia, y debes quedarte con el nuevo resultado.",
            tipoAccion: "especial",
            subclase: "Senda del Fanático",
            esActivable: true,
            categoriaMecanica: "activable",
            ligadoA: "rasgo_cls_barbaro_furia",
            efectos: [
              {
                tipo: "bono_salvacion",
                objetivo: "todas",
                valor: "dano_furia",
                condicion: "furia_activa",
                descripcion: "Enfoque fanático (Bono a salvación igual al daño de furia)"
              }
            ]
          },
          {
            nivel: 10,
            nombre: "Presencia fervorosa",
            descripcion: "Como acción adicional, desatas un grito de batalla imbuido de energía divina. Hasta otras diez criaturas de tu elección a 60 pies o menos de ti obtienen ventaja en las tiradas de ataque y tiradas de salvación hasta el principio de tu siguiente turno.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes un uso de tu Furia (no requiere acción) para recuperar su uso.",
            tipoAccion: "accion_adicional",
            subclase: "Senda del Fanático",
            tieneUsosLimitados: true,
            formulaUsos: "1",
            recuperacion: "descanso_largo"
          },
          {
            nivel: 14,
            nombre: "Furia de los dioses",
            descripcion: "Cuando activas tu Furia, puedes adoptar la forma de un guerrero divino. Esta forma dura 1 minuto (10 asaltos) o hasta que tus puntos de golpe se reduzcan a 0. Una vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.\nMientras estés en esta forma, obtienes los siguientes beneficios:\n\n***Vuelo.*** Tienes una velocidad volando igual a tu velocidad y puedes flotar.\n\n***Resistencia.*** Tienes resistencia al daño necrótico, psíquico y radiante.\n\n***Revivificación.*** Cuando una criatura a 30 pies o menos de ti fuera a reducir sus puntos de golpe a 0, puedes usar tu reacción para gastar un uso de tu Furia y, en su lugar, cambiar los puntos de golpe del objetivo a una cantidad igual a tu nivel de bárbaro.",
            tipoAccion: "especial",
            subclase: "Senda del Fanático",
            tieneUsosLimitados: true,
            formulaUsos: "1",
            obtenerUsosMaximos: () => 1,
            recuperacion: "descanso_largo",
            esActivable: true,
            ligadoA: "rasgo_cls_barbaro_furia",
            condicionAlActivar: "Furia de los Dioses (Rage of the Gods)",
            categoriaMecanica: "activable"
          },
        ]
      },
    ]
  },
  {
    id: "bardo",
    nombre: "Bardo",
    descripcion: "Un maestro inspirador cuyo poder de la palabra y la música teje magia arcana, cura heridas y desata el caos en el campo de batalla.",
    dadoGolpe: "d8",
    caracteristicasPrimarias: ["carisma","destreza"],
    salvacionesCompetentes: ["destreza","carisma"],
    competenciasArmaduras: ["Armaduras Ligeras"],
    competenciasArmas: ["Armas Sencillas"],
    competenciasHerramientas: ["3 Instrumentos Musicales a elección"],
    opcionesHabilidades: {"cantidad":3,"opciones":["acrobacias","atletismo","arcanos","engaño","historia","perspicacia","intimidacion","investigacion","medicina","naturaleza","percepcion","interpretacion","persuasion","religion","juegoManos","sigilo","supervivencia","manejoAnimales"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Armadura de cuero, 2 Dagas, Instrumento Musical (a elección), Paquete de Artista y 18 PO","opcionB":"(B) 90 PO en monedas para comprar equipo"},
    configuracionMagica: {"tipoLanzador":"completo","habilidadConjuro":"carisma","modeloConjuros":"preparados","nivelInicio":1},
    rasgos: [
      {
        nivel: 1,
        nombre: "Inspiración bárdica",
        descripcion: "Puedes recurrir a tus palabras, música o danza para inspirar de forma sobrenatural a los demás. Esta inspiración se representa con tu dado de Inspiración bárdica, que es un d6.\n\n***Utilizar la Inspiración bárdica.*** Como acción adicional, puedes inspirar a otra criatura que esté a 60 pies o menos de ti y que te pueda ver u oír. Esa criatura obtiene uno de tus dados de Inspiración bárdica. Cada criatura no puede tener más de un dado de Inspiración bárdica.\n\nUna sola vez durante la siguiente hora, cuando la criatura falle una prueba con d20, podrá tirar el dado de Inspiración bárdica y sumar el resultado al d20, lo que podría hacerle superar la prueba. Un dado de Inspiración bárdica se gasta al tirarlo.\n\n***Número de usos.*** Puedes conceder un dado de Inspiración bárdica una cantidad de veces igual a tu modificador por Carisma (mínimo una vez) y recuperas todos sus usos tras finalizar un descanso largo.\n\n***A niveles superiores.*** Tu dado de Inspiración bárdica cambia cuando alcanzas ciertos niveles de bardo. El dado se convierte en un d8 en el nivel 5, un d10 en el nivel 10 y un d12 en el nivel 15.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        formulaUsos: "modificador de carisma (minimo 1)",
        recuperacion: "descanso_largo",
        categoriaMecanica: "consumible",
        formulaDados: "1d6",
        escaladoFormulaDados: [
          { nivelMinimo: 1,  valor: "1d6"  },
          { nivelMinimo: 5,  valor: "1d8"  },
          { nivelMinimo: 10, valor: "1d10" },
          { nivelMinimo: 15, valor: "1d12" }
        ],
        escaladoUsos: {
          tipo: "por_modificador",
          modificador: "carisma",
          minimo: 1
        },
        escaladoRecuperacion: [
          { nivelMinimo: 1, valor: "descanso_largo" },
          { nivelMinimo: 5, valor: "descanso_corto" }
        ],
        tablaProgresion: {
          columnas: ["Nivel", "Descripción"],
          filas: [
            { nivel: 1, valores: ["Dado de bardo: 1d6"] },
            { nivel: 5, valores: ["Dado de bardo: 1d8"] },
            { nivel: 10, valores: ["Dado de bardo: 1d10"] },
            { nivel: 15, valores: ["Dado de bardo: 1d12"] }
          ],
          notaPie: "Cada nivel reemplaza al anterior"
        }
      },

      {
        nivel: 1,
        nombre: "Lanzamiento de conjuros",
        descripcion: "Has aprendido a lanzar conjuros mediante tus artes bárdicas.\n\n***Trucos.*** Conoces dos trucos de tu elección escogidos de entre los de la lista de conjuros de bardo. Se recomiendan *luces danzantes* y *burla dañina*.\nCada vez que subas un nivel de bardo, puedes sustituir uno de tus trucos por otro truco de tu elección de la lista de conjuros de bardo.\n\nCuando alcances los niveles 4 y 10 de bardo, aprenderás otro truco de tu elección de la lista de conjuros de bardo.\n\n***Espacios de conjuro.*** El panel de espacios de conjuro de acciones o características muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios utilizados tras finalizar un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas una serie de conjuros de nivel 1 y superiores, que son los que podrás lanzar con este rasgo. Para empezar, elige cuatro conjuros de nivel 1 de la lista de conjuros de bardo. Se recomiendan *hechizar persona*, *rociada de color*, *susurros discordantes* y *palabra de curación*.\n\nEl número de conjuros de tu lista aumenta conforme subes de nivel de bardo. Cuando ese número aumente, elige conjuros adicionales de la lista de conjuros de bardo hasta que el número de conjuros de tu lista coincida con el número de la tabla. Estos conjuros deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un bardo de nivel 3, podrás preparar cualquier combinación de seis conjuros de niveles 1 o 2.\n\nSi otro rasgo de bardo te proporciona conjuros que siempre tienes preparados, esos conjuros no cuentan para el total que puedes preparar con este rasgo, pero sí que cuentan como conjuros de bardo para ti.\n\n***Cambiar los conjuros preparados.*** Cada vez que subas un nivel de bardo, puedes sustituir un conjuro de tu lista por otro conjuro de bardo para el que tengas espacios de conjuro.\n\n***Aptitud mágica.*** El Carisma es tu aptitud mágica en lo que respecta a tus conjuros de bardo.\n\n***Canalizador mágico.*** Puedes utilizar un *instrumento musical* como canalizador mágico para tus conjuros de bardo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Pericia",
        descripcion: "Ganas pericia en dos de tus competencias de habilidades de tu elección. Se recomiendan Interpretación y Persuasión si eres competente en ellas.\n\nEn el nivel 9 de bardo, ganas pericia en otras dos competencias de habilidades de tu elección.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 2,
        nombre: "Aprendiz de mucho",
        descripcion: "Puedes sumar la mitad de tu bonificador por competencia (redondeando hacia abajo) a cualquier prueba de característica que hagas que utilice una habilidad en la que no seas competente y que no use de otro modo tu bonificador por competencia.\n\nPor ejemplo, si haces una prueba de Fuerza (Atletismo) y no eres competente en Atletismo, puedes sumar la mitad de tu bonificador por competencia a la prueba.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente",
        efectos: [
          {
            tipo: "medio_bono_habilidades",
            objetivo: "habilidades_sin_competencia",
            valor: "mitad_competencia",
            descripcion: "Aprendiz de mucho (Mitad de bono de competencia a habilidades sin competencia)"
          }
        ]
      },
      {
        nivel: 3,
        nombre: "Subclase de bardo",
        descripcion: "Consigues una subclase de bardo de tu elección. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de bardo. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de bardo e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de bardo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Fuente de inspiración",
        descripcion: "Ahora recuperas todos los usos gastados de Inspiración bárdica cuando finalizas un descanso corto o largo.\n\nAdemás, puedes gastar un espacio de conjuro (no requiere acción) para recuperar un uso gastado de Inspiración bárdica.",
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente",
        ligadoA: "rasgo_cls_bardo_inspiracion_bardica"
      },
      {
        nivel: 6,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de bardo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Contraencantamiento",
        descripcion: "Puedes utilizar notas musicales o palabras de poder para interrumpir efectos que influyan en la mente. Si tú o una criatura a 30 pies o menos de ti fallan una tirada de salvación contra un efecto que aplique el estado de Hechizado o Asustado, puedes usar tu reacción para hacer que se repita la tirada de salvación, y la nueva tirada tiene ventaja.",
        tipoAccion: "reaccion"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 9,
        nombre: "Pericia",
        descripcion: "Ganas pericia en otras dos de tus competencias de habilidades de tu elección.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Secretos mágicos",
        descripcion: "Cada vez que aprendas o cambies un conjuro por subir de nivel de Bardo, puedes elegirlo de las listas de Bardo, Clérigo, Druida o Mago. El conjuro debe ser de un nivel para el cual ya tengas espacios de conjuro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de bardo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 18,
        nombre: "Inspiración superior",
        descripcion: "Cuando tiras iniciativa, recuperas usos gastados de Inspiración bárdica hasta tener dos si tienes menos de esa cantidad.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra dote de tu elección para la que cumplas las condiciones. Se recomienda Don del recuerdo de conjuros.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Palabras de creación",
        descripcion: "Has dominado dos de las Palabras de creación: las palabras de la vida y la muerte. Por lo tanto, siempre tienes preparados los conjuros *palabra de poder: sanar* y *palabra de poder: matar*. Cuando lances cualquiera de los dos conjuros, puedes elegir a una segunda criatura como objetivo si esta se encuentra a 10 pies o menos del primer objetivo.",
        tipoAccion: "pasivo",
        conjurosOtorgados: ["Palabra de poder: sanar", "Palabra de poder: matar"]
      },
    ],
    subclases: [
      {
        id: "colegio_de_la_danza",
        clasePadre: "bardo",
        nombre: "Colegio de la Danza",
        descripcion: "Los bardos del Colegio de la Danza saben que las Palabras de creación no pueden contenerse en el habla o la canción; las palabras son pronunciadas por los movimientos de los cuerpos celestes y fluyen a través de los movimientos de las criaturas más pequeñas. Estos bardos practican una forma de estar en armonía con el cosmos giratorio que enfatiza la agilidad, la velocidad y la gracia.",
        lema: "Muévete en armonía con el cosmos",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Juego de pies deslumbrante",
            descripcion: "Mientras no lleves armadura ni empuñes un *escudo*, obtienes los siguientes beneficios.\n\n***Virtuoso de la danza.*** Tienes ventaja en cualquier prueba de Carisma (Interpretación) que hagas que implique que estés bailando.\n\n***Defensa sin armadura.*** Tu Clase de Armadura base es igual a 10 más tus modificadores por Destreza y Carisma.\n\n***Golpes ágiles.*** Cuando gastas un uso de tu Inspiración bárdica como parte de una acción, una acción adicional o una reacción, puedes hacer un ataque sin armas como parte de esa acción, acción adicional o reacción.\n\n***Daño bárdico.*** Puedes usar Destreza en lugar de Fuerza para las tiradas de ataque de tus ataques sin armas. Cuando causas daño con un ataque sin armas, puedes infligir daño contundente igual a una tirada de tu dado de Inspiración bárdica más tu modificador por Destreza, en lugar del daño normal del golpe. Esta tirada no gasta el dado.",
            tipoAccion: "pasivo",
            subclase: "Colegio de la Danza",
            categoriaMecanica: "pasivo_permanente",
            efectos: [
              {
                tipo: "modificador_ca",
                objetivo: "defensa_sin_armadura",
                valor: "carisma",
                permiteEscudo: false,
                descripcion: "Defensa sin armadura (Colegio de la Danza: 10 + DES + CAR)"
              },
              {
                tipo: "ataque_desarmado",
                objetivo: "destreza",
                valor: "dado_inspiracion",
                condicion: "sin_armadura_ni_escudo",
                descripcion: "Daño bárdico"
              }
            ]
          },
          {
            nivel: 6,
            nombre: "Movimiento inspirador",
            descripcion: "Cuando un enemigo que puedas ver termine su turno a 15 pies o menos de ti, puedes usar una reacción y gastar un uso de tu Inspiración bárdica para moverte hasta la mitad de tu velocidad. Luego, un aliado de tu elección a 30 pies o menos de ti también puede moverse hasta la mitad de su velocidad usando su reacción.\n\nNinguno de los movimientos de este rasgo provoca ataques de oportunidad.",
            tipoAccion: "reaccion",
            subclase: "Colegio de la Danza",
            gastarDePadre: true,
            heredarDadosPadre: true,
            categoriaMecanica: "consumible"
          },
          {
            nivel: 6,
            nombre: "Juego de pies en tándem",
            descripcion: "Cuando tiras iniciativa, puedes gastar un uso de tu Inspiración bárdica si no tienes el estado de Incapacitado. Al hacerlo, tira tu dado de Inspiración bárdica; tú y cada aliado a 30 pies o menos de ti que pueda verte u oírte gana un bonificador a la iniciativa igual al número que hayas sacado.",
            tipoAccion: "especial",
            subclase: "Colegio de la Danza",
            gastarDePadre: true,
            heredarDadosPadre: true,
            autoDesactivar: true,
            categoriaMecanica: "consumible"
          },
          {
            nivel: 14,
            nombre: "Evasión líder",
            descripcion: "Cuando estás sujeto a un efecto que te permite hacer una tirada de salvación de Destreza para recibir solo la mitad del daño, en su lugar no recibes daño si tienes éxito en la tirada de salvación y solo la mitad del daño si fallas. Si alguna criatura a 5 pies o menos de ti está haciendo la misma tirada de salvación de Destreza, puedes compartir este beneficio con ellas para esa salvación.\n\nNo puedes usar este rasgo si tienes el estado de Incapacitado.",
            tipoAccion: "pasivo",
            subclase: "Colegio de la Danza"
          },
        ]
      },
      {
        id: "colegio_del_glamour",
        clasePadre: "bardo",
        nombre: "Colegio del Glamour",
        descripcion: "El Colegio del Glamour remonta sus orígenes a la magia cautivadora de los Parajes Feéricos. Los bardos que estudian esta magia tejen hilos de belleza y terror en sus canciones e historias, y los más poderosos de entre ellos pueden envolverse en una majestad de otro mundo. Sus actuaciones despiertan anhelos melancólicos por la inocencia olvidada, evocan recuerdos inconscientes de miedos largamente guardados y tiran de las emociones de incluso los oyentes más insensibles.",
        lema: "Urde magia feérica cautivadora",
        nivelDesbloqueo: 3,
        progresionConjuros: [
          {
            nivelClase: 3,
            conjuros: ["Hechizar persona", "Imagen múltiple"]
          },
          {
            nivelClase: 6,
            conjuros: ["Orden imperiosa"]
          }
        ],
        rasgos: [
          {
            nivel: 3,
            nombre: "Magia cautivadora",
            descripcion: "Siempre tienes los conjuros *hechizar persona* e *imagen múltiple* preparados.\n\nAdemás, inmediatamente después de lanzar un conjuro de Encantamiento o Ilusionismo utilizando un espacio de conjuro, puedes obligar a una criatura que puedas ver a 60 pies o menos de ti a hacer una tirada de salvación de Sabiduría contra la CD de salvación de tus conjuros. Si falla la tirada, el objetivo obtiene el estado de Hechizado o Asustado (tú eliges) durante 1 minuto. El objetivo repite la tirada de salvación al final de cada uno de sus turnos, terminando el efecto sobre sí mismo si tiene éxito.\n\nUna vez que utilices este beneficio, no podrás volver a usarlo hasta que finalices un descanso largo. También puedes recuperar su uso gastando un uso de tu Inspiración bárdica (no requiere acción).",
            tipoAccion: "pasivo",
            subclase: "Colegio del Glamour",
            tieneUsosLimitados: true,
            formulaUsos: "1",
            recuperacion: "descanso_largo"
          },
          {
            nivel: 3,
            nombre: "Manto de inspiración",
            descripcion: "Puedes tejer magia feérica en una canción o danza para llenar a otros de vigor. Como acción adicional, puedes gastar un uso de Inspiración bárdica, tirando un dado de Inspiración bárdica. Al hacerlo, elige una cantidad de criaturas adicionales a 60 pies o menos de ti, hasta un número igual a tu modificador por Carisma (mínimo de una criatura). Cada una de esas criaturas obtiene una cantidad de Puntos de golpe temporales igual al doble del número sacado en el dado de Inspiración bárdica, y luego cada una puede usar su reacción para moverse hasta su velocidad sin provocar ataques de oportunidad.",
            tipoAccion: "accion_adicional",
            subclase: "Colegio del Glamour",
            gastarDePadre: true,
            heredarDadosPadre: true,
            categoriaMecanica: "consumible",
            efectos: [
              {
                tipo: "hp_temporal",
                objetivo: "propio",
                valor: "2_veces_dado_inspiracion",
                descripcion: "Otorga Puntos de golpe temporales al personaje igual al doble del número sacado en el dado de Inspiración bárdica"
              }
            ]
          },
          {
            nivel: 6,
            nombre: "Manto de majestad",
            descripcion: "Siempre tienes el conjuro *orden imperiosa* preparado.\n\nComo acción adicional, lanzas *orden imperiosa* sin gastar un espacio de conjuro, y adoptas una apariencia sobrenatural durante 1 minuto o hasta que pierdas la concentración. Durante este tiempo, puedes lanzar *orden imperiosa* como acción adicional sin gastar un espacio de conjuro.\n\nCualquier criatura Hechizada por ti falla automáticamente su tirada de salvación contra la *orden imperiosa* que lances con este rasgo.\n\nUna vez que utilices este rasgo, no podrás volver a usarlo hasta que finalices un descanso largo. También puedes recuperar su uso gastando un espacio de conjuro de nivel 3 o superior (no requiere acción).",
            tipoAccion: "accion_adicional",
            subclase: "Colegio del Glamour",
            tieneUsosLimitados: true,
            formulaUsos: "1",
            obtenerUsosMaximos: () => 1,
            recuperacion: "descanso_largo",
            esActivable: true,
            condicionAlActivar: "Manto de Majestad (Mantle of Majesty)",
            categoriaMecanica: "activable",
            conjurosOtorgados: ["Orden imperiosa"],
            efectos: [
              {
                tipo: "conjuro_gratuito",
                objetivo: "Orden imperiosa",
                valor: "sin_espacio",
                descripcion: "Permite lanzar Orden imperiosa sin gastar espacios ni puntos de conjuro mientras Manto de majestad esté activo"
              }
            ]
          },
          {
            nivel: 14,
            nombre: "Majestad inquebrantable",
            descripcion: "Como acción adicional, puedes asumir una presencia mágicamente majestuosa durante 1 minuto o hasta que obtengas el estado de Incapacitado. Mientras dure, siempre que cualquier criatura te acierte con una tirada de ataque por primera vez en un turno, el atacante debe tener éxito en una tirada de salvación de Carisma contra la CD de salvación de tus conjuros, o el ataque falla en su lugar, mientras la criatura retrocede ante tu majestad.\n\nUna vez que asumas esta presencia majestuosa, no podrás volver a hacerlo hasta que finalices un descanso corto o largo.",
            tipoAccion: "accion_adicional",
            subclase: "Colegio del Glamour",
            tieneUsosLimitados: true,
            formulaUsos: "1",
            obtenerUsosMaximos: () => 1,
            recuperacion: "descanso_corto",
            esActivable: true,
            condicionAlActivar: "Majestad Inquebrantable (Unbreakable Majesty)",
            categoriaMecanica: "activable",
            efectos: [
              {
                tipo: "personalizado",
                objetivo: "propio",
                valor: "informativo",
                descripcion: "Presencia majestuosa: Si una criatura te acierta con un ataque por primera vez en un turno, debe superar una salvación de Carisma contra tu CD de conjuros o el ataque falla."
              }
            ]
          },
        ]
      },
      {
        id: "colegio_del_conocimiento",
        clasePadre: "bardo",
        nombre: "Colegio del Conocimiento",
        descripcion: "Los bardos del Colegio del Conocimiento recopilan conjuros y secretos de diversas fuentes, como pesados tomos eruditos, ritos místicos y cuentos de campesinos. Los miembros del colegio se reúnen en bibliotecas y universidades para compartir sus conocimientos entre sí. También se reúnen en festivales o asuntos de estado, donde pueden exponer la corrupción, desentrañar mentiras y burlarse de figuras de autoridad engreídas.",
        lema: "Sondea las profundidades del conocimiento mágico",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Competencias adicionales",
            descripcion: "Ganas competencia con tres habilidades de tu elección.",
            tipoAccion: "pasivo",
            subclase: "Colegio del Conocimiento"
          },
          {
            nivel: 3,
            nombre: "Palabras cortantes",
            descripcion: "Aprendes a usar tu ingenio para distraer de forma sobrenatural, confundir y de otro modo minar la confianza y la competencia de los demás. Cuando una criatura que puedas ver a 60 pies o menos de ti haga una tirada de daño o tenga éxito en una prueba de característica o tirada de ataque, puedes usar una reacción para gastar un uso de tu Inspiración bárdica; tira tu dado de Inspiración bárdica y resta el número sacado de la tirada de la criatura, reduciendo el daño o potencialmente convirtiendo el éxito en un fracaso.",
            tipoAccion: "reaccion",
            subclase: "Colegio del Conocimiento",
            gastarDePadre: true,
            heredarDadosPadre: true,
            categoriaMecanica: "consumible"
          },
          {
            nivel: 6,
            nombre: "Descubrimientos mágicos",
            descripcion: "Aprendes dos conjuros de tu elección. Estos conjuros pueden provenir de la lista de conjuros de clérigo, druida o mago, o cualquier combinación de los mismos. Un conjuro que elijas debe ser un truco o un conjuro para el que tengas espacios de conjuro,.\n\nSiempre tienes los conjuros elegidos preparados, y cada vez que subas un nivel de bardo, puedes sustituir uno de los conjuros por otro conjuro que cumpla con estos requisitos.",
            tipoAccion: "pasivo",
            subclase: "Colegio del Conocimiento"
          },
          {
            nivel: 14,
            nombre: "Habilidad inigualable",
            descripcion: "Cuando hagas una prueba de característica o una tirada de ataque y falles, puedes gastar un uso de Inspiración bárdica; tira el dado de Inspiración bárdica y suma el número sacado al d20, potencialmente convirtiendo un fracaso en un éxito. En caso de fallo, la Inspiración bárdica no se gasta.",
            tipoAccion: "pasivo",
            subclase: "Colegio del Conocimiento",
            gastarDePadre: true,
            heredarDadosPadre: true,
            categoriaMecanica: "consumible"
          },
        ]
      },
      {
        id: "colegio_del_valor",
        clasePadre: "bardo",
        nombre: "Colegio del Valor",
        descripcion: "Los bardos del Colegio del Valor son audaces narradores cuyas historias preservan la memoria de los grandes héroes del pasado. Estos bardos cantan las hazañas de los poderosos en salones abovedados o a las multitudes reunidas alrededor de grandes hogueras. Viajan para presenciar grandes eventos de primera mano y asegurarse de que el recuerdo de estos eventos no perezca. Con sus canciones, inspiran a las nuevas generaciones a alcanzar las mismas alturas de logro que los héroes de antaño.",
        lema: "Canta las hazañas de antiguos héroes",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Inspiración en combate",
            descripcion: "Puedes usar tu ingenio para cambiar el rumbo de la batalla. Una criatura que tenga un dado de Inspiración bárdica tuyo puede usarlo para uno de los siguientes efectos.\n\n***Defensa.*** Cuando la criatura es impactada por una tirada de ataque, esa criatura puede usar su reacción para tirar el dado de Inspiración bárdica y sumar el número sacado a su CA contra ese ataque, causando potencialmente que el ataque falle.\n\n***Ofensiva.*** Inmediatamente después de que la criatura acierte a un objetivo con una tirada de ataque, la criatura puede tirar el dado de Inspiración bárdica y sumar el número sacado al daño del ataque contra el objetivo.",
            tipoAccion: "pasivo",
            subclase: "Colegio del Valor"
          },
          {
            nivel: 3,
            nombre: "Entrenamiento marcial",
            descripcion: "Ganas competencia con armas marciales y entrenamiento con armaduras medias y *escudos*.\n\nAdemás, puedes usar un arma sencilla o marcial como Canalizador mágico para lanzar conjuros de tu lista de conjuros de bardo.",
            tipoAccion: "pasivo",
            subclase: "Colegio del Valor",
            categoriaMecanica: "pasivo_permanente",
            efectos: [
              {
                tipo: "competencia",
                objetivo: "armas_marciales",
                valor: "marciales",
                descripcion: "Competencia con armas marciales"
              },
              {
                tipo: "competencia",
                objetivo: "armaduras_medias",
                valor: "medias",
                descripcion: "Competencia con armaduras medias"
              },
              {
                tipo: "competencia",
                objetivo: "escudos",
                valor: "escudos",
                descripcion: "Competencia con escudos"
              }
            ]
          },
          {
            nivel: 6,
            nombre: "Ataque adicional",
            descripcion: "Puedes atacar dos veces en lugar de una cada vez que realices la acción de Atacar en tu turno.\n\nAdemás, puedes lanzar uno de tus trucos que tenga un tiempo de lanzamiento de una acción en lugar de uno de esos ataques.",
            tipoAccion: "accion",
            subclase: "Colegio del Valor"
          },
          {
            nivel: 14,
            nombre: "Magia de batalla",
            descripcion: "Después de lanzar un conjuro que tenga un tiempo de lanzamiento de una acción, puedes hacer un ataque con un arma como acción adicional.",
            tipoAccion: "accion_adicional",
            subclase: "Colegio del Valor"
          },
        ]
      },
    ]
  },
  {
    id: "brujo",
    nombre: "Brujo",
    descripcion: "Un practicante de la magia conferida por un pacto con una entidad de otro mundo, blandiendo invocaciones sobrenaturales y magia destructiva.",
    dadoGolpe: "d8",
    caracteristicasPrimarias: ["carisma","constitucion"],
    salvacionesCompetentes: ["sabiduria","carisma"],
    competenciasArmaduras: ["Armaduras Ligeras"],
    competenciasArmas: ["Armas Sencillas"],
    competenciasHerramientas: [],
    opcionesHabilidades: {"cantidad":2,"opciones":["arcanos","engaño","historia","intimidacion","investigacion","naturaleza","religion"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Armadura de cuero, Foco arcano, 2 Dagas, Ballesta ligera con 20 virotes, Paquete de Erudito y 15 PO","opcionB":"(B) 100 PO en monedas para comprar equipo"},
    configuracionMagica: {"tipoLanzador":"pacto","habilidadConjuro":"carisma","modeloConjuros":"preparados","nivelInicio":1},
    rasgos: [
      {
        nivel: 1,
        nombre: "Invocaciones sobrenaturales",
        descripcion: "Has desenterrado las Invocaciones sobrenaturales, fragmentos de conocimiento prohibido que te imbuyen de una habilidad mágica permanente u otras lecciones. Obtienes invocaciones sobrenaturales de tu elección del catálogo de invocaciones.\n\n***Requisitos previos.*** Si una invocación tiene un requisito previo, debes cumplirlo para aprenderla. Por ejemplo, si una invocación requiere que seas un brujo de nivel 5 o superior, podrás seleccionarla una vez que alcances el nivel 5 de brujo.\n\n***Sustituir y obtener invocaciones.*** Cada vez que subas un nivel de brujo, puedes sustituir una de tus invocaciones por otra para la que cumplas los requisitos. No puedes sustituir una invocación si sirve de requisito previo para otra invocación que poseas.\nCuando alcanzas ciertos niveles de brujo, obtienes más invocaciones de tu elección, como se muestra en la progresión de la clase.\nNo puedes elegir la misma invocación más de una vez a menos que su descripción indique lo contrario.",
        tipoAccion: "pasivo",
        categoriaMecanica: "selector_informativo",
        selectores: [
          {
            id: "invocaciones_sobrenaturales_aprendidas",
            tipo: "multiple",
            etiqueta: "Invocaciones Sobrenaturales Elegidas",
            maxSelecciones: 1,
            opciones: generarOpcionesSelectorInvocaciones(1),
            valorActual: ["pacto_del_grimorio"]
          }
        ],
        tablaProgresion: {
          columnas: ["Nivel de Brujo", "Invocaciones Conocidas"],
          filas: [
            { nivel: 1, valores: ["1 invocación"] },
            { nivel: 2, valores: ["3 invocaciones"] },
            { nivel: 5, valores: ["5 invocaciones"] },
            { nivel: 7, valores: ["6 invocaciones"] },
            { nivel: 9, valores: ["7 invocaciones"] },
            { nivel: 12, valores: ["8 invocaciones"] },
            { nivel: 15, valores: ["8 invocaciones"] },
            { nivel: 17, valores: ["8 invocaciones"] },
            { nivel: 18, valores: ["8 invocaciones"] }
          ],
          notaPie: "Cada nivel reemplaza al anterior. Puedes sustituir una invocación al subir de nivel."
        }
      },
      {
        nivel: 1,
        nombre: "Magia del pacto",
        descripcion: "Mediante una ceremonia oculta, has formado un pacto con una entidad misteriosa para obtener poderes mágicos. La entidad es una voz en las sombras —su identidad no está clara—, pero su don para ti es tangible: la capacidad de lanzar conjuros. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información a continuación detalla cómo usar esas reglas con los conjuros de brujo, que aparecen en la lista de conjuros de brujo más adelante en la descripción de la clase.\n\n***Trucos.*** Conoces dos trucos de tu elección escogidos de entre los de la lista de conjuros de brujo. Se recomiendan *descarga sobrenatural* y *prestidigitación*. Cada vez que subas un nivel de brujo, puedes sustituir uno de los trucos obtenidos por este rasgo por otro truco de tu elección de la lista de conjuros de brujo.\nCuando alcances los niveles 4 y 10 de brujo, aprenderás otro truco de tu elección de la lista de conjuros de brujo, como se muestra en la columna \"Trucos\" de la tabla \"Rasgos de brujo\".\n\n***Espacios de conjuro.*** La tabla \"Rasgos de brujo\" muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de brujo de niveles 1 a 5. La tabla también muestra el nivel de esos espacios, los cuales son todos del mismo nivel. Recuperas todos los espacios de conjuro de Magia del pacto gastados cuando finalizas un descanso corto o largo.\nPor ejemplo, cuando eres un brujo de nivel 5, tienes dos espacios de conjuro de nivel 3. Para lanzar el conjuro de nivel 1 *saeta de bruja*, debes gastar uno de esos espacios, y lo lanzas como un conjuro de nivel 3.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas la lista de conjuros de nivel 1 y superiores que tienes disponibles para lanzar con este rasgo. Para empezar, elige dos conjuros de nivel 1 de la lista de conjuros de brujo. Se recomiendan *hechizar persona* y *maldición*.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de brujo, como se muestra en la columna \"Conjuros preparados\" de la tabla \"Rasgos de brujo\". Cada vez que aumente ese número, elige conjuros de brujo adicionales hasta que el número de conjuros de tu lista coincida con el número de la tabla. Los conjuros elegidos deben ser de un nivel no superior al mostrado en la columna \"Nivel del espacio\" de la tabla para tu nivel. Al llegar al nivel 6, por ejemplo, aprendes un nuevo conjuro de brujo, que puede ser de niveles 1 a 3.\nSi otro rasgo de brujo te otorga conjuros que siempre tienes preparados, esos conjuros no cuentan para el total que puedes preparar con este rasgo, pero sí cuentan como conjuros de brujo para ti.\n\n***Cambiar tus conjuros preparados.*** Cada vez que subas un nivel de brujo, puedes sustituir un conjuro de tu lista por otro conjuro de brujo de un nivel elegible.\n\n***Aptitud mágica.*** El Carisma es tu aptitud mágica en lo que respecta a tus conjuros de brujo.\n\n***Canalizador mágico.*** Puedes utilizar un *canalizador arcano* como canalizador mágico para tus conjuros de brujo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_corto"
      },
      {
        nivel: 2,
        nombre: "Astucia mágica",
        descripcion: "Puedes realizar un rito esotérico durante 1 minuto. Al finalizarlo, recuperas espacios de conjuro gastados de Magia del pacto, pero no más de una cantidad igual a la mitad de tu máximo (redondeando hacia arriba). Una vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 3,
        nombre: "Subclase de brujo",
        descripcion: "Consigues una subclase de brujo de tu elección. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de brujo. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de brujo e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de brujo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 6,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de brujo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 9,
        nombre: "Contactar con el patrón",
        descripcion: "En el pasado, solías contactar con tu patrón a través de intermediarios. Ahora puedes comunicarte directamente; siempre tienes preparado el conjuro *contactar con otro plano*. Con este rasgo, puedes lanzar el conjuro sin gastar un espacio de conjuro para contactar con tu patrón, y superas automáticamente la tirada de salvación del conjuro.\nUna vez que lances el conjuro con este rasgo, no podrás volver a hacerlo de esta manera hasta que finalices un descanso largo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 10,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de brujo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 11,
        nombre: "Arcano místico",
        descripcion: "Tu patrón te concede un secreto mágico llamado arcano. Elige un conjuro de brujo de nivel 6 como este arcano.\nPuedes lanzar tu conjuro de arcano una vez sin gastar un espacio de conjuro, y debes finalizar un descanso largo antes de poder lanzarlo de esta forma de nuevo.\nComo se muestra en la tabla \"Rasgos de brujo\", obtienes otro conjuro de brujo de tu elección que puede lanzarse de esta manera cuando alcanzas los niveles de brujo 13 (conjuro de nivel 7), 15 (conjuro de nivel 8) y 17 (conjuro de nivel 9). Recuperas todos los usos de tu Arcano místico cuando finalizas un descanso largo.\nCada vez que subas un nivel de brujo, puedes sustituir uno de tus conjuros de arcano por otro conjuro de brujo del mismo nivel.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 13,
        nombre: "Arcano místico",
        descripcion: "Obtienes un conjuro de brujo de nivel 7 de tu elección.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de brujo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 15,
        nombre: "Arcano místico",
        descripcion: "Obtienes un conjuro de brujo de nivel 8 de tu elección.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 17,
        nombre: "Arcano místico",
        descripcion: "Obtienes un conjuro de brujo de nivel 9 de tu elección.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don del destino.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Maestro sobrenatural",
        descripcion: "Cuando usas tu rasgo Astucia mágica, recuperas todos tus espacios de conjuro gastados de Magia del pacto.\n---",
        tipoAccion: "pasivo"
      },
    ],
    subclases: [
      {
        id: "patron_de_los_archihadas",
        clasePadre: "brujo",
        nombre: "Patrón de los Archihadas",
        descripcion: "Tu pacto extrae poder de Feywild (las Tierras Salvajes de las Hadas). Cuando eliges esta subclase, podrías llegar a un acuerdo con un archihada, como el Príncipe de las Heladas; la Reina del Aire y la Oscuridad, soberana de la Corte Crepuscular; Titania de la Corte del Verano; o una bruja anciana. O bien, podrías recurrir a un espectro de seres feéricos, tejiendo una red de favores y deudas. Sean quienes sean, tu patrón suele ser inescrutable y caprichoso.",
        lema: "Pacta con los caprichosos seres feéricos",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Fuego feérico","Hechizar persona","Paso brumoso","Calmar emociones"]},{"nivelClase":5,"conjuros":["Parpadeo","Crecimiento vegetal"]},{"nivelClase":7,"conjuros":["Dominar bestia","Invisibilidad mayor"]},{"nivelClase":9,"conjuros":["Dominar persona","Paso arbóreo"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros de archihada",
            descripcion: "La magia de tu patrón garantiza que siempre tengas ciertos conjuros listos; cuando alcances un nivel de brujo especificado en la tabla \"Conjuros de archihada\", a partir de entonces siempre tendrás preparados los conjuros indicados.\n##### Conjuros de archihada\n| Nivel de brujo | Conjuros preparados                                                          |\n|:--------------:|------------------------------------------------------------------------------|\n|       3        | *calmar emociones*, *fuego feérico*, *paso brumoso*, *fuerza fantasmal*, *dormir* |\n|       5        | *parpadeo*, *crecimiento vegetal*                                            |\n|       7        | *dominar bestia*, *invisibilidad mayor*                                      |\n|       9        | *dominar persona*, *apariencia*                                              |",
            tipoAccion: "pasivo",
            subclase: "Patrón de los Archihadas"
          },
          {
            nivel: 3,
            nombre: "Pasos feéricos",
            descripcion: "Tu patrón te concede la capacidad de desplazarte entre los límites de los planos. Puedes lanzar *paso brumoso* sin gastar un espacio de conjuro una cantidad de veces igual a tu modificador por Carisma (mínimo una vez), y recuperas todos los usos gastados cuando finalizas un descanso largo.\nAdemás, cada vez que lances ese conjuro, puedes elegir uno de los siguientes efectos adicionales:\n\n***Paso refrescante.*** Inmediatamente después de teletransportarte, tú o una criatura que puedas ver a 3 m (10 pies) o menos de ti obtenéis 1d10 puntos de golpe temporales.\n\n***Paso provocador.*** Las criaturas a 1,5 m (5 pies) o menos del espacio que dejaste deben superar una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros o tendrán desventaja en las tiradas de ataque contra criaturas distintas a ti hasta el comienzo de tu siguiente turno.",
            tipoAccion: "pasivo",
            subclase: "Patrón de los Archihadas",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "1d10"
          },
          {
            nivel: 6,
            nombre: "Escapada brumosa",
            descripcion: "Puedes lanzar *paso brumoso* como una reacción en respuesta a recibir daño.\nAdemás, los siguientes efectos se encuentran ahora entre tus opciones de Pasos feéricos:\n\n***Paso evanescente.*** Tienes el estado de invisible hasta el comienzo de tu siguiente turno o hasta inmediatamente después de realizar una tirada de ataque, infligir daño o lanzar un conjuro.\n\n***Paso pavoroso.*** Las criaturas a 1,5 m (5 pies) o menos del espacio que dejaste o del espacio en el que apareces (a tu elección) deben superar una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros o sufrir 2d10 de daño psíquico.",
            tipoAccion: "pasivo",
            subclase: "Patrón de los Archihadas",
            formulaDados: "2d10"
          },
          {
            nivel: 10,
            nombre: "Defensas fascinantes",
            descripcion: "Tu patrón te enseña cómo proteger tu mente y tu cuerpo. Eres inmune al estado de hechizado.\nAdemás, inmediatamente después de que una criatura que puedas ver te acierte con una tirada de ataque, puedes llevar a cabo una reacción para reducir el daño recibido a la mitad (redondeando hacia abajo), y puedes obligar al atacante a hacer una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros. Si falla la tirada, el atacante sufre daño psíquico igual al daño que tú recibes. Una vez que uses esta reacción, no podrás volver a usarla hasta que finalices un descanso largo, a menos que gastes un espacio de conjuro de Magia del pacto (no requiere acción) para restaurar su uso.",
            tipoAccion: "pasivo",
            subclase: "Patrón de los Archihadas",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 14,
            nombre: "Magia embrujadora",
            descripcion: "Tu patrón te concede la capacidad de entrelazar tu magia con la teletransportación. Inmediatamente después de lanzar un conjuro de Encantamiento o Ilusión usando una acción y un espacio de conjuro, puedes lanzar *paso brumoso* como parte de la misma acción y sin gastar un espacio de conjuro.\n---",
            tipoAccion: "pasivo",
            subclase: "Patrón de los Archihadas"
          },
        ]
      },
      {
        id: "patron_celestial",
        clasePadre: "brujo",
        nombre: "Patrón Celestial",
        descripcion: "Tu pacto extrae poder de los Planos Superiores, los reinos de la dicha eterna. Podrías entrar en un acuerdo con un empíreo, un couatl, una esfinge, un unicornio u otra entidad celestial. O bien, podrías recurrir a numerosos seres de este tipo mientras persigues objetivos alineados con los suyos. Tu pacto te permite experimentar un destello de la luz sagrada que ilumina el multiverso.",
        lema: "Invoca el poder de los Cielos",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Auxilio","Curar heridas","Rayo abrasador","Restablecimiento menor"],"trucos":["Luz","Llama sagrada"]},{"nivelClase":5,"conjuros":["Luz del día","Revivir"]},{"nivelClase":7,"conjuros":["Guardián de la fe","Muro de fuego"]},{"nivelClase":9,"conjuros":["Columna de llamas","Restablecimiento mayor"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros celestiales",
            descripcion: "La magia de tu patrón garantiza que siempre tengas ciertos conjuros listos; cuando alcances un nivel de brujo especificado en la tabla \"Conjuros celestiales\", a partir de entonces siempre tendrás preparados los conjuros indicados.\n##### Conjuros celestiales\n| Nivel de brujo | Conjuros preparados                                                              |\n|:--------------:|----------------------------------------------------------------------------------|\n|       3        | *auxilio*, *curar heridas*, *saeta guía*, *restablecimiento menor*, *luz*, *llama sagrada* |\n|       5        | *luz del día*, *revivir*                                                         |\n|       7        | *guardián de la fe*, *muro de fuego*                                             |\n|       9        | *restablecimiento mayor*, *invocar celestial*                                    |",
            tipoAccion: "pasivo",
            subclase: "Patrón Celestial"
          },
          {
            nivel: 3,
            nombre: "Luz sanadora",
            descripcion: "Obtienes la capacidad de canalizar energía celestial para sanar heridas. Tienes una reserva de d6 para alimentar esta curación. El número de dados en la reserva es igual a 1 más tu nivel de brujo.\nComo acción adicional, puedes curarte a ti mismo o a una criatura que puedas ver a 18 m (60 pies) o menos de ti, gastando dados de la reserva. El número máximo de dados que puedes gastar a la vez es igual a tu modificador por Carisma (mínimo un dado). Tira los dados gastados y restaura una cantidad de puntos de golpe igual al total de la tirada. Tu reserva recupera todos los dados gastados cuando finalizas un descanso largo.",
            tipoAccion: "accion_adicional",
            subclase: "Patrón Celestial",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 6,
            nombre: "Alma radiante",
            descripcion: "Tu vínculo con tu patrón te permite actuar como conducto de energía radiante. Tienes resistencia al daño radiante. Una vez por turno, cuando un conjuro que lances inflija daño de fuego o radiante, puedes sumar tu modificador por Carisma al daño de ese conjuro contra uno de los objetivos del mismo.",
            tipoAccion: "pasivo",
            subclase: "Patrón Celestial"
          },
          {
            nivel: 10,
            nombre: "Resiliencia celestial",
            descripcion: "Obtienes puntos de golpe temporales cada vez que uses tu rasgo Astucia mágica o finalices un descanso corto o largo. Estos puntos de golpe temporales son iguales a tu nivel de brujo más tu modificador por Carisma. Además, elige hasta a cinco criaturas que puedas ver cuando obtengas los puntos. Esas criaturas ganan cada una puntos de golpe temporales iguales a la mitad de tu nivel de brujo más tu modificador por Carisma.",
            tipoAccion: "pasivo",
            subclase: "Patrón Celestial",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 14,
            nombre: "Venganza abrasadora",
            descripcion: "Cuando tú o un aliado a 18 m (60 pies) o menos de ti estéis a punto de hacer una tirada de salvación contra la muerte, puedes desatar energía radiante para salvar a la criatura. La criatura recupera puntos de golpe iguales a la mitad de sus puntos de golpe máximos y puede poner fin al estado de derribado sobre sí misma. Cada criatura de tu elección que esté a 9 m (30 pies) o menos de la criatura sufre daño radiante igual a 2d8 más tu modificador por Carisma, y tiene el estado de cegado hasta el final del turno actual.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.\n---",
            tipoAccion: "pasivo",
            subclase: "Patrón Celestial",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "2d8"
          },
        ]
      },
      {
        id: "patron_infernal",
        clasePadre: "brujo",
        nombre: "Patrón Infernal",
        descripcion: "Tu pacto extrae poder de los Planos Inferiores, los reinos de perdición. Podrías forjar un trato con un señor demoníaco como Demogorgon u Orcus; un archidiablo como Asmodeo; o un demonio del foso, bálor, yugoloth o bruja nocturna especialmente poderoso. Los objetivos de ese patrón son malvados —la corrupción o destrucción de todas las cosas, incluyéndote en última instancia a ti—, y tu senda está definida por la medida en que te resistas a tales fines.",
        lema: "Haz un trato con los Planos Inferiores",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Manos ardientes","Orden imperiosa","Ceguera/Sordera","Rayo abrasador"]},{"nivelClase":5,"conjuros":["Bola de fuego","Apestar"]},{"nivelClase":7,"conjuros":["Escudo de fuego","Muro de fuego"]},{"nivelClase":9,"conjuros":["Columna de llamas","Invocación infernal"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros infernales",
            descripcion: "La magia de tu patrón garantiza que siempre tengas ciertos conjuros listos; cuando alcances un nivel de brujo especificado en la tabla \"Conjuros infernales\", a partir de entonces siempre tendrás preparados los conjuros indicados.\n##### Conjuros infernales\n| Nivel de brujo | Conjuros preparados                                         |\n|:--------------:|-------------------------------------------------------------|\n|       3        | *manos ardientes*, *orden imperiosa*, *rayo abrasador*, *sugestión* |\n|       5        | *bola de fuego*, *nube apestosa*                            |\n|       7        | *escudo de fuego*, *muro de fuego*                          |\n|       9        | *misión*, *plaga de insectos*                               |",
            tipoAccion: "pasivo",
            subclase: "Patrón Infernal"
          },
          {
            nivel: 3,
            nombre: "Bendición del Oscuro",
            descripcion: "Cuando reduzcas a un enemigo a 0 puntos de golpe, obtienes puntos de golpe temporales iguales a tu modificador por Carisma más tu nivel de brujo (mínimo 1 punto de golpe temporal). También obtienes este beneficio si otra persona reduce a un enemigo a 3 m (10 pies) o menos de ti a 0 puntos de golpe.",
            tipoAccion: "pasivo",
            subclase: "Patrón Infernal"
          },
          {
            nivel: 6,
            nombre: "Propia suerte del Oscuro",
            descripcion: "Puedes recurrir a tu patrón infernal para alterar el destino a tu favor. Cuando hagas una prueba de característica o una tirada de salvación, puedes usar este rasgo para sumar 1d10 a tu tirada. Puedes hacerlo después de ver la tirada pero antes de que ocurra cualquiera de sus efectos.\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Carisma (mínimo una vez), pero no puedes usarlo más de una vez por tirada. Recuperas todos los usos gastados cuando finalizas un descanso largo.",
            tipoAccion: "pasivo",
            subclase: "Patrón Infernal",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "1d10"
          },
          {
            nivel: 10,
            nombre: "Resiliencia infernal",
            descripcion: "Elige un tipo de daño, distinto de fuerza, cada vez que finalices un descanso corto o largo. Tienes resistencia a ese tipo de daño hasta que elijas uno diferente con este rasgo.",
            tipoAccion: "pasivo",
            subclase: "Patrón Infernal",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 14,
            nombre: "Arrojar al Infierno",
            descripcion: "Una vez por turno, cuando aciertes a una criatura con una tirada de ataque, puedes intentar transportar instantáneamente al objetivo a través de los Planos Inferiores. El objetivo debe tener éxito en una tirada de salvación de Carisma contra tu CD de salvación de conjuros o desaparecerá y será arrastrado a través de un paisaje de pesadilla. El objetivo sufre 8d10 de daño psíquico si no es un infernal, y tiene el estado de incapacitado hasta el final de tu siguiente turno, momento en el que regresa al espacio que ocupaba anteriormente o al espacio sin ocupar más cercano.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes un espacio de conjuro de Magia del pacto (no requiere acción) para restaurar su uso.\n---",
            tipoAccion: "pasivo",
            subclase: "Patrón Infernal",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "8d10"
          },
        ]
      },
      {
        id: "patron_del_gran_primigenio",
        clasePadre: "brujo",
        nombre: "Patrón del Gran Primigenio",
        descripcion: "Cuando eliges esta subclase, podrías vincularte a un ser indescriptible del Reino Lejano o a un dios antiguo: un ser como Tharizdun, el Dios Encadenado; Zargon, el Retornado; Hadar, el Hambre Oscura; o el Gran Cthulhu. O bien, podrías invocar a varias entidades sin atarte a una sola. Los motivos de estos seres son incomprensibles, y el Gran Primigenio puede ser indiferente a tu existencia. Sin embargo, los secretos que has aprendido te permiten extraer extraña magia de él.",
        lema: "Desentierra el saber prohibido de seres inefables",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Susurros discordantes","Risa horrible de Tasha","Detectar pensamientos","Fuerza fantasmal"]},{"nivelClase":5,"conjuros":["Clarividencia","Hambre de Hadar","Maldición","Mente resbaladiza"]},{"nivelClase":7,"conjuros":["Dominar bestia","Tentáculos negros de Evard"]},{"nivelClase":9,"conjuros":["Dominar persona","Telequinesis"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del Gran Primigenio",
            descripcion: "La magia de tu patrón garantiza que siempre tengas ciertos conjuros listos; cuando alcances un nivel de brujo especificado en la tabla \"Conjuros del Gran Primigenio\", a partir de entonces siempre tendrás preparados los conjuros indicados.\n##### Conjuros del Gran Primigenio\n| Nivel de brujo | Conjuros preparados                                                                  |\n|:--------------:|--------------------------------------------------------------------------------------|\n|       3        | *detectar pensamientos*, *susurros disonantes*, *fuerza fantasmal*, *risa espantosa de Tasha* |\n|       5        | *clarividencia*, *hambre de Hadar*                                                   |\n|       7        | *confusión*, *invocar aberración*                                                    |\n|       9        | *alterar los recuerdos*, *telequinesis*                                              |",
            tipoAccion: "pasivo",
            subclase: "Patrón del Gran Primigenio"
          },
          {
            nivel: 3,
            nombre: "Mente despierta",
            descripcion: "Puedes formar una conexión telepática entre tu mente y la de otra persona. Como acción adicional, elige a una criatura que puedas ver a 9 m (30 pies) o menos de ti. Tú y la criatura elegida podéis comunicaros telepáticamente entre vosotros mientras ambos os encontréis a una cantidad de kilómetros (millas) el uno del otro igual a tu modificador por Carisma (mínimo 1,5 km / 1 milla). Para entenderse mutuamente, ambos debéis usar mentalmente un idioma que el otro conozca.\nLa conexión telepática dura una cantidad de minutos igual a tu nivel de brujo. Termina antes de tiempo si usas este rasgo para conectarte con una criatura diferente.",
            tipoAccion: "accion_adicional",
            subclase: "Patrón del Gran Primigenio"
          },
          {
            nivel: 3,
            nombre: "Conjuros psíquicos",
            descripcion: "Cuando lances un conjuro de brujo que inflija daño, puedes cambiar su tipo de daño a psíquico. Además, cuando lances un conjuro de brujo que sea de Encantamiento o Ilusión, puedes lanzarlo sin componentes verbales ni somáticos.",
            tipoAccion: "pasivo",
            subclase: "Patrón del Gran Primigenio"
          },
          {
            nivel: 6,
            nombre: "Combatiente clarividente",
            descripcion: "Cuando formas un vínculo telepático con una criatura mediante Mente despierta, puedes obligar a esa criatura a hacer una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros. Si falla la tirada, la criatura tendrá desventaja en las tiradas de ataque contra ti, y tú tendrás ventaja en las tiradas de ataque contra esa criatura durante la duración del vínculo.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso corto o largo, a menos que gastes un espacio de conjuro de Magia del pacto (no requiere acción) para restaurar su uso.",
            tipoAccion: "pasivo",
            subclase: "Patrón del Gran Primigenio",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 10,
            nombre: "Maldición sobrenatural",
            descripcion: "Tu patrón alienígena te concede una poderosa maldición. Siempre tienes preparado el conjuro *maldición*. Cuando lances *maldición* y elijas una característica, el objetivo también tendrá desventaja en las tiradas de salvación de la característica elegida durante la duración del conjuro.",
            tipoAccion: "pasivo",
            subclase: "Patrón del Gran Primigenio"
          },
          {
            nivel: 10,
            nombre: "Escudo de pensamientos",
            descripcion: "Tus pensamientos no pueden leerse mediante telepatía u otros medios a menos que tú lo permitas. También tienes resistencia al daño psíquico, y cada vez que una criatura te inflija daño psíquico, esa criatura sufrirá la misma cantidad de daño que tú recibas.",
            tipoAccion: "pasivo",
            subclase: "Patrón del Gran Primigenio"
          },
          {
            nivel: 14,
            nombre: "Crear esclavo",
            descripcion: "Cuando lances *invocar aberración*, puedes modificarlo para que no requiera concentración. Si lo haces, la duración del conjuro pasa a ser de 1 minuto para ese lanzamiento, y al ser invocada, la aberración tiene una cantidad de puntos de golpe temporales igual a tu nivel de brujo más tu modificador por Carisma.\nAdemás, la primera vez en cada turno que la aberración acierte a una criatura bajo el efecto de tu *maldición*, la aberración inflige daño psíquico adicional al objetivo igual al daño adicional de ese conjuro.",
            tipoAccion: "pasivo",
            subclase: "Patrón del Gran Primigenio"
          },
        ]
      },
    ]
  },
  {
    id: "clerigo",
    nombre: "Clérigo",
    descripcion: "Un sacerdote ordenado y campeón devoto de una deidad, bendecido con poder divino para sanar, proteger e invocar milagros.",
    dadoGolpe: "d8",
    caracteristicasPrimarias: ["sabiduria","constitucion"],
    salvacionesCompetentes: ["sabiduria","carisma"],
    competenciasArmaduras: ["Armaduras Ligeras","Armaduras Medianas","Escudos"],
    competenciasArmas: ["Armas Sencillas"],
    competenciasHerramientas: [],
    opcionesHabilidades: {"cantidad":2,"opciones":["historia","perspicacia","medicina","persuasion","religion"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Cota de malla (o Cuero), Escudo, Maza, Símbolo Sagrado, Paquete de Sacerdote y 7 PO","opcionB":"(B) 110 PO en monedas para comprar equipo"},
    configuracionMagica: {"tipoLanzador":"completo","habilidadConjuro":"sabiduria","modeloConjuros":"preparados","nivelInicio":1},
    rasgos: [
      {
        nivel: 1,
        nombre: "Lanzamiento de conjuros",
        descripcion: "Has aprendido a lanzar conjuros gracias a la oración y la meditación. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información presentada a continuación detalla cómo usar esas reglas con los conjuros de clérigo, que encontrarás más adelante en la lista de conjuros de clérigo de la descripción de la clase.\n\n***Trucos.*** Conoces tres trucos de tu elección escogidos de entre los de la lista de conjuros de clérigo. Se recomiendan *guía*, *llama sagrada* y *taumaturgia*.\nCada vez que subas un nivel de clérigo, puedes sustituir uno de tus trucos por otro truco de tu elección de la lista de conjuros de clérigo.\nCuando alcances los niveles 4 y 10 de clérigo, aprenderás otro truco de tu elección de la lista de conjuros de clérigo, como se muestra en la columna \"Trucos\" de la tabla \"Rasgos de clérigo\".\n\n***Espacios de conjuro.*** La tabla \"Rasgos de clérigo\" muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios utilizados tras finalizar un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas una serie de conjuros de nivel 1 y superiores, que son los que podrás lanzar con este rasgo. Para empezar, elige cuatro conjuros de nivel 1 de la lista de conjuros de clérigo. Se recomiendan *bendición*, *curar heridas*, *escudo de fe* y *saeta guía*.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de clérigo, como se muestra en la columna \"Conjuros preparados\" de la tabla \"Rasgos de clérigo\". Cuando ese número aumente, elige conjuros adicionales de la lista de conjuros de clérigo hasta que el número de conjuros de tu lista coincida con el número de la tabla. Estos conjuros deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un clérigo de nivel 3, podrías preparar cualquier combinación de seis conjuros de nivel 1 o 2.\nSi otro rasgo de clérigo te proporciona conjuros que siempre tienes preparados, esos conjuros no cuentan para el total que puedes preparar con este rasgo, pero sí que cuentan como conjuros de clérigo para ti.\n\n***Cambiar los conjuros preparados.*** Tras finalizar un descanso largo, puedes cambiar tu lista de conjuros preparados, sustituyendo cualquiera de los conjuros por otros conjuros de clérigo para los que tengas espacios de conjuro.\n\n***Aptitud mágica.*** La Sabiduría es tu aptitud mágica en lo que respecta a tus conjuros de clérigo.\n\n***Canalizador mágico.*** Puedes utilizar un *símbolo sagrado* como canalizador mágico para tus conjuros de clérigo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 1,
        nombre: "Orden divina",
        descripcion: "Te has consagrado a una de las siguientes funciones sacras, a tu elección.\n\n***Protector.*** Te has entrenado para el combate y ganas competencia con armas marciales y entrenamiento con armaduras pesadas.\n\n***Taumaturgo.*** Conoces un truco adicional de la lista de conjuros de clérigo. Además, tu conexión mística con lo divino te proporciona un bonificador a tus pruebas de Inteligencia (Conocimiento arcano o Religión). El bonificador es igual a tu modificador por Sabiduría (mínimo de +1).",
        tipoAccion: "pasivo"
      },
      {
        nivel: 2,
        nombre: "Canalizar divinidad",
        descripcion: "Puedes canalizar energía divina directamente de los Planos Exteriores para alimentar varios efectos mágicos. Empiezas con dos de estos efectos: Chispa divina y Expulsar muertos vivientes, que se describen a continuación. Cada vez que utilices el rasgo Canalizar divinidad de esta clase, elige qué efecto de esta clase creas. En niveles superiores de clérigo recibes opciones adicionales.\nPuedes usar el rasgo Canalizar divinidad dos veces. Recuperas uno de los usos gastados tras finalizar un descanso corto y todos tras finalizar un descanso largo. Obtienes usos adicionales cuando alcanzas ciertos niveles de clérigo, como se muestra en la columna \"Canalizar divinidad\" de la tabla \"Rasgos de clérigo\".\nSi un efecto de Canalizar divinidad requiere una tirada de salvación, la CD será igual a la CD de salvación de conjuros del rasgo Lanzamiento de conjuros de esta clase.\n\n***Chispa divina.*** Como acción de magia, diriges tu *símbolo sagrado* hacia otra criatura que puedas ver a 9 m (30 pies) o menos de ti y concentras energía divina en ella. Tira 1d8 y suma tu modificador por Sabiduría. Puedes hacer que la criatura recupere una cantidad de puntos de golpe igual al resultado u obligar a la criatura a hacer una tirada de salvación de Constitución. Si la falla, sufrirá una cantidad de daño necrótico o radiante (a tu elección) igual a ese resultado. Si la supera, sufrirá la mitad de daño (redondeando hacia abajo).\nTira 1d8 adicional cuando alcances los niveles 7 (2d8), 13 (3d8) y 18 (4d8) de clérigo.\n\n***Expulsar muertos vivientes.*** Como acción de magia, muestras tu *símbolo sagrado* y rechazas a los muertos vivientes. Cada muerto viviente de tu elección a 9 m (30 pies) o menos de ti deberá hacer una tirada de salvación de Sabiduría. Si la falla, tendrá los estados de asustado e incapacitado durante 1 minuto. Durante ese tiempo, tratará de alejarse de ti todo lo que pueda en sus turnos. Este efecto termina antes de tiempo si la criatura sufre daño, si tienes el estado de incapacitado o si mueres.",
        tipoAccion: "accion",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 18 ? 4 : niv >= 11 ? 3 : 2),
        recuperacion: "descanso_corto",
        formulaDados: "1d8"
      },
      {
        nivel: 3,
        nombre: "Subclase de clérigo",
        descripcion: "Consigues una subclase de clérigo de tu elección. Las subclases son especializaciones que te proporcionan rasgos cuando alcanzas ciertos niveles de clérigo. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de clérigo e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de clérigo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Abrasar muertos vivientes",
        descripcion: "Cuando utilices Expulsar muertos vivientes, puedes tirar una cantidad de d8 igual a tu modificador por Sabiduría (mínimo 1d8) y sumar los resultados. Todos los muertos vivientes que fallen su tirada de salvación contra ese uso de Expulsar muertos vivientes sufrirán una cantidad de daño radiante igual al resultado total de las tiradas. Este daño no pone fin al efecto de expulsión.",
        tipoAccion: "pasivo",
        formulaDados: "1d8"
      },
      {
        nivel: 6,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de clérigo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Golpes benditos",
        descripcion: "Te imbuyes de poder divino en la batalla. Obtienes una de las siguientes opciones, a tu elección (si obtienes cualquiera de ellas por una subclase de clérigo de un libro antiguo, utiliza solo la opción que escojas para este rasgo).\n\n***Golpe divino.*** Una vez en cada uno de tus turnos, cuando aciertes a una criatura con una tirada de ataque usando un arma, podrás hacer que el objetivo sufra 1d8 de daño necrótico o radiante adicional (a tu elección).\n\n***Lanzamiento potente.*** Sumas tu modificador por Sabiduría al daño que causas con cualquier truco de clérigo.",
        tipoAccion: "pasivo",
        formulaDados: "1d8"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Intercesión divina",
        descripcion: "Puedes recurrir a tu deidad o panteón para que intervenga en tu nombre. Como acción de magia, elige cualquier conjuro de clérigo de nivel 5 o inferior que no requiera una reacción para lanzarlo. Como parte de la misma acción, lanzas ese conjuro sin gastar un espacio de conjuro ni necesidad de componentes materiales. No podrás volver a utilizar este rasgo hasta que finalices un descanso largo.",
        tipoAccion: "accion",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Golpes benditos mejorados",
        descripcion: "La opción elegida para Golpes benditos se vuelve más poderosa.\n\n***Golpe divino.*** El daño adicional de tu Golpe divino aumenta a 2d8.\n\n***Lanzamiento potente.*** Cuando lances un truco de clérigo y causes daño a una criatura con él, podrás transmitir vitalidad a ti o a otra criatura que esté a 18 m (60 pies) o menos de ti; se concederá una cantidad de puntos de golpe temporales igual al doble de tu modificador por Sabiduría.",
        tipoAccion: "pasivo",
        formulaDados: "2d8"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 17,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de clérigo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don del destino.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Intercesión divina mayor",
        descripcion: "Puedes solicitar una intercesión divina todavía más poderosa. Cuando uses tu rasgo Intercesión divina, puedes elegir *deseo* al seleccionar un conjuro. Si lo haces, no podrás volver a usar Intercesión divina hasta que finalices 2d4 descansos largos.",
        tipoAccion: "pasivo",
        formulaDados: "2d4"
      },
    ],
    subclases: [
      {
        id: "dominio_de_la_vida",
        clasePadre: "clerigo",
        nombre: "Dominio de la Vida",
        descripcion: "El dominio de la vida se centra en la energía positiva que ayuda a sustentar toda vida en el multiverso. Los clérigos que recurren a este dominio son maestros de la sanación, que utilizan esa fuerza vital para curar muchas heridas.\nLa existencia misma depende de la energía positiva asociada a este dominio, por lo que un clérigo de casi cualquier tradición religiosa podría elegirlo. Este dominio está especialmente asociado a deidades agrícolas, dioses de la sanación o la resistencia, y dioses del hogar y la comunidad. Las órdenes religiosas de curanderos también buscan la magia de este dominio.",
        lema: "Alivia los pesares del mundo",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Auxilio","Bendición","Curar heridas","Restablecimiento menor"]},{"nivelClase":5,"conjuros":["Palabra de curación en masa","Revivir"]},{"nivelClase":7,"conjuros":["Aura de vida","Guarda contra la muerte"]},{"nivelClase":9,"conjuros":["Restablecimiento mayor","Curar heridas en masa"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del dominio de la vida",
            descripcion: "Tu conexión con este dominio divino garantiza que siempre tengas ciertos conjuros preparados. Cuando alcances un nivel de clérigo especificado en la tabla \"Conjuros del dominio de la vida\", a partir de entonces siempre tendrás preparados los conjuros que se indican.\n##### Conjuros del dominio de la vida\n| Nivel de clérigo | Conjuros preparados                                     |\n|:------------:|-----------------------------------------------------|\n|      3     | *auxilio*, *bendición*, *curar heridas*, *restablecimiento menor* |\n|      5     | *palabra de curación en masa*, *revivir*                     |\n|      7     | *aura de vida*, *guarda contra la muerte*                        |\n|      9     | *restablecimiento mayor*, *curar heridas en masa*           |",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Vida"
          },
          {
            nivel: 3,
            nombre: "Discípulo de la vida",
            descripcion: "Cuando uses un espacio de conjuro para lanzar un conjuro que haga recuperar puntos de golpe a una criatura, esa criatura recuperará puntos de golpe adicionales en el turno en que lances el conjuro. La cantidad de puntos de golpe adicionales es igual a 2 más el nivel del espacio de conjuro.",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Vida"
          },
          {
            nivel: 3,
            nombre: "Preservar vida",
            descripcion: "Como acción de magia, muestras tu *símbolo sagrado* y gastas un uso de Canalizar divinidad para generar una energía curativa capaz de restaurar una cantidad de puntos de golpe igual a cinco veces tu nivel de clérigo. Elige criaturas malheridas a 9 m (30 pies) o menos de ti (lo que puede incluirte a ti) y divide estos puntos de golpe entre ellas. Este rasgo no puede hacer que una criatura pase a tener más de la mitad de sus puntos de golpe máximos.",
            tipoAccion: "accion",
            subclase: "Dominio de la Vida"
          },
          {
            nivel: 6,
            nombre: "Sanador bendito",
            descripcion: "Los conjuros de curación que lances sobre otros también te sanan a ti. Inmediatamente después de usar un espacio de conjuro para lanzar un conjuro que haga recuperar puntos de golpe a una o más criaturas que no seas tú, recuperarás una cantidad de puntos de golpe igual a 2 más el nivel del espacio de conjuro.",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Vida"
          },
          {
            nivel: 17,
            nombre: "Sanación suprema",
            descripcion: "En vez de tirar uno o más dados para hacer que una criatura recupere puntos de golpe con un conjuro o con Canalizar divinidad, no tirarás estos dados para la curación, sino que utilizarás el número más alto de cada dado. Por ejemplo, en lugar de hacer que una criatura recupere 2d6 puntos de golpe con un conjuro, harás que recupere 12.",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Vida",
            formulaDados: "2d6"
          },
        ]
      },
      {
        id: "dominio_de_la_luz",
        clasePadre: "clerigo",
        nombre: "Dominio de la Luz",
        descripcion: "El dominio de la luz enfatiza el poder divino para provocar un fuego abrasador y revelador. Los clérigos que blanden este poder son almas iluminadas infundidas con resplandor y el poder de la visión perspicaz de sus deidades, encargados de ahuyentar las mentiras y quemar la oscuridad.\nEl dominio de la luz está asociado con dioses de la verdad, la vigilancia, la belleza, la perspicacia y la renovación. Algunos de estos dioses se identifican con el sol o como aurigas que guían el sol por el cielo. Otros son centinelas que atraviesan el engaño. Algunos son deidades de la belleza y el arte que enseñan que el arte es un vehículo para la mejora del alma.",
        lema: "Trae la luz para desterrar la oscuridad",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Manos ardientes","Fuego feérico","Rayo abrasador","Ver invisibilidad"]},{"nivelClase":5,"conjuros":["Luz del día","Bola de fuego"]},{"nivelClase":7,"conjuros":["Ojo arcano","Muro de fuego"]},{"nivelClase":9,"conjuros":["Columna de llamas","Escrudiñar"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del dominio de la luz",
            descripcion: "Tu conexión con este dominio divino garantiza que siempre tengas ciertos conjuros preparados. Cuando alcances un nivel de clérigo especificado en la tabla \"Conjuros del dominio de la luz\", a partir de entonces siempre tendrás preparados los conjuros que se indican.\n##### Conjuros del dominio de la luz\n| Nivel de clérigo | Conjuros preparados                                                     |\n|:------------:|---------------------------------------------------------------------|\n|      3     | *manos ardientes*, *fuego feérico*, *rayo abrasador*, *ver invisibilidad* |\n|      5     | *luz del día*, *bola de fuego*                                              |\n|      7     | *ojo arcano*, *muro de fuego*                                        |\n|      9     | *columna de llamas*, *escrudiñar*                                           |",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Luz"
          },
          {
            nivel: 3,
            nombre: "Resplandor del alba",
            descripcion: "Como acción de magia, muestras tu *símbolo sagrado* y gastas un uso de Canalizar divinidad para emitir un destello de luz en una emanación de 9 m (30 pies) originada en ti. Cualquier oscuridad mágica —como la creada por el conjuro *oscuridad*— en esa área se disipa. Además, cada criatura de tu elección en esa área debe hacer una tirada de salvación de Constitución, sufriendo una cantidad de daño radiante igual a 2d10 más tu nivel de clérigo si falla la tirada o la mitad de daño si la supera.",
            tipoAccion: "accion",
            subclase: "Dominio de la Luz",
            formulaDados: "2d10"
          },
          {
            nivel: 3,
            nombre: "Fulgor protector",
            descripcion: "Cuando una criatura que puedas ver a 9 m (30 pies) o menos de ti haga una tirada de ataque, puedes usar una reacción para imponer desventaja a la tirada de ataque, causando que una luz resplandezca antes de que acierte o falle.\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez). Recuperas todos los usos gastados tras finalizar un descanso largo.",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Luz",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 6,
            nombre: "Fulgor protector mejorado",
            descripcion: "Recuperas todos los usos gastados de tu Fulgor protector tras finalizar un descanso corto o largo.\nAdemás, siempre que utilices Fulgor protector, puedes otorgarle al objetivo del ataque desencadenante una cantidad de puntos de golpe temporales igual a 2d6 más tu modificador por Sabiduría.",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Luz",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto",
            formulaDados: "2d6"
          },
          {
            nivel: 17,
            nombre: "Corona de luz",
            descripcion: "Como acción de magia, haces que emitas un aura de luz solar que dura 1 minuto o hasta que la disipes (no requiere acción). Emites luz brillante en un radio de 18 m (60 pies) y luz tenue durante otros 9 m (30 pies). Tus enemigos en la luz brillante tienen desventaja en las tiradas de salvación contra tu Resplandor del alba y cualquier conjuro que cause daño de fuego o radiante.\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez), y recuperas todos los usos gastados tras finalizar un descanso largo.",
            tipoAccion: "accion",
            subclase: "Dominio de la Luz",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "dominio_del_engano",
        clasePadre: "clerigo",
        nombre: "Dominio del Engaño",
        descripcion: "El dominio del engaño ofrece la magia de los embustes, las ilusiones y el sigilo. Los clérigos que emplean esta magia son una fuerza que perturba el mundo pinchando a los orgullosos, mofándose de los tiranos, liberando a los cautivos y desdeñando tradiciones vacías. Prefieren el subterfugio y las bromas a la confrontación directa.\nLos dioses del engaño son seres revoltosos e instigadores que presentan un desafío constante al orden aceptado tanto por dioses como por mortales. Encarnan las fuerzas del cambio y la revuelta social, y son patrones de ladrones, canallas, apostadores, rebeldes y libertadores. Las órdenes religiosas que operan en secreto, sobre todo las que pretenden minar los gobiernos o las jerarquías de carácter opresivo, también se valen del poder del dominio del engaño.",
        lema: "Comete travesuras y desafía a las autoridades",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Hechizar persona","Disfrazarse","Invisibilidad","Pasar sin rastro"]},{"nivelClase":5,"conjuros":["Patrón hipnótico","Indetectable"]},{"nivelClase":7,"conjuros":["Confusión","Puerta dimensional"]},{"nivelClase":9,"conjuros":["Dominar persona","Alterar los recuerdos"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del dominio del engaño",
            descripcion: "Tu conexión con este dominio divino garantiza que siempre tengas ciertos conjuros preparados. Cuando alcances un nivel de clérigo especificado en la tabla \"Conjuros del dominio del engaño\", a partir de entonces siempre tendrás preparados los conjuros que se indican.\n##### Conjuros del dominio del engaño\n| Nivel de clérigo | Conjuros preparados                                                       |\n|:------------:|-----------------------------------------------------------------------|\n|      3     | *hechizar persona*, *disfrazarse*, *invisibilidad*, *pasar sin rastro* |\n|      5     | *patrón hipnótico*, *indetectable*                                    |\n|      7     | *confusión*, *puerta dimensional*                                         |\n|      9     | *dominar persona*, *alterar los recuerdos*                                    |",
            tipoAccion: "pasivo",
            subclase: "Dominio del Engaño"
          },
          {
            nivel: 3,
            nombre: "Bendición del embaucador",
            descripcion: "Como acción de magia, puedes escogerte a ti o a una criatura voluntaria a 9 m (30 pies) o menos de ti para que tenga ventaja en las pruebas de Destreza (Sigilo). Esta bendición dura hasta que finalices un descanso largo o hasta que vuelvas a usar este rasgo.",
            tipoAccion: "accion",
            subclase: "Dominio del Engaño",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 3,
            nombre: "Invocar duplicidad",
            descripcion: "Como acción adicional, puedes gastar un uso de Canalizar divinidad para crear una ilusión visual perfecta de ti mismo en un espacio sin ocupar que puedas ver a 9 m (30 pies) o menos de ti. La ilusión es intangible y no ocupa su espacio. Dura 1 minuto, pero termina antes si la disipas (no requiere acción) o si tienes el estado de incapacitado. La ilusión está animada e imita tus expresiones y gestos. Mientras persista, obtienes los siguientes beneficios.\n\n***Lanzar conjuros.*** Puedes lanzar conjuros como si estuvieras en el espacio de la ilusión, pero debes utilizar tus propios sentidos.\n\n***Distraer.*** Cuando tanto tú como tu ilusión estéis a 1,5 m (5 pies) o menos de una criatura que pueda ver la ilusión, tienes ventaja en las tiradas de ataque contra esa criatura, dada la distracción que supone la ilusión para el objetivo.\n\n***Mover.*** Como acción adicional, puedes mover la ilusión hasta 9 m (30 pies) a un espacio sin ocupar que puedas ver y que esté a 36 m (120 pies) o menos de ti.",
            tipoAccion: "accion_adicional",
            subclase: "Dominio del Engaño"
          },
          {
            nivel: 6,
            nombre: "Transposición del embaucador",
            descripcion: "Siempre que realices la acción adicional para crear o mover la ilusión de tu Invocar duplicidad, puedes teletransportarte, intercambiando posiciones con la ilusión.",
            tipoAccion: "accion_adicional",
            subclase: "Dominio del Engaño"
          },
          {
            nivel: 17,
            nombre: "Duplicidad mejorada",
            descripcion: "La ilusión de tu Invocar duplicidad se vuelve más poderosa de las siguientes maneras.\n\n***Distracción compartida.*** Cuando tú y tus aliados hagáis tiradas de ataque contra una criatura a 1,5 m (5 pies) o menos de la ilusión, las tiradas de ataque tienen ventaja.\n\n***Ilusión curativa.*** Cuando la ilusión termina, tú o una criatura de tu elección a 1,5 m (5 pies) o menos de ella recuperáis una cantidad de puntos de golpe igual a tu nivel de clérigo.",
            tipoAccion: "pasivo",
            subclase: "Dominio del Engaño"
          },
        ]
      },
      {
        id: "dominio_de_la_guerra",
        clasePadre: "clerigo",
        nombre: "Dominio de la Guerra",
        descripcion: "La guerra se manifiesta de muchas formas. Puede convertir a las personas corrientes en héroes o puede ser desesperada y terrorífica, con actos de crueldad y cobardía capaces de eclipsar los ejemplos de excelencia y coraje. Los clérigos que utilizan la magia del dominio de la guerra destacan en el combate e inspiran a los demás a pelear en buena lid o brindar actos de violencia como si fueran oraciones.\nLos dioses del dominio de la guerra observan a los combatientes y los recompensan por sus hazañas. Entre ellos se incluyen los defensores del honor y la caballerosidad, así como los dioses de la destrucción y el saqueo. Otros dioses de la guerra adoptan una postura más neutral, por lo que promueven la guerra en todas sus manifestaciones y apoyan a los combatientes en cualquier circunstancia.",
        lema: "Inspira valor y castiga a los enemigos",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Saeta guía","Arma mágica","Escudo de fe","Arma espiritual"]},{"nivelClase":5,"conjuros":["Manto del cruzado","Espíritus guardianes"]},{"nivelClase":7,"conjuros":["Escudo de fuego","Libertad de movimiento"]},{"nivelClase":9,"conjuros":["Inmovilizar monstruo","Golpe de viento acerado"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del dominio de la guerra",
            descripcion: "Tu conexión con este dominio divino garantiza que siempre tengas ciertos conjuros preparados. Cuando alcances un nivel de clérigo especificado en la tabla \"Conjuros del dominio de la guerra\", a partir de entonces siempre tendrás preparados los conjuros que se indican.\n##### Conjuros del dominio de la guerra\n| Nivel de clérigo | Conjuros preparados                                                       |\n|:------------:|-----------------------------------------------------------------------|\n|      3     | *saeta guía*, *arma mágica*, *escudo de fe*, *arma espiritual* |\n|      5     | *manto del cruzado*, *espíritus guardianes*                               |\n|      7     | *escudo de fuego*, *libertad de movimiento*                                  |\n|      9     | *inmovilizar monstruo*, *golpe de viento acerado*                                   |",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Guerra"
          },
          {
            nivel: 3,
            nombre: "Sacerdote guerrero",
            descripcion: "Como acción adicional, puedes realizar un ataque con un arma o un ataque sin armas. Puedes utilizar esta acción adicional una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez). Recuperas todos los usos tras finalizar un descanso corto o largo.",
            tipoAccion: "accion_adicional",
            subclase: "Dominio de la Guerra",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 3,
            nombre: "Golpe guiado",
            descripcion: "Cuando tú o una criatura a 9 m (30 pies) o menos de ti falléis una tirada de ataque, podrás gastar un uso de Canalizar divinidad y conceder un bonificador de +10 a la tirada, lo que podría hacer que acierte. Cuando utilices este rasgo para mejorar la tirada de ataque de otra criatura, deberás llevar a cabo una reacción para ello.",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Guerra"
          },
          {
            nivel: 6,
            nombre: "Bendición del dios de la guerra",
            descripcion: "Puedes gastar un uso de Canalizar divinidad para lanzar *escudo de fe* o *arma espiritual* en lugar de gastar un espacio de conjuro. Cuando lances cualquiera de estos conjuros de esta forma, el conjuro no requiere concentración. En su lugar, el conjuro dura 1 minuto, pero termina antes si vuelves a lanzar ese conjuro, tienes el estado de incapacitado o mueres.",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Guerra"
          },
          {
            nivel: 17,
            nombre: "Avatar de batalla",
            descripcion: "Obtienes resistencia al daño contundente, perforante y cortante.",
            tipoAccion: "pasivo",
            subclase: "Dominio de la Guerra"
          },
        ]
      },
    ]
  },
  {
    id: "druida",
    nombre: "Druida",
    descripcion: "Un guardián primigenio de la naturaleza, capaz de adoptar la forma de bestias salvajes y manipular las fuerzas elementales del cosmos.",
    dadoGolpe: "d8",
    caracteristicasPrimarias: ["sabiduria","constitucion"],
    salvacionesCompetentes: ["inteligencia","sabiduria"],
    competenciasArmaduras: ["Armaduras Ligeras","Armaduras Medianas","Escudos"],
    competenciasArmas: ["Armas Sencillas"],
    competenciasHerramientas: ["Kit de herboristería"],
    opcionesHabilidades: {"cantidad":2,"opciones":["arcanos","manejoAnimales","perspicacia","medicina","naturaleza","percepcion","religion","supervivencia"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Armadura de cuero, Escudo de madera, Hoz, Enfoque Druídico, Paquete de Explorador y 9 PO","opcionB":"(B) 50 PO en monedas para comprar equipo"},
    configuracionMagica: {"tipoLanzador":"completo","habilidadConjuro":"sabiduria","modeloConjuros":"preparados","nivelInicio":1},
    rasgos: [
      {
        nivel: 1,
        nombre: "Druídico",
        descripcion: "Conoces el druídico, el idioma secreto de los druidas. Al aprender esta antigua lengua, también desbloqueaste la magia de comunicarte con los animales; siempre tienes el conjuro *hablar con los animales* preparado.\nPuedes usar el druídico para dejar mensajes ocultos. Tú y otros que conozcan el druídico detectáis automáticamente la presencia de este tipo de mensajes. Otras personas detectan la presencia del mensaje si superan una prueba de Inteligencia (Investigación) CD 15, pero no pueden descifrarlo sin magia.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 1,
        nombre: "Orden primigenio",
        descripcion: "Te has dedicado a una de las siguientes funciones sagradas, a tu elección.\n\n***Mago.*** Conoces un truco adicional de la lista de conjuros de druida. Además, tu conexión mística con la naturaleza te proporciona un bonificador a tus pruebas de Inteligencia (Conocimiento arcano o Naturaleza). El bonificador es igual a tu modificador por Sabiduría (bonificador mínimo de +1).\n\n***Guardián.*** Entrenado para la batalla, ganas competencia con armas marciales y entrenamiento con armaduras medias.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 1,
        nombre: "Lanzamiento de conjuros",
        descripcion: "Has aprendido a lanzar conjuros estudiando las fuerzas místicas de la naturaleza. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información presentada a continuación detalla cómo usar esas reglas con los conjuros de druida, que encontrarás más adelante en la lista de conjuros de druida de la descripción de la clase.\n\n***Trucos.*** Conoces dos trucos de tu elección escogidos de entre los de la lista de conjuros de druida. Se recomiendan *saber druídico* y *crear llama*.\nCada vez que subas un nivel de druida, puedes sustituir uno de tus trucos por otro truco de tu elección de la lista de conjuros de druida.\nCuando alcances los niveles 4 y 10 de druida, aprenderás otro truco de tu elección de la lista de conjuros de druida, como se muestra en la columna \"Trucos\" de la tabla \"Rasgos de druida\".\n\n***Espacios de conjuro.*** La tabla \"Rasgos de druida\" muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios utilizados tras finalizar un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas una serie de conjuros de nivel 1 y superiores, que son los que podrás lanzar con este rasgo. Para empezar, elige cuatro conjuros de nivel 1 de la lista de conjuros de druida. Se recomiendan *encantar animal*, *curar heridas*, *fuego feérico* y *ola atronadora*.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de druida, como se muestra en la columna \"Conjuros preparados\" de la tabla \"Rasgos de druida\". Cuando ese número aumente, elige conjuros adicionales de la lista de conjuros de druida hasta que el número de conjuros de tu lista coincida con el número de la tabla. Estos conjuros deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un druida de nivel 3, podrías preparar cualquier combinación de seis conjuros de nivel 1 o 2.\nSi otro rasgo de druida te proporciona conjuros que siempre tienes preparados, esos conjuros no cuentan para el total que puedes preparar con este rasgo, pero sí que cuentan como conjuros de druida para ti.\n\n***Cambiar los conjuros preparados.*** Tras finalizar un descanso largo, puedes cambiar tu lista de conjuros preparados, sustituyendo cualquiera de los conjuros por otros conjuros de druida para los que tengas espacios de conjuro.\n\n***Aptitud mágica.*** La Sabiduría es tu aptitud mágica en lo que respecta a tus conjuros de druida.\n\n***Canalizador mágico.*** Puedes utilizar un *canalizador druídico* como canalizador mágico para tus conjuros de druida.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Compañero salvaje",
        descripcion: "Puedes invocar un espíritu de la naturaleza que asume una forma animal para ayudarte. Como acción de magia, puedes gastar un espacio de conjuro o un uso de Forma salvaje para lanzar el conjuro *encontrar familiar* sin necesidad de componentes materiales.\nCuando lanzas el conjuro de esta manera, el familiar es de tipo feérico y desaparece cuando finalizas un descanso largo.",
        tipoAccion: "accion",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Forma salvaje",
        descripcion: "El poder de la naturaleza te permite adoptar la forma de un animal. Como acción adicional, cambias de forma a una Forma de bestia que hayas aprendido para este rasgo (consulta \"Formas conocidas\" a continuación). Mantienes esa forma durante una cantidad de horas igual a la mitad de tu nivel de druida o hasta que vuelvas a usar Forma salvaje, tengas el estado de incapacitado o mueras. También puedes abandonar la forma antes de tiempo como acción adicional.\n\n***Número de usos.*** Puedes usar Forma salvaje dos veces. Recuperas un uso gastado cuando finalizas un descanso corto y recuperas todos los usos gastados cuando finalizas un descanso largo.\nObtienes usos adicionales cuando alcanzas ciertos niveles de druida, como se muestra en la columna \"Forma salvaje\" de la tabla \"Rasgos de druida\".\n\n***Formas conocidas.*** Conoces cuatro formas de bestia para este rasgo, escogidas de entre los perfiles de criaturas de tipo \"bestia\" que tengan un valor de desafío máximo de 1/4 y que no tengan una velocidad volando (consulta las opciones de perfiles en el apéndice B). Se recomiendan la **araña**, el **caballo de monta**, el **lobo** y la **rata**. Tras finalizar un descanso largo, podrás reemplazar una de tus formas conocidas por otra forma elegible.\nCuando alcanzas ciertos niveles de druida, la cantidad de formas conocidas y el valor de desafío máximo de estas formas aumentan, como se muestra en la tabla \"Formas de bestia\". Además, a partir del nivel 8 podrás adoptar una forma que tenga una velocidad volando.\nAl escoger las formas conocidas, puedes consultar el *Manual de monstruos* u otros libros para buscar más bestias si tu Dungeon Master te lo permite.\n##### Formas de bestia\n| Nivel de druida | Formas conocidas | VD máx. | Velocidad volando |\n|:-----------:|:-----------:|:------:|-----------|\n|      2      |      4      |   1/4  | No        |\n|      4      |      6      |   1/2  | No        |\n|      8      |      8      |    1   | Sí        |\n\n***Reglas con forma de bestia.*** Mientras tengas una forma, conservas tu personalidad, recuerdos y capacidad de hablar, y se aplican las siguientes normas:\n- **Puntos de golpe temporales.** Cuando te transformas usando Forma salvaje, obtienes una cantidad de puntos de golpe temporales igual a tu nivel de druida.\n- **Perfil.** Tu perfil se sustituye por el perfil de la bestia, pero conservas tu tipo de criatura, puntos de golpe, dados de puntos de golpe, puntuaciones de Inteligencia, Sabiduría y Carisma, rasgos de clase, idiomas y dotes. También conservas tus competencias en habilidades y tiradas de salvación y utilizas tu bonificador por competencia con ellas, además de obtener las competencias de la criatura. Si el modificador de una habilidad o tirada de salvación del perfil de la bestia es superior al tuyo, usa el de la bestia.\n- **Sin lanzamiento de conjuros.** No puedes lanzar conjuros, pero cambiar de forma no te hace perder la concentración ni interfiere de ningún otro modo con un conjuro que ya hayas lanzado.\n- **Objetos.** Tu capacidad de manejar objetos depende de las extremidades de la forma en lugar de las tuyas. Además, eliges si tu equipo cae en tu espacio, se funde con la nueva forma o lo sigues llevando puesto. El equipo que llevas puesto funcionará con normalidad, pero tu DM determinará si es factible que la nueva forma pueda llevar un objeto de equipo concreto, en función del tamaño y la forma de la criatura. Tu equipo no cambia de forma o tamaño para adaptarse a la nueva forma y cualquier objeto que la nueva forma no pueda llevar puesto deberá caer al suelo o fundirse con la forma. El equipo que se funde con la forma no tendrá efecto mientras conserves esa forma.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 17 ? 4 : niv >= 6 ? 3 : 2),
        recuperacion: "descanso_corto"
      },
      {
        nivel: 3,
        nombre: "Subclase de druida",
        descripcion: "Consigues una subclase de druida de tu elección. Las subclases son especializaciones que te proporcionan rasgos cuando alcanzas ciertos niveles de druida. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de druida e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de druida.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Resurgimiento salvaje",
        descripcion: "Una vez en cada uno de tus turnos, si no te quedan usos de Forma salvaje, puedes obtener un uso gastando un espacio de conjuro (no requiere acción).\nAdemás, puedes gastar un uso de tu Forma salvaje (no requiere acción) para obtener un espacio de conjuro de nivel 1, pero no podrás volver a hacerlo hasta que finalices un descanso largo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 6,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de druida.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Furia elemental",
        descripcion: "El poder de los elementos fluye por ti. Obtienes una de las siguientes opciones, a tu elección.\n\n***Lanzamiento potente.*** Sumas tu modificador por Sabiduría al daño que causas con cualquier truco de druida.\n\n***Golpe primordial.*** Una vez en cada uno de tus turnos, cuando aciertes a una criatura con una tirada de ataque usando un arma o un ataque de una forma de bestia en Forma salvaje, podrás hacer que el objetivo sufra 1d8 de daño de frío, fuego, relámpago o trueno adicional (elígelo cuando aciertes).",
        tipoAccion: "pasivo",
        formulaDados: "1d8"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de druida.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de druida.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 15,
        nombre: "Furia elemental mejorada",
        descripcion: "La opción elegida para Furia elemental se vuelve más poderosa, como se detalla a continuación.\n\n***Lanzamiento potente.*** Cuando lances un truco de druida con un alcance de 3 m (10 pies) o más, el alcance del conjuro aumentará en 90 m (300 pies).\n\n***Golpe primordial.*** El daño adicional de tu Golpe primordial aumenta a 2d8.",
        tipoAccion: "pasivo",
        formulaDados: "2d8"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 18,
        nombre: "Conjurar como bestia",
        descripcion: "Mientras usas Forma salvaje, podrás lanzar conjuros en forma de bestia, salvo cualquier conjuro que tenga un componente material con un coste especificado o que consuma su componente material.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don del viaje dimensional.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Archidruida",
        descripcion: "La vitalidad de la naturaleza florece constantemente en tu interior, otorgándote los siguientes beneficios.\n\n***Forma salvaje perenne.*** Cada vez que tires iniciativa y no te queden usos de Forma salvaje, recuperas un uso gastado de este rasgo.\n\n***Mago de la naturaleza.*** Puedes convertir usos de Forma salvaje en un espacio de conjuro (no requiere acción). Elige una cantidad de tus usos no gastados de Forma salvaje y conviértelos en un solo espacio de conjuro, contribuyendo cada uso con 2 niveles de conjuro. Por ejemplo, si conviertes dos usos de Forma salvaje, produces un espacio de conjuro de nivel 4. Una vez que uses este beneficio, no podrás volver a hacerlo hasta que finalices un descanso largo.\n\n***Longevidad.*** La magia primordial que manejas hace que envejezcas más lentamente. Por cada diez años que pasan, tu cuerpo envejece solo un año.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
    ],
    subclases: [
      {
        id: "circulo_de_la_tierra",
        clasePadre: "druida",
        nombre: "Círculo de la Tierra",
        descripcion: "El Círculo de la Tierra está compuesto por místicos y sabios que salvaguardan conocimientos y ritos antiguos. Estos druidas se reúnen en círculos sagrados de árboles o piedras erguidas para susurrar secretos primordiales en druídico. Los miembros más sabios del círculo presiden como los sumos sacerdotes de sus comunidades.",
        lema: "Celebra la conexión con el mundo natural",
        nivelDesbloqueo: 3,
        variantesConjuros: {"árida":[{"nivelClase":3,"conjuros":["Crear o destruir agua","Rayo abrasador"],"trucos":["Saeta de fuego"]},{"nivelClase":5,"conjuros":["Bola de fuego","Luz del día","Rayo de relámpago"]},{"nivelClase":7,"conjuros":["Marchitar","Muro de fuego"]},{"nivelClase":9,"conjuros":["Plaga de insectos","Muro de piedra"]}],"polar":[{"nivelClase":3,"conjuros":["Armadura de Agathys","Sujetar persona"],"trucos":["Rayo de escarcha"]},{"nivelClase":5,"conjuros":["Tormenta de aguanieve","Caminar sobre el agua"]},{"nivelClase":7,"conjuros":["Tormenta de nieve","Libertad de movimiento"]},{"nivelClase":9,"conjuros":["Cono de frío","Muro de hielo"]}],"templada":[{"nivelClase":3,"conjuros":["Niebla oscurecedora","Paso brumoso"],"trucos":["Salpicadura ácida"]},{"nivelClase":5,"conjuros":["Ráfaga de viento","Crecimiento vegetal"]},{"nivelClase":7,"conjuros":["Confusión","Ojo arcano"]},{"nivelClase":9,"conjuros":["Paso arbóreo","Comunión con la naturaleza"]}],"tropical":[{"nivelClase":3,"conjuros":["Ácido de Melf","Piel de roble"],"trucos":["Picadura venenosa"]},{"nivelClase":5,"conjuros":["Apestar","Crecimiento vegetal"]},{"nivelClase":7,"conjuros":["Piel pétrea","Marchitar"]},{"nivelClase":9,"conjuros":["Plaga de insectos","Muro de espinas"]}]},
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del Círculo de la Tierra",
            descripcion: "Cada vez que finalices un descanso largo, elige un tipo de tierra: árida, polar, templada o tropical. Consulta la tabla a continuación que corresponda al tipo elegido; tienes preparados los conjuros indicados para tu nivel de druida e inferiores.\n##### Tierra árida\n| Nivel de druida | Conjuros de círculo                        |\n|:-----------:|--------------------------------------|\n|     3     | *contorno borroso*, *manos ardientes*, *saeta de fuego* |\n|     5     | *bola de fuego*                           |\n|     7     | *marchitar*                             |\n|     9     | *muro de piedra*                      |\n##### Tierra polar\n| Nivel de druida | Conjuros de círculo                              |\n|:-----------:|--------------------------------------------|\n|     3     | *nube de oscurecimiento*, *inmovilizar persona*, *rayo de escarcha* |\n|     5     | *tormenta de aguanieve*                              |\n|     7     | *tormenta de hielo*                                |\n|     9     | *cono de frío*                             |\n##### Tierra templada\n| Nivel de druida | Conjuros de círculo                           |\n|:-----------:|-----------------------------------------|\n|     3     | *paso brumoso*, *agarre electrizante*, *dormir* |\n|     5     | *relámpago*                        |\n|     7     | *libertad de movimiento*                   |\n|     9     | *zancada arbórea*                           |\n##### Tierra tropical\n| Nivel de druida | Conjuros de círculo                           |\n|:-----------:|-----------------------------------------|\n|     3     | *salpicadura ácida*, *rayo de enfermedad*, *telaraña* |\n|     5     | *nube apestosa*                        |\n|     7     | *polimorfar*                             |\n|     9     | *plaga de insectos*                         |",
            tipoAccion: "pasivo",
            subclase: "Círculo de la Tierra",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 3,
            nombre: "Auxilio de la tierra",
            descripcion: "Como acción de magia, puedes gastar un uso de tu Forma salvaje y elegir un punto a 18 m (60 pies) o menos de ti. Flores que dan vitalidad y espinas que drenan vida aparecen por un momento en una esfera de 3 m (10 pies) de radio centrada en ese punto. Cada criatura de tu elección en la esfera debe hacer una tirada de salvación de Constitución contra tu CD de salvación de conjuros, sufriendo 2d6 de daño necrótico si falla la tirada o la mitad de daño si la supera. Una criatura de tu elección en esa área recupera 2d6 puntos de golpe.\nEl daño y la curación aumentan en 1d6 cuando alcanzas los niveles 10 (3d6) y 14 (4d6) de druida.",
            tipoAccion: "accion",
            subclase: "Círculo de la Tierra",
            formulaDados: "2d6"
          },
          {
            nivel: 6,
            nombre: "Recuperación natural",
            descripcion: "Puedes lanzar uno de los conjuros de nivel 1 o superior que tengas preparados de tu rasgo Conjuros de círculo sin gastar un espacio de conjuro, y debes finalizar un descanso largo antes de poder volver a hacerlo.\nAdemás, cuando finalizas un descanso corto, puedes elegir espacios de conjuro gastados para recuperarlos. Los espacios de conjuro pueden tener un nivel combinado que sea igual o inferior a la mitad de tu nivel de druida (redondeando hacia arriba), y ninguno de ellos puede ser de nivel 6 o superior. Por ejemplo, si eres un druida de nivel 6, puedes recuperar hasta tres niveles de espacios de conjuro. Puedes recuperar un espacio de conjuro de nivel 3, un espacio de nivel 2 y otro de nivel 1, o tres espacios de nivel 1. Una vez que recuperes espacios de conjuro con este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
            tipoAccion: "pasivo",
            subclase: "Círculo de la Tierra",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 10,
            nombre: "Custodia de la naturaleza",
            descripcion: "Tienes inmunidad al estado de envenenado, y tienes resistencia a un tipo de daño asociado a tu elección de tierra actual en el rasgo Conjuros de círculo, como se muestra en la tabla Custodia de la naturaleza.\n##### Custodia de la naturaleza\n| Tipo de tierra | Resistencia |\n|-----------|------------|\n| Árida      | Fuego       |\n| Polar     | Frío       |\n| Templada | Relámpago  |\n| Tropical  | Veneno     |",
            tipoAccion: "pasivo",
            subclase: "Círculo de la Tierra"
          },
          {
            nivel: 14,
            nombre: "Santuario de la naturaleza",
            descripcion: "Como acción de magia, puedes gastar un uso de tu Forma salvaje y hacer que árboles y enredaderas espectrales aparezcan en un cubo de 4,5 m (15 pies) sobre el suelo a 36 m (120 pies) o menos de ti. Duran allí 1 minuto o hasta que tengas el estado de incapacitado o mueras. Tú y tus aliados tenéis cobertura media mientras estéis en esa área, y tus aliados obtienen la resistencia actual de tu Custodia de la naturaleza mientras estén allí.\nComo acción adicional, puedes mover el cubo hasta 18 m (60 pies) por el suelo a 36 m (120 pies) o menos de ti.",
            tipoAccion: "accion_adicional",
            subclase: "Círculo de la Tierra"
          },
        ]
      },
      {
        id: "circulo_de_la_luna",
        clasePadre: "druida",
        nombre: "Círculo de la Luna",
        descripcion: "Los druidas del Círculo de la Luna recurren a la magia lunar para transformarse. Su orden se reúne bajo la luna para compartir noticias y realizar rituales.\nCambiante como la luna, un druida de este círculo podría merodear como un gran felino una noche, surcar las copas de los árboles como un águila al día siguiente, y luego abrirse paso entre la maleza como un oso para ahuyentar a un monstruo invasor. Las tierras salvajes corren por la sangre del druida.",
        lema: "Adopta formas animales para proteger las tierras salvajes",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Rayo lunar","Curar heridas"]},{"nivelClase":5,"conjuros":["Conjurar animales"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del Círculo de la Luna",
            descripcion: "Cuando alcances un nivel de druida especificado en la tabla Conjuros del Círculo de la Luna, a partir de entonces siempre tendrás preparados los conjuros indicados.\nAdemás, puedes lanzar los conjuros de este rasgo mientras estás en una Forma salvaje.\n##### Conjuros del Círculo de la Luna\n| Nivel de druida | Conjuros preparados                          |\n|:-----------:|------------------------------------------|\n|      3      | *curar heridas*, *rayo lunar*, *voluta estelar* |\n|      5      | *conjurar animales*                        |\n|      7      | *fuente de luz lunar*                     |\n|      9      | *curar heridas en masa*                       |",
            tipoAccion: "pasivo",
            subclase: "Círculo de la Luna"
          },
          {
            nivel: 3,
            nombre: "Formas de círculo",
            descripcion: "Puedes canalizar magia lunar cuando asumes una Forma salvaje, otorgándote los siguientes beneficios.\n\n***Valor de desafío.*** El valor de desafío máximo para la forma es igual a tu nivel de druida dividido entre 3 (redondeando hacia abajo).\n\n***Clase de Armadura.*** Hasta que abandones la forma, tu CA es igual a 13 más tu modificador por Sabiduría si ese total es mayor que la CA de la bestia.\n\n***Puntos de golpe temporales.*** Obtienes una cantidad de puntos de golpe temporales igual al triple de tu nivel de druida.",
            tipoAccion: "pasivo",
            subclase: "Círculo de la Luna"
          },
          {
            nivel: 6,
            nombre: "Formas de círculo mejoradas",
            descripcion: "Mientras estés en una Forma salvaje, obtienes los siguientes beneficios.\n\n***Resplandor lunar.*** Cada uno de tus ataques en una Forma salvaje puede causar su tipo de daño normal o daño radiante. Realizas esta elección cada vez que aciertas con esos ataques.\n\n***Dureza aumentada.*** Puedes sumar tu modificador por Sabiduría a tus tiradas de salvación de Constitución.",
            tipoAccion: "pasivo",
            subclase: "Círculo de la Luna"
          },
          {
            nivel: 10,
            nombre: "Paso a la luz de la luna",
            descripcion: "Te transportas mágicamente, reapareciendo en un estallido de luz de la luna. Como acción adicional, te teletransportas hasta 9 m (30 pies) a un espacio sin ocupar que puedas ver, y tienes ventaja en la próxima tirada de ataque que hagas antes del final de este turno.\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez), y recuperas todos los usos gastados cuando finalizas un descanso largo. También puedes recuperar usos gastando un espacio de conjuro de nivel 2 o superior por cada uso que quieras restaurar (no requiere acción).",
            tipoAccion: "accion_adicional",
            subclase: "Círculo de la Luna",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 14,
            nombre: "Forma lunar",
            descripcion: "El poder de la luna te inunda, otorgándote los siguientes beneficios.\n\n***Resplandor lunar mejorado.*** Una vez por turno, puedes infligir 2d10 de daño radiante adicional a un objetivo que aciertes con el ataque de una Forma salvaje.\n\n***Luz de luna compartida.*** Cada vez que uses Paso a la luz de la luna, también puedes teletransportar a una criatura voluntaria. Esa criatura debe estar a 3 m (10 pies) o menos de ti, y la teletransportas a un espacio sin ocupar que puedas ver a 3 m (10 pies) o menos de tu espacio de destino.",
            tipoAccion: "pasivo",
            subclase: "Círculo de la Luna",
            formulaDados: "2d10"
          },
        ]
      },
      {
        id: "circulo_del_mar",
        clasePadre: "druida",
        nombre: "Círculo del Mar",
        descripcion: "Los druidas del Círculo del Mar recurren a las fuerzas tempestuosas de los océanos y las tormentas. Algunos se ven a sí mismos como la encarnación de la ira de la naturaleza, buscando venganza contra quienes la despojan. Otros buscan una unidad mística con la naturaleza sintonizándose con el flujo y reflujo de las mareas, siguiendo la corriente y las olas, y escuchando los inescrutables susurros y rugidos de los vientos.",
        lema: "Conviértete en uno con las mareas y las tormentas",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Ráfaga de viento","Niebla oscurecedora","Ola atronadora"]},{"nivelClase":5,"conjuros":["Muro de agua","Rayo de relámpago"]},{"nivelClase":7,"conjuros":["Tormenta de nieve","Controlar agua"]},{"nivelClase":9,"conjuros":["Muro de hielo","Invocación elemental"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del Círculo del Mar",
            descripcion: "Cuando alcances un nivel de druida especificado en la tabla Conjuros del Círculo del Mar, a partir de entonces siempre tendrás preparados los conjuros indicados.\n##### Conjuros del Círculo del Mar\n| Nivel de druida | Conjuros preparados                                                       |\n|:-----------:|-----------------------------------------------------------------------|\n|     3     | *nube de oscurecimiento*, *ráfaga de viento*, *rayo de escarcha*, *hacer añicos*, *ola atronadora* |\n|     5     | *relámpago*, *respirar bajo el agua*                                   |\n|     7     | *controlar agua*, *tormenta de hielo*                                          |\n|     9     | *conjurar elemental*, *inmovilizar monstruo*                                   |",
            tipoAccion: "pasivo",
            subclase: "Círculo del Mar"
          },
          {
            nivel: 3,
            nombre: "Ira del mar",
            descripcion: "Como acción adicional, puedes gastar un uso de tu Forma salvaje para manifestar una emanación de 1,5 m (5 pies) que adopta la forma del rocío del océano que te rodea durante 10 minutos. Termina antes de tiempo si la disipas (no requiere acción), la manifiestas de nuevo, o tienes el estado de incapacitado.\nCuando manifiestas la emanación y como acción adicional en tus turnos posteriores, puedes elegir a otra criatura que puedas ver en la emanación. El objetivo debe tener éxito en una tirada de salvación de Constitución contra tu CD de salvación de conjuros o sufrir daño de frío y, si la criatura es Grande o más pequeña, ser empujada hasta 4,5 m (15 pies) lejos de ti. Para determinar este daño, tira una cantidad de d6 igual a tu modificador por Sabiduría (mínimo de un dado).",
            tipoAccion: "accion_adicional",
            subclase: "Círculo del Mar"
          },
          {
            nivel: 6,
            nombre: "Afinidad acuática",
            descripcion: "El tamaño de la emanación creada por tu Ira del mar aumenta a 3 m (10 pies).\nAdemás, obtienes una velocidad nadando igual a tu velocidad.",
            tipoAccion: "pasivo",
            subclase: "Círculo del Mar"
          },
          {
            nivel: 10,
            nombre: "Nacido de la tormenta",
            descripcion: "Tu Ira del mar confiere dos beneficios más mientras está activa, como se detalla a continuación.\n\n***Vuelo.*** Obtienes una velocidad volando igual a tu velocidad.\n\n***Resistencia.*** Tienes resistencia al daño de frío, relámpago y trueno.",
            tipoAccion: "pasivo",
            subclase: "Círculo del Mar"
          },
          {
            nivel: 14,
            nombre: "Don oceánico",
            descripcion: "En lugar de manifestar la emanación de Ira del mar a tu alrededor, puedes manifestarla alrededor de una criatura voluntaria a 18 m (60 pies) o menos de ti. Esa criatura obtiene todos los beneficios de la emanación y usa tu CD de salvación de conjuros y tu modificador por Sabiduría para ella.\nAdemás, puedes manifestar la emanación tanto alrededor de la otra criatura como a tu alrededor si gastas dos usos de tu Forma salvaje en lugar de uno al manifestarla.",
            tipoAccion: "pasivo",
            subclase: "Círculo del Mar"
          },
        ]
      },
      {
        id: "circulo_de_las_estrellas",
        clasePadre: "druida",
        nombre: "Círculo de las Estrellas",
        descripcion: "El Círculo de las Estrellas ha rastreado patrones celestiales desde tiempos inmemoriales, descubriendo secretos ocultos en medio de las constelaciones. Al comprender estos secretos, los druidas de este círculo buscan aprovechar los poderes del cosmos.",
        lema: "Aprovecha los secretos ocultos en las constelaciones",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Saeta guía"],"trucos":["Guía"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Mapa estelar",
            descripcion: "Has creado un mapa estelar como parte de tus estudios celestiales. Es un objeto diminuto, y puedes usarlo como canalizador mágico para tus conjuros de druida. Determinas su forma tirando en la tabla Mapa estelar o eligiendo una.\nMientras sostienes el mapa, tienes los conjuros *guía* y *saeta guía* preparados, y puedes lanzar *saeta guía* sin gastar un espacio de conjuro. Puedes lanzarlo de esa manera una cantidad de veces igual a tu modificador por Sabiduría (mínimo de una vez), y recuperas todos los usos gastados cuando finalizas un descanso largo.\nSi pierdes el mapa, puedes realizar una ceremonia de 1 hora para crear mágicamente un reemplazo. Esta ceremonia se puede realizar durante un descanso corto o largo, y destruye el mapa anterior.\n##### Mapa estelar\n| 1d6 | Forma del mapa                                          |\n|:---:|---------------------------------------------------|\n|  1  | Un pergamino que contiene representaciones de constelaciones     |\n|  2  | Una tablilla de piedra con finos agujeros perforados a través de ella |\n|  3  | Una piel de oso lechuza grabada con símbolos estelares       |\n|  4  | Una colección de mapas encuadernados en una cubierta de ébano      |\n|  5  | Un cristal grabado con patrones estrellados           |\n|  6  | Un disco de vidrio grabado con constelaciones           |",
            tipoAccion: "pasivo",
            subclase: "Círculo de las Estrellas",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto",
            formulaDados: "1d6"
          },
          {
            nivel: 3,
            nombre: "Forma estelar",
            descripcion: "Como acción adicional, puedes gastar un uso de tu rasgo Forma salvaje para adoptar una forma estelar en lugar de cambiar de forma.\nMientras estás en tu forma estelar, conservas tu perfil, pero tu cuerpo se vuelve luminoso, tus articulaciones brillan como estrellas, y líneas brillantes las conectan como en un mapa estelar. Esta forma emite luz brillante en un radio de 3 m (10 pies) y luz tenue por otros 3 m (10 pies) adicionales. La forma dura 10 minutos. Termina antes de tiempo si la disipas (no requiere acción), tienes el estado de incapacitado, o usas este rasgo de nuevo.\nCada vez que asumas tu forma estelar, elige cuál de las siguientes constelaciones brilla en tu cuerpo; tu elección te otorga ciertos beneficios mientras estás en la forma.\n\n***Arquero.*** Una constelación de un arquero aparece en ti. Cuando activas esta forma y como acción adicional en tus turnos posteriores mientras dure, puedes realizar un ataque de conjuro a distancia, lanzando una flecha luminosa que tiene como objetivo a una criatura a 18 m (60 pies) o menos de ti. Si aciertas, el ataque inflige daño radiante igual a 1d8 más tu modificador por Sabiduría.\n\n***Cáliz.*** Una constelación de un cáliz dador de vida aparece en ti. Cada vez que lanzas un conjuro usando un espacio de conjuro que restaura puntos de golpe a una criatura, tú u otra criatura a 9 m (30 pies) o menos de ti puede recuperar puntos de golpe iguales a 1d8 más tu modificador por Sabiduría.\n\n***Dragón.*** Una constelación de un dragón sabio aparece en ti. Cuando haces una prueba de Inteligencia o de Sabiduría o una tirada de salvación de Constitución para mantener la concentración, puedes tratar una tirada de 9 o inferior en el d20 como un 10.",
            tipoAccion: "accion_adicional",
            subclase: "Círculo de las Estrellas",
            formulaDados: "1d8"
          },
          {
            nivel: 6,
            nombre: "Presagio cósmico",
            descripcion: "Cada vez que finalices un descanso largo, puedes consultar tu Mapa estelar en busca de presagios y tirar un dado. Hasta que finalices tu próximo descanso largo, obtienes acceso a una reacción especial dependiendo de si sacaste un número par o impar en el dado:\n- **Ventura (par).** Cada vez que una criatura que puedas ver a 9 m (30 pies) o menos de ti esté a punto de hacer una prueba de d20, puedes llevar a cabo una reacción para tirar 1d6 y sumar el número sacado al total.\n- **Desventura (impar).** Cada vez que una criatura que puedas ver a 9 m (30 pies) o menos de ti esté a punto de hacer una prueba de d20, puedes llevar a cabo una reacción para tirar 1d6 y restar el número sacado al total.\nPuedes usar esta reacción una cantidad de veces igual a tu modificador por Sabiduría (mínimo de una vez), y recuperas todos los usos gastados cuando finalizas un descanso largo.",
            tipoAccion: "pasivo",
            subclase: "Círculo de las Estrellas",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "1d6"
          },
          {
            nivel: 10,
            nombre: "Constelaciones titilantes",
            descripcion: "Las constelaciones de tu Forma estelar mejoran. El 1d8 del Arquero y el Cáliz se convierte en 2d8, y mientras el Dragón está activo, tienes una velocidad volando de 6 m (20 pies) y puedes flotar.\nAdemás, al comienzo de cada uno de tus turnos mientras estás en tu Forma estelar, puedes cambiar qué constelación brilla en tu cuerpo.",
            tipoAccion: "pasivo",
            subclase: "Círculo de las Estrellas",
            formulaDados: "1d8"
          },
          {
            nivel: 14,
            nombre: "Lleno de estrellas",
            descripcion: "Mientras estás en tu Forma estelar, te vuelves parcialmente incorpóreo, dándote resistencia al daño contundente, perforante y cortante.",
            tipoAccion: "pasivo",
            subclase: "Círculo de las Estrellas"
          },
        ]
      },
    ]
  },
  {
    id: "explorador",
    nombre: "Explorador",
    descripcion: "Un maestro del rastreo y la supervivencia en los confines del mundo, combinando destreza marcial letal con magia de la naturaleza.",
    dadoGolpe: "d10",
    caracteristicasPrimarias: ["destreza","sabiduria"],
    salvacionesCompetentes: ["fuerza","destreza"],
    competenciasArmaduras: ["Armaduras Ligeras","Armaduras Medianas","Escudos"],
    competenciasArmas: ["Armas Sencillas","Armas Marciales"],
    competenciasHerramientas: [],
    opcionesHabilidades: {"cantidad":3,"opciones":["manejoAnimales","atletismo","perspicacia","investigacion","naturaleza","percepcion","sigilo","supervivencia"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Cuero tachonado, 2 Espadas cortas, Arco largo con 20 flechas, Paquete de Explorador y 7 PO","opcionB":"(B) 150 PO en monedas para comprar equipo"},
    configuracionMagica: {"tipoLanzador":"medio","habilidadConjuro":"sabiduria","modeloConjuros":"preparados","nivelInicio":1},
    rasgos: [
      {
        nivel: 1,
        nombre: "Lanzamiento de conjuros",
        descripcion: "Has aprendido a canalizar la esencia mágica de la naturaleza para lanzar conjuros. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información presentada a continuación detalla cómo usas esas reglas con los conjuros de explorador, que aparecen en la lista de conjuros de explorador más adelante en la descripción de la clase.\n\n***Espacios de conjuro.*** La tabla \"Rasgos de explorador\" muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios utilizados tras finalizar un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas la lista de conjuros de nivel 1 y superiores que están disponibles para que los lances con este rasgo. Para empezar, elige dos conjuros de explorador de nivel 1. Se recomiendan *curar heridas* y *golpe apresador*.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de explorador, como se muestra en la columna \"Conjuros preparados\" de la tabla \"Rasgos de explorador\". Cada vez que ese número aumente, elige conjuros de explorador adicionales hasta que el número de conjuros de tu lista coincida con el número en la tabla \"Rasgos de explorador\". Los conjuros elegidos deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un explorador de nivel 5, tu lista de conjuros preparados puede incluir seis conjuros de explorador de nivel 1 o 2 en cualquier combinación.\nSi otro rasgo de explorador te proporciona conjuros que siempre tienes preparados, esos conjuros no cuentan para el número de conjuros que puedes preparar con este rasgo, pero por lo demás cuentan como conjuros de explorador para ti.\n\n***Cambiar tus conjuros preparados.*** Cada vez que finalices un descanso largo, puedes reemplazar un conjuro de tu lista por otro conjuro de explorador para el que tengas espacios de conjuro.\n\n***Aptitud mágica.*** La Sabiduría es tu aptitud mágica en lo que respecta a tus conjuros de explorador.\n\n***Canalizador mágico.*** Puedes utilizar un *canalizador druídico* como canalizador mágico para tus conjuros de explorador.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 1,
        nombre: "Enemigo predilecto",
        descripcion: "Siempre tienes el conjuro *marca del cazador* preparado. Puedes lanzarlo dos veces sin gastar un espacio de conjuro, y recuperas todos los usos gastados de esta capacidad cuando finalizas un descanso largo.\nEl número de veces que puedes lanzar el conjuro sin un espacio de conjuro aumenta cuando alcanzas ciertos niveles de explorador, como se muestra en la columna \"Enemigo predilecto\" de la tabla \"Rasgos de explorador\".",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 1,
        nombre: "Maestría con armas",
        descripcion: "Tu entrenamiento con armas te permite utilizar las propiedades de maestría de dos tipos de armas de tu elección con las que tengas competencia, como los *arcos largos* y las *espadas cortas*.\nCada vez que finalices un descanso largo, puedes cambiar los tipos de armas que elegiste. Por ejemplo, podrías cambiar para usar las propiedades de maestría de las *cimitarras* y las *espadas largas*.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Explorador diestro",
        descripcion: "Gracias a tus viajes, obtienes los siguientes beneficios.\n\n***Pericia.*** Elige una de tus competencias en habilidades en la que no tengas Pericia. Ganas Pericia en esa habilidad.\n\n***Idiomas.*** Conoces dos idiomas de tu elección de las tablas de idiomas del *capítulo 2*.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 2,
        nombre: "Estilo de combate",
        descripcion: "Ganas una dote de Estilo de combate de tu elección. En lugar de elegir una de esas dotes, puedes elegir la opción a continuación.\n\n***Guerrero druídico.*** Aprendes dos trucos de druida de tu elección. Se recomiendan *guía* y *fuego fatuo estelar*. Los trucos elegidos cuentan como conjuros de explorador para ti, y la Sabiduría es tu aptitud mágica para ellos. Cada vez que subas un nivel de explorador, puedes reemplazar uno de estos trucos por otro truco de druida.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 3,
        nombre: "Subclase de explorador",
        descripcion: "Consigues una subclase de explorador de tu elección. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de explorador. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de explorador e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de explorador.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Ataque adicional",
        descripcion: "Puedes atacar dos veces en lugar de una cada vez que realices la acción de atacar en tu turno.",
        tipoAccion: "accion"
      },
      {
        nivel: 6,
        nombre: "Trotamundos",
        descripcion: "Tu velocidad aumenta en 3 m (10 pies) mientras no lleves armadura pesada. También tienes una velocidad escalando y una velocidad nadando iguales a tu velocidad.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de explorador.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 9,
        nombre: "Pericia",
        descripcion: "Elige dos de tus competencias en habilidades en las que no tengas Pericia. Ganas Pericia en esas habilidades.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Incansable",
        descripcion: "Las fuerzas primigenias ahora te ayudan a impulsarte en tus viajes, otorgándote los siguientes beneficios.\n\n***Puntos de golpe temporales.*** Como acción de magia, puedes otorgarte una cantidad de puntos de golpe temporales igual a 1d8 más tu modificador por Sabiduría (mínimo de 1). Puedes usar esta acción una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez), y recuperas todos los usos gastados cuando finalizas un descanso largo.\n\n***Disminuir agotamiento.*** Cada vez que finalices un descanso corto, tu nivel de agotamiento, si tienes alguno, disminuye en 1.",
        tipoAccion: "accion",
        tieneUsosLimitados: true,
        recuperacion: "descanso_corto",
        formulaDados: "1d8"
      },
      {
        nivel: 11,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de explorador.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 13,
        nombre: "Cazador implacable",
        descripcion: "Sufrir daño no puede romper tu concentración en *marca del cazador*.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Velo de la naturaleza",
        descripcion: "Invocas a los espíritus de la naturaleza para que te oculten mágicamente. Como acción adicional, puedes obtener el estado de invisible hasta el final de tu siguiente turno.\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez), y recuperas todos los usos gastados cuando finalizas un descanso largo.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 15,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de explorador.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 17,
        nombre: "Cazador preciso",
        descripcion: "Tienes ventaja en las tiradas de ataque contra la criatura que esté actualmente marcada por tu *marca del cazador*.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 18,
        nombre: "Sentidos salvajes",
        descripcion: "Tu conexión con las fuerzas de la naturaleza te otorga vista ciega con un alcance de 9 m (30 pies).",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don del viaje dimensional.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Asesino de enemigos",
        descripcion: "El dado de daño de tu *marca del cazador* es un d10 en lugar de un d6.",
        tipoAccion: "pasivo"
      },
    ],
    subclases: [
      {
        id: "senor_de_las_bestias",
        clasePadre: "explorador",
        nombre: "Señor de las Bestias",
        descripcion: "Un Señor de las Bestias forma un vínculo místico con un animal especial, extrayendo magia primigenia y una profunda conexión con el mundo natural.",
        lema: "Estrecha lazos con una bestia primigenia",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Compañero primigenio",
            descripcion: "Invocas mágicamente a una bestia primigenia, que extrae su fuerza de tu vínculo con la naturaleza. Elige su bloque de estadísticas: **Bestia de la tierra**, **Bestia del mar** o **Bestia del cielo**. También determinas el tipo de animal que es, eligiendo un tipo apropiado para el bloque de estadísticas. Independientemente de la bestia que elijas, esta posee marcas primigenias que indican su origen sobrenatural.\nLa bestia es amistosa contigo y con tus aliados, y obedece tus órdenes. Desaparece si mueres.\n\n***La bestia en combate.*** En combate, la bestia actúa durante tu turno. Puede moverse y usar su reacción por sí sola, pero la única acción que lleva a cabo es la acción de esquivar a menos que uses una acción adicional para ordenarle que lleve a cabo una acción de su bloque de estadísticas o alguna otra acción. También puedes sacrificar uno de tus ataques cuando realizas la acción de atacar para ordenarle a la bestia que lleve a cabo la acción de Golpe de la bestia. Si tienes el estado de incapacitado, la bestia actúa por sí sola y no se limita a la acción de esquivar.\n\n***Restaurar o reemplazar a la bestia.*** Si la bestia ha muerto en la última hora, puedes llevar a cabo una acción de magia para tocarla y gastar un espacio de conjuro. La bestia vuelve a la vida después de 1 minuto con todos sus puntos de golpe restaurados.\nCada vez que finalices un descanso largo, puedes invocar a una bestia primigenia diferente, la cual aparece en un espacio sin ocupar a 1,5 m (5 pies) o menos de ti. Tú eliges su bloque de estadísticas y apariencia. Si ya tienes una bestia proveniente de este rasgo, la antigua desaparecerá cuando la nueva aparezca.",
            tipoAccion: "accion_adicional",
            subclase: "Señor de las Bestias",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 7,
            nombre: "Entrenamiento excepcional",
            descripcion: "Cuando uses una acción adicional para ordenarle a tu bestia Compañero primigenio que lleve a cabo una acción, también puedes ordenarle que lleve a cabo la acción de correr, destrabarse, esquivar o ayudar utilizando su acción adicional.\nAdemás, cada vez que acierte con una tirada de ataque y cause daño, puede infligir daño de fuerza o su tipo de daño normal (a tu elección).",
            tipoAccion: "accion_adicional",
            subclase: "Señor de las Bestias"
          },
          {
            nivel: 11,
            nombre: "Furia bestial",
            descripcion: "Cuando le ordenas a tu bestia Compañero primigenio que lleve a cabo la acción de Golpe de la bestia, la bestia puede usarla dos veces.\nAdemás, la primera vez en cada turno que acierte a una criatura bajo el efecto de tu conjuro *marca del cazador*, la bestia infligirá daño de fuerza adicional igual al daño adicional de ese conjuro.",
            tipoAccion: "accion",
            subclase: "Señor de las Bestias"
          },
          {
            nivel: 15,
            nombre: "Compartir conjuros",
            descripcion: "Cuando lances un conjuro que te tenga a ti como objetivo, también podrás afectar a tu bestia Compañero primigenio con el conjuro si esta se encuentra a 9 m (30 pies) o menos de ti.",
            tipoAccion: "pasivo",
            subclase: "Señor de las Bestias"
          },
        ]
      },
      {
        id: "errante_feerico",
        clasePadre: "explorador",
        nombre: "Errante Feérico",
        descripcion: "Una mística feérica te rodea, gracias a la bendición de un archifeérico o a un lugar en los Parajes Feéricos que te transformó. Independientemente de cómo hayas obtenido tu magia feérica, ahora eres un Errante Feérico. Tu risa alegre ilumina los corazones de los oprimidos, y tu destreza marcial infunde terror en tus enemigos, pues grande es el júbilo de las fatas y terrible es su furia.",
        lema: "Manifiesta el júbilo y la furia feéricos",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Hechizar persona"]},{"nivelClase":5,"conjuros":["Paso brumoso"]},{"nivelClase":9,"conjuros":["Disipar magia"]},{"nivelClase":13,"conjuros":["Puerta dimensional"]},{"nivelClase":17,"conjuros":["Engaño"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Golpes terroríficos",
            descripcion: "Puedes aumentar tus ataques con armas con magia que deja cicatrices en la mente, extraída de las hondonadas tenebrosas de los Parajes Feéricos. Cuando aciertes a una criatura con un arma, puedes infligir 1d4 de daño psíquico adicional al objetivo, el cual solo puede sufrir este daño adicional una vez por turno. El daño adicional aumenta a 1d6 cuando alcanzas el nivel 11 de explorador.",
            tipoAccion: "pasivo",
            subclase: "Errante Feérico",
            formulaDados: "1d4"
          },
          {
            nivel: 3,
            nombre: "Conjuros del Errante Feérico",
            descripcion: "Cuando alcanzas un nivel de explorador especificado en la tabla \"Conjuros del Errante Feérico\", a partir de entonces siempre tendrás preparados los conjuros que se indican.\n##### Conjuros del Errante Feérico\n| Nivel de explorador | Conjuros |\n|:---:|---|\n| 3 | *hechizar persona* |\n| 5 | *paso brumoso* |\n| 9 | *invocar feérico* |\n| 13 | *puerta dimensional* |\n| 17 | *desorientar* |\nTambién posees una bendición feérica. Elígela de la tabla \"Dones de los Parajes Feéricos\" o determínala al azar.\n##### Dones de los Parajes Feéricos\n| 1d6 | Don |\n|:---:|---|\n| 1 | Mariposas ilusorias revolotean a tu alrededor mientras realizas un descanso corto o largo. |\n| 2 | Flores brotan de tu cabello cada amanecer. |\n| 3 | Tienes un ligero olor a canela, lavanda, nuez moscada u otra hierba o especia reconfortante. |\n| 4 | Tu sombra baila cuando nadie la mira directamente. |\n| 5 | Cuernos o astas brotan de tu cabeza. |\n| 6 | Tu piel y cabello cambian de color cada amanecer. |",
            tipoAccion: "pasivo",
            subclase: "Errante Feérico",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto",
            formulaDados: "1d6"
          },
          {
            nivel: 3,
            nombre: "Glamur de otro mundo",
            descripcion: "Cada vez que hagas una prueba de Carisma, obtendrás un bonificador a la prueba igual a tu modificador por Sabiduría (mínimo de +1).\nTambién ganas competencia en una de estas habilidades de tu elección: Engaño, Interpretación o Persuasión.",
            tipoAccion: "pasivo",
            subclase: "Errante Feérico"
          },
          {
            nivel: 7,
            nombre: "Giro seductor",
            descripcion: "La magia de los Parajes Feéricos protege tu mente. Tienes ventaja en las tiradas de salvación para evitar o poner fin al estado de hechizado o asustado.\nAdemás, cada vez que tú o una criatura que puedas ver a 36 m (120 pies) o menos de ti tenga éxito en una tirada de salvación para evitar o poner fin al estado de hechizado o asustado, puedes utilizar una reacción para obligar a una criatura diferente que puedas ver a 36 m (120 pies) o menos de ti a hacer una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros. Si falla la tirada, el objetivo tendrá el estado de hechizado o asustado (a tu elección) durante 1 minuto. El objetivo repetirá la tirada de salvación al final de cada uno de sus turnos, poniendo fin al efecto sobre sí mismo si tiene éxito.",
            tipoAccion: "pasivo",
            subclase: "Errante Feérico"
          },
          {
            nivel: 11,
            nombre: "Refuerzos feéricos",
            descripcion: "Puedes lanzar *invocar feérico* sin componentes materiales. También puedes lanzarlo una vez sin gastar un espacio de conjuro, y recuperas la capacidad de lanzarlo de esta forma cuando finalizas un descanso largo.\nCada vez que comiences a lanzar el conjuro, puedes modificarlo para que no requiera concentración. Si lo haces, la duración del conjuro pasará a ser de 1 minuto para ese lanzamiento.",
            tipoAccion: "pasivo",
            subclase: "Errante Feérico",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 15,
            nombre: "Errante brumoso",
            descripcion: "Puedes lanzar *paso brumoso* sin gastar un espacio de conjuro. Puedes hacerlo una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez), y recuperas todos los usos gastados cuando finalizas un descanso largo.\nAdemás, cada vez que lances *paso brumoso*, puedes llevar contigo a una criatura voluntaria que puedas ver a 1,5 m (5 pies) o menos de ti. Esa criatura se teletransportará a un espacio sin ocupar de tu elección que esté a 1,5 m (5 pies) o menos de tu espacio de destino.",
            tipoAccion: "pasivo",
            subclase: "Errante Feérico",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "acechador_en_la_penumbra",
        clasePadre: "explorador",
        nombre: "Acechador en la Penumbra",
        descripcion: "Los Acechadores en la Penumbra se sienten como en casa en los lugares más oscuros, esgrimiendo magia extraída del Páramo Sombrío para combatir a los enemigos que acechan en la oscuridad.",
        lema: "Persigue a los enemigos que moran en la oscuridad",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Disfrazarse"]},{"nivelClase":5,"conjuros":["Truco de la cuerda"]},{"nivelClase":9,"conjuros":["Miedo"]},{"nivelClase":13,"conjuros":["Invisibilidad mayor"]},{"nivelClase":17,"conjuros":["Pasmosa apariencia"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Emboscador terrorífico",
            descripcion: "Has dominado el arte de crear emboscadas temibles, otorgándote los siguientes beneficios.\n\n***Salto del emboscador.*** Al comienzo de tu primer turno de cada combate, tu velocidad aumenta en 3 m (10 pies) hasta el final de ese turno.\n\n***Golpe terrorífico.*** Cuando ataques a una criatura y la aciertes con un arma, puedes infligirle 2d6 de daño psíquico adicional. Solo puedes usar este beneficio una vez por turno, puedes usarlo una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez), y recuperas todos los usos gastados cuando finalizas un descanso largo.\n\n***Bonificador de iniciativa.*** Cuando tires iniciativa, puedes sumar tu modificador por Sabiduría a la tirada.",
            tipoAccion: "pasivo",
            subclase: "Acechador en la Penumbra",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "2d6"
          },
          {
            nivel: 3,
            nombre: "Conjuros del Acechador en la Penumbra",
            descripcion: "Cuando alcanzas un nivel de explorador especificado en la tabla \"Conjuros del Acechador en la Penumbra\", a partir de entonces siempre tendrás preparados los conjuros que se indican.\n##### Conjuros del Acechador en la Penumbra\n| Nivel de explorador | Conjuros |\n|:---:|---|\n| 3 | *disfrazarse* |\n| 5 | *truco de la cuerda* |\n| 9 | *miedo* |\n| 13 | *invisibilidad mayor* |\n| 17 | *apariencia* |",
            tipoAccion: "pasivo",
            subclase: "Acechador en la Penumbra"
          },
          {
            nivel: 3,
            nombre: "Visión en la penumbra",
            descripcion: "Ganas visión en la oscuridad con un alcance de 18 m (60 pies). Si ya tienes visión en la oscuridad cuando adquieres este rasgo, su alcance aumenta en 18 m (60 pies).\nTambién eres experto en evadir a las criaturas que dependen de la visión en la oscuridad. Mientras te encuentres completamente en la oscuridad, tendrás el estado de invisible para cualquier criatura que dependa de la visión en la oscuridad para verte en esa oscuridad.",
            tipoAccion: "pasivo",
            subclase: "Acechador en la Penumbra"
          },
          {
            nivel: 7,
            nombre: "Mente de hierro",
            descripcion: "Has perfeccionado tu capacidad para resistir poderes que alteran la mente. Ganas competencia en las tiradas de salvación de Sabiduría. Si ya tienes esta competencia, en su lugar ganas competencia en las tiradas de salvación de Inteligencia o Carisma (a tu elección).",
            tipoAccion: "pasivo",
            subclase: "Acechador en la Penumbra"
          },
          {
            nivel: 11,
            nombre: "Aluvión del acechador",
            descripcion: "El daño psíquico de tu Golpe terrorífico pasa a ser 2d8. Además, cuando uses el efecto de Golpe terrorífico de tu rasgo Emboscador terrorífico, puedes provocar uno de los siguientes efectos adicionales.\n\n***Golpe súbito.*** Puedes hacer otro ataque con la misma arma contra una criatura diferente que se encuentre a 1,5 m (5 pies) o menos del objetivo original y que esté dentro del alcance del arma.\n\n***Miedo en masa.*** El objetivo y cada criatura a 3 m (10 pies) o menos de él deberán hacer una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros. Si falla la tirada, la criatura tendrá el estado de asustado hasta el comienzo de tu siguiente turno.",
            tipoAccion: "pasivo",
            subclase: "Acechador en la Penumbra",
            formulaDados: "2d8"
          },
          {
            nivel: 15,
            nombre: "Esquiva sombría",
            descripcion: "Cuando una criatura haga una tirada de ataque contra ti, puedes utilizar una reacción para imponer desventaja en esa tirada. Independientemente de si el ataque acierta o falla, puedes teletransportarte hasta 9 m (30 pies) a un espacio sin ocupar que puedas ver.",
            tipoAccion: "pasivo",
            subclase: "Acechador en la Penumbra"
          },
        ]
      },
      {
        id: "cazador",
        clasePadre: "explorador",
        nombre: "Cazador",
        descripcion: "Acechas a tus presas en la naturaleza y en otros lugares, utilizando tus habilidades como Cazador para proteger tanto a la naturaleza como a las personas de cualquier lugar contra las fuerzas que intentarían destruirlas.",
        lema: "Protege la naturaleza con tu versatilidad marcial",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Presa del cazador",
            descripcion: "Obtienes una de las siguientes opciones de rasgo de tu elección. Cada vez que finalices un descanso corto o largo, puedes reemplazar la opción elegida por la otra.\n\n***Asesino de colosos.*** Tu tenacidad puede desgastar incluso a los enemigos más resistentes. Cuando aciertes a una criatura con un arma, esta infligirá 1d8 de daño adicional al objetivo si a este le falta alguno de sus puntos de golpe. Solo puedes infligir este daño adicional una vez por turno.\n\n***Rompehordas.*** Una vez en cada uno de tus turnos, cuando realices un ataque con un arma, podrás hacer otro ataque con la misma arma contra una criatura diferente que se encuentre a 1,5 m (5 pies) o menos del objetivo original, que esté dentro del alcance del arma y a la que no hayas atacado este turno.",
            tipoAccion: "pasivo",
            subclase: "Cazador",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto",
            formulaDados: "1d8"
          },
          {
            nivel: 3,
            nombre: "Sabiduría del cazador",
            descripcion: "Puedes apelar a las fuerzas de la naturaleza para revelar ciertas fortalezas y debilidades de tu presa. Mientras una criatura esté marcada por tu *marca del cazador*, sabrás si esa criatura tiene inmunidades, resistencias o vulnerabilidades, y de tenerlas, sabrás cuáles son.",
            tipoAccion: "pasivo",
            subclase: "Cazador"
          },
          {
            nivel: 7,
            nombre: "Tácticas defensivas",
            descripcion: "Obtienes una de las siguientes opciones de rasgo de tu elección. Cada vez que finalices un descanso corto o largo, puedes reemplazar la opción elegida por la otra.\n\n***Escapar de la horda.*** Los ataques de oportunidad tienen desventaja contra ti.\n\n***Defensa contra ataques múltiples.*** Cuando una criatura te acierte con una tirada de ataque, dicha criatura tendrá desventaja en todas las demás tiradas de ataque contra ti este turno.",
            tipoAccion: "pasivo",
            subclase: "Cazador",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 11,
            nombre: "Presa del cazador superior",
            descripcion: "Una vez por turno, cuando inflijas daño a una criatura marcada por tu *marca del cazador*, también podrás infligir el daño adicional de ese conjuro a una criatura diferente que puedas ver a 9 m (30 pies) o menos de la primera criatura.",
            tipoAccion: "pasivo",
            subclase: "Cazador"
          },
          {
            nivel: 15,
            nombre: "Defensa del cazador superior",
            descripcion: "Cuando sufras daño, podrás utilizar una reacción para otorgarte resistencia a ese daño y a cualquier otro daño del mismo tipo hasta el final del turno en curso.",
            tipoAccion: "pasivo",
            subclase: "Cazador"
          },
        ]
      },
    ]
  },
  {
    id: "guerrero",
    nombre: "Guerrero",
    descripcion: "Un combatiente insuperable entrenado en el dominio de todas las armas y armaduras, célebre por su resistencia táctica y letalidad marcial.",
    dadoGolpe: "d10",
    caracteristicasPrimarias: ["fuerza","destreza","constitucion"],
    salvacionesCompetentes: ["fuerza","constitucion"],
    competenciasArmaduras: ["Armaduras Ligeras","Armaduras Medianas","Armaduras Pesadas","Escudos"],
    competenciasArmas: ["Armas Sencillas","Armas Marciales"],
    competenciasHerramientas: [],
    opcionesHabilidades: {"cantidad":2,"opciones":["acrobacias","manejoAnimales","atletismo","historia","perspicacia","intimidacion","percepcion","supervivencia"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Cota de malla (o Cuero tachonado), Gran Espada (o Arco largo con 20 flechas), Paquete de Calabozo y 11 PO","opcionB":"(B) 155 PO en monedas para comprar equipo"},
    rasgos: [
      {
        nivel: 1,
        nombre: "Estilo de combate",
        descripcion: "Has perfeccionado tu destreza marcial y ganas una dote de Estilo de combate de tu elección. Se recomienda Defensa.\nCada vez que subas un nivel de guerrero, puedes sustituir la dote que elegiste por otra dote de Estilo de combate.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 1,
        nombre: "Tomar aliento",
        descripcion: "Tienes una reserva limitada de aguante físico y mental a la que puedes recurrir. Como acción adicional, puedes usarla para recuperar una cantidad de puntos de golpe igual a 1d10 más tu nivel de guerrero.\nPuedes usar este rasgo dos veces. Recuperas un uso gastado tras finalizar un descanso corto, y recuperas todos los usos gastados tras finalizar un descanso largo.\nCuando alcanzas ciertos niveles de guerrero, obtienes más usos de este rasgo, como se muestra en la columna \"Tomar aliento\" de la tabla \"Rasgos de guerrero\".",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 10 ? 4 : niv >= 4 ? 3 : 2),
        recuperacion: "descanso_corto",
        formulaDados: "1d10"
      },
      {
        nivel: 1,
        nombre: "Maestría con armas",
        descripcion: "Tu entrenamiento con armas te permite utilizar las propiedades de maestría de tres tipos de armas sencillas o marciales de tu elección. Siempre que finalices un descanso largo, puedes practicar tácticas con armas y cambiar una de esas armas elegidas.\nCuando alcanzas ciertos niveles de guerrero, obtienes la capacidad de usar las propiedades de maestría de más tipos de armas, como se muestra en la columna \"Maestría con armas\" de la tabla \"Rasgos de guerrero\".",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Acción súbita",
        descripcion: "Puedes superar tus límites normales durante un momento. En tu turno, puedes llevar a cabo una acción adicional, excepto la acción de Magia.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso corto o largo. A partir del nivel 17, puedes usarlo dos veces antes de un descanso, pero solo una vez por turno.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 17 ? 2 : 1),
        recuperacion: "descanso_corto"
      },
      {
        nivel: 2,
        nombre: "Mente táctica",
        descripcion: "Tienes una mente para la táctica dentro y fuera del campo de batalla. Cuando falles una prueba de característica, puedes gastar un uso de Tomar aliento para impulsarte hacia el éxito. En lugar de recuperar puntos de golpe, tiras 1d10 y sumas el número sacado a la prueba de característica, lo que podría convertirla en un éxito. Si la prueba sigue fallando, este uso de Tomar aliento no se gasta.",
        tipoAccion: "pasivo",
        formulaDados: "1d10"
      },
      {
        nivel: 3,
        nombre: "Subclase de guerrero",
        descripcion: "Consigues una subclase de guerrero de tu elección. Las subclases de caballero arcano, campeón, guerrero psiónico y maestro del combate se detallan tras la descripción de esta clase. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de guerrero. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de guerrero e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 6, 8, 12, 14 y 16 de guerrero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Ataque adicional",
        descripcion: "Cuando lleves a cabo la acción de atacar en tu turno, podrás hacer dos ataques en lugar de uno.",
        tipoAccion: "accion"
      },
      {
        nivel: 5,
        nombre: "Desplazamiento táctico",
        descripcion: "Siempre que uses tu rasgo Tomar aliento con una acción adicional, puedes moverte hasta la mitad de tu velocidad sin provocar ataques de oportunidad.",
        tipoAccion: "accion_adicional"
      },
      {
        nivel: 6,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de guerrero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 9,
        nombre: "Indómito",
        descripcion: "Si fallas una tirada de salvación, puedes repetirla con un bonificador igual a tu nivel de guerrero. Deberás quedarte con el nuevo resultado y no podrás volver a utilizar este rasgo hasta que finalices un descanso largo.\nPuedes usar este rasgo dos veces entre descansos largos a partir del nivel 13 y tres veces entre descansos largos a partir del nivel 17.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 17 ? 3 : niv >= 13 ? 2 : 1),
        recuperacion: "descanso_largo"
      },
      {
        nivel: 9,
        nombre: "Maestro táctico",
        descripcion: "Cuando ataques usando un arma con la que puedas utilizar su propiedad de maestría, puedes sustituir esa propiedad para ese ataque por la de debilitar, empujar o ralentizar.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de guerrero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 11,
        nombre: "Dos ataques adicionales",
        descripcion: "Cuando lleves a cabo la acción de atacar en tu turno, podrás hacer tres ataques en lugar de uno.",
        tipoAccion: "accion"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 13,
        nombre: "Indómito",
        descripcion: "(Ver descripción en nivel 9).",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 17 ? 3 : niv >= 13 ? 2 : 1),
        recuperacion: "descanso_largo"
      },
      {
        nivel: 13,
        nombre: "Ataques estudiados",
        descripcion: "Estudias a tus adversarios y aprendes con cada ataque que realizas. Si haces una tirada de ataque contra una criatura y fallas, tendrás ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu siguiente turno.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 15,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de guerrero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 17,
        nombre: "Acción súbita",
        descripcion: "(Ver descripción en nivel 2).",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 17 ? 2 : 1),
        recuperacion: "descanso_corto"
      },
      {
        nivel: 17,
        nombre: "Indómito",
        descripcion: "(Ver descripción en nivel 9).",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 17 ? 3 : niv >= 13 ? 2 : 1),
        recuperacion: "descanso_largo"
      },
      {
        nivel: 18,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de guerrero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don de la pericia en combate.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Tres ataques adicionales",
        descripcion: "Cuando lleves a cabo la acción de atacar en tu turno, podrás hacer cuatro ataques en lugar de uno.",
        tipoAccion: "accion"
      },
    ],
    subclases: [
      {
        id: "maestro_del_combate",
        clasePadre: "guerrero",
        nombre: "Maestro del Combate",
        descripcion: "Los maestros del combate estudian el arte de la batalla y aprenden técnicas marciales que transmiten generación tras generación. Los maestros más consumados son figuras equilibradas que combinan las habilidades de combate que han ido perfeccionando cuidadosamente con el estudio académico de la historia, la teoría y las artes.",
        lema: "Domina maniobras de combate avanzadas.",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Supremacía en combate",
            descripcion: "Tu experiencia en el campo de batalla ha pulido tus técnicas de combate. Aprendes maniobras que emplean unos dados especiales llamados dados de supremacía.\n\n***Maniobras.*** Aprendes tres maniobras de tu elección del apartado \"Opciones de maniobras\", que aparece más adelante en la descripción de esta subclase. Muchas maniobras mejoran los ataques de alguna forma. Solo puedes emplear una maniobra por ataque.\nAprendes dos maniobras adicionales de tu elección cuando alcanzas los niveles 7, 10 y 15 de guerrero. Cada vez que aprendas nuevas maniobras, también puedes reemplazar una maniobra que conozcas por otra diferente.\n\n***Dados de supremacía.*** Tienes cuatro dados de supremacía, que son d8. Un dado de supremacía se gasta cuando lo utilizas. Recuperas todos los dados de supremacía gastados cuando finalizas un descanso corto o largo.\nObtienes un dado de supremacía adicional cuando alcanzas los niveles de guerrero 7 (cinco dados en total) y 15 (seis dados en total).\n\n***Tiradas de salvación.*** Si una maniobra requiere una tirada de salvación, la CD es igual a 8 más tu modificador por Fuerza o Destreza (a tu elección) y tu bonificador por competencia.",
            tipoAccion: "pasivo",
            subclase: "Maestro del Combate",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 3,
            nombre: "Estudioso de la guerra",
            descripcion: "Ganas competencia con un tipo de *herramientas de artesano* de tu elección y en una habilidad de tu elección de las habilidades disponibles para los guerreros de nivel 1.",
            tipoAccion: "pasivo",
            subclase: "Maestro del Combate"
          },
          {
            nivel: 3,
            nombre: "Opciones de maniobras",
            descripcion: "Las maniobras se presentan aquí en orden alfabético.\n\n***Ataque amenazante.*** Cuando aciertes a una criatura con una tirada de ataque, puedes gastar un dado de supremacía para intentar asustar al objetivo. Suma el dado de supremacía a la tirada de daño del ataque. El objetivo debe superar una tirada de salvación de Sabiduría o tendrá el estado de asustado hasta el final de tu siguiente turno.\n\n***Ataque con arremetida.*** Como acción adicional, puedes gastar un dado de supremacía y llevar a cabo la acción de correr. Si te mueves al menos 1,5 m (5 pies) en línea recta inmediatamente antes de acertar con un ataque cuerpo a cuerpo como parte de la acción de atacar en este turno, puedes sumar el dado de supremacía a la tirada de daño del ataque.\n\n***Ataque de barrido.*** Cuando aciertes a una criatura con una tirada de ataque cuerpo a cuerpo usando un arma o un ataque sin armas, puedes gastar un dado de supremacía para intentar dañar a otra criatura. Elige otra criatura a 1,5 m (5 pies) o menos del objetivo original y que esté a tu alcance. Si la tirada de ataque original hubiera acertado a la segunda criatura, esta sufrirá una cantidad de daño igual al resultado que saques en el dado de supremacía. El daño es del mismo tipo que inflige el ataque original.\n\n***Ataque preciso.*** Cuando falles con una tirada de ataque, puedes gastar un dado de supremacía, tirarlo y sumar el resultado a la tirada de ataque, lo que podría hacer que el ataque acierte.\n\n***Ataque provocador.*** Cuando aciertes a una criatura con una tirada de ataque, puedes gastar un dado de supremacía para intentar provocar al objetivo para que te ataque. Suma el dado de supremacía a la tirada de daño del ataque. El objetivo deberá superar una tirada de salvación de Sabiduría o tendrá desventaja en sus tiradas de ataque contra cualquier objetivo que no seas tú hasta el final de tu siguiente turno.\n\n***Ataque y derribo.*** Cuando aciertes a una criatura con una tirada de ataque usando un arma o un ataque sin armas, puedes gastar un dado de supremacía y sumarlo a la tirada de daño del ataque. Si el objetivo es Grande o más pequeño, deberá superar una tirada de salvación de Fuerza o tendrá el estado de derribado.\n\n***Ataque y desarme.*** Cuando aciertes a una criatura con una tirada de ataque, puedes gastar un dado de supremacía para intentar desarmar al objetivo. Suma el dado de supremacía a la tirada de daño del ataque. El objetivo deberá superar una tirada de salvación de Fuerza o soltará un objeto de tu elección que esté sujetando, que caerá en su espacio.\n\n***Ataque y distracción.*** Cuando aciertes a una criatura con una tirada de ataque, puedes gastar un dado de supremacía para distraer al objetivo. Suma el dado de supremacía a la tirada de daño del ataque. La siguiente tirada de ataque contra el objetivo que realice un atacante que no seas tú tendrá ventaja si el ataque se lleva a cabo antes del principio de tu siguiente turno.\n\n***Ataque y empujón.*** Cuando aciertes a una criatura con una tirada de ataque usando un arma o un ataque sin armas, puedes gastar un dado de supremacía para intentar hacer retroceder al objetivo. Suma el dado de supremacía a la tirada de daño del ataque. Si el objetivo es Grande o más pequeño, deberá superar una tirada de salvación de Fuerza o será empujado hasta 4,5 m (15 pies) en línea recta alejándose de ti.\n\n***Ataque y maniobra.*** Cuando aciertes a una criatura con una tirada de ataque, puedes gastar un dado de supremacía para que uno de tus compañeros maniobre para cambiar de posición. Suma el dado de supremacía a la tirada de daño del ataque y elige a una criatura voluntaria que pueda verte u oírte. La criatura podrá usar su reacción para moverse hasta la mitad de su velocidad sin provocar un ataque de oportunidad por parte del objetivo de tu ataque.\n\n***Cambio de posición ventajoso.*** Si en tu turno estás a 1,5 m (5 pies) o menos de una criatura, puedes gastar un dado de supremacía y cambiar tu posición por la de ella, siempre que gastes al menos 1,5 m (5 pies) de movimiento y que esa criatura acceda voluntariamente y no tenga el estado de incapacitada. Este movimiento no provoca ataques de oportunidad. Tira el dado de supremacía. Hasta el principio de tu siguiente turno, tú o la otra criatura (a tu elección) obtenéis un bonificador a la CA igual al resultado.\n\n***Contraataque.*** Cuando una criatura falle una tirada de ataque cuerpo a cuerpo contra ti, puedes llevar a cabo una reacción y gastar un dado de supremacía para realizar una tirada de ataque cuerpo a cuerpo con un arma o con un ataque sin armas contra esa criatura. Si aciertas, suma el dado de supremacía al daño del ataque.\n\n***Emboscada.*** Cuando hagas una prueba de Destreza (Sigilo) o una tirada de iniciativa, puedes gastar un dado de supremacía y sumarlo a la tirada, salvo que tengas el estado de incapacitado.\n\n***Evaluación táctica.*** Cuando hagas una prueba de Inteligencia (Historia o Investigación) o de Sabiduría (Perspicacia), puedes gastar un dado de supremacía y sumarlo a la prueba de característica.\n\n***Finta.*** Como acción adicional, puedes gastar un dado de supremacía para realizar una finta eligiendo a una criatura a 1,5 m (5 pies) o menos de ti como objetivo. Tendrás ventaja en tu siguiente tirada de ataque contra ese objetivo ese turno. Si el ataque acierta, suma el dado de supremacía a la tirada de daño del ataque.\n\n***Juego de pies evasivo.*** Como acción adicional, puedes gastar un dado de supremacía y llevar a cabo la acción de destrabarse. También tiras el dado y sumas el resultado a tu CA hasta el principio de tu siguiente turno.\n\n***Orden de ataque.*** Cuando lleves a cabo la acción de atacar en tu turno, puedes renunciar a uno de tus ataques para ordenar a uno de tus compañeros que ataque. Cuando lo hagas, elige a una criatura voluntaria que pueda verte u oírte y gasta un dado de supremacía. Esa criatura podrá usar su reacción de inmediato para realizar un ataque con un arma o un ataque sin armas y sumar el dado de supremacía a la tirada de daño del ataque si acierta.\n\n***Parada.*** Cuando otra criatura te dañe con una tirada de ataque cuerpo a cuerpo, puedes llevar a cabo una reacción y gastar un dado de supremacía para reducir el daño en una cantidad igual al resultado del dado de supremacía más tu modificador por Fuerza o Destreza (a tu elección).\n\n***Presencia imponente.*** Cuando hagas una prueba de Carisma (Interpretación, Intimidación o Persuasión), puedes gastar un dado de supremacía y sumarlo a la tirada.\n\n***Reagrupar.*** Como acción adicional, puedes gastar un dado de supremacía para reforzar la determinación de un compañero. Elige a un aliado que esté a 9 m (30 pies) o menos de ti que pueda verte u oírte. La criatura obtendrá una cantidad de puntos de golpe temporales igual al resultado del dado de supremacía más la mitad de tu nivel de guerrero (redondeando hacia abajo).",
            tipoAccion: "accion_adicional",
            subclase: "Maestro del Combate"
          },
          {
            nivel: 7,
            nombre: "Conoce a tu enemigo",
            descripcion: "Como acción adicional, puedes discernir ciertas fortalezas y debilidades de una criatura que puedas ver a 9 m (30 pies) o menos de ti; sabrás si esa criatura tiene inmunidades, resistencias o vulnerabilidades, y de tenerlas, sabrás cuáles son.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo. También puedes recuperar un uso del rasgo gastando un dado de supremacía (no requiere acción).",
            tipoAccion: "accion_adicional",
            subclase: "Maestro del Combate",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 10,
            nombre: "Supremacía en combate mejorada",
            descripcion: "Tu dado de supremacía pasa a ser un d10.",
            tipoAccion: "pasivo",
            subclase: "Maestro del Combate"
          },
          {
            nivel: 15,
            nombre: "Implacable",
            descripcion: "Una vez por turno, cuando utilices una maniobra, puedes tirar 1d8 y usar el número sacado en lugar de gastar un dado de supremacía.",
            tipoAccion: "pasivo",
            subclase: "Maestro del Combate",
            formulaDados: "1d8"
          },
          {
            nivel: 18,
            nombre: "Supremacía en combate definitiva",
            descripcion: "Tu dado de supremacía pasa a ser un d12.",
            tipoAccion: "pasivo",
            subclase: "Maestro del Combate"
          },
        ]
      },
      {
        id: "campeon",
        clasePadre: "guerrero",
        nombre: "Campeón",
        descripcion: "Un campeón se centra en desarrollar su destreza marcial en su incansable afán de victoria. Los campeones combinan un entrenamiento riguroso con un estado físico excelente para asestar golpes devastadores, resistir ante el peligro y alcanzar la gloria. Ya sea en una competición atlética o en una sangrienta batalla, los campeones luchan por coronarse como vencedores.",
        lema: "Aspira a la excelencia física en combate.",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Crítico mejorado",
            descripcion: "Tus tiradas de ataque con armas y ataques sin armas pueden asestar un golpe crítico si sacas un 19 o 20 en el d20.",
            tipoAccion: "pasivo",
            subclase: "Campeón"
          },
          {
            nivel: 3,
            nombre: "Atleta sobresaliente",
            descripcion: "Gracias a tus capacidades atléticas, tienes ventaja en las tiradas de iniciativa y las pruebas de Fuerza (Atletismo).\nAdemás, justo después de asestar un golpe crítico, puedes moverte hasta la mitad de tu velocidad sin provocar ataques de oportunidad.",
            tipoAccion: "pasivo",
            subclase: "Campeón"
          },
          {
            nivel: 7,
            nombre: "Estilo de combate adicional",
            descripcion: "Ganas otra dote de Estilo de combate de tu elección.",
            tipoAccion: "pasivo",
            subclase: "Campeón"
          },
          {
            nivel: 10,
            nombre: "Guerrero heroico",
            descripcion: "La emoción de la batalla te impulsa hacia la victoria. Durante el combate, puedes otorgarte Inspiración heroica siempre que comiences tu turno sin ella.",
            tipoAccion: "pasivo",
            subclase: "Campeón"
          },
          {
            nivel: 15,
            nombre: "Crítico superior",
            descripcion: "Tus tiradas de ataque con armas y ataques sin armas ahora pueden asestar un golpe crítico si sacas un 18–20 en el d20.",
            tipoAccion: "pasivo",
            subclase: "Campeón"
          },
          {
            nivel: 18,
            nombre: "Superviviente",
            descripcion: "Alcanzas el pináculo de la resistencia en batalla, lo que te otorga estos beneficios.\n\n***Desafiar a la muerte.*** Tienes ventaja en las tiradas de salvación contra muerte. Además, cuando sacas un 18–20 en una tirada de salvación contra muerte, obtienes el beneficio de haber sacado un 20 en ella.\n\n***Reagrupación heroica.*** Al comienzo de cada uno de tus turnos, recuperas una cantidad de puntos de golpe igual a 5 más tu modificador por Constitución si estás malherido y tienes al menos 1 punto de golpe.",
            tipoAccion: "pasivo",
            subclase: "Campeón"
          },
        ]
      },
      {
        id: "caballero_arcano",
        clasePadre: "guerrero",
        nombre: "Caballero Arcano",
        descripcion: "Los caballeros arcanos combinan el dominio marcial común a todos los guerreros con un cuidadoso estudio de la magia. Sus conjuros complementan y amplían sus habilidades de combate, proporcionando protección adicional para reforzar su armadura y permitiéndoles enfrentarse a muchos enemigos a la vez con magia explosiva.",
        lema: "Apoya tus habilidades de combate con magia arcana.",
        nivelDesbloqueo: 3,
        configuracionMagica: {"tipoLanzador":"tercio","habilidadConjuro":"inteligencia","modeloConjuros":"preparados","nivelInicio":3},
        progresionConjuros: [{"nivelClase":3,"trucos":["2 trucos de Mago a elección"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Lanzamiento de conjuros",
            descripcion: "Has aprendido a lanzar conjuros. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información presentada a continuación detalla cómo usas esas reglas como caballero arcano.\n\n***Trucos.*** Conoces dos trucos de tu elección de la lista de conjuros de mago (consulta la sección de esa clase para ver su lista). Se recomiendan *rayo de escarcha* y *agarre electrizante*. Cada vez que subas un nivel de guerrero, puedes sustituir uno de estos trucos por otro truco de tu elección de la lista de conjuros de mago.\nCuando alcances el nivel 10 de guerrero, aprenderás otro truco de mago de tu elección.\n\n***Espacios de conjuro.*** La tabla de lanzamiento de conjuros del caballero arcano muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios utilizados tras finalizar un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas la lista de conjuros de nivel 1 y superiores que están disponibles para que los lances con este rasgo. Para empezar, elige tres conjuros de nivel 1 de la lista de conjuros de mago. Se recomiendan *manos ardientes*, *salto* y *escudo*.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de guerrero, como se muestra en la columna \"Conjuros preparados\" de la tabla de lanzamiento de conjuros del caballero arcano. Cuando ese número aumente, elige conjuros adicionales de la lista de conjuros de mago hasta que el número de conjuros de tu lista coincida con el número de la tabla. Los conjuros elegidos deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un guerrero de nivel 7, tu lista de conjuros preparados puede incluir cinco conjuros de mago de niveles 1 y 2 en cualquier combinación.\n\n***Cambiar los conjuros preparados.*** Cada vez que subas un nivel de guerrero, puedes reemplazar un conjuro de tu lista por otro conjuro de mago para el que tengas espacios de conjuro.\n\n***Aptitud mágica.*** La Inteligencia es tu aptitud mágica en lo que respecta a tus conjuros de mago.\n\n***Canalizador mágico.*** Puedes utilizar un *canalizador arcano* como canalizador mágico para tus conjuros de mago.",
            tipoAccion: "pasivo",
            subclase: "Caballero Arcano",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 3,
            nombre: "Vínculo de guerra",
            descripcion: "Aprendes un ritual que te vincula mágicamente a un arma. Este ritual requiere 1 hora y puede tener lugar durante un descanso corto. El arma debe estar a tu alcance durante el ritual y, cuando este acabe, la tocarás y forjarás el vínculo. El vínculo falla si otro guerrero está vinculado al arma o si el arma es un objeto mágico al que esté sintonizado alguien.\nCuando te hayas vinculado con el arma, no podrán desarmarte de ella salvo que tengas el estado de incapacitado. Si está en el mismo plano de existencia, puedes invocar el arma como acción adicional y teletransportarla de inmediato a tu mano.\nPuedes tener hasta dos armas vinculadas, pero solo puedes invocar una cada vez con una acción adicional. Si tratas de vincularte con una tercera arma, deberás romper el vínculo con una de las otras dos.",
            tipoAccion: "accion_adicional",
            subclase: "Caballero Arcano",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 7,
            nombre: "Magia de guerra",
            descripcion: "Cuando lleves a cabo la acción de atacar en tu turno, puedes sustituir uno de los ataques por el lanzamiento de uno de tus trucos de mago que tenga un tiempo de lanzamiento de una acción.",
            tipoAccion: "accion",
            subclase: "Caballero Arcano"
          },
          {
            nivel: 10,
            nombre: "Golpe sobrenatural",
            descripcion: "Aprendes a hacer que los ataques con tus armas minen la resistencia de una criatura a tus conjuros. Cuando aciertes a una criatura con un ataque con un arma, tendrá desventaja en la siguiente tirada de salvación que haga contra un conjuro que lances antes del final de tu siguiente turno.",
            tipoAccion: "pasivo",
            subclase: "Caballero Arcano"
          },
          {
            nivel: 15,
            nombre: "Carga arcana",
            descripcion: "Cuando utilices tu rasgo Acción súbita, podrás teletransportarte hasta 9 m (30 pies) a un espacio sin ocupar que puedas ver. Puedes teletransportarte antes o después de la acción adicional.",
            tipoAccion: "accion_adicional",
            subclase: "Caballero Arcano"
          },
          {
            nivel: 18,
            nombre: "Magia de guerra mejorada",
            descripcion: "Cuando lleves a cabo la acción de atacar en tu turno, puedes sustituir dos de los ataques por el lanzamiento de uno de tus conjuros de mago de nivel 1 o 2 que tenga un tiempo de lanzamiento de una acción.",
            tipoAccion: "accion",
            subclase: "Caballero Arcano"
          },
        ]
      },
      {
        id: "guerrero_psionico",
        clasePadre: "guerrero",
        nombre: "Guerrero Psiónico",
        descripcion: "Los guerreros psiónicos despiertan el poder de sus mentes para aumentar su poderío físico. Canalizan este poder psiónico para infundir los ataques de sus armas, golpear con energía telequinética y crear barreras de fuerza mental.",
        lema: "Refuerza tus ataques con poder psiónico.",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":18,"conjuros":["Telequinesis"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Poder psiónico",
            descripcion: "Albergas un manantial de energía psiónica en tu interior. Se representa mediante tus dados de energía psiónica, que alimentan los poderes que tienes de esta subclase. La tabla \"Dados de energía psiónica del guerrero psiónico\" muestra el tamaño del dado y la cantidad de estos dados que tienes cuando alcanzas ciertos niveles de guerrero.\n##### Dados de energía psiónica del guerrero psiónico\n| Nivel de guerrero | Tamaño del dado | Cantidad |\n|:-----------------:|:---------------:|:--------:|\n|         3         |       d6        |    4     |\n|         5         |       d8        |    6     |\n|         9         |       d8        |    8     |\n|        11         |       d10       |    8     |\n|        13         |       d10       |   10     |\n|        17         |       d12       |   12     |\nCualquier rasgo de esta subclase que emplee dados de energía psiónica utiliza solamente los dados de esta subclase. Algunos de tus poderes gastan un dado de energía psiónica, tal y como se especifica en la correspondiente descripción, por lo que no podrás usar un poder que requiera emplear un dado si ya los has gastado todos.\nRecuperas uno de tus dados de energía psiónica tras finalizar un descanso corto y todos tras finalizar un descanso largo.\n\n***Campo protector.*** Cuando tú u otra criatura que puedas ver a 9 m (30 pies) o menos de ti recibáis daño, puedes usar una reacción para gastar un dado de energía psiónica; tira el dado y reduce el daño sufrido en una cantidad igual al resultado más tu modificador por Inteligencia (el daño se reduce en 1 como mínimo), ya que creas un escudo temporal de fuerza telequinética.\n\n***Golpe psiónico.*** Puedes impulsar tus armas con fuerza psiónica. Una vez en cada uno de tus turnos, inmediatamente después de acertar a un objetivo que esté a 9 m (30 pies) o menos de ti con un ataque e infligirle daño con un arma, puedes gastar un dado de energía psiónica, tirarlo e infligir una cantidad de daño de fuerza al objetivo igual al resultado más tu modificador por Inteligencia.\n\n***Movimiento telequinético.*** Puedes mover objetos o criaturas con la mente. Como acción de magia, elige un objetivo que puedas ver a 9 m (30 pies) o menos de ti; deberá ser un objeto suelto Grande o más pequeño o una criatura voluntaria que no seas tú. Transportas al objetivo hasta 9 m (30 pies) a un espacio sin ocupar que puedas ver. Como alternativa, si se trata de un objeto Diminuto, puedes moverlo hacia tu mano o desde ella.\nCuando lleves a cabo esta acción, no podrás volver a hacerla hasta que finalices un descanso corto o largo, a menos que gastes un dado de energía psiónica (no requiere acción) para restablecer su uso.",
            tipoAccion: "accion",
            subclase: "Guerrero Psiónico",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 7,
            nombre: "Adepto telequinético",
            descripcion: "Has dominado nuevas formas de usar tus habilidades telequinéticas, que se detallan a continuación.\n\n***Salto psiónico.*** Como acción adicional, obtienes una velocidad volando igual al doble de tu velocidad hasta el final del turno actual. Cuando lleves a cabo esta acción adicional, no podrás volver a hacerla hasta que finalices un descanso corto o largo, a menos que gastes un dado de energía psiónica (no requiere acción) para restablecer su uso.\n\n***Empujón telequinético.*** Cuando inflijas daño a un objetivo con tu Golpe psiónico, puedes obligarlo a hacer una tirada de salvación de Fuerza (CD 8 más tu modificador por Inteligencia y tu bonificador por competencia). Si la falla, puedes darle el estado de derribado o transportarlo hasta 3 m (10 pies) en horizontal.",
            tipoAccion: "accion_adicional",
            subclase: "Guerrero Psiónico",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 10,
            nombre: "Mente robusta",
            descripcion: "Tienes resistencia al daño psíquico. Además, si comienzas tu turno con el estado de asustado o hechizado, puedes gastar un dado de energía psiónica (no requiere acción) y poner fin a todos los efectos que te causen dichos estados.",
            tipoAccion: "pasivo",
            subclase: "Guerrero Psiónico"
          },
          {
            nivel: 15,
            nombre: "Bastión de fuerza",
            descripcion: "Puedes proteger a los demás o a ti con fuerza telequinética. Como acción adicional, puedes elegir criaturas, incluyéndote a ti, que estén a 9 m (30 pies) o menos de ti, hasta una cantidad de criaturas igual a tu modificador por Inteligencia (mínimo una criatura). Cada una de las criaturas elegidas tendrá cobertura media durante 1 minuto o hasta que tengas el estado de incapacitado.\nCuando uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes un dado de energía psiónica (no requiere acción) para restablecer su uso.",
            tipoAccion: "accion_adicional",
            subclase: "Guerrero Psiónico",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 18,
            nombre: "Maestro telequinético",
            descripcion: "Siempre tienes el conjuro *telequinesis* preparado. Con este rasgo, puedes lanzarlo sin un espacio de conjuro ni componentes, y tu aptitud mágica para hacerlo es la Inteligencia. En cada uno de tus turnos en los que mantengas la concentración en el conjuro, incluido el turno en el que lo lances, podrás realizar un ataque con un arma como acción adicional.\nCuando lances el conjuro con este rasgo, no podrás volver a hacerlo de esta forma hasta que finalices un descanso largo, a menos que gastes un dado de energía psiónica (no requiere acción) para restablecer su uso.",
            tipoAccion: "accion_adicional",
            subclase: "Guerrero Psiónico",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
    ]
  },
  {
    id: "hechicero",
    nombre: "Hechicero",
    descripcion: "Un canalizador nato de la magia pura cuya hechicería brota de un linaje dracónico, toque caótico o influencia planar.",
    dadoGolpe: "d6",
    caracteristicasPrimarias: ["carisma","constitucion"],
    salvacionesCompetentes: ["constitucion","carisma"],
    competenciasArmaduras: [],
    competenciasArmas: ["Armas Sencillas"],
    competenciasHerramientas: [],
    opcionesHabilidades: {"cantidad":2,"opciones":["arcanos","engaño","perspicacia","intimidacion","persuasion","religion"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Foco arcano, 2 Dagas, Paquete de Dungeoneer y 28 PO","opcionB":"(B) 70 PO en monedas para comprar equipo"},
    configuracionMagica: {"tipoLanzador":"completo","habilidadConjuro":"carisma","modeloConjuros":"preparados","nivelInicio":1},
    rasgos: [
      {
        nivel: 1,
        nombre: "Lanzamiento de conjuros",
        descripcion: "Recurriendo a tu magia innata, puedes lanzar conjuros. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información presentada a continuación detalla cómo usar esas reglas con los conjuros de hechicero, que encontrarás más adelante en la lista de conjuros de hechicero de la descripción de la clase.\n\n***Trucos.*** Conoces cuatro trucos de tu elección escogidos de entre los de la lista de conjuros de hechicero. Se recomiendan *luz*, *prestidigitación*, *agarre electrizante* y *estallido hechicero*. Cada vez que subas un nivel de hechicero, puedes sustituir uno de tus trucos por otro truco de tu elección de la lista de conjuros de hechicero.\nCuando alcances los niveles 4 y 10 de hechicero, aprenderás otro truco de tu elección de la lista de conjuros de hechicero, como se muestra en la columna \"Trucos\" de la tabla \"Rasgos de hechicero\".\n\n***Espacios de conjuro.*** La tabla \"Rasgos de hechicero\" muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios utilizados tras finalizar un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas la lista de conjuros de nivel 1 y superiores que están disponibles para que los lances con este rasgo. Para empezar, elige dos conjuros de nivel 1 de la lista de conjuros de hechicero. Se recomiendan *manos ardientes* y *detectar magia*.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de hechicero, como se muestra en la columna \"Conjuros preparados\" de la tabla \"Rasgos de hechicero\". Cuando ese número aumente, elige conjuros adicionales de la lista de conjuros de hechicero hasta que el número de conjuros de tu lista coincida con el número de la tabla. Los conjuros elegidos deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un hechicero de nivel 3, tu lista de conjuros preparados puede incluir seis conjuros de hechicero de niveles 1 o 2 en cualquier combinación.\nSi otro rasgo de hechicero te proporciona conjuros que siempre tienes preparados, esos conjuros no cuentan para el total que puedes preparar con este rasgo, pero sí que cuentan como conjuros de hechicero para ti.\n\n***Cambiar los conjuros preparados.*** Cada vez que subas un nivel de hechicero, puedes reemplazar un conjuro de tu lista por otro conjuro de hechicero para el que tengas espacios de conjuro.\n\n***Aptitud mágica.*** El Carisma es tu aptitud mágica en lo que respecta a tus conjuros de hechicero.\n\n***Canalizador mágico.*** Puedes utilizar un *canalizador arcano* como canalizador mágico para tus conjuros de hechicero.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 1,
        nombre: "Hechicería innata",
        descripcion: "Un suceso en tu pasado dejó una marca indeleble en ti, infundiéndote una magia latente. Como acción adicional, puedes desatar esa magia durante 1 minuto, tiempo durante el cual obtienes los siguientes beneficios:\n- La CD de salvación de tus conjuros de hechicero aumenta en 1.\n- Tienes ventaja en las tiradas de ataque de los conjuros de hechicero que lances.\nPuedes usar este rasgo dos veces y recuperas todos los usos gastados tras finalizar un descanso largo.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Fuente de magia",
        descripcion: "Puedes recurrir al manantial de magia de tu interior. Este manantial se representa mediante los puntos de hechicería, que te permiten crear una variedad de efectos mágicos.\nTienes 2 puntos de hechicería y obtienes más a medida que alcanzas niveles superiores, como se muestra en la columna \"Puntos de hechicería\" de la tabla \"Rasgos de hechicero\". No puedes tener más puntos de hechicería que el número mostrado en la tabla para tu nivel. Recuperas todos los puntos de hechicería gastados tras finalizar un descanso largo.\nPuedes usar tus puntos de hechicería para alimentar las opciones a continuación, junto con otros rasgos, como Metamagia, que emplean dichos puntos.\n\n***Convertir espacios de conjuro en puntos de hechicería.*** Puedes gastar un espacio de conjuro para obtener una cantidad de puntos de hechicería igual al nivel del espacio (no requiere acción).\n\n***Crear espacios de conjuro.*** Como acción adicional, puedes transformar puntos de hechicería no gastados en un espacio de conjuro. La tabla \"Crear espacios de conjuro\" muestra el coste de crear un espacio de conjuro de un nivel determinado y detalla el nivel mínimo de hechicero que debes tener para crearlo. No puedes crear un espacio de conjuro de nivel superior a 5.\nCualquier espacio de conjuro que crees con este rasgo desaparece cuando finalizas un descanso largo.\n##### Crear espacios de conjuro\n| Nivel del espacio de conjuro | Coste en puntos de hechicería | Nivel mín. de hechicero |\n|:----------------------------:|:-----------------------------:|:-----------------------:|\n|              1               |               2               |            2            |\n|              2               |               3               |            3            |\n|              3               |               5               |            5            |\n|              4               |               6               |            7            |\n|              5               |               7               |            9            |",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => niv,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Metamagia",
        descripcion: "Dado que tu magia fluye desde tu interior, puedes alterar tus conjuros para adaptarlos a tus necesidades; ganas dos opciones de Metamagia de tu elección de \"Opciones de metamagia\", más adelante en la descripción de esta clase. Usas las opciones elegidas para modificar temporalmente los conjuros que lanzas. Para usar una opción, debes gastar la cantidad de puntos de hechicería que cuesta.\nSolo puedes utilizar una opción de Metamagia en un conjuro cuando lo lanzas, a menos que se indique lo contrario en una de esas opciones.\nCada vez que subas un nivel de hechicero, puedes sustituir una de tus opciones de Metamagia por otra que no conozcas. Obtienes dos opciones más en el nivel 10 de hechicero y otras dos en el nivel 17.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 2,
        nombre: "Opciones de metamagia",
        descripcion: "Las siguientes opciones están disponibles para tu rasgo Metamagia. Las opciones se presentan en orden alfabético.\n\n***Conjuro acelerado.*** *Coste: 2 puntos de hechicería*\nCuando lances un conjuro que tenga un tiempo de lanzamiento de una acción, puedes gastar 2 puntos de hechicería para cambiar el tiempo de lanzamiento a una acción adicional para este lanzamiento. No puedes modificar un conjuro de esta manera si ya has lanzado un conjuro de nivel 1 o superior en el turno actual, ni puedes lanzar un conjuro de nivel 1 o superior en este turno tras modificar un conjuro de esta forma.\n\n***Conjuro ampliado.*** *Coste: 2 puntos de hechicería*\nCuando lances un conjuro que obligue a una criatura a hacer una tirada de salvación, puedes gastar 2 puntos de hechicería para imponer desventaja a un objetivo del conjuro en las salvaciones contra el conjuro.\n\n***Conjuro buscador.*** *Coste: 1 punto de hechicería*\nSi haces una tirada de ataque para un conjuro y fallas, puedes gastar 1 punto de hechicería para repetir el d20, y deberás usar el nuevo resultado .\nPuedes usar Conjuro buscador incluso si ya has utilizado una opción de Metamagia diferente durante el lanzamiento del conjuro.\n\n***Conjuro cauto.*** *Coste: 1 punto de hechicería*\nCuando lances un conjuro que obligue a otras criaturas a hacer una tirada de salvación, puedes proteger a algunas de esas criaturas de toda la fuerza del conjuro. Para hacerlo, gasta 1 punto de hechicería y elige una cantidad de esas criaturas hasta tu modificador por Carisma (mínimo una criatura). Una criatura elegida supera automáticamente su tirada de salvación contra el conjuro y no sufre ningún daño si normalmente sufriría la mitad de daño tras una salvación exitosa.\n\n***Conjuro distante.*** *Coste: 1 punto de hechicería*\nCuando lances un conjuro que tenga un alcance de al menos 1,5 m (5 pies), puedes gastar 1 punto de hechicería para duplicar el alcance del conjuro. O bien, cuando lances un conjuro que tenga un alcance de Toque, puedes gastar 1 punto de hechicería para hacer que el alcance del conjuro sea de 9 m (30 pies).\n\n***Conjuro duplicado.*** *Coste: 1 punto de hechicería*\nCuando lances un conjuro, como *hechizar persona*, que pueda lanzarse con un espacio de conjuro de nivel superior para tener como objetivo a una criatura adicional, puedes gastar 1 punto de hechicería para aumentar el nivel efectivo del conjuro en 1.\n\n***Conjuro extendido.*** *Coste: 1 punto de hechicería*\nCuando lances un conjuro que tenga una duración de 1 minuto o más, puedes gastar 1 punto de hechicería para duplicar su duración hasta una duración máxima de 24 horas.\nSi el conjuro afectado requiere concentración, tienes ventaja en cualquier tirada de salvación que hagas para mantener esa concentración.\n\n***Conjuro potenciado.*** *Coste: 1 punto de hechicería*\nCuando tires el daño de un conjuro, puedes gastar 1 punto de hechicería para volver a tirar una cantidad de dados de daño hasta tu modificador por Carisma (mínimo de uno), y deberás usar las nuevas tiradas.\nPuedes usar Conjuro potenciado incluso si ya has utilizado una opción de Metamagia diferente durante el lanzamiento del conjuro.\n\n***Conjuro sutil.*** *Coste: 1 punto de hechicería*\nCuando lances un conjuro, puedes gastar 1 punto de hechicería para lanzarlo sin componentes verbales, somáticos ni materiales, salvo aquellos componentes materiales que sean consumidos por el conjuro o que tengan un coste especificado en el mismo.\n\n***Conjuro transmutado.*** *Coste: 1 punto de hechicería*\nCuando lances un conjuro que inflija un tipo de daño de la siguiente lista, puedes gastar 1 punto de hechicería para cambiar ese tipo de daño por otro de los tipos indicados: ácido, frío, fuego, relámpago, veneno o trueno.",
        tipoAccion: "accion_adicional"
      },
      {
        nivel: 3,
        nombre: "Subclase de hechicero",
        descripcion: "Consigues una subclase de hechicero de tu elección. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de hechicero. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de hechicero e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de hechicero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Restauración hechicera",
        descripcion: "Cuando finalices un descanso corto, puedes recuperar puntos de hechicería gastados, pero no más de una cantidad igual a la mitad de tu nivel de hechicero (redondeando hacia abajo). Una vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_corto"
      },
      {
        nivel: 6,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de hechicero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Hechicería encarnada",
        descripcion: "Si no te quedan usos de Hechicería innata, puedes usarla si gastas 2 puntos de hechicería al realizar la acción adicional para activarla.\nAdemás, mientras tu rasgo Hechicería innata esté activo, puedes usar hasta dos de tus opciones de Metamagia en cada conjuro que lances.",
        tipoAccion: "accion_adicional"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Metamagia",
        descripcion: "Dado que tu magia fluye desde tu interior, puedes alterar tus conjuros para adaptarlos a tus necesidades; ganas dos opciones de Metamagia de tu elección de la sección \"Opciones de metamagia\", más adelante en la descripción de esta clase.\nSolo puedes utilizar una opción de Metamagia en un conjuro cuando lo lanzas, a menos que se indique lo contrario en una de esas opciones.\nCada vez que subas un nivel de hechicero, puedes sustituir una de tus opciones de Metamagia por otra que no conozcas.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de hechicero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 17,
        nombre: "Metamagia",
        descripcion: "Dado que tu magia fluye desde tu interior, puedes alterar tus conjuros para adaptarlos a tus necesidades; ganas dos opciones de Metamagia de tu elección de la sección \"Opciones de metamagia\", más adelante en la descripción de esta clase.\nSolo puedes utilizar una opción de Metamagia en un conjuro cuando lo lanzas, a menos que se indique lo contrario en una de esas opciones.\nCada vez que subas un nivel de hechicero, puedes sustituir una de tus opciones de Metamagia por otra que no conozcas.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 18,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de hechicero.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don del viaje dimensional.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Apoteosis arcana",
        descripcion: "Mientras tu rasgo Hechicería innata esté activo, puedes usar una opción de Metamagia en cada uno de tus turnos sin gastar puntos de hechicería en ella.",
        tipoAccion: "pasivo"
      },
    ],
    subclases: [
      {
        id: "hechiceria_aberrante",
        clasePadre: "hechicero",
        nombre: "Hechicería Aberrante",
        descripcion: "Una influencia alienígena ha envuelto sus tentáculos alrededor de tu mente, otorgándote poder psiónico. Ahora puedes tocar otras mentes con ese poder y alterar el mundo a tu alrededor. ¿Brillará este poder desde tu interior como un faro de esperanza para los demás? ¿O serás un terror para aquellos que sientan la punzada de tu mente?\nQuizás un viento psíquico del Plano Astral llevó energía psiónica hacia ti, o estuviste expuesto a la influencia deformadora del Reino Lejano. De manera alternativa, te implantaron un renacuajo de azotamentes, pero tu transformación en uno nunca ocurrió; ahora el poder psiónico del renacuajo es tuyo. De cualquier forma en que hayas adquirido este poder, tu mente arde con él.",
        lema: "Empuña un poder psiónico antinatural",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Brazos de Hadar","Susurros disonantes","Calmar emociones","Detectar pensamientos"],"trucos":["Astilla mental"]},{"nivelClase":5,"conjuros":["Hambre de Hadar","Envío"]},{"nivelClase":7,"conjuros":["Tentáculos negros de Evard","Transformar"]},{"nivelClase":9,"conjuros":["Contacto extraplanar","Enlace telepático de Rary"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros psiónicos",
            descripcion: "Cuando alcances un nivel de hechicero especificado en la tabla \"Conjuros psiónicos\", a partir de entonces siempre tendrás preparados los conjuros indicados.\n##### Conjuros psiónicos\n| Nivel de hechicero | Conjuros preparados                                                                               |\n|:------------------:|---------------------------------------------------------------------------------------------------|\n|         3          | *brazos de Hadar*, *calmar emociones*, *detectar pensamientos*, *susurros disonantes*, *astilla mental* |\n|         5          | *hambre de Hadar*, *enviar mensaje*                                                               |\n|         7          | *tentáculos negros de Evard*, *invocar aberración*                                                |\n|         9          | *vínculo telepático de Rary*, *telequinesis*                                                      |",
            tipoAccion: "pasivo",
            subclase: "Hechicería Aberrante"
          },
          {
            nivel: 3,
            nombre: "Habla telepática",
            descripcion: "Puedes formar una conexión telepática entre tu mente y la de otra persona. Como acción adicional, elige a una criatura que puedas ver a 9 m (30 pies) o menos de ti. Tú y la criatura elegida podéis comunicaros telepáticamente mientras os encontréis a una cantidad de kilómetros (millas) de distancia igual a tu modificador por Carisma (mínimo 1,5 km / 1 milla). Para entenderse mutuamente, ambos debéis usar mentalmente un idioma que el otro conozca.\nLa conexión telepática dura una cantidad de minutos igual a tu nivel de hechicero. Termina antes de tiempo si usas esta aptitud para formar una conexión con una criatura diferente.",
            tipoAccion: "accion_adicional",
            subclase: "Hechicería Aberrante"
          },
          {
            nivel: 6,
            nombre: "Hechicería psiónica",
            descripcion: "Cuando lances cualquier conjuro de nivel 1 o superior de tu rasgo Conjuros psiónicos, puedes lanzarlo gastando un espacio de conjuro como de costumbre o gastando una cantidad de puntos de hechicería igual al nivel del conjuro. Si lanzas el conjuro usando puntos de hechicería, no requiere componentes verbales ni somáticos, y no requiere componentes materiales a menos que sean consumidos por el conjuro o tengan un coste especificado en él.",
            tipoAccion: "pasivo",
            subclase: "Hechicería Aberrante"
          },
          {
            nivel: 6,
            nombre: "Defensas psíquicas",
            descripcion: "Tienes resistencia al daño psíquico, y tienes ventaja en las tiradas de salvación para evitar o poner fin a los estados de hechizado o asustado.",
            tipoAccion: "pasivo",
            subclase: "Hechicería Aberrante"
          },
          {
            nivel: 14,
            nombre: "Revelación de la carne",
            descripcion: "Puedes desatar la verdad aberrante oculta en tu interior. Como acción adicional, puedes gastar 1 o más puntos de hechicería para alterar mágicamente tu cuerpo durante 10 minutos. Por cada punto de hechicería que gastes, obtienes uno de los siguientes beneficios de tu elección, cuyos efectos duran hasta que termine la alteración.\n\n***Adaptación acuática.*** Obtienes una velocidad nadando igual al doble de tu velocidad y puedes respirar bajo el agua. Te crecen branquias en el cuello o tras las orejas, y tus dedos se vuelven palmeados o te crecen cilios ondulantes.\n\n***Vuelo reluciente.*** Obtienes una velocidad volando igual a tu velocidad y puedes flotar. Mientras vuelas, tu piel brilla con mucosidad o una luz de otro mundo.\n\n***Ver lo invisible.*** Puedes ver a cualquier criatura invisible a 18 m (60 pies) o menos de ti que no esté tras cobertura completa. Tus ojos también se vuelven negros o se convierten en tentáculos sensoriales serpenteantes.\n\n***Movimiento vermiforme.*** Tu cuerpo, junto con cualquier equipo que lleves puesto o transportes, se vuelve viscoso y maleable. Puedes moverte a través de cualquier espacio tan estrecho como 2,5 cm (1 pulgada), y puedes gastar 1,5 m (5 pies) de movimiento para escapar de ataduras no mágicas o del estado de agarrado.",
            tipoAccion: "accion_adicional",
            subclase: "Hechicería Aberrante"
          },
          {
            nivel: 18,
            nombre: "Implosión deformadora",
            descripcion: "Puedes desatar una anomalía que deforma el espacio. Como acción de magia, te teletransportas a un espacio sin ocupar que puedas ver a 36 m (120 pies) o menos de ti. Inmediatamente después de que desaparezcas, cada criatura a 9 m (30 pies) o menos del espacio que dejaste debe hacer una tirada de salvación de Fuerza contra tu CD de salvación de conjuros. Si falla la tirada, la criatura sufre 3d10 de daño de fuerza y es arrastrada en línea recta hacia el espacio que dejaste, terminando en un espacio sin ocupar lo más cerca posible de tu posición anterior. Si la supera, sufrirá solo la mitad de daño.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes 5 puntos de hechicería (no requiere acción) para restaurar su uso.",
            tipoAccion: "accion",
            subclase: "Hechicería Aberrante",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "3d10"
          },
        ]
      },
      {
        id: "hechiceria_del_mecanismo_de_relojeria",
        clasePadre: "hechicero",
        nombre: "Hechicería del Mecanismo de Relojería",
        descripcion: "La fuerza cósmica del orden te ha impregnado de magia. Ese poder surge de Mechanus o de un reino similar: un plano de existencia moldeado enteramente por la eficiencia del mecanismo de relojería. Tú o alguien de tu linaje podríais haberos visto envueltos en las maquinaciones de los modrons, los seres ordenados que habitan Mechanus. Quizás tu antepasado incluso participó en la Gran Marcha de los Modrons. Sea cual sea su origen en tu interior, el poder del orden puede parecer extraño a los demás, pero para ti, es parte de un sistema vasto y glorioso.",
        lema: "Canaliza las fuerzas cósmicas del orden",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Alarma","Armadura de Agathys","Auxilio","Restablecimiento menor"]},{"nivelClase":5,"conjuros":["Disipar magia","Glifo de protección"]},{"nivelClase":7,"conjuros":["Libertad de movimiento","Invulnerabilidad de Otiluke"]},{"nivelClase":9,"conjuros":["Restablecimiento mayor","Muro de fuerza"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros de relojería",
            descripcion: "Cuando alcances un nivel de hechicero especificado en la tabla \"Conjuros de relojería\", a partir de entonces siempre tendrás preparados los conjuros indicados.\n##### Conjuros de relojería\n| Nivel de hechicero | Conjuros preparados                                                    |\n|:------------------:|------------------------------------------------------------------------|\n|         3          | *auxilio*, *alarma*, *restablecimiento menor*, *protección contra el mal y el bien* |\n|         5          | *disipar magia*, *protección contra energía*                          |\n|         7          | *libertad de movimiento*, *invocar constructo*                         |\n|         9          | *restablecimiento mayor*, *muro de fuerza*                             |\nAdemás, consulta la tabla \"Manifestaciones del orden\" y elige o determina al azar una forma en que se manifiesta tu conexión con el orden mientras lanzas cualquiera de tus conjuros de hechicero.\n##### Manifestaciones del orden\n| 1d6 | Manifestación                                                                                        |\n|:---:|------------------------------------------------------------------------------------------------------|\n|  1  | Ruedas dentadas espectrales flotan detrás de ti.                                                              |\n|  2  | Las manecillas de un reloj giran en tus ojos.                                                                 |\n|  3  | Tu piel brilla con un brillo cobrizo.                                                                         |\n|  4  | Ecuaciones flotantes y objetos geométricos se superponen a tu cuerpo.                                         |\n|  5  | Tu canalizador mágico adopta temporalmente la forma de un mecanismo de relojería diminuto.                    |\n|  6  | El tictac de engranajes o el tañido de un reloj pueden ser escuchados por ti y los afectados por tu magia.     |",
            tipoAccion: "pasivo",
            subclase: "Hechicería del Mecanismo de Relojería",
            formulaDados: "1d6"
          },
          {
            nivel: 3,
            nombre: "Restaurar equilibrio",
            descripcion: "Tu conexión con el plano del orden absoluto te permite igualar momentos caóticos. Cuando una criatura que puedas ver a 18 m (60 pies) o menos de ti esté a punto de hacer una prueba de d20 con ventaja o desventaja, puedes llevar a cabo una reacción para evitar que la tirada se vea afectada por la ventaja o la desventaja.\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Carisma (mínimo una vez), y recuperas todos los usos gastados tras finalizar un descanso largo.",
            tipoAccion: "pasivo",
            subclase: "Hechicería del Mecanismo de Relojería",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 6,
            nombre: "Bastión de la ley",
            descripcion: "Puedes recurrir a la gran ecuación de la existencia para imbuir a una criatura con un escudo resplandeciente de orden. Como acción de magia, puedes gastar de 1 a 5 puntos de hechicería para crear una salvaguarda mágica alrededor de ti o de otra criatura que puedas ver a 9 m (30 pies) o menos de ti. La salvaguarda está representada por una cantidad de d8 igual a la cantidad de puntos de hechicería gastados para crearla. Cuando la criatura protegida sufra daño, puede gastar una cantidad de esos dados, tirarlos y reducir el daño sufrido en el total obtenido en esos dados.\nLa salvaguarda dura hasta que finalices un descanso largo o hasta que vuelvas a usar este rasgo.",
            tipoAccion: "accion",
            subclase: "Hechicería del Mecanismo de Relojería",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 14,
            nombre: "Trance del orden",
            descripcion: "Ganas la capacidad de alinear tu consciencia con los cálculos interminables de Mechanus. Como acción adicional, puedes entrar en este estado durante 1 minuto. Mientras dure, las tiradas de ataque contra ti no pueden beneficiarse de ventaja, y siempre que hagas una prueba de d20, puedes tratar una tirada de 9 o inferior en el d20 como un 10.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes 5 puntos de hechicería (no requiere acción) para restaurar su uso.",
            tipoAccion: "accion_adicional",
            subclase: "Hechicería del Mecanismo de Relojería",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 18,
            nombre: "Cabalgata de relojería",
            descripcion: "Invocas momentáneamente espíritus del orden para purgar el desorden a tu alrededor. Como acción de magia, invocas a los espíritus en un cubo de 9 m (30 pies) que se origina en ti. Los espíritus parecen modrons u otros constructos de tu elección. Los espíritus son intangibles e invulnerables, y generan los efectos a continuación dentro del cubo antes de desaparecer. Una vez que uses esta acción, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes 7 puntos de hechicería (no requiere acción) para restaurar su uso.\n\n***Sanar.*** Los espíritus restauran hasta 100 puntos de golpe, divididos como elijas entre cualquier cantidad de criaturas de tu elección en el cubo.\n\n***Reparar.*** Cualquier objeto dañado que se encuentre enteramente dentro del cubo se repara instantáneamente.\n\n***Disipar.*** Todo conjuro de nivel 6 o inferior finaliza en las criaturas y objetos de tu elección en el cubo.",
            tipoAccion: "accion",
            subclase: "Hechicería del Mecanismo de Relojería",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "hechiceria_draconica",
        clasePadre: "hechicero",
        nombre: "Hechicería Dracónica",
        descripcion: "Tu magia innata proviene del don de un dragón. Quizás un dragón anciano que encaraba la muerte legó parte de su poder mágico a ti o a tu antepasado. Podrías haber absorbido magia de un lugar imbuido del poder de los dragones. O quizás manipulaste un tesoro del tesoro acumulado de un dragón impregnado de poder dracónico. O podrías descender directamente de un dragón.",
        lema: "Respira la magia de los dragones",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Manos ardientes","Rayo de hechicería","Escudo de fuego","Muro de fuego"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Resiliencia dracónica",
            descripcion: "La magia de tu cuerpo manifiesta rasgos físicos de tu don dracónico. Tus puntos de golpe máximos aumentan en 3, y aumentan en 1 cada vez que obtienes otro nivel de hechicero.\nPartes de tu cuerpo también se cubren de escamas similares a las de un dragón. Mientras no lleves armadura, tu clase de armadura base es igual a 10 más tus modificadores por Destreza y Carisma.",
            tipoAccion: "pasivo",
            subclase: "Hechicería Dracónica"
          },
          {
            nivel: 3,
            nombre: "Conjuros dracónicos",
            descripcion: "Cuando alcances un nivel de hechicero especificado en la tabla \"Conjuros dracónicos\", a partir de entonces siempre tendrás preparados los conjuros indicados.\n##### Conjuros dracónicos\n| Nivel de hechicero | Conjuros preparados                                              |\n|:------------------:|------------------------------------------------------------------|\n|         3          | *alterar el propio aspecto*, *orbe cromático*, *orden imperiosa*, *aliento de dragón* |\n|         5          | *miedo*, *volar*                                                 |\n|         7          | *ojo arcano*, *hechizar monstruo*                                |\n|         9          | *sabiduría popular*, *invocar dragón*                            |",
            tipoAccion: "pasivo",
            subclase: "Hechicería Dracónica"
          },
          {
            nivel: 6,
            nombre: "Afinidad elemental",
            descripcion: "Tu magia dracónica posee afinidad con un tipo de daño asociado con los dragones. Elige uno de esos tipos: ácido, frío, fuego, relámpago o veneno.\nTienes resistencia a ese tipo de daño y, cuando lances un conjuro que inflija daño de ese tipo, puedes sumar tu modificador por Carisma a una tirada de daño de ese conjuro.",
            tipoAccion: "pasivo",
            subclase: "Hechicería Dracónica"
          },
          {
            nivel: 14,
            nombre: "Alas de dragón",
            descripcion: "Como acción adicional, puedes hacer que alas dracónicas broten de tu espalda. Las alas duran 1 hora o hasta que las disipes (no requiere acción). Mientras duren, tienes una velocidad volando de 18 m (60 pies).\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes 3 puntos de hechicería (no requiere acción) para restaurar su uso.",
            tipoAccion: "accion_adicional",
            subclase: "Hechicería Dracónica",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 18,
            nombre: "Compañero dragón",
            descripcion: "Puedes lanzar *invocar dragón* sin componentes materiales. También puedes lanzarlo una vez sin gastar un espacio de conjuro, y recuperas la capacidad de lanzarlo de esta forma cuando finalices un descanso largo.\nSiempre que comiences a lanzar el conjuro, puedes modificarlo para que no requiera concentración. Si lo haces, la duración del conjuro pasa a ser de 1 minuto para ese lanzamiento.",
            tipoAccion: "pasivo",
            subclase: "Hechicería Dracónica",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "hechiceria_de_magia_salvaje",
        clasePadre: "hechicero",
        nombre: "Hechicería de Magia Salvaje",
        descripcion: "Tu magia innata surge de las fuerzas del caos que subyacen al orden de la creación. Tú o un antepasado podríais haber soportado la exposición a la magia en estado puro, quizás a través de un portal planar que conducía al Limbo o a los Planos Elementales. Quizás fuiste bendecido por un ser feérico o marcado por un demonio. O tu magia podría ser un golpe del azar sin causa aparente. Sea cual sea su fuente, esta magia se agita en tu interior, esperando cualquier vía de escape.",
        lema: "Desata la magia caótica",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Oleada de magia salvaje",
            descripcion: "El lanzamiento de tus conjuros puede desatar oleadas de magia indómita. Una vez por turno, puedes tirar 1d20 inmediatamente después de lanzar un conjuro de hechicero con un espacio de conjuro. Si sacas un 20, tira en la tabla \"Oleada de magia salvaje\" para crear un efecto mágico.\nSi el efecto mágico es un conjuro, es demasiado salvaje para verse afectado por tu Metamagia.\n##### Oleada de magia salvaje\n| 1d100 | Efecto |\n|:-----:|--------|\n| 01–04 | Tira en esta tabla al principio de cada uno de tus turnos durante el próximo minuto, ignorando este resultado en tiradas posteriores. |\n| 05–08 | Una criatura que sea amistosa hacia ti aparece en un espacio sin ocupar al azar a 18 m (60 pies) o menos de ti. La criatura está bajo el control del DM y desaparece 1 minuto después. Tira 1d4 para determinar la criatura: con un 1, aparece un modron duodron; con un 2, aparece un flumph; con un 3, aparece un modron monodron; con un 4, aparece un unicornio. Consulta el *Manual de monstruos* para ver el perfil de la criatura. |\n| 09–12 | Durante el próximo minuto, recuperas 5 puntos de golpe al principio de cada uno de tus turnos. |\n| 13–16 | Las criaturas tienen desventaja en las tiradas de salvación contra el siguiente conjuro que lances en el próximo minuto que requiera una tirada de salvación. |\n| 17–20 | Quedas sujeto a un efecto que dura 1 minuto a menos que su descripción indique lo contrario. Tira 1d8 para determinar el efecto: con un 1, te rodea una música etérea y tenue que solo tú y las criaturas a 1,5 m (5 pies) o menos de ti podéis oír; con un 2, tu tamaño aumenta en una categoría de tamaño; con un 3, te crece una larga barba hecha de plumas que permanece hasta que estornudes, momento en el cual las plumas explotan de tu rostro y desaparecen; con un 4, debes gritar cuando hables; con un 5, mariposas ilusorias revolotean en el aire a 3 m (10 pies) o menos de ti; con un 6, un ojo aparece en tu frente, otorgándote ventaja en las pruebas de Sabiduría (Percepción); con un 7, burbujas rosadas flotan fuera de tu boca cada vez que hablas; con un 8, tu piel se vuelve de un tono azul vibrante durante 24 horas o hasta que el efecto sea terminado por un conjuro de *eliminar maldición*. |\n| 21–24 | Durante el próximo minuto, todos tus conjuros con un tiempo de lanzamiento de una acción tienen un tiempo de lanzamiento de una acción adicional. |\n| 25–28 | Eres transportado al Plano Astral hasta el final de tu siguiente turno. Luego regresas al espacio que ocupabas anteriormente o al espacio sin ocupar más cercano si ese espacio está ocupado. |\n| 29–32 | La próxima vez que lances un conjuro que inflija daño dentro del próximo minuto, no tires los dados de daño del conjuro. En su lugar, usa el número más alto posible para cada dado de daño. |\n| 33–36 | Tienes resistencia a todo el daño durante el próximo minuto. |\n| 37–40 | Te conviertes en una planta en maceta hasta el comienzo de tu siguiente turno. Mientras eres una planta, tienes el estado de incapacitado y tienes vulnerabilidad a todo el daño. Si caes a 0 puntos de golpe, tu maceta se rompe y reviertes a tu forma habitual. |\n| 41–44 | Durante el próximo minuto, puedes teletransportarte hasta 6 m (20 pies) como acción adicional en cada uno de tus turnos. |\n| 45–48 | Tú y hasta tres criaturas de tu elección a 9 m (30 pies) o menos de ti tenéis el estado de invisible durante 1 minuto. Esta invisibilidad termina en una criatura inmediatamente después de que realice una tirada de ataque, inflija daño o lance un conjuro. |\n| 49–52 | Un escudo espectral flota cerca de ti durante el próximo minuto, otorgándote un bonificador de +2 a la CA e inmunidad a *proyectil mágico*. |\n| 53–56 | Puedes llevar a cabo una acción adicional en este turno. |\n| 57–60 | Lanzas un conjuro al azar. Si el conjuro normalmente requiere concentración, en este caso no la requiere; el conjuro dura toda su duración. Tira 1d10 para determinar el conjuro: con un 1, *confusión*; con un 2, *bola de fuego*; con un 3, *nube de oscurecimiento*; con un 4, *volar* (lanzado sobre una criatura al azar a 18 m / 60 pies o menos de ti); con un 5, *grasa*; con un 6, *levitar* (lanzado sobre ti mismo); con un 7, *proyectil mágico* (lanzado como conjuro de nivel 5); con un 8, *reflejo exacto*; con un 9, *polimorfar* (lanzado sobre ti mismo), y si fallas la tirada de salvación, te conviertes en una cabra (ver apéndice B); con un 10, *ver invisibilidad*. |\n| 61–64 | Durante el próximo minuto, cualquier objeto no mágico e inflamable que toques y que no esté siendo llevado puesto ni transportado por otra criatura estalla en llamas, sufre 1d4 de daño de fuego y arde. |\n| 65–68 | Si mueres dentro de la próxima hora, revives inmediatamente como por el conjuro *reencarnar*. |\n| 69–72 | Tienes el estado de asustado hasta el final de tu siguiente turno. El DM determina la fuente de tu miedo. |\n| 73–76 | Te teletransportas hasta 18 m (60 pies) a un espacio sin ocupar que puedas ver. |\n| 77–80 | Una criatura al azar a 18 m (60 pies) o menos de ti tiene el estado de envenenado durante 1d4 horas. |\n| 81–84 | Emites luz brillante en un radio de 9 m (30 pies) durante el próximo minuto. Cualquier criatura que termine su turno a 1,5 m (5 pies) o menos de ti tiene el estado de cegado hasta el final de su siguiente turno. |\n| 85–88 | Hasta tres criaturas de tu elección que puedas ver a 9 m (30 pies) o menos de ti sufren 1d10 de daño necrótico. Recuperas una cantidad de puntos de golpe igual a la suma del daño necrótico infligido. |\n| 89–92 | Hasta tres criaturas de tu elección que puedas ver a 9 m (30 pies) o menos de ti sufren 4d10 de daño de relámpago. |\n| 93–96 | Tú y todas las criaturas a 9 m (30 pies) o menos de ti tenéis vulnerabilidad al daño perforante durante el próximo minuto. |\n| 97–00 | Tira 1d6. Con un 1, recuperas 2d10 puntos de golpe; con un 2, un aliado de tu elección a 90 m (300 pies) o menos de ti recupera 2d10 puntos de golpe; con un 3, recuperas tu espacio de conjuro gastado de nivel más bajo; con un 4, un aliado de tu elección a 90 m (300 pies) o menos de ti recupera su espacio de conjuro gastado de nivel más bajo; con un 5, recuperas todos tus puntos de hechicería gastados; con un 6, todos los efectos de la fila 17–20 te afectan simultáneamente. |",
            tipoAccion: "accion_adicional",
            subclase: "Hechicería de Magia Salvaje",
            formulaDados: "1d20"
          },
          {
            nivel: 3,
            nombre: "Mareas de caos",
            descripcion: "Puedes manipular el caos mismo para otorgarte ventaja en una prueba de d20 antes de tirar el d20. Una vez que lo hagas, debes lanzar un conjuro de hechicero con un espacio de conjuro o finalizar un descanso largo antes de poder volver a usar este rasgo.\nSi lanzas un conjuro de hechicero con un espacio de conjuro antes de finalizar un descanso largo, tiras automáticamente en la tabla \"Oleada de magia salvaje\".",
            tipoAccion: "pasivo",
            subclase: "Hechicería de Magia Salvaje",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 6,
            nombre: "Torcer la suerte",
            descripcion: "Tienes la capacidad de alterar el destino usando tu magia salvaje. Inmediatamente después de que otra criatura que puedas ver tire el d20 para una prueba de d20, puedes llevar a cabo una reacción y gastar 1 punto de hechicería para tirar 1d4 y aplicar el número obtenido como bonificador o penalizador (a tu elección) a la tirada del d20.",
            tipoAccion: "pasivo",
            subclase: "Hechicería de Magia Salvaje",
            formulaDados: "1d4"
          },
          {
            nivel: 14,
            nombre: "Caos controlado",
            descripcion: "Obtienes una pizca de control sobre las oleadas de tu magia salvaje. Siempre que tires en la tabla \"Oleada de magia salvaje\", puedes tirar dos veces y usar cualquiera de los dos resultados.",
            tipoAccion: "pasivo",
            subclase: "Hechicería de Magia Salvaje"
          },
          {
            nivel: 18,
            nombre: "Oleada domada",
            descripcion: "Inmediatamente después de lanzar un conjuro de hechicero con un espacio de conjuro, puedes crear un efecto de tu elección de la tabla \"Oleada de magia salvaje\" en lugar de tirar en dicha tabla. Puedes elegir cualquier efecto de la tabla excepto el de la última fila, y si el efecto elegido requiere una tirada, debes realizarla.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
            tipoAccion: "pasivo",
            subclase: "Hechicería de Magia Salvaje",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
    ]
  },
  {
    id: "mago",
    nombre: "Mago",
    descripcion: "El erudito definitivo de las artes arcanas, capaz de alterar la realidad mediante el estudio meticuloso y el dominio de su libro de conjuros.",
    dadoGolpe: "d6",
    caracteristicasPrimarias: ["inteligencia","constitucion","destreza"],
    salvacionesCompetentes: ["inteligencia","sabiduria"],
    competenciasArmaduras: [],
    competenciasArmas: ["Armas Sencillas"],
    competenciasHerramientas: [],
    opcionesHabilidades: {"cantidad":2,"opciones":["arcanos","historia","perspicacia","investigacion","medicina","religion"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Libro de conjuros, Foco arcano, 2 Dagas, Paquete de Erudito y 5 PO","opcionB":"(B) 85 PO en monedas para comprar equipo"},
    configuracionMagica: {"tipoLanzador":"completo","habilidadConjuro":"inteligencia","modeloConjuros":"grimorio","nivelInicio":1},
    rasgos: [
      {
        nivel: 1,
        nombre: "Lanzamiento de conjuros",
        descripcion: "Como estudiante de la magia arcana, has aprendido a lanzar conjuros. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información presentada a continuación detalla cómo usas esas reglas con los conjuros de mago, que encontrarás más adelante en la lista de conjuros de mago de la descripción de la clase.\n\n***Trucos.*** Conoces tres trucos de mago de tu elección 2,. Se recomiendan *luz*, *mano de mago* y *rayo de escarcha*. Cada vez que finalices un descanso largo, puedes sustituir uno de tus trucos de este rasgo por otro truco de mago de tu elección.\nCuando alcances los niveles 4 y 10 de mago, aprenderás otro truco de mago de tu elección, como se muestra en la columna \"Trucos\" de la tabla \"Rasgos de mago\".\n\n***Libro de conjuros.*** Tu aprendizaje mágico culminó con la creación de un libro único: tu libro de conjuros. Es un objeto Diminuto que pesa 1,5 kg (3 libras), contiene 100 páginas y solo puedes leerlo tú o alguien que lance *identificar*. Tú determinas la apariencia y los materiales del libro, como un tomo con cantos dorados o una colección de vitela atada con cordel.\nEl libro contiene los conjuros de nivel 1 y superiores que conoces. Empieza con seis conjuros de mago de nivel 1 de tu elección. Se recomiendan *detectar magia*, *caída de pluma*, *armadura de mago*, *proyectil mágico*, *dormir* y *ola atronadora*.\nCada vez que subas un nivel de mago tras el primero, añade dos conjuros de mago de tu elección a tu libro de conjuros. Cada uno de estos conjuros debe ser de un nivel para el que tengas espacios de conjuro, como se muestra en la tabla \"Rasgos de mago\". Los conjuros son la culminación de la investigación arcana que realizas regularmente.\n\n***Espacios de conjuro.*** La tabla \"Rasgos de mago\" muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios utilizados tras finalizar un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas la lista de conjuros de nivel 1 y superiores que están disponibles para que los lances con este rasgo. Para hacerlo, elige cuatro conjuros de tu libro de conjuros. Los conjuros elegidos deben ser de un nivel para el que tengas espacios de conjuro.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de mago, como se muestra en la columna \"Conjuros preparados\" de la tabla \"Rasgos de mago\". Cada vez que ese número aumente, elige conjuros de mago adicionales hasta que el número de conjuros de tu lista coincida con el número de la tabla. Los conjuros elegidos deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un mago de nivel 3, tu lista de conjuros preparados puede incluir seis conjuros de niveles 1 y 2 en cualquier combinación, elegidos de tu libro de conjuros.\nSi otro rasgo de mago te proporciona conjuros que siempre tienes preparados, esos conjuros no cuentan para el número de conjuros que puedes preparar con este rasgo, pero por lo demás cuentan como conjuros de mago para ti.\n\n***Cambiar tus conjuros preparados.*** Cada vez que finalices un descanso largo, puedes cambiar tu lista de conjuros preparados, reemplazando cualquiera de los conjuros de ella por conjuros de tu libro de conjuros.\n\n***Aptitud mágica.*** La Inteligencia es tu aptitud mágica en lo que respecta a tus conjuros de mago.\n\n***Canalizador mágico.*** Puedes utilizar un *canalizador arcano* o tu libro de conjuros como canalizador mágico para tus conjuros de mago.\n> ##### Ampliar y sustituir un libro de conjuros\n>\n> Los conjuros que añades a tu libro de conjuros conforme subes de nivel reflejan tus investigaciones mágicas continuas, pero podrías encontrar otros conjuros durante tus aventuras que puedes añadir al libro. Por ejemplo, podrías descubrir un conjuro de mago en un *pergamino de conjuro* y luego copiarlo en tu libro de conjuros.\n>\n> ***Copiar un conjuro en el libro.*** Cuando encuentres un conjuro de mago de nivel 1 o superior, puedes copiarlo en tu libro de conjuros si es de un nivel que puedas preparar y tienes tiempo para copiarlo. Por cada nivel del conjuro, la transcripción lleva 2 horas y cuesta 50 po. Después podrás preparar el conjuro como los demás conjuros de tu libro de conjuros.\n>\n> ***Copiar el libro.*** Puedes copiar un conjuro de tu libro de conjuros en otro libro. Es como copiar un nuevo conjuro en tu libro de conjuros pero más rápido, ya que ya sabes cómo lanzarlo. Solo necesitas gastar 1 hora y 10 po por cada nivel del conjuro copiado.\n>\n> Si pierdes tu libro de conjuros, puedes usar el mismo procedimiento para transcribir los conjuros de mago que tengas preparados en un nuevo libro de conjuros. Completar el resto del nuevo libro requerirá que encuentres nuevos conjuros para hacerlo. Por esta razón, muchos magos conservan un libro de conjuros de reserva.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 1,
        nombre: "Adepto ritual",
        descripcion: "Puedes lanzar cualquier conjuro como un ritual si tiene la etiqueta \"Ritual\" y está en tu libro de conjuros. No es necesario que tengas el conjuro preparado, pero debes leer del libro para lanzarlo de esta manera.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 1,
        nombre: "Recuperación arcana",
        descripcion: "Puedes recuperar parte de tu energía mágica estudiando tu libro de conjuros. Cuando finalices un descanso corto, puedes elegir espacios de conjuro gastados para recuperarlos. Los espacios de conjuro pueden tener un nivel combinado que sea igual o inferior a la mitad de tu nivel de mago (redondeando hacia arriba), y ninguno de ellos puede ser de nivel 6 o superior. Por ejemplo, si eres un mago de nivel 4, puedes recuperar hasta dos niveles de espacios de conjuro, recuperando un espacio de conjuro de nivel 2 o dos espacios de conjuro de nivel 1.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_corto"
      },
      {
        nivel: 2,
        nombre: "Erudito",
        descripcion: "Mientras estudiabas magia, también te especializaste en otro campo de estudio. Elige una de las siguientes habilidades en las que tengas competencia: Conocimiento arcano, Historia, Investigación, Medicina, Naturaleza o Religión. Tienes Pericia en la habilidad elegida.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 3,
        nombre: "Subclase de mago",
        descripcion: "Consigues una subclase de mago de tu elección. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de mago. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de mago e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de mago.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Memorizar conjuro",
        descripcion: "Cada vez que finalices un descanso corto, puedes estudiar tu libro de conjuros y reemplazar uno de los conjuros de mago de nivel 1 o superior que tengas preparados para tu rasgo Lanzamiento de conjuros por otro conjuro de nivel 1 o superior del libro.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_corto"
      },
      {
        nivel: 6,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de mago.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de mago.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de mago.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 18,
        nombre: "Maestría en conjuros",
        descripcion: "Has alcanzado tal dominio sobre ciertos conjuros que puedes lanzarlos a voluntad. Elige un conjuro de nivel 1 y otro de nivel 2 de tu libro de conjuros que tengan un tiempo de lanzamiento de una acción. Siempre tienes esos conjuros preparados y puedes lanzarlos en su nivel más bajo sin gastar un espacio de conjuro. Para lanzar cualquiera de los dos conjuros a un nivel superior, debes gastar un espacio de conjuro.\nCada vez que finalices un descanso largo, puedes estudiar tu libro de conjuros y reemplazar uno de esos conjuros por otro conjuro elegible del mismo nivel del libro.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don de la recuperación de conjuros.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Conjuros predilectos",
        descripcion: "Elige dos conjuros de nivel 3 de tu libro de conjuros como tus conjuros predilectos. Siempre tienes estos conjuros preparados y puedes lanzar cada uno de ellos una vez a nivel 3 sin gastar un espacio de conjuro. Cuando lo hagas, no podrás volver a lanzarlos de esta manera hasta que finalices un descanso corto o largo. Para lanzar cualquiera de los dos conjuros a un nivel superior, debes gastar un espacio de conjuro.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_corto"
      },
    ],
    subclases: [
      {
        id: "abjurador",
        clasePadre: "mago",
        nombre: "Abjurador",
        descripcion: "Tu estudio de la magia se centra en conjuros que bloquean, expulsan o protegen: terminando con efectos dañinos, expulsando influencias malignas y protegiendo a los débiles. Se recurre a los abjuradores cuando espíritus funestos requieren un exorcismo, cuando los lugares deben protegerse del espionaje mágico y cuando los portales a otros planos de existencia deben cerrarse. Los grupos de aventureros valoran a los abjuradores por la protección que proporcionan frente a una variedad de magia hostil y otros ataques.",
        lema: "Protege a tus compañeros y expulsa a los enemigos.",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":10,"conjuros":["Contrahechizo","Disipar magia"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Erudito en abjuración",
            descripcion: "Elige dos conjuros de mago de la escuela de Abjuración, ninguno de los cuales puede ser de nivel superior a 2, y añádelos a tu libro de conjuros de forma gratuita.\nAdemás, cada vez que obtengas acceso a un nuevo nivel de espacios de conjuro en esta clase, puedes añadir un conjuro de mago de la escuela de Abjuración a tu libro de conjuros de forma gratuita. El conjuro elegido debe ser de un nivel para el que tengas espacios de conjuro.",
            tipoAccion: "pasivo",
            subclase: "Abjurador"
          },
          {
            nivel: 3,
            nombre: "Salvaguarda arcana",
            descripcion: "Puedes tejer magia a tu alrededor para protegerte. Cuando lanzas un conjuro de Abjuración con un espacio de conjuro, puedes usar simultáneamente una hebra de la magia del conjuro para crear una salvaguarda mágica sobre ti que dura hasta que finalices un descanso largo. La salvaguarda tiene unos puntos de golpe máximos iguales al doble de tu nivel de mago más tu modificador por Inteligencia. Cada vez que sufras daño, la salvaguarda sufre el daño en tu lugar, y si tienes alguna resistencia o vulnerabilidad, aplícalas antes de reducir los puntos de golpe de la salvaguarda. Si el daño reduce la salvaguarda a 0 puntos de golpe, sufres el daño restante. Mientras la salvaguarda tenga 0 puntos de golpe, no puede absorber daño, pero su magia permanece.\nCada vez que lanzas un conjuro de Abjuración con un espacio de conjuro, la salvaguarda recupera una cantidad de puntos de golpe igual al doble del nivel del espacio de conjuro. Como alternativa, como acción adicional, puedes gastar un espacio de conjuro y la salvaguarda recuperará una cantidad de puntos de golpe igual al doble del nivel del espacio de conjuro gastado.\nUna vez que crees la salvaguarda, no podrás volver a crearla hasta que finalices un descanso largo.",
            tipoAccion: "accion_adicional",
            subclase: "Abjurador",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 6,
            nombre: "Salvaguarda proyectada",
            descripcion: "Cuando una criatura que puedas ver a 9 m (30 pies) o menos de ti sufra daño, puedes llevar a cabo una reacción para hacer que tu Salvaguarda arcana absorba ese daño. Si este daño reduce la salvaguarda a 0 puntos de golpe, la criatura protegida sufre el daño restante. Si esa criatura tiene alguna resistencia o vulnerabilidad, aplícalas antes de reducir los puntos de golpe de la salvaguarda.",
            tipoAccion: "pasivo",
            subclase: "Abjurador"
          },
          {
            nivel: 10,
            nombre: "Rompedor de conjuros",
            descripcion: "Siempre tienes los conjuros *contrahechizo* y *disipar magia* preparados. Además, puedes lanzar *disipar magia* como acción adicional y puedes sumar tu bonificador por competencia a su prueba de característica.\nCuando lances cualquiera de los dos conjuros con un espacio de conjuro, ese espacio no se gasta si el conjuro no logra detener un conjuro.",
            tipoAccion: "accion_adicional",
            subclase: "Abjurador"
          },
          {
            nivel: 14,
            nombre: "Resistencia a conjuros",
            descripcion: "Tienes ventaja en las tiradas de salvación contra conjuros y tienes resistencia al daño de los conjuros.",
            tipoAccion: "pasivo",
            subclase: "Abjurador"
          },
        ]
      },
      {
        id: "adivino",
        clasePadre: "mago",
        nombre: "Adivino",
        descripcion: "El consejo de un adivino es buscado por aquellos que desean una comprensión más clara del pasado, el presente y el futuro. Como adivino, te esfuerzas por descorrer los velos del espacio, el tiempo y la consciencia. Trabajas para dominar conjuros de discernimiento, visión remota, conocimiento sobrenatural y previsión.",
        lema: "Conoce los secretos del multiverso.",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Erudito en adivinación",
            descripcion: "Elige dos conjuros de mago de la escuela de Adivinación, ninguno de los cuales puede ser de nivel superior a 2, y añádelos a tu libro de conjuros de forma gratuita.\nAdemás, cada vez que obtengas acceso a un nuevo nivel de espacios de conjuro en esta clase, puedes añadir un conjuro de mago de la escuela de Adivinación a tu libro de conjuros de forma gratuita. El conjuro elegido debe ser de un nivel para el que tengas espacios de conjuro.",
            tipoAccion: "pasivo",
            subclase: "Adivino"
          },
          {
            nivel: 3,
            nombre: "Portento",
            descripcion: "Atisbos del futuro comienzan a hacerse presentes en tu percepción. Cada vez que finalices un descanso largo, tira dos d20 y anota los números sacados. Puedes sustituir cualquier tirada de d20 que hagas tú o una criatura que puedas ver por una de estas tiradas de presagio. Debes elegir hacerlo antes de la tirada, y solo puedes reemplazar una tirada de esta forma una vez por turno.\nCada tirada de presagio solo se puede usar una vez. Cuando finalices un descanso largo, pierdes cualquier tirada de presagio que no hayas utilizado.",
            tipoAccion: "pasivo",
            subclase: "Adivino",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 6,
            nombre: "Adivinación experta",
            descripcion: "Lanzar conjuros de Adivinación te resulta tan fácil que solo gasta una fracción de tu esfuerzo mágico. Cuando lanzas un conjuro de Adivinación utilizando un espacio de conjuro de nivel 2 o superior, recuperas un espacio de conjuro gastado. El espacio que recuperes debe ser de un nivel inferior al espacio que gastaste y no puede ser superior a nivel 5.",
            tipoAccion: "pasivo",
            subclase: "Adivino"
          },
          {
            nivel: 10,
            nombre: "El tercer ojo",
            descripcion: "Puedes aumentar tus poderes de percepción. Como acción adicional, elige uno de los siguientes beneficios, el cual durará hasta que comiences un descanso corto o largo. No puedes volver a usar este rasgo hasta que finalices un descanso corto o largo.\n\n***Visión en la oscuridad.*** Ganas visión en la oscuridad con un alcance de 36 m (120 pies).\n\n***Comprensión superior.*** Puedes leer cualquier idioma.\n\n***Ver invisibilidad.*** Puedes lanzar *ver invisibilidad* sin gastar un espacio de conjuro.",
            tipoAccion: "accion_adicional",
            subclase: "Adivino",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 14,
            nombre: "Portento mayor",
            descripcion: "Las visiones de tus sueños se intensifican y pintan una imagen más precisa en tu mente de lo que está por venir. Tira tres d20 para tu rasgo Portento en lugar de dos.",
            tipoAccion: "pasivo",
            subclase: "Adivino"
          },
        ]
      },
      {
        id: "evocador",
        clasePadre: "mago",
        nombre: "Evocador",
        descripcion: "Tus estudios se centran en la magia que crea poderosos efectos elementales como frío cortante, llamas abrasadoras, truenos resonantes, relámpagos crepitantes y ácido ardiente. Algunos evocadores encuentran empleo en fuerzas militares, sirviendo como artillería para arrasar ejércitos desde la distancia. Otros usan su poder para proteger a los demás, mientras que algunos buscan su propio beneficio.",
        lema: "Crea efectos elementales explosivos.",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Erudito en evocación",
            descripcion: "Elige dos conjuros de mago de la escuela de Evocación, ninguno de los cuales puede ser de nivel superior a 2, y añádelos a tu libro de conjuros de forma gratuita.\nAdemás, cada vez que obtengas acceso a un nuevo nivel de espacios de conjuro en esta clase, puedes añadir un conjuro de mago de la escuela de Evocación a tu libro de conjuros de forma gratuita. El conjuro elegido debe ser de un nivel para el que tengas espacios de conjuro.",
            tipoAccion: "pasivo",
            subclase: "Evocador"
          },
          {
            nivel: 3,
            nombre: "Truco potente",
            descripcion: "Tus trucos dañinos afectan incluso a las criaturas que evitan la peor parte del efecto. Cuando lanzas un truco a una criatura y fallas con la tirada de ataque o el objetivo supera una tirada de salvación contra el truco, el objetivo sufre la mitad del daño del truco (si lo tiene), pero no sufre ningún efecto adicional del truco.",
            tipoAccion: "pasivo",
            subclase: "Evocador"
          },
          {
            nivel: 6,
            nombre: "Esculpir conjuros",
            descripcion: "Puedes crear bolsas de relativa seguridad dentro de los efectos de tus evocaciones. Cuando lanzas un conjuro de Evocación que afecte a otras criaturas que puedas ver, puedes elegir una cantidad de ellas igual a 1 más el nivel del conjuro. Las criaturas elegidas superan automáticamente sus tiradas de salvación contra el conjuro y no sufren daño si normalmente sufrirían la mitad de daño tras una salvación exitosa.",
            tipoAccion: "pasivo",
            subclase: "Evocador"
          },
          {
            nivel: 10,
            nombre: "Evocación potenciada",
            descripcion: "Cada vez que lances un conjuro de mago de la escuela de Evocación, puedes sumar tu modificador por Inteligencia a una tirada de daño de ese conjuro.",
            tipoAccion: "pasivo",
            subclase: "Evocador"
          },
          {
            nivel: 14,
            nombre: "Sobrecarga",
            descripcion: "Puedes aumentar el poder de tus conjuros. Cuando lanzas un conjuro de mago con un espacio de conjuro de niveles 1 a 5 que inflija daño, puedes infligir el daño máximo con ese conjuro en el turno en que lo lanzas.\nLa primera vez que lo hagas, no sufres ningún efecto adverso. Si vuelves a usar este rasgo antes de finalizar un descanso largo, sufres 2d12 de daño necrótico por cada nivel del espacio de conjuro inmediatamente después de lanzarlo. Este daño ignora la resistencia y la inmunidad.\nCada vez que vuelvas a usar este rasgo antes de finalizar un descanso largo, el daño necrótico por nivel de conjuro aumenta en 1d12.",
            tipoAccion: "pasivo",
            subclase: "Evocador",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "2d12"
          },
        ]
      },
      {
        id: "ilusionista",
        clasePadre: "mago",
        nombre: "Ilusionista",
        descripcion: "Te especializas en la magia que deslumbra los sentidos y engaña a la mente, y las ilusiones que elaboras hacen que lo imposible parezca real.",
        lema: "Teje sutiles conjuros de engaño.",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"trucos":["Ilusión menor"]},{"nivelClase":6,"conjuros":["Invocar bestia","Invocar feérico"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Erudito en ilusión",
            descripcion: "Elige dos conjuros de mago de la escuela de Ilusión, ninguno de los cuales puede ser de nivel superior a 2, y añádelos a tu libro de conjuros de forma gratuita.\nAdemás, cada vez que obtengas acceso a un nuevo nivel de espacios de conjuro en esta clase, puedes añadir un conjuro de mago de la escuela de Ilusión a tu libro de conjuros de forma gratuita. El conjuro elegido debe ser de un nivel para el que tengas espacios de conjuro.",
            tipoAccion: "pasivo",
            subclase: "Ilusionista"
          },
          {
            nivel: 3,
            nombre: "Ilusiones mejoradas",
            descripcion: "Puedes lanzar conjuros de Ilusión sin proporcionar componentes verbales, y si un conjuro de Ilusión que lanzas tiene un alcance de 3 m (10 pies) o más, el alcance aumenta en 18 m (60 pies).\nTambién conoces el truco *ilusión menor*. Si ya lo conoces, aprendes un truco de mago diferente de tu elección. El truco no cuenta para tu cantidad de trucos conocidos. Puedes crear tanto un sonido como una imagen con un solo lanzamiento de *ilusión menor*, y puedes lanzarlo como acción adicional.",
            tipoAccion: "accion_adicional",
            subclase: "Ilusionista"
          },
          {
            nivel: 6,
            nombre: "Criaturas fantasmales",
            descripcion: "Siempre tienes los conjuros *invocar bestia* e *invocar feérico* preparados. Cada vez que lances cualquiera de los dos conjuros, puedes cambiar su escuela a Ilusión, lo que hace que la criatura invocada parezca espectral. Puedes lanzar la versión de Ilusión de cada conjuro sin gastar un espacio de conjuro, pero lanzarlo sin un espacio reduce a la mitad los puntos de golpe de la criatura. Una vez que lances cualquiera de los dos conjuros sin un espacio de conjuro, debes finalizar un descanso largo antes de poder volver a lanzarlo de esa manera.",
            tipoAccion: "pasivo",
            subclase: "Ilusionista",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 10,
            nombre: "Yo ilusorio",
            descripcion: "Cuando una criatura te acierte con una tirada de ataque, puedes llevar a cabo una reacción para interponer un duplicado ilusorio de ti mismo entre el atacante y tú. El ataque falla automáticamente contra ti y luego la ilusión se disipa.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso corto o largo. También puedes restablecer su uso gastando un espacio de conjuro de nivel 2 o superior (no requiere acción).",
            tipoAccion: "pasivo",
            subclase: "Ilusionista",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 14,
            nombre: "Realidad ilusoria",
            descripcion: "Has aprendido a tejer magia de sombras en tus ilusiones para darles una semirrealidad. Cuando lanzas un conjuro de Ilusión con un espacio de conjuro, puedes elegir un objeto inanimado y no mágico que sea parte de la ilusión y hacer que ese objeto sea real. Puedes hacerlo en tu turno como acción adicional mientras el conjuro continúe activo. El objeto permanece real durante 1 minuto, tiempo durante el cual no puede infligir daño ni imponer ningún estado. Por ejemplo, puedes crear la ilusión de un puente sobre un abismo y luego hacerlo real para cruzarlo.",
            tipoAccion: "accion_adicional",
            subclase: "Ilusionista"
          },
        ]
      },
    ]
  },
  {
    id: "monje",
    nombre: "Monje",
    descripcion: "Un artista marcial disciplinado que canaliza la energía espiritual y el poder corporal para realizar proezas de velocidad, defensa y combate sin armas.",
    dadoGolpe: "d8",
    caracteristicasPrimarias: ["destreza","sabiduria","constitucion"],
    salvacionesCompetentes: ["fuerza","destreza"],
    competenciasArmaduras: [],
    competenciasArmas: ["Armas Sencillas","Armas Marciales con la propiedad Ligera"],
    competenciasHerramientas: ["1 Herramienta de artesano o Instrumento musical"],
    opcionesHabilidades: {"cantidad":2,"opciones":["acrobacias","atletismo","historia","perspicacia","religion","sigilo"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Lanza, 5 Dagas, Herramientas de Artesano o Instrumento, Paquete de Explorador y 11 PO","opcionB":"(B) 65 PO en monedas para comprar equipo"},
    rasgos: [
      {
        nivel: 1,
        nombre: "Artes marciales",
        descripcion: "La práctica de las artes marciales te ha otorgado un dominio de los estilos de combate que emplean ataques sin armas y armas de monje, que son las siguientes:\n- Armas cuerpo a cuerpo sencillas\n- Armas cuerpo a cuerpo marciales que tengan la propiedad \"ligera\"\nObtienes los siguientes beneficios mientras no lleves armadura ni portes un *escudo* y estés desarmado o empuñes únicamente armas de monje:\n\n***Ataque sin armas adicional.*** Puedes hacer un ataque sin armas como acción adicional.\n\n***Dado de Artes marciales.*** Puedes tirar 1d6 en lugar del daño normal de tus ataques sin armas o tus armas de monje. Este dado cambia conforme subes de nivel de monje, como se muestra en la columna \"Artes marciales\" de la tabla \"Rasgos de monje\".\n\n***Ataques diestros.*** Puedes usar tu modificador por Destreza en lugar de tu modificador por Fuerza para las tiradas de ataque y de daño de tus ataques sin armas y tus armas de monje. Además, cuando uses las opciones de agarre o empujón de tu ataque sin armas, puedes usar tu modificador por Destreza en lugar de tu modificador por Fuerza para determinar la CD de salvación.",
        tipoAccion: "accion_adicional",
        formulaDados: "1d6"
      },
      {
        nivel: 1,
        nombre: "Defensa sin armadura",
        descripcion: "Mientras no lleves armadura ni portes un *escudo*, tu clase de armadura base será igual a 10 más tus modificadores por Destreza y Sabiduría.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 2,
        nombre: "Concentración de monje",
        descripcion: "Tu concentración y tu entrenamiento marcial te permiten utilizar una reserva interna de energía extraordinaria. Esta energía se representa mediante los puntos de concentración. Tu nivel de monje determina cuántos de estos puntos posees, como se muestra en la columna \"Puntos de concentración\" de la tabla \"Rasgos de monje\".\nPuedes gastar estos puntos para mejorar o alimentar determinados rasgos de monje. Empiezas con tres de estos rasgos: Ráfaga de golpes, Defensa paciente y Paso del viento, que se detallan a continuación.\nCuando gastes un punto de concentración, no estará disponible hasta que finalices un descanso corto o largo, tras el cual recuperarás todos los puntos gastados.\nAlgunos rasgos que usan puntos de concentración requieren que tu objetivo haga una tirada de salvación. La CD de salvación es igual a 8 más tu modificador por Sabiduría y tu bonificador por competencia.\n\n***Ráfaga de golpes.*** Puedes gastar 1 punto de concentración para hacer dos ataques sin armas como acción adicional.\n\n***Defensa paciente.*** Puedes llevar a cabo la acción de destrabarse como acción adicional. De manera alternativa, puedes gastar 1 punto de concentración para llevar a cabo tanto la acción de destrabarse como la de esquivar como acción adicional.\n\n***Paso del viento.*** Puedes llevar a cabo la acción de correr como acción adicional. De manera alternativa, puedes gastar 1 punto de concentración para llevar a cabo tanto la acción de destrabarse como la de correr como acción adicional, y tu distancia de salto se duplicará durante el turno.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => niv,
        recuperacion: "descanso_corto"
      },
      {
        nivel: 2,
        nombre: "Movimiento sin armadura",
        descripcion: "Tu velocidad aumenta en 3 m (10 pies) si no llevas armadura ni portas un *escudo*. Esta bonificación aumenta cuando alcanzas ciertos niveles de monje, como se muestra en la tabla \"Rasgos de monje\".",
        tipoAccion: "pasivo"
      },
      {
        nivel: 2,
        nombre: "Metabolismo asombroso",
        descripcion: "Cuando tires iniciativa, puedes recuperar todos los puntos de concentración gastados. Cuando lo hagas, tira tu dado de Artes marciales y recupera una cantidad de puntos de golpe igual a tu nivel de monje más el resultado obtenido.\nCuando uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 3,
        nombre: "Desviar ataques",
        descripcion: "Cuando una tirada de ataque te acierte y su daño incluya los tipos contundente, cortante o perforante, puedes usar una reacción para reducir el daño total que sufras del ataque. Se reducirá en 1d10 más tu modificador por Destreza y nivel de monje.\nSi reduces el daño a 0, puedes gastar 1 punto de concentración para redirigir una parte de la fuerza del ataque. Si lo haces, elige una criatura que puedas ver a 1,5 m (5 pies) o menos de ti si el ataque fue cuerpo a cuerpo o una criatura que puedas ver a 18 m (60 pies) o menos de ti que no esté tras cobertura completa si el ataque fue a distancia. Esa criatura deberá superar una tirada de salvación de Destreza o sufrirá una cantidad de daño igual al resultado de dos tiradas de tu dado de Artes marciales más tu modificador por Destreza. El daño será del mismo tipo que inflija el ataque.",
        tipoAccion: "pasivo",
        formulaDados: "1d10"
      },
      {
        nivel: 3,
        nombre: "Subclase de monje",
        descripcion: "Consigues una subclase de monje de tu elección. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de monje. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de monje e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de monje.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Caída lenta",
        descripcion: "Puedes utilizar tu reacción cuando caigas para reducir el daño de caída que sufras en una cantidad igual a cinco veces tu nivel de monje.",
        tipoAccion: "reaccion"
      },
      {
        nivel: 5,
        nombre: "Ataque adicional",
        descripcion: "Puedes atacar dos veces en lugar de una cada vez que realices la acción de atacar en tu turno.",
        tipoAccion: "accion"
      },
      {
        nivel: 5,
        nombre: "Golpe aturdidor",
        descripcion: "Una vez por turno, cuando aciertes a una criatura con un arma de monje o un ataque sin armas, puedes gastar 1 punto de concentración para intentar asestar un golpe aturdidor. El objetivo debe hacer una tirada de salvación de Constitución. Si falla la tirada, el objetivo tendrá el estado de aturdido hasta el comienzo de tu siguiente turno. Si la supera, la velocidad del objetivo se reduce a la mitad hasta el comienzo de tu siguiente turno, y la siguiente tirada de ataque que se haga contra el objetivo antes de ese momento tendrá ventaja.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 6,
        nombre: "Golpes potenciados",
        descripcion: "Siempre que causes daño con tu ataque sin armas, este podrá infligir daño de fuerza o su tipo de daño normal (a tu elección).",
        tipoAccion: "pasivo"
      },
      {
        nivel: 6,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de monje.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Evasión",
        descripcion: "Cuando estés sujeto a un efecto que te permita hacer una tirada de salvación de Destreza para sufrir solo la mitad de daño, en su lugar no sufrirás ningún daño si tienes éxito en la tirada de salvación y solo la mitad si la fallas.\nNo te beneficias de este rasgo si tienes el estado de incapacitado.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 9,
        nombre: "Movimiento acrobático",
        descripcion: "Mientras no lleves armadura ni portes un *escudo*, obtienes la capacidad de moverte a lo largo de superficies verticales y sobre líquidos en tu turno sin caer durante el movimiento.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Concentración agudizada",
        descripcion: "Tu Ráfaga de golpes, Defensa paciente y Paso del viento obtienen los siguientes beneficios.\n\n***Ráfaga de golpes.*** Puedes gastar 1 punto de concentración para usar Ráfaga de golpes y hacer tres ataques sin armas con ella en lugar de dos.\n\n***Defensa paciente.*** Cuando gastes un punto de concentración para usar Defensa paciente, obtendrás una cantidad de puntos de golpe temporales igual al resultado de dos tiradas de tu dado de Artes marciales.\n\n***Paso del viento.*** Cuando gastes un punto de concentración para usar Paso del viento, puedes elegir a una criatura voluntaria a 1,5 m (5 pies) o menos de ti que sea Grande o más pequeña. Mueves a la criatura contigo hasta el final de tu turno. El movimiento de la criatura no provoca ataques de oportunidad.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Autorrestablecimiento",
        descripcion: "A base de pura fuerza de voluntad, puedes eliminar uno de los siguientes estados de ti mismo al final de cada uno de tus turnos: asustado, envenenado o hechizado.\nAdemás, privarte de comida y bebida no te da niveles de agotamiento.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 11,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de monje.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 13,
        nombre: "Desviar energía",
        descripcion: "Ahora puedes usar tu rasgo Desviar ataques contra ataques que inflijan cualquier tipo de daño, no solo contundente, perforante o cortante.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Superviviente disciplinado",
        descripcion: "Tu disciplina física y mental te otorga competencia en todas las tiradas de salvación.\nAdemás, cada vez que hagas una tirada de salvación y falles, puedes gastar 1 punto de concentración para volver a tirarla, y deberás usar el nuevo resultado.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 15,
        nombre: "Concentración perfecta",
        descripcion: "Cuando tires iniciativa y no uses Metabolismo asombroso, recuperarás puntos de concentración gastados hasta tener 4 si tienes 3 o menos.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 17,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de monje.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 18,
        nombre: "Defensa superior",
        descripcion: "Al comienzo de tu turno, puedes gastar 3 puntos de concentración para fortalecerte contra el daño durante 1 minuto o hasta que tengas el estado de incapacitado. Durante ese tiempo, tienes resistencia a todo el daño excepto al daño de fuerza.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don de la ofensiva irresistible.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Cuerpo y mente",
        descripcion: "Has desarrollado tu cuerpo y tu mente hasta alcanzar nuevas cotas. Tus puntuaciones de Destreza y Sabiduría aumentan en 4, hasta un máximo de 25.",
        tipoAccion: "pasivo"
      },
    ],
    subclases: [
      {
        id: "guerrero_de_la_misericordia",
        clasePadre: "monje",
        nombre: "Guerrero de la misericordia",
        descripcion: "Los guerreros de la misericordia manipulan la fuerza vital de otros. Estos monjes son médicos errantes, pero dan un final rápido a sus enemigos. A menudo usan máscaras, presentándose como portadores sin rostro de la vida y la muerte.",
        lema: "Curar o dañar con un simple contacto",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Mano del daño",
            descripcion: "Una vez por turno, cuando aciertes a una criatura con un ataque sin armas y causes daño, puedes gastar 1 punto de concentración para infligir daño necrótico adicional igual al resultado de una tirada de tu dado de Artes marciales más tu modificador por Sabiduría.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de la misericordia"
          },
          {
            nivel: 3,
            nombre: "Mano curativa",
            descripcion: "Como acción de magia, puedes gastar 1 punto de concentración para tocar a una criatura y restaurar una cantidad de puntos de golpe igual al resultado de una tirada de tu dado de Artes marciales más tu modificador por Sabiduría. Cuando uses tu Ráfaga de golpes, puedes sustituir uno de los ataques sin armas por un uso de este rasgo sin gastar un punto de concentración para la curación.",
            tipoAccion: "accion",
            subclase: "Guerrero de la misericordia"
          },
          {
            nivel: 3,
            nombre: "Implementos de misericordia",
            descripcion: "Ganas competencia en las habilidades de Medicina y Perspicacia y competencia con *útiles de herborista*.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de la misericordia"
          },
          {
            nivel: 6,
            nombre: "Toque del médico",
            descripcion: "Tu Mano del daño y tu Mano curativa mejoran, como se detalla a continuación.\n\n***Mano del daño.*** Cuando uses Mano del daño en una criatura, también puedes causarle el estado de envenenado hasta el final de tu siguiente turno.\n\n***Mano curativa.*** Cuando uses Mano curativa, también puedes poner fin a uno de los siguientes estados en la criatura que curas: aturdido, cegado, ensordecido, envenenado o paralizado.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de la misericordia"
          },
          {
            nivel: 11,
            nombre: "Ráfaga de curación y daño",
            descripcion: "Cuando uses Ráfaga de golpes, puedes sustituir cada uno de los ataques sin armas por un uso de Mano curativa sin gastar puntos de concentración para la curación.\nAdemás, cuando hagas un ataque sin armas con Ráfaga de golpes y causes daño, puedes usar Mano del daño con ese golpe sin gastar un punto de concentración para Mano del daño. Solo puedes seguir usando Mano del daño una vez por turno.\nPuedes usar estos beneficios una cantidad total de veces igual a tu modificador por Sabiduría (mínimo una vez). Recuperas todos los usos gastados cuando finalices un descanso largo.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de la misericordia",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 17,
            nombre: "Mano de la misericordia definitiva",
            descripcion: "Tu dominio de la energía vital abre la puerta a la misericordia definitiva. Como acción de magia, puedes tocar el cadáver de una criatura que haya muerto en las últimas 24 horas y gastar 5 puntos de concentración. La criatura vuelve entonces a la vida con una cantidad de puntos de golpe igual a 4d10 más tu modificador por Sabiduría. Si la criatura murió con cualquiera de los siguientes estados, revivirá con los estados eliminados: aturdido, cegado, ensordecido, envenenado y paralizado.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
            tipoAccion: "accion",
            subclase: "Guerrero de la misericordia",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo",
            formulaDados: "4d10"
          },
        ]
      },
      {
        id: "guerrero_de_la_sombra",
        clasePadre: "monje",
        nombre: "Guerrero de la sombra",
        descripcion: "Los guerreros de la sombra practican el sigilo y el subterfugio, aprovechando el poder del Páramo Sombrío. Se sienten como en casa en la oscuridad, son capaces de atraer la penumbra a su alrededor para esconderse, saltar de sombra en sombra y adoptar una forma espectral.",
        lema: "Emplear las sombras como herramientas de subterfugio",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Oscuridad"],"trucos":["Ilusión menor"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Artes de la sombra",
            descripcion: "Has aprendido a extraer el poder del Páramo Sombrío, obteniendo los siguientes beneficios.\n\n***Oscuridad.*** Puedes gastar 1 punto de concentración para lanzar el conjuro *oscuridad* sin componentes de conjuro. Puedes ver dentro del área del conjuro cuando lo lanzas con este rasgo. Mientras el conjuro persiste, puedes mover su área de oscuridad a un espacio a 18 m (60 pies) o menos de ti al comienzo de cada uno de tus turnos.\n\n***Visión en la oscuridad.*** Ganas visión en la oscuridad a una distancia de 18 m (60 pies). Si ya tienes visión en la oscuridad, su alcance aumenta en 18 m (60 pies).\n\n***Ficciones sombrías.*** Conoces el conjuro *ilusión menor*. La Sabiduría es tu aptitud mágica para este.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de la sombra"
          },
          {
            nivel: 6,
            nombre: "Paso de la sombra",
            descripcion: "Mientras estés completamente en luz tenue u oscuridad, puedes usar una acción adicional para teletransportarte hasta 18 m (60 pies) a un espacio sin ocupar que puedas ver que también esté en luz tenue u oscuridad. Tendrás ventaja en el siguiente ataque cuerpo a cuerpo que hagas antes de que acabe el turno en curso.",
            tipoAccion: "accion_adicional",
            subclase: "Guerrero de la sombra"
          },
          {
            nivel: 11,
            nombre: "Paso de la sombra mejorado",
            descripcion: "Puedes recurrir a tu conexión con el Páramo Sombrío para potenciar tu teletransporte. Cuando uses tu Paso de la sombra, puedes gastar 1 punto de concentración para eliminar el requisito de tener que empezar y terminar en luz tenue u oscuridad para ese uso del rasgo. Como parte de esta acción adicional, puedes hacer un ataque sin armas inmediatamente después de teletransportarte.",
            tipoAccion: "accion_adicional",
            subclase: "Guerrero de la sombra"
          },
          {
            nivel: 17,
            nombre: "Manto de sombras",
            descripcion: "Como acción de magia mientras estés completamente en luz tenue u oscuridad, puedes gastar 3 puntos de concentración para envolverte en sombras durante 1 minuto, hasta que tengas el estado de incapacitado, o hasta que termines tu turno en luz brillante. Mientras estés envuelto por estas sombras, obtienes los siguientes beneficios.\n\n***Invisibilidad.*** Tienes el estado de invisible.\n\n***Parcialmente incorpóreo.*** Puedes moverte a través de espacios ocupados como si fuesen terreno difícil. Si terminas tu turno en uno de esos espacios, serás desplazado al último espacio sin ocupar en el que estuviste.\n\n***Ráfaga de sombras.*** Puedes usar tu Ráfaga de golpes sin gastar ningún punto de concentración.",
            tipoAccion: "accion",
            subclase: "Guerrero de la sombra"
          },
        ]
      },
      {
        id: "guerrero_de_los_elementos",
        clasePadre: "monje",
        nombre: "Guerrero de los elementos",
        descripcion: "Los guerreros de los elementos recurren al poder de los Planos Elementales. Aprovechando su concentración sobrenatural, estos monjes doman momentáneamente la energía del Caos Elemental para empoderarse dentro y fuera de la batalla.",
        lema: "Hacer uso de la energía elemental",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"trucos":["Elementalismo"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Sintonía elemental",
            descripcion: "Al comienzo de tu turno, puedes gastar 1 punto de concentración para imbuirte de energía elemental. La energía dura 10 minutos o hasta que tengas el estado de incapacitado. Obtienes los siguientes beneficios mientras este rasgo esté activo.\n\n***Alcance.*** Cuando hagas un ataque sin armas, tu alcance será 3 m (10 pies) mayor de lo normal, a medida que la energía elemental se extiende desde ti.\n\n***Golpes elementales.*** Siempre que aciertes con tu ataque sin armas, puedes hacer que inflija daño de ácido, fuego, frío, relámpago o trueno (a tu elección) en lugar de su tipo de daño normal. Cuando inflijas uno de estos tipos con él, también puedes obligar al objetivo a hacer una tirada de salvación de Fuerza. Si falla la tirada, puedes mover al objetivo hasta 3 m (10 pies) hacia ti o alejándolo de ti, a medida que la energía elemental se arremolina a su alrededor.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de los elementos"
          },
          {
            nivel: 3,
            nombre: "Manipular elementos",
            descripcion: "Conoces el conjuro *elementalismo*. La Sabiduría es tu aptitud mágica para este.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de los elementos"
          },
          {
            nivel: 6,
            nombre: "Estallido elemental",
            descripcion: "Como acción de magia, puedes gastar 2 puntos de concentración para provocar un estallido de energía elemental en una esfera de 6 m (20 pies) de radio centrada en un punto a 36 m (120 pies) o menos de ti. Elige un tipo de daño: ácido, fuego, frío, relámpago o trueno.\nCada criatura en la esfera deberá hacer una tirada de salvación de Destreza. Si falla la tirada, la criatura sufrirá una cantidad de daño del tipo elegido igual al resultado de tres tiradas de tu dado de Artes marciales. Si la supera, sufrirá la mitad de daño.",
            tipoAccion: "accion",
            subclase: "Guerrero de los elementos"
          },
          {
            nivel: 11,
            nombre: "Zancada de los elementos",
            descripcion: "Mientras tu Sintonía elemental esté activa, también tienes una velocidad volando y una velocidad nadando iguales a tu velocidad.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de los elementos"
          },
          {
            nivel: 17,
            nombre: "Epítome elemental",
            descripcion: "Mientras tu Sintonía elemental esté activa, también obtienes los siguientes beneficios.\n\n***Resistencia al daño.*** Ganas resistencia a uno de los siguientes tipos de daño de tu elección: ácido, fuego, frío, relámpago o trueno. Al comienzo de cada uno de tus turnos, puedes cambiar esta elección.\n\n***Zancada destructiva.*** Cuando uses tu Paso del viento, tu velocidad aumentará en 6 m (20 pies) hasta el final del turno. Durante esa duración, cualquier criatura de tu elección sufrirá una cantidad de daño igual al resultado de una tirada de tu dado de Artes marciales cuando entres en un espacio a 1,5 m (5 pies) o menos de ella. El tipo de daño será de ácido, fuego, frío, relámpago o trueno (a tu elección). Una criatura solo puede sufrir este daño una vez por turno.\n\n***Golpes potenciados.*** Una vez en cada uno de tus turnos, puedes infligir daño adicional a un objetivo igual al resultado de una tirada de tu dado de Artes marciales cuando le aciertes con un ataque sin armas. El daño adicional es del mismo tipo que el infligido por ese golpe.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de los elementos"
          },
        ]
      },
      {
        id: "guerrero_de_la_mano_abierta",
        clasePadre: "monje",
        nombre: "Guerrero de la mano abierta",
        descripcion: "Los guerreros de la mano abierta son maestros del combate sin armas. Aprenden técnicas para empujar y derribar a sus oponentes y manipular su propia energía para protegerse del daño.",
        lema: "Dominar el combate sin armas",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Técnica de la mano abierta",
            descripcion: "Siempre que aciertes a una criatura con un ataque otorgado por tu Ráfaga de golpes, puedes imponer uno de los siguientes efectos a ese objetivo.\n\n***Confundir.*** El objetivo no podrá hacer ataques de oportunidad hasta el comienzo de su siguiente turno.\n\n***Empujar.*** El objetivo deberá superar una tirada de salvación de Fuerza o será empujado hasta 4,5 m (15 pies) alejándolo de ti.\n\n***Derribar.*** El objetivo deberá superar una tirada de salvación de Destreza o tendrá el estado de derribado.",
            tipoAccion: "pasivo",
            subclase: "Guerrero de la mano abierta"
          },
          {
            nivel: 6,
            nombre: "Plenitud corporal",
            descripcion: "Ganas la capacidad de curarte a ti mismo. Como acción adicional, puedes tirar tu dado de Artes marciales. Recuperas una cantidad de puntos de golpe igual al resultado obtenido más tu modificador por Sabiduría (mínimo 1 punto de golpe recuperado).\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez), y recuperas todos los usos gastados cuando finalices un descanso largo.",
            tipoAccion: "accion_adicional",
            subclase: "Guerrero de la mano abierta",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 11,
            nombre: "Paso veloz",
            descripcion: "Cuando lleves a cabo una acción adicional que no sea Paso del viento, también podrás usar Paso del viento inmediatamente después de esa acción adicional.",
            tipoAccion: "accion_adicional",
            subclase: "Guerrero de la mano abierta"
          },
          {
            nivel: 17,
            nombre: "Palma trémula",
            descripcion: "Ganas la capacidad de provocar vibraciones letales en el cuerpo de alguien. Cuando aciertes a una criatura con un ataque sin armas, podrás gastar 4 puntos de concentración para iniciar estas vibraciones imperceptibles, las cuales durarán una cantidad de días igual a tu nivel de monje. Las vibraciones serán inofensivas a menos que utilices una acción para ponerles fin. De manera alternativa, cuando lleves a cabo la acción de atacar en tu turno, podrás renunciar a uno de los ataques para poner fin a las vibraciones. Para ponerles fin, tú y el objetivo deberéis estar en el mismo plano de existencia. Cuando les pongas fin, el objetivo deberá hacer una tirada de salvación de Constitución, sufriendo 10d12 de daño de fuerza si falla la tirada o la mitad de daño si la supera.\nSolo puedes tener a una criatura bajo los efectos de este rasgo a la vez. Puedes poner fin a las vibraciones de forma inofensiva (no requiere acción).",
            tipoAccion: "accion",
            subclase: "Guerrero de la mano abierta",
            formulaDados: "10d12"
          },
        ]
      },
    ]
  },
  {
    id: "paladin",
    nombre: "Paladín",
    descripcion: "Un guerrero consagrado por un juramento sagrado, bendecido con poder divino, auras protectoras y el demoledor Castigo Divino.",
    dadoGolpe: "d10",
    caracteristicasPrimarias: ["fuerza","carisma","constitucion"],
    salvacionesCompetentes: ["sabiduria","carisma"],
    competenciasArmaduras: ["Armaduras Ligeras","Armaduras Medianas","Armaduras Pesadas","Escudos"],
    competenciasArmas: ["Armas Sencillas","Armas Marciales"],
    competenciasHerramientas: [],
    opcionesHabilidades: {"cantidad":2,"opciones":["atletismo","perspicacia","intimidacion","medicina","persuasion","religion"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Cota de malla, Escudo, Espada larga, Símbolo Sagrado, Paquete de Sacerdote y 9 PO","opcionB":"(B) 150 PO en monedas para comprar equipo"},
    configuracionMagica: {"tipoLanzador":"medio","habilidadConjuro":"carisma","modeloConjuros":"preparados","nivelInicio":1},
    rasgos: [
      {
        nivel: 1,
        nombre: "Imposición de manos",
        descripcion: "Tu toque bendito puede curar heridas. Tienes una reserva de poder curativo que se repone cuando finalizas un descanso largo. Con esa reserva, puedes restaurar una cantidad total de puntos de golpe igual a cinco veces tu nivel de paladín.\nComo acción adicional, puedes tocar a una criatura (que puedes ser tú mismo) y extraer poder de la reserva de curación para restaurar una cantidad de puntos de golpe a esa criatura, hasta la cantidad máxima restante en la reserva.\nTambién puedes gastar 5 puntos de golpe de la reserva de poder curativo para eliminar el estado de envenenado de la criatura; esos puntos no restauran también puntos de golpe a la criatura.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => niv * 5,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 1,
        nombre: "Lanzamiento de conjuros",
        descripcion: "Has aprendido a lanzar conjuros a través de la oración y la meditación. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información presentada a continuación detalla cómo usas esas reglas con los conjuros de paladín, que aparecen en la lista de conjuros de paladín más adelante en la descripción de la clase.\n\n***Espacios de conjuro.*** La tabla \"Rasgos de paladín\" muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios utilizados tras finalizar un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas la lista de conjuros de nivel 1 y superiores que están disponibles para que los lances con este rasgo. Para empezar, elige dos conjuros de paladín de nivel 1. Se recomiendan *heroísmo* y *castigo abrasador*.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de paladín, como se muestra en la columna \"Conjuros preparados\" de la tabla \"Rasgos de paladín\". Cada vez que ese número aumente, elige conjuros de paladín adicionales hasta que el número de conjuros de tu lista coincida con el número de la tabla \"Rasgos de paladín\". Los conjuros elegidos deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un paladín de nivel 5, tu lista de conjuros preparados puede incluir seis conjuros de paladín de nivel 1 o 2 en cualquier combinación.\nSi otro rasgo de paladín te proporciona conjuros que siempre tienes preparados, esos conjuros no cuentan para el total que puedes preparar con este rasgo, pero por lo demás cuentan como conjuros de paladín para ti.\n\n***Cambiar tus conjuros preparados.*** Tras finalizar un descanso largo, puedes reemplazar un conjuro de tu lista por otro conjuro de paladín para el que tengas espacios de conjuro.\n\n***Aptitud mágica.*** El Carisma es tu aptitud mágica en lo que respecta a tus conjuros de paladín.\n\n***Canalizador mágico.*** Puedes utilizar un *símbolo sagrado* como canalizador mágico para tus conjuros de paladín.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 1,
        nombre: "Maestría con armas",
        descripcion: "Tu entrenamiento con armas te permite utilizar las propiedades de maestría de dos tipos de armas de tu elección con las que tengas competencia, como las *espadas largas* y las *jabalinas*.\nTras finalizar un descanso largo, puedes cambiar los tipos de armas que elegiste. Por ejemplo, podrías cambiar para usar las propiedades de maestría de las *alabardas* y los *mayales*.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Estilo de combate",
        descripcion: "Ganas una dote de Estilo de combate de tu elección. En lugar de elegir una de esas dotes, puedes elegir la opción a continuación.\n\n***Guerrero bendecido.*** Aprendes dos trucos de clérigo de tu elección. Se recomiendan *guía* y *llama sagrada*. Los trucos elegidos cuentan como conjuros de paladín para ti, y el Carisma es tu aptitud mágica para ellos. Cada vez que subas un nivel de paladín, puedes reemplazar uno de estos trucos por otro truco de clérigo.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 2,
        nombre: "Castigo de paladín",
        descripcion: "Siempre tienes el conjuro *castigo divino* preparado. Además, puedes lanzarlo sin gastar un espacio de conjuro, pero debes finalizar un descanso largo antes de poder lanzarlo de esta manera de nuevo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 3,
        nombre: "Canalizar divinidad",
        descripcion: "Puedes canalizar energía divina directamente de los Planos Exteriores, usándola para alimentar efectos mágicos. Empiezas con uno de estos efectos: Sentido divino, que se describe a continuación. Otros rasgos de paladín otorgan opciones de efectos adicionales de Canalizar divinidad. Cada vez que utilices el rasgo Canalizar divinidad de esta clase, eliges qué efecto de esta clase vas a crear.\nPuedes usar el rasgo Canalizar divinidad de esta clase dos veces. Recuperas uno de sus usos gastados tras finalizar un descanso corto, y recuperas todos los usos gastados tras finalizar un descanso largo. Ganas un uso adicional cuando alcanzas el nivel 11 de paladín.\nSi un efecto de Canalizar divinidad requiere una tirada de salvación, la CD es igual a la CD de salvación de conjuros del rasgo Lanzamiento de conjuros de esta clase.\n\n***Sentido divino.*** Como acción adicional, puedes abrir tu conciencia para detectar celestiales, infernales y muertos vivientes. Durante los próximos 10 minutos o hasta que tengas el estado de incapacitado, conoces la ubicación de cualquier criatura de esos tipos que se encuentre a 18 m (60 pies) o menos de ti, y conoces su tipo de criatura. Dentro del mismo radio, también detectas la presencia de cualquier lugar u objeto que haya sido consagrado o profanado, al igual que con el conjuro *sacralizar*.",
        tipoAccion: "accion_adicional",
        tieneUsosLimitados: true,
        obtenerUsosMaximos: (niv) => (niv >= 18 ? 4 : niv >= 11 ? 3 : 2),
        recuperacion: "descanso_corto"
      },
      {
        nivel: 3,
        nombre: "Subclase de paladín",
        descripcion: "Consigues una subclase de paladín de tu elección. Una subclase es una especialización que te proporciona rasgos cuando alcanzas ciertos niveles de paladín. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de paladín e inferiores.\n> ##### Romper tu juramento\n>\n>Un paladín intenta atenerse a los más altos estándares de conducta, pero incluso los más dedicados son falibles. A veces un paladín transgrede su juramento.\n>\n>Un paladín que ha roto un voto suele buscar la absolución, pasando una vigilia de toda la noche como signo de penitencia o sometiéndose a un ayuno. Tras un rito de perdón, el paladín comienza de nuevo.\n>\n>Si tu paladín viola su juramento y no se arrepiente, habla con tu DM. Tu paladín probablemente debería adoptar una subclase más apropiada o incluso abandonar la clase y adoptar otra.\n>",
        tipoAccion: "pasivo"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 12 y 16 de paladín.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Ataque adicional",
        descripcion: "Puedes atacar dos veces en lugar de una cada vez que realices la acción de atacar en tu turno.",
        tipoAccion: "accion"
      },
      {
        nivel: 5,
        nombre: "Corcel fiel",
        descripcion: "Puedes invocar la ayuda de un corcel de otro mundo. Siempre tienes el conjuro *encontrar corcel* preparado.\nTambién puedes lanzar el conjuro una vez sin gastar un espacio de conjuro, y recuperas la capacidad de hacerlo tras finalizar un descanso largo.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 6,
        nombre: "Aura de protección",
        descripcion: "Irradias un aura protectora invisible en una emanación de 3 m (10 pies) que se origina en ti. El aura está inactiva mientras tengas el estado de incapacitado.\nTú y tus aliados en el aura ganáis un bonificador a las tiradas de salvación igual a tu modificador por Carisma (bonificador mínimo de +1).\nSi hay otro paladín presente, una criatura solo puede beneficiarse de un Aura de protección a la vez; la criatura elige de qué aura beneficiarse mientras esté en ellas.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de paladín.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 9,
        nombre: "Abjurar enemigos",
        descripcion: "Como acción de magia, puedes gastar un uso de Canalizar divinidad de esta clase para abrumar a los enemigos con sobrecogimiento. Al presentar tu *símbolo sagrado* o tu arma, puedes elegir como objetivo a una cantidad de criaturas igual a tu modificador por Carisma (mínimo de una criatura) que puedas ver a 18 m (60 pies) o menos de ti. Cada objetivo debe superar una tirada de salvación de Sabiduría o tendrá el estado de asustado durante 1 minuto o hasta que sufra cualquier daño. Mientras esté asustado de esta manera, un objetivo solo puede hacer una de las siguientes cosas en sus turnos: moverse, llevar a cabo una acción o llevar a cabo una acción adicional.",
        tipoAccion: "accion_adicional"
      },
      {
        nivel: 10,
        nombre: "Aura de valor",
        descripcion: "Tú y tus aliados tenéis inmunidad al estado de asustado mientras estéis en tu Aura de protección. Si un aliado asustado entra en el aura, ese estado no tiene ningún efecto sobre ese aliado mientras esté allí.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 11,
        nombre: "Golpes radiantes",
        descripcion: "Tus golpes ahora conllevan un poder sobrenatural. Cuando aciertas a un objetivo con una tirada de ataque usando un arma cuerpo a cuerpo o un ataque sin armas, el objetivo sufre 1d8 de daño radiante adicional.",
        tipoAccion: "pasivo",
        formulaDados: "1d8"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Toque restaurador",
        descripcion: "Cuando uses Imposición de manos en una criatura, también puedes eliminar uno o más de los siguientes estados de la criatura: aturdido, cegado, ensordecido, asustado, hechizado o paralizado. Debes gastar 5 puntos de golpe de la reserva de curación de Imposición de manos por cada uno de estos estados que elimines; esos puntos no restauran también puntos de golpe a la criatura.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 15,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de paladín.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 18,
        nombre: "Expansión del aura",
        descripcion: "Tu Aura de protección ahora es una emanación de 9 m (30 pies).",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don de la visión verdadera.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de paladín.",
        tipoAccion: "pasivo"
      },
    ],
    subclases: [
      {
        id: "juramento_de_entrega",
        clasePadre: "paladin",
        nombre: "Juramento de Entrega",
        descripcion: "El Juramento de Entrega ata a los paladines a los ideales de la justicia y el orden. Estos paladines encarnan el arquetipo del caballero de brillante armadura. Se exigen a sí mismos los más altos estándares de conducta y algunos —para bien o para mal— exigen al resto del mundo esos mismos estándares.\nMuchos de los que prestan este juramento son devotos de dioses de la ley y el bien, y utilizan los preceptos de sus dioses como medida de su devoción personal. Otros tienen a los ángeles como sus ideales e incorporan imágenes de alas angelicales en sus yelmos o escudos de armas.\nEstos paladines comparten los siguientes preceptos:\n- Que tu palabra sea tu promesa.\n- Protege al débil y nunca temas actuar.\n- Que tus actos honorables sirvan de ejemplo.",
        lema: "Defiende los ideales de la justicia y el orden",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Protección contra el bien y el mal","Escudo de fe"]},{"nivelClase":5,"conjuros":["Auxilio","Zona de verdad"]},{"nivelClase":9,"conjuros":["Faro de esperanza","Disipar magia"]},{"nivelClase":13,"conjuros":["Libertad de movimiento","Guardián de la fe"]},{"nivelClase":17,"conjuros":["Comunión","Descarga flamígera"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del Juramento de Entrega",
            descripcion: "La magia de tu juramento asegura que siempre tengas ciertos conjuros preparados; cuando alcanzas un nivel de paladín especificado en la tabla \"Conjuros del Juramento de Entrega\", a partir de entonces siempre tienes preparados los conjuros que se indican.\n##### Conjuros del Juramento de Entrega\n| Nivel de paladín | Conjuros                                           |\n|:-------------:|----------------------------------------------------|\n|      3      | *protección contra el bien y el mal*, *escudo de fe* |\n|      5      | *auxilio*, *zona de verdad*                        |\n|      9      | *faro de esperanza*, *disipar magia*               |\n|      13     | *libertad de movimiento*, *guardián de la fe*      |\n|      17     | *comunión*, *descarga flamígera*                   |",
            tipoAccion: "pasivo",
            subclase: "Juramento de Entrega"
          },
          {
            nivel: 3,
            nombre: "Arma sagrada",
            descripcion: "Cuando lleves a cabo la acción de atacar, puedes gastar un uso de tu Canalizar divinidad para imbuir un arma cuerpo a cuerpo que estés sosteniendo con energía positiva. Durante 10 minutos o hasta que utilices este rasgo de nuevo, sumas tu modificador por Carisma a las tiradas de ataque que hagas con esa arma (bonificador mínimo de +1), y cada vez que aciertes con ella, haces que inflija su tipo de daño normal o daño radiante.\nEl arma también emite luz brillante en un radio de 6 m (20 pies) y luz tenue durante otros 6 m (20 pies).\nPuedes terminar este efecto antes de tiempo (no requiere acción). Este efecto también termina si ya no portas el arma.",
            tipoAccion: "accion",
            subclase: "Juramento de Entrega"
          },
          {
            nivel: 7,
            nombre: "Aura de entrega",
            descripcion: "Tú y tus aliados tenéis inmunidad al estado de hechizado mientras estéis en tu Aura de protección. Si un aliado hechizado entra en el aura, ese estado no tiene ningún efecto sobre ese aliado mientras esté allí.",
            tipoAccion: "pasivo",
            subclase: "Juramento de Entrega"
          },
          {
            nivel: 15,
            nombre: "Castigo de protección",
            descripcion: "Tu castigo mágico ahora irradia energía protectora. Cada vez que lances *castigo divino*, tú y tus aliados tenéis cobertura media mientras estéis en tu Aura de protección. El aura tiene este beneficio hasta el comienzo de tu siguiente turno.",
            tipoAccion: "pasivo",
            subclase: "Juramento de Entrega"
          },
          {
            nivel: 20,
            nombre: "Nimbo sagrado",
            descripcion: "Como acción adicional, puedes imbuir tu Aura de protección con poder sagrado, otorgando los beneficios a continuación durante 10 minutos o hasta que los termines (no requiere acción). Una vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo. También puedes restaurar su uso gastando un espacio de conjuro de nivel 5 (no requiere acción).\n\n***Guarda sagrada.*** Tienes ventaja en cualquier tirada de salvación a la que te veas obligado a hacer por un infernal o un muerto viviente.\n\n***Daño radiante.*** Cada vez que un enemigo empiece su turno en el aura, esa criatura sufrirá una cantidad de daño radiante igual a tu modificador por Carisma más tu bonificador por competencia.\n\n***Luz solar.*** El aura se llena de luz brillante que es luz solar.",
            tipoAccion: "accion_adicional",
            subclase: "Juramento de Entrega",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "juramento_de_gloria",
        clasePadre: "paladin",
        nombre: "Juramento de Gloria",
        descripcion: "Los paladines que prestan el Juramento de Gloria creen que ellos y sus compañeros están destinados a alcanzar la gloria a través de actos de heroísmo. Entrenan diligentemente y animan a sus compañeros, de modo que todos están listos cuando el destino los llama.\nEstos paladines comparten los siguientes preceptos:\n- Esfuérzate por ser conocido por tus actos.\n- Afronta las dificultades con valentía.\n- Inspira a otros a esforzarse por la gloria.",
        lema: "Alcanza la cumbre del heroísmo",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Saeta guía","Heroísmo"]},{"nivelClase":5,"conjuros":["Arma mágica","Potenciar característica"]},{"nivelClase":9,"conjuros":["Acelerar","Faro de esperanza"]},{"nivelClase":13,"conjuros":["Compulsión","Libertad de movimiento"]},{"nivelClase":17,"conjuros":["Comunión","Golpe de viento acerado"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del Juramento de Gloria",
            descripcion: "La magia de tu juramento asegura que siempre tengas ciertos conjuros preparados; cuando alcanzas un nivel de paladín especificado en la tabla \"Conjuros del Juramento de Gloria\", a partir de entonces siempre tienes preparados los conjuros que se indican.\n##### Conjuros del Juramento de Gloria\n| Nivel de paladín | Conjuros                                    |\n|:-------------:|-------------------------------------------|\n|      3      | *saeta guía*, *heroísmo*                  |\n|      5      | *mejorar característica*, *arma mágica*   |\n|      9      | *acelerar*, *protección contra energía*   |\n|      13     | *compulsión*, *libertad de movimiento*    |\n|      17     | *conocimiento de leyendas*, *presencia regia de Yolande* |",
            tipoAccion: "pasivo",
            subclase: "Juramento de Gloria"
          },
          {
            nivel: 3,
            nombre: "Castigo inspirador",
            descripcion: "Inmediatamente después de lanzar *castigo divino*, puedes gastar un uso de tu Canalizar divinidad y distribuir puntos de golpe temporales a criaturas de tu elección a 9 m (30 pies) o menos de ti, lo que puede incluirte a ti. La cantidad total de puntos de golpe temporales es igual a 2d8 más tu nivel de paladín, dividida entre las criaturas elegidas como desees.",
            tipoAccion: "pasivo",
            subclase: "Juramento de Gloria",
            formulaDados: "2d8"
          },
          {
            nivel: 3,
            nombre: "Atleta sin par",
            descripcion: "Como acción adicional, puedes gastar un uso de tu Canalizar divinidad para potenciar tus habilidades atléticas. Durante 1 hora, tienes ventaja en las pruebas de Fuerza (Atletismo) y Destreza (Acrobacias), y la distancia de tus saltos de longitud y de altura aumenta en 3 m (10 pies) (esta distancia adicional cuesta movimiento de la forma habitual).",
            tipoAccion: "accion_adicional",
            subclase: "Juramento de Gloria"
          },
          {
            nivel: 7,
            nombre: "Aura de presteza",
            descripcion: "Tu velocidad aumenta en 3 m (10 pies).\nAdemás, siempre que un aliado entre en tu Aura de protección por primera vez en un turno o comience su turno allí, la velocidad del aliado aumentará en 3 m (10 pies) hasta el final de su siguiente turno.",
            tipoAccion: "pasivo",
            subclase: "Juramento de Gloria"
          },
          {
            nivel: 15,
            nombre: "Defensa gloriosa",
            descripcion: "Puedes convertir la defensa en un contraataque repentino. Cuando a ti o a otra criatura que puedas ver a 3 m (10 pies) o menos de ti os acierten con una tirada de ataque, puedes llevar a cabo una reacción para otorgar un bonificador a la CA del objetivo contra ese ataque, pudiendo hacer que este falle. El bonificador es igual a tu modificador por Carisma (mínimo de +1). Si el ataque falla, puedes realizar un ataque con un arma contra el atacante como parte de esta reacción si el atacante está al alcance de tu arma.\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Carisma (mínimo una vez), y recuperas todos los usos gastados tras finalizar un descanso largo.",
            tipoAccion: "pasivo",
            subclase: "Juramento de Gloria",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 20,
            nombre: "Leyenda viviente",
            descripcion: "Puedes empoderarte con las leyendas —ya sean ciertas o exageradas— de tus grandes hazañas. Como acción adicional, obtienes los beneficios a continuación durante 10 minutos. Una vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo. También puedes restaurar su uso gastando un espacio de conjuro de nivel 5 (no requiere acción).\n\n***Carismático.*** Eres bendecido con una presencia de otro mundo y tienes ventaja en todas tus pruebas de Carisma.\n\n***Repetir tirada de salvación.*** Si fallas una tirada de salvación, puedes usar tu reacción para volver a tirarla. Deberás quedarte con la nueva tirada.\n\n***Golpe infalible.*** Una vez en cada uno de tus turnos cuando hagas una tirada de ataque con un arma y falles, puedes hacer que ese ataque acierte en su lugar.",
            tipoAccion: "accion_adicional",
            subclase: "Juramento de Gloria",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "juramento_de_los_antiguos",
        clasePadre: "paladin",
        nombre: "Juramento de los Antiguos",
        descripcion: "El Juramento de los Antiguos es tan antiguo como los primeros elfos. Los paladines que prestan este juramento aprecian la luz; aman las cosas hermosas y vivificantes del mundo más que cualquier principio de honor, valentía y justicia. A menudo adornan su armadura y ropa con imágenes de la naturaleza, como hojas, astas o flores, para reflejar su compromiso con la preservación de la vida y la luz.\nEstos paladines comparten los siguientes preceptos:\n- Aviva la luz de la esperanza.\n- Protege la vida.\n- Deléitate con el arte y la risa.",
        lema: "Preserva la vida, la alegría y la naturaleza en el mundo",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Golpe atrapador","Hablar con los animales"]},{"nivelClase":5,"conjuros":["Rayo lunar","Paso brumoso"]},{"nivelClase":9,"conjuros":["Crecimiento vegetal","Protección contra la energía"]},{"nivelClase":13,"conjuros":["Tormenta de hielo","Piel pétrea"]},{"nivelClase":17,"conjuros":["Comunión con la naturaleza","Ola destructiva"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del Juramento de los Antiguos",
            descripcion: "La magia de tu juramento asegura que siempre tengas ciertos conjuros preparados; cuando alcanzas un nivel de paladín especificado en la tabla \"Conjuros del Juramento de los Antiguos\", a partir de entonces siempre tienes preparados los conjuros que se indican.\n##### Conjuros del Juramento de los Antiguos\n| Nivel de paladín | Conjuros                                   |\n|:-------------:|------------------------------------------|\n|      3      | *golpe apresador*, *hablar con los animales* |\n|      5      | *paso brumoso*, *rayo lunar*             |\n|      9      | *crecimiento vegetal*, *protección contra energía* |\n|      13     | *tormenta de hielo*, *piel pétrea*       |\n|      17     | *comulgar con la naturaleza*, *zancada arbórea* |",
            tipoAccion: "pasivo",
            subclase: "Juramento de los Antiguos"
          },
          {
            nivel: 3,
            nombre: "Ira de la naturaleza",
            descripcion: "Como acción de magia, puedes gastar un uso de tu Canalizar divinidad para conjurar enredaderas espectrales alrededor de las criaturas cercanas. Cada criatura de tu elección que puedas ver a 4,5 m (15 pies) o menos de ti deberá superar una tirada de salvación de Fuerza o tendrá el estado de apresado durante 1 minuto. Una criatura apresada repite la tirada de salvación al final de cada uno de sus turnos, poniendo fin al efecto sobre sí misma si tiene éxito.",
            tipoAccion: "accion",
            subclase: "Juramento de los Antiguos"
          },
          {
            nivel: 7,
            nombre: "Aura de custodia",
            descripcion: "La magia ancestral pesa tanto sobre ti que forma una protección arcana que mitiga la energía de más allá del Plano Material; tú y tus aliados tenéis resistencia al daño necrótico, psíquico y radiante mientras estéis en tu Aura de protección.",
            tipoAccion: "pasivo",
            subclase: "Juramento de los Antiguos"
          },
          {
            nivel: 15,
            nombre: "Centinela imperecedero",
            descripcion: "Cuando tus puntos de golpe se reduzcan a 0 y no mueras en el acto, podrás quedarte a 1 punto de golpe en su lugar, y recuperarás una cantidad de puntos de golpe igual al triple de tu nivel de paladín. Una vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.\nAdemás, no puedes envejecer mágicamente y dejas de envejecer visiblemente.",
            tipoAccion: "pasivo",
            subclase: "Juramento de los Antiguos",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 20,
            nombre: "Campeón anciano",
            descripcion: "Como acción adicional, puedes imbuir tu Aura de protección de poder primigenio, otorgando los beneficios a continuación durante 1 minuto o hasta que los termines (no requiere acción). Una vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo. También puedes restaurar su uso gastando un espacio de conjuro de nivel 5 (no requiere acción).\n\n***Disminuir resistencia.*** Los enemigos en el aura tienen desventaja en las tiradas de salvación contra tus conjuros y opciones de Canalizar divinidad.\n\n***Regeneración.*** Al comienzo de cada uno de tus turnos, recuperas 10 puntos de golpe.\n\n***Conjuros veloces.*** Cada vez que lances un conjuro que tenga un tiempo de lanzamiento de una acción, podrás lanzarlo usando una acción adicional en su lugar.",
            tipoAccion: "accion_adicional",
            subclase: "Juramento de los Antiguos",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "juramento_de_venganza",
        clasePadre: "paladin",
        nombre: "Juramento de Venganza",
        descripcion: "El Juramento de Venganza es un compromiso solemne para castigar a quienes han cometido actos gravemente malvados. Cuando ejércitos malvados masacran a aldeanos indefensos, cuando un tirano desafía la voluntad de los dioses, cuando un gremio de ladrones se vuelve demasiado violento o cuando un dragón asola los campos... en momentos como estos, los paladines se alzan y prestan el Juramento de Venganza para arreglar lo que se ha torcido.\nEstos paladines comparten los siguientes preceptos:\n- No muestres piedad a los malvados.\n- Lucha contra la injusticia y sus causas.\n- Ayuda a aquellos perjudicados por la injusticia.",
        lema: "Castiga a los malhechores a cualquier precio",
        nivelDesbloqueo: 3,
        progresionConjuros: [{"nivelClase":3,"conjuros":["Perdición","Marca del cazador"]},{"nivelClase":5,"conjuros":["Inmovilizar persona","Paso brumoso"]},{"nivelClase":9,"conjuros":["Apresurar","Protección contra la energía"]},{"nivelClase":13,"conjuros":["Destierro","Puerta dimensional"]},{"nivelClase":17,"conjuros":["Inmovilizar monstruo","Escrudiñar"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Conjuros del Juramento de Venganza",
            descripcion: "La magia de tu juramento asegura que siempre tengas ciertos conjuros preparados; cuando alcanzas un nivel de paladín especificado en la tabla \"Conjuros del Juramento de Venganza\", a partir de entonces siempre tienes preparados los conjuros que se indican.\n##### Conjuros del Juramento de Venganza\n| Nivel de paladín | Conjuros                            |\n|:-------------:|-----------------------------------|\n|      3      | *perdición*, *marca del cazador*  |\n|      5      | *inmovilizar persona*, *paso brumoso* |\n|      9      | *acelerar*, *protección contra energía* |\n|      13     | *destierro*, *puerta dimensional* |\n|      17     | *inmovilizar monstruo*, *escrudiñar* |",
            tipoAccion: "pasivo",
            subclase: "Juramento de Venganza"
          },
          {
            nivel: 3,
            nombre: "Voto de enemistad",
            descripcion: "Cuando lleves a cabo la acción de atacar, puedes gastar un uso de tu Canalizar divinidad para pronunciar un voto de enemistad contra una criatura que puedas ver a 9 m (30 pies) o menos de ti. Tienes ventaja en las tiradas de ataque contra la criatura durante 1 minuto o hasta que uses este rasgo de nuevo.\nSi los puntos de golpe de la criatura se reducen a 0 antes de que termine el voto, podrás transferir el voto a otra criatura diferente a 9 m (30 pies) o menos de ti (no requiere acción).",
            tipoAccion: "accion",
            subclase: "Juramento de Venganza"
          },
          {
            nivel: 7,
            nombre: "Vengador implacable",
            descripcion: "Tu concentración sobrenatural te ayuda a cortar la retirada de un enemigo. Cuando aciertes a una criatura con un ataque de oportunidad, puedes reducir la velocidad de la criatura a 0 hasta el final del turno en curso. A continuación, puedes moverte hasta la mitad de tu velocidad como parte de la misma reacción. Este movimiento no provoca ataques de oportunidad.",
            tipoAccion: "pasivo",
            subclase: "Juramento de Venganza"
          },
          {
            nivel: 15,
            nombre: "Alma de venganza",
            descripcion: "Inmediatamente después de que una criatura bajo el efecto de tu Voto de enemistad acierte o falle con una tirada de ataque, podrás utilizar una reacción para realizar un ataque cuerpo a cuerpo contra esa criatura si está a tu alcance.",
            tipoAccion: "pasivo",
            subclase: "Juramento de Venganza"
          },
          {
            nivel: 20,
            nombre: "Ángel vengador",
            descripcion: "Como acción adicional, obtienes los beneficios a continuación durante 10 minutos o hasta que los termines (no requiere acción). Una vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo. También puedes restaurar su uso gastando un espacio de conjuro de nivel 5 (no requiere acción).\n\n***Vuelo.*** Te brotan alas espectrales de la espalda, obtienes una velocidad volando de 18 m (60 pies) y puedes flotar.\n\n***Aura aterradora.*** Cada vez que un enemigo comience su turno en tu Aura de protección, esa criatura deberá superar una tirada de salvación de Sabiduría o tendrá el estado de asustado durante 1 minuto o hasta que sufra cualquier daño. Las tiradas de ataque contra la criatura asustada tienen ventaja.",
            tipoAccion: "accion_adicional",
            subclase: "Juramento de Venganza",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
    ]
  },
  {
    id: "picaro",
    nombre: "Pícaro",
    descripcion: "Un especialista en la precisión, la infiltración, el sigilo y el ingenio rápido, maestro en infligir letales Ataques Furtivos.",
    dadoGolpe: "d8",
    caracteristicasPrimarias: ["destreza","inteligencia","carisma"],
    salvacionesCompetentes: ["destreza","inteligencia"],
    competenciasArmaduras: ["Armaduras Ligeras"],
    competenciasArmas: ["Armas Sencillas","Armas Marciales con la propiedad Sutil o Ligera"],
    competenciasHerramientas: ["Herramientas de ladrón"],
    opcionesHabilidades: {"cantidad":4,"opciones":["acrobacias","atletismo","engaño","perspicacia","intimidacion","investigacion","percepcion","interpretacion","persuasion","juegoManos","sigilo"]},
    equipoInicial: {"descripcion":"Elige la opción (A) o (B):","opcionA":"(A) Armadura de cuero, 2 Dagas, Espada corta, Arco corto con 20 flechas, Herramientas de ladrón, Paquete de Ladrón y 8 PO","opcionB":"(B) 110 PO en monedas para comprar equipo"},
    rasgos: [
      {
        nivel: 1,
        nombre: "Pericia",
        descripcion: "Ganas pericia en dos de tus competencias en habilidades de tu elección. Se recomiendan Juego de manos y Sigilo si tienes competencia en ellas.\nA nivel 6 de pícaro, ganas pericia en dos más de tus competencias en habilidades de tu elección.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 1,
        nombre: "Ataque furtivo",
        descripcion: "Sabes cómo atacar sutilmente y aprovechar la distracción de un enemigo. Una vez por turno, puedes infligir 1d6 de daño adicional a una criatura que aciertes con una tirada de ataque si tienes ventaja en la tirada y el ataque usa un arma sutil o un arma a distancia. El tipo de daño adicional es el mismo que el tipo del arma.\nNo necesitas ventaja en la tirada de ataque si al menos uno de tus aliados está a 1,5 m (5 pies) o menos del objetivo, el aliado no tiene el estado de incapacitado y tú no tienes desventaja en la tirada de ataque.\nEl daño adicional aumenta a medida que ganas niveles de pícaro, como se muestra en la columna \"Ataque furtivo\" de la tabla de rasgos del pícaro.",
        tipoAccion: "pasivo",
        formulaDados: "1d6"
      },
      {
        nivel: 1,
        nombre: "Jerga de ladrones",
        descripcion: "Has aprendido varios idiomas en las comunidades donde ejerciste tus talentos picarescos. Conoces la jerga de ladrones y otro idioma de tu elección, que eliges de las tablas de idiomas del *capítulo 2*.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 1,
        nombre: "Maestría con armas",
        descripcion: "Tu entrenamiento con armas te permite utilizar las propiedades de maestría de dos tipos de armas de tu elección con las que tengas competencia, como *Dagas* y *Arcos cortos*.\nSiempre que finalices un descanso largo, puedes cambiar los tipos de armas que elegiste. Por ejemplo, podrías cambiar para usar las propiedades de maestría de las *Cimitarras* y las *Espadas cortas*.",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo"
      },
      {
        nivel: 2,
        nombre: "Acción astuta",
        descripcion: "Tu rapidez mental y agilidad te permiten moverte y actuar rápidamente. En tu turno, puedes llevar a cabo una de las siguientes acciones como acción adicional: correr, destrabarse o esconderse.",
        tipoAccion: "accion_adicional"
      },
      {
        nivel: 3,
        nombre: "Subclase de pícaro",
        descripcion: "Consigues una subclase de pícaro de tu elección. Una subclase es una especialización que te proporciona rasgos a ciertos niveles de pícaro. De aquí en adelante, obtienes todos los rasgos de tu subclase que sean de tu nivel de pícaro e inferiores.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 3,
        nombre: "Puntería estable",
        descripcion: "Como acción adicional, te otorgas ventaja en tu próxima tirada de ataque en el turno actual. Puedes usar este rasgo solo si no te has movido durante este turno, y después de usarlo, tu velocidad se reduce a 0 hasta el final del turno actual.",
        tipoAccion: "accion_adicional"
      },
      {
        nivel: 4,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Vuelves a obtener este rasgo en los niveles 8, 10, 12 y 16 de pícaro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 5,
        nombre: "Golpe astuto",
        descripcion: "Has desarrollado formas astutas de utilizar tu Ataque furtivo. Cuando infliges daño de Ataque furtivo, puedes añadir uno de los siguientes efectos de Golpe astuto. Cada efecto tiene un coste en dados, que es el número de dados de daño de Ataque furtivo a los que debes renunciar para añadir el efecto. Retiras el dado antes de tirar, y el efecto ocurre inmediatamente después de infligir el daño del ataque. Por ejemplo, si añades el efecto de Veneno, retira 1d6 del daño del Ataque furtivo antes de tirar.\nSi un efecto de Golpe astuto requiere una tirada de salvación, la CD es igual a 8 más tu modificador por Destreza y tu bonificador por competencia.\n\n***Veneno (Coste: 1d6).*** Añades una toxina a tu golpe, obligando al objetivo a hacer una tirada de salvación de Constitución. Si falla la tirada, el objetivo tiene el estado de envenenado durante 1 minuto. Al final de cada uno de sus turnos, el objetivo envenenado repite la tirada de salvación, terminando el efecto sobre sí mismo si tiene éxito.\nPara usar este efecto, debes llevar unos *Útiles de envenenador* contigo.\n\n***Derribar (Coste: 1d6).*** Si el objetivo es Grande o más pequeño, debe tener éxito en una tirada de salvación de Destreza o sufrirá el estado de derribado.\n\n***Retirarse (Coste: 1d6).*** Inmediatamente después del ataque, te mueves hasta la mitad de tu velocidad sin provocar ataques de oportunidad.",
        tipoAccion: "pasivo",
        formulaDados: "1d6"
      },
      {
        nivel: 5,
        nombre: "Esquiva asombrosa",
        descripcion: "Cuando un atacante que puedes ver te acierta con una tirada de ataque, puedes usar una reacción para reducir a la mitad el daño del ataque contra ti (redondeando hacia abajo).",
        tipoAccion: "pasivo"
      },
      {
        nivel: 6,
        nombre: "Pericia",
        descripcion: "Ganas pericia en dos de tus competencias en habilidades de tu elección.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Evasión",
        descripcion: "Puedes esquivar ágilmente ciertos peligros. Cuando estés sujeto a un efecto que te permita hacer una tirada de salvación de Destreza para sufrir solo la mitad de daño, en su lugar no sufrirás ningún daño si tienes éxito en la tirada de salvación y solo la mitad si la fallas. No puedes usar este rasgo si tienes el estado de incapacitado.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 7,
        nombre: "Talento fiable",
        descripcion: "Siempre que hagas una prueba de característica que use una de tus competencias en habilidades o herramientas, puedes tratar una tirada de d20 de 9 o menos como un 10.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 8,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 9,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de pícaro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 10,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 11,
        nombre: "Golpe astuto mejorado",
        descripcion: "Puedes usar hasta dos efectos de Golpe astuto cuando infliges daño de Ataque furtivo, pagando el coste en dados de cada efecto.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 12,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 13,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de pícaro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 14,
        nombre: "Golpes taimados",
        descripcion: "Has practicado nuevas formas de usar tu Ataque furtivo de forma taimada. Los siguientes efectos se encuentran ahora entre tus opciones de Golpe astuto.\n\n***Aturdir (Coste: 2d6).*** El objetivo debe superar una tirada de salvación de Constitución, o en su siguiente turno solo podrá hacer una de las siguientes cosas: moverse, llevar a cabo una acción o una acción adicional.\n\n***Noquear (Coste: 6d6).*** El objetivo debe superar una tirada de salvación de Constitución, o sufrirá el estado de inconsciente durante 1 minuto o hasta que sufra algún daño. El objetivo inconsciente repite la tirada de salvación al final de cada uno de sus turnos, terminando el efecto sobre sí mismo si tiene éxito.\n\n***Oscurecer (Coste: 3d6).*** El objetivo debe superar una tirada de salvación de Destreza, o sufrirá el estado de cegado hasta el final de su siguiente turno.",
        tipoAccion: "accion_adicional",
        formulaDados: "2d6"
      },
      {
        nivel: 15,
        nombre: "Mente escurridiza",
        descripcion: "Tu mente astuta es excepcionalmente difícil de controlar. Ganas competencia en las tiradas de salvación de Sabiduría y Carisma.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 16,
        nombre: "Mejora de característica",
        descripcion: "Obtienes la dote Mejora de característica u otra [dote](feats.html) de tu elección para la que cumplas las condiciones.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 17,
        nombre: "Rasgo de subclase",
        descripcion: "Obtienes un rasgo de tu subclase de pícaro.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 18,
        nombre: "Escurridizo",
        descripcion: "Eres tan evasivo que los atacantes rara vez tienen ventaja contra ti. Ninguna tirada de ataque puede tener ventaja contra ti a menos que tengas el estado de incapacitado.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 19,
        nombre: "Don épico",
        descripcion: "Obtienes una dote de don épico u otra [dote](feats.html) de tu elección para la que cumplas las condiciones. Se recomienda Don del espíritu nocturno.",
        tipoAccion: "pasivo"
      },
      {
        nivel: 20,
        nombre: "Golpe de suerte",
        descripcion: "Tienes un don maravilloso para tener éxito cuando lo necesitas. Si fallas una prueba de d20, puedes convertir la tirada en un 20.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso corto o largo.\n---",
        tipoAccion: "pasivo",
        tieneUsosLimitados: true,
        recuperacion: "descanso_corto"
      },
    ],
    subclases: [
      {
        id: "embaucador_arcano",
        clasePadre: "picaro",
        nombre: "Embaucador Arcano",
        descripcion: "Algunos pícaros mejoran sus afiladas habilidades de sigilo y agilidad con conjuros, aprendiendo trucos mágicos para ayudarse en su oficio. Algunos embaucadores arcanos usan sus talentos como carteristas y ladrones, mientras que otros son bromistas.",
        lema: "Mejora el sigilo con conjuros arcanos",
        nivelDesbloqueo: 3,
        configuracionMagica: {"tipoLanzador":"tercio","habilidadConjuro":"inteligencia","modeloConjuros":"preparados","nivelInicio":3},
        progresionConjuros: [{"nivelClase":3,"trucos":["Mano de mago","2 trucos de Mago a elección"]}],
        rasgos: [
          {
            nivel: 3,
            nombre: "Lanzamiento de conjuros",
            descripcion: "Has aprendido a lanzar conjuros. Consulta el *capítulo 7* para ver las reglas sobre el lanzamiento de conjuros. La información a continuación detalla cómo usas esas reglas como embaucador arcano.\n\n***Trucos.*** Conoces tres trucos: *Mano de mago* y otros dos trucos de tu elección de la lista de conjuros de mago (consulta la sección de esa clase para ver su lista). Se recomiendan *Astilla mental* e *Ilusión menor*.\nCada vez que subes un nivel de pícaro, puedes reemplazar uno de tus trucos, excepto *Mano de mago*, por otro truco de mago de tu elección.\nCuando alcanzas el nivel 10 de pícaro, aprendes otro truco de mago de tu elección.\n\n***Espacios de conjuro.*** La tabla de Lanzamiento de conjuros del embaucador arcano muestra cuántos espacios de conjuro tienes para lanzar tus conjuros de nivel 1 y superiores. Recuperas todos los espacios de conjuro gastados cuando finalizas un descanso largo.\n\n***Conjuros preparados de nivel 1 y superiores.*** Preparas la lista de conjuros de nivel 1 y superiores que están disponibles para lanzar con este rasgo. Para empezar, elige tres conjuros de mago de nivel 1. Se recomiendan *Hechizar persona*, *Disfrazarse* y *Nube de oscurecimiento*.\nEl número de conjuros de tu lista aumenta conforme subes de nivel de pícaro, como se muestra en la columna \"Conjuros preparados\" de la tabla de Lanzamiento de conjuros del embaucador arcano. Cuando ese número aumenta, elige conjuros de mago adicionales hasta que el número de conjuros de tu lista coincida con el número de la tabla. Los conjuros elegidos deben ser de un nivel para el que tengas espacios de conjuro. Por ejemplo, si eres un pícaro de nivel 7, tu lista de conjuros preparados puede incluir cinco conjuros de mago de nivel 1 o 2 en cualquier combinación.\n\n***Cambiar tus conjuros preparados.*** Siempre que subas un nivel de pícaro, puedes reemplazar un conjuro de tu lista por otro conjuro de mago para el que tengas espacios de conjuro.\n\n***Aptitud mágica.*** La Inteligencia es tu aptitud mágica en lo que respecta a tus conjuros de mago.\n\n***Canalizador mágico.*** Puedes utilizar un *Canalizador arcano* como canalizador mágico para tus conjuros de mago.",
            tipoAccion: "pasivo",
            subclase: "Embaucador Arcano",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 3,
            nombre: "Prestidigitación con Mano de mago",
            descripcion: "Cuando lanzas *Mano de mago*, puedes lanzarlo como acción adicional, y puedes hacer que la mano espectral tenga el estado de invisible. Puedes controlar la mano como acción adicional, y a través de ella, puedes realizar pruebas de Destreza (Juego de manos).",
            tipoAccion: "accion_adicional",
            subclase: "Embaucador Arcano"
          },
          {
            nivel: 9,
            nombre: "Emboscada mágica",
            descripcion: "Si tienes el estado de invisible cuando lanzas un conjuro sobre una criatura, esta tiene desventaja en cualquier tirada de salvación que haga contra el conjuro en ese mismo turno.",
            tipoAccion: "pasivo",
            subclase: "Embaucador Arcano"
          },
          {
            nivel: 13,
            nombre: "Embaucador versátil",
            descripcion: "Ganas la capacidad de distraer a los objetivos con tu *Mano de mago*. Cuando usas la opción Derribar de tu Golpe astuto en una criatura, también puedes usar esa opción en otra criatura que esté a 1,5 m (5 pies) o menos de la mano espectral.",
            tipoAccion: "pasivo",
            subclase: "Embaucador Arcano"
          },
          {
            nivel: 17,
            nombre: "Ladrón de conjuros",
            descripcion: "Ganas la capacidad de robar mágicamente el conocimiento de cómo lanzar un conjuro de otro lanzador de conjuros.\nInmediatamente después de que una criatura lance un conjuro que te tenga como objetivo o te incluya en su área de efecto, puedes usar una reacción para obligar a la criatura a hacer una tirada de salvación de Inteligencia. La CD es igual a tu CD de salvación de conjuros. Si falla la tirada de salvación, anulas el efecto del conjuro contra ti, y robas el conocimiento del conjuro si es de al menos nivel 1 y de un nivel que puedas lanzar (no es necesario que sea un conjuro de mago). Durante las siguientes 8 horas, tienes el conjuro preparado. La criatura no puede lanzarlo hasta que hayan pasado las 8 horas.\nUna vez que robas un conjuro con este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.\n---",
            tipoAccion: "pasivo",
            subclase: "Embaucador Arcano",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "asesino",
        clasePadre: "picaro",
        nombre: "Asesino",
        descripcion: "El entrenamiento de un Asesino se centra en el uso del sigilo, el veneno y el disfraz para eliminar a los enemigos con una eficacia letal. Si bien algunos pícaros que siguen este camino son asesinos a sueldo, espías o cazarrecompensas, las capacidades de esta subclase son igualmente útiles para aventureros que se enfrentan a una variedad de enemigos monstruosos.",
        lema: "Practica el lúgubre arte de la muerte",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Asesinato",
            descripcion: "Eres experto en emboscar a un objetivo, lo que te otorga los siguientes beneficios.\n\n***Iniciativa.*** Tienes ventaja en las tiradas de iniciativa.\n\n***Golpes sorpresivos.*** Durante la primera ronda de cualquier combate, tienes ventaja en las tiradas de ataque contra cualquier criatura que aún no haya tenido su turno. Si tu Ataque furtivo acierta a algún objetivo durante esa ronda, el objetivo sufre daño adicional del tipo del arma igual a tu nivel de pícaro.",
            tipoAccion: "pasivo",
            subclase: "Asesino"
          },
          {
            nivel: 3,
            nombre: "Herramientas de asesino",
            descripcion: "Ganas unos *Útiles de disfraz* y unos *Útiles de envenenador*, y tienes competencia con ellos.",
            tipoAccion: "pasivo",
            subclase: "Asesino"
          },
          {
            nivel: 9,
            nombre: "Pericia en infiltración",
            descripcion: "Eres experto en las siguientes técnicas que ayudan a tus infiltraciones.\n\n***Mímica magistral.*** Puedes imitar infaliblemente el habla, la escritura o ambas de otra persona si has pasado al menos 1 hora estudiándola.\n\n***Puntería itinerante.*** Tu velocidad no se reduce a 0 al usar Puntería estable.",
            tipoAccion: "pasivo",
            subclase: "Asesino"
          },
          {
            nivel: 13,
            nombre: "Envenenar armas",
            descripcion: "Cuando usas la opción de Veneno de tu Golpe astuto, el objetivo también sufre 2d6 de daño de veneno siempre que falle la tirada de salvación. Este daño ignora la resistencia al daño de veneno.",
            tipoAccion: "pasivo",
            subclase: "Asesino",
            formulaDados: "2d6"
          },
          {
            nivel: 17,
            nombre: "Golpe mortal",
            descripcion: "Cuando aciertas con tu Ataque furtivo en la primera ronda de un combate, el objetivo debe superar una tirada de salvación de Constitución (CD 8 más tu modificador por Destreza y bonificador por competencia), o el daño del ataque se duplica contra ese objetivo.\n---",
            tipoAccion: "pasivo",
            subclase: "Asesino"
          },
        ]
      },
      {
        id: "filo_del_alma",
        clasePadre: "picaro",
        nombre: "Filo del Alma",
        descripcion: "Un Filo del Alma ataca con la mente, atravesando barreras tanto físicas como psíquicas. Estos pícaros descubren un poder psiónico dentro de sí mismos y lo canalizan para realizar su trabajo picaresco. Como Filo del Alma, tus habilidades psiónicas pueden haberte atormentado desde la infancia, revelando todo su potencial solo cuando experimentaste el estrés de la aventura. O tal vez buscaste una orden de adeptos psíquicos y pasaste años aprendiendo a manifestar tu poder.",
        lema: "Ataca a los enemigos con hojas psiónicas",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Poder psiónico",
            descripcion: "Albergas un manantial de energía psiónica dentro de ti. Está representado por tus Dados de energía psiónica, que alimentan ciertos poderes que tienes de esta subclase. La tabla de Dados de energía del Filo del Alma muestra la cantidad de estos dados que tienes cuando alcanzas ciertos niveles de pícaro, y el tamaño del dado.\n##### Dados de energía del Filo del Alma\n| Nivel de pícaro | Tamaño del dado | Cantidad |\n|:-----------:|:--------:|:------:|\n|      3      |    D6    |    4   |\n|      5      |    D8    |    6   |\n|      9      |    D8    |    8   |\n|      11     |    D10   |    8   |\n|      13     |    D10   |   10   |\n|      17     |    D12   |   12   |\nCualquier rasgo de esta subclase que use un Dado de energía psiónica utiliza únicamente los dados de esta subclase. Algunos de tus poderes gastan un Dado de energía psiónica, tal y como se especifica en la descripción del poder, y no podrás usar un poder si requiere que utilices un dado y todos tus Dados de energía psiónica están gastados.\nRecuperas uno de tus Dados de energía psiónica gastados cuando finalizas un descanso corto, y los recuperas todos cuando finalizas un descanso largo.\n\n***Habilidad reforzada psiónicamente.*** Si fallas una prueba de característica usando una habilidad o herramienta con la que tengas competencia, puedes tirar un Dado de energía psiónica y sumar el número obtenido a la prueba, pudiendo convertir un fracaso en un éxito. El dado se gasta únicamente si la tirada tiene éxito.\n\n***Susurros psíquicos.*** Puedes establecer comunicación telepática entre ti y otros. Como acción de magia, elige una o más criaturas que puedas ver, hasta un número de criaturas igual a tu bonificador por competencia, y luego tira un Dado de energía psiónica. Durante un número de horas igual al resultado obtenido, las criaturas elegidas podrán hablar telepáticamente contigo, y tú con ellas. Para enviar o recibir un mensaje (no requiere acción), la otra criatura y tú debéis estar a 1,6 km (1 milla) o menos de distancia el uno del otro. Una criatura puede finalizar la conexión telepática en cualquier momento (no requiere acción).\nLa primera vez que uses este poder después de cada descanso largo, no gastarás el Dado de energía psiónica. El resto de las veces que uses el poder, gastarás el dado.",
            tipoAccion: "accion",
            subclase: "Filo del Alma",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto"
          },
          {
            nivel: 3,
            nombre: "Hojas psíquicas",
            descripcion: "Puedes manifestar hojas brillantes de energía psíquica. Siempre que lleves a cabo la acción de atacar o hagas un ataque de oportunidad, puedes manifestar una *Hoja psíquica* en tu mano libre y hacer el ataque con esa hoja. La hoja desaparece inmediatamente después de que acierte o falle a su objetivo, y no deja marca si inflige daño.\nDespués de que ataques con la hoja en tu turno, puedes hacer un ataque cuerpo a cuerpo o a distancia con una segunda hoja psíquica como acción adicional en el mismo turno si tu otra mano está libre para crearla. El dado de daño de este ataque adicional es 1d4 en lugar de 1d6.",
            tipoAccion: "accion_adicional",
            subclase: "Filo del Alma",
            formulaDados: "1d4"
          },
          {
            nivel: 9,
            nombre: "Hojas del alma",
            descripcion: "Ahora puedes usar los siguientes poderes con tus Hojas psíquicas.\n\n***Golpes teledirigidos.*** Si haces una tirada de ataque con tu *Hoja psíquica* y fallas al objetivo, puedes tirar un Dado de energía psiónica y sumar el número obtenido a la tirada de ataque. Si esto hace que el ataque acierte, el dado se gasta.\n\n***Teletransporte psíquico.*** Como acción adicional, manifiestas una *Hoja psíquica*, gastas un Dado de energía psiónica y lo tiras, y lanzas la hoja a un espacio sin ocupar que puedas ver a una distancia de hasta un número de metros igual a 3 veces (10 pies) el número obtenido. Luego te teletransportas a ese espacio, y la hoja desaparece.",
            tipoAccion: "accion_adicional",
            subclase: "Filo del Alma"
          },
          {
            nivel: 13,
            nombre: "Velo psíquico",
            descripcion: "Puedes tejer un velo de estática psíquica para enmascararte. Como acción de magia, obtienes el estado de invisible durante 1 hora o hasta que disipes este efecto (no requiere acción). Esta invisibilidad termina antes de tiempo inmediatamente después de que inflijas daño a una criatura o de que obligues a una criatura a hacer una tirada de salvación.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo, a menos que gastes un Dado de energía psiónica (no requiere acción) para recuperar su uso.",
            tipoAccion: "accion",
            subclase: "Filo del Alma",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
          {
            nivel: 17,
            nombre: "Desgarrar la mente",
            descripcion: "Puedes barrer la mente de una criatura con tus Hojas psíquicas. Cuando usas tus Hojas psíquicas para infligir daño de Ataque furtivo a una criatura, puedes obligar a ese objetivo a hacer una tirada de salvación de Sabiduría (CD 8 más tu modificador por Destreza y bonificador por competencia). Si la tirada falla, el objetivo tiene el estado de aturdido durante 1 minuto. El objetivo aturdido repite la tirada de salvación al final de cada uno de sus turnos, terminando el efecto sobre sí mismo si tiene éxito.\nUna vez que uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo a menos que gastes tres Dados de energía psiónica (no requiere acción) para recuperar su uso.\n---",
            tipoAccion: "pasivo",
            subclase: "Filo del Alma",
            tieneUsosLimitados: true,
            recuperacion: "descanso_largo"
          },
        ]
      },
      {
        id: "ladron",
        clasePadre: "picaro",
        nombre: "Ladrón",
        descripcion: "Una mezcla de ladrón, buscador de tesoros y explorador, eres el epítome de un aventurero. Además de mejorar tu agilidad y sigilo, adquieres habilidades útiles para adentrarte en las ruinas y obtener el máximo beneficio de los objetos mágicos que encuentres en ellas.",
        lema: "Busca tesoros como un aventurero clásico",
        nivelDesbloqueo: 3,
        rasgos: [
          {
            nivel: 3,
            nombre: "Manos rápidas",
            descripcion: "Como acción adicional, puedes hacer una de las siguientes cosas.\n\n***Juego de manos.*** Hacer una prueba de Destreza (Juego de manos) para forzar una cerradura o desarmar una trampa con *Herramientas de ladrón* o para vaciar un bolsillo.\n\n***Usar un objeto.*** Llevar a cabo la acción de utilizar, o llevar a cabo la acción de magia para usar un objeto mágico que requiera esa acción.",
            tipoAccion: "accion_adicional",
            subclase: "Ladrón"
          },
          {
            nivel: 3,
            nombre: "Trabajo de segunda planta",
            descripcion: "Te has entrenado para llegar a lugares especialmente difíciles de alcanzar, lo que te otorga los siguientes beneficios.\n\n***Escalador.*** Ganas una velocidad trepando igual a tu velocidad.\n\n***Saltador.*** Puedes determinar la distancia de tu salto usando tu Destreza en lugar de tu Fuerza.",
            tipoAccion: "pasivo",
            subclase: "Ladrón"
          },
          {
            nivel: 9,
            nombre: "Sigilo supremo",
            descripcion: "Obtienes la siguiente opción de Golpe astuto.\n\n***Ataque sigiloso (Coste: 1d6).*** Si tienes el estado de invisible de la acción de esconderse, este ataque no termina ese estado en ti si terminas tu turno tras cobertura tres cuartos o cobertura total.",
            tipoAccion: "accion",
            subclase: "Ladrón",
            formulaDados: "1d6"
          },
          {
            nivel: 13,
            nombre: "Usar objeto mágico",
            descripcion: "Has aprendido cómo maximizar el uso de los objetos mágicos, lo que te otorga los siguientes beneficios.\n\n***Sintonización.*** Puedes sintonizarte con hasta cuatro objetos mágicos a la vez.\n\n***Cargas.*** Siempre que uses una propiedad de un objeto mágico que gaste cargas, tira 1d6. Con un resultado de 6, usas la propiedad sin gastar las cargas.\n\n***Pergaminos.*** Puedes usar cualquier *Pergamino de conjuro*, usando Inteligencia como tu aptitud mágica para el conjuro. Si el conjuro es un truco o un conjuro de nivel 1, puedes lanzarlo de forma fiable. Si el pergamino contiene un conjuro de mayor nivel, primero debes tener éxito en una prueba de Inteligencia (Conocimiento arcano) (CD 10 más el nivel del conjuro). Si tienes éxito en la prueba, lanzas el conjuro desde el pergamino. Si fallas la prueba, el pergamino se desintegra.",
            tipoAccion: "pasivo",
            subclase: "Ladrón",
            formulaDados: "1d6"
          },
          {
            nivel: 17,
            nombre: "Reflejos de ladrón",
            descripcion: "Eres un experto en tender emboscadas y escapar rápidamente del peligro. Puedes jugar dos turnos durante la primera ronda de cualquier combate. Juegas tu primer turno con tu iniciativa normal y tu segundo turno con tu iniciativa menos 10.",
            tipoAccion: "pasivo",
            subclase: "Ladrón"
          },
        ]
      },
    ]
  },
];

export const DICCIONARIO_CLASES_POR_NOMBRE: Record<string, DefinicionClase> = Object.fromEntries(
  CATALOGO_CLASES_DND55.map((c) => [c.nombre, c])
);

export const DICCIONARIO_CLASES_POR_ID: Record<string, DefinicionClase> = Object.fromEntries(
  CATALOGO_CLASES_DND55.map((c) => [c.id, c])
);

export const TODAS_SUBCLASES_DND55: DefinicionSubclase[] = CATALOGO_CLASES_DND55.flatMap((c) => c.subclases);

