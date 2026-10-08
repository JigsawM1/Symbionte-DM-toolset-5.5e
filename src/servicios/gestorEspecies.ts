import type {
  PersonajeJugador,
  RasgoPersonaje,
  TamanoPersonaje,
  DefinicionEspecie,
  DefinicionSubespecie,
  ConfiguracionEspeciePersonaje,
  OpcionesAplicarEspecie,
  ConjuroInnatoEspecie,
  RecuperacionRasgo,
  SelectorRasgo
} from "@/tipos";
import {
  CATALOGO_ESPECIES_DND55,
  DICCIONARIO_ESPECIES_POR_ID,
  DICCIONARIO_ESPECIES_POR_NOMBRE
} from "@/constantes/especiesDND55";
import { calcularBonoHPMaximoRasgos } from "./evaluadorEfectosRasgos";
import { resolverEscaladosRasgo } from "./clases/escaladosRasgos";
import { obtenerOpcionesDinamicas } from "./hidratadorDotes";
import { DOTES_ORIGEN_DND55 } from "@/constantes/dotesConstantes";

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
 * Obtiene la etiqueta canónica declarativa de la subespecie para una especie (ej. "Legado Dracónico", "Legado Infernal").
 * Si la especie no define una etiqueta particular, devuelve el valor genérico "Subespecie / Linaje".
 */
export function obtenerEtiquetaSubespecie(especieNombreOId?: string): string {
  if (!especieNombreOId) return "Subespecie / Legado / Linaje";
  const esp = obtenerEspeciePorId(especieNombreOId) || obtenerEspeciePorNombre(especieNombreOId);
  return esp?.etiquetaSubespecie || "Subespecie / Legado / Linaje";
}

/**
 * Busca una subespecie o linaje específico por nombre o ID con búsqueda tolerante.
 */
