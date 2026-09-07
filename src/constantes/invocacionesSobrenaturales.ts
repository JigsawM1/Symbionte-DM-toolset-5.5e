import type { InvocacionSobrenatural, OpcionSelector } from "@/tipos/rasgos";

// =========================================================================
// CATÁLOGO OFICIAL DE INVOCACIONES SOBRENATURALES DEL BRUJO (D&D 5.5e / 2024)
// Fuente: dicionario_herramientas/clases/invocaciones_sobrenaturales.md
// =========================================================================

export const CATALOGO_INVOCACIONES_SOBRENATURALES: InvocacionSobrenatural[] = [
  {
    id: "armadura_de_sombras",
    nombre: "Armadura de sombras",
    nivelMinimo: 1,
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *armadura de mago* sobre ti sin gastar un espacio de conjuro.",
    conjuroGratuito: "armadura de mago",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Armadura de mago",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Armadura de mago sobre ti mismo sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "mente_sobrenatural",
    nombre: "Mente sobrenatural",
    nivelMinimo: 1,
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "Tienes ventaja en las tiradas de salvación de Constitución que realices para mantener la concentración.",
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
    id: "pacto_de_la_cadena",
    nombre: "Pacto de la cadena",
    nivelMinimo: 1,
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Aprendes el conjuro *encontrar familiar* y puedes lanzarlo como acción de magia sin gastar un espacio de conjuro. Cuando lo lances, escoge entre una de las formas habituales para tu familiar o una de las siguientes formas especiales: diablillo, duende, esfinge de las maravillas, esqueleto, pseudodragón, quasit, renacuajo slaad o serpiente venenosa.\nAsimismo, cuando realizas la acción de atacar, puedes renunciar a uno de tus propios ataques para que el familiar realice un ataque propio con su reacción.",
    conjuroGratuito: "encontrar familiar",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Encontrar familiar",
        valor: "sin_espacio",
        descripcion: "Lanza Encontrar familiar como acción de magia sin gastar espacios de conjuro con formas especiales"
      }
    ]
  },
  {
    id: "pacto_del_filo",
    nombre: "Pacto del filo",
    nivelMinimo: 1,
    tipoAccion: "accion_adicional",
    repetible: false,
    descripcion: "Como acción adicional, puedes conjurar en tu mano un arma de pacto, un arma cuerpo a cuerpo sencilla o marcial de tu elección con la que estableces un vínculo. Como alternativa, puedes vincularte con un arma mágica que toques, pero no podrás hacerlo si otra criatura está sintonizada con ella o si otro brujo está vinculado con ella. Hasta que termine el vínculo, tendrás competencia con esa arma y podrás usarla como canalizador mágico.\nSiempre que ataques con el arma vinculada, puedes usar tu modificador por Carisma para las tiradas de ataque y de daño en lugar del modificador por Fuerza o Destreza. Además, puedes hacer que cause daño necrótico, psíquico o radiante en lugar de su tipo de daño normal.\nTu vínculo con el arma se rompe si vuelves a usar la acción adicional de este rasgo, si el arma está a más de 5 pies de ti durante 1 minuto o más o si mueres. Un arma conjurada desaparece cuando termina el vínculo.",
    efectos: [
      {
        tipo: "personalizado",
        objetivo: "arma_pacto",
        valor: "carisma",
        descripcion: "Permite usar el modificador de Carisma para tiradas de ataque y daño con el arma vinculada del pacto"
      }
    ]
  },
  {
    id: "pacto_del_grimorio",
    nombre: "Pacto del grimorio",
    nivelMinimo: 1,
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "Uniendo hebras de sombras, conjuras un libro en tu mano al terminar un descanso corto o largo. Este Libro de las sombras (tú eliges su aspecto) contiene magia sobrenatural a la que solo tú puedes acceder y que te proporciona los beneficios presentados a continuación. El libro desaparece si conjuras otro con este rasgo o si mueres.\n- **Trucos y rituales.** Cuando aparezca el libro, elige tres trucos y dos conjuros de nivel 1 que estén marcados como “ritual”. Los conjuros pueden ser de la lista de cualquier clase y deben ser conjuros que no tengas ya preparados. Mientras lleves el libro contigo, tendrás preparados los conjuros elegidos y funcionarán como conjuros de brujo para ti.\n- **Canalizador mágico.** Puedes usar el libro como canalizador mágico.",
    efectos: [
      {
        tipo: "personalizado",
        objetivo: "libro_de_las_sombras",
        valor: "3_trucos_2_rituales",
        descripcion: "Libro de las sombras: canalizador mágico, 3 trucos y 2 conjuros rituales de nivel 1 de cualquier clase"
      }
    ]
  },
  {
    id: "descarga_agonica",
    nombre: "Descarga agónica",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+, un truco de brujo que cause daño",
    tipoAccion: "pasivo",
    repetible: true,
    descripcion: "Elige uno de tus trucos de brujo que conozcas y cause daño. Puedes sumar tu modificador por Carisma a las tiradas de daño del conjuro.\n\n**Repetible.** Puedes obtener esta invocación más de una vez. Cada vez que lo hagas, elige un truco distinto que cumpla las condiciones.",
    efectos: [
      {
        tipo: "personalizado",
        objetivo: "truco_dano_carisma",
        valor: "carisma",
        descripcion: "Suma tu modificador por Carisma a las tiradas de daño del truco de brujo elegido"
      }
    ]
  },
  {
    id: "descarga_ahuyentadora",
    nombre: "Descarga ahuyentadora",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+, un truco de brujo que cause daño mediante tirada de ataque",
    tipoAccion: "pasivo",
    repetible: true,
    descripcion: "Elige uno de tus trucos de brujo que conozcas y requiera una tirada de ataque. Cuando aciertes a una criatura Grande o más pequeña con ese truco, puedes empujarla hasta 10 pies respecto a ti en línea recta.\n\n**Repetible.** Puedes obtener esta invocación más de una vez. Cada vez que lo hagas, elige un truco distinto que cumpla las condiciones."
  },
  {
    id: "lanza_sobrenatural",
    nombre: "Lanza sobrenatural",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+, un truco de brujo que cause daño con alcance de 10 pies o más",
    tipoAccion: "pasivo",
    repetible: true,
    descripcion: "Elige uno de tus trucos de brujo que conozcas, cause daño y tenga un alcance de 10 pies o más. Cuando lances ese conjuro, su alcance aumenta una cantidad de pies igual a 10 veces tu nivel de brujo.\n\n**Repetible.** Puedes obtener esta invocación más de una vez. Cada vez que lo hagas, elige un truco distinto que cumpla las condiciones."
  },
  {
    id: "lecciones_de_los_primeros",
    nombre: "Lecciones de los Primeros",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+",
    tipoAccion: "pasivo",
    repetible: true,
    descripcion: "Has obtenido conocimientos de un ente anciano del multiverso, lo que te permite obtener una dote de origen de tu elección.\n\n**Repetible.** Puedes obtener esta invocación más de una vez. Cada vez que lo hagas, elige una dote de origen distinta."
  },
  {
    id: "mascara_de_los_mil_rostros",
    nombre: "Máscara de los mil rostros",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *disfrazarse* sin gastar un espacio de conjuro.",
    conjuroGratuito: "disfrazarse",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Disfrazarse",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Disfrazarse a voluntad sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "salto_sobrenatural",
    nombre: "Salto sobrenatural",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *salto* sobre ti sin gastar un espacio de conjuro.",
    conjuroGratuito: "salto",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Salto",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Salto sobre ti mismo a voluntad sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "vigor_infernal",
    nombre: "Vigor infernal",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *falsa vida* sobre ti sin gastar un espacio de conjuro. Si lanzas el conjuro con este rasgo, no tiras el dado para los puntos de golpe temporales; en su lugar, obtienes automáticamente el número más alto en el dado.",
    conjuroGratuito: "falsa vida",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Falsa vida",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Falsa vida sobre ti mismo a voluntad sin gastar espacios de conjuro (obtiene el valor máximo del dado)"
      }
    ]
  },
  {
    id: "visiones_brumosas",
    nombre: "Visiones brumosas",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *imagen silenciosa* sin gastar un espacio de conjuro.",
    conjuroGratuito: "imagen silenciosa",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Imagen silenciosa",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Imagen silenciosa a voluntad sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "vista_del_diablo",
    nombre: "Vista del diablo",
    nivelMinimo: 2,
    requisitoPrevio: "Brujo nivel 2+",
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "Puedes ver con normalidad en luz tenue y en la oscuridad, tanto si son mágicas como si no, a una distancia de 120 pies o menos de ti."
  },
  {
    id: "castigo_arcano",
    nombre: "Castigo arcano",
    nivelMinimo: 5,
    requisitoPrevio: "Brujo nivel 5+, invocación Pacto del filo",
    requisitoInvocacion: "pacto_del_filo",
    tipoAccion: "especial",
    repetible: false,
    descripcion: "Una vez por turno, cuando aciertes a una criatura con tu arma de pacto, puedes gastar un espacio de conjuro de Magia del pacto para causar 1d8 de daño de fuerza adicional al objetivo más 1d8 por cada nivel del espacio de conjuro. Además, puedes imponerle el estado de derribado al objetivo si es Enorme o más pequeño."
  },
  {
    id: "don_de_las_profundidades",
    nombre: "Don de las profundidades",
    nivelMinimo: 5,
    requisitoPrevio: "Brujo nivel 5+",
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "Puedes respirar bajo el agua y obtienes una velocidad nadando igual a tu velocidad.\nTambién puedes lanzar *respirar bajo el agua* una vez sin gastar un espacio de conjuro. Recuperas la capacidad de lanzarlo de este modo tras finalizar un descanso largo.",
    conjuroGratuito: "respirar bajo el agua",
    recuperacionConjuro: "descanso_largo",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Respirar bajo el agua",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Respirar bajo el agua 1 vez por descanso largo sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "filo_sediento",
    nombre: "Filo sediento",
    nivelMinimo: 5,
    requisitoPrevio: "Brujo nivel 5+, invocación Pacto del filo",
    requisitoInvocacion: "pacto_del_filo",
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "Obtienes el rasgo Ataque adicional, pero solo para tu arma de pacto. Este rasgo te permite hacer dos ataques con esa arma en lugar de uno cuando lleves a cabo la acción de atacar en tu turno.",
    efectos: [
      {
        tipo: "personalizado",
        objetivo: "ataque_adicional_arma_pacto",
        valor: 2,
        descripcion: "Ataque adicional: permite realizar 2 ataques con tu arma de pacto al atacar"
      }
    ]
  },
  {
    id: "inversion_del_amo_de_las_cadenas",
    nombre: "Inversión del amo de las cadenas",
    nivelMinimo: 5,
    requisitoPrevio: "Brujo nivel 5+, invocación Pacto de la cadena",
    requisitoInvocacion: "pacto_de_la_cadena",
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "Cuando lanzas *encontrar familiar*, imbuyes al familiar invocado de una cierta cantidad de tu poder sobrenatural, lo que le otorga a la criatura los siguientes beneficios:\n- **Acuático o aéreo.** El familiar obtiene una velocidad nadando o una velocidad volando (a tu elección) de 40 pies.\n- **Ataque rápido.** Como acción adicional, puedes ordenar al familiar que realice la acción de atacar.\n- **Daño necrótico o radiante.** Siempre que el familiar haga daño contundente, cortante o perforante, puedes hacer que cause daño necrótico o radiante en su lugar.\n- **Tu CD de salvación.** Si el familiar obliga a una criatura a realizar una tirada de salvación, esta utiliza tu CD de salvación de conjuros.\n- **Resistencia.** Cuando el familiar recibe daño, puedes usar una reacción para otorgarle resistencia contra ese daño."
  },
  {
    id: "maestro_de_las_formas_innumerables",
    nombre: "Maestro de las formas innumerables",
    nivelMinimo: 5,
    requisitoPrevio: "Brujo nivel 5+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *alterar el propio aspecto* sin gastar un espacio de conjuro.",
    conjuroGratuito: "alterar el propio aspecto",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Alterar el propio aspecto",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Alterar el propio aspecto a voluntad sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "mirada_de_las_dos_mentes",
    nombre: "Mirada de las dos mentes",
    nivelMinimo: 5,
    requisitoPrevio: "Brujo nivel 5+",
    tipoAccion: "accion_adicional",
    repetible: false,
    descripcion: "Puedes usar una acción adicional para tocar a una criatura voluntaria y percibir el mundo a través de sus sentidos hasta el final de tu siguiente turno. Mientras la criatura permanezca en el mismo plano de existencia que tú, podrás utilizar una acción adicional en cada uno de los turnos posteriores para mantener esta conexión y alargar la duración de este efecto hasta el final de tu siguiente turno. La conexión termina si no la mantienes de esta forma.\nMientras percibes el mundo a través de los ojos de la otra criatura, te beneficias de cualquier sentido especial que tenga y puedes lanzar conjuros como si estuvieras en tu espacio o en el espacio de la otra criatura si están a 60 pies o menos de distancia."
  },
  {
    id: "paso_ascendente",
    nombre: "Paso ascendente",
    nivelMinimo: 5,
    requisitoPrevio: "Brujo nivel 5+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *levitar* sobre ti sin gastar un espacio de conjuro.",
    conjuroGratuito: "levitar",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Levitar",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Levitar sobre ti mismo a voluntad sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "uno_con_las_sombras",
    nombre: "Uno con las sombras",
    nivelMinimo: 5,
    requisitoPrevio: "Brujo nivel 5+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Mientras estés en una zona de luz tenue u oscuridad, puedes lanzar *invisibilidad* sobre ti sin gastar un espacio de conjuro.",
    conjuroGratuito: "invisibilidad",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Invisibilidad",
        valor: "sin_espacio",
        condicion: "luz_tenue_u_oscuridad",
        descripcion: "Permite lanzar Invisibilidad sobre ti mismo en luz tenue u oscuridad sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "susurros_del_sepulcro",
    nombre: "Susurros del sepulcro",
    nivelMinimo: 7,
    requisitoPrevio: "Brujo nivel 7+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *hablar con los muertos* sin gastar un espacio de conjuro.",
    conjuroGratuito: "hablar con los muertos",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Hablar con los muertos",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Hablar con los muertos a voluntad sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "devorador_de_vida",
    nombre: "Devorador de vida",
    nivelMinimo: 9,
    requisitoPrevio: "Brujo nivel 9+, invocación Pacto del filo",
    requisitoInvocacion: "pacto_del_filo",
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "Una vez por turno, cuando aciertes a una criatura con tu arma de pacto, puedes causarle 1d6 de daño necrótico, psíquico o radiante adicional (a tu elección) a esa criatura y gastar uno de tus dados de puntos de golpe para tirarlo y recuperar una cantidad de puntos de golpe igual al resultado más tu modificador por Constitución (mínimo 1 punto de golpe).",
    efectos: [
      {
        tipo: "dado_extra_dano",
        objetivo: "arma_pacto",
        valor: "1d6",
        descripcion: "1d6 de daño adicional (necrótico, psíquico o radiante) al acertar con arma de pacto (1/turno)"
      }
    ]
  },
  {
    id: "don_de_los_protectores",
    nombre: "Don de los protectores",
    nivelMinimo: 9,
    requisitoPrevio: "Brujo nivel 9+, invocación Pacto del grimorio",
    requisitoInvocacion: "pacto_del_grimorio",
    tipoAccion: "reaccion",
    repetible: false,
    descripcion: "Aparece una nueva página en el Libro de las sombras cuando lo conjuras. Con tu permiso, una criatura puede usar una acción para escribir su nombre en esa página, que puede contener una cantidad de nombres igual a tu modificador por Carisma (mínimo un nombre).\nCuando los puntos de golpe de cualquier criatura cuyo nombre esté en la página se reduzcan a 0, pero no muera, en vez de eso pasará a tener 1 punto de golpe mágicamente. Cuando esta magia se active, ninguna criatura podrá beneficiarse de ella hasta que finalices un descanso largo.\nComo acción de magia, puedes borrar un nombre de la página tocándolo."
  },
  {
    id: "visiones_de_reinos_remotos",
    nombre: "Visiones de reinos remotos",
    nivelMinimo: 9,
    requisitoPrevio: "Brujo nivel 9+",
    tipoAccion: "accion",
    repetible: false,
    descripcion: "Puedes lanzar *ojo arcano* sin gastar un espacio de conjuro.",
    conjuroGratuito: "ojo arcano",
    recuperacionConjuro: "ilimitado",
    efectos: [
      {
        tipo: "conjuro_gratuito",
        objetivo: "Ojo arcano",
        valor: "sin_espacio",
        descripcion: "Permite lanzar Ojo arcano a voluntad sin gastar espacios de conjuro"
      }
    ]
  },
  {
    id: "hoja_devoradora",
    nombre: "Hoja devoradora",
    nivelMinimo: 12,
    requisitoPrevio: "Brujo nivel 12+, invocación Filo sediento",
    requisitoInvocacion: "filo_sediento",
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "El rasgo Ataque adicional de tu invocación Filo sediento otorga dos ataques adicionales en vez de uno (tres ataques en total)."
  },
  {
    id: "vision_bruja",
    nombre: "Visión bruja",
    nivelMinimo: 15,
    requisitoPrevio: "Brujo nivel 15+",
    tipoAccion: "pasivo",
    repetible: false,
    descripcion: "Tienes visión verdadera hasta 30 pies."
  }
];

