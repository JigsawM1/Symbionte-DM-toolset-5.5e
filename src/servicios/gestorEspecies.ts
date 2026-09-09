import type {
  PersonajeJugador,
  RasgoPersonaje,
  TamanoPersonaje,
  DefinicionEspecie,
  DefinicionSubespecie,
  ConfiguracionEspeciePersonaje,
  OpcionesAplicarEspecie,
  ConjuroInnatoEspecie
} from "@/tipos";
import {
  CATALOGO_ESPECIES_DND55,
  DICCIONARIO_ESPECIES_POR_ID,
  DICCIONARIO_ESPECIES_POR_NOMBRE
} from "@/constantes/especiesDND55";

/**
 * Normaliza cadenas para búsquedas tolerantes a mayúsculas, diacríticos y espacios.
 */
export function normalizarTextoEspecie(texto: unknown): string {
  if (typeof texto !== "string") return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Retorna el catálogo canónico completo de especies oficiales de D&D 5.5e (2024).
 */
export function obtenerCatalogoEspecies(): DefinicionEspecie[] {
  return CATALOGO_ESPECIES_DND55;
}

/**
 * Busca una especie por su identificador único.
 */
export function obtenerEspeciePorId(id: string): DefinicionEspecie | undefined {
  if (!id) return undefined;
  const idNorm = normalizarTextoEspecie(id);
  return DICCIONARIO_ESPECIES_POR_ID[idNorm] || CATALOGO_ESPECIES_DND55.find((e) => normalizarTextoEspecie(e.id) === idNorm);
}

/**
 * Busca una especie de forma tolerante e insensible a acentos/mayúsculas por su nombre.
 */
export function obtenerEspeciePorNombre(nombre: string): DefinicionEspecie | undefined {
  if (!nombre) return undefined;
  const norm = normalizarTextoEspecie(nombre);
  if (DICCIONARIO_ESPECIES_POR_NOMBRE[norm]) {
    return DICCIONARIO_ESPECIES_POR_NOMBRE[norm];
  }
  return CATALOGO_ESPECIES_DND55.find((e) => {
    const eNorm = normalizarTextoEspecie(e.nombre);
    const idNorm = normalizarTextoEspecie(e.id);
    return eNorm === norm || idNorm === norm || eNorm.includes(norm) || norm.includes(eNorm);
  });
}

/**
 * Retorna las subespecies, linajes o legados correspondientes a una especie.
 */
export function obtenerSubespeciesDeEspecie(especieNombreOId: string): DefinicionSubespecie[] {
  const esp = obtenerEspeciePorId(especieNombreOId) || obtenerEspeciePorNombre(especieNombreOId);
  return esp?.subespecies || [];
}

/**
 * Busca una subespecie o linaje específico por nombre o ID.
 */
export function obtenerSubespeciePorNombre(
  especieNombreOId?: string,
  subespecieNombre?: string
): DefinicionSubespecie | undefined {
  if (!subespecieNombre) return undefined;
  const subNorm = normalizarTextoEspecie(subespecieNombre);

  if (especieNombreOId) {
    const subespecies = obtenerSubespeciesDeEspecie(especieNombreOId);
    const coincidencia = subespecies.find(
      (s) => normalizarTextoEspecie(s.id) === subNorm || normalizarTextoEspecie(s.nombre) === subNorm
    );
    if (coincidencia) return coincidencia;
  }

  // Búsqueda global entre todas las especies
  for (const esp of CATALOGO_ESPECIES_DND55) {
    if (!esp.subespecies) continue;
    const match = esp.subespecies.find(
      (s) => normalizarTextoEspecie(s.id) === subNorm || normalizarTextoEspecie(s.nombre) === subNorm
    );
    if (match) return match;
  }

  return undefined;
}

/**
 * Construye la lista de RasgoPersonaje listos para ser usados en la ficha del personaje.
 */
export function construirRasgosEspecie(
  especie: DefinicionEspecie,
  subespecie?: DefinicionSubespecie,
  _nivel: number = 1,
  bonificadorCompetencia: number = 2,
  tamanoElegido?: TamanoPersonaje
): RasgoPersonaje[] {
  const plantillas = [
    ...especie.rasgos,
    ...(subespecie?.rasgos || [])
  ];

  // 1. Garantizar presencia de "Tipo de criatura" si no está explícito en plantillas
  const tieneTipoCriatura = plantillas.some(
    (p) => normalizarTextoEspecie(p.nombre) === "tipo de criatura"
  );
  if (!tieneTipoCriatura) {
    plantillas.unshift({
      nombre: "Tipo de criatura",
      descripcion: `Eres una criatura del tipo ${especie.tipoCriatura || "Humanoide"}.`,
      tipoAccion: "pasivo",
      categoriaMecanica: "pasivo_permanente"
    });
  }

  // 2. Garantizar presencia de "Tamaño" si no está explícito en plantillas
  const tieneTamano = plantillas.some(
    (p) => normalizarTextoEspecie(p.nombre) === "tamano"
  );
  if (!tieneTamano) {
    const esMultitamano = Array.isArray(especie.tamanoOpciones) && especie.tamanoOpciones.length > 1;
    if (esMultitamano) {
      plantillas.splice(1, 0, {
        nombre: "Tamaño",
        descripcion: `Eres ${especie.tamanoOpciones.join(" o ")}. Eliges el tamaño cuando seleccionas esta especie.`,
        tipoAccion: "pasivo",
        categoriaMecanica: "selector_informativo",
        selectores: [
          {
            id: "selector_tamano_especie",
            tipo: "unico",
            etiqueta: "Tamaño",
            maxSelecciones: 1,
            opciones: especie.tamanoOpciones.map((t) => ({
              id: normalizarTextoEspecie(t),
              nombre: t,
              descripcion: `Tu personaje es de tamaño ${t}.`
            })),
            valorActual: [normalizarTextoEspecie(tamanoElegido || especie.tamanoPorDefecto || "Mediano")]
          }
        ]
      });
    } else {
      const tamFijo = especie.tamanoPorDefecto || (especie.tamanoOpciones?.[0]) || "Mediano";
      plantillas.splice(1, 0, {
        nombre: "Tamaño",
        descripcion: `Eres de tamaño ${tamFijo}.`,
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      });
    }
  }

  const nombreEspecie = especie.nombre;
  const nombreSubespecie = subespecie?.nombre;
  const fuenteTexto = `Especie: ${nombreEspecie}${nombreSubespecie ? ` (${nombreSubespecie})` : ""}`;

  return plantillas.map((p) => {
    const id = `rasgo_esp_${normalizarTextoEspecie(especie.id)}_${normalizarTextoEspecie(p.nombre).replace(/\s+/g, "_")}`;
    const usos = p.tieneUsosLimitados ? p.usosMaximos || 1 : undefined;

    // Fórmulas dinámicas dependientes de bonificador de competencia (ej. Manos curativas: PB d4)
    let formulaDados = p.formulaDados;
    if (p.formulaEscalado === "bono_competencia" && p.formulaDados?.endsWith("d4")) {
      formulaDados = `${bonificadorCompetencia}d4`;
    }

    // Configurar el tamaño actual elegido en el selector si el rasgo es Tamaño
    let selectoresProcesados = p.selectores ? JSON.parse(JSON.stringify(p.selectores)) : [];
    if (normalizarTextoEspecie(p.nombre) === "tamano" && selectoresProcesados.length > 0) {
      const valorTamano = normalizarTextoEspecie(tamanoElegido || especie.tamanoPorDefecto || "mediano");
      selectoresProcesados = selectoresProcesados.map((s: { id: string; valorActual: string[] }) => {
        if (s.id === "selector_tamano_especie" || s.id.includes("tamano")) {
          return { ...s, valorActual: [valorTamano] };
        }
        return s;
      });
    }

    return {
      id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      origen: "especie",
      fuente: fuenteTexto,
      tipoAccion: p.tipoAccion,
      nivelRequerido: p.nivelRequerido,
      tieneUsosLimitados: !!p.tieneUsosLimitados,
      usosMaximos: usos,
      usosRestantes: usos,
      recuperacion: p.recuperacion || "ninguno",
      formulaDados,
      personalizado: false,
      activo: p.esActivable ? false : true,
      esActivable: p.esActivable,
      autoDesactivar: p.autoDesactivar,
      ligadoA: p.ligadoA,
      condicionAlActivar: p.condicionAlActivar,
      conjurosOtorgados: p.conjurosOtorgados ? [...p.conjurosOtorgados] : [],
      categoriaMecanica: p.categoriaMecanica,
      formulaEscalado: p.formulaEscalado,
      efectos: p.efectos ? [...p.efectos] : [],
      selectores: selectoresProcesados,
      tablaProgresion: p.tablaProgresion,
      notas: ""
    };
  });
}

/**
 * Aplica una especie y subespecie configurada a un personaje de forma inmutable y genérica.
 * Diseñada para ser consumida directamente por el constructor de personajes (builder).
 */
export function aplicarEspecieAPersonaje(
  personaje: PersonajeJugador,
  config: ConfiguracionEspeciePersonaje,
  opciones: OpcionesAplicarEspecie = {}
): PersonajeJugador {
  const especie = obtenerEspeciePorId(config.especieId) || obtenerEspeciePorNombre(config.especieId);
  if (!especie) return personaje;

  const subespecie = config.subespecieId
    ? obtenerSubespeciePorNombre(especie.id, config.subespecieId)
    : undefined;

  const nivelPj = Math.max(1, Math.min(20, personaje.nivel || 1));
  const bonoCompetencia = Math.floor((nivelPj - 1) / 4) + 2;

  // 1. Tamaño: respetando elección del usuario o fallback de la especie
  let tamanoFinal: TamanoPersonaje = personaje.tamano || "Mediano";
  if (opciones.sobrescribirTamano !== false) {
    if (config.tamanoElegido && especie.tamanoOpciones.includes(config.tamanoElegido)) {
      tamanoFinal = config.tamanoElegido;
    } else if (subespecie?.modificadores?.tamano) {
      tamanoFinal = subespecie.modificadores.tamano;
    } else {
      tamanoFinal = especie.tamanoPorDefecto;
    }
  }

  // 2. Velocidad base
  let velocidadFinal = personaje.velocidad;
  if (opciones.sobrescribirVelocidad !== false) {
    const velocidadBaseNum = subespecie?.modificadores?.velocidad || especie.velocidadBase || 30;
    velocidadFinal = typeof personaje.velocidad === "object" && personaje.velocidad !== null
      ? { ...personaje.velocidad, caminar: velocidadBaseNum }
      : `${velocidadBaseNum} pies`;
  }

  // 3. Sentidos / Visión en la oscuridad
  let sentidosFinal = personaje.sentidos;
  if (opciones.sobrescribirSentidos !== false) {
    const visionAlcance = subespecie?.modificadores?.visionOscuridad ?? especie.visionOscuridad;
    if (visionAlcance > 0) {
      if (typeof personaje.sentidos === "object" && personaje.sentidos !== null) {
        sentidosFinal = { ...personaje.sentidos, visionOscuridad: visionAlcance };
      } else {
        sentidosFinal = `Visión en la oscuridad ${visionAlcance} pies`;
      }
    }
  }

  // 4. Conjuros innatos otorgados (trucos y hechizos base de especie como Portador de luz)
  const trucosNuevos = new Set(personaje.trucosConocidosIds || []);
  const conjurosSiemprePreparados = new Set(personaje.conjurosSiemprePreparadosIds || []);

  if (opciones.sincronizarHechizosInnatos !== false) {
    const listaInnatos: ConjuroInnatoEspecie[] = [
      ...(especie.conjurosInnatos || []),
      ...(subespecie?.conjurosInnatos || [])
    ];

    for (const conjuro of listaInnatos) {
      const cumpleNivel = !conjuro.nivelRequerido || nivelPj >= conjuro.nivelRequerido;
      if (cumpleNivel) {
        if (conjuro.esTruco) {
          trucosNuevos.add(conjuro.hechizoId);
        } else {
          conjurosSiemprePreparados.add(conjuro.hechizoId);
        }
      }
    }
  }

  // 5. Rasgos de especie: purgar rasgos previos de especie y añadir los nuevos
  let rasgosFinales = [...(personaje.rasgos || [])];
  if (opciones.sincronizarRasgos !== false) {
    const rasgosEspecieNuevos = construirRasgosEspecie(especie, subespecie, nivelPj, bonoCompetencia, tamanoFinal);
    // Preservar rasgos de clase, dotes, trasfondo y personalizados
    const rasgosConservados = rasgosFinales.filter((r) => r.origen !== "especie");
    rasgosFinales = [...rasgosConservados, ...rasgosEspecieNuevos];
  }

  return {
    ...personaje,
    especie: especie.nombre,
    subespecie: subespecie ? subespecie.nombre : "",
    tamano: tamanoFinal,
    tipoCriatura: especie.tipoCriatura || "Humanoide",
    velocidad: velocidadFinal,
    sentidos: sentidosFinal,
    trucosConocidosIds: Array.from(trucosNuevos),
    conjurosSiemprePreparadosIds: Array.from(conjurosSiemprePreparados),
    rasgos: rasgosFinales
  };
}