export function obtenerSubespeciePorNombre(
  especieNombreOId?: string,
  subespecieNombre?: string
): DefinicionSubespecie | undefined {
  if (!subespecieNombre) return undefined;
  const subNorm = normalizarTextoEspecie(subespecieNombre);

  const coincide = (s: DefinicionSubespecie): boolean => {
    const sIdNorm = normalizarTextoEspecie(s.id);
    const sNomNorm = normalizarTextoEspecie(s.nombre);
    return (
      sIdNorm === subNorm ||
      sNomNorm === subNorm ||
      sNomNorm.includes(subNorm) ||
      subNorm.includes(sNomNorm) ||
      sIdNorm.includes(subNorm)
    );
  };

  if (especieNombreOId) {
    const subespecies = obtenerSubespeciesDeEspecie(especieNombreOId);
    const coincidencia = subespecies.find(coincide);
    if (coincidencia) return coincidencia;
  }

  // Búsqueda global entre todas las especies
  for (const esp of CATALOGO_ESPECIES_DND55) {
    if (!esp.subespecies) continue;
    const match = esp.subespecies.find(coincide);
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
  nivel: number = 1,
  bonificadorCompetencia: number = 2,
  tamanoElegido?: TamanoPersonaje
): RasgoPersonaje[] {
  // 1. Plantillas base de la especie
  const plantillasBase = [...especie.rasgos];

  // Garantizar presencia de "Tipo de criatura" si no está explícito en plantillas
  const tieneTipoCriatura = plantillasBase.some(
    (p) => normalizarTextoEspecie(p.nombre) === "tipo de criatura"
  );
  if (!tieneTipoCriatura) {
    plantillasBase.unshift({
      nombre: "Tipo de criatura",
      descripcion: `Eres una criatura del tipo ${especie.tipoCriatura || "Humanoide"}.`,
      tipoAccion: "pasivo",
      categoriaMecanica: "pasivo_permanente"
    });
  }

  // Garantizar presencia de "Tamaño" si no está explícito en plantillas
  const tieneTamano = plantillasBase.some(
    (p) => normalizarTextoEspecie(p.nombre) === "tamano"
  );
  if (!tieneTamano) {
    const esMultitamano = Array.isArray(especie.tamanoOpciones) && especie.tamanoOpciones.length > 1;
    if (esMultitamano) {
      plantillasBase.splice(1, 0, {
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
      plantillasBase.splice(1, 0, {
        nombre: "Tamaño",
        descripcion: `Eres de tamaño ${tamFijo}.`,
        tipoAccion: "pasivo",
        categoriaMecanica: "pasivo_permanente"
      });
    }
  }

  // Mapear rasgos base de la especie (origen: "especie")
  const rasgosBaseProcesados: RasgoPersonaje[] = plantillasBase.map((p) => {
    const id = `rasgo_esp_${normalizarTextoEspecie(especie.id)}_${normalizarTextoEspecie(p.nombre).replace(/\s+/g, "_")}`;
    let usos = p.tieneUsosLimitados ? p.usosMaximos || 1 : undefined;
    if (p.obtenerUsosMaximos) {
      usos = p.obtenerUsosMaximos(nivel, bonificadorCompetencia);
    } else if (p.tieneUsosLimitados && p.formulaEscalado === "bono_competencia" && !p.formulaDados) {
      usos = bonificadorCompetencia;
    }

    let formulaDados = p.formulaDados;
    if (p.formulaEscalado === "bono_competencia" && p.formulaDados?.endsWith("d4")) {
      formulaDados = `${bonificadorCompetencia}d4`;
    }

    let selectoresProcesados: SelectorRasgo[] = (p.selectores ? JSON.parse(JSON.stringify(p.selectores)) : []).map(
      (s: SelectorRasgo) => {
        if (s.claveOpcionesDinamicas && (!s.opciones || s.opciones.length === 0)) {
          return {
            ...s,
            opciones: obtenerOpcionesDinamicas(s.claveOpcionesDinamicas)
          };
        }
        return s;
      }
    );
    if (normalizarTextoEspecie(p.nombre) === "tamano" && selectoresProcesados.length > 0) {
      const valorTamano = normalizarTextoEspecie(tamanoElegido || especie.tamanoPorDefecto || "mediano");
      selectoresProcesados = selectoresProcesados.map((s: SelectorRasgo) => {
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
      fuente: `Especie: ${especie.nombre}`,
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
      gastarDePadre: p.gastarDePadre,
      heredarDadosPadre: p.heredarDadosPadre,
      condicionAlActivar: p.condicionAlActivar,
      duracionEfectoAlActivar: p.duracionEfectoAlActivar,
      conjurosOtorgados: p.conjurosOtorgados ? [...p.conjurosOtorgados] : [],
      categoriaMecanica: p.categoriaMecanica,
      formulaEscalado: p.formulaEscalado,
      escaladoFormulaDados: p.escaladoFormulaDados,
      escaladoUsos: p.escaladoUsos ? { ...p.escaladoUsos, minimo: p.escaladoUsos.minimo ?? 1 } : undefined,
      escaladoRecuperacion: p.escaladoRecuperacion,
      sincronizarEfectosConFormula: p.sincronizarEfectosConFormula,
      efectos: p.efectos ? [...p.efectos] : [],
      selectores: selectoresProcesados,
      tablaProgresion: p.tablaProgresion,
      notas: ""
    };
  });

  // Mapear rasgos de la subespecie / legado (origen: "subespecie")
  const prefijoFuente = especie.etiquetaSubespecie
    ? especie.etiquetaSubespecie.split(" ")[0]
    : "Subespecie";

  const rasgosSubespecieProcesados: RasgoPersonaje[] = (subespecie?.rasgos || []).map((p) => {
      const id = `rasgo_sub_${normalizarTextoEspecie(especie.id)}_${normalizarTextoEspecie(subespecie?.id || "")}_${normalizarTextoEspecie(p.nombre).replace(/\s+/g, "_")}`;

      // Escalado de usos según bonificador de competencia o función dedicada
      let usos = p.tieneUsosLimitados ? p.usosMaximos || 1 : undefined;
      if (p.obtenerUsosMaximos) {
        usos = p.obtenerUsosMaximos(nivel, bonificadorCompetencia);
      } else if (p.tieneUsosLimitados && p.formulaEscalado === "bono_competencia") {
        usos = bonificadorCompetencia;
      }

      const efectosBase = p.efectos ? [...p.efectos] : [];
      const selectoresBase: SelectorRasgo[] = (p.selectores ? JSON.parse(JSON.stringify(p.selectores)) : []).map(
        (s: SelectorRasgo) => {
          if (s.claveOpcionesDinamicas && (!s.opciones || s.opciones.length === 0)) {
            return {
              ...s,
              opciones: obtenerOpcionesDinamicas(s.claveOpcionesDinamicas)
            };
          }
          return s;
        }
      );

      const escalados = resolverEscaladosRasgo(
        {
          formulaDados: p.formulaDados,
          recuperacion: p.recuperacion,
          sincronizarEfectosConFormula: p.sincronizarEfectosConFormula,
          escaladoFormulaDados: p.escaladoFormulaDados,
          escaladoUsos: p.escaladoUsos,
          escaladoRecuperacion: p.escaladoRecuperacion
        },
        nivel,
        efectosBase,
        selectoresBase
      );

      const formulaDados = escalados.formulaDados;
      const usosFinales = escalados.usosEscalados ?? usos;

      return {
        id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        origen: "subespecie",
        fuente: `${prefijoFuente}: ${subespecie?.nombre || ""}`,
        tipoAccion: p.tipoAccion,
        nivelRequerido: p.nivelRequerido,
        tieneUsosLimitados: !!p.tieneUsosLimitados,
        usosMaximos: usosFinales,
        usosRestantes: usosFinales,
        recuperacion: (escalados.recuperacion || p.recuperacion || "ninguno") as RecuperacionRasgo,
        formulaDados,
        escaladoFormulaDados: p.escaladoFormulaDados,
        escaladoUsos: p.escaladoUsos ? { ...p.escaladoUsos, minimo: p.escaladoUsos.minimo ?? 1 } : undefined,
        escaladoRecuperacion: p.escaladoRecuperacion,
        sincronizarEfectosConFormula: p.sincronizarEfectosConFormula,
        personalizado: false,
        activo: p.esActivable ? false : true,
        esActivable: p.esActivable,
        autoDesactivar: p.autoDesactivar,
        ligadoA: p.ligadoA,
        gastarDePadre: p.gastarDePadre,
        heredarDadosPadre: p.heredarDadosPadre,
        condicionAlActivar: p.condicionAlActivar,
        duracionEfectoAlActivar: p.duracionEfectoAlActivar,
        conjurosOtorgados: p.conjurosOtorgados ? [...p.conjurosOtorgados] : [],
        categoriaMecanica: p.categoriaMecanica,
        formulaEscalado: p.formulaEscalado,
        efectos: escalados.efectos,
        selectores: escalados.selectores,
        tablaProgresion: p.tablaProgresion,
        notas: ""
      };
    });

  return [...rasgosBaseProcesados, ...rasgosSubespecieProcesados];
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

  // 4. Conjuros innatos otorgados (trucos y hechizos base de especie como Portador de luz, Linaje élfico, etc.)
  const trucosNuevos = new Set(personaje.trucosConocidosIds || []);
  const conjurosSiemprePreparados = new Set(personaje.conjurosSiemprePreparadosIds || []);

  if (opciones.sincronizarHechizosInnatos !== false) {
    // 4.1. Recopilar todos los conjuros/trucos innatos conocidos de cualquier especie del catálogo
    const todosHechizosEspecies = new Set<string>();
    for (const esp of CATALOGO_ESPECIES_DND55) {
      for (const ci of esp.conjurosInnatos || []) {
        todosHechizosEspecies.add(ci.hechizoId);
      }
      for (const sub of esp.subespecies || []) {
        for (const ci of sub.conjurosInnatos || []) {
          todosHechizosEspecies.add(ci.hechizoId);
        }
      }
    }

    // 4.2. Determinar conjuros que el personaje conserva por rasgos activos no pertenecientes a especie o subespecie
    const hechizosConservadosPorRasgos = new Set<string>();
    for (const r of personaje.rasgos || []) {
      if (r.origen !== "especie" && r.origen !== "subespecie" && r.activo !== false) {
        for (const cOtorgado of r.conjurosOtorgados || []) {
          hechizosConservadosPorRasgos.add(cOtorgado);
        }
      }
    }

    // 4.3. Purgar conjuros innatos de especies previas para evitar acumulación al conmutar de especie o linaje
    for (const hId of todosHechizosEspecies) {
      if (!hechizosConservadosPorRasgos.has(hId)) {
        trucosNuevos.delete(hId);
        conjurosSiemprePreparados.delete(hId);
      }
    }

    // 4.4. Inyectar los conjuros innatos de la nueva especie y subespecie según el nivel del personaje
    const listaInnatos: ConjuroInnatoEspecie[] = [
      ...(especie.conjurosInnatos || []),
      ...(subespecie?.conjurosInnatos || [])
    ];

    // Detectar si hay un truco personalizado seleccionado en los rasgos del personaje para Alto elfo
    let trucoAltoElfoElegido: string | null = null;
    for (const r of personaje.rasgos || []) {
      const selTruco = (r.selectores || []).find((s) => s.id === "selector_truco_alto_elfo");
      if (selTruco && selTruco.valorActual?.[0]) {
        trucoAltoElfoElegido = selTruco.valorActual[0];
        break;
      }
    }

    for (const conjuro of listaInnatos) {
      const cumpleNivel = !conjuro.nivelRequerido || nivelPj >= conjuro.nivelRequerido;
      if (cumpleNivel) {
        if (conjuro.esTruco) {
          if (conjuro.hechizoId === "prestidigitacion" && subespecie?.id === "alto_elfo" && trucoAltoElfoElegido) {
            trucosNuevos.add(trucoAltoElfoElegido);
          } else {
            trucosNuevos.add(conjuro.hechizoId);
          }
        } else {
          conjurosSiemprePreparados.add(conjuro.hechizoId);
        }
      }
    }
  }

  // 5. Rasgos de especie: purgar rasgos previos de especie y subespecie, y añadir los nuevos
  let rasgosFinales = [...(personaje.rasgos || [])];
  if (opciones.sincronizarRasgos !== false) {
    const rasgosEspecieNuevos = construirRasgosEspecie(
      especie,
      subespecie,
      nivelPj,
      bonoCompetencia,
      tamanoFinal
    ).filter((r) => !r.nivelRequerido || r.nivelRequerido <= nivelPj);

    // Preservar usos restantes y selecciones previas de rasgos de subespecie/especie
    const mapaRasgosPrevios = new Map((personaje.rasgos || []).map((r) => [r.id, r]));
    const rasgosEspecieFusionados = rasgosEspecieNuevos.map((rNuevo) => {
      const rPrev = mapaRasgosPrevios.get(rNuevo.id);
      if (!rPrev) return rNuevo;

      return {
        ...rNuevo,
        usosRestantes: typeof rPrev.usosRestantes === "number" ? rPrev.usosRestantes : rNuevo.usosRestantes,
        selectores: rNuevo.selectores?.map((sNuevo) => {
          const sPrev = rPrev.selectores?.find((sp) => sp.id === sNuevo.id);
          return sPrev ? { ...sNuevo, valorActual: sPrev.valorActual } : sNuevo;
        })
      };
    });

    // Preservar rasgos de clase, dotes, trasfondo y personalizados
    const rasgosConservados = rasgosFinales.filter((r) => r.origen !== "especie" && r.origen !== "subespecie");
    rasgosFinales = [...rasgosConservados, ...rasgosEspecieFusionados];
  }

  const pjResultado: PersonajeJugador = {
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

  const bonoPrevioHP = calcularBonoHPMaximoRasgos(personaje);
  const bonoNuevoHP = calcularBonoHPMaximoRasgos(pjResultado);
  const deltaHP = bonoNuevoHP - bonoPrevioHP;

  if (deltaHP !== 0) {
    const baseActual = pjResultado.hpMaximoBase || pjResultado.hpMaximo || 10;
    const nuevoBase = Math.max(1, baseActual + deltaHP);
    const nuevoMaximo = Math.max(1, (pjResultado.hpMaximo || 1) + deltaHP);
    const nuevoActual = Math.max(0, (pjResultado.hpActual ?? nuevoMaximo) + deltaHP);
    pjResultado.hpMaximoBase = nuevoBase;
    pjResultado.hpMaximo = nuevoMaximo;
    pjResultado.hpActual = Math.min(nuevoActual, nuevoMaximo);
  }

  return pjResultado;
}

/**
 * Determina de forma tolerante si un nombre de rasgo corresponde a "Versátil" de Humano.
 */
export function esRasgoVersatil(nombre: string, origen?: string): boolean {
  if (!nombre) return false;
  if (origen && origen !== "especie") return false;
  const norm = normalizarTextoEspecie(nombre);
  if (norm.includes("embaucador")) return false;
  return norm === "versatil" || norm === "humano: versatil" || (norm.includes("versatil") && norm.includes("humano"));
}

/**
 * Construye la dote de origen asociada al rasgo de especie "Versátil" del Humano
 * para ser incorporada y renderizada en la sección de dotes de la ficha.
 */
export function construirDoteDeVersatil(
  rasgoVersatil: RasgoPersonaje,
  idDoteSeleccionada: string = "dote_alerta"
): RasgoPersonaje {
  const normId = normalizarTextoEspecie(idDoteSeleccionada);
  const plantillaDote =
    DOTES_ORIGEN_DND55.find(
      (d) => d.id === idDoteSeleccionada || normalizarTextoEspecie(d.id) === normId || normalizarTextoEspecie(d.nombre) === normId
    ) || DOTES_ORIGEN_DND55.find((d) => d.id === "dote_alerta")!;

  return {
    id: `dote_origen_${normalizarTextoEspecie(rasgoVersatil.id)}`,
    nombre: plantillaDote.nombre,
    descripcion: plantillaDote.descripcion,
    origen: "dote",
    fuente: rasgoVersatil.fuente || "Especie (Humano: Versátil)",
    tipoAccion: plantillaDote.tipoAccion || "pasivo",
    nivelRequerido: 1,
    tieneUsosLimitados: Boolean(plantillaDote.tieneUsosLimitados),
    usosMaximos: plantillaDote.usosMaximos,
    usosRestantes: plantillaDote.usosMaximos,
    recuperacion: plantillaDote.recuperacion || "ninguno",
    formulaDados: plantillaDote.formulaDados,
    categoriaMecanica: plantillaDote.categoriaMecanica || "pasivo_permanente",
    efectos: plantillaDote.efectos ? JSON.parse(JSON.stringify(plantillaDote.efectos)) : [],
    selectores: plantillaDote.selectores ? JSON.parse(JSON.stringify(plantillaDote.selectores)) : [],
    activo: true,
    personalizado: false,
    ligadoA: rasgoVersatil.id,
    notas: `Dote de Origen otorgada por el rasgo Versátil (${rasgoVersatil.fuente || "Humano"}).`
  };
}