/**
 * Tabla canónica de progresión de invocaciones conocidas del Brujo (D&D 5.5e / 2024).
 * Nivel 1: 1
 * Nivel 2-4: 3
 * Nivel 5-6: 5
 * Nivel 7-8: 6
 * Nivel 9-11: 7
 * Nivel 12-20: 8
 */
export function obtenerMaxInvocacionesBrujo(nivelBrujo: number): number {
  const n = Math.max(1, Math.min(20, Math.floor(nivelBrujo) || 1));
  if (n >= 12) return 8;
  if (n >= 9) return 7;
  if (n >= 7) return 6;
  if (n >= 5) return 5;
  if (n >= 2) return 3;
  return 1;
}

/**
 * Genera la lista de opciones para el selector interactivo de Invocaciones Sobrenaturales
 * a partir del catálogo canónico.
 */
export function generarOpcionesSelectorInvocaciones(_nivelBrujo: number = 20): OpcionSelector[] {
  return CATALOGO_INVOCACIONES_SOBRENATURALES.map((inv) => {
    let desc = inv.descripcion;
    if (inv.requisitoPrevio) {
      desc = `**Requisitos:** ${inv.requisitoPrevio}\n\n${desc}`;
    }

    return {
      id: inv.id,
      nombre: inv.nombre,
      descripcion: desc,
      nivelMinimo: inv.nivelMinimo,
      requisito: inv.requisitoPrevio,
      requisitoInvocacion: inv.requisitoInvocacion,
      repetible: inv.repetible,
      efectos: inv.efectos ? JSON.parse(JSON.stringify(inv.efectos)) : undefined
    };
  });
}
